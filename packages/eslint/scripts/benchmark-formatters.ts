import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { ESLint } from 'eslint'
import format from 'eslint-plugin-format'
import { format as formatWithOxfmt } from 'oxfmt'
import prettier from 'prettier'
import { icebreaker } from '../src/index'

interface Summary {
  label: string
  maxMs: number
  meanMs: number
  medianMs: number
  minMs: number
  runs: number[]
}

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname)
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..')
const INPUT_ROOT = path.join(ROOT_DIR, 'fixtures', 'input')
const TMP_ROOT = path.join(os.tmpdir(), 'icebreaker-eslint-bench')
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? '8')
const WARMUPS = Number(process.env.BENCH_WARMUPS ?? '2')
const FILE_COPIES = Number(process.env.BENCH_FILE_COPIES ?? '60')

const GRAPHQL_SAMPLE = [
  'type Query {',
  '  hello: String',
  '  user(id: ID!): User',
  '}',
  '',
  'type User {',
  '  id: ID!',
  '  name: String',
  '  bio: String',
  '}',
].join('\n')

const TS_SAMPLE = [
  'import type { Foo } from "./types"',
  'import { ref, computed } from "vue"',
  '',
  'export const useDemo = <T extends Foo>(input:T[]) => {',
  '  const count=ref(input.length)',
  '  const mapped=computed(()=>input.map((item,index)=>({index,label:item.name ?? "unknown",value:item.value+index})))',
  '  function logCurrent(){console.log("count",count.value)}',
  '  return { count, mapped, logCurrent }',
  '}',
].join('\n')

const JSX_SAMPLE = [
  'import { useMemo } from "react"',
  '',
  'export function DemoComponent({items}){',
  '  const names=useMemo(()=>items.map(item=>item.name).filter(Boolean),[items])',
  '  return <section className="demo"><h1>{"Hello"}</h1><ul>{names.map((name,index)=><li key={index}>{name}</li>)}</ul></section>',
  '}',
].join('\n')

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

function formatMs(value: number) {
  return `${value.toFixed(2)} ms`
}

function createSummary(label: string, runs: number[]): Summary {
  return {
    label,
    meanMs: mean(runs),
    medianMs: median(runs),
    minMs: Math.min(...runs),
    maxMs: Math.max(...runs),
    runs,
  }
}

function compare(current: Summary, previous: Summary) {
  const deltaMs = previous.meanMs - current.meanMs
  const deltaPct = previous.meanMs === 0
    ? 0
    : deltaMs / previous.meanMs * 100
  const speedup = current.meanMs === 0
    ? Number.POSITIVE_INFINITY
    : previous.meanMs / current.meanMs

  return {
    current,
    previous,
    deltaMs,
    deltaPct,
    speedup,
  }
}

function renderComparison(title: string, result: ReturnType<typeof compare>) {
  const direction = result.deltaMs >= 0 ? 'faster' : 'slower'
  const absoluteDeltaMs = Math.abs(result.deltaMs)
  const absoluteDeltaPct = Math.abs(result.deltaPct)

  return [
    `## ${title}`,
    `- current: ${formatMs(result.current.meanMs)} mean, ${formatMs(result.current.medianMs)} median`,
    `- previous: ${formatMs(result.previous.meanMs)} mean, ${formatMs(result.previous.medianMs)} median`,
    `- delta: ${formatMs(absoluteDeltaMs)} ${direction} (${absoluteDeltaPct.toFixed(2)}%)`,
    `- speedup: ${result.speedup.toFixed(3)}x`,
    '',
  ].join('\n')
}

async function ensureDir(dir: string) {
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })
}

async function moduleAvailable(name: string) {
  try {
    await import(name)
    return true
  }
  catch {
    return false
  }
}

async function readFixture(name: string) {
  return fs.readFile(path.join(INPUT_ROOT, name), 'utf8')
}

async function createFormatterHeavyCorpus(root: string) {
  await ensureDir(root)
  const css = await readFixture('css.css')
  const html = await readFixture('html.html')

  for (let index = 0; index < FILE_COPIES; index++) {
    await fs.writeFile(path.join(root, `sample-${index}.css`), css, 'utf8')
    await fs.writeFile(path.join(root, `sample-${index}.html`), html, 'utf8')
    await fs.writeFile(path.join(root, `sample-${index}.graphql`), GRAPHQL_SAMPLE, 'utf8')
  }
}

async function createRepoLikeCorpus(root: string) {
  await ensureDir(root)
  await fs.cp(INPUT_ROOT, root, { recursive: true })
  await fs.writeFile(path.join(root, 'extra.graphql'), GRAPHQL_SAMPLE, 'utf8')
}

async function createScriptHeavyCorpus(root: string) {
  await ensureDir(root)

  for (let index = 0; index < FILE_COPIES; index++) {
    await fs.writeFile(path.join(root, `sample-${index}.ts`), TS_SAMPLE, 'utf8')
    await fs.writeFile(path.join(root, `sample-${index}.tsx`), JSX_SAMPLE, 'utf8')
  }
}

