import type { Root } from 'postcss'
import type {
  TailwindAnalysis,
  TailwindVersion,
} from 'postcss-tailwindcss'
import {
  analyzeTailwindCss,
  detectTailwindVersion,
  parseTailwindCss,
} from 'postcss-tailwindcss'
import { expectType } from 'tsd'

expectType<Root>(parseTailwindCss('@tailwind utilities;'))
expectType<TailwindVersion>(detectTailwindVersion('@import "tailwindcss";'))
expectType<TailwindAnalysis>(analyzeTailwindCss('@apply flex;'))
