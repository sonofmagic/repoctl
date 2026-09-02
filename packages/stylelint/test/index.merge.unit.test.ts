import type { StylelintConfig } from '@/types'

describe('mergeConfigs branches', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('handles missing rules on base and overrides', async () => {
    vi.doMock('@/config', () => {
      return {
        createIcebreakerStylelintConfig: vi.fn((config?: StylelintConfig) => ({
          extends: config?.extends ?? ['base'],
          rules: config?.rules ?? {},
        })),
      }
    })

    const { icebreaker } = await import('@/index')
    const override: StylelintConfig = {
      extends: ['override'],
    }

    const config = icebreaker(override)

    expect(config.extends).toEqual(['override'])
    expect(config.rules).toEqual({})
  })
})
