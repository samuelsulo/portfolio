# Environments

Environment-specific Terraform input, consumed by [`../live/`](../live/),
which instead stays identical across environments. Each environment is a
subfolder here containing exactly two files:

| File | Purpose |
|---|---|
| `backend.hcl` | S3 backend configuration for this environment's Terraform state (`bucket`, `key`, `region`, `use_lockfile`, `encrypt`). Passed via `terraform init -backend-config=...`. |
| `environment.tfvars` | Environment-specific variable values (account ID, role ARN, domain, budget thresholds, ...). Passed via `terraform plan/apply -var-file=...`. |

Values shared by every environment of a project (e.g. `project`,
`aws_region`) instead live in
[`../live/project.auto.tfvars`](../live/project.auto.tfvars), loaded
automatically by Terraform.

## `sandbox`

Development/test environment, in my AWS account, deletable per project.
`bucket_force_destroy = true` so `terraform destroy` doesn't get blocked
on bucket contents left over from previous tests. `aws_role_enabled =
false`: Terraform uses my active credentials directly, no `AssumeRole`
involved.

## `production`

The AWS account owned by the client. Created only once the client's
cross-account role exists (`aws_role_enabled` stays at its `true`
default, so `aws_role_arn` and `aws_role_external_id` are required).
Terraform assumes the role natively on every `init`/`plan`/`apply` via
the provider's `assume_role` block. Never applied without a manually
reviewed `plan` first. Not present until the project reaches that stage.

## Adding an environment

```
make scaffold-environment ENV=<sandbox|production> ACCOUNT_ID=<12-digit-account-id>
```

Generates `environment.tfvars` and `backend.hcl` for the given AWS account,
reading `project`/`aws_region` from `../live/project.auto.tfvars`.

## Usage

Selected via the `ENV` variable on every Makefile target (default
`sandbox`):

```
make plan ENV=production
```
