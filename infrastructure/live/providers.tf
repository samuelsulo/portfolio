locals {
  default_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  region = var.aws_region

  # Safety guard: fails immediately if the active credentials don't point
  # to the account expected for this environment, instead of risking an
  # apply against the wrong account.
  allowed_account_ids = [var.aws_account_id]

  dynamic "assume_role" {
    for_each = var.aws_role_enabled ? [var.aws_role_arn] : []

    content {
      role_arn    = assume_role.value
      external_id = var.aws_role_external_id
    }
  }

  # Mandatory minimum tags applied automatically to every resource created
  # by the modules, without having to repeat them everywhere.
  default_tags {
    tags = local.default_tags
  }
}

# Secondary provider pinned to us-east-1: required by AWS exclusively for
# ACM certificates attached to CloudFront, regardless of which region
# var.aws_region uses for the rest of the stack. Same account, same
# AssumeRole (if any) as the main provider.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  allowed_account_ids = [var.aws_account_id]

  dynamic "assume_role" {
    for_each = var.aws_role_enabled ? [var.aws_role_arn] : []

    content {
      role_arn    = assume_role.value
      external_id = var.aws_role_external_id
    }
  }

  default_tags {
    tags = local.default_tags
  }
}
