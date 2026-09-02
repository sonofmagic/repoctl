import type { Root as PostcssRoot } from 'postcss'
import type { Rule as StylelintRule } from 'stylelint'
import type stylelint from 'stylelint'
import { collectApplyCandidates } from 'postcss-tailwindcss'
import stylelintModule from 'stylelint'
import { NO_INVALID_APPLY_RULE_NAME } from './constants'
import { isLikelyUtilityClass } from './heuristics'
import { createNoInvalidApplyMessages } from './messages'
import { hasTailwindRuntime, isTailwindUtilityClass } from './runtime'

type RuleResult = stylelint.PostcssResult
type UtilityClassDetector = (className: string, fromFile?: string) => Promise<boolean>
type UtilityRuntimeDetector = (fromFile?: string) => Promise<boolean>

export function createNoInvalidApplyRuleFunction(
  ruleName: string,
  isUtilityClass: UtilityClassDetector = isTailwindUtilityClass,
  hasUtilityRuntime: UtilityRuntimeDetector = hasTailwindRuntime,
) {
  const ruleMessages = createNoInvalidApplyMessages(ruleName)
  return ((primary: unknown) => {
    return async (root: PostcssRoot, result: RuleResult) => {
      const validOptions = stylelintModule.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
      })

      if (!validOptions || primary !== true) {
        return
      }

      const filePath = root.source?.input.file
      const applyEntries = collectApplyCandidates(root as unknown as PostcssRoot)

      for (const entry of applyEntries) {
        if (!isLikelyUtilityClass(entry.candidate)) {
          continue
        }

        if (!await hasUtilityRuntime(filePath)) {
          continue
        }

        if (await isUtilityClass(entry.candidate, filePath)) {
          continue
        }

        const params = entry.node.params
        const index = params.indexOf(entry.candidate)
        const endIndex = index === -1 ? undefined : index + entry.candidate.length

        stylelintModule.utils.report({
          result,
          ruleName,
          message: ruleMessages.rejected(entry.candidate),
          node: entry.node as never,
          ...(index !== -1 ? { index } : {}),
          ...(endIndex !== undefined ? { endIndex } : {}),
        })
      }
    }
  }) as unknown as StylelintRule
}

export const noInvalidApplyRuleFunction = createNoInvalidApplyRuleFunction(
  NO_INVALID_APPLY_RULE_NAME,
)
