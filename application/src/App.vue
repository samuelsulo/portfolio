<script setup lang="ts">
import { computed, nextTick, ref, watch, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/layout/NavBar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { getContent } from '@/content'

const { t, locale } = useI18n()
const route = useRoute()
const main = ref<HTMLElement | null>(null)

// The title of the work being viewed, if the current route is a work page.
const workTitle = computed(() => {
  if (route.name !== 'work') return null
  const project = getContent().projects.find((item) => item.id === route.params.id)
  return project ? t(`${project.translationKey}.title`) : null
})

// Keep <html lang>, the document title and its meta description in sync
// with the active language and page for SEO and accessibility.
watchEffect(() => {
  document.documentElement.lang = locale.value
  const pageTitle = route.name === 'explore' ? t('explore.title') : workTitle.value
  document.title = pageTitle ? `${pageTitle} | Samuel Sulo` : t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
})

// In a single-page app a navigation does not reload the page, so keyboard and
// screen reader users would stay where they were. Move focus to the new page's
// content when the path changes (not for in-page anchors like #projects).
watch(
  () => route.path,
  async (_next, previous) => {
    if (!previous || route.hash) return
    await nextTick()
    main.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <NavBar />
  <main id="main-content" ref="main" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
</template>
