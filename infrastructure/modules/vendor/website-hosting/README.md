# website-hosting

Creates the AWS infrastructure for static hosting of a SPA (Single Page
Application): a private S3 bucket as the origin, a CloudFront distribution
with Origin Access Control, an ACM certificate for the custom domain, and
DNS records in an existing Route 53 hosted zone.

The module never creates a Route 53 hosted zone: it expects to receive an
existing one via `route53_zone_id`.

## What it creates

- An S3 bucket (account-regional namespace by default, configurable via
  `s3_bucket_namespace`), private, versioned and
  server-side encrypted, with a policy that allows read access only to the
  CloudFront distribution via Origin Access Control, and a lifecycle
  configuration that expires old noncurrent object versions (keeping the
  most recent ones for rollbacks) and aborts incomplete multipart uploads.
- A CloudFront distribution with mandatory HTTPS, optional SPA behavior
  (403/404 redirected to `index.html`) and an ACM certificate for the
  custom domain.
- An ACM certificate (in us-east-1, required by CloudFront) validated via
  DNS, with its validation records in the hosted zone passed as input.
- A Route 53 A (alias) record pointing the domain at the CloudFront
  distribution.
- Optionally, when `redirect_domain_names` is set, a CloudFront Function
  that redirects those domains (e.g. `www.`) to `domain_name` with a 301,
  plus their certificate SANs, CloudFront aliases and Route 53 A (alias)
  records.
- Optionally, for statically generated sites with one prerendered HTML file
  per route, a custom error page (`error_page_path`), the same CloudFront
  Function rewriting pretty URLs to the flat `.html` files
  (`rewrite_html_pages`) and a response headers policy with security
  headers (`security_headers_enabled`).

## Notes

- The module doesn't configure an `aws` provider: whoever consumes it must
  pass both the default provider and an `aws.us_east_1` alias, required to
  request the ACM certificate used by CloudFront:

  ```hcl
  module "website" {
    source = "./vendor/website-hosting"

    providers = {
      aws            = aws
      aws.us_east_1  = aws.us_east_1
    }

    s3_bucket_name                        = "example-website-123456789012-eu-south-1-an"
    cloudfront_distribution_name          = "example-website"
    cloudfront_origin_access_control_name = "example-website-oac"
    s3_bucket_force_destroy               = false
    s3_bucket_versioning_enabled          = true
    domain_name                           = "example.it"
    route53_zone_id                       = "Z0123456789ABCDEFGHIJ"
  }
  ```

- A prerendered static site (flat files: `/contatti` is `contatti.html`,
  plus a `404.html`) needs no SPA fallback:

  ```hcl
  module "website" {
    # ... required arguments as above ...

    spa_mode                 = false
    error_page_path          = "/404.html"
    rewrite_html_pages       = true
    cloudfront_function_name = "example-website-viewer-request"

    security_headers_enabled                = true
    cloudfront_response_headers_policy_name = "example-website-security"
    content_security_policy                 = "default-src 'self'; frame-src https://www.google.com"
  }
  ```

  `error_page_path` and `spa_mode = true` are mutually exclusive. With
  `rewrite_html_pages`, `/contatti` and `/contatti/` are served from
  `/contatti.html`, `/` from `default_root_object`, and any path whose last
  segment contains a dot (assets, `sitemap.xml`) is left untouched. The
  redirect from `redirect_domain_names` and the rewrite share one
  CloudFront Function (CloudFront allows only one per behavior), the
  redirect running first. Without `content_security_policy` no CSP header
  is sent: a strict policy depends on what the site embeds.

- `cloudfront_redirect_function_name` is deprecated in favor of
  `cloudfront_function_name` but keeps working. The function resource was
  renamed internally with a `moved` block, so existing states are not
  affected.

- Changing `redirect_domain_names` on an existing site replaces the ACM
  certificate (its SANs are immutable). The replacement is created before
  the old one is destroyed, so the site stays reachable.

- The mandatory tags (`Project`, `Owner`, `Environment`, `ManagedBy`) come
  automatically from the `default_tags` of the provider in the project
  that consumes the module: the module doesn't declare its own `tags`
  variable.

## Reference

<!-- BEGIN_TF_DOCS -->
### Requirements

| Name | Version |
| ---- | ------- |
| terraform | >= 1.9.0 |
| aws | >= 6.37.0, < 7.0.0 |

### Providers

| Name | Version |
| ---- | ------- |
| aws | 6.68.0 |
| aws.us_east_1 | 6.68.0 |

### Inputs

