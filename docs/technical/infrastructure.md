# Infrastructure

Technical map of [`infrastructure/`](../../infrastructure). The detailed documentation of
each module and unit is in the README inside it, and the conventions are in
[`infrastructure/README.md`](../../infrastructure/README.md); this page only explains how
the pieces relate.

## Tooling

Terragrunt orchestrates OpenTofu. Both are pinned with `mise`. Static checks (`tflint`,
`trivy`, format checks) run on commit and in CI; CI never plans or applies.

## Layers

| Layer   | Folder                                 | Role                                                               |
| ------- | -------------------------------------- | ------------------------------------------------------------------ |
| Modules | `modules/vendor/`                      | Vendored, never edited, from the infrastructure catalog            |
| Units   | `units/`                               | Terragrunt wrappers of the modules, written for this project       |
| Stacks  | `live/<environment>/<region>/<stack>/` | Wire units to an environment and give their values                 |
| Root    | `live/root.hcl`                        | Shared provider, state backend and tags, identical for every stack |

## What is deployed

The `website` stack of each environment instantiates two units:

- `website-hosting`: private S3 bucket behind CloudFront (Origin Access Control), ACM
  certificate and Route 53 alias.
- `contact-api`: API Gateway calling SES directly, custom domain and certificate, and the
  SES email template.

## Environments

`production` is the live site. `sandbox` is a defined but not applied copy under
`sandbox.samuelsulo.it`, kept apart from production by name prefix, state key, domains and
SES identity (same account and region, because this is a personal project). See
[`infrastructure/README.md`](../../infrastructure/README.md#environments).

## State and account

State lives in an S3 bucket of the account, one state file per stack. The account id is never
committed: it is read from `PORTFOLIO_AWS_ACCOUNT_ID`, set in the git-ignored
`infrastructure/mise.local.toml`.
