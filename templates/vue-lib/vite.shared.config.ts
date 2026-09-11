import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/guide/build.html#library-mode

export const sharedConfig = defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
})
