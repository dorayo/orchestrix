# Orchestrix 多 Agent 自动化协作 - 完整方案

## 一、方案概述

### 核心架构

```
┌─────────────────────────────────────────────────────────┐
│                    tmux Session: orchestrix              │
│  ┌──────────────────────┬──────────────────────┐       │
│  │ Pane 0: Architect    │ Pane 2: Dev          │       │
│  │ AGENT_ID=architect   │ AGENT_ID=dev         │       │
│  │ cc → /Orchestrix:    │ cc → /Orchestrix:    │       │
│  │   agents:architect   │   agents:dev         │       │
│  ├──────────────────────┼──────────────────────┤       │
│  │ Pane 1: SM           │ Pane 3: QA           │       │
│  │ AGENT_ID=sm          │ AGENT_ID=qa          │       │
│  │ cc → /Orchestrix:    │ cc → /Orchestrix:    │       │
│  │   agents:sm          │   agents:qa          │       │
│  └──────────────────────┴──────────────────────┘       │
└─────────────────────────────────────────────────────────┘

工作流程：
1. SM agent 完成 draft → 输出: "🎯 HANDOFF TO architect: *review story-2.3"
2. Stop Hook 触发 → 解析输出
3. tmux send-keys -t orchestrix:0.0 "*review story-2.3" Enter
4. Architect 窗格自动接收命令并执行
5. 以此类推，完成完整的开发循环
```

### 关键技术点

1. **动态工作目录**：脚本自动检测 `.orchestrix-core` 所在的项目根目录
2. **自定义命令别名**：使用 `cc` 命令启动 Claude Code
3. **自动 Agent 激活**：在每个窗格中自动输入 `/Orchestrix:agents:xxx` 命令
4. **tmux send-keys**：实现跨窗格自动输入
5. **Claude Code Stop Hook**：检测 HANDOFF 模式并触发自动化

---

## 二、详细设计

### 2.1 文件结构

```
项目根目录/
├── .orchestrix-core/
│   └── utils/
│       └── start-tmux-session.sh       # tmux 会话启动脚本
├── .claude/
│   ├── hooks/
│   │   └── handoff-detector.sh         # Stop Hook 脚本
│   └── settings.local.json             # Hook 配置
└── ORCHESTRIX-TMUX-AUTOMATION.md       # 本文档
```

### 2.2 Agent 到窗格映射表

| Agent 名称 | tmux 窗格 | 位置 | Claude 命令                  | 环境变量           |
| ---------- | --------- | ---- | ---------------------------- | ------------------ |
| architect  | pane 0    | 左上 | /Orchestrix:agents:architect | AGENT_ID=architect |
| sm         | pane 1    | 左下 | /Orchestrix:agents:sm        | AGENT_ID=sm        |
| dev        | pane 2    | 右上 | /Orchestrix:agents:dev       | AGENT_ID=dev       |
| qa         | pane 3    | 右下 | /Orchestrix:agents:qa        | AGENT_ID=qa        |

### 2.3 HANDOFF 消息格式

标准 Orchestrix 格式：`🎯 HANDOFF TO <target_agent>: <command>`

示例：

```
🎯 HANDOFF TO architect: *review story-2.3
🎯 HANDOFF TO dev: *implement-story story-2.3
🎯 HANDOFF TO qa: *review story-2.3
```

---

## 三、实现代码

### 3.1 文件：`.orchestrix-core/utils/start-tmux-session.sh`

