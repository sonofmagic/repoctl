export interface BetterStylelintConfig {
  [key: string]: unknown
}

export interface BetterStylelintOptions {
  cwd?: string
  config?: BetterStylelintConfig
  configOptions?: BetterStylelintConfig
  configLoader?: string
}

export interface BetterStylelintMessage {
  ruleId: string
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  severity: 1 | 2
  fatal?: true
}

export interface BetterStylelintProcessor {
  meta?: {
    name?: string
    version?: string
  }
  preprocess: (text: string, filename: string) => string[]
  postprocess: (messages: unknown[][], filename: string) => BetterStylelintMessage[]
  supportsAutofix?: boolean
}

export type BetterStylelintRuleOptions = BetterStylelintOptions
