import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import * as path from 'node:path'
import YAML from 'yaml'
import { assetTargets } from '../assets-data.mjs'
import { templateChoices } from '../template-data.mjs'
import { assetsDir, packageDir, templatesDir } from './paths'
import { sanitizePublishedCiWorkflowContent, sanitizePublishedRenovateContent } from './prepare/published-config'
import { toPublishGitignorePath } from './utils/gitignore'
import { shouldSkipTemplatePath } from './utils/template-filter'

const huskySkippedEntryPattern = /[\\/]_$/
const publishedToolingConfigs = {
  'commitlint.config.ts': [
    `import { defineCommitlintConfig } from 'repoctl/tooling'`,
    '',
    'export default await defineCommitlintConfig()',
    '',
  ].join('\n'),
  'eslint.config.js': [
    `import { defineEslintConfig } from 'repoctl/tooling'`,
    '',
    'export default await defineEslintConfig()',
    '',
  ].join('\n'),
  'lint-staged.config.js': [
    `import { defineLintStagedConfig } from 'repoctl/tooling'`,
    '',
    'export default await defineLintStagedConfig()',
    '',
  ].join('\n'),
  'stylelint.config.js': [
    `import { defineStylelintConfig } from 'repoctl/tooling'`,
    '',
    'export default await defineStylelintConfig()',
    '',
  ].join('\n'),
  'vitest.config.ts': [
    `import { defineConfig } from 'vitest/config'`,
    `import { defineVitestConfig } from 'repoctl/tooling'`,
    '',
    'export default defineConfig(async () => await defineVitestConfig())',
    '',
  ].join('\n'),
}
const sourceRepoReleaseToolingBuildStepPattern = /\r?\n\s+- name: Build Release Tooling\r?\n\s+run: pnpm run tooling:build\r?\n/g

export interface PrepareAssetsOptions {
  overwriteExisting?: boolean
  silent?: boolean
}

export function removeSourceRepoReleaseToolingBuildStepContent(content: string) {
  return content.replaceAll(sourceRepoReleaseToolingBuildStepPattern, '\n')
}

export function sanitizePublishedWorkspaceContent(content: string) {
  const workspace = YAML.parse(content) as {
    versioning?: Record<string, unknown>
  } | null
  if (!workspace?.versioning || typeof workspace.versioning !== 'object') {
    return content
  }

  delete workspace.versioning['fixed']
  delete workspace.versioning['ignore']
  delete workspace.versioning['lanes']
  return YAML.stringify(workspace)
}

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  }
  catch {
    return false
  }
}

async function renameGitignoreFiles(targetDir: string) {
  let entries: Dirent[]
  try {
    entries = await fs.readdir(targetDir, { withFileTypes: true })
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return
    }
    throw error
  }
  await Promise.all(entries.map(async (entry) => {
    const current = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      await renameGitignoreFiles(current)
      return
    }
    const renamed = toPublishGitignorePath(entry.name)
    if (renamed !== entry.name) {
      await fs.rename(current, path.join(targetDir, renamed))
    }
  }))
}

async function resetDir(targetDir: string, overwriteExisting: boolean) {
  if (!overwriteExisting && await pathExists(targetDir)) {
    return
  }
  try {
    await fs.rm(targetDir, { recursive: true, force: true })
  }
  catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err?.code !== 'ENOTEMPTY' && err?.code !== 'EBUSY' && err?.code !== 'EPERM') {
      throw error
    }
  }
  await fs.mkdir(targetDir, { recursive: true })
}

async function copyEntry(from: string, to: string, overwriteExisting: boolean, filter?: (src: string) => boolean) {
  if (!overwriteExisting && await pathExists(to)) {
    const [fromStats, toStats] = await Promise.all([fs.stat(from), fs.stat(to)])
    if (fromStats.isDirectory() && toStats.isDirectory()) {
      await fs.cp(from, to, {
        recursive: true,
        force: false,
        errorOnExist: false,
        filter,
      })
    }
    return
  }
  try {
    await fs.cp(from, to, {
      recursive: true,
      force: overwriteExisting,
      filter,
    })
  }
  catch (error) {
    const err = error as NodeJS.ErrnoException
    if (!overwriteExisting && (err?.code === 'EEXIST' || err?.code === 'ENOTEMPTY')) {
      return
    }
    throw error
  }
}

