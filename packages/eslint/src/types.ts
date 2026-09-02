import type {
  OptionsConfig,
  TypedFlatConfigItem,
} from '@antfu/eslint-config'
import type { IcebreakerStylelintOptions } from '@icebreakers/stylelint-config'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'

export interface BetterTailwindcssOption {
  /**
   * Tailwind CSS v4 entry point, e.g. `src/global.css`.
   */
  entryPoint?: string
  /**
   * Files that should receive better-tailwindcss rules.
   * Defaults to the entry point directory for relative entry points, otherwise source-like files.
   */
  files?: string[]
  /**
   * Rule preset for object mode.
   *
   * `syntax` keeps the fast rules that do not need Tailwind class analysis.
   * `recommended` enables the full eslint-plugin-better-tailwindcss recommended preset.
   *
   * @default 'syntax'
   */
  rules?: 'syntax' | 'recommended'
  /**
   * Working directory passed to eslint-plugin-better-tailwindcss.
   * Defaults to ESLint's current working directory.
   */
  cwd?: string
  /**
   * Tailwind CSS v3 config file path, e.g. `tailwind.config.js`.
   */
  tailwindConfig?: string
}

export type BetterTailwindcssConfig = boolean | BetterTailwindcssOption
export type TailwindcssConfig = boolean
export interface UnocssOption {
  /**
   * UnoCSS config file path, e.g. `uno.config.ts`.
   * When omitted, fallback to default project-root discovery.
   */
  configPath?: string
  /**
   * Enable UnoCSS attributify support.
   */
  attributify?: boolean
  /**
   * Enable UnoCSS strict mode.
   */
  strict?: boolean
}
export type UnocssConfig = boolean | UnocssOption
export interface StylelintBridgeOption extends IcebreakerStylelintOptions {
  cwd?: string
}
export type StylelintBridgeConfig = boolean | StylelintBridgeOption

export type ResolvableUserConfig
  = | TypedFlatConfigItem
    | TypedFlatConfigItem[]
    | FlatConfigComposer<any, any>

export type NormalizableUserConfig = Exclude<
  ResolvableUserConfig,
  FlatConfigComposer<any, any>
>

type BaseFormatterOptions = Exclude<OptionsConfig['formatters'], boolean | undefined>

export interface IcebreakerFormatterOptions extends Omit<
  BaseFormatterOptions,
  'css' | 'html' | 'graphql' | 'markdown'
> {
  /**
   * Enable formatting support for CSS, Less, Sass, and SCSS.
   * Icebreaker additionally supports `oxfmt`.
   */
  css?: 'prettier' | 'oxfmt' | boolean
  /**
   * Enable formatting support for HTML.
   * Icebreaker additionally supports `oxfmt`.
   */
  html?: 'prettier' | 'oxfmt' | boolean
  /**
   * Enable formatting support for Markdown.
   * Icebreaker additionally supports `oxfmt`.
   */
  markdown?: 'prettier' | 'dprint' | 'oxfmt' | boolean
  /**
   * Enable formatting support for GraphQL.
   * Icebreaker additionally supports `oxfmt`.
   */
  graphql?: 'prettier' | 'oxfmt' | boolean
  /**
   * Custom options passed to `format/oxfmt`.
   */
  oxfmtOptions?: Record<string, unknown>
}

export type UserDefinedOptions = Omit<OptionsConfig, 'formatters' | 'unocss'> & TypedFlatConfigItem & {
  /**
   * Enable external formatters for non-JS file types.
   * Icebreaker additionally supports `oxfmt` for css/html/markdown/graphql.
   */
  formatters?: boolean | IcebreakerFormatterOptions
  /**
   * Enable Mini Program support.
   * Automatically enables the bundled Wevu compatibility diagnostics.
   * @default false
   */
  miniProgram?: boolean
  /**
   * Enable eslint-plugin-tailwindcss support.
   * @default false
   */
  tailwindcss?: TailwindcssConfig
  /**
   * Enable eslint-plugin-better-tailwindcss support.
   * @default false
   */
  betterTailwindcss?: BetterTailwindcssConfig
  /**
   * Enable UnoCSS support.
   * @default false
   */
  unocss?: UnocssConfig
  /**
   * Bridge Stylelint diagnostics into ESLint for style files.
   * @default false
   */
  stylelint?: StylelintBridgeConfig
  /**
   * Enable MDX support
   * @default false
   */
  mdx?: boolean
  /**
   * Enable A11y support
   * @default false
   */
  a11y?: boolean
  /**
   * Enable NestJS support
   * @default false
   */
  nestjs?: boolean
  /**
   * Enable TanStack Query support
   * @default false
   */
  query?: boolean
  /**
   * Enable Ionic support
   * @default false
   */
  ionic?: boolean
  /**
   * Enable Weapp support
   * @deprecated Use `miniProgram` instead.
   * @default false
   */
  weapp?: boolean
}

export type UserConfigItem = ResolvableUserConfig | Promise<ResolvableUserConfig>

export type {
  OptionsConfig,
  TypedFlatConfigItem,
}
