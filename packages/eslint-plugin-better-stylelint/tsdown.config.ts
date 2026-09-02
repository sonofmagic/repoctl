import { defineConfig } from 'tsdown'

export default defineConfig({
  checks: {
    pluginTimings: false,
  },
  entry: {
    index: 'src/index.ts',
    // Keep the worker as a standalone output: src/core.ts resolves it at runtime
    // via a sibling-file path swap (`core.(ts|js)` -> `worker.(ts|js)`).
    worker: 'src/worker.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  fixedExtension: false,
})
