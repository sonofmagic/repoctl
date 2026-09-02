# Options Dedup Design (2026-01-20)

## Context

`packages/eslint/src/options.ts` contains duplicated logic for merging user options with defaults
(handling `undefined`, `true`, and object shapes) for both `vue` and `typescript`.

## Goals

- Reduce duplicated merge logic while keeping behavior stable.
- Keep public API and exports unchanged.
- Limit changes to `packages/eslint/src/options.ts`.

## Non-Goals

- Changing default rule sets or config outputs.
- Refactoring other modules (`features.ts`, `defaults.ts`).
- Introducing new runtime dependencies.

## Approach

Introduce a small internal helper to normalize and merge option values. The helper accepts the
user-provided value, the default object, and an optional post-process callback. It returns:

- default object when input is `undefined` or `true`.
- merged object (via `defu`) when input is a plain object.
- the original value otherwise (e.g. `false`).

`resolveUserOptions` will call this helper for `vue` and `typescript` and pass
`applyVueVersionSpecificRules` as the Vue post-process hook. `BASE_DEFAULTS` and `BASE_RULES`
remain unchanged.

## Data Flow

1. `resolveUserOptions` merges `BASE_DEFAULTS` with user options using `defu`.
2. `mergeOptionWithDefaults` normalizes `vue` and `typescript` inputs.
3. Vue post-processing applies version-specific rule overrides when `vue` is an object.
4. The resolved options are returned as `ResolvedUserOptions`.

## Error Handling

No new error paths. The helper only merges when the input is an object; other values are
returned unchanged, preserving existing permissive behavior.

## Compatibility Notes

- `vue: false` and `typescript: false` remain supported and unchanged.
- `__applyVueVersionSpecificRules` stays exported.
- The shape of `ResolvedUserOptions` remains the same.

## Testing

Optional unit tests could cover `vue`/`typescript` values (`undefined`, `true`, object, `false`),
but the change can be shipped without new tests to keep scope small.