```bash
#!/bin/bash
# Orchestrix tmux 多 Agent 会话启动脚本
# 用途：创建 2x2 窗格布局，每个窗格运行一个 Claude Code agent

set -e

SESSION_NAME="orchestrix"

# 动态获取项目根目录（.orchestrix-core 所在目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📂 工作目录: $WORK_DIR"

# 检查 tmux 是否已安装
if ! command -v tmux &> /dev/null; then
    echo "❌ 错误: 未安装 tmux"
    echo "请运行: brew install tmux"
    exit 1
fi

# 检查 cc 命令是否可用
if ! command -v cc &> /dev/null; then
    echo "❌ 错误: cc 命令不可用"
    echo "请确保已配置 Claude Code 别名: alias cc='claude'"
    exit 1
fi

# 如果会话已存在，先杀掉
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  会话 '$SESSION_NAME' 已存在，正在关闭..."
    tmux kill-session -t "$SESSION_NAME"
fi

# 创建新会话（detached 模式）
echo "🚀 创建 tmux 会话: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -c "$WORK_DIR"

# ============================================
# 窗格 0（左上）- Architect Agent
# ============================================
tmux send-keys -t "$SESSION_NAME:0.0" "export AGENT_ID=architect" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "export PANE_NUM=0" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '║  🏛️  Architect Agent (左上)           ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo ''" C-m

# 分割创建窗格 1（左下）- SM Agent
tmux split-window -v -t "$SESSION_NAME:0" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.1" "export AGENT_ID=sm" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "export PANE_NUM=1" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '║  📋 SM Agent (左下)                    ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo ''" C-m

# 选中窗格 0，然后向右分割创建窗格 2（右上）- Dev Agent
tmux select-pane -t "$SESSION_NAME:0.0"
tmux split-window -h -t "$SESSION_NAME:0.0" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.2" "export AGENT_ID=dev" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "export PANE_NUM=2" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '║  💻 Dev Agent (右上)                   ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo ''" C-m

# 选中窗格 2，然后向下分割创建窗格 3（右下）- QA Agent
tmux split-window -v -t "$SESSION_NAME:0.2" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.3" "export AGENT_ID=qa" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "export PANE_NUM=3" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '║  🧪 QA Agent (右下)                    ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo ''" C-m

# 调整窗格布局为 tiled（均等分布）
tmux select-layout -t "$SESSION_NAME:0" tiled

# ============================================
# 启动 Claude Code 并激活 Agent
# ============================================

echo "🤖 启动 Claude Code agents..."

# 窗格 0 - Architect
tmux send-keys -t "$SESSION_NAME:0.0" "cc" C-m
sleep 2  # 等待 Claude Code 启动
tmux send-keys -t "$SESSION_NAME:0.0" "/Orchestrix:agents:architect" C-m

# 窗格 1 - SM
tmux send-keys -t "$SESSION_NAME:0.1" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.1" "/Orchestrix:agents:sm" C-m

# 窗格 2 - Dev
tmux send-keys -t "$SESSION_NAME:0.2" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.2" "/Orchestrix:agents:dev" C-m

# 窗格 3 - QA
tmux send-keys -t "$SESSION_NAME:0.3" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.3" "/Orchestrix:agents:qa" C-m

# 选中 SM 窗格（左下），准备开始工作流
tmux select-pane -t "$SESSION_NAME:0.1"

# 显示启动完成信息
echo ""
echo "✅ tmux 会话创建完成！"
echo ""
echo "📋 窗格布局:"
echo "  ┌──────────────┬──────────────┐"
echo "  │ 0: Architect │ 2: Dev       │"
echo "  ├──────────────┼──────────────┤"
echo "  │ 1: SM        │ 3: QA        │"
echo "  └──────────────┴──────────────┘"
echo ""
echo "🎯 下一步："
echo "  1. 等待所有 agent 加载完成（约 10 秒）"
echo "  2. 在 SM 窗格（左下）中输入: 1"
echo "  3. 之后 Stop Hook 将自动处理 agent 间的交接"
echo ""
echo "⌨️  tmux 常用快捷键:"
echo "  Ctrl+b → o    切换到下一个窗格"
echo "  Ctrl+b → ;    切换到上一个窗格"
echo "  Ctrl+b → ↑↓←→ 用方向键切换窗格"
echo "  Ctrl+b → z    放大/缩小当前窗格"
echo "  Ctrl+b → d    暂时退出会话（后台运行）"
echo "  Ctrl+b → [    进入滚动模式（查看历史）"
echo ""
echo "📝 重新连接会话: tmux attach -t orchestrix"
echo ""

# 附加到会话
tmux attach-session -t "$SESSION_NAME"
```

### 3.2 文件：`.claude/hooks/handoff-detector.sh`

