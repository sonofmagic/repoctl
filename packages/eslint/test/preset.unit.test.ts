import {
  resolveAccessibilityPresets,
  resolveBetterTailwindPresets,
  resolveMdxPresets,
  resolveMiniProgramCompatibilityPresets,
  resolveNestPresets,
  resolveQueryPresets,
  resolveStylelintBridgePresets,
  resolveTailwindPresets,
} from '@/features'
import { getPresets } from '@/preset'

vi.mock('@/features', () => {
  return {
    resolveStylelintBridgePresets: vi.fn(() => [{ name: 'stylelint' }]),
    resolveTailwindPresets: vi.fn(() => [{ name: 'tailwind' }]),
    resolveBetterTailwindPresets: vi.fn(() => [{ name: 'better-tailwind' }]),
    resolveMdxPresets: vi.fn(() => [{ name: 'mdx' }]),
    resolveMiniProgramCompatibilityPresets: vi.fn(() => [{ name: 'wevu-compatibility' }]),
    resolveNestPresets: vi.fn(() => [{ name: 'nestjs' }]),
    resolveQueryPresets: vi.fn(() => [{ name: 'query' }]),
    resolveAccessibilityPresets: vi.fn(() => [{ name: 'a11y' }]),
  }
})

const resolveStylelintBridgePresetsMock = vi.mocked(resolveStylelintBridgePresets)
const resolveTailwindPresetsMock = vi.mocked(resolveTailwindPresets)
const resolveBetterTailwindPresetsMock = vi.mocked(resolveBetterTailwindPresets)
const resolveMdxPresetsMock = vi.mocked(resolveMdxPresets)
const resolveMiniProgramCompatibilityPresetsMock = vi.mocked(resolveMiniProgramCompatibilityPresets)
const resolveNestPresetsMock = vi.mocked(resolveNestPresets)
const resolveQueryPresetsMock = vi.mocked(resolveQueryPresets)
const resolveAccessibilityPresetsMock = vi.mocked(resolveAccessibilityPresets)

function toConfigObject(value: unknown): { name?: string, rules?: Record<string, unknown> } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as { name?: string, rules?: Record<string, unknown> }
}

describe('getPresets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns resolved options and base config', () => {
    const [resolved, baseConfig] = getPresets()
    const base = toConfigObject(baseConfig)

    expect(resolved.formatters).toEqual(expect.objectContaining({
      css: true,
      html: true,
      markdown: true,
      graphql: true,
    }))
    expect(base.rules?.['pnpm/json-enforce-catalog']).toBe('off')
    expect(resolveStylelintBridgePresetsMock).toHaveBeenCalledWith(undefined)
  })

  it('appends feature presets in the expected order', () => {
    const [, ...presets] = getPresets({
      tailwindcss: true,
      betterTailwindcss: true,
      mdx: true,
      nestjs: true,
      query: true,
      a11y: true,
      vue: true,
      react: true,
      miniProgram: true,
    })
    const base = presets
      .map(preset => toConfigObject(preset))
      .find(config => config.rules?.['unicorn/prefer-number-properties']) ?? {}

    expect(base.rules?.['unicorn/prefer-number-properties']).toBe('warn')
    expect(resolveStylelintBridgePresetsMock).toHaveBeenCalledWith(undefined)
    expect(resolveTailwindPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveBetterTailwindPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveMdxPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveMiniProgramCompatibilityPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveNestPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveQueryPresetsMock).toHaveBeenCalledWith(true)
    expect(resolveAccessibilityPresetsMock).toHaveBeenCalledWith(true, expect.any(Object), true)

    const presetNames = presets
      .map(preset => toConfigObject(preset).name)
      .filter((name): name is string => typeof name === 'string')

    expect(presetNames).toEqual([
      'icebreaker/vue-style-blocks-parser',
      'wevu-compatibility',
      'stylelint',
      'tailwind',
      'better-tailwind',
      'mdx',
      'nestjs',
      'query',
      'a11y',
    ])
  })

  it('prepends miniProgram ignores and globals when enabled', () => {
    const [, ignoreConfig, globalsConfig] = getPresets({
      miniProgram: true,
    })
    const ignorePreset = toConfigObject(ignoreConfig)
    const globalsPreset = toConfigObject(globalsConfig)

    expect(ignorePreset).toMatchObject({
      ignores: expect.arrayContaining([
        'dist/**',
        '.weapp-vite/**',
        'project.config.json',
        'project.private.config.json',
      ]),
    })
    expect(globalsPreset).toMatchObject({
      files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx,vue}'],
      languageOptions: {
        globals: expect.objectContaining({
          wx: 'readonly',
          Page: 'readonly',
          WechatMiniprogram: 'readonly',
        }),
      },
    })
    expect(resolveMiniProgramCompatibilityPresetsMock).toHaveBeenCalledWith(true)
  })

  it('enables compatibility presets through the legacy weapp alias', () => {
    getPresets({
      weapp: true,
    })

    expect(resolveMiniProgramCompatibilityPresetsMock).toHaveBeenCalledWith(true)
  })

  it('uses legacy rules when requested', () => {
    const [, baseConfig] = getPresets(undefined, 'legacy')
    const base = toConfigObject(baseConfig)

    expect(base.rules?.['perfectionist/sort-imports']).toBe('off')
  })
})
