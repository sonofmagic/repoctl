import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import stylelintModule from 'stylelint'
import { NO_APPLY_RULE_NAME } from './constants'
import { createNoApplyMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoApplyRuleFunction(ruleName: string) {
  const ruleMessages = createNoApplyMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      root.walkAtRules('apply', (atRule) => {
        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(),
          node: atRule as never,
        })
      })
    }
  }) as unknown as StylelintRule
}

export const noApplyRuleFunction = createNoApplyRuleFunction(NO_APPLY_RULE_NAME)