```bash
#!/bin/bash
# Claude Code Stop Hook - HANDOFF 检测器
# 触发时机：Claude 完成响应时
# 功能：检测输出中的 HANDOFF 模式，自动发送命令到目标 agent

set -euo pipefail

# 配置
SESSION_NAME="orchestrix"
LOG_FILE="/tmp/orchestrix-handoff.log"

# Agent 到窗格映射
declare -A AGENT_TO_PANE=(
    ["architect"]="0"
    ["sm"]="1"
    ["dev"]="2"
    ["qa"]="3"
    ["orchestrix-orchestrator"]="0"  # orchestrator 也发送到 architect
    ["ux-expert"]="0"  # 如果需要 UX expert，可以映射到 architect
)

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# 从 stdin 读取 hook 数据
# 注意：根据 Claude Code Hook 的实现，可能需要从文件或其他方式读取
# 这里使用最简单的 stdin 读取方式
hook_data=""
while IFS= read -r line; do
    hook_data+="$line"$'\n'
done

current_agent="${AGENT_ID:-unknown}"
log "Stop Hook triggered for agent: $current_agent"

# HANDOFF 模式匹配
# 格式: 🎯 HANDOFF TO <target_agent>: <command>
PATTERN='🎯 HANDOFF TO ([a-zA-Z0-9_-]+): (.+)'

if [[ "$hook_data" =~ $PATTERN ]]; then
    target_agent="${BASH_REMATCH[1]}"
    command="${BASH_REMATCH[2]}"

    log "HANDOFF detected: from=$current_agent, target=$target_agent, command=$command"

    # 查找目标窗格
    target_pane="${AGENT_TO_PANE[$target_agent]:-}"

    if [ -z "$target_pane" ]; then
        log "ERROR: Unknown agent '$target_agent', no pane mapping found"
        echo "❌ 未知的 agent: $target_agent" >&2
        exit 1
    fi

    # 检查 tmux 会话是否存在
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "ERROR: tmux session '$SESSION_NAME' not found"
        echo "❌ tmux 会话 '$SESSION_NAME' 不存在" >&2
        exit 1
    fi

    # 使用 tmux send-keys 发送命令到目标窗格
    log "Sending command to pane $target_pane: $command"

    # 添加短暂延迟，确保目标窗格已准备好
    sleep 0.5

    # 发送命令
    tmux send-keys -t "$SESSION_NAME:0.$target_pane" "$command" C-m

    if [ $? -eq 0 ]; then
        log "SUCCESS: Command sent to $target_agent (pane $target_pane)"
        echo "✅ 已将命令发送给 $target_agent" >&2

        # 可选：播放提示音
        # afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
    else
        log "ERROR: Failed to send command via tmux"
        echo "❌ 发送命令失败" >&2
        exit 1
    fi
else
    log "No HANDOFF pattern found in output (agent: $current_agent)"
fi

# 返回成功，继续正常流程
exit 0
```

### 3.3 文件：`.claude/settings.local.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/handoff-detector.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 四、安装步骤

### 4.1 确保前置条件

```bash
# 1. 检查 tmux 是否已安装
tmux -V

# 如果未安装：
brew install tmux

# 2. 检查 cc 别名是否配置
cc --version

# 如果未配置，在 ~/.zshrc 或 ~/.bashrc 中添加：
# alias cc='claude'
# 然后执行：
source ~/.zshrc  # 或 source ~/.bashrc
```

### 4.2 创建必要的文件

```bash
cd /Users/dorayo/Codes/smart-locker/web-admin

# 1. 启动脚本已存在于 .orchestrix-core/utils/
# 确保有执行权限
chmod +x .orchestrix-core/utils/start-tmux-session.sh

# 2. 创建 Hook 目录和脚本
mkdir -p .claude/hooks

# 创建 handoff-detector.sh
# （将上面 3.2 的内容复制到此文件）

chmod +x .claude/hooks/handoff-detector.sh

# 3. 创建 Hook 配置
# （将上面 3.3 的内容复制到 .claude/settings.local.json）
# 如果文件已存在，请合并配置

# 4. 创建日志目录（可选）
mkdir -p /tmp
```

### 4.3 验证配置

