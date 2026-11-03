import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'server-only': path.resolve(import.meta.dirname, './tests/stubs/server-only.ts'),
    },
  },
})
