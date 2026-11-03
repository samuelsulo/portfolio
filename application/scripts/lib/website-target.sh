# shellcheck shell=bash disable=SC2034
# Sourced by deploy.sh and deploy-content.sh: resolves where the website
# lives from the outputs of the website stack under
# infrastructure/live/production/eu-south-1/website (via
# 'terragrunt stack output'), never guessed or hardcoded.
#
# Expects ROOT_DIR to be set. Sets AWS_PROFILE (exported), BUCKET,
# DISTRIBUTION_ID and CONTACT_API_DOMAIN.
#
# AWS credentials: uses the AWS_PROFILE already set in the terminal, or the
# aws_profile of infrastructure/live/production/account.hcl otherwise.

resolve_website_target() {
  local stack_dir="$ROOT_DIR/infrastructure/live/production/eu-south-1/website"

  # The AWS CLI profile of the production account, the same one Terragrunt
  # uses (see infrastructure/live/production/account.hcl).
  if [[ -z "${AWS_PROFILE:-}" ]]; then
    AWS_PROFILE=$(sed -n 's/^ *aws_profile *= *"\(.*\)"/\1/p' "$ROOT_DIR/infrastructure/live/production/account.hcl")
    export AWS_PROFILE
  fi

  echo "==> Reading infrastructure endpoints from the website stack outputs (profile $AWS_PROFILE)"
  (cd "$stack_dir" && mise exec -- terragrunt stack generate >/dev/null)
  local outputs_json
  outputs_json=$(cd "$stack_dir" && mise exec -- terragrunt stack output -json 2>/dev/null)

  # Reads a string output of a unit of the stack: output_value <unit> <output>
  output_value() {
    node -e '
      const outputs = JSON.parse(require("fs").readFileSync(0, "utf8"))
      const value = (outputs[process.argv[1]] ?? {})[process.argv[2]]
      if (typeof value === "string") process.stdout.write(value)
    ' "$1" "$2" <<<"$outputs_json"
  }

  BUCKET=$(output_value website_hosting s3_bucket_id)
  DISTRIBUTION_ID=$(output_value website_hosting cloudfront_distribution_id)
  CONTACT_API_DOMAIN=$(output_value contact_api custom_domain_name)

  if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
    echo "Could not read the S3 bucket / CloudFront distribution from the website stack outputs." >&2
    echo "  Has 'terragrunt stack run apply' been run in infrastructure/live/production/eu-south-1/website?" >&2
    exit 1
  fi
}
