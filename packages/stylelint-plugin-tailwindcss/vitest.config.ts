import path from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(import.meta.dirname, './src'),
      },
      {
        find: 'postcss-tailwindcss',
        replacement: path.resolve(import.meta.dirname, '../postcss-tailwindcss/src/index.ts'),
      },
    ],
    globals: true,
    testTimeout: 60_000,
    coverage: {
      enabled: true,
      provider: 'v8',
      all: true,
      skipFull: true,
      include: [
        'src/**',
      ],
      exclude: [
        '**/*.d.ts',
        '**/dist/**',
      ],
    },
  },
})
