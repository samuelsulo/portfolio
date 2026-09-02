variable "name_prefix" {
  description = "(Required) Name prefix applied to all resources in this module."
  type        = string
}

variable "contact_via_email_source" {
  description = "(Required) Verified SES sending identity used as the Source of every ContactViaEmail notification. AWS sends a confirmation link to this address; the identity stays unverified until it's opened."
  type        = string

  validation {
    condition     = can(regex("^[^@,\\s]+@[^@,\\s]+\\.[^@,\\s]+$", var.contact_via_email_source))
    error_message = "Must be a single email address (e.g. \"a@example.com\")."
  }
}

variable "contact_via_email_to_addresses" {
  description = "(Required) Mailbox(es) that receive every ContactViaEmail submission, as a single string with addresses separated by a comma, no spaces (e.g. \"a@example.com,b@example.com\")."
  type        = string

  validation {
    condition     = can(regex("^[^@,\\s]+@[^@,\\s]+\\.[^@,\\s]+(,[^@,\\s]+@[^@,\\s]+\\.[^@,\\s]+)*$", var.contact_via_email_to_addresses))
    error_message = "Must be one or more email addresses separated by a comma, no spaces (e.g. \"a@example.com,b@example.com\")."
  }
}

variable "contact_via_email_subject" {
  description = "(Optional) Subject line of the notification email. Supports the same {{name}}/{{email}}/{{phone}}/{{message}} replacement tags as the template body. Default is `New message from the website - {{name}}`"
  type        = string
  default     = "New message from the website - {{name}}"
}

variable "contact_via_email_html_template" {
  description = "(Required) Content of the HTML body of the ContactViaEmail notification email, as a string. This module never bakes in a fixed template: the content varies per client, so it's passed in, typically via a `file(...)` call in the project that consumes this module (e.g. `file(\"$${path.module}/templates/contact.html\")`, pointing at a template file that lives in the consumer project, not in this module). Supports the SES replacement tags {{name}}, {{email}}, {{phone}}, {{message}}."
  type        = string
}

variable "contact_via_email_text_template" {
  description = "(Required) Content of the plain-text body of the ContactViaEmail notification email, as a string, passed in the same way as contact_via_email_html_template (typically via a `file(...)` call in the consumer project). Supports the same replacement tags."
  type        = string
}

variable "domain_name" {
  description = "(Required) Custom domain of the API (e.g. \"contact.trattoriadamario.it\")."
  type        = string
}

variable "route53_zone_id" {
  description = "(Required) ID of an existing Route 53 hosted zone for domain_name, used to validate the ACM certificate and to create the DNS alias record pointing to the API. This module never creates a hosted zone: pass in one that already exists."
  type        = string
}

variable "cors_allowed_origin" {
  description = "(Optional) Value of the Access-Control-Allow-Origin header returned by the API, including its CORS preflight response. Set it to the exact website origin (e.g. \"https://trattoriadamario.it\") once known; the wildcard default only unblocks local development. Default is `*`"
  type        = string
  default     = "*"
}

variable "throttling_rate_limit" {
  description = "(Optional) Steady-state request rate limit (requests per second) applied to the whole API, to protect the SES sending reputation of contact_via_email_source and the AWS bill from this unauthenticated public endpoint. Default is `5`"
  type        = number
  default     = 5
}

variable "throttling_burst_limit" {
  description = "(Optional) Burst request limit (concurrent requests) applied to the whole API. Default is `10`"
  type        = number
  default     = 10
}
