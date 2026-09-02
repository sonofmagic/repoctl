import { cssProcessor, scssProcessor } from './processor'
import { lintRule } from './rule'

interface BetterStylelintPlugin {
  meta: {
    name: string
    version: string
  }
  processors: {
    css: typeof cssProcessor
    scss: typeof scssProcessor
  }
  rules: {
    stylelint: typeof lintRule
  }
}

const plugin: BetterStylelintPlugin = {
  meta: {
    name: 'stylelint',
    version: '0.0.1',
  },
  processors: {
    css: cssProcessor,
    scss: scssProcessor,
  },
  rules: {
    stylelint: lintRule,
  },
}

export { runStylelintSync } from './core'
export { createStylelintProcessor, cssProcessor, scssProcessor } from './processor'
export { lintRule } from './rule'
export type {
  BetterStylelintConfig,
  BetterStylelintMessage,
  BetterStylelintOptions,
  BetterStylelintProcessor,
  BetterStylelintRuleOptions,
} from './types'

export default plugin
