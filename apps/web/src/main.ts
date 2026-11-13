import { createApp } from 'vue'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'
import { loadContent } from './content'
import { i18n, type SupportedLocale } from './i18n'
import { vReveal } from './directives/reveal'
import { initTheme } from './composables/useTheme'
import { router } from './router'

initTheme()

/** Shown when the content cannot be fetched: there is nothing to translate it with, so it is bilingual. */
function showLoadError(root: HTMLElement) {
  const message = document.createElement('p')
  message.setAttribute('role', 'alert')
  message.style.cssText = 'padding: 2rem; font-family: sans-serif; color: inherit'
  message.textContent =
    'Impossibile caricare il sito, riprova tra qualche istante. / The site could not be loaded, please try again in a moment.'
  root.replaceChildren(message)
}

async function boot() {
  const root = document.getElementById('app')!
  try {
    // Only the language of the visitor is fetched now, the other one when they switch to it.
    const locale = i18n.global.locale.value as SupportedLocale
    const content = await loadContent(locale)
    i18n.global.setLocaleMessage(locale, content.messages)
  } catch (error) {
    console.error(error)
    showLoadError(root)
    return
  }
  createApp(App).use(router).use(i18n).directive('reveal', vReveal).mount(root)
}

void boot()
