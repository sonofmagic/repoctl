import type { OptionsTypescript, OptionsVue } from './antfu'
import type { UserDefinedOptions } from './types'

export const nestjsTypeScriptRules: NonNullable<OptionsTypescript['overrides']> = {
  'ts/explicit-function-return-type': 'off',
  'ts/explicit-module-boundary-types': 'off',
  'ts/no-explicit-any': 'off',
  'ts/no-parameter-properties': 'off',
  'ts/no-empty-function': [
    'error',
    {
      allow: [
        'decoratedFunctions',
        'overrideMethods',
        'private-constructors',
        'protected-constructors',
      ],
    },
  ],
  'ts/no-empty-interface': 'off',
  'ts/no-namespace': [
    'error',
    {
      allowDeclarations: true,
      allowDefinitionFiles: true,
    },
  ],
  'ts/ban-types': [
    'error',
    {
      extendDefaults: true,
      types: {
        Function: false,
      },
    },
  ],
}

function isMiniProgramEnabled(opts?: UserDefinedOptions) {
  return opts?.miniProgram === true || opts?.weapp === true
}

export function getDefaultVueOptions(opts?: UserDefinedOptions) {
  const overrides: OptionsVue['overrides'] = {
    'vue/attribute-hyphenation': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'vue/custom-event-name-casing': 'off',
    'vue/no-mutating-props': 'warn',
    // https://eslint.vuejs.org/rules/no-useless-v-bind.html
    'vue/no-useless-v-bind': [
      'error',
      {
        // 不允许注释
        ignoreIncludesComment: false,
        // 允许在里面使用转义
        // 比如 v-bind:foo="'bar\nbaz'"
        ignoreStringEscape: true,
      },
    ],
    // https://eslint.vuejs.org/rules/no-unused-refs.html
    'vue/no-unused-refs': 'warn',
  }
  // ionic 启用
  // 这是因为 ionic vue 也是依赖 web component 的 slot 的，这个会和 vue slot 有冲突
  if (opts?.ionic) {
    overrides['vue/no-deprecated-slot-attribute'] = 'off'
  }
  // 小程序启用
  if (isMiniProgramEnabled(opts)) {
    overrides['vue/no-deprecated-slot-attribute'] = 'off'
    overrides['vue/no-useless-template-attributes'] = 'off'
    overrides['vue/singleline-html-element-content-newline'] = 'off'
    overrides['vue/no-restricted-props'] = [
      'warn',
      {
        name: 'id',
        message: '小程序组件中声明 id prop 可能无法在 properties 中正确取值，请改用其他 prop 名称。',
        suggest: 'customId',
      },
      {
        name: 'class',
        message: '小程序组件中声明 class prop 可能无法在 properties 中正确取值，请改用其他 prop 名称。',
        suggest: 'customClass',
      },
      {
        name: 'slot',
        message: '小程序组件中声明 slot prop 可能无法在 properties 中正确取值，请改用其他 prop 名称。',
        suggest: 'customSlot',
      },
    ]
  }
  const vueOptions: OptionsVue = {
    overrides,
  }
  return vueOptions
}

export function getDefaultTypescriptOptions(opts?: UserDefinedOptions) {
  const overrides: OptionsTypescript['overrides'] = {
    'ts/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'ts/prefer-ts-expect-error': 'off',
    'ts/ban-ts-comment': 'off',
    'ts/no-use-before-define': 'warn',
    'ts/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
  }
  if (opts?.nestjs) {
    Object.assign(overrides, nestjsTypeScriptRules)
  }
  const typescriptOptions: OptionsTypescript = {
    overrides,
  }
  return typescriptOptions
}

export { isMiniProgramEnabled }
