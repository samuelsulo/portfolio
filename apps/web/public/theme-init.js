// Applies the stored theme before the first paint, so a visitor who chose a
// theme never sees a flash of the other one. Kept as a plain script on
// purpose: it must run synchronously from <head>, before the app bundle.
// Keep the key in sync with THEME_STORAGE_KEY in src/composables/useTheme.ts.
try {
  var theme = localStorage.getItem('samuelsulo-portfolio:theme')
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
  }
} catch {
  // Storage unavailable: follow the OS preference.
}
