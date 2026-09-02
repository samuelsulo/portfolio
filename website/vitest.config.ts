import { fileURLToPath, URL } from 'node:url'

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Unit test sources live in the top-level `tests/unit/` directory (see
// repository structure in CLAUDE.md), while the app they exercise lives in
// `website/src/`. This config keeps Vitest rooted in `website/` for the
// Vite/TS toolchain while discovering specs from the shared tests folder.
export default mergeConfig(
  viteConfig,
  defineConfig({
    server: {
      fs: {
        allow: [fileURLToPath(new URL('../', import.meta.url))],
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      root: fileURLToPath(new URL('./', import.meta.url)),
      include: ['../tests/unit/**/*.spec.ts'],
    },
  }),
)
