locals {
  budget_monthly_cost_name = "${var.name_prefix}-budget-monthly"
  budget_annual_cost_name  = "${var.name_prefix}-budget-annual"

  # Cost tag filter: without cost_filter, aws_budgets_budget monitors the
  # entire AWS account's spend, not just this project's. Applied only if
  # budget_scope = "project" (see dynamic "cost_filter" below). Requires
  # project_tag_key to be activated as a "cost allocation tag" in
  # Billing > Cost allocation tags (not manageable via Terraform).
  #
  # Note: "$$" in HCL is the escape for a literal, non-interpolated
  # "${...}", so the "$" separator between key and value must be built with
  # format() rather than direct interpolation "$${var...}".
  project_cost_filter = var.budget_scope == "project" ? [{
    name   = "TagKeyValue"
    values = [format("user:%s$%s", var.project_tag_key, var.project_tag_value)]
  }] : []
}

resource "aws_budgets_budget" "monthly_cost" {
  name         = local.budget_monthly_cost_name
  budget_type  = "COST"
  limit_amount = var.budget_monthly_amount
  limit_unit   = var.budget_unit
  time_unit    = "MONTHLY"

  dynamic "cost_filter" {
    for_each = local.project_cost_filter
    content {
      name   = cost_filter.value.name
      values = cost_filter.value.values
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  tags = {
    Name = local.budget_monthly_cost_name
  }
}

resource "aws_budgets_budget" "annual_cost" {
  name         = local.budget_annual_cost_name
  budget_type  = "COST"
  limit_amount = var.budget_annual_amount
  limit_unit   = var.budget_unit
  time_unit    = "ANNUALLY"

  dynamic "cost_filter" {
    for_each = local.project_cost_filter
    content {
      name   = cost_filter.value.name
      values = cost_filter.value.values
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }

  tags = {
    Name = local.budget_annual_cost_name
  }
}