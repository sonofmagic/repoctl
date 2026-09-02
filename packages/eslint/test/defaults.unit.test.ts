import { getDefaultTypescriptOptions, getDefaultVueOptions } from '@/defaults'

describe('getDefaultVueOptions', () => {
  it('includes the base vue overrides', () => {
    const vueOptions = getDefaultVueOptions()

    expect(vueOptions.overrides).toBeDefined()
    const vueOverrides = vueOptions.overrides!
    expect(vueOverrides['vue/no-useless-v-bind']).toBeDefined()
    expect(vueOverrides['vue/no-unused-refs']).toBe('warn')
  })

  it('adds ionic tweaks when enabled', () => {
    const vueOptions = getDefaultVueOptions({ ionic: true })

    expect(vueOptions.overrides).toBeDefined()

    const vueOverrides = vueOptions.overrides!
    expect(vueOverrides['vue/no-deprecated-slot-attribute']).toBe('off')
    expect(vueOverrides['vue/no-useless-template-attributes']).toBeUndefined()
    expect(vueOverrides['vue/singleline-html-element-content-newline']).toBeUndefined()
  })

  it('adds mini program tweaks when enabled', () => {
    const vueOptions = getDefaultVueOptions({ miniProgram: true })

    expect(vueOptions.overrides).toBeDefined()

    const vueOverrides = vueOptions.overrides!
    expect(vueOverrides['vue/no-deprecated-slot-attribute']).toBe('off')
    expect(vueOverrides['vue/no-useless-template-attributes']).toBe('off')
    expect(vueOverrides['vue/singleline-html-element-content-newline']).toBe('off')
    expect(vueOverrides['vue/no-restricted-props']).toEqual([
      'warn',
      {
        name: 'id',
        message: expect.stringContaining('id prop'),
        suggest: 'customId',
      },
      {
        name: 'class',
        message: expect.stringContaining('class prop'),
        suggest: 'customClass',
      },
      {
        name: 'slot',
        message: expect.stringContaining('slot prop'),
        suggest: 'customSlot',
      },
    ])
  })

  it('keeps ionic and weapp overrides disabled by default', () => {
    const vueOptions = getDefaultVueOptions()

    expect(vueOptions.overrides).toBeDefined()
    const vueOverrides = vueOptions.overrides!
    expect(vueOverrides['vue/no-deprecated-slot-attribute']).toBeUndefined()
    expect(vueOverrides['vue/no-useless-template-attributes']).toBeUndefined()
    expect(vueOverrides['vue/singleline-html-element-content-newline']).toBeUndefined()
    expect(vueOverrides['vue/no-restricted-props']).toBeUndefined()
  })

  it('keeps the legacy weapp alias working', () => {
    const vueOptions = getDefaultVueOptions({ weapp: true })

    expect(vueOptions.overrides?.['vue/no-deprecated-slot-attribute']).toBe('off')
    expect(vueOptions.overrides?.['vue/singleline-html-element-content-newline']).toBe('off')
    expect(vueOptions.overrides?.['vue/no-restricted-props']).toBeDefined()
  })
})

describe('getDefaultTypescriptOptions', () => {
  it('includes base typescript overrides', () => {
    const typescriptOptions = getDefaultTypescriptOptions()

    expect(typescriptOptions.overrides).toBeDefined()
    const typescriptOverrides = typescriptOptions.overrides!
    expect(typescriptOverrides['ts/no-unused-vars']).toBeDefined()
    expect(typescriptOverrides['ts/no-unused-expressions']).toBeDefined()
  })

  it('merges nest specific typescript rules', () => {
    const typescriptOptions = getDefaultTypescriptOptions({ nestjs: true })

    expect(typescriptOptions.overrides).toBeDefined()
    const typescriptOverrides = typescriptOptions.overrides!
    expect(typescriptOverrides['ts/explicit-function-return-type']).toBe('off')
    expect(typescriptOverrides['ts/no-unused-vars']).toBeDefined()
  })

  it('keeps nest rules disabled when nestjs is false', () => {
    const typescriptOptions = getDefaultTypescriptOptions()

    expect(typescriptOptions.overrides).toBeDefined()
    const typescriptOverrides = typescriptOptions.overrides!
    expect(typescriptOverrides['ts/explicit-function-return-type']).toBeUndefined()
  })
})
