# A disposable copy of the website, https://sbx.samuelsulo.it
stack "website" {
  source = "${dirname(find_in_parent_folders("root.hcl"))}/../catalog/stacks/website"
  path   = "website"

  values = {
    domain_name         = "sbx.samuelsulo.it"
    contact_domain_name = "contact.sbx.samuelsulo.it"
    email               = "work.samuelsulo@gmail.com"
    route53_zone_id     = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub

    # Disposable environment: allow `destroy` to empty the bucket.
    s3_bucket_force_destroy = true
  }
}
