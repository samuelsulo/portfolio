# website-hosting

Creates the AWS infrastructure for static hosting of a SPA (Single Page
Application): a private S3 bucket as the origin, a CloudFront distribution
with Origin Access Control, an ACM certificate for the custom domain, and
DNS records in an existing Route 53 hosted zone.

The module never creates a Route 53 hosted zone: it expects to receive an
existing one via `route53_zone_id`.

## What it creates

- An S3 bucket (account-regional namespace), private, versioned and
  server-side encrypted, with a policy that allows read access only to the
  CloudFront distribution via Origin Access Control.
- A CloudFront distribution with mandatory HTTPS, optional SPA behavior
  (403/404 redirected to `index.html`) and an ACM certificate for the
  custom domain.
- An ACM certificate (in us-east-1, required by CloudFront) validated via
  DNS, with its validation records in the hosted zone passed as input.
- A Route 53 A (alias) record pointing the domain at the CloudFront
  distribution.

## Input

| Name | Description | Required |
| --- | --- | --- |
| `name_prefix` | Prefix applied to the name of every resource created by the module. | Yes |
| `s3_bucket_force_destroy` | Whether to force deletion of the S3 bucket content during a `terraform destroy`. | Yes |
| `s3_bucket_versioning_enabled` | Whether to enable versioning on the S3 bucket that stores the website content. | Yes |
| `domain_name` | Primary domain of the site (e.g. `trattoriadamario.it`). | Yes |
| `route53_zone_id` | ID of an existing Route 53 hosted zone for `domain_name`. | Yes |
| `price_class` | CloudFront price class. Default `PriceClass_100`. | No |
| `default_root_object` | Object served at the root of the site. Default `index.html`. | No |
| `spa_mode` | Whether to configure 403/404 error responses towards `index.html` (required for a SPA router in history mode). Default `true`. | No |

## Output

| Name | Description |
| --- | --- |
| `s3_bucket_id` | ID (name) of the S3 bucket holding the site content. |
| `s3_bucket_arn` | ARN of the S3 bucket. |
| `s3_bucket_regional_domain_name` | Regional domain name of the bucket, used as the CloudFront origin. |
| `cloudfront_distribution_id` | ID of the CloudFront distribution. |
| `cloudfront_distribution_arn` | ARN of the CloudFront distribution. |
| `cloudfront_distribution_domain_name` | Default domain assigned by CloudFront to the distribution. |
| `cloudfront_distribution_hosted_zone_id` | CloudFront's hosted zone ID, useful for creating further alias records. |
| `acm_certificate_arn` | ARN of the validated ACM certificate for `domain_name`. |
| `website_url` | Public HTTPS URL of the site. |

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

    name_prefix                  = "example"
    s3_bucket_force_destroy      = false
    s3_bucket_versioning_enabled = true
    domain_name                  = "example.it"
    route53_zone_id              = "Z0123456789ABCDEFGHIJ"
  }
  ```

- The mandatory tags (`Project`, `Environment`, `ManagedBy`) come
  automatically from the `default_tags` of the provider in the project
  that consumes the module: the module doesn't declare its own `tags`
  variable.
