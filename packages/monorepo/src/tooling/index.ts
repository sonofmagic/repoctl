import type {
  IcebreakerCommitlintConfig,
  IcebreakerCommitlintOptions,
} from '@icebreakers/commitlint-config'
import type {
  IcebreakerEslintConfig,
  UserDefinedOptions as IcebreakerEslintOptions,
  UserConfigItem as IcebreakerEslintUserConfigItem,
} from '@icebreakers/eslint-config'
import type {
  IcebreakerStylelintConfig,
  StylelintConfig as IcebreakerStylelintOptions,
} from '@icebreakers/stylelint-config'
import type { ViteUserConfig } from 'vitest/config'
import type {
  CommitlintToolingConfig,
  EslintToolingConfig,
  LintStagedToolingConfig,
  StylelintToolingConfig,
  ToolingConfig,
  TsconfigToolingConfig,
  VitestProjectToolingConfig,
  VitestToolingConfig,
} from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { icebreaker as createCommitlint } from '@icebreakers/commitlint-config'
import { icebreaker as createEslint } from '@icebreakers/eslint-config'
import { icebreaker as createStylelint } from '@icebreakers/stylelint-config'
import { parse as parseJsonc } from 'comment-json'
import { mergeConfig } from 'vitest/config'
import YAML from 'yaml'
import { loadMonorepoConfig } from '../core/config'

/**
 * `commitlint.config.*` 最终导出的配置类型。
 *
 */
export type MonorepoCommitlintConfig = IcebreakerCommitlintConfig

/**
 * `eslint.config.js` 最终导出的 flat config 类型。
 */
export type MonorepoEslintConfig = IcebreakerEslintConfig

/**
 * `stylelint.config.js` 最终导出的配置类型。
 *
 */
export type MonorepoStylelintConfig = IcebreakerStylelintConfig

/**
 * `lint-staged` 最终配置对象。
 *
 * key 为 glob pattern，value 为命令数组或命令生成函数。
 */
export interface MonorepoLintStagedConfig {
  [pattern: string]: string[] | ((files: string[]) => string | string[])
}

/**
 * `tsconfig.json` 最终导出的配置对象。
 */
export interface MonorepoTsconfig {
  extends?: string | string[]
  compilerOptions?: Record<string, unknown>
  include?: string[]
  exclude?: string[]
  files?: string[]
  references?: Array<{
    path: string
  }>
  compileOnSave?: boolean
}

export interface DefineConfigOptions<TConfig> {
  cwd?: string
  options?: TConfig
}

export interface DefineEslintConfigOptions extends DefineConfigOptions<EslintToolingConfig> {
  /**
   * 额外传给 ESLint flat config 工厂的配置片段。
   *
   * 这等价于 `options.configs`，但更贴近 flat config 的“基础 options + 后续 configs”写法。
   */
  configs?: IcebreakerEslintUserConfigItem[]
}

/**
 * `createMonorepoLintStagedConfig()` 与 `defineLintStagedConfig()` 的配置项。
 */
export interface MonorepoLintStagedConfigOptions extends LintStagedToolingConfig {}

/**
 * `createMonorepoVitestConfig()` 与 `defineVitestConfig()` 的共享配置项。
 *
 * 这些值会先参与 monorepo 级默认配置计算，再产出最终的 Vitest `test` 配置。
 */
export interface MonorepoVitestConfigOptions extends VitestToolingConfig {}

/**
 * `createMonorepoVitestProjectConfig()` 的项目级配置项。
 */
export interface MonorepoVitestProjectConfigOptions extends VitestProjectToolingConfig {}

/**
 * `createMonorepoVitestConfig()` 返回的标准结果结构。
 *
 * 该类型可用于约束自定义封装或二次 merge 的返回值。
 */
export interface MonorepoVitestConfigResult extends Omit<ViteUserConfig, 'test'> {
  test: NonNullable<ViteUserConfig['test']> & {
    projects?: NonNullable<ViteUserConfig['test']>['projects']
    coverage?: NonNullable<NonNullable<ViteUserConfig['test']>['coverage']> & {
      enabled?: boolean
      all?: boolean
      skipFull?: boolean
      exclude?: string[]
    }
    forceRerunTriggers?: string[]
  }
}

/**
 * 单个 package/app 的 `vitest.config.*` 最终导出结构。
 */
