# website

The portfolio website: the static site ([`website-hosting`](../../units/website-hosting)) and
the API of its contact form ([`contact-api`](../../units/contact-api)), in one account and region.

## Values

| Value | Required | Description |
|---|---|---|
| `domain_name` | yes | Domain of the website. Also the CORS origin of the contact API. |
| `contact_domain_name` | yes | Custom domain of the contact API (e.g. `contact.<domain_name>`). |
| `email` | yes | Mailbox that receives the contact form, also the verified SES identity. |
| `route53_zone_id` | yes | ID of the hosted zone of the domain, in the network-hub account. |
| `s3_bucket_force_destroy` | no | Let `destroy` empty the website bucket. Default `false`. |
