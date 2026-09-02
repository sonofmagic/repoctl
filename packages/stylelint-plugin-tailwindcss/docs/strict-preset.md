# `strict` Preset

`strict` is the highest policy layer exported by
`stylelint-plugin-tailwindcss`.

Use it when your team wants authored stylesheets to stay almost entirely free
of Tailwind-specific or UnoCSS-specific authoring syntax, not just utility
selectors.

## Positioning

The package now exposes three layers:

- `base`: low-noise starting point
- `recommended`: practical default
- `strict`: architecture-oriented policy layer

`recommended` focuses on utility selectors, `@apply`, arbitrary values, and
invalid Tailwind theme lookups.

`strict` goes further and also enables the more opinionated Tailwind rules that
many teams only want in stricter codebases:

- `tailwindcss/no-theme-function`
- `tailwindcss/no-screen-directive`
- `tailwindcss/no-tailwind-directive`
- `tailwindcss/no-import-directive`
- `tailwindcss/no-css-layer`

## Exported Presets

### `strict`

Enables both namespaces.

Tailwind rules:

- `tailwindcss/no-atomic-class`
- `tailwindcss/no-invalid-apply`
- `tailwindcss/no-apply`
- `tailwindcss/no-arbitrary-value`
- `tailwindcss/no-theme-function`
- `tailwindcss/no-invalid-theme-function`
- `tailwindcss/no-screen-directive`
- `tailwindcss/no-tailwind-directive`
- `tailwindcss/no-import-directive`
- `tailwindcss/no-css-layer`

UnoCSS rules:

- `unocss/no-atomic-class`
- `unocss/no-invalid-apply`
- `unocss/no-apply`
- `unocss/no-arbitrary-value`
- `unocss/no-variant-group`

### `tailwindStrict`

Tailwind-only version of `strict`.

### `unocssStrict`

UnoCSS-only version of `strict`.

At the moment, `unocssStrict` is intentionally the same as
`unocssRecommended`, because there are no additional UnoCSS-specific rules yet
that naturally create a stricter tier.

## Usage

```ts
import { strict } from 'stylelint-plugin-tailwindcss'

export default strict
```

```ts
import { tailwindStrict } from 'stylelint-plugin-tailwindcss'

export default tailwindStrict
```

Opt out of the riskiest rule if your codebase uses native cascade layers:

```ts
import { strict } from 'stylelint-plugin-tailwindcss'

export default {
  ...strict,
  rules: {
    ...strict.rules,
    'tailwindcss/no-css-layer': false,
  },
}
```

## Tradeoffs

`strict` is intentionally more opinionated than `recommended`.

It is a good fit when:

- feature stylesheets should stay semantic
- Tailwind entry directives and imports should live only in dedicated setup
  files
- responsive syntax should stay on native `@media`
- `theme(...)` should be replaced with CSS variables or a project abstraction

It may be too strict when:

- teams still allow `theme(...)` in local authored styles
- feature stylesheets legitimately use Tailwind setup directives
- the project uses native cascade layers heavily and does not want them flagged

The most important caveat is `tailwindcss/no-css-layer`: it will also match
authored `@layer` usage even when that usage is native CSS rather than Tailwind
architecture.
