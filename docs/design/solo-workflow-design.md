# Solo Agent 设计文档

## 1. 概述

### 1.1 背景

Orchestrix 标准工作流（8步，10+ Agent 协作）对小型全栈项目太重。现有轻量路径（`Dev *solo`, `*quick-fix`）仍依赖 story 文件、状态流转、agent 间 escalation。

### 1.2 方案：独立 Solo Agent

**不是修改 Dev agent，而是新建一个独立的 Solo agent。**

| 维度             | 改造 Dev（旧方案）                       | 独立 Agent（新方案）         |
| ---------------- | ---------------------------------------- | ---------------------------- |
| 对现有系统的影响 | 需要 config 分支、条件行为               | 零侵入，不动任何现有文件     |
| 共存性           | 互斥（solo 模式禁用其他 agent）          | 并行（同一项目可混用）       |
| 复杂度           | 高（config + agent 行为分支 + 禁用逻辑） | 低（一个 agent + 几个 task） |
| 用户心智         | 需要理解"模式切换"                       | `/solo *do "xxx"` 就完事了   |

### 1.3 定位：两种使用模式

Solo Agent 不仅是"Team 项目里的快捷通道"，而是一个**完整的独立开发入口**：

**模式 A：全程 Solo（独立项目）**

```
新项目从零开始 → Solo *init (脚手架 + 首批功能一步到位) → Solo *do → Solo *do → ... → 上线
整个项目生命周期都用 Solo，不需要 Team 流程。
*init 同时完成脚手架和初始功能实现，不需要单独再跑 *do。
适合: 独立开发者用 NextJS/Nuxt 等全栈框架做的完整项目。
```

**模式 B：混合使用（Team 项目中的快捷通道）**

```
已有 Team 项目 → 简单功能用 Solo *do → 复杂功能走 SM → Dev → QA
同一项目内 Solo 和 Team 共存，互不干扰。
适合: 团队项目中不值得走完整流程的小功能/修复。
```

**用户决策路径**:

```
新项目:
  ├─ 1-2 人全栈 → Solo agent 全程搞定
  └─ 3+ 人团队 / 复杂架构 → Team 流程

已有项目:
  ├─ 加个页面、改个样式、修个 bug → /solo *do
  └─ 跨模块新功能、安全认证重构 → /sm *draft → Team 流程
```

### 1.4 核心原则

| #   | 原则                 | 说明                                               |
| --- | -------------------- | -------------------------------------------------- |
| 1   | **一句话就能开干**   | 描述需求 → 直接实现 → 提交                         |
| 2   | **完全自包含**       | 不依赖其他 Agent、不需要 story、不需要 config 变更 |
| 3   | **覆盖完整生命周期** | 从项目初始化到持续迭代，Solo 能独立撑起整个项目    |
| 4   | **与 Team 流程共存** | 同一项目可混用，互不干扰                           |
| 5   | **警告而非阻断**     | 风险提醒，决定权在用户                             |
| 6   | **Commit 即历史**    | 无额外文档，git log 就是记录                       |

### 1.5 适用场景

**作为独立项目入口（全程 Solo）**:

- 独立开发者 / 1-2 人小团队的全栈项目
- NextJS / Nuxt / SvelteKit / Rails 等全栈框架项目
- 个人项目、小型 SaaS、Landing Page、内部工具、MVP
- 需求变化快，迭代周期短（小时/天级别）

**作为 Team 项目的快捷通道（混合使用）**:

- 已有 Team 项目中的简单功能/页面/修复
- 不值得走完整 SM → Architect → Dev → QA 流程的小改动

---

## 2. Agent 定义

### 2.1 基本信息

```yaml
agent:
  name: Carmack # John Carmack - 传奇 solo 全栈开发者
  id: solo
  title: Solo Full-Stack Developer
  icon: ⚡
  whenToUse: >
    独立全栈开发。两种用法：
    1) 全新项目：*init 初始化 → *do 持续迭代，全程 Solo 搞定
    2) 已有项目：*do 快速实现功能，*fix 快速修 bug
    不需要 story 文件、不需要 Architect review、不需要 QA。
```

