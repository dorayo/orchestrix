# Orchestrix 核心内容架构深度分析

## 项目概览

Orchestrix 是一个通用 AI 代理框架，用于协调 AI 驱动的开发。核心是一个精心设计
的三层内容架构，实现了**内容分离、单一职责、零冗余**的原则。

---

## 一、核心目录结构

```
orchestrix-core/
├── agents/                    # Agent 定义和命令
│   ├── common/               # 共享配置
│   │   ├── common-agent-config.yaml      # 通用 agent 配置
│   │   └── common-workflow-rules.yaml    # 通用工作流规则
│   ├── *.src.yaml           # 源文件（可编辑，带 $include）
│   ├── *.yaml               # 编译后的文件（自动生成，展平）
│
├── tasks/                     # 任务执行流程（75+ 文件）
│   ├── utils/                # 通用工具任务
│   │   ├── load-architecture-context.md
│   │   ├── load-cumulative-context.md
│   │   ├── validate-against-cumulative-context.md
│   │   ├── validate-status-transition.md
│   │   ├── validate-agent-permission.md
│   │   └── ... (13 个工具文件)
│   ├── decision-evaluator/   # 决策执行框架
│   │   ├── list-decisions.md
│   │   ├── evaluate-decision.md
│   │   └── ...
│   └── *.md                  # 主任务文件（60+ 个）
│
├── templates/                # 文档输出模板（26 个）
│   ├── story-tmpl.yaml
│   ├── prd-tmpl.yaml
│   ├── architecture-tmpl.yaml
│   ├── front-end-architecture-tmpl.yaml
│   ├── mobile-architecture-tmpl.yaml
│   └── ... (其他专用模板)
│
├── checklists/               # 质量控制清单
│   ├── workflow/             # 工作流检查表（4 个）
│   │   ├── architect-validation.md
│   │   ├── po-master-validation.md
│   │   ├── pm-validation.md
│   │   └── change-navigation.md
│   ├── gate/                 # 通过/失败质量门
│   │   ├── dev-implementation-gate.md
│   │   ├── dev-completion-steps.md
│   │   ├── sm-story-creation-gate.md
│   │   └── sm-story-completion-gate.md
│   └── scoring/              # 评分评估（0-10）
│       ├── sm-story-quality.md
│       ├── architect-technical-review.md
│       └── qa-review-rounds.md
│
├── data/                      # 知识库和决策规则
│   ├── decisions/            # 决策逻辑（YAML）
│   │   ├── sm-story-status.yaml
│   │   ├── architect-review-result.yaml
│   │   ├── qa-gate-decision.yaml
│   │   └── ... (22 个决策文件)
│   ├── agent-commands.yaml   # Agent 命令映射
│   ├── story-status-transitions.yaml
│   ├── story-update-permissions.yaml
│   ├── epic-story-mapping-schema.yaml
│   └── ... (知识库 MD 文件)
│
├── agent-teams/              # Agent 团队包
│   ├── team-all.yaml
│   ├── team-fullstack.yaml
│   ├── team-ide-minimal.yaml
│   └── team-no-ui.yaml
│
├── workflows/                # 工作流定义（6 个）
│   ├── greenfield-fullstack.yaml
│   ├── greenfield-service.yaml
│   ├── greenfield-ui.yaml
│   ├── brownfield-fullstack.yaml
│   ├── brownfield-service.yaml
│   └── brownfield-ui.yaml
│
├── utils/                     # 工具脚本
│   └── start-tmux-session.sh
│
└── core-config.yaml          # 核心系统配置
```

---

## 二、内容类型统计

| 类型                | 数量 | 说明                                             |
| ------------------- | ---- | ------------------------------------------------ |
| **Agents (编译前)** | 6    | sm, dev, qa, architect, decision-evaluator +     |
| common 共享配置     |
| **Agents (编译后)** | 13   | 包含预编译的其他 agents（analyst, pm, po,        |
| ux-expert 等）      |
| **Tasks**           | 75   | 包含 60+ 主任务，13 个工具任务，4 个决策执行任务 |
| **Templates**       | 26   | 文档输出格式模板（story, prd, architecture 等）  |
| **Checklists**      | 11   | workflow(4) + gate(4) + scoring(3)               |
| **Decision Files**  | 22   | YAML 规则文件，定义决策逻辑                      |
| **Data/Config**     | 10+  | 知识库、权限、状态转换、schema                   |
| **Workflows**       | 6    | 项目流程定义（greenfield/brownfield）            |
| **总计**            | ~178 | orchestrix-core 中的文件总数                     |

