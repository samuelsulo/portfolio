terraform {
  # Backend block intentionally left empty: the real values (bucket, key,
  # region, use_lockfile, encrypt) are supplied at init time by each
  # environment, not hardcoded here: sandbox and production share the same
  # live/ but write their state to different buckets.
  #
  #   terraform init -backend-config=../environments/<env>/backend.hcl
  #
  # (the Makefile does this automatically: `make init ENV=<sandbox|production>`)
  backend "s3" {
    # Never permanent client credentials: in production we always operate via
    # AssumeRole into the client's cross-account role (aws_role_enabled = true,
    # aws_role_arn required). In sandbox (my own AWS account, no client
    # involved) aws_role_enabled is set to false: the block is omitted and my
    # own account's active credentials are used directly.
    dynamic "assume_role" {
      for_each = var.aws_role_enabled ? [var.aws_role_arn] : []

      content {
        role_arn    = assume_role.value
        external_id = var.aws_role_external_id
      }
    }
  }
}
