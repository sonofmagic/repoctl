import type { help as english } from '../en/help'

export const help = {
  argumentsTitle: '参数：',
  choicesLabel: '可选值：',
  commandsTitle: '命令：',
  defaultLabel: '默认值：',
  description: '创建由 repoctl 管理的 pnpm 与 Turborepo 工作区',
  envLabel: '环境变量：',
  targetArgument: '目标目录',
  templatesOption: '要包含的模板 key 或序号，以逗号分隔',
  forceOption: '创建前删除已存在的目标目录',
  yesOption: '跳过交互；直接使用目录参数和 --templates',
  globalOptionsTitle: '全局选项：',
  helpOption: '显示命令帮助',
  languageOption: '输出语言：en 或 zh-CN',
  optionsTitle: '选项：',
  presetLabel: '预设值：',
  usageTitle: '用法：',
} as const satisfies Record<keyof typeof english, string>
