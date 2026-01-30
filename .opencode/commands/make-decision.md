---
description: "make-decision"
---

When this command is used, execute the following task:

# make-decision

Execute structured decision-making using centralized YAML rules.

## Input

```yaml
required:
  decision_type: string # Maps to .orchestrix-core/data/decisions-{decision_type}.yaml
  context: object # Decision-specific context data

optional:
  override_rules: boolean # Default: false
  justification: string # Required if override_rules = true
  metadata: object # Additional context for logging
```

## Process

### Step 1: Validate Input

1. Verify `decision_type` provided and non-empty
2. Verify `context` provided and is valid object
3. Check `decision_type` file exists: `.orchestrix-core/data/decisions-{decision_type}.yaml`
4. Load schema from `.orchestrix-core/data/decisions-{decision_type}.yaml`
5. Validate `context` contains required fields per schema
6. Validate field types and value ranges

**On Error**:

- Missing decision_type → `{error: "decision_type is required"}`
- Missing context → `{error: "context is required"}`
- Unknown decision_type → `{error: "Unknown decision type: {decision_type}"}`
- Missing context fields → `{error: "Missing required context fields: {fields}"}`
- Validation failure → Return specific validation error

**Success**: All inputs valid → Proceed to Step 2

### Step 2: Load Decision Rules (On-Demand Only)

**CRITICAL**: Load ONLY the required file, NOT all files in directory.

1. **Construct path**: `.orchestrix-core/data/decisions-{decision_type}.yaml`
   - Example: `qa-gate-decision` → `.orchestrix-core/data/decisions-qa-gate-decision.yaml`

2. **Read ONLY this file**:
   - Use file system API to read target file
   - Do NOT scan `.orchestrix-core/data/` for all decision files
   - Do NOT load other decision files

3. **Parse YAML** and extract:
   - Decision criteria (conditions, thresholds)
   - Decision matrix (condition-to-outcome mapping)
   - Default outcomes (fallback)
   - Required permissions (agent authority)

4. **Validate structure**:
   - Check required top-level fields exist
   - Verify decision matrix format correct

5. **Cache** (session-level only):
   - Cache ONLY current decision_type rules
   - Do NOT cache other decision types
   - Clear cache on session end

**Token Optimization**:

```
Old approach: Load all decision files → ~5000-8000 tokens
New approach: Load single file only → ~800-1500 tokens
Savings: 60-80%
```

**On Error**:

- File not found → `{error: "Decision rules not found for type: {decision_type}"}`
- Malformed YAML → `{error: "Invalid decision rules format: {parse_error}"}`
- Incomplete structure → `{error: "Incomplete decision rules: missing {section}"}`

**Success**: Target file loaded and validated → Proceed to Step 3

### Step 3: Evaluate Criteria

1. Extract evaluation criteria from loaded rules
2. For each criterion in decision matrix:
   - Extract values from context
   - Apply operators: ==, !=, <, >, <=, >=, in, not_in
   - Evaluate boolean conditions: AND, OR, NOT
   - Calculate scores/thresholds as needed
3. Match criteria against decision matrix
4. Identify matching outcome
5. If multiple matches: apply priority rules (first match, highest priority)
6. If no match: use default outcome
7. Collect reasoning (which criteria matched, why)

**On Error**:

- Missing context values → Use defaults or return error
- Evaluation logic failure → Log error, use default
- No match and no default → `{error: "Unable to determine decision outcome"}`

**Success**: Outcome determined with reasoning → Proceed to Step 4

### Step 4: Return Result

Construct and return:

```yaml
result: string # Decision outcome (REQUIRED)
reasoning: string # Why this decision was made (REQUIRED)
next_action: string # Recommended next step (REQUIRED)
next_status: string|null # Next status to set (OPTIONAL, nullable)
metadata: object # Additional context (OPTIONAL)
```

Add timestamp and log decision (if configured).

## Output Format

### Success

```yaml
result: "Approved"
reasoning: "Quality score 8.5 exceeds threshold (8.0), complexity low (1 indicator)"
next_action: "Dev can begin implementation with 'develop-story {story-id}'"
next_status: "Approved"
metadata:
  decision_type: "sm-story-status"
  evaluated_criteria: ["quality_score", "complexity_indicators"]
  quality_score: 8.5
  complexity_indicators: 1
  timestamp: "2024-01-15T14:30:22Z"
  agent: "SM"
```

### Error

```yaml
error: "Input validation failed"
details: "Missing required context field: quality_score"
result: null
reasoning: "Cannot proceed without required input"
next_action: "Provide complete context and retry"
```

## Available Decision Types

Located in `.orchestrix-core/data/` (files with `decisions-` prefix):

- `sm-story-status` - Final story status after Architect review
- `sm-architect-review-needed` - Check if Architect review required
- `sm-test-design-level` - Determine test level (Simple/Standard/Comprehensive)
- `dev-self-review-decision` - Validate Dev implementation quality
- `architect-review-result` - Architect review outcome
- `qa-gate-decision` - QA gate pass/fail
- `qa-post-review-workflow` - Post-QA review action
- Others as defined in directory

## Error Types

### Input Validation Error

```yaml
error: "Input validation failed"
details: "Missing required context field: quality_score"
result: null
reasoning: "Cannot proceed without required input"
next_action: "Provide complete context and retry"
```

### Decision Rules Not Found

```yaml
error: "Decision rules not found"
details: "No rules defined for decision type: {decision_type}"
result: null
reasoning: "Unknown decision type"
next_action: "Verify decision type or create decision rules"
```

### Evaluation Failure

```yaml
error: "Decision evaluation failed"
details: "Unable to evaluate criteria: {error_details}"
result: "default_outcome"
reasoning: "Evaluation failed, using default outcome"
next_action: "Review context and decision rules for compatibility"
```

### Permission Denied

```yaml
error: "Permission denied"
details: "Agent {agent_name} not authorized for decision type: {decision_type}"
result: null
reasoning: "Insufficient permissions"
next_action: "Request decision from authorized agent"
```

## Integration

**Called By**:

- SM agent (story creation quality assessment)
- Dev agent (blocking issues)
- Architect agent (technical review)
- QA agent (test design assessment)
- Any agent requiring structured decisions

**Calls To**:

- Decision rules: `.orchestrix-core/data/decisions-{decision_type}.yaml`
- Agent config: `.orchestrix-core/agents/{agent-name}.yaml`
- Decision audit log: `.orchestrix-core/logs/decisions/` (if configured)

**Data Dependencies**:

- Decision rules must exist as `.orchestrix-core/data/decisions-{decision_type}.yaml`
- Agent permissions in agent YAML files
- Context data must match decision type schema

## Notes

- Reusable across multiple decision types
- Decision rules externalized to YAML for easy modification
- All decisions auditable via metadata/logging
- Reasoning field supports transparency and debugging
- On-demand loading minimizes token consumption
- Error responses use consistent format
