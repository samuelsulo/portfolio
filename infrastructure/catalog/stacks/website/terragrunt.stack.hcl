# The portfolio website: the static site and the API of its contact form.

unit "website_hosting" {
  source = "${dirname(find_in_parent_folders("root.hcl"))}/../catalog/units/website-hosting"
  path   = "website-hosting"

  values = {
    domain_name     = values.domain_name
    route53_zone_id = values.route53_zone_id

    s3_bucket_force_destroy = try(values.s3_bucket_force_destroy, false)
  }
}

unit "contact_api" {
  source = "${dirname(find_in_parent_folders("root.hcl"))}/../catalog/units/contact-api"
  path   = "contact-api"

  values = {
    email               = values.email
    website_domain_name = values.domain_name
    domain_name         = values.contact_domain_name
    route53_zone_id     = values.route53_zone_id
  }
}
