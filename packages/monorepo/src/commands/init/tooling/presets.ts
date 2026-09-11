import type { InitToolingContext, InitToolingPreset, InitToolingTarget } from './types'
import { version } from '@/constants'
import { localize } from '@/i18n'
import { defineTsconfigConfig } from '@/tooling'
import rootPackageJson from '../../../../../../package.json'
import monorepoPackageJson from '../../../../package.json'

function isConcreteNpmSpecifier(version: string) {
  return !version.startsWith('catalog:') && !version.startsWith('workspace:')
}

function collectConcreteDependencyVersions(pkg: {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}) {
  const versions: Record<string, string> = {}
  for (const group of [pkg.dependencies, pkg.devDependencies]) {
    for (const [name, version] of Object.entries(group ?? {})) {
      if (typeof version === 'string' && version.length > 0 && isConcreteNpmSpecifier(version)) {
        versions[name] = version
      }
    }
  }
  return versions
}

const packageDependencies = {
  ...collectConcreteDependencyVersions(rootPackageJson as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }),
  ...collectConcreteDependencyVersions(monorepoPackageJson as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }),
}

function getDependencyVersion(name: string) {
  const version = packageDependencies[name]
  if (!version) {
    throw new Error(localize(`No version information was found for dependency ${name}.`, `未找到依赖 ${name} 的版本信息。`))
  }
  if (!isConcreteNpmSpecifier(version)) {
    throw new Error(localize(`Dependency ${name} must use a concrete version, not ${version}.`, `依赖 ${name} 必须使用具体版本，不能使用 ${version}。`))
  }
  return version
}

function getToolingPackageVersion() {
  return `^${version}`
}

function createConfigModule(functionName: string, source: string) {
  return [
    `import { ${functionName} } from '${source}'`,
    '',
    `export default await ${functionName}()`,
    '',
  ].join('\n')
}

function getToolingPackageDependency(toolingPackageName: InitToolingContext['toolingPackageName']) {
  return {
    [toolingPackageName]: getToolingPackageVersion(),
  }
}

export function resolveToolingPackageName(): InitToolingContext['toolingPackageName'] {
  return 'repoctl'
}

export function resolveToolingImportSource(): InitToolingContext['toolingImportSource'] {
  return 'repoctl/tooling'
}

export const initToolingPresets: Record<InitToolingTarget, InitToolingPreset> = {
  'commitlint': {
    target: 'commitlint',
    filepath: 'commitlint.config.ts',
    getContent: ({ toolingImportSource }) => createConfigModule('defineCommitlintConfig', toolingImportSource),
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      '@commitlint/cli': getDependencyVersion('@commitlint/cli'),
    }),
  },
  'eslint': {
    target: 'eslint',
    filepath: 'eslint.config.js',
    getContent: ({ toolingImportSource }) => createConfigModule('defineEslintConfig', toolingImportSource),
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      eslint: getDependencyVersion('eslint'),
    }),
  },
  'stylelint': {
    target: 'stylelint',
    filepath: 'stylelint.config.js',
    getContent: ({ toolingImportSource }) => createConfigModule('defineStylelintConfig', toolingImportSource),
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      stylelint: getDependencyVersion('stylelint'),
    }),
  },
  'lint-staged': {
    target: 'lint-staged',
    filepath: 'lint-staged.config.js',
    getContent: ({ toolingImportSource }) => createConfigModule('defineLintStagedConfig', toolingImportSource),
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      'lint-staged': getDependencyVersion('lint-staged'),
    }),
  },
  'tsconfig': {
    target: 'tsconfig',
    filepath: 'tsconfig.json',
    getContent: async ({ cwd }) => {
      const config = await defineTsconfigConfig({ cwd })
      return `${JSON.stringify(config, undefined, 2)}\n`
    },
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      typescript: getDependencyVersion('typescript'),
    }),
  },
  'vitest': {
    target: 'vitest',
    filepath: 'vitest.config.ts',
    getContent: ({ toolingImportSource }) => [
      `import { defineVitestConfig } from '${toolingImportSource}'`,
      `import { defineConfig } from 'vitest/config'`,
      '',
      'export default defineConfig(async () => await defineVitestConfig())',
      '',
    ].join('\n'),
    getDependencies: ({ toolingPackageName }) => ({
      ...getToolingPackageDependency(toolingPackageName),
      '@vitest/coverage-v8': getDependencyVersion('@vitest/coverage-v8'),
      'vitest': getDependencyVersion('vitest'),
    }),
  },
}
