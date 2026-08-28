output "bucket_policy" {
  description = "Policy to attach to the S3 bucket used by cloutrail."
  value       = data.aws_iam_policy_document.bucket_policy.json
}