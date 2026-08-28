import { createApp } from 'vue'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.vue'
import { i18n } from './i18n'
import { vReveal } from './directives/reveal'

createApp(App).use(i18n).directive('reveal', vReveal).mount('#app')
