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

# Function to handle *draft command with context clearing
handle_draft_command() {
    log "========== SPECIAL HANDLER: *draft command =========="
    log "Clearing all agent contexts and reloading..."

    # Step 1: Clear all windows
    log "Step 1: Clearing all windows (0, 1, 2, 3)"
    for window in 0 1 2 3; do
        log "  Clearing window $window"
        tmux send-keys -t "$SESSION_NAME:$window" "/clear" C-m
    done

    log "Waiting 10s for clear to complete..."
    sleep 10

    # Step 2: Reload agents in each window
    log "Step 2: Reloading agents"
    log "  Window 0: Loading architect agent"
    tmux send-keys -t "$SESSION_NAME:0" "/Orchestrix:agents:architect" C-m

    log "  Window 1: Loading sm agent"
    tmux send-keys -t "$SESSION_NAME:1" "/Orchestrix:agents:sm" C-m

    log "  Window 2: Loading dev agent"
    tmux send-keys -t "$SESSION_NAME:2" "/Orchestrix:agents:dev" C-m

    log "  Window 3: Loading qa agent"
    tmux send-keys -t "$SESSION_NAME:3" "/Orchestrix:agents:qa" C-m

    log "Waiting 45s for agents to load..."
    sleep 45

    # Step 3: Execute *draft in SM window
    log "Step 3: Executing *draft in SM window"
    tmux send-keys -t "$SESSION_NAME:1" "*draft" C-m

    log "✓ SUCCESS: *draft command executed with fresh contexts"
    echo "✅ CONTEXT CLEARED + AGENTS RELOADED → SM: *draft" >&2
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

# Capture the pane output (last 300 lines to ensure we catch HANDOFF even with extra content)
pane_output=$(tmux capture-pane -t "$SESSION_NAME:$current_window" -p -S -300 2>/dev/null || echo "")

if [ -z "$pane_output" ]; then
    log "ERROR: Could not capture pane output"
    exit 0
fi

log "Captured pane output: ${#pane_output} bytes"

# Extract last 2000 characters (increased from 1000 to handle cases where extra content follows HANDOFF)
last_output="${pane_output: -2000}"
log "Last 2000 chars: examining ${#last_output} bytes for HANDOFF pattern"

# HANDOFF pattern matching (multiple patterns for flexibility)
# Try multiple patterns in order of preference
# IMPORTANT: Patterns WITH arguments must be checked BEFORE patterns without arguments

target_agent=""
raw_command=""

# Pattern 1: Standard format with arguments - 🎯 HANDOFF TO agent: *command args
# Match any arguments on the same line (non-greedy to stop at line break)
if [[ "$pane_output" =~ 🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+[[:space:]]+[^\n\r]+) ]]; then
    target_agent="${BASH_REMATCH[1]}"
    # Trim trailing whitespace from command
    raw_command=$(echo "${BASH_REMATCH[2]}" | sed 's/[[:space:]]*$//')
    log "Matched Pattern 1: Standard HANDOFF format (with arguments)"

# Pattern 0: Standard format without arguments - 🎯 HANDOFF TO agent: *command (no args)
# This pattern is checked AFTER Pattern 1 to avoid matching commands with arguments
elif [[ "$pane_output" =~ 🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+)[[:space:]]*($|[^a-zA-Z0-9.]) ]]; then
    target_agent="${BASH_REMATCH[1]}"
    raw_command="${BASH_REMATCH[2]}"
    log "Matched Pattern 0: Standard HANDOFF format (no arguments)"

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

    # Special handling for *draft command - clear all contexts and reload agents
    if [[ "$target_agent" == "sm" && "$command" == "*draft" ]]; then
        handle_draft_command
        log "========== Hook complete (draft handler) =========="
        exit 0
    fi

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
