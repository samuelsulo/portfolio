locals {
  # Unique prefix for naming every resource in the project, used by the
  # modules below instead of free-form strings. Order: project (identifies
  # the client/project among all the ones managed), then environment
  # (distinguishes sandbox/production), finally region (useful if other
  # regions are added for the same project in the future). Example:
  # "acme-sbx-eus1".
  name_prefix = "${var.project_code}-${var.environment_code}"
}

module "website_hosting" {
  source = "../modules/vendor/website-hosting"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  name_prefix             = local.name_prefix
  s3_bucket_force_destroy = var.s3_bucket_force_destroy
  domain_name             = var.domain_name
  route53_zone_id         = var.route53_zone_id
}

module "contact_api" {
  source = "../modules/vendor/contact-api"

  name_prefix                     = local.name_prefix
  contact_via_email_recipient     = var.client_email
  contact_via_email_subject       = "New contact from website ${var.domain_name}: {{name}}"
  contact_via_email_text_template = file("${path.module}/templates/contact.txt")
  contact_via_email_html_template = file("${path.module}/templates/contact.html")
  cors_allowed_origin             = "https://${var.domain_name}"
  domain_name                     = "contact.${var.domain_name}"
  route53_zone_id                 = var.route53_zone_id
}