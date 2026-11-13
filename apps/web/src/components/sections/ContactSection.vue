<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useContactForm } from '@/composables/useContactForm'
import { assetUrl, getContent } from '@/content'
import { resolveCvUrl } from '@/utils/cv'

const { t, locale } = useI18n()
const config = getContent().siteConfig
const cvUrl = computed(() => {
  const path = resolveCvUrl(config.cvUrl, locale.value)
  return path ? assetUrl(path) : null
})
const { values, errors, status, handleSubmit, resetStatusIfNeeded } = useContactForm()

// Honeypot: a field real visitors never see. Bots that fill it get a fake
// success and nothing is sent.
const honeypot = ref('')

function onSubmit() {
  if (honeypot.value) {
    status.value = 'success'
    return
  }
  void handleSubmit()
}

// "Copied" confirmation for the email address button.
const copied = ref(false)
const emailText = ref<HTMLElement | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(config.email)
  } catch {
    // Clipboard API refused (older browsers, some embedded views): select the
    // address so it can be copied by hand.
    const range = document.createRange()
    if (emailText.value) range.selectNodeContents(emailText.value)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    return
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
}

onUnmounted(() => clearTimeout(copiedTimer))
</script>

<template>
  <section id="contact" v-reveal class="contact">
    <div class="container">
      <div class="contact__panel">
        <div class="contact__intro">
          <span class="contact__eyebrow">{{ t('contact.eyebrow') }}</span>
          <h2 class="contact__title">{{ t('contact.title') }}</h2>
          <p class="contact__subtitle">{{ t('contact.subtitle') }}</p>
        </div>

        <div class="contact__mail">
          <code ref="emailText" class="contact__email">{{ config.email }}</code>
          <button type="button" class="contact__copy" @click="copyEmail">
            {{ copied ? t('contact.copied') : t('contact.copy') }}
          </button>
          <span class="visually-hidden" role="status" aria-live="polite">
            {{ copied ? t('contact.copiedAnnouncement') : '' }}
          </span>
        </div>

        <div class="contact__links">
          <a
            v-if="cvUrl"
            class="contact__link"
            :href="cvUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('hero.ctaCv') }}
            <AppIcon name="external-link" :size="16" />
          </a>
          <a
            class="contact__link"
            :href="config.social.github"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="github" :size="16" />
            GitHub
          </a>
          <a
            class="contact__link"
            :href="config.social.linkedin"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="linkedin" :size="16" />
            LinkedIn
          </a>
        </div>

        <details class="contact__details">
          <summary>{{ t('contact.formToggle') }}</summary>

          <form class="contact__form" novalidate @submit.prevent="onSubmit">
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

            <input
              v-model="honeypot"
              class="contact__trap"
              type="text"
              name="website"
              tabindex="-1"
              autocomplete="off"
              aria-hidden="true"
            />

            <BaseButton type="submit" variant="primary" :loading="status === 'loading'">
              <AppIcon
                v-if="status === 'loading'"
                name="loader"
                :size="18"
                class="contact__spinner"
              />
              {{ status === 'loading' ? t('contact.form.submitting') : t('contact.form.submit') }}
            </BaseButton>

            <p class="visually-hidden" role="status" aria-live="polite">
              <template v-if="status === 'success'">{{
                t('contact.form.successMessage')
              }}</template>
              <template v-else-if="status === 'error'">{{
                t('contact.form.errorMessage')
              }}</template>
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
        </details>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  padding-block: var(--space-2xl);
}

/* A dark "ink" panel in both themes, as an anchor at the end of the page. */
.contact__panel {
  position: relative;
  display: grid;
  gap: var(--space-md);
  overflow: hidden;
  padding: var(--space-lg);
  border: 1px solid var(--color-ink-line);
  border-radius: var(--radius-md);
  background-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  color: var(--color-ink-text);
}

.contact__panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(50% 80% at 100% 0%, rgba(53, 230, 255, 0.16), transparent 70%);
  pointer-events: none;
}

.contact__panel > * {
  position: relative;
}

.contact__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-accent);
}

.contact__eyebrow::before {
  content: '';
  width: 26px;
  height: 2px;
  background-color: var(--color-ink-accent);
}

.contact__title {
  margin-top: var(--space-xs);
  font-size: var(--fs-h2);
}

.contact__subtitle {
  margin-top: var(--space-2xs);
  color: var(--color-ink-dim);
}

.contact__mail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.contact__email {
  font-family: var(--font-mono);
  font-size: clamp(1.05rem, 2.6vw, 1.6rem);
  word-break: break-all;
  user-select: all;
}

.contact__copy {
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-ink-line);
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-ink-text);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  cursor: pointer;
}

.contact__copy:hover {
  border-color: var(--color-ink-accent);
}

.contact__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.contact__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-ink-line);
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 500;
}

.contact__link:hover {
  border-color: var(--color-ink-accent);
}

.contact__details {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-ink-line);
}

.contact__details summary {
  width: fit-content;
  color: var(--color-ink-accent);
  font-family: var(--font-mono);
  font-size: var(--fs-small);
  cursor: pointer;
  list-style: none;
}

.contact__details summary::-webkit-details-marker {
  display: none;
}

.contact__details summary::before {
  content: '+ ';
}

.contact__details[open] summary::before {
  content: '\2212 ';
}

.contact__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 640px;
  margin-top: var(--space-md);
}

.contact__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.contact__field label {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-dim);
}

.contact__field input,
.contact__field textarea {
  padding: var(--space-xs) var(--space-sm);
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-ink-line);
  border-radius: var(--radius-sm);
  color: var(--color-ink-text);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  resize: vertical;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.contact__field input::placeholder,
.contact__field textarea::placeholder {
  color: var(--color-ink-dim);
}

.contact__field input:focus-visible,
.contact__field textarea:focus-visible {
  outline: none;
  border-color: var(--color-ink-accent);
  box-shadow: 0 0 0 1px var(--color-ink-accent);
}

.contact__field input[aria-invalid='true'],
.contact__field textarea[aria-invalid='true'] {
  border-color: #ff5470;
}

.contact__trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.contact__error {
  display: flex;
  align-items: center;
  gap: var(--space-3xs);
  color: #ff7d92;
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
  color: var(--color-ink-dim);
}

.contact__banner--success {
  border: 1px solid rgba(69, 240, 166, 0.4);
  background-color: rgba(69, 240, 166, 0.08);
  color: #45f0a6;
}

.contact__banner--error {
  border: 1px solid rgba(255, 84, 112, 0.4);
  background-color: rgba(255, 84, 112, 0.08);
  color: #ff7d92;
}
</style>