---

## 三、三层内容架构（核心原则）

Orchestrix 严格遵循**三层内容分离**原则，避免内容重复：

### 第1层：Agent 文件 (`agents/*.yaml`)

**职责**：Agent 身份和命令定义

- Agent 元数据（名称、ID、图标、角色）
- 可用工具列表
- 3-5 条核心原则
- 命令映射到任务文件
- 个性化配置

**不包含**：详细执行步骤、长工作流规则、任务内容

**示例**：

```yaml
agent:
  name: 姜欢
  id: sm
  title: Scrum Master
  commands:
    - draft:
        description: "Create next story from epic"
        task: create-next-story.md # ← 引用任务文件，不嵌入内容
      params:
        - name: story_id
```

### 第2层：Task 文件 (`tasks/*.md`)

**职责**：完整的步骤和执行流程

- 逐步执行程序
- 输入/输出规范
- 决策点和条件逻辑
- 错误处理流程
- 对 templates、checklists、decisions 的**引用**（不嵌入）

**不包含**：Agent 身份、重复的 checklist 项目、分散的决策规则

**示例**：

```markdown
## Create Next Story Task

### Step 3: Create Story Using Template

Generate story using template: `templates/story-tmpl.yaml`

### Step 6: Determine Story Status

Execute: `{root}/tasks/make-decision.md`

- Input: architect_review_result, test_design_level
- Output: final story status
```

### 第3层：Data/Decisions (`data/decisions/*.yaml`)

**职责**：集中的决策逻辑

- 所有条件判断规则
- 状态转换矩阵
- 决策条件-结果映射

**不包含**：分散在任务中的逻辑

**示例**：

```yaml
# data/decisions/sm-story-status.yaml
decision_type: sm-story-status
rules:
  - condition: "architect_review_result == 'REQUIRED'"
    result: AwaitingArchReview
    next_action: "handoff_to_architect"
```

---

## 四、文件引用关系（数据流）

### 1. Agent → Task 映射

```
Agent Command (*.yaml)
    ↓
Task File (*.md)  ← 单一源
    ↓
├─ References Template
├─ References Checklist
├─ References Decision
└─ References Utils Task
```

**示例**：SM Agent `draft` 命令流程

```
sm.yaml
  ↓ (command: draft)
create-next-story.md (主任务)
  ↓
├─ Load: core-config.yaml
├─ Load: load-architecture-context.md (utils)
├─ Load: load-cumulative-context.md (utils)
├─ Generate: using templates/story-tmpl.yaml
├─ Execute: make-decision.md (决策框架)
│   ├─ Load: data/decisions/sm-architect-review-needed.yaml
│   └─ Load: data/decisions/sm-story-status.yaml
└─ Execute: sm-story-creation-gate.md (checklist)
```

### 2. Task → Template 引用方式

```
Task File (.md)
  ↓ (内容中标记)
"Use template: `{root}/templates/story-tmpl.yaml`"
  ↓
Template File (.yaml)
  ↓ (结构定义)
Output Markdown Document
```

**重要**：Task 不嵌入模板内容，只**引用路径**。安装器和 IDE 会解析这些引用。

### 3. Task → Checklist 执行方式

```
Task File (.md)
  ↓ (step 中标记)
"Execute: {root}/checklists/gate/dev-implementation-gate.md"
  ↓
Checklist File (.md)
  ↓ (自包含的执行逻辑)
生成 gate_result (pass/fail)
```

**特点**：Checklist 是**自包含**的，包含完整执行指令和评分逻辑。

### 4. Task → Decision 调用方式

```
Task File (.md)
  ↓ (step 中标记)
"Execute: {root}/tasks/make-decision.md"
  ├─ Input: decision_type: "sm-story-status"
  │           context: {architect_review_result, test_design_level}
  ↓
make-decision.md (通用决策框架)
  ↓
Load: {root}/data/decisions/sm-story-status.yaml
  ↓
Evaluate Rules (YAML)
  ↓
Output: {story_status, next_action, metadata}
```

### 5. Task → Utils Task 包含方式

```
Task File (.md)
  ↓ (step 中标记)
"Execute: {root}/tasks/utils/load-architecture-context.md"
  ↓
Utils Task (.md)
  ↓
完成子流程，返回结果
```

---

## 五、10 个核心 Agents

### Planning Team（推荐 Web 界面）

