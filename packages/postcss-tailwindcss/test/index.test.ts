import path from 'node:path'
import {
  analyzeTailwindCss,
  collectApplyCandidates,
  collectImportDirectives,
  collectThemeCalls,
  collectUtilitySelectors,
  detectInstalledTailwindVersion,
  detectTailwindVersion,
  parseTailwindCss,
  resolveTailwindRuntime,
} from '@/index'

const PACKAGE_DIR = path.resolve(__dirname, '..')

describe('postcss-tailwindcss', () => {
  it('parses CSS strings into PostCSS roots', () => {
    const root = parseTailwindCss('.demo { color: red; }')
    expect(root.type).toBe('root')
    expect(root.first?.type).toBe('rule')
  })

  it('accepts already parsed PostCSS roots across analysis helpers', () => {
    const root = parseTailwindCss([
      '@import "tailwindcss" source(none);',
      '.card { @apply flex gap-2; }',
      '.text-brand { color: --alpha(var(--color-brand) / 50%); }',
    ].join('\n'))

    expect(detectTailwindVersion(root)).toBe(4)
    expect(collectApplyCandidates(root).map(item => item.candidate)).toEqual([
      'flex',
      'gap-2',
    ])
    expect(collectImportDirectives(root).map(item => item.importTarget)).toEqual([
      'tailwindcss',
    ])
    expect(analyzeTailwindCss(root)).toMatchObject({
      version: 4,
      applyCandidates: [
        expect.objectContaining({ candidate: 'flex' }),
        expect.objectContaining({ candidate: 'gap-2' }),
      ],
    })
  })

  it('detects Tailwind v3 syntax', () => {
    const css = [
      '@config "./tailwind.config.js";',
      '@tailwind utilities;',
      '.btn { color: theme(colors.gray.900 / 75%); }',
    ].join('\n')

    expect(detectTailwindVersion(css)).toBe(3)
  })

  it('detects Tailwind v4 syntax', () => {
    const css = [
      '@import "tailwindcss" source(none) prefix(tw);',
      '@theme { --color-brand: oklch(0.5 0.2 250); }',
      '.btn { color: --alpha(var(--color-brand) / 50%); }',
    ].join('\n')

    expect(detectTailwindVersion(css)).toBe(4)
  })

  it('collects @apply candidates including variants and arbitrary values', () => {
    const css = [
      '.btn {',
      '  @apply flex hover:bg-red-500 w-[10px] !mt-4;',
      '}',
    ].join('\n')

    expect(collectApplyCandidates(css).map(item => item.candidate)).toEqual([
      'flex',
      'hover:bg-red-500',
      'w-[10px]',
      '!mt-4',
    ])
  })

  it('collects theme() calls and normalizes path/opacity', () => {
    const css = [
      '.btn {',
      '  color: theme(colors.gray.900 / 75%);',
      '  margin: theme(spacing[2.5]);',
      '}',
    ].join('\n')

    expect(collectThemeCalls(css).map(item => ({
      opacity: item.opacity,
      path: item.path,
      raw: item.raw,
    }))).toEqual([
      {
        raw: 'colors.gray.900 / 75%',
        path: 'colors.gray.900',
        opacity: '75%',
      },
      {
        raw: 'spacing[2.5]',
        path: 'spacing[2.5]',
        opacity: null,
      },
    ])
  })

  it('collects Tailwind v4 import directives', () => {
    const css = '@import "tailwindcss/utilities.css" source(none) prefix(tw) layer(utilities) screen and (min-width: 640px);'
    const [directive] = collectImportDirectives(css)

    expect(directive).toMatchObject({
      importTarget: 'tailwindcss/utilities.css',
      hasLayerKeyword: false,
      mediaQuery: 'screen and (min-width: 640px)',
    })
    expect(directive?.functions).toEqual([
      {
        name: 'source',
        value: 'none',
      },
      {
        name: 'prefix',
        value: 'tw',
      },
      {
        name: 'layer',
        value: 'utilities',
      },
    ])
  })

  it('collects utility selectors from PostCSS rules', () => {
    const css = [
      '.flex { display: flex; }',
      '.hover\\\\:bg-red-500:hover { background: red; }',
      '.card__body { color: red; }',
    ].join('\n')

    expect(collectUtilitySelectors(css).map(item => item.className)).toEqual([
      'flex',
      'hover:bg-red-500',
      'card__body',
    ])
  })

  it('aggregates analysis results', () => {
    const css = [
      '@tailwind utilities;',
      '.btn {',
      '  @apply flex;',
      '  color: theme(colors.gray.900 / 75%);',
      '}',
      '.flex { display: flex; }',
    ].join('\n')

    const analysis = analyzeTailwindCss(css)

    expect(analysis.version).toBe(3)
    expect(analysis.applyCandidates).toHaveLength(1)
    expect(analysis.themeCalls).toHaveLength(1)
    expect(analysis.utilitySelectors).toHaveLength(2)
  })

  it('resolves Tailwind runtime details from the current workspace', () => {
    const runtime = resolveTailwindRuntime({
      cwd: PACKAGE_DIR,
    })

    expect(runtime.packageJsonPath).toContain('tailwindcss')
    expect(runtime.installationPath).toContain('tailwindcss')
    expect(runtime.version).toMatch(/^[34]\./)
  })

  it('detects the installed Tailwind major version from the current workspace', () => {
    expect([3, 4]).toContain(detectInstalledTailwindVersion({
      cwd: PACKAGE_DIR,
    }))
  })
})
