<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AboutSection from '@/components/sections/AboutSection.vue'
import ContactSection from '@/components/sections/ContactSection.vue'
import CvViewer from '@/components/work/CvViewer.vue'
import WorkDetail from '@/components/work/WorkDetail.vue'
import { assetUrl, getContent, prefetchWork } from '@/content'
import { stackIconHref } from '@/utils/stack'
import { supportsWebGL } from '@/scene3d/support'
import {
  ROOMS,
  buildInteractables,
  type CvLanguage,
  type Interactable,
  type RoomId,
} from '@/scene3d/world'
import type { Explorer } from '@/scene3d/explorer'
import type { CardSpec } from '@/scene3d/cards'
import { loadPlayerState, savePlayerState } from '@/scene3d/session'
import { DANCE_IDS, type DanceId } from '@/scene3d/dances'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const content = getContent()

const cvLanguages = (['it', 'en'] as const).filter(
  (language) => content.siteConfig.cvUrl?.[language],
)

const interactables = buildInteractables({
  cvLanguages,
  projectIds: content.projects.map((item) => item.id),
  stackGroupIds: content.stack.map((item) => item.id),
  certificationIds: content.certifications.map((item) => item.id),
})

const canvas = ref<HTMLCanvasElement | null>(null)
const labelLayer = ref<HTMLElement | null>(null)
const joystick = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)

const isSupported = supportsWebGL()
const isLoading = ref(isSupported)
const hasFailed = ref(false)
const explorer = shallowRef<Explorer | null>(null)
const nearby = ref<Interactable | null>(null)
const room = ref<RoomId>('hub')
const isFlashing = ref(false)
const isDanceMenuOpen = ref(false)
const isMenuOpen = ref(false)
const isRotateHintDismissed = ref(false)
const menuFirst = ref<HTMLButtonElement | null>(null)
const isLooking = ref(false)
const wheelFirst = ref<HTMLButtonElement | null>(null)
const selected = ref<Interactable | null>(null)

// --- The sheet: what has a page of its own is shown over the scene, not by leaving it ---
const SHEET_KINDS: Interactable['kind'][] = ['work', 'contact', 'about', 'cv']

/** The object whose sheet is open, from `?open=<id>` so that Back closes it and the link can be shared. */
const sheetItem = computed(() => {
  const id = route.query.open
  return typeof id === 'string'
    ? (interactables.find((item) => item.id === id && SHEET_KINDS.includes(item.kind)) ?? null)
    : null
})

let openedHere = false
watch(sheetItem, (item) => {
  if (!item) openedHere = false
})

function openSheet(item: Interactable) {
  openedHere = true
  void router.push({ query: { open: item.id } })
}

function closeSheet() {
  // The entry was added by opening the sheet: going back removes it. A shared link has no previous entry.
  if (openedHere) router.back()
  else void router.replace({ query: {} })
}

const project = (id: string) => content.projects.find((item) => item.id === id)!
const group = (id: string) => content.stack.find((item) => item.id === id)!
const certification = (id: string) => content.certifications.find((item) => item.id === id)!

/** The gallery shows the screenshot of the site of a work when it has one, else the image of its card. */
function workImage(id: string): string {
  return project(id).screenshot || project(id).image
}

function titleOf(item: Interactable): string {
  switch (item.kind) {
    case 'portal':
      return t(`explore.rooms.${item.refId}`)
    case 'cv':
      return t(`explore.cv.${item.refId}`)
    case 'about':
      return t('about.title')
    case 'work':
      return t(`${project(item.refId).translationKey}.title`)
    case 'stack':
      return t(`${group(item.refId).translationKey}.title`)
    case 'certification':
      return t(`${certification(item.refId).translationKey}.title`)
    case 'contact':
      return t('contact.title')
  }
}

