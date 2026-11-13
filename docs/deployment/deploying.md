# Deployment guide

How to ship each part of the portfolio. The three parts go out separately and have
different release rules:

| Part                              | Versioned                             | Command                                          |
| --------------------------------- | ------------------------------------- | ------------------------------------------------ |
| Infrastructure                    | `infrastructure/vX.Y.Z` tag           | `terragrunt stack run plan` / `apply`            |
| Application code                  | `web/vX.Y.Z` tag              | `npm run deploy -- --version web/vX.Y.Z` |
| Content (texts, data, images, CV) | No tag: the git commit is the version | `npm run deploy:content`                         |

## Prerequisites

- Tools installed with `mise` (`mise install`), see the root [README](../../README.md).
- AWS credentials for the production account in the terminal (`AWS_PROFILE`, or the profile
  named in `infrastructure/live/workload-prod/account.hcl`).
- For infrastructure only: the `PORTFOLIO_*_AWS_ACCOUNT_ID` variables in
  `infrastructure/mise.local.toml` (git-ignored), see `infrastructure/README.md`.

## Infrastructure

```
cd infrastructure/live/workload-prod/eu-south-1/website
terragrunt stack run plan
terragrunt stack run apply
```

Apply only after reading the plan. Release with `cog bump --package infrastructure --auto`.
Details: [`infrastructure/README.md`](../../infrastructure/README.md).

## Application

1. Make sure the work is merged to `main` and the checks are green.
2. `cog bump --package web --auto` updates the changelog, tags, pushes and creates
   the GitHub Release.
3. `npm run deploy -- --version web/vX.Y.Z` runs the tests, builds, syncs to S3,
   invalidates CloudFront and records the version in the `_version` object.

The script reads the bucket, distribution and contact API URL from the infrastructure
outputs and never touches the content paths. Details:
[`apps/web/README.md`](../../apps/web/README.md#versioning-and-deploys).

## Content

`npm run deploy:content` deploys `origin/main` (or `--ref <git-ref>`) from a clean worktree:
tests, sync of `content`, `images`, `cv`, `documents` and `brand`, CloudFront invalidation,
and the commit recorded in `_content_version`.

To change the CV, edit `apps/web/cv/samuelsulo-cv.json`, run `npm run cv`, commit the
PDFs and deploy the content.

## When the content schema changes

If a change to the data files needs new code (a new data file, a required field), the
schema version is bumped in both places and the application must be released too. Order:

1. Merge, bump and deploy the **application**.
2. Deploy the **content**.

The reverse order makes the old application meet the new content and show "could not be
loaded". The Certifications section was introduced this way.

## Verify

- The version live: `aws s3 cp s3://<bucket>/_version -` and `_content_version`.
- Open the site, check the language and theme toggles, the contact form and the new content.
- Caching and versioning of the content: [application](../technical/application.md#loading-and-caching). The content deploy waits for the CloudFront invalidation (a few minutes) before the new versions go live.

## Roll back

- **Application**: deploy the previous tag with `--version`.
- **Content**: deploy the previous commit with `npm run deploy:content -- --ref <commit>`.
- **Infrastructure**: check out the previous tag, plan and apply. Read the plan first:
  some changes are not reversible by applying an older configuration.