```bash
# 1. 验证启动脚本
ls -la .orchestrix-core/utils/start-tmux-session.sh
# 应该显示 -rwxr-xr-x (有 x 权限)

# 2. 验证 Hook 脚本
ls -la .claude/hooks/handoff-detector.sh
# 应该显示 -rwxr-xr-x (有 x 权限)

# 3. 验证 Hook 配置
cat .claude/settings.local.json
# 应该包含 Stop Hook 配置
```

---

## 五、详细测试步骤

### 测试 1：验证 tmux 会话创建

```bash
# 1. 启动 tmux 会话
cd /Users/dorayo/Codes/smart-locker/web-admin
./.orchestrix-core/utils/start-tmux-session.sh

# 预期结果：
# - 自动创建 4 个窗格（2x2 布局）
# - 每个窗格显示对应的 agent 标题
# - 自动启动 Claude Code (cc 命令)
# - 自动执行 /Orchestrix:agents:xxx 命令
# - 最后聚焦在 SM 窗格（左下）

# 2. 等待约 10 秒，让所有 agent 完全加载

# 3. 验证环境变量（可选）
# 按 Ctrl+b → o 切换到 Architect 窗格
# 在 Claude Code 之外的 shell 中执行：
echo $AGENT_ID
# 应该输出: architect

# 4. 验证窗格编号
# 在另一个终端中执行：
tmux list-panes -t orchestrix:0
# 应该显示 4 个窗格：0, 1, 2, 3
```

### 测试 2：验证 Hook 配置

```bash
# 在任意 agent 窗格中（如 SM）
# 在 Claude Code 输入框中执行：
/hooks

# 预期结果：
# - 应该看到已配置的 Stop Hook
# - Hook 脚本路径: .claude/hooks/handoff-detector.sh
# - 类型: command
```

### 测试 3：手动测试 tmux send-keys

```bash
# 打开一个新终端（不要关闭 tmux 会话）

# 1. 向 Architect 窗格发送测试文本
tmux send-keys -t orchestrix:0.0 "测试消息" C-m

# 预期结果：
# - 在 Architect 窗格的 Claude Code 输入框中看到 "测试消息" 被自动输入
# - Claude 开始处理这个输入

# 2. 向 Dev 窗格发送命令
tmux send-keys -t orchestrix:0.2 "*help" C-m

# 预期结果：
# - 在 Dev 窗格中看到 "*help" 命令被执行
```

### 测试 4：测试 Hook 脚本（独立测试）

```bash
# 1. 创建测试输入
cat > /tmp/test-hook-input.txt << 'EOF'
一些 Claude 输出...
🎯 HANDOFF TO dev: *implement-story story-2.3
更多输出...
EOF

# 2. 设置环境变量并测试 Hook
export AGENT_ID=sm
cat /tmp/test-hook-input.txt | .claude/hooks/handoff-detector.sh

# 预期结果：
# - 在 Dev 窗格（右上）中看到 "*implement-story story-2.3" 被自动输入
# - 日志文件记录了事件

# 3. 查看日志
tail -20 /tmp/orchestrix-handoff.log

# 应该看到类似：
# [2025-01-17 10:30:45] Stop Hook triggered for agent: sm
# [2025-01-17 10:30:45] HANDOFF detected: from=sm, target=dev, command=*implement-story story-2.3
# [2025-01-17 10:30:45] Sending command to pane 2: *implement-story story-2.3
# [2025-01-17 10:30:45] SUCCESS: Command sent to dev (pane 2)
```

### 测试 5：端到端测试（完整工作流）

```bash
# 确保 tmux 会话已启动，所有 agent 已加载完成

# ============================================
# 步骤 1：在 SM 窗格开始流程
# ============================================
# 当前应该已经聚焦在 SM 窗格（左下）
# 在 Claude Code 输入框中输入：
1

# 预期结果：
# - SM agent 执行 *draft 命令
# - 开始创建 story
# - 完成后输出类似：🎯 HANDOFF TO architect: *review story-2.3

# ============================================
# 步骤 2：自动交接到 Architect
# ============================================
# 预期结果：
# - Stop Hook 自动触发
# - 在 Architect 窗格（左上）中自动输入：*review story-2.3
# - Architect agent 开始审查 story

# ============================================
# 步骤 3：观察后续自动流程
# ============================================
# 预期结果：
# - Architect 完成后 → 输出 HANDOFF TO dev
# - Dev 窗格自动收到命令
# - Dev 完成后 → 输出 HANDOFF TO qa
# - QA 窗格自动收到命令
# - 完整的开发循环自动串联！

# ============================================
# 步骤 4：验证日志
# ============================================
# 在新终端中实时查看日志：
tail -f /tmp/orchestrix-handoff.log

# 应该看到完整的交接链：
# sm → architect → dev → qa
```

