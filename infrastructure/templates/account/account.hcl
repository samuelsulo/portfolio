# One per environment, at live/<environment>/account.hcl. Each environment
# lives in its own AWS account, so this file defines both.
locals {
  aws_account_id    = get_env("<ACCOUNT_ID_ENV_VAR>") # or the literal 12-digit ID, if it is not private
  aws_profile       = "<aws_profile>"
  environment       = "<environment>"       # e.g. sandbox, production
  environment_short = "<environment_short>" # e.g. sbx, prd
}
