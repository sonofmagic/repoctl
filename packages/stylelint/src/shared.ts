export type VscodeSettings = Record<string, unknown>

const STYLELINT_LANGUAGES = ['vue', 'css', 'scss'] as const
const ESLINT_STYLE_LANGUAGES = ['css', 'less', 'scss', 'pcss', 'postcss'] as const

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((entry): entry is string => typeof entry === 'string')
}

export function setVscodeSettingsJson(json: VscodeSettings = {}): VscodeSettings {
  json['css.validate'] = false
  json['less.validate'] = false
  json['scss.validate'] = false

  const existing = new Set(asStringArray(json['stylelint.validate']))
  for (const language of STYLELINT_LANGUAGES) {
    existing.add(language)
  }

  const eslintValidate = asStringArray(json['eslint.validate']).filter((language) => {
    return !ESLINT_STYLE_LANGUAGES.includes(language as typeof ESLINT_STYLE_LANGUAGES[number])
  })

  json['stylelint.validate'] = [...existing]
  if (eslintValidate.length > 0) {
    json['eslint.validate'] = eslintValidate
  }
  else {
    delete json['eslint.validate']
  }

  return json
}
