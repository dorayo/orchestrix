# tmux Multi-Agent Automation Guide

本文档详细描述了 Orchestrix 基于 tmux 和 HANDOFF 机制的多智能体自动化协作系统。

## 目录

1. [概述](#1-概述)
2. [系统架构](#2-系统架构)
3. [核心组件](#3-核心组件)
4. [HANDOFF 机制](#4-handoff-机制)
5. [故障恢复机制](#5-故障恢复机制)
6. [安装与配置](#6-安装与配置)
7. [使用方法](#7-使用方法)
8. [故障排查](#8-故障排查)
9. [最佳实践](#9-最佳实践)

---

## 1. 概述

### 1.1 设计目标

Orchestrix tmux 自动化系统实现了**完全自动化的多智能体协作**，无需人工干预即可完成完整的开发流程：

```
SM (创建Story) → Architect (技术审核) → QA (测试设计) → Dev (实现) → QA (代码审核) → SM (下一个Story)
```

### 1.2 核心特性

- **自动化 HANDOFF**: Agent 完成任务后自动将工作交接给下一个 Agent
- **故障恢复**: 上下文压缩导致的遗忘可自动恢复
- **状态自愈**: 状态更新遗漏可被下游 Agent 自动修复
- **并行执行**: 4个 Agent 在独立窗口中并行准备，按需激活
- **去重机制**: Hash-based 去重防止重复处理

### 1.3 设计哲学

```
┌─────────────────────────────────────────────────────────────┐
│                    设计原则                                   │
├─────────────────────────────────────────────────────────────┤
│ 1. 无环境变量依赖 - Hook 脚本自动发现 session              │
│ 2. 幂等性 - 重复触发不会导致重复操作                        │
│ 3. 防御性编程 - 每个可能失败的点都有 fallback               │
│ 4. 可观测性 - 详细的日志记录便于调试                        │
│ 5. 自愈能力 - Agent 可检测并修复上游遗漏                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                         tmux Session: orchestrix                    │
├──────────────────────────┬─────────────────────────────────────────┤
│  Window 0: Architect     │  Window 2: Dev                          │
│  ┌────────────────────┐  │  ┌────────────────────┐                 │
│  │  Claude Code       │  │  │  Claude Code       │                 │
│  │  Agent: architect  │  │  │  Agent: dev        │                 │
│  │                    │  │  │                    │                 │
│  │  *review 9.4       │  │  │  *develop-story 9.4│                 │
│  └────────────────────┘  │  └────────────────────┘                 │
├──────────────────────────┼─────────────────────────────────────────┤
│  Window 1: SM            │  Window 3: QA                           │
│  ┌────────────────────┐  │  ┌────────────────────┐                 │
│  │  Claude Code       │  │  │  Claude Code       │                 │
│  │  Agent: sm         │  │  │  Agent: qa         │                 │
│  │                    │  │  │                    │                 │
│  │  *draft            │  │  │  *review 9.4       │                 │
│  └────────────────────┘  │  └────────────────────┘                 │
└──────────────────────────┴─────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Claude Code Hooks System                        │
├────────────────────────────────────────────────────────────────────┤
│  Stop Event Hook: handoff-detector.sh                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  1. 扫描所有窗口的终端输出                                     │  │
│  │  2. 检测 🎯 HANDOFF TO 模式                                    │  │
│  │  3. 解析目标 Agent 和命令                                      │  │
│  │  4. 发送命令到目标窗口                                         │  │
│  │  5. 清理源窗口并重载 Agent                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Fallback Recovery System                        │
├────────────────────────────────────────────────────────────────────┤
│  .orchestrix-core/runtime/pending-handoff.json                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  {                                                            │  │
│  │    "source_agent": "dev",                                     │  │
│  │    "target_agent": "qa",                                      │  │
│  │    "command": "*review 9.4",                                  │  │
│  │    "status": "pending"                                        │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流图

```
┌─────────┐    HANDOFF     ┌───────────┐    HANDOFF     ┌─────┐
│   SM    │ ─────────────► │ Architect │ ─────────────► │ QA  │
│         │  *review X.Y   │           │  *test-design  │     │
└─────────┘                └───────────┘                └─────┘
     ▲                                                      │
     │                                                      │
     │ *draft                                    *develop-story
     │                                                      │
     │                     ┌─────────┐                      ▼
     └──────────────────── │   Dev   │ ◄────────────────────┘
           HANDOFF         │         │        HANDOFF
           *review X.Y     └─────────┘
```

### 2.3 Window 映射

| Window Index | Agent Name | 功能                 | 主要命令                     |
| ------------ | ---------- | -------------------- | ---------------------------- |
| 0            | Architect  | 技术审核、架构决策   | `*review`, `*resolve-change` |
| 1            | SM         | Story 管理、迭代规划 | `*draft`, `*list`            |
| 2            | Dev        | 代码实现             | `*develop-story`             |
| 3            | QA         | 测试设计、代码审核   | `*test-design`, `*review`    |

---

## 3. 核心组件

### 3.1 Hook 脚本 (`handoff-detector.sh`)

**位置**: `.claude/hooks/handoff-detector.sh`

**触发时机**: Claude Code 的 Stop 事件（每次 Agent 响应结束时）

**核心逻辑**:

```bash
# 1. 发现 Orchestrix session
SESSION_NAME=$(tmux list-sessions -F '#{session_name}' | grep -E '^orchestrix' | head -1)

# 2. 扫描所有窗口寻找 HANDOFF
for win in 0 1 2 3; do
    OUTPUT=$(tmux capture-pane -t "$SESSION_NAME:$win" -p -S -100)
    LINE=$(echo "$OUTPUT" | grep -E '🎯.*HANDOFF.*TO' | tail -1)
    # ...
done

# 3. 解析 HANDOFF 消息
# 格式: 🎯 HANDOFF TO <agent>: *<command> <args>
if [[ "$LINE" =~ HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+) ]]; then
    TARGET="${BASH_REMATCH[1]}"
    CMD="*${BASH_REMATCH[2]}"
fi

# 4. 发送命令到目标窗口
tmux send-keys -t "$SESSION_NAME:$TARGET_WIN" "$CMD" Enter

# 5. 后台清理源窗口
(
    sleep 2
    tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" "/clear" Enter
    sleep 5
    tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" "$RELOAD_CMD" Enter
) &
```

### 3.2 Pending Handoff 注册 (`util-register-pending-handoff.md`)

**位置**: `.orchestrix-core/tasks/util-register-pending-handoff.md`

**用途**: 在长任务开始时预注册 HANDOFF 信息，作为 fallback

**输出文件**: `.orchestrix-core/runtime/pending-handoff.json`

```json
{
  "source_agent": "dev",
  "target_agent": "qa",
  "command": "*review 9.4",
  "story_id": "9.4",
  "task_description": "Story 9.4 implementation",
  "registered_at": "2025-12-16T08:22:24.000Z",
  "status": "pending"
}
```

### 3.3 状态自动修复 (`qa-review-story.md` Step 0.5)

**位置**: `.orchestrix-core/tasks/qa-review-story.md`

**用途**: 当 QA 收到 review 命令但 Story 状态不对时，自动检测并修复

**检测指标**:

1. Dev Agent Record 有 Final Summary
2. Dev Log 显示 GATE 1 & GATE 2 PASS
3. pending-handoff.json 存在且 status = pending

**修复动作**:

- 更新 Story 状态: InProgress/Approved → Review
- 添加 Change Log 条目: `[AUTO-RECOVERY]`

### 3.4 tmux Session 启动脚本

**位置**: `.orchestrix-core/utils/start-tmux-session.sh`

**功能**: 创建 2x2 布局的 tmux session，每个窗口加载对应 Agent

```bash
#!/bin/bash
SESSION="orchestrix-$(basename $(pwd) | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"

# 创建 session 和 4 个窗口
tmux new-session -d -s "$SESSION" -n "Arch"
tmux new-window -t "$SESSION" -n "SM"
tmux new-window -t "$SESSION" -n "Dev"
tmux new-window -t "$SESSION" -n "QA"

# 每个窗口启动 Claude Code 并加载对应 Agent
tmux send-keys -t "$SESSION:0" "cc" Enter
sleep 2
tmux send-keys -t "$SESSION:0" "/Orchestrix:agents:architect" Enter
# ... 其他窗口类似
```

---

## 4. HANDOFF 机制

### 4.1 HANDOFF 消息格式

```
🎯 HANDOFF TO <target_agent>: *<command> [args]
```

**示例**:

```
🎯 HANDOFF TO qa: *review 9.4
🎯 HANDOFF TO dev: *develop-story 9.4
🎯 HANDOFF TO sm: *draft
🎯 HANDOFF TO architect: *review-escalation 9.4
```

### 4.2 HANDOFF 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    HANDOFF 执行流程                              │
└─────────────────────────────────────────────────────────────────┘

Agent A 完成任务
       │
       ▼
┌─────────────────┐
│ 输出 HANDOFF    │  "🎯 HANDOFF TO qa: *review 9.4"
│ 消息            │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Claude Code     │  Stop 事件触发
│ Stop Event      │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Hook 脚本执行   │  handoff-detector.sh
└─────────────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│ 扫描终端输出    │                 │ 检查 Fallback   │
│ 寻找 HANDOFF    │                 │ 文件            │
└─────────────────┘                 └─────────────────┘
       │                                     │
       ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│ 找到 HANDOFF?   │───── No ──────►│ 有 pending-     │
│                 │                 │ handoff.json?   │
└─────────────────┘                 └─────────────────┘
       │ Yes                                 │ Yes
       ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│ Hash 去重检查   │                 │ 从文件恢复      │
│                 │                 │ HANDOFF 信息    │
└─────────────────┘                 └─────────────────┘
       │                                     │
       └─────────────┬───────────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ 获取目标窗口    │
           │ 获取锁          │
           └─────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ 发送命令到      │  tmux send-keys
           │ 目标窗口        │
           └─────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ 后台进程:       │
           │ - /clear 源窗口 │
           │ - 重载源 Agent  │
           │ - 释放锁        │
           └─────────────────┘
```

### 4.3 去重机制

Hook 使用 MD5 hash 防止重复处理同一 HANDOFF:

```bash
# 计算 HANDOFF 消息的 hash
HASH=$(echo "$LINE" | md5)

# 检查是否已处理
if grep -q "$HASH" "$PROCESSED_FILE"; then
    exit 0  # 跳过
fi

# 记录已处理
echo "$HASH" >> "$PROCESSED_FILE"
```

**Hash 自动清理**: 为防止相同消息（如连续的 `*draft`）被跳过，清理完成后自动移除该 hash：

```bash
# 在后台清理进程中，释放锁之前
if [[ -n "$HANDOFF_HASH" && -f "$PROCESSED_FILE" ]]; then
    grep -v "^${HANDOFF_HASH}$" "$PROCESSED_FILE" > "$PROCESSED_FILE.tmp" && mv -f "$PROCESSED_FILE.tmp" "$PROCESSED_FILE"
    log "[BG] Hash removed from processed file: $HANDOFF_HASH"
fi
```

### 4.4 锁机制

使用目录锁防止并发问题:

```bash
LOCK="/tmp/orchestrix-${SESSION_NAME}-${SOURCE_WIN}.lock"

# 获取锁
if ! mkdir "$LOCK" 2>/dev/null; then
    # 检查锁是否过期 (60s)
    # ...
fi

# 释放锁 (在后台进程中)
rm -rf "$LOCK"
```

---

## 5. 故障恢复机制

### 5.1 Context Compression 问题

**问题描述**: Claude Code 在长任务中会自动压缩上下文 (Compacting conversation)，这可能导致 Agent 忘记：

1. 输出 HANDOFF 消息
2. 更新 Story 状态

### 5.2 三层防御体系

```
┌─────────────────────────────────────────────────────────────────┐
│                    三层故障恢复体系                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: 预防 - Pending Handoff 注册                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 任务开始时写入 .orchestrix-core/runtime/pending-handoff.json │ │
│  │ 即使 Agent 忘记输出 HANDOFF，信息已保存                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  Layer 2: 检测 - Hook Fallback 读取                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Hook 未检测到 HANDOFF 时，检查 pending-handoff.json       │ │
│  │ 从文件恢复 HANDOFF 信息并执行                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                           │                                     │
│                           ▼                                     │
│  Layer 3: 修复 - 下游 Agent 状态自愈                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ QA Agent 检测到状态异常但 Dev 工作已完成                  │ │
│  │ 自动修复状态: InProgress/Approved → Review                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Layer 1: Pending Handoff 注册

**实现位置**:

- `develop-story.md` Step 0 (Dev 任务)
- `qa-review-story.md` Step 7.3 (QA 任务)

#### Dev 任务 (静态目标)

```markdown
## 0. ⚠️ MANDATORY: Register Pending HANDOFF (Fallback Safety Net)

> **CRITICAL**: This step MUST be executed FIRST before ANY other work. DO NOT SKIP.

### Step 0.1: Create the fallback file

**Action**: Use Write tool to create: `{root}/runtime/pending-handoff.json`

**Content**:
{
"source_agent": "dev",
"target_agent": "qa",
"command": "\*review {story_id}",
"story_id": "{story_id}",
"status": "pending"
}

### Step 0.2: Verify file creation

**Action**: Use Read tool to verify, then output:
[HANDOFF-REGISTERED] dev -> qa: \*review {story_id}

### Step 0.3: Gate Check

⛔ **HALT if** file creation fails
```

#### QA 任务 (动态目标)

```markdown
### 7.3 ⚠️ MANDATORY: Register Pending HANDOFF

> **CRITICAL**: Execute immediately after Gate Decision.

**Determine target based on gate_result**:

| gate_result   | target_agent | command                        |
| ------------- | ------------ | ------------------------------ |
| PASS          | sm           | \*draft                        |
| FAIL/CONCERNS | dev          | \*apply-qa-fixes {story_id}    |
| Escalated     | architect    | \*review-escalation {story_id} |

**Action**: Write to `{root}/runtime/pending-handoff.json` with determined values
```

**输出**:

```
[HANDOFF-REGISTERED] dev -> qa: *review 9.4
[HANDOFF-REGISTERED] qa -> sm: *draft
```

### 5.4 Layer 2: Hook Fallback

**实现位置**: `handoff-detector.sh`

```bash
# 没有在终端输出中找到 HANDOFF
if [[ -z "$TARGET" || -z "$CMD" ]]; then
    log "No HANDOFF in terminal output, checking fallback file..."

    # 查找 pending-handoff.json
    FALLBACK_FILE="$PANE_DIR/.orchestrix-core/runtime/pending-handoff.json"

    if [[ -f "$FALLBACK_FILE" ]]; then
        # 读取文件内容
        TARGET=$(jq -r '.target_agent' "$FALLBACK_FILE")
        CMD=$(jq -r '.command' "$FALLBACK_FILE")

        log "[FALLBACK] Recovered handoff: $SOURCE_AGENT -> $TARGET: $CMD"
    fi
fi
```

### 5.5 Layer 3: 状态自动修复

**实现位置**: `qa-review-story.md` Step 0.5

```markdown
## Step 0.5: Status Auto-Recovery (Conditional)

**Trigger**: status = "InProgress" OR "Approved"

### 检查 Dev 完成指标:

1. Dev Agent Record 有 Final Summary
2. Dev Log 显示 GATE 1 & GATE 2 PASS
3. pending-handoff.json 存在且 status = pending

### 如果任一指标为真:

1. Log: "⚠️ [AUTO-RECOVERY] Dev work complete but status not updated"
2. Update status: InProgress/Approved -> Review
3. Add Change Log: "[AUTO-RECOVERY] Status corrected"
4. Continue to Validation
```

---

## 6. 安装与配置

### 6.1 前置要求

```bash
# 安装 tmux
brew install tmux

# 确保 Claude Code 已安装
which claude  # 或 which cc

# 可选: 安装 jq (用于 JSON 解析)
brew install jq
```

### 6.2 安装 Orchestrix

```bash
# 进入项目目录
cd your-project

# 安装 Orchestrix (Claude Code IDE)
npx orchestrix install --ide claude-code
```

### 6.3 验证安装

```bash
# 检查文件是否存在
ls -la .claude/hooks/handoff-detector.sh
ls -la .orchestrix-core/tasks/util-register-pending-handoff.md
ls -la .orchestrix-core/utils/start-tmux-session.sh

# 检查 hook 权限
chmod +x .claude/hooks/handoff-detector.sh
```

### 6.4 配置 Claude Code Alias

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
alias cc='claude'

# 重载配置
source ~/.zshrc
```

---

## 7. 使用方法

### 7.1 启动自动化

```bash
# 从项目根目录
./.orchestrix-core/utils/start-tmux-session.sh
```

### 7.2 窗口布局

启动后会看到 2x2 布局:

```
┌──────────────┬──────────────┐
│ 0: Architect │ 2: Dev       │
├──────────────┼──────────────┤
│ 1: SM        │ 3: QA        │
└──────────────┴──────────────┘
```

### 7.3 启动工作流

在 SM 窗口 (Window 1) 中输入:

```
*draft
```

或指定 story:

```
*draft 9.5
```

### 7.4 tmux 常用快捷键

| 快捷键          | 功能                |
| --------------- | ------------------- |
| `Ctrl+b → o`    | 切换到下一个窗格    |
| `Ctrl+b → ;`    | 切换到上一个窗格    |
| `Ctrl+b → ↑↓←→` | 方向键导航          |
| `Ctrl+b → z`    | 最大化/恢复当前窗格 |
| `Ctrl+b → d`    | 分离 (后台运行)     |
| `Ctrl+b → [`    | 滚动模式 (`q` 退出) |

### 7.5 重新连接

```bash
# 查看 session
tmux list-sessions

# 重新连接
tmux attach -t orchestrix-yourproject
```

### 7.6 监控日志

```bash
# 实时查看 handoff 日志
tail -f /tmp/orchestrix-orchestrix-yourproject-handoff.log
```

---

## 8. 故障排查

### 8.1 Hook 未触发

**症状**: Agent 输出了 HANDOFF 但下一个 Agent 没有收到命令

**排查步骤**:

```bash
# 1. 检查 hook 配置
claude /hooks

# 2. 检查 hook 权限
ls -la .claude/hooks/handoff-detector.sh
# 应该是 -rwxr-xr-x

# 3. 手动测试 hook
bash .claude/hooks/handoff-detector.sh

# 4. 检查日志
cat /tmp/orchestrix-handoff.log | tail -20
```

### 8.2 Session 未找到

**症状**: 日志显示 "No orchestrix session found"

**解决方案**:

```bash
# 检查 session 名称
tmux list-sessions

# Session 名称必须以 "orchestrix" 开头
# 例如: orchestrix-myproject
```

### 8.3 命令发送失败

**症状**: 日志显示 "ERROR: Failed to send command"

**排查步骤**:

```bash
# 1. 检查目标窗口是否存在
tmux list-windows -t orchestrix-yourproject

# 2. 手动测试发送
tmux send-keys -t "orchestrix-yourproject:2" "test" Enter
```

### 8.4 Fallback 未生效

**症状**: Agent 忘记 HANDOFF，但 fallback 也没有工作

**排查步骤**:

```bash
# 1. 检查 pending-handoff 文件
cat .orchestrix-core/runtime/pending-handoff.json

# 2. 检查文件状态
# status 应该是 "pending"，不是 "completed"

# 3. 检查日志
grep "fallback" /tmp/orchestrix-*-handoff.log
```

### 8.5 状态修复未生效

**症状**: QA 收到命令但报告 "status = InProgress"

**排查步骤**:

```bash
# 1. 检查 Dev Log
cat docs/dev/logs/X.Y-dev-log.md | grep -i "gate"

# 2. 检查 Story 文件中的 Dev Agent Record
cat docs/stories/X.Y.*.md | grep -A 10 "Dev Agent Record"

# 3. 手动触发状态检查
# QA 会在 Step 0.5 自动检查
```

---

## 9. 最佳实践

### 9.1 Session 命名

使用项目名称作为 session 后缀:

```bash
# Good
orchestrix-myproject
orchestrix-frontend
orchestrix-backend

# Bad
orchestrix
my-session
```

### 9.2 日志管理

```bash
# 定期清理旧日志
find /tmp -name "orchestrix-*.log" -mtime +7 -delete

# 归档重要日志
cp /tmp/orchestrix-*-handoff.log ~/logs/
```

### 9.3 长任务监控

对于长任务 (如 Dev 实现)，建议:

1. 每 5 分钟检查一次进度
2. 观察 context compaction 是否发生
3. 确认 pending-handoff.json 已创建

### 9.4 故障恢复

如果自动化中断:

```bash
# 1. 检查当前状态
cat docs/stories/X.Y.*.md | grep "Status:"

# 2. 手动触发下一步
# 在目标窗口输入命令
*review X.Y  # 或其他命令

# 3. 检查并修复 pending-handoff.json
echo '{"status": "completed"}' > .orchestrix-core/runtime/pending-handoff.json
```

### 9.5 开发新任务

为新的长任务添加 HANDOFF 支持:

1. 在任务开头添加 `util-register-pending-handoff.md` 调用
2. 在任务结尾添加明确的 HANDOFF 输出格式
3. 测试 context compression 场景

---

## 附录

### A. 文件清单

| 文件路径                                                  | 用途              |
| --------------------------------------------------------- | ----------------- |
| `.claude/hooks/handoff-detector.sh`                       | Hook 脚本         |
| `.claude/settings.local.json`                             | Hook 配置         |
| `.orchestrix-core/tasks/util-register-pending-handoff.md` | 注册工具          |
| `.orchestrix-core/tasks/develop-story.md`                 | Dev 任务 (含注册) |
| `.orchestrix-core/tasks/qa-review-story.md`               | QA 任务 (含自愈)  |
| `.orchestrix-core/utils/start-tmux-session.sh`            | 启动脚本          |
| `.orchestrix-core/runtime/pending-handoff.json`           | 运行时状态文件    |

### B. 日志文件

| 路径                                      | 内容                |
| ----------------------------------------- | ------------------- |
| `/tmp/orchestrix-handoff.log`             | 通用日志 (初始)     |
| `/tmp/orchestrix-{session}-handoff.log`   | Session 专用日志    |
| `/tmp/orchestrix-{session}-processed.txt` | 已处理 HANDOFF 记录 |

### C. 环境变量 (可选)

| 变量                 | 用途              | 默认值   |
| -------------------- | ----------------- | -------- |
| `ORCHESTRIX_SESSION` | 指定 session 名称 | 自动检测 |

---

## 更新日志

| 日期       | 版本  | 变更                                                 |
| ---------- | ----- | ---------------------------------------------------- |
| 2025-12-16 | 1.0.0 | 初始版本                                             |
| 2025-12-16 | 1.1.0 | 添加故障恢复机制 (Layer 1-3)                         |
| 2025-12-16 | 1.2.0 | 强制 Step 0 fallback 注册，添加验证和 HALT 条件      |
| 2025-12-16 | 1.3.0 | QA Step 7.3 动态注册 pending-handoff，支持多目标场景 |
| 2025-12-16 | 1.4.0 | Hash 自动清理机制，修复连续相同消息被跳过的问题      |
