# Stylelint Demo

Open these files in your IDE with the Stylelint extension enabled.

These demos run under the app's normal `stylelint.config.mjs`, which uses the
full `@icebreakers/stylelint-config` preset. In other words, they validate
against the recommended rule set, not the plugin `base` preset.

The Tailwind-focused and UnoCSS-focused files only disable the opposite
namespace at file level so the diagnostics stay readable. They are not using a
reduced preset.

Expected behavior:

- semantic selectors such as `.page-shell`, `.card__body`, `.demo-panel`, `.button-primary`, `.uno-shell`, and `.uno-demo-panel` should pass
- Tailwind utility selectors such as `.flex`, `.grid`, `.hover\:bg-red-500`, `.w-\[10px\]` should fail with `tailwindcss/no-atomic-class` in the Tailwind-focused demo files
- UnoCSS utility selectors such as `.flex`, `.grid`, `.hover\:bg-red-500`, `.w-\[10px\]` should fail with `unocss/no-atomic-class` in the UnoCSS-focused demo files
- any `@apply` usage should fail with `tailwindcss/no-apply` or `unocss/no-apply`
- invalid `@apply` candidates such as `bg-rd-500` should fail with `tailwindcss/no-invalid-apply` or `unocss/no-invalid-apply`
- arbitrary values / arbitrary properties such as `.w-\[10px\]`, `.w-10px`, `.top--10px`, `.bg-\$brand`, `.text-rgb\(255\,0\,0\)`, `.translate-x-50\%`, `.\[mask-type\:luminance\]`, and `@apply w-[10px]` should fail with `tailwindcss/no-arbitrary-value` or `unocss/no-arbitrary-value`
- `theme(...)` should fail with `tailwindcss/no-theme-function`
- invalid theme paths such as `theme(colors.not-exist.123)` should fail with `tailwindcss/no-invalid-theme-function`
- `@screen` and `@layer` should fail with the matching Tailwind directive rules
- `@tailwind` and `@import "tailwindcss"` remain legal examples because they are valid Tailwind entry syntax and are not enabled by the recommended preset
- UnoCSS variant groups such as `hover:(bg-red-500 text-white)` should fail with `unocss/no-variant-group`
- CSS, SCSS, and Vue SFC style blocks should all be checked
- the formatting demo should be auto-fixable with `stylelint --fix`, covering quoted attribute selectors, quoted `url(...)`, modern color notation, and shorthand collapse

Files:

- `demo.css` focuses on Tailwind selector pass/fail pairs
- `demo.scss` adds Tailwind `@apply`, `theme()`, and directive policy cases
- `DemoStylelint.vue` shows the same Tailwind-focused rules inside Vue SFC `<style>` blocks
- `demo-unocss.css` focuses on UnoCSS selector pass/fail pairs
- `demo-unocss.scss` adds UnoCSS `@apply`, arbitrary value, and variant-group cases
- `demo-formatting.css` shows the conservative autofix behavior enabled by `formattingPreset: 'safe'`
- `demo-unocss.md` explains the UnoCSS-specific demo files
- `demo-css.md`, `demo-scss.md`, `demo-vue.md` are the GitHub-targeted walkthrough pages linked from the demo component
- `demo-formatting.md` explains the safe formatting preset demo

Terminal check:

```bash
pnpm --dir apps/mock run lint:styles:demo
```

Fixable formatting check:

```bash
pnpm --dir apps/mock run lint:styles:formatting
```

Autofix check for the dedicated formatting demo:

```bash
pnpm --dir apps/mock run lint:styles:formatting:fix
```
