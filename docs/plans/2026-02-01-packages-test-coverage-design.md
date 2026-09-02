# Packages Test Coverage Design

Date: 2026-02-01
Status: Draft (validated)

## Context

We need test cases that reflect the real behavior of every package under
`packages/`, while staying fully offline. The packages are:

- `@icebreakers/eslint-config`
- `@icebreakers/stylelint-config`
- `@icebreakers/commitlint-config`
- `@icebreakers/changelog-github`

Current tests are mostly unit-level. This plan adds integration-style coverage
using the same APIs real users invoke (ESLint/Stylelint/Commitlint/Changesets),
plus a minimal CLI smoke test where relevant.

## Goals

- Cover real-world execution paths for all packages.
- Validate outputs, not just internal functions.
- Keep all tests fully offline and deterministic.
- Reuse existing fixtures where possible and keep new fixtures minimal.

## Non-Goals

- End-to-end CI that hits external services (GitHub API).
- Benchmarking or performance tuning.
- Rewriting existing unit tests.

## Constraints

- Must be completely offline.
- Tests should run in Vitest with existing workspace config.
- Avoid mutating repository files; use temp directories for any write/fix flows.

## Test Strategy

Recommended approach: API-first integration tests + minimal CLI smoke tests.
This keeps tests stable while still covering real behavior.

### Cross-cutting approach

- Create `*.integration.test.ts` under each package’s `test/` directory.
- Use `/tmp/icebreaker-*` for any write/fix operations.
- Prefer explicit asserts (ruleId, counts, output files) over broad snapshots.
- Mock external API clients (`@changesets/get-github-info`).

## Package Test Matrix

### @icebreakers/eslint-config

Primary coverage uses ESLint’s Node API and the repo fixtures:
`packages/eslint/_fixtures/*` and `packages/eslint/fixtures/output/*`.

Test cases:

1. all
   - Config: `typescript`, `vue`, `svelte`, `astro`
   - Run ESLint with `fix: true` on copied fixture dir.
   - Assert output matches `fixtures/output/all`.

2. with-formatters
   - Config: `formatters: true`
   - Assert markdown output matches `fixtures/output/with-formatters`.

3. no-markdown-with-formatters
   - Config: `markdown: false`, `formatters.markdown: true`
   - Assert markdown is not reformatted.

4. no-style
   - Config: `stylistic: false`
   - Assert style rules do not rewrite input.

5. tab-double-quotes
   - Config: `stylistic: { indent: 'tab', quotes: 'double' }`
   - Assert output uses tabs and double quotes.

Rule-branch assertions (lint messages):

- `weapp`: verify `vue/singleline-html-element-content-newline` behavior for
  mini-program elements.
- `ionic`: verify `vue/no-deprecated-slot-attribute` is disabled.
- `nestjs`: ensure `ts/no-empty-function` allows decorated functions.

Implementation note:
copy fixtures to `/tmp/icebreaker-eslint/<case>`, run `ESLint.lintFiles()`,
apply `ESLint.outputFixes`, then diff outputs to expected files.

### @icebreakers/stylelint-config

Use `stylelint.lint` against `packages/stylelint/fixtures/*`.

Test cases:

1. defaults: allow `rpx`, `page`, and Tailwind/UnoCSS at-rules.
2. ignores: replace and append ignore lists to trigger or suppress errors.
3. presets: disable `vue`/`order` presets and assert `extends` list changes.
4. CLI smoke: import the CLI entry and ensure `.vscode/settings.json` writes
   include `stylelint.validate`.

Assertions:

- ruleId and severity for failures (`unit-no-unknown`, `scss/at-rule-no-unknown`)
- expected warning counts are stable

### @icebreakers/commitlint-config

Use `@commitlint/lint` with the generated config.

Test cases:

1. default config: valid vs invalid commit headers.
2. `types` extensions: new types accepted, prompt metadata merged.
3. `scope` constraints: enum + required + case.
4. `subject` rules: empty and case constraints.
5. `header` length limits.

Assertions:

- `valid` boolean
- `errors` and `warnings` include expected rule names

### @icebreakers/changelog-github

Call exported `getReleaseLine` / `getDependencyReleaseLine` with mocked
`@changesets/get-github-info`.

Test cases:

1. Missing repo throws.
2. Summary tags parse `pr`, `commit`, `author` and override links.
3. Detail block formatting for list/paragraph/code fence inputs.
4. Dependency line for 0, ≤3, and >3 dependencies.

Assertions:

- Exact string output (trimmed as needed)
- Ensure mocked API functions are invoked with correct params

## Fixtures & Data

- Reuse `packages/eslint/_fixtures` and `packages/eslint/fixtures/output`.
- Reuse `packages/stylelint/fixtures`.
- Create any additional lint samples inside each package’s `fixtures/` dir.
- For API mocks, inline data in tests; no network calls.

## Implementation Notes

- Use `fs-extra` or `node:fs` for temp dir setup.
- Keep per-test cleanup in `afterEach`.
- Avoid running `pnpm` commands inside tests; use Node API directly.

## Acceptance Criteria

- Each package has at least one integration test that exercises real behavior.
- ESLint integration tests validate both lint messages and fixed outputs.
- Stylelint/Commitlint/Changelog tests validate real outputs and key branches.
- All tests pass offline and are deterministic.