### 2.2 Persona

```yaml
persona:
  role: Independent Full-Stack Developer
  style: Fast, pragmatic, minimal ceremony
  identity: >
    一句话接需求，直接写代码，跑通测试，提交。
    自带产品思维、架构意识、质量意识。
    不写多余文档，不走多余流程。
  focus: Implement fast, test well, commit clean
```

### 2.3 核心原则（Customization）

```yaml
customization:
  # 输入来源
  - 实现上下文直接来自用户描述 + 代码库，不依赖 story 或 dev_notes
  - devLoadAlwaysFiles 存在则加载，不存在则跳过（静默）

  # 实现风格
  - 有测试框架就写测试（推荐 TDD 但不强制）
  - 遵循项目已有的代码风格和模式
  - 优先使用项目已有的依赖和工具

  # 质量标准
  - 通过标准: 测试通过 + lint 通过 + 功能符合描述
  - 无评分系统、无 gate、无 checklist
  - 内建安全意识: 涉及 auth/crypto 时主动提醒

  # 与 Team 模式的边界
  - 不使用 cumulative context / registry
  - 不创建 story 文件
  - 不使用状态机
  - 不产生 handoff
  - 不写 dev log

  # 风险处理
  - 复杂度/安全/DB 风险 → 提醒用户（advisory），不阻断
  - 大范围变更 → 建议拆分为多次 commit，用户决定
```

### 2.4 命令表

```yaml
commands:
  - help:
      description: Display available commands
      output_format: |
        | #   | Command              | Description                          |
        |-----|----------------------|--------------------------------------|
        | 1   | *init "{description}"| 从零初始化项目：脚手架 → 基础结构 → 首次提交 |
        | 2   | *do "{description}"  | 实现功能：描述 → 实现 → 测试 → 提交   |
        | 3   | *fix "{bug}"         | 快速修 bug                            |
        | 4   | *plan                | 管理轻量级 backlog                    |
        | 5   | *status              | 查看项目状态                          |
        | 6   | *run-tests           | 执行测试套件                          |

  - init:
      description: Bootstrap a new project from scratch
      task: solo-init.md

  - do:
      description: One-shot development - describe, implement, test, commit
      task: solo-do.md
      decision: decisions-solo-advisory.yaml

  - fix:
      description: Quick bug fix
      task: solo-fix.md

  - plan:
      description: Manage lightweight backlog (BACKLOG.md)
      task: solo-plan.md

  - status:
      description: Project status overview
      task: solo-status.md

  - run-tests:
      description: Run project test suite and lint
```

### 2.5 Workflow Rules（精简版）

```yaml
workflow_rules:
  - Treat task files as executable workflows; follow exactly
  - Load CONFIG_PATH from core-config.yaml at activation
  - Load devLoadAlwaysFiles if they exist (skip silently if missing)
  - Maintain persona throughout the session
  - Execute only after command selected from *help
  - Commit format MUST use Orchestrix signature (from CLAUDE.md)
  - NO handoff to other agents
  - NO story file creation
  - NO status state machine
  - NO cumulative context loading
```

---

## 3. 项目初始化：`*init`

### 3.1 概述

从一句话描述到可运行的项目骨架：

```
"用 NextJS + Tailwind + Prisma 做一个博客平台"
  → 创建项目 → 安装依赖 → 基础结构 → 首次提交 → 可以开始 *do 了
```

### 3.2 执行流程 (solo-init.md)

