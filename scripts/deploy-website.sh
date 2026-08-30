#!/usr/bin/env bash
# Build website/ and deploy it to the S3 bucket + CloudFront distribution of
# the given environment. Bucket name and distribution ID are read from the
# Terraform state of infrastructure/live (website_hosting module), never
# guessed or hardcoded.
#
# Usage: ./scripts/deploy-website.sh <sandbox|production>
set -euo pipefail

ENVIRONMENT="${1:-}"
if [[ "$ENVIRONMENT" != "sandbox" && "$ENVIRONMENT" != "production" ]]; then
  echo "Usage: $0 <sandbox|production>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBSITE_DIR="$ROOT_DIR/website"
LIVE_DIR="$ROOT_DIR/infrastructure/live"
ENV_DIR="$ROOT_DIR/infrastructure/environments/$ENVIRONMENT"

if [[ ! -f "$ENV_DIR/backend.hcl" ]]; then
  echo "✗ $ENV_DIR/backend.hcl not found: environment '$ENVIRONMENT' does not exist yet." >&2
  exit 1
fi

echo "==> [$ENVIRONMENT] Installing dependencies"
(cd "$WEBSITE_DIR" && npm ci)

echo "==> [$ENVIRONMENT] Running unit tests"
(cd "$WEBSITE_DIR" && npm run test)

echo "==> [$ENVIRONMENT] Building production bundle"
(cd "$WEBSITE_DIR" && npm run build)

echo "==> [$ENVIRONMENT] Reading S3 bucket and CloudFront distribution from Terraform state"
(cd "$LIVE_DIR" && terraform init -backend-config="../environments/$ENVIRONMENT/backend.hcl" -reconfigure >/dev/null)

BUCKET=$(cd "$LIVE_DIR" && terraform state show module.website_hosting.aws_s3_bucket.this 2>/dev/null | awk -F'"' '/^ *id *= /{print $2; exit}')
DISTRIBUTION_ID=$(cd "$LIVE_DIR" && terraform state show module.website_hosting.aws_cloudfront_distribution.this 2>/dev/null | awk -F'"' '/^ *id *= /{print $2; exit}')

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "✗ Could not read the S3 bucket / CloudFront distribution from the '$ENVIRONMENT' Terraform state." >&2
  echo "  Has 'make apply ENV=$ENVIRONMENT' been run for the website_hosting module?" >&2
  exit 1
fi

echo "==> [$ENVIRONMENT] Syncing dist/ to s3://$BUCKET"
# Hashed assets (JS/CSS/fonts): cached forever, safe because the filename
# changes on every content change. index.html: never cached, so a deploy is
# visible immediately without waiting on a client's stale cache.
aws s3 sync "$WEBSITE_DIR/dist/" "s3://$BUCKET/" --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"
aws s3 cp "$WEBSITE_DIR/dist/index.html" "s3://$BUCKET/index.html" \
  --cache-control "public, max-age=0, must-revalidate"

echo "==> [$ENVIRONMENT] Invalidating CloudFront distribution $DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)

COMMIT="$(git -C "$ROOT_DIR" rev-parse --short HEAD)"
DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOG_FILE="$ENV_DIR/deploy-log.md"
if [[ ! -f "$LOG_FILE" ]]; then
  printf '# Deploy log: %s\n\n| Data (UTC) | Commit | Bucket | Distribuzione CloudFront | Invalidation |\n|---|---|---|---|---|\n' "$ENVIRONMENT" >"$LOG_FILE"
fi
printf '| %s | %s | %s | %s | %s |\n' "$DEPLOYED_AT" "$COMMIT" "$BUCKET" "$DISTRIBUTION_ID" "$INVALIDATION_ID" >>"$LOG_FILE"

echo "==> Done. Deployed commit $COMMIT to $ENVIRONMENT at $DEPLOYED_AT (invalidation $INVALIDATION_ID)."
echo "    Logged to $LOG_FILE"
