# `unocss/no-atomic-class`

Disallows authored UnoCSS-style utility selectors in stylesheets.

## Included In

- `base`: yes
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `.flex`
- `.grid`
- `.hover\:bg-red-500`

Allows semantic selectors such as `.table-and-form`, `.flex-layout`, and
`.rounded-card`.

The rule discovers the nearest `uno.config.*` or `unocss.config.*` from the
linted file and validates selectors with the official UnoCSS generator. Without
a config, it produces no match instead of guessing from prefixes.

Use this rule when utility selectors should stay in templates or markup.

## Why

This keeps UnoCSS-style utilities from becoming authored selector APIs inside
stylesheets.

## ✅ Recommended

- Name selectors after components, layouts, or semantics
- Keep utility composition in templates instead of authored CSS

## ❌ Avoid

- Writing `.flex`, `.grid`, or other UnoCSS utilities as authored selectors
- Treating utility selectors as a public stylesheet API

## When To Enable

Enable this when utility selectors belong in templates only and stylesheet code
should stay semantic.

## Examples

### ✅ Good

```css
/* ✅ Good: semantic selectors communicate intent clearly. */
.card {
  padding: 16px;
}
```

### ❌ Bad

```css
/* ❌ Bad: this recreates UnoCSS utilities in authored CSS. */
.flex {
  display: flex;
}
```
