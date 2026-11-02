<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Public, simplified view of a static-site hosting architecture. It shows
 * services and flows only: no account ids, resource names, policies or
 * configuration details, by design. Every label is an i18n key so the same
 * drawing serves each work and each language.
 */
defineProps<{ owner: 'client' | 'own' }>()

const { t } = useI18n()
</script>

<template>
  <figure class="diagram">
    <svg viewBox="0 0 780 372" role="img" :aria-label="t('cases.diagram.ariaLabel')">
      <defs>
        <marker
          id="diagram-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path class="diagram__head" d="M0 0L10 5L0 10z" />
        </marker>
      </defs>

      <rect class="diagram__zone" x="168" y="22" width="600" height="198" rx="10" />
      <text class="diagram__caption" x="184" y="42">{{ t(`cases.diagram.account.${owner}`) }}</text>

      <!-- Visitor flow -->
      <rect class="diagram__node" x="14" y="82" width="118" height="56" rx="8" />
      <text class="diagram__title" x="73" y="107" text-anchor="middle">
        {{ t('cases.diagram.visitor') }}
      </text>
      <text class="diagram__sub" x="73" y="124" text-anchor="middle">
        {{ t('cases.diagram.visitorSub') }}
      </text>

      <rect class="diagram__node" x="196" y="82" width="120" height="56" rx="8" />
      <text class="diagram__title" x="256" y="107" text-anchor="middle">
        {{ t('cases.diagram.dns') }}
      </text>
      <text class="diagram__sub" x="256" y="124" text-anchor="middle">
        {{ t('cases.diagram.dnsSub') }}
      </text>

      <rect
        class="diagram__node diagram__node--key"
        x="380"
        y="82"
        width="160"
        height="56"
        rx="8"
      />
      <text class="diagram__title" x="460" y="107" text-anchor="middle">
        {{ t('cases.diagram.cdn') }}
      </text>
      <text class="diagram__sub" x="460" y="124" text-anchor="middle">
        {{ t('cases.diagram.cdnSub') }}
      </text>

      <rect
        class="diagram__node diagram__node--key"
        x="604"
        y="82"
        width="140"
        height="56"
        rx="8"
      />
      <text class="diagram__title" x="674" y="107" text-anchor="middle">
        {{ t('cases.diagram.storage') }}
      </text>
      <text class="diagram__sub" x="674" y="124" text-anchor="middle">
        {{ t('cases.diagram.storageSub') }}
      </text>

      <rect class="diagram__node" x="380" y="160" width="160" height="44" rx="8" />
      <text class="diagram__title" x="460" y="179" text-anchor="middle">
        {{ t('cases.diagram.tls') }}
      </text>
      <text class="diagram__sub" x="460" y="194" text-anchor="middle">
        {{ t('cases.diagram.tlsSub') }}
      </text>

      <path class="diagram__arrow" d="M132 110H196" marker-end="url(#diagram-arrow)" />
      <path class="diagram__arrow" d="M316 110H380" marker-end="url(#diagram-arrow)" />
      <path class="diagram__arrow" d="M540 110H604" marker-end="url(#diagram-arrow)" />
      <path class="diagram__dashed" d="M460 160V138" />
      <text class="diagram__sub" x="572" y="102" text-anchor="middle">
        {{ t('cases.diagram.origin') }}
      </text>

      <!-- Release flow -->
      <rect class="diagram__node" x="14" y="276" width="118" height="56" rx="8" />
      <text class="diagram__title" x="73" y="301" text-anchor="middle">
        {{ t('cases.diagram.developer') }}
      </text>
      <text class="diagram__sub" x="73" y="318" text-anchor="middle">
        {{ t('cases.diagram.developerSub') }}
      </text>

      <rect class="diagram__node" x="196" y="276" width="170" height="56" rx="8" />
      <text class="diagram__title" x="281" y="301" text-anchor="middle">
        {{ t('cases.diagram.deploy') }}
      </text>
      <text class="diagram__sub" x="281" y="318" text-anchor="middle">
        {{ t('cases.diagram.deploySub') }}
      </text>

      <rect class="diagram__node" x="430" y="276" width="170" height="56" rx="8" />
      <text class="diagram__title" x="515" y="301" text-anchor="middle">
        {{ t('cases.diagram.infra') }}
      </text>
      <text class="diagram__sub" x="515" y="318" text-anchor="middle">
        {{ t('cases.diagram.infraSub') }}
      </text>

      <rect class="diagram__node" x="650" y="276" width="118" height="56" rx="8" />
      <text class="diagram__title" x="709" y="301" text-anchor="middle">
        {{ t('cases.diagram.state') }}
      </text>
      <text class="diagram__sub" x="709" y="318" text-anchor="middle">
        {{ t('cases.diagram.stateSub') }}
      </text>

      <path class="diagram__arrow" d="M132 304H196" marker-end="url(#diagram-arrow)" />
      <path class="diagram__arrow" d="M281 276V220" marker-end="url(#diagram-arrow)" />
      <path class="diagram__arrow" d="M515 276V220" marker-end="url(#diagram-arrow)" />
      <path class="diagram__arrow" d="M600 304H650" marker-end="url(#diagram-arrow)" />
      <path class="diagram__dashed" d="M73 332V358H515V332" />
      <text class="diagram__sub" x="292" y="252">{{ t('cases.diagram.release') }}</text>
      <text class="diagram__sub" x="526" y="252">{{ t('cases.diagram.provisioning') }}</text>
    </svg>
    <figcaption class="diagram__note">{{ t('cases.diagram.note') }}</figcaption>
  </figure>
</template>

<style scoped>
.diagram {
  display: grid;
  gap: var(--space-sm);
  margin: 0;
}

.diagram svg {
  width: 100%;
  max-width: 820px;
  height: auto;
  margin-inline: auto;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface-alt);
}

.diagram__zone {
  fill: none;
  stroke: var(--color-neon-secondary);
  stroke-width: 1.2;
  stroke-dasharray: 6 5;
}

.diagram__node {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1.2;
}

.diagram__node--key {
  stroke: var(--color-neon-primary);
  stroke-width: 1.6;
}

.diagram__title {
  fill: var(--color-text);
  font: 600 13px var(--font-sans);
}

.diagram__sub {
  fill: var(--color-text-dim);
  font: 400 10.5px var(--font-mono);
}

.diagram__caption {
  fill: var(--color-neon-secondary);
  font: 500 10px var(--font-mono);
  letter-spacing: 0.12em;
}

.diagram__arrow {
  fill: none;
  stroke: var(--color-neon-primary);
  stroke-width: 1.5;
}

.diagram__dashed {
  fill: none;
  stroke: var(--color-text-dim);
  stroke-width: 1.3;
  stroke-dasharray: 4 4;
}

.diagram__head {
  fill: var(--color-neon-primary);
}

.diagram__note {
  padding-left: var(--space-xs);
  border-left: 2px solid var(--color-neon-secondary);
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}
</style>
