# The live website, https://samuelsulo.it
stack "website" {
  source = "${dirname(find_in_parent_folders("root.hcl"))}/../catalog/stacks/website"
  path   = "website"

  values = {
    domain_name         = "samuelsulo.it"
    contact_domain_name = "contact.samuelsulo.it"
    email               = "work.samuelsulo@gmail.com"
    route53_zone_id     = "Z0695209U987U7SXURE7" # samuelsulo.it in network-hub
  }
}
