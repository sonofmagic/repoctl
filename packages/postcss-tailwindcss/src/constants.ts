export const ESCAPED_BACKSLASH_RE = /\\\\/g
export const ESCAPED_CHAR_RE = /\\(.)/g
export const WHITESPACE_RE = /\s/
export const IMPORT_TARGET_RE = /^['"]|['"]$/g
export const SELECTOR_BREAK_RE = /[#.,\s>+~]/

export const TAILWIND_CONFIG_FILENAMES = [
  'tailwind.config.ts',
  'tailwind.config.mts',
  'tailwind.config.cts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
  'tailwind.config.json',
] as const

export const TAILWIND_V4_AT_RULES = [
  'theme',
  'source',
  'utility',
  'variant',
  'custom-variant',
  'plugin',
  'reference',
] as const

export const TAILWIND_IMPORT_FUNCTIONS = [
  'source',
  'prefix',
  'layer',
  'supports',
] as const
