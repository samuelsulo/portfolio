unit "website_hosting" {
  source = "${find_in_parent_folders("units")}/website-hosting"
  path   = "website-hosting"

  values = {
    domain_name     = "sandbox.samuelsulo.it"
    route53_zone_id = "Z056385545KJLOV8R9W3"

    # Disposable environment: allow `destroy` to empty the bucket.
    s3_bucket_force_destroy = true
  }
}

unit "contact_api" {
  source = "${find_in_parent_folders("units")}/contact-api"
  path   = "contact-api"

  values = {
    # A plus address, delivered to the same inbox: SES identities are unique
    # per address in an account and region, and sandbox shares both with
    # production, so reusing the production address would share (and on
    # destroy, remove) its identity.
    email               = "work.samuelsulo+sandbox@gmail.com"
    website_domain_name = "sandbox.samuelsulo.it"
    domain_name         = "contact.sandbox.samuelsulo.it"
    route53_zone_id     = "Z056385545KJLOV8R9W3"
  }
}