```yaml
Phase 0: Validate Environment
  - 检查当前目录是否为空（或仅有 .git）
  - IF 非空: "⚠️ 目录非空，建议在空目录下初始化。继续？"
  - 检查 Node.js / Python / 等运行时版本

Phase 1: Understand Intent
  - 从描述中提取:
    - 项目类型 (web app, API, CLI, etc.)
    - 框架选择 (NextJS, Nuxt, SvelteKit, etc.)
    - 关键依赖 (Tailwind, Prisma, Drizzle, etc.)
    - 核心功能概要
  - IF 描述模糊 (如 "做个网站"):
    快速追问 1-2 个关键问题:
    "用什么框架？(NextJS / Nuxt / 其他)"
    "需要数据库吗？(Prisma / Drizzle / 不需要)"

Phase 2: Scaffold
  - 执行框架 CLI (如 npx create-next-app)
  - 安装额外依赖
  - 配置基础结构 (layout, 样式, 数据库连接等)
  - 创建合理的目录结构
  - 确保项目能跑起来: dev server 启动成功

Phase 3: First Commit
  - git init (如果没有)
  - git add + commit: "feat: init project with {framework} + {deps}"

Phase 4: Output
  "✅ 项目已初始化

   📁 {project_name}/
   ├── app/           # NextJS app router
   ├── prisma/        # Database schema
   ├── components/    # Shared components
   └── ...

   📦 Dependencies: next, tailwindcss, prisma, ...
   🔧 Dev server: npm run dev

   📋 接下来可以:
   *do '添加首页 hero section'
   *do '创建用户注册登录'
   *plan  (规划功能列表)"
```

### 3.3 示例

```
User: *init "用 NextJS 14 + Tailwind + Prisma + PostgreSQL 做一个 SaaS 订阅管理平台"

Solo:
📋 Project Setup:
- NextJS 14 (App Router)
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth.js (for auth later)

🔨 Scaffolding...
✅ npx create-next-app done
✅ Tailwind configured
✅ Prisma initialized with PostgreSQL
✅ Base layout + landing page created
✅ Dev server running on localhost:3000

📦 chore: init project with NextJS, Tailwind, Prisma

📋 接下来:
*do "创建 landing page with pricing section"
*do "添加用户注册登录"
*plan (规划完整功能列表)
```

### 3.4 与 Team 模式的对比

| 步骤     | Team 模式                        | Solo \*init                   |
| -------- | -------------------------------- | ----------------------------- |
| 1        | Analyst 创建 project-brief.md    | —                             |
| 2        | PM 创建 prd.md                   | —                             |
| 3        | UX-Expert 创建 front-end-spec.md | —                             |
| 4        | Architect 创建 architecture.md   | —                             |
| 5        | PM 更新 prd                      | —                             |
| 6        | PO 验证一致性                    | —                             |
| 7        | PO 拆分文档                      | —                             |
| 8        | SM 创建 Story → 开始开发         | —                             |
| **替代** | 以上全部                         | `*init "一句话"` → 可运行项目 |

---

## 4. 核心工作流：`*do`

### 4.1 概述

将整个开发流程压缩为一个操作：

```
描述 → 理解 → Plan 输出 → 实现 → 测试 → 提交 → Done
```

### 4.2 执行流程 (solo-do.md)

```
Phase 0: Pre-flight
  │
  ├─ 加载 config (testCommand, devLoadAlwaysFiles)
  ├─ 加载代码规范 (如果存在)
  └─ 检查 git 状态 (警告，不阻断)
      │
Phase 1: Analyze
  │
  ├─ 理解用户意图 (功能目标、涉及模块)
  ├─ 规划实现 (文件列表、测试计划)
  ├─ 风险评估 (advisory，不阻断)
  │   └─ IF 有风险: 输出提醒 → 用户确认
  └─ 输出 Plan (简洁，3-5 行)
      │
Phase 2: Implement
  │
  ├─ 按 Plan 编码
  ├─ 写测试 (如有测试框架)
  ├─ 大功能可分步实现
  └─ 中途发现新情况 → 继续（不阻断）
      │
Phase 3: Verify
  │
  ├─ 运行测试
  ├─ 运行 lint
  └─ 失败 → 修复重试 (最多 3 次)
      │
Phase 4: Commit
  │
  ├─ git add (仅相关文件)
  ├─ git commit (conventional commit)
  └─ 输出摘要
```

### 4.3 Phase 细节

#### Phase 0: Pre-flight

