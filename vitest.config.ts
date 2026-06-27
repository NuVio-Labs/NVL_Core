import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Eigene Vitest-Config (getrennt von vite.config.ts), damit PWA-/Build-Plugins
// die Tests nicht beeinflussen. Reine Logik-Tests laufen im node-Environment;
// auf jsdom bewusst verzichtet, bis es UI-Tests gibt.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: false,
  },
})
