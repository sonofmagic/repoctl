import type { ChangelogFunctions } from '@changesets/types'
import changelogFunctions, {
  formatHeadline,
  getDependencyReleaseLine,
  getReleaseLine,
  parseConventionalHeadline,
} from '@icebreakers/changelog-github'
import { expectType } from 'tsd'

expectType<ChangelogFunctions>(changelogFunctions)
expectType<ChangelogFunctions['getDependencyReleaseLine']>(getDependencyReleaseLine)
expectType<ChangelogFunctions['getReleaseLine']>(getReleaseLine)
expectType<{ text: string, breaking: boolean }>(formatHeadline('feat: add smoke test'))
expectType<{
  type?: string | undefined
  scope?: string | undefined
  breaking: boolean
  description: string
}>(parseConventionalHeadline('feat(core)!: add smoke test'))