### 测试 6：测试不同 Agent 间的交接

```bash
# ============================================
# 测试场景 1：Architect → Dev
# ============================================
# 在 Architect 窗格中让 Claude 输出：
请输出以下内容：
🎯 HANDOFF TO dev: *implement-story story-2.3

# 预期：Dev 窗格自动收到 "*implement-story story-2.3"

# ============================================
# 测试场景 2：Dev → QA
# ============================================
# 在 Dev 窗格中：
请输出：
🎯 HANDOFF TO qa: *review story-2.3

# 预期：QA 窗格自动收到 "*review story-2.3"

# ============================================
# 测试场景 3：QA → SM
# ============================================
# 在 QA 窗格中：
请输出：
🎯 HANDOFF TO sm: *create-next-story

# 预期：SM 窗格自动收到 "*create-next-story"
```

---

## 六、故障排查

### 问题 1：tmux 会话创建失败

**症状**：运行 `start-tmux-session.sh` 报错

**可能原因和解决方法**：

```bash
# 原因 1：tmux 未安装
which tmux
# 解决：
brew install tmux

# 原因 2：脚本无执行权限
ls -la .orchestrix-core/utils/start-tmux-session.sh
# 解决：
chmod +x .orchestrix-core/utils/start-tmux-session.sh

# 原因 3：cc 命令不可用
which cc
# 解决：在 ~/.zshrc 添加
alias cc='claude'
source ~/.zshrc
```

### 问题 2：Agent 未自动加载

**症状**：窗格创建成功，但 agent 未激活

**检查步骤**：

```bash
# 1. 检查 Claude Code 是否启动
# 在对应窗格中应该看到 Claude Code 界面

# 2. 手动执行 agent 命令
# 如果自动执行失败，可以手动输入：
/Orchestrix:agents:architect  # 在 Architect 窗格
/Orchestrix:agents:sm          # 在 SM 窗格
# ... 以此类推

# 3. 检查延迟时间
# 如果启动脚本中的 sleep 时间不够，可以调整：
# 编辑 start-tmux-session.sh
# 将 sleep 2 改为 sleep 3 或更长
```

### 问题 3：Hook 未触发

**症状**：输出 HANDOFF 消息后，目标窗格没有反应

**检查步骤**：

```bash
# 1. 验证 Hook 配置
cat .claude/settings.local.json
# 应该包含 Stop Hook 配置

# 2. 检查 Hook 脚本权限
ls -la .claude/hooks/handoff-detector.sh
# 应该有 -x 权限

# 3. 在 Claude Code 中检查 Hook 状态
/hooks
# 应该显示 Stop Hook 已配置

# 4. 手动测试 Hook
export AGENT_ID=sm
echo "🎯 HANDOFF TO dev: test" | .claude/hooks/handoff-detector.sh

# 5. 检查日志
tail -20 /tmp/orchestrix-handoff.log
```

**常见解决方法**：

```bash
# 1. 重新设置权限
chmod +x .claude/hooks/handoff-detector.sh

# 2. 重启 Claude Code
# 在每个窗格中按 Ctrl+C 退出 Claude Code
# 然后重新启动 tmux 会话

# 3. 验证 Hook 脚本语法
bash -n .claude/hooks/handoff-detector.sh
# 应该没有输出（表示语法正确）
```

### 问题 4：命令发送失败

**症状**：日志显示 Hook 触发，但 tmux send-keys 失败

**检查步骤**：

