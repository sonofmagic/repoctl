import type { Linter } from 'eslint'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { ESLint } from 'eslint'
import { icebreaker } from '@/index'
import { __resetStylelintWorker } from '../../eslint-plugin-better-stylelint/src/core'

const ROOT_DIR = path.resolve(__dirname, '..')
const INPUT_ROOT = path.join(ROOT_DIR, 'fixtures', 'input')
const OUTPUT_ROOT = path.join(ROOT_DIR, 'fixtures', 'output')
const TEMP_ROOT = path.join(os.tmpdir(), 'icebreaker-eslint')
const TAILWIND_RUNTIME_DIR = path.join(ROOT_DIR, 'node_modules', 'tailwindcss')

const CASES = [
  'all',
  'with-formatters',
  'no-markdown-with-formatters',
  'no-style',
  'tab-double-quotes',
] as const

const CASE_CONFIGS: Record<
  typeof CASES[number],
  { options: Record<string, unknown>, extra?: Array<Record<string, unknown>> }
> = {
  'all': {
    options: {
      typescript: true,
      vue: true,
      svelte: true,
      astro: true,
    },
  },
  'with-formatters': {
    options: {
      typescript: true,
      vue: true,
      astro: true,
      formatters: true,
    },
  },
  'no-markdown-with-formatters': {
    options: {
      jsx: false,
      vue: false,
      markdown: false,
      formatters: {
        markdown: true,
      },
    },
  },
  'no-style': {
    options: {
      typescript: true,
      vue: true,
      stylistic: false,
    },
  },
  'tab-double-quotes': {
    options: {
      typescript: true,
      vue: true,
      stylistic: {
        indent: 'tab',
        quotes: 'double',
      },
    },
    extra: [
      {
        rules: {
          'style/no-mixed-spaces-and-tabs': 'off',
        },
      },
    ],
  },
}

async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, base))
      continue
    }
    files.push(path.relative(base, fullPath))
  }
  return files
}

const BASE_EXTENSIONS = [
  'js',
  'jsx',
  'ts',
  'tsx',
  'vue',
  'md',
  'html',
  'xml',
  'css',
  'toml',
]

type EslintOverrideConfig = NonNullable<ConstructorParameters<typeof ESLint>[0]>['overrideConfig']

function asOverrideConfig(configs: unknown): EslintOverrideConfig {
  return configs as EslintOverrideConfig
}

function stripUnsupportedRules(configs: unknown[]): Linter.Config[] {
  return (configs as Linter.Config[]).map((config) => {
    if (!config.rules) {
      return config
    }
    if (!Object.hasOwn(config.rules, 'ts/ban-types')) {
      return config
    }
    const { 'ts/ban-types': _banTypes, ...rest } = config.rules
    return {
      ...config,
      ...(Object.keys(rest).length > 0 ? { rules: rest } : {}),
    }
  })
}

const moduleAvailability = new Map<string, Promise<boolean>>()

async function moduleAvailable(name: string) {
  const cached = moduleAvailability.get(name)
  if (cached) {
    return cached
  }
  const result = (async () => {
    try {
      await import(name)
      return true
    }
    catch {
      return false
    }
  })()
  moduleAvailability.set(name, result)
  return result
}

async function resolveCaseContext(caseName: typeof CASES[number]) {
  const config = CASE_CONFIGS[caseName]
  const options = JSON.parse(JSON.stringify(config.options)) as Record<string, unknown>

  const hasAstro = await moduleAvailable('eslint-plugin-astro')
  const hasSvelte = await moduleAvailable('eslint-plugin-svelte')

  if (!hasAstro && options['astro']) {
    options['astro'] = false
  }
  if (!hasSvelte && options['svelte']) {
    options['svelte'] = false
  }

  const extensions = [...BASE_EXTENSIONS]
  if (options['astro']) {
    extensions.push('astro')
  }
  if (options['svelte']) {
    extensions.push('svelte')
  }

  const ignoreExtensions: string[] = []
  if (!options['astro']) {
    ignoreExtensions.push('.astro')
  }
  if (!options['svelte']) {
    ignoreExtensions.push('.svelte')
  }

  const composer = icebreaker(options, ...(config.extra ?? []))
  const configs = await composer.toConfigs()

  return {
    configs: stripUnsupportedRules(configs),
    extensions,
    ignoreExtensions,
  }
}

