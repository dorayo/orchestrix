---
description: "Validate Status Transition Utility"
---

When this command is used, execute the following task:

# Validate Status Transition Utility

## Purpose

Validate story status transitions according to rules defined in story-status-transitions.yaml.

## Input Parameters

- `current_status`: Current story status (string)
- `target_status`: Desired target status (string)
- `agent_role`: Agent requesting transition (SM | Architect | Dev | QA)
- `story_id`: Story identifier (string, for logging)

## Execution

### Step 1: Load Transition Rules

1. Read `orchestrix-core/data/story-status-transitions.yaml`
2. Parse YAML structure
3. Validate file structure is correct

**Error Handling**: If file not found or invalid YAML → HALT with error message

### Step 2: Validate Transition

1. **Check if transition is allowed**:
   - Look up `current_status` in transitions map
   - Check if `target_status` is in the list of allowed transitions
2. **Check agent permissions**:
   - For the transition, verify `agent_role` is in the list of authorized agents
3. **Check prerequisites** (if defined):
   - Verify any required conditions are met
   - Check for required fields or states

### Step 3: Return Result

Return structured validation result:

```yaml
result:
  valid: true|false
  reason: "explanation if invalid"
  current_status: "{current_status}"
  target_status: "{target_status}"
  agent_role: "{agent_role}"
  allowed_transitions: [list of valid transitions from current status]
  authorized_agents: [list of agents who can make this transition]
```

## Output Format

### Success Case (Valid Transition)

```yaml
result:
  valid: true
  reason: "Transition allowed"
  current_status: "Draft"
  target_status: "AwaitingArchReview"
  agent_role: "SM"
  allowed_transitions: ["AwaitingArchReview", "Blocked"]
  authorized_agents: ["SM"]
```

### Failure Case (Invalid Transition)

```yaml
result:
  valid: false
  reason: "Transition not allowed: Draft → InProgress"
  current_status: "Draft"
  target_status: "InProgress"
  agent_role: "SM"
  allowed_transitions: ["AwaitingArchReview", "Blocked"]
  authorized_agents: []
```

### Failure Case (Permission Denied)

```yaml
result:
  valid: false
  reason: "Agent 'Dev' not authorized for transition Draft → AwaitingArchReview"
  current_status: "Draft"
  target_status: "AwaitingArchReview"
  agent_role: "Dev"
  allowed_transitions: ["AwaitingArchReview", "Blocked"]
  authorized_agents: ["SM"]
```

### Failure Case (Invalid Status)

```yaml
result:
  valid: false
  reason: "Invalid current status: 'InvalidStatus'"
  current_status: "InvalidStatus"
  target_status: "Draft"
  agent_role: "SM"
  allowed_transitions: []
  authorized_agents: []
```

## Error Handling

### Rules File Not Found

- **Action**: HALT
- **Message**: "FATAL: story-status-transitions.yaml not found at {path}"
- **Recovery**: "Ensure orchestrix-core/data/story-status-transitions.yaml exists"

### Invalid YAML Structure

- **Action**: HALT
- **Message**: "FATAL: Invalid YAML in story-status-transitions.yaml: {error}"
- **Recovery**: "Fix YAML syntax errors"

### Invalid Status

- **Action**: Return error result
- **Message**: "Invalid status: '{status}' not found in transitions"
- **Include**: List of valid statuses

### Permission Denied

- **Action**: Return error result
- **Message**: "Agent '{agent}' not authorized for transition {current} → {target}"
- **Include**: List of authorized agents

## Usage Example

```markdown
# In a task file (e.g., create-next-story.md)

### Validate Status Transition

Execute: utils/validate-status-transition.md

- current_status: {read from story YAML front matter}
- target_status: "AwaitingArchReview"
- agent_role: "SM"
- story_id: {story_id}

If result.valid = false:

- HALT execution
- Log result.reason to Change Log
- Output: "Cannot transition: {result.reason}"
- Suggest: "Valid transitions: {result.allowed_transitions}"
```

## Notes

- This utility is read-only; it does not modify story status
- Actual status updates should be done by the calling task after validation
- All validation logic is centralized in story-status-transitions.yaml
- This utility can be used by any agent to validate transitions before attempting them