```yaml
0.1 Load Configuration:
  - Read core-config.yaml
  - Extract: testCommand, devLoadAlwaysFiles
  - Load coding standards (skip if files missing)

0.2 Check Git Status:
  - git status --porcelain
  - IF dirty: warn "有未提交的更改，建议先 commit 或 stash。继续？"
  # 不阻断。Solo 开发者经常有 WIP。

0.3 Scan Project:
  - Quick scan project structure
  - Identify tech stack from config files
```

#### Phase 1: Analyze

```yaml
1.1 Understand Intent:
  - Parse description → 功能目标、涉及模块、数据需求
  - Identify type: feat | fix | refactor | chore

1.2 Plan Implementation:
  - Files to create/modify
  - Test files needed
  - Estimated scope

1.3 Risk Assessment (Advisory):
  # 使用 decisions-solo-advisory.yaml
  # 所有风险只是提醒，不阻断

  Evaluate:
    involves_db_changes → warn + suggest migration
    involves_security → warn (high) + suggest mature libs
    file_count > 8 → suggest splitting
    complexity == high → suggest incremental approach

  IF risk detected:
    Output: "⚠️ 注意: {risk}. 建议: {suggestion}. 继续？"
    Wait for user confirmation

1.4 Output Plan:
  "📋 Plan:
   - {action_1}
   - {action_2}
   - {action_3}

   Implementing..."
```

#### Phase 2: Implement

```yaml
2.1 Code:
  - Follow project coding standards
  - Create/modify files per plan
  - Write tests alongside (if test framework exists)
  # TDD 推荐但不强制

2.2 Adapt:
  - Scope larger than expected → continue, don't stop
  - Need new dependency → install and use
  - Unexpected issue → handle inline

2.3 Large Feature Handling:
  IF user requested large feature AND confirmed splitting:
    Implement in steps, each with its own commit
    Output progress: "🔨 [1/N] {step}..."
```

#### Phase 3: Verify

```yaml
3.1 Run Tests:
  - Use testCommand from config (or auto-detect)
  - IF no test framework: skip (just lint)

3.2 Run Lint:
  - Auto-detect lint command
  - IF no linter: skip

3.3 Handle Failures:
  IF fail (attempt 1-3): analyze, fix, retry
  IF fail after 3:
    Output: "❌ 未通过。代码已写入但未提交。手动修复后 commit。"
    HALT
```

#### Phase 4: Commit

```yaml
4.1 Stage: git add {specific files}
4.2 Commit Type: feat | fix | refactor | chore | docs
4.3 Commit Message: "{type}: {concise description}

  {optional body for multi-file changes}

  🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)"

4.4 Output: "✅ Done
  📦 {hash} {type}: {description}
  Files: {count} | Tests: {result}"
```

### 4.4 流程示例

**简单功能**:

```
User: *do "在首页加个 dark mode 切换按钮"

Solo:
📋 Plan:
- Add ThemeToggle component
- Integrate with next-themes
- Add to header layout
- Write component test

🔨 Implementing...
✅ Tests passing (2/2)

📦 abc123f feat: add dark mode toggle to homepage header
Files: 3 modified | Tests: 2 added
```

**带风险的功能**:

```
User: *do "加个用户注册功能，用 email + password"

Solo:
⚠️ 注意: 涉及认证逻辑和数据库 schema 变更。
建议: 使用 NextAuth.js + bcrypt，创建 migration。
继续？

User: y，用 NextAuth.js + Prisma

Solo:
📋 Plan:
- Setup NextAuth with credentials provider
- Create User model + migration
- Add signin/signup pages
- Write auth flow tests

🔨 Implementing...
✅ Tests passing (5/5)

📦 d4e5f6a feat: add user auth with NextAuth and Prisma
Files: 8 modified | Tests: 5 added
```

**大功能拆分**:

