variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "aws_account_id" {
  description = "(Required) ID of the AWS account where Terraform will apply the configuration."
  type        = string
}

variable "aws_region" {
  description = "(Required) AWS region where the trail is created, used to build its ARN ahead of creation (see main.tf for why)."
  type        = string
}

variable "is_multi_region" {
  description = "(Optional) Whether the CloudTrail trail captures events from all AWS regions. When false, only events in the provider's region are recorded."
  type        = bool
  default     = true
}

variable "bucket_arn" {
  description = "(Required) ARN of the S3 bucket where cloudtrail will save the events."
  type        = string
}

variable "bucket_name" {
  description = "(Required) Name of the S3 bucket where cloudtrail will save the events."
  type        = string
}

variable "key_prefix" {
  description = "(Required) Key prefix of the S3 bucket where cloudtrail will save the events."
  type        = string
}

variable "bucket_policy_id" {
  description = "(Required) ID of the S3 bucket policy resource that grants CloudTrail access to bucket_name (e.g. module.audit_logs.bucket_policy_id). Not used by any CloudTrail argument: referencing it forces Terraform to wait until the policy is actually applied before creating the trail, since CreateTrail validates the bucket policy up front and otherwise fails with InsufficientS3BucketPolicyException."
  type        = string
}