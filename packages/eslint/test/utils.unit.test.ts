import { isObject, isPackageAvailable } from '@/utils'

describe('isObject', () => {
  it('only treats plain objects as objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject([])).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject(() => {})).toBe(false)
  })
})

describe('isPackageAvailable', () => {
  it('detects packages that do not expose a root entry point', () => {
    expect(isPackageAvailable('@eslint-react/eslint-plugin')).toBe(true)
  })
})
