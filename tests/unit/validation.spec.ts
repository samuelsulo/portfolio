import { describe, expect, it } from 'vitest'
import { isValidEmail, validateContactForm } from '../../website/src/utils/validation'

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('name@example.com')).toBe(true)
    expect(isValidEmail('  name@example.com  ')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('name@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('validateContactForm', () => {
  const validValues = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello, I would like to get in touch about a project.',
  }

  it('returns no errors for valid input', () => {
    expect(validateContactForm(validValues)).toEqual({})
  })

  it('flags a missing name', () => {
    const errors = validateContactForm({ ...validValues, name: '   ' })
    expect(errors.name).toBe('nameRequired')
  })

  it('flags a missing email', () => {
    const errors = validateContactForm({ ...validValues, email: '' })
    expect(errors.email).toBe('emailRequired')
  })

  it('flags an invalid email', () => {
    const errors = validateContactForm({ ...validValues, email: 'not-an-email' })
    expect(errors.email).toBe('emailInvalid')
  })

  it('flags a missing message', () => {
    const errors = validateContactForm({ ...validValues, message: '' })
    expect(errors.message).toBe('messageRequired')
  })

  it('flags a message that is too short', () => {
    const errors = validateContactForm({ ...validValues, message: 'hi' })
    expect(errors.message).toBe('messageTooShort')
  })

  it('reports every invalid field at once', () => {
    const errors = validateContactForm({ name: '', email: '', message: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name'])
  })
})
