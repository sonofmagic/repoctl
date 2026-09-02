import type { ParserPreset } from '@commitlint/types'
import conventionalConfig from '@commitlint/config-conventional'
import { describe, expect, it } from 'vitest'
import {
  createIcebreakerCommitlintConfig,
  icebreaker,
  RuleConfigSeverity,
} from '../src'

describe('createIcebreakerCommitlintConfig', () => {
  it('returns the default configuration', () => {
    const config = createIcebreakerCommitlintConfig()

    expect(config.extends).toBeUndefined()
    expect(config.parserPreset).toMatchObject({
      name: conventionalConfig.parserPreset,
    })

    expect(config.rules).toEqual(conventionalConfig.rules)
    expect(config.prompt).toEqual(conventionalConfig.prompt)
  })

  it('resolves parser options without exposing an ESM-only preset string', async () => {
    const config = createIcebreakerCommitlintConfig()
    const parserPreset = config.parserPreset as ParserPreset

    await expect(parserPreset.parserOpts).resolves.toEqual(expect.objectContaining({
      headerPattern: expect.any(RegExp),
      headerCorrespondence: ['type', 'scope', 'subject'],
    }))
  })

  it('allows extending commit types with prompt metadata', () => {
    const config = createIcebreakerCommitlintConfig({
      types: {
        add: ['deps'],
        definitions: [
          {
            value: 'deps',
            title: 'Dependencies',
            description: 'Dependency updates',
            emoji: '📦',
          },
        ],
      },
    })

    const typeRule = config.rules?.['type-enum'] as [number, string, string[]]
    expect(typeRule[2]).toContain('deps')

    const promptTypes = config.prompt?.questions?.type?.enum
    expect(promptTypes?.['deps']?.title).toBe('Dependencies')
    expect(promptTypes?.['deps']?.description).toBe('Dependency updates')
  })

  it('configures scope rules with enum, case and presence constraints', () => {
    const config = createIcebreakerCommitlintConfig({
      scopes: {
        values: ['core', 'docs'],
        required: true,
        case: 'lower-case',
      },
    })

    const scopeEnum = config.rules?.['scope-enum'] as [number, string, string[]]
    expect(scopeEnum).toEqual([RuleConfigSeverity.Error, 'always', ['core', 'docs']])

    const scopeEmpty = config.rules?.['scope-empty'] as [number, string]
    expect(scopeEmpty).toEqual([RuleConfigSeverity.Error, 'never'])

    const scopeCase = config.rules?.['scope-case'] as [number, string, string[]]
    expect(scopeCase).toEqual([RuleConfigSeverity.Error, 'always', ['lower-case']])
  })

  it('supports subject rule overrides', () => {
    const config = createIcebreakerCommitlintConfig({
      subject: {
        forbidden: ['camel-case'],
        caseSeverity: RuleConfigSeverity.Warning,
        allowEmpty: true,
        fullStop: false,
      },
    })

    const subjectCase = config.rules?.['subject-case'] as [number, string, string[]]
    expect(subjectCase).toEqual([
      RuleConfigSeverity.Warning,
      'never',
      ['camel-case'],
    ])

    const subjectEmpty = config.rules?.['subject-empty'] as [number]
    expect(subjectEmpty).toEqual([RuleConfigSeverity.Disabled])

    const subjectFullStop = config.rules?.['subject-full-stop'] as [number]
    expect(subjectFullStop).toEqual([RuleConfigSeverity.Disabled])
  })

  it('merges custom rule overrides', () => {
    const config = createIcebreakerCommitlintConfig({
      rules: {
        'body-max-line-length': [RuleConfigSeverity.Disabled],
      },
    })

    expect(config.rules?.['body-max-line-length']).toEqual([
      RuleConfigSeverity.Disabled,
    ])
  })

  it('deduplicates extend entries while preserving order', () => {
    const config = createIcebreakerCommitlintConfig({
      extends: [
        '@commitlint/config-conventional',
        '@commitlint/config-conventional',
        '@icebreakers/custom',
      ],
    })

    expect(config.extends).toEqual([
      '@commitlint/config-conventional',
      '@icebreakers/custom',
    ])
  })

  it('allows tweaking header limits', () => {
    const config = createIcebreakerCommitlintConfig({
      header: {
        maxLength: 120,
        severity: RuleConfigSeverity.Warning,
      },
    })

    const headerRule = config.rules?.['header-max-length'] as [number, string, number]
    expect(headerRule).toEqual([RuleConfigSeverity.Warning, 'always', 120])
  })

  it('merges prompt metadata while keeping the conventional preset immutable', () => {
    const config = createIcebreakerCommitlintConfig({
      types: {
        definitions: [
          {
            value: 'deps',
            title: 'Dependencies',
            description: 'Dependency updates',
            emoji: '📦',
          },
        ],
      },
      prompt: {
        questions: {
          scope: {
            description: 'What part of the project changed?',
          },
        },
      },
    })

    const prompt = config.prompt?.questions
    const typeEnum = prompt?.type?.enum as
      | Record<string, { title?: string, description?: string, emoji?: string }>
      | undefined
    expect(typeEnum?.['deps']?.title).toBe('Dependencies')
    expect(prompt?.scope?.description).toBe('What part of the project changed?')

    const conventionalPrompt = conventionalConfig.prompt?.questions
    const conventionalTypeEnum = conventionalPrompt?.type?.enum as
      | Record<string, unknown>
      | undefined
    expect(conventionalTypeEnum?.['deps']).toBeUndefined()
    expect(conventionalPrompt?.scope?.description).not.toBe(
      'What part of the project changed?',
    )
  })

  it('honors custom subject empty severities when a subject is required', () => {
    const config = createIcebreakerCommitlintConfig({
      subject: {
        allowEmpty: false,
        allowEmptySeverity: RuleConfigSeverity.Warning,
      },
    })

    const subjectEmpty = config.rules?.['subject-empty'] as [number, string]
    expect(subjectEmpty).toEqual([RuleConfigSeverity.Warning, 'never'])
  })

  it('builds scope enums without duplicates', () => {
    const config = createIcebreakerCommitlintConfig({
      scopes: {
        values: ['core', 'core', 'docs'],
      },
    })

    const scopeEnum = config.rules?.['scope-enum'] as [number, string, string[]]
    expect(scopeEnum).toEqual([
      RuleConfigSeverity.Error,
      'always',
      ['core', 'docs'],
    ])
  })

  it('exposes icebreaker as a callable alias', () => {
    const aliasConfig = icebreaker({
      header: {
        maxLength: 72,
      },
    })

    expect(aliasConfig).toEqual(
      createIcebreakerCommitlintConfig({
        header: {
          maxLength: 72,
        },
      }),
    )
  })
})
