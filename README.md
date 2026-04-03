# Orchestrix

**One command to install multi-agent AI infrastructure into any project.**

[English](#english) | [中文](#中文)

<p align="center">
  <a href="https://www.npmjs.com/package/orchestrix"><img src="https://img.shields.io/npm/v/orchestrix.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/orchestrix"><img src="https://img.shields.io/npm/dm/orchestrix.svg" alt="npm downloads"></a>
  <a href="https://github.com/dorayo/orchestrix/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/orchestrix.svg" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/orchestrix.svg" alt="node version"></a>
</p>

```bash
npx orchestrix install
```

---

<a id="english"></a>

## English

### What is Orchestrix?

Orchestrix is a multi-agent framework that turns your coding assistant into a coordinated team. One Developer, one Scrum Master, one QA Engineer, one Architect — each running in its own terminal, automatically handing off work to one another.

This CLI installs all the infrastructure needed to make that happen.

### Quick Start

```bash
cd your-project
npx orchestrix install
```

You'll be prompted for your license key. Once done, open the project in [Claude Code](https://claude.ai/download) and type `/o dev` to activate your first agent.

### What Gets Installed

```
your-project/
├── .claude/
│   ├── commands/
│   │   ├── o.md              # /o dev, /o sm — activate agents
│   │   ├── o-help.md         # /o-help — list agents
│   │   └── o-status.md       # /o-status — check status
│   └── settings.local.json   # Stop hook for HANDOFF detection
├── .orchestrix-core/
│   ├── core-config.yaml      # Project configuration
│   └── scripts/
│       ├── start-orchestrix.sh    # tmux 4-agent launcher
│       └── handoff-detector.sh    # Auto HANDOFF routing
├── .mcp.json                 # MCP Server config (merged)
└── .env.local                # License key (gitignored)
```

### Commands

```bash
npx orchestrix install      # Install into current project
npx orchestrix doctor       # Health check
npx orchestrix upgrade      # Upgrade to latest
npx orchestrix uninstall    # Clean removal
```

#### Install Options

| Flag | Description |
|------|-------------|
| `--key <KEY>` | Provide license key (skip prompt) |
| `--offline` | Use bundled files only, no network |
| `--force` | Overwrite all files |
| `--no-hooks` | Skip Claude Code Stop hook |
| `--no-scripts` | Skip tmux automation scripts |
| `--no-mcp` | Skip .mcp.json modification |

### Agent Activation

After installation, use these commands in Claude Code:

```
/o dev          # Full Stack Developer
/o sm           # Scrum Master
/o qa           # QA Engineer
/o architect    # Solution Architect
/o pm           # Product Manager
/o po           # Product Owner
/o analyst      # Business Analyst
/o ux-expert    # UX Expert
/o-help         # Show all agents
```

### tmux Multi-Agent Automation

Run 4 agents in parallel with automatic work handoff:

```bash
bash .orchestrix-core/scripts/start-orchestrix.sh
```

This creates a tmux session with 4 windows:

| Window | Agent | Role |
|--------|-------|------|
| 0 | Architect | System design, tech decisions |
| 1 | SM | Story management, workflow coordination |
| 2 | Dev | Implementation, debugging |
| 3 | QA | Testing, quality verification |

When one agent finishes and issues a HANDOFF, the `handoff-detector.sh` hook automatically routes the command to the target agent's window.

### Design Principles

- **Smart merge** — `.mcp.json` and `settings.local.json` are deep-merged. Your existing config is never lost.
- **Idempotent** — Run `install` as many times as you want. No duplicate hooks, no overwritten customizations.
- **Offline ready** — `--offline` installs from bundled files. Works behind firewalls.
- **Zero dependencies** — Pure Node.js built-ins. No `node_modules` bloat.

### Related Projects

| Project | Description |
|---------|-------------|
| [Orchestrix MCP Server](https://github.com/dorayo/orchestrix-mcp-server) | Central server for agent definitions and configurations |
| [orchestrix-yuri](https://www.npmjs.com/package/orchestrix-yuri) | Meta-orchestrator — project lifecycle management with memory |
| [orchestrix-starter](https://github.com/dorayo/orchestrix-starter) | `/create-project` skill for scaffolding new projects |

---

<a id="中文"></a>

## 中文

### Orchestrix 是什么？

Orchestrix 是一个多 Agent 协作框架，将你的编程助手变成一支协调有序的团队。一个 Developer、一个 Scrum Master、一个 QA Engineer、一个 Architect —— 各自运行在独立终端中，通过 HANDOFF 机制自动交接工作。

本 CLI 工具一键安装所有基础设施。

### 快速开始

```bash
cd your-project
npx orchestrix install
```

按提示输入 License Key 即可完成安装。然后在 [Claude Code](https://claude.ai/download) 中打开项目，输入 `/o dev` 激活你的第一个 Agent。

### 安装了哪些文件

```
your-project/
├── .claude/
│   ├── commands/
│   │   ├── o.md              # /o dev, /o sm — 激活 Agent
│   │   ├── o-help.md         # /o-help — 查看可用 Agent
│   │   └── o-status.md       # /o-status — 查看状态
│   └── settings.local.json   # Claude Code Stop Hook（HANDOFF 检测）
├── .orchestrix-core/
│   ├── core-config.yaml      # 项目配置
│   └── scripts/
│       ├── start-orchestrix.sh    # tmux 四 Agent 启动器
│       └── handoff-detector.sh    # HANDOFF 自动路由
├── .mcp.json                 # MCP Server 配置（智能合并）
└── .env.local                # License Key 存储（已 gitignore）
```

### 命令

```bash
npx orchestrix install      # 安装到当前项目
npx orchestrix doctor       # 健康检查
npx orchestrix upgrade      # 升级到最新版本
npx orchestrix uninstall    # 卸载
```

#### 安装选项

| 参数 | 说明 |
|------|------|
| `--key <KEY>` | 指定 License Key（跳过交互提示） |
| `--offline` | 离线模式，使用内置文件（不联网） |
| `--force` | 强制覆盖所有文件 |
| `--no-hooks` | 跳过 Claude Code Stop Hook |
| `--no-scripts` | 跳过 tmux 自动化脚本 |
| `--no-mcp` | 跳过 .mcp.json 修改 |

### Agent 激活

安装完成后，在 Claude Code 中使用：

```
/o dev          # 全栈开发工程师
/o sm           # Scrum Master
/o qa           # QA 测试工程师
/o architect    # 系统架构师
/o pm           # 产品经理
/o po           # 产品负责人
/o analyst      # 商业分析师
/o ux-expert    # UX 设计专家
/o-help         # 查看所有 Agent
```

### tmux 多 Agent 自动化

四个 Agent 并行运行，自动交接工作：

```bash
bash .orchestrix-core/scripts/start-orchestrix.sh
```

创建一个 tmux 会话，包含 4 个窗口：

| 窗口 | Agent | 职责 |
|------|-------|------|
| 0 | Architect | 系统设计、技术决策 |
| 1 | SM | Story 管理、工作流协调 |
| 2 | Dev | 编码实现、调试 |
| 3 | QA | 测试、质量验证 |

当某个 Agent 完成工作并发出 HANDOFF 指令时，`handoff-detector.sh` 会自动将命令路由到目标 Agent 的窗口。

### 设计理念

- **智能合并** — `.mcp.json` 和 `settings.local.json` 采用深度合并，已有配置永远不会丢失。
- **幂等安装** — 重复运行 `install` 完全安全，不会产生重复 Hook 或覆盖你定制过的配置。
- **离线就绪** — `--offline` 从内置文件安装，防火墙内也能用。
- **零依赖** — 纯 Node.js 内建模块，无 `node_modules` 膨胀。

### 相关项目

| 项目 | 说明 |
|------|------|
| [Orchestrix MCP Server](https://github.com/dorayo/orchestrix-mcp-server) | Agent 定义和配置的中央服务器 |
| [orchestrix-yuri](https://www.npmjs.com/package/orchestrix-yuri) | 元编排器 — 带记忆的项目全生命周期管理 |
| [orchestrix-starter](https://github.com/dorayo/orchestrix-starter) | `/create-project` 技能，用于脚手架创建新项目 |

---

## License

MIT
