<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SectionHeading from '@/components/ui/SectionHeading.vue'

const { t } = useI18n()

// Terminal rows: the labels are code-like and stay untranslated, the values are copy.
const rows = ['cloud', 'devops', 'apps', 'ai', 'tools'] as const
</script>

<template>
  <section id="about" v-reveal class="about">
    <div class="container">
      <SectionHeading :eyebrow="t('about.eyebrow')" :title="t('about.title')" />

      <div class="about__grid">
        <div class="about__text">
          <p class="about__lead">{{ t('about.lead') }}</p>
          <p>{{ t('about.body') }}</p>
          <p>{{ t('about.note') }}</p>
        </div>

        <div class="about__terminal" role="group" :aria-label="t('about.terminalLabel')">
          <div class="about__terminal-bar" aria-hidden="true">
            <i /><i /><i />
            <span>samuel@portfolio ~ stack</span>
          </div>
          <div class="about__terminal-body">
            <div><span class="about__prompt">$</span> stack --list</div>
            <div v-for="row in rows" :key="row" class="about__terminal-row">
              <b>{{ row }}</b>
              <span>{{ t(`about.terminal.${row}`) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about {
  padding-block: var(--space-2xl);
  border-top: 1px solid var(--color-border);
}

.about__grid {
  display: grid;
  gap: var(--space-xl);
  align-items: center;
}

@media (min-width: 900px) {
  .about__grid {
    grid-template-columns: 1.1fr 1fr;
    gap: var(--space-2xl);
  }
}

.about__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  color: var(--color-text-muted);
  max-width: 56ch;
}

.about__lead {
  max-width: 28ch;
  color: var(--color-text);
  font-size: var(--fs-h3);
  line-height: 1.4;
}

.about__terminal {
  overflow: hidden;
  border: 1px solid var(--color-ink-line);
  border-radius: var(--radius-md);
  background-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  color: var(--color-ink-text);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.about__terminal-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--color-ink-line);
  color: var(--color-ink-dim);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
}

.about__terminal-bar i {
  width: 9px;
  height: 9px;
  border-radius: var(--radius-full);
  background-color: var(--color-ink-line);
}

.about__terminal-bar span {
  margin-left: var(--space-2xs);
}

.about__terminal-body {
  display: grid;
  gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-md) var(--space-md);
}

.about__prompt {
  color: var(--color-ink-accent);
}

.about__terminal-row {
  display: grid;
  gap: var(--space-xs);
}

@media (min-width: 640px) {
  .about__terminal-row {
    grid-template-columns: 6.2rem minmax(0, 1fr);
  }
}

.about__terminal-row b {
  color: var(--color-ink-dim);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding-top: 2px;
}
</style>
