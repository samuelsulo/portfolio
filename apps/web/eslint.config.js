import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**'],
  },
  ...pluginVue.configs['flat/essential'],
  ...vueTsEslintConfig(),
  {
    name: 'app/kitsune-fixed-mark-name',
    files: ['**/components/ui/Kitsune.vue'],
    rules: {
      // Kitsune is a fixed personal brand mark name (see docs/logo/), not a
      // generic component that should be renamed to satisfy this rule.
      'vue/multi-word-component-names': 'off',
    },
  },
  skipFormatting,
]
