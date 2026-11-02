#!/usr/bin/env bash
# Build application/ and deploy it to the production S3 bucket + CloudFront
# distribution. Bucket name, distribution ID and the contact API's base URL
# are read from the outputs of the website stack under
# infrastructure/live/production/eu-south-1/website (via
# 'terragrunt stack output'), never guessed or hardcoded.
#
# Version tracking: deploys the commit pointed at by an explicit
# 'application/vX.Y.Z' tag, passed with --version (not necessarily the
# currently checked out commit). The version is injected into the build as
# VITE_APP_VERSION and, once deployed, recorded as the plain-text content
# of a single '_version' object in the bucket, so the currently live
# version can always be read back with:
#   aws s3 cp s3://<bucket>/_version -
# This is a snapshot of what is live now, not a deploy history: that
# history lives in GitHub Releases instead.
#
# AWS credentials: uses the AWS_PROFILE already set in the terminal, or the
# aws_profile of infrastructure/live/production/account.hcl otherwise.
#
# Usage:
#   ./scripts/deploy.sh --version application/vX.Y.Z
set -euo pipefail

TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      TAG="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 --version <application/vX.Y.Z>" >&2
  echo "  Deploys must name the exact tag to release, e.g.:" >&2
  echo "    $0 --version application/v1.0.1" >&2
  exit 1
fi
if [[ ! "$TAG" =~ ^application/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "'$TAG' does not match the expected 'application/vX.Y.Z' format." >&2
  exit 1
fi

for bin in mise aws node npm git; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "'$bin' is required and was not found on PATH." >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION_MARKER_KEY="_version"

# Strip the "application/v" prefix, not just "application/": the site's
# own footer.version i18n key already renders "v{version}" (company
# standard, see SiteVersion.vue), so VITE_APP_VERSION must be the bare
# "X.Y.Z" or the footer would show a doubled "vv1.0.0".
VERSION="${TAG#application/v}"

STACK_DIR="$ROOT_DIR/infrastructure/live/production/eu-south-1/website"

# The AWS CLI profile of the production account, the same one Terragrunt
# uses (see infrastructure/live/production/account.hcl).
if [[ -z "${AWS_PROFILE:-}" ]]; then
  AWS_PROFILE=$(sed -n 's/^ *aws_profile *= *"\(.*\)"/\1/p' "$ROOT_DIR/infrastructure/live/production/account.hcl")
  export AWS_PROFILE
fi

echo "==> Reading infrastructure endpoints from the website stack outputs (profile $AWS_PROFILE)"
(cd "$STACK_DIR" && mise exec -- terragrunt stack generate >/dev/null)
OUTPUTS_JSON=$(cd "$STACK_DIR" && mise exec -- terragrunt stack output -json 2>/dev/null)

# Reads a string output of a unit of the stack: output_value <unit> <output>
output_value() {
  node -e '
    const outputs = JSON.parse(require("fs").readFileSync(0, "utf8"))
    const value = (outputs[process.argv[1]] ?? {})[process.argv[2]]
    if (typeof value === "string") process.stdout.write(value)
  ' "$1" "$2" <<<"$OUTPUTS_JSON"
}

BUCKET=$(output_value website_hosting s3_bucket_id)
DISTRIBUTION_ID=$(output_value website_hosting cloudfront_distribution_id)
CONTACT_API_DOMAIN=$(output_value contact_api custom_domain_name)

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "Could not read the S3 bucket / CloudFront distribution from the website stack outputs." >&2
  echo "  Has 'terragrunt stack run apply' been run in infrastructure/live/production/eu-south-1/website?" >&2
  exit 1
fi

CONTACT_API_URL=""
if [[ -n "$CONTACT_API_DOMAIN" ]]; then
  CONTACT_API_URL="https://$CONTACT_API_DOMAIN"
  echo "==> Contact API endpoint: $CONTACT_API_URL"
else
  echo "Warning: the contact_api output was not found: the contact form will ship disabled." >&2
fi

echo "==> Resolving tag $TAG"
if ! git -C "$ROOT_DIR" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag '$TAG' not found locally." >&2
  echo "  Fetch it first, e.g.: git fetch origin tag $TAG" >&2
  exit 1
fi
DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-list -n1 "$TAG")

BUILD_DIR="$(mktemp -d)"
echo "==> Checking out tag $TAG (commit ${DEPLOY_COMMIT:0:7}) into a clean worktree"
git -C "$ROOT_DIR" worktree add --detach --quiet "$BUILD_DIR" "$DEPLOY_COMMIT"
trap 'git -C "$ROOT_DIR" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || true' EXIT
APPLICATION_DIR="$BUILD_DIR/application"

echo "==> Installing dependencies"
(cd "$APPLICATION_DIR" && npm ci)

echo "==> Running unit tests"
(cd "$APPLICATION_DIR" && npm run test)

echo "==> Building production bundle (version $VERSION)"
(cd "$APPLICATION_DIR" && VITE_APP_VERSION="$VERSION" VITE_CONTACT_API_URL="$CONTACT_API_URL" npm run build)

echo "==> Syncing dist/ to s3://$BUCKET"
# Hashed assets (JS/CSS/fonts): cached forever, safe because the filename
# changes on every content change. index.html: never cached, so a deploy
# is visible immediately without waiting on a client's stale cache. The
# version marker lives outside dist/, excluded from --delete so it is
# never pruned by it.
aws s3 sync "$APPLICATION_DIR/dist/" "s3://$BUCKET/" --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "$VERSION_MARKER_KEY"
aws s3 cp "$APPLICATION_DIR/dist/index.html" "s3://$BUCKET/index.html" \
  --cache-control "public, max-age=0, must-revalidate"

echo "==> Invalidating CloudFront distribution $DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)

echo "==> Recording deployed version in $VERSION_MARKER_KEY"
printf '%s' "$VERSION" | aws s3 cp - "s3://$BUCKET/$VERSION_MARKER_KEY" --content-type text/plain

DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Done. Deployed version $VERSION (commit ${DEPLOY_COMMIT:0:7}) to production at $DEPLOYED_AT (invalidation $INVALIDATION_ID)."
