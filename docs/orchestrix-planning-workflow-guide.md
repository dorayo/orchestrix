# Orchestrix Planning Workflow Guide

> 从 Idea 到第一个 Story 创建的完整工作流程

## 概述

本文档描述 Orchestrix 框架的标准规划流程，由 6 个专业 Agent 协作完成：

| 步骤 | Agent     | 角色         | 产出物                       |
| ---- | --------- | ------------ | ---------------------------- |
| 1    | Analyst   | 需求分析师   | `docs/project-brief.md`      |
| 2    | PM        | 产品经理     | `docs/prd.md`                |
| 3    | UX-Expert | 用户体验专家 | `docs/front-end-spec.md`     |
| 4    | Architect | 架构师       | `docs/architecture.md`       |
| 5    | PO        | 产品负责人   | 验证报告 + 分片文档          |
| 6    | SM        | Scrum Master | `docs/stories/{story_id}.md` |

---

## 文档生成模式 (重要)

规划阶段的所有 `*create-doc` 命令支持两种执行模式。**智能助手应在每个文档创建步骤前询问用户选择哪种模式**。

### 模式对比

| 特性       | Elicitation 模式 (默认)        | YOLO 模式                    |
| ---------- | ------------------------------ | ---------------------------- |
| 交互方式   | 逐章节引导式对话               | 一次性生成完整文档           |
| 用户参与度 | 高 - 每章节需确认              | 低 - 仅最终审阅              |
| 生成速度   | 较慢 (取决于用户响应)          | 快速 (几分钟内完成)          |
| 适用场景   | 需求不明确、首次使用、复杂项目 | 需求清晰、时间紧迫、快速原型 |
| 质量控制   | 过程中持续优化                 | 生成后一次性审阅             |

### Elicitation 模式 (引导式对话)

**定义**: Agent 逐章节展示内容，每个章节提供 1-9 选项菜单，用户可以深入探讨、提问或确认后进入下一章节。

**优点**:

- 更精确地捕捉用户真实需求
- 降低遗漏重要细节的风险
- 用户可在过程中学习和思考
- 每个决策都经过用户确认
- 适合需求模糊或复杂的项目

**交互格式**:

```
[Agent 展示章节内容 + 决策理由]

请选择:
1. 进入下一章节
2. 头脑风暴 - 发散思考更多可能性
3. 5 Why 分析 - 深入探究根本原因
4. SWOT 分析 - 评估优劣势和机会威胁
5. 用户故事映射 - 从用户视角重新审视
6. 假设验证 - 质疑当前假设
7. 竞品对比 - 参考竞争对手做法
8. 技术可行性 - 评估实现难度
9. 风险评估 - 识别潜在风险

请选择 1-9 或直接输入您的问题/反馈:
```

**命令格式**:

```
@{agent} *create-doc {template}
```

### YOLO 模式 (快速生成)

**定义**: Agent 基于已有信息和最佳实践，一次性生成完整文档，用户仅在最后进行审阅。

**优点**:

- 节省大量时间
- 适合需求明确的项目
- 快速获得可迭代的初稿
- 减少决策疲劳
- 适合经验丰富的用户

**注意事项**:

- 关键章节 (标记 `elicit: true`) 仍需用户确认
- 安全和验收相关内容仍需人工审核
- 生成后应仔细审阅并提出修改意见

**命令格式**:

```
@{agent} *create-doc {template} --yolo
```

**或在对话中触发**:

```
用户: #yolo
```

### 智能助手询问模板

在每个文档创建步骤开始前，智能助手应使用以下模板询问用户：

```
现在需要创建 [文档名称]。请选择生成模式：

**1. Elicitation 模式 (推荐首次使用)**
   - 逐章节引导，每步都可以深入探讨
   - 适合：需求不太明确、希望充分讨论、复杂项目
   - 时间：较长，取决于讨论深度

**2. YOLO 模式 (快速生成)**
   - 基于已有信息一次性生成完整文档
   - 适合：需求清晰、时间紧迫、快速迭代
   - 时间：几分钟内完成

您想使用哪种模式？(输入 1 或 2)
```

