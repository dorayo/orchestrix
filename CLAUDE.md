# CLAUDE.md

## Git Commit Format (OVERRIDE)

**CRITICAL**: 所有提交必须使用以下格式：

```
{conventional commit message}

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
```

**禁止**使用 `Claude Code` 或 `Co-Authored-By` 格式。

## Project Overview

Orchestrix 是通用 AI Agent 框架，通过标准化工作流协调专业 AI Agent 完成复杂软件项目。

**核心理念**: 协调优于控制 | 专业化优于通用化 | 标准化优于随机化

## Common Commands

```bash
# Build
npm run build              # 构建所有 web bundles
npm run validate           # 验证配置

# Install
npx orchestrix install -i claude-code
npx orchestrix status

# Test
node tools/quick-ide-test.js
npm run format
```

## Directory Structure

```
orchestrix-core/
├── agents/*.yaml        # Agent 定义（直接编辑）
├── tasks/*.md           # 任务指令（util-* 前缀为工具任务）
├── templates/*.yaml     # 文档模板
├── checklists/          # 质量检查（gate-*/scoring-*/workflow-* 前缀）
├── data/                # 知识库（decisions-* 前缀为决策规则）
└── core-config.yaml     # 核心配置
```

**三层架构原则** - 避免内容重复：

- **Agent Files**: 身份、命令、3-5条核心原则
- **Task Files**: 完整执行步骤、输入输出、决策点
- **Data/Decisions**: 所有决策逻辑集中管理

## Agent System

| Team        | Agents                                | 推荐环境 |
| ----------- | ------------------------------------- | -------- |
| Planning    | Analyst, PM, UX-Expert, Architect, PO | Web      |
| Development | SM, Dev, QA                           | IDE      |

Agent 文件为独立 `.yaml`，直接编辑即可生效。

## Story Format

| 元素         | 格式                              | 示例                                          |
| ------------ | --------------------------------- | --------------------------------------------- |
| Story ID     | `{epic}.{story}`                  | `1.1`, `2.3`                                  |
| Story 文件名 | `{epic}.{story}-{kebab-title}.md` | `1.3-user-authentication-api.md`              |
| Story 路径   | `docs/stories/{filename}`         | `docs/stories/1.3-user-authentication-api.md` |

## Handoff Format

```
🎯 HANDOFF TO {agent}: *{command} {story_id}
```

| 场景            | Handoff                                    |
| --------------- | ------------------------------------------ |
| SM → Architect  | `🎯 HANDOFF TO architect: *review 1.1`     |
| SM → Dev        | `🎯 HANDOFF TO dev: *develop-story 1.1`    |
| Architect → Dev | `🎯 HANDOFF TO dev: *develop-story 1.1`    |
| Architect → SM  | `🎯 HANDOFF TO SM: *revise 1.1`            |
| Dev → QA        | `🎯 HANDOFF TO qa: *review 1.1`            |
| QA → Dev        | `🎯 HANDOFF TO dev: *apply-qa-fixes 1.1`   |
| PO → PM         | `🎯 HANDOFF TO PM: *revise-prd`            |
| PO → Architect  | `🎯 HANDOFF TO ARCHITECT: *resolve-change` |

## Workflow

### Standard 8-Step Workflow

**Phase 1 (Planning)**: Analyst → PM → UX-Expert → Architect → PM → PO
**Phase 2 (Development)**: SM → (Architect review) → Dev ↔ QA loop

### Post-MVP Iteration

```
PM *start-iteration → UX-Expert (if UI) → Architect → SM → Dev → QA
```

### Project Status Check

```
PM *status           # 查看项目状态、健康评分、下一步建议
PM *status --verbose # 包含详细 Story 列表
```

详见 `docs/03-工作流程指南.md`

### Story Status (8 States)

`Blocked` → `AwaitingArchReview` → `RequiresRevision` → `Approved` → `InProgress` → `Review` → `Done` / `Escalated`

状态转换定义：`data/story-status-transitions.yaml`

## Quality Gates

