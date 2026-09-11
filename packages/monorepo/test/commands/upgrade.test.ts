import { tmpdir } from 'node:os'
import CI from 'ci-info'
import path from 'pathe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from '@/utils/fs'

const nodeModulesLinePattern = /^node_modules$/gm

async function createTempOutDir(slug: string) {
  const root = await fs.mkdtemp(path.join(tmpdir(), slug))
  const outDir = path.join(root, 'workspace')
  await fs.ensureDir(outDir)
  return { root, outDir }
}

afterEach(async () => {
  await vi.resetModules()
  vi.resetAllMocks()
})

describe('upgradeMonorepo overwrite logic', () => {
  it('skips overwriting LICENSE when already present', async () => {
    const checkboxMock = vi.fn(async () => [])
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-license-')

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    const { upgradeMonorepo } = await import('@/commands/upgrade')

    await upgradeMonorepo({ outDir, overwrite: true })
    const licensePath = path.join(outDir, 'LICENSE')
    expect(await fs.pathExists(licensePath)).toBe(true)

    await fs.writeFile(licensePath, '# custom license\n', 'utf8')
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })
    await upgradeMonorepo({ outDir, overwrite: true })

    const content = await fs.readFile(licensePath, 'utf8')
    expect(content).toBe('# custom license\n')
    expect(checkboxMock).not.toHaveBeenCalled()

    await fs.remove(root)
  })

  it('honors skipOverwrite for existing files', async () => {
    const checkboxMock = vi.fn(async () => [])
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-skip-')

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, overwrite: true })
    const targetFile = path.join(outDir, 'Dockerfile')
    await fs.writeFile(targetFile, '# custom configuration\n')
    await upgradeMonorepo({ outDir, skipOverwrite: true })
    const content = await fs.readFile(targetFile, 'utf8')
    expect(content).toBe('# custom configuration\n')

    expect(checkboxMock).not.toHaveBeenCalled()
    await fs.remove(root)
  })

  it('force-overwrites a custom release workflow without changing other no-overwrite assets', async () => {
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-release-')
    const workflowPath = path.join(outDir, '.github/workflows/release.yml')
    const configPath = path.join(outDir, 'repoctl.config.ts')

    await vi.resetModules()
    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, overwrite: true })

    await fs.writeFile(configPath, [
      'export default {',
      '  commands: {',
      '    upgrade: { noOverwrite: true },',
      '  },',
      '}\n',
    ].join('\n'), 'utf8')
    await fs.writeFile(workflowPath, 'name: custom\njobs: {}\n', 'utf8')

    await upgradeMonorepo({ outDir, yes: true, overwriteRelease: true })

    const workflow = await fs.readFile(workflowPath, 'utf8')
    expect(workflow).toContain('# repoctl-managed: release/v2')
    expect(workflow).not.toContain('detect-release-trigger:')
    expect(workflow).toContain('run: pnpm exec repo release ci')
    await fs.remove(root)
  })

  it.skipIf(CI.isCI)('prompts when contents differ and rewrites selected files', async () => {
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-rewrite-')
    const targetFile = path.join(outDir, 'Dockerfile')
    const checkboxMock = vi.fn(async (options: { choices?: Array<{ value: string }> }) => {
      const choices = Array.isArray(options?.choices) ? options.choices : []
      const match = choices.find(item => item.value === targetFile)
      return match ? [match.value] : []
    })

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    const { assetsDir } = await import('@/constants')
    const reference = await fs.readFile(path.join(assetsDir, 'Dockerfile'), 'utf8')
    const { upgradeMonorepo } = await import('@/commands/upgrade')

    await upgradeMonorepo({ outDir })
    await fs.writeFile(targetFile, '# drifted\n')
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })
    await upgradeMonorepo({ outDir })
    expect(checkboxMock).toHaveBeenCalledTimes(1)
    const rewritten = await fs.readFile(targetFile, 'utf8')
    expect(rewritten).toBe(reference)

    await upgradeMonorepo({ outDir })
    expect(checkboxMock).toHaveBeenCalledTimes(1)

    await fs.remove(root)
  })

  it.skipIf(CI.isCI)('supports interactive selection without legacy config migration', async () => {
    const checkboxMock = vi.fn(async (options: { message?: string, choices?: Array<{ value: string }> }) => {
      if (options?.message === '选择你需要的文件') {
        return ['.changeset']
      }
      const choices = Array.isArray(options?.choices) ? options.choices : []
      const first = choices[0]
      return first ? [first.value] : []
    })
    class GitClientMock {
      async getRepoName() {
        return 'ice/awesome'
      }
    }
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-interactive-')

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    vi.doMock('@/core/git', () => ({ GitClient: GitClientMock }))

    const { upgradeMonorepo } = await import('@/commands/upgrade')
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: true,
    })
    await upgradeMonorepo({ outDir, interactive: true })

    const configPath = path.join(outDir, '.changeset/config.json')
    expect(await fs.pathExists(configPath)).toBe(false)
    expect(checkboxMock).toHaveBeenCalled()

    await fs.remove(root)
  })

  it.skipIf(CI.isCI)('merges package.json content when it already exists', async () => {
    const checkboxMock = vi.fn(async (options: { choices?: Array<{ value: string }> }) => {
      const choices = Array.isArray(options?.choices) ? options.choices : []
      const match = choices.find(item => typeof item.value === 'string' && item.value.endsWith('package.json'))
      return match ? [match.value] : []
    })
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-package-')
    const packagePath = path.join(outDir, 'package.json')
    await fs.writeJSON(packagePath, {
      name: 'demo-package',
      scripts: {
        test: 'vitest',
      },
    }, { spaces: 2 })

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })

    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, overwrite: true })

    const pkg = await fs.readJSON(packagePath)
    expect(pkg.scripts.commitlint).toBe('commitlint --edit')
    expect(checkboxMock).not.toHaveBeenCalled()

    await fs.remove(root)
  })

  it('merges AGENTS.md content when it already exists', async () => {
    const checkboxMock = vi.fn(async (options: { choices?: Array<{ value: string }> }) => {
      const choices = Array.isArray(options?.choices) ? options.choices : []
      return choices.map(choice => choice.value)
    })
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-agents-')
    const agentsPath = path.join(outDir, 'AGENTS.md')

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })

    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, overwrite: true })

    await fs.writeFile(agentsPath, [
      '# Repository Guidelines',
      '',
      '## Project Structure & Module Organization',
      '',
      'custom structure section',
      '',
      '## Team Notes',
      '',
      'team-only notes',
      '',
    ].join('\n'), 'utf8')

    await upgradeMonorepo({ outDir, overwrite: true })

    const next = await fs.readFile(agentsPath, 'utf8')
    expect(next).toContain('custom structure section')
    expect(next).toContain('## Create packages and apps')
    expect(next).toContain('## Team Notes')
    expect(next).toContain('team-only notes')
    expect(next).not.toContain('source workspace for repoctl')

    await fs.remove(root)
  })

  it('merges .gitignore content when it already exists', async () => {
    const checkboxMock = vi.fn(async (options: { choices?: Array<{ value: string }> }) => {
      const choices = Array.isArray(options?.choices) ? options.choices : []
      return choices.map(choice => choice.value)
    })
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-gitignore-')
    const gitignorePath = path.join(outDir, '.gitignore')

    await vi.resetModules()
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })

    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, overwrite: true })

    await fs.writeFile(gitignorePath, [
      '# local overrides',
      'node_modules',
      '.playwright-cli',
      '',
    ].join('\n'), 'utf8')

    await upgradeMonorepo({ outDir })

    const next = await fs.readFile(gitignorePath, 'utf8')
    expect(next).toContain('# local overrides')
    expect(next).toContain('.playwright-cli')
    expect(next).toContain('.turbo')
    expect((next.match(nodeModulesLinePattern) ?? []).length).toBe(1)

    await fs.remove(root)
  })

  it('migrates direct config package wrappers when upgrading existing tooling files', async () => {
    const { root, outDir } = await createTempOutDir('monorepo-upgrade-direct-tooling-')
    const packagePath = path.join(outDir, 'package.json')
    const eslintPath = path.join(outDir, 'eslint.config.js')

    await fs.writeJSON(packagePath, {
      name: 'demo-package',
      scripts: {},
    }, { spaces: 2 })
    await fs.writeFile(eslintPath, [
      'import { icebreaker as eslintConfig } from \'@icebreakers/eslint-config\'',
      '',
      'const baseOptions = { ignores: [\'dist/**\'] }',
      'const extraFlatConfigs = [{ rules: { \'no-console\': \'off\' } }]',
      '',
      'export default eslintConfig(baseOptions, ...extraFlatConfigs)',
      '',
    ].join('\n'), 'utf8')

    const { upgradeMonorepo } = await import('@/commands/upgrade')
    await upgradeMonorepo({ outDir, yes: true })

    const content = await fs.readFile(eslintPath, 'utf8')
    expect(content).toContain('import { defineEslintConfig } from \'repoctl/tooling\'')
    expect(content).toContain('export default await defineEslintConfig(baseOptions, ...extraFlatConfigs)')
    expect(content).toContain('no-console')

    await fs.remove(root)
  })
})
