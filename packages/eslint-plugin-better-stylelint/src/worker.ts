import type { BetterStylelintOptions } from './types'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

interface StylelintWarning {
  rule?: string
  severity?: 'error' | 'warning' | string
  text: string
  line?: number
  column?: number
  endLine?: number
  endColumn?: number
}

interface StylelintResult {
  warnings?: StylelintWarning[]
  parseErrors?: StylelintWarning[]
}

interface StylelintWorkerSuccess {
  ok: true
  result: StylelintResult
}

interface StylelintWorkerFailure {
  ok: false
  error: string
}

type StylelintWorkerResponse = StylelintWorkerSuccess | StylelintWorkerFailure

function normalizeWarning(warning: StylelintWarning): StylelintWarning {
  return {
    ...(warning.rule !== undefined ? { rule: warning.rule } : {}),
    ...(warning.severity !== undefined ? { severity: warning.severity } : {}),
    text: warning.text,
    ...(warning.line !== undefined ? { line: warning.line } : {}),
    ...(warning.column !== undefined ? { column: warning.column } : {}),
    ...(warning.endLine !== undefined ? { endLine: warning.endLine } : {}),
    ...(warning.endColumn !== undefined ? { endColumn: warning.endColumn } : {}),
  }
}

function normalizeStylelintResult(result: {
  warnings?: StylelintWarning[]
  parseErrors?: StylelintWarning[]
} | undefined): StylelintResult {
  return {
    warnings: (result?.warnings ?? []).map(normalizeWarning),
    parseErrors: (result?.parseErrors ?? []).map(normalizeWarning),
  }
}

async function resolveStylelintConfig(options: BetterStylelintOptions) {
  if (options.config) {
    return options.config
  }

  if (!options.configOptions || !options.configLoader) {
    return undefined
  }

  const configLoaderModule = await import(options.configLoader)
  const resolveConfig = configLoaderModule.resolveStylelintConfig

  if (typeof resolveConfig !== 'function') {
    throw new TypeError(`Stylelint config loader "${options.configLoader}" must export resolveStylelintConfig()`)
  }

  return resolveConfig(options.configOptions)
}

function createProjectRequire(cwd: string) {
  try {
    return createRequire(path.join(cwd, 'package.json'))
  }
  catch {
    return createRequire(import.meta.url)
  }
}

function resolveStylelintEntry(cwd: string) {
  const projectRequire = createProjectRequire(cwd)

  try {
    return projectRequire.resolve('stylelint')
  }
  catch {
    const localRequire = createRequire(import.meta.url)
    return localRequire.resolve('stylelint')
  }
}

async function runStylelint(
  code: string,
  filename: string,
  options: Required<Pick<BetterStylelintOptions, 'cwd'>> & BetterStylelintOptions,
): Promise<StylelintWorkerResponse> {
  try {
    const stylelintEntry = resolveStylelintEntry(options.cwd)
    const stylelintModule = await import(pathToFileURL(stylelintEntry).href)
    const stylelint = stylelintModule.default ?? stylelintModule
    const config = await resolveStylelintConfig(options)
    const lintResult = await stylelint.lint({
      allowEmptyInput: true,
      code,
      codeFilename: filename,
      cwd: options.cwd,
      ...(config ? { config } : {}),
    })

    return {
      ok: true,
      result: normalizeStylelintResult(lintResult.results[0]),
    }
  }
  catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  const input = fs.readFileSync(0, 'utf8')
  const request = JSON.parse(input) as {
    code: string
    filename: string
    options: Required<Pick<BetterStylelintOptions, 'cwd'>> & BetterStylelintOptions
  }
  const response = await runStylelint(request.code, request.filename, request.options)
  process.stdout.write(JSON.stringify(response))
}

if (
  process.env['ICEBREAKER_STYLELINT_WORKER'] === '1'
  || (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
}

export {
  createProjectRequire as __createProjectRequire,
  resolveStylelintEntry as __resolveStylelintEntry,
}
