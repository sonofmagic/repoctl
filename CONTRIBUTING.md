# Contributing to repoctl

English | [简体中文](CONTRIBUTING.zh-CN.md)

repoctl accepts bug fixes, documentation improvements, tests, and focused feature proposals.

## Development setup

1. Use Node.js 22.12+ and enable Corepack.
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

When changing templates or managed root assets, update their source first and refresh packaged copies with `pnpm --filter @icebreakers/monorepo-templates sync:assets`.

Before manually updating a Renovate pull request, fetch its latest remote head. If Renovate updates the branch while you are working, fetch again, rebase your local changes onto the latest pull request head, and push normally. Never force-push a Renovate-managed branch.

Report bugs at https://github.com/sonofmagic/repoctl/issues and use discussions for design questions that do not yet have a concrete implementation.