### 模式选择决策树

```
用户是否首次使用 Orchestrix?
├─ 是 → 推荐 Elicitation 模式
└─ 否 → 继续判断
         ↓
    需求是否已经非常清晰?
    ├─ 是 → 可选择 YOLO 模式
    └─ 否 → 推荐 Elicitation 模式
              ↓
         是否有时间压力?
         ├─ 是 → 可选择 YOLO 模式
         └─ 否 → 推荐 Elicitation 模式
```

### 混合使用策略

用户可以在流程中灵活切换：

1. **从 Elicitation 切换到 YOLO**:
   - 在对话中输入 `#yolo` 即可跳过剩余章节的逐一确认

2. **从 YOLO 返回 Elicitation**:
   - 对生成的文档提出具体问题或修改意见
   - Agent 将针对该部分进行引导式讨论

3. **推荐组合**:
   - Project Brief: Elicitation (奠定项目基础)
   - PRD: Elicitation (需求定义关键)
   - Front-End Spec: YOLO (如果 PRD 已清晰)
   - Architecture: Elicitation (技术决策重要)

---

## 流程状态机

```
[用户想法]
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: PLANNING (规划阶段)                                 │
├─────────────────────────────────────────────────────────────┤
│ Step 1: Analyst → Project Brief                             │
│    ↓                                                        │
│ Step 2: PM → PRD                                            │
│    ↓                                                        │
│ Step 3: UX-Expert → Front-End Spec                          │
│    ↓                                                        │
│ Step 4: Architect → Architecture Doc                        │
│    ↓                                                        │
│ Step 5: PM → Update PRD (如果架构师建议变更)                  │
│    ↓                                                        │
│ Step 6: PO → Validate & Shard                               │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: DEVELOPMENT (开发阶段)                              │
├─────────────────────────────────────────────────────────────┤
│ Step 7: SM → Create First Story                             │
│    ↓                                                        │
│ [Story 进入开发循环: Architect Review → Dev → QA]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Analyst - 创建项目简报

### Agent 信息

- **Agent ID**: `analyst`
- **角色**: 需求分析师 (Kongming)
- **输入**: 用户想法/需求描述
- **输出**: `docs/project-brief.md`

### 指令

**Elicitation 模式** (默认，推荐):

```
@analyst *create-doc project-brief-tmpl.yaml
```

**YOLO 模式** (快速生成):

```
@analyst *create-doc project-brief-tmpl.yaml --yolo
```

### 模式说明

| 模式        | 适用场景                   | 预计时间   |
| ----------- | -------------------------- | ---------- |
| Elicitation | 项目想法初步、需要深入探讨 | 20-40 分钟 |
| YOLO        | 用户已有清晰的项目描述     | 3-5 分钟   |

### 主要收集信息

- 项目愿景和目标
- 目标用户群体
- 核心问题/痛点
- 期望解决方案
- 成功标准
- 约束条件

### 可选前置命令

```
@analyst *brainstorm {topic}        # 结构化头脑风暴
@analyst *research-prompt {topic}   # 生成深度研究提示
```

### 完成标志

- 文件 `docs/project-brief.md` 已创建
- 所有必要章节已填充
- 用户确认内容准确

### 手动处理

- 直接将 `project-brief-tmpl.yaml` 拖入与 Analyst 的对话
- 或在对话中说明需要创建项目简报

---

## Step 2: PM - 创建产品需求文档

### Agent 信息

- **Agent ID**: `pm`
- **角色**: 产品经理 (Liangning)
- **输入**: `docs/project-brief.md`
- **输出**: `docs/prd.md`

### 指令

**Elicitation 模式** (默认，强烈推荐):

```
@pm *create-doc prd-tmpl.yaml
```

**YOLO 模式** (快速生成):

```
@pm *create-doc prd-tmpl.yaml --yolo
```

### 模式说明

| 模式        | 适用场景                     | 预计时间   |
| ----------- | ---------------------------- | ---------- |
| Elicitation | PRD 是项目核心，建议充分讨论 | 30-60 分钟 |
| YOLO        | Project Brief 已非常详细     | 5-10 分钟  |

> **建议**: PRD 定义项目的功能边界和验收标准，Elicitation 模式可避免后期频繁返工。

### 前置条件

- `docs/project-brief.md` 必须存在

### 主要产出

- 产品目标和范围
- 用户画像 (Personas)
- 功能需求列表
- **Epic 定义** (YAML 格式)
- 验收标准总览
- 优先级和里程碑

### Epic YAML 格式 (关键)

PM 必须在 PRD 中定义 Epic，格式如下：

```yaml
epic_id: 1
title: "用户认证系统"
description: |
  实现完整的用户注册、登录、密码重置功能
