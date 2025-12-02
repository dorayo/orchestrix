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
# Pattern 6: Implicit command detection - check last 20 lines for command patterns
# This catches cases where agent outputs command without explicit "HANDOFF TO" marker
# Note: We check last 20 lines because Claude Code UI may add separator lines after the command
# IMPORTANT: Use line-by-line matching because $ in bash regex matches end of STRING, not end of LINE
if [[ -z "$target_agent" || -z "$raw_command" ]]; then
    log "No explicit HANDOFF found, checking last 20 lines for implicit commands..."

    # Extract last 20 lines from pane output
    last_20_lines=$(echo "$pane_output" | tail -20)
    log "Last 20 lines: $last_20_lines"

    # Function to map command + current_agent → target_agent
    get_target_from_command() {
        local cmd="$1"
        local current="$2"

        case "$current" in
            sm)
                case "$cmd" in
                    review) echo "architect" ;;
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
                    apply-qa-fixes) echo "qa" ;;
                    *) echo "" ;;
                esac
                ;;
            qa)
                case "$cmd" in
                    apply-qa-fixes) echo "dev" ;;
                    develop-story) echo "dev" ;;
                    review) echo "architect" ;;
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

    # Pattern A: Command WITH story ID (*review 5.3) - non-anchored, works on multi-line
    if [[ "$last_20_lines" =~ \*([a-z0-9-]+)[[:space:]]+([0-9]+\.[0-9]+) ]]; then
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

    # Pattern C: NEXT STEP format (🎯 NEXT STEP: ... *command)
    # Used to match QA completion prompt format
    elif [[ "$last_20_lines" =~ 🎯[[:space:]]*NEXT[[:space:]]+STEP:.*\*([a-z0-9-]+) ]]; then
        detected_command="${BASH_REMATCH[1]}"

        log "Detected NEXT STEP format: *$detected_command"

        # Get target agent based on command + current agent
        implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

        if [[ -n "$implicit_target" ]]; then
            target_agent="$implicit_target"
            raw_command="$detected_command"
            log "✓ Matched Pattern C: NEXT STEP format → $implicit_target"
        else
            log "Command '$detected_command' from agent '$current_agent' has no known target"
        fi

    else
        # ========== LINE-BY-LINE MATCHING ==========
        # For patterns that need end-of-line anchoring, we must iterate line by line
        # because bash regex $ matches end of STRING, not end of LINE
        log "Checking line-by-line for plain command patterns..."

        # Use reverse order to get the most recent command first
        while IFS= read -r line; do
            # Skip empty lines and lines with only whitespace
            [[ -z "${line// /}" ]] && continue

            # Skip Claude Code UI elements (spinner, prompt lines, etc.)
            [[ "$line" =~ ^[·✽✳●○◐◑◒◓▸▹►▻] ]] && continue
            [[ "$line" =~ ^[─━═┈┉┄┅] ]] && continue
            [[ "$line" =~ "INSERT" ]] && continue
            [[ "$line" =~ "bypass permissions" ]] && continue
            [[ "$line" =~ "esc to interrupt" ]] && continue
            [[ "$line" =~ "running stop hooks" ]] && continue

            # Pattern D: Plain command with story ID (review 3.3)
            # Must be on its own line, with optional leading/trailing whitespace
            if [[ "$line" =~ ^[[:space:]]*(draft|review|develop-story|revise-story|revise|test-design|apply-qa-fixes)[[:space:]]+([0-9]+\.[0-9]+)[[:space:]]*$ ]]; then
                detected_command="${BASH_REMATCH[1]}"
                detected_story_id="${BASH_REMATCH[2]}"

                log "Detected plain command with story ID: $detected_command $detected_story_id"

                # Get target agent based on command + current agent
                implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

                if [[ -n "$implicit_target" ]]; then
                    target_agent="$implicit_target"
                    raw_command="${detected_command} ${detected_story_id}"
                    log "✓ Matched Pattern D: Plain command with story ID → $implicit_target"
                    break
                else
                    log "Command '$detected_command' from agent '$current_agent' has no known target"
                fi

            # Pattern E: Plain command without story ID (draft, review)
            elif [[ "$line" =~ ^[[:space:]]*(draft|review|develop-story|revise-story|revise|test-design|apply-qa-fixes)[[:space:]]*$ ]]; then
                detected_command="${BASH_REMATCH[1]}"

                log "Detected plain command without story ID: $detected_command"

                # Get target agent based on command + current agent
                implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

                if [[ -n "$implicit_target" ]]; then
                    target_agent="$implicit_target"
                    raw_command="$detected_command"
                    log "✓ Matched Pattern E: Plain command without story ID → $implicit_target"
                    break
                else
                    log "Command '$detected_command' from agent '$current_agent' has no known target"
                fi

            # Pattern B: Command WITHOUT story ID with * prefix (*draft)
            elif [[ "$line" =~ ^[[:space:]]*\*([a-z0-9-]+)[[:space:]]*$ ]]; then
                detected_command="${BASH_REMATCH[1]}"

                log "Detected *command without story ID: *$detected_command"

                # Get target agent based on command + current agent
                implicit_target=$(get_target_from_command "$detected_command" "$current_agent")

                if [[ -n "$implicit_target" ]]; then
                    target_agent="$implicit_target"
                    raw_command="$detected_command"
                    log "✓ Matched Pattern B: *command without story ID → $implicit_target"
                    break
                else
                    log "Command '$detected_command' from agent '$current_agent' has no known target"
                fi
            fi
        done <<< "$last_20_lines"

        if [[ -z "$target_agent" || -z "$raw_command" ]]; then
            log "No implicit command pattern found in last 20 lines"
        fi
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

    # ========== STEP 1: Send command to target window (immediate) ==========
    log "Step 1: Sending command to target agent ($target_agent) in window $target_window"
    log "  Command: $command"

    # Send command text first
    if tmux send-keys -t "$SESSION_NAME:$target_window" "$command" 2>/dev/null; then
        # Wait for Claude Code input box to stabilize (prevent race condition)
        sleep 1

        # Send Enter key to execute command
        if tmux send-keys -t "$SESSION_NAME:$target_window" "Enter" 2>/dev/null; then
            log "✓ SUCCESS: Command sent to $target_agent"
            echo "✅ HANDOFF: $current_agent → $target_agent" >&2
        else
            log "ERROR: Failed to send Enter key"
            echo "❌ Failed to send Enter" >&2
            exit 0
        fi
    else
        log "ERROR: Failed to send command text"
        echo "❌ Failed to send command" >&2
        exit 0
    fi

    # ========== STEP 2: Launch background process to clear & reload current agent ==========
    log "Step 2: Launching background process to clear and reload current agent"

    # Get agent command before launching background process
    current_agent_cmd=$(get_agent_command "$current_agent")

    # Launch background process (will run independently after hook exits)
    (
        # Log to the same file
        log() {
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BG] $*" >> "$LOG_FILE"
        }

        log "Background process started for $current_agent (window $current_window)"

        # Wait for hook to exit and agent to be ready
        log "Waiting 2s for hook to exit..."
        sleep 2

        # Clear current agent context
        log "Sending /clear to $current_agent..."
        if tmux send-keys -t "$SESSION_NAME:$current_window" "/clear" 2>/dev/null && \
           tmux send-keys -t "$SESSION_NAME:$current_window" "Enter" 2>/dev/null; then
            log "✓ Clear command sent"
        else
            log "ERROR: Failed to send /clear"
        fi

        # Wait for clear to complete
        log "Waiting 5s for clear to complete..."
        sleep 5

        # Reload agent
        if [ -n "$current_agent_cmd" ]; then
            log "Reloading $current_agent with command: $current_agent_cmd"
            if tmux send-keys -t "$SESSION_NAME:$current_window" "$current_agent_cmd" 2>/dev/null && \
               tmux send-keys -t "$SESSION_NAME:$current_window" "Enter" 2>/dev/null; then
                log "✓ Reload command sent"
            else
                log "ERROR: Failed to reload agent"
            fi

            log "Waiting 15s for agent to load..."
            sleep 15
            log "✓ Agent reload complete"
        else
            log "WARNING: No reload command found for $current_agent"
        fi

        log "Background process complete"
    ) >> "$LOG_FILE" 2>&1 &  # Run in background, redirect to log file

    bg_pid=$!
    log "✓ Background process launched (PID: $bg_pid) - will clear & reload after hook exits"
else
    log "No HANDOFF pattern found in pane output"
fi

log "========== Hook complete =========="
exit 0