const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/** What the stack groups and the contact details show on the wall, in the language of the visitor. */
const cards = computed<Record<string, CardSpec>>(() => {
  const { siteConfig } = content
  const entries: [string, CardSpec][] = []
  for (const item of interactables) {
    if (item.kind === 'stack') {
      const entry = group(item.refId)
      entries.push([
        item.id,
        {
          eyebrow: t(`${entry.translationKey}.tag`),
          title: t(`${entry.translationKey}.title`),
          lines: [],
          icons: entry.items.map((tool) => ({
            label: tool.label,
            src: tool.icon ? stackIconHref(tool.icon) : null,
            colored: Boolean(tool.colored),
          })),
        },
      ])
    } else if (item.kind === 'contact') {
      entries.push([
        item.id,
        {
          eyebrow: t('contact.eyebrow'),
          title: t('contact.title'),
          lines: [
            siteConfig.email,
            ...(siteConfig.phone ? [siteConfig.phone] : []),
            siteConfig.location,
            handle(siteConfig.social.github),
            handle(siteConfig.social.linkedin),
          ],
          icons: [],
        },
      ])
    }
  }
  return Object.fromEntries(entries)
})
watch(cards, (next) => explorer.value?.setCards(next))

const labels = computed(() =>
  Object.fromEntries(interactables.map((item) => [item.id, titleOf(item)])),
)
watch(labels, (next) => explorer.value?.setLabels(next))

const panel = computed(() => {
  const item = selected.value
  if (!item) return null
  let body = ''
  let items: string[] = []
  let image: { src: string; alt: string } | null = null
  if (item.kind === 'stack') items = group(item.refId).items.map((entry) => entry.label)
  else if (item.kind === 'certification') {
    const entry = certification(item.refId)
    body = t(`${entry.translationKey}.description`)
    image = { src: assetUrl(entry.image), alt: t(entry.imageAlt) }
  }
  return { title: titleOf(item), body, items, image }
})

/** The rooms in the order of the room list, without the CV one when there is no CV. */
const rooms = computed(() =>
  ROOMS.filter((entry) => entry.id !== 'cv' || cvLanguages.length > 0).map((entry) => entry.id),
)

function cvUrl(language: string): string {
  const path = content.siteConfig.cvUrl?.[language as CvLanguage]
  return path ? assetUrl(path) : ''
}

/** Covers the screen for an instant, so that appearing in another room does not look like a glitch. */
function flash() {
  isFlashing.value = true
  window.setTimeout(() => (isFlashing.value = false), 60)
}

function promptFor(item: Interactable): string {
  return t(item.kind === 'portal' ? 'explore.enter' : 'explore.prompt', {
    name: labels.value[item.id],
  })
}

// --- The dance menu, a wheel opened with B ---
function wheelStyle(index: number) {
  const angle = (index / DANCE_IDS.length) * Math.PI * 2 - Math.PI / 2
  return { '--cx': Math.cos(angle).toFixed(3), '--cy': Math.sin(angle).toFixed(3) }
}

function openDanceMenu() {
  if (!explorer.value || selected.value || sheetItem.value) return
  isDanceMenuOpen.value = true
  void nextTick(() => wheelFirst.value?.focus())
}

function closeDanceMenu() {
  isDanceMenuOpen.value = false
}

function pickDance(id: DanceId | null) {
  explorer.value?.dance(id)
  closeDanceMenu()
}

// --- The menu: rooms, controls and the way back to the classic view, opened with M or its button ---
function openMenu() {
  if (!explorer.value || selected.value || sheetItem.value) return
  if (isDanceMenuOpen.value) closeDanceMenu()
  isMenuOpen.value = true
  void nextTick(() => menuFirst.value?.focus())
}

function closeMenu() {
  isMenuOpen.value = false
}

function goToRoom(id: RoomId) {
  closeMenu()
  explorer.value?.goTo(id)
}

function openItem(item: Interactable) {
  if (isDanceMenuOpen.value) closeDanceMenu()
  if (isMenuOpen.value) closeMenu()
  if (SHEET_KINDS.includes(item.kind)) {
    openSheet(item)
    return
  }
  selected.value = item
  void nextTick(() => closeButton.value?.focus())
}

