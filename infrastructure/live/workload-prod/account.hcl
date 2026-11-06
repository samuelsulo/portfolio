locals {
  aws_account_id    = get_env("PORTFOLIO_AWS_ACCOUNT_ID")
  aws_profile       = "ss-admin"
  environment       = "production"
  environment_short = "prd"
}
