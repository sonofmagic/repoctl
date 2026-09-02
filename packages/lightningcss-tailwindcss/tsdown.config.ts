import { defineConfig } from 'tsdown'

export default defineConfig({
  checks: {
    pluginTimings: false,
  },
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  fixedExtension: false,
})
