<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import NavBar from '@/components/layout/NavBar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import HeroSection from '@/components/sections/HeroSection.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ProjectsSection from '@/components/sections/ProjectsSection.vue'
import StackSection from '@/components/sections/StackSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'

const { t, locale } = useI18n()

// Keep <html lang>, the document title and its meta description in sync
// with the active language for SEO and accessibility.
watchEffect(() => {
  document.documentElement.lang = locale.value
  document.title = t('meta.title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
})
</script>

<template>
  <NavBar />
  <main id="main-content">
    <HeroSection />
    <AboutSection />
    <ProjectsSection />
    <StackSection />
    <ContactSection />
  </main>
  <AppFooter />
</template>
