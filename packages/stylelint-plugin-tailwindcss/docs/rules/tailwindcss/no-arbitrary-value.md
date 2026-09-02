# `tailwindcss/no-arbitrary-value`

Disallows Tailwind-style arbitrary values and arbitrary properties.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `w-[10px]`
- `[mask-type:luminance]`

This rule is scoped to Tailwind-style bracket syntax. UnoCSS bare-value forms
such as `w-10px` are handled by `unocss/no-arbitrary-value`.

## Why

Bracket arbitrary values are powerful, but they are also an easy escape hatch
that bypasses your token system and agreed utility surface.

## ✅ Recommended

- Reuse design tokens, CSS variables, or agreed semantic classes
- Keep authored styles aligned with your team's predefined utility surface

## ❌ Avoid

- Reaching for one-off bracket values like `w-[10px]`
- Encoding arbitrary properties directly into utility-style selectors

## When To Enable

Enable this when you allow Tailwind utilities but want to restrict ad-hoc
values in authored stylesheets.

## Examples

### ✅ Good

```css
/* ✅ Good: reuse semantic selectors and stable values or tokens. */
.avatar {
  width: var(--size-avatar-sm);
}

.mask-luminance {
  mask-type: luminance;
}
```

### ❌ Bad

```css
/* ❌ Bad: bracket arbitrary values bypass the agreed token surface. */
.w-\[10px\] {
  width: 10px;
}

/* ❌ Bad: arbitrary properties make selectors harder to standardize. */
.\[mask-type\:luminance\] {
  mask-type: luminance;
}
```
