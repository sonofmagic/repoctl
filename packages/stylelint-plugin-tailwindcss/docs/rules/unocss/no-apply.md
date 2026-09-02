# `unocss/no-apply`

Disallows any UnoCSS-oriented `@apply` usage.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `@apply rounded-lg px-4`

Use this rule when utility composition should stay out of authored stylesheets.

## Why

Banning `@apply` removes one more stylesheet-level escape hatch and keeps
utility composition outside authored CSS.

## ✅ Recommended

- Keep composition visible in markup or component code
- Write semantic selectors with ordinary CSS declarations

## ❌ Avoid

- Reintroducing utility composition inside authored CSS with `@apply`
- Hiding framework-specific styling decisions inside feature stylesheets

## When To Enable

Enable this when your team does not want UnoCSS-style `@apply` usage at all.

## Examples

### ✅ Good

```css
/* ✅ Good: authored CSS stays semantic and self-contained. */
.button {
  border-radius: 0.5rem;
  padding-inline: 1rem;
}
```

### ❌ Bad

```css
/* ❌ Bad: @apply adds an extra utility-composition layer to CSS. */
.button {
  @apply rounded-lg px-4;
}
```