async function prepareFixture(caseName: typeof CASES[number]): Promise<string> {
  const dest = path.join(TEMP_ROOT, `${caseName}-${crypto.randomUUID()}`)
  await fs.rm(dest, { recursive: true, force: true })
  await fs.mkdir(dest, { recursive: true })
  await fs.cp(INPUT_ROOT, dest, { recursive: true })
  return dest
}

async function compareOutputs(
  caseName: string,
  actualRoot: string,
  options: { ignoreExtensions?: string[] } = {},
) {
  const expectedRoot = path.join(OUTPUT_ROOT, caseName)
  const expectedFiles = (await listFiles(expectedRoot))
    .filter((file) => {
      if (!options.ignoreExtensions || options.ignoreExtensions.length === 0) {
        return true
      }
      return !options.ignoreExtensions.some(ext => file.endsWith(ext))
    })
  expect(expectedFiles.length).toBeGreaterThan(0)

  await Promise.all(expectedFiles.map(async (relativePath) => {
    const expected = await fs.readFile(
      path.join(expectedRoot, relativePath),
      'utf8',
    )
    const actual = await fs.readFile(
      path.join(actualRoot, relativePath),
      'utf8',
    )
    expect(actual.replace(/\r\n/g, '\n')).toBe(expected.replace(/\r\n/g, '\n'))
  }))
}

