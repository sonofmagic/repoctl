# Changelog 格式对比示例

本文档展示了 `@icebreakers/changelog-github` 优化前后的实际输出对比。

---

## 场景 1：标准功能发布（带详细说明）

### 优化前

```markdown
- ✨ **Add optional `tailwind-config` flag to the lint preset** — accepts a relative path to `tailwind.config.ts` · falls back to the workspace root when unset · [#42](https://github.com/sonofmagic/dev-configs/pull/42) · [`1234567`](https://github.com/sonofmagic/dev-configs/commit/1234567890abcdef) · Thanks [@octocat](https://github.com/octocat) · Minor release
```

**问题**：

- 单行长度 210+ 字符
- 次要信息（commit SHA、"Minor release"）占据大量空间
- 使用 5 个 `·` 分隔符造成视觉噪音
- 详细说明与元数据混在一起

### 优化后

```markdown
- ✨ **Add optional `tailwind-config` flag to the lint preset** [#42](https://github.com/sonofmagic/dev-configs/pull/42) by @octocat
  - accepts a relative path to `tailwind.config.ts`
  - falls back to the workspace root when unset
```

**改进**：

- 主行长度约 120 字符（减少 43%）
- 详细说明独立成子列表，层次清晰
- 移除冗余的 commit SHA（已有 PR 链接）
- 移除 "Minor release" 文字（emoji ✨ 已表达）
- 作者信息简化为 "by @octocat"

---

## 场景 2：Bug 修复（简单说明）

### 优化前

```markdown
- 🐛 **Fix parsing error in YAML files** — ensure proper handling of nested arrays · [#156](https://github.com/sonofmagic/dev-configs/pull/156) · [`abc1234`](https://github.com/sonofmagic/dev-configs/commit/abc1234) · Thanks [@contributor](https://github.com/contributor) · Patch release
```

### 优化后

```markdown
- 🐛 **Fix parsing error in YAML files** [#156](https://github.com/sonofmagic/dev-configs/pull/156) by @contributor
  - ensure proper handling of nested arrays
```

---

## 场景 3：重大版本升级（多个详细点）

### 优化前

```markdown
- 🚀 **Migrate to ESLint v9 flat config** — drop support for legacy eslintrc format · add new import resolution rules · update all presets to use flat config API · [#89](https://github.com/sonofmagic/dev-configs/pull/89) · [`def5678`](https://github.com/sonofmagic/dev-configs/commit/def5678) · Thanks [@maintainer](https://github.com/maintainer) · Major release
```

**问题**：单行超过 250 字符，移动端无法阅读

### 优化后

```markdown
- 🚀 **Migrate to ESLint v9 flat config** [#89](https://github.com/sonofmagic/dev-configs/pull/89) by @maintainer
  - drop support for legacy eslintrc format
  - add new import resolution rules
  - update all presets to use flat config API
```

**改进**：信息分 4 行展示，每行都易于阅读

---

## 场景 4：文档更新（无 PR，仅 commit）

### 优化前

```markdown
- 📝 **Update installation guide** — add npm alternative · clarify Node.js version requirements · [`9876543`](https://github.com/sonofmagic/dev-configs/commit/9876543) · Thanks [@docs-bot](https://github.com/docs-bot) · Update
```

### 优化后

```markdown
- 📝 **Update installation guide** [`9876543`](https://github.com/sonofmagic/dev-configs/commit/9876543) by @docs-bot
  - add npm alternative
  - clarify Node.js version requirements
```

**改进**：无 PR 时保留 commit 链接作为追溯手段

---

## 场景 5：无作者信息

### 优化前

```markdown
- 📝 **Update README badges** — refresh CI status badge · add package version badge · [#234](https://github.com/sonofmagic/dev-configs/pull/234) · [`fedcba9`](https://github.com/sonofmagic/dev-configs/commit/fedcba9) · Update
```

### 优化后

```markdown
- 📝 **Update README badges** [#234](https://github.com/sonofmagic/dev-configs/pull/234)
  - refresh CI status badge
  - add package version badge
```

**改进**：无作者时自动省略，避免空白信息

---

## 场景 6：依赖更新（2个依赖）

### 优化前

```markdown
- 📦 Updated dependencies: `eslint` @ 9.0.0, `prettier` @ 3.2.0 · [`aaa1111`](https://github.com/sonofmagic/dev-configs/commit/aaa1111) · [`bbb2222`](https://github.com/sonofmagic/dev-configs/commit/bbb2222)
```

**问题**：包名和版本号之间的 `@` 符号两侧有空格，不够紧凑

### 优化后

```markdown
- 📦 **Dependencies** [`aaa1111`](https://github.com/sonofmagic/dev-configs/commit/aaa1111)
  → `eslint@9.0.0`, `prettier@3.2.0`
```

**改进**：

- 使用 `→` 箭头符号引导依赖列表
- 包名格式紧凑：`eslint@9.0.0`
- 只保留第一个 commit 引用

---

## 场景 7：依赖更新（5个依赖）

### 优化前