```bash
# 1. 验证 tmux 会话存在
tmux ls
# 应该看到 orchestrix 会话

# 2. 验证窗格编号
tmux list-panes -t orchestrix:0
# 应该显示 4 个窗格：0, 1, 2, 3

# 3. 手动测试 send-keys
tmux send-keys -t orchestrix:0.2 "test" C-m
# 应该在 Dev 窗格中看到 "test" 被输入

# 4. 检查权限
# Hook 脚本需要能够访问 tmux 命令
which tmux
echo $PATH
```

**解决方法**：

```bash
# 1. 确保 tmux 在 PATH 中
# 在 Hook 脚本开头添加：
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# 2. 确保会话名称正确
# 在 Hook 脚本中检查 SESSION_NAME="orchestrix"

# 3. 调整延迟
# 在 Hook 脚本中增加 sleep 时间：
sleep 1  # 改为 sleep 2
```

### 问题 5：HANDOFF 模式未匹配

**症状**：日志显示 "No HANDOFF pattern found"

**原因**：输出格式不正确

**正确格式**：

```
✅ 🎯 HANDOFF TO dev: *implement-story
✅ 🎯 HANDOFF TO architect: *review story-2.3
```

**错误格式**：

```
❌ HANDOFF TO dev: *implement-story        # 缺少 🎯
❌ 🎯 HANDOFF TO dev *implement-story      # 缺少冒号
❌ 🎯HANDOFF TO dev: *implement-story      # 缺少空格
❌ 🎯 HANDOFF TO dev: implement-story      # 命令应该以 * 开头
```

**调试方法**：

```bash
# 1. 测试正则表达式
pattern='🎯 HANDOFF TO ([a-zA-Z0-9_-]+): (.+)'
test_string="🎯 HANDOFF TO dev: *implement-story"

if [[ "$test_string" =~ $pattern ]]; then
    echo "匹配成功"
    echo "Target: ${BASH_REMATCH[1]}"
    echo "Command: ${BASH_REMATCH[2]}"
else
    echo "匹配失败"
fi

# 2. 检查实际输出
# 查看日志文件中的完整输出
tail -100 /tmp/orchestrix-handoff.log | grep -A 5 "No HANDOFF"
```

### 问题 6：环境变量未设置

**症状**：Hook 中 `$AGENT_ID` 为空

**检查**：

```bash
# 在每个窗格中检查
echo $AGENT_ID
echo $PANE_NUM

# 应该分别显示：
# Architect: AGENT_ID=architect, PANE_NUM=0
# SM: AGENT_ID=sm, PANE_NUM=1
# Dev: AGENT_ID=dev, PANE_NUM=2
# QA: AGENT_ID=qa, PANE_NUM=3
```

**解决**：

```bash
# 如果环境变量丢失，手动设置：
export AGENT_ID=architect  # 根据窗格调整
export PANE_NUM=0          # 根据窗格调整

# 或者重新运行启动脚本
./.orchestrix-core/utils/start-tmux-session.sh
```

---

## 七、使用说明

### 7.1 日常使用流程

```bash
# ============================================
# 步骤 1：启动 tmux 会话
# ============================================
cd /Users/dorayo/Codes/smart-locker/web-admin
./.orchestrix-core/utils/start-tmux-session.sh

# 等待约 10-15 秒，让所有 agent 完全加载

# ============================================
# 步骤 2：开始工作流
# ============================================
# 当前应该聚焦在 SM 窗格（左下）
# 输入：
1

# 然后按回车，SM agent 会执行 *draft 命令

# ============================================
# 步骤 3：观察自动化流程
# ============================================
# 接下来的流程将完全自动化：
# SM → draft story
#   ↓ (自动)
# Architect → review story
#   ↓ (自动)
# Dev → implement story
#   ↓ (自动)
# QA → review code
#   ↓ (自动)
# SM → 下一个 story

# ============================================
# 步骤 4：监控日志（可选）
# ============================================
# 在新终端中：
tail -f /tmp/orchestrix-handoff.log

# ============================================
# 步骤 5：退出会话
# ============================================
# 方式 1：暂时退出（会话继续在后台运行）
# 按 Ctrl+b → d

# 方式 2：完全关闭
tmux kill-session -t orchestrix

# ============================================
# 步骤 6：重新连接会话
# ============================================
tmux attach -t orchestrix
```

### 7.2 tmux 快捷键速查

