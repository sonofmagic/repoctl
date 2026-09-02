# ESLint Package Test Redesign (2026-01-20)

## Context

The current tests under `packages/eslint/test` mix unit and heavy integration coverage (filesystem
fixtures, ESLint runs, and external plugin behavior). This makes coverage uneven and slow. The
goal is to reach 95%+ coverage on `packages/eslint/src` by replacing heavy integration tests with
lightweight unit tests and mocks.

## Goals

- Achieve >= 95% coverage (lines/branches/functions/statements) for `packages/eslint/src`.
- Keep tests fast and deterministic via mocks.
- Ensure each `src` module has direct, explicit unit coverage.

## Non-Goals

- End-to-end lint validation against real projects.
- Verifying external plugin behavior beyond interface contracts.

## Approach

1. Replace or remove the integration-heavy tests:
   - `fixtures.test.ts`, `lint.test.ts`, `order.test.ts`.
2. Add or expand unit tests by module:
   - `options.unit.test.ts`: cover `resolveUserOptions`, `createBaseRuleSet`, Vue version rules,
     and boolean/object/undefined branches.
   - `defaults.unit.test.ts`: cover ionic/weapp and nestjs branches.
   - `features.unit.test.ts`: keep dynamic import tests with `vi.mock` for all plugins.
   - `preset.unit.test.ts`: validate order and legacy mode behavior, with a light snapshot.
   - `factory.unit.test.ts`: mock `antfu` and `getPresets` to validate parameter forwarding.
   - `index.unit.test.ts`: confirm re-exports to ensure entry coverage.
3. Enforce coverage thresholds in `packages/eslint/vitest.config.ts`:
   - `lines`, `branches`, `functions`, `statements` set to 95.

## Compatibility Notes

- Focus stays on module behavior rather than external plugin runtime.
- Test changes do not alter exported APIs.

## Testing

- Run `pnpm --filter @icebreakers/eslint-config test`.
- Coverage should fail if below thresholds, ensuring sustained >= 95%.
