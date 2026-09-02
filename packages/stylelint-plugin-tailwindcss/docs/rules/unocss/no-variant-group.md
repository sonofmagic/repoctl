# `unocss/no-variant-group`

Disallows UnoCSS variant groups.

## Included In

- `base`: no
- `recommended`: yes
- `strict`: yes

Reports examples like:

- `hover:(bg-red-500 text-white)`
- `sm:(flex items-center)`

Use this rule when grouped utility syntax should stay out of authored
stylesheets.

## Why

Variant groups are concise, but they also introduce a framework-specific mini
language into authored CSS.

## ✅ Recommended

- Keep authored CSS explicit and readable without grouped utility syntax
- Use plain declarations or keep grouped utilities in markup only

## ❌ Avoid

- Packing multiple utility decisions into UnoCSS variant groups in CSS
- Introducing framework-specific shorthand that is harder to scan in reviews

## When To Enable

Enable this when UnoCSS grouped syntax should stay in markup or be avoided
entirely in stylesheet code.

## Examples

### ✅ Good

```css
/* ✅ Good: state styles stay explicit in plain CSS. */
.button:hover {
  background-color: red;
  color: white;
}
```

### ❌ Bad

```css
/* ❌ Bad: variant groups add a framework-specific mini language to CSS. */
.button {
  @apply hover:(bg-red-500 text-white);
}
```
