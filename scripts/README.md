# Scripts

Support automation for the project that doesn't go through Terraform or
the [`../infrastructure/`](../infrastructure) Makefile: one-off setup,
bootstrap, command-line operations on the target AWS account.

## Available scripts

| Script | Purpose |
|---|---|
| [`bootstrap-terraform-backend.sh`](./bootstrap-terraform-backend.sh) | Creates (once) the S3 bucket for the Terraform state of every project in an AWS account: versioning, encryption, public access block, HTTPS-only policy, lifecycle on non-current versions. Idempotent: if the bucket already exists, it only realigns its configuration. |
| [`deploy-website.sh`](./deploy-website.sh) | Builds [`../website/`](../website) and syncs it to the S3 bucket + CloudFront distribution of the given environment (bucket and distribution ID read from the environment's Terraform state). In `production`, deploys the commit pointed at by an explicit `website/vX.Y.Z` tag (passed as the second argument, never auto-selected), tracks it with a marker in S3 plus a `_deploy-versions/current` pointer to the live tag, and refuses to redeploy an already-deployed tag or downgrade to an older one unless `--force` is passed as a third argument; in every other environment, deploys whatever commit is currently checked out, versioned by its short SHA. Usage: `./scripts/deploy-website.sh sandbox` or `./scripts/deploy-website.sh production website/vX.Y.Z [--force]`. |

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
