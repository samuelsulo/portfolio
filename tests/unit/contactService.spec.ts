import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ContactApiNotConfiguredError,
  ContactApiRequestError,
  submitContactForm,
} from '../../website/src/services/contactService'

const sampleValues = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '',
  message: 'Hello, I would like to get in touch about a project.',
}

describe('submitContactForm', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('throws ContactApiNotConfiguredError when no endpoint is configured', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')

    await expect(submitContactForm(sampleValues)).rejects.toBeInstanceOf(ContactApiNotConfiguredError)
  })

  it('posts the form values as JSON to the /email operation of the configured endpoint', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', 'https://api.example.com')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 })
    vi.stubGlobal('fetch', fetchMock)

    await submitContactForm(sampleValues)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/email',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleValues),
      }),
    )
  })

  it('throws ContactApiRequestError when the backend responds with an error status', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', 'https://api.example.com')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(submitContactForm(sampleValues)).rejects.toBeInstanceOf(ContactApiRequestError)
  })
})
