# `demo.scss`

This file focuses on SCSS nesting, `@apply`, `theme()`, and Tailwind
directive policy checks for the `tailwindcss/*` namespace. The
`unocss/*` rules are disabled at file level so the IDE output stays
focused. The file is still checked under the app's normal recommended
preset, not the plugin `base` preset.

Passing cases:

- semantic selectors such as `.demo-panel` and `.semantic-button`
- nested semantic selectors such as `&__content`

Failing cases:

- `.button-with-apply` because `@apply` is disallowed
- `.button-with-invalid-apply` because `bg-rd-500` is not a valid Tailwind candidate
- `.button-with-arbitrary-apply` because arbitrary values are disallowed
- `.button-with-theme` because any `theme(...)` usage is disallowed
- `.button-with-invalid-theme` because it uses `theme(...)` and the theme path does not exist
- `@screen md` because `@screen` is disallowed
- `@layer utilities` because authored `@layer` directives are disallowed
- utility selectors such as `.grid`, `.items-center`, `.md\:flex`, `.w-\[10px\]`

Rules demonstrated:

- `tailwindcss/no-apply`
- `tailwindcss/no-invalid-apply`
- `tailwindcss/no-atomic-class`
- `tailwindcss/no-arbitrary-value`
- `tailwindcss/no-theme-function`
- `tailwindcss/no-invalid-theme-function`
- `tailwindcss/no-screen-directive`
- `tailwindcss/no-css-layer`