stories:
  - id: "1.1"
    title: "用户注册 API"
    repository_type: backend # backend | frontend | ios | android | monolith
    acceptance_criteria:
      - id: AC1
        title: "邮箱注册"
        scenario:
          given: "用户在注册页面"
          when: "提交有效的邮箱和密码"
          then:
            - "账户创建成功"
            - "发送验证邮件"
        business_rules:
          - "BR1: 密码至少8位"
          - "BR2: 邮箱必须唯一"
    estimated_complexity: medium
    priority: P0
```

### 完成标志

- 文件 `docs/prd.md` 已创建
- 包含至少一个 Epic 定义 (YAML 格式)
- 每个 Story 有明确的 Acceptance Criteria

---

## Step 3: UX-Expert - 创建前端规格文档

### Agent 信息

- **Agent ID**: `ux-expert`
- **角色**: 用户体验专家 (Jingwen)
- **输入**: `docs/prd.md`
- **输出**: `docs/front-end-spec.md`

### 指令

**Elicitation 模式** (默认):

```
@ux-expert *create-doc front-end-spec-tmpl.yaml
```

**YOLO 模式** (快速生成):

```
@ux-expert *create-doc front-end-spec-tmpl.yaml --yolo
```

### 模式说明

| 模式        | 适用场景                              | 预计时间   |
| ----------- | ------------------------------------- | ---------- |
| Elicitation | 对 UI/UX 有特定要求、需要讨论交互细节 | 20-40 分钟 |
| YOLO        | PRD 已包含足够 UI 描述、快速原型阶段  | 5-8 分钟   |

> **建议**: 如果 PRD 已经详细描述了用户界面，YOLO 模式通常足够。

### 前置条件

- `docs/prd.md` 必须存在

### 主要产出

- 信息架构 (IA)
- 用户流程图
- 线框图/原型描述
- 组件库/设计系统
- 品牌风格指南
- 可访问性要求
- 响应式策略

### 可选高级命令

```
@ux-expert *generate-ui-prompt      # 生成 AI 前端生成提示 (用于 v0, Lovable 等)
@ux-expert *research {topic}        # 用户研究深度提示
```

### 跳过条件

- **纯后端项目**: 无 UI 时可跳过此步骤
- 直接进入 Step 4 (Architect)

### 完成标志

- 文件 `docs/front-end-spec.md` 已创建
- 覆盖所有用户面向功能的 UI/UX 规格

---

## Step 4: Architect - 创建架构文档

### Agent 信息

- **Agent ID**: `architect`
- **角色**: 架构师 (Aiden)
- **输入**: `docs/prd.md` + `docs/front-end-spec.md`
- **输出**: `docs/architecture.md`

### 指令

**单体项目 (Monolith)**:

| 模式        | 命令                                                             |
| ----------- | ---------------------------------------------------------------- |
| Elicitation | `@architect *create-doc fullstack-architecture-tmpl.yaml`        |
| YOLO        | `@architect *create-doc fullstack-architecture-tmpl.yaml --yolo` |

**纯后端项目**:

| 模式        | 命令                                                   |
| ----------- | ------------------------------------------------------ |
| Elicitation | `@architect *create-doc architecture-tmpl.yaml`        |
| YOLO        | `@architect *create-doc architecture-tmpl.yaml --yolo` |

**多仓库项目 (Multi-Repo)**:

```
# 产品仓库
@architect *create-system-architecture [--yolo]    → docs/system-architecture.md