function closePanel() {
  selected.value = null
}

function goTo(location: Parameters<typeof router.push>[0]) {
  closePanel()
  void router.push(location)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (selected.value) closePanel()
    else if (isMenuOpen.value) closeMenu()
    else if (isDanceMenuOpen.value) closeDanceMenu()
    // The sheet closes itself on Escape while the focus is in it; this covers the focus being elsewhere
    // (a link opened straight on a sheet), without closing it twice.
    else if (sheetItem.value && !(event.target as HTMLElement | null)?.closest('.app-modal')) {
      closeSheet()
    }
    return
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return
  // Typing in the contact form must not trigger the shortcuts, and nothing is played under a sheet.
  const target = event.target as HTMLElement | null
  if (
    target?.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
  ) {
    return
  }
  if (sheetItem.value) return
  if (event.code === 'KeyM' && !event.repeat) {
    if (isMenuOpen.value) closeMenu()
    else openMenu()
    return
  }
  if (event.code === 'KeyB' && !event.repeat) {
    if (isMenuOpen.value) return
    if (isDanceMenuOpen.value) closeDanceMenu()
    else openDanceMenu()
    return
  }
  const digit = /^Digit([1-9])$/.exec(event.code)
  if (digit && isDanceMenuOpen.value && Number(digit[1]) <= DANCE_IDS.length) {
    pickDance(DANCE_IDS[Number(digit[1]) - 1])
  }
}

// The scene stops listening while anything is open on top of it, and stops drawing under a sheet.
const isPaused = computed(() =>
  Boolean(selected.value || isDanceMenuOpen.value || isMenuOpen.value || sheetItem.value),
)
watchEffect(() => {
  explorer.value?.setPaused(isPaused.value)
  explorer.value?.suspend(Boolean(sheetItem.value))
})

let disposed = false

/** Opening a work or the contact leaves this page: the spot is kept so that coming back resumes there. */
function rememberPlayer() {
  if (explorer.value) savePlayerState(explorer.value.getState())
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', rememberPlayer)
  if (!isSupported || !canvas.value || !labelLayer.value || !joystick.value) return
  try {
    // The 3D engine is a separate chunk: it is only downloaded here, once the visitor asks for this page.
    const { createExplorer } = await import('@/scene3d/explorer')
    if (disposed || !canvas.value || !labelLayer.value || !joystick.value) return
    explorer.value = createExplorer({
      canvas: canvas.value,
      labelLayer: labelLayer.value,
      joystick: joystick.value,
      interactables,
      resume: loadPlayerState(),
      // Of the two CVs, the one in the language of the visitor is shown at once, the other when they walk up to it.
      isDeferred: (item) => item.kind === 'cv' && item.refId !== locale.value,
      imageFor(item) {
        if (item.kind === 'work') return assetUrl(workImage(item.refId))
        if (item.kind === 'cv') return assetUrl(`/images/cv/samuelsulo-cv-${item.refId}-1.jpg`)
        if (item.kind === 'certification') return assetUrl(certification(item.refId).image)
        return null
      },
      onNearby: (item) => {
        nearby.value = item
        // Walking up to a work: its data is fetched before the visitor opens it.
        if (item?.kind === 'work') prefetchWork(item.refId)
      },
      onRoom: (id) => (room.value = id),
      onTeleport: flash,
      onDance: () => undefined,
      onLook: (locked) => (isLooking.value = locked),
      onInteract: openItem,
    })
    explorer.value.setLabels(labels.value)
    explorer.value.setCards(cards.value)
  } catch (error) {
    console.error(error)
    hasFailed.value = true
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  disposed = true
  rememberPlayer()
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', rememberPlayer)
  explorer.value?.dispose()
  explorer.value = null
})
</script>

