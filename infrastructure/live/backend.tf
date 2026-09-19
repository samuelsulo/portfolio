terraform {
  # Backend block intentionally left empty: the real values (bucket, key,
  # region, use_lockfile, encrypt, and, in production, the assume_role
  # block) are supplied at init time by each environment's backend.hcl, not
  # hardcoded here: sandbox and production share the same live/ but write
  # their state to different buckets.
  #
  # Backend configuration cannot reference variables, locals, or dynamic
  # blocks (it is loaded before the rest of the configuration), so the
  # conditional AssumeRole logic lives in each environment's backend.hcl
  # instead of here: see environments/production/backend.hcl.
  backend "s3" {}
}
