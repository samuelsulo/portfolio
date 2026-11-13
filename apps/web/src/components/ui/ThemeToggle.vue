<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon, { type IconName } from '@/components/ui/AppIcon.vue'
import { THEME_MODES, useTheme, type ThemeMode } from '@/composables/useTheme'

const { t } = useI18n()
const { mode, setMode } = useTheme()

const icons: Record<ThemeMode, IconName> = { light: 'sun', system: 'monitor', dark: 'moon' }
</script>

<template>
  <div class="theme-toggle" role="group" :aria-label="t('nav.theme.label')">
    <button
      v-for="option in THEME_MODES"
      :key="option"
      type="button"
      class="theme-toggle__option"
      :class="{ 'is-active': mode === option }"
      :aria-pressed="mode === option"
      :aria-label="t(`nav.theme.${option}`)"
      :title="t(`nav.theme.${option}`)"
      @click="setMode(option)"
    >
      <AppIcon :name="icons[option]" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3xs);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  gap: var(--space-3xs);
}

.theme-toggle__option {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.theme-toggle__option:hover {
  color: var(--color-text);
}

.theme-toggle__option.is-active {
  color: var(--color-on-neon);
  background-color: var(--color-neon-primary);
}
</style>
