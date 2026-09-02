import type {
  EnumRuleConfig,
  RuleConfigCondition,
  RulesConfig,
  UserPromptConfig,
} from '@commitlint/types'
import type {
  CommitHeaderOptions,
  CommitScopeOptions,
  CommitSubjectOptions,
  CommitTypesOptions,
} from './types'

import conventionalConfig from '@commitlint/config-conventional'
import { RuleConfigSeverity } from './types'
import { asArray, mergeUnique } from './utils'

interface BaseTypeRuleConfig {
  severity: RuleConfigSeverity
  condition: RuleConfigCondition
  values: string[]
}

export interface TypesConfigResult {
  rule?: EnumRuleConfig
  prompt?: UserPromptConfig
}

function resolveBaseTypeRule(): BaseTypeRuleConfig {
  const rule = conventionalConfig.rules?.['type-enum'] as EnumRuleConfig | undefined

  if (Array.isArray(rule)) {
    const severity = (rule[0] ?? RuleConfigSeverity.Error) as RuleConfigSeverity
    const condition = (rule[1] ?? 'always') as RuleConfigCondition
    const values = (rule[2] ?? []) as string[]

    return {
      severity,
      condition,
      values: [...values],
    }
  }

  return {
    severity: RuleConfigSeverity.Error,
    condition: 'always',
    values: [],
  }
}

export function buildTypesConfig(options?: CommitTypesOptions): TypesConfigResult {
  if (!options) {
    return {}
  }

  const baseRule = resolveBaseTypeRule()
  const additional = mergeUnique([
    ...baseRule.values,
    ...mergeUnique(options.add ?? []),
    ...mergeUnique((options.definitions ?? []).map(definition => definition.value)),
  ])

  let rule: EnumRuleConfig | undefined
  if (additional.length > 0) {
    rule = [
      options.severity ?? baseRule.severity,
      options.condition ?? baseRule.condition,
      additional,
    ]
  }

  if (!options.definitions?.length) {
    return rule ? { rule } : {}
  }

  const basePromptType = conventionalConfig.prompt?.questions?.type
  const mergedEnum: Record<
    string,
    {
      title?: string
      description?: string
      emoji?: string
    }
  > = {
    ...((basePromptType?.enum as Record<string, { title?: string, description?: string, emoji?: string }> | undefined) ?? {}),
  }

  for (const definition of options.definitions) {
    const { value, title, description, emoji } = definition
    mergedEnum[value] = {
      ...(mergedEnum[value] ?? {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(emoji !== undefined ? { emoji } : {}),
    }
  }

  const prompt: UserPromptConfig = {
    ...(conventionalConfig.prompt ?? {}),
    questions: {
      ...(conventionalConfig.prompt?.questions ?? {}),
      type: {
        ...(basePromptType ?? {}),
        enum: mergedEnum,
      },
    },
  }

  return {
    ...(rule ? { rule } : {}),
    prompt,
  }
}

export function buildScopeRules(options?: CommitScopeOptions): Partial<RulesConfig> {
  if (!options) {
    return {}
  }

  const rules: Partial<RulesConfig> = {}
  const severity = options.severity ?? RuleConfigSeverity.Error

  const scopeValues = mergeUnique(asArray(options.values))
  if (scopeValues.length > 0) {
    rules['scope-enum'] = [severity, 'always', scopeValues]
  }

  if (options.required !== undefined) {
    if (options.required) {
      rules['scope-empty'] = [severity, 'never']
    }
    else {
      rules['scope-empty'] = [RuleConfigSeverity.Disabled]
    }
  }

  const scopeCases = mergeUnique(asArray(options.case))
  if (scopeCases.length > 0) {
    rules['scope-case'] = [severity, 'always', scopeCases]
  }

  return rules
}

export function buildSubjectRules(options?: CommitSubjectOptions): Partial<RulesConfig> {
  if (!options) {
    return {}
  }

  const rules: Partial<RulesConfig> = {}

  const forbiddenCases = mergeUnique(asArray(options.forbidden))
  if (forbiddenCases.length > 0) {
    rules['subject-case'] = [
      options.caseSeverity ?? RuleConfigSeverity.Error,
      options.caseCondition ?? 'never',
      forbiddenCases,
    ]
  }

  if (options.allowEmpty !== undefined) {
    if (options.allowEmpty) {
      rules['subject-empty'] = [RuleConfigSeverity.Disabled]
    }
    else {
      rules['subject-empty'] = [
        options.allowEmptySeverity ?? RuleConfigSeverity.Error,
        'never',
      ]
    }
  }

  if (options.fullStop !== undefined) {
    if (options.fullStop) {
      rules['subject-full-stop'] = [
        options.fullStopSeverity ?? RuleConfigSeverity.Error,
        'always',
        options.fullStopCharacter ?? '.',
      ]
    }
    else {
      rules['subject-full-stop'] = [RuleConfigSeverity.Disabled]
    }
  }

  return rules
}

export function buildHeaderRules(options?: CommitHeaderOptions): Partial<RulesConfig> {
  if (!options) {
    return {}
  }

  const rules: Partial<RulesConfig> = {}
  const severity = options.severity ?? RuleConfigSeverity.Error
  const condition = options.condition ?? 'always'

  if (options.maxLength !== undefined) {
    rules['header-max-length'] = [severity, condition, options.maxLength]
  }

  return rules
}
