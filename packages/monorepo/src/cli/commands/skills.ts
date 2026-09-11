import type { Command } from '@icebreakers/monorepo-templates'
import type { SkillTarget } from '../../commands'
import { logger } from '../../core/logger'
import { localize } from '../../i18n'

const skillTargets = ['codex', 'claude', 'cursor', 'agents', 'grok'] as const satisfies readonly SkillTarget[]

interface SkillsSyncCommandOptions {
  codex?: boolean
  claude?: boolean
  cursor?: boolean
  agents?: boolean
  grok?: boolean
  all?: boolean
}

export function registerSkillsCommands(program: Command, cwd: string) {
  const skillsCommand = program.command('skills').alias('sk').description(localize('AI skill commands', '技能工具集'))

  skillsCommand.command('sync')
    .description(localize('Synchronize the repoctl skill to global agent directories', '同步 resources/skills/repoctl 到全局目录'))
    .alias('s')
    .option('--codex', localize('Synchronize to ~/.codex/skills', '同步到 ~/.codex/skills'))
    .option('--claude', localize('Synchronize to ~/.claude/skills', '同步到 ~/.claude/skills'))
    .option('--cursor', localize('Synchronize to ~/.cursor/skills', '同步到 ~/.cursor/skills'))
    .option('--agents', localize('Synchronize to ~/.agents/skills', '同步到 ~/.agents/skills'))
    .option('--grok', localize('Synchronize to ~/.grok/skills', '同步到 ~/.grok/skills'))
    .option('--all', localize('Synchronize every target', '同步全部目标'))
    .action(async (opts: SkillsSyncCommandOptions) => {
      const { syncSkills } = await import('@/commands')
      const selected = new Set<SkillTarget>()
      if (opts.all) {
        for (const target of skillTargets) {
          selected.add(target)
        }
      }
      else {
        if (opts.codex) {
          selected.add('codex')
        }
        if (opts.claude) {
          selected.add('claude')
        }
        if (opts.cursor) {
          selected.add('cursor')
        }
        if (opts.agents) {
          selected.add('agents')
        }
        if (opts.grok) {
          selected.add('grok')
        }
      }

      const options = selected.size
        ? { cwd, targets: [...selected] }
        : { cwd }
      const results = await syncSkills(options)
      if (!results.length) {
        logger.info(localize('No target selected; synchronization skipped.', '未选择任何目标，已跳过同步。'))
        return
      }
      logger.info(`${localize('[synchronized targets]', '[已同步的目标]')}:\n${results.map(item => `- ${item.target}: ${item.dest}`).join('\n')}\n`)
      logger.success(localize('Skill synchronization finished.', 'Skill 同步完成。'))
    })
}
