import { afterEach, describe, expect, it, vi } from 'vitest'
import { useContactForm } from '../../website/src/composables/useContactForm'

describe('useContactForm', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('blocks submission and reports errors when fields are invalid', async () => {
    const { values, errors, status, handleSubmit } = useContactForm()
    values.name = ''
    values.email = 'not-an-email'
    values.message = ''

    await handleSubmit()

    expect(errors.value.name).toBe('nameRequired')
    expect(errors.value.email).toBe('emailInvalid')
    expect(errors.value.message).toBe('messageRequired')
    expect(status.value).toBe('idle')
  })

  it('moves to the error state when the backend is not configured', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', '')
    const { values, status, handleSubmit } = useContactForm()
    values.name = 'Ada Lovelace'
    values.email = 'ada@example.com'
    values.message = 'Hello, I would like to get in touch about a project.'

    await handleSubmit()

    expect(status.value).toBe('error')
  })

  it('moves to the success state and clears the form on a successful submission', async () => {
    vi.stubEnv('VITE_CONTACT_API_URL', 'https://api.example.com/contact')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    const { values, status, handleSubmit } = useContactForm()
    values.name = 'Ada Lovelace'
    values.email = 'ada@example.com'
    values.message = 'Hello, I would like to get in touch about a project.'

    await handleSubmit()

    expect(status.value).toBe('success')
    expect(values.name).toBe('')
    expect(values.email).toBe('')
    expect(values.message).toBe('')
  })

  it('resetStatusIfNeeded returns to idle from success/error but not from loading', () => {
    const { status, resetStatusIfNeeded } = useContactForm()

    status.value = 'success'
    resetStatusIfNeeded()
    expect(status.value).toBe('idle')

    status.value = 'error'
    resetStatusIfNeeded()
    expect(status.value).toBe('idle')

    status.value = 'loading'
    resetStatusIfNeeded()
    expect(status.value).toBe('loading')
  })
})
