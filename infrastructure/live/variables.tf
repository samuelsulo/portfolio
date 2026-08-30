variable "owner" {
  description = "(Required) Owner name used for the 'Owner' tag applied to all resources."
  type        = string
}

variable "project" {
  description = "(Required) Project name used for the 'Project' tag applied to all resources."
  type        = string
}

variable "project_code" {
  description = "(Required) Project code used in the name prefix applied to all resources."
  type        = string
}

variable "environment" {
  description = "(Required) Deployment environment: 'sandbox' (developer account) or 'production' (client account)."
  type        = string

  validation {
    condition     = contains(["sandbox", "production"], var.environment)
    error_message = "environment must be either \"sandbox\" or \"production\"."
  }
}

variable "environment_code" {
  description = "(Required) Code of the environment: 'sbx' (developer account) or 'prd' (client account)."
  type        = string

  validation {
    condition     = contains(["sbx", "prd"], var.environment_code)
    error_message = "environment must be either \"sbx\" or \"prd\"."
  }
}

variable "aws_account_id" {
  description = "(Required) ID of the AWS account where Terraform will apply the configuration."
  type        = string
}

variable "aws_region" {
  description = "(Required) AWS region where Terraform will apply the configuration."
  type        = string
}

variable "aws_role_enabled" {
  description = "(Optional) Whether Terraform assumes aws_role_arn to apply the configuration. Defaults to true (production: cross-account role into the client's AWS account). Set to false in sandbox to use the active credentials of my own AWS account directly, with no AssumeRole involved."
  type        = bool
  default     = true
}

variable "aws_role_arn" {
  description = "(Optional) ARN of the AWS IAM role assumed by Terraform to apply the configuration. Required when aws_role_enabled is true; ignored otherwise."
  type        = string
  default     = null

  validation {
    condition     = !var.aws_role_enabled || var.aws_role_arn != null
    error_message = "aws_role_arn is required when aws_role_enabled is true."
  }
}

variable "aws_role_external_id" {
  description = "(Optional) External ID required by the trust policy of aws_role_arn, if the cross-account role enforces one. Required when aws_role_enabled is true, to mitigate the confused deputy problem; ignored otherwise."
  type        = string
  default     = null
  sensitive   = true

  validation {
    condition     = !var.aws_role_enabled || var.aws_role_external_id != null
    error_message = "aws_role_external_id is required when aws_role_enabled is true."
  }
}

variable "s3_bucket_force_destroy" {
  description = "(Required) Whether to force the deletion of the S3 bucket content during a Terraform destroy. true in sandbox (disposable environment), false in production."
  type        = bool
}

variable "domain_name" {
  description = "(Required) Primary domain of the website served by website_hosting. A dedicated subdomain in sandbox, the apex domain in production, so the two environments never contend for the same DNS record in the same AWS account."
  type        = string
}

variable "route53_zone_id" {
  description = "(Required) ID of the existing Route 53 hosted zone for domain_name, passed through to website_hosting. Same hosted zone for sandbox and production: the subdomain used in sandbox is delegated within it."
  type        = string
}
