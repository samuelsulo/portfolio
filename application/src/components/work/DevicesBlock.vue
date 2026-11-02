<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{
  desktop: { src: string; alt: string }
  tablet: { src: string; alt: string }
  phone: { src: string; alt: string }
  url: string
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <div class="devices">
      <figure class="devices__item devices__item--desktop">
        <div class="devices__bar" aria-hidden="true"><i /><i /><i /></div>
        <div class="devices__screen">
          <img :src="desktop.src" :alt="desktop.alt" loading="lazy" />
        </div>
        <figcaption>{{ t('cases.devices.desktop') }}</figcaption>
      </figure>
      <figure class="devices__item devices__item--tablet">
        <div class="devices__screen">
          <img :src="tablet.src" :alt="tablet.alt" loading="lazy" />
        </div>
        <figcaption>{{ t('cases.devices.tablet') }}</figcaption>
      </figure>
      <figure class="devices__item devices__item--phone">
        <div class="devices__screen">
          <img :src="phone.src" :alt="phone.alt" loading="lazy" />
        </div>
        <figcaption>{{ t('cases.devices.phone') }}</figcaption>
      </figure>
    </div>
    <a class="devices__live" :href="url" target="_blank" rel="noopener noreferrer">
      {{ t('cases.openLive') }}
      <AppIcon name="external-link" :size="16" />
    </a>
  </div>
</template>

<style scoped>
.devices {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(12px, 2.4vw, 28px);
  padding: clamp(14px, 3vw, 30px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-alt);
}

.devices__item {
  display: grid;
  gap: var(--space-2xs);
  margin: 0;
}

.devices__item figcaption {
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
}

.devices__screen {
  overflow: hidden;
  background-color: #fff;
  line-height: 0;
}

.devices__screen img {
  width: 100%;
  height: auto;
}

.devices__item--desktop {
  flex: 1 1 300px;
  max-width: 440px;
}

.devices__item--desktop .devices__screen {
  border: 1px solid var(--color-border-strong);
  border-top: 0;
  border-radius: 0 0 8px 8px;
}

.devices__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  margin-bottom: -8px;
  padding-inline: 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px 8px 0 0;
  background-color: var(--color-surface-alt);
}

.devices__bar i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-border-strong);
}

.devices__item--tablet {
  width: clamp(150px, 22%, 190px);
}

.devices__item--tablet .devices__screen {
  border: 6px solid var(--color-ink);
  border-radius: 14px;
}

.devices__item--phone {
  width: clamp(92px, 13%, 116px);
}

.devices__item--phone .devices__screen {
  border: 5px solid var(--color-ink);
  border-radius: 18px;
}

.devices__live {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  font-weight: 500;
}

.devices__live:hover {
  border-color: var(--color-neon-primary);
}
</style>
