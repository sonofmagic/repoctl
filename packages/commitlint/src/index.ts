import type { RulesConfig, UserConfig } from '@commitlint/types'
import type { IcebreakerCommitlintOptions } from './types'

import conventionalConfig from '@commitlint/config-conventional'
import {
  buildHeaderRules,
  buildScopeRules,
  buildSubjectRules,
  buildTypesConfig,
} from './builders'
import { DEFAULT_EXTENDS } from './constants'
import { createConventionalParserPreset } from './parser-preset'
import { mergePrompts } from './prompt'
import { asArray, mergeUnique } from './utils'

export {
  type CommitHeaderOptions,
  type CommitlintUserConfig,
  type CommitScopeOptions,
  type CommitSubjectOptions,
  type CommitTypeDefinition,
  type CommitTypesOptions,
  type IcebreakerCommitlintOptions,
  RuleConfigSeverity,
} from './types'

export function createIcebreakerCommitlintConfig(
  options: IcebreakerCommitlintOptions = {},
): UserConfig {
  const { types, scopes, subject, header } = options

  const extendsList = mergeUnique([
    ...DEFAULT_EXTENDS,
    ...asArray(
      conventionalConfig
      // @ts-ignore
        .extends,
    ),
    ...asArray(options.extends),
  ])

  const rules: Partial<RulesConfig> = {
    ...(conventionalConfig.rules ?? {}),
    ...buildScopeRules(scopes),
    ...buildSubjectRules(subject),
    ...buildHeaderRules(header),
  }

  const typesConfig = buildTypesConfig(types)
  if (typesConfig.rule) {
    rules['type-enum'] = typesConfig.rule
  }

  const mergedRules: Partial<RulesConfig> = {
    ...rules,
    ...(options.rules ?? {}),
  }

  const promptBase = typesConfig.prompt ?? conventionalConfig.prompt
  const prompt = mergePrompts(promptBase, options.prompt)

  return {
    ...(extendsList.length > 0 ? { extends: extendsList } : {}),
    parserPreset: createConventionalParserPreset(),
    ...(Object.keys(mergedRules).length > 0 ? { rules: mergedRules } : {}),
    ...(prompt ? { prompt } : {}),
  }
}

export function icebreaker(options?: IcebreakerCommitlintOptions): UserConfig {
  return createIcebreakerCommitlintConfig(options)
}

export type IcebreakerCommitlintConfig = ReturnType<typeof icebreaker>

export default icebreaker()
