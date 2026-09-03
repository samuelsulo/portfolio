# Deployment guide

How to publish `website/` to an environment's infrastructure (sandbox or
production), starting from scratch.

## Prerequisites

- The target environment's infrastructure must already be applied:
  `kitsu terraform apply --env <sandbox|production>` from [`../../infrastructure/`](../../infrastructure)
  (see its [README](../../infrastructure/README.md)). The `website_hosting`
  module must exist in that environment's Terraform state: that's where
  `kitsu website deploy` reads the S3 bucket and CloudFront distribution
  from, never from hardcoded values. If the `contact_api` module has also
  been applied, the command reads its custom domain from the same state
  and injects it into the build as `VITE_CONTACT_API_URL`; if it isn't
  there yet, the contact form is still built and deployed, just disabled
  (see
  [`../../website/README.md`](../../website/README.md#contact-form-backend)).
- AWS CLI configured, with the target AWS account's credentials already
  active in the shell (see the prerequisites in the
  [kitsu README](https://github.com/samuelsulo/kitsu)).
- `node`, `terraform` and `kitsu` versions aligned with [`../../mise.toml`](../../mise.toml)
  (`mise install` from the repository root).

## Deploy

```bash
kitsu website deploy --env sandbox      # or production
```

The command, in order:

1. installs the dependencies (`npm ci`) and runs the unit tests (`npm run test`);
2. reads the S3 bucket, CloudFront distribution and (if present) the
   `contact_api` custom domain from the target environment's Terraform state;
3. builds the production bundle (`npm run build`, including type-check),
   into `website/dist/`, with `VITE_CONTACT_API_URL` set from the previous
   step;
4. syncs `dist/` to the bucket (`aws s3 sync --delete`): hashed assets
   (JS/CSS/fonts) with long, immutable cache, `index.html` always without
   cache, so a deploy is visible immediately without waiting for the
   client-side cache to expire;
5. invalidates the CloudFront distribution (`/*`), so the CDN stops
   serving previous, cached versions of the assets;
6. records the deploy in S3 (a per-tag marker plus a `_deploy-versions/current`
   pointer to the live tag), traceability required for every deploy to
   production by [`CLAUDE.md` §7](../../CLAUDE.md#7-deployment-rules) and
   queryable with `kitsu website current --env production` and
   `kitsu website history --env production`.

No direct deploy to production without the sandbox environment first
having been validated with the same command (see
[`CLAUDE.md` §7](../../CLAUDE.md#7-deployment-rules)).

## Rollback

The `website_hosting` module's S3 bucket is versioned: a previous version
of an object can be restored from the console or CLI
(`aws s3api list-object-versions` / `aws s3api copy-object` with the
desired `VersionId`), followed by a new CloudFront invalidation on the
same `distribution_id` read from the Terraform state. Alternatively, in
production, run `kitsu website deploy --env production --tag <older
website/vX.Y.Z> --force` (see
[`../../website/README.md`](../../website/README.md#versioning-and-deploys));
in every other environment, run `kitsu website deploy` again after a
`git checkout` of the commit to restore.