| Agent            | ID        | 职责                 | 输出              |
| ---------------- | --------- | -------------------- | ----------------- |
| Analyst (分析师) | analyst   | 项目分析、市场研究   | project-brief.md  |
| PM               | pm        | 产品管理、需求定义   | prd.md            |
| UX Expert        | ux-expert | 用户体验设计         | front-end-spec.md |
| Architect        | architect | 技术架构设计         | architecture.md   |
| PO (产品所有者)  | po        | 一致性验证、文档整理 | shard documents   |

### Development Team（推荐 IDE）

| Agent        | ID  | 职责                 | 关键任务             |
| ------------ | --- | -------------------- | -------------------- |
| Scrum Master | sm  | Story 创建、迭代管理 | create-next-story.md |
| Dev          | dev | 功能实现、技术执行   | develop-story.md     |
| QA           | qa  | 代码审查、测试验证   | qa-review-story.md   |

### Orchestrators

| Agent                   | ID                      | 职责                 |
| ----------------------- | ----------------------- | -------------------- |
| Orchestrix Master       | orchestrix-master       | 跨域一次性任务       |
| Orchestrix Orchestrator | orchestrix-orchestrator | 工作流协调、多 agent |
| 任务                    |

### Decision Evaluator

| Agent              | ID                 | 职责           |
| ------------------ | ------------------ | -------------- |
| Decision Evaluator | decision-evaluator | 中央决策执行器 |

---

## 六、Agent 编译系统

### 双文件架构

Agents 使用源→编译工作流：

1.  **源文件** (`.src.yaml`)：人类可读，支持 `$include` 指令

```yaml
$include:
  - common/common-agent-config.yaml
  - common/common-workflow-rules.yaml

agent:
  name: 姜欢
  id: sm
  # ... 具体配置
```

2.  **编译文件** (`.yaml`)：展平、运行时使用

- `$include` 被展开并内联
- 自动生成，不手工编辑
- 通过 `node tools/compile-agents.js compile` 生成

### 编译流程

```
*.src.yaml (包含 $include)
    ↓
agent-compiler.js (使用 yaml-compiler)
    ↓
*.yaml (全部内联，展平)
    ↓
Installer (复制到用户项目)
    ↓
IDE Setup (生成 IDE 配置)
```

### 源文件列表（需要编译）

- `sm.src.yaml` → `sm.yaml`
- `dev.src.yaml` → `dev.yaml`
- `qa.src.yaml` → `qa.yaml`
- `architect.src.yaml` → `architect.yaml`
- `decision-evaluator.src.yaml` → `decision-evaluator.yaml`

### 预编译文件（已存在）

- `analyst.yaml` (无 .src.yaml)
- `pm.yaml`
- `po.yaml`
- `ux-expert.yaml`
- `orchestrix-master.yaml`
- `orchestrix-orchestrator.yaml`

---

## 七、安装流程架构

### 安装器如何利用核心内容

```
npx orchestrix install [--ide {ide-type}]
    ↓
tools/installer/lib/installer.js
    ├─ 1. 编译 agents (如需要)
    │      └─ agent-compiler.js 调用 yaml-compiler
    │         └─ 展平 .src.yaml → .yaml
    │
    ├─ 2. 复制 orchestrix-core 到用户项目
    │      └─ 复制到: {project}/.orchestrix-core/
    │         ├─ agents/ (*.yaml 编译文件)
    │         ├─ tasks/ (*.md)
    │         ├─ templates/ (*.yaml)
    │         ├─ checklists/ (*.md)
    │         ├─ data/ (*.yaml, *.md)
    │         ├─ workflows/ (*.yaml)
    │         └─ core-config.yaml
    │
    ├─ 3. IDE 特定配置生成
    │      └─ ide-setup.js
    │         ├─ 检测 IDE (Claude Code, Cursor, Windsurf, 等)
    │         ├─ 解析 agent YAML，提取命令
    │         ├─ 替换 {root} → .orchestrix-core
    │         └─ 生成 IDE 特定文件：
    │            ├─ Claude Code: .claude/agents/, .claude/commands/
    │            ├─ Cursor: .cursor/rules/
    │            ├─ Windsurf: .windsurf/rules/
    │            └─ 等等
    │
    └─ 4. 配置初始化
           ├─ 复制 core-config.yaml 到 {project}/.orchestrix-core/
           ├─ 用户可编辑关键配置：
           │  ├─ project.name
           │  ├─ project.mode (monolith/multi-repo)
           │  ├─ prdSharded (bool)
           │  ├─ devStoryLocation
           │  └─ 等等
           └─ IDE 从 core-config.yaml 读取配置
```

