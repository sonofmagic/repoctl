# `tailwindcss/no-invalid-theme-function`

Disallows `theme(...)` calls that reference missing Tailwind theme paths.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `theme(colors.not-exist.123)`

This rule resolves the consuming project's Tailwind runtime and validates the
theme path against the real v3 or v4 theme data when available.

## Why

Invalid `theme(...)` paths often survive code review because they look
plausible and are only caught later in integration or visual testing.

## ✅ Recommended

- Reference real theme paths from the consuming Tailwind config
- Keep `theme(...)` usage aligned with validated design tokens

## ❌ Avoid

- Guessing at theme paths that only look plausible
- Shipping broken `theme(...)` lookups that fail late in integration

## When To Enable

Enable this when `theme(...)` is still allowed in your codebase and you want
configuration-aware validation of the referenced theme path.

## Examples

### ✅ Good

```css
/* ✅ Good: this path exists in a typical Tailwind theme. */
.button {
  color: theme(colors.red.500);
}
```

### ❌ Bad

```css
/* ❌ Bad: this theme path does not exist and should be reported. */
.button {
  color: theme(colors.not-exist.123);
}
```
