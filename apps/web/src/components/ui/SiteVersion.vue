<script setup lang="ts">
/**
 * SiteVersion
 *
 * Displays the deployed version of the site, injected at build time via the
 * VITE_APP_VERSION environment variable (see scripts/deploy.sh): a
 * release tag in production, the deployed commit's short SHA in every other
 * environment. Falls back to "dev" when unset, i.e. a local dev server run
 * where no version is injected.
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const version = import.meta.env.VITE_APP_VERSION || 'dev'
</script>

<template>
  <span class="site-version">{{ t('footer.version', { version }) }}</span>
</template>

<style scoped>
.site-version {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--color-text-dim);
}
</style>