<template>
  <section class="explore" :aria-label="t('explore.title')">
    <div v-if="!isSupported || hasFailed" class="explore__fallback" role="alert">
      <h1>{{ t('explore.unsupportedTitle') }}</h1>
      <p>{{ t('explore.unsupportedBody') }}</p>
      <BaseButton @click="goTo({ name: 'home' })">{{ t('explore.backTo2d') }}</BaseButton>
    </div>

    <template v-else>
      <div class="explore__stage">
        <canvas ref="canvas" class="explore__canvas" :aria-label="t('explore.canvasLabel')" />
        <div ref="labelLayer" class="explore__labels" aria-hidden="true" />

        <p v-if="isLoading" class="explore__loading" role="status">{{ t('explore.loading') }}</p>

        <div class="explore__hud">
          <p class="explore__room" aria-live="polite">{{ t(`explore.rooms.${room}`) }}</p>
          <button type="button" class="explore__menu-button" @click="openMenu">
            <kbd>M</kbd>
            {{ t('explore.menu') }}
          </button>
        </div>

        <p
          v-if="
            !isLoading && !isLooking && !selected && !sheetItem && !isDanceMenuOpen && !isMenuOpen
          "
          class="explore__look"
        >
          {{ t('explore.lookHint') }}
        </p>

        <button v-if="!isMenuOpen" type="button" class="explore__dance" @click="openDanceMenu">
          <kbd>B</kbd>
          {{ t('explore.dance.open') }}
        </button>

        <div
          v-if="isDanceMenuOpen"
          class="explore__wheel"
          role="dialog"
          :aria-label="t('explore.dance.title')"
          @click.self="closeDanceMenu"
        >
          <div class="explore__wheel-ring">
            <button
              v-for="(id, index) in DANCE_IDS"
              :key="id"
              :ref="
                (element) => {
                  if (index === 0) wheelFirst = element as HTMLButtonElement | null
                }
              "
              type="button"
              class="explore__wheel-item"
              :style="wheelStyle(index)"
              @click="pickDance(id)"
            >
              <kbd>{{ index + 1 }}</kbd>
              {{ t(`explore.dance.names.${id}`) }}
            </button>
            <button type="button" class="explore__wheel-center" @click="pickDance(null)">
              {{ t('explore.dance.stop') }}
            </button>
          </div>
        </div>

        <div
          v-if="isMenuOpen"
          class="explore__menu glass-surface"
          role="dialog"
          :aria-label="t('explore.menuTitle')"
          @click.self="closeMenu"
        >
          <div class="explore__menu-card">
            <button
              type="button"
              class="explore__close"
              :aria-label="t('common.close')"
              @click="closeMenu"
            >
              <AppIcon name="close" :size="18" />
            </button>
            <h2 class="explore__panel-title">{{ t('explore.menuTitle') }}</h2>
            <nav :aria-label="t('explore.roomsLabel')">
              <ul class="explore__menu-rooms">
                <li v-for="(id, index) in rooms" :key="id">
                  <button
                    :ref="
                      (element) => {
                        if (index === 0) menuFirst = element as HTMLButtonElement | null
                      }
                    "
                    type="button"
                    class="explore__chip"
                    :class="{ 'is-active': id === room }"
                    :aria-current="id === room ? 'true' : undefined"
                    @click="goToRoom(id)"
                  >
                    {{ t(`explore.rooms.${id}`) }}
                  </button>
                </li>
              </ul>
            </nav>
            <h3 class="explore__menu-heading">{{ t('explore.controls') }}</h3>
            <p class="explore__help explore__help--pointer">{{ t('explore.helpPointer') }}</p>
            <p class="explore__help explore__help--touch">{{ t('explore.helpTouch') }}</p>
            <RouterLink :to="{ name: 'home' }" class="explore__exit">
              <AppIcon name="arrow-left" :size="16" />
              {{ t('explore.backTo2d') }}
            </RouterLink>
          </div>
        </div>

        <div ref="joystick" class="explore__joystick" aria-hidden="true">
          <div class="explore__knob" />
        </div>

        <button
          v-if="nearby && !selected && !sheetItem"
          type="button"
          class="explore__prompt"
          @click="explorer?.interact()"
        >
          <kbd>E</kbd>
          <span>{{ promptFor(nearby) }}</span>
        </button>

        <div
          v-if="!isRotateHintDismissed && !isLoading"
          class="explore__rotate"
          role="dialog"
          :aria-label="t('explore.rotateHint')"
        >
          <p>{{ t('explore.rotateHint') }}</p>
          <BaseButton @click="isRotateHintDismissed = true">
            {{ t('explore.rotateDismiss') }}
          </BaseButton>
        </div>

        <div class="explore__flash" :class="{ 'is-on': isFlashing }" aria-hidden="true" />

        <div
          v-if="panel && selected"
          class="explore__panel glass-surface"
          role="dialog"
          aria-modal="false"
          :aria-label="panel.title"
        >
          <button
            ref="closeButton"
            type="button"
            class="explore__close"
            :aria-label="t('common.close')"
            @click="closePanel"
          >
            <AppIcon name="close" :size="18" />
          </button>
          <h2 class="explore__panel-title">{{ panel.title }}</h2>
          <img
            v-if="panel.image"
            class="explore__badge"
            :src="panel.image.src"
            :alt="panel.image.alt"
          />
          <p v-if="panel.body" class="explore__panel-body">{{ panel.body }}</p>
          <ul v-if="panel.items.length" class="explore__tags">
            <li v-for="entry in panel.items" :key="entry">{{ entry }}</li>
          </ul>
          <div v-if="selected.kind === 'certification'" class="explore__actions">
            <BaseButton :href="certification(selected.refId).url">
              {{ t('certifications.verify') }}
            </BaseButton>
          </div>
        </div>

        <AppModal
          :open="Boolean(sheetItem)"
          max-width="1100px"
          max-height="min(90vh, 900px)"
          fullscreen-on-mobile
          @close="closeSheet"
        >
          <template #title>{{ sheetItem ? titleOf(sheetItem) : '' }}</template>
          <div v-if="sheetItem" class="explore__sheet">
            <RouterLink
              v-if="sheetItem.kind === 'work'"
              class="explore__page-link"
              :to="{ name: 'work', params: { id: sheetItem.refId } }"
            >
              {{ t('explore.openPage') }}
              <AppIcon name="external-link" :size="14" />
            </RouterLink>
            <WorkDetail
              v-if="sheetItem.kind === 'work'"
              :id="sheetItem.refId"
              :show-title="false"
            />
            <ContactSection v-else-if="sheetItem.kind === 'contact'" />
            <AboutSection v-else-if="sheetItem.kind === 'about'" />
            <CvViewer
              v-else-if="sheetItem.kind === 'cv'"
              :language="sheetItem.refId"
              :pdf-url="cvUrl(sheetItem.refId)"
            />
          </div>
        </AppModal>
      </div>

      <!-- The same content as text, for screen readers and keyboards that cannot walk the rooms. -->
      <div class="visually-hidden">
        <h1>{{ t('explore.title') }}</h1>
        <ul>
          <li v-for="item in interactables" :key="item.id">
            <RouterLink
              v-if="item.kind === 'work'"
              :to="{ name: 'work', params: { id: item.refId } }"
            >
              {{ titleOf(item) }}
            </RouterLink>
            <a v-else-if="item.kind === 'certification'" :href="certification(item.refId).url">
              {{ titleOf(item) }}
            </a>
            <span v-else>{{ titleOf(item) }}</span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<style scoped>
