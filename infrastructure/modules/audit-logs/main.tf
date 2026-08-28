locals {
  bucket_name = "${var.name_prefix}-audit-logs-${var.aws_account_id}-${var.aws_region}-an"
}

resource "aws_s3_bucket" "this" {
  bucket           = local.bucket_name
  bucket_namespace = "account-regional"
  force_destroy    = var.bucket_force_destroy

  tags = {
    Name = local.bucket_name
  }
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "audit-logs-lifecycle"
    status = "Enabled"

    transition {
      days          = var.log_transition_to_ia_days
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = var.log_transition_to_glacier_days
      storage_class = "GLACIER"
    }

    dynamic "expiration" {
      for_each = var.log_retention_days != null ? [1] : []
      content {
        days = var.log_retention_days
      }
    }

    noncurrent_version_transition {
      noncurrent_days = var.log_transition_to_ia_days
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = var.log_noncurrent_expiration_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "bucket" {
  # Bucket baseline, independent of producers: denies unencrypted traffic.
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Producer statements (cloudtrail today, config in the future), merged here.
  source_policy_documents = var.additional_policy_documents
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.bucket.json
}