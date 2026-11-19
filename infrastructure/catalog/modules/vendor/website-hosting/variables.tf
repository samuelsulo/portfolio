variable "s3_bucket_name" {
  description = "Name of the S3 bucket that stores the website content, used as is. With the `account-regional` namespace it must end with \"-{accountId}-{region}-an\": the caller is responsible for it."
  type        = string

  validation {
    condition     = length(var.s3_bucket_name) > 0
    error_message = "s3_bucket_name cannot be empty."
  }
}

variable "s3_bucket_namespace" {
  description = "Namespace of the S3 bucket name: `account-regional` (the name is unique within the account and region and must carry the \"-{accountId}-{region}-an\" suffix) or `global`."
  type        = string
  default     = "account-regional"

  validation {
    condition     = contains(["account-regional", "global"], var.s3_bucket_namespace)
    error_message = "s3_bucket_namespace must be \"account-regional\" or \"global\"."
  }
}

variable "cloudfront_distribution_name" {
  description = "Name of the CloudFront distribution (applied as its Name tag)."
  type        = string

  validation {
    condition     = length(var.cloudfront_distribution_name) > 0
    error_message = "cloudfront_distribution_name cannot be empty."
  }
}

variable "cloudfront_origin_access_control_name" {
  description = "Name of the CloudFront Origin Access Control used to reach the S3 bucket."
  type        = string

  validation {
    condition     = length(var.cloudfront_origin_access_control_name) > 0
    error_message = "cloudfront_origin_access_control_name cannot be empty."
  }
}

variable "s3_bucket_force_destroy" {
  description = "Whether to force the deletion of the S3 bucket content during a tofu destroy."
  type        = bool
}

variable "s3_bucket_versioning_enabled" {
  description = "Whether to enable versioning on the S3 bucket that stores the website content."
  type        = bool
}

variable "domain_name" {
  description = "Primary domain of the website (e.g. \"trattoriadamario.it\")."
  type        = string

  validation {
    condition     = length(var.domain_name) > 0
    error_message = "domain_name cannot be empty."
  }
}

variable "route53_zone_id" {
  description = "ID of the existing Route 53 hosted zone for domain_name. Used to validate the ACM certificate and to create the DNS alias record pointing to CloudFront. This module never creates a hosted zone: pass in one that already exists (e.g. the one AWS creates automatically when the domain is registered through Route 53 Domains)."
  type        = string

  validation {
    condition     = length(var.route53_zone_id) > 0
    error_message = "route53_zone_id cannot be empty."
  }
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 covers EU/US and is sufficient for local Italian clients."
  type        = string
  default     = "PriceClass_100"
}

variable "default_root_object" {
  description = "Object served at the root of the website."
  type        = string
  default     = "index.html"
}

variable "spa_mode" {
  description = "If true, configures 403/404 error responses -> index.html (required for Vue Router in history mode)."
  type        = bool
  default     = true
}

variable "redirect_domain_names" {
  description = "Additional domains (e.g. \"www.trattoriadamario.it\") that redirect with a 301 to domain_name, preserving path and query string. They are added to the ACM certificate and to the CloudFront aliases, and get their own alias records in the hosted zone, so they must belong to route53_zone_id. Wildcards are not supported."
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for name in var.redirect_domain_names : name != var.domain_name && !strcontains(name, "*")])
    error_message = "redirect_domain_names must not contain domain_name nor wildcard domains."
  }
}

variable "cloudfront_function_name" {
  description = "Name of the CloudFront viewer-request Function, created when redirect_domain_names is not empty and/or rewrite_html_pages is true. Required in those cases, unless the deprecated cloudfront_redirect_function_name is set."
  type        = string
  default     = null

  validation {
    condition     = !(length(var.redirect_domain_names) > 0 || var.rewrite_html_pages) || var.cloudfront_function_name != null || var.cloudfront_redirect_function_name != null
    error_message = "cloudfront_function_name is required when redirect_domain_names is not empty or rewrite_html_pages is true."
  }
}

variable "cloudfront_redirect_function_name" {
  description = "Deprecated, use cloudfront_function_name. Still honored when cloudfront_function_name is not set."
  type        = string
  default     = null
}

