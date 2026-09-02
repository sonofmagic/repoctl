# `tailwindcss/no-import-directive`

Disallows Tailwind entry imports such as `@import "tailwindcss"`.

## Included In

- `base`: no
- `recommended`: no
- `strict`: yes

Reports examples like:

- `@import "tailwindcss"`
- `@import "tailwindcss/utilities.css"`

Use this rule when Tailwind imports should stay in dedicated entry stylesheets.

## Why

Tailwind entry imports are part of framework bootstrapping and are easy to
scatter accidentally across feature stylesheets.

## ✅ Recommended

- Keep Tailwind imports in a small number of dedicated entry files
- Let feature stylesheets contain only business or component styles

## ❌ Avoid

- Importing Tailwind from random component or feature stylesheets
- Duplicating framework bootstrapping concerns across the codebase

## When To Enable

Enable this when only a small number of entry files should be responsible for
loading Tailwind.

## Examples

### ✅ Good

```css
/* ✅ Good: feature-local CSS stays focused on feature styling. */
.dialog {
  border-radius: 0.75rem;
}
```

### ❌ Bad

```css
/* ❌ Bad: Tailwind entry imports should live in a dedicated entry file. */
@import 'tailwindcss';
```
