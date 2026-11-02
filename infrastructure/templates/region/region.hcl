# One per region, at live/<environment>/<region>/region.hcl.
# For account-wide services use live/<environment>/_global/region.hcl,
# pinned to us-east-1 with aws_region_short = "glb".
locals {
  aws_region       = "<aws_region>"       # e.g. eu-south-1
  aws_region_short = "<aws_region_short>" # e.g. eus1
}
