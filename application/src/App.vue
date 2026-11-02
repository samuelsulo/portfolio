<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/layout/NavBar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import projectsData from '@/data/projects.json'
import type { ProjectItem } from '@/types/content'

const { t, locale } = useI18n()
const route = useRoute()

// The title of the work being viewed, if the current route is a work page.
const workTitle = computed(() => {
  if (route.name !== 'work') return null
  const project = (projectsData as ProjectItem[]).find((item) => item.id === route.params.id)
  return project ? t(`${project.translationKey}.title`) : null
})

// Keep <html lang>, the document title and its meta description in sync
// with the active language and page for SEO and accessibility.
watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = workTitle.value ? `${workTitle.value} | Samuel Sulo` : t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
})
</script>

<template>
  <NavBar />
  <main id="main-content">
    <RouterView />
  </main>
  <AppFooter />
</template>
