<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    href?: string
    type?: 'button' | 'submit'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false, loading: false },
)

const isLink = computed(() => Boolean(props.href))
const tag = computed(() => (isLink.value ? 'a' : 'button'))
</script>

<template>
  <component
    :is="tag"
    class="base-button"
    :class="[`base-button--${variant}`, { 'is-loading': loading }]"
    :href="href"
    :type="!isLink ? type : undefined"
    :disabled="!isLink && (disabled || loading)"
    :aria-disabled="isLink && (disabled || loading) ? 'true' : undefined"
    :target="isLink && href?.startsWith('http') ? '_blank' : undefined"
    :rel="isLink && href?.startsWith('http') ? 'noopener noreferrer' : undefined"
  >
    <span class="base-button__label"><slot /></span>
  </component>
</template>

<style scoped>
.base-button {
  --_bg: transparent;
  --_border: var(--color-neon-primary);
  --_color: var(--color-neon-primary);
  --_glow: var(--glow-primary);

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  font-weight: 600;
  line-height: 1;
  border-radius: var(--radius-sm);
  border: 1px solid var(--_border);
  background-color: var(--_bg);
  color: var(--_color);
  cursor: pointer;
  transition:
    box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    background-color var(--duration-base) var(--ease-out),
    color var(--duration-base) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);
}

.base-button--primary {
  --_bg: var(--color-neon-primary);
  --_border: var(--color-neon-primary);
  --_color: var(--color-on-neon);
  --_glow: var(--glow-primary-strong);
}

.base-button--secondary {
  --_bg: transparent;
  --_border: var(--color-neon-secondary);
  --_color: var(--color-neon-secondary);
  --_glow: var(--glow-secondary);
}

.base-button--ghost {
  --_bg: transparent;
  --_border: var(--color-border-strong);
  --_color: var(--color-text);
  --_glow: none;
}

.base-button:hover:not(:disabled):not([aria-disabled='true']) {
  box-shadow: var(--_glow);
  transform: translateY(-1px);
}

.base-button:active:not(:disabled):not([aria-disabled='true']) {
  transform: translateY(0);
}

.base-button:disabled,
.base-button[aria-disabled='true'] {
  opacity: 0.55;
  cursor: not-allowed;
}

.base-button.is-loading {
  cursor: progress;
}

@media (prefers-reduced-motion: reduce) {
  .base-button:hover:not(:disabled):not([aria-disabled='true']) {
    transform: none;
  }
}
</style>
