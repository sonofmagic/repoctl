export function asArray<T>(value?: T | T[]): T[] {
  if (value === undefined) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

export function mergeUnique<T>(values: T[]): T[] {
  const seen = new Set<T>()
  const result: T[] = []

  for (const value of values) {
    if (value === undefined || value === null) {
      continue
    }

    if (!seen.has(value)) {
      seen.add(value)
      result.push(value)
    }
  }

  return result
}