async function benchRepeated(label: string, task: () => Promise<void>) {
  const runs: number[] = []

  for (let index = 0; index < WARMUPS + ITERATIONS; index++) {
    const start = process.hrtime.bigint()
    await task()
    const end = process.hrtime.bigint()
    if (index >= WARMUPS) {
      runs.push(Number(end - start) / 1e6)
    }
  }

  return createSummary(label, runs)
}

async function benchPureFormatter() {
  const css = await readFixture('css.css')
  const html = await readFixture('html.html')
  const workloads = Array.from({ length: FILE_COPIES }, (_, index) => ({
    cssPath: path.join(TMP_ROOT, `pure-${index}.css`),
    htmlPath: path.join(TMP_ROOT, `pure-${index}.html`),
    graphqlPath: path.join(TMP_ROOT, `pure-${index}.graphql`),
  }))

  await ensureDir(TMP_ROOT)

  const oxfmtSummary = await benchRepeated('pure-oxfmt', async () => {
    for (const workload of workloads) {
      await formatWithOxfmt(workload.cssPath, css, {
        semi: false,
        singleQuote: true,
      })
      await formatWithOxfmt(workload.htmlPath, html, {
        semi: false,
        singleQuote: true,
      })
      await formatWithOxfmt(workload.graphqlPath, GRAPHQL_SAMPLE, {
        semi: false,
        singleQuote: true,
      })
    }
  })

  const prettierSummary = await benchRepeated('pure-prettier', async () => {
    for (const workload of workloads) {
      await prettier.format(css, {
        filepath: workload.cssPath,
        parser: 'css',
      })
      await prettier.format(html, {
        filepath: workload.htmlPath,
        parser: 'html',
      })
      await prettier.format(GRAPHQL_SAMPLE, {
        filepath: workload.graphqlPath,
        parser: 'graphql',
      })
    }
  })

  return compare(oxfmtSummary, prettierSummary)
}

async function benchPureScriptFormatter() {
  const workloads = Array.from({ length: FILE_COPIES }, (_, index) => ({
    tsPath: path.join(TMP_ROOT, `pure-${index}.ts`),
    tsxPath: path.join(TMP_ROOT, `pure-${index}.tsx`),
  }))

  await ensureDir(TMP_ROOT)

  const oxfmtSummary = await benchRepeated('pure-script-oxfmt', async () => {
    for (const workload of workloads) {
      await formatWithOxfmt(workload.tsPath, TS_SAMPLE, {
        semi: false,
        singleQuote: true,
      })
      await formatWithOxfmt(workload.tsxPath, JSX_SAMPLE, {
        semi: false,
        singleQuote: true,
        jsxSingleQuote: true,
      })
    }
  })

  const prettierSummary = await benchRepeated('pure-script-prettier', async () => {
    for (const workload of workloads) {
      await prettier.format(TS_SAMPLE, {
        filepath: workload.tsPath,
        parser: 'typescript',
        semi: false,
        singleQuote: true,
      })
      await prettier.format(JSX_SAMPLE, {
        filepath: workload.tsxPath,
        parser: 'typescript',
        semi: false,
        singleQuote: true,
        jsxSingleQuote: true,
      })
    }
  })

  return compare(oxfmtSummary, prettierSummary)
}

function createFormatterOnlyConfig(engine: 'oxfmt' | 'prettier') {
  const cssRule = engine === 'oxfmt'
    ? ['error', { semi: false, singleQuote: true }]
    : ['error', { parser: 'css' }]
  const htmlRule = engine === 'oxfmt'
    ? ['error', { semi: false, singleQuote: true }]
    : ['error', { parser: 'html' }]
  const graphqlRule = engine === 'oxfmt'
    ? ['error', { semi: false, singleQuote: true }]
    : ['error', { parser: 'graphql' }]
  const ruleName = engine === 'oxfmt' ? 'format/oxfmt' : 'format/prettier'

  return [
    {
      files: ['**/*.css'],
      languageOptions: { parser: format.parserPlain },
      plugins: { format },
      rules: {
        [ruleName]: cssRule,
      },
    },
    {
      files: ['**/*.html'],
      languageOptions: { parser: format.parserPlain },
      plugins: { format },
      rules: {
        [ruleName]: htmlRule,
      },
    },
    {
      files: ['**/*.graphql'],
      languageOptions: { parser: format.parserPlain },
      plugins: { format },
      rules: {
        [ruleName]: graphqlRule,
      },
    },
  ]
}

function createScriptFormatterOnlyConfig(engine: 'oxfmt' | 'prettier') {
  const ruleName = engine === 'oxfmt' ? 'format/oxfmt' : 'format/prettier'
  const tsRule = engine === 'oxfmt'
    ? ['error', { semi: false, singleQuote: true, jsxSingleQuote: true }]
    : ['error', { parser: 'typescript', semi: false, singleQuote: true, jsxSingleQuote: true }]

  return [
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: { parser: format.parserPlain },
      plugins: { format },
      rules: {
        [ruleName]: tsRule,
      },
    },
  ]
}

