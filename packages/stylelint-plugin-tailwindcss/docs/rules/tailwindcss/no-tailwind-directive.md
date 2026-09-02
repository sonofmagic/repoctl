# `tailwindcss/no-tailwind-directive`

Disallows Tailwind entry directives inside authored stylesheets.

## Included In

- `base`: no
- `recommended`: no
- `strict`: yes

Reports examples like:

- `@tailwind base`
- `@tailwind utilities`

Use this rule when framework entrypoints should stay in dedicated setup files.

## Why

`@tailwind` directives are usually build-entry concerns rather than
feature-stylesheet concerns.

## ✅ Recommended

- Keep Tailwind bootstrapping in dedicated global entry files
- Let feature stylesheets focus on semantic selectors and declarations

## ❌ Avoid

- Dropping `@tailwind` directives into component or business stylesheets
- Mixing framework setup with ordinary feature styling

## When To Enable

Enable this when Tailwind setup should live in a dedicated global entry file,
not inside business or component stylesheets.

## Examples

### ✅ Good

```css
/* ✅ Good: feature stylesheets contain only feature styles. */
.button {
  font-weight: 600;
}
```

### ❌ Bad

```css
/* ❌ Bad: @tailwind belongs in a dedicated setup entry, not here. */
@tailwind utilities;
```
