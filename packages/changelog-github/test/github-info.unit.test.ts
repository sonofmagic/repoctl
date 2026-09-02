import {
  getCommitInfo,
  getPullRequestInfo,
} from '@changesets/get-github-info'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getInfo, getInfoFromPullRequest } from '@/github-info'

vi.mock('@changesets/get-github-info', () => ({
  getCommitInfo: vi.fn(),
  getPullRequestInfo: vi.fn(),
}))

const getCommitInfoMock = vi.mocked(getCommitInfo)
const getPullRequestInfoMock = vi.mocked(getPullRequestInfo)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GitHub info adapter', () => {
  it('normalizes commit information', async () => {
    getCommitInfoMock.mockResolvedValueOnce({
      commit: {
        sha: 'abcdef1234567890',
        url: 'https://github.com/owner/repo/commit/abcdef1234567890',
        markdownLink: '[`abcdef1`](https://github.com/owner/repo/commit/abcdef1234567890)',
      },
      author: {
        login: 'octocat',
        url: 'https://github.com/octocat',
        markdownLink: '[@octocat](https://github.com/octocat)',
      },
      pull: {
        number: 123,
        url: 'https://github.com/owner/repo/pull/123',
        markdownLink: '[#123](https://github.com/owner/repo/pull/123)',
      },
    })

    await expect(
      getInfo({ repo: 'owner/repo', commit: 'abcdef1234567890' }),
    ).resolves.toEqual({
      commit: 'abcdef1234567890',
      pull: 123,
      user: 'octocat',
      links: {
        commit: '[`abcdef1`](https://github.com/owner/repo/commit/abcdef1234567890)',
        pull: '[#123](https://github.com/owner/repo/pull/123)',
        user: '[@octocat](https://github.com/octocat)',
      },
    })
  })

  it('normalizes pull request information', async () => {
    getPullRequestInfoMock.mockResolvedValueOnce({
      pull: {
        number: 123,
        url: 'https://github.com/owner/repo/pull/123',
        markdownLink: '[#123](https://github.com/owner/repo/pull/123)',
      },
    })

    await expect(
      getInfoFromPullRequest({ repo: 'owner/repo', pull: 123 }),
    ).resolves.toEqual({
      commit: null,
      pull: 123,
      user: null,
      links: {
        commit: null,
        pull: '[#123](https://github.com/owner/repo/pull/123)',
        user: null,
      },
    })
  })

  it('preserves missing GitHub results', async () => {
    getCommitInfoMock.mockResolvedValueOnce(undefined)
    getPullRequestInfoMock.mockResolvedValueOnce(undefined)

    await expect(
      getInfo({ repo: 'owner/repo', commit: 'missing' }),
    ).resolves.toBeUndefined()
    await expect(
      getInfoFromPullRequest({ repo: 'owner/repo', pull: 404 }),
    ).resolves.toBeUndefined()
  })
})
