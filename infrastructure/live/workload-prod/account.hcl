locals {
  aws_account_id = get_env("PORTFOLIO_WORKLOAD_PROD_AWS_ACCOUNT_ID")
  aws_profile    = "awslz-workload-prod"
  account_name   = "workload-prod"
}
