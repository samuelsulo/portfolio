variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "s3_bucket_force_destroy" {
  description = "(Required) Whether to force the deletion of the S3 bucket content during a Terraform destroy."
  type        = bool
}

variable "s3_bucket_versioning_enabled" {
  description = "(Required) Whether to enable versioning on the S3 bucket that stores the website content."
  type        = bool
}

variable "domain_name" {
  description = "(Required) Primary domain of the website (e.g. \"trattoriadamario.it\")."
  type        = string

  validation {
    condition     = length(var.domain_name) > 0
    error_message = "domain_name cannot be empty."
  }
}

variable "route53_zone_id" {
  description = "(Required) ID of the existing Route 53 hosted zone for domain_name. Used to validate the ACM certificate and to create the DNS alias record pointing to CloudFront. This module never creates a hosted zone: pass in one that already exists (e.g. the one AWS creates automatically when the domain is registered through Route 53 Domains)."
  type        = string

  validation {
    condition     = length(var.route53_zone_id) > 0
    error_message = "route53_zone_id cannot be empty."
  }
}

variable "price_class" {
  description = "(Optional) CloudFront price class. PriceClass_100 covers EU/US and is sufficient for local Italian clients. Default is `PriceClass_100`"
  type        = string
  default     = "PriceClass_100"
}

variable "default_root_object" {
  description = "(Optional) Object served at the root of the website. Default is `index.html`"
  type        = string
  default     = "index.html"
}

variable "spa_mode" {
  description = "(Optional) If true, configures 403/404 error responses -> index.html (required for Vue Router in history mode). Default is `true`"
  type        = bool
  default     = true
}
