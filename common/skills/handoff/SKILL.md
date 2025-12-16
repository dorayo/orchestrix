---
name: handoff
description: Execute tmux handoff to transfer work to another Orchestrix agent. Use this skill when you have completed your task and need to hand off work to another agent (sm, dev, qa, architect). This skill will send the command to the target agent's tmux window and clean up the current agent's context.
allowed-tools: Bash
---

# Orchestrix Handoff Skill

Transfer work to another agent in the tmux multi-agent automation environment.

## When to Use

Use this skill when:

- You have completed your current task
- You need to hand off work to another agent (sm, dev, qa, architect)
- You are running in a tmux Orchestrix session

## Required Information

Before executing handoff, you must have:

1. **Target Agent**: Who should receive the work (sm, dev, qa, architect)
2. **Command**: What command to send (e.g., `*review 5.3`, `*draft`, `*develop-story 3.2`)

## Execution Steps

### Step 1: Determine Session and Window Information

Get the current session name and agent:

```bash
echo "Session: ${ORCHESTRIX_SESSION:-orchestrix}"
echo "Current Agent: ${AGENT_ID:-unknown}"
```

### Step 2: Map Agent to Window

Use this mapping:
| Agent | Window |
|-------|--------|
| architect | 0 |
| sm | 1 |
| dev | 2 |
| qa | 3 |

### Step 3: Send Command to Target Agent

Execute this Bash command (replace variables):

```bash
# Variables to replace:
# SESSION = value from ORCHESTRIX_SESSION or "orchestrix"
# TARGET_WINDOW = window number from mapping above
# COMMAND = the command to send (e.g., "*review 5.3")

tmux send-keys -t "${SESSION}:${TARGET_WINDOW}" "${COMMAND}" && sleep 0.5 && tmux send-keys -t "${SESSION}:${TARGET_WINDOW}" Enter
```

### Step 4: Clear Current Agent Context

After sending to target, clear the current agent:

```bash
# CURRENT_WINDOW = window number of current agent

tmux send-keys -t "${SESSION}:${CURRENT_WINDOW}" "/clear" && sleep 0.5 && tmux send-keys -t "${SESSION}:${CURRENT_WINDOW}" Enter
```

### Step 5: Reload Current Agent

Wait for clear to complete, then reload:

```bash
# Wait for clear
sleep 3

# AGENT_COMMAND = the SubAgent command for current agent
# e.g., "/Orchestrix:agents:dev" for dev agent

tmux send-keys -t "${SESSION}:${CURRENT_WINDOW}" "${AGENT_COMMAND}" && sleep 0.5 && tmux send-keys -t "${SESSION}:${CURRENT_WINDOW}" Enter
```

## Complete Example

If you are the **dev** agent and need to hand off to **qa** with command `*review 5.3`:

```bash
# Step 1: Get session (default: orchestrix or from env)
SESSION="${ORCHESTRIX_SESSION:-orchestrix}"

# Step 2: Target is QA = window 3, Current is Dev = window 2
TARGET_WINDOW=3
CURRENT_WINDOW=2

# Step 3: Send to QA
tmux send-keys -t "${SESSION}:3" "*review 5.3" && sleep 0.5 && tmux send-keys -t "${SESSION}:3" Enter

# Step 4: Clear Dev
tmux send-keys -t "${SESSION}:2" "/clear" && sleep 0.5 && tmux send-keys -t "${SESSION}:2" Enter

# Step 5: Reload Dev (after 3s delay)
sleep 3
tmux send-keys -t "${SESSION}:2" "/Orchestrix:agents:dev" && sleep 0.5 && tmux send-keys -t "${SESSION}:2" Enter
```

## Agent Command Reference

| Agent     | SubAgent Command             |
| --------- | ---------------------------- |
| architect | /Orchestrix:agents:architect |
| sm        | /Orchestrix:agents:sm        |
| dev       | /Orchestrix:agents:dev       |
| qa        | /Orchestrix:agents:qa        |

## Important Notes

1. **Always verify tmux session exists** before sending commands
2. **Use sleep between commands** to prevent race conditions
3. **Do not skip the reload step** - it ensures the agent is ready for next task
4. After executing handoff, your task is complete - do not continue with other work

## Verification

After handoff, the target agent should show the command being processed. You can verify by checking the tmux session status, but this is optional.