describe('eslint integration fixtures', () => {
  afterEach(() => {
    __resetStylelintWorker()
  })

  it.each(CASES)('formats %s fixtures with expected output', async (caseName) => {
    const tempDir = await prepareFixture(caseName)
    const { configs, extensions, ignoreExtensions } = await resolveCaseContext(caseName)

    const eslint = new ESLint({
      cwd: tempDir,
      fix: true,
      overrideConfig: asOverrideConfig(configs),
      overrideConfigFile: true,
    })

    const results = await eslint.lintFiles([
      `**/*.{${extensions.join(',')}}`,
    ])
    await ESLint.outputFixes(results)

    await compareOutputs(caseName, tempDir, { ignoreExtensions })
  })

  it('accepts inline stylelint config from eslint options', async () => {
    const tempDir = await prepareFixture('all')
    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker({
        stylelint: {
          rules: {
            'color-named': 'never',
          },
        },
      }).toConfigs()),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText('.demo { color: red; }', {
      filePath: path.join(tempDir, 'inline.css'),
    })

    expect(result?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'color-named',
        message: expect.stringContaining('named color "red"'),
      }),
    ]))
  })

  it('formats css/html/markdown with oxfmt when selected via formatters', async () => {
    const cases = [
      {
        filePath: 'sample.css',
        text: '.demo{color:red}',
        formatters: { css: 'oxfmt' },
        expected: '.demo {\n  color: red;\n}\n',
      },
      {
        filePath: 'sample.html',
        text: '<div><span>hi</span></div>',
        formatters: { html: 'oxfmt' },
        expected: '<div><span>hi</span></div>\n',
      },
      {
        filePath: 'sample.md',
        text: '# hi\n\n- a\n-  b',
        formatters: { markdown: 'oxfmt' },
        expected: '# hi\n\n- a\n- b\n',
      },
    ] as const

    for (const testCase of cases) {
      const eslint = new ESLint({
        cwd: ROOT_DIR,
        fix: true,
        overrideConfig: asOverrideConfig(await icebreaker({
          formatters: testCase.formatters,
        }).toConfigs()),
        overrideConfigFile: true,
      })

      const [result] = await eslint.lintText(testCase.text, {
        filePath: path.join(ROOT_DIR, testCase.filePath),
      })

      expect(result?.output).toBe(testCase.expected)
      expect(result?.messages).toEqual([])
    }
  })

  it('formats graphql with oxfmt when selected via formatters', async () => {
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      fix: true,
      overrideConfig: asOverrideConfig(await icebreaker({
        formatters: {
          graphql: 'oxfmt',
        },
      }).toConfigs()),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText('type Query{hello:String}', {
      filePath: path.join(ROOT_DIR, 'sample.graphql'),
    })

    expect(result?.output).toBe('type Query {\n  hello: String\n}\n')
    expect(result?.messages).toEqual([])
  })

  it('keeps prettier by default for css/html/graphql formatter targets', async () => {
    const cases = [
      {
        filePath: 'default.css',
        text: '.demo{color:red}',
        expected: '.demo {\n  color: red;\n}\n',
      },
      {
        filePath: 'default.html',
        text: '<div><span>hi</span></div>',
        expected: '<div><span>hi</span></div>\n',
      },
      {
        filePath: 'default.graphql',
        text: 'type Query{hello:String}',
        expected: 'type Query {\n  hello: String\n}\n',
      },
    ] as const

    const configs = await icebreaker().toConfigs()
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      fix: true,
      overrideConfig: asOverrideConfig(configs),
      overrideConfigFile: true,
    })

    for (const testCase of cases) {
      const [result] = await eslint.lintText(testCase.text, {
        filePath: path.join(ROOT_DIR, testCase.filePath),
      })

      expect(result?.output).toBe(testCase.expected)
      expect(result?.messages).toEqual([])
    }
  })

  it('keeps prettier-backed fallback formatters for markdown/xml/svg/astro', async () => {
    const cases = [
      {
        filePath: 'fallback.md',
        text: '# hi\n\n- a\n-  b',
        expected: '# hi\n\n- a\n- b\n',
      },
      {
        filePath: 'fallback.xml',
        text: '<root><a>1</a></root>',
        expected: '<root>\n  <a>1</a>\n</root>\n',
      },
      {
        filePath: 'fallback.svg',
        text: '<svg><g><path d="M0 0"/></g></svg>',
        expected: '<svg>\n  <g>\n    <path d="M0 0" />\n  </g>\n</svg>\n',
      },
      {
        filePath: 'fallback.astro',
        text: '---\nconst a=1\n---\n<div>{a}</div>',
        expected: '---\nconst a = 1\n---\n\n<div>{a}</div>\n',
      },
    ] as const

    const configs = await icebreaker().toConfigs()
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      fix: true,
      overrideConfig: asOverrideConfig(configs),
      overrideConfigFile: true,
    })

    for (const testCase of cases) {
      const [result] = await eslint.lintText(testCase.text, {
        filePath: path.join(ROOT_DIR, testCase.filePath),
      })

      expect(result?.output).toBe(testCase.expected)
      expect(result?.messages).toEqual([])
    }
  })

  it('lifts user ignores to a top-level flat config item', async () => {
    const tempDir = path.join(TEMP_ROOT, `ignores-${crypto.randomUUID()}`)
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(path.join(tempDir, '.agents'), { recursive: true })
    await fs.writeFile(
      path.join(tempDir, 'index.js'),
      'console.log("visible")\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(tempDir, '.agents', 'hidden.md'),
      '# bad\tmarkdown\n',
      'utf8',
    )

    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker(
        {},
        {
          ignores: ['.agents/**'],
          rules: {
            'no-restricted-syntax': [
              'error',
              'CallExpression[callee.object.name="console"]',
            ],
          },
        },
      ).toConfigs()),
      overrideConfigFile: true,
    })

    expect(await eslint.isPathIgnored(path.join(tempDir, '.agents', 'hidden.md'))).toBe(true)

    const results = await eslint.lintFiles(['.'])
    const relativePaths = results.map(result => path.relative(tempDir, result.filePath))

    expect(relativePaths).toContain('index.js')
    expect(relativePaths).not.toContain(path.join('.agents', 'hidden.md'))
    expect(results.find(result => result.filePath.endsWith('index.js'))?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'no-restricted-syntax',
        }),
      ]),
    )
  })

  it('keeps scoped ignores on file-matched user configs', async () => {
    const tempDir = path.join(TEMP_ROOT, `scoped-ignores-${crypto.randomUUID()}`)
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(path.join(tempDir, 'src', 'vendor'), { recursive: true })
    await fs.mkdir(path.join(tempDir, 'other', 'vendor'), { recursive: true })
    await fs.writeFile(
      path.join(tempDir, 'src', 'index.js'),
      'console.log("src")\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(tempDir, 'src', 'vendor', 'ignored.js'),
      'console.log("ignored")\n',
      'utf8',
    )
    await fs.writeFile(
      path.join(tempDir, 'other', 'vendor', 'outside.js'),
      'console.log("outside")\n',
      'utf8',
    )

    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker(
        {},
        {
          files: ['src/**/*.js'],
          ignores: ['**/vendor/**'],
          rules: {
            'no-restricted-syntax': [
              'error',
              'CallExpression[callee.object.name="console"]',
            ],
          },
        },
      ).toConfigs()),
      overrideConfigFile: true,
    })

    expect(await eslint.isPathIgnored(path.join(tempDir, 'src', 'vendor', 'ignored.js'))).toBe(false)

    const results = await eslint.lintFiles(['.'])
    const srcResult = results.find(result => result.filePath.endsWith(path.join('src', 'index.js')))
    const ignoredResult = results.find(result => result.filePath.endsWith(path.join('src', 'vendor', 'ignored.js')))
    const outsideResult = results.find(result => result.filePath.endsWith(path.join('other', 'vendor', 'outside.js')))

    expect(srcResult?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'no-restricted-syntax',
      }),
    ]))
    expect(ignoredResult?.messages.some(message => message.ruleId === 'no-restricted-syntax')).toBe(false)
    expect(outsideResult?.messages.some(message => message.ruleId === 'no-restricted-syntax')).toBe(false)
  })

  it('keeps ordinary user flat config fields working when passed through', async () => {
    const tempDir = path.join(TEMP_ROOT, `user-fields-${crypto.randomUUID()}`)
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(
      path.join(tempDir, 'index.js'),
      '/* eslint-disable no-undef */\nfoo\n',
      'utf8',
    )

    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker(
        {},
        {
          files: ['**/*.js'],
          languageOptions: {
            globals: {
              foo: 'readonly',
            },
          },
          linterOptions: {
            reportUnusedDisableDirectives: 'error',
          },
        },
      ).toConfigs()),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintFiles(['.'])

    expect(result?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: null,
        message: expect.stringContaining('Unused eslint-disable directive'),
      }),
    ]))
    expect(result?.messages.some(message => message.ruleId === 'no-undef')).toBe(false)
  })

  it('allows mini program native slot projection in Vue templates', async () => {
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      overrideConfig: asOverrideConfig(stripUnsupportedRules(await icebreaker({
        vue: true,
        miniProgram: true,
      }).toConfigs())),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText(
      [
        '<template>',
        '  <van-cell>',
        '    <t-button slot="right-icon">Open</t-button>',
        '    <template slot="title">Title</template>',
        '  </van-cell>',
        '</template>',
        '',
      ].join('\n'),
      {
        filePath: path.join(ROOT_DIR, 'mini-program-slots.vue'),
      },
    )

    expect(result?.messages).toEqual([])
  })

  it('warns mini program Vue props named id, class, and slot without blocking readable props', async () => {
    const eslint = new ESLint({
      cwd: ROOT_DIR,
      overrideConfig: asOverrideConfig(stripUnsupportedRules(await icebreaker({
        vue: true,
        miniProgram: true,
      }).toConfigs())),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText(
      [
        '<script setup lang="ts">',
        'const props = defineProps<{',
        '  id?: string',
        '  class?: string',
        '  slot?: string',
        '  style?: string',
        '  hidden?: boolean',
        '  dataFoo?: string',
        '  markFoo?: string',
        '}>()',
        '</script>',
        '',
        '<template>',
        '  <view :class="props.class" :style="props.style" :hidden="props.hidden" :data-foo="props.dataFoo" :mark:foo="props.markFoo" />',
        '</template>',
        '',
      ].join('\n'),
      {
        filePath: path.join(ROOT_DIR, 'mini-program-props.vue'),
      },
    )

    const restrictedPropMessages = result?.messages.filter(message =>
      message.ruleId === 'vue/no-restricted-props',
    )

    expect(restrictedPropMessages).toEqual([
      expect.objectContaining({
        severity: 1,
        message: expect.stringContaining('id prop'),
      }),
      expect.objectContaining({
        severity: 1,
        message: expect.stringContaining('class prop'),
      }),
      expect.objectContaining({
        severity: 1,
        message: expect.stringContaining('slot prop'),
      }),
    ])
  })

  it('discovers uno.config.ts from project root when unocss.configPath is omitted', async () => {
    const tempDir = path.join(TEMP_ROOT, `unocss-root-${crypto.randomUUID()}`)
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(
      path.join(tempDir, 'uno.config.ts'),
      `export default { blocklist: ['foo'] }\n`,
      'utf8',
    )

    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker({
        unocss: {
          strict: true,
        },
      }).toConfigs()),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText(
      `export const Demo = () => <div className="foo bar" />\n`,
      {
        filePath: path.join(tempDir, 'demo.jsx'),
      },
    )

    expect(result?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'unocss/blocklist',
        message: expect.stringContaining('"foo" is in blocklist'),
      }),
    ]))
  })

  it('uses unocss.configPath to override root uno.config.ts', async () => {
    const tempDir = path.join(TEMP_ROOT, `unocss-config-path-${crypto.randomUUID()}`)
    const customConfigPath = path.resolve(tempDir, 'configs', 'uno.alt.ts')

    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(path.dirname(customConfigPath), { recursive: true })

    await fs.writeFile(
      path.join(tempDir, 'uno.config.ts'),
      `export default { blocklist: ['foo'] }\n`,
      'utf8',
    )
    await fs.writeFile(
      customConfigPath,
      `export default { blocklist: ['bar'] }\n`,
      'utf8',
    )

    const eslint = new ESLint({
      cwd: tempDir,
      overrideConfig: asOverrideConfig(await icebreaker({
        unocss: {
          strict: true,
          configPath: customConfigPath,
        },
      }).toConfigs()),
      overrideConfigFile: true,
    })

    const [result] = await eslint.lintText(
      `export const Demo = () => <div className="foo bar" />\n`,
      {
        filePath: path.join(tempDir, 'demo.jsx'),
      },
    )

    expect(result?.messages.some(message => message.message.includes('"foo" is in blocklist'))).toBe(false)
    expect(result?.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: 'unocss/blocklist',
        message: expect.stringContaining('"bar" is in blocklist'),
      }),
    ]))
  })
})

