locals {
  cloudtrail_name = "${var.name_prefix}-cloudtrail"

  # ARN computed by hand (not aws_cloudtrail.this.arn): CloudTrail validates
  # the target bucket's policy *during* the CreateTrail call, so the policy
  # must already exist with the correct ARN BEFORE the trail is created. If
  # this statement referenced aws_cloudtrail.this.arn, Terraform would infer
  # a dependency on the resource and try to create the trail before the
  # policy, always resulting in "InsufficientS3BucketPolicyException" because
  # at CreateTrail time the bucket policy wouldn't contain the right ARN yet.
  # A trail's ARN format is deterministic (region/account/name), so we can
  # build it here without depending on the resource.
  cloudtrail_arn = "arn:aws:cloudtrail:${var.aws_region}:${var.aws_account_id}:trail/${local.cloudtrail_name}"
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [var.bucket_arn]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.cloudtrail_arn]
    }
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${var.bucket_arn}/${var.key_prefix}/AWSLogs/${var.aws_account_id}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.cloudtrail_arn]
    }
  }
}

resource "aws_cloudtrail" "this" {
  name           = local.cloudtrail_name
  s3_bucket_name = var.bucket_name
  s3_key_prefix  = var.key_prefix

  is_multi_region_trail         = var.is_multi_region
  include_global_service_events = true
  enable_log_file_validation    = true

  tags = {
    Name = local.cloudtrail_name
  }

  lifecycle {
    precondition {
      # The value itself is unused: referencing var.bucket_policy_id creates
      # an implicit dependency on aws_s3_bucket_policy.this (inside
      # module.audit_logs), which bucket_name/bucket_arn alone do NOT (they
      # point at the bucket, not the policy attached to it). Without this,
      # Terraform can create the trail before the policy is applied, and
      # CreateTrail fails with InsufficientS3BucketPolicyException because it
      # validates the policy at creation time.
      condition     = var.bucket_policy_id != ""
      error_message = "bucket_policy_id is empty: the S3 bucket policy must be applied before creating the trail."
    }
  }
}