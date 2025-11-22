# Make Decision Task

## Purpose

To provide a structured decision-making framework for agents to evaluate situations, apply decision rules, and determine appropriate actions based on context and predefined criteria. This task enables consistent, auditable decision-making across the Orchestrix system.

## Quick Reference

**Calling Pattern**:
```yaml
decision_input:
  decision_type: "sm-story-status"
  context:
    architect_review_result: "APPROVED"
    test_design_level: "Standard"
```

**Standardized Output Format** (all decision files use this structure):
```yaml
result: <decision outcome>          # Main decision result (REQUIRED)
reasoning: <explanation>            # Why this decision was made (REQUIRED)
next_status: <story status or null> # Next status to set (OPTIONAL, nullable)
next_action: <recommended action>   # Recommended next step (REQUIRED)
metadata: <additional context>      # Extra information (OPTIONAL)
```

**Available Decision Types** (in `{root}/data/decisions/`):
- `sm-story-status` - Determine final story status after Architect review
- `sm-architect-review-needed` - Check if Architect review is required
- `sm-test-design-level` - Determine test design level (Simple/Standard/Comprehensive)
- `dev-self-review-decision` - Validate Dev implementation quality gates
- `architect-review-result` - Architect review outcome
- `qa-gate-decision` - QA gate pass/fail decision
- `qa-post-review-workflow` - Post-QA review workflow action
- Other decision types available in `{root}/data/decisions/`

## Agent Permission Check

**CRITICAL**: Before proceeding with decision-making, verify agent has the required permissions:

1. **Verify Agent Identity:**
   - Confirm the calling agent's role and permissions
   - Reference `{root}/agents/{agent-name}.yaml` for agent configuration

2. **Check Decision Authority:**
   - Verify agent has authority to make the requested decision type
   - Check `decision_authority` field in agent configuration
   - Validate decision scope matches agent's responsibilities

3. **If permission check fails:**
   - Log error: "Agent does not have authority to make this decision type"
   - Return error response with appropriate guidance
   - HALT decision process
   - Do NOT proceed with decision-making

## Input Parameters

### Required Inputs

- **decision_type** (string): The type of decision to be made
  - Examples: `story_status_transition`, `escalation_required`, `quality_gate_pass`, `architecture_review_needed`, `test_design_level`
  - Must match a defined decision type in `{root}/data/decisions/`

- **context** (object): Contextual information for the decision
  - Structure varies by decision_type
  - Must include all required fields for the specified decision type
  - Examples:
    - For `story_status_transition`: `{current_status, quality_score, complexity_indicators, agent_role}`
    - For `escalation_required`: `{issue_severity, attempts_made, blocking_status}`
    - For `quality_gate_pass`: `{test_results, coverage_percentage, linting_status}`

### Optional Inputs

- **override_rules** (boolean): Flag to indicate if manual override is requested (default: false)
- **justification** (string): Required if override_rules is true
- **metadata** (object): Additional context for logging and audit purposes

## Decision Process Flow

### Step 1: Validate Input

**Objective:** Ensure all required inputs are present and valid

**Actions:**
1. Check that `decision_type` is provided and not empty
2. Check that `context` is provided and is a valid object
3. Validate `decision_type` exists in decision rules registry
4. Load decision type schema from `{root}/data/decisions/{decision_type}.yaml`
5. Validate `context` contains all required fields per schema
6. Validate field types and value ranges per schema

**Error Handling:**
- If `decision_type` is missing: Return error `{error: "decision_type is required"}`
- If `context` is missing: Return error `{error: "context is required"}`
- If `decision_type` not found: Return error `{error: "Unknown decision type: {decision_type}"}`
- If required context fields missing: Return error `{error: "Missing required context fields: {field_list}"}`
- If validation fails: Return error with specific validation failure details

**Success Criteria:**
- All required inputs present
- decision_type exists in registry
- context matches schema requirements
- Proceed to Step 2

