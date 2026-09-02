# `tailwindcss/no-screen-directive`

Disallows the Tailwind `@screen` directive.

## Included In

- `base`: no
- `recommended`: no
- `strict`: yes

Reports examples like:

- `@screen md { ... }`

Use this rule when breakpoint usage should stay on native `@media` or a
centralized responsive abstraction.

This rule is exported, but not enabled by the default `recommended` preset.

## Why

`@screen` hides the actual media query and makes responsive behavior more
Tailwind-specific inside authored stylesheets.

## ✅ Recommended

- Prefer native `@media` so responsive behavior stays explicit
- Keep breakpoint logic readable without framework-specific indirection

## ❌ Avoid

- Hiding media queries behind Tailwind-specific `@screen` syntax
- Making feature CSS depend on framework alias resolution

## When To Enable

Enable this when your team prefers native `@media` or another centralized
responsive layer instead of Tailwind screen aliases in CSS.

## Examples

### ✅ Good

```css
/* ✅ Good: native media queries make the actual breakpoint explicit. */
@media (min-width: 768px) {
  .button {
    color: red;
  }
}
```

### ❌ Bad

```css
/* ❌ Bad: @screen hides the real media query behind Tailwind syntax. */
@screen md {
  .button {
    color: red;
  }
}
```
