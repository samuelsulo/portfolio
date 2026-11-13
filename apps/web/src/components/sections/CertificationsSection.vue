<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { assetUrl, getContent } from '@/content'

const { t } = useI18n()
const certifications = getContent().certifications
</script>

<template>
  <section v-if="certifications.length" id="certifications" v-reveal class="certifications">
    <div class="container">
      <SectionHeading
        :eyebrow="t('certifications.eyebrow')"
        :title="t('certifications.title')"
        :subtitle="t('certifications.subtitle')"
      />

      <div class="certifications__grid">
        <article
          v-for="certification in certifications"
          :key="certification.id"
          class="certifications__card"
        >
          <div class="certifications__head">
            <img
              class="certifications__badge"
              :src="assetUrl(certification.image)"
              :alt="t(certification.imageAlt)"
              width="80"
              height="80"
              loading="lazy"
            />
            <div>
              <h3 class="certifications__title">
                {{ t(`${certification.translationKey}.title`) }}
              </h3>
              <p class="certifications__issuer">{{ certification.issuer }}</p>
              <span
                class="certifications__status"
                :class="`certifications__status--${certification.status}`"
              >
                {{ t(`certifications.status.${certification.status}`) }}
              </span>
            </div>
          </div>
          <p class="certifications__description">
            {{ t(`${certification.translationKey}.description`) }}
          </p>
          <a
            class="certifications__cta"
            :href="certification.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('certifications.verify') }}
            <AppIcon name="external-link" :size="16" />
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.certifications {
  padding-block: var(--space-2xl);
  border-top: 1px solid var(--color-border);
}

.certifications__grid {
  display: grid;
  gap: var(--space-md);
}

@media (min-width: 700px) {
  .certifications__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .certifications__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.certifications__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-top: 3px solid var(--color-neon-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.certifications__card:nth-child(3n + 2) {
  border-top-color: var(--color-neon-secondary);
}

.certifications__card:nth-child(3n) {
  border-top-color: var(--color-neon-success);
}

.certifications__head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.certifications__badge {
  flex: none;
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.certifications__title {
  margin: 0;
  font-size: var(--fs-body);
  font-weight: 600;
}

.certifications__issuer {
  margin: var(--space-3xs) 0 0;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.certifications__status {
  display: inline-block;
  margin-top: var(--space-2xs);
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.certifications__status--active {
  color: var(--color-neon-success);
  background-color: rgba(var(--color-neon-success-rgb), 0.1);
}

.certifications__status--expired {
  color: var(--color-neon-danger);
  background-color: rgba(var(--color-neon-danger-rgb), 0.1);
}

.certifications__description {
  margin: 0;
  color: var(--color-text-muted);
}

.certifications__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  align-self: flex-end;
  margin-top: auto;
  color: var(--color-neon-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}
</style>
