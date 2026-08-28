<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useContactForm } from '@/composables/useContactForm'

const { t } = useI18n()
const { values, errors, status, handleSubmit, resetStatusIfNeeded } = useContactForm()
</script>

<template>
  <section id="contact" v-reveal class="contact">
    <div class="container contact__inner">
      <SectionHeading
        :eyebrow="t('contact.eyebrow')"
        :title="t('contact.title')"
        :subtitle="t('contact.subtitle')"
      />

      <form class="contact__form" novalidate @submit.prevent="handleSubmit">
        <div class="contact__field">
          <label for="contact-name">{{ t('contact.form.nameLabel') }}</label>
          <input
            id="contact-name"
            v-model="values.name"
            type="text"
            name="name"
            autocomplete="name"
            :placeholder="t('contact.form.namePlaceholder')"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'contact-name-error' : undefined"
            @input="resetStatusIfNeeded"
          />
          <p v-if="errors.name" id="contact-name-error" class="contact__error">
            <AppIcon name="alert-circle" :size="14" />
            {{ t(`contact.form.validation.${errors.name}`) }}
          </p>
        </div>

        <div class="contact__field">
          <label for="contact-email">{{ t('contact.form.emailLabel') }}</label>
          <input
            id="contact-email"
            v-model="values.email"
            type="email"
            name="email"
            autocomplete="email"
            :placeholder="t('contact.form.emailPlaceholder')"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'contact-email-error' : undefined"
            @input="resetStatusIfNeeded"
          />
          <p v-if="errors.email" id="contact-email-error" class="contact__error">
            <AppIcon name="alert-circle" :size="14" />
            {{ t(`contact.form.validation.${errors.email}`) }}
          </p>
        </div>

        <div class="contact__field">
          <label for="contact-phone">{{ t('contact.form.phoneLabel') }}</label>
          <input
            id="contact-phone"
            v-model="values.phone"
            type="tel"
            name="phone"
            autocomplete="tel"
            :placeholder="t('contact.form.phonePlaceholder')"
            :aria-invalid="Boolean(errors.phone)"
            :aria-describedby="errors.phone ? 'contact-phone-error' : undefined"
            @input="resetStatusIfNeeded"
          />
          <p v-if="errors.phone" id="contact-phone-error" class="contact__error">
            <AppIcon name="alert-circle" :size="14" />
            {{ t(`contact.form.validation.${errors.phone}`) }}
          </p>
        </div>

        <div class="contact__field">
          <label for="contact-message">{{ t('contact.form.messageLabel') }}</label>
          <textarea
            id="contact-message"
            v-model="values.message"
            name="message"
            rows="5"
            :placeholder="t('contact.form.messagePlaceholder')"
            :aria-invalid="Boolean(errors.message)"
            :aria-describedby="errors.message ? 'contact-message-error' : undefined"
            @input="resetStatusIfNeeded"
          />
          <p v-if="errors.message" id="contact-message-error" class="contact__error">
            <AppIcon name="alert-circle" :size="14" />
            {{ t(`contact.form.validation.${errors.message}`) }}
          </p>
        </div>

        <BaseButton type="submit" variant="primary" :loading="status === 'loading'">
          <AppIcon v-if="status === 'loading'" name="loader" :size="18" class="contact__spinner" />
          {{ status === 'loading' ? t('contact.form.submitting') : t('contact.form.submit') }}
        </BaseButton>

        <p class="visually-hidden" role="status" aria-live="polite">
          <template v-if="status === 'success'">{{ t('contact.form.successMessage') }}</template>
          <template v-else-if="status === 'error'">{{ t('contact.form.errorMessage') }}</template>
        </p>

        <div v-if="status === 'success'" class="contact__banner contact__banner--success">
          <AppIcon name="check-circle" :size="18" />
          <div>
            <strong>{{ t('contact.form.successTitle') }}</strong>
            <p>{{ t('contact.form.successMessage') }}</p>
          </div>
        </div>

        <div v-else-if="status === 'error'" class="contact__banner contact__banner--error">
          <AppIcon name="alert-circle" :size="18" />
          <div>
            <strong>{{ t('contact.form.errorTitle') }}</strong>
            <p>{{ t('contact.form.errorMessage') }}</p>
          </div>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact {
  padding-block: var(--space-2xl);
}

.contact__inner {
  max-width: 640px;
}

.contact__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.contact__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.contact__field label {
  font-size: var(--fs-small);
  color: var(--color-text-muted);
}

.contact__field input,
.contact__field textarea {
  padding: var(--space-xs) var(--space-sm);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  resize: vertical;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.contact__field input::placeholder,
.contact__field textarea::placeholder {
  color: var(--color-text-dim);
}

.contact__field input:focus-visible,
.contact__field textarea:focus-visible {
  outline: none;
  border-color: var(--color-neon-primary);
  box-shadow: var(--glow-primary);
}

.contact__field input[aria-invalid='true'],
.contact__field textarea[aria-invalid='true'] {
  border-color: var(--color-neon-danger);
}

.contact__error {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
  color: var(--color-neon-danger);
  font-size: var(--fs-small);
}

.contact__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .contact__spinner {
    animation: none;
  }
}

.contact__banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--fs-small);
}

.contact__banner p {
  margin-top: var(--space-3xs);
  color: var(--color-text-muted);
}

.contact__banner--success {
  border: 1px solid rgba(var(--color-neon-success-rgb), 0.4);
  background-color: rgba(var(--color-neon-success-rgb), 0.08);
  color: var(--color-neon-success);
}

.contact__banner--error {
  border: 1px solid rgba(var(--color-neon-danger-rgb), 0.4);
  background-color: rgba(var(--color-neon-danger-rgb), 0.08);
  color: var(--color-neon-danger);
}
</style>
