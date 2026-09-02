import type {
  ResolvedTailwindRuntime,
  TailwindResolutionContext,
  TailwindVersion,
} from './types'
import fs from 'node:fs'
import path from 'node:path'
import enhancedResolve from 'enhanced-resolve'
import { createPathsMatcher, getTsconfig, parseTsconfig } from 'get-tsconfig'
import { TAILWIND_CONFIG_FILENAMES } from './constants'

type EnhancedResolveFileSystem = ConstructorParameters<
  typeof enhancedResolve.CachedInputFileSystem
>[0]

const fileSystem = new enhancedResolve.CachedInputFileSystem(
  fs as unknown as EnhancedResolveFileSystem,
  30_000,
)
const pathsMatcherCache = new Map<
  string,
  ReturnType<typeof createPathsMatcher>
>()

function getPathsMatcher(tsconfigPath?: string) {
  if (!tsconfigPath) {
    return null
  }

  const cached = pathsMatcherCache.get(tsconfigPath)
  if (cached !== undefined) {
    return cached
  }

  let matcher: ReturnType<typeof createPathsMatcher> | null = null

  try {
    const parsed = parseTsconfig(tsconfigPath)
    matcher = createPathsMatcher({
      path: tsconfigPath,
      config: parsed,
    })
  }
  catch {
    const resolved = getTsconfig(path.dirname(tsconfigPath))
    matcher = resolved ? createPathsMatcher(resolved) : null
  }

  pathsMatcherCache.set(tsconfigPath, matcher)
  return matcher
}

function createResolver(options: {
  conditionNames: string[]
  extensions: string[]
  mainFields?: string[]
}) {
  return enhancedResolve.ResolverFactory.createResolver({
    conditionNames: options.conditionNames,
    extensions: options.extensions,
    fileSystem,
    ...(options.mainFields ? { mainFields: options.mainFields } : {}),
    useSyncFileSystemCalls: true,
  })
}

function resolveWithResolver(
  resolver: enhancedResolve.Resolver,
  cwd: string,
  request: string,
): string | null {
  try {
    const resolved = resolver.resolveSync({}, cwd, request)
    return typeof resolved === 'string' ? resolved : null
  }
  catch {
    return null
  }
}

function resolveWithTsconfigPaths(
  context: TailwindResolutionContext,
  resolver: enhancedResolve.Resolver,
  cwd: string,
  request: string,
): string | null {
  const matcher = getPathsMatcher(context.tsconfigPath)
  if (!matcher) {
    return null
  }

  const matches = matcher(request)
  if (!matches?.length) {
    return null
  }

  for (const match of matches) {
    const resolved = resolveWithResolver(
      resolver,
      cwd,
      path.isAbsolute(match) ? match : path.resolve(cwd, match),
    )

    if (resolved) {
      return resolved
    }
  }

  return null
}

function findFileRecursive(
  cwd: string,
  filenames: readonly string[],
): string | null {
  let currentDir = cwd

  while (true) {
    for (const filename of filenames) {
      const candidate = path.resolve(currentDir, filename)
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate
      }
    }

    const parentDir = path.resolve(currentDir, '..')
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}

function readTailwindVersion(packageJsonPath: string | null): string | null {
  if (!packageJsonPath || !fs.existsSync(packageJsonPath)) {
    return null
  }

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8'),
    ) as {
      version?: string
    }
    return packageJson.version ?? null
  }
  catch {
    return null
  }
}

export function resolveTailwindRuntime(
  context: TailwindResolutionContext,
): ResolvedTailwindRuntime {
  const jsResolver = createResolver({
    conditionNames: ['node', 'import'],
    extensions: ['.mjs', '.js'],
    mainFields: ['module'],
  })
  const cssResolver = createResolver({
    conditionNames: ['style'],
    extensions: ['.css'],
    mainFields: ['style'],
  })

  const packageJsonPath
    = resolveWithResolver(jsResolver, context.cwd, 'tailwindcss/package.json')
      ?? resolveWithTsconfigPaths(
        context,
        jsResolver,
        context.cwd,
        'tailwindcss/package.json',
      )
  const installationPath = packageJsonPath
    ? path.dirname(packageJsonPath)
    : null

  const cssEntryPath
    = resolveWithResolver(cssResolver, context.cwd, 'tailwindcss')
      ?? resolveWithTsconfigPaths(context, cssResolver, context.cwd, 'tailwindcss')

  const configPath = findFileRecursive(context.cwd, TAILWIND_CONFIG_FILENAMES)

  return {
    configPath,
    cssEntryPath,
    installationPath,
    packageJsonPath,
    version: readTailwindVersion(packageJsonPath),
  }
}

export function detectInstalledTailwindVersion(
  context: TailwindResolutionContext,
): TailwindVersion {
  const version = resolveTailwindRuntime(context).version
  if (!version) {
    return 'unknown'
  }
  if (version.startsWith('4.')) {
    return 4
  }
  if (version.startsWith('3.')) {
    return 3
  }
  return 'unknown'
}
