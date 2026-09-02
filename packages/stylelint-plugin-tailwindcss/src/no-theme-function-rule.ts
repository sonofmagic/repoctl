import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import { collectThemeCalls } from 'postcss-tailwindcss'
import stylelintModule from 'stylelint'
import { TAILWINDCSS_NO_THEME_FUNCTION_RULE_NAME } from './constants'
import { createNoThemeFunctionMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoThemeFunctionRuleFunction(ruleName: string) {
  const ruleMessages = createNoThemeFunctionMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      const themeCalls = collectThemeCalls(root as unknown as PostcssRoot)

      for (const call of themeCalls) {
        const rawSource = 'value' in call.node ? call.node.value : call.node.params
        const lookupValue = `theme(${call.raw})`
        const index = rawSource.indexOf(lookupValue)
        const endIndex = index === -1 ? undefined : index + lookupValue.length

        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(call.raw),
          node: call.node as never,
          ...(index !== -1 ? { index } : {}),
          ...(endIndex !== undefined ? { endIndex } : {}),
        })
      }
    }
  }) as unknown as StylelintRule
}

export const noThemeFunctionRuleFunction = createNoThemeFunctionRuleFunction(
  TAILWINDCSS_NO_THEME_FUNCTION_RULE_NAME,
)