| Gate               | 阈值                                         | 说明                       |
| ------------------ | -------------------------------------------- | -------------------------- |
| SM Story Quality   | Score ≥ 8.0 + Complexity ≤ 1 → Auto-Approved | 否则需 Architect Review    |
| Dev Implementation | ≥ 95% weighted score                         | 9项100%必须 + 13项加权评分 |
| Architect Review   | Max 2 rounds                                 | 防止无限循环               |
| QA Review          | Max 3 rounds                                 | 渐进标准                   |

**QA Auto-Commit**: Gate=PASS + Status=Done 时自动执行 git commit

## IDE Integration

| IDE         | 配置位置               | 使用方式      |
| ----------- | ---------------------- | ------------- |
| Claude Code | `.claude/agents/*.md`  | `/agent-name` |
| Cursor      | `.cursor/rules/*.mdc`  | `@agent-name` |
| Windsurf    | `.windsurf/rules/*.md` | `@agent-name` |

## Configuration

**Core Config**: `orchestrix-core/core-config.yaml`

```yaml
project:
  mode: monolith # or multi-repo
  multi_repo:
    role: implementation # product | backend | frontend | ios | android | mobile
    repository_id: ""
    product_repo_path: ""
```

## Change Handling

### 入口判断 (PO `*route-change`)

| 变更类型 | 关键词示例                           | 路由目标           |
| -------- | ------------------------------------ | ------------------ |
| 纯技术   | API, database, performance, security | Architect          |
| 纯产品   | feature, user story, MVP, scope      | PM                 |
| 混合     | 同时包含两类关键词                   | PM (product-first) |

### Change Handling Workflow

```
用户提出变更
    ↓
[PO *route-change] ─→ 判断类型
    ↓
┌───────┴───────┐
↓               ↓
技术变更      产品/混合变更
↓               ↓
[Architect]   [PM *revise-prd]
*resolve-change     ↓
↓             创建 PCP
创建 TCP          ↓
↓          需要技术变更?
↓         ┌──NO──┴──YES──┐
↓         ↓              ↓
↓      直接→SM      [Architect]
↓                  *resolve-change
↓                  (带 related_product_proposal)
↓                       ↓
↓                  创建 TCP + 双向链接
↓                       ↓
└───────────→[SM *apply-proposal]←───────────┘
                    ↓
              创建/修改 Stories
                    ↓
              标准开发流程
              (Architect Review → Dev → QA)
```

### Proposal 系统

| 类型            | ID 格式        | 存储位置                  | 生成者    |
| --------------- | -------------- | ------------------------- | --------- |
| Product (PCP)   | `PCP-YYYY-NNN` | `docs/proposals/product/` | PM        |
| Technical (TCP) | `TCP-YYYY-NNN` | `docs/proposals/tech/`    | Architect |

**Proposal ID 自动递增**: 扫描目录 → 找最大序号 → +1

**双向链接**: PCP.related_tech_proposal ↔ TCP.related_product_proposal

### SM Proposal 处理

```bash
# 指定 proposal
SM *apply-proposal PCP-2025-003

# 自动发现 (推荐)
SM *apply-proposal
# → 自动扫描 draft 状态的 proposals
# → 链接的 PCP+TCP 一起处理 (product-first)
```

**处理顺序**: 如果存在链接的 PCP+TCP，先处理 PCP，再处理 TCP

## Key Patterns

### Decision Centralization

所有决策逻辑在 `data/decisions-*.yaml`，通过 `tasks/make-decision.md` 执行

### Template Reference

Tasks 引用 templates，不重复定义格式

### File Naming

- Agents: `agent-name.yaml`
- Tasks: `kebab-case.md`
- Checklists: `gate-*` / `scoring-*` / `workflow-*`

## Important Notes

- **Never commit** `dist/` 目录
- **Use conventional commits** 触发自动版本管理
- **Reference, don't duplicate** - tasks 引用 templates/decisions
- **Test locally** 推送前用 `npm run validate` 验证

## Further Reading

| 文档                                 | 内容         |
| ------------------------------------ | ------------ |
| `docs/00-设计哲学.md`                | 设计理念     |
| `docs/02-核心架构.md`                | 完整架构说明 |
| `docs/03-工作流程指南.md`            | 详细工作流   |
| `docs/ORCHESTRIX-TMUX-AUTOMATION.md` | tmux 自动化  |
