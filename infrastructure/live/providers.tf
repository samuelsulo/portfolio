locals {
  # project_slug is "<client_slug>-<business_slug>-<project_type>", with
  # business_slug optional ("<client_slug>-<project_type>").
  project_slug_parts = split("-", var.project_slug)
  client_slug        = local.project_slug_parts[0]
  business_slug      = length(local.project_slug_parts) > 2 ? local.project_slug_parts[1] : "N/A"

  default_tags = {
    ClientSlug   = local.client_slug
    BusinessSlug = local.business_slug
    ProjectSlug  = var.project_slug
    Environment  = var.environment
    ManagedBy    = "terraform"
  }
}

provider "aws" {
  region = var.aws_region

  # Safety guard: fails immediately if the active credentials don't point
  # to the account expected for this environment, instead of risking an
  # apply against the wrong account.
  allowed_account_ids = [var.aws_account_id]

  dynamic "assume_role" {
    for_each = var.aws_assume_role_enabled ? [var.aws_role_name] : []

    content {
      role_arn = "arn:aws:iam::${var.aws_account_id}:role/${assume_role.value}"
    }
  }

  # Mandatory minimum tags applied automatically to every resource created
  # by the modules, without having to repeat them everywhere.
  default_tags {
    tags = local.default_tags
  }
}

# Secondary provider pinned to us-east-1: required by specific AWS services. 
# Same account, same AssumeRole (if any) as the main provider.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  allowed_account_ids = [var.aws_account_id]

  dynamic "assume_role" {
    for_each = var.aws_assume_role_enabled ? [var.aws_role_name] : []

    content {
      role_arn = "arn:aws:iam::${var.aws_account_id}:role/${assume_role.value}"
    }
  }

  default_tags {
    tags = local.default_tags
  }
}
