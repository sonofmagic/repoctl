# lightningcss-tailwindcss

## 2.0.3

### Patch Changes

- 迁移到基于 pnpm 原生版本意图和 repoctl 的统一发版流程，并同步升级已验证兼容的工程依赖。

## 2.0.2

### Patch Changes

- 🐛 **升级运行时与开发依赖，让 Markdown 格式化结果与新版格式器保持一致，并修复 utility 规则把 `table-and-form` 等语义类名误判为 Tailwind/UnoCSS 原子类的问题。** [`bafe948`](https://github.com/sonofmagic/dev-configs/commit/bafe9482c00d11c8e93d4417ced26dc0d36a5fc6) by @sonofmagic

## 2.0.1

### Patch Changes

- 🐛 **Fix CI typecheck compatibility with ESLint 10.6, declare the direct PostCSS dependency used by the Tailwind stylelint plugin, and keep Tailwind runtime and type tests resolvable.** [`e3bf5c6`](https://github.com/sonofmagic/dev-configs/commit/e3bf5c684bcc85cd35cb3826341f4a9c0975cbba) by @sonofmagic

## 2.0.0

### Major Changes

- 🚀 **最低运行环境升级为 Node 22.12.0，发布校验不再覆盖 Node 20。** [`a759944`](https://github.com/sonofmagic/dev-configs/commit/a759944d539f3b6871430b6e951962965e03b493)

## 1.0.0

### Major Changes

- 🚀 **Raise the minimum supported Node.js versions to `^20.19.0 || >=22.12.0`** [`92b869f`](https://github.com/sonofmagic/dev-configs/commit/92b869fb95ad99a1c7f5f970c675cfa79b8b9a31) by @sonofmagic
  - across all published packages so the supported runtime range matches the
  - default `require(esm)` behavior.
  - Also fix `@icebreakers/eslint-config` so ESLint config loading works on
  - Node.js `20.19.0` by polyfilling `Object.groupBy` when the runtime does not
  - provide it yet. This unblocks `pnpm lint` and test execution for the Node 20
  - CI job.

## 0.0.1

### Patch Changes

- 🐛 **Add Tailwind CSS analysis utility packages for PostCSS AST and Lightning CSS AST.** [`3847047`](https://github.com/sonofmagic/dev-configs/commit/38470476b5ceb034bd6661f653a8f9a889f660ea) by @sonofmagic
  - Update `stylelint-plugin-tailwindcss` to reuse the PostCSS-based selector collection helpers.

- 🐛 **Migrate all packages under `packages/` to build with `tsdown`.** [`45c73ca`](https://github.com/sonofmagic/dev-configs/commit/45c73ca9f70ba813052c9970b54e08d853e638ce) by @sonofmagic
  - This removes the remaining `tsup` and `unbuild` package-level build configs,
  - switches package scripts to `tsdown`, and keeps the package outputs aligned with
  - the existing published entry points.