| 快捷键          | 功能              | 说明             |
| --------------- | ----------------- | ---------------- |
| `Ctrl+b → o`    | 切换到下一个窗格  | 循环切换         |
| `Ctrl+b → ;`    | 切换到上一个窗格  | 返回上一个       |
| `Ctrl+b → ↑↓←→` | 方向键切换窗格    | 直观导航         |
| `Ctrl+b → q`    | 显示窗格编号      | 2 秒内按数字跳转 |
| `Ctrl+b → z`    | 放大/缩小当前窗格 | 全屏切换         |
| `Ctrl+b → [`    | 进入滚动模式      | q 退出           |
| `Ctrl+b → d`    | 暂时退出会话      | 后台运行         |
| `Ctrl+b → x`    | 关闭当前窗格      | 需要确认         |
| `Ctrl+b → ?`    | 显示所有快捷键    | 帮助菜单         |

### 7.3 在滚动模式中查看历史

```
1. 按 Ctrl+b → [  进入滚动模式
2. 使用方向键或 PageUp/PageDown 滚动
3. 按 q 退出滚动模式
```

### 7.4 日志查看技巧

```bash
# 实时查看日志
tail -f /tmp/orchestrix-handoff.log

# 查看最近 50 条
tail -50 /tmp/orchestrix-handoff.log

# 搜索特定 agent
grep "target=dev" /tmp/orchestrix-handoff.log

# 查看成功的交接
grep "SUCCESS" /tmp/orchestrix-handoff.log

# 查看错误
grep "ERROR" /tmp/orchestrix-handoff.log

# 清空日志（新开始）
> /tmp/orchestrix-handoff.log
```

---

## 八、高级配置（可选）

### 8.1 添加通知音效

在 `.claude/hooks/handoff-detector.sh` 中，找到成功发送的部分：

```bash
if [ $? -eq 0 ]; then
    log "SUCCESS: Command sent to $target_agent (pane $target_pane)"
    echo "✅ 已将命令发送给 $target_agent" >&2

    # 添加提示音
    afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
fi
```

可用的系统音效：

- `Glass.aiff` - 清脆提示音
- `Ping.aiff` - 简短提示音
- `Pop.aiff` - 弹出音
- `Tink.aiff` - 轻柔提示音

### 8.2 自动开始工作流

如果希望启动后自动在 SM 窗格中输入 `1`，可以在 `start-tmux-session.sh` 末尾添加：

```bash
# 在所有 agent 启动后，自动开始工作流
sleep 15  # 等待所有 agent 完全加载
tmux send-keys -t "$SESSION_NAME:0.1" "1" C-m
```

**注意**：这会立即开始执行，确保您准备好了。

### 8.3 支持手动确认模式

如果希望每次交接前手动确认，可以修改 Hook 脚本：

```bash
# 在发送命令前添加确认
if [ "${HANDOFF_AUTO:-true}" = "false" ]; then
    # 只记录到队列，不自动发送
    echo "$command" > "/tmp/handoff-queue-${target_agent}.txt"
    log "Command queued for manual confirmation: $command"
    echo "📋 命令已加入队列: $target_agent" >&2
else
    # 自动发送
    tmux send-keys -t "$SESSION_NAME:0.$target_pane" "$command" C-m
fi
```

使用时设置环境变量：

```bash
export HANDOFF_AUTO=false  # 启用手动确认
```

### 8.4 支持更多 Agent

如果需要添加更多 agent（如 PM, PO 等），修改两个地方：

**1. 在 `start-tmux-session.sh` 中添加窗格**：

```bash
# 添加第 5 个窗格（PM）
tmux split-window -h -t "$SESSION_NAME:0.3" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.4" "export AGENT_ID=pm" C-m
tmux send-keys -t "$SESSION_NAME:0.4" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.4" "/Orchestrix:agents:pm" C-m
```

**2. 在 Hook 脚本中添加映射**：

```bash
declare -A AGENT_TO_PANE=(
    ["architect"]="0"
    ["sm"]="1"
    ["dev"]="2"
    ["qa"]="3"
    ["pm"]="4"  # 新增
    ["po"]="5"  # 新增
)
```

### 8.5 自定义窗格布局