```
User: *do "做一个博客系统：文章列表、详情、编辑器、标签"

Solo:
⚠️ 功能较大，建议拆分为多次提交。
拆分方案:
1. 文章模型 + 列表页
2. 详情页 + Markdown 渲染
3. 编辑器
4. 标签分类

逐步实现？

User: 好

Solo:
🔨 [1/4] 文章模型 + 列表页...
✅ 📦 a1b2c3d feat: add blog post model and listing page

🔨 [2/4] 详情页 + Markdown 渲染...
✅ 📦 e4f5g6h feat: add post detail page with markdown

🔨 [3/4] 编辑器...
✅ 📦 i7j8k9l feat: add markdown editor

🔨 [4/4] 标签分类...
✅ 📦 m0n1o2p feat: add tag categorization

✅ 博客系统完成！4 commits, 12 tests.
```

---

## 5. 辅助命令

### 5.1 `*fix "{bug}"`

```yaml
Flow:
  1. 理解 bug 描述
  2. 定位相关代码 (grep/read)
  3. 找到 root cause
  4. 修复 + 验证
  5. Commit: "fix: {description}"

# 不做: impact analysis, escalation, 5-phase process
```

```
User: *fix "logo 点击跳 404"

Solo:
🔍 Header.tsx: href="/home" → should be "/"
🔧 Fixed
✅ Tests passing
📦 fix: correct logo link in header
```

### 5.2 `*plan`

可选的 backlog 管理：

```yaml
Flow:
  1. BACKLOG.md 存在 → 加载显示
  2. 不存在 → 创建
  3. 交互式 add/remove/reorder
  4. 保存

Format:
  # Backlog

  ## Up Next
  - [ ] User profile page
  - [ ] Search functionality

  ## Done
  - [x] Landing page (abc123f)
  - [x] Dark mode toggle (d4e5f6a)
```

`*do` 完成后自动匹配 backlog 条目，移至 Done。

### 5.3 `*status`

```yaml
Output: "📊 {project_name}

  🔧 Recent:
  - abc123f feat: add about page (2h ago)
  - d4e5f6a fix: header alignment (5h ago)

  📋 Backlog: 3 pending
  - [ ] Search functionality
  - [ ] User profiles
  - [ ] Email notifications"
```

---

## 6. 风险提醒系统

### 6.1 Advisory 而非 Escalation

```
Team 模式:  "⚠️ DB 变更 → 🎯 HANDOFF TO SM"     (阻断 + 移交)
Solo Agent: "⚠️ DB 变更，建议创建 migration。继续？" (提醒 + 用户决定)
```

### 6.2 decisions-solo-advisory.yaml

```yaml
decision_type: solo-advisory

description: >
  风险提醒（advisory）系统。评估实现风险并向用户提供建议。
  所有触发条件只产生提醒，不阻断执行。用户确认后继续。

triggers:
  - id: db_advisory
    condition: "involves_db_changes == true"
    severity: medium
    message: "涉及数据库 schema 变更"
    suggestion: "建议创建 migration 并验证回滚"

  - id: security_advisory
    condition: "involves_security == true"
    severity: high
    message: "涉及安全敏感逻辑（认证/授权/密码）"
    suggestion: "建议使用成熟方案，避免自行实现加密"

  - id: scope_advisory
    condition: "estimated_file_count > 8"
    severity: low
    message: "范围较大（{count} 文件）"
    suggestion: "建议拆分为多次提交"

  - id: complexity_advisory
    condition: "estimated_complexity == 'high'"
    severity: medium
    message: "复杂度较高"
    suggestion: "建议先实现核心逻辑，再完善边界"

behavior: advisory # 关键: 提醒而非阻断
```

---

## 7. 与 Team 流程的共存

### 7.1 并行使用场景

同一个项目中，Solo agent 和 Team agents 可以共存：

```
场景: NextJS 项目，已有 PRD + Architecture

简单功能 (加个页面、改个样式):
  → /solo *do "加个 FAQ 页面"
  → 直接实现，无需走 story 流程

复杂功能 (用户权限系统重构):
  → /sm *draft
  → 走标准 Team 流程: SM → Architect → Dev → QA
```

**规则**: Solo agent 不感知也不修改 Team 模式的任何产物（story、registry、proposal）。两个系统互不干扰。

