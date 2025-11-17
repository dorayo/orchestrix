#!/bin/bash
# Claude Code Stop Hook - HANDOFF Detector
# Trigger: When Claude completes a response
# Function: Detect HANDOFF pattern in output and automatically send commands to target agents

set -euo pipefail

# Configuration
SESSION_NAME="orchestrix"
LOG_FILE="/tmp/orchestrix-handoff.log"

# Agent to pane mapping
declare -A AGENT_TO_PANE=(
    ["architect"]="0"
    ["sm"]="1"
    ["dev"]="2"
    ["qa"]="3"
    ["orchestrix-orchestrator"]="0"  # orchestrator also sends to architect
    ["ux-expert"]="0"  # if UX expert needed, map to architect
)

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Read hook data from stdin
# Note: Depending on Claude Code Hook implementation, might need to read from file or other sources
# Using simple stdin reading here
hook_data=""
while IFS= read -r line; do
    hook_data+="$line"$'\n'
done

current_agent="${AGENT_ID:-unknown}"
log "Stop Hook triggered for agent: $current_agent"

# HANDOFF pattern matching
# Format: 🎯 HANDOFF TO <target_agent>: <command>
PATTERN='🎯 HANDOFF TO ([a-zA-Z0-9_-]+): (.+)'

if [[ "$hook_data" =~ $PATTERN ]]; then
    target_agent="${BASH_REMATCH[1]}"
    command="${BASH_REMATCH[2]}"

    log "HANDOFF detected: from=$current_agent, target=$target_agent, command=$command"

    # Find target pane
    target_pane="${AGENT_TO_PANE[$target_agent]:-}"

    if [ -z "$target_pane" ]; then
        log "ERROR: Unknown agent '$target_agent', no pane mapping found"
        echo "❌ Unknown agent: $target_agent" >&2
        exit 1
    fi

    # Check if tmux session exists
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log "ERROR: tmux session '$SESSION_NAME' not found"
        echo "❌ tmux session '$SESSION_NAME' does not exist" >&2
        exit 1
    fi

    # Use tmux send-keys to send command to target pane
    log "Sending command to pane $target_pane: $command"

    # Add short delay to ensure target pane is ready
    sleep 0.5

    # Send command
    tmux send-keys -t "$SESSION_NAME:0.$target_pane" "$command" C-m

    if [ $? -eq 0 ]; then
        log "SUCCESS: Command sent to $target_agent (pane $target_pane)"
        echo "✅ Command sent to $target_agent" >&2

        # Optional: play notification sound
        # afplay /System/Library/Sounds/Glass.aiff 2>/dev/null &
    else
        log "ERROR: Failed to send command via tmux"
        echo "❌ Failed to send command" >&2
        exit 1
    fi
else
    log "No HANDOFF pattern found in output (agent: $current_agent)"
fi

# Return success to continue normal flow
exit 0
