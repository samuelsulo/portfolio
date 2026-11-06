unit "website_hosting" {
  source = "${find_in_parent_folders("units")}/website-hosting"
  path   = "website-hosting"

  values = {
    domain_name     = "samuelsulo.it"
    route53_zone_id = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub
  }
}

unit "contact_api" {
  source = "${find_in_parent_folders("units")}/contact-api"
  path   = "contact-api"

  values = {
    email               = "work.samuelsulo@gmail.com"
    website_domain_name = "samuelsulo.it"
    domain_name         = "contact.samuelsulo.it"
    route53_zone_id     = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub
  }
}
