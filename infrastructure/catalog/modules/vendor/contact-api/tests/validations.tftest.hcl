mock_provider "aws" {}

mock_provider "aws" {
  alias = "dns"
}

variables {
  api_gateway_name                 = "example-contact"
  ses_template_name                = "example-contact"
  ses_integration_role_name        = "example-contact-ses"
  ses_integration_role_policy_name = "example-contact-ses"
  contact_via_email_source         = "noreply@example.it"
  contact_via_email_to_addresses   = "info@example.it"
  contact_via_email_html_template  = "<p>{{name}}: {{message}}</p>"
  contact_via_email_text_template  = "{{name}}: {{message}}"
  domain_name                      = "contact.example.it"
  route53_zone_id                  = "Z0123456789ABCDEFGHIJ"
}

run "single_recipient_is_accepted" {
  command = plan
}

run "multiple_recipients_are_accepted" {
  command = plan

  variables {
    contact_via_email_to_addresses = "info@example.it,owner@example.it"
  }
}

run "source_must_be_an_email_address" {
  command = plan

  variables {
    contact_via_email_source = "not-an-email"
  }

  expect_failures = [var.contact_via_email_source]
}

run "source_must_be_a_single_address" {
  command = plan

  variables {
    contact_via_email_source = "a@example.it,b@example.it"
  }

  expect_failures = [var.contact_via_email_source]
}

run "recipients_cannot_contain_spaces" {
  command = plan

  variables {
    contact_via_email_to_addresses = "info@example.it, owner@example.it"
  }

  expect_failures = [var.contact_via_email_to_addresses]
}

run "recipients_must_be_email_addresses" {
  command = plan

  variables {
    contact_via_email_to_addresses = "info@example.it,oops"
  }

  expect_failures = [var.contact_via_email_to_addresses]
}
