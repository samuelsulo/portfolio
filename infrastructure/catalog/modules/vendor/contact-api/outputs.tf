output "rest_api_id" {
  description = "ID of the API Gateway REST API."
  value       = aws_api_gateway_rest_api.this.id
}

output "execution_arn" {
  description = "Execution ARN of the REST API, needed to grant other AWS services permission to invoke it."
  value       = aws_api_gateway_rest_api.this.execution_arn
}

output "invoke_url" {
  description = "Default execute-api.amazonaws.com invoke URL of the deployed stage (always available, independent of the custom domain)."
  value       = aws_api_gateway_stage.this.invoke_url
}

output "custom_domain_name" {
  description = "Custom domain configured for the API."
  value       = aws_api_gateway_domain_name.this.domain_name
}

output "contact_email_url" {
  description = "Public URL of the ContactViaEmail operation (POST /email)."
  value       = "https://${var.domain_name}/email"
}

output "ses_template_name" {
  description = "Name of the SES template used to render the ContactViaEmail notification."
  value       = aws_ses_template.contact.name
}

output "ses_identity_arn" {
  description = "ARN of the verified SES email identity (contact_via_email_source), used as the Source of every notification."
  value       = aws_ses_email_identity.source.arn
}
