<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ServiceCard from '@/components/ui/ServiceCard.vue'
import servicesData from '@/data/services.json'
import type { ServiceItem } from '@/types/content'

const { t } = useI18n()
const services = servicesData as ServiceItem[]

const items = computed(() =>
  services.map((service) => ({
    ...service,
    title: t(`${service.translationKey}.title`),
    description: t(`${service.translationKey}.description`),
  })),
)
</script>

<template>
  <section id="services" v-reveal class="services">
    <div class="container">
      <SectionHeading
        :eyebrow="t('services.eyebrow')"
        :title="t('services.title')"
        :subtitle="t('services.subtitle')"
      />

      <div class="services__grid">
        <ServiceCard
          v-for="item in items"
          :key="item.id"
          :icon="item.icon"
          :title="item.title"
          :description="item.description"
          :technologies="item.technologies"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.services {
  padding-block: var(--space-2xl);
}

.services__grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
</style>
