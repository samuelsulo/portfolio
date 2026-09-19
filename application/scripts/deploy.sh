#!/usr/bin/env bash
# Build application/ and deploy it to the S3 bucket + CloudFront
# distribution of the given environment. Bucket name, distribution ID and
# the contact API's base URL are read from infrastructure/live's Terraform
# state via 'kitsu terraform output-json', never guessed or hardcoded.
#
# Version tracking:
# - production: deploys the commit pointed at by an explicit
#   'application/vX.Y.Z' tag, passed with --version (not necessarily the
#   currently checked out commit).
# - every other environment (sandbox, ...): deploys whatever commit is
#   currently checked out, using its short SHA as the version, and does
#   not accept --version.
#
# Either way, the resolved version is injected into the build as
# VITE_APP_VERSION and, once deployed, recorded as the plain-text content
# of a single '_version' object in the bucket, so the currently live
# version can always be read back with:
#   aws s3 cp s3://<bucket>/_version -
# This is a snapshot of what is live now, not a deploy history: that
# history lives in GitHub Releases instead.
#
# Usage:
#   ./scripts/deploy.sh --env sandbox
#   ./scripts/deploy.sh --env production --version application/vX.Y.Z
set -euo pipefail

ENVIRONMENT=""
TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="${2:-}"
      shift 2
      ;;
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

if [[ "$ENVIRONMENT" != "sandbox" && "$ENVIRONMENT" != "production" ]]; then
  echo "Usage: $0 --env <sandbox|production> [--version application/vX.Y.Z]" >&2
  exit 1
fi

if [[ "$ENVIRONMENT" == "production" ]]; then
  if [[ -z "$TAG" ]]; then
    echo "Usage: $0 --env production --version <application/vX.Y.Z>" >&2
    echo "  Production deploys must name the exact tag to release, e.g.:" >&2
    echo "    $0 --env production --version application/v1.0.1" >&2
    exit 1
  fi
  if [[ ! "$TAG" =~ ^application/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "'$TAG' does not match the expected 'application/vX.Y.Z' format." >&2
    exit 1
  fi
elif [[ -n "$TAG" ]]; then
  echo "--version is only accepted for 'production' (got: --env $ENVIRONMENT --version $TAG)." >&2
  exit 1
fi

for bin in kitsu aws jq npm git; do
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
if [[ "$ENVIRONMENT" == "production" ]]; then
  VERSION="${TAG#application/v}"
else
  VERSION=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
fi

echo "==> [$ENVIRONMENT] Reading infrastructure endpoints from Terraform state"
OUTPUTS_JSON=$(cd "$ROOT_DIR" && kitsu terraform output-json --env "$ENVIRONMENT")

BUCKET=$(jq -r '.s3_bucket_id.value // empty' <<<"$OUTPUTS_JSON")
DISTRIBUTION_ID=$(jq -r '.cloudfront_distribution_id.value // empty' <<<"$OUTPUTS_JSON")
CONTACT_API_URL=$(jq -r '.contact_api_url.value // empty' <<<"$OUTPUTS_JSON")

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "Could not read the S3 bucket / CloudFront distribution from the '$ENVIRONMENT' Terraform state." >&2
  echo "  Has 'kitsu terraform apply --env $ENVIRONMENT' been run for the website_hosting module?" >&2
  exit 1
fi

if [[ -n "$CONTACT_API_URL" ]]; then
  echo "==> [$ENVIRONMENT] Contact API endpoint: $CONTACT_API_URL"
else
  echo "Warning: contact_api_url not found in Terraform state: the contact form will ship disabled." >&2
fi

if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "==> [$ENVIRONMENT] Resolving tag $TAG"
  if ! git -C "$ROOT_DIR" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    echo "Tag '$TAG' not found locally." >&2
    echo "  Fetch it first, e.g.: git fetch origin tag $TAG" >&2
    exit 1
  fi
  DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-list -n1 "$TAG")
else
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    echo "Working tree has uncommitted changes: commit or stash them before deploying, so the deployed" >&2
    echo "short SHA actually identifies what got built." >&2
    exit 1
  fi
  DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-parse HEAD)
fi

BUILD_DIR="$ROOT_DIR"
if [[ "$ENVIRONMENT" == "production" ]]; then
  BUILD_DIR="$(mktemp -d)"
  echo "==> [$ENVIRONMENT] Checking out tag $TAG (commit ${DEPLOY_COMMIT:0:7}) into a clean worktree"
  git -C "$ROOT_DIR" worktree add --detach --quiet "$BUILD_DIR" "$DEPLOY_COMMIT"
  trap 'git -C "$ROOT_DIR" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || true' EXIT
fi
APPLICATION_DIR="$BUILD_DIR/application"

echo "==> [$ENVIRONMENT] Installing dependencies"
(cd "$APPLICATION_DIR" && npm ci)

echo "==> [$ENVIRONMENT] Running unit tests"
(cd "$APPLICATION_DIR" && npm run test)

echo "==> [$ENVIRONMENT] Building production bundle (version $VERSION)"
(cd "$APPLICATION_DIR" && VITE_APP_VERSION="$VERSION" VITE_CONTACT_API_URL="$CONTACT_API_URL" npm run build)

echo "==> [$ENVIRONMENT] Syncing dist/ to s3://$BUCKET"
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

echo "==> [$ENVIRONMENT] Invalidating CloudFront distribution $DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)

echo "==> [$ENVIRONMENT] Recording deployed version in $VERSION_MARKER_KEY"
printf '%s' "$VERSION" | aws s3 cp - "s3://$BUCKET/$VERSION_MARKER_KEY" --content-type text/plain

DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Done. Deployed version $VERSION (commit ${DEPLOY_COMMIT:0:7}) to $ENVIRONMENT at $DEPLOYED_AT (invalidation $INVALIDATION_ID)."
