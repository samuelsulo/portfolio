<script setup lang="ts">
/**
 * Kitsune
 *
 * A small stylized low-poly fox mark used as a company "signature" on
 * sites and apps built by the author. Purely decorative (no link, no
 * interaction): it identifies the work without asking anything of the
 * visitor.
 *
 * Self-contained by design so it can be dropped into other projects as-is:
 * every color is a prop, so it can be retuned to match a different site's
 * palette without touching the component's markup.
 */
const props = withDefaults(
  defineProps<{
    /** Overall size in pixels (icon is square). */
    size?: number
    /** Lightest facet shade (top-left, "lit" side of the fox). */
    colorLight?: string
    /** Base/mid facet shade. */
    colorMid?: string
    /** Darkest facet shade (bottom-right, "shadow" side of the fox). */
    colorDark?: string
    /** Small accent color for the nose facet. */
    colorAccent?: string
    /** Badge backdrop fill. Set to 'none' to render the fox with no circle. */
    badgeFill?: string
    /** Badge backdrop border color. */
    badgeBorder?: string
    /** Resting opacity; the mark brightens on hover/focus. */
    restOpacity?: number
    /** Accessible name / native tooltip text. */
    label?: string
  }>(),
  {
    size: 36,
    colorLight: '#cdb8ff',
    colorMid: '#a374ff',
    colorDark: '#7952d1',
    colorAccent: '#5be3d9',
    badgeFill: 'rgba(163, 116, 255, 0.12)',
    badgeBorder: 'rgba(163, 116, 255, 0.35)',
    restOpacity: 0.65,
    label: 'Kitsune',
  },
)
</script>

<template>
  <span
    class="kitsune"
    role="img"
    :aria-label="props.label"
    :title="props.label"
    :style="{
      '--kitsune-size': `${props.size}px`,
      '--kitsune-rest-opacity': props.restOpacity,
    }"
  >
    <svg viewBox="0 0 100 100" class="kitsune__svg" aria-hidden="true">
      <circle
        v-if="props.badgeFill !== 'none'"
        cx="50"
        cy="52"
        r="44"
        :fill="props.badgeFill"
        :stroke="props.badgeBorder"
        stroke-width="1.5"
      />

      <!-- ears -->
      <polygon points="22,22 27,46 41,40" :fill="props.colorLight" />
      <polygon points="78,22 73,46 59,40" :fill="props.colorDark" />

      <!-- forehead, between the ears -->
      <polygon points="41,40 50,30 59,40 50,55" :fill="props.colorMid" />

      <!-- cheeks -->
      <polygon points="27,46 41,40 50,55 38,78 24,60" :fill="props.colorMid" />
      <polygon points="73,46 59,40 50,55 62,78 76,60" :fill="props.colorDark" />

      <!-- muzzle, laid over the cheeks -->
      <polygon points="50,55 38,78 50,86 62,78" :fill="props.colorLight" />

      <!-- nose -->
      <polygon points="46,80 54,80 50,88" :fill="props.colorAccent" />
    </svg>
  </span>
</template>

<style scoped>
.kitsune {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--kitsune-size);
  height: var(--kitsune-size);
  opacity: var(--kitsune-rest-opacity);
  cursor: default;
  transition:
    opacity var(--duration-fast, 150ms) var(--ease-out, ease),
    transform var(--duration-fast, 150ms) var(--ease-out, ease),
    filter var(--duration-fast, 150ms) var(--ease-out, ease);
}

.kitsune:hover,
.kitsune:focus-visible {
  opacity: 1;
  transform: scale(1.08);
  filter: drop-shadow(0 0 6px rgba(var(--color-neon-primary-rgb), 0.55));
}

.kitsune__svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
