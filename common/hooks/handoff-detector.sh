#!/bin/bash
# Orchestrix HANDOFF Detector - tmux Automation Hook
# Triggers on Claude Code Stop event, detects HANDOFF and routes to target agent
#
# Design principles:
# - mkdir atomic lock prevents race conditions
# - Lock held through entire cycle (HANDOFF → clear → reload)
# - Background process handles cleanup and lock release

set +e  # Don't exit on errors

# ============================================
# Configuration
# ============================================
SESSION_NAME="${ORCHESTRIX_SESSION:-orchestrix}"
LOG_FILE="${ORCHESTRIX_LOG:-/tmp/orchestrix-${SESSION_NAME}-handoff.log}"
LOCK_TIMEOUT=60  # seconds before considering lock stale

# Agent mappings
get_window() {
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

log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG_FILE"; }

# ============================================
# Initialize
# ============================================
AGENT="${AGENT_ID:-unknown}"
WINDOW=$(get_window "$AGENT")

[[ -z "$WINDOW" ]] && exit 0
tmux has-session -t "$SESSION_NAME" 2>/dev/null || exit 0

log "=== $AGENT (win $WINDOW) ==="

# ============================================
# Atomic Lock (mkdir is atomic)
# ============================================
LOCK="/tmp/orchestrix-${SESSION_NAME}-${WINDOW}.lock"

if ! mkdir "$LOCK" 2>/dev/null; then
    # Lock exists - check if stale
    if [[ -f "$LOCK/ts" ]]; then
        ts=$(cat "$LOCK/ts" 2>/dev/null || echo 0)
        now=$(date +%s)
        age=$((now - ts))
        if [[ $age -lt $LOCK_TIMEOUT ]]; then
            log "SKIP: locked (${age}s ago)"
            exit 0
        fi
        log "Stale lock (${age}s), cleaning"
    fi
    rm -rf "$LOCK" 2>/dev/null
    mkdir "$LOCK" 2>/dev/null || { log "SKIP: lock race"; exit 0; }
fi
date +%s > "$LOCK/ts"
log "Lock acquired"

# ============================================
# Capture & Parse HANDOFF
# ============================================
OUTPUT=$(tmux capture-pane -t "$SESSION_NAME:$WINDOW" -p -S -200 2>/dev/null)
[[ -z "$OUTPUT" ]] && { log "No output"; rm -rf "$LOCK"; exit 0; }

TARGET=""
CMD=""

# Method 1: STB (Structured Termination Block)
if echo "$OUTPUT" | grep -q '---ORCHESTRIX-HANDOFF-BEGIN---'; then
    STB=$(echo "$OUTPUT" | awk '/---ORCHESTRIX-HANDOFF-BEGIN---/{f=1;b=""} f{b=b$0"\n"} /---ORCHESTRIX-HANDOFF-END---/{if(f)l=b;f=0} END{printf "%s",l}')
    TARGET=$(echo "$STB" | grep -E '^[[:space:]]*target:' | sed 's/.*://' | tr -d ' \t' | tr '[:upper:]' '[:lower:]')
    C=$(echo "$STB" | grep -E '^[[:space:]]*command:' | sed 's/.*://' | tr -d ' \t')
    A=$(echo "$STB" | grep -E '^[[:space:]]*args:' | sed 's/.*args://' | sed 's/^[ \t]*//')
    [[ -n "$TARGET" && -n "$C" ]] && CMD="*$C${A:+ $A}"
fi

# Method 2: Emoji pattern
if [[ -z "$TARGET" ]]; then
    LINE=$(echo "$OUTPUT" | grep -E '🎯.*HANDOFF.*TO' | tail -1)
    if [[ "$LINE" =~ HANDOFF[[:space:]]+TO[[:space:]]+([a-zA-Z0-9_-]+):[[:space:]]*\*?([a-z0-9-]+)([[:space:]]+([0-9]+\.[0-9]+))? ]]; then
        TARGET=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
        CMD="*${BASH_REMATCH[2]}${BASH_REMATCH[4]:+ ${BASH_REMATCH[4]}}"
    fi
fi

# No HANDOFF
if [[ -z "$TARGET" || -z "$CMD" ]]; then
    log "No HANDOFF"
    rm -rf "$LOCK"
    exit 0
fi

# Validate target
TARGET_WIN=$(get_window "$TARGET")
[[ -z "$TARGET_WIN" ]] && { log "Unknown target: $TARGET"; rm -rf "$LOCK"; exit 0; }
[[ "$TARGET_WIN" == "$WINDOW" ]] && { log "Same window"; rm -rf "$LOCK"; exit 0; }

log "HANDOFF: $AGENT -> $TARGET ($CMD)"

# ============================================
# Send to Target
# ============================================
if tmux send-keys -t "$SESSION_NAME:$TARGET_WIN" "$CMD" 2>/dev/null; then
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:$TARGET_WIN" Enter
    log "Sent to $TARGET"
else
    log "ERROR: send failed"
    rm -rf "$LOCK"
    exit 0
fi

# ============================================
# Background: Clear & Reload Current Agent
# ============================================
RELOAD_CMD=$(get_agent_command "$AGENT")

(
    log "[BG] Start"
    sleep 2

    # Clear
    tmux send-keys -t "$SESSION_NAME:$WINDOW" "/clear" 2>/dev/null
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:$WINDOW" Enter
    log "[BG] /clear sent"

    sleep 5

    # Reload
    if [[ -n "$RELOAD_CMD" ]]; then
        tmux send-keys -t "$SESSION_NAME:$WINDOW" "$RELOAD_CMD" 2>/dev/null
        sleep 0.5
        tmux send-keys -t "$SESSION_NAME:$WINDOW" Enter
        log "[BG] Reload: $RELOAD_CMD"
        sleep 15
    fi

    # Release lock
    rm -rf "$LOCK"
    log "[BG] Done, lock released"
) >> "$LOG_FILE" 2>&1 &

log "BG started (PID $!)"
exit 0
