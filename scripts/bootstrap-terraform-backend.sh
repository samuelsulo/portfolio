#!/usr/bin/env bash
#
# Creates (once) the S3 bucket for the Terraform state shared by all
# Terraform projects of ONE AWS account (CLAUDE.md §5: the Terraform state
# backend must be configured separately for each project and never left
# local). One bucket per account: each project writes under its own key
# (see <project>/terraform.tfstate in backend.hcl).
#
# State locking uses the native S3 lockfile (use_lockfile = true in
# backend.hcl, requires Terraform >= 1.10): no DynamoDB table to create.
#
# Fixed region: eu-south-1 (Milan). Bucket name in the S3 account regional
# namespace (suffix <account-id>-<region>-an): the name is permanently
# reserved for our account and can never be re-created by a third party,
# unlike the global namespace. create-bucket explicitly requires
# --bucket-namespace account-regional (header x-amz-bucket-namespace),
# otherwise the API responds with MissingNamespaceHeader. See:
# https://docs.aws.amazon.com/AmazonS3/latest/userguide/gpbucketnamespaces.html
#   terraform-state-<account-id>-eu-south-1-an
#
# Run with the target account's credentials already active in the shell:
#  - sandbox account (mine)     -> normal developer credentials
#  - client/production account  -> cross-account role
# The account it operates on is the one of the current credentials (aws sts
# get-caller-identity): no ID to pass by hand, zero risk of a typo on the
# target account.
#
# Usage:
#   ./scripts/bootstrap-terraform-backend.sh
#
# The script is idempotent: if the bucket already exists, it only verifies/
# realigns the configuration (versioning, encryption, public access block,
# ownership, TLS-only policy, lifecycle, tags) without failing.

set -euo pipefail

REGION="eu-south-1"
REGIONAL_NAMESPACE="an"
PROJECT_TAG="terraform-state"
NONCURRENT_VERSION_EXPIRATION_DAYS="${NONCURRENT_VERSION_EXPIRATION_DAYS:-90}"

echo "==> Checking current AWS CLI identity"
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

BUCKET_NAME="terraform-state-${ACCOUNT_ID}-${REGION}-${REGIONAL_NAMESPACE}"

echo "==> Target bucket: s3://${BUCKET_NAME} (account ${ACCOUNT_ID}, region ${REGION})"

if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
  echo "  ⤳ Bucket already exists, realigning the configuration (idempotent)."
else
  echo "==> Creating bucket (account regional namespace)"
  aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --bucket-namespace account-regional \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  echo "  ✓ Bucket created"
fi

echo "==> Public access block (mandatory, the state contains sensitive data)"
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "==> Ownership controls (disables ACLs, bucket policy only)"
aws s3api put-bucket-ownership-controls \
  --bucket "$BUCKET_NAME" \
  --ownership-controls Rules='[{ObjectOwnership=BucketOwnerEnforced}]'

echo "==> Versioning (protection against corruption/accidental loss of the state)"
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled

echo "==> Default server-side encryption (AES256 + bucket key)"
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "AES256" },
      "BucketKeyEnabled": true
    }]
  }'

echo "==> Bucket policy: explicitly deny non-HTTPS traffic"
aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy "$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyInsecureTransport",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": ["arn:aws:s3:::${BUCKET_NAME}", "arn:aws:s3:::${BUCKET_NAME}/*"],
    "Condition": { "Bool": { "aws:SecureTransport": "false" } }
  }]
}
EOF
)"

echo "==> Lifecycle: delete noncurrent versions after ${NONCURRENT_VERSION_EXPIRATION_DAYS} days and incomplete multipart uploads"
aws s3api put-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME" \
  --lifecycle-configuration "{
    \"Rules\": [{
      \"ID\": \"expire-noncurrent-state-versions\",
      \"Status\": \"Enabled\",
      \"Filter\": {},
      \"NoncurrentVersionExpiration\": { \"NoncurrentDays\": ${NONCURRENT_VERSION_EXPIRATION_DAYS} },
      \"AbortIncompleteMultipartUpload\": { \"DaysAfterInitiation\": 7 }
    }]
  }"

echo "==> Tags (Project, ManagedBy)"
aws s3api put-bucket-tagging \
  --bucket "$BUCKET_NAME" \
  --tagging "{
    \"TagSet\": [
      { \"Key\": \"Project\", \"Value\": \"${PROJECT_TAG}\" },
      { \"Key\": \"ManagedBy\", \"Value\": \"bootstrap-script\" }
    ]
  }"

echo ""
echo "✓ Bucket ready: s3://${BUCKET_NAME}"
echo ""
echo "Values to use in the environment's backend.hcl (different key per project):"
echo "  bucket       = \"${BUCKET_NAME}\""
echo "  key          = \"<project>/terraform.tfstate\""
echo "  region       = \"${REGION}\""
echo "  use_lockfile = true"
echo "  encrypt      = true"
