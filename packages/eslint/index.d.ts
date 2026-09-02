import type {
  Awaitable,
  ConfigNames,
  OptionsConfig,
  TypedFlatConfigItem,
} from '@antfu/eslint-config'
import type { IcebreakerStylelintOptions } from '@icebreakers/stylelint-config'
import type { Linter } from 'eslint'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'

export interface BetterTailwindcssOption {
  entryPoint?: string
  files?: string[]
  rules?: 'syntax' | 'recommended'
  cwd?: string
  tailwindConfig?: string
}

export type BetterTailwindcssConfig = boolean | BetterTailwindcssOption
export type TailwindcssConfig = boolean
export interface UnocssOption {
  configPath?: string
  attributify?: boolean
  strict?: boolean
}
export type UnocssConfig = boolean | UnocssOption
export interface StylelintBridgeOption extends IcebreakerStylelintOptions {
  cwd?: string
}
export type StylelintBridgeConfig = boolean | StylelintBridgeOption

export type UserDefinedOptions = Omit<OptionsConfig, 'unocss'> & TypedFlatConfigItem & {
  miniProgram?: boolean
  tailwindcss?: TailwindcssConfig
  betterTailwindcss?: BetterTailwindcssConfig
  unocss?: UnocssConfig
  stylelint?: StylelintBridgeConfig
  mdx?: boolean
  a11y?: boolean
  nestjs?: boolean
  query?: boolean
  ionic?: boolean
  weapp?: boolean
}

export type UserConfigItem = Awaitable<
  | TypedFlatConfigItem
  | TypedFlatConfigItem[]
  | FlatConfigComposer<any, any>
  | Linter.Config[]
>

export declare function getPresets(
  options?: UserDefinedOptions,
  mode?: 'legacy',
): [UserDefinedOptions, ...UserConfigItem[]]

export declare function icebreaker(
  options?: UserDefinedOptions,
  ...userConfigs: UserConfigItem[]
): FlatConfigComposer<TypedFlatConfigItem, ConfigNames>

export type IcebreakerEslintConfig = ReturnType<typeof icebreaker>

export declare function icebreakerLegacy(
  options?: UserDefinedOptions,
  ...userConfigs: UserConfigItem[]
): FlatConfigComposer<TypedFlatConfigItem, ConfigNames>

export type IcebreakerLegacyEslintConfig = ReturnType<
  typeof icebreakerLegacy
>

export type {
  ConfigNames,
  FlatConfigComposer,
  OptionsConfig,
  TypedFlatConfigItem,
}
