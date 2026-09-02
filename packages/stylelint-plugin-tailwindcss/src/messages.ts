import stylelint from 'stylelint'
import {
  NO_APPLY_RULE_NAME,
  NO_ARBITRARY_VALUE_RULE_NAME,
  NO_ATOMIC_CLASS_RULE_NAME,
  NO_INVALID_APPLY_RULE_NAME,
} from './constants'

function getFrameworkDisplayName(ruleName: string) {
  return ruleName.startsWith('unocss/') ? 'UnoCSS' : 'Tailwind CSS'
}

export function createMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (className: string) =>
      `Unexpected ${framework} utility selector ".${className}"`,
  })
}

export function createNoInvalidApplyMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (className: string) =>
      `Unexpected invalid ${framework} @apply candidate "${className}"`,
  })
}

export function createNoApplyMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: () => `Unexpected ${framework} @apply directive`,
  })
}

export function createNoArbitraryValueMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (className: string) =>
      `Unexpected ${framework} arbitrary value candidate "${className}"`,
  })
}

export function createNoThemeFunctionMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (raw: string) =>
      `Unexpected ${framework} theme() call "${raw}"`,
  })
}

export function createNoInvalidThemeFunctionMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (raw: string) =>
      `Unexpected invalid ${framework} theme() call "${raw}"`,
  })
}

export function createNoScreenDirectiveMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: () => `Unexpected ${framework} @screen directive`,
  })
}

export function createNoTailwindDirectiveMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (name: string) => `Unexpected ${framework} @${name} directive`,
  })
}

export function createNoImportDirectiveMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (target: string) =>
      `Unexpected ${framework} import directive "${target}"`,
  })
}

export function createNoCssLayerMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (layerName: string) =>
      `Unexpected ${framework} @layer directive "${layerName}"`,
  })
}

export function createNoVariantGroupMessages(ruleName: string) {
  const framework = getFrameworkDisplayName(ruleName)
  return stylelint.utils.ruleMessages(ruleName, {
    rejected: (candidate: string) =>
      `Unexpected ${framework} variant group "${candidate}"`,
  })
}

export const messages = createMessages(NO_ATOMIC_CLASS_RULE_NAME)

export const noInvalidApplyMessages = createNoInvalidApplyMessages(
  NO_INVALID_APPLY_RULE_NAME,
)

export const noApplyMessages = createNoApplyMessages(NO_APPLY_RULE_NAME)

export const noArbitraryValueMessages = createNoArbitraryValueMessages(
  NO_ARBITRARY_VALUE_RULE_NAME,
)
