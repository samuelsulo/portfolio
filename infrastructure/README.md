# Infrastructure

AWS infrastructure managed with Terragrunt and OpenTofu.

## Structure

```
.
├── live/         # environments, regions and stacks: what gets deployed where
├── units/        # reusable Terragrunt units wrapping the modules
├── modules/      # reusable OpenTofu modules
├── templates/    # starting points to copy when adding environments, regions, stacks, units
├── scripts/      # helpers behind the mise tasks (catalog vendoring, state bucket)
├── mise.toml     # pinned tool versions and tasks
└── CLAUDE.md     # guardrails for whoever works on this folder
```

See each subfolder's README for details:
- [`live/`](./live)
- [`units/`](./units)
- [`modules/`](./modules)
- [`templates/`](./templates)
- [`scripts/`](./scripts)

## Environments

Each environment has a top-level folder under [`live/`](./live). Two exist
in this project:

- **production**: the live website, `samuelsulo.it`.
- **sandbox**: a disposable copy of the same stack under `sandbox.samuelsulo.it`,
  to try changes before they reach production. Unlike the scaffold's default
  of one AWS account per environment, it runs in the **same account and
  region** as production (a single personal account).
  What keeps the two apart is the name prefix (`portfolio-sbx` vs
  `portfolio-prd`), the state key (it contains the environment folder), the
  domains and the SES identity (a `+sandbox` address, because identities are
  unique per address in an account and region). It is defined but not applied:
  run `plan` and `apply` from `live/sandbox/eu-south-1/website` when needed.

## Prerequisites

- The AWS account ID is not kept in the repository. `live/*/account.hcl`
  reads it from `PORTFOLIO_AWS_ACCOUNT_ID`, which you set in
  `infrastructure/mise.local.toml` (git-ignored; copy
  [`mise.local.example.toml`](./mise.local.example.toml) and run
  `mise trust`). Terragrunt fails with a clear error while it is unset.
- [`mise`](https://mise.jdx.dev), which installs the pinned `opentofu` and
  `terragrunt` versions (`mise install`).
- AWS CLI profile for the target environment, named in that environment's
  `account.hcl`: the account's own credentials directly, or a profile
  with `role_arn` (+ `source_profile`) or SSO into a
  cross-account role. Terragrunt itself never assumes the role.
- The state bucket of the target account, created once with
  `mise run state:create-bucket <aws-profile>` (see
  [`live/`](./live#state-bucket)).

## Static checks

`mise run lint` runs `tflint` and `trivy` (see [`scripts/`](./scripts)). It
runs on commit through `lefthook` and on every pull request in CI.

## Quickstart

```
cd live/<environment>/<region>/<stack>
terragrunt stack run plan
terragrunt stack run apply
```

Apply to production only after a manually reviewed plan. See
[`live/`](./live#usage) for details.

## Scaffolding

New environments, regions, stacks and units are created by copying the
matching file from [`templates/`](./templates).

## Catalog

Catalog modules are copied 1:1 into `modules/vendor/` and never
modified afterwards. Units are written per project, in `units/`:

```
mise run catalog:list
mise run catalog:vendor <name>/<tag>
```

See [`scripts/`](./scripts) for what the tasks do and
[`modules/vendor/`](./modules/vendor) for the rules on vendored code.
