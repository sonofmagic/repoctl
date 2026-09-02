import type { ChangelogFunctions } from '@changesets/types'
// eslint-disable-next-line e18e/ban-dependencies -- this package intentionally bootstraps local .env usage for documented Changesets CLI behavior.
import { config as loadEnv } from 'dotenv'
import { getInfo, getInfoFromPullRequest } from './github-info'

loadEnv()

type ReleaseLineFn = NonNullable<ChangelogFunctions['getReleaseLine']>
type GeneratorOptions = Parameters<ReleaseLineFn>[2]

interface GitHubLinks {
  commit: string | null
  pull: string | null
  user: string | null
}

const releaseTypeMap = {
  major: { icon: '🚀', label: 'Major' },
  minor: { icon: '✨', label: 'Minor' },
  patch: { icon: '🐛', label: 'Patch' },
  none: { icon: '📝', label: 'Update' },
} as const

const CONVENTIONAL_HEADLINE_RE = /^(\w+)(?:\(([^)]*)\))?(!?):\s(.+)$/
const NEWLINE_RE = /\r?\n/
const LIST_MARKER_RE = /^[-*+]\s+/
const PR_META_RE = /^(?:pr|pull|pull\s*request):\s*#?(\d+)\s*$/i
const COMMIT_META_RE = /^commit:\s*(\S+)\s*$/i
const USER_META_RE = /^(?:author|user):\s*(\S+)\s*$/i
const LEADING_AT_RE = /^@/
const BREAKING_CHANGE_RE = /^BREAKING[\s-]CHANGE:/i
const LIST_LINE_RE = /^(?:[-*+]\s+|\d+[.)]\s+)/
const FALLBACK_USER_RE = /@([^\]]+)/
const CODE_FENCE_RE = /^\s*```/
const LIST_LIKE_RE = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/
const PARAGRAPH_BREAK_RE = /\n\s*\n/
const GITHUB_METADATA_ERROR_RE
  = /GitHub|fetch|parse|Premature close|network|socket|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i

type ReleaseTypeKey = keyof typeof releaseTypeMap

function resolveReleaseType(type: string | undefined): ReleaseTypeKey {
  if (type && type in releaseTypeMap) {
    return type as ReleaseTypeKey
  }
  return 'none'
}

function assertRepo(
  options: GeneratorOptions | undefined,
): asserts options is GeneratorOptions & { repo: string } {
  if (
    !options
    || typeof options['repo'] !== 'string'
    || options['repo'].trim().length === 0
  ) {
    throw new Error(
      'Please provide a repo to this changelog generator like this:\n"changelog": ["@icebreakers/changelog-github", { "repo": "org/repo" }]',
    )
  }
}

function formatCommitLink(repo: string, commit: string): string {
  const shortCommitId = commit.slice(0, 7)
  return `[\`${shortCommitId}\`](https://github.com/${repo}/commit/${commit})`
}

function emptyLinks(): GitHubLinks {
  return {
    commit: null,
    pull: null,
    user: null,
  }
}

function isOptionalGitHubMetadataError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return GITHUB_METADATA_ERROR_RE.test(error.message)
}

async function getOptionalInfo(
  request: Parameters<typeof getInfo>[0],
): Promise<Awaited<ReturnType<typeof getInfo>> | null> {
  try {
    return await getInfo(request)
  }
  catch (error) {
    if (isOptionalGitHubMetadataError(error)) {
      return null
    }
    throw error
  }
}

async function getOptionalInfoFromPullRequest(
  request: Parameters<typeof getInfoFromPullRequest>[0],
): Promise<Awaited<ReturnType<typeof getInfoFromPullRequest>> | null> {
  try {
    return await getInfoFromPullRequest(request)
  }
  catch (error) {
    if (isOptionalGitHubMetadataError(error)) {
      return null
    }
    throw error
  }
}

async function collectDependencyReferences(
  changesets: Parameters<ChangelogFunctions['getDependencyReleaseLine']>[0],
  repo: string,
): Promise<string[]> {
  const references = await Promise.all(
    changesets.map(async (cs) => {
      if (!cs.commit) {
        return null
      }

      const info = await getOptionalInfo({
        repo,
        commit: cs.commit,
      })

      return info?.links.commit ?? formatCommitLink(repo, cs.commit)
    }),
  )

  return [...new Set(references.filter((link): link is string => Boolean(link)))]
}

