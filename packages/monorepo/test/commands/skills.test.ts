import { afterEach, describe, expect, it, vi } from 'vitest'

const skillSourcePathPattern = /resources[\\/]skills[\\/]repoctl$/

afterEach(async () => {
  await vi.resetModules()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('skills sync command', () => {
  it('throws when source skills directory is missing', async () => {
    const pathExistsMock = vi.fn(async () => false)
    const removeMock = vi.fn(async () => {})
    const ensureDirMock = vi.fn(async () => {})
    const copyMock = vi.fn(async () => {})
    const checkboxMock = vi.fn(async () => [])

    vi.doMock('@/utils/fs', async () => {
      const actual = await vi.importActual<typeof import('@/utils/fs')>('@/utils/fs')
      return {
        ...actual,
        default: {
          ...actual.default,
          pathExists: pathExistsMock,
          remove: removeMock,
          ensureDir: ensureDirMock,
          copy: copyMock,
        },
        pathExists: pathExistsMock,
        remove: removeMock,
        ensureDir: ensureDirMock,
        copy: copyMock,
      }
    })
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    vi.doMock('node:os', () => ({
      __esModule: true,
      default: { homedir: () => '/home' },
      homedir: () => '/home',
    }))

    const { syncSkills } = await import('@/commands/skills')

    await expect(syncSkills({ cwd: '/repo' })).rejects.toThrow('Skill directory not found')
    expect(pathExistsMock).toHaveBeenCalledWith(expect.stringMatching(skillSourcePathPattern))
    expect(checkboxMock).not.toHaveBeenCalled()
    expect(removeMock).not.toHaveBeenCalled()
    expect(copyMock).not.toHaveBeenCalled()
  })

  it('syncs to explicit targets without prompting', async () => {
    const pathExistsMock = vi.fn(async () => true)
    const removeMock = vi.fn(async () => {})
    const ensureDirMock = vi.fn(async () => {})
    const copyMock = vi.fn(async () => {})
    const checkboxMock = vi.fn(async () => [])

    vi.doMock('@/utils/fs', async () => {
      const actual = await vi.importActual<typeof import('@/utils/fs')>('@/utils/fs')
      return {
        ...actual,
        default: {
          ...actual.default,
          pathExists: pathExistsMock,
          remove: removeMock,
          ensureDir: ensureDirMock,
          copy: copyMock,
        },
        pathExists: pathExistsMock,
        remove: removeMock,
        ensureDir: ensureDirMock,
        copy: copyMock,
      }
    })
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    vi.doMock('node:os', () => ({
      __esModule: true,
      default: { homedir: () => '/home' },
      homedir: () => '/home',
    }))

    const { syncSkills } = await import('@/commands/skills')
    const results = await syncSkills({ cwd: '/repo', targets: ['codex', 'claude'] })

    expect(checkboxMock).not.toHaveBeenCalled()
    expect(removeMock).toHaveBeenCalledWith('/home/.codex/skills/icebreakers-monorepo-cli')
    expect(removeMock).toHaveBeenCalledWith('/home/.claude/skills/icebreakers-monorepo-cli')
    expect(removeMock).toHaveBeenCalledWith('/home/.codex/skills/repoctl')
    expect(removeMock).toHaveBeenCalledWith('/home/.claude/skills/repoctl')
    expect(ensureDirMock).toHaveBeenCalledWith('/home/.codex/skills')
    expect(ensureDirMock).toHaveBeenCalledWith('/home/.claude/skills')
    expect(copyMock).toHaveBeenCalledWith(expect.stringMatching(skillSourcePathPattern), '/home/.codex/skills/repoctl')
    expect(copyMock).toHaveBeenCalledWith(expect.stringMatching(skillSourcePathPattern), '/home/.claude/skills/repoctl')
    expect(results).toEqual([
      { target: 'codex', dest: '/home/.codex/skills/repoctl' },
      { target: 'claude', dest: '/home/.claude/skills/repoctl' },
    ])
  })

  it('prompts for targets when none provided', async () => {
    const pathExistsMock = vi.fn(async () => true)
    const removeMock = vi.fn(async () => {})
    const ensureDirMock = vi.fn(async () => {})
    const copyMock = vi.fn(async () => {})
    interface CheckboxChoice {
      name: string
      value: string
      checked?: boolean
    }
    interface CheckboxOptions {
      message: string
      choices: CheckboxChoice[]
    }
    const checkboxMock = vi.fn(async (_options: CheckboxOptions) => ['claude'])

    vi.doMock('@/utils/fs', async () => {
      const actual = await vi.importActual<typeof import('@/utils/fs')>('@/utils/fs')
      return {
        ...actual,
        default: {
          ...actual.default,
          pathExists: pathExistsMock,
          remove: removeMock,
          ensureDir: ensureDirMock,
          copy: copyMock,
        },
        pathExists: pathExistsMock,
        remove: removeMock,
        ensureDir: ensureDirMock,
        copy: copyMock,
      }
    })
    vi.doMock('@icebreakers/monorepo-templates', async () => {
      const actual = await vi.importActual<typeof import('@icebreakers/monorepo-templates')>('@icebreakers/monorepo-templates')
      return {
        ...actual,
        checkbox: checkboxMock,
      }
    })
    vi.doMock('node:os', () => ({
      __esModule: true,
      default: { homedir: () => '/home' },
      homedir: () => '/home',
    }))

    const { syncSkills } = await import('@/commands/skills')
    const results = await syncSkills({ cwd: '/repo' })

    expect(checkboxMock).toHaveBeenCalledTimes(1)
    const promptOptions = checkboxMock.mock.calls[0]?.[0]
    expect(promptOptions).toEqual({
      message: 'Select skill synchronization targets',
      choices: [
        { name: 'codex', value: 'codex', checked: true },
        { name: 'claude', value: 'claude', checked: true },
        { name: 'cursor', value: 'cursor', checked: true },
        { name: 'agents', value: 'agents', checked: true },
        { name: 'grok', value: 'grok', checked: true },
      ],
    })
    expect(copyMock).toHaveBeenCalledTimes(1)
    expect(copyMock).toHaveBeenCalledWith(expect.stringMatching(skillSourcePathPattern), '/home/.claude/skills/repoctl')
    expect(results).toEqual([
      { target: 'claude', dest: '/home/.claude/skills/repoctl' },
    ])
  })
})
