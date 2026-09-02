import type { ParserPreset } from '@commitlint/types'

import { DEFAULT_PARSER_PRESET } from './constants'

async function loadConventionalParserOpts() {
  const { default: createConventionalPreset } = await import(
    'conventional-changelog-conventionalcommits',
  )
  const preset = await createConventionalPreset()

  return preset.parser
}

const conventionalParserOpts = loadConventionalParserOpts()

export function createConventionalParserPreset(): ParserPreset {
  return {
    name: DEFAULT_PARSER_PRESET,
    parserOpts: conventionalParserOpts,
  }
}
