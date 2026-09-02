import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import { collectImportDirectives } from 'postcss-tailwindcss'
import stylelintModule from 'stylelint'
import { TAILWINDCSS_NO_IMPORT_DIRECTIVE_RULE_NAME } from './constants'
import { createNoImportDirectiveMessages } from './messages'

type RuleResult = stylelint.PostcssResult

export function createNoImportDirectiveRuleFunction(ruleName: string) {
  const ruleMessages = createNoImportDirectiveMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      const directives = collectImportDirectives(root as unknown as PostcssRoot)

      for (const directive of directives) {
        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(directive.importTarget),
          node: directive.node as never,
        })
      }
    }
  }) as unknown as StylelintRule
}

export const noImportDirectiveRuleFunction = createNoImportDirectiveRuleFunction(
  TAILWINDCSS_NO_IMPORT_DIRECTIVE_RULE_NAME,
)
