#!/usr/bin/env bash
#
# state-create-bucket.sh - creates the account-wide S3 bucket that stores the
# OpenTofu state, in the account-regional namespace, and configures it.
#
# The bucket is named "tfstate-<account-id>-<region>-an", matching `state_bucket`
# in live/root.hcl. It is created once per account and shared by every project.
#
# Usage: state-create-bucket.sh <aws-profile> [region]
#
# If the bucket already exists it is not created nor modified.

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 <aws-profile> [region]" >&2
  exit 1
fi

profile=$1
region=${2:-eu-south-1}

# Days after which noncurrent state versions are deleted, provided more than
# NONCURRENT_VERSIONS_TO_KEEP newer noncurrent versions exist.
NONCURRENT_EXPIRATION_DAYS=90
NONCURRENT_VERSIONS_TO_KEEP=5

aws_cli() {
  aws --profile "$profile" --region "$region" "$@"
}

account_id=$(aws_cli sts get-caller-identity --query Account --output text)
bucket="tfstate-${account_id}-${region}-an"

echo "Account: ${account_id}"
echo "Bucket:  ${bucket}"

# The bucket is shared by every project in the account: if it already exists
# it is left untouched, so its configuration is never overwritten.
if head_error=$(aws_cli s3api head-bucket --bucket "$bucket" 2>&1); then
  echo "Bucket already exists, nothing to do."
  exit 0
elif [[ "$head_error" != *"Not Found"* && "$head_error" != *"404"* ]]; then
  echo "Cannot check whether the bucket exists: ${head_error}" >&2
  exit 1
fi

echo "Creating bucket."
create_args=(--bucket "$bucket" --bucket-namespace account-regional)
# us-east-1 is the only region that rejects a LocationConstraint
if [[ "$region" != "us-east-1" ]]; then
  create_args+=(--create-bucket-configuration "LocationConstraint=${region}")
fi
aws_cli s3api create-bucket "${create_args[@]}" >/dev/null

echo "Blocking public access."
aws_cli s3api put-public-access-block --bucket "$bucket" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Enabling versioning."
aws_cli s3api put-bucket-versioning --bucket "$bucket" \
  --versioning-configuration Status=Enabled

echo "Enabling server-side encryption (SSE-S3)."
aws_cli s3api put-bucket-encryption --bucket "$bucket" \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"},
        "BucketKeyEnabled": true
      }
    ]
  }'

echo "Denying non-TLS requests."
aws_cli s3api put-bucket-policy --bucket "$bucket" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {
      \"Sid\": \"DenyInsecureTransport\",
      \"Effect\": \"Deny\",
      \"Principal\": \"*\",
      \"Action\": \"s3:*\",
      \"Resource\": [
        \"arn:aws:s3:::${bucket}\",
        \"arn:aws:s3:::${bucket}/*\"
      ],
      \"Condition\": {\"Bool\": {\"aws:SecureTransport\": \"false\"}}
    }
  ]
}"

echo "Configuring lifecycle."
aws_cli s3api put-bucket-lifecycle-configuration --bucket "$bucket" \
  --lifecycle-configuration "{
    \"Rules\": [
      {
        \"ID\": \"expire-noncurrent-state-versions\",
        \"Status\": \"Enabled\",
        \"Filter\": {},
        \"NoncurrentVersionExpiration\": {
          \"NoncurrentDays\": ${NONCURRENT_EXPIRATION_DAYS},
          \"NewerNoncurrentVersions\": ${NONCURRENT_VERSIONS_TO_KEEP}
        },
        \"AbortIncompleteMultipartUpload\": {\"DaysAfterInitiation\": 7}
      }
    ]
  }"

echo "Tagging."
aws_cli s3api put-bucket-tagging --bucket "$bucket" \
  --tagging 'TagSet=[{Key=Purpose,Value=tofu-state},{Key=ManagedBy,Value=script}]'

echo "Done."
