import type {
  ParseTailwindCssResult,
  TailwindAnalysis,
  TailwindVersion,
} from 'lightningcss-tailwindcss'
import {
  analyzeTailwindCss,
  detectTailwindVersion,
  parseTailwindCss,
} from 'lightningcss-tailwindcss'
import { expectType } from 'tsd'

expectType<ParseTailwindCssResult>(parseTailwindCss('@tailwind utilities;'))
expectType<TailwindVersion>(detectTailwindVersion('@import "tailwindcss";'))
expectType<TailwindAnalysis>(analyzeTailwindCss('@apply flex;'))
