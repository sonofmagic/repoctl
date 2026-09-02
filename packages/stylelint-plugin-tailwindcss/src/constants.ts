export const TAILWINDCSS_NAMESPACE = 'tailwindcss'
export const UNOCSS_NAMESPACE = 'unocss'

function createRuleName(namespace: string, ruleName: string) {
  return `${namespace}/${ruleName}`
}

export const TAILWINDCSS_NO_ATOMIC_CLASS_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-atomic-class',
) as 'tailwindcss/no-atomic-class'
export const TAILWINDCSS_NO_INVALID_APPLY_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-invalid-apply',
) as 'tailwindcss/no-invalid-apply'
export const TAILWINDCSS_NO_APPLY_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-apply',
) as 'tailwindcss/no-apply'
export const TAILWINDCSS_NO_ARBITRARY_VALUE_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-arbitrary-value',
) as 'tailwindcss/no-arbitrary-value'
export const TAILWINDCSS_NO_THEME_FUNCTION_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-theme-function',
) as 'tailwindcss/no-theme-function'
export const TAILWINDCSS_NO_INVALID_THEME_FUNCTION_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-invalid-theme-function',
) as 'tailwindcss/no-invalid-theme-function'
export const TAILWINDCSS_NO_SCREEN_DIRECTIVE_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-screen-directive',
) as 'tailwindcss/no-screen-directive'
export const TAILWINDCSS_NO_TAILWIND_DIRECTIVE_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-tailwind-directive',
) as 'tailwindcss/no-tailwind-directive'
export const TAILWINDCSS_NO_IMPORT_DIRECTIVE_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-import-directive',
) as 'tailwindcss/no-import-directive'
export const TAILWINDCSS_NO_CSS_LAYER_RULE_NAME = createRuleName(
  TAILWINDCSS_NAMESPACE,
  'no-css-layer',
) as 'tailwindcss/no-css-layer'

export const UNOCSS_NO_ATOMIC_CLASS_RULE_NAME = createRuleName(
  UNOCSS_NAMESPACE,
  'no-atomic-class',
) as 'unocss/no-atomic-class'
export const UNOCSS_NO_INVALID_APPLY_RULE_NAME = createRuleName(
  UNOCSS_NAMESPACE,
  'no-invalid-apply',
) as 'unocss/no-invalid-apply'
export const UNOCSS_NO_APPLY_RULE_NAME = createRuleName(
  UNOCSS_NAMESPACE,
  'no-apply',
) as 'unocss/no-apply'
export const UNOCSS_NO_ARBITRARY_VALUE_RULE_NAME = createRuleName(
  UNOCSS_NAMESPACE,
  'no-arbitrary-value',
) as 'unocss/no-arbitrary-value'
export const UNOCSS_NO_VARIANT_GROUP_RULE_NAME = createRuleName(
  UNOCSS_NAMESPACE,
  'no-variant-group',
) as 'unocss/no-variant-group'

export const NO_ATOMIC_CLASS_RULE_NAME = TAILWINDCSS_NO_ATOMIC_CLASS_RULE_NAME
export const NO_INVALID_APPLY_RULE_NAME = TAILWINDCSS_NO_INVALID_APPLY_RULE_NAME
export const NO_APPLY_RULE_NAME = TAILWINDCSS_NO_APPLY_RULE_NAME
export const NO_ARBITRARY_VALUE_RULE_NAME = TAILWINDCSS_NO_ARBITRARY_VALUE_RULE_NAME
