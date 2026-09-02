import type { UserPromptConfig } from '@commitlint/types'

export function mergePrompts(
  base: UserPromptConfig | undefined,
  override: UserPromptConfig | undefined,
): UserPromptConfig | undefined {
  if (!base && !override) {
    return undefined
  }

  if (!base) {
    return override
  }

  if (!override) {
    return base
  }

  return {
    ...base,
    ...override,
    questions: {
      ...(base.questions ?? {}),
      ...(override.questions ?? {}),
    },
  }
}
