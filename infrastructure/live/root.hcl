locals {
  # Global variables
  project = "portfolio"

  # Prefix of the name of every resource this repository creates: the project
  name_prefix = local.project

  # Automatically load account-level variables
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  # Automatically load region-level variables
  region_vars = read_terragrunt_config(find_in_parent_folders("region.hcl"))

  # Extract the variables we need for easy access
  aws_account_id   = local.account_vars.locals.aws_account_id
  aws_profile      = local.account_vars.locals.aws_profile
  account_name     = local.account_vars.locals.account_name
  aws_region       = local.region_vars.locals.aws_region
  aws_region_short = local.region_vars.locals.aws_region_short

  # The repository is public, so the IDs of the accounts are not kept in it:
  # they come from the environment (see mise.local.example.toml).
  # State variables: the state bucket of the organization, in the devops account
  # of the landing zone. The backend assumes the role of this account that can
  # reach only the keys of this account.
  state_account_id = get_env("PORTFOLIO_STATE_AWS_ACCOUNT_ID")

  # Account of the landing zone that holds the hosted zone of the domain
  dns_account_id = get_env("PORTFOLIO_DNS_AWS_ACCOUNT_ID")
  state_region     = "eu-south-1"
  state_bucket     = "awslz-tfstate-${local.state_account_id}-${local.state_region}-an"
  state_role_arn   = "arn:aws:iam::${local.aws_account_id}:role/awslz-tfstate-access"
  state_key        = "${local.project}/${replace(path_relative_to_include(), ".terragrunt-stack/", "")}/terraform.tfstate"
}

# Use OpenTofu instead of Terraform (version pinned in mise.toml)
terraform_binary = "tofu"

# Generate an AWS provider block
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
locals {
  # Mandatory minimum tags applied automatically to every resource created
  # by the units, without having to repeat them everywhere.
  default_tags = {
    Project   = "${local.project}"
    Account   = "${local.account_name}"
    ManagedBy = "terragrunt"
  }
}

provider "aws" {
  region = "${local.aws_region}"
  profile = "${local.aws_profile}"

  # Only these AWS Account IDs may be operated on by this template
  allowed_account_ids = ["${local.aws_account_id}"]

  default_tags {
    tags = local.default_tags
  }
}
EOF
}

# Configure Terragrunt to automatically store tfstate files in an S3 bucket
remote_state {
  backend = "s3"
  config = {
    encrypt      = true
    bucket       = local.state_bucket
    key          = local.state_key
    region       = local.state_region
    profile      = local.aws_profile
    use_lockfile = true
    assume_role  = { role_arn = local.state_role_arn }
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}