### IDE 集成

安装器生成的 IDE 配置包含：

**Claude Code** (SubAgents + Commands)

```
.claude/agents/{agent-id}.md
  ↓ (包含)
.orchestrix-core/agents/{agent-id}.yaml (YAML 配置展开为 MD)
  ↓ (包含)
.orchestrix-core/tasks/{task-id}.md

.claude/commands/{command-name}.md
  ↓
.orchestrix-core/tasks/{task-id}.md
```

**Cursor/Windsurf** (Rules)

```
.cursor/rules/{agent-id}.mdc
  ↓ (包含)
.orchestrix-core/agents/{agent-id}.yaml
.orchestrix-core/tasks/{task-id}.md
```

---

## 八、关键数据结构

### Story YAML Schema

```yaml
epic_id: 1
story_id: 1.3
title: "User Login Implementation"
status: [Blocked, AwaitingArchReview, TestDesignComplete, Approved,
InProgress, Review, Done]
acceptance_criteria:
  - "User can input email and password"
  - "System returns JWT token on success"
tasks:
  - [subtasks with checkboxes]
change_log:
  - timestamp: "2024-11-27T10:00:00Z"
    agent: "sm"
    action: "Created story"
```

### Decision YAML Schema

```yaml
decision_type: string # 决策类型 ID
description: string
inputs:
  - name: string # 输入变量名
    type: string # 数据类型
    required: boolean
rules:
  - condition: string # 条件表达式
    result: string # 结果值
    reasoning: string # 推理过程
    next_action: string
    metadata: object
output:
  { field }: { schema }
```

### Agent YAML Schema

```yaml
agent:
  name: string
  id: string
  title: string
  icon: emoji
  tools: [list of tools]
  persona: {role, style, identity, focus}
  customization: [list of rules]

workflow_rules:
  - "Rule 1"
  - "Rule 2"

commands:
  - {command_name}:
      description: string
      task: {task_file}.md
      params: [list of parameters]
```

---

## 九、核心配置（core-config.yaml）

```yaml
title: Orchestrix Core System
project:
  name: "My Project"
  mode: monolith | multi-repo
  multi_repo:
    role: product | implementation | backend | frontend | ios | android
    repository_id: ""
    product_repo_path: ""
    auto_filter_stories: false

prd:
  prdFile: docs/prd.md
  prdSharded: false
  prdShardedLocation: docs/prd

architecture:
  architectureFile: docs/architecture.md
  architectureSharded: false
  architectureShardedLocation: docs/architecture

devLoadAlwaysFiles:
  - docs/architecture/coding-standards.md
  - docs/architecture/tech-stack.md
  - docs/architecture/source-tree.md

devStoryLocation: docs/stories
dev:
  devLogLocation: docs/dev/logs
  devLogEnabled: true

qa:
  qaLocation: docs/qa
  qaReviewsLocation: docs/qa/reviews
  testDesignThresholds:
    simple: { maxComplexity: 0, minQualityScore: 8.5 }
    standard: { maxComplexity: 2, minQualityScore: 7 }
    comprehensive: { minComplexity: 3 }

version: 12.1.2
```

---

## 十、75+ 任务文件分类

### 主要任务（60+）

**Planning Phase**

- `create-deep-research-prompt.md` - 深度研究提示
- `aggregate-system-analysis.md` - 系统分析聚合

**Story Management**

- `create-next-story.md` - 创建下一个 Story
- `create-story-auto.md` - 自动 Story 创建
- `create-brownfield-story.md` - Brownfield Story
- `revise-story-from-architect-feedback.md` - 根据反馈修订 Story

**Architecture**

- `architect-review-story.md` - Architect 审查 Story
- `architect-lock-api-contract.md` - 锁定 API 合约
- `architect-resolve-change.md` - 解决架构变更

**Development**

- `develop-story.md` - 开发 Story
- `dev-self-review.md` - Dev 自审
- `dev-database-migration.md` - 数据库迁移

**QA & Review**

- `qa-review-story.md` - QA 审查 Story
- `qa-gate.md` - QA 质量门
- `review-code-auto.md` - 自动代码审查
- `test-design.md` - 测试设计

**Validation & Verification**

- `validate-story-quality.md` - 验证 Story 质量
- `validate-functional-auto.md` - 自动功能验证
- `validate-container-auto.md` - 容器验证

**其他任务**

