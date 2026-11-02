# S3 bucket where the website will be stored
resource "aws_s3_bucket" "this" {
  bucket           = var.s3_bucket_name
  bucket_namespace = var.s3_bucket_namespace
  force_destroy    = var.s3_bucket_force_destroy

  tags = {
    Name = var.s3_bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = var.s3_bucket_versioning_enabled ? "Enabled" : "Suspended"
  }
}

# Old object versions pile up with every deploy: keep a few for rollbacks and
# expire the rest, and clean up abandoned multipart uploads
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days           = var.s3_noncurrent_version_expiration_days
      newer_noncurrent_versions = var.s3_noncurrent_versions_to_keep
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = var.s3_abort_incomplete_multipart_upload_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.this]
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.this.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

# ACM - SSL certificate (must be in us-east-1 for CloudFront), validated via
# the DNS records created in the hosted zone passed in through route53_zone_id
resource "aws_acm_certificate" "this" {
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = var.redirect_domain_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "this" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.this.arn

  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "alias" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "redirect_alias" {
  for_each = toset(var.redirect_domain_names)

  zone_id = var.route53_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.this.domain_name
    zone_id                = aws_cloudfront_distribution.this.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudFront allows a single viewer-request function per cache behavior, so
# the host redirect (additional domains -> domain_name, 301) and the rewrite of
# prerendered pages share one function: the redirect runs first
locals {
  has_redirect  = length(var.redirect_domain_names) > 0
  function_name = var.cloudfront_function_name != null ? var.cloudfront_function_name : var.cloudfront_redirect_function_name

  # S3 with OAC answers 403 for a missing key, so both codes are mapped
  error_responses = (
    var.error_page_path != null ? [
      for code in [403, 404] : {
        error_code            = code
        response_code         = var.error_response_code
        response_page_path    = var.error_page_path
        error_caching_min_ttl = var.error_caching_min_ttl
      }
      ] : var.spa_mode ? [
      for code in [403, 404] : {
        error_code            = code
        response_code         = 200
        response_page_path    = "/index.html"
        error_caching_min_ttl = null
      }
    ] : []
  )
}

moved {
  from = aws_cloudfront_function.redirect
  to   = aws_cloudfront_function.viewer_request
}

resource "aws_cloudfront_function" "viewer_request" {
  count = local.has_redirect || var.rewrite_html_pages ? 1 : 0

  name    = local.function_name
  runtime = "cloudfront-js-2.0"
  comment = join("; ", compact([
    local.has_redirect ? "Redirects ${join(", ", var.redirect_domain_names)} to ${var.domain_name}" : "",
    var.rewrite_html_pages ? "Rewrites prerendered pages to .html" : "",
  ]))
  publish = true
  code = templatefile("${path.module}/templates/viewer_request.js.tftpl", {
    domain_name        = var.domain_name
    has_redirect       = local.has_redirect
    rewrite_html_pages = var.rewrite_html_pages
  })
}

# Security response headers, attached to the default cache behavior
resource "aws_cloudfront_response_headers_policy" "security" {
  count = var.security_headers_enabled ? 1 : 0

  name    = var.cloudfront_response_headers_policy_name
  comment = "Security response headers for ${var.domain_name}"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = var.hsts_preload
      override                   = true
    }

    content_type_options {
      override = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    dynamic "content_security_policy" {
      for_each = var.content_security_policy != null ? [var.content_security_policy] : []
      content {
        content_security_policy = content_security_policy.value
        override                = true
      }
    }
  }

  dynamic "custom_headers_config" {
    for_each = var.permissions_policy != null ? [var.permissions_policy] : []
    content {
      items {
        header   = "Permissions-Policy"
        value    = custom_headers_config.value
        override = true
      }
    }
  }
}

# CloudFront - distribution (HTTPS required, OAC towards S3)
resource "aws_cloudfront_origin_access_control" "this" {
  name                              = var.cloudfront_origin_access_control_name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Managed policy that honors the Cache-Control sent by the origin (TTL between
# 1 second and 1 year, 1 day by default) and doesn't forward query strings,
# cookies or headers to S3
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "this" {
  enabled             = true
  default_root_object = var.default_root_object
  price_class         = var.price_class
  aliases             = concat([var.domain_name], var.redirect_domain_names)

  tags = {
    Name = var.cloudfront_distribution_name
  }

  origin {
    domain_name              = aws_s3_bucket.this.bucket_regional_domain_name
    origin_id                = var.s3_bucket_name
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = var.s3_bucket_name
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    dynamic "function_association" {
      for_each = aws_cloudfront_function.viewer_request
      content {
        event_type   = "viewer-request"
        function_arn = function_association.value.arn
      }
    }

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = one(aws_cloudfront_response_headers_policy.security[*].id)
  }

  dynamic "custom_error_response" {
    for_each = local.error_responses
    content {
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.this.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
