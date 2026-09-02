import { createStylelintConfig, icebreaker } from '@/index'

vi.mock('@/config', () => {
  return {
    createIcebreakerStylelintConfig: vi.fn((config?: Record<string, unknown>) => ({
      extends: (config?.['extends'] as string[] | undefined) ?? ['base'],
      rules: {
        'selector-class-pattern': (config?.['rules'] as Record<string, unknown> | undefined)?.['selector-class-pattern'] ?? ['base'],
      },
    })),
  }
})

describe('index helpers', () => {
  it('re-exports createStylelintConfig', () => {
    const config = createStylelintConfig()
    expect(config.extends).toEqual(['base'])
  })

  it('merges overrides into the base config', () => {
    const override = {
      miniProgram: true,
      extends: ['override'],
      rules: {
        'selector-class-pattern': ['override'],
      },
    }

    const config = icebreaker(override)

    expect(config.extends).toEqual(['override'])
    expect(config.rules?.['selector-class-pattern']).toEqual(['override'])
  })

  it('returns the base config when no overrides are provided', () => {
    const config = icebreaker()

    expect(config.extends).toEqual(['base'])
    expect(config.rules?.['selector-class-pattern']).toEqual(['base'])
  })
})
