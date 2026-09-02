import {
  DEFAULT_IGNORE_AT_RULES,
  DEFAULT_IGNORE_TYPES,
  DEFAULT_IGNORE_UNITS,
} from '@/constants'
import {
  normalizeExtends,
  resolveIgnoreList,
  toArray,
  unique,
} from '@/utils'

describe('toArray', () => {
  it('normalizes undefined values', () => {
    expect(toArray(undefined)).toEqual([])
  })

  it('keeps arrays untouched', () => {
    expect(toArray(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('wraps single values into arrays', () => {
    expect(toArray('a')).toEqual(['a'])
  })
})

describe('unique', () => {
  it('preserves the first occurrence of values', () => {
    expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
  })
})

describe('resolveIgnoreList', () => {
  it('returns defaults when no overrides are provided', () => {
    expect(resolveIgnoreList('units')).toEqual([...DEFAULT_IGNORE_UNITS])
    expect(resolveIgnoreList('types')).toEqual([...DEFAULT_IGNORE_TYPES])
    expect(resolveIgnoreList('atRules')).toEqual([...DEFAULT_IGNORE_AT_RULES])
  })

  it('replaces the defaults when base overrides are supplied', () => {
    const result = resolveIgnoreList('units', {
      units: ['upx'],
    })
    expect(result).toEqual(['upx'])
  })

  it('appends to the defaults when add* values are provided', () => {
    const result = resolveIgnoreList('units', {
      addUnits: ['px'],
    })
    expect(result).toEqual([...DEFAULT_IGNORE_UNITS, 'px'])
  })

  it('appends when both base and extra values exist', () => {
    const result = resolveIgnoreList('units', {
      units: ['upx'],
      addUnits: ['rpx'],
    })
    expect(result).toEqual(['upx', 'rpx'])
  })
})

describe('normalizeExtends', () => {
  it('returns undefined for empty values', () => {
    expect(normalizeExtends(undefined)).toBeUndefined()
    expect(normalizeExtends([])).toBeUndefined()
  })

  it('returns a single entry when the array has one value', () => {
    expect(normalizeExtends(['one'])).toBe('one')
  })

  it('keeps multiple entries as arrays', () => {
    expect(normalizeExtends(['one', 'two'])).toEqual(['one', 'two'])
  })

  it('passes through string values', () => {
    expect(normalizeExtends('custom')).toBe('custom')
  })
})
