import type { Linter } from 'eslint'
import type {
  BetterStylelintProcessor,
  BetterStylelintRuleOptions,
} from 'eslint-plugin-better-stylelint'
import type {
  ResolvableUserConfig,
  StylelintBridgeOption,
  TypedFlatConfigItem,
  UserConfigItem,
  UserDefinedOptions,
} from './types'
import { createRequire } from 'node:module'
import path from 'node:path'
import { interopDefault } from './antfu'
import { nestjsTypeScriptRules } from './defaults'
import { hasAllPackages } from './utils'

const BETTER_TAILWIND_PACKAGES = ['eslint-plugin-better-tailwindcss']
const TAILWIND_PACKAGES = ['eslint-plugin-tailwindcss', 'tailwindcss']
const STYLELINT_BRIDGE_PACKAGES = ['eslint-plugin-better-stylelint']
const MDX_PACKAGES = ['eslint-plugin-mdx']
const VUE_A11Y_PACKAGES = ['eslint-plugin-vuejs-accessibility']
const REACT_A11Y_PACKAGES = ['eslint-plugin-jsx-a11y']
const QUERY_PACKAGES = ['@tanstack/eslint-plugin-query']
const BETTER_TAILWIND_EXTENSIONS = 'js,mjs,cjs,ts,mts,cts,jsx,tsx,vue,html,md,mdx,astro,svelte'
const BETTER_TAILWIND_FILES = [
  `**/*.{${BETTER_TAILWIND_EXTENSIONS}}`,
]
const BETTER_TAILWIND_IGNORES = [
  '**/*.json',
  '**/*.json5',
  '**/*.yaml',
  '**/*.yml',
  '**/*.{lock,lockb}',
  '**/package.json',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/bun.lock',
  '**/bun.lockb',
  '**/composer.lock',
  '**/Cargo.lock',
  '**/Gemfile.lock',
  '**/go.sum',
]
const BETTER_TAILWIND_SYNTAX_RULES: Linter.RulesRecord = {
  'better-tailwindcss/no-duplicate-classes': 'warn',
  'better-tailwindcss/no-unnecessary-whitespace': 'warn',
}

type ConfigPreset = TypedFlatConfigItem | TypedFlatConfigItem[]
type FlatConfigPlugin = NonNullable<TypedFlatConfigItem['plugins']>[string]

interface TailwindPluginModule {
  configs: {
    'recommended'?: ConfigPreset
    'flat/recommended'?: ConfigPreset
  }
}

interface BetterTailwindPluginModule {
  configs: {
    recommended?: {
      rules?: Linter.RulesRecord
    }
  }
}

interface StylelintBridgePluginModule {
  default: FlatConfigPlugin
  createStylelintProcessor: (options: BetterStylelintRuleOptions) => BetterStylelintProcessor
}

interface MdxPluginModule {
  flat: TypedFlatConfigItem
  flatCodeBlocks: TypedFlatConfigItem
  createRemarkProcessor: (options: {
    lintCodeBlocks: boolean
    languageMapper: Record<string, string>
  }) => Linter.Processor
}

interface VueAccessibilityPluginModule {
  configs: {
    'flat/recommended': ConfigPreset
  }
}

interface JsxA11yPluginModule {
  flatConfigs: {
    recommended: ConfigPreset
  }
}

interface QueryPluginModule {
  configs: {
    'flat/recommended': ConfigPreset
  }
}

interface WevuCompatibilityModule {
  wevuCompatibilityRecommended: TypedFlatConfigItem
}

const require = createRequire(import.meta.url)

function interopPluginDefault<T>(modulePromise: Promise<unknown>): Promise<T> {
  return interopDefault(modulePromise) as Promise<T>
}

function resolveStylelintConfigLoader(moduleUrl = import.meta.url) {
  return moduleUrl.endsWith('.ts')
    ? new URL('./stylelint.ts', moduleUrl).href
    : new URL('./stylelint.js', moduleUrl).href
}

function resolveDefaultTailwindCssConfigPath() {
  try {
    return require.resolve('tailwindcss/index.css')
  }
  catch {
    return undefined
  }
}