如果不喜欢 2x2 布局，可以使用其他布局：

```bash
# 在 start-tmux-session.sh 中替换：
tmux select-layout -t "$SESSION_NAME:0" tiled

# 改为其他布局：
tmux select-layout -t "$SESSION_NAME:0" even-horizontal  # 水平均分
tmux select-layout -t "$SESSION_NAME:0" even-vertical    # 垂直均分
tmux select-layout -t "$SESSION_NAME:0" main-horizontal  # 主窗格在上
tmux select-layout -t "$SESSION_NAME:0" main-vertical    # 主窗格在左
```

---

## 九、完整工作流程示例

### 示例：从 Story 创建到完成的完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                     完整开发循环                             │
└─────────────────────────────────────────────────────────────┘

1️⃣  用户操作: 在 SM 窗格输入 "1"
    ↓
2️⃣  SM Agent: 执行 *draft 命令，创建 Story
    输出: Story 2.3 已创建
    输出: 🎯 HANDOFF TO architect: *review story-2.3
    ↓ (Stop Hook 自动触发)

3️⃣  Architect Agent: 自动接收命令 "*review story-2.3"
    开始技术审查
    输出: Story 2.3 技术审查通过
    输出: 🎯 HANDOFF TO dev: *implement-story story-2.3
    ↓ (Stop Hook 自动触发)

4️⃣  Dev Agent: 自动接收命令 "*implement-story story-2.3"
    开始实现功能
    输出: Story 2.3 实现完成
    输出: 🎯 HANDOFF TO qa: *review story-2.3
    ↓ (Stop Hook 自动触发)

5️⃣  QA Agent: 自动接收命令 "*review story-2.3"
    开始代码审查
    输出: Story 2.3 QA 通过
    输出: 🎯 HANDOFF TO sm: *create-next-story
    ↓ (Stop Hook 自动触发)

6️⃣  SM Agent: 自动接收命令 "*create-next-story"
    创建下一个 Story
    循环继续...

┌─────────────────────────────────────────────────────────────┐
│  整个过程除了第一次输入 "1"，后续完全自动化！              │
└─────────────────────────────────────────────────────────────┘
```

---

## 十、总结

### ✅ 方案优势

1. **完全自动化**：除了启动流程，后续完全无需手动操作
2. **原生集成**：使用 Claude Code 原生 Hook 功能
3. **精确控制**：tmux send-keys 准确向目标窗格发送命令
4. **无需权限**：不需要 macOS Accessibility 权限
5. **易于调试**：完整的日志记录
6. **高度可扩展**：可以轻松添加更多 agent 或功能

### 📋 关键文件清单

```
项目根目录/
├── .orchestrix-core/utils/
│   └── start-tmux-session.sh           ✅ tmux 启动脚本
├── .claude/
│   ├── hooks/
│   │   └── handoff-detector.sh         ✅ Stop Hook 脚本
│   └── settings.local.json             ✅ Hook 配置
└── ORCHESTRIX-TMUX-AUTOMATION.md       ✅ 本文档
```

### 🎯 快速开始

```bash
# 1. 确保所有文件已创建并有正确权限
chmod +x .orchestrix-core/utils/start-tmux-session.sh
chmod +x .claude/hooks/handoff-detector.sh

# 2. 启动 tmux 会话
./.orchestrix-core/utils/start-tmux-session.sh

# 3. 等待所有 agent 加载完成（约 15 秒）

# 4. 在 SM 窗格（左下）输入
1

# 5. 享受全自动的多 agent 协作！
```

### 🔧 维护建议

1. **定期清理日志**：`> /tmp/orchestrix-handoff.log`
2. **备份配置**：定期备份 `.claude/settings.local.json`
3. **更新映射表**：添加新 agent 时更新 Hook 脚本中的映射
4. **测试验证**：每次修改后运行测试步骤验证

### 📞 获取帮助

如果遇到问题：

1. 查看日志：`tail -f /tmp/orchestrix-handoff.log`
2. 验证配置：`/hooks` 在 Claude Code 中
3. 手动测试：使用本文档的测试步骤
4. 参考故障排查章节

---

**祝您使用愉快！享受完全自动化的多 Agent 协作体验！** 🚀
