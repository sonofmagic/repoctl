# `tailwindcss/no-theme-function`

Disallows any `theme(...)` usage in declarations and at-rule params.

## Included In

- `base`: no
- `recommended`: no
- `strict`: yes

Reports examples like:

- `color: theme(colors.gray.900 / 75%)`
- `margin: theme(spacing[2.5])`

Use this rule when token access should be mediated through CSS variables or
other project-specific abstractions.

This rule is exported, but not enabled by the default `recommended` preset.

## Why

Direct `theme(...)` calls couple authored stylesheets to Tailwind theme lookup
syntax.

## ✅ Recommended

- Consume tokens through CSS variables or your design-system abstraction
- Keep authored stylesheets independent from raw Tailwind theme lookup syntax

## ❌ Avoid

- Calling `theme(...)` directly from feature CSS
- Coupling local stylesheets to Tailwind's configuration structure

## When To Enable

Enable this when tokens should flow through CSS variables, design-system mixins,
or another project-specific layer instead of raw Tailwind theme lookups.

## Examples

### ✅ Good

```css
/* ✅ Good: tokens are consumed through project-level abstractions. */
.button {
  color: var(--color-text-primary);
}
```

### ❌ Bad

```css
/* ❌ Bad: raw theme() lookups leak Tailwind config details into CSS. */
.button {
  color: theme(colors.gray.900 / 75%);
}
```