# 各实现仓库
@architect *create-backend-architecture [--yolo]   → docs/architecture.md (后端)
@architect *create-frontend-architecture [--yolo]  → docs/architecture.md (前端)
@architect *create-mobile-architecture [--yolo]    → docs/architecture.md (移动端)
```

### 模式说明

| 模式        | 适用场景                       | 预计时间   |
| ----------- | ------------------------------ | ---------- |
| Elicitation | 技术选型需要讨论、架构决策关键 | 30-50 分钟 |
| YOLO        | 技术栈已确定、项目类型常见     | 8-15 分钟  |

> **建议**: 架构决策影响整个项目，首次使用建议 Elicitation 模式讨论技术选型。

### 前置条件

- `docs/prd.md` 必须存在

### 主要产出

- 技术栈选择
- 项目结构 (Source Tree)
- 编码规范
- 数据模型
- API 规格
- 数据库设计
- 测试策略
- 部署架构

### 架构师可能的输出

架构师可能建议 PRD 变更:

- 新增 Story
- 调整现有 Story 范围
- 技术可行性问题

**如有变更建议**: 进入 Step 5

### 完成标志

- 文件 `docs/architecture.md` 已创建
- 技术栈明确
- 项目结构清晰
- 编码规范定义

---

## Step 5: PM - 更新 PRD (条件步骤)

### 触发条件

仅当 Architect 建议变更时执行:

- 新增 Story
- 调整 Story 范围
- 技术可行性调整

### 指令

```
@pm *revise-prd
```

### 执行细节

1. PM 接收架构师反馈
2. 更新相关 Epic/Story 定义
3. 重新导出 `docs/prd.md`

### 跳过条件

- 架构师无变更建议
- 直接进入 Step 6 (PO)

---

## Step 6: PO - 验证与分片

### Agent 信息

- **Agent ID**: `po`
- **角色**: 产品负责人 (Jianghuan)
- **输入**: 所有规划文档
- **输出**: 验证报告 + 分片目录

### 6.1 验证阶段

```
@po *execute-checklist
```

**验证内容**:

- PRD 完整性和一致性
- Front-End Spec 与 PRD 对齐
- Architecture 与需求匹配
- Epic/Story 定义完整

**验证失败处理**:

- 返回相应 Agent 修复问题
- 例如: AC 不完整 → 返回 PM
- 例如: 技术方案不明确 → 返回 Architect

### 6.2 分片阶段

**前置条件**: 验证通过

```
@po *shard
```

**分片产出**:

```
docs/prd/
├── 1-overview.md
├── 2-narrative.md
├── 3-personas.md
├── 4-requirements.md
├── 5-epic-list.md
├── 6-epics.md                         # 原始 Epics 章节
├── 7-acceptance-criteria.md
├── next-steps.md                      # 可能带数字前缀如 8-next-steps.md
├── epic-1-user-authentication.yaml    # 提取的 Epic YAML
├── epic-2-product-catalog.yaml
└── ...

