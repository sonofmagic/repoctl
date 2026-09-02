import type { UserConfigItem, UserDefinedOptions } from './types'
import { parserPlain } from './antfu'
import { resolveAccessibilityPresets, resolveBetterTailwindPresets, resolveMdxPresets, resolveMiniProgramCompatibilityPresets, resolveNestPresets, resolveQueryPresets, resolveStylelintBridgePresets, resolveTailwindPresets } from './features'
import { createBaseRuleSet, resolveUserOptions } from './options'

const MINI_PROGRAM_IGNORES = [
  'dist/**',
  '.weapp-vite/**',
  'miniprogram_npm/**',
  'node_modules/**',
  'project.config.json',
  'project.private.config.json',
] as const

const MINI_PROGRAM_GLOBALS = {
  wx: 'readonly',
  Page: 'readonly',
  App: 'readonly',
  Component: 'readonly',
  getApp: 'readonly',
  getCurrentPages: 'readonly',
  requirePlugin: 'readonly',
  WechatMiniprogram: 'readonly',
} as const

export function getPresets(options?: UserDefinedOptions, mode?: 'legacy'): [UserDefinedOptions, ...UserConfigItem[]] {
  const resolved = resolveUserOptions(options)
  const presets: UserConfigItem[] = [
    ...(resolved.miniProgram
      ? [
          {
            ignores: [...MINI_PROGRAM_IGNORES],
          },
          {
            files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}'],
            languageOptions: {
              globals: MINI_PROGRAM_GLOBALS,
            },
          },
        ]
      : []),
    {
      rules: createBaseRuleSet(mode === 'legacy'),
    },
    {
      files: ['**/*.{css,scss,sass,less,pcss,postcss,json,jsonc,json5}'],
      rules: {
        'style/eol-last': 'off',
      },
    },
    {
      files: ['**/*.{json,jsonc,json5}'],
      rules: {
        'unicorn/prefer-number-properties': 'off',
      },
    },
  ]

  // When Vue is enabled, eslint-processor-vue-blocks extracts <style> blocks
  // as virtual CSS files (e.g. Foo.vue/1_style.css). These need parserPlain so
  // ESLint doesn't try to parse them as JavaScript. The formatter configs
  // normally provide this parser, but when formatters: false the virtual files
  // would hit the default JS parser and throw "Parsing error: Unexpected token ."
  if (resolved.vue !== false && resolved.vue !== undefined) {
    presets.push({
      name: 'icebreaker/vue-style-blocks-parser',
      files: ['**/*.vue/*.css', '**/*.vue/*.scss', '**/*.vue/*.less', '**/*.vue/*.postcss', '**/*.vue/*.pcss'],
      languageOptions: {
        parser: parserPlain,
      },
      rules: {},
    })
  }

  presets.push(
    ...resolveMiniProgramCompatibilityPresets(resolved.miniProgram),
    ...resolveStylelintBridgePresets(resolved.stylelint),
    ...resolveTailwindPresets(resolved.tailwindcss),
    ...resolveBetterTailwindPresets(resolved.betterTailwindcss),
    ...resolveMdxPresets(resolved.mdx),
    ...resolveNestPresets(resolved.nestjs),
    ...resolveQueryPresets(resolved.query),
    ...resolveAccessibilityPresets(resolved.a11y, resolved.vue, resolved.react),
  )

  return [resolved, ...presets]
}
