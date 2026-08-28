import type { ContactFormValues } from '@/utils/validation'

/**
 * Contact form submission.
 *
 * PENDING BACKEND: this project currently ships as a static site (S3 +
 * CloudFront) with no server-side component. The contact form is fully
 * built (validation, states, accessibility) but wired to call a backend
 * endpoint that does not exist yet: an AWS API Gateway + Lambda + SES stack
 * is planned for a later phase, and adding it is an architectural change
 * that needs explicit review before being provisioned (see CLAUDE.md,
 * section 11).
 *
 * Until `VITE_CONTACT_API_URL` is configured, submission fails predictably
 * with `ContactApiNotConfiguredError` so the UI surfaces its real error
 * state instead of a fake success.
 */

export class ContactApiNotConfiguredError extends Error {
  constructor() {
    super('Contact API endpoint is not configured (VITE_CONTACT_API_URL is unset).')
    this.name = 'ContactApiNotConfiguredError'
  }
}

export class ContactApiRequestError extends Error {
  constructor(public readonly status: number) {
    super(`Contact API request failed with status ${status}.`)
    this.name = 'ContactApiRequestError'
  }
}

export async function submitContactForm(values: ContactFormValues): Promise<void> {
  const endpoint = import.meta.env.VITE_CONTACT_API_URL

  if (!endpoint) {
    throw new ContactApiNotConfiguredError()
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new ContactApiRequestError(response.status)
  }
}
