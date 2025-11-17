#!/bin/bash
# Orchestrix tmux Multi-Agent Session Starter
# Purpose: Create a 2x2 pane layout with each pane running a Claude Code agent

set -e

SESSION_NAME="orchestrix"

# Dynamically get project root directory (where .orchestrix-core is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📂 Working directory: $WORK_DIR"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ Error: tmux is not installed"
    echo "Please run: brew install tmux"
    exit 1
fi

# Check if cc command is available
if ! command -v cc &> /dev/null; then
    echo "❌ Error: cc command not available"
    echo "Please ensure Claude Code alias is configured: alias cc='claude'"
    exit 1
fi

# If session already exists, kill it first
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  Session '$SESSION_NAME' already exists, closing..."
    tmux kill-session -t "$SESSION_NAME"
fi

# Create new session (detached mode)
echo "🚀 Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -c "$WORK_DIR"

# ============================================
# Pane 0 (top-left) - Architect Agent
# ============================================
tmux send-keys -t "$SESSION_NAME:0.0" "export AGENT_ID=architect" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "export PANE_NUM=0" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '║  🏛️  Architect Agent (Top-Left)      ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.0" "echo ''" C-m

# Split to create pane 1 (bottom-left) - SM Agent
tmux split-window -v -t "$SESSION_NAME:0" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.1" "export AGENT_ID=sm" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "export PANE_NUM=1" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '║  📋 SM Agent (Bottom-Left)            ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.1" "echo ''" C-m

# Select pane 0, then split right to create pane 2 (top-right) - Dev Agent
tmux select-pane -t "$SESSION_NAME:0.0"
tmux split-window -h -t "$SESSION_NAME:0.0" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.2" "export AGENT_ID=dev" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "export PANE_NUM=2" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '║  💻 Dev Agent (Top-Right)             ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.2" "echo ''" C-m

# Select pane 2, then split down to create pane 3 (bottom-right) - QA Agent
tmux split-window -v -t "$SESSION_NAME:0.2" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:0.3" "export AGENT_ID=qa" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "export PANE_NUM=3" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '║  🧪 QA Agent (Bottom-Right)           ║'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0.3" "echo ''" C-m

# Adjust pane layout to tiled (evenly distributed)
tmux select-layout -t "$SESSION_NAME:0" tiled

# ============================================
# Start Claude Code and activate agents
# ============================================

echo "🤖 Starting Claude Code agents..."

# Pane 0 - Architect
tmux send-keys -t "$SESSION_NAME:0.0" "cc" C-m
sleep 2  # Wait for Claude Code to start
tmux send-keys -t "$SESSION_NAME:0.0" "/Orchestrix:agents:architect" C-m

# Pane 1 - SM
tmux send-keys -t "$SESSION_NAME:0.1" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.1" "/Orchestrix:agents:sm" C-m

# Pane 2 - Dev
tmux send-keys -t "$SESSION_NAME:0.2" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.2" "/Orchestrix:agents:dev" C-m

# Pane 3 - QA
tmux send-keys -t "$SESSION_NAME:0.3" "cc" C-m
sleep 2
tmux send-keys -t "$SESSION_NAME:0.3" "/Orchestrix:agents:qa" C-m

# Select SM pane (bottom-left) to start workflow
tmux select-pane -t "$SESSION_NAME:0.1"

# Display startup completion message
echo ""
echo "✅ tmux session created successfully!"
echo ""
echo "📋 Pane Layout:"
echo "  ┌──────────────┬──────────────┐"
echo "  │ 0: Architect │ 2: Dev       │"
echo "  ├──────────────┼──────────────┤"
echo "  │ 1: SM        │ 3: QA        │"
echo "  └──────────────┴──────────────┘"
echo ""
echo "🎯 Next Steps:"
echo "  1. Wait for all agents to load (about 10 seconds)"
echo "  2. In SM pane (bottom-left), enter: 1"
echo "  3. The Stop Hook will automatically handle agent handoffs"
echo ""
echo "⌨️  tmux shortcuts:"
echo "  Ctrl+b → o    Switch to next pane"
echo "  Ctrl+b → ;    Switch to previous pane"
echo "  Ctrl+b → ↑↓←→ Switch panes with arrow keys"
echo "  Ctrl+b → z    Maximize/minimize current pane"
echo "  Ctrl+b → d    Detach session (runs in background)"
echo "  Ctrl+b → [    Enter scroll mode (view history)"
echo ""
echo "📝 Reconnect to session: tmux attach -t orchestrix"
echo ""

# Attach to session
tmux attach-session -t "$SESSION_NAME"
