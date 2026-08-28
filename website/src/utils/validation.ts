/**
 * Framework-free validation helpers for the contact form. Kept separate from
 * the composable so the rules can be unit tested in isolation.
 */

export interface ContactFormValues {
  name: string
  email: string
  message: string
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MESSAGE_MIN_LENGTH = 10

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

/**
 * Validates the contact form values and returns a map of field -> i18n
 * message key (under `contact.form.validation`), left empty for valid
 * fields. Translating the keys is left to the caller so this module has no
 * dependency on vue-i18n.
 */
export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'nameRequired'
  }

  if (!values.email.trim()) {
    errors.email = 'emailRequired'
  } else if (!isValidEmail(values.email)) {
    errors.email = 'emailInvalid'
  }

  if (!values.message.trim()) {
    errors.message = 'messageRequired'
  } else if (values.message.trim().length < MESSAGE_MIN_LENGTH) {
    errors.message = 'messageTooShort'
  }

  return errors
}
