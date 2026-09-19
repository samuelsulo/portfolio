# Live

The root Terraform module actually applied by every environment. The
files here are shared: each environment runs exactly the same
configuration and differs only in the values supplied by
[`../environments/`](../environments).

## Files

- [`versions.tf`](./versions.tf): minimum Terraform and provider versions
  required.
- [`backend.tf`](./backend.tf): `backend "s3"` block, left without values.
- [`providers.tf`](./providers.tf): default tags and AWS provider
  configuration.
- [`main.tf`](./main.tf): shared locals and composition of the modules
  from [`../modules/`](../modules).
- [`variables.tf`](./variables.tf) / [`outputs.tf`](./outputs.tf): inputs
  and outputs of the root module.

## What It Does

- Configures two AWS providers: the default one (region = `var.aws_region`)
  and a `us_east_1` needed for specific resources like ACM certificates for 
  CloudFront.
- Both providers set `allowed_account_ids = [var.aws_account_id]` as a
  guard against an apply on the wrong account, and an `assume_role` block
  conditioned on `aws_assume_role_enabled` (`true` by default, i.e. production:
  cross-account role in the client's account; set to `false` in sandbox,
  where my own account's active credentials are used directly).
- Applies the mandatory tags to every resource via `default_tags`.
- Instantiates the modules from [`../modules/`](../modules), as the client
  project requires them.

## Backend

The `backend "s3"` block is intentionally left empty: the real values
(bucket, key, region, `use_lockfile`, `encrypt`, and, in production, an
`assume_role` block for state access) come from each environment's
`backend.hcl` at init time, so `sandbox` and `production` share this file
but write state to different buckets. Backend configuration cannot
reference variables, locals, or `dynamic` blocks (it is loaded before the
rest of the configuration), so this `assume_role` is separate from, and
must be kept in sync with, the one in [`providers.tf`](./providers.tf),
which uses the actual `var.aws_role_name` and only governs access to
resources, not to the state file itself.

```
kitsu terraform init --env <environment>
```

## Usage

Always go through `kitsu terraform` (see [`../README.md`](../README.md)),
never run `terraform` directly in this folder: it is the one that takes
care of `-backend-config` and `-var-file` per environment:

## Inputs

Each variable is documented with a `description` in
[`variables.tf`](./variables.tf), the source of truth for inputs. Values
are supplied per environment via
`../environments/<env>/environment.tfvars`, plus
[`project.auto.tfvars`](./project.auto.tfvars) for the values shared by
every environment of the project.

## Outputs

No outputs defined yet: they will be added to
[`outputs.tf`](./outputs.tf) as the modules composed in
[`main.tf`](./main.tf) expose useful ones (e.g. site URL, resource ARNs
to reference in the handover documentation).