docs/architecture/
├── 01-tech-stack.md
├── 02-source-tree.md
├── 03-coding-standards.md
├── ...
└── XX-testing-strategy.md
```

### 依赖工具

```bash
# 安装 md-tree CLI (必需)
npm install -g @kayvan/markdown-tree-parser
```

### 配置更新

分片后 `core-config.yaml` 自动更新:

```yaml
prdSharded: true
prdShardedLocation: docs/prd
architectureSharded: true
architectureShardedLocation: docs/architecture
```

### 完成标志

- `docs/prd/` 目录包含分片文件
- `docs/prd/epic-*.yaml` 文件已生成
- `core-config.yaml` 已更新

---

## Step 7: SM - 创建第一个 Story

### Agent 信息

- **Agent ID**: `sm`
- **角色**: Scrum Master (JH)
- **输入**: 分片后的 PRD (`docs/prd/epic-*.yaml`)
- **输出**: `docs/stories/{story_id}-{title}.md`

### 指令

**自动发现下一个 Story**:

```
@sm *draft
```

**创建指定 Story**:

```
@sm *draft 1.1
```

### 前置条件检查

SM 会自动验证:

1. `prdSharded = true` (PRD 已分片)
2. `docs/prd/epic-*.yaml` 文件存在
3. 非产品仓库 (多仓库模式下)

**验证失败处理**:

- `PRD not sharded` → 返回 PO 执行 `*shard`
- `Cannot create stories in product repository` → 切换到实现仓库

### 执行流程

```
Step 1: 加载配置
    ↓
Step 2: 扫描 Epic YAML → 识别下一个 Story
    ↓
Step 3: 验证依赖 (多仓库时检查前置 Story 状态)
    ↓
Step 4: 加载架构上下文
    ↓
Step 5: 加载累积上下文 (检查类型冲突)
    ↓
Step 6: 创建 Story 文档
    ↓
Step 7: 执行质量评估 (Gate)
    ↓
Step 8: 决定下一步状态
    ↓
Step 9: 输出 HANDOFF 消息
```

### Story 文件结构

```markdown
# Story {id}: {title}

## Story Metadata

- ID: 1.1
- Status: Draft
- Epic: 1 - 用户认证
- Repository: backend
- Priority: P0

## Acceptance Criteria

### AC1: 邮箱注册

**Scenario**
GIVEN 用户在注册页面
WHEN 提交有效的邮箱和密码
THEN 账户创建成功...

## Tasks

- [ ] T0: 基础设施准备
- [ ] T1.1: 实现 AC1 测试
- [ ] T1.2: 实现 AC1 功能
      ...

## Dev Notes

### 技术约束

...

### 累积上下文

...
```

### 状态流转

Story 创建后可能进入以下状态:

| 条件                            | 目标状态           | 下一步      |
| ------------------------------- | ------------------ | ----------- |
| 简单 Story (质量 ≥8, 复杂度=0)  | TestDesignComplete | → Dev       |
| 中等复杂度 (质量 ≥8, 复杂度 ≥1) | AwaitingArchReview | → Architect |
| 高复杂度或质量不足              | AwaitingArchReview | → Architect |
| 质量过低 (< 6.0)                | Blocked            | SM 需修订   |

### HANDOFF 输出示例

**需要架构审查**:

```
✅ STORY CREATED - ARCHITECT REVIEW REQUIRED
Story: 1.1 - 用户注册 API
Status: AwaitingArchReview
Quality: 7.5/10 | Complexity: 2/7

🎯 HANDOFF TO architect: *review 1.1
```

**直接进入开发**:

```
✅ STORY CREATED - READY FOR DEVELOPMENT
Story: 1.1 - 用户注册 API
Status: TestDesignComplete
Quality: 8.5/10 | Test Design: Simple

🎯 HANDOFF TO dev: *develop-story 1.1
```

---

## 完整流程示例

### 用户对话示例 (包含模式选择)

```
用户: 我想做一个在线课程平台

AI助手: 好的！让我们开始规划这个项目。首先需要创建项目简报。

📝 现在需要创建 **Project Brief (项目简报)**

请选择生成模式：

**1. Elicitation 模式 (推荐首次使用)**
   - 逐章节引导，每步都可以深入探讨
   - 适合：需求不太明确、希望充分讨论
   - 时间：约 20-40 分钟

