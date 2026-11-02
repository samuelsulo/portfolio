import type { ContactFormValues } from '@/utils/validation'

/**
 * Contact form submission.
 *
 * Backed by the `contact_api` module (API Gateway + SES), whose custom
 * domain is injected at build time as `VITE_CONTACT_API_URL` (see
 * `scripts/deploy.sh`, which reads it from the outputs of the website stack
 * in `infrastructure/live` rather than hardcoding it). The module exposes a
 * single operation, `POST /email`, so it's appended here rather than baked
 * into the configured base URL.
 *
 * If `VITE_CONTACT_API_URL` is unset (e.g. the `contact_api` module hasn't
 * been applied yet in an environment), submission fails predictably with
 * `ContactApiNotConfiguredError` so the UI surfaces its real error state
 * instead of a fake success.
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
  const baseUrl = import.meta.env.VITE_CONTACT_API_URL

  if (!baseUrl) {
    throw new ContactApiNotConfiguredError()
  }

  const response = await fetch(`${baseUrl}/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })

  if (!response.ok) {
    throw new ContactApiRequestError(response.status)
  }
}
