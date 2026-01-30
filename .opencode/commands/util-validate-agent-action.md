---
description: "Unified Agent Action Validation"
---

When this command is used, execute the following task:

# Unified Agent Action Validation

## Purpose

Efficiently validate Agent action legality by combining permission checks and status transition validation, reducing redundant file reads.

## Inputs

```yaml
required:
  - agent_id: Current Agent identifier (sm, architect, dev, qa)
  - story_path: Story file path
  - action: Action being performed (implement, review, revise, create, etc.)

optional:
  - target_status: Target status (if status transition involved)
  - skip_transition_check: Skip transition validation (default: false)
```

## Process

### Step 1: Load All Configuration (Single Read)

**Read files** (once only):

1. `.orchestrix-core/data/story-status-transitions.yaml` → `rules`
2. `{story_path}` → Extract `Status` field → `current_status`

**Error Handling**:

- Config file missing → HALT with "FATAL: story-status-transitions.yaml not found"
- Story file missing → HALT with "ERROR: Story file not found: {story_path}"
- Status field missing → HALT with "ERROR: Story missing Status field"

### Step 2: Agent Identity Validation

**Verify Agent exists**:

```yaml
agent_exists = agent_id IN rules.permissions.keys()
```

**Error Handling**:

- Agent not found → FAIL with "Unknown agent: {agent_id}"
- Agent has no permissions → FAIL with "Agent {agent_id} has no permissions"

### Step 3: Status Validity Check

**Validate current status**:

```yaml
status_valid = current_status IN rules.statuses.keys()
```

**Error Handling**:

- Invalid status → FAIL with "Invalid status: {current_status}"
- Include valid status list for reference

### Step 4: Modification Permission Validation

**Check if Agent can modify Story in current status**:

```yaml
can_modify = current_status IN rules.permissions[agent_id].modify
```

**Permission Matrix**:
| Agent | Modifiable Statuses |
|-------|---------------------|
| SM | Blocked, RequiresRevision |
| Architect | AwaitingArchReview, Escalated |
| Dev | Approved, TestDesignComplete, InProgress |
| QA | AwaitingTestDesign, TestDesignComplete, Review |

**Permission Denied Handling**:

```yaml
if not can_modify:
  responsible_agent = rules.statuses[current_status].agent
  return FAIL with:
    error_type: UNAUTHORIZED
    error_message: "{agent_id} cannot {action} story in status {current_status}"
    responsible_agent: {responsible_agent}
    guidance: "Story is in {current_status}, managed by {responsible_agent}"
```

### Step 5: Status Transition Validation (if target_status provided)

**Skip conditions**:

- `skip_transition_check = true`
- `target_status` not provided

**Validate transition legality**:

```yaml
transition_key = "{current_status} -> {target_status}"
transition_allowed = transition_key IN rules.permissions[agent_id].changes
```

**Check if transition is in allowed list**:

1. Lookup `permissions[agent_id].changes`
2. Check if contains `{current_status} -> {target_status}`
3. If not in list, get all allowed transitions

**Transition Denied Handling**:

```yaml
if not transition_allowed:
  allowed_transitions = [t for t in rules.permissions[agent_id].changes if t.startswith(current_status)]
  return FAIL with:
    error_type: INVALID_TRANSITION
    error_message: "Transition {current_status} -> {target_status} not allowed for {agent_id}"
    attempted_transition: "{current_status} -> {target_status}"
    allowed_transitions: {allowed_transitions}
    guidance: "{agent_id} can only transition from {current_status} to: {allowed_targets}"
```

### Step 6: Special Prerequisite Validation (if applicable)

**Check for special validation rules**:

```yaml
transition_full_key = "{current_status}_to_{target_status}"
has_special_validation = transition_full_key IN rules.validation.special
```

**Special Validation Rule Examples**:

- `AwaitingArchReview -> Approved`: Must check test_level = "Simple"
- `InProgress -> Blocked`: Must check blocking issue recorded
- `Review -> Escalated`: Must check arch concern recorded

**Special Validation Failed Handling**:

```yaml
if special_validation_failed:
  return FAIL with:
    error_type: SPECIAL_VALIDATION_FAILED
    error_message: { special_rule.error }
    required_fields: { special_rule.required }
    guidance: { special_rule.hint }
```

### Step 7: Generate Validation Result

**Success**:

```yaml
result:
  validation: PASS
  agent: { agent_id }
  current_status: { current_status }
  action: { action }
  permitted: true
  message: "Agent {agent_id} authorized to {action} story in status {current_status}"

  # If target_status provided
  transition_valid: true
  target_status: { target_status }
  transition_message: "Transition {current_status} -> {target_status} is allowed"
  prerequisites: { list of prereq from transition rules }
```

**Failure**:

```yaml
result:
  validation: FAIL
  agent: { agent_id }
  current_status: { current_status }
  action: { action }
  permitted: false
  error_type: { UNAUTHORIZED | INVALID_TRANSITION | SPECIAL_VALIDATION_FAILED }
  error_message: "{detailed error message}"

  # UNAUTHORIZED specific fields
  responsible_agent: { responsible_agent }
  guidance: "{responsible agent and suggested action}"

  # INVALID_TRANSITION specific fields
  attempted_transition: "{current_status} -> {target_status}"
  allowed_transitions: [list of valid transitions]

  # SPECIAL_VALIDATION_FAILED specific fields
  special_validation_error: "{specific error}"
  required_fields: [list of missing fields]
```

## Output Examples

### Example 1: Dev Implements Approved Story (Success)

**Input**:

```yaml
agent_id: dev
story_path: docs/dev/stories/1.1.implement-auth.md
action: implement
```

**Output**:

```yaml
result:
  validation: PASS
  agent: dev
  current_status: Approved
  action: implement
  permitted: true
  message: "Agent dev authorized to implement story in status Approved"
```

### Example 2: Dev Attempts to Modify Blocked Story (Fail - Unauthorized)

**Input**:

```yaml
agent_id: dev
story_path: docs/dev/stories/1.2.user-profile.md
action: implement
```

**Output**:

```yaml
result:
  validation: FAIL
  agent: dev
  current_status: Blocked
  action: implement
  permitted: false
  error_type: UNAUTHORIZED
  error_message: "dev cannot implement story in status Blocked"
  responsible_agent: SM
  guidance: "Story is in Blocked status, managed by SM. SM must revise the story first."
```

### Example 3: Dev Completes Implementation and Transitions to Review (Success)

**Input**:

```yaml
agent_id: dev
story_path: docs/dev/stories/1.1.implement-auth.md
action: complete_implementation
target_status: Review
```

**Output**:

```yaml
result:
  validation: PASS
  agent: dev
  current_status: InProgress
  action: complete_implementation
  permitted: true
  message: "Agent dev authorized to complete_implementation story in status InProgress"
  transition_valid: true
  target_status: Review
  transition_message: "Transition InProgress -> Review is allowed"
  prerequisites:
    - impl_done: true
    - tasks_done: true
    - tests_written: true
```

### Example 4: QA Attempts Invalid Transition (Fail - Invalid Transition)

**Input**:

```yaml
agent_id: qa
story_path: docs/dev/stories/1.3.dashboard.md
action: mark_done
target_status: Approved
```

**Output**:

```yaml
result:
  validation: FAIL
  agent: qa
  current_status: Review
  action: mark_done
  permitted: true
  error_type: INVALID_TRANSITION
  error_message: "Transition Review -> Approved not allowed for qa"
  attempted_transition: "Review -> Approved"
  allowed_transitions:
    - "Review -> Done"
    - "Review -> InProgress"
    - "Review -> Escalated"
  guidance: "QA can only transition from Review to: Done, InProgress, or Escalated"
```

## Usage Examples

### In develop-story.md

```markdown
## Prerequisites

Execute: `.orchestrix-core/tasks/util-validate-agent-action.md`

Input:
agent_id: dev
story_path: {story_path}
action: implement

If result.validation = FAIL:

- Output result.error_message
- Output result.guidance
- HALT
```

### In qa-review-story.md (with status transition)

```markdown
## Validation

Execute: `.orchestrix-core/tasks/util-validate-agent-action.md`

Input:
agent_id: qa
story_path: {story_path}
action: review
target_status: Done

If result.validation = FAIL:

- Log result.error_message
- If error_type = INVALID_TRANSITION:
  - Output result.allowed_transitions
- HALT
```

## Key Principles

- **Single Read**: All config files read once only
- **Fail Fast**: Validate in order, return on first error
- **Clear Errors**: Provide actionable guidance
- **Complete Validation**: All checks in one utility
- **Backward Compatible**: Can replace existing validation utilities

## References

- `data/story-status-transitions.yaml` - Permission and transition rules
