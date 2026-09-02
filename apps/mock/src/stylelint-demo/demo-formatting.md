# `demo-formatting.css`

This file demonstrates the conservative autofix layer enabled by
`formattingPreset: 'safe'` in the mock app's `stylelint.config.mjs`.

Expected `stylelint --fix` changes:

- `.format-card[data-state=open]` becomes `.format-card[data-state="open"]`
- four `margin-*` declarations collapse into `margin: 8px 12px`
- `rgba(15, 98, 254, 0.5)` becomes `rgb(15 98 254 / 50%)`
- `url(icon.svg)` becomes `url("icon.svg")`

This demo is intentionally about fixable conventions, not lint failures.
It should pass after autofix without needing any file-level disables.
