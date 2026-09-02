# Contributing to repoctl

English | [简体中文](CONTRIBUTING.zh-CN.md)

repoctl accepts bug fixes, documentation improvements, tests, and focused feature proposals.

## Development setup

1. Use Node.js 22.13+ and enable Corepack.
2. Run `pnpm install`.
3. Create a focused branch from `main`.
4. Add or update tests with the implementation.

Before opening a pull request, run:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm tsd
pnpm test
```

Changes to publishable packages require a pnpm change intent created with `pnpm change`. Commits must use Conventional Commit syntax.

The repository includes repoctl's CLI and monorepo engine, template assets, shared lint/config packages, and the `apps/mock` fixture demo. Keep package APIs and independent version lines intact when working across these areas.

When changing templates or managed root assets, update their source first and refresh packaged copies with `pnpm --filter @icebreakers/monorepo-templates sync:assets`.

Report bugs at https://github.com/sonofmagic/repoctl/issues and use discussions for design questions that do not yet have a concrete implementation.
