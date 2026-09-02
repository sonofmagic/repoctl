# `unocss/no-arbitrary-value`

Disallows UnoCSS arbitrary values, arbitrary properties, and bare-value forms.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `w-[10px]`
- `w-10px`
- `w-50%`
- `top--10px`
- `bg-$brand`

This rule intentionally covers forms that are valid in UnoCSS but are outside
Tailwind's bracket-only arbitrary value style.

## Why

UnoCSS makes it easy to reach for raw values, but that can quickly bypass token
usage and consistency rules.

## ✅ Recommended

- Reuse tokens, CSS variables, or named semantic selectors
- Keep UnoCSS usage aligned with your agreed utility and token surface

## ❌ Avoid

- Encoding one-off raw values directly into utility-like selectors
- Using arbitrary property forms as an escape hatch in authored CSS

## When To Enable

Enable this when you want to allow utility-first styling but still block ad-hoc
values in authored stylesheets.

## Examples

### ✅ Good

```css
/* ✅ Good: semantic selectors rely on stable tokens or readable values. */
.avatar {
  width: var(--size-avatar-sm);
}

.tooltip {
  top: calc(var(--space-2) * -1);
}
```

### ❌ Bad

```css
/* ❌ Bad: bare-value utility selectors bypass the normal token flow. */
.w-10px {
  width: 10px;
}

/* ❌ Bad: raw negative values encoded into selectors are hard to standardize. */
.top--10px {
  top: -10px;
}
```
