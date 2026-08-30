import type { SpawnSyncReturns } from 'node:child_process'
import type { PublishedPackage, ReleaseOptions } from './types'
import { spawnSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import path from 'pathe'
import { logger } from '../../core/logger'
import { getWorkspacePackages } from '../../core/workspace'
import { ReleaseCommandError } from './errors'
import { getReleaseEnv, readPublishSummary } from './shared'

const publishAttempts = 3
const retryDelays = [20_000, 40_000]

interface PublishCandidate {
  name: string
  version: string
}

type PublishResult = Pick<SpawnSyncReturns<string>, 'stdout' | 'stderr'>

function outputText(output: unknown) {
  return output == null ? '' : String(output)
}

function commandOutput(result: PublishResult) {
  return `${outputText(result.stdout)}\n${outputText(result.stderr)}`
}

function isTransientPublishFailure(output: string) {
  return /CA_CREATE_SIGNING_CERTIFICATE_ERROR|\b(?:429|5\d{2})\b|EAI_AGAIN|ECONNRESET|ETIMEDOUT/i.test(output)
}

function isPublishConflict(output: string) {
  return /cannot publish over|EPUBLISHCONFLICT|previously published|already exists/i.test(output)
}

function sleep(milliseconds: number, options: ReleaseOptions) {
  return options.sleep?.(milliseconds) ?? new Promise<void>(resolve => setTimeout(resolve, milliseconds))
}

function runPublishAttempt(args: string[], options: ReleaseOptions) {
  const result = (options.spawn ?? spawnSync)('pnpm', args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: getReleaseEnv(options),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  }) as SpawnSyncReturns<string>

  const stdout = outputText(result.stdout)
  const stderr = outputText(result.stderr)
  if (stdout) {
    process.stdout.write(stdout)
  }
  if (stderr) {
    process.stderr.write(stderr)
  }
  return { ...result, stdout, stderr }
}

function queryPublishedVersion(candidate: PublishCandidate, options: ReleaseOptions) {
  const result = (options.spawn ?? spawnSync)('npm', ['view', `${candidate.name}@${candidate.version}`, 'version'], {
    cwd: options.cwd,
    encoding: 'utf8',
    env: getReleaseEnv(options),
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return result.status === 0 && outputText(result.stdout).trim() === candidate.version
}

function readPublishedCandidates(candidates: PublishCandidate[], options: ReleaseOptions) {
  return candidates.filter(candidate => queryPublishedVersion(candidate, options))
}

function addPackageFilters(args: string[], candidates: PublishCandidate[]) {
  return [...args, ...candidates.flatMap(candidate => ['--filter', candidate.name])]
}

function mergePackages(...groups: PublishedPackage[][]) {
  const packages = new Map<string, PublishedPackage>()
  for (const group of groups) {
    for (const pkg of group) {
      packages.set(`${pkg.name}@${pkg.version}`, pkg)
    }
  }
  return [...packages.values()]
}

async function preservePublishSummary(cwd: string, previous: PublishedPackage[]) {
  if (!previous.length) {
    return
  }
  const current = await readPublishSummary(cwd)
  const merged = mergePackages(previous, current)
  await writeFile(path.join(cwd, 'pnpm-publish-summary.json'), `${JSON.stringify({ publishedPackages: merged }, null, 2)}\n`, 'utf8')
}

export async function getPublishCandidates(cwd: string): Promise<PublishCandidate[]> {
  const packages = await getWorkspacePackages(cwd)
  const candidates = packages.flatMap(({ manifest }) => (
    typeof manifest.name === 'string' && typeof manifest.version === 'string'
      ? [{ name: manifest.name, version: manifest.version }]
      : []
  ))
  if (!candidates.length) {
    throw new ReleaseCommandError('no versioned publishable workspace packages were found')
  }
  return candidates
}

/**
 * 发布 workspace 包，并在 provenance 服务出现瞬时错误时按包重试。
 *
 * 首次尝试仍交给 pnpm 处理 workspace 发布顺序；只有失败后才查询已上传的
 * 版本，并为剩余包追加筛选条件，避免重复发布已成功上传的包。
 */
export async function publishWithRetry(args: string[], options: ReleaseOptions, candidates: PublishCandidate[]) {
  let attemptArgs = args
  let publishedBeforeRetry = await readPublishSummary(options.cwd)

  for (let attempt = 1; attempt <= publishAttempts; attempt += 1) {
    const result = runPublishAttempt(attemptArgs, options)
    const currentSummary = await readPublishSummary(options.cwd)
    publishedBeforeRetry = mergePackages(publishedBeforeRetry, currentSummary)
    if (result.status === 0) {
      await preservePublishSummary(options.cwd, publishedBeforeRetry)
      return
    }

    const output = commandOutput(result)
    const published = readPublishedCandidates(candidates, options)
    publishedBeforeRetry = mergePackages(publishedBeforeRetry, published)
    const unpublished = candidates.filter(candidate => !published.some(pkg => pkg.name === candidate.name && pkg.version === candidate.version))
    if (!unpublished.length) {
      await preservePublishSummary(options.cwd, publishedBeforeRetry)
      logger.warn('npm publish returned an error, but all requested package versions are present in the registry; continuing.')
      return
    }

    if (!isTransientPublishFailure(output) && !isPublishConflict(output)) {
      throw new ReleaseCommandError(`command failed: pnpm ${args.join(' ')}`, result.status ?? 1)
    }
    if (attempt === publishAttempts) {
      throw new ReleaseCommandError(`command failed after ${publishAttempts} publish attempts: pnpm ${args.join(' ')}`, result.status ?? 1)
    }

    const delay = retryDelays[attempt - 1] ?? retryDelays[retryDelays.length - 1] ?? 0
    logger.warn(`npm publish transient failure; retrying ${unpublished.length} package(s) in ${delay / 1000}s (attempt ${attempt + 1}/${publishAttempts}).`)
    await sleep(delay, options)
    attemptArgs = addPackageFilters(args, unpublished)
  }
}
