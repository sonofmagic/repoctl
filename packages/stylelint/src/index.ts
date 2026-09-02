import type { IcebreakerStylelintOptions, StylelintConfig } from './types'
import { createIcebreakerStylelintConfig } from './config'

export { createIcebreakerStylelintConfig as createStylelintConfig } from './config'
export type {
  FormattingPresetLevel,
  IcebreakerStylelintOptions,
  IgnoreListOptions,
  PresetToggles,
  StylelintConfig,
  StylelintOverride,
  StylelintRuleOptions,
  StylelintRuleSetting,
  TailwindcssPresetLevel,
} from './types'

export function icebreaker(config?: IcebreakerStylelintOptions & StylelintConfig): StylelintConfig {
  return createIcebreakerStylelintConfig(config)
}

export type IcebreakerStylelintConfig = ReturnType<typeof icebreaker>
