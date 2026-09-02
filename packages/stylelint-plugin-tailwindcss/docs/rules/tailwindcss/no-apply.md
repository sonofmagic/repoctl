# `tailwindcss/no-apply`

Disallows any Tailwind `@apply` usage.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `@apply rounded-lg px-4`

Use this rule when your team wants utility composition to stay out of authored
stylesheets.

## Why

Banning `@apply` avoids a second composition system in CSS and keeps utility
usage in markup or component code.

## ✅ Recommended

- Use semantic selectors and regular CSS declarations in authored stylesheets
- Keep utility composition in markup, templates, or component code

## ❌ Avoid

- Recreating a second utility-composition layer with `@apply`
- Hiding Tailwind composition inside feature-local CSS

## When To Enable

Enable this when your team has decided that `@apply` should not be part of the
authoring model at all.

## Examples

### ✅ Good

```css
/* ✅ Good: semantic selectors keep styling decisions in authored CSS. */
.button {
  border-radius: 0.5rem;
  padding-inline: 1rem;
}
```

### ❌ Bad

```css
/* ❌ Bad: @apply introduces a second composition system in CSS. */
.button {
  @apply rounded-lg px-4;
}
```
