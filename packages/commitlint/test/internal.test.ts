import type { CommitSubjectOptions, CommitTypesOptions } from '../src/types'
import conventionalConfig from '@commitlint/config-conventional'

import { describe, expect, it } from 'vitest'
import {
  buildHeaderRules,
  buildScopeRules,
  buildSubjectRules,
  buildTypesConfig,
} from '../src/builders'
import { DEFAULT_EXTENDS, DEFAULT_PARSER_PRESET } from '../src/constants'
import { mergePrompts } from '../src/prompt'
import {

  RuleConfigSeverity,
} from '../src/types'
import { asArray, mergeUnique } from '../src/utils'

describe('constants', () => {
  it('exposes default extends and parser preset', () => {
    expect(DEFAULT_EXTENDS).toEqual([])
    expect(DEFAULT_PARSER_PRESET).toBe('conventional-changelog-conventionalcommits')
  })
})

describe('utils', () => {
  it('wraps single values into arrays', () => {
    expect(asArray('feat')).toEqual(['feat'])
  })

  it('returns empty array for undefined', () => {
    expect(asArray()).toEqual([])
  })

  it('deduplicates values while preserving order', () => {
    expect(mergeUnique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })
})

describe('mergePrompts', () => {
  it('returns undefined when neither prompt exists', () => {
    expect(mergePrompts(undefined, undefined)).toBeUndefined()
  })

  it('merges prompts with override precedence', () => {
    const base = {
      questions: {
        type: {
          description: 'Base type',
        },
      },
    }
    const override = {
      questions: {
        scope: {
          description: 'Override scope',
        },
      },
    }

    const result = mergePrompts(base, override)
    expect(result?.questions?.type?.description).toBe('Base type')
    expect(result?.questions?.scope?.description).toBe('Override scope')
  })
})

describe('buildTypesConfig', () => {
  it('returns empty payload when no options given', () => {
    expect(buildTypesConfig()).toEqual({})
  })

  it('extends base type enum and prompt metadata', () => {
    const options: CommitTypesOptions = {
      add: ['internal'],
      definitions: [
        {
          value: 'deps',
          title: 'Dependencies',
          description: 'Dependency updates',
          emoji: '📦',
        },
      ],
    }

    const result = buildTypesConfig(options)
    const rule = result.rule as [number, string, string[]]
    const baseValues = (conventionalConfig.rules?.['type-enum'] as [number, string, string[]])[2]

    expect(rule[0]).toBe(RuleConfigSeverity.Error)
    expect(rule[1]).toBe('always')
    expect(rule[2]).toEqual([...new Set([...baseValues, 'internal', 'deps'])])

    const prompt = result.prompt?.questions
    const typeEnum = prompt?.type?.enum as
      | Record<string, { title?: string, description?: string, emoji?: string }>
      | undefined
    expect(typeEnum?.['deps']?.title).toBe('Dependencies')
    expect(typeEnum?.['deps']?.emoji).toBe('📦')

    const conventionalTypeEnum = conventionalConfig.prompt?.questions?.type?.enum as
      | Record<string, unknown>
      | undefined
    expect(conventionalTypeEnum?.['deps']).toBeUndefined()
  })
})

describe('buildScopeRules', () => {
  it('returns empty object when no options provided', () => {
    expect(buildScopeRules()).toEqual({})
  })

  it('creates enum, case, and required rules', () => {
    const rules = buildScopeRules({
      values: ['core', 'docs', 'core'],
      case: 'lower-case',
      required: true,
      severity: RuleConfigSeverity.Warning,
    })

    expect(rules['scope-enum']).toEqual([
      RuleConfigSeverity.Warning,
      'always',
      ['core', 'docs'],
    ])
    expect(rules['scope-case']).toEqual([
      RuleConfigSeverity.Warning,
      'always',
      ['lower-case'],
    ])
    expect(rules['scope-empty']).toEqual([RuleConfigSeverity.Warning, 'never'])
  })
})

describe('buildSubjectRules', () => {
  it('returns empty object when no subject customization exists', () => {
    expect(buildSubjectRules()).toEqual({})
  })

  it('configures case, empty, and full-stop behaviours', () => {
    const options: CommitSubjectOptions = {
      forbidden: ['camel-case', 'start-case'],
      caseSeverity: RuleConfigSeverity.Warning,
      allowEmpty: false,
      allowEmptySeverity: RuleConfigSeverity.Warning,
      fullStop: false,
      fullStopSeverity: RuleConfigSeverity.Error,
    }

    const rules = buildSubjectRules(options)
    expect(rules['subject-case']).toEqual([
      RuleConfigSeverity.Warning,
      'never',
      ['camel-case', 'start-case'],
    ])
    expect(rules['subject-empty']).toEqual([RuleConfigSeverity.Warning, 'never'])
    expect(rules['subject-full-stop']).toEqual([RuleConfigSeverity.Disabled])
  })
})

describe('buildHeaderRules', () => {
  it('returns empty object for absent options', () => {
    expect(buildHeaderRules()).toEqual({})
  })

  it('produces header length rule with custom severity', () => {
    const rules = buildHeaderRules({
      maxLength: 120,
      severity: RuleConfigSeverity.Warning,
      condition: 'always',
    })

    expect(rules['header-max-length']).toEqual([
      RuleConfigSeverity.Warning,
      'always',
      120,
    ])
  })
})
