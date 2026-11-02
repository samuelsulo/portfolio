# Copy to live/<environment>/<region>/<stack>/ (or
# live/<environment>/_global/<stack>/ for account-wide services).
#
# Each `unit` block instantiates a unit from units/ and supplies the environment-specific `values` the unit expects (see
# that unit's README).

unit "example" {
  source = "${find_in_parent_folders("units")}/<unit>"
  path   = "example"

  values = {
    required = "..."
    # optional = "..."
  }
}

# A unit that needs another unit's outputs gets its path through `values`
# and declares a `dependency` on it in its own terragrunt.hcl
# (config_path = values.example_path, plus mock_outputs for `plan`).
#
# unit "dependent" {
#   source = "${find_in_parent_folders("units")}/<other-unit>"
#   path   = "dependent"
#
#   values = {
#     example_path = "../example"
#   }
# }
