output "bucket_name" {
  description = "Name of the S3 bucket hosting the website files (deploy target)."
  value       = aws_s3_bucket.this.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution (needed to invalidate the cache after a deploy)."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_domain_name" {
  description = "*.cloudfront.net domain automatically assigned to the distribution."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "website_url" {
  description = "Public URL of the website (custom domain if configured, otherwise the CloudFront domain)."
  value       = local.use_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.this.domain_name}"
}

output "route53_zone_id" {
  description = "ID of the Route 53 hosted zone actually in use (newly created or the existing one passed via route53_zone_id), or null if DNS is not managed by this module."
  value       = local.route53_zone_id
}

output "route53_zone_name_servers" {
  description = "Name servers of the newly created Route 53 hosted zone, to be shared with the client if the domain is registered elsewhere. Empty when reusing an existing zone (route53_zone_id) or when DNS is not managed by this module - the client already has those name servers in that case."
  value       = local.use_new_zone ? aws_route53_zone.this[0].name_servers : []
}
