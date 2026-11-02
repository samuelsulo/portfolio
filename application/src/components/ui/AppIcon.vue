<script setup lang="ts">
/**
 * Small inline icon set used across the site. Kept as a single component
 * with static, internally-defined SVG markup rather than pulling in an
 * icon font/library, per the "no heavy dependency for something CSS/SVG can
 * do" rule.
 */
import { computed } from 'vue'

export type IconName =
  | 'cloud'
  | 'code'
  | 'infrastructure'
  | 'security'
  | 'github'
  | 'linkedin'
  | 'mail'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'external-link'
  | 'menu'
  | 'close'
  | 'check-circle'
  | 'alert-circle'
  | 'loader'
  | 'sun'
  | 'monitor'
  | 'moon'
  | 'lightbulb'
  | 'card'
  | 'qr'
  | 'browser'
  | 'palette'
  | 'map-pin'
  | 'link'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
  }>(),
  { size: 24 },
)

const paths: Record<IconName, string> = {
  cloud:
    '<path d="M6.5 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 16.9 7.2 4.5 4.5 0 0 1 17.5 16h-11z"/>',
  code: '<path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/>',
  infrastructure:
    '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/>',
  security:
    '<path d="M12 3 4.5 6v6c0 4.2 3 7.6 7.5 9 4.5-1.4 7.5-4.8 7.5-9V6L12 3Z"/><path d="m9.5 12 1.8 1.8L15 10"/>',
  github:
    '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.9-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.83-2.35 4.68-4.58 4.92.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>',
  linkedin:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7"/><path d="M7 7.5v.01"/><path d="M11 17v-4.5a2 2 0 0 1 4 0V17"/><path d="M11 10v7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'arrow-up': '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  'external-link':
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  close: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 5-5"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16v.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
  lightbulb:
    '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0 0 12 3z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 10h5"/><path d="M6 14h8"/>',
  qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M20 14v.01"/><path d="M14 20h3"/><path d="M20 17v4"/>',
  browser:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7 6.5h.01"/><path d="M10 6.5h.01"/>',
  palette:
    '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-1-.8-1.4-.8-2.3 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3z"/><path d="M7.5 11.5h.01"/><path d="M10 7.5h.01"/><path d="M14.5 7.5h.01"/>',
  'map-pin':
    '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.1 0l2.9-2.9a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1 0L4 13.9a5 5 0 0 0 7.1 7.1l1.2-1.2"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  loader:
    '<path d="M12 3v3"/><path d="m16.95 7.05 2.12-2.12"/><path d="M21 12h-3"/><path d="m16.95 16.95 2.12 2.12"/><path d="M12 18v3"/><path d="m7.05 16.95-2.12 2.12"/><path d="M3 12h3"/><path d="m7.05 7.05-2.12-2.12"/>',
}

const markup = computed(() => paths[props.name])
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="markup"
  />
</template>