- `index-docs.md` - 文档索引
- `make-decision.md` - 决策执行框架
- `risk-profile.md` - 风险评估
- `orchestrator-automation.md` - Orchestrator 自动化

### Utility Tasks（13 个）

```
tasks/utils/
├─ load-architecture-context.md
├─ load-cumulative-context.md
├─ validate-against-cumulative-context.md
├─ validate-status-transition.md
├─ validate-agent-permission.md
├─ validate-api-contract.md
├─ validate-agent-action.md
├─ classify-change-level.md
├─ extract-story-status.md
├─ parse-legacy-dev-record.md
├─ update-api-registry.md
├─ update-database-registry.md
└─ update-resumption-guide.md
```

### Decision Evaluator Tasks（4 个）

```
tasks/decision-evaluator/
├─ list-decisions.md
├─ evaluate-decision.md
├─ batch-evaluate.md
└─ test-decision.md
```

---

## 十一、26 个模板文件

| 类别             | 模板                                                   | 用途               |
| ---------------- | ------------------------------------------------------ | ------------------ |
| **Story**        | story-tmpl.yaml                                        | Story 文档标准格式 |
| **Product**      | prd-tmpl.yaml, brownfield-prd-tmpl.yaml                | 产品需求文档       |
| **Architecture** | architecture-tmpl.yaml, system-architecture-tmpl.yaml, |

front-end-architecture-tmpl.yaml, mobile-architecture-tmpl.yaml,
fullstack-architecture-tmpl.yaml, brownfield-architecture-tmpl.yaml | 架构文档
|
| **Project Brief** | project-brief-tmpl.yaml | 项目简报 |
| **Front-end** | front-end-spec-tmpl.yaml | 前端规范 |
| **API** | api-contracts-tmpl.yaml, api-registry-tmpl.yaml, rest-api-spec.md
| API 合约和注册表 |
| **Database** | database-registry-tmpl.yaml | 数据库注册表 |
| **Models** | models-registry-tmpl.yaml | 数据模型注册表 |
| **Review** | architect-review-tmpl.yaml, architect-review-gate-tmpl.yaml,
qa-review-tmpl.yaml, qa-review-lite-tmpl.yaml, qa-gate-tmpl.yaml | 审查文档 |
| **Research** | market-research-tmpl.yaml, competitor-analysis-tmpl.yaml |
研究文档 |
| **Brainstorming** | brainstorming-output-tmpl.yaml | 头脑风暴输出 |
| **Dev Log** | dev-change-log-qa-fixes-tmpl.yaml | Dev 变更日志 |
| **QA Messages** | qa-handoff-message-tmpl.yaml, qa-idempotency-messages.yaml
| QA 交接消息 |

---

## 十二、11 个 Checklist 文件

### Workflow Checklists（4 个）

自包含的工作流验证：

- `architect-validation.md` - Architect 验证流程
- `po-master-validation.md` - PO 主控制清单
- `pm-validation.md` - PM 验证
- `change-navigation.md` - 变更导航

### Gate Checklists（4 个）

100% 通过/失败的质量门：

- `dev-implementation-gate.md` - Dev 实现质量门（7 条关键项）
- `dev-completion-steps.md` - Dev 完成步骤
- `sm-story-creation-gate.md` - SM Story 创建门
- `sm-story-completion-gate.md` - SM Story 完成门

### Scoring Checklists（3 个）

0-10 评分评估：

- `sm-story-quality.md` - SM Story 质量评分
- `architect-technical-review.md` - Architect 技术审查评分
- `qa-review-rounds.md` - QA 审查轮数

---

## 十三、22 个 Decision Files

### Story Management

- `sm-story-status.yaml` - Story 最终状态
- `sm-architect-review-needed.yaml` - 是否需要 Architect 审查
- `sm-test-design-level.yaml` - 测试设计级别
- `sm-revision-approval.yaml` - 修订批准

### Architect Review

- `architect-review-result.yaml` - 审查结果
- `architect-change-escalation.yaml` - 变更升级

### Dev

- `dev-self-review-decision.yaml` - Dev 自审决策
- `dev-block-story.yaml` - 是否 block story
- `dev-escalate-architect.yaml` - 是否升级给 Architect

### QA

- `qa-gate-decision.yaml` - QA 质量门决策
- `qa-post-review-workflow.yaml` - 审查后工作流
- `qa-test-design-update.yaml` - 测试设计更新
- `qa-escalate-architect.yaml` - 升级给 Architect

### Change Management

