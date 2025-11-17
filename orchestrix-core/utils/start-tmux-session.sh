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
# Start Claude Code (but don't auto-activate agents)
# ============================================

echo "🤖 Starting Claude Code in all panes..."

# Pane 0 - Architect
tmux send-keys -t "$SESSION_NAME:0.0" "cc" C-m

# Pane 1 - SM
tmux send-keys -t "$SESSION_NAME:0.1" "cc" C-m

# Pane 2 - Dev
tmux send-keys -t "$SESSION_NAME:0.2" "cc" C-m

# Pane 3 - QA
tmux send-keys -t "$SESSION_NAME:0.3" "cc" C-m

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
echo "  1. ⏱️  Wait for Claude Code to fully start in all panes (~10-15 seconds)"
echo "     - You'll see the Claude Code prompt when ready"
echo ""
echo "  2. 🚀 Manually activate agents in each pane:"
echo "     - Pane 0 (Architect): /Orchestrix:agents:architect"
echo "     - Pane 1 (SM):        /Orchestrix:agents:sm"
echo "     - Pane 2 (Dev):       /Orchestrix:agents:dev"
echo "     - Pane 3 (QA):        /Orchestrix:agents:qa"
echo ""
echo "  3. 🎬 Start automation:"
echo "     - Switch to SM pane (left-bottom)"
echo "     - Enter: 1  (or *draft)"
echo "     - Watch the magic happen! ✨"
echo ""
echo "⌨️  tmux pane navigation:"
echo "  Ctrl+b → q        Show pane numbers (then press 0/1/2/3 to jump)"
echo "  Ctrl+b → ↑↓←→     Move between panes with arrow keys"
echo "  Ctrl+b → o        Cycle to next pane"
echo "  Ctrl+b → z        Maximize/minimize current pane"
echo "  Ctrl+b → d        Detach session (runs in background)"
echo "  Ctrl+b → [        Scroll mode (press q to exit)"
echo ""
echo "📝 Monitor handoffs: tail -f /tmp/orchestrix-handoff.log"
echo "📝 Reconnect: tmux attach -t orchestrix"
echo ""

# Attach to session
tmux attach-session -t "$SESSION_NAME"