### 7.2 何时用 Solo vs Team

| 场景               | 推荐                         |
| ------------------ | ---------------------------- |
| 新页面/组件        | Solo `*do`                   |
| CSS/样式调整       | Solo `*do`                   |
| Bug 修复           | Solo `*fix`                  |
| 简单 API 端点      | Solo `*do`                   |
| 涉及多模块的新功能 | Team (SM → Dev → QA)         |
| 安全敏感的认证系统 | Team (需要 Architect review) |
| 数据库大规模重构   | Team (需要 migration 审查)   |
| 需要 QA 独立验证   | Team                         |

**原则**: Solo 不设硬性限制。由用户判断是否适合 Solo。Solo 只在风险较高时提醒。

---

## 8. 实现计划

### 8.1 需要新增的文件

| 文件                                | 说明                   |
| ----------------------------------- | ---------------------- |
| `agents/solo.yaml`                  | Solo agent 定义        |
| `tasks/solo-init.md`                | `*init` 命令执行流程   |
| `tasks/solo-do.md`                  | `*do` 命令执行流程     |
| `tasks/solo-fix.md`                 | `*fix` 命令执行流程    |
| `tasks/solo-plan.md`                | `*plan` 命令执行流程   |
| `tasks/solo-status.md`              | `*status` 命令执行流程 |
| `data/decisions-solo-advisory.yaml` | 风险提醒规则           |

### 8.2 需要修改的文件

**无。** 独立 Agent 方案不需要修改任何现有文件。

可选更新（非必须）：

- `CLAUDE.md`: 在 Agent System 表中添加 Solo agent
- `docs/03-工作流程指南.md`: 添加 Solo 使用指引

### 8.3 安装流程

Solo agent 随 Orchestrix 一起安装，用户直接调用即可：

```bash
# Claude Code
/solo *do "添加搜索功能"

# Cursor / Windsurf
@solo *do "添加搜索功能"
```

无需 config 变更，无需模式切换。

---

## 9. 对比总结

### 9.1 开发体验对比

**添加一个 /about 页面**:

| 步骤     | Team (Dev \*solo)          | Solo Agent (\*do) |
| -------- | -------------------------- | ----------------- |
| 1        | 检查 git (阻断)            | 检查 git (警告)   |
| 2        | 创建 story 文件            | —                 |
| 3        | 生成 AC                    | —                 |
| 4        | 复杂度评估 (阻断式)        | 风险评估 (提醒式) |
| 5        | TDD 实现                   | 实现 + 测试       |
| 6        | 更新 story record          | —                 |
| 7        | Commit (含 story ID + AC)  | Commit (标准格式) |
| **产物** | story 文件 + 代码 + commit | 代码 + commit     |

### 9.2 项目文件对比

```
Team 模式新增文件:                Solo Agent 新增文件:
├── docs/stories/S-0001-*.md      (无)
├── docs/dev/logs/S-0001.md
└── (story record, AC, etc.)

Solo = 零文档开销
```

### 9.3 系统架构对比

**新增：全项目生命周期对比**

```
Team 模式（新项目）:
  Analyst → PM → UX → Architect → PM → PO → PO shard
  → SM *draft → Architect review → Dev → QA → Done
  → SM *draft → ...repeat...
  总计: 8+ Agent, N 轮交互, 大量文档

Solo 模式（新项目）:
  Solo *init "一句话描述"
  → Solo *do "功能A"
  → Solo *do "功能B"
  → Solo *do "功能C"
  → ...
  → 上线
  总计: 1 Agent, N 次 *do, 零文档
```

```
旧方案 (改造 Dev):
  core-config.yaml ──→ scale: solo ──→ Dev agent (条件分支)
                                        ├── IF solo: do 行为
                                        └── IF team: develop-story 行为
  问题: 分支逻辑复杂，互斥

新方案 (独立 Agent):
  Solo agent ──→ solo-do.md / solo-fix.md
  Dev agent  ──→ develop-story.md / quick-fix.md
  两者并行，互不影响
```