async function copyAssets(repoRoot: string, overwriteExisting: boolean) {
  const monorepoAssetRoot = path.resolve(repoRoot, 'packages/monorepo/assets')

  for (const target of assetTargets) {
    const packageAsset = path.join(monorepoAssetRoot, toPublishGitignorePath(target))
    const repoAsset = path.join(repoRoot, target)
    const from = await pathExists(repoAsset) ? repoAsset : packageAsset
    if (!await pathExists(from)) {
      continue
    }
    const to = path.join(assetsDir, toPublishGitignorePath(target))
    const stats = await fs.stat(from)
    const filter = target === '.husky'
      ? (src: string) => !huskySkippedEntryPattern.test(src)
      : undefined
    await copyEntry(from, to, overwriteExisting, filter)
    if (target === 'tsconfig.json') {
      await fs.writeFile(to, `${JSON.stringify({
        extends: 'repoctl/tsconfig.json',
        files: [],
      }, null, 2)}\n`)
    }
    if (stats.isDirectory()) {
      await renameGitignoreFiles(to)
    }
  }
}

async function writePublishedToolingConfigs() {
  await Promise.all(Object.entries(publishedToolingConfigs).map(async ([filename, content]) => {
    const targetPath = path.join(assetsDir, filename)
    if (await pathExists(targetPath)) {
      await fs.writeFile(targetPath, content)
    }
  }))
}

async function sanitizePublishedWorkspace() {
  const workspacePath = path.join(assetsDir, 'pnpm-workspace.yaml')
  if (!await pathExists(workspacePath)) {
    return
  }

  const content = await fs.readFile(workspacePath, 'utf8')
  await fs.writeFile(workspacePath, sanitizePublishedWorkspaceContent(content), 'utf8')
}

async function removePublishedReleaseState() {
  await fs.rm(path.join(assetsDir, '.changeset', 'ledger.yaml'), { force: true })
}

async function transformPublishedAsset(relativePath: string, transform: (content: string) => string) {
  const assetPath = path.join(assetsDir, relativePath)
  if (!await pathExists(assetPath)) {
    return
  }

  const content = await fs.readFile(assetPath, 'utf8')
  const nextContent = transform(content)
  if (nextContent !== content) {
    await fs.writeFile(assetPath, nextContent, 'utf8')
  }
}

async function sanitizePublishedRepositoryConfig() {
  await Promise.all([
    transformPublishedAsset('.github/workflows/ci.yml', sanitizePublishedCiWorkflowContent),
    transformPublishedAsset('renovate.json', sanitizePublishedRenovateContent),
  ])
}

async function removeSourceRepoReleaseToolingBuildStep() {
  await transformPublishedAsset(
    '.github/workflows/release.yml',
    removeSourceRepoReleaseToolingBuildStepContent,
  )
}

async function copyTemplates(repoRoot: string, overwriteExisting: boolean) {
  for (const template of templateChoices) {
    const from = path.join(repoRoot, 'templates', template.source)
    if (!await pathExists(from)) {
      continue
    }
    const to = path.join(templatesDir, template.source)
    const filter = (src: string) => !shouldSkipTemplatePath(from, src)
    await copyEntry(from, to, overwriteExisting, filter)
    await renameGitignoreFiles(to)
  }
}

export async function prepareAssets(options: PrepareAssetsOptions = {}) {
  const overwriteExisting = options.overwriteExisting ?? true
  const repoRoot = path.resolve(packageDir, '..', '..')
  if (!await pathExists(path.join(repoRoot, 'templates'))) {
    return
  }
  await resetDir(assetsDir, overwriteExisting)
  await resetDir(templatesDir, overwriteExisting)
  await copyAssets(repoRoot, overwriteExisting)
  await sanitizePublishedRepositoryConfig()
  await sanitizePublishedWorkspace()
  await removePublishedReleaseState()
  await writePublishedToolingConfigs()
  await removeSourceRepoReleaseToolingBuildStep()
  await copyTemplates(repoRoot, overwriteExisting)
}
