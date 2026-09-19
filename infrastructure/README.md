# Infrastructure

AWS infrastructure managed entirely with Terraform.

## Structure

```
infrastructure/
├── modules/          # reusable modules
├── live/             # root module: composes the modules
└── environments/     # backend configuration + variables per environment
```

The Terraform workflow (init/plan/apply/...) is provided by
[`kitsu`](https://github.com/samuelsulo/kitsu) (`kitsu terraform ...`),
which wraps `live/` + `environments/`: see its README for the full command
reference.

See each subfolder's README for details:
- [`modules/`](./modules)
- [`live/`](./live)
- [`environments/`](./environments).

## Environments

- **sandbox**: development/test environment, in my AWS account, disposable
  per project.
- **production**: the AWS account owned by the client, reachable only via
  cross-account `AssumeRole`. Created when the client project reaches that
  stage.

## Prerequisites

- Terraform >= 1.10 (required by the S3 backend's native `use_lockfile`
  locking, no DynamoDB table involved)
- [`kitsu`](https://github.com/samuelsulo/kitsu)
- AWS CLI configured with my developer account's credentials. The
  `AssumeRole` into the client's account in production is handled natively
  by Terraform (`aws_assume_role_enabled`).

## Quickstart

```
kitsu terraform init --env sandbox   # terraform init with the environment's backend
kitsu terraform plan --env sandbox   # terraform plan, saved to environments/sandbox/tfplan
kitsu terraform apply --env sandbox  # apply the saved plan
```

Run `kitsu terraform --help` for the full list of commands (validate, fmt,
destroy, state management, docs, ...). `--env` defaults to `sandbox`; pass
`--env production` explicitly, and only after a manually reviewed plan.

## Scaffolding

New modules and environments are generated with `kitsu terraform scaffold...`; 
see [`modules/local/`](./modules/local#adding-a-module) and
[`environments/`](./environments#adding-an-environment) for the commands.

## Catalog

Modules from `terraform-aws-catalog` (a separate repo with Terraform
modules reused across all client projects) are copied 1:1 into
`modules/vendor/` and never modified afterwards; see
[`modules/vendor/`](./modules/vendor#adding-a-module) for the commands and
rules.

