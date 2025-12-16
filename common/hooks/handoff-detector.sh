#!/bin/bash
# Orchestrix HANDOFF Detector - tmux Automation Hook
# Triggers on Claude Code Stop event, detects HANDOFF and routes to target agent
#
# Design principles:
# - NO dependency on environment variables (robust)
# - Scans ALL tmux windows to find HANDOFF message
# - Uses hash-based deduplication to prevent re-processing
# - Background process handles cleanup and lock release

set +e  # Don't exit on errors

# ============================================
# Configuration
# ============================================
# Try to get session from env, otherwise scan for orchestrix sessions
SESSION_NAME="${ORCHESTRIX_SESSION:-}"
LOG_FILE="/tmp/orchestrix-handoff.log"

# Agent mappings
get_agent_name() {
    case "$1" in
        0) echo "architect" ;;
        1) echo "sm" ;;
        2) echo "dev" ;;
        3) echo "qa" ;;
        *) echo "" ;;
    esac
}

get_window_num() {
    case "$1" in
        architect) echo "0" ;;
        sm) echo "1" ;;
        dev) echo "2" ;;
        qa) echo "3" ;;
        *) echo "" ;;
    esac
}

get_agent_command() {
    case "$1" in
        architect) echo "/Orchestrix:agents:architect" ;;
        sm) echo "/Orchestrix:agents:sm" ;;
        dev) echo "/Orchestrix:agents:dev" ;;
        qa) echo "/Orchestrix:agents:qa" ;;
        *) echo "" ;;
    esac
}

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# ============================================
# Find Orchestrix Session
# ============================================
log "========== Hook triggered =========="

# If SESSION_NAME not set, find orchestrix session
if [[ -z "$SESSION_NAME" ]]; then
    SESSION_NAME=$(tmux list-sessions -F '#{session_name}' 2>/dev/null | grep -E '^orchestrix' | head -1)
fi

if [[ -z "$SESSION_NAME" ]]; then
    log "EXIT: No orchestrix session found"
    exit 0
fi

if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    log "EXIT: Session '$SESSION_NAME' not found"
    exit 0
fi

# Update log file path with session name
LOG_FILE="/tmp/orchestrix-${SESSION_NAME}-handoff.log"
log "Session: $SESSION_NAME"

# ============================================
# Scan All Windows for HANDOFF
# ============================================
PROCESSED_FILE="/tmp/orchestrix-${SESSION_NAME}-processed.txt"
touch "$PROCESSED_FILE"

SOURCE_WIN=""
TARGET=""
CMD=""
HANDOFF_HASH=""

for win in 0 1 2 3; do
    OUTPUT=$(tmux capture-pane -t "$SESSION_NAME:$win" -p -S -100 2>/dev/null)
    [[ -z "$OUTPUT" ]] && continue

    # Look for HANDOFF pattern
    LINE=$(echo "$OUTPUT" | grep -E '🎯.*HANDOFF.*TO' | tail -1)
    [[ -z "$LINE" ]] && continue

    # Calculate hash to avoid re-processing
    HASH=$(echo "$LINE" | md5 2>/dev/null || echo "$LINE" | md5sum 2>/dev/null | cut -d' ' -f1)

    # Skip if already processed
    if grep -q "$HASH" "$PROCESSED_FILE" 2>/dev/null; then
        continue
    fi

    # Parse HANDOFF message
    if [[ "$LINE" =~ HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+)([[:space:]]+([0-9]+\.[0-9]+))? ]]; then
        SOURCE_WIN=$win
        TARGET=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
        CMD="*${BASH_REMATCH[2]}${BASH_REMATCH[4]:+ ${BASH_REMATCH[4]}}"
        HANDOFF_HASH=$HASH
        log "Found HANDOFF in window $win: $LINE"
        break
    fi
done

# No HANDOFF found
if [[ -z "$TARGET" || -z "$CMD" ]]; then
    log "No new HANDOFF found"
    exit 0
fi

# Mark as processed
echo "$HANDOFF_HASH" >> "$PROCESSED_FILE"

# Keep processed file small (last 100 entries)
tail -100 "$PROCESSED_FILE" > "$PROCESSED_FILE.tmp" 2>/dev/null && mv "$PROCESSED_FILE.tmp" "$PROCESSED_FILE"

# Get source agent name
SOURCE_AGENT=$(get_agent_name "$SOURCE_WIN")
TARGET_WIN=$(get_window_num "$TARGET")

# Validate
if [[ -z "$TARGET_WIN" ]]; then
    log "ERROR: Unknown target agent '$TARGET'"
    exit 0
fi

if [[ "$TARGET_WIN" == "$SOURCE_WIN" ]]; then
    log "ERROR: Source and target are same window"
    exit 0
fi

log "HANDOFF: $SOURCE_AGENT (win $SOURCE_WIN) -> $TARGET (win $TARGET_WIN)"
log "Command: $CMD"

# ============================================
# Atomic Lock
# ============================================
LOCK="/tmp/orchestrix-${SESSION_NAME}-${SOURCE_WIN}.lock"
LOCK_TIMEOUT=60

if ! mkdir "$LOCK" 2>/dev/null; then
    if [[ -f "$LOCK/ts" ]]; then
        ts=$(cat "$LOCK/ts" 2>/dev/null || echo 0)
        now=$(date +%s)
        age=$((now - ts))
        if [[ $age -lt $LOCK_TIMEOUT ]]; then
            log "SKIP: Window $SOURCE_WIN locked (${age}s ago)"
            exit 0
        fi
        log "Stale lock (${age}s), cleaning"
    fi
    rm -rf "$LOCK" 2>/dev/null
    mkdir "$LOCK" 2>/dev/null || { log "SKIP: lock race"; exit 0; }
fi
date +%s > "$LOCK/ts"

# ============================================
# Send to Target
# ============================================
log "Sending '$CMD' to $TARGET (window $TARGET_WIN)..."

if tmux send-keys -t "$SESSION_NAME:$TARGET_WIN" "$CMD" 2>/dev/null; then
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:$TARGET_WIN" Enter
    log "SUCCESS: Command sent to $TARGET"
else
    log "ERROR: Failed to send command"
    rm -rf "$LOCK"
    exit 0
fi

# ============================================
# Background: Clear & Reload Source Agent
# ============================================
RELOAD_CMD=$(get_agent_command "$SOURCE_AGENT")

(
    log "[BG] Starting cleanup for $SOURCE_AGENT (window $SOURCE_WIN)"
    sleep 2

    # Clear
    tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" "/clear" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" Enter
    log "[BG] /clear sent to $SOURCE_AGENT"

    sleep 5

    # Reload
    if [[ -n "$RELOAD_CMD" ]]; then
        tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" "$RELOAD_CMD" 2>/dev/null
        sleep 0.5
        tmux send-keys -t "$SESSION_NAME:$SOURCE_WIN" Enter
        log "[BG] Reload sent: $RELOAD_CMD"
        sleep 15
    fi

    # Release lock
    rm -rf "$LOCK"
    log "[BG] Cleanup complete, lock released"
) >> "$LOG_FILE" 2>&1 &

log "Background process started (PID $!)"
log "========== Hook complete =========="
exit 0