### Step 2: Load Decision Rules

**Objective:** Load the appropriate decision rules for the specified decision type

**Actions:**
1. Read decision rules file: `{root}/data/decisions/{decision_type}.yaml`
2. Parse YAML structure to extract:
   - Decision criteria (conditions and thresholds)
   - Decision matrix (mapping conditions to outcomes)
   - Default outcomes (fallback decisions)
   - Required permissions (agent authority requirements)
3. Validate rules file structure is complete
4. Cache rules for current decision process

**Error Handling:**
- If rules file not found: Return error `{error: "Decision rules not found for type: {decision_type}"}`
- If rules file malformed: Return error `{error: "Invalid decision rules format: {parse_error}"}`
- If required rules sections missing: Return error `{error: "Incomplete decision rules: missing {section}"}`

**Success Criteria:**
- Rules file loaded successfully
- Rules structure validated
- Decision criteria extracted
- Proceed to Step 3

### Step 3: Evaluate Decision Criteria

**Objective:** Apply decision rules to the provided context and determine the outcome

**Actions:**
1. Extract evaluation criteria from loaded rules
2. For each criterion in the decision matrix:
   - Extract relevant values from context
   - Apply comparison operators (==, !=, <, >, <=, >=, in, not_in)
   - Evaluate boolean conditions (AND, OR, NOT)
   - Calculate scores or thresholds as needed
3. Match evaluated criteria against decision matrix
4. Identify matching decision outcome
5. If multiple matches, apply priority rules (first match, highest priority, etc.)
6. If no matches, use default outcome from rules
7. Collect reasoning for the decision (which criteria matched, why)

**Evaluation Logic Examples:**

**Example 1: Story Status Transition**
```yaml
# From story-status-transitions.yaml
criteria:
  - condition: quality_score < 6.0
    outcome: Blocked
    reasoning: "Quality score below minimum threshold"
  
  - condition: quality_score >= 6.0 AND quality_score < 8.0
    outcome: AwaitingArchReview
    reasoning: "Medium quality requires architect review"
  
  - condition: quality_score >= 8.0 AND complexity_indicators >= 2
    outcome: AwaitingArchReview
    reasoning: "High complexity requires architect review"
  
  - condition: quality_score >= 8.0 AND complexity_indicators < 2
    outcome: Approved
    reasoning: "High quality and low complexity"
```

**Example 2: Escalation Required**
```yaml
criteria:
  - condition: issue_severity == "critical" OR blocking_status == true
    outcome: escalate_immediately
    reasoning: "Critical issue or blocking status requires immediate escalation"
  
  - condition: attempts_made >= 3 AND issue_severity == "high"
    outcome: escalate_to_architect
    reasoning: "Multiple failed attempts on high severity issue"
  
  - condition: attempts_made < 3
    outcome: retry_with_guidance
    reasoning: "Fewer than 3 attempts, provide guidance and retry"
```

**Error Handling:**
- If context values missing for evaluation: Use default values or return error
- If evaluation logic fails: Log error, use default outcome
- If no matching criteria and no default: Return error `{error: "Unable to determine decision outcome"}`

**Success Criteria:**
- All criteria evaluated successfully
- Decision outcome determined
- Reasoning collected
- Proceed to Step 4

### Step 4: Return Decision Result

**Objective:** Format and return the decision result with complete information

**Actions:**
1. Construct result object with:
   - **result** (string): The decision outcome (e.g., "Approved", "Blocked", "escalate_immediately")
   - **reasoning** (string): Human-readable explanation of why this decision was made
   - **next_action** (string): Recommended next step or action to take
   - **confidence** (number): Confidence level in the decision (0.0-1.0)
   - **metadata** (object): Additional information for audit and logging
2. Add timestamp to result
3. Log decision to decision audit log (if configured)
4. Return result object to caller

