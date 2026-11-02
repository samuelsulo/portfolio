# One per environment, at live/<environment>/account.hcl. Each environment
# lives in its own AWS account, so this file defines both.
locals {
  aws_account_id    = "<aws_account_id>"
  aws_profile       = "<aws_profile>"
  environment       = "<environment>"       # e.g. sandbox, production
  environment_short = "<environment_short>" # e.g. sbx, prd
}
