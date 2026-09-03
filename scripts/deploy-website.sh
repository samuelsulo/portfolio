#!/usr/bin/env bash
# Build website/ and deploy it to the S3 bucket + CloudFront distribution of
# the given environment. Bucket name and distribution ID are read
# from the Terraform state of infrastructure/live, never guessed or
# hardcoded.
#
# Version tracking:
# - production: deploys the commit pointed at by an explicit 'website/vX.Y.Z'
#   tag, passed as the second argument (not necessarily the currently
#   checked out commit). The version is injected into the site itself (see
#   src/components/ui/SiteVersion.vue) and, once deployed, recorded as an
#   empty marker object in S3 (one per ever-released tag) plus a
#   '_deploy-versions/current' object whose content is the tag name, i.e.
#   the currently live release. Two things require --force as the third
#   argument to go through anyway:
#     - redeploying a tag that already has its marker (an accidental
#       repeat, or a deliberate one);
#     - deploying a tag older than the current one (a downgrade), even if
#       that older tag has never been deployed before.
# - every other environment (sandbox, ...): deploys whatever commit is
#   currently checked out, using its short SHA as the version.
#
# Usage:
#   ./scripts/deploy-website.sh sandbox
#   ./scripts/deploy-website.sh production website/vX.Y.Z [--force]
set -euo pipefail

ENVIRONMENT="${1:-}"
TAG="${2:-}"
FORCE_ARG="${3:-}"
FORCE=0

if [[ "$ENVIRONMENT" != "sandbox" && "$ENVIRONMENT" != "production" ]]; then
  echo "Usage: $0 <sandbox|production> [website/vX.Y.Z] [--force]" >&2
  exit 1
fi

