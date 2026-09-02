import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getInfo } from '@/github-info'
import { getDependencyReleaseLine, getReleaseLine } from '@/index'

vi.mock('@/github-info', () => ({
  getInfo: vi.fn(),
  getInfoFromPullRequest: vi.fn(),
}))

const getInfoMock = vi.mocked(getInfo)

const repo = 'sonofmagic/dev-configs'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('release detail formatting', () => {
  it('keeps list detail lines indented', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit:
          '[`abc1234`](https://github.com/sonofmagic/dev-configs/commit/abc1234)',
        pull: null,
        user: null,
      },
    })

    const result = await getReleaseLine(
      {
        id: 'list-case',
        summary: 'Add feature\n- item one\n- item two',
        releases: [],
        commit: 'abc1234',
      },
      'minor',
      { repo },
    )

    expect(result).toContain('**Add feature**')
    expect(result).toContain('  - item one')
    expect(result).toContain('  - item two')
  })

  it('formats paragraph detail blocks into list items', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit:
          '[`def5678`](https://github.com/sonofmagic/dev-configs/commit/def5678)',
        pull: null,
        user: null,
      },
    })

    const result = await getReleaseLine(
      {
        id: 'paragraph-case',
        summary: [
          'Refactor pipeline',
          'This improves performance.',
          '',
          'More details here.',
        ].join('\n'),
        releases: [],
        commit: 'def5678',
      },
      'patch',
      { repo },
    )

    expect(result).toContain('**Refactor pipeline**')
    expect(result).toContain('  - This improves performance.')
    expect(result).toContain('  - More details here.')
  })

  it('indents fenced code blocks', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit:
          '[`fedcba9`](https://github.com/sonofmagic/dev-configs/commit/fedcba9)',
        pull: null,
        user: null,
      },
    })

    const result = await getReleaseLine(
      {
        id: 'code-case',
        summary: [
          'Add example',
          '```js',
          'console.log(1)',
          '```',
        ].join('\n'),
        releases: [],
        commit: 'fedcba9',
      },
      'patch',
      { repo },
    )

    expect(result).toContain('  ```js')
    expect(result).toContain('  console.log(1)')
  })

  it('formats dependency lines for large updates', async () => {
    getInfoMock.mockResolvedValueOnce({
      user: null,
      pull: null,
      links: {
        commit:
          '[`aa11bb2`](https://github.com/sonofmagic/dev-configs/commit/aa11bb2)',
        pull: null,
        user: null,
      },
    })

    const line = await getDependencyReleaseLine(
      [
        {
          id: 'deps-case',
          summary: 'Update deps',
          releases: [],
          commit: 'aa11bb2',
        },
      ],
      [
        { name: 'a', newVersion: '1.0.0' },
        { name: 'b', newVersion: '2.0.0' },
        { name: 'c', newVersion: '3.0.0' },
        { name: 'd', newVersion: '4.0.0' },
      ] as any,
      { repo },
    )

    expect(line).toContain('Updated 4 dependencies')
    expect(line).toContain('aa11bb2')
    expect(line).toContain('<details>')
    expect(line).toContain('`a@1.0.0`')
    expect(line).toContain('`d@4.0.0`')
  })
})
