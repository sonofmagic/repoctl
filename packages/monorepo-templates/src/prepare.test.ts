import { describe, expect, it } from 'vitest'
import YAML from 'yaml'
import { removeSourceRepoReleaseToolingBuildStepContent, sanitizePublishedWorkspaceContent } from './prepare'
import { sanitizePublishedCiWorkflowContent, sanitizePublishedRenovateContent } from './prepare/published-config'

describe('sanitizePublishedCiWorkflowContent', () => {
  it('removes source-only generated asset jobs while preserving the build job', () => {
    const content = [
      'name: CI',
      '',
      'jobs:',
      '  generated-assets:',
      '    name: Generated Assets',
      '    steps:',
      '      - run: pnpm cf-typegen:check',
      '  build:',
      '    name: Build and Test',
      '    needs: generated-assets',
      '    strategy:',
      '      fail-fast: false',
      '  ci:',
      '    name: CI',
      '    needs: [generated-assets, build]',
      '    steps:',
      '      - run: test "$GENERATED_ASSETS_RESULT" = "success"',
      '',
    ].join('\n')

    const workflow = YAML.parse(sanitizePublishedCiWorkflowContent(content)) as {
      jobs: Record<string, { needs?: string | string[], strategy?: unknown }>
    }

    expect(workflow.jobs['generated-assets']).toBeUndefined()
    expect(workflow.jobs['ci']).toBeUndefined()
    expect(workflow.jobs['build']).toEqual({
      name: 'Build and Test',
      strategy: { 'fail-fast': false },
    })
  })

  it('leaves workflows without the source-only job unchanged', () => {
    const content = 'jobs:\n  build:\n    name: Build and Test\n'

    expect(sanitizePublishedCiWorkflowContent(content)).toBe(content)
  })
})

describe('sanitizePublishedRenovateContent', () => {
  it('removes source-only tasks from the Cloudflare tooling rule', () => {
    const content = `${JSON.stringify({
      extends: ['config:recommended'],
      packageRules: [
        {
          groupSlug: 'all-non-major',
          rebaseWhen: 'behind-base-branch',
        },
        {
          matchPackageNames: ['wrangler', '@cloudflare/vite-plugin'],
          groupName: 'Cloudflare Workers tooling',
          groupSlug: 'cloudflare-workers-tooling',
          rebaseWhen: 'conflicted',
          postUpgradeTasks: {
            commands: ['pnpm cf-typegen'],
            fileFilters: ['templates/client/worker-configuration.d.ts'],
            executionMode: 'branch',
          },
        },
      ],
    }, null, 2)}\n`

    const config = JSON.parse(sanitizePublishedRenovateContent(content)) as {
      extends: string[]
      packageRules: Array<Record<string, unknown>>
    }

    expect(config.extends).toEqual(['config:recommended'])
    expect(config.packageRules[0]).toEqual({
      groupSlug: 'all-non-major',
      rebaseWhen: 'behind-base-branch',
    })
    expect(config.packageRules[1]).toEqual({
      matchPackageNames: ['wrangler', '@cloudflare/vite-plugin'],
      groupName: 'Cloudflare Workers tooling',
      groupSlug: 'cloudflare-workers-tooling',
    })
  })

  it('leaves Renovate configs without source-only tasks unchanged', () => {
    const content = '{\n  "packageRules": []\n}\n'

    expect(sanitizePublishedRenovateContent(content)).toBe(content)
  })
})

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