if [[ "$ENVIRONMENT" == "production" ]]; then
  if [[ -z "$TAG" ]]; then
    echo "Usage: $0 production <website/vX.Y.Z> [--force]" >&2
    echo "  Production deploys must name the exact tag to release, e.g.:" >&2
    echo "    $0 production website/v1.0.1" >&2
    exit 1
  fi
  if [[ ! "$TAG" =~ ^website/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "✗ '$TAG' does not match the expected 'website/vX.Y.Z' format." >&2
    exit 1
  fi
  if [[ -n "$FORCE_ARG" ]]; then
    if [[ "$FORCE_ARG" != "--force" ]]; then
      echo "✗ Unknown argument: '$FORCE_ARG'." >&2
      exit 1
    fi
    FORCE=1
  fi
elif [[ -n "$TAG" || -n "$FORCE_ARG" ]]; then
  echo "✗ A tag / --force argument is only accepted for 'production' (got: '$ENVIRONMENT $TAG $FORCE_ARG')." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIVE_DIR="$ROOT_DIR/infrastructure/live"
ENV_DIR="$ROOT_DIR/infrastructure/environments/$ENVIRONMENT"
VERSION_MARKER_PREFIX="_deploy-versions"
CURRENT_MARKER_KEY="$VERSION_MARKER_PREFIX/current"

# True (exit 0) if version $1 is older than version $2, both bare "X.Y.Z".
version_lt() {
  [[ "$1" == "$2" ]] && return 1
  [[ "$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)" == "$1" ]]
}

if [[ ! -f "$ENV_DIR/backend.hcl" ]]; then
  echo "✗ $ENV_DIR/backend.hcl not found: environment '$ENVIRONMENT' does not exist yet." >&2
  exit 1
fi

# Strip the "website/v" prefix, not just "website/": the site's own
# footer.version i18n key already renders "v{version}" (company standard,
# see the SiteVersion component), so VITE_APP_VERSION must be the bare
# "X.Y.Z" or the footer would show a doubled "vv1.0.0". This is plain
# string manipulation on the argument, no git call needed yet: cheap
# enough to do before anything else so the already-deployed check below
# runs as early as possible.
if [[ "$ENVIRONMENT" == "production" ]]; then
  VERSION="${TAG#website/v}"
else
  VERSION=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
fi

echo "==> [$ENVIRONMENT] Reading infrastructure endpoints from Terraform state"
(cd "$LIVE_DIR" && terraform init -backend-config="../environments/$ENVIRONMENT/backend.hcl" -reconfigure >/dev/null)

BUCKET=$(cd "$LIVE_DIR" && terraform state show module.website_hosting.aws_s3_bucket.this 2>/dev/null | awk -F'"' '/^ *id *= /{print $2; exit}')
DISTRIBUTION_ID=$(cd "$LIVE_DIR" && terraform state show module.website_hosting.aws_cloudfront_distribution.this 2>/dev/null | awk -F'"' '/^ *id *= /{print $2; exit}')

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  echo "✗ Could not read the S3 bucket / CloudFront distribution from the '$ENVIRONMENT' Terraform state." >&2
  echo "  Has 'make apply ENV=$ENVIRONMENT' been run for the website_hosting module?" >&2
  exit 1
fi

# Bail out here, before resolving the tag's commit or doing any build work,
# if this tag was already released or is older than what's currently live:
# the Terraform state read above is the only thing that has to happen
# first, since it is where the bucket to check comes from.
if [[ "$ENVIRONMENT" == "production" ]]; then
  ALREADY_DEPLOYED=0
  if aws s3api head-object --bucket "$BUCKET" --key "$VERSION_MARKER_PREFIX/$TAG" >/dev/null 2>&1; then
    ALREADY_DEPLOYED=1
  fi

  CURRENT_TAG=$(aws s3 cp "s3://$BUCKET/$CURRENT_MARKER_KEY" - 2>/dev/null) || CURRENT_TAG=""
  IS_DOWNGRADE=0
  if [[ -n "$CURRENT_TAG" && "$CURRENT_TAG" != "$TAG" && "$CURRENT_TAG" =~ ^website/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    CURRENT_VERSION="${CURRENT_TAG#website/v}"
    version_lt "$VERSION" "$CURRENT_VERSION" && IS_DOWNGRADE=1
  fi

  if [[ "$FORCE" -eq 1 ]]; then
    echo "==> [$ENVIRONMENT] --force: skipping the already-deployed / downgrade checks for $TAG"
  elif [[ "$ALREADY_DEPLOYED" -eq 1 ]]; then
    echo "==> [$ENVIRONMENT] Tag $TAG (version $VERSION) is already deployed."
    echo "    Nothing to do: pass a new 'website/vX.Y.Z' tag to release again, or"
    echo "    re-run with --force to redeploy it anyway (e.g. a rollback)."
    exit 0
  elif [[ "$IS_DOWNGRADE" -eq 1 ]]; then
    echo "✗ [$ENVIRONMENT] $TAG (version $VERSION) is older than the currently deployed $CURRENT_TAG (version $CURRENT_VERSION)." >&2
    echo "  Re-run with --force to deploy it anyway (e.g. a deliberate rollback)." >&2
    exit 1
  fi
fi

if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "==> [$ENVIRONMENT] Resolving tag $TAG"
  if ! git -C "$ROOT_DIR" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    echo "✗ Tag '$TAG' not found locally." >&2
    echo "  Fetch it first, e.g.: git fetch origin tag $TAG" >&2
    exit 1
  fi
  DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-list -n1 "$TAG")
else
  DEPLOY_COMMIT=$(git -C "$ROOT_DIR" rev-parse HEAD)
fi

# The contact_api module is optional: an environment without it yet still
# builds and deploys, just with the contact form shipping disabled (see
# ContactApiNotConfiguredError in contactService.ts).
CONTACT_API_DOMAIN=$(cd "$LIVE_DIR" && terraform state show module.contact_api.aws_api_gateway_domain_name.this 2>/dev/null | awk -F'"' '/^ *domain_name *= /{print $2; exit}')

if [[ -n "$CONTACT_API_DOMAIN" ]]; then
  export VITE_CONTACT_API_URL="https://$CONTACT_API_DOMAIN"
  echo "==> [$ENVIRONMENT] Contact API endpoint: $VITE_CONTACT_API_URL"
else
  echo "⚠ [$ENVIRONMENT] contact_api module not found in Terraform state: the contact form will ship disabled." >&2
fi

BUILD_DIR="$ROOT_DIR"
if [[ "$ENVIRONMENT" == "production" ]]; then
  BUILD_DIR="$(mktemp -d)"
  echo "==> [$ENVIRONMENT] Checking out tag $TAG (commit ${DEPLOY_COMMIT:0:7}) into a clean worktree"
  git -C "$ROOT_DIR" worktree add --detach --quiet "$BUILD_DIR" "$DEPLOY_COMMIT"
  trap 'git -C "$ROOT_DIR" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || true' EXIT
fi
WEBSITE_DIR="$BUILD_DIR/website"

echo "==> [$ENVIRONMENT] Installing dependencies"
(cd "$WEBSITE_DIR" && npm ci)

echo "==> [$ENVIRONMENT] Running unit tests"
(cd "$WEBSITE_DIR" && npm run test)

echo "==> [$ENVIRONMENT] Building production bundle (version $VERSION)"
(cd "$WEBSITE_DIR" && VITE_APP_VERSION="$VERSION" npm run build)

echo "==> [$ENVIRONMENT] Syncing dist/ to s3://$BUCKET"
# Hashed assets (JS/CSS/fonts): cached forever, safe because the filename
# changes on every content change. index.html: never cached, so a deploy is
# visible immediately without waiting on a client's stale cache. Version
# markers live under their own prefix, outside dist/: excluded from the
# --delete sync so past releases are never pruned by it.
aws s3 sync "$WEBSITE_DIR/dist/" "s3://$BUCKET/" --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "$VERSION_MARKER_PREFIX/*"
aws s3 cp "$WEBSITE_DIR/dist/index.html" "s3://$BUCKET/index.html" \
  --cache-control "public, max-age=0, must-revalidate"

echo "==> [$ENVIRONMENT] Invalidating CloudFront distribution $DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)

if [[ "$ENVIRONMENT" == "production" ]]; then
  echo "==> [$ENVIRONMENT] Recording version marker $VERSION_MARKER_PREFIX/$TAG"
  aws s3api put-object --bucket "$BUCKET" --key "$VERSION_MARKER_PREFIX/$TAG" >/dev/null
  echo "==> [$ENVIRONMENT] Updating $CURRENT_MARKER_KEY to $TAG"
  CURRENT_MARKER_FILE="$(mktemp)"
  printf '%s' "$TAG" >"$CURRENT_MARKER_FILE"
  aws s3api put-object --bucket "$BUCKET" --key "$CURRENT_MARKER_KEY" --body "$CURRENT_MARKER_FILE" >/dev/null
  rm -f "$CURRENT_MARKER_FILE"
fi

DEPLOYED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> Done. Deployed version $VERSION (commit ${DEPLOY_COMMIT:0:7}) to $ENVIRONMENT at $DEPLOYED_AT (invalidation $INVALIDATION_ID)."
