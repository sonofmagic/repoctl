import {
  analyzeTailwindCss,
  collectApplyCandidates,
  collectImportDirectives,
  collectThemeCalls,
  collectUtilitySelectors,
  detectTailwindVersion,
  parseTailwindCss,
} from '@/index'

describe('lightningcss-tailwindcss', () => {
  it('parses css with stylesheet and warnings', () => {
    const result = parseTailwindCss('@import "tailwindcss" source(none);')
    expect(result.stylesheet.rules).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
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
      '@theme { --color-brand: red; }',
      '.btn { width: --spacing(2); }',
    ].join('\n')

    expect(detectTailwindVersion(css)).toBe(4)
  })

  it('collects @apply candidates', () => {
    const css = '.btn { @apply flex hover:bg-red-500 w-[10px] !mt-4; }'
    expect(collectApplyCandidates(css).map(item => item.candidate)).toEqual([
      'flex',
      'hover:bg-red-500',
      'w-[10px]',
      '!mt-4',
    ])
  })

  it('collects theme() calls', () => {
    const css = '.btn { color: theme(colors.gray.900 / 75%); margin: theme(spacing[2.5]); }'
    expect(collectThemeCalls(css)).toEqual([
      {
        functionName: 'theme',
        raw: 'colors.gray.900 / 75%',
        path: 'colors.gray.900',
        opacity: '75%',
      },
      {
        functionName: 'theme',
        raw: 'spacing[2.5]',
        path: 'spacing[2.5]',
        opacity: null,
      },
    ])
  })

  it('collects Tailwind import directives with v4 extension functions', () => {
    const css = '@import "tailwindcss/utilities.css" source(none) prefix(tw) layer(utilities) screen and (min-width: 640px);'
    const [directive] = collectImportDirectives(css)

    expect(directive).toMatchObject({
      importTarget: 'tailwindcss/utilities.css',
      hasLayerKeyword: false,
      mediaQuery: 'screen and (min-width: 640px)',
    })
    expect(directive?.functions).toEqual([
      { name: 'source', value: 'none' },
      { name: 'prefix', value: 'tw' },
      { name: 'layer', value: 'utilities' },
    ])
  })

  it('collects utility selectors from Lightning CSS selectors', () => {
    const css = [
      '.flex { display:flex }',
      '.hover\\:bg-red-500:hover { background:red }',
      '.card__body { color:red }',
    ].join('\n')

    expect(collectUtilitySelectors(css).map(item => item.className)).toEqual([
      'flex',
      'hover:bg-red-500',
      'card__body',
    ])
  })

  it('aggregates analysis results', () => {
    const css = [
      '@import "tailwindcss" source(none);',
      '.btn { @apply flex; color: theme(colors.gray.900 / 75%); }',
      '.flex { display:flex }',
    ].join('\n')

    const analysis = analyzeTailwindCss(css)
    expect(analysis.version).toBe(4)
    expect(analysis.applyCandidates).toHaveLength(1)
    expect(analysis.themeCalls).toHaveLength(1)
    expect(analysis.utilitySelectors).toHaveLength(2)
    expect(analysis.warnings.length).toBeGreaterThan(0)
  })
})
