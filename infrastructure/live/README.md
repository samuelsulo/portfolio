# Live

The root Terraform module actually applied by every environment. The files
here are shared: `sandbox` and `production` run exactly the same
configuration and differ only in the values provided by
[`../environments/`](../environments).

## Files

- [`versions.tf`](./versions.tf): minimum Terraform and provider versions
  required.
- [`backend.tf`](./backend.tf): the `backend "s3"` block, left without
  values.
- [`providers.tf`](./providers.tf): default tags and AWS provider
  configuration.
- [`main.tf`](./main.tf): shared locals and composition of the modules
  from [`../modules/`](../modules).
- [`variables.tf`](./variables.tf) / [`outputs.tf`](./outputs.tf): input
  and output of the root module.

## What it does

- Configures two AWS providers: the default one (region = `var.aws_region`)
  and a `us_east_1` alias, needed because the ACM certificates used by
  CloudFront must exist in `us-east-1` regardless of the stack's region.
- Both providers set `allowed_account_ids = [var.aws_account_id]` as a
  guard against applying to the wrong account, and an `assume_role` block
  conditioned on `aws_role_enabled` (`true` by default, i.e. production:
  cross-account role in the client's account; set to `false` in sandbox,
  where my active account's credentials are used directly).
- Applies the mandatory tags (`Project`, `Owner`, `Environment`,
  `ManagedBy = "terraform"`) to every resource via `default_tags`.
- Instantiates the modules from [`../modules/`](../modules), as the client
  project requires them (no module present yet: see CLAUDE.md §5 for the
  rules on module provenance and usage).

## Backend

The `backend "s3"` block is intentionally left empty: the real values
(bucket, key, region, `use_lockfile`, `encrypt`) come from each
environment's `backend.hcl` at init time, so `sandbox` and `production`
share this file but write their state to different buckets.

```
terraform init -backend-config=../environments/<env>/backend.hcl
```

[kitsu](https://github.com/samuelsulo/kitsu) wraps this:
`kitsu terraform init --env <sandbox|production>`.

## Usage

Always go through kitsu, never run `terraform` directly in this folder:
it's the one that takes care of `-backend-config` and `-var-file` per
environment:

```
kitsu terraform init --env sandbox
kitsu terraform plan --env sandbox
kitsu terraform apply --env sandbox
```

## Input

Full definitions in [`variables.tf`](./variables.tf); values are provided
per environment via `../environments/<env>/environment.tfvars`, plus
[`project.auto.tfvars`](./project.auto.tfvars) for values shared by every
environment of the project.

| Name | Description | Required |
|---|---|---|
| `owner` | Name of the project's owner, applied as the `Owner` tag. | yes |
| `project` | Project name, applied as the `Project` tag. | yes |
| `project_code` | Project code used in the resource naming prefix. | yes |
| `environment` | `sandbox` or `production`. | yes |
| `environment_code` | `sbx` or `prd`, used in the resource naming prefix. | yes |
| `aws_account_id` | ID of the target AWS account (guard against applying to the wrong account). | yes |
| `aws_region` | Target AWS region. | yes |
| `aws_role_enabled` | Whether to assume `aws_role_arn`. Default `true` (production); set to `false` in sandbox. | no (default `true`) |
| `aws_role_arn` | ARN of the cross-account role to assume. Required when `aws_role_enabled = true`, ignored otherwise. | yes if `aws_role_enabled = true` |
| `aws_role_external_id` | External ID required by `aws_role_arn`'s trust policy. Required when `aws_role_enabled = true`, ignored otherwise. | yes if `aws_role_enabled = true` |

## Output

No output defined yet: they will be added in
[`outputs.tf`](./outputs.tf) as the modules composed in
[`main.tf`](./main.tf) expose useful ones (e.g. site URL, ARNs of
resources to reference in the handover documentation).