async function benchEslintScenario(
  label: string,
  options: Record<string, unknown>,
  filesGlob: string,
  prepareCorpus: (root: string) => Promise<void>,
) {
  const hasAstro = await moduleAvailable('eslint-plugin-astro')
  const hasSvelte = await moduleAvailable('eslint-plugin-svelte')
  const normalized = JSON.parse(JSON.stringify(options)) as Record<string, unknown>

  if (!hasAstro && normalized.astro) {
    normalized.astro = false
  }
  if (!hasSvelte && normalized.svelte) {
    normalized.svelte = false
  }

  return benchRepeated(label, async () => {
    const workdir = path.join(TMP_ROOT, `${label}-${crypto.randomUUID()}`)
    await prepareCorpus(workdir)
    const configs = await icebreaker(normalized).toConfigs()
    const eslint = new ESLint({
      cwd: workdir,
      fix: true,
      overrideConfig: configs,
      overrideConfigFile: true,
    })
    const results = await eslint.lintFiles([filesGlob])
    await ESLint.outputFixes(results)
    await fs.rm(workdir, { recursive: true, force: true })
  })
}

async function benchFormatterOnlyScenario(label: string, engine: 'oxfmt' | 'prettier') {
  const config = createFormatterOnlyConfig(engine)

  return benchRepeated(label, async () => {
    const workdir = path.join(TMP_ROOT, `${label}-${crypto.randomUUID()}`)
    await createFormatterHeavyCorpus(workdir)
    const eslint = new ESLint({
      cwd: workdir,
      fix: true,
      overrideConfig: config,
      overrideConfigFile: true,
    })
    const results = await eslint.lintFiles(['**/*.{css,html,graphql}'])
    await ESLint.outputFixes(results)
    await fs.rm(workdir, { recursive: true, force: true })
  })
}

async function benchScriptFormatterOnlyScenario(label: string, engine: 'oxfmt' | 'prettier') {
  const config = createScriptFormatterOnlyConfig(engine)

  return benchRepeated(label, async () => {
    const workdir = path.join(TMP_ROOT, `${label}-${crypto.randomUUID()}`)
    await createScriptHeavyCorpus(workdir)
    const eslint = new ESLint({
      cwd: workdir,
      fix: true,
      overrideConfig: config,
      overrideConfigFile: true,
    })
    const results = await eslint.lintFiles(['**/*.{ts,tsx}'])
    await ESLint.outputFixes(results)
    await fs.rm(workdir, { recursive: true, force: true })
  })
}

async function main() {
  const pure = await benchPureFormatter()
  const pureScripts = await benchPureScriptFormatter()

  const formatterOnlyCurrent = await benchFormatterOnlyScenario('eslint-formatter-only-oxfmt', 'oxfmt')
  const formatterOnlyPrevious = await benchFormatterOnlyScenario('eslint-formatter-only-prettier', 'prettier')
  const formatterOnlyScriptsCurrent = await benchScriptFormatterOnlyScenario('eslint-formatter-only-script-oxfmt', 'oxfmt')
  const formatterOnlyScriptsPrevious = await benchScriptFormatterOnlyScenario('eslint-formatter-only-script-prettier', 'prettier')

  const repoCurrent = await benchEslintScenario(
    'eslint-full-default',
    { typescript: true, vue: true, svelte: true, astro: true },
    '**/*.{js,jsx,ts,tsx,vue,md,html,xml,css,toml,graphql,astro,svelte}',
    createRepoLikeCorpus,
  )
  const repoPrevious = await benchEslintScenario(
    'eslint-full-prettier',
    {
      typescript: true,
      vue: true,
      svelte: true,
      astro: true,
      formatters: {
        css: 'prettier',
        html: 'prettier',
        graphql: 'prettier',
        markdown: true,
      },
    },
    '**/*.{js,jsx,ts,tsx,vue,md,html,xml,css,toml,graphql,astro,svelte}',
    createRepoLikeCorpus,
  )

  const output = [
    '# Formatter Benchmark',
    '',
    `- iterations: ${ITERATIONS}`,
    `- warmups: ${WARMUPS}`,
    `- file copies: ${FILE_COPIES}`,
    '',
    renderComparison('Pure Formatter (CSS/HTML/GraphQL)', pure),
    renderComparison('Pure Formatter (TS/TSX)', pureScripts),
    renderComparison('ESLint Formatter-Only (CSS/HTML/GraphQL)', compare(formatterOnlyCurrent, formatterOnlyPrevious)),
    renderComparison('ESLint Formatter-Only (TS/TSX)', compare(formatterOnlyScriptsCurrent, formatterOnlyScriptsPrevious)),
    renderComparison('ESLint Full Config', compare(repoCurrent, repoPrevious)),
  ].join('\n')

  console.log(output)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
