import path from 'node:path'
import lint from '@commitlint/lint'
import loadCommitlintConfig from '@commitlint/load'
import createPreset from 'conventional-changelog-conventionalcommits'
import { createIcebreakerCommitlintConfig, icebreaker } from '@/index'

type LintRules = Parameters<typeof lint>[1]
type LintOptions = NonNullable<Parameters<typeof lint>[2]>
type CommitlintRules = ReturnType<typeof createIcebreakerCommitlintConfig>['rules']
type LintError = Awaited<ReturnType<typeof lint>>['errors'][number]

async function lintMessage(
  message: string,
  rules: CommitlintRules,
) {
  const preset = await createPreset()
  return lint(message, rules as LintRules, {
    parserOpts: preset.parser,
  })
}

describe('commitlint integration', () => {
  it('loads the published preset shape through the commitlint loader', async () => {
    const config = await loadCommitlintConfig(
      {
        extends: ['@icebreakers/commitlint-config'],
      },
      {
        cwd: path.resolve(__dirname, '..'),
      },
    )

    expect(config.parserPreset?.name).toBe(
      'conventional-changelog-conventionalcommits',
    )
    expect(config.parserPreset?.parserOpts).toEqual(expect.objectContaining({
      headerPattern: expect.any(RegExp),
      headerCorrespondence: ['type', 'scope', 'subject'],
    }))
    expect(config.prompt?.questions?.type?.enum?.['feat']).toMatchObject({
      title: 'Features',
    })

    const parserOpts = config.parserPreset?.parserOpts as LintOptions['parserOpts']
    expect(parserOpts).toBeDefined()
    const result = await lint('feat: load shared preset', config.rules as LintRules, {
      parserOpts: parserOpts!,
    })
    expect(result.valid).toBe(true)
  })

  it('loads the factory config without resolving the ESM-only parser preset string', async () => {
    const config = await loadCommitlintConfig(icebreaker(), {
      cwd: path.resolve(__dirname, '..'),
    })

    expect(config.parserPreset?.name).toBe(
      'conventional-changelog-conventionalcommits',
    )
    expect(config.parserPreset?.parserOpts).toEqual(expect.objectContaining({
      headerPattern: expect.any(RegExp),
      headerCorrespondence: ['type', 'scope', 'subject'],
    }))
  })

  it('validates default type enum rules', async () => {
    const config = createIcebreakerCommitlintConfig()

    const valid = await lintMessage('feat: add feature', config.rules)
    const invalid = await lintMessage('invalid: nope', config.rules)

    expect(valid.valid).toBe(true)
    expect(invalid.valid).toBe(false)
    expect(invalid.errors.some((error: LintError) => error.name === 'type-enum')).toBe(true)
  })

  it('accepts added commit types', async () => {
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

    const result = await lintMessage('deps: bump dependencies', config.rules)
    expect(result.valid).toBe(true)
  })

  it('enforces scope and header/subject constraints', async () => {
    const config = createIcebreakerCommitlintConfig({
      scopes: {
        values: ['core'],
        required: true,
        case: 'lower-case',
      },
      header: {
        maxLength: 10,
      },
      subject: {
        allowEmpty: false,
      },
    })

    const missingScope = await lintMessage('feat: short', config.rules)
    const wrongCase = await lintMessage('feat(Core): short', config.rules)
    const longHeader = await lintMessage('feat(core): 12345678901', config.rules)
    const emptySubject = await lintMessage('feat(core): ', config.rules)

    expect(missingScope.valid).toBe(false)
    expect(missingScope.errors.some((error: LintError) => error.name === 'scope-empty'))
      .toBe(true)
    expect(wrongCase.errors.some((error: LintError) => error.name === 'scope-case'))
      .toBe(true)
    expect(longHeader.errors.some((error: LintError) => error.name === 'header-max-length'))
      .toBe(true)
    expect(emptySubject.errors.some((error: LintError) => error.name === 'subject-empty'))
      .toBe(true)
  })
})
