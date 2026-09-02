import { icebreaker as icebreakerFromFactory, icebreakerLegacy as icebreakerLegacyFromFactory } from '@/factory'
import { getPresets, icebreaker, icebreakerLegacy } from '@/index'
import { ensureObjectGroupBy } from '@/polyfills'
import { getPresets as getPresetsFromPreset } from '@/preset'

describe('index exports', () => {
  it('re-exports factory helpers', () => {
    expect(icebreaker).toBe(icebreakerFromFactory)
    expect(icebreakerLegacy).toBe(icebreakerLegacyFromFactory)
  })

  it('re-exports preset helpers', () => {
    expect(getPresets).toBe(getPresetsFromPreset)
  })

  it('polyfills Object.groupBy when the runtime does not provide it', () => {
    const original = Object.groupBy
    const entries = [
      ['a', 1],
      ['a', 2],
      ['b', 3],
    ] as const

    // Simulate the Node 20 environment used by CI.
    Object.defineProperty(Object, 'groupBy', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    try {
      ensureObjectGroupBy()

      expect(typeof Object.groupBy).toBe('function')
      expect(Object.groupBy?.(entries, entry => entry[0])).toEqual({
        a: [
          ['a', 1],
          ['a', 2],
        ],
        b: [['b', 3]],
      })
    }
    finally {
      Object.defineProperty(Object, 'groupBy', {
        value: original,
        configurable: true,
        writable: true,
      })
    }
  })
})
