# `demo-unocss.css` and `demo-unocss.scss`

These files isolate the `unocss/*` namespace by disabling the
`tailwindcss/*` rules at file level. They are still validated by the
app's normal recommended preset, not the plugin `base` preset.

Passing cases:

- semantic selectors such as `.uno-shell`, `.uno-card__body--primary`,
  `.uno-demo-panel`, and `.uno-semantic-button`
- nested semantic selectors such as `&__content`
- UnoCSS at-rules such as `@unocss preflights`

Failing cases:

- utility selectors such as `.flex`, `.grid`, `.items-center`,
  `.hover\:bg-red-500`, `.md\:flex`
- arbitrary selectors such as `.w-\[10px\]`, `.w-10px`, `.top--10px`,
  `.bg-\$brand`, `.translate-x-50\%`, and `.\[mask-type\:luminance\]`
- `@apply` usage
- invalid utility-like `@apply` candidates such as `bg-rd-500`
- UnoCSS variant groups such as `hover:(bg-red-500 text-white)`

`unocss/no-invalid-apply` boundaries in `demo-unocss.css`:

- reports `.uno-apply-invalid-color` because `bg-rd-500` looks like a
  utility token but is not recognized as a valid one
- reports `.uno-apply-invalid-alignment` because `justify-betwen` and
  `items-cneter` still look utility-like even though they are misspelled
- does not report `.uno-apply-valid-spacing` because `rounded-lg` and `px-4`
  are valid utility candidates
- does not report `.uno-apply-semantic-token` because `button-base` does not
  look like a utility token at all
- does not report `.uno-apply-bracket-arbitrary` because bracket-form arbitrary
  candidates such as `w-[10px]` and `[mask-type:luminance]` are handled by
  `unocss/no-arbitrary-value`
- does report `.uno-apply-bare-arbitrary` because bare-value forms such as
  `w-10px`, `text-rgb(255,0,0)`, and `translate-x-50%` both look utility-like
  and fail the validity check, so they hit `unocss/no-arbitrary-value` and
  `unocss/no-invalid-apply`
- does not report `.uno-apply-variant-group` because that example is covered
  by `unocss/no-variant-group`

Rules demonstrated:

- `unocss/no-atomic-class`
- `unocss/no-invalid-apply`
- `unocss/no-apply`
- `unocss/no-arbitrary-value`
- `unocss/no-variant-group`
