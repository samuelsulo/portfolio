# Environments

Environment-specific Terraform inputs, consumed by [`../live/`](../live/),
which instead stays identical across environments. Each environment is a
subfolder here that contains exactly two files:

| File | Purpose |
|---|---|
| `backend.hcl` | S3 backend configuration for this environment's Terraform state |
| `environment.tfvars` | Environment-specific variable values |

The values shared by every environment of a project (e.g. `project`,
`aws_region`) instead live in
[`../live/project.auto.tfvars`](../live/project.auto.tfvars), loaded
automatically by Terraform.

## `sandbox`

Development/test environment, in my AWS account, disposable per project.
`aws_assume_role_enabled = false`: Terraform uses my active credentials 
directly, no `AssumeRole` involved.

## `production`

The AWS account owned by the client. Created only once the client's
cross-account role exists (`aws_assume_role_enabled` stays at its default `true`
). Terraform assumes the role natively on every `init`/`plan`/`apply` through
the provider's `assume_role` block. Never applied without a manually reviewed
`plan` first.

Its `backend.hcl` additionally carries its own static `assume_role` block
(the role that can read/write the state bucket in the client's account):
unlike the provider's, this one cannot be conditioned on a variable, since
backend configuration is loaded before variables exist, see
[`../live/README.md#backend`](../live/README.md#backend).

## Adding an Environment

```
kitsu terraform scaffold environment --env <environment> --account-id <12-digit-account-id>
```

Generates `environment.tfvars` and `backend.hcl` for the given AWS
account, reading `project`/`aws_region` from `../live/project.auto.tfvars`.

## Usage

Selected via the `--env` flag on every `kitsu terraform` command (default
`sandbox`).
