import type {
  IcebreakerStylelintConfig,
  IcebreakerStylelintOptions,
  StylelintConfig,
} from '@icebreakers/stylelint-config'
import {
  createStylelintConfig,
  icebreaker,
} from '@icebreakers/stylelint-config'
import { expectAssignable, expectType } from 'tsd'

const options: IcebreakerStylelintOptions = {
  miniProgram: true,
  presets: {
    vue: false,
  },
}

expectType<IcebreakerStylelintOptions>(options)
expectAssignable<StylelintConfig>({
  rules: {
    color: 'red',
  },
})
expectType<IcebreakerStylelintConfig>(icebreaker())
expectAssignable<{ rules?: Record<string, unknown>, plugins?: unknown }>(createStylelintConfig())
expectAssignable<{ rules?: Record<string, unknown>, plugins?: unknown }>(icebreaker())
