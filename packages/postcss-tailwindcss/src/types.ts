import type { AtRule, Declaration, Node, Root, Rule } from 'postcss'

export type TailwindVersion = 3 | 4 | 'unknown'

export interface TailwindResolutionContext {
  cwd: string
  tsconfigPath?: string
}

export interface ResolvedTailwindRuntime {
  configPath: string | null
  cssEntryPath: string | null
  installationPath: string | null
  packageJsonPath: string | null
  version: string | null
}

export interface UtilityCandidate {
  candidate: string
  node: AtRule
  source?: Node['source']
}

export interface ThemeCall {
  raw: string
  path: string
  opacity: string | null
  node: Declaration | AtRule
  source?: Node['source']
}

export interface TailwindImportDirective {
  importTarget: string
  functions: Array<{
    name: string
    value: string
  }>
  hasLayerKeyword: boolean
  mediaQuery: string | null
  node: AtRule
  source?: Node['source']
}

export interface UtilitySelector {
  className: string
  rule: Rule
  selector: string
  source?: Node['source']
}

export interface TailwindAnalysis {
  version: TailwindVersion
  applyCandidates: UtilityCandidate[]
  themeCalls: ThemeCall[]
  importDirectives: TailwindImportDirective[]
  utilitySelectors: UtilitySelector[]
}

export type TailwindInput = Root | string
