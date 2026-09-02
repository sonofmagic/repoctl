import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import { collectUtilitySelectors } from 'postcss-tailwindcss'
import stylelintModule from 'stylelint'
import { NO_ATOMIC_CLASS_RULE_NAME } from './constants'
import { createMessages } from './messages'
import { isTailwindUtilityClass } from './runtime'

type RuleResult = stylelint.PostcssResult
type UtilityClassDetector = (className: string, fromFile?: string) => Promise<boolean>

const reportedSelectors = new WeakMap<object, Set<string>>()

const ESCAPED_BACKSLASH_RE = /\\\\/g
const ESCAPED_CHAR_RE = /\\([^0-9a-f\r\n])/gi

function unescapeCssIdentifier(value: string): string {
  return value
    .replace(ESCAPED_BACKSLASH_RE, '\\')
    .replace(ESCAPED_CHAR_RE, '$1')
}

function isSimpleClassSelector(selector: string, className: string): boolean {
  const trimmed = selector.trim()
  if (!trimmed.startsWith('.')) {
    return false
  }

  let cursor = 1
  let rawClassName = ''
  while (cursor < trimmed.length) {
    const char = trimmed[cursor]
    if (char === undefined) {
      return false
    }

    if (char === '\\') {
      rawClassName += char
      cursor += 1
      const escapedChar = trimmed[cursor]
      if (escapedChar !== undefined) {
        rawClassName += escapedChar
        cursor += 1
      }
      continue
    }

    if (/[\s>+~#[.:]/.test(char)) {
      return false
    }

    rawClassName += char
    cursor += 1
  }

  return rawClassName.length > 0 && unescapeCssIdentifier(rawClassName) === className
}

function createReportKey(entry: {
  className: string
  rule: { source?: { start?: { column?: number, line?: number } } }
}): string {
  const start = entry.rule.source?.start
  return `${start?.line ?? 0}:${start?.column ?? 0}:${entry.className}`
}

function shouldReport(result: RuleResult, key: string): boolean {
  const reported = reportedSelectors.get(result as object) ?? new Set<string>()
  if (reported.has(key)) {
    return false
  }

  reported.add(key)
  reportedSelectors.set(result as object, reported)
  return true
}

export function createRuleFunction(
  ruleName: string,
  isUtilityClass: UtilityClassDetector = isTailwindUtilityClass,
) {
  const ruleMessages = createMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      const filePath = root.source?.input.file
      const classEntries = collectUtilitySelectors(root as unknown as PostcssRoot)
        .filter(entry => isSimpleClassSelector(entry.selector, entry.className))
        .map((entry) => {
          const selectorIndex = entry.selector.indexOf(`.${entry.className}`)

          return {
            className: entry.className,
            endIndex: selectorIndex === -1
              ? undefined
              : selectorIndex + entry.className.length + 1,
            index: selectorIndex === -1 ? undefined : selectorIndex,
            rule: entry.rule,
          }
        })

      for (const entry of classEntries) {
        if (!await isUtilityClass(entry.className, filePath)) {
          continue
        }

        if (!shouldReport(result, createReportKey(entry))) {
          continue
        }

        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(entry.className),
          node: entry.rule as never,
          ...(entry.index !== undefined ? { index: entry.index } : {}),
          ...(entry.endIndex !== undefined ? { endIndex: entry.endIndex } : {}),
        })
      }
    }
  }) as unknown as StylelintRule
}

export const ruleFunction = createRuleFunction(NO_ATOMIC_CLASS_RULE_NAME)
