const STATIC_UTILITY_CLASSES = [
  'absolute',
  'relative',
  'fixed',
  'sticky',
  'static',
  'block',
  'inline',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'flex',
  'grid',
  'hidden',
  'contents',
  'table',
  'table-caption',
  'table-cell',
  'table-column',
  'table-column-group',
  'table-footer-group',
  'table-header-group',
  'table-row',
  'table-row-group',
  'sr-only',
  'not-sr-only',
  'container',
  'rounded',
  'shadow',
  'ring',
  'truncate',
  'transition',
  'transform',
  'filter',
  'grow',
  'shrink',
] as const

const VALUE_UTILITY_PREFIXES = [
  'flex-',
  'grid-cols-',
  'grid-rows-',
  'items-',
  'justify-',
  'content-',
  'self-',
  'place-',
  'gap-',
  'space-x-',
  'space-y-',
  'p-',
  'px-',
  'py-',
  'pt-',
  'pr-',
  'pb-',
  'pl-',
  'm-',
  'mx-',
  'my-',
  'mt-',
  'mr-',
  'mb-',
  'ml-',
  'w-',
  'h-',
  'min-w-',
  'min-h-',
  'max-w-',
  'max-h-',
  'inset-',
  'inset-x-',
  'inset-y-',
  'top-',
  'right-',
  'bottom-',
  'left-',
  'text-',
  'font-',
  'leading-',
  'tracking-',
  'bg-',
  'from-',
  'via-',
  'to-',
  'border-',
  'rounded-',
  'shadow-',
  'ring-',
  'opacity-',
  'overflow-',
  'object-',
  'z-',
  'order-',
  'col-',
  'row-',
  'aspect-',
  'basis-',
  'grow-',
  'shrink-',
  'cursor-',
  'select-',
  'align-',
  'whitespace-',
  'break-',
  'line-clamp-',
  'transition-',
  'duration-',
  'ease-',
  'delay-',
  'animate-',
  'scale-',
  'scale-x-',
  'scale-y-',
  'rotate-',
  'translate-',
  'translate-x-',
  'translate-y-',
  'skew-',
  'origin-',
  'outline-',
  'filter-',
  'backdrop-',
  'pointer-events-',
  'appearance-',
  'accent-',
  'caret-',
  'fill-',
  'stroke-',
] as const

const UTILITY_PREFIXES = [
  ...STATIC_UTILITY_CLASSES,
  ...VALUE_UTILITY_PREFIXES,
] as const

const IMPORTANT_PREFIX_RE = /^!/
const BARE_ARBITRARY_VALUE_RE = /^(?:-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rpx|rem|em|%|vh|vw|vmin|vmax|dvh|dvw|deg|rad|turn|ms|s|fr|ch|ex|pt|pc|cm|mm|in)|#[0-9a-fA-F]{3,8}|\$[A-Za-z_][\w-]*|(?:calc|min|max|clamp|rgb|rgba|hsl|hsla|color|url|var)\(.+\))$/
const LEADING_NEGATIVE_SIGN_RE = /^-/
const SORTED_UTILITY_PREFIXES = [...UTILITY_PREFIXES].sort((left, right) => right.length - left.length)
const STATIC_UTILITY_CLASS_SET = new Set<string>(STATIC_UTILITY_CLASSES)
const UNOCSS_VARIANT_GROUP_RE = /[^\s:()]+:\([^)]*\)/

const heuristicCandidateCache = new Map<string, boolean>()

function stripVariantPrefixes(className: string): string {
  let normalized = className

  while (true) {
    let bracketDepth = 0
    let parenDepth = 0
    let consumed = false

    for (let index = 0; index < normalized.length; index += 1) {
      const char = normalized[index]

      if (char === '[') {
        bracketDepth += 1
        continue
      }

      if (char === ']') {
        bracketDepth = Math.max(0, bracketDepth - 1)
        continue
      }

      if (char === '(') {
        parenDepth += 1
        continue
      }

      if (char === ')') {
        parenDepth = Math.max(0, parenDepth - 1)
        continue
      }

      if (char === ':' && bracketDepth === 0 && parenDepth === 0) {
        normalized = normalized.slice(index + 1)
        consumed = true
        break
      }
    }

    if (!consumed) {
      return normalized
    }
  }
}

function normalizeUtilityCandidate(className: string): string {
  let normalized = className
    .replace(IMPORTANT_PREFIX_RE, '')

  normalized = stripVariantPrefixes(normalized)

  if (normalized.startsWith('-')) {
    normalized = normalized.slice(1)
  }

  return normalized
}

function isUnoCssBareArbitraryValue(value: string): boolean {
  return BARE_ARBITRARY_VALUE_RE.test(value)
}

function getMatchedUtilityPrefix(className: string): string | undefined {
  return SORTED_UTILITY_PREFIXES
    .find(prefix => className === prefix || className.startsWith(prefix))
}

export function getNormalizedUtilityCandidate(className: string): string {
  return normalizeUtilityCandidate(className)
}

export function isTailwindArbitraryValueUtilityClass(className: string): boolean {
  const normalized = normalizeUtilityCandidate(className)

  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    return true
  }

  const arbitraryStartIndex = normalized.indexOf('[')
  if (arbitraryStartIndex === -1) {
    return false
  }

  const utilityPrefix = normalized.slice(0, arbitraryStartIndex)
  return UTILITY_PREFIXES.some(prefix => utilityPrefix === prefix || utilityPrefix.startsWith(prefix))
}

export function isUnoCssArbitraryValueUtilityClass(className: string): boolean {
  const normalized = normalizeUtilityCandidate(className)

  if (isTailwindArbitraryValueUtilityClass(className)) {
    return true
  }

  const matchedPrefix = getMatchedUtilityPrefix(normalized)
  if (!matchedPrefix) {
    return false
  }

  const utilityValue = normalized
    .slice(matchedPrefix.length)
    .replace(LEADING_NEGATIVE_SIGN_RE, '')

  return utilityValue.length > 0 && isUnoCssBareArbitraryValue(utilityValue)
}

export function isArbitraryValueUtilityClass(className: string): boolean {
  return isUnoCssArbitraryValueUtilityClass(className)
}

export function isHeuristicUtilityClass(className: string): boolean {
  const cached = heuristicCandidateCache.get(className)
  if (cached !== undefined) {
    return cached
  }

  const normalized = normalizeUtilityCandidate(className)
  const matched = (
    isTailwindArbitraryValueUtilityClass(className)
    || isUnoCssArbitraryValueUtilityClass(className)
    || STATIC_UTILITY_CLASS_SET.has(normalized)
    || VALUE_UTILITY_PREFIXES.some(prefix => normalized.startsWith(prefix))
  )

  heuristicCandidateCache.set(className, matched)
  return matched
}

export function isLikelyUtilityClass(className: string): boolean {
  return isHeuristicUtilityClass(className)
}

export function isUnoCssVariantGroupCandidate(value: string): boolean {
  return UNOCSS_VARIANT_GROUP_RE.test(value)
}