export interface MonorepoVitestProjectConfigResult {
  test: {
    alias?: Array<{
      find: string | RegExp
      replacement: string
    }>
    globals: boolean
    testTimeout: number
    environment?: string
  }
}

/**
 * `defineVitestConfig()` 的最终覆盖项。
 */
export type MonorepoVitestConfigOverrides = ViteUserConfig

export interface DefineVitestConfigOptions {
  cwd?: string
  options?: MonorepoVitestConfigOptions
  overrides?: MonorepoVitestConfigOverrides
}

export interface DefineVitestProjectConfigOptions {
  cwd?: string
  options?: MonorepoVitestProjectConfigOptions
}

const defaultProjectRoots = ['packages', 'apps']
const defaultConfigCandidates = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.js',
  'vitest.config.cjs',
  'vitest.workspace.ts',
  'vitest.workspace.mts',
]
const defaultWorkspaceConfigCandidates = [
  'vitest.config.ts',
  'vitest.config.mts',
  'vitest.config.cts',
  'vitest.config.js',
  'vitest.config.cjs',
  'vitest.config.mjs',
]
const windowsPathSeparatorPattern = /\\/g
const relativeCurrentDirPattern = /^\.\//
const globTokenPattern = /[*?[{]/
const trailingSlashPattern = /\/+$/
const monorepoTsconfigPath = fileURLToPath(import.meta.resolve('@icebreakers/monorepo/tsconfig'))

function escapeForShell(value: string) {
  return `'${value.replaceAll('\'', '\'\\\'\'')}'`
}

function resolveProjects(rootDir: string, projectRoots: string[], configCandidates: string[]) {
  const projects: string[] = []

  for (const folder of projectRoots) {
    const rootPath = path.resolve(rootDir, folder)
    if (!fs.existsSync(rootPath)) {
      continue
    }

    const entries = fs.readdirSync(rootPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const projectDir = path.join(rootPath, entry.name)
      const configPath = configCandidates
        .map(candidate => path.join(projectDir, candidate))
        .find(fs.existsSync)

      if (configPath) {
        projects.push(path.relative(rootDir, configPath))
      }
    }
  }

  return projects
}

function extractBaseDirFromGlob(pattern: string): string | null {
  if (!pattern) {
    return null
  }

  const normalized = pattern
    .replace(windowsPathSeparatorPattern, '/')
    .replace(relativeCurrentDirPattern, '')
  const globIndex = normalized.search(globTokenPattern)
  const base = globIndex === -1
    ? normalized
    : normalized.slice(0, globIndex)

  const cleaned = base.replace(trailingSlashPattern, '')
  return cleaned || null
}

function loadProjectRootsFromWorkspace(rootDir: string, workspaceFile: string) {
  const workspacePath = path.resolve(rootDir, workspaceFile)
  if (!fs.existsSync(workspacePath)) {
    return []
  }

  try {
    const workspaceContent = fs.readFileSync(workspacePath, 'utf8')
    const workspace = YAML.parse(workspaceContent) ?? {}
    const packages: unknown[] = Array.isArray(workspace.packages) ? workspace.packages : []

    const roots = packages
      .map(entry => typeof entry === 'string' ? entry.trim() : '')
      .filter(entry => entry && !entry.startsWith('!'))
      .map(extractBaseDirFromGlob)
      .filter((entry): entry is string => Boolean(entry))

    return roots.length ? [...new Set(roots)] : []
  }
  catch {
    return []
  }
}

function findConfig(basePath: string, configCandidates: string[]) {
  for (const filename of configCandidates) {
    const candidate = path.join(basePath, filename)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * 读取当前工作目录下的 `repoctl.config.*` 中 `tooling` 配置块。
 *
 * @param cwd 配置文件解析起点。默认使用 `process.cwd()`
 * @returns 标准化后的 tooling 配置；未配置时返回空对象
 *
 * @example
 * ```ts
 * import { loadMonorepoToolingConfig } from 'repoctl/tooling'
 *
 * const tooling = await loadMonorepoToolingConfig()
 * console.log(tooling.vitest?.includeWorkspaceRootConfig)
 * ```
 */
export async function loadMonorepoToolingConfig(cwd = process.cwd()): Promise<NonNullable<ToolingConfig>> {
  const config = await loadMonorepoConfig(cwd)
  return config.tooling ?? {}
}

async function loadToolingSection<K extends keyof NonNullable<ToolingConfig>>(key: K, cwd = process.cwd()) {
  const config = await loadMonorepoToolingConfig(cwd)
  return config[key]
}

function resolveConfigInput<TConfig>(input?: DefineConfigOptions<TConfig>) {
  return {
    cwd: input?.cwd ?? process.cwd(),
    options: input?.options,
  }
}

function isDefineConfigWrapper(input: unknown): input is DefineConfigOptions<unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false
  }
  return 'cwd' in input || 'options' in input
}

function resolveEslintOptions(
  options: EslintToolingConfig = {},
  configs: IcebreakerEslintUserConfigItem[] = [],
): EslintToolingConfig {
  const {
    configs: inlineConfigs = [],
    ...rest
  } = options

  return {
    ...rest,
    configs: [
      ...(inlineConfigs as IcebreakerEslintUserConfigItem[]),
      ...configs,
    ],
  }
}

function mergeTsconfig(
  base: MonorepoTsconfig,
  override?: TsconfigToolingConfig | MonorepoTsconfig,
): MonorepoTsconfig {
  if (!override) {
    return base
  }

  return {
    ...base,
    ...override,
    ...(base.compilerOptions || override.compilerOptions
      ? {
          compilerOptions: {
            ...(base.compilerOptions ?? {}),
            ...(override.compilerOptions ?? {}),
          },
        }
      : {}),
  }
}

function loadBundledTsconfig(): MonorepoTsconfig {
  const configContent = fs.readFileSync(monorepoTsconfigPath, 'utf8')
  return parseJsonc(configContent) as MonorepoTsconfig
}

/**
 * 基于 `@icebreakers/commitlint-config` 创建 commitlint 配置。
 *
 * 适合在需要手动传入覆盖项时使用；如果只想读取 `repoctl.config.ts` 默认值，
 * 优先使用 `defineCommitlintConfig()`。
 *
 * @param options 额外合并到默认 commitlint 配置上的字段
 * @returns 可直接作为 `commitlint.config.ts` 默认导出的配置对象
 *
 * @example
 * ```ts
 * import { createMonorepoCommitlintConfig } from 'repoctl/tooling'
 *
 * export default createMonorepoCommitlintConfig({
 *   rules: {
 *     'subject-case': [0],
 *   },
 * })
 * ```
 */
export function createMonorepoCommitlintConfig(
  options: CommitlintToolingConfig = {},
): MonorepoCommitlintConfig {
  return createCommitlint(options as IcebreakerCommitlintOptions)
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.commitlint`，并生成 commitlint 配置。
 *
 * @param input `cwd` 用于指定配置文件解析起点，`options` 用于追加运行时覆盖项
 * @returns 可直接导出的 commitlint 配置对象
 *
 * @example
 * ```ts
 * import { defineCommitlintConfig } from 'repoctl/tooling'
 *
 * export default await defineCommitlintConfig()
 * ```
 */
export async function defineCommitlintConfig(
  input: DefineConfigOptions<CommitlintToolingConfig> = {},
): Promise<MonorepoCommitlintConfig> {
  const resolved = resolveConfigInput(input)
  const toolingOptions = await loadToolingSection('commitlint', resolved.cwd)
  return createMonorepoCommitlintConfig({
    ...toolingOptions,
    ...resolved.options,
  })
}

/**
 * 基于 `@icebreakers/eslint-config` 创建 ESLint 配置。
 *
 * 默认会追加一个用于忽略 `fixtures` 目录的 glob，除非显式传入其他 `ignores`。
 *
 * @param options 额外 ESLint 配置；`ignores` 默认会忽略 `fixtures` 目录
 * @param extraConfigs 额外追加的 flat config 片段，等价于 `options.configs`
 * @returns 可直接作为 `eslint.config.js` 默认导出的 flat config
 *
 * @example
 * ```js
 * import { createMonorepoEslintConfig } from 'repoctl/tooling'
 *
 * export default createMonorepoEslintConfig(
 *   { ignores: ['dist/**'] },
 *   { rules: { 'no-console': 'off' } },
 * )
 * ```
 */
export function createMonorepoEslintConfig(
  options: EslintToolingConfig = {},
  ...extraConfigs: IcebreakerEslintUserConfigItem[]
): MonorepoEslintConfig {
  const {
    configs: resolvedConfigs = [],
    ...rest
  } = resolveEslintOptions(options, extraConfigs)
  return createEslint(
    rest as IcebreakerEslintOptions,
    ...(resolvedConfigs as IcebreakerEslintUserConfigItem[]),
  )
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.eslint`，并生成 ESLint 配置。
 *
 * @param input `cwd` 用于指定配置文件解析起点，`options` 与 `configs` 用于追加运行时覆盖项
 * @returns 可直接导出的 ESLint flat config
 *
 * @example
 * ```js
 * import { defineEslintConfig } from 'repoctl/tooling'
 *
 * export default await defineEslintConfig(
 *   { ignores: ['dist/**'] },
 *   { rules: { 'no-console': 'off' } },
 * )
 * ```
 */
export async function defineEslintConfig(
  input: DefineEslintConfigOptions | EslintToolingConfig = {},
  ...configs: IcebreakerEslintUserConfigItem[]
): Promise<MonorepoEslintConfig> {
  const wrapped = isDefineConfigWrapper(input)
    ? input as DefineEslintConfigOptions
    : { options: input as EslintToolingConfig }
  const resolved = resolveConfigInput(wrapped)
  const toolingOptions = await loadToolingSection('eslint', resolved.cwd)
  return createMonorepoEslintConfig({
    ...toolingOptions,
    ...resolved.options,
  }, ...(wrapped.configs ?? []), ...configs)
}

/**
 * 基于 `@icebreakers/stylelint-config` 创建 Stylelint 配置。
 *
 * @param options 额外合并到默认 stylelint 配置上的字段
 * @returns 可直接作为 `stylelint.config.js` 默认导出的配置对象
 */
export function createMonorepoStylelintConfig(
  options: StylelintToolingConfig = {},
): MonorepoStylelintConfig {
  return createStylelint(options as IcebreakerStylelintOptions)
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.stylelint`，并生成 Stylelint 配置。
 *
 * @param input `cwd` 用于指定配置文件解析起点，`options` 用于追加运行时覆盖项
 * @returns 可直接导出的 Stylelint 配置对象
 */
export async function defineStylelintConfig(
  input: DefineConfigOptions<StylelintToolingConfig> = {},
): Promise<MonorepoStylelintConfig> {
  const resolved = resolveConfigInput(input)
  const toolingOptions = await loadToolingSection('stylelint', resolved.cwd)
  return createMonorepoStylelintConfig({
    ...toolingOptions,
    ...resolved.options,
  })
}

/**
 * 创建 monorepo 内置的 TypeScript 基线配置。
 *
 * @param options 额外覆盖项，会与包内置 `tsconfig.base.json` 合并
 * @returns 可直接写入或二次扩展的 `tsconfig.json` 配置对象
 */
export function createMonorepoTsconfig(
  options: TsconfigToolingConfig = {},
): MonorepoTsconfig {
  return mergeTsconfig(loadBundledTsconfig(), options)
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.tsconfig`，并生成最终的 TypeScript 配置对象。
 *
 * @param input `cwd` 用于指定配置文件解析起点，`options` 用于追加运行时覆盖项
 * @returns 可直接写入或导出的 `tsconfig.json` 配置对象
 */
export async function defineTsconfigConfig(
  input: DefineConfigOptions<TsconfigToolingConfig> = {},
): Promise<MonorepoTsconfig> {
  const resolved = resolveConfigInput(input)
  const toolingOptions = await loadToolingSection('tsconfig', resolved.cwd)
  return createMonorepoTsconfig(mergeTsconfig(toolingOptions ?? {}, resolved.options))
}

/**
 * 创建适用于当前仓库约定的 `lint-staged` 配置。
 *
 * 默认行为：
 * - `*.{js,jsx,mjs,ts,tsx,mts,cts}` 运行 `eslint --fix`
 * - `*.vue` 同时运行 `eslint --fix` 与 `stylelint --fix --allow-empty-input`
 * - TypeScript/Vue files and workspace `package.json` files share one
 *   `pnpm exec repo verify staged-typecheck` task to avoid concurrent builds
 * - 样式文件运行 `stylelint --fix --allow-empty-input`
 *
 * @param options 可配置 `repoCommand`，默认值为 `pnpm exec repo`
 * @returns 可直接导出的 `lint-staged` 配置对象
 *
 * @example
 * ```js
 * import { createMonorepoLintStagedConfig } from 'repoctl/tooling'
 *
 * export default createMonorepoLintStagedConfig({
 *   repoCommand: 'pnpm exec repo',
 * })
 * ```
 */
export function createMonorepoLintStagedConfig(options: MonorepoLintStagedConfigOptions = {}): MonorepoLintStagedConfig {
  if (options.config) {
    return options.config as MonorepoLintStagedConfig
  }

  const repoCommand = options.repoCommand ?? 'pnpm exec repo'
  return {
    '*.{js,jsx,mjs,ts,tsx,mts,cts}': [
      'eslint --fix',
    ],
    '*.vue': [
      'eslint --fix',
      'stylelint --fix --allow-empty-input',
    ],
    '*.{ts,tsx,mts,cts,vue,json}': (files) => {
      const uniqueFiles = [...new Set(files)]
      if (uniqueFiles.length === 0) {
        return []
      }
      return `${repoCommand} verify staged-typecheck ${uniqueFiles.map(escapeForShell).join(' ')}`
    },
    '*.{json,md,mdx,html,yml,yaml}': [
      'eslint --fix',
    ],
    '*.{css,scss,sass,less}': [
      'stylelint --fix --allow-empty-input',
    ],
  }
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.lintStaged`，并生成 `lint-staged` 配置。
 *
 * @param input `cwd` 用于指定配置文件解析起点，`options` 用于追加运行时覆盖项
 * @returns 可直接导出的 `lint-staged` 配置对象
 */
export async function defineLintStagedConfig(
  input: DefineConfigOptions<MonorepoLintStagedConfigOptions> = {},
): Promise<MonorepoLintStagedConfig> {
  const resolved = resolveConfigInput(input)
  const toolingOptions = await loadToolingSection('lintStaged', resolved.cwd)
  return createMonorepoLintStagedConfig({
    ...toolingOptions,
    ...resolved.options,
  })
}

/**
 * 创建 monorepo 根级 Vitest 配置。
 *
 * 默认值：
 * - `rootDir`: `process.cwd()`
 * - `workspaceFile`: `'pnpm-workspace.yaml'`
 * - `projectRoots`: 自动从 workspace packages 推导，失败时回退到 `['packages', 'apps']`
 * - `includeWorkspaceRootConfig`: `false`
 * - `coverageEnabled`: `true`
 * - `coverageAll`: `false`
 * - `coverageSkipFull`: `true`
 *
 * @param options Vitest 默认配置生成参数
 * @returns 仅包含 `test` 字段的 Vitest 配置片段
 *
 * @example
 * ```ts
 * import { createMonorepoVitestConfig } from 'repoctl/tooling'
 *
 * export default {
 *   ...createMonorepoVitestConfig({
 *     includeWorkspaceRootConfig: false,
 *     coverageExclude: ['dist output glob'],
 *   }),
 * }
 * ```
 */
export function createMonorepoVitestConfig(options: MonorepoVitestConfigOptions = {}): MonorepoVitestConfigResult {
  const rootDir = options.rootDir ?? process.cwd()
  const workspaceFile = options.workspaceFile ?? 'pnpm-workspace.yaml'
  const workspaceProjectRoots = loadProjectRootsFromWorkspace(rootDir, workspaceFile)
  const projectRoots = options.projectRoots ?? (workspaceProjectRoots.length ? workspaceProjectRoots : defaultProjectRoots)
  const configCandidates = options.configCandidates ?? defaultConfigCandidates
  const includeWorkspaceRootConfig = options.includeWorkspaceRootConfig ?? false
  const projects = resolveProjects(rootDir, projectRoots, configCandidates)

  if (includeWorkspaceRootConfig) {
    const rootConfig = findConfig(rootDir, defaultWorkspaceConfigCandidates)
    if (rootConfig) {
      projects.unshift(rootConfig)
    }
  }

  return {
    test: {
      projects: [...new Set(projects)],
      coverage: {
        enabled: options.coverageEnabled ?? true,
        all: options.coverageAll ?? false,
        skipFull: options.coverageSkipFull ?? true,
        ...(options.coverageExclude ? { exclude: options.coverageExclude } : {}),
      } as NonNullable<NonNullable<MonorepoVitestConfigResult['test']>['coverage']>,
      forceRerunTriggers: [
        '**/{vitest,vite}.config.*/**',
      ],
    },
  }
}

function mergeMonorepoVitestConfig(
  base: ViteUserConfig,
  overrides: MonorepoVitestConfigOverrides = {},
): MonorepoVitestConfigResult {
  const merged = mergeConfig(base, overrides) as MonorepoVitestConfigResult
  if (!merged.test) {
    return merged
  }

  const coverageExclude = merged.test.coverage?.exclude
  const projects = merged.test.projects

  if (coverageExclude) {
    merged.test.coverage = {
      ...merged.test.coverage,
      exclude: [...new Set(coverageExclude)],
    }
  }

  if (projects) {
    merged.test.projects = [...new Set(projects)]
  }

  return merged
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.vitest`，再叠加运行时 `options` 与 `overrides`
 * 生成最终 Vitest 配置。
 *
 * 优先级从低到高：
 * 1. `repoctl.config.ts -> tooling.vitest`
 * 2. `options`
 * 3. `overrides`
 *
 * 推荐把“参与默认值推导”的字段放在 `options`，把“最终局部覆盖”放在 `overrides`。
 *
 * @param input `options` 会先与 `tooling.vitest` 合并；`overrides` 用于最终局部覆盖；`cwd` 用于配置文件解析起点
 * @returns 可直接作为 `defineConfig()` 返回值的 Vitest 配置对象
 *
 * @example
 * ```ts
 * import { defineVitestConfig } from 'repoctl/tooling'
 * import { defineConfig } from 'vitest/config'
 *
 * export default defineConfig(async () => await defineVitestConfig({
 *   options: {
 *     includeWorkspaceRootConfig: false,
 *   },
 *   overrides: {
 *     test: {
 *       coverage: {
 *         exclude: ['dist output glob'],
 *         skipFull: true,
 *       },
 *     },
 *   },
 * }))
 * ```
 */
export async function defineVitestConfig(
  input: DefineVitestConfigOptions = {},
): Promise<MonorepoVitestConfigResult> {
  const cwd = input.cwd ?? process.cwd()
  const options = input.options ?? {}
  const overrides = input.overrides ?? {}
  const toolingOptions = await loadToolingSection('vitest', cwd)
  const toolingOverrides = toolingOptions?.overrides ?? {}
  const { overrides: _ignoredToolingOverrides, ...toolingBaseOptions } = toolingOptions ?? {}

  return mergeMonorepoVitestConfig(
    createMonorepoVitestConfig({
      ...toolingBaseOptions,
      ...options,
    }),
    mergeMonorepoVitestConfig(toolingOverrides, overrides),
  )
}

/**
 * 创建项目级 Vitest 配置。
 *
 * 默认值：
 * - `globals`: `true`
 * - `testTimeout`: `60_000`
 * - `environment`: `'node'`
 *
 * @param options 单个 package/app 的 Vitest 配置项
 * @returns 可直接给项目内 `vitest.config.ts` 使用的 `test` 配置片段
 */
export function createMonorepoVitestProjectConfig(options: MonorepoVitestProjectConfigOptions = {}): MonorepoVitestProjectConfigResult {
  return {
    test: {
      ...(options.alias ? { alias: options.alias } : {}),
      globals: options.globals ?? true,
      testTimeout: options.testTimeout ?? 60_000,
      ...(options.environment ? { environment: options.environment } : {}),
    },
  }
}

/**
 * 从 `repoctl.config.ts` 读取 `tooling.vitestProject`，再叠加运行时 `options`
 * 生成单个 package/app 的项目级 Vitest 配置。
 *
 * 优先级从低到高：
 * 1. `repoctl.config.ts -> tooling.vitestProject`
 * 2. `options`
 *
 * @param input `cwd` 用于配置文件解析起点，`options` 用于追加项目内局部覆盖项
 * @returns 可直接传给 `defineProject()` 或与其他 Vite/Vitest 配置 merge 的项目级配置片段
 */
export async function defineVitestProjectConfig(
  input: DefineVitestProjectConfigOptions = {},
): Promise<MonorepoVitestProjectConfigResult> {
  const cwd = input.cwd ?? process.cwd()
  const toolingOptions = await loadToolingSection('vitestProject', cwd)

  return createMonorepoVitestProjectConfig({
    ...toolingOptions,
    ...input.options,
  })
}
