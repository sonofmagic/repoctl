import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { ESLint } from 'eslint'
import { icebreaker } from '@/index'
import { hasAllPackages } from '@/utils'

const BUNDLED_REACT_PACKAGES = [
  '@eslint-react/eslint-plugin',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
] as const

type EslintOverrideConfig = NonNullable<ConstructorParameters<typeof ESLint>[0]>['overrideConfig']

function asOverrideConfig(configs: unknown): EslintOverrideConfig {
  return configs as EslintOverrideConfig
}

describe('react consumer smoke test', () => {
  it('resolves bundled react core plugins from the package itself', async () => {
    const originalCwd = process.cwd()
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'icebreaker-react-consumer-'))
    const filePath = path.join(tempDir, 'App.jsx')

    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'react-consumer-smoke',
        private: true,
      }, null, 2),
    )
    await fs.writeFile(
      filePath,
      [
        'export function App() {',
        '  return <button type="button">Hello</button>',
        '}',
        '',
      ].join('\n'),
    )

    process.chdir(tempDir)

    try {
      expect(hasAllPackages([...BUNDLED_REACT_PACKAGES])).toBe(true)

      const eslint = new ESLint({
        cwd: tempDir,
        overrideConfig: asOverrideConfig(await icebreaker({
          react: true,
        }).toConfigs()),
        overrideConfigFile: true,
      })

      const config = await eslint.calculateConfigForFile(filePath)
      const [result] = await eslint.lintFiles([filePath])

      expect(config.rules?.['react/rules-of-hooks']).toBeDefined()
      expect(result?.messages.filter(message => message.fatal)).toEqual([])
    }
    finally {
      process.chdir(originalCwd)
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})
