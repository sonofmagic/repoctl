import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import stylelintModule from 'stylelint'
import { TAILWINDCSS_NO_SCREEN_DIRECTIVE_RULE_NAME } from './constants'
import { createNoScreenDirectiveMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoScreenDirectiveRuleFunction(ruleName: string) {
  const ruleMessages = createNoScreenDirectiveMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      root.walkAtRules('screen', (atRule) => {
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

export const noScreenDirectiveRuleFunction = createNoScreenDirectiveRuleFunction(
  TAILWINDCSS_NO_SCREEN_DIRECTIVE_RULE_NAME,
)
