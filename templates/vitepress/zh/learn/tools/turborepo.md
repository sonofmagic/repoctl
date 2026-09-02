# Turborepo

在 repoctl 体系里，Turborepo 负责“任务编排和缓存”，repoctl 负责“什么时候该跑哪些任务”。你日常通常不需要直接调用 `turbo`，而是通过根脚本或 `repo check` 间接触发。

```bash
pnpm build
pnpm test
pnpm exec repo check --full
pnpm exec repo check --json --out reports/check-plan.json
```

| 层级                              | 作用                                      |
| --------------------------------- | ----------------------------------------- |
| `repo check`                      | 决定校验模式，输出可读或可保存的计划      |
| 根脚本 `pnpm build` / `pnpm test` | 调用 `turbo run build` / `turbo run test` |
| `turbo.json`                      | 定义任务依赖、缓存输出和执行策略          |

继续看：[把校验加入 CI](/zh/tasks/ci)。

## 1. 什么是 Turborepo？

**Turborepo** 是由 **Vercel** 推出的一个 **高性能 JavaScript/TypeScript monorepo 构建系统**。

它的定位类似于 **NX / Bazel**，但更轻量、更贴合前端生态。
主要解决 **monorepo（多包/多项目仓库）** 下的构建、缓存和任务调度问题。

👉 通俗说：
在一个仓库里有多个应用和包，**Turborepo 可以帮你高效管理它们的依赖、构建、测试和发布**。

## 2. Turborepo 有什么用？

### 🚀 性能优化

- **增量构建**：只重新构建改动过的包，而不是全量重建。
- **智能缓存**：构建结果会缓存，本地和 CI/CD 环境可以共享（比如用远程缓存）。
- **任务并行化**：最大化利用 CPU 核心，减少构建时间。

### 📦 Monorepo 管理

- 可以在一个仓库中维护多个项目（比如 `templates/` 下是模板，`packages/` 下是共享组件或工具）。
- 内置工作区（workspace）支持，自动管理依赖关系。

### 🛠 灵活的任务编排

- 你可以定义 `build`、`test`、`lint` 等任务，Turborepo 会根据依赖关系和缓存情况决定执行策略。

### 🌍 和 Vercel 深度集成

- 在 Vercel 平台上可以直接利用远程缓存，加速 CI/CD。

## 3. Turborepo 怎么用？

### 安装

全局安装（可选）：

```bash
npm install turbo --global
```

在项目中初始化：

```bash
npx create-turbo@latest
```

这会生成一个 monorepo 结构，比如：

```txt
.
├── apps
│   ├── web     # 前端应用
│   └── docs    # 文档应用
└── packages
    ├── ui      # UI 组件库
    └── config  # 配置共享包
```

### 配置 `turbo.json`

核心配置文件，放在仓库根目录：

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

解释：

- `build` 任务依赖于上游包的 `build`。
- 缓存 `dist/**` 或 `.next/**` 输出目录。
- `test` 依赖于 `build`。

### 运行命令

在根目录执行：

```bash
turbo run build
```

👉 Turborepo 会：

- 找到所有定义了 `build` 脚本的项目。
- 根据依赖关系决定执行顺序。
- 如果缓存可用，直接跳过执行，秒完成。

同理：

```bash
turbo run lint
turbo run test
```

### 远程缓存（可选）

如果团队协作或 CI/CD，需要共享缓存：

```bash
npx turbo login
npx turbo link
```

这样不同开发者、CI 都可以复用缓存，进一步加速。

## 4. 总结

- **Turborepo = 高性能 monorepo 构建工具**。
- **核心优势**：缓存、增量构建、并行执行、依赖感知。
- **适用场景**：
  - 大型 monorepo（多个应用 + 包）。
  - 需要快速构建和测试的团队。
  - 想用 Vercel 部署的项目。

好的 👍，我来帮你把 **Turborepo、Lerna、Nx** 三个常见 **Monorepo 管理工具**做一个对比表。

## Turborepo vs Lerna vs Nx

| 特性 / 工具       | **Turborepo**                            | **Lerna**                                   | **Nx**                                         |
| ----------------- | ---------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| **定位**          | 高性能构建系统，专注缓存、并行和增量构建 | 最早的 JS monorepo 工具，专注版本管理和发布 | 企业级开发平台，集成构建、测试、代码生成等功能 |
| **核心优势**      | ⚡ 高速缓存（本地 & 远程）、并行任务执行 | 📦 包版本管理（独立/统一模式）、发布到 npm  | 🛠 丰富的插件生态、代码生成器、强大的依赖图分析 |
| **依赖管理**      | 基于 pnpm/yarn/npm workspaces            | 基于 npm/yarn workspaces                    | 内置强依赖图（project graph）管理              |
| **构建/缓存机制** | ✅ 智能缓存 & 增量构建                   | ❌ 无缓存机制                               | ✅ 强大缓存 & 增量构建（类似 Bazel）           |
| **任务编排**      | pipeline 模式（`turbo.json`）            | 简单顺序执行                                | 高度可配置任务调度器（依赖感知）               |
| **语言支持**      | 主要是 JS/TS 生态                        | 主要是 JS/TS 生态                           | 多语言支持（JS/TS/Go/Rust/Python 等）          |
| **学习成本**      | ⭐⭐ 低（配置简洁，前端友好）            | ⭐⭐ 低（老牌工具，功能单一）               | ⭐⭐⭐ 高（功能多，配置复杂）                  |
| **社区活跃度**    | 🚀 高（Vercel 维护，发展迅速）           | ⚠️ 中等（已过巅峰，更多用于发布流程）       | 🚀 高（企业应用广泛，社区和插件丰富）          |
| **适合场景**      | 前端/全栈项目，追求构建速度 & CI/CD 效率 | 多包库发布（如 npm 包集合项目）             | 大型企业级 monorepo，跨语言/跨团队复杂项目     |

## 对比总结

- **Turborepo**：主打 **快**，缓存和增量构建体验非常好，适合前端/全栈团队。
- **Lerna**：更像是 **版本管理/发包工具**，现在多和 pnpm/Yarn Workspaces 搭配，用于管理 npm 包版本和发布。
- **Nx**：功能最全，适合大型团队，有可视化依赖图、代码生成、跨语言支持，但学习曲线较陡。
