vi.mock('@antfu/eslint-config', () => {
  return {
    antfu: 'antfu-value',
    interopDefault: 'interop-value',
  }
})

describe('antfu exports', () => {
  it('re-exports values from @antfu/eslint-config', async () => {
    const antfuExports = await import('@/antfu')

    expect(antfuExports.antfu).toBe('antfu-value')
    expect(antfuExports.interopDefault).toBe('interop-value')
  })
})
