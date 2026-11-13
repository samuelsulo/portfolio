import { describe, expect, it } from 'vitest'
import { isValidEmail, isValidPhone, validateContactForm } from '../../src/utils/validation'

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

describe('isValidPhone', () => {
  it('accepts well-formed phone numbers', () => {
    expect(isValidPhone('+39 333 1234567')).toBe(true)
    expect(isValidPhone('(02) 1234-5678')).toBe(true)
  })

  it('rejects malformed phone numbers', () => {
    expect(isValidPhone('abc')).toBe(false)
    expect(isValidPhone('123')).toBe(false)
  })
})

describe('validateContactForm', () => {
  const validValues = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '',
    message: 'Hello, I would like to get in touch about a project.',
  }

  it('returns no errors for valid input', () => {
    expect(validateContactForm(validValues)).toEqual({})
  })

  it('accepts a well-formed phone number', () => {
    expect(validateContactForm({ ...validValues, phone: '+39 333 1234567' })).toEqual({})
  })

  it('flags a malformed phone number', () => {
    const errors = validateContactForm({ ...validValues, phone: 'not-a-phone' })
    expect(errors.phone).toBe('phoneInvalid')
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
    const errors = validateContactForm({ name: '', email: '', phone: '', message: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name'])
  })

  it('reports the phone field too when it is invalid alongside others', () => {
    const errors = validateContactForm({ name: '', email: '', phone: 'not-a-phone', message: '' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'phone'])
  })
})
