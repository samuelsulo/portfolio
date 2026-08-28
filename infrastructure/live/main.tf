locals {
  default_tags = {
    Project     = var.project
    Owner       = var.owner
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  # Unique prefix for naming every resource in the project, used by the
  # modules below instead of free-form strings. Order: project (identifies
  # the client/project among all the ones managed), then environment
  # (distinguishes sandbox/production), finally region (useful if other
  # regions are added for the same project in the future). Example:
  # "acme-sbx-eus1".
  name_prefix = "${var.project_code}-${var.environment_code}-${var.aws_region_code}"
}

terraform {
  # use_lockfile in the S3 backend (native locking, no DynamoDB) requires
  # Terraform >= 1.10, see infrastructure/environments/*/backend.hcl.
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Backend block intentionally left empty: the real values (bucket, key,
  # region, use_lockfile, encrypt) are supplied at init time by each
  # environment, not hardcoded here: sandbox and production share the same
  # main.tf but write their state to different buckets.
  #
  #   terraform init -backend-config=../environments/<env>/backend.hcl
  #
  # (the Makefile does this automatically: `make init ENV=<sandbox|production>`)
  backend "s3" {
    # Never permanent client credentials: in production we always operate via
    # AssumeRole into the client's cross-account role (aws_role_enabled = true,
    # aws_role_arn required). In sandbox (my own AWS account, no client
    # involved) aws_role_enabled is set to false: the block is omitted and my
    # own account's active credentials are used directly.
    dynamic "assume_role" {
      for_each = var.aws_role_enabled ? [var.aws_role_arn] : []

      content {
        role_arn    = assume_role.value
        external_id = var.aws_role_external_id
      }
    }
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

module "budgets" {
  source = "../modules/budgets"

  name_prefix           = local.name_prefix
  budget_unit           = var.budget_unit
  budget_monthly_amount = var.budget_monthly_amount
  budget_annual_amount  = var.budget_monthly_amount
  budget_alert_emails   = var.budget_alert_emails

  # Budget scoping: "project" (default) filters it on the "Project" tag
  # applied via default_tags above, needed because the same AWS account (in
  # particular sandbox) can host multiple projects/clients over time.
  # "account" (var.budget_scope) monitors the entire account's spend instead.
  budget_scope      = var.budget_scope
  project_tag_value = var.project
}

module "audit_logs" {
  source = "../modules/audit-logs"
  count  = var.enable_cloudtrail ? 1 : 0

  name_prefix                    = local.name_prefix
  aws_account_id                 = var.aws_account_id
  aws_region                     = var.aws_region
  bucket_force_destroy           = var.bucket_force_destroy
  additional_policy_documents    = [module.cloudtrail[0].bucket_policy]
  log_transition_to_ia_days      = 30
  log_transition_to_glacier_days = 90
}

module "cloudtrail" {
  source = "../modules/cloudtrail"
  count  = var.enable_cloudtrail ? 1 : 0

  name_prefix      = local.name_prefix
  aws_account_id   = var.aws_account_id
  aws_region       = var.aws_region
  is_multi_region  = true
  bucket_arn       = module.audit_logs[0].bucket_arn
  bucket_name      = module.audit_logs[0].bucket_name
  bucket_policy_id = module.audit_logs[0].bucket_policy_id
  key_prefix       = "cloudtrail"
}

module "website" {
  source = "../modules/website"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix          = local.name_prefix
  aws_account_id       = var.aws_account_id
  aws_region           = var.aws_region
  bucket_force_destroy = var.bucket_force_destroy
  create_route53_zone  = var.create_route53_zone
  route53_zone_id      = var.route53_zone_id
  domain_name          = var.domain_name
}