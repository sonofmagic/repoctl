# dev-configs 合仓记录

`dev-configs` 的源码包和 mock 应用现在与 repoctl 共用一个 workspace。配置包仍然是可独立发布的 npm 包，保留原有包名、导出路径和版本线；repoctl 与 `@icebreakers/monorepo` 继续使用 fixed version group，其它包独立版本。

本次迁移保留了 `dev-configs` 主分支的 Git 历史和标签，并将原仓库的 repository 元数据统一指向 `sonofmagic/repoctl`。历史 changelog 中指向 `dev-configs` 的链接保持不变，以便旧版本仍可追溯。

## 旧仓库收尾

合并提交发布后，将 `sonofmagic/dev-configs` 设置为只读并启用 GitHub redirect。不要在旧仓库继续创建新的 publishable package 变更；后续改动应在 repoctl 中按包创建独立 release intent。

## 本地验证

```bash
pnpm install --frozen-lockfile
pnpm check:no-tracked-build-artifacts
pnpm check:workflows
pnpm build
pnpm lint
pnpm typecheck
pnpm tsd
pnpm test
```
