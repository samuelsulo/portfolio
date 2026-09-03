# Infrastructure

AWS infrastructure for the client's application, managed entirely with
Terraform.

## Structure

```
infrastructure/
├── modules/
│   ├── vendor/       # 1:1 copies from terraform-aws-catalog, never modified
│   └── local/        # modules written for this project
├── live/             # root module: composes the modules
└── environments/     # backend configuration + variables per environment
```

The Terraform workflow (init/plan/apply/...) that wraps `live/` +
`environments/` is handled by
[kitsu](https://github.com/samuelsulo/kitsu), not a Makefile: see its
README for the full command reference.

See the README of each subfolder for details:
- [`modules/`](./modules)
- [`live/`](./live)
- [`environments/`](./environments).

## Environments

- **sandbox**: development/test environment, in my AWS account, deletable
  per project.
- **production**: the AWS account owned by the client, reachable only via
  cross-account `AssumeRole`. Created when the client project reaches that
  stage.

## Prerequisites

- Terraform >= 1.10 (required by the S3 backend's native `use_lockfile`
  locking, no DynamoDB table involved)
- AWS CLI configured with my developer account's credentials. The
  `AssumeRole` into the client account in production is handled natively
  by Terraform (`aws_role_enabled`, `aws_role_arn`, `aws_role_external_id`
  in [`environments/production/environment.tfvars`](./environments/production)):
  there's no need to assume the role by hand before `init`/`plan`/`apply`.

## Quickstart

```
kitsu terraform init --env sandbox   # terraform init with the environment's backend
kitsu terraform plan --env sandbox   # terraform plan, saved to environments/sandbox/tfplan
kitsu terraform apply --env sandbox  # apply the saved plan
```

Run `kitsu terraform --help` for the complete list of subcommands
(validate, fmt, destroy, state management, docs, ...). `--env` defaults to
`sandbox`; pass `--env production` explicitly, and only after a manually
reviewed plan.

## Scaffolding

```
kitsu terraform scaffold module <name>                          # new module under modules/local/
kitsu terraform catalog list                                    # list the modules available in terraform-aws-catalog
kitsu terraform catalog versions <name>                         # list the available versions of a catalog module
kitsu terraform catalog vendor <name> <tag>                     # copy that version under modules/vendor/
kitsu terraform scaffold environment --env <env> --account-id=<id> # new environment under environments/
```

## Documentation

The project documentation lives in [`../docs/`](../docs) and must be kept
up to date on every change to the infrastructure.
