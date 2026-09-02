import type {
  IgnoreListOptions,
  ResolvedIgnoreKind,
  StylelintConfig,
} from './types'
import { DEFAULT_IGNORE_AT_RULES, DEFAULT_IGNORE_TYPES, DEFAULT_IGNORE_UNITS } from './constants'

const IGNORE_DEFAULTS: Record<ResolvedIgnoreKind, readonly string[]> = {
  atRules: DEFAULT_IGNORE_AT_RULES,
  types: DEFAULT_IGNORE_TYPES,
  units: DEFAULT_IGNORE_UNITS,
}

const IGNORE_REPLACE_KEYS: Record<ResolvedIgnoreKind, keyof IgnoreListOptions> = {
  atRules: 'atRules',
  types: 'types',
  units: 'units',
}

const IGNORE_APPEND_KEYS: Record<ResolvedIgnoreKind, keyof IgnoreListOptions> = {
  atRules: 'addAtRules',
  types: 'addTypes',
  units: 'addUnits',
}

export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

export function unique<T>(values: Iterable<T>): T[] {
  const result: T[] = []
  const seen = new Set<T>()
  for (const value of values) {
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    result.push(value)
  }
  return result
}

export function resolveIgnoreList(kind: ResolvedIgnoreKind, options?: IgnoreListOptions): string[] {
  const replaceKey = IGNORE_REPLACE_KEYS[kind]
  const appendKey = IGNORE_APPEND_KEYS[kind]
  const base = options?.[replaceKey]
  const extras = options?.[appendKey]

  const initial = base !== undefined ? base : IGNORE_DEFAULTS[kind]
  if (!extras || extras.length === 0) {
    return unique(initial)
  }

  return unique([...initial, ...extras])
}

export function normalizeExtends(base: StylelintConfig['extends']): StylelintConfig['extends'] {
  if (!base || (Array.isArray(base) && base.length === 0)) {
    return undefined
  }

  if (Array.isArray(base)) {
    return base.length === 1 ? base[0] : base
  }

  return base
}