.explore {
  position: relative;
  /* No navbar and no footer: the stage is the whole viewport. */
  height: 100dvh;
  min-height: 480px;
  background-color: var(--color-bg);
}

.explore__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.explore__canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* The browser must not scroll or zoom the page while a finger drives the camera. */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

.explore__canvas:active {
  cursor: grabbing;
}

.explore__labels {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Created by the scene, so not scoped to this component's elements. */
.explore__labels :deep(.explore__label) {
  position: absolute;
  top: 0;
  left: 0;
  max-width: 200px;
  padding: 2px var(--space-2xs);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-glass);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  will-change: transform;
}

.explore__labels :deep(.explore__label--portal) {
  border-color: var(--color-neon-secondary);
  color: var(--color-neon-secondary);
}

.explore__loading,
.explore__fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin: 0;
  padding: var(--container-padding);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  text-align: center;
}

.explore__fallback {
  font-family: var(--font-sans);
}

.explore__hud {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  right: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  pointer-events: none;
}

.explore__room,
.explore__exit,
.explore__menu-button,
.explore__help {
  margin: 0;
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--color-glass);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.explore__room {
  color: var(--color-neon-primary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.explore__exit {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  color: var(--color-text);
  pointer-events: auto;
}

.explore__menu-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  color: var(--color-text);
  cursor: pointer;
  pointer-events: auto;
}

.explore__menu-button kbd {
  padding: 0 var(--space-3xs);
  border: 1px solid currentcolor;
  border-radius: 4px;
}

.explore__exit:hover,
.explore__menu-button:hover {
  border-color: var(--color-neon-primary);
  color: var(--color-neon-primary);
}

.explore__help {
  margin: 0 0 var(--space-xs);
  color: var(--color-text-muted);
}

.explore__help--touch {
  display: none;
}

.explore__joystick {
  display: none;
  position: absolute;
  left: var(--space-md);
  bottom: var(--space-lg);
  width: 120px;
  height: 120px;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background-color: var(--color-glass);
  touch-action: none;
}

.explore__knob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48px;
  height: 48px;
  margin: -24px 0 0 -24px;
  border: 1px solid var(--color-neon-primary);
  border-radius: 50%;
  background-color: rgba(var(--color-neon-primary-rgb), 0.25);
  pointer-events: none;
}

