import { setVscodeSettingsJson } from '@/shared'

describe('setVscodeSettingsJson', () => {
  it('adds default validations when no stylelint.validate exists', () => {
    const result = setVscodeSettingsJson({})

    expect(result['css.validate']).toBe(false)
    expect(result['less.validate']).toBe(false)
    expect(result['scss.validate']).toBe(false)
    expect(result['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
    expect(result).not.toHaveProperty('eslint.validate')
  })

  it('keeps existing validate entries and filters non-string items', () => {
    const result = setVscodeSettingsJson({
      'stylelint.validate': ['css', 123, null, 'custom'],
    })

    expect(result['stylelint.validate']).toEqual(expect.arrayContaining(['css', 'custom', 'vue', 'scss']))
  })

  it('handles non-array values gracefully', () => {
    const result = setVscodeSettingsJson({
      'stylelint.validate': 'scss',
    })

    expect(result['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
  })

  it('removes style languages from eslint.validate but keeps other entries', () => {
    const result = setVscodeSettingsJson({
      'eslint.validate': [
        'javascript',
        'vue',
        'css',
        'less',
        'scss',
        'postcss',
        'markdown',
      ],
    })

    expect(result['eslint.validate']).toEqual(['javascript', 'vue', 'markdown'])
    expect(result['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
  })

  it('removes eslint.validate entirely when it only contains style languages', () => {
    const result = setVscodeSettingsJson({
      'eslint.validate': ['css', 'less', 'scss', 'pcss', 'postcss'],
    })

    expect(result).not.toHaveProperty('eslint.validate')
    expect(result['stylelint.validate']).toEqual(expect.arrayContaining(['vue', 'css', 'scss']))
  })
})
