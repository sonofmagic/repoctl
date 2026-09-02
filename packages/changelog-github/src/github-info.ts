import {
  getCommitInfo,
  getPullRequestInfo,
} from '@changesets/get-github-info'

export interface GitHubInfo {
  commit?: string | null
  pull?: number | null
  user?: string | null
  links: {
    commit: string | null
    pull: string | null
    user: string | null
  }
}

export async function getInfo(
  options: Parameters<typeof getCommitInfo>[0],
): Promise<GitHubInfo | undefined> {
  const info = await getCommitInfo(options)
  if (!info) {
    return undefined
  }

  return {
    commit: info.commit.sha,
    pull: info.pull?.number ?? null,
    user: info.author?.login ?? null,
    links: {
      commit: info.commit.markdownLink,
      pull: info.pull?.markdownLink ?? null,
      user: info.author?.markdownLink ?? null,
    },
  }
}

export async function getInfoFromPullRequest(
  options: Parameters<typeof getPullRequestInfo>[0],
): Promise<GitHubInfo | undefined> {
  const info = await getPullRequestInfo(options)
  if (!info) {
    return undefined
  }

  return {
    commit: info.commit?.sha ?? null,
    pull: info.pull.number,
    user: info.author?.login ?? null,
    links: {
      commit: info.commit?.markdownLink ?? null,
      pull: info.pull.markdownLink,
      user: info.author?.markdownLink ?? null,
    },
  }
}
