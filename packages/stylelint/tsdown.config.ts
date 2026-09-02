import { defineConfig } from 'tsdown'

export default defineConfig({
  checks: {
    pluginTimings: false,
  },
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: {
    resolver: 'tsc',
  },
  clean: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false,
  },
})
