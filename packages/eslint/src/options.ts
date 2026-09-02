import type { Linter } from 'eslint'
import type { OptionsVue } from './antfu'
import type { BetterTailwindcssOption, UserDefinedOptions } from './types'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { defu } from 'defu'
import { getDefaultTypescriptOptions, getDefaultVueOptions, isMiniProgramEnabled } from './defaults'
import { isObject } from './utils'

const BASE_DEFAULTS: Pick<UserDefinedOptions, 'formatters' | 'javascript' | 'test' | 'pnpm'> = {
  formatters: true,
  pnpm: false,
  javascript: {
    overrides: {
      'curly': ['error', 'all'],
      'no-console': ['warn'],
    },
  },
  test: {
    overrides: {
      'test/prefer-lowercase-title': ['off'],
    },
  },
}

const BASE_RULES: Partial<Linter.RulesRecord> = {
  // `noPropertyAccessFromIndexSignature` requires bracket access (`obj['key']`)
  // for index-signature properties, which conflicts with ESLint core `dot-notation`.
  'dot-notation': 'off',
  // Keep dependency bans visible without blocking CI on upstream preset defaults.
  'e18e/ban-dependencies': ['warn', {
    allowed: [
      'axios',
      'lint-staged',
    ],
  }],
  // Disable until upstream fixes false positives on non-array iterables (Set, Map).
  // See: [...new Set(arr)].sort() → new Set(arr).toSorted() is invalid.
  'e18e/prefer-array-to-sorted': 'off',
  // Disable all pnpm rules by default
  // @antfu/eslint-config auto-enables pnpm plugin when pnpm-workspace.yaml exists
  // but we want it opt-in instead of auto-enabled
  'pnpm/json-enforce-catalog': 'off',
  'pnpm/json-prefer-workspace-settings': 'off',
  'pnpm/json-valid-catalog': 'off',
  'pnpm/yaml-enforce-settings': 'off',
  'pnpm/yaml-no-duplicate-catalog-item': 'off',
  'pnpm/yaml-no-unused-catalog-item': 'off',
  'unused-imports/no-unused-vars': 'off',
  'unicorn/prefer-number-properties': 'warn',
}

export type ResolvedUserOptions = UserDefinedOptions & {
  tailwindcss?: boolean
  betterTailwindcss?: BetterTailwindcssOption | boolean
}

type FormatterOptions = Exclude<UserDefinedOptions['formatters'], boolean | undefined>
type FormatterPrettierOptions = NonNullable<FormatterOptions['prettierOptions']>
type FormatterOxfmtOptions = NonNullable<FormatterOptions['oxfmtOptions']>
type EditorConfigEndOfLine = Extract<
  FormatterPrettierOptions['endOfLine'],
  'lf' | 'crlf' | 'cr'
>

const require = createRequire(import.meta.url)
const ANTFU_PACKAGE_DIR = path.dirname(
  require.resolve('@antfu/eslint-config/package.json'),
)
const GENERAL_EDITORCONFIG_SECTIONS = new Set([
  '*',
  '**',
  '**/*',
  '*.*',
  '**.*',
  '**/*.*',
])
const NEWLINE_PATTERN = /\r?\n/u

function mergeOptionWithDefaults<T extends object>(
  input: T | boolean | undefined,
  defaults: T,
  options: {
    postProcess?: (merged: T) => void
    useDefaultWhenUndefined?: boolean
  } = {},
): T | boolean | undefined {
  const { postProcess, useDefaultWhenUndefined = false } = options
  const shouldUseDefaults = input === true || (useDefaultWhenUndefined && input === undefined)

  if (shouldUseDefaults) {
    postProcess?.(defaults)
    return defaults
  }

  if (isObject(input)) {
    const merged = defu(input, defaults)
    postProcess?.(merged)
    return merged
  }

  return input
}

function applyVueVersionSpecificRules(option: OptionsVue | boolean | undefined): void {
  if (!option || typeof option !== 'object') {
    return
  }

  const overrides = option.overrides
  if (!overrides) {
    return
  }

  if (option.vueVersion === 2) {
    Object.assign(overrides, {
      'vue/no-v-for-template-key-on-child': 'off',
      'vue/no-v-for-template-key': 'error',
      'vue/no-deprecated-v-bind-sync': 'off',
    })
    return
  }

  Object.assign(overrides, {
    'vue/no-v-for-template-key-on-child': 'error',
    'vue/no-v-for-template-key': 'off',
  })
}

function isPackageAvailable(name: string, paths?: string[]): boolean {
  try {
    require.resolve(name, paths ? { paths } : undefined)
    return true
  }
  catch {
    return false
  }
}

function getDefaultFormatterOptions(cwd = process.cwd()): FormatterOptions {
  const hasXmlPlugin = isPackageAvailable('@prettier/plugin-xml', [ANTFU_PACKAGE_DIR])
  const hasSlidev = isPackageAvailable('@slidev/cli', [cwd])

  return {
    astro: isPackageAvailable('prettier-plugin-astro', [ANTFU_PACKAGE_DIR]),
    css: true,
    graphql: true,
    html: true,
    markdown: true,
    slidev: hasSlidev,
    svg: hasXmlPlugin,
    xml: hasXmlPlugin,
  }
}

