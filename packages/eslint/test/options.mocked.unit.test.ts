describe('resolveUserOptions with mocked defaults', () => {
  afterEach(() => {
    vi.resetModules()
    vi.doUnmock('@/defaults')
  })

  it('removes typescript when mocked defaults resolve to undefined', async () => {
    vi.doMock('@/defaults', async () => {
      const actual = await vi.importActual<typeof import('@/defaults')>('@/defaults')
      return {
        ...actual,
        getDefaultTypescriptOptions: vi.fn(() => undefined),
      }
    })

    const { resolveUserOptions } = await import('@/options')
    const resolved = resolveUserOptions({})

    expect('typescript' in resolved).toBe(false)
  })
})
