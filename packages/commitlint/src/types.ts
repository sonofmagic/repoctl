import type {
  RuleConfigCondition,
  RulesConfig,
  TargetCaseType,
  UserConfig,
  UserPromptConfig,
} from '@commitlint/types'
import { RuleConfigSeverity } from '@commitlint/types'

export { RuleConfigSeverity }
export type {
  UserConfig as CommitlintUserConfig,
  RuleConfigCondition,
  RulesConfig,
  TargetCaseType,
  UserPromptConfig,
}

export interface CommitTypeDefinition {
  value: string
  title?: string
  description?: string
  emoji?: string
}

export interface CommitTypesOptions {
  add?: string[]
  definitions?: CommitTypeDefinition[]
  condition?: RuleConfigCondition
  severity?: RuleConfigSeverity
}

export interface CommitScopeOptions {
  values?: string[]
  required?: boolean
  case?: TargetCaseType | TargetCaseType[]
  severity?: RuleConfigSeverity
}

export interface CommitSubjectOptions {
  forbidden?: TargetCaseType | TargetCaseType[]
  caseCondition?: RuleConfigCondition
  caseSeverity?: RuleConfigSeverity
  allowEmpty?: boolean
  allowEmptySeverity?: RuleConfigSeverity
  fullStop?: boolean
  fullStopSeverity?: RuleConfigSeverity
  fullStopCharacter?: string
}

export interface CommitHeaderOptions {
  maxLength?: number
  condition?: RuleConfigCondition
  severity?: RuleConfigSeverity
}

export interface IcebreakerCommitlintOptions {
  extends?: string[]
  rules?: Partial<RulesConfig>
  types?: CommitTypesOptions
  scopes?: CommitScopeOptions
  subject?: CommitSubjectOptions
  header?: CommitHeaderOptions
  prompt?: UserPromptConfig
}
