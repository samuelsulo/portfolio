include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "${find_in_parent_folders("modules/vendor")}//contact-api"
}

# The Route 53 records are created through an `aws.dns` alias provider, because
# the hosted zone is in the network-hub account of the organization. It assumes
# the role `awslz-dns-<account name>` that account gives to the one this project
# is deployed from (see ADR 0009 of the landing zone).
generate "provider_dns" {
  path      = "provider_dns.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
provider "aws" {
  alias   = "dns"
  region  = "us-east-1"
  profile = "${include.root.locals.aws_profile}"

  assume_role {
    role_arn = "arn:aws:iam::${include.root.locals.dns_account_id}:role/awslz-dns-${include.root.locals.account_name}"
  }

  allowed_account_ids = ["${include.root.locals.dns_account_id}"]

  default_tags {
    tags = local.default_tags
  }
}
EOF
}

locals {
  name = "${include.root.locals.name_prefix}-contact"
}

inputs = {
  api_gateway_name                 = local.name
  ses_template_name                = local.name
  ses_integration_role_name        = "${local.name}-ses-integration"
  ses_integration_role_policy_name = "${local.name}-ses-send-templated-email"

  contact_via_email_source        = values.email
  contact_via_email_to_addresses  = values.email
  contact_via_email_subject       = "New contact from website ${values.website_domain_name}: {{name}}"
  contact_via_email_text_template = file("${get_terragrunt_dir()}/templates/contact.txt")
  contact_via_email_html_template = file("${get_terragrunt_dir()}/templates/contact.html")

  domain_name         = values.domain_name
  route53_zone_id     = values.route53_zone_id
  cors_allowed_origin = "https://${values.website_domain_name}"
}