**2. YOLO 模式 (快速生成)**
   - 基于您的描述一次性生成完整文档
   - 适合：想法已经很清晰、时间紧迫
   - 时间：约 3-5 分钟

您想使用哪种模式？

用户: 1

AI助手: 好的，使用 Elicitation 模式创建项目简报。

→ @analyst *create-doc project-brief-tmpl.yaml

[Analyst 逐章节与用户交互，收集需求]
[每个章节展示 1-9 选项菜单]
[产出: docs/project-brief.md]

AI助手: 项目简报已完成！现在需要创建 **PRD (产品需求文档)**。

请选择生成模式：
1. Elicitation 模式 (推荐 - PRD 是项目核心)
2. YOLO 模式 (快速生成)

用户: 1

AI助手: 好的，使用 Elicitation 模式创建 PRD。

→ @pm *create-doc prd-tmpl.yaml

[PM 与用户交互，定义 Epic 和 Story]
[产出: docs/prd.md]

AI助手: PRD 已完成！现在需要创建 **Front-End Spec (前端规格)**。

请选择生成模式：
1. Elicitation 模式
2. YOLO 模式 (推荐 - PRD 已详细描述 UI)

用户: 2

AI助手: 好的，使用 YOLO 模式快速生成前端规格。

→ @ux-expert *create-doc front-end-spec-tmpl.yaml --yolo

[UX-Expert 基于 PRD 快速生成完整文档]
[产出: docs/front-end-spec.md]

AI助手: 前端规格已生成！请审阅后告诉我是否需要修改。

如果满意，我们继续创建 **Architecture (架构文档)**。

请选择生成模式：
1. Elicitation 模式 (推荐 - 技术决策重要)
2. YOLO 模式

用户: 1

AI助手: 好的，使用 Elicitation 模式创建架构文档。

→ @architect *create-doc fullstack-architecture-tmpl.yaml

[Architect 与用户讨论技术选型]
[产出: docs/architecture.md]

AI助手: 架构文档已完成！现在让 PO 验证所有文档一致性。

→ @po *execute-checklist

[PO 验证所有文档]
[验证通过]

AI助手: 验证通过！现在进行文档分片。

→ @po *shard

[分片完成]
[产出: docs/prd/ 和 docs/architecture/ 目录]

AI助手: 分片完成！现在可以创建第一个 Story 了。

→ @sm *draft

[SM 创建第一个 Story]
[产出: docs/stories/1.1-用户注册-api.md]

AI助手: 🎉 第一个 Story 已创建！

Story 1.1: 用户注册 API
状态: AwaitingArchReview

下一步: 架构师审查
🎯 HANDOFF TO architect: *review 1.1
```

### 快速模式示例 (全程 YOLO)

```
用户: 我想做一个简单的待办事项 App，需求很简单，请快速帮我规划

AI助手: 好的，既然需求清晰，我们使用 YOLO 模式快速完成规划。

→ @analyst *create-doc project-brief-tmpl.yaml --yolo
[生成 docs/project-brief.md]

→ @pm *create-doc prd-tmpl.yaml --yolo
[生成 docs/prd.md]

→ @ux-expert *create-doc front-end-spec-tmpl.yaml --yolo
[生成 docs/front-end-spec.md]

→ @architect *create-doc fullstack-architecture-tmpl.yaml --yolo
[生成 docs/architecture.md]

→ @po *execute-checklist
[验证通过]

→ @po *shard
[分片完成]

→ @sm *draft
[生成 docs/stories/1.1-xxx.md]

AI助手: 🚀 规划完成！全部文档已生成，第一个 Story 已创建。

