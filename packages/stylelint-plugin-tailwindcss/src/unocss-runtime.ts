import type { UnoGenerator } from '@unocss/core'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { loadConfig } from '@unocss/config'
import { createGenerator } from '@unocss/core'

const UNO_CONFIG_FILENAMES = [
  'uno.config.ts',
  'uno.config.js',
  'uno.config.mjs',
  'uno.config.cjs',
  'uno.config.mts',
  'unocss.config.ts',
  'unocss.config.js',
  'unocss.config.mjs',
  'unocss.config.cjs',
  'unocss.config.mts',
] as const

const generatorCache = new Map<string, Promise<UnoGenerator<object>>>()

function resolveRuntimeCwd(fromFile?: string): string {
  return fromFile ? path.dirname(fromFile) : process.cwd()
}

function findUnoConfig(fromFile?: string): string | null {
  let currentDir = resolveRuntimeCwd(fromFile)

  while (true) {
    for (const filename of UNO_CONFIG_FILENAMES) {
      const candidate = path.join(currentDir, filename)
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate
      }
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}

async function getUnoGenerator(
  fromFile?: string,
): Promise<UnoGenerator<object> | null> {
  const configPath = findUnoConfig(fromFile)
  if (!configPath) {
    return null
  }

  const cached = generatorCache.get(configPath)
  if (cached) {
    return cached
  }

  const generatorPromise = (async () => {
    const { config } = await loadConfig(path.dirname(configPath), configPath)
    return createGenerator(config)
  })()
  generatorCache.set(configPath, generatorPromise)
  return generatorPromise
}

export async function hasUnoCssRuntime(fromFile?: string): Promise<boolean> {
  return getUnoGenerator(fromFile).then(generator => generator !== null)
}

export async function isUnoCssUtilityClass(
  className: string,
  fromFile?: string,
): Promise<boolean> {
  const generator = await getUnoGenerator(fromFile)
  if (!generator) {
    return false
  }

  return Boolean(await generator.parseToken(className))
}
