variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "aws_account_id" {
  description = "(Required) ID of the AWS account where Terraform will apply the configuration."
  type        = string
}

variable "aws_region" {
  description = "(Required) AWS region where Terraform will apply the configuration."
  type        = string
}

variable "bucket_force_destroy" {
  description = "(Required) Whether to force the deletion of audit logs during a Terraform destroy."
  type        = bool
}

variable "domain_name" {
  description = "(Optional) Primary domain of the website (e.g. \"trattoriadamario.it\"). Required in production, optional in sandbox."
  type        = string
  default     = ""
}

variable "create_route53_zone" {
  description = "(Optional) If true, creates a new Route 53 hosted zone for domain_name. Set to false if DNS stays with the client's registrar, or if an existing zone is passed via route53_zone_id (e.g. the one AWS creates automatically when a domain is registered through Route 53 Domains). Ignored if route53_zone_id is set. Default is `false`"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "(Optional) ID of an existing Route 53 hosted zone to use for domain_name, instead of creating a new one. Typical case: the domain was registered directly in AWS (Route 53 Domains), which auto-creates a hosted zone that should be reused rather than duplicated. Leave empty to create a new zone (create_route53_zone = true) or to skip AWS-managed DNS entirely."
  type        = string
  default     = ""

  validation {
    condition     = !(var.create_route53_zone && var.route53_zone_id != "")
    error_message = "Set either create_route53_zone = true (new zone) or route53_zone_id (existing zone), not both."
  }
}

variable "acm_certificate_arn" {
  description = "(Optional) ARN of an existing ACM certificate in us-east-1. If empty and domain_name is set, the module creates a new one."
  type        = string
  default     = ""
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
