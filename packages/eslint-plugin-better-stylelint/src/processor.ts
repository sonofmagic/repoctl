import type {
  BetterStylelintMessage,
  BetterStylelintProcessor,
  BetterStylelintRuleOptions,
} from './types'
import { runStylelintSync } from './core'

const sourceCache = new Map<string, string>()

export function createStylelintProcessor(
  options: BetterStylelintRuleOptions = {},
): BetterStylelintProcessor {
  return {
    meta: {
      name: 'eslint-plugin-better-stylelint/processor',
      version: '0.0.1',
    },
    preprocess(text: string, filename: string) {
      sourceCache.set(filename, text)
      return ['/* eslint-plugin-better-stylelint */']
    },
    postprocess(_messages: unknown[][], filename: string): BetterStylelintMessage[] {
      const source = sourceCache.get(filename) ?? ''
      sourceCache.delete(filename)
      return runStylelintSync(source, filename, options)
    },
    supportsAutofix: false,
  }
}

export const cssProcessor = createStylelintProcessor()
export const scssProcessor = createStylelintProcessor()
