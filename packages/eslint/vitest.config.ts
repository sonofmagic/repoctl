import path from 'node:path'
import { defineProject } from 'vitest/config'

const PACKAGE_SRC_GLOB = `${path.resolve(__dirname, './src').replaceAll(path.sep, '/')}/**`

export default defineProject({
  test: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: '@icebreakers/stylelint-config',
        replacement: path.resolve(__dirname, '../stylelint/src/index.ts'),
      },
      {
        find: '@icebreakers/eslint-config/stylelint',
        replacement: path.resolve(__dirname, './src/stylelint.ts'),
      },
      {
        find: 'eslint-plugin-better-stylelint',
        replacement: path.resolve(__dirname, '../eslint-plugin-better-stylelint/src/index.ts'),
      },
    ],
    globals: true,
    hookTimeout: 60_000,
    testTimeout: 60_000,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      all: true,
      skipFull: true,
      include: [
        PACKAGE_SRC_GLOB,
      ],
      exclude: [
        '**/*.d.ts',
        '**/dist/**',
        path.resolve(__dirname, '../eslint-plugin-better-stylelint/src/**').replaceAll(path.sep, '/'),
        path.resolve(__dirname, '../stylelint/src/**').replaceAll(path.sep, '/'),
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
})
