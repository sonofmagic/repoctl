import {
  DEFAULT_IGNORE_AT_RULES,
  DEFAULT_IGNORE_TYPES,
  DEFAULT_IGNORE_UNITS,
  PRESET_RECESS_ORDER,
  PRESET_STANDARD_SCSS,
  PRESET_VUE_SCSS,
} from '@/constants'

describe('constants', () => {
  it('exposes preset specifiers', () => {
    expect(PRESET_STANDARD_SCSS).toBe('stylelint-config-standard-scss')
    expect(PRESET_VUE_SCSS).toBe('stylelint-config-recommended-vue/scss')
    expect(PRESET_RECESS_ORDER).toBe('stylelint-config-recess-order')
  })

  it('defines default ignore lists', () => {
    expect(DEFAULT_IGNORE_UNITS).toContain('rpx')
    expect(DEFAULT_IGNORE_TYPES).toContain('page')
    expect(DEFAULT_IGNORE_AT_RULES).toContain('tailwind')
  })
})
