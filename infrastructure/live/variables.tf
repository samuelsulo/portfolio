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

variable "aws_region_code" {
  description = "(Required) AWS region code used in the name prefix applied to all resources."
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

variable "enable_cloudtrail" {
  description = "(Optional) Whether to enable cloudtrail or not. The default is true."
  type        = bool
  default     = true
}

variable "bucket_force_destroy" {
  description = "(Optional) Whether to force delete all objects on an S3 bucket deletion."
  type        = bool
  default     = false
}

variable "create_route53_zone" {
  description = "(Optional) If true, creates a new Route 53 hosted zone for domain_name. Set to false if DNS stays with the client's registrar, or if an existing zone is passed via route53_zone_id. Ignored if route53_zone_id is set. Default is `false`"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "(Optional) ID of an existing Route 53 hosted zone to reuse for domain_name (e.g. the one AWS auto-creates when the domain is registered via Route 53 Domains), instead of creating a new one."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "(Optional) Primary domain of the website (e.g. \"trattoriadamario.it\"). Required in production, optional in sandbox."
  type        = string
  default     = ""
}

variable "budget_unit" {
  description = "(Required) Currency unit applied to the budget amounts (e.g. \"EUR\"). Must match the billing currency configured on the AWS account, otherwise the configured thresholds will not correspond to the amounts actually billed."
  type        = string
}

variable "budget_monthly_amount" {
  description = "(Optional) Monthly spending threshold that triggers budget notifications (e.g. \"20\")."
  type        = string
}

variable "budget_annual_amount" {
  description = "(Required) Annual spending threshold that triggers budget notifications (e.g. \"100\")."
  type        = string
}

variable "budget_alert_emails" {
  description = "(Required) List of emails to send budget notifications to."
  type        = list(string)
}

variable "budget_scope" {
  description = "(Optional) Scope of the AWS budgets: \"project\" (default, recommended) filters them on the Project tag so they track only this project's spend; \"account\" monitors the entire AWS account's spend. Use \"account\" only if the account hosts exclusively this project and cost allocation tags are not wanted (see infrastructure/modules/budgets/README.md)."
  type        = string
  default     = "project"

  validation {
    condition     = contains(["account", "project"], var.budget_scope)
    error_message = "budget_scope must be \"account\" or \"project\"."
  }
}