import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { updateRootPackageJson } from './package-json'
import { scaffoldFromNpm } from './source-npm'
import { updateRootTsconfigReferences } from './tsconfig'

describe('scaffoldFromNpm', () => {
  it('generates clean tooling imports and tsconfig references for selected templates', async () => {
    const targetDir = await mkdtemp(path.join(tmpdir(), 'create-repoctl-scaffold-'))

    try {
      await scaffoldFromNpm(targetDir, ['cli', 'tsdown'], true)
      await updateRootPackageJson(targetDir, 'demo-repo')
      await updateRootTsconfigReferences(targetDir)

      const [rootVitestConfig, rootTsconfig, releaseWorkflow, ciWorkflow, renovateConfig] = await Promise.all([
        readFile(path.join(targetDir, 'vitest.config.ts'), 'utf8'),
        readFile(path.join(targetDir, 'tsconfig.json'), 'utf8'),
        readFile(path.join(targetDir, '.github/workflows/release.yml'), 'utf8'),
        readFile(path.join(targetDir, '.github/workflows/ci.yml'), 'utf8'),
        readFile(path.join(targetDir, 'renovate.json'), 'utf8'),
      ])
      const parsedTsconfig = JSON.parse(rootTsconfig) as {
        references?: Array<{ path: string }>
      }

      expect(rootVitestConfig).toContain(`from 'repoctl/tooling'`)
      expect(rootVitestConfig).not.toContain('tooling/load-tooling-module.mjs')
      expect(releaseWorkflow).not.toContain('Build Release Tooling')
      expect(releaseWorkflow).not.toContain('pnpm run tooling:build')
      expect(ciWorkflow).not.toContain('generated-assets')
      expect(ciWorkflow).not.toContain('Check generated Worker types')
      expect(renovateConfig).not.toContain('rebaseWhen')
      expect(renovateConfig).not.toContain('postUpgradeTasks')
      expect(renovateConfig).not.toContain('pnpm cf-typegen')
      expect(parsedTsconfig.references).toEqual([
        { path: './apps/cli' },
        { path: './packages/tsdown' },
      ])
    }
    finally {
      await rm(targetDir, { force: true, recursive: true })
    }
  })
})
