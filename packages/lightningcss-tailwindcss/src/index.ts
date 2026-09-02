import type {
  ImportRule,
  Function as LightningFunction,
  Location2,
  Rule,
  Selector,
  StyleSheet,
  Token,
  TokenOrValue,
  UnknownAtRule,
} from 'lightningcss'
import { Buffer } from 'node:buffer'
import { transform } from 'lightningcss'

export type TailwindVersion = 3 | 4 | 'unknown'

const WHITESPACE_RE = /\s/

export interface LightningWarning {
  message: string
  type: string
  loc?: {
    filename?: string
    line: number
    column: number
  }
}

export interface ParseTailwindCssResult {
  stylesheet: StyleSheet
  warnings: LightningWarning[]
}

export interface UtilityCandidate {
  candidate: string
  ruleName: string
  loc: UnknownAtRule['loc']
}

export interface ThemeCall {
  raw: string
  path: string
  opacity: string | null
  functionName: string
}

export interface TailwindImportDirective {
  importTarget: string
  functions: Array<{
    name: string
    value: string
  }>
  hasLayerKeyword: boolean
  mediaQuery: string | null
  loc: ImportRule['loc']
}

export interface UtilitySelector {
  className: string
  selector: Selector
  loc: Location2
}

export interface TailwindAnalysis {
  version: TailwindVersion
  applyCandidates: UtilityCandidate[]
  themeCalls: ThemeCall[]
  importDirectives: TailwindImportDirective[]
  utilitySelectors: UtilitySelector[]
  warnings: LightningWarning[]
}

function tokenToString(token: Token): string {
  switch (token.type) {
    case 'ident':
    case 'at-keyword':
    case 'hash':
    case 'id-hash':
    case 'white-space':
    case 'comment':
    case 'string':
    case 'unquoted-url':
    case 'delim':
    case 'bad-string':
    case 'bad-url':
      return token.value
    case 'number':
      return String(token.value)
    case 'percentage':
      return `${token.value * 100}%`
    case 'dimension':
      return `${token.value}${token.unit}`
    case 'colon':
      return ':'
    case 'semicolon':
      return ';'
    case 'comma':
      return ','
    case 'include-match':
      return '~='
    case 'dash-match':
      return '|='
    case 'prefix-match':
      return '^='
    case 'suffix-match':
      return '$='
    case 'substring-match':
      return '*='
    case 'cdo':
      return '<!--'
    case 'cdc':
      return '-->'
    case 'function':
      return `${token.value}(`
    case 'parenthesis-block':
      return '('
    case 'square-bracket-block':
      return '['
    case 'curly-bracket-block':
      return '{'
    case 'close-parenthesis':
      return ')'
    case 'close-square-bracket':
      return ']'
    case 'close-curly-bracket':
      return '}'
    default:
      return ''
  }
}

function tokenOrValueListToString(nodes: TokenOrValue[]): string {
  function renderTokenOrValue(node: TokenOrValue): string {
    switch (node.type) {
      case 'token':
        return tokenToString(node.value)
      case 'function':
        return `${node.value.name}(${tokenOrValueListToString(node.value.arguments)})`
      case 'dashed-ident':
      case 'animation-name':
        return String(node.value)
      case 'length':
        return `${node.value.value}${node.value.unit}`
      case 'angle':
        return `${node.value.value}${node.value.type}`
      case 'time':
        return `${node.value.value}${node.value.type === 'seconds' ? 's' : 'ms'}`
      case 'resolution':
        return `${node.value.value}${node.value.type}`
      case 'url':
        return `url(${String(node.value.url)})`
      case 'var':
        return `var(${String(node.value.name)})`
      case 'env':
        return `env(${String(node.value.name)})`
      case 'color':
      case 'unresolved-color':
        return JSON.stringify(node.value)
      default:
        return ''
    }
  }

  let output = ''

  for (const [index, node] of nodes.entries()) {
    const rendered = renderTokenOrValue(node)

    if (
      node.type === 'token'
      && node.value.type === 'number'
      && index > 0
    ) {
      const previous = nodes[index - 1]
      if (
        previous
        && previous.type === 'token'
        && previous.value.type === 'ident'
      ) {
        const numericValue = node.value.value
        const normalized = numericValue > 0 && numericValue < 1
          ? String(Math.round(numericValue * 1000))
          : rendered
        output += `.${normalized}`
        continue
      }
    }

    output += rendered
  }

  return output
}

