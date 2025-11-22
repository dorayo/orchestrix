# Validate Agent Permission

## Purpose

Unified agent permission validation utility for all status-modifying tasks. Ensures agents only modify stories in authorized statuses.

## Inputs

```yaml
required:
  - agent_id: Current agent identifier (sm, architect, dev, qa)
  - story_path: Path to story file
  - action: Action being performed (implement, review, revise, etc.)

optional:
  - target_status: Status agent intends to transition to
```

## Process

### 1. Load Permission Configuration

**Read**: `{root}/data/story-status-transitions.yaml`

**Extract**:
- Agent permissions: `permissions.{agent_id}`
- Authorized statuses: `permissions.{agent_id}.modify`
- Allowed transitions: `permissions.{agent_id}.changes`
- Status definitions: `statuses.{status_name}`

### 2. Read Current Story Status

**Parse story file**:
- Locate `Status:` field
- Extract current status value
- Validate status is a recognized status from config

**Error Handling**:
- If Status field missing: ERROR - "Story missing Status field"
- If status unrecognized: ERROR - "Invalid status: {status}"

### 3. Verify Agent Identity

**Confirm caller identity**:
- Expected agent_id matches calling agent
- Agent exists in permissions configuration
- Agent has modify permissions defined

**Error Handling**:
- If agent not recognized: ERROR - "Unknown agent: {agent_id}"
- If agent has no permissions: ERROR - "Agent {agent_id} has no modify permissions"

### 4. Validate Modification Permission

**Check if agent can modify story in current status**:

```yaml
permitted = current_status IN permissions.{agent_id}.modify
```

**Permission Matrix** (from story-status-transitions.yaml):

| Agent | Can Modify Statuses |
|-------|-------------------|
| SM | Blocked, RequiresRevision |
| Architect | AwaitingArchReview, Escalated |
| Dev | Approved, TestDesignComplete, InProgress |
| QA | AwaitingTestDesign, TestDesignComplete, Review |

**On Permission Denied**:
- Get responsible agent for current status
- Generate error message with guidance
- Return FAIL result

### 5. Validate Status Transition (if target_status provided)

**Check if transition is allowed**:

```yaml
transition_key = "{current_status}_to_{target_status}"
allowed = transition_key IN permissions.{agent_id}.changes
```

**For each transition**:
- Verify transition exists in configuration
- Check agent is authorized to perform transition
- Validate prerequisites if defined

**On Invalid Transition**:
- Get allowed transitions for current status
- Generate error with list of valid options
- Return FAIL result

### 6. Check Special Validations

**From** `validation.special` **in config**:

**Example**: AwaitingArchReview → Approved
- Must check test_design_level = "Simple"
- Cannot approve if test level is Standard/Comprehensive

**Example**: InProgress → Blocked
- Must check blocking issue documented
- Required fields: issue_desc, issue_type, blocking_reason

**On Special Validation Failure**:
- Return specific error from config
- Include guidance from error_messages
- Return FAIL result

### 7. Generate Validation Result

**Success**:
```yaml
result: PASS
agent: {agent_id}
current_status: {status}
permitted: true
message: "Agent {agent_id} authorized to {action} story in status {current_status}"

# If target_status provided
transition_valid: true
target_status: {target_status}
transition_message: "Transition {current_status} → {target_status} is allowed"
```

**Failure**:
```yaml
result: FAIL
agent: {agent_id}
current_status: {status}
permitted: false
error_type: {UNAUTHORIZED|INVALID_TRANSITION|SPECIAL_VALIDATION}

error_message: "Agent {agent_id} cannot {action} story in status {current_status}"
responsible_agent: {responsible_agent_for_current_status}
guidance: "Story is in {current_status}, which is managed by {responsible_agent}"

# If transition attempted
attempted_transition: "{current_status} → {target_status}"
allowed_transitions: [list of valid transitions for this agent]

# If special validation failed
special_validation_error: {specific_error_from_config}
```

## Output Scenarios

### Scenario 1: Dev trying to modify Approved story

**Input**:
```yaml
agent_id: dev
story_status: Approved
action: implement
```

**Output**:
```yaml
result: PASS
message: "Dev authorized to implement story in status Approved"
permitted: true
```

### Scenario 2: Dev trying to modify Blocked story

**Input**:
```yaml
agent_id: dev
story_status: Blocked
action: implement
```

**Output**:
```yaml
result: FAIL
error_type: UNAUTHORIZED
error_message: "Dev cannot implement story in status Blocked"
responsible_agent: SM
guidance: "Story is in Blocked status, which is managed by SM. SM must revise the story first."
```

### Scenario 3: Dev transitioning InProgress → Review

**Input**:
```yaml
agent_id: dev
story_status: InProgress
action: mark_complete
target_status: Review
```

**Output**:
```yaml
result: PASS
message: "Dev authorized to modify story in status InProgress"
transition_valid: true
transition_message: "Transition InProgress → Review is allowed"
prerequisites:
  - impl_done: true
  - tasks_done: true
  - tests_written: true
```

### Scenario 4: Invalid Transition Attempt

**Input**:
```yaml
agent_id: dev
story_status: InProgress
target_status: Done
```

**Output**:
```yaml
result: FAIL
error_type: INVALID_TRANSITION
error_message: "Transition InProgress → Done is not allowed for Dev"
attempted_transition: "InProgress → Done"
allowed_transitions:
  - "InProgress → Review"
  - "InProgress → Blocked"
guidance: "Dev can only transition to Review or Blocked from InProgress"
```

## Usage Examples

### In develop-story.md

```markdown
## Prerequisites

**Agent Permission Check**:

Execute: `{root}/tasks/utils/validate-agent-permission.md`

Input:
- agent_id: dev
- story_path: {story_path}
- action: implement

If result = FAIL:
  - Output error_message
  - Output guidance
  - HALT with responsible_agent information
```

### In apply-qa-fixes.md

```markdown
## Agent Permission Check

Execute: `{root}/tasks/utils/validate-agent-permission.md`

Input:
- agent_id: dev
- story_path: {story_path}
- action: apply_fixes
- target_status: Review

If result = FAIL:
  - Log error details
  - HALT and inform user
  - Do NOT proceed with fixes
```

## Error Messages

**From story-status-transitions.yaml**:

```yaml
errors:
  invalid_transition:
    msg: "Invalid transition: {current_status} → {target_status}"
    hint: "Allowed: {allowed_transitions}"

  unauthorized:
    msg: "{agent} cannot modify {status}"
    hint: "Responsible: {responsible_agent}"

  missing_prereq:
    msg: "Prerequisites not met"
    hint: "Missing: {missing_prerequisites}"
```

## Logging

**Always log validation attempts**:
```yaml
log_entry:
  timestamp: {iso_timestamp}
  agent: {agent_id}
  story: {story_id}
  current_status: {status}
  action: {action}
  result: {PASS/FAIL}
  target_status: {target_status if provided}
  error: {error_message if failed}
```

## Key Principles

- **Fail-safe**: Deny by default, allow only explicitly permitted actions
- **Clear errors**: Provide actionable guidance on failures
- **Centralized logic**: Single source of truth for permissions
- **Consistent enforcement**: Same validation across all agents
- **Audit trail**: Log all validation attempts

## References

- `data/story-status-transitions.yaml` - Permission configuration
- `tasks/develop-story.md` - Dev usage
- `tasks/apply-qa-fixes.md` - Dev fix usage
- `tasks/qa-review-story.md` - QA usage
- `tasks/architect-review-story.md` - Architect usage
