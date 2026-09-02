import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import stylelintModule from 'stylelint'
import { TAILWINDCSS_NO_CSS_LAYER_RULE_NAME } from './constants'
import { createNoCssLayerMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoCssLayerRuleFunction(ruleName: string) {
  const ruleMessages = createNoCssLayerMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      root.walkAtRules('layer', (atRule) => {
        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(atRule.params || '(anonymous)'),
          node: atRule as never,
        })
      })
    }
  }) as unknown as StylelintRule
}

export const noCssLayerRuleFunction = createNoCssLayerRuleFunction(
  TAILWINDCSS_NO_CSS_LAYER_RULE_NAME,
)
