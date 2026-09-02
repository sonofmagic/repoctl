# `unocss/no-invalid-apply`

Disallows invalid utility-like candidates inside `@apply` when they look like
UnoCSS or utility-first shorthand.

## Included In

- `base`: yes
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `@apply bg-rd-500`
- `@apply justify-betwen items-cneter`

This rule focuses on candidate validity rather than banning `@apply` itself.
It discovers the nearest `uno.config.*` or `unocss.config.*` and validates with
the official UnoCSS generator. If no config is available, it skips validation.

It only reports tokens that still look utility-like.

- semantic tokens such as `button-base` are ignored
- misspelled utility-like tokens such as `bg-rd-500` are reported
- bare-value forms such as `w-10px` and `text-rgb(255,0,0)` can also be
  reported here when they fail the validity check
- bracket-form arbitrary candidates such as `w-[10px]` are primarily covered by
  `unocss/no-arbitrary-value`

## Why

Invalid utility candidates inside `@apply` are hard to spot and often look
close enough to real utilities.

## ✅ Recommended

- Use valid utility candidates when `@apply` is intentionally allowed
- Let validation catch typos before they ship into shared styles

## ❌ Avoid

- Misspelled utility-like tokens such as `bg-rd-500`
- Trusting visually similar shorthands without actual candidate validation

## When To Enable

Enable this when `@apply` is still allowed for UnoCSS-style usage but you want
candidate validation.

## Examples

### ✅ Good

```css
/* ✅ Good: every utility candidate is spelled correctly. */
.button {
  @apply bg-red-500 rounded-lg;
}
```

### ❌ Bad

```css
/* ❌ Bad: these utility-like tokens are misspelled and should be reported. */
.button {
  @apply bg-rd-500 rounded-lg;
}
```
