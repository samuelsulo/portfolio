variable "project_slug" {
  description = "(Required) Project slug used for the 'ProjectSlug' tag applied to all resources."
  type        = string
}

variable "project_short" {
  description = "(Required) A short project descriptor used for resource naming."
}

variable "environment" {
  description = "(Required) Deployment environment: 'sandbox' (developer account) or 'production' (client account)."
  type        = string

  validation {
    condition     = contains(["sandbox", "production"], var.environment)
    error_message = "environment must be either \"sandbox\" or \"production\"."
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

variable "aws_assume_role_enabled" {
  description = "(Optional) Whether Terraform assumes the `aws_role_name` role to apply the configuration. Defaults to true (production: cross-account role into the client's AWS account). Set to false in sandbox to use the active credentials of my own AWS account directly, with no AssumeRole involved."
  type        = bool
  default     = true
}

variable "aws_role_name" {
  description = "(Optional) The name of the aws role to assume."
  type        = string
  default     = "SamuelSuloAdminRole"
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

variable "client_email" {
  description = "(Required) The client's email for aws notifications (e.g. alarms and budgets) and for the contact me api."
  type        = string
}