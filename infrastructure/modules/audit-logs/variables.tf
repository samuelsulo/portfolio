variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "aws_account_id" {
  description = "(Required) ID of the AWS account where Terraform will apply the configuration."
  type        = string
}

variable "aws_region" {
  description = "(Required) AWS region where Terraform will apply the configuration."
  type        = string
}

variable "bucket_force_destroy" {
  description = "(Required) Whether to force the deletion of audit logs during a Terraform destroy."
  type        = bool
}

variable "log_transition_to_ia_days" {
  description = "(Required) Number of days after object creation before transitioning audit log objects from S3 Standard to S3 Standard-IA. Audit logs (CloudTrail, and potentially AWS Config or VPC Flow Logs in the future) are read frequently only in the period immediately following an event, when an incident is being actively investigated; after that window, access becomes rare but the objects must remain readily retrievable. Standard-IA offers significantly lower storage cost than Standard while keeping millisecond retrieval, making it the appropriate tier for this 'recently created but no longer hot' phase. No default is provided: the value should be a deliberate choice per environment, balancing cost against how long an investigation into a recent event might reasonably take."
  type        = number
}

variable "log_transition_to_glacier_days" {
  description = "(Required) Number of days after object creation before transitioning audit log objects from S3 Standard-IA to S3 Glacier for long-term, low-cost archival. This value must be strictly greater than log_transition_to_ia_days, since the Glacier transition happens after the Standard-IA phase. Glacier retrieval is slower (minutes to hours depending on the retrieval tier) but is appropriate here because, past this point, audit logs are kept mainly to satisfy retrospective investigation or compliance needs rather than for routine access. No default is provided: the value should be a deliberate choice per environment."
  type        = number
}

variable "log_retention_days" {
  description = "(Optional) Number of days after object creation before the audit log object is permanently deleted. Set to null (the recommended default) to never expire audit logs: unlike application access logs, audit trails are the primary evidence available for a retrospective security investigation, and deleting them removes that evidence permanently. Only set a numeric value here if there is an explicit, deliberate reason to cap retention (e.g. a specific compliance requirement defining a maximum retention period, or a conscious cost-control decision agreed with the team) rather than as a default habit copied from a non-audit bucket lifecycle policy."
  type        = number
  default     = null
}

variable "log_noncurrent_expiration_days" {
  description = "(Optional) Number of days after an object version becomes non-current (i.e. is superseded by a newer version, or the object is deleted while versioning is enabled) before that non-current version is permanently deleted. This only has an effect if S3 bucket versioning is enabled on the audit log bucket, which is expected here since CloudTrail log buckets are typically versioned for tamper protection. Without this rule, non-current versions accumulate indefinitely and silently increase storage cost over time, even though the current/live version of each log object is unaffected by this expiration and remains subject to its own lifecycle transitions and retention policy. A relatively long default (e.g. 365 days) is reasonable since non-current versions are rarely needed once a newer version exists, but the exact value should still be a deliberate choice per environment."
  type        = number
  default     = 365
}

variable "additional_policy_documents" {
  description = "(Required) Policy documents to add to the S3 bucket policy."
  type        = list(string)
}