import type { ThemeCall } from './types'
import {
  ESCAPED_BACKSLASH_RE,
  ESCAPED_CHAR_RE,
  IMPORT_TARGET_RE,
  SELECTOR_BREAK_RE,
  WHITESPACE_RE,
} from './constants'

export function unescapeCssIdentifier(value: string): string {
  return value
    .replace(ESCAPED_BACKSLASH_RE, '\\')
    .replace(ESCAPED_CHAR_RE, '$1')
}

export function stripImportTargetQuotes(value: string): string {
  return value.replace(IMPORT_TARGET_RE, '')
}

export function splitCandidateList(input: string): string[] {
  const candidates: string[] = []
  let current = ''
  let bracketDepth = 0
  let parenDepth = 0
  let quote: '"' | '\'' | null = null
  let escaped = false

  for (const char of input) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\') {
      current += char
      escaped = true
      continue
    }

    if (quote) {
      current += char
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === '\'') {
      current += char
      quote = char
      continue
    }

    if (char === '[') {
      bracketDepth += 1
      current += char
      continue
    }

    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1)
      current += char
      continue
    }

    if (char === '(') {
      parenDepth += 1
      current += char
      continue
    }

    if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1)
      current += char
      continue
    }

    if (WHITESPACE_RE.test(char) && bracketDepth === 0 && parenDepth === 0) {
      const value = current.trim()
      if (value) {
        candidates.push(value)
      }
      current = ''
      continue
    }

    current += char
  }

  const last = current.trim()
  if (last) {
    candidates.push(last)
  }

  return candidates
}

export function parseThemeArgument(raw: string): Pick<ThemeCall, 'path' | 'opacity'> {
  let bracketDepth = 0
  let parenDepth = 0
  let slashIndex = -1

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i]
    if (char === '[') {
      bracketDepth += 1
    }
    else if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1)
    }
    else if (char === '(') {
      parenDepth += 1
    }
    else if (char === ')') {
      parenDepth = Math.max(0, parenDepth - 1)
    }
    else if (char === '/' && bracketDepth === 0 && parenDepth === 0) {
      slashIndex = i
      break
    }
  }

  if (slashIndex === -1) {
    return {
      path: raw.trim(),
      opacity: null,
    }
  }

  return {
    path: raw.slice(0, slashIndex).trim(),
    opacity: raw.slice(slashIndex + 1).trim() || null,
  }
}

export function collectClassNamesFromSelector(selector: string): string[] {
  const classNames: string[] = []

  for (let index = 0; index < selector.length; index += 1) {
    if (selector[index] !== '.') {
      continue
    }

    if (index > 0 && selector[index - 1] === '\\') {
      continue
    }

    let cursor = index + 1
    let rawClassName = ''

    while (cursor < selector.length) {
      const char = selector[cursor]
      if (!char) {
        break
      }

      if ((SELECTOR_BREAK_RE.test(char) || char === ':') && selector[cursor - 1] !== '\\') {
        break
      }

      rawClassName += char
      cursor += 1
    }

    if (rawClassName) {
      classNames.push(unescapeCssIdentifier(rawClassName))
    }

    index = cursor - 1
  }

  return classNames
}
