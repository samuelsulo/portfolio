# Operations guide

Running the portfolio once it is live. It is a static site with no servers, so most of the
work is keeping content current and noticing when something breaks.

## Monitoring

The AWS budgets are configured in the account itself, outside this repository (so they are not in the infrastructure code). Nothing else alerts on the site, so the checks are manual:

- Open the site after every deploy: home, a work page, the contact form.
- Read the version live: `aws s3 cp s3://<bucket>/_version -` (and `_content_version`).
- Send a test message from the contact form now and then, since a delivery failure is
  invisible from the site.

## Routine tasks

| Task                                           | When                                 | How                                                                                           |
| ---------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Update a certification (new, renewed, expired) | When it changes                      | Edit `certifications.json`, set `status`, add the texts in both languages, deploy the content |
| Keep the CV aligned with the site              | When skills or certifications change | Edit `cv/samuelsulo-cv.json`, `npm run cv`, deploy the content                                |
| Review dependency updates                      | When Dependabot opens a pull request | Check CI, merge, then release the application                                                 |

The domain is registered in Route 53 with automatic renewal, and the TLS certificates are
renewed by ACM automatically as long as the DNS validation records exist: neither needs a
routine task. Check once a year that the payment method of the account is still valid.

## Troubleshooting

| Symptom                                    | Likely cause                                                       | What to do                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Site shows "could not be loaded"           | Application and content schema differ                              | Deploy the matching application, see [deployment](../deployment/deploying.md#when-the-content-schema-changes) |
| A content change does not show             | The browser or CloudFront still has the old file                   | Content is versioned by `content/manifest.json`, see [caching](../technical/application.md#loading-and-caching). Check the deploy finished (it publishes the manifest last) |
| Contact form shows an error                | The API URL is missing from the build, or SES rejected the message | Check the `VITE_CONTACT_API_URL` the deploy used and the SES identity is still verified                       |
| Contact form succeeds but no email arrives | SES accepted it (a `202` only means queued)                        | Check the spam folder and the SES account status                                                              |
| A deploy script refuses to run             | The bucket has no content yet, or the tag is missing               | Run the content deploy first, or create the tag                                                               |

## Changing production

Infrastructure changes follow [the deployment guide](../deployment/deploying.md): read the
plan, apply, then verify.
