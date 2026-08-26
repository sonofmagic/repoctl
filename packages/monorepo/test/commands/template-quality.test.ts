import { describe, expect, it } from 'vitest'
import { assetsDir, templatesDir } from '@/constants'
import fs from '@/utils/fs'

const forbiddenExamplePackagePattern = /@icebreakers\/(?:foo|bar)/
const generatedTextExtensions = new Set([
  '.json',
  '.jsonc',
  '.js',
  '.mjs',
  '.ts',
  '.mts',
  '.md',
  '',
])

async function collectTextFiles(rootDir: string) {
  const files: string[] = []

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    await Promise.all(entries.map(async (entry) => {
      const entryPath = `${currentDir}/${entry.name}`
      if (entry.isDirectory()) {
        await walk(entryPath)
        return
      }
      if (entry.isFile()) {
        files.push(entryPath)
      }
    }))
  }

  await walk(rootDir)
  return files
}

describe('generated template quality', () => {
  it('does not ship hard-coded example package names', async () => {
    const files = await collectTextFiles(templatesDir)
    const matches: string[] = []

    for (const file of files) {
      if (!generatedTextExtensions.has(file.slice(file.lastIndexOf('.')))) {
        continue
      }
      const content = await fs.readFile(file, 'utf8')
      if (forbiddenExamplePackagePattern.test(content)) {
        matches.push(file)
      }
    }

    expect(matches).toEqual([])
  })

  it('does not include source-repo-only tooling loader in generated upgrade targets', async () => {
    const assetTargets = await collectTextFiles(assetsDir)
    expect(assetTargets.some(file => file.includes('/tooling/load-tooling-module.mjs'))).toBe(false)
  })

  it('does not ship source-repo-only release tooling build step', async () => {
    const content = await fs.readFile(`${assetsDir}/.github/workflows/release.yml`, 'utf8')
    expect(content).not.toContain('Build Release Tooling')
    expect(content).not.toContain('pnpm run tooling:build')
  })

  it('does not ship source-repo-only Worker type synchronization', async () => {
    const [ciWorkflow, renovateConfig] = await Promise.all([
      fs.readFile(`${assetsDir}/.github/workflows/ci.yml`, 'utf8'),
      fs.readFile(`${assetsDir}/renovate.json`, 'utf8'),
    ])

    expect(ciWorkflow).not.toContain('generated-assets')
    expect(ciWorkflow).not.toContain('Check generated Worker types')
    expect(renovateConfig).not.toContain('rebaseWhen')
    expect(renovateConfig).not.toContain('postUpgradeTasks')
    expect(renovateConfig).not.toContain('pnpm cf-typegen')
  })

  it('does not ship stale TypeScript deprecation suppressions', async () => {
    const files = [
      ...await collectTextFiles(assetsDir),
      ...await collectTextFiles(templatesDir),
    ]
    const matches: string[] = []

    for (const file of files) {
      if (!generatedTextExtensions.has(file.slice(file.lastIndexOf('.')))) {
        continue
      }
      const content = await fs.readFile(file, 'utf8')
      if (content.includes('ignoreDeprecations')) {
        matches.push(file)
      }
    }

    expect(matches).toEqual([])
  })

  it('does not depend on package exports for generated root tsconfig', async () => {
    const content = await fs.readFile(`${assetsDir}/tsconfig.json`, 'utf8')
    expect(content).toContain('repoctl/tsconfig.json')
    expect(content).not.toContain('references')
  })
})
