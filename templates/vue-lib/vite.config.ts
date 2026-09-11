import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import { mergeConfig } from 'vite'
import DTS from 'vite-plugin-dts'
import { sharedConfig } from './vite.shared.config.ts'

export default mergeConfig(sharedConfig, {
  plugins: [
    Vue(),
    DTS(
      {
        tsconfigPath: './tsconfig.app.json',
        entryRoot: './src',
      },
    ),
  ],
  // https://vite.dev/guide/build.html#library-mode
  build: {
    target: 'baseline-widely-available',
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index'),
      name: 'icebreaker',
      // the proper extensions will be added
      fileName: 'index',
    },
    rolldownOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
