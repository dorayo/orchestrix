#!/bin/bash
# Claude Code Stop Hook - HANDOFF Detector
# Uses tmux capture-pane to read Claude's output

set -eo pipefail

# Configuration
SESSION_NAME="orchestrix"
LOG_FILE="/tmp/orchestrix-handoff.log"

# Agent to window mapping (Bash 3.2 compatible)
get_agent_window() {
    local agent="$1"
    case "$agent" in
        architect) echo "0" ;;
        sm) echo "1" ;;
        dev) echo "2" ;;
        qa) echo "3" ;;
        orchestrix-orchestrator) echo "0" ;;
        ux-expert) echo "0" ;;
        *) echo "" ;;
    esac
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Get current agent ID
current_agent="${AGENT_ID:-unknown}"
log "========== Hook triggered for agent: $current_agent =========="

# Get current window from agent mapping
current_window=$(get_agent_window "$current_agent")

if [ -z "$current_window" ]; then
    log "ERROR: Unknown current agent '$current_agent'"
    exit 0
fi

log "Current agent: $current_agent (window $current_window)"

# Check if tmux session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    log "ERROR: tmux session '$SESSION_NAME' not found"
    exit 0
fi

# Capture the pane output (last 200 lines, which should include HANDOFF message)
pane_output=$(tmux capture-pane -t "$SESSION_NAME:$current_window" -p -S -200 2>/dev/null || echo "")

if [ -z "$pane_output" ]; then
    log "ERROR: Could not capture pane output"
    exit 0
fi

log "Captured pane output: ${#pane_output} bytes"

# Extract last 1000 characters (HANDOFF should be at the end)
last_output="${pane_output: -1000}"
log "Last 1000 chars: ${last_output//[$'\n']/ }"

# HANDOFF pattern matching (multiple patterns for flexibility)
# Try multiple patterns in order of preference

target_agent=""
raw_command=""

# Pattern 1: Standard format - 🎯 HANDOFF TO agent: *command
if [[ "$pane_output" =~ 🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+[[:space:]]+[0-9.]+) ]]; then
    target_agent="${BASH_REMATCH[1]}"
    raw_command="${BASH_REMATCH[2]}"
    log "Matched Pattern 1: Standard HANDOFF format"

# Pattern 2: Next command format - Next command: *review 5.2 (for QA agent)
# More flexible command pattern: \*[a-z0-9-]+ followed by arguments
elif [[ "$pane_output" =~ Next[[:space:]]+command:[[:space:]]*(\*[a-z0-9-]+[[:space:]]+[0-9.]+)[[:space:]]*\(for[[:space:]]+([a-zA-Z0-9_-]+)[[:space:]]+agent\) ]]; then
    raw_command="${BASH_REMATCH[1]}"
    target_agent=$(echo "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')
    log "Matched Pattern 2: Next command format"

# Pattern 3: Simple Next format - Next: QA please execute command *review 5.2
elif [[ "$pane_output" =~ Next:[[:space:]]*([A-Z]+)[[:space:]]+please[[:space:]]+execute[[:space:]]+command[[:space:]]+(\*[a-z0-9-]+[[:space:]]+[^[:space:]]+) ]]; then
    target_agent=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
    raw_command="${BASH_REMATCH[2]}"
    log "Matched Pattern 3: Next please execute format"

# Pattern 4: Agent instruction format - QA agent: execute *review 5.2
elif [[ "$pane_output" =~ ([A-Z]+)[[:space:]]+agent:[[:space:]]*execute[[:space:]]+(\*[a-z0-9-]+[[:space:]]+[^[:space:]]+) ]]; then
    target_agent=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
    raw_command="${BASH_REMATCH[2]}"
    log "Matched Pattern 4: Agent execute format"

# Pattern 5: Fallback - any line with "for <AGENT> agent" near a command
# Matches: *review 5.2 anywhere before (for QA agent)
elif [[ "$pane_output" =~ (\*[a-z0-9-]+[[:space:]]+[0-9]+\.[0-9]+).*\(for[[:space:]]+([a-zA-Z0-9_-]+)[[:space:]]+agent\) ]]; then
    raw_command="${BASH_REMATCH[1]}"
    target_agent=$(echo "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')
    log "Matched Pattern 5: Fallback command + agent format"
fi

if [[ -n "$target_agent" && -n "$raw_command" ]]; then

    # Clean up command: remove ALL whitespace/newlines, ensure it starts with *
    # Remove newlines, carriage returns, and extra spaces
    raw_command=$(echo "$raw_command" | tr -d '\n\r' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

    if [[ "$raw_command" != \** ]]; then
        command="*${raw_command}"
    else
        command="$raw_command"
    fi

    log "✓ HANDOFF detected: $current_agent → $target_agent"
    log "  Raw command: $raw_command"
    log "  Final command: $command"

    # Find target window
    target_window=$(get_agent_window "$target_agent")

    if [ -z "$target_window" ]; then
        log "ERROR: Unknown target agent '$target_agent'"
        echo "❌ Unknown agent: $target_agent" >&2
        exit 0
    fi

    # Prevent sending to same window
    if [ "$target_window" = "$current_window" ]; then
        log "WARNING: Target window is same as current window, skipping"
        exit 0
    fi

    # Send command to target window
    log "→ Sending to window $target_window: $command"

    # Wait a bit for window to be ready
    sleep 0.5

    # Send command and press Enter to submit (C-m = Enter)
    # Send twice to ensure Claude Code receives and processes it
    if tmux send-keys -t "$SESSION_NAME:$target_window" "$command" 2>/dev/null; then
        sleep 0.1
        if tmux send-keys -t "$SESSION_NAME:$target_window" C-m 2>/dev/null; then
            log "✓ SUCCESS: Command sent to $target_agent"
            echo "✅ HANDOFF: $current_agent → $target_agent" >&2
        else
            log "ERROR: Failed to send Enter key"
        fi
    else
        log "ERROR: Failed to send command via tmux"
        echo "❌ Failed to send command" >&2
    fi
else
    log "No HANDOFF pattern found in pane output"
fi

log "========== Hook complete =========="
exit 0