@media (pointer: coarse) {
  .explore__joystick {
    display: block;
  }

  .explore__help--pointer {
    display: none;
  }

  .explore__help--touch {
    display: block;
  }

  .explore__menu-button kbd {
    display: none;
  }
}

.explore__prompt {
  position: absolute;
  left: 50%;
  bottom: var(--space-lg);
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  max-width: calc(100% - 2 * var(--space-sm));
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--fs-small);
  cursor: pointer;
  box-shadow: var(--glow-primary);
}

.explore__prompt kbd {
  padding: 0 var(--space-2xs);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-sm);
  color: var(--color-neon-primary);
  font-family: var(--font-mono);
}

@media (pointer: coarse) {
  .explore__prompt {
    bottom: 160px;
  }

  .explore__prompt kbd {
    display: none;
  }
}

.explore__panel {
  position: absolute;
  left: 50%;
  bottom: var(--space-md);
  transform: translateX(-50%);
  width: min(560px, calc(100% - 2 * var(--space-sm)));
  max-height: calc(100% - 6rem);
  overflow-y: auto;
  padding: var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.explore__close {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.explore__close:hover {
  border-color: var(--color-neon-primary);
  color: var(--color-neon-primary);
}

.explore__panel-title {
  margin: 0 var(--space-xl) var(--space-xs) 0;
  font-size: var(--fs-h3);
  line-height: var(--lh-heading);
}

.explore__panel-body {
  margin: 0 0 var(--space-sm);
  color: var(--color-text-muted);
}

.explore__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: 0 0 var(--space-sm);
  padding: 0;
  list-style: none;
}

.explore__tags li {
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

/* Menu */
.explore__menu {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm);
  background-color: var(--color-scrim);
}

.explore__menu-card {
  position: relative;
  width: min(520px, 100%);
  max-height: 100%;
  overflow-y: auto;
  padding: var(--space-md);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
}

.explore__menu-rooms {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  margin: 0 0 var(--space-sm);
  padding: 0;
  list-style: none;
}

.explore__menu-heading {
  margin: 0 0 var(--space-2xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.explore__chip {
  flex-shrink: 0;
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background-color: var(--color-glass);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  cursor: pointer;
}

.explore__chip:hover,
.explore__chip.is-active {
  border-color: var(--color-neon-secondary);
  color: var(--color-neon-secondary);
}

.explore__chip.is-active {
  background-color: rgba(var(--color-neon-secondary-rgb), 0.14);
}

.explore__look {
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 120px);
  margin: 0;
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-sm);
  background-color: var(--color-glass);
  color: var(--color-neon-primary);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  pointer-events: none;
}

/* Only where there is a mouse: a finger drags the scene instead. */
@media (pointer: fine) {
  .explore__look {
    display: block;
  }
}

.explore__dance {
  position: absolute;
  right: var(--space-sm);
  bottom: var(--space-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-3xs) var(--space-xs);
  border: 1px solid var(--color-neon-secondary);
  border-radius: var(--radius-sm);
  background-color: var(--color-glass);
  color: var(--color-neon-secondary);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
  cursor: pointer;
}

.explore__dance kbd {
  padding: 0 var(--space-3xs);
  border: 1px solid currentcolor;
  border-radius: var(--radius-3xs, 4px);
}

.explore__dance:hover {
  background-color: var(--color-neon-secondary);
  color: var(--color-on-neon);
}

@media (pointer: coarse) {
  .explore__dance {
    bottom: 76px;
  }

  .explore__dance kbd {
    display: none;
  }
}

.explore__wheel {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-scrim);
}

