# `tailwindcss/no-atomic-class`

Disallows authored Tailwind utility selectors in stylesheets.

## Included In

- `base`: yes
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `.flex`
- `.grid`
- `.hover\:bg-red-500`

Allows semantic selectors such as:

- `.page-shell`
- `.card__body`
- `.table-and-form`
- `.flex-layout`

The rule resolves the consuming project's Tailwind v3 or v4 runtime and only
reports selectors accepted by that runtime. If Tailwind cannot be resolved from
the linted file, the rule produces no match instead of guessing from prefixes.

Use this rule when utility classes should stay in template or markup code.

## Why

This keeps authored styles semantic and prevents utility selectors from
becoming an alternate styling layer inside CSS files.

## ✅ Recommended

- Author semantic selectors such as component or layout class names
- Keep utility classes in templates where composition is easier to see

## ❌ Avoid

- Writing Tailwind utility selectors directly in authored CSS
- Turning utilities like `.flex` into a stylesheet-level public API

## When To Enable

Enable this when your team wants utility classes in templates only and
semantic class names in authored stylesheets.

## Examples

### ✅ Good

```css
/* ✅ Good: semantic selectors describe the role of the element. */
.card {
  padding: 16px;
}
```

### ❌ Bad

```css
/* ❌ Bad: this recreates Tailwind utilities inside the stylesheet. */
.flex {
  display: flex;
}
```