variable "error_page_path" {
  description = "Path of the page served, with error_response_code, when the origin answers 403 or 404 (S3 with OAC answers 403 for a missing key), e.g. \"/404.html\". Takes the place of spa_mode, which must then be false."
  type        = string
  default     = null

  validation {
    condition     = var.error_page_path == null ? true : startswith(var.error_page_path, "/")
    error_message = "error_page_path must start with \"/\"."
  }

  validation {
    condition     = var.error_page_path == null || !var.spa_mode
    error_message = "error_page_path and spa_mode are mutually exclusive: set spa_mode to false to use a custom error page."
  }
}

variable "error_response_code" {
  description = "HTTP status code returned together with error_page_path."
  type        = number
  default     = 404

  validation {
    condition     = var.error_response_code >= 200 && var.error_response_code <= 599
    error_message = "error_response_code must be between 200 and 599."
  }
}

variable "error_caching_min_ttl" {
  description = "Minimum time, in seconds, CloudFront caches the 403/404 answers mapped to error_page_path. Kept low so that a page published after a miss becomes reachable soon."
  type        = number
  default     = 10

  validation {
    condition     = var.error_caching_min_ttl >= 0
    error_message = "error_caching_min_ttl cannot be negative."
  }
}

variable "rewrite_html_pages" {
  description = "If true, the viewer-request function serves prerendered pages stored as flat .html files: \"/contatti\" and \"/contatti/\" are rewritten to \"/contatti.html\" (query string preserved). \"/\" and any path whose last segment contains a dot are left untouched. Runs after the host redirect."
  type        = bool
  default     = false
}

variable "security_headers_enabled" {
  description = "Whether to attach a response headers policy to the distribution that sets Strict-Transport-Security (one year, includeSubDomains), X-Content-Type-Options, Referrer-Policy (strict-origin-when-cross-origin) and X-Frame-Options (DENY)."
  type        = bool
  default     = false
}

variable "cloudfront_response_headers_policy_name" {
  description = "Name of the CloudFront response headers policy. Required when security_headers_enabled is true."
  type        = string
  default     = null

  validation {
    condition     = !var.security_headers_enabled || var.cloudfront_response_headers_policy_name != null
    error_message = "cloudfront_response_headers_policy_name is required when security_headers_enabled is true."
  }
}

variable "hsts_preload" {
  description = "Whether to add the preload directive to Strict-Transport-Security. Only enable it if the domain is meant for the browsers' HSTS preload list, which is hard to undo."
  type        = bool
  default     = false
}

variable "content_security_policy" {
  description = "Value of the Content-Security-Policy header. When null the header is not sent: a strict policy depends on what the site embeds (iframes, fonts, scripts), so it is never forced."
  type        = string
  default     = null
}

variable "permissions_policy" {
  description = "Value of the Permissions-Policy header (e.g. \"camera=(), microphone=(), geolocation=()\"). When null the header is not sent."
  type        = string
  default     = null
}

variable "s3_noncurrent_version_expiration_days" {
  description = "Days after which a noncurrent object version in the S3 bucket is permanently deleted, provided more than s3_noncurrent_versions_to_keep newer noncurrent versions exist."
  type        = number
  default     = 30

  validation {
    condition     = var.s3_noncurrent_version_expiration_days >= 1
    error_message = "s3_noncurrent_version_expiration_days must be at least 1."
  }
}

variable "s3_noncurrent_versions_to_keep" {
  description = "Number of noncurrent versions of each object always retained in the S3 bucket, regardless of their age, to allow rolling back a deploy."
  type        = number
  default     = 3

  validation {
    condition     = var.s3_noncurrent_versions_to_keep >= 0
    error_message = "s3_noncurrent_versions_to_keep cannot be negative."
  }
}

variable "s3_abort_incomplete_multipart_upload_days" {
  description = "Days after which incomplete multipart uploads in the S3 bucket are aborted."
  type        = number
  default     = 7

  validation {
    condition     = var.s3_abort_incomplete_multipart_upload_days >= 1
    error_message = "s3_abort_incomplete_multipart_upload_days must be at least 1."
  }
}