function formatDependencyLine(
  references: string[],
  dependenciesUpdated: Parameters<
    ChangelogFunctions['getDependencyReleaseLine']
  >[1],
): string {
  const count = dependenciesUpdated.length
  const firstCommit = references[0] || ''

  if (count === 0) {
    return firstCommit ? `- 📦 **Dependencies** ${firstCommit}` : '- 📦 **Dependencies**'
  }

  const dependencySummaries = dependenciesUpdated.map(
    dependency => `\`${dependency.name}@${dependency.newVersion}\``,
  )

  if (count <= 3) {
    const header = firstCommit ? `- 📦 **Dependencies** ${firstCommit}` : '- 📦 **Dependencies**'
    const details = `  → ${dependencySummaries.join(', ')}`
    return `${header}\n${details}`
  }

  const header = firstCommit
    ? `- 📦 Updated ${count} dependencies ${firstCommit}`
    : `- 📦 Updated ${count} dependencies`

  const detailBlock = [
    '  <details><summary>Details</summary>',
    '',
    `  ${dependencySummaries.join(', ')}`,
    '',
    '  </details>',
  ].join('\n')

  return `${header}\n${detailBlock}`
}

interface ConventionalHeadline {
  type?: string | undefined
  scope?: string | undefined
  breaking: boolean
  description: string
}

function parseConventionalHeadline(raw: string): ConventionalHeadline {
  const match = raw.match(CONVENTIONAL_HEADLINE_RE)
  if (!match) {
    return { breaking: false, description: raw }
  }

  const type = match[1]
  const scope = match[2] || undefined
  const description = (match[4] ?? raw).trim()

  return {
    type,
    scope,
    breaking: match[3] === '!',
    description,
  }
}

function formatHeadline(raw: string): { text: string, breaking: boolean } {
  const parsed = parseConventionalHeadline(raw)

  if (!parsed.type) {
    return { text: raw, breaking: parsed.breaking }
  }

  const scopeTag = parsed.scope ? `${parsed.scope}: ` : ''
  return {
    text: `${scopeTag}${parsed.description}`,
    breaking: parsed.breaking,
  }
}

interface ParsedSummary {
  headline: string
  detailLines: string[]
  prNumber?: number
  commitRef?: string
  users: string[]
  breaking: boolean
}

function normalizeUserMentions(users: string[]): string {
  const normalized = users
    .map(user => user.trim())
    .filter(Boolean)
    .map(user => (user.startsWith('@') ? user : `@${user}`))

  if (normalized.length === 0) {
    return ''
  }

  if (normalized.length === 1) {
    return normalized[0] ?? ''
  }

  if (normalized.length === 2) {
    return `${normalized[0] ?? ''} and ${normalized[1] ?? ''}`
  }

  return `${normalized.slice(0, -1).join(', ')}, and ${normalized.at(-1) ?? ''}`
}

function extractSummaryMeta(summary: string): {
  prNumber?: number
  commitRef?: string
  users: string[]
  contentLines: string[]
  breaking: boolean
} {
  let prNumber: number | undefined
  let commitRef: string | undefined
  let breaking = false
  const users: string[] = []

  const contentLines = summary
    .split(NEWLINE_RE)
    .filter((line) => {
      const trimmed = line.trim()
      const withoutListMarker = trimmed.replace(LIST_MARKER_RE, '')

      const prMatch = withoutListMarker.match(PR_META_RE)
      if (prMatch) {
        const num = Number(prMatch[1] ?? Number.NaN)
        if (!Number.isNaN(num)) {
          prNumber = num
        }
        return false
      }

      const commitMatch = withoutListMarker.match(COMMIT_META_RE)
      if (commitMatch) {
        commitRef = commitMatch[1]
        return false
      }

      const userMatch = withoutListMarker.match(USER_META_RE)
      if (userMatch) {
        const user = userMatch[1]
        if (user) {
          users.push(user.replace(LEADING_AT_RE, ''))
        }
        return false
      }

      if (BREAKING_CHANGE_RE.test(withoutListMarker)) {
        breaking = true
      }

      return true
    })
    .map(line => line.trimEnd())

  return {
    ...(prNumber !== undefined ? { prNumber } : {}),
    ...(commitRef !== undefined ? { commitRef } : {}),
    users,
    contentLines,
    breaking,
  }
}

function parseSummary(summary: string): ParsedSummary {
  const {
    prNumber,
    commitRef,
    users,
    contentLines,
    breaking: bodyBreaking,
  } = extractSummaryMeta(summary)

  const nonEmptyIndex = contentLines.findIndex(line => line.trim().length > 0)
  if (nonEmptyIndex === -1) {
    return {
      headline: '',
      detailLines: [],
      ...(prNumber !== undefined ? { prNumber } : {}),
      ...(commitRef !== undefined ? { commitRef } : {}),
      users,
      breaking: bodyBreaking,
    }
  }

  const firstContentLine = contentLines[nonEmptyIndex]?.trim() ?? ''
  const startsWithList = LIST_LINE_RE.test(firstContentLine)

  const headline = startsWithList ? '' : firstContentLine
  const restLines = startsWithList
    ? contentLines.slice(nonEmptyIndex)
    : contentLines.slice(nonEmptyIndex + 1)

  const detailLines = restLines

  // Detect breaking from headline (conventional commit `!` suffix)
  const headlineParsed = headline
    ? parseConventionalHeadline(headline)
    : null
  const breaking = bodyBreaking || (headlineParsed?.breaking ?? false)

  return {
    headline,
    detailLines,
    ...(prNumber !== undefined ? { prNumber } : {}),
    ...(commitRef !== undefined ? { commitRef } : {}),
    users,
    breaking,
  }
}

