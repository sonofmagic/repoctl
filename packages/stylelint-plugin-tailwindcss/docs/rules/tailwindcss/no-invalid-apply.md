# `tailwindcss/no-invalid-apply`

Disallows invalid Tailwind utility candidates inside `@apply`.

## Included In

- `base`: yes
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `@apply bg-rd-500`

This rule uses the resolved Tailwind runtime, so validation is based on the
consuming project's actual Tailwind version and config. If Tailwind cannot be
resolved from the linted file, the rule skips validation instead of guessing.

## Why

Typos inside `@apply` are easy to miss because they still look like valid
utility syntax.

## ✅ Recommended

- Use only valid utilities when `@apply` is still allowed in your project
- Rely on runtime-aware validation to catch misspellings early

## ❌ Avoid

- Misspelled utility candidates that only look correct at a glance
- Assuming `@apply` tokens are valid without checking resolved Tailwind config

## When To Enable

Enable this when `@apply` is still allowed in your codebase but you want
runtime-aware validation for candidates.

## Examples

### ✅ Good

```css
/* ✅ Good: every utility candidate is valid in Tailwind. */
.button {
  @apply bg-red-500 rounded-lg;
}
```

### ❌ Bad

```css
/* ❌ Bad: bg-rd-500 is a typo and should be reported. */
.button {
  @apply bg-rd-500 rounded-lg;
}
```
