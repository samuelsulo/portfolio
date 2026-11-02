locals {
  # Global variables
  project       = "samuelsulo-portfolio"
  project_short = "portfolio"

  # Automatically load account-level variables
  account_vars = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  # Automatically load region-level variables
  region_vars = read_terragrunt_config(find_in_parent_folders("region.hcl"))

  # Extract the variables we need for easy access
  aws_account_id    = local.account_vars.locals.aws_account_id
  aws_profile       = local.account_vars.locals.aws_profile
  aws_region        = local.region_vars.locals.aws_region
  aws_region_short  = local.region_vars.locals.aws_region_short
  environment       = local.account_vars.locals.environment
  environment_short = local.account_vars.locals.environment_short

  # State variables
  state_region = "eu-south-1"
  state_bucket = "tfstate-${local.aws_account_id}-${local.state_region}-an"
  state_key    = "${local.project}/${path_relative_to_include()}/terraform.tfstate"

  # Resource name prefix: project and environment, the base of every resource name.
  # Names that must be unique across regions or accounts add their own suffix.
  environment_name_prefix = "${local.project_short}-${local.environment_short}"
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
    Project     = "${local.project}"
    Environment = "${local.environment}"
    ManagedBy   = "terragrunt"
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
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}