- `change-level-classification.yaml` - 变更级别分类
- `po-change-escalation.yaml` - PO 变更升级
- `sm-change-escalation.yaml` - SM 变更升级

### System

- `story-status-sync.yaml` - 状态同步规则
- `OPTIMIZATION_SUMMARY.md` - 优化总结
- `README.md` - 决策系统文档

---

## 十四、扩展包系统

```
expansion-packs/
├─ orchestrix-2d-phaser-game-dev/
│  ├─ agents/         # 游戏专用 agents
│  ├─ tasks/          # 游戏开发任务
│  ├─ templates/      # 游戏文档模板
│  ├─ checklists/     # 游戏检查清单
│  ├─ data/           # 游戏知识库
│  ├─ agent-teams/    # 游戏 agent 团队
│  ├─ workflows/      # 游戏工作流
│  └─ config.yaml     # 包配置
│
├─ orchestrix-infrastructure-devops/
│  ├─ agents/
│  ├─ tasks/
│  └─ ...
│
└─ orchestrix-creator-tools/
   ├─ agents/
   ├─ tasks/
   └─ ...
```

每个扩展包是独立的，有自己的 agents/tasks/templates/data。

---

## 十五、关键文件间引用关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      IDE (Claude Code, Cursor, 等)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  .claude/agents/sm.md                                        │
│     ↓ (includes)                                             │
│  .orchestrix-core/agents/sm.yaml                             │
│     ↓ (command: draft → task)                                │
│  .orchestrix-core/tasks/create-next-story.md                 │
│     ├─ references: templates/story-tmpl.yaml                 │
│     ├─ references: templates/architecture-tmpl.yaml          │
│     ├─ executes: tasks/utils/load-architecture-context.md    │
│     ├─ executes: tasks/utils/load-cumulative-context.md      │
│     ├─ executes: tasks/utils/validate-against-...md          │
│     ├─ executes: tasks/make-decision.md                      │
│     │   ├─ loads: data/decisions/sm-architect-review...yaml  │
│     │   └─ loads: data/decisions/sm-story-status.yaml        │
│     ├─ executes: checklists/gate/sm-story-creation-gate.md   │
│     └─ references: core-config.yaml                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 十六、安装流程关键步骤

```
1. Compile Agents
   orchestrix-core/agents/*.src.yaml → *.yaml

2. Copy Core Files
   orchestrix-core/ → {project}/.orchestrix-core/

3. Generate IDE Config
   解析 agents/*.yaml 的 commands
   生成 IDE 特定文件
   替换 {root} → .orchestrix-core

4. Copy Utils
   start-tmux-session.sh → .orchestrix-core/utils/

5. Initialize Config
   core-config.yaml → {project}/.orchestrix-core/
   用户可编辑
```

---

## 十七、关键设计原则总结

1.  **三层分离**
    - Layer 1 (Agents): 身份、命令映射
    - Layer 2 (Tasks): 执行流程、引用
    - Layer 3 (Data): 集中决策逻辑

2.  **引用，不嵌入**
    - Tasks 引用 templates，不嵌入内容
    - Tasks 引用 checklists，不复制规则
    - Tasks 引用 decisions，不分散逻辑

3.  **单一源**
    - 每个 template 一个文件
    - 每个 decision 一个 YAML
    - 无冗余，无重复

4.  **Agent 编译**
    - 源文件支持 `$include` (人类可读)
    - 编译文件展平且自包含 (运行时用)
    - 自动化编译流程

5.  **IDE 无关**
    - 核心内容独立于 IDE
    - Installer 生成 IDE 特定配置
    - 支持多个 IDE 并行使用

6.  **配置集中化**
    - `core-config.yaml` 是单一配置源
    - Tasks 从配置读取路径和设置
    - 用户项目可覆盖默认配置

7.  **可扩展**
    - 扩展包使用相同的结构
    - 无需修改核心 agents
    - 新任务、新 agents 独立添加

---

## 十八、文件大小和复杂度

| 组件       | 行数范围 | 文件数 | 总复杂度          |
| ---------- | -------- | ------ | ----------------- |
| Agents     | 82-270   | 13     | 低（主要是配置）  |
| Tasks      | 50-500   | 75     | 中（执行流程）    |
| Templates  | 30-150   | 26     | 低（结构定义）    |
| Checklists | 100-400  | 11     | 中-高（验证逻辑） |
| Decisions  | 40-100   | 22     | 中（规则评估）    |
| Config     | 50-200   | 5+     | 低（配置值）      |

**总计**：~178 文件，约 20,000+ 行的高质量内容
