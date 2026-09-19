output "s3_bucket_id" {
  description = "ID (name) of the S3 bucket that stores the website content."
  value       = module.website_hosting.s3_bucket_id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution serving the website."
  value       = module.website_hosting.cloudfront_distribution_id
}

output "contact_api_url" {
  description = "Base URL of the contact_api module's custom domain, used as the website's VITE_CONTACT_API_URL."
  value       = "https://${module.contact_api.custom_domain_name}"
}
