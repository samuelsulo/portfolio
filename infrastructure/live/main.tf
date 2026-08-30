locals {
  # Unique prefix for naming every resource in the project, used by the
  # modules below instead of free-form strings. Order: project (identifies
  # the client/project among all the ones managed), then environment
  # (distinguishes sandbox/production), finally region (useful if other
  # regions are added for the same project in the future). Example:
  # "acme-sbx-eus1".
  name_prefix = "${var.project_code}-${var.environment_code}"
}
