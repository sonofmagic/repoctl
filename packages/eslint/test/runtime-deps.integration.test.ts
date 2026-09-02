import { createRequire } from 'node:module'
import path from 'node:path'

const packageRequire = createRequire(
  path.resolve(__dirname, '..', 'package.json'),
)

describe('runtime dependency contract', () => {
  it('keeps @typescript-eslint/utils resolvable from eslint-plugin-antfu', () => {
    const antfuPackageJsonPath = packageRequire.resolve(
      '@antfu/eslint-config/package.json',
    )
    const antfuRequire = createRequire(antfuPackageJsonPath)
    const pluginEntry = antfuRequire.resolve('eslint-plugin-antfu')
    const pluginRequire = createRequire(pluginEntry)

    expect(() => pluginRequire.resolve('@typescript-eslint/utils')).not.toThrow()
  })

  it('loads the ESM-only Wevu compatibility package through dynamic import', async () => {
    const module = await import('@weapp-vite/eslint')

    expect(module.wevuCompatibilityRecommended.rules).toMatchObject({
      'wevu/no-unsupported-api': 'error',
      'wevu/no-risky-api': 'warn',
      'wevu/no-unsupported-template-feature': 'error',
    })
  })
})