async function resolveLinks(
  repo: string,
  parsed: ParsedSummary,
  changesetCommit: string | undefined,
): Promise<GitHubLinks> {
  if (parsed.prNumber !== undefined) {
    const info = await getOptionalInfoFromPullRequest({
      repo,
      pull: parsed.prNumber,
    })
    const links = info?.links ?? emptyLinks()

    if (parsed.commitRef) {
      links.commit = formatCommitLink(repo, parsed.commitRef)
    }

    return links
  }

  const commitToUse = parsed.commitRef ?? changesetCommit
  if (commitToUse) {
    const info = await getOptionalInfo({
      repo,
      commit: commitToUse,
    })

    return info?.links ?? {
      ...emptyLinks(),
      commit: formatCommitLink(repo, commitToUse),
    }
  }

  return emptyLinks()
}

function buildUserMentions(
  users: string[],
  fallbackUser: string | null,
): string {
  if (users.length > 0) {
    return normalizeUserMentions(users)
  }

  if (fallbackUser) {
    const match = fallbackUser.match(FALLBACK_USER_RE)
    const matchedUser = match?.[1]
    return matchedUser ? normalizeUserMentions([matchedUser]) : ''
  }

  return ''
}

function indentMarkdownBlock(lines: string[], spaces: number): string {
  const prefix = ' '.repeat(spaces)
  return lines
    .map((line) => {
      if (line.trim().length === 0) {
        return ''
      }
      return `${prefix}${line}`
    })
    .join('\n')
}

function formatDetailBlock(detailLines: string[]): string {
  const trimmed = detailLines
    .join('\n')
    .trim()
    .split('\n')
    .map(line => line.trimEnd())

  const hasFence = trimmed.some(line => CODE_FENCE_RE.test(line))
  const isListLike = trimmed.some(line => LIST_LIKE_RE.test(line))

  if (trimmed.length === 0) {
    return ''
  }

  if (hasFence || isListLike) {
    return indentMarkdownBlock(trimmed, 2)
  }

  const paragraphs = trimmed
    .join('\n')
    .split(PARAGRAPH_BREAK_RE)
    .filter(chunk => chunk.trim().length > 0)

  const lines = paragraphs.flatMap(chunk =>
    chunk
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean),
  )

  return lines.map(text => `  - ${text}`).join('\n')
}

const changelogFunctions: ChangelogFunctions = {
  async getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    assertRepo(options)
    const repo = options.repo

    if (dependenciesUpdated.length === 0) {
      return ''
    }

    const references = await collectDependencyReferences(
      changesets,
      repo,
    )

    return formatDependencyLine(references, dependenciesUpdated)
  },

  async getReleaseLine(changeset, type, options) {
    assertRepo(options)
    const repo = options.repo

    const parsedSummary = parseSummary(changeset.summary)
    const resolvedType = resolveReleaseType(type)

    const links = await resolveLinks(
      repo,
      parsedSummary,
      changeset.commit,
    )

    const userMentions = buildUserMentions(
      parsedSummary.users,
      links.user,
    )

    const { text: headlineText, breaking: headlineBreaking } = parsedSummary.headline
      ? formatHeadline(parsedSummary.headline)
      : { text: 'Miscellaneous improvements', breaking: false }

    const isBreaking = parsedSummary.breaking || headlineBreaking
    const breakingPrefix = isBreaking ? '⚠️ ' : ''

    // Build main line components
    const icon = isBreaking
      ? '💥'
      : releaseTypeMap[resolvedType].icon

    const mainLineParts: string[] = [
      `- ${icon}`,
      `${breakingPrefix}**${headlineText}**`,
    ]

    // Add PR link or commit link (PR preferred)
    if (links.pull) {
      mainLineParts.push(links.pull)
    }
    else if (links.commit) {
      mainLineParts.push(links.commit)
    }

    // If a commit override is explicitly provided, show it even when PR exists.
    if (links.pull && parsedSummary.commitRef && links.commit) {
      mainLineParts.push(links.commit)
    }

    // Add author info
    if (userMentions) {
      mainLineParts.push(`by ${userMentions}`)
    }

    const mainLine = mainLineParts.join(' ')

    // Build detail lines (if any)
    const detailBlock = formatDetailBlock(parsedSummary.detailLines)

    return detailBlock.length > 0
      ? `\n\n${mainLine}\n${detailBlock}`
      : `\n\n${mainLine}`
  },
}

export default changelogFunctions
export { formatHeadline, parseConventionalHeadline }
export const { getDependencyReleaseLine, getReleaseLine } = changelogFunctions
