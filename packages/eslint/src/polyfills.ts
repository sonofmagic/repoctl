function createObjectGroupBy() {
  return function groupBy<T, K extends PropertyKey>(
    items: Iterable<T>,
    callback: (item: T, index: number) => K,
  ): Partial<Record<K, T[]>> {
    const groups: Partial<Record<K, T[]>> = {}
    let index = 0

    for (const item of items) {
      const key = callback(item, index++)
      groups[key] ??= []
      groups[key]!.push(item)
    }

    return groups
  }
}

export function ensureObjectGroupBy() {
  if (typeof Object.groupBy === 'function') {
    return
  }

  Object.defineProperty(Object, 'groupBy', {
    value: createObjectGroupBy(),
    configurable: true,
    writable: true,
  })
}

ensureObjectGroupBy()
