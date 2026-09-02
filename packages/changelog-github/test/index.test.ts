import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getInfo,
  getInfoFromPullRequest,
} from '@/github-info'
import {
  formatHeadline,
  getDependencyReleaseLine,
  getReleaseLine,
  parseConventionalHeadline,
} from '@/index'

vi.mock('@/github-info', () => ({
  getInfo: vi.fn(),
  getInfoFromPullRequest: vi.fn(),
}))

const getInfoMock = vi.mocked(getInfo)
const getInfoFromPullRequestMock = vi.mocked(getInfoFromPullRequest)

const repo = 'sonofmagic/dev-configs'
const MISSING_REPO_ERROR_RE = /Please provide a repo/

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getReleaseLine', () => {
  const baseChangeset = {
    id: 'abc',
    summary:
      'Add new lint rule\n- ensure coverage for edge cases\nPR: #123\nCommit: abcdef1234567890\nAuthor: lint-bot',
    releases: [],
  }

  it('throws when repo option is missing', async () => {
    await expect(
      getReleaseLine(
        { ...baseChangeset },
        'minor',
        undefined as unknown as Record<string, any>,
      ),
    ).rejects.toThrow(MISSING_REPO_ERROR_RE)
  })

  it('formats summary with metadata inline', async () => {
    getInfoFromPullRequestMock.mockResolvedValueOnce({
      user: null,
      commit: null,
      links: {
        pull: '[#123](https://github.com/sonofmagic/dev-configs/pull/123)',
        commit:
          '[`a1b2c3d`](https://github.com/sonofmagic/dev-configs/commit/a1b2c3d)',
        user: '[@core-dev](https://github.com/core-dev)',
      },
    })

    const result = await getReleaseLine(
      { ...baseChangeset },
      'minor',
      { repo },
    )

    expect(result).toContain('- ✨ **Add new lint rule** [#123](https://github.com/sonofmagic/dev-configs/pull/123) [`abcdef1`](https://github.com/sonofmagic/dev-configs/commit/abcdef1234567890) by @lint-bot')
    expect(result).toContain('  - ensure coverage for edge cases')
    expect(getInfoFromPullRequestMock).toHaveBeenCalledWith({
      repo,
      pull: 123,
    })
    expect(getInfoMock).not.toHaveBeenCalled()
  })

  it('falls back to explicit commit metadata when GitHub pull request lookup fails', async () => {
    getInfoFromPullRequestMock.mockRejectedValueOnce(
      new Error('Failed to parse data from GitHub\nPremature close'),
    )

    const result = await getReleaseLine(
      { ...baseChangeset },
      'minor',
      { repo },
    )

    expect(result).toContain('**Add new lint rule** [`abcdef1`](https://github.com/sonofmagic/dev-configs/commit/abcdef1234567890) by @lint-bot')
    expect(result).not.toContain('[#123]')
  })

  it('rethrows non-GitHub metadata errors', async () => {
    getInfoFromPullRequestMock.mockRejectedValueOnce(
      new Error('Unexpected formatter failure'),
    )

    await expect(
      getReleaseLine(
        { ...baseChangeset },
        'minor',
        { repo },
      ),
    ).rejects.toThrow('Unexpected formatter failure')
  })
})

describe('getDependencyReleaseLine', () => {
  const dependenciesUpdated = [
    {
      name: '@icebreakers/eslint-config',
      newVersion: '1.2.3',
    },
    {
      name: 'vitest',
      newVersion: '1.0.0',
    },
  ]

  it('returns empty string when no dependencies updated', async () => {
    const result = await getDependencyReleaseLine([], [], { repo })
    expect(result).toBe('')
  })

  it('lists updated dependencies with commit references', async () => {
    getInfoMock.mockResolvedValue({
      user: null,
      pull: null,
      links: {
        commit:
          '[`abcdef1`](https://github.com/sonofmagic/dev-configs/commit/abcdef1234567890)',
        pull: null,
        user: null,
      },
    })

    const line = await getDependencyReleaseLine(
      [
        {
          id: 'test',
          summary: 'Update deps',
          releases: [],
          commit: 'abcdef1234567890',
        },
      ],
      dependenciesUpdated as any,
      { repo },
    )

    expect(line).toContain('- 📦 **Dependencies** [`abcdef1`](https://github.com/sonofmagic/dev-configs/commit/abcdef1234567890)')
    expect(line).toContain('  → `@icebreakers/eslint-config@1.2.3`, `vitest@1.0.0`')
    expect(getInfoMock).toHaveBeenCalledWith({
      repo,
      commit: 'abcdef1234567890',
    })
  })

  it('keeps dependency commit references when GitHub commit lookup fails', async () => {
    getInfoMock.mockRejectedValueOnce(
      new Error('Failed to parse data from GitHub\nPremature close'),
    )

    const line = await getDependencyReleaseLine(
      [
        {
          id: 'test',
          summary: 'Update deps',
          releases: [],
          commit: 'abcdef1234567890',
        },
      ],
      dependenciesUpdated as any,
      { repo },
    )

    expect(line).toContain('- 📦 **Dependencies** [`abcdef1`](https://github.com/sonofmagic/dev-configs/commit/abcdef1234567890)')
    expect(line).toContain('  → `@icebreakers/eslint-config@1.2.3`, `vitest@1.0.0`')
  })
})

