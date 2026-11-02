# Templates

Starting points to copy when adding something new. None of these are
used by Terragrunt directly: copy the file to its destination, then
replace the placeholders (`<...>`) and adjust.

Run Terragrunt from a stack's own directory, never from the repo root,
so these templates are not picked up.

## Files

| Template | Copy to | Used for |
|---|---|---|
| [`account/account.hcl`](./account/account.hcl) | `live/<environment>/account.hcl` | a new environment (AWS account) |
| [`region/region.hcl`](./region/region.hcl) | `live/<environment>/<region>/region.hcl` | a new region in an environment |
| [`stack/terragrunt.stack.hcl`](./stack/terragrunt.stack.hcl) | `live/<environment>/<region>/<stack>/terragrunt.stack.hcl` | a new stack wiring up units |
| [`unit/terragrunt.hcl`](./unit/terragrunt.hcl) | `units/<name>/terragrunt.hcl` | a new unit |

See [`../live/`](../live) and [`../units/`](../units) for the conventions
each of them follows.
