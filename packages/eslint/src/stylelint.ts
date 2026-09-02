import type { IcebreakerStylelintOptions } from '@icebreakers/stylelint-config'
import { createStylelintConfig } from '@icebreakers/stylelint-config'

export type { IcebreakerStylelintOptions } from '@icebreakers/stylelint-config'

export function resolveStylelintConfig(
  options: IcebreakerStylelintOptions = {},
): ReturnType<typeof createStylelintConfig> {
  return createStylelintConfig(options)
}
