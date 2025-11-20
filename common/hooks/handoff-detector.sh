#!/bin/bash
# Claude Code Stop Hook - HANDOFF Detector
# Uses tmux capture-pane to read Claude's output

# Note: No 'set -e' to avoid hook failure on non-critical errors
# We handle errors explicitly where needed

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

# Get agent startup command
get_agent_command() {
    local agent="$1"
    case "$agent" in
        architect) echo "/Orchestrix:agents:architect" ;;
        sm) echo "/Orchestrix:agents:sm" ;;
        dev) echo "/Orchestrix:agents:dev" ;;
        qa) echo "/Orchestrix:agents:qa" ;;
        orchestrix-orchestrator) echo "/Orchestrix:agents:orchestrix-orchestrator" ;;
        ux-expert) echo "/Orchestrix:agents:ux-expert" ;;
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

# Capture the pane output (last 300 lines to ensure we catch HANDOFF even with extra content)
pane_output=$(tmux capture-pane -t "$SESSION_NAME:$current_window" -p -S -300 2>/dev/null || echo "")

if [ -z "$pane_output" ]; then
    log "ERROR: Could not capture pane output"
    exit 0
fi

log "Captured pane output: ${#pane_output} bytes"

# Extract last 2000 characters for reference
last_output="${pane_output: -2000}"
log "Captured ${#pane_output} bytes total, examining full output for HANDOFF pattern"

# DEBUG: Log last 500 chars to help diagnose issues
log "DEBUG: Last 500 chars of output:"
echo "---START-OUTPUT---" >> "$LOG_FILE"
echo "${pane_output: -500}" >> "$LOG_FILE"
echo "---END-OUTPUT---" >> "$LOG_FILE"

# HANDOFF pattern matching (two-layer strategy)
# Layer 1: Explicit HANDOFF detection (grep-based)
# Layer 2: Implicit command detection (fallback)

target_agent=""
raw_command=""

# ========== LAYER 1: Explicit HANDOFF Detection ==========
# Extract the handoff line if it exists
handoff_line=$(echo "$pane_output" | grep -E '🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO' | tail -1)

if [[ -n "$handoff_line" ]]; then
    log "Found HANDOFF line: $handoff_line"

    # Pattern 1: HANDOFF with story ID (e.g., 🎯 HANDOFF TO dev: *review 5.3)
    if [[ "$handoff_line" =~ 🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+)[[:space:]]+([0-9]+\.[0-9]+) ]]; then
        target_agent=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
        raw_command="${BASH_REMATCH[2]} ${BASH_REMATCH[3]}"
        log "Matched Pattern 1: HANDOFF with story ID"

    # Pattern 0: HANDOFF without story ID (e.g., 🎯 HANDOFF TO sm: *draft)
    elif [[ "$handoff_line" =~ 🎯[[:space:]]*\*?HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+) ]]; then
        target_agent=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
        raw_command="${BASH_REMATCH[2]}"
        log "Matched Pattern 0: HANDOFF without story ID"
    fi
fi

# ========== LAYER 2: Implicit Command Detection ==========
# Pattern 6: Implicit command detection - check last 5 lines for command patterns
# This catches cases where agent outputs command without explicit "HANDOFF TO" marker
if [[ -z "$target_agent" || -z "$raw_command" ]]; then
    log "No explicit HANDOFF found, checking last 5 lines for implicit commands..."

    # Extract last 5 lines from pane output
    last_5_lines=$(echo "$pane_output" | tail -5)
    log "Last 5 lines: $last_5_lines"

    # Function to map command + current_agent → target_agent
    get_target_from_command() {
        local cmd="$1"
        local current="$2"

        case "$current" in
            sm)
                case "$cmd" in
                    review-story) echo "architect" ;;
                    develop-story) echo "dev" ;;
                    test-design) echo "qa" ;;
                    *) echo "" ;;
                esac
                ;;
            architect)
                case "$cmd" in
                    develop-story) echo "dev" ;;
                    test-design) echo "qa" ;;
                    revise-story|revise) echo "sm" ;;
                    review-escalation) echo "architect" ;;
                    *) echo "" ;;
                esac
                ;;
            dev)
                case "$cmd" in
                    review) echo "qa" ;;
                    review-escalation) echo "architect" ;;
                    review-qa) echo "qa" ;;
                    *) echo "" ;;
                esac
                ;;
            qa)
                case "$cmd" in
                    review-qa) echo "dev" ;;
                    develop-story) echo "dev" ;;
                    review-story) echo "architect" ;;
                    review-escalation) echo "architect" ;;
                    test-design) echo "qa" ;;
                    draft) echo "sm" ;;
                    *) echo "" ;;
                esac
                ;;
            *)
                echo ""
                ;;
        esac
    }

    # Pattern A: Command WITH story ID (*review 5.3)
    if [[ "$last_5_lines" =~ \*([a-z0-9-]+)[[:space:]]+([0-9]+\.[0-9]+) ]]; then
        detected_command="${BASH_REMATCH[1]}"
        detected_story_id="${BASH_REMATCH[2]}"

        log "Detected implicit command with story ID: *$detected_command $detected_story_id"

        # Get target agent based on command + current agent
        implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

        if [[ -n "$implicit_target" ]]; then
            target_agent="$implicit_target"
            raw_command="${detected_command} ${detected_story_id}"
            log "✓ Matched Pattern A: Implicit command with story ID → $implicit_target"
        else
            log "Command '$detected_command' from agent '$current_agent' has no known target"
        fi

    # Pattern B: Command WITHOUT story ID (*draft, *status, etc.)
    elif [[ "$last_5_lines" =~ \*([a-z0-9-]+)[[:space:]]*$ ]]; then
        detected_command="${BASH_REMATCH[1]}"

        log "Detected implicit command without story ID: *$detected_command"

        # Get target agent based on command + current agent
        implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

        if [[ -n "$implicit_target" ]]; then
            target_agent="$implicit_target"
            raw_command="$detected_command"
            log "✓ Matched Pattern B: Implicit command without story ID → $implicit_target"
        else
            log "Command '$detected_command' from agent '$current_agent' has no known target"
        fi
    else
        log "No implicit command pattern found in last 5 lines"
    fi