请审阅生成的文档，如有需要调整的地方请告诉我。
```

---

## 命令速查表

### 文档创建命令 (支持两种模式)

| 阶段 | Agent     | Elicitation 模式                               | YOLO 模式  | 产出                     |
| ---- | --------- | ---------------------------------------------- | ---------- | ------------------------ |
| 1    | Analyst   | `*create-doc project-brief-tmpl.yaml`          | `+ --yolo` | `docs/project-brief.md`  |
| 2    | PM        | `*create-doc prd-tmpl.yaml`                    | `+ --yolo` | `docs/prd.md`            |
| 3    | UX-Expert | `*create-doc front-end-spec-tmpl.yaml`         | `+ --yolo` | `docs/front-end-spec.md` |
| 4    | Architect | `*create-doc fullstack-architecture-tmpl.yaml` | `+ --yolo` | `docs/architecture.md`   |

### 其他命令 (无模式选择)

| 阶段 | Agent | 命令                 | 产出                               |
| ---- | ----- | -------------------- | ---------------------------------- |
| 5    | PM    | `*revise-prd`        | 更新 `docs/prd.md`                 |
| 6a   | PO    | `*execute-checklist` | 验证报告                           |
| 6b   | PO    | `*shard`             | `docs/prd/` + `docs/architecture/` |
| 7    | SM    | `*draft`             | `docs/stories/{id}.md`             |

### 模式切换快捷方式

| 操作                 | 方法                   |
| -------------------- | ---------------------- |
| 在对话中切换到 YOLO  | 输入 `#yolo`           |
| 对 YOLO 结果提出修改 | 直接描述需要修改的内容 |

---

## 关键决策点

### 何时需要返回上一步?

| 当前步骤  | 问题           | 返回目标   |
| --------- | -------------- | ---------- |
| PM        | 项目目标不清晰 | Analyst    |
| UX-Expert | 需求不明确     | PM         |
| Architect | 技术可行性问题 | PM         |
| PO 验证   | 文档不一致     | 相应 Agent |
| SM        | PRD 未分片     | PO         |

### 何时可以跳过步骤?

| 步骤               | 跳过条件          |
| ------------------ | ----------------- |
| Step 3 (UX-Expert) | 纯后端项目，无 UI |
| Step 5 (PM 更新)   | 架构师无变更建议  |

---

## 错误处理

### 常见错误及解决方案

| 错误信息                                      | 原因              | 解决方案                 |
| --------------------------------------------- | ----------------- | ------------------------ |
| `PRD not sharded`                             | PRD 未分片        | `@po *shard`             |
| `No Epic YAML files found`                    | Epic 提取失败     | 检查 PRD 中的 YAML 格式  |
| `Cannot create stories in product repository` | 在产品仓库执行 SM | 切换到实现仓库           |
| `Dependency blocked`                          | 前置 Story 未完成 | 先完成依赖 Story         |
| `Gate FAIL - Story blocked`                   | 质量不达标        | `@sm *revise {story_id}` |

---

## 附录: Agent 激活方式

根据使用的 IDE，激活 Agent 的方式不同:

| IDE         | 激活方式                      |
| ----------- | ----------------------------- |
| Claude Code | `/analyst` 或 SubAgent 选择   |
| Cursor      | `@analyst`                    |
| Windsurf    | `@analyst`                    |
| Roo Code    | 模式选择 `orchestrix-analyst` |

---

## 注意事项

1. **两种生成模式**: 所有 `*create-doc` 命令支持 Elicitation (默认) 和 YOLO (`--yolo`) 两种模式
2. **模式选择时机**: 智能助手应在每个文档创建步骤前询问用户偏好
3. **推荐策略**: Project Brief 和 PRD 建议使用 Elicitation；后续文档可根据情况选择 YOLO
4. **文档分片**: 分片后原始文档会被归档，分片目录成为唯一真实来源
5. **累积上下文**: SM 创建 Story 时会检查与之前 Story 的类型冲突
6. **HANDOFF 格式**: Agent 完成任务后会输出 `🎯 HANDOFF TO {agent}: *{command}` 格式的交接消息
7. **模式切换**: 用户可随时在对话中输入 `#yolo` 切换到快速模式
