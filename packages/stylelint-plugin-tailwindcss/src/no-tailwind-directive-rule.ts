import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import stylelintModule from 'stylelint'
import { TAILWINDCSS_NO_TAILWIND_DIRECTIVE_RULE_NAME } from './constants'
import { createNoTailwindDirectiveMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoTailwindDirectiveRuleFunction(ruleName: string) {
  const ruleMessages = createNoTailwindDirectiveMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      root.walkAtRules('tailwind', (atRule) => {
        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(atRule.name),
          node: atRule as never,
        })
      })
    }
  }) as unknown as StylelintRule
}

export const noTailwindDirectiveRuleFunction = createNoTailwindDirectiveRuleFunction(
  TAILWINDCSS_NO_TAILWIND_DIRECTIVE_RULE_NAME,
)
