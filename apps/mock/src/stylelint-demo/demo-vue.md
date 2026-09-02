# `DemoStylelint.vue`

This file shows the same policy checks inside Vue SFC style blocks for
the `tailwindcss/*` namespace. The `unocss/*` rules are disabled at file
level so the IDE output stays focused. The file is still checked under
the app's normal recommended preset, not the plugin `base` preset.

Passing cases:

- semantic selectors in the plain `<style scoped>` block
- semantic selectors in the `<style lang="scss" scoped>` block

Failing cases:

- utility selectors such as `.text-center`, `.sm\:hidden`, `.justify-between`, `.lg\:grid`
- arbitrary selectors such as `.w-\[10px\]` and `.\[mask-type\:luminance\]`
- `@apply` usage inside the SCSS block

Rules demonstrated:

- `tailwindcss/no-atomic-class`
- `tailwindcss/no-arbitrary-value`
- `tailwindcss/no-apply`
