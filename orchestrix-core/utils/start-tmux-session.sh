#!/bin/bash
# Orchestrix tmux Multi-Agent Session Starter
# Purpose: Create 4 separate windows, each running a Claude Code agent

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

# Create new session with first window (Architect)
echo "🚀 Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -n "0:Architect" -c "$WORK_DIR"

# Set environment variables for Architect window
tmux send-keys -t "$SESSION_NAME:0" "export AGENT_ID=architect" C-m
tmux send-keys -t "$SESSION_NAME:0" "clear" C-m
tmux send-keys -t "$SESSION_NAME:0" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:0" "echo '║  🏛️  Architect Agent (Window 0)      ║'" C-m
tmux send-keys -t "$SESSION_NAME:0" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:0" "echo ''" C-m

# Create window 1 - SM
tmux new-window -t "$SESSION_NAME:1" -n "1:SM" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:1" "export AGENT_ID=sm" C-m
tmux send-keys -t "$SESSION_NAME:1" "clear" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '║  📋 SM Agent (Window 1)               ║'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:1" "echo ''" C-m

# Create window 2 - Dev
tmux new-window -t "$SESSION_NAME:2" -n "2:Dev" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:2" "export AGENT_ID=dev" C-m
tmux send-keys -t "$SESSION_NAME:2" "clear" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '║  💻 Dev Agent (Window 2)              ║'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:2" "echo ''" C-m

# Create window 3 - QA
tmux new-window -t "$SESSION_NAME:3" -n "3:QA" -c "$WORK_DIR"
tmux send-keys -t "$SESSION_NAME:3" "export AGENT_ID=qa" C-m
tmux send-keys -t "$SESSION_NAME:3" "clear" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '╔════════════════════════════════════════╗'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '║  🧪 QA Agent (Window 3)               ║'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo '╚════════════════════════════════════════╝'" C-m
tmux send-keys -t "$SESSION_NAME:3" "echo ''" C-m

# ============================================
# Start Claude Code (but don't auto-activate agents)
# ============================================

echo "🤖 Starting Claude Code in all windows..."

# Window 0 - Architect
tmux send-keys -t "$SESSION_NAME:0" "cc" C-m

# Window 1 - SM
tmux send-keys -t "$SESSION_NAME:1" "cc" C-m

# Window 2 - Dev
tmux send-keys -t "$SESSION_NAME:2" "cc" C-m

# Window 3 - QA
tmux send-keys -t "$SESSION_NAME:3" "cc" C-m

# Select SM window (window 1) as starting point
tmux select-window -t "$SESSION_NAME:1"

# Display startup completion message
echo ""
echo "✅ tmux session created successfully!"
echo ""
echo "📋 Window Layout (4 separate windows):"
echo "  Window 0: 🏛️  Architect"
echo "  Window 1: 📋 SM (starting point)"
echo "  Window 2: 💻 Dev"
echo "  Window 3: 🧪 QA"
echo ""
echo "🎯 Next Steps:"
echo "  1. ⏱️  Wait for Claude Code to fully start (~10-15 seconds)"
echo "     - You'll see the Claude Code prompt when ready"
echo ""
echo "  2. 🚀 Manually activate agents in each window:"
echo ""
echo "     Window 0 (Architect):"
echo "       Ctrl+b → 0"
echo "       /Orchestrix:agents:architect"
echo ""
echo "     Window 1 (SM) - Current window:"
echo "       /Orchestrix:agents:sm"
echo ""
echo "     Window 2 (Dev):"
echo "       Ctrl+b → 2"
echo "       /Orchestrix:agents:dev"
echo ""
echo "     Window 3 (QA):"
echo "       Ctrl+b → 3"
echo "       /Orchestrix:agents:qa"
echo ""
echo "  3. 🎬 Start automation:"
echo "     - Go to SM window: Ctrl+b → 1"
echo "     - Enter: 1  (or *draft)"
echo "     - Watch the magic happen! ✨"
echo ""
echo "⌨️  tmux window navigation (SIMPLE!):"
echo "  Ctrl+b → 0        Jump to Architect window"
echo "  Ctrl+b → 1        Jump to SM window"
echo "  Ctrl+b → 2        Jump to Dev window"
echo "  Ctrl+b → 3        Jump to QA window"
echo "  Ctrl+b → n        Next window"
echo "  Ctrl+b → p        Previous window"
echo "  Ctrl+b → w        List all windows"
echo ""
echo "  Ctrl+b → z        (N/A - only for panes)"
echo "  Ctrl+b → d        Detach session (runs in background)"
echo "  Ctrl+b → [        Scroll mode (press q to exit)"
echo ""
echo "📝 Monitor handoffs: tail -f /tmp/orchestrix-handoff.log"
echo "📝 Reconnect: tmux attach -t orchestrix"
echo "📝 Window status bar at bottom shows: [0:Architect] [1:SM*] [2:Dev] [3:QA]"
echo ""

# Attach to session
tmux attach-session -t "$SESSION_NAME"
