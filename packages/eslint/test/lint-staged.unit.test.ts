import { createStylelintCommand, isGeneratedFixtureOutput, isStylelintDemoFile } from '../../../lint-staged.config.js'

describe('lint-staged stylelint filtering', () => {
  it('detects mock stylelint demo files in both relative and absolute forms', () => {
    expect(isStylelintDemoFile('apps/mock/src/stylelint-demo/demo.css')).toBe(true)
    expect(isStylelintDemoFile('/repo/apps/mock/src/stylelint-demo/demo.css')).toBe(true)
    expect(isStylelintDemoFile('packages/eslint/src/options.ts')).toBe(false)
  })

  it('detects generated eslint fixture outputs in both relative and absolute forms', () => {
    expect(isGeneratedFixtureOutput('packages/eslint/fixtures/output/all/vue-ts.vue')).toBe(true)
    expect(isGeneratedFixtureOutput('/repo/packages/eslint/fixtures/output/all/css.css')).toBe(true)
    expect(isGeneratedFixtureOutput('apps/mock/src/stylelint-demo/demo.css')).toBe(false)
  })

  it('returns no stylelint command when every file is excluded from autofix', () => {
    expect(createStylelintCommand([
      'apps/mock/src/stylelint-demo/demo.css',
      'packages/eslint/fixtures/output/all/vue-ts.vue',
    ])).toEqual([])
  })

  it('keeps only non-demo, non-fixture style files in the generated command', () => {
    const commands = createStylelintCommand([
      'apps/mock/src/stylelint-demo/demo.css',
      'packages/eslint/fixtures/output/all/vue-ts.vue',
      'packages/stylelint/src/config.ts',
      'packages/stylelint/fixtures/index.scss',
    ])

    expect(commands).toHaveLength(1)
    expect(commands[0]).toContain(`'packages/stylelint/src/config.ts'`)
    expect(commands[0]).toContain(`'packages/stylelint/fixtures/index.scss'`)
    expect(commands[0]).not.toContain('apps/mock/src/stylelint-demo/demo.css')
    expect(commands[0]).not.toContain('packages/eslint/fixtures/output/all/vue-ts.vue')
  })
})