describe('tailwind integration', () => {
  it('uses a resolvable default cssConfigPath for eslint-plugin-tailwindcss', async () => {
    const tempDir = path.join(ROOT_DIR, `.tmp-tailwindcss-default-${crypto.randomUUID()}`)
    const filePath = path.join(tempDir, 'src', 'App.jsx')

    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.mkdir(path.join(tempDir, 'node_modules'), { recursive: true })
    await fs.symlink(
      TAILWIND_RUNTIME_DIR,
      path.join(tempDir, 'node_modules', 'tailwindcss'),
      'dir',
    )
    await fs.writeFile(
      filePath,
      'export function App() { return <div className="text-red-500 flex" /> }\n',
      'utf8',
    )

    try {
      const eslint = new ESLint({
        cwd: tempDir,
        overrideConfig: asOverrideConfig(await icebreaker({
          react: true,
          tailwindcss: true,
        }).toConfigs()),
        overrideConfigFile: true,
      })

      const config = await eslint.calculateConfigForFile(filePath)
      expect(config.rules?.['tailwindcss/classnames-order']).toBeDefined()
      expect(config.settings?.tailwindcss).toMatchObject({
        cssConfigPath: expect.stringContaining('tailwindcss'),
      })

      const [result] = await eslint.lintFiles([filePath])
      expect(result?.messages.filter(message => message.fatal)).toEqual([])
    }
    finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('does not apply better-tailwindcss rules to package.json when enabled', async () => {
    const tempDir = path.join(ROOT_DIR, `.tmp-tailwind-package-json-${crypto.randomUUID()}`)
    const entryPoint = path.join(tempDir, 'src', 'style.css')
    const packageJsonPath = path.join(tempDir, 'package.json')
    const vueFilePath = path.join(tempDir, 'src', 'App.vue')

    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(path.dirname(entryPoint), { recursive: true })
    await fs.writeFile(entryPoint, '@import "tailwindcss";\n', 'utf8')
    await fs.writeFile(packageJsonPath, '{\n  "name": "tailwind-fixture"\n}\n', 'utf8')
    await fs.writeFile(
      vueFilePath,
      '<template><div class="flex flex"></div></template>\n',
      'utf8',
    )

    try {
      const eslint = new ESLint({
        cwd: tempDir,
        overrideConfig: asOverrideConfig(await icebreaker({
          vue: true,
          betterTailwindcss: {
            entryPoint,
          },
        }).toConfigs()),
        overrideConfigFile: true,
      })

      const packageJsonConfig = await eslint.calculateConfigForFile(packageJsonPath)
      const packageJsonTailwindRules = Object.keys(packageJsonConfig.rules ?? {}).filter(ruleId =>
        ruleId.startsWith('better-tailwindcss/'),
      )
      expect(packageJsonTailwindRules).toEqual([])

      const [packageJsonResult] = await eslint.lintText(
        '{\n  "name": "tailwind-fixture"\n}\n',
        { filePath: packageJsonPath },
      )
      expect(packageJsonResult?.messages).toEqual([])

      const [vueResult] = await eslint.lintText(
        '<template><div class="flex flex"></div></template>\n',
        { filePath: vueFilePath },
      )
      expect(vueResult?.messages).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'better-tailwindcss/no-duplicate-classes',
        }),
      ]))
    }
    finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})
