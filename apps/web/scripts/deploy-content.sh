#!/usr/bin/env bash
# Deploy only the content of the site (texts, translations, projects, CV,
# images and documents) to the production S3 bucket, without building or
# releasing the application: the application fetches it from /content/ (see
# src/content/index.ts), at startup or when it is needed.
#
# The content is deployed from a git ref (default: origin/main), checked out
# in a clean worktree, so what goes live is always committed and reviewable.
# The commit is recorded as the plain-text content of a '_content_version'
# object in the bucket, readable with:
#   aws s3 cp s3://<bucket>/_content_version -
# Content is not versioned with tags like the application: this is a
# snapshot of what is live now, and the history is the git log.
#
# If a change to the content files needs a matching application release (the
# content schema changed, see CONTENT_SCHEMA_VERSION), release and deploy the
# application as well: deploy.sh never touches the content paths, so the two
# can go out in either order only as long as the schema stays the same.
#
# Usage:
#   ./scripts/deploy-content.sh [--ref <git-ref>]
set -euo pipefail

REF="origin/main"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

for bin in mise aws node npm git; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "'$bin' is required and was not found on PATH." >&2
    exit 1
  fi
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
# shellcheck source=lib/website-target.sh
source "$ROOT_DIR/apps/web/scripts/lib/website-target.sh"
resolve_website_target

echo "==> Resolving $REF"
if [[ "$REF" == origin/* ]]; then
  git -C "$ROOT_DIR" fetch --quiet origin "${REF#origin/}"
fi
if ! DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-parse --verify "$REF^{commit}" 2>/dev/null); then
  echo "Ref '$REF' not found." >&2
  exit 1
fi

BUILD_DIR="$(mktemp -d)"
echo "==> Checking out commit ${DEPLOY_COMMIT:0:7} into a clean worktree"
git -C "$ROOT_DIR" worktree add --detach --quiet "$BUILD_DIR" "$DEPLOY_COMMIT"
trap 'git -C "$ROOT_DIR" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || true' EXIT
PUBLIC_DIR="$BUILD_DIR/apps/web/public"

echo "==> Validating the content (translation parity, cases, schema)"
(cd "$BUILD_DIR/apps/web" && npm ci && npm run test)

# Every content file is requested by the application with its version
# (?v=<hash of its bytes>, from content/manifest.json), so it is cached for a
# year by the browser and by CloudFront: when a file changes its URL changes
# with it. Only the manifest is revalidated, on every visit.
#
# The order matters. CloudFront ignores the query string, so a version that
# became visible while an edge still held the old bytes would pin those bytes
# in browsers for a year. So: publish the files, purge CloudFront and wait for
# it, and only then publish the manifest that makes the new versions visible.
echo "==> Building the manifest of the content versions"
MANIFEST_FILE="$BUILD_DIR/content-manifest.json"
node "$BUILD_DIR/apps/web/scripts/content-manifest.mjs" "$PUBLIC_DIR" "$MANIFEST_FILE"

echo "==> Syncing the content to s3://$BUCKET"
aws s3 sync "$PUBLIC_DIR/content/" "s3://$BUCKET/content/" --delete \
  --exclude "manifest.json" \
  --cache-control "public, max-age=31536000, immutable"
for folder in images cv documents brand; do
  aws s3 sync "$PUBLIC_DIR/$folder/" "s3://$BUCKET/$folder/" --delete \
    --cache-control "public, max-age=31536000, immutable"
done

echo "==> Invalidating CloudFront distribution $DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/content/*" "/images/*" "/cv/*" "/documents/*" "/brand/*" \
  --query 'Invalidation.Id' --output text)
echo "==> Waiting for the invalidation $INVALIDATION_ID to complete (a few minutes)"
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" --id "$INVALIDATION_ID"

echo "==> Publishing the manifest: the new versions go live now"
aws s3 cp "$MANIFEST_FILE" "s3://$BUCKET/content/manifest.json" \
  --content-type apps/web/json \
  --cache-control "public, max-age=0, must-revalidate"

printf '%s' "$DEPLOY_COMMIT" | aws s3 cp - "s3://$BUCKET/_content_version" --content-type text/plain

DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Done. Deployed the content of commit ${DEPLOY_COMMIT:0:7} to production at $DEPLOYED_AT (invalidation $INVALIDATION_ID)."
