import type { Root } from 'postcss'
import type { TailwindInput } from './types'
import postcss from 'postcss'

export function toRoot(input: TailwindInput): Root {
  return typeof input === 'string' ? postcss.parse(input) : input
}

export function parseTailwindCss(input: TailwindInput): Root {
  return toRoot(input)
}
