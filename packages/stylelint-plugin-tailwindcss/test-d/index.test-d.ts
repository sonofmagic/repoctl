import defaultConfig, {
  base,
  isTailwindUtilityClass,
  noApplyPlugin,
  noApplyRuleName,
  noAtomicClassPlugin,
  noAtomicClassRuleName,
  noInvalidThemeFunctionRuleName,
  noThemeFunctionRuleName,
  recommended,
  strict,
  tailwindRecommended,
  tailwindStrict,
  UNOCSS_NO_APPLY_RULE_NAME,
  UNOCSS_NO_VARIANT_GROUP_RULE_NAME,
  unocssRecommended,
  unocssStrict,
} from 'stylelint-plugin-tailwindcss'
import { expectAssignable, expectType } from 'tsd'

expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(defaultConfig)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(base)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(recommended)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(strict)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(tailwindRecommended)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(tailwindStrict)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(unocssRecommended)
expectAssignable<{ plugins: unknown[], rules: Record<string, true> }>(unocssStrict)
expectAssignable<object>(noAtomicClassPlugin)
expectAssignable<object>(noApplyPlugin)
expectType<'tailwindcss/no-atomic-class'>(noAtomicClassRuleName)
expectType<'tailwindcss/no-apply'>(noApplyRuleName)
expectType<'tailwindcss/no-invalid-theme-function'>(noInvalidThemeFunctionRuleName)
expectType<'tailwindcss/no-theme-function'>(noThemeFunctionRuleName)
expectType<'unocss/no-apply'>(UNOCSS_NO_APPLY_RULE_NAME)
expectType<'unocss/no-variant-group'>(UNOCSS_NO_VARIANT_GROUP_RULE_NAME)
expectType<Promise<boolean>>(isTailwindUtilityClass('flex'))
