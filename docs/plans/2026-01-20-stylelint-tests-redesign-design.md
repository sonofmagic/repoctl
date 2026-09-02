# Stylelint Package Test Redesign (2026-01-20)

## Context

The current `packages/stylelint` tests include real stylelint execution and filesystem writes.
This slows the suite and reduces determinism. The goal is to reach high coverage with lightweight
unit tests and mocks.

## Goals

- Achieve >= 95% coverage (lines/branches/functions/statements) for `packages/stylelint/src`.
- Replace integration tests with fast, deterministic unit tests.
- Cover every module (`config`, `utils`, `shared`, `index`, `cli`, `constants`).

## Non-Goals

- End-to-end validation against real stylelint behavior.
- Exercising external stylelint presets at runtime.

## Approach

1. Remove `stylelint.test.ts` (integration) in favor of unit tests.
2. Add module-focused unit tests:
   - `config.unit.test.ts`: presets toggles, extends merging, overrides and rules merging,
     and resolution fallbacks when `require.resolve` fails.
   - `utils.unit.test.ts`: `toArray`, `unique`, `resolveIgnoreList`, `normalizeExtends`.
   - `shared.unit.test.ts`: `setVscodeSettingsJson` with empty, array, and non-array inputs.
   - `index.unit.test.ts`: `icebreaker` merge behavior and `createStylelintConfig` re-export.
   - `constants.unit.test.ts` and `types.unit.test.ts`: lightweight coverage imports.
   - `cli.unit.test.ts`: mock `fs`, `process`, `comment-json` to test init/update branches
     without writing files.
3. Enforce coverage thresholds in `packages/stylelint/vitest.config.ts`.

## Testing

- `pnpm --filter @icebreakers/stylelint-config test`
- `pnpm test` to verify overall workspace status
