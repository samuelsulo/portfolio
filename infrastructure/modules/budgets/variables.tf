variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "budget_unit" {
  description = "(Required) Currency unit applied to the budget amounts (e.g. \"EUR\"). Must match the billing currency configured on the AWS account, otherwise the configured thresholds will not correspond to the amounts actually billed."
  type        = string
}

variable "budget_monthly_amount" {
  description = "(Required) Monthly spending threshold that triggers budget notifications (e.g. \"10\")."
  type        = string
}

variable "budget_annual_amount" {
  description = "(Required) Annual spending threshold that triggers budget notifications (e.g. \"100\")."
  type        = string
}

variable "budget_alert_emails" {
  description = "(Required) List of email addresses that receive budget notifications."
  type        = set(string)
}

variable "budget_scope" {
  description = "(Optional) Scope of the budget measurement: \"project\" (default, recommended) applies a cost_filter on the project tag so budgets track only this project's spend; \"account\" applies no filter and monitors the entire AWS account's spend. Use \"account\" only when the account hosts exclusively this project (e.g. a dedicated client account) and cost allocation tags are not wanted."
  type        = string
  default     = "project"

  validation {
    condition     = contains(["account", "project"], var.budget_scope)
    error_message = "budget_scope must be \"account\" or \"project\"."
  }
}

variable "project_tag_key" {
  description = "(Optional) Cost allocation tag key used to scope the budgets to this project instead of the whole AWS account. Must match a tag applied to the project's resources (see default_tags in live/main.tf) and be activated as a cost allocation tag in Billing settings. Ignored when budget_scope = \"account\"."
  type        = string
  default     = "Project"
}

variable "project_tag_value" {
  description = "(Required if budget_scope = \"project\") Value of `project_tag_key` identifying this project (e.g. var.project). Used to filter the budgets so they track only this project's spend, not the entire AWS account. Ignored when budget_scope = \"account\"."
  type        = string
  default     = null

  validation {
    condition     = var.budget_scope != "project" || var.project_tag_value != null
    error_message = "project_tag_value is required when budget_scope = \"project\"."
  }
}
