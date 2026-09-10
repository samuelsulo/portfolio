<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import Kitsune from '@/components/ui/Kitsune.vue'
import SiteVersion from '@/components/ui/SiteVersion.vue'
import LegalPolicyView from '@/components/cookies/LegalPolicyView.vue'
import LogoDesignModal from '@/components/ui/LogoDesignModal.vue'
import siteConfig from '@/data/site-config.json'

const { t } = useI18n()
const year = new Date().getFullYear()

type LegalDocumentKey = 'cookiePolicy' | 'privacyPolicy'

const isLegalOpen = ref(false)
const activeLegalDocument = ref<LegalDocumentKey>('cookiePolicy')

function openLegal(documentKey: LegalDocumentKey) {
  activeLegalDocument.value = documentKey
  isLegalOpen.value = true
}

function closeLegal() {
  isLegalOpen.value = false
}

const isLogoDesignOpen = ref(false)
</script>

<template>
  <footer class="footer">
    <div class="footer__inner container">
      <div class="footer__identity">
        <span class="footer__name">Samuel Sulo</span>
        <span class="footer__tagline">{{ t('footer.tagline') }}</span>
        <a :href="`mailto:${siteConfig.email}`" class="footer__email">{{ siteConfig.email }}</a>
      </div>

      <div class="footer__links">
        <a
          :href="siteConfig.social.github"
          class="footer__icon-link"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('footer.githubAriaLabel')"
        >
          <AppIcon name="github" />
        </a>
        <a
          :href="siteConfig.social.linkedin"
          class="footer__icon-link"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('footer.linkedinAriaLabel')"
        >
          <AppIcon name="linkedin" />
        </a>
        <a
          :href="`mailto:${siteConfig.email}`"
          class="footer__icon-link"
          :aria-label="t('footer.emailAriaLabel')"
        >
          <AppIcon name="mail" />
        </a>
      </div>

      <a href="#about" class="footer__back-to-top">
        {{ t('footer.backToTop') }}
        <AppIcon name="arrow-up" :size="16" />
      </a>
    </div>

    <div class="footer__bottom container">
      <p class="footer__rights">
        &copy; {{ year }} Samuel Sulo. {{ t('footer.rights') }} <SiteVersion />
      </p>

      <nav class="footer__legal" aria-label="Legal">
        <button type="button" class="footer__legal-link" @click="openLegal('privacyPolicy')">
          {{ t('legal.privacyPolicy.title') }}
        </button>
        <button type="button" class="footer__legal-link" @click="openLegal('cookiePolicy')">
          {{ t('legal.cookiePolicy.title') }}
        </button>
      </nav>

      <div class="footer__brand">
        <button type="button" class="footer__legal-link" @click="isLogoDesignOpen = true">
          {{ t('footer.logoDesignLink') }}
        </button>
        <Kitsune
          :size="24"
          color-light="var(--color-neon-primary-strong)"
          color-mid="var(--color-neon-primary)"
          color-dark="var(--color-neon-secondary)"
          color-accent="var(--color-neon-success)"
          badge-fill="rgba(var(--color-neon-primary-rgb), 0.1)"
          badge-border="rgba(var(--color-neon-primary-rgb), 0.35)"
          class="footer__signature"
        />
      </div>
    </div>

    <LegalPolicyView :open="isLegalOpen" :document-key="activeLegalDocument" @close="closeLegal" />
    <LogoDesignModal :open="isLogoDesignOpen" @close="isLogoDesignOpen = false" />
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-block: var(--space-xl);
}

.footer__identity {
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
}

.footer__name {
  font-weight: 600;
}

.footer__tagline {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--color-text-dim);
}

.footer__links {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.footer__email {
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--color-text-muted);
  transition: color var(--duration-fast) var(--ease-out);
}

.footer__email:hover {
  color: var(--color-neon-primary);
}

.footer__icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.footer__icon-link:hover {
  color: var(--color-neon-primary);
  border-color: var(--color-neon-primary);
  box-shadow: var(--glow-primary);
}

.footer__back-to-top {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  color: var(--color-text-muted);
}

.footer__back-to-top:hover {
  color: var(--color-neon-primary);
}

.footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm) var(--space-md);
  padding-block: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.footer__rights {
  font-size: var(--fs-small);
  color: var(--color-text-dim);
}

.footer__legal {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.footer__legal-link {
  background: transparent;
  border: none;
  padding: 0;
  font-size: var(--fs-small);
  color: var(--color-text-dim);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-out);
}

.footer__legal-link:hover {
  color: var(--color-neon-primary);
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.footer__signature {
  flex-shrink: 0;
}
</style>
