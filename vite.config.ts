import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Declared locally so this config needs no @types/node.
declare const process: { env: Record<string, string | undefined> }

// Resolve the src alias without depending on Node typings.
const srcDir = new URL('./src', import.meta.url).pathname

/**
 * The dev server binds 0.0.0.0 so the Cloud preview proxy can reach it, but
 * Vite only answers requests whose Host header it recognises. Extend this list
 * with VITE_ALLOWED_HOSTS (comma separated) when the preview hostname changes.
 */
const previewHosts = [
  'pv-08a3c213da18-9c075a7a-f47e-41b9-9c8f-7cfcbac77741.style.dev',
  ...(process.env.VITE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean),
]

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    allowedHosts: previewHosts,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: previewHosts,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
