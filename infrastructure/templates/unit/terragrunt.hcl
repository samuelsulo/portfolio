include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "${find_in_parent_folders("modules/vendor")}//name"
}

inputs = {
  required = values.required

  optional = try(values.optional, "default")
}