fi

if [[ -n "$target_agent" && -n "$raw_command" ]]; then

    # Normalize target_agent to lowercase (defensive, already done in patterns)
    target_agent=$(echo "$target_agent" | tr '[:upper:]' '[:lower:]')

    # Clean up command: remove ALL whitespace/newlines, ensure it starts with *
    # Remove newlines, carriage returns, and extra spaces
    raw_command=$(echo "$raw_command" | tr -d '\n\r' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

    # Remove Unicode symbols and non-ASCII characters, keep only alphanumeric, dots, spaces, asterisks, and hyphens
    raw_command=$(echo "$raw_command" | LC_ALL=C sed 's/[^a-zA-Z0-9. *-]//g')

    # Clean up any extra spaces that might have been introduced
    raw_command=$(echo "$raw_command" | tr -s ' ' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

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
        log "ERROR: Unknown target agent '$target_agent' (supported: architect, sm, dev, qa)"
        echo "❌ Unknown agent: $target_agent (supported: architect, sm, dev, qa)" >&2
        exit 0
    fi

    # Prevent sending to same window
    if [ "$target_window" = "$current_window" ]; then
        log "WARNING: Target window is same as current window, skipping"
        exit 0
    fi

    # ========== STEP 1: Clear current agent context ==========
    log "Step 1: Clearing current agent ($current_agent) context in window $current_window"
    if tmux send-keys -t "$SESSION_NAME:$current_window" "/clear" C-m 2>/dev/null; then
        log "✓ Clear command sent to current agent"
    else
        log "ERROR: Failed to send /clear to current agent"
    fi

    log "Waiting 5s for clear to complete..."
    sleep 5

    # ========== STEP 2: Reload current agent ==========
    current_agent_cmd=$(get_agent_command "$current_agent")
    if [ -n "$current_agent_cmd" ]; then
        log "Step 2: Reloading current agent ($current_agent) in window $current_window"
        log "  Command: $current_agent_cmd"
        if tmux send-keys -t "$SESSION_NAME:$current_window" "$current_agent_cmd" C-m 2>/dev/null; then
            log "✓ Reload command sent to current agent"
        else
            log "ERROR: Failed to reload current agent"
        fi

        log "Waiting 15s for agent to load..."
        sleep 15
    else
        log "WARNING: No reload command found for agent '$current_agent'"
    fi

    # ========== STEP 3: Send command to target window ==========
    log "Step 3: Sending command to target agent ($target_agent) in window $target_window"
    log "  Command: $command"

    # Wait a bit for window to be ready
    sleep 0.5

    # Send command and press Enter to submit (C-m = Enter)
    if tmux send-keys -t "$SESSION_NAME:$target_window" "$command" 2>/dev/null; then
        sleep 0.1
        if tmux send-keys -t "$SESSION_NAME:$target_window" C-m 2>/dev/null; then
            log "✓ SUCCESS: Command sent to $target_agent"
            echo "✅ HANDOFF: $current_agent → $target_agent (context cleared & reloaded)" >&2
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
