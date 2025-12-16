# Register Pending HANDOFF

**Purpose**: Write pending handoff information to a file at task start, enabling fallback recovery if context compression causes the agent to forget the HANDOFF instruction.

**Problem Solved**: When Claude Code compresses context during long tasks, the agent may forget to output the HANDOFF message at task completion. This utility creates a recovery file that the hook can use as a fallback.

---

## Input Parameters

```yaml
source_agent: string     # Current agent ID (dev, qa, sm, architect)
target_agent: string     # Target agent for handoff
command: string          # Command to execute (e.g., "*review", "*develop-story")
story_id: string         # Story identifier (e.g., "9.4")
task_description: string # Brief description of current task
```

---

## Execution

### Step 1: Determine File Location

```yaml
# File path (relative to project root)
file_path: ".orchestrix-core/runtime/pending-handoff.json"

# Ensure directory exists
directory: ".orchestrix-core/runtime"
```

### Step 2: Write Pending Handoff File

Create/overwrite the file with:

```json
{
  "source_agent": "{source_agent}",
  "target_agent": "{target_agent}",
  "command": "{command} {story_id}",
  "story_id": "{story_id}",
  "task_description": "{task_description}",
  "registered_at": "{ISO_8601_timestamp}",
  "status": "pending"
}
```

### Step 3: Confirm Registration

Output (for logging):
```
[HANDOFF-REGISTERED] {source_agent} -> {target_agent}: {command} {story_id}
```

---

## Usage Example

In `develop-story.md` Step 0 (before main execution):

```yaml
Execute: util-register-pending-handoff.md
Input:
  source_agent: dev
  target_agent: qa
  command: "*review"
  story_id: "{story_id}"
  task_description: "Story implementation"
```

---

## Companion: Clear Pending Handoff

After successful HANDOFF output, the hook will:
1. Detect the HANDOFF message
2. Mark the pending-handoff file as "completed"
3. Clean up on next successful handoff

---

## Notes

- This file is read by `handoff-detector.sh` as a fallback
- The hook checks this file ONLY when no HANDOFF message is found in terminal output
- File is overwritten on each task start (only one pending handoff at a time per agent)
- The `.orchestrix/` directory should be gitignored
