# Handover

The portfolio is the owner's own, so this is a note to keep the project maintainable, not a
delivery to a client. It points to the other documents instead of repeating them.

## What exists

- A live site on `samuelsulo.it` and its contact API on `contact.samuelsulo.it`, in the
  owner's AWS account ([architecture](../architecture/system-architecture.md)).
- The application, the infrastructure as code, the brand assets and the CV, versioned
  separately with `application/`, `infrastructure/` and `brand/` tags.
- Documentation in this folder, plus a README for every module, unit and the application.

## Where access lives

| What            | Where                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| AWS account id  | `PORTFOLIO_AWS_ACCOUNT_ID` in the git-ignored `infrastructure/mise.local.toml`            |
| AWS credentials | The AWS CLI profile in the owner's terminal; nothing is stored in the repository or in CI |
| Terraform state | S3 bucket of the account, one state file per stack                                        |
| Releases        | GitHub releases, created by `cog bump` with the `gh` CLI                                  |
| Domain          | Registered in Route 53 with automatic renewal                                             |
| Contact mailbox | The address set in the `contact_api` unit; the SES identity must stay verified            |

## Known limits

- Budgets exist in the AWS account but are configured outside this repository, so they are not
  reproducible from the infrastructure code. Nothing alerts on a broken contact form: it is
  noticed only by looking.
- The CV and the certifications are kept in two places (`cv/samuelsulo-cv.json` and
  `certifications.json`) and are aligned by hand.
- The `sandbox` environment is defined but not applied.
- A certification that expires must be marked `expired` by hand.

## Remaining work

- Replace the placeholder statement in the application README ("the content is placeholder")
  once the content is final.
- Add monitoring on the contact flow if the site starts to receive real traffic, and bring the
  account budgets under the infrastructure code if they should be reproducible.

## Where to start

[Deployment guide](../deployment/deploying.md) to ship a change, [operations
guide](../operations/operations.md) when something looks wrong.
