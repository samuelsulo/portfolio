output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website files (deploy target, read by scripts/deploy.sh)."
  value       = module.website.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution (needed to invalidate the cache after a deploy)."
  value       = module.website.cloudfront_distribution_id
}

output "website_url" {
  description = "Public URL of the website (custom domain if configured, otherwise the CloudFront domain)."
  value       = module.website.website_url
}

output "route53_zone_name_servers" {
  description = "Name servers of the Route 53 hosted zone, to be shared with the client if the domain is registered elsewhere."
  value       = module.website.route53_zone_name_servers
}
