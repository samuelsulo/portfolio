<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, persistLocale, type SupportedLocale } from '@/i18n'

const { locale, t } = useI18n()

function selectLocale(next: SupportedLocale) {
  if (locale.value === next) return
  locale.value = next
  persistLocale(next)
}
</script>

<template>
  <div class="language-switcher" role="group" :aria-label="t('nav.languageSwitcher')">
    <button
      v-for="code in SUPPORTED_LOCALES"
      :key="code"
      type="button"
      class="language-switcher__option"
      :class="{ 'is-active': locale === code }"
      :aria-pressed="locale === code"
      @click="selectLocale(code)"
    >
      {{ code.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  gap: var(--space-3xs);
}

.language-switcher__option {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.05em;
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.language-switcher__option:hover {
  color: var(--color-text);
}

.language-switcher__option.is-active {
  color: #04121a;
  background-color: var(--color-neon-primary);
}
</style>