**Result Format:**
```json
{
  "result": "AwaitingArchReview",
  "reasoning": "Quality score of 7.5 is in medium range (6.0-7.9), requiring architect review per decision matrix",
  "next_action": "Architect should execute 'review-story {story-id}' to validate technical accuracy",
  "confidence": 0.95,
  "metadata": {
    "decision_type": "story_status_transition",
    "evaluated_criteria": ["quality_score", "complexity_indicators"],
    "quality_score": 7.5,
    "complexity_indicators": 1,
    "timestamp": "2024-01-15T14:30:22Z",
    "agent": "SM"
  }
}
```

**Error Handling:**
- If result formatting fails: Log error, return minimal result with error flag
- Ensure all required result fields are present

**Success Criteria:**
- Result object constructed successfully
- All required fields present
- Decision logged (if applicable)
- Result returned to caller

## Error Handling Logic

### Input Validation Errors

**Error Type:** Missing or invalid inputs

**Detection:**
- Required parameters not provided
- Invalid parameter types
- Context missing required fields

**Response:**
```json
{
  "error": "Input validation failed",
  "details": "Missing required context field: quality_score",
  "result": null,
  "reasoning": "Cannot proceed without required input",
  "next_action": "Provide complete context and retry"
}
```

### Decision Rules Not Found

**Error Type:** Decision type not supported

**Detection:**
- decision_type not in registry
- Rules file missing or inaccessible

**Response:**
```json
{
  "error": "Decision rules not found",
  "details": "No rules defined for decision type: {decision_type}",
  "result": null,
  "reasoning": "Unknown decision type",
  "next_action": "Verify decision type or create decision rules"
}
```

### Evaluation Failure

**Error Type:** Unable to evaluate criteria

**Detection:**
- Context values incompatible with criteria
- Evaluation logic error
- No matching criteria and no default

**Response:**
```json
{
  "error": "Decision evaluation failed",
  "details": "Unable to evaluate criteria: {error_details}",
  "result": "default_outcome",
  "reasoning": "Evaluation failed, using default outcome",
  "next_action": "Review context and decision rules for compatibility"
}
```

### Permission Denied

**Error Type:** Agent lacks authority

**Detection:**
- Agent not authorized for decision type
- Decision scope exceeds agent permissions

**Response:**
```json
{
  "error": "Permission denied",
  "details": "Agent {agent_name} does not have authority for decision type: {decision_type}",
  "result": null,
  "reasoning": "Insufficient permissions",
  "next_action": "Request decision from authorized agent"
}
```

## Output Format

### Success Response

```json
{
  "result": "string - decision outcome",
  "reasoning": "string - explanation of decision",
  "next_action": "string - recommended next step",
  "confidence": "number - confidence level (0.0-1.0)",
  "metadata": {
    "decision_type": "string",
    "evaluated_criteria": ["array of criteria evaluated"],
    "timestamp": "ISO 8601 timestamp",
    "agent": "string - agent making decision"
  }
}
```

### Error Response

```json
{
  "error": "string - error type",
  "details": "string - detailed error message",
  "result": "string or null - default outcome if applicable",
  "reasoning": "string - explanation of error",
  "next_action": "string - how to resolve error"
}
```

## Usage Examples

### Example 1: Story Status Transition Decision

**Input:**
```json
{
  "decision_type": "story_status_transition",
  "context": {
    "current_status": "new",
    "quality_score": 8.5,
    "complexity_indicators": 1,
    "technical_extraction_rate": 0.92,
    "agent_role": "SM"
  }
}
```

**Output:**
```json
{
  "result": "Approved",
  "reasoning": "Quality score of 8.5 exceeds threshold (8.0) and complexity is low (1 indicator), meeting approval criteria",
  "next_action": "Dev can begin implementation with 'develop-story {story-id}'",
  "confidence": 0.98,
  "metadata": {
    "decision_type": "story_status_transition",
    "evaluated_criteria": ["quality_score", "complexity_indicators"],
    "quality_score": 8.5,
    "complexity_indicators": 1,
    "timestamp": "2024-01-15T14:30:22Z",
    "agent": "SM"
  }
}
```

