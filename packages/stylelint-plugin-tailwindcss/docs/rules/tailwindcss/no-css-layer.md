# `tailwindcss/no-css-layer`

Disallows authored `@layer` directives.

## Included In

- `base`: no
- `recommended`: no
- `strict`: yes

Reports examples like:

- `@layer utilities { ... }`
- `@layer components { ... }`

Use this rule when layer composition should stay centralized rather than spread
across feature stylesheets.

This rule is exported, but not enabled by the default `recommended` preset
because it can also match native CSS cascade layers.

## Why

Authored `@layer` blocks can make layer ordering and ownership harder to reason
about across a large codebase.

## ✅ Recommended

- Keep feature stylesheets focused on plain selectors and declarations
- Centralize layer ownership in dedicated setup or entry stylesheets

## ❌ Avoid

- Spreading `@layer` blocks across many feature files
- Mixing framework-level cascade management into local business styles

## When To Enable

Enable this when Tailwind layer declarations should stay in a central stylesheet
or build entry instead of feature-local CSS.

## Examples

### ✅ Good

```css
/* ✅ Good: feature styles stay plain and local. */
.button {
  color: red;
}
```

### ❌ Bad

```css
/* ❌ Bad: layer composition is now hidden inside a feature stylesheet. */
@layer utilities {
  .button {
    color: red;
  }
}
```
