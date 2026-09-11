import type { PackageJson } from '@/types'
import { describe, expect, it } from 'vitest'
import { setPkgJson } from '@/commands/upgrade/pkg-json'
import { scripts, scriptsEntries } from '@/commands/upgrade/scripts'
import { version as pkgVersion } from '@/constants'

describe('upgrade pkg-json helpers coverage', () => {
  it('merges package metadata while respecting workspace prefixes and version precedence', () => {
    const source: PackageJson = {
      packageManager: 'pnpm@8.10.0',
      dependencies: {
        'dep-keep': '^1.0.0',
        'dep-update': '^1.2.0',
        'dep-empty': '',
        'dep-catalog': '^1.3.0',
      },
      devDependencies: {
        'repoctl': '^0.0.1',
        'dep-dev-update': '^2.0.0',
        'dep-dev-stale': '^2.0.0',
      },
    }

    const target: PackageJson = {
      dependencies: {
        'dep-keep': '^1.5.0',
        'dep-update': '^1.0.0',
        'dep-empty': '  ',
        'dep-workspace': 'workspace:*',
        'dep-catalog': 'catalog:crossEnv',
      },
      devDependencies: {
        'repoctl': '^0.2.0',
        'dep-dev-update': 'workspace:^2.0.0',
        'dep-dev-stale': '^1.0.0',
      },
      scripts: {
        test: 'vitest',
      },
    }

    setPkgJson(source, target, {
      scripts: {
        build: 'turbo run build',
      },
    })

    expect(target.packageManager).toBe('pnpm@8.10.0')
    expect(target.dependencies).toMatchObject({
      'dep-keep': '^1.5.0',
      'dep-update': '^1.2.0',
      'dep-empty': '',
      'dep-workspace': 'workspace:*',
      'dep-catalog': 'catalog:crossEnv',
    })
    expect(target.devDependencies?.['dep-dev-update']).toBe('workspace:^2.0.0')
    expect(target.devDependencies?.['dep-dev-stale']).toBe('^2.0.0')
    expect(target.devDependencies?.['repoctl']).toBe(`^${pkgVersion}`)
    expect(target.scripts).toMatchObject({
      test: 'vitest',
      build: 'turbo run build',
    })
  })

  it('migrates legacy scoped helper dependency to repoctl', () => {
    const source: PackageJson = {
      devDependencies: {
        'repoctl': '^0.0.1',
        '@icebreakers/monorepo': '^0.0.1',
      },
    }
    const target: PackageJson = {
      devDependencies: {
        '@icebreakers/monorepo': '^0.2.0',
      },
    }

    setPkgJson(source, target)

    expect(target.devDependencies?.['repoctl']).toBe(`^${pkgVersion}`)
    expect(target.devDependencies?.['@icebreakers/monorepo']).toBeUndefined()
  })

  it('removes Changesets release dependencies during upgrade', () => {
    const source: PackageJson = {
      devDependencies: {
        repoctl: '^0.0.1',
      },
    }
    const target: PackageJson = {
      devDependencies: {
        '@changesets/cli': '^2.27.0',
        '@icebreakers/changelog-github': '^1.0.0',
        'repoctl': '^0.0.1',
      },
    }

    setPkgJson(source, target)

    expect(target.devDependencies?.['@changesets/cli']).toBeUndefined()
    expect(target.devDependencies?.['@icebreakers/changelog-github']).toBeUndefined()
  })

  it('does not copy source catalog specifiers onto consumer package.json', () => {
    const source: PackageJson = {
      dependencies: {
        yaml: 'catalog:',
      },
      devDependencies: {
        eslint: 'catalog:default',
        typescript: '^6.0.3',
      },
    }
    const target: PackageJson = {
      dependencies: {
        yaml: '^2.8.0',
      },
      devDependencies: {
        eslint: '^10.0.0',
      },
    }

    setPkgJson(source, target)

    expect(target.dependencies?.['yaml']).toBe('^2.8.0')
    expect(target.devDependencies?.['eslint']).toBe('^10.0.0')
    expect(target.devDependencies?.['typescript']).toBe('^6.0.3')
  })

  it('exposes scripts list for consumers', () => {
    expect(Array.isArray(scriptsEntries)).toBe(true)
    expect(Object.fromEntries(scriptsEntries)).toEqual(scripts)
  })
})
