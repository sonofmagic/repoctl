import type { UserConfig } from '@commitlint/types'
import type { IcebreakerCommitlintConfig } from '@icebreakers/commitlint-config'
import {
  createIcebreakerCommitlintConfig,
  icebreaker,
  RuleConfigSeverity,
} from '@icebreakers/commitlint-config'
import { expectAssignable, expectType } from 'tsd'

expectType<UserConfig>(createIcebreakerCommitlintConfig())
expectType<IcebreakerCommitlintConfig>(icebreaker())
expectType<UserConfig>(icebreaker({
  types: {
    severity: RuleConfigSeverity.Error,
  },
}))
expectAssignable<RuleConfigSeverity>(RuleConfigSeverity.Error)
