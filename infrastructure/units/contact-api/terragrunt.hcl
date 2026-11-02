include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "${find_in_parent_folders("modules/vendor")}//contact-api"
}

locals {
  name = "${include.root.locals.environment_name_prefix}-contact"
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