function normalizeEditorConfigEndOfLine(value: string): EditorConfigEndOfLine | undefined {
  switch (value.trim().toLowerCase()) {
    case 'cr':
    case 'crlf':
    case 'lf':
      return value.trim().toLowerCase() as EditorConfigEndOfLine
    default:
      return undefined
  }
}

function isGeneralEditorConfigSection(section: string): boolean {
  return GENERAL_EDITORCONFIG_SECTIONS.has(section.trim())
}

function parseEditorConfig(filePath: string): {
  endOfLine?: EditorConfigEndOfLine
  isRoot: boolean
} {
  const lines = fs.readFileSync(filePath, 'utf8').split(NEWLINE_PATTERN)
  let currentSection: string | undefined
  let endOfLine: EditorConfigEndOfLine | undefined
  let isRoot = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#') || line.startsWith(';')) {
      continue
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1).trim()
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line.slice(separatorIndex + 1).trim()

    if (!currentSection && key === 'root') {
      isRoot = value.toLowerCase() === 'true'
      continue
    }

    if (key !== 'end_of_line') {
      continue
    }

    const normalized = normalizeEditorConfigEndOfLine(value)
    if (!normalized) {
      continue
    }

    if (!currentSection || isGeneralEditorConfigSection(currentSection)) {
      endOfLine = normalized
    }
  }

  return endOfLine
    ? {
        endOfLine,
        isRoot,
      }
    : {
        isRoot,
      }
}

function inferPrettierEndOfLineFromEditorConfig(cwd = process.cwd()): EditorConfigEndOfLine | undefined {
  const configs: string[] = []
  let currentDir = path.resolve(cwd)

  while (true) {
    const editorConfigPath = path.join(currentDir, '.editorconfig')

    if (fs.existsSync(editorConfigPath)) {
      configs.push(editorConfigPath)

      if (parseEditorConfig(editorConfigPath).isRoot) {
        break
      }
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      break
    }
    currentDir = parentDir
  }

  let endOfLine: EditorConfigEndOfLine | undefined

  for (const filePath of configs.reverse()) {
    const parsed = parseEditorConfig(filePath)
    if (parsed.endOfLine) {
      endOfLine = parsed.endOfLine
    }
  }

  return endOfLine
}

function resolveFormattersOption(
  input: UserDefinedOptions['formatters'],
  cwd = process.cwd(),
): Exclude<UserDefinedOptions['formatters'], undefined> {
  if (input === false) {
    return false
  }

  const defaults = getDefaultFormatterOptions(cwd)
  const inferredEndOfLine = inferPrettierEndOfLineFromEditorConfig(cwd)
  const defaultsWithFormattingEngines = inferredEndOfLine
    ? defu<FormatterOptions, [FormatterOptions]>(
        {
          oxfmtOptions: {
            endOfLine: inferredEndOfLine,
          } satisfies FormatterOxfmtOptions,
          prettierOptions: {
            endOfLine: inferredEndOfLine,
          },
        },
        defaults,
      )
    : defaults

  if (input === undefined) {
    return defaultsWithFormattingEngines
  }

  if (input === true) {
    return defaultsWithFormattingEngines
  }

  if (isObject(input)) {
    return defu(input, defaultsWithFormattingEngines)
  }

  return defaultsWithFormattingEngines
}

export function resolveUserOptions(options?: UserDefinedOptions): ResolvedUserOptions {
  const resolved = defu<UserDefinedOptions, [UserDefinedOptions, typeof BASE_DEFAULTS]>(
    {},
    options ?? {},
    BASE_DEFAULTS,
  ) as ResolvedUserOptions

  if (isMiniProgramEnabled(options)) {
    resolved.miniProgram = true
    delete resolved.weapp
  }

  const legacyTailwindcssOption = resolved.tailwindcss as unknown
  if (isObject(legacyTailwindcssOption)) {
    resolved.betterTailwindcss ??= legacyTailwindcssOption as BetterTailwindcssOption
    delete resolved.tailwindcss
  }

  const resolvedVue = mergeOptionWithDefaults(
    resolved.vue,
    getDefaultVueOptions(options),
    {
      postProcess: applyVueVersionSpecificRules,
    },
  )
  if (resolvedVue === undefined) {
    delete resolved.vue
  }
  else {
    resolved.vue = resolvedVue
  }

  const resolvedTypescript = mergeOptionWithDefaults(
    resolved.typescript,
    getDefaultTypescriptOptions(options),
    {
      useDefaultWhenUndefined: true,
    },
  )
  if (resolvedTypescript === undefined) {
    delete resolved.typescript
  }
  else {
    resolved.typescript = resolvedTypescript
  }

  resolved.formatters = resolveFormattersOption(options?.formatters)

  return resolved
}

export function createBaseRuleSet(isLegacy: boolean): Partial<Linter.RulesRecord> {
  if (!isLegacy) {
    return BASE_RULES
  }

  return {
    ...BASE_RULES,
    'perfectionist/sort-imports': 'off',
  }
}

export { applyVueVersionSpecificRules as __applyVueVersionSpecificRules }
export { inferPrettierEndOfLineFromEditorConfig as __inferPrettierEndOfLineFromEditorConfig }
export { isPackageAvailable as __isPackageAvailable }
export { parseEditorConfig as __parseEditorConfig }
export { resolveFormattersOption as __resolveFormattersOption }
