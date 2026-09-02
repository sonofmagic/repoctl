import { defineConfig } from 'tsdown'

export default defineConfig({
  checks: {
    pluginTimings: false,
  },
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  fixedExtension: false,
  outputOptions: {
    exports: 'named',
  },
})