function normalizeGlobPath(filePath: string) {
  return filePath
    .replaceAll(path.sep, '/')
    .replace(/^\.\//, '')
}

function resolveBetterTailwindFiles(option: Exclude<UserDefinedOptions['betterTailwindcss'], boolean | undefined>) {
  if (option.files?.length) {
    return option.files
  }

  if (!option.entryPoint || path.isAbsolute(option.entryPoint)) {
    return BETTER_TAILWIND_FILES
  }

  const sourceDir = normalizeGlobPath(path.dirname(option.entryPoint))
  if (!sourceDir || sourceDir === '.') {
    return BETTER_TAILWIND_FILES
  }

  return [
    `${sourceDir}/**/*.{${BETTER_TAILWIND_EXTENSIONS}}`,
  ]
}

function resolveBetterTailwindRules(
  plugin: BetterTailwindPluginModule,
  option: Exclude<UserDefinedOptions['betterTailwindcss'], boolean | undefined>,
) {
  if (option.rules === 'recommended') {
    return (plugin.configs.recommended?.rules ?? {}) as Linter.RulesRecord
  }

  return BETTER_TAILWIND_SYNTAX_RULES
}

export function resolveBetterTailwindPresets(option: UserDefinedOptions['betterTailwindcss']): UserConfigItem[] {
  if (!option) {
    return []
  }

  if (!hasAllPackages(BETTER_TAILWIND_PACKAGES)) {
    return []
  }

  const betterTailwindcssOption = typeof option === 'object'
    ? option
    : {}

  return [
    interopPluginDefault<BetterTailwindPluginModule>(
      import('eslint-plugin-better-tailwindcss'),
    ).then((eslintPluginBetterTailwindcss) => {
      const betterTailwindcssRules = resolveBetterTailwindRules(
        eslintPluginBetterTailwindcss,
        betterTailwindcssOption,
      )

      return {
        name: 'icebreaker/better-tailwindcss',
        files: resolveBetterTailwindFiles(betterTailwindcssOption),
        ignores: BETTER_TAILWIND_IGNORES,
        plugins: {
          'better-tailwindcss': eslintPluginBetterTailwindcss,
        },
        rules: betterTailwindcssRules,
        settings: {
          'better-tailwindcss': {
            cwd: betterTailwindcssOption.cwd,
            entryPoint: betterTailwindcssOption.entryPoint,
            tailwindConfig: betterTailwindcssOption.tailwindConfig,
          },
        },
      } as TypedFlatConfigItem
    }) as Promise<ResolvableUserConfig>,
  ]
}

export function resolveTailwindPresets(option: UserDefinedOptions['tailwindcss']): UserConfigItem[] {
  if (!option) {
    return []
  }

  if (!hasAllPackages(TAILWIND_PACKAGES)) {
    return []
  }

  const cssConfigPath = resolveDefaultTailwindCssConfigPath()

  return [
    interopPluginDefault<TailwindPluginModule>(
      import('eslint-plugin-tailwindcss'),
    ).then((tailwind) => {
      const tailwindPlugin = tailwind as TailwindPluginModule
      return tailwindPlugin.configs['flat/recommended']
        ?? tailwindPlugin.configs.recommended
        ?? []
    }) as Promise<ResolvableUserConfig>,
    {
      ...(cssConfigPath
        ? {
            settings: {
              tailwindcss: {
                cssConfigPath,
              },
            },
          }
        : {}),
      rules: {
        'tailwindcss/no-custom-classname': 'off',
      },
    },
  ]
}

export function resolveMiniProgramCompatibilityPresets(
  isEnabled: UserDefinedOptions['miniProgram'],
): UserConfigItem[] {
  if (!isEnabled) {
    return []
  }

  return [
    import('@weapp-vite/eslint').then((module: WevuCompatibilityModule) => {
      return {
        ...module.wevuCompatibilityRecommended,
        name: 'icebreaker/mini-program/wevu-compatibility',
      } satisfies TypedFlatConfigItem
    }) as Promise<ResolvableUserConfig>,
  ]
}

function resolveStylelintBridgeOptions(
  option: UserDefinedOptions['stylelint'],
) {
  const bridgeOptions = typeof option === 'object'
    ? option
    : {} as StylelintBridgeOption
  const { cwd, ...stylelintConfigOptions } = bridgeOptions

  return {
    ...(cwd ? { cwd } : {}),
    configLoader: resolveStylelintConfigLoader(),
    configOptions: stylelintConfigOptions,
  }
}

export function resolveStylelintBridgePresets(option: UserDefinedOptions['stylelint']): UserConfigItem[] {
  if (!option) {
    return []
  }

  if (!hasAllPackages(STYLELINT_BRIDGE_PACKAGES)) {
    return []
  }

  const pluginModulePromise: Promise<StylelintBridgePluginModule> = import('eslint-plugin-better-stylelint')
  const stylelintOptions = resolveStylelintBridgeOptions(option)

  return [
    pluginModulePromise.then((pluginModule) => {
      return {
        files: ['**/*.{css,pcss,postcss}'],
        plugins: {
          stylelint: pluginModule.default,
        },
        processor: pluginModule.createStylelintProcessor(stylelintOptions),
      } satisfies TypedFlatConfigItem
    }) as Promise<ResolvableUserConfig>,
    pluginModulePromise.then((pluginModule) => {
      return {
        files: ['**/*.{scss,sass}'],
        plugins: {
          stylelint: pluginModule.default,
        },
        processor: pluginModule.createStylelintProcessor(stylelintOptions),
      } satisfies TypedFlatConfigItem
    }) as Promise<ResolvableUserConfig>,
    pluginModulePromise.then((pluginModule) => {
      return {
        files: ['**/*.vue'],
        plugins: {
          stylelint: pluginModule.default,
        },
        rules: {
          'stylelint/stylelint': ['error', stylelintOptions],
        },
      } satisfies TypedFlatConfigItem
    }) as Promise<ResolvableUserConfig>,
  ]
}

export function resolveMdxPresets(isEnabled: UserDefinedOptions['mdx']): UserConfigItem[] {
  if (!isEnabled) {
    return []
  }

  if (!hasAllPackages(MDX_PACKAGES)) {
    return []
  }

  return [
    interopPluginDefault<MdxPluginModule>(import('eslint-plugin-mdx')).then((mdx) => {
      return [
        {
          ...mdx.flat,
          processor: mdx.createRemarkProcessor({
            lintCodeBlocks: true,
            languageMapper: {},
          }),
        },
        {
          ...mdx.flatCodeBlocks,
          rules: {
            ...mdx.flatCodeBlocks.rules,
          },
        },
      ] satisfies TypedFlatConfigItem[]
    }) as Promise<ResolvableUserConfig>,
  ]
}

export function resolveAccessibilityPresets(
  isEnabled: UserDefinedOptions['a11y'],
  vueOption: UserDefinedOptions['vue'],
  reactOption: UserDefinedOptions['react'],
): UserConfigItem[] {
  if (!isEnabled) {
    return []
  }

  const presets: UserConfigItem[] = []

  if (vueOption && hasAllPackages(VUE_A11Y_PACKAGES)) {
    presets.push(
      (interopDefault(
        // @ts-expect-error optional dependency shape
        import('eslint-plugin-vuejs-accessibility'),
      ) as Promise<VueAccessibilityPluginModule>).then((pluginVueA11y) => {
        return pluginVueA11y.configs['flat/recommended']
      }) as Promise<ResolvableUserConfig>,
    )
  }

  if (reactOption && hasAllPackages(REACT_A11Y_PACKAGES)) {
    presets.push(
      (interopDefault(
        // @ts-expect-error optional dependency shape
        import('eslint-plugin-jsx-a11y'),
      ) as Promise<JsxA11yPluginModule>).then((jsxA11y) => {
        return jsxA11y.flatConfigs.recommended
      }) as Promise<ResolvableUserConfig>,
    )
  }

  return presets
}

export function resolveNestPresets(isEnabled: UserDefinedOptions['nestjs']): UserConfigItem[] {
  if (!isEnabled) {
    return []
  }

  return [{
    name: 'icebreaker/nestjs/rules',
    rules: nestjsTypeScriptRules,
  }]
}

export function resolveQueryPresets(isEnabled: UserDefinedOptions['query']): UserConfigItem[] {
  if (!isEnabled) {
    return []
  }

  if (!hasAllPackages(QUERY_PACKAGES)) {
    return []
  }

  return [
    interopPluginDefault<QueryPluginModule>(
      import('@tanstack/eslint-plugin-query'),
    ).then(
      pluginQuery => pluginQuery.configs['flat/recommended'],
    ) as Promise<ResolvableUserConfig>,
  ]
}

export { resolveStylelintConfigLoader as __resolveStylelintConfigLoader }
export { resolveDefaultTailwindCssConfigPath as __resolveDefaultTailwindCssConfigPath }
