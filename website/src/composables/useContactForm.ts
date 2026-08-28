import { reactive, ref } from 'vue'
import { validateContactForm, type ContactFormErrors, type ContactFormValues } from '@/utils/validation'
import { submitContactForm } from '@/services/contactService'

export type ContactFormStatus = 'idle' | 'loading' | 'success' | 'error'

export function useContactForm() {
  const values = reactive<ContactFormValues>({ name: '', email: '', message: '' })
  const errors = ref<ContactFormErrors>({})
  const status = ref<ContactFormStatus>('idle')

  function resetStatusIfNeeded() {
    if (status.value === 'success' || status.value === 'error') {
      status.value = 'idle'
    }
  }

  async function handleSubmit(): Promise<void> {
    const validationErrors = validateContactForm(values)
    errors.value = validationErrors

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    status.value = 'loading'

    try {
      await submitContactForm(values)
      status.value = 'success'
      values.name = ''
      values.email = ''
      values.message = ''
    } catch {
      status.value = 'error'
    }
  }

  return { values, errors, status, handleSubmit, resetStatusIfNeeded }
}
