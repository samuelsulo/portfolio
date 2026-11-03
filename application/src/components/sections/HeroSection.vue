<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import { getContent } from '@/content'
import { resolveCvUrl } from '@/utils/cv'

const { t, locale } = useI18n()
const config = getContent().siteConfig
const cvUrl = computed(() => resolveCvUrl(config.cvUrl, locale.value))

const hudRows = computed(() => [
  ...config.hud.map((row) => ({
    id: row.id,
    label: t(`hero.hud.${row.id}`),
    value: row.value,
  })),
  { id: 'base', label: t('hero.hud.base'), value: t('hero.hud.baseValue') },
])
</script>

<template>
  <section id="hero" class="hero bg-grid" aria-labelledby="hero-heading">
    <div class="hero__inner container">
      <div class="hero__content">
        <span v-if="config.availableForWork" class="hero__status">
          <i class="hero__status-dot" aria-hidden="true" />
          {{ t('hero.status') }}
        </span>
        <span class="hero__eyebrow">{{ t('hero.eyebrow') }}</span>
        <h1 id="hero-heading" class="hero__name">{{ t('hero.name') }}</h1>
        <p class="hero__role">{{ t('hero.role') }}</p>
        <p class="hero__intro">{{ t('hero.intro') }}</p>
        <div class="hero__actions">
          <a class="hero__cta hero__cta--primary" href="#projects">{{ t('hero.ctaPrimary') }}</a>
          <a
            v-if="cvUrl"
            class="hero__cta hero__cta--secondary"
            :href="cvUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('hero.ctaCv') }}
            <AppIcon name="external-link" :size="16" />
          </a>
        </div>
        <div class="hero__links">
          <a
            class="hero__link"
            :href="config.social.github"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="github" :size="18" />
            GitHub
          </a>
          <a
            class="hero__link"
            :href="config.social.linkedin"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="linkedin" :size="18" />
            LinkedIn
          </a>
        </div>
      </div>

      <div class="hero__media">
        <div class="hero__frame">
          <div class="hero__photo">
            <img
              src="/images/profile/half-body.png"
              :alt="t('hero.profileImageAlt')"
              class="hero__photo-image"
              width="540"
              height="540"
            />
          </div>
          <dl class="hero__hud">
            <div v-for="row in hudRows" :key="row.id" class="hero__hud-row">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding-block: var(--space-xl) var(--space-2xl);
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 70% at 78% 30%, rgba(var(--color-neon-primary-rgb), 0.12), transparent 70%),
    radial-gradient(45% 55% at 8% 95%, rgba(var(--color-neon-secondary-rgb), 0.1), transparent 70%);
  pointer-events: none;
}

.hero__inner {
  position: relative;
  display: grid;
  gap: var(--space-xl);
  align-items: center;
}

@media (min-width: 900px) {
  .hero__inner {
    grid-template-columns: 1.2fr 0.9fr;
    gap: var(--space-2xl);
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
}

.hero__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.04em;
}

.hero__status-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background-color: var(--color-neon-success);
  box-shadow: 0 0 8px var(--color-neon-success);
}

.hero__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-neon-primary);
}

.hero__eyebrow::before {
  content: '';
  width: 26px;
  height: 2px;
  background-color: var(--color-neon-primary);
}

.hero__name {
  font-size: var(--fs-h1);
  line-height: var(--lh-heading);
}

.hero__role {
  max-width: 30ch;
  font-size: var(--fs-h3);
  line-height: 1.3;
}

.hero__intro {
  max-width: 58ch;
  color: var(--color-text-muted);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition:
    box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.hero__cta--primary {
  background-color: var(--color-neon-primary);
  color: var(--color-on-neon);
  border: 1px solid var(--color-neon-primary);
}

.hero__cta--primary:hover {
  box-shadow: var(--glow-primary-strong);
}

.hero__cta--secondary {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-sm);
}

.hero__cta--secondary:hover {
  border-color: var(--color-neon-primary);
}

.hero__links {
  display: flex;
  gap: var(--space-2xs);
}

.hero__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-3xs) var(--space-xs);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.hero__link:hover {
  color: var(--color-neon-primary);
  background-color: var(--color-surface);
}

.hero__media {
  display: flex;
  justify-content: center;
}

/* Portrait frame with cyberpunk corner brackets. */
.hero__frame {
  --corner: var(--color-neon-primary);

  position: relative;
  width: min(100%, 400px);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.hero__frame::before {
  content: '';
  position: absolute;
  inset: -1px;
  pointer-events: none;
  background:
    linear-gradient(var(--corner), var(--corner)) top left / 18px 2px no-repeat,
    linear-gradient(var(--corner), var(--corner)) top left / 2px 18px no-repeat,
    linear-gradient(var(--corner), var(--corner)) top right / 18px 2px no-repeat,
    linear-gradient(var(--corner), var(--corner)) top right / 2px 18px no-repeat,
    linear-gradient(var(--corner), var(--corner)) bottom left / 18px 2px no-repeat,
    linear-gradient(var(--corner), var(--corner)) bottom left / 2px 18px no-repeat,
    linear-gradient(var(--corner), var(--corner)) bottom right / 18px 2px no-repeat,
    linear-gradient(var(--corner), var(--corner)) bottom right / 2px 18px no-repeat;
}

.hero__photo {
  display: grid;
  place-items: end center;
  aspect-ratio: 1;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 85%, rgba(var(--color-neon-primary-rgb), 0.3), transparent 66%),
    linear-gradient(
      160deg,
      rgba(var(--color-neon-primary-rgb), 0.08),
      rgba(var(--color-neon-secondary-rgb), 0.1)
    );
}

.hero__photo-image {
  width: 100%;
  height: auto;
}

.hero__hud {
  display: grid;
  gap: var(--space-3xs);
  margin: 0;
  padding: var(--space-xs) var(--space-sm);
  border-top: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.hero__hud-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-xs);
}

.hero__hud dt {
  color: var(--color-text-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero__hud dd {
  margin: 0;
  text-align: right;
}
</style>
