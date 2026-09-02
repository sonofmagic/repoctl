import type {
  ConfigNames,
  FlatConfigComposer,
  IcebreakerEslintConfig,
  IcebreakerLegacyEslintConfig,
  TypedFlatConfigItem,
  UserConfigItem,
  UserDefinedOptions,
} from '@icebreakers/eslint-config'
import { getPresets, icebreaker, icebreakerLegacy } from '@icebreakers/eslint-config'
import { expectAssignable, expectType } from 'tsd'

expectAssignable<FlatConfigComposer<TypedFlatConfigItem, ConfigNames>>(icebreaker())
expectAssignable<FlatConfigComposer<TypedFlatConfigItem, ConfigNames>>(icebreakerLegacy())
expectAssignable<UserDefinedOptions>({ miniProgram: true })
expectAssignable<UserDefinedOptions>({ weapp: true })
expectAssignable<UserDefinedOptions>({ unocss: true })
expectAssignable<UserDefinedOptions>({ tailwindcss: true })
expectAssignable<UserDefinedOptions>({
  betterTailwindcss: {
    entryPoint: './src/style.css',
    cwd: './apps/demo',
  },
})
expectAssignable<UserDefinedOptions>({
  unocss: {
    strict: true,
    attributify: false,
    configPath: './uno.config.ts',
  },
})
expectType<IcebreakerEslintConfig>(icebreaker())
expectType<IcebreakerLegacyEslintConfig>(icebreakerLegacy())
expectType<[UserDefinedOptions, ...UserConfigItem[]]>(getPresets())
