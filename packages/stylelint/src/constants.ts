export const PRESET_STANDARD_SCSS = 'stylelint-config-standard-scss'
export const PRESET_VUE_SCSS = 'stylelint-config-recommended-vue/scss'
export const PRESET_RECESS_ORDER = 'stylelint-config-recess-order'

export const DEFAULT_IGNORE_AT_RULES = [
  'tailwind',
  'theme',
  'screen',
  'apply',
  'source',
  'utility',
  'variant',
  'custom-variant',
  'reference',
  'config',
  'plugin',
  'unocss',
] as const

export const DEFAULT_IGNORE_TYPES = [
  'page',
] as const

export const DEFAULT_IGNORE_UNITS = [
  'rpx',
] as const