```markdown
- 📦 Updated dependencies: `eslint` @ 9.0.0, `prettier` @ 3.2.0, `typescript` @ 5.3.0, `vitest` @ 1.0.0, `turbo` @ 1.11.0 · [`ccc3333`](https://github.com/sonofmagic/dev-configs/commit/ccc3333) · [`ddd4444`](https://github.com/sonofmagic/dev-configs/commit/ddd4444) · [`eee5555`](https://github.com/sonofmagic/dev-configs/commit/eee5555) · [`fff6666`](https://github.com/sonofmagic/dev-configs/commit/fff6666) · [`ggg7777`](https://github.com/sonofmagic/dev-configs/commit/ggg7777)
```

**问题**：单行超过 300 字符，完全不可读

### 优化后

```markdown
- 📦 Updated 5 dependencies [`ccc3333`](https://github.com/sonofmagic/dev-configs/commit/ccc3333)
```

**改进**：大量依赖时使用数量摘要，保持简洁

---

## 场景 8：多条变更的完整 Changelog

### 优化前

```markdown
## 2.1.0

### Minor Changes

- ✨ **Add TypeScript strict mode preset** — enable all strict type checking options · add recommended overrides for common patterns · [#301](https://github.com/sonofmagic/dev-configs/pull/301) · [`aaa111`](https://github.com/sonofmagic/dev-configs/commit/aaa111) · Thanks [@typescript-expert](https://github.com/typescript-expert) · Minor release

- ✨ **Support Vue 3 Composition API linting** — add script setup syntax rules · configure template compilation options · [#302](https://github.com/sonofmagic/dev-configs/pull/302) · [`bbb222`](https://github.com/sonofmagic/dev-configs/commit/bbb222) · Thanks [@vue-dev](https://github.com/vue-dev) · Minor release

### Patch Changes

- 🐛 **Fix false positive in unused variable detection** — [#303](https://github.com/sonofmagic/dev-configs/pull/303) · [`ccc333`](https://github.com/sonofmagic/dev-configs/commit/ccc333) · Thanks [@bug-hunter](https://github.com/bug-hunter) · Patch release

- 📦 Updated dependencies: `@typescript-eslint/parser` @ 6.15.0, `@typescript-eslint/eslint-plugin` @ 6.15.0, `eslint-plugin-vue` @ 9.19.0 · [`ddd444`](https://github.com/sonofmagic/dev-configs/commit/ddd444) · [`eee555`](https://github.com/sonofmagic/dev-configs/commit/eee555) · [`fff666`](https://github.com/sonofmagic/dev-configs/commit/fff666)
```

### 优化后

```markdown
## 2.1.0

### Minor Changes

- ✨ **Add TypeScript strict mode preset** [#301](https://github.com/sonofmagic/dev-configs/pull/301) by @typescript-expert
  - enable all strict type checking options
  - add recommended overrides for common patterns

- ✨ **Support Vue 3 Composition API linting** [#302](https://github.com/sonofmagic/dev-configs/pull/302) by @vue-dev
  - add script setup syntax rules
  - configure template compilation options

### Patch Changes

- 🐛 **Fix false positive in unused variable detection** [#303](https://github.com/sonofmagic/dev-configs/pull/303) by @bug-hunter

- 📦 **Dependencies** [`ddd444`](https://github.com/sonofmagic/dev-configs/commit/ddd444)
  → `@typescript-eslint/parser@6.15.0`, `@typescript-eslint/eslint-plugin@6.15.0`, `eslint-plugin-vue@9.19.0`
```

---

## 统计对比

| 维度           | 优化前                      | 优化后                | 改进幅度      |
| -------------- | --------------------------- | --------------------- | ------------- |
| 平均主行长度   | 180-250 字符                | 80-120 字符           | **减少 60%**  |
| 视觉分隔符数量 | 5-7 个 `·`                  | 0 个                  | **减少 100%** |
| 冗余信息       | commit SHA + "release" 标签 | 无（按需保留 commit） | **更精简**    |
| 信息层次       | 单行平铺                    | 多行分层              | **更清晰**    |
| 移动端体验     | 需要横向滚动                | 无需滚动              | **显著提升**  |
| 快速扫描能力   | 困难（信息密度高）          | 容易（核心信息突出）  | **大幅改善**  |

---

## 关键设计原则

### 优化前的问题

1. **信息过载**：所有元数据都挤在主行，无法快速定位关键信息
2. **视觉噪音**：过多分隔符（`·`）干扰阅读
3. **冗余表达**：emoji 和文字标签重复表达相同含义
4. **移动不友好**：长行在小屏幕设备上体验极差

### 优化后的优势

1. **信息分层**：主行仅包含核心内容（emoji + 标题 + PR + 作者）
2. **渐进式细节**：详细说明独立成子列表，需要时才阅读
3. **智能精简**：有 PR 时隐藏 commit，大量依赖时显示摘要
4. **响应式友好**：主行长度适中，任何设备都能良好展示
5. **GitHub 原生支持**：`@username` 和 `#PR` 自动转为链接

---

## 使用建议

新格式在以下场景特别有优势：

- ✅ GitHub Release Notes 页面
- ✅ CHANGELOG.md 文件浏览
- ✅ 移动端 GitHub 应用
- ✅ PR 合并后的自动 changelog 生成
- ✅ 需要快速扫描变更历史的场景

如需更详细的配置说明，请参考 [README.md](./README.md) 和 [README.zh.md](./README.zh.md)。
