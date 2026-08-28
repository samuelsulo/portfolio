output "bucket_arn" {
  description = "ARN of the S3 bucket used for the audit logs."
  value       = aws_s3_bucket.this.arn
}

output "bucket_name" {
  description = "Name of the S3 bucket used for the audit logs."
  value       = aws_s3_bucket.this.id
}

output "bucket_policy_id" {
  description = "ID of the S3 bucket policy resource (not the bucket itself). Exposed so producer modules (e.g. cloudtrail) can force their own resources to wait until the policy is actually applied, not just until the bucket exists."
  value       = aws_s3_bucket_policy.this.id
}