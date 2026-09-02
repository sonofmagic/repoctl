import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'pathe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildGitHubReleaseBodyFromChangelog, repairReleaseNotes } from '@/commands/release'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(root => rm(root, { force: true, recursive: true })))
})

async function createWorkspace() {
  const cwd = await mkdtemp(path.join(tmpdir(), 'repo-release-repair-'))
  tempRoots.push(cwd)
  await writeFile(path.join(cwd, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf8')
  const packageDir = path.join(cwd, 'packages', 'demo')
  await mkdir(packageDir, { recursive: true })
  await writeFile(path.join(packageDir, 'package.json'), JSON.stringify({ name: '@acme/demo', version: '1.0.0' }), 'utf8')
  return cwd
}

describe('repair release notes', () => {
  it('rebuilds matching releases from the changelog at the release tag', async () => {
    const cwd = await createWorkspace()
    const updateRelease = vi.fn()
    const spawn = vi.fn(() => ({
      status: 0,
      stdout: [
        '# @acme/demo',
        '',
        '## 1.0.0',
        '',
        '### Patch Changes',
        '',
        '- 修复历史发布说明。',
      ].join('\n'),
    }))

    const result = await repairReleaseNotes({
      cwd,
      tag: '@acme/demo@1.0.0',
      spawn: spawn as never,
      env: { GITHUB_REPOSITORY: 'acme/repo' },
      github: {
        listReleases: vi.fn().mockResolvedValue([
          { id: 1, html_url: 'https://github.com/acme/repo/releases/1', tag_name: '@acme/demo@1.0.0', target_commitish: 'merge123' },
          { id: 2, html_url: 'https://github.com/acme/repo/releases/2', tag_name: '@acme/other@1.0.0' },
        ]),
        updateRelease,
        readReleasePullRequestContributors: vi.fn().mockResolvedValue(['@alice', '**@alice**', '@bob']),
      },
    })

    expect(result).toEqual({ repaired: ['@acme/demo@1.0.0'], skipped: [] })
    expect(spawn).toHaveBeenCalledWith('git', ['show', '@acme/demo@1.0.0:packages/demo/CHANGELOG.md'], expect.objectContaining({ cwd }))
    expect(updateRelease).toHaveBeenCalledWith({
      id: 1,
      name: '@acme/demo@1.0.0',
      body: expect.stringContaining('Thanks to @alice · @bob'),
    })
  })

  it('skips releases without a matching changelog and leaves dry runs unchanged', async () => {
    const cwd = await createWorkspace()
    const updateRelease = vi.fn()
    const spawn = vi.fn(() => ({ status: 1, stdout: '' }))

    const result = await repairReleaseNotes({
      cwd,
      all: true,
      dryRun: true,
      spawn: spawn as never,
      github: {
        listReleases: vi.fn().mockResolvedValue([
          { id: 1, html_url: 'https://github.com/acme/repo/releases/1', tag_name: '@acme/demo@1.0.0' },
          { id: 2, html_url: 'https://github.com/acme/repo/releases/2', tag_name: 'unrelated-tag' },
        ]),
        updateRelease,
      },
    })

    expect(result).toEqual({ repaired: [], skipped: ['@acme/demo@1.0.0', 'unrelated-tag'] })
    expect(updateRelease).not.toHaveBeenCalled()
  })

  it('finds package directories that only existed in the historical tag', async () => {
    const cwd = await createWorkspace()
    const updateRelease = vi.fn()
    const spawn = vi.fn((_: string, args: string[]) => {
      if (args[0] === 'ls-tree') {
        return { status: 0, stdout: 'packages/legacy/package.json\n' }
      }
      if (args[0] === 'show' && args[1] === '@acme/demo@1.0.0:packages/legacy/package.json') {
        return { status: 0, stdout: JSON.stringify({ name: '@acme/demo' }) }
      }
      return {
        status: 0,
        stdout: '# @acme/legacy\n\n## 1.0.0\n\n### Patch Changes\n\n- 修复旧包路径。\n',
      }
    })

    await expect(repairReleaseNotes({
      cwd,
      all: true,
      spawn: spawn as never,
      github: {
        listReleases: vi.fn().mockResolvedValue([
          { id: 3, html_url: 'https://github.com/acme/repo/releases/3', tag_name: '@acme/demo@1.0.0' },
        ]),
        updateRelease,
      },
    })).resolves.toMatchObject({ repaired: ['@acme/demo@1.0.0'] })
    expect(updateRelease).toHaveBeenCalledWith(expect.objectContaining({ id: 3, body: expect.stringContaining('修复旧包路径') }))
  })

  it('does not write a release that already has the repaired body', async () => {
    const cwd = await createWorkspace()
    const changelog = '# @acme/demo\n\n## 1.0.0\n\n### Patch Changes\n\n- 已经是正确正文。\n'
    const body = buildGitHubReleaseBodyFromChangelog('@acme/demo', '1.0.0', changelog)
    const updateRelease = vi.fn()
    const spawn = vi.fn(() => ({ status: 0, stdout: changelog }))

    await repairReleaseNotes({
      cwd,
      all: true,
      spawn: spawn as never,
      github: {
        listReleases: vi.fn().mockResolvedValue([
          { id: 4, html_url: 'https://github.com/acme/repo/releases/4', tag_name: '@acme/demo@1.0.0', name: '@acme/demo@1.0.0', body },
        ]),
        updateRelease,
      },
    })

    expect(updateRelease).not.toHaveBeenCalled()
  })
})
