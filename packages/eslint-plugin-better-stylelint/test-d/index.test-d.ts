/* eslint-disable antfu/no-import-dist */
import { expectAssignable } from 'tsd'
import plugin, {
  cssProcessor,
  lintRule,
  runStylelintSync,
} from '../dist/index.js'

expectAssignable<object>(plugin)
expectAssignable<object>(cssProcessor)
expectAssignable<object>(lintRule)
expectAssignable<Array<{ message: string }>>(runStylelintSync('.foo {}', '/tmp/demo.css'))
