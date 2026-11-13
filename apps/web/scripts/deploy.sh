#!/usr/bin/env bash
# Build apps/web/ and deploy it to the production S3 bucket + CloudFront
# distribution. Bucket name, distribution ID and the contact API's base URL
# are read from the outputs of the website stack under
# infrastructure/live/workload-prod/eu-south-1/website (via
# 'terragrunt stack output'), never guessed or hardcoded.
#
# Version tracking: deploys the commit pointed at by an explicit
# 'web/vX.Y.Z' tag (or a legacy 'application/vX.Y.Z' one, to roll back to a
# release made before the app moved to apps/web), passed with --version (not necessarily the
# currently checked out commit). The version is injected into the build as
# VITE_APP_VERSION and, once deployed, recorded as the plain-text content
# of a single '_version' object in the bucket, so the currently live
# version can always be read back with:
#   aws s3 cp s3://<bucket>/_version -
# This is a snapshot of what is live now, not a deploy history: that
# history lives in GitHub Releases instead.
#
# AWS credentials: uses the AWS_PROFILE already set in the terminal, or the
# aws_profile of infrastructure/live/workload-prod/account.hcl otherwise.
#
# Content (public/content, images, cv, documents, brand) is not deployed
# here: it has its own, release-free deploy, see deploy-content.sh. This
# script leaves those paths of the bucket untouched, so the content already
# live is not reverted to the one the tag was cut with.
#
# Usage:
#   ./scripts/deploy.sh --version web/vX.Y.Z
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
  echo "Usage: $0 --version <web/vX.Y.Z>" >&2
  echo "  Deploys must name the exact tag to release, e.g.:" >&2
  echo "    $0 --version web/v1.0.1" >&2
  exit 1
fi
if [[ ! "$TAG" =~ ^(web|application)/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "'$TAG' does not match the expected 'web/vX.Y.Z' format." >&2
  exit 1
fi

for bin in mise aws node npm git; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "'$bin' is required and was not found on PATH." >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
VERSION_MARKER_KEY="_version"

# Strip the "application/v" prefix, not just "application/": the site's
# own footer.version i18n key already renders "v{version}" (company
# standard, see SiteVersion.vue), so VITE_APP_VERSION must be the bare
# "X.Y.Z" or the footer would show a doubled "vv1.0.0".
VERSION="${TAG#*/v}"

# shellcheck source=lib/website-target.sh
source "$ROOT_DIR/apps/web/scripts/lib/website-target.sh"
resolve_website_target

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
# Tags made before the move to apps/web have the app in application/.
if [[ -d "$BUILD_DIR/apps/web" ]]; then
  APPLICATION_DIR="$BUILD_DIR/apps/web"
else
  APPLICATION_DIR="$BUILD_DIR/application"
fi

echo "==> Installing dependencies"
(cd "$APPLICATION_DIR" && npm ci)

echo "==> Running unit tests"
(cd "$APPLICATION_DIR" && npm run test)

echo "==> Building production bundle (version $VERSION)"
(cd "$APPLICATION_DIR" && VITE_APP_VERSION="$VERSION" VITE_CONTACT_API_URL="$CONTACT_API_URL" npm run build)

# The content is managed by deploy-content.sh: refuse to ship an application
# that would fetch content that is not there yet.
if ! aws s3api head-object --bucket "$BUCKET" --key content/data/site-config.json >/dev/null 2>&1; then
  echo "No content found in s3://$BUCKET/content/." >&2
  echo "  Deploy it first with ./scripts/deploy-content.sh" >&2
  exit 1
fi

echo "==> Syncing dist/ to s3://$BUCKET"
# Hashed assets (JS/CSS/fonts): cached forever, safe because the filename
# changes on every content change. index.html: never cached, so a deploy
# is visible immediately without waiting on a visitor's stale cache. The
# version marker lives outside dist/, excluded from --delete so it is
# never pruned by it.
aws s3 sync "$APPLICATION_DIR/dist/" "s3://$BUCKET/" --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "$VERSION_MARKER_KEY" \
  --exclude "_content_version" \
  --exclude "content/*" \
  --exclude "images/*" \
  --exclude "cv/*" \
  --exclude "documents/*" \
  --exclude "brand/*" \
  --exclude "theme-init.js" \
  --exclude "favicon.svg" \
  --exclude "apple-touch-icon.png" \
  --exclude "og-image.jpg"
# The files of public/ that sit at the root keep their name from release to
# release (index.html links them as they are), so they cannot be "immutable":
# cached for a day, which is also how long a changed one can take to show up.
for file in theme-init.js favicon.svg apple-touch-icon.png og-image.jpg; do
  aws s3 cp "$APPLICATION_DIR/dist/$file" "s3://$BUCKET/$file" \
    --cache-control "public, max-age=86400"
done
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
