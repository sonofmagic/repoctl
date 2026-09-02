export type TailwindMajorVersion = 3 | 4
export type TailwindResolutionMode = TailwindMajorVersion | 'heuristic'

export interface TailwindRuntimeContextV3 {
  candidateRuleContext: object
  generateRules: (candidates: Set<string>, context: object) => unknown[]
  resolvedConfig: Record<string, unknown>
}

export interface TailwindV4DesignSystem {
  candidatesToCss: (classes: string[]) => Array<string | null>
  resolveThemeValue: (path: string) => unknown
}

export interface TailwindV4ModuleLoaderResult {
  base: string
  module: unknown
}

export interface TailwindV4ModuleShape {
  __unstable__loadDesignSystem?: (
    css: string,
    options: {
      base: string
      loadModule: (
        id: string,
        base: string,
      ) => Promise<TailwindV4ModuleLoaderResult>
      loadStylesheet: (
        id: string,
        base: string,
      ) => Promise<{ base: string, content: string }>
    },
  ) => Promise<TailwindV4DesignSystem>
  default?: TailwindV4ModuleShape
}