describe('parseConventionalHeadline', () => {
  it('parses type, scope, and description', () => {
    const result = parseConventionalHeadline('feat(core): add new feature')
    expect(result).toEqual({
      type: 'feat',
      scope: 'core',
      breaking: false,
      description: 'add new feature',
    })
  })

  it('parses without scope', () => {
    const result = parseConventionalHeadline('fix: resolve crash')
    expect(result).toEqual({
      type: 'fix',
      scope: undefined,
      breaking: false,
      description: 'resolve crash',
    })
  })

  it('detects breaking change marker', () => {
    const result = parseConventionalHeadline('feat(api)!: remove deprecated endpoint')
    expect(result).toEqual({
      type: 'feat',
      scope: 'api',
      breaking: true,
      description: 'remove deprecated endpoint',
    })
  })

  it('returns raw description for non-conventional format', () => {
    const result = parseConventionalHeadline('Just a plain headline')
    expect(result).toEqual({
      breaking: false,
      description: 'Just a plain headline',
    })
  })
})

describe('formatHeadline', () => {
  it('formats conventional commit with scope', () => {
    const result = formatHeadline('feat(eslint): add new rule')
    expect(result).toEqual({
      text: 'eslint: add new rule',
      breaking: false,
    })
  })

  it('formats conventional commit without scope', () => {
    const result = formatHeadline('chore: upgrade dependencies')
    expect(result).toEqual({
      text: 'upgrade dependencies',
      breaking: false,
    })
  })

  it('passes through non-conventional headline', () => {
    const result = formatHeadline('Add new feature')
    expect(result).toEqual({
      text: 'Add new feature',
      breaking: false,
    })
  })

  it('detects breaking from bang suffix', () => {
    const result = formatHeadline('feat!: drop Node 16 support')
    expect(result).toEqual({
      text: 'drop Node 16 support',
      breaking: true,
    })
  })
})

describe('getReleaseLine - conventional commit headlines', () => {
  it('strips conventional prefix and keeps scope', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit: '[`abc1234`](https://github.com/sonofmagic/dev-configs/commit/abc1234)',
        pull: null,
        user: '[@dev](https://github.com/dev)',
      },
    })

    const result = await getReleaseLine(
      {
        id: 'conv',
        summary: 'feat(eslint): add strict mode preset',
        releases: [],
        commit: 'abc1234',
      },
      'minor',
      { repo },
    )

    expect(result).toContain('**eslint: add strict mode preset**')
    expect(result).not.toContain('feat(eslint)')
  })

  it('shows breaking change icon for bang suffix', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit: '[`def5678`](https://github.com/sonofmagic/dev-configs/commit/def5678)',
        pull: null,
        user: null,
      },
    })

    const result = await getReleaseLine(
      {
        id: 'breaking-bang',
        summary: 'feat(api)!: remove legacy config format',
        releases: [],
        commit: 'def5678',
      },
      'major',
      { repo },
    )

    expect(result).toContain('💥')
    expect(result).toContain('⚠️')
    expect(result).not.toContain('🚀')
  })

  it('shows breaking change icon for BREAKING CHANGE in body', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit: '[`aaa1111`](https://github.com/sonofmagic/dev-configs/commit/aaa1111)',
        pull: null,
        user: null,
      },
    })

    const result = await getReleaseLine(
      {
        id: 'breaking-body',
        summary: 'Migrate to flat config\nBREAKING CHANGE: drop eslintrc support',
        releases: [],
        commit: 'aaa1111',
      },
      'major',
      { repo },
    )

    expect(result).toContain('💥')
    expect(result).toContain('⚠️')
  })
})
