# Infrastructure

AWS infrastructure managed with Terragrunt and OpenTofu.

## Structure

Follows the `aws-terragrunt-standard` layout:

```
infrastructure/
├── catalog/              # what can be deployed
│   ├── modules/vendor/   # 1:1 copies from the module catalog, never modified
│   ├── modules/local/    # modules written for this project (none yet)
│   ├── units/            # website-hosting, contact-api: one per AWS competency
│   └── stacks/           # website: the two units wired together
├── live/                 # where it is deployed: one folder per AWS account
│   ├── root.hcl          # provider, state backend and tags
│   ├── workload-prod/    # the live website
│   └── sandbox/          # a disposable copy
├── scripts/              # helpers behind the mise tasks (catalog vendoring, lint)
├── mise.toml             # pinned tool versions and tasks
└── CLAUDE.md             # guardrails for whoever works on this folder
```

See each folder's README for details: [`catalog/`](./catalog), [`live/`](./live),
[`scripts/`](./scripts).

## Accounts

Each account of the landing zone has a top-level folder under [`live/`](./live).
Two exist in this project:

- **workload-prod**: the live website, `samuelsulo.it`.
- **sandbox**: a disposable copy of the same stack under `sbx.samuelsulo.it`,
  to try changes before they reach production. It runs in the `sandbox` account
  of the organization. It is defined but not applied: run `plan` and `apply` from
  `live/sandbox/eu-south-1` when needed.

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
cd live/<account>/<region>      # e.g. live/workload-prod/eu-south-1
terragrunt stack run plan       # saves the plan under .plans/
terragrunt stack run apply      # applies only the saved plan
```

Apply only after a manually reviewed plan. See [`live/`](./live#usage) for details.

## Adding things

There are no templates: copy an existing file of the same kind and adapt it. A new
deployable is a stack in [`catalog/stacks/`](./catalog/stacks) plus a `stack` block in
`live/<account>/<region>/terragrunt.stack.hcl`; a new unit goes in
[`catalog/units/`](./catalog/units). See [`catalog/`](./catalog).

## Catalog

Modules of the module catalog are copied 1:1 into `catalog/modules/vendor/` and never
modified afterwards. Units and stacks are written per project:

```
mise run catalog:list
mise run catalog:vendor <name>/<tag>
```

See [`scripts/`](./scripts) for what the tasks do and
[`catalog/modules/vendor/`](./catalog/modules/vendor) for the rules on vendored code.
