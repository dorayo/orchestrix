# orchestrix

Install [Orchestrix](https://orchestrix-mcp.youlidao.ai) multi-agent infrastructure into any project.

## Quick Start

```bash
npx orchestrix install
```

That's it. You'll be prompted for your license key, then all files are installed.

## What Gets Installed

| File | Purpose |
|------|---------|
| `.claude/commands/o.md` | `/o dev`, `/o sm` — activate agents |
| `.claude/commands/o-help.md` | `/o-help` — list available agents |
| `.claude/commands/o-status.md` | `/o-status` — check server status |
| `.mcp.json` | MCP Server configuration (merged with existing) |
| `.orchestrix-core/core-config.yaml` | Project configuration |
| `.orchestrix-core/scripts/start-orchestrix.sh` | tmux multi-agent session launcher |
| `.orchestrix-core/scripts/handoff-detector.sh` | Auto HANDOFF routing between agents |
| `.claude/settings.local.json` | Claude Code Stop hook for HANDOFF detection |
| `.env.local` | License key storage (gitignored) |

## Commands

```bash
npx orchestrix install [options]    # Install into current project
npx orchestrix doctor               # Check installation health
npx orchestrix upgrade              # Upgrade to latest version
npx orchestrix uninstall            # Remove Orchestrix files
```

### Install Options

| Flag | Description |
|------|-------------|
| `--key <KEY>` | License key (skips interactive prompt) |
| `--offline` | Use embedded files only (no network) |
| `--force` | Overwrite all files without confirmation |
| `--no-hooks` | Skip Stop hook installation |
| `--no-scripts` | Skip tmux scripts installation |
| `--no-mcp` | Skip .mcp.json modification |

## Usage After Install

Open the project in Claude Code and use:

```
/o dev          # Activate Developer agent
/o sm           # Activate Scrum Master agent
/o qa           # Activate QA Engineer agent
/o architect    # Activate Solution Architect agent
/o-help         # Show all available agents
```

### tmux Multi-Agent Automation

Launch 4 agents (Architect, SM, Dev, QA) in parallel tmux windows with automatic HANDOFF routing:

```bash
bash .orchestrix-core/scripts/start-orchestrix.sh
```

## How It Works

- **Smart merge**: `.mcp.json` and `settings.local.json` are deep-merged — your existing entries are preserved.
- **Idempotent**: Safe to run multiple times. Won't duplicate hooks or overwrite customized `core-config.yaml`.
- **Offline ready**: Use `--offline` to install from bundled files without network access.
- **Zero dependencies**: Pure Node.js built-ins only.

## Related

- [Orchestrix MCP Server](https://github.com/dorayo/orchestrix-mcp-server) — Central agent configuration server
- [orchestrix-yuri](https://www.npmjs.com/package/orchestrix-yuri) — Meta-orchestrator for project lifecycle management

## License

MIT
