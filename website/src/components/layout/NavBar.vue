<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/ui/AppIcon.vue'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import { useScrollSpy } from '@/composables/useScrollSpy'
import { useBodyScrollLock } from '@/composables/useBodyScrollLock'

const { t } = useI18n()

const sections = ['about', 'services', 'projects', 'contact'] as const
const { activeId } = useScrollSpy([...sections])

const links = computed(() => sections.map((id) => ({ id, label: t(`nav.${id}`) })))

const isMenuOpen = ref(false)
useBodyScrollLock(isMenuOpen)

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isMenuOpen.value) {
    closeMenu()
  }
}
</script>

<template>
  <header class="navbar glass-surface" @keydown="handleKeydown">
    <a class="navbar__skip skip-link" href="#main-content">{{ t('nav.skipToContent') }}</a>

    <div class="navbar__inner container">
      <a href="#about" class="navbar__brand" aria-label="Samuel Sulo">
        <span class="navbar__mark" aria-hidden="true">SS</span>
        <span class="navbar__brand-text">Samuel&nbsp;Sulo</span>
      </a>

      <nav class="navbar__links navbar__links--desktop" aria-label="Main">
        <a
          v-for="link in links"
          :key="link.id"
          :href="`#${link.id}`"
          class="navbar__link"
          :class="{ 'is-active': activeId === link.id }"
          :aria-current="activeId === link.id ? 'page' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="navbar__actions">
        <LanguageSwitcher class="navbar__lang navbar__lang--desktop" />
        <button
          type="button"
          class="navbar__toggle"
          aria-controls="mobile-nav"
          :aria-expanded="isMenuOpen"
          :aria-label="t('nav.toggleMenu')"
          @click="toggleMenu"
        >
          <AppIcon :name="isMenuOpen ? 'close' : 'menu'" />
        </button>
      </div>
    </div>

    <Transition name="mobile-nav">
      <nav
        v-if="isMenuOpen"
        id="mobile-nav"
        class="navbar__mobile glass-surface"
        aria-label="Mobile"
      >
        <a
          v-for="link in links"
          :key="link.id"
          :href="`#${link.id}`"
          class="navbar__mobile-link"
          :class="{ 'is-active': activeId === link.id }"
          @click="closeMenu"
        >
          {{ link.label }}
        </a>
        <LanguageSwitcher class="navbar__lang" />
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-navbar);
  border-bottom: 1px solid var(--color-border);
}

.navbar__skip {
  z-index: calc(var(--z-overlay) + 1);
}

.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.navbar__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;
}

.navbar__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: var(--fs-small);
  color: var(--color-neon-primary);
  border: 1px solid var(--color-neon-primary);
  box-shadow: var(--glow-primary);
}

.navbar__brand-text {
  display: none;
}

@media (min-width: 640px) {
  .navbar__brand-text {
    display: inline;
  }
}

.navbar__links--desktop {
  display: none;
  gap: var(--space-lg);
}

.navbar__link {
  position: relative;
  padding-block: var(--space-2xs);
  color: var(--color-text-muted);
  font-size: var(--fs-small);
  transition: color var(--duration-fast) var(--ease-out);
}

.navbar__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background-color: var(--color-neon-primary);
  box-shadow: var(--glow-primary);
  transform: scaleX(0);
  transition: transform var(--duration-base) var(--ease-out);
}

.navbar__link:hover {
  color: var(--color-text);
}

.navbar__link.is-active {
  color: var(--color-neon-primary);
}

.navbar__link.is-active::after {
  transform: scaleX(1);
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.navbar__lang--desktop {
  display: none;
}

.navbar__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.navbar__toggle:hover {
  border-color: var(--color-neon-primary);
  color: var(--color-neon-primary);
}

@media (min-width: 900px) {
  .navbar__links--desktop {
    display: flex;
  }

  .navbar__lang--desktop {
    display: inline-flex;
  }

  .navbar__toggle {
    display: none;
  }
}

.navbar__mobile {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md) var(--container-padding) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.navbar__mobile-link {
  font-size: var(--fs-h3);
  color: var(--color-text-muted);
}

.navbar__mobile-link.is-active {
  color: var(--color-neon-primary);
}

@media (min-width: 900px) {
  .navbar__mobile {
    display: none;
  }
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
