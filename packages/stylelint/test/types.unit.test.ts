it('loads the types module at runtime', async () => {
  await import('@/types')
  expect(true).toBe(true)
})
