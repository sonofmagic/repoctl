import { createStylelintConfig } from '@icebreakers/stylelint-config'
import { resolveStylelintConfig } from '@/stylelint'

describe('stylelint bridge helpers', () => {
  it('delegates stylelint config creation', () => {
    const options = {
      presets: {
        order: false,
      },
      rules: {
        'color-named': 'never',
      },
    } as const

    expect(resolveStylelintConfig(options)).toEqual(createStylelintConfig(options))
  })

  it('creates a default stylelint config when no options are provided', () => {
    expect(resolveStylelintConfig()).toEqual(createStylelintConfig())
  })
})
