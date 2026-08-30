output "s3_bucket_id" {
  description = "ID (name) of the S3 bucket that stores the website content."
  value       = aws_s3_bucket.this.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket that stores the website content."
  value       = aws_s3_bucket.this.arn
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket, used as the CloudFront origin."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution serving the website."
  value       = aws_cloudfront_distribution.this.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution serving the website."
  value       = aws_cloudfront_distribution.this.arn
}

output "cloudfront_distribution_domain_name" {
  description = "Default domain name assigned by CloudFront to the distribution (e.g. d111111abcdef8.cloudfront.net)."
  value       = aws_cloudfront_distribution.this.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "Route 53 hosted zone ID of the CloudFront distribution, used when creating alias records that point to it."
  value       = aws_cloudfront_distribution.this.hosted_zone_id
}

output "acm_certificate_arn" {
  description = "ARN of the validated ACM certificate (in us-east-1) issued for domain_name."
  value       = aws_acm_certificate_validation.this.certificate_arn
}

output "website_url" {
  description = "Public HTTPS URL of the website."
  value       = "https://${var.domain_name}"
}
