import { loadMonorepoToolingModule } from './tooling/load-tooling-module.mjs'

const { defineLintStagedConfig } = await loadMonorepoToolingModule()

function shellQuote(file) {
  return `'${file.replaceAll(`'`, `'\\''`)}'`
}

function isStylelintDemoFile(file) {
  return file.includes('/apps/mock/src/stylelint-demo/')
    || file.startsWith('apps/mock/src/stylelint-demo/')
}

function isGeneratedFixtureOutput(file) {
  return file.includes('/packages/eslint/fixtures/output/')
    || file.startsWith('packages/eslint/fixtures/output/')
}

function createStylelintCommand(files) {
  const filteredFiles = files.filter(file => !isStylelintDemoFile(file) && !isGeneratedFixtureOutput(file))

  if (filteredFiles.length === 0) {
    return []
  }

  return [`stylelint --fix --allow-empty-input ${filteredFiles.map(shellQuote).join(' ')}`]
}

const toolingConfig = await defineLintStagedConfig()

export {
  createStylelintCommand,
  isGeneratedFixtureOutput,
  isStylelintDemoFile,
}

export default {
  ...toolingConfig,
  '*.vue': [
    'eslint --fix',
    createStylelintCommand,
  ],
  '*.{css,scss,sass,less}': createStylelintCommand,
}
