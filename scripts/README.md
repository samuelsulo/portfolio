# Scripts

Support automation for the project that doesn't go through Terraform or
the [`../infrastructure/`](../infrastructure) Makefile: one-off setup,
bootstrap, command-line operations on the target AWS account.

## Available scripts

| Script | Purpose |
|---|---|
| [`bootstrap-terraform-backend.sh`](./bootstrap-terraform-backend.sh) | Creates (once) the S3 bucket for the Terraform state of every project in an AWS account: versioning, encryption, public access block, HTTPS-only policy, lifecycle on non-current versions. Idempotent: if the bucket already exists, it only realigns its configuration. |
| [`deploy-website.sh`](./deploy-website.sh) | Builds `website/` (tests + `vue-tsc` + `vite build`) and publishes `dist/` to the given environment's S3 bucket and CloudFront distribution (read from `infrastructure/live`'s Terraform state, never hardcoded), then invalidates the CloudFront cache. Tracks every deploy in `website/deploy-log/<env>.md` (date, commit, bucket, distribution, invalidation). Idempotent: safe to rerun without side effects. Usage: `./scripts/deploy-website.sh <sandbox\|production>`. |
| [`install-hooks.sh`](./install-hooks.sh) | Points `core.hooksPath` to [`../.githooks/`](../.githooks) and makes the hooks executable. Run once after every clone. The only script here that doesn't operate on an AWS account: exception to the prerequisites below. |

## Prerequisites

- AWS CLI configured, with the target AWS account's credentials already
  active in the shell at execution time: the scripts operate on the
  account returned by `aws sts get-caller-identity`, never on an ID passed
  by hand.
  - **sandbox** (my account): `aws login --profile my-profile`.
  - **production** (client's account): unlike the Terraform commands in
    the Makefile, which assume the cross-account role natively via the
    provider's `assume_role` block (see
    [`../infrastructure/README.md`](../infrastructure/README.md#prerequisites)),
    these scripts make direct AWS CLI calls and therefore require
    assuming the role by hand before running them (e.g. `aws sts
    assume-role` with the client's ARN and external ID, exporting the
    returned temporary credentials into the shell).

## Usage

```
./scripts/bootstrap-terraform-backend.sh
```

Must be run once per AWS account (my account for sandbox, the client's
account for production), before the first `make init` in
[`../infrastructure/`](../infrastructure) on that account: the bucket it
creates is the one referenced by `backend.hcl` in
[`../infrastructure/environments/`](../infrastructure/environments).

## Adding a script

A new script here must:

- have a `.sh` extension, be executable (`chmod +x`) and use
  `set -euo pipefail`;
- always operate on the AWS account of the current credentials, never on
  an account ID passed as a parameter;
- be idempotent when possible (safe to rerun without side effects if the
  desired state has already been reached);
- be added to the table above.
