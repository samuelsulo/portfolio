# Units

Reusable Terragrunt units, one per AWS competency, each wrapping a
module from [`../modules/`](../modules) with a `terragrunt.hcl`. Stacks
under [`../live/`](../live) wire up a set of units for a given
environment/region via `unit` blocks in a `terragrunt.stack.hcl`.

Units are written for this project and owned by it: unlike modules, they
are not vendored from the catalog and can be modified freely.

## Structure

```
units/
└── <name>/
    ├── terragrunt.hcl
    └── README.md
```

## Conventions

- One AWS competency per unit; no resource is created directly in a
  stack if a unit already exists (or it makes sense to create one) for
  that purpose.
- Every unit has the same file structure: `terragrunt.hcl`, `README.md`.
- `terragrunt.hcl` declares the unit's `terraform { source = ... }` (the
  module it wraps, from [`../modules/`](../modules)) and the unit's own
  `inputs`; anything environment-specific is supplied by the stack, via
  the `values` of the `unit` block that instantiates it.
- The unit's `README.md` lists the `values` it expects.
- Units do not configure the backend or the AWS provider themselves:
  that is [`root.hcl`](../live/root.hcl)'s responsibility (included by
  every unit), so the same unit works unchanged in every environment.
  The one exception is an extra aliased provider that the wrapped module
  declares through `configuration_aliases` (e.g. `aws.us_east_1` for an
  ACM certificate used by CloudFront): the unit adds it with a `generate`
  block in its own `terragrunt.hcl`, reusing the account values exposed by
  `root.hcl`, and says so in its `README.md`.

## Adding a Unit

Copy [`../templates/unit/terragrunt.hcl`](../templates/unit/terragrunt.hcl)
to `units/<name>/terragrunt.hcl`, point its `source` at the module it
wraps, add a `README.md`, and wire it up in a stack under
[`../live/`](../live).
