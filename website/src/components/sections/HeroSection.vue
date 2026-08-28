<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section id="about" class="hero bg-grid" aria-labelledby="hero-heading">
    <div class="hero__inner container">
      <div class="hero__content">
        <span class="hero__eyebrow">{{ t('hero.eyebrow') }}</span>
        <h1 id="hero-heading" class="hero__name">{{ t('hero.name') }}</h1>
        <p class="hero__role">{{ t('hero.role') }}</p>
        <p class="hero__intro">{{ t('hero.intro') }}</p>
        <div class="hero__actions">
          <a class="hero__cta hero__cta--primary" href="#contact">{{ t('hero.ctaPrimary') }}</a>
          <a class="hero__cta hero__cta--secondary" href="#projects">{{ t('hero.ctaSecondary') }}</a>
        </div>
      </div>

      <div class="hero__media">
        <div class="hero__media-frame">
          <img
            src="/images/profile/half-body.png"
            :alt="t('hero.profileImageAlt')"
            class="hero__media-image"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding-block: var(--space-3xl) var(--space-2xl);
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 80% 20%,
    rgba(var(--color-neon-secondary-rgb), 0.14),
    transparent 55%
  );
  pointer-events: none;
}

.hero__inner {
  position: relative;
  display: grid;
  gap: var(--space-2xl);
  align-items: center;
}

@media (min-width: 900px) {
  .hero__inner {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
}

.hero__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-neon-primary);
}

.hero__name {
  font-size: var(--fs-h1);
}

.hero__role {
  font-size: var(--fs-h3);
  color: var(--color-text-muted);
  font-weight: 500;
}

.hero__intro {
  max-width: 52ch;
  color: var(--color-text-muted);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition:
    box-shadow var(--duration-base) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.hero__cta--primary {
  background-color: var(--color-neon-primary);
  color: #04121a;
  border: 1px solid var(--color-neon-primary);
}

.hero__cta--secondary {
  color: var(--color-text);
  border: 1px solid var(--color-border-strong);
}

.hero__cta:hover {
  transform: translateY(-1px);
}

.hero__cta--primary:hover {
  box-shadow: var(--glow-primary-strong);
}

.hero__cta--secondary:hover {
  border-color: var(--color-neon-primary);
  color: var(--color-neon-primary);
}

.hero__media {
  display: flex;
  justify-content: center;
}

.hero__media-frame {
  position: relative;
  width: min(360px, 80vw);
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  padding: 4px;
  background: linear-gradient(
    135deg,
    var(--color-neon-primary),
    var(--color-neon-secondary)
  );
  box-shadow: var(--glow-primary);
}

.hero__media-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(var(--radius-lg) - 4px);
  background-color: var(--color-surface);
}

@media (prefers-reduced-motion: reduce) {
  .hero__cta:hover {
    transform: none;
  }
}
</style>