### Example 2: Escalation Decision

**Input:**
```json
{
  "decision_type": "escalation_required",
  "context": {
    "issue_severity": "high",
    "attempts_made": 3,
    "blocking_status": true,
    "issue_type": "architecture_conflict"
  }
}
```

**Output:**
```json
{
  "result": "escalate_to_architect",
  "reasoning": "Blocking issue with 3 failed attempts and high severity requires architect escalation",
  "next_action": "Architect should execute 'review-escalated-issue {issue-id}'",
  "confidence": 1.0,
  "metadata": {
    "decision_type": "escalation_required",
    "evaluated_criteria": ["issue_severity", "attempts_made", "blocking_status"],
    "issue_severity": "high",
    "attempts_made": 3,
    "blocking_status": true,
    "timestamp": "2024-01-15T14:35:10Z",
    "agent": "Dev"
  }
}
```

### Example 3: Test Design Level Decision

**Input:**
```json
{
  "decision_type": "test_design_level",
  "context": {
    "complexity_indicators": 0,
    "quality_score": 9.2,
    "security_sensitive": false,
    "story_type": "frontend_ui"
  }
}
```

**Output:**
```json
{
  "result": "Simple",
  "reasoning": "Zero complexity indicators, high quality score (9.2), and no security sensitivity indicate simple test design is sufficient",
  "next_action": "Skip test design phase, proceed directly to development",
  "confidence": 0.95,
  "metadata": {
    "decision_type": "test_design_level",
    "evaluated_criteria": ["complexity_indicators", "quality_score", "security_sensitive"],
    "complexity_indicators": 0,
    "quality_score": 9.2,
    "security_sensitive": false,
    "timestamp": "2024-01-15T14:40:55Z",
    "agent": "SM"
  }
}
```

## Integration Points

### Called By
- Story Manager (SM) agent during story creation quality assessment
- Developer (Dev) agent when encountering blocking issues
- Architect agent during technical review
- QA agent during test design assessment
- Any agent requiring structured decision-making

### Calls To
- Decision rules registry: `{root}/data/decisions/{decision_type}.yaml`
- Agent configuration: `{root}/agents/{agent-name}.yaml`
- Decision audit log: `{root}/logs/decisions/` (if configured)

### Data Dependencies
- Decision rules must be defined in `{root}/data/decisions/`
- Agent permissions must be configured in agent YAML files
- Context data must match decision type schema

## ## Validation Checklist

Before completing this task, verify:

- [ ] Input validation implemented for all required parameters
- [ ] Decision rules loading handles missing or malformed files
- [ ] Evaluation logic correctly applies all decision criteria
- [ ] Error handling covers all failure scenarios
- [ ] Output format matches specification
- [ ] Permission checks enforce agent authority
- [ ] Decision reasoning is clear and actionable
- [ ] next_action provides specific guidance
- [ ] Metadata includes all relevant context
- [ ] Audit logging implemented (if required)
- [ ] All examples tested and verified
- [ ] Integration points documented

## Notes

- This task is designed to be reusable across multiple decision types
- Decision rules are externalized to YAML files for easy modification
- All decisions are auditable through metadata and logging
- Confidence scores help identify uncertain decisions
- next_action field provides clear guidance for workflow continuation
- Error responses maintain consistent format for easy handling
- Permission checks ensure proper agent authority
- Reasoning field supports transparency and debugging

## References

- Requirements: 6.1 (Decision-making framework), 6.3 (Error handling)
- Design: Decision-making system architecture
- Related Tasks: `execute-checklist.md`, `qa-review-story.md`, `architect-review-story.md`, `develop-story.md`
- Decision Rules: `{root}/data/decisions/README.md`