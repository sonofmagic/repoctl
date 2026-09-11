import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { removeSourceRepoReleaseToolingBuildStepContent, sanitizePublishedWorkspaceContent } from './prepare'

describe('sanitizePublishedWorkspaceContent', () => {
  it('removes source repository package identities and preserves generic versioning settings', () => {
    const content = [
      'packages:',
      '  - packages/*',
      'versioning:',
      '  fixed:',
      '    - [repoctl, "@icebreakers/monorepo"]',
      '  ignore:',
      '    - private-package',
      '  lanes:',
      '    repoctl: next',
      '  changelog:',
      '    storage: repository',
      '  updateInternalDependencies: patch',
    ].join('\n')

    const workspace = YAML.parse(sanitizePublishedWorkspaceContent(content))

    expect(workspace).toEqual({
      packages: ['packages/*'],
      versioning: {
        changelog: { storage: 'repository' },
        updateInternalDependencies: 'patch',
      },
    })
  })

  it('leaves workspace files without versioning configuration unchanged', () => {
    const content = 'packages:\n  - packages/*\n'

    expect(sanitizePublishedWorkspaceContent(content)).toBe(content)
  })

  it('strips source catalogs so generated workspaces do not inherit them', () => {
    const content = [
      'packages:',
      '  - packages/*',
      'catalog:',
      '  yaml: ^2.9.0',
      'catalogs:',
      '  frontend:',
      '    vue: ^3.5.42',
      'overrides:',
      '  vite: 8.3.0',
    ].join('\n')

    const workspace = YAML.parse(sanitizePublishedWorkspaceContent(content))

    expect(workspace).toEqual({
      packages: ['packages/*'],
      overrides: {
        vite: '8.3.0',
      },
    })
    expect(workspace.catalog).toBeUndefined()
    expect(workspace.catalogs).toBeUndefined()
  })
})

describe('removeSourceRepoReleaseToolingBuildStepContent', () => {
  it('removes source-only release tooling build step from CRLF workflows', () => {
    const content = [
      'name: Release',
      '',
      'jobs:',
      '  release:',
      '    steps:',
      '      - name: Install Dependencies',
      '        run: pnpm i',
      '',
      '      - name: Build Release Tooling',
      '        run: pnpm run tooling:build',
      '',
      '      - name: Create or update Release PR',
      '        uses: peter-evans/create-pull-request@v8',
      '        with:',
      '          token: $' + '{{ secrets.GITHUB_TOKEN }}',
      '',
    ].join('\r\n')

    const nextContent = removeSourceRepoReleaseToolingBuildStepContent(content)

    expect(nextContent).toContain('Install Dependencies')
    expect(nextContent).toContain('Create or update Release PR')
    expect(nextContent).toContain('peter-evans/create-pull-request@v8')
    expect(nextContent).not.toContain('Build Release Tooling')
    expect(nextContent).not.toContain('pnpm run tooling:build')
  })
})
