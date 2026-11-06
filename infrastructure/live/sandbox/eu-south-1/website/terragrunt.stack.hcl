unit "website_hosting" {
  source = "${find_in_parent_folders("units")}/website-hosting"
  path   = "website-hosting"

  values = {
    domain_name     = "sbx.samuelsulo.it"
    route53_zone_id = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub

    # Disposable environment: allow `destroy` to empty the bucket.
    s3_bucket_force_destroy = true
  }
}

unit "contact_api" {
  source = "${find_in_parent_folders("units")}/contact-api"
  path   = "contact-api"

  values = {
    email               = "work.samuelsulo@gmail.com"
    website_domain_name = "sbx.samuelsulo.it"
    domain_name         = "contact.sbx.samuelsulo.it"
    route53_zone_id     = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub
  }
}