function splitCandidateList(input: string): string[] {
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

function parseThemeArgument(raw: string): Pick<ThemeCall, 'path' | 'opacity'> {
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

function parseWithLightningCss(input: string): ParseTailwindCssResult {
  let stylesheetRef: StyleSheet | undefined
  const result = transform({
    filename: 'input.css',
    code: Buffer.from(input),
    errorRecovery: true,
    visitor: {
      StyleSheet(stylesheet) {
        stylesheetRef = stylesheet
      },
    },
  })

  if (!stylesheetRef) {
    throw new Error('Failed to capture Lightning CSS stylesheet')
  }

  return {
    stylesheet: stylesheetRef,
    warnings: result.warnings.map(warning => ({
      message: warning.message,
      type: warning.type,
      loc: warning.loc,
    })),
  }
}

export function parseTailwindCss(input: string): ParseTailwindCssResult {
  return parseWithLightningCss(input)
}

function walkRules(rules: Rule[], visit: (rule: Rule) => void): void {
  for (const rule of rules) {
    visit(rule)

    if (rule.type === 'style') {
      walkRules(rule.value.rules ?? [], visit)
    }
    else if (rule.type === 'media' || rule.type === 'supports' || rule.type === 'container' || rule.type === 'scope' || rule.type === 'starting-style' || rule.type === 'layer-block') {
      walkRules(rule.value.rules, visit)
    }
  }
}

export function detectTailwindVersion(input: string): TailwindVersion {
  const { stylesheet } = parseWithLightningCss(input)
  let hasV3 = false
  let hasV4 = false

  walkRules(stylesheet.rules, (rule) => {
    if (rule.type === 'import') {
      if (rule.value.url.includes('tailwindcss')) {
        hasV4 = true
      }
      return
    }

    if (rule.type !== 'unknown') {
      return
    }

    if (['tailwind', 'config'].includes(rule.value.name)) {
      hasV3 = true
    }

    if ([
      'theme',
      'source',
      'utility',
      'variant',
      'custom-variant',
      'plugin',
      'reference',
    ].includes(rule.value.name)) {
      hasV4 = true
    }
  })

  if (hasV4) {
    return 4
  }

  if (hasV3) {
    return 3
  }

  return 'unknown'
}

export function collectApplyCandidates(input: string): UtilityCandidate[] {
  const { stylesheet } = parseWithLightningCss(input)
  const candidates: UtilityCandidate[] = []

  walkRules(stylesheet.rules, (rule) => {
    if (rule.type !== 'unknown' || rule.value.name !== 'apply') {
      return
    }

    const prelude = tokenOrValueListToString(rule.value.prelude)
    for (const candidate of splitCandidateList(prelude)) {
      candidates.push({
        candidate,
        ruleName: rule.value.name,
        loc: rule.value.loc,
      })
    }
  })

  return candidates
}

export function collectThemeCalls(input: string): ThemeCall[] {
  const calls: ThemeCall[] = []

  transform({
    filename: 'input.css',
    code: Buffer.from(input),
    errorRecovery: true,
    visitor: {
      Function: {
        theme(fn: LightningFunction) {
          const raw = tokenOrValueListToString(fn.arguments).trim()
          const { path, opacity } = parseThemeArgument(raw)
          calls.push({
            raw,
            path,
            opacity,
            functionName: fn.name,
          })
        },
      },
    },
  })

  return calls
}

export function collectImportDirectives(input: string): TailwindImportDirective[] {
  const { stylesheet } = parseWithLightningCss(input)
  const directives: TailwindImportDirective[] = []

  walkRules(stylesheet.rules, (rule) => {
    if (rule.type !== 'import' || !rule.value.url.includes('tailwindcss')) {
      return
    }

    const condition = rule.value.media?.mediaQueries[0]?.condition
    const tokens = condition?.type === 'unknown' ? condition.value : []
    const functions = tokens
      .filter((item): item is Extract<TokenOrValue, { type: 'function' }> => item.type === 'function')
      .filter(item => ['source', 'prefix', 'layer', 'supports'].includes(item.value.name))
      .map(item => ({
        name: item.value.name,
        value: tokenOrValueListToString(item.value.arguments).trim(),
      }))

    const mediaParts = tokens.filter((item) => {
      return !(
        item.type === 'function'
        && ['source', 'prefix', 'layer', 'supports'].includes(item.value.name)
      )
    })

    const mediaQuery = tokenOrValueListToString(mediaParts).trim() || null

    directives.push({
      importTarget: rule.value.url,
      functions,
      hasLayerKeyword: Boolean(rule.value.layer),
      mediaQuery,
      loc: rule.value.loc,
    })
  })

  return directives
}

export function collectUtilitySelectors(input: string): UtilitySelector[] {
  const { stylesheet } = parseWithLightningCss(input)
  const selectors: UtilitySelector[] = []

  walkRules(stylesheet.rules, (rule) => {
    if (rule.type !== 'style') {
      return
    }

    for (const selector of rule.value.selectors) {
      for (const component of selector) {
        if (component.type !== 'class') {
          continue
        }

        selectors.push({
          className: component.name,
          selector,
          loc: rule.value.loc,
        })
      }
    }
  })

  return selectors
}

export function analyzeTailwindCss(input: string): TailwindAnalysis {
  const parsed = parseWithLightningCss(input)

  return {
    version: detectTailwindVersion(input),
    applyCandidates: collectApplyCandidates(input),
    themeCalls: collectThemeCalls(input),
    importDirectives: collectImportDirectives(input),
    utilitySelectors: collectUtilitySelectors(input),
    warnings: parsed.warnings,
  }
}
