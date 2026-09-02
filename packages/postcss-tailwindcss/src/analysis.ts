import type { AtRule, Declaration, Root } from 'postcss'
import type {
  TailwindAnalysis,
  TailwindImportDirective,
  TailwindInput,
  TailwindVersion,
  ThemeCall,
  UtilityCandidate,
  UtilitySelector,
} from './types'
import valueParser from 'postcss-value-parser'
import { TAILWIND_IMPORT_FUNCTIONS, TAILWIND_V4_AT_RULES } from './constants'
import { toRoot } from './postcss'
import {
  collectClassNamesFromSelector,
  parseThemeArgument,
  splitCandidateList,
  stripImportTargetQuotes,
} from './syntax'

function hasTailwindV4Signals(root: Root): boolean {
  let found = false

  root.walkAtRules((atRule) => {
    if (TAILWIND_V4_AT_RULES.includes(atRule.name as typeof TAILWIND_V4_AT_RULES[number])) {
      found = true
      return false
    }

    if (atRule.name === 'import' && atRule.params.includes('tailwindcss')) {
      found = true
      return false
    }

    return undefined
  })

  if (found) {
    return true
  }

  root.walkDecls((decl) => {
    if (decl.value.includes('--alpha(') || decl.value.includes('--spacing(')) {
      found = true
      return false
    }
    return undefined
  })

  return found
}

function hasTailwindV3Signals(root: Root): boolean {
  let found = false

  root.walkAtRules((atRule) => {
    if (['tailwind', 'config'].includes(atRule.name)) {
      found = true
      return false
    }
    return undefined
  })

  if (found) {
    return true
  }

  root.walkDecls((decl) => {
    if (decl.value.includes('theme(')) {
      found = true
      return false
    }
    return undefined
  })

  return found
}

export function detectTailwindVersion(input: TailwindInput): TailwindVersion {
  const root = toRoot(input)
  const hasV4 = hasTailwindV4Signals(root)
  const hasV3 = hasTailwindV3Signals(root)

  if (hasV4) {
    return 4
  }

  if (hasV3) {
    return 3
  }

  return 'unknown'
}

export function collectApplyCandidates(input: TailwindInput): UtilityCandidate[] {
  const root = toRoot(input)
  const candidates: UtilityCandidate[] = []

  root.walkAtRules('apply', (atRule) => {
    for (const candidate of splitCandidateList(atRule.params)) {
      candidates.push({
        candidate,
        node: atRule,
        source: atRule.source,
      })
    }
  })

  return candidates
}

function collectThemeCallsFromNode(
  node: Declaration | AtRule,
  rawValue: string,
  calls: ThemeCall[],
): void {
  const parsed = valueParser(rawValue)

  parsed.walk((valueNode) => {
    if (valueNode.type !== 'function' || valueNode.value !== 'theme') {
      return
    }

    const raw = valueParser.stringify(valueNode.nodes).trim()
    const { path, opacity } = parseThemeArgument(raw)

    calls.push({
      raw,
      path,
      opacity,
      node,
      source: node.source,
    })
  })
}

export function collectThemeCalls(input: TailwindInput): ThemeCall[] {
  const root = toRoot(input)
  const calls: ThemeCall[] = []

  root.walkDecls((decl) => {
    collectThemeCallsFromNode(decl, decl.value, calls)
  })

  root.walkAtRules((atRule) => {
    if (atRule.params.includes('theme(')) {
      collectThemeCallsFromNode(atRule, atRule.params, calls)
    }
  })

  return calls
}

export function collectImportDirectives(input: TailwindInput): TailwindImportDirective[] {
  const root = toRoot(input)
  const directives: TailwindImportDirective[] = []

  root.walkAtRules('import', (atRule) => {
    if (!atRule.params.includes('tailwindcss')) {
      return
    }

    const parsed = valueParser(atRule.params)
    let importTarget = ''
    const functions: TailwindImportDirective['functions'] = []
    let hasLayerKeyword = false
    let mediaQuery: string | null = null
    let sawImportTarget = false
    let mediaStartIndex = -1

    for (const [index, node] of parsed.nodes.entries()) {
      if (node.type === 'space') {
        continue
      }

      if (
        !sawImportTarget
        && (
          node.type === 'string'
          || (node.type === 'function' && node.value === 'url')
        )
      ) {
        importTarget = stripImportTargetQuotes(
          valueParser.stringify(node.type === 'function' ? node.nodes : [node]).trim(),
        )
        sawImportTarget = true
        continue
      }

      if (
        node.type === 'function'
        && TAILWIND_IMPORT_FUNCTIONS.includes(node.value as typeof TAILWIND_IMPORT_FUNCTIONS[number])
      ) {
        functions.push({
          name: node.value,
          value: valueParser.stringify(node.nodes).trim(),
        })
        continue
      }

      if (node.type === 'word' && node.value === 'layer') {
        hasLayerKeyword = true
        continue
      }

      mediaStartIndex = index
      break
    }

    if (mediaStartIndex !== -1) {
      mediaQuery = valueParser.stringify(parsed.nodes.slice(mediaStartIndex)).trim() || null
    }

    directives.push({
      importTarget,
      functions,
      hasLayerKeyword,
      mediaQuery,
      node: atRule,
      source: atRule.source,
    })
  })

  return directives
}

export function collectUtilitySelectors(input: TailwindInput): UtilitySelector[] {
  const root = toRoot(input)
  const selectors: UtilitySelector[] = []

  root.walkRules((rule) => {
    for (const className of collectClassNamesFromSelector(rule.selector)) {
      selectors.push({
        className,
        rule,
        selector: rule.selector,
        source: rule.source,
      })
    }
  })

  return selectors
}

export function analyzeTailwindCss(input: TailwindInput): TailwindAnalysis {
  const root = toRoot(input)

  return {
    version: detectTailwindVersion(root),
    applyCandidates: collectApplyCandidates(root),
    themeCalls: collectThemeCalls(root),
    importDirectives: collectImportDirectives(root),
    utilitySelectors: collectUtilitySelectors(root),
  }
}
