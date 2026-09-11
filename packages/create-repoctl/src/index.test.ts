import { describe, expect, it } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import { en } from './i18n/locales/en'
import { zhCN } from './i18n/locales/zh-CN'
import { createCreateRepoctlProgram, resolveCreateRepoctlLocale } from './index'

describe('create-repoctl package metadata', () => {
  it('keeps English and Chinese catalog keys aligned', () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort())
  })

  it('exposes create-repoctl so npm create, yarn create, and pnpm create can bootstrap repoctl projects', () => {
    expect(packageJson.name).toBe('create-repoctl')
    expect(packageJson.bin).toEqual({
      'create-repoctl': 'bin/create-repoctl.js',
    })
    expect(packageJson.dependencies).toEqual({
      '@icebreakers/monorepo-templates': 'workspace:*',
    })
  })

  it('uses English by default and supports explicit Simplified Chinese', () => {
    expect(resolveCreateRepoctlLocale([], {})).toBe('en')
    expect(resolveCreateRepoctlLocale(['node', 'create-repoctl', '--lang', 'zh-CN'], {})).toBe('zh-CN')
    expect(resolveCreateRepoctlLocale([], { REPOCTL_LANG: 'zh-CN' })).toBe('zh-CN')
    expect(resolveCreateRepoctlLocale(['node', 'create-repoctl', '--lang', 'en'], { REPOCTL_LANG: 'zh-CN' })).toBe('en')
    expect(resolveCreateRepoctlLocale([], { REPOCTL_LANG: 'fr' })).toBe('en')
  })

  it('renders help using the resolved locale and the requested command name', () => {
    const english = createCreateRepoctlProgram({ argv: [], env: {} }).helpInformation()
    const chinese = createCreateRepoctlProgram({
      commandName: 'create-icebreaker',
      argv: ['node', 'create-icebreaker', '--lang', 'zh-CN'],
      env: {},
    }).helpInformation()

    expect(english).toContain('Create a repoctl-managed')
    expect(english).toContain('--yes')
    expect(english).toContain('Skip prompts')
    expect(chinese).toContain('--yes')
    expect(chinese).toContain('跳过交互')
    expect(chinese).toContain('create-icebreaker')
    expect(chinese).toContain('用法： create-icebreaker')
    expect(chinese).toContain('参数：')
    expect(chinese).toContain('选项：')
    expect(chinese).toContain('默认值：')
    expect(chinese).toContain('显示命令帮助')
    expect(chinese).toContain('创建由 repoctl 管理')
  })

  it('rejects an unsupported explicit locale', async () => {
    const program = createCreateRepoctlProgram({
      argv: ['node', 'create-repoctl', '--lang', 'fr'],
      env: {},
    })
    program.exitOverride()
    await expect(program.parseAsync(['node', 'create-repoctl', '--lang', 'fr'])).rejects.toThrow('Unsupported locale: fr')
  })

  it('localizes Commander errors in Simplified Chinese', async () => {
    const program = createCreateRepoctlProgram({
      argv: ['node', 'create-repoctl', '--lang', 'zh-CN'],
      env: {},
    })
    let errorOutput = ''
    program.exitOverride()
    program.configureOutput({
      writeErr: (value) => {
        errorOutput += value
      },
    })

    await expect(program.parseAsync(['node', 'create-repoctl', '--unknown'])).rejects.toThrow()
    expect(errorOutput).toContain('错误： 未知选项 \'--unknown\'')
  })
})
