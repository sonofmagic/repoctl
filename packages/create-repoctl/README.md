# create-repoctl

English | [简体中文](README.zh-CN.md)

The recommended create command for starting a repoctl-managed pnpm and Turborepo workspace.

```bash
npm create repoctl@latest
pnpm create repoctl
yarn create repoctl
```

The interactive flow selects a target directory and any built-in templates to include. After creation:

```bash
cd <project>
pnpm install
pnpm exec repo init
pnpm exec repo doctor
pnpm exec repo check
```

Output is English by default. Pass `--lang zh-CN` or set `REPOCTL_LANG=zh-CN` for Simplified Chinese.

```bash
pnpm create repoctl -- --lang zh-CN
```

## Project links

- Documentation: https://repoctl.icebreaker.top
- Repository: https://github.com/sonofmagic/repoctl/tree/main/packages/create-repoctl
- Issues: https://github.com/sonofmagic/repoctl/issues