| Name | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | :------: |
| cloudfront_distribution_name | Name of the CloudFront distribution (applied as its Name tag). | `string` | n/a | yes |
| cloudfront_origin_access_control_name | Name of the CloudFront Origin Access Control used to reach the S3 bucket. | `string` | n/a | yes |
| domain_name | Primary domain of the website (e.g. "trattoriadamario.it"). | `string` | n/a | yes |
| route53_zone_id | ID of the existing Route 53 hosted zone for domain_name. Used to validate the ACM certificate and to create the DNS alias record pointing to CloudFront. This module never creates a hosted zone: pass in one that already exists (e.g. the one AWS creates automatically when the domain is registered through Route 53 Domains). | `string` | n/a | yes |
| s3_bucket_force_destroy | Whether to force the deletion of the S3 bucket content during a tofu destroy. | `bool` | n/a | yes |
| s3_bucket_name | Name of the S3 bucket that stores the website content, used as is. With the `account-regional` namespace it must end with "-{accountId}-{region}-an": the caller is responsible for it. | `string` | n/a | yes |
| s3_bucket_versioning_enabled | Whether to enable versioning on the S3 bucket that stores the website content. | `bool` | n/a | yes |
| cloudfront_function_name | Name of the CloudFront viewer-request Function, created when redirect_domain_names is not empty and/or rewrite_html_pages is true. Required in those cases, unless the deprecated cloudfront_redirect_function_name is set. | `string` | `null` | no |
| cloudfront_redirect_function_name | Deprecated, use cloudfront_function_name. Still honored when cloudfront_function_name is not set. | `string` | `null` | no |
| cloudfront_response_headers_policy_name | Name of the CloudFront response headers policy. Required when security_headers_enabled is true. | `string` | `null` | no |
| content_security_policy | Value of the Content-Security-Policy header. When null the header is not sent: a strict policy depends on what the site embeds (iframes, fonts, scripts), so it is never forced. | `string` | `null` | no |
| default_root_object | Object served at the root of the website. | `string` | `"index.html"` | no |
| error_caching_min_ttl | Minimum time, in seconds, CloudFront caches the 403/404 answers mapped to error_page_path. Kept low so that a page published after a miss becomes reachable soon. | `number` | `10` | no |
| error_page_path | Path of the page served, with error_response_code, when the origin answers 403 or 404 (S3 with OAC answers 403 for a missing key), e.g. "/404.html". Takes the place of spa_mode, which must then be false. | `string` | `null` | no |
| error_response_code | HTTP status code returned together with error_page_path. | `number` | `404` | no |
| hsts_preload | Whether to add the preload directive to Strict-Transport-Security. Only enable it if the domain is meant for the browsers' HSTS preload list, which is hard to undo. | `bool` | `false` | no |
| permissions_policy | Value of the Permissions-Policy header (e.g. "camera=(), microphone=(), geolocation=()"). When null the header is not sent. | `string` | `null` | no |
| price_class | CloudFront price class. PriceClass_100 covers EU/US and is sufficient for local Italian clients. | `string` | `"PriceClass_100"` | no |
| redirect_domain_names | Additional domains (e.g. "www.trattoriadamario.it") that redirect with a 301 to domain_name, preserving path and query string. They are added to the ACM certificate and to the CloudFront aliases, and get their own alias records in the hosted zone, so they must belong to route53_zone_id. Wildcards are not supported. | `list(string)` | `[]` | no |
| rewrite_html_pages | If true, the viewer-request function serves prerendered pages stored as flat .html files: "/contatti" and "/contatti/" are rewritten to "/contatti.html" (query string preserved). "/" and any path whose last segment contains a dot are left untouched. Runs after the host redirect. | `bool` | `false` | no |
| s3_abort_incomplete_multipart_upload_days | Days after which incomplete multipart uploads in the S3 bucket are aborted. | `number` | `7` | no |
| s3_bucket_namespace | Namespace of the S3 bucket name: `account-regional` (the name is unique within the account and region and must carry the "-{accountId}-{region}-an" suffix) or `global`. | `string` | `"account-regional"` | no |
| s3_noncurrent_version_expiration_days | Days after which a noncurrent object version in the S3 bucket is permanently deleted, provided more than s3_noncurrent_versions_to_keep newer noncurrent versions exist. | `number` | `30` | no |
| s3_noncurrent_versions_to_keep | Number of noncurrent versions of each object always retained in the S3 bucket, regardless of their age, to allow rolling back a deploy. | `number` | `3` | no |
| security_headers_enabled | Whether to attach a response headers policy to the distribution that sets Strict-Transport-Security (one year, includeSubDomains), X-Content-Type-Options, Referrer-Policy (strict-origin-when-cross-origin) and X-Frame-Options (DENY). | `bool` | `false` | no |
| spa_mode | If true, configures 403/404 error responses -> index.html (required for Vue Router in history mode). | `bool` | `true` | no |

### Outputs

| Name | Description |
| ---- | ----------- |
| acm_certificate_arn | ARN of the validated ACM certificate (in us-east-1) issued for domain_name. |
| cloudfront_distribution_arn | ARN of the CloudFront distribution serving the website. |
| cloudfront_distribution_domain_name | Default domain name assigned by CloudFront to the distribution (e.g. d111111abcdef8.cloudfront.net). |
| cloudfront_distribution_hosted_zone_id | Route 53 hosted zone ID of the CloudFront distribution, used when creating alias records that point to it. |
| cloudfront_distribution_id | ID of the CloudFront distribution serving the website. |
| s3_bucket_arn | ARN of the S3 bucket that stores the website content. |
| s3_bucket_id | ID (name) of the S3 bucket that stores the website content. |
| s3_bucket_regional_domain_name | Regional domain name of the S3 bucket, used as the CloudFront origin. |
| website_url | Public HTTPS URL of the website. |
<!-- END_TF_DOCS -->
