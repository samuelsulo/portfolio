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

## Accounts

Each account of the landing zone has a top-level folder under [`live/`](./live).
Two exist in this project:

- **workload-prod**: the live website, `samuelsulo.it`.
- **sandbox**: a disposable copy of the same stack under `sbx.samuelsulo.it`,
  to try changes before they reach production. It runs in the `sandbox` account
  of the organization. It is defined but not applied: run `plan` and `apply` from
  `live/sandbox/eu-south-1/website` when needed.

## Prerequisites

- The IDs of the AWS accounts are not kept in the repository, which is public.
  `live/*/account.hcl` and `live/root.hcl` read them from the environment:
  `PORTFOLIO_WORKLOAD_PROD_AWS_ACCOUNT_ID`, `PORTFOLIO_SANDBOX_AWS_ACCOUNT_ID`,
  `PORTFOLIO_STATE_AWS_ACCOUNT_ID` (devops, where the state is) and
  `PORTFOLIO_DNS_AWS_ACCOUNT_ID` (network-hub, where the hosted zone is). Set them
  in `infrastructure/mise.local.toml` (git-ignored; copy
  [`mise.local.example.toml`](./mise.local.example.toml) and run `mise trust`).
  Terragrunt fails with a clear error while one is unset.
- [`mise`](https://mise.jdx.dev), which installs the pinned `opentofu` and
  `terragrunt` versions (`mise install`).
- AWS CLI profile of the target account, named in that account's `account.hcl`
  (`awslz-<account name>`, from IAM Identity Center: `aws sso login --sso-session
  awslz`). Terragrunt itself never assumes a role for the provider.
- The state bucket is the one of the organization, in the devops account of the
  landing zone: nothing to create (see [`live/`](./live#state-bucket)).

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