.explore__wheel-ring {
  --radius: 150px;

  position: relative;
  width: 0;
  height: 0;
}

.explore__wheel-item,
.explore__wheel-center {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--fs-small);
  white-space: nowrap;
  cursor: pointer;
}

.explore__wheel-item {
  transform: translate(-50%, -50%)
    translate(calc(var(--cx) * var(--radius) * 1.35), calc(var(--cy) * var(--radius)));
}

.explore__wheel-center {
  transform: translate(-50%, -50%);
  border-color: var(--color-neon-danger);
  color: var(--color-neon-danger);
}

.explore__wheel-item kbd {
  color: var(--color-neon-secondary);
  font-family: var(--font-mono);
}

.explore__wheel-item:hover,
.explore__wheel-item:focus-visible {
  border-color: var(--color-neon-secondary);
  box-shadow: 0 0 12px rgba(var(--color-neon-secondary-rgb), 0.5);
}

@media (max-width: 640px) {
  .explore__wheel-ring {
    --radius: 110px;
  }

  .explore__wheel-item {
    padding: var(--space-2xs) var(--space-xs);
  }
}

.explore__flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(var(--color-neon-secondary-rgb), 0.85), var(--color-bg));
  opacity: 0;
  pointer-events: none;
  transition: opacity 450ms var(--ease-out);
}

.explore__flash.is-on {
  opacity: 1;
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .explore__flash {
    display: none;
  }
}

.explore__download {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-xs) var(--space-md);
  border: 1px solid var(--color-neon-primary);
  border-radius: var(--radius-md);
  color: var(--color-neon-primary);
  font-weight: 600;
}

.explore__download:hover {
  background-color: var(--color-neon-primary);
  color: var(--color-on-neon);
}

.explore__badge {
  display: block;
  width: 112px;
  height: 112px;
  margin: 0 0 var(--space-sm);
  object-fit: contain;
}

.explore__page-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  width: fit-content;
  margin-bottom: var(--space-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--fs-mono);
}

.explore__page-link:hover {
  color: var(--color-neon-primary);
}

.explore__sheet {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* Room for the focus ring of what is scrolled. */
  padding: var(--space-3xs);
}

/* The sections are made for a page: inside the sheet they do not need the space around them. */
.explore__sheet :deep(.about),
.explore__sheet :deep(.contact) {
  padding-block: 0;
  border-top: 0;
}

.explore__sheet :deep(.container) {
  padding-inline: 0;
}

.explore__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
/* Only a phone held upright: the rooms are wide, so ask for landscape (it cannot be forced on the web). */
.explore__rotate {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 5;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background-color: var(--color-scrim);
  text-align: center;
}

@media (pointer: coarse) and (orientation: portrait) {
  .explore__rotate {
    display: flex;
  }
}
</style>
