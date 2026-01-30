---
description: "Utility: Call Decision Evaluator SubAgent"
---

When this command is used, execute the following task:

# Utility: Call Decision Evaluator SubAgent

**Purpose**: Standardized interface for calling the Decision Evaluator SubAgent from any agent task. Provides SubAgent invocation with automatic fallback to inline decision execution.

**Usage**: Include this utility in any task that needs to execute a decision.

---

## Prerequisites

Before calling this utility, ensure you have:

1. **Decision Type**: The name of the decision file (e.g., "sm-story-status")
2. **Context Object**: All required context fields for the decision

---

## Invocation Pattern

### Step 1: Prepare Decision Request

Define the decision request with all required parameters:

```yaml
Decision Request:
  decision_type: { decision_type_name }
  context:
    field1: { value1 }
    field2: { value2 }
    # ... all required context fields
```

**Example for SM Story Status:**

```yaml
Decision Request:
  decision_type: sm-story-status
  context:
    architect_review_result: NOT_REQUIRED
    test_design_level: Simple
```

### Step 2: Call Decision Evaluator SubAgent

**Invoke the SubAgent using Claude Code's @ mention:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: {decision_type}
Context:
  field1: {value1}
  field2: {value2}
```

**Full Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-story-status
Context:
  architect_review_result: NOT_REQUIRED
  test_design_level: Simple

Please return the structured result.
```

### Step 3: Wait for SubAgent Response

The SubAgent will return a structured YAML response:

**Expected Response Format:**

```yaml
# Decision Result

status: success
decision_type: { type }
result: { matched_result }
reasoning: |
  {explanation of why this result was chosen}
next_action: { recommended_next_action }
confidence: { 0.0-1.0 }
metadata:
  decision_file: "{type}.yaml"
  rule_matched: "Rule #{index}"
  timestamp: "{iso_timestamp}"
```

### Step 4: Extract Result

Extract the `result` field from the SubAgent response:

```
Decision Result: {result}
Reasoning: {reasoning}
Next Action: {next_action}
```

**Use the result** to continue your workflow.

---

## Fallback Mechanism

### When to Use Fallback

Use fallback if:

- SubAgent does not respond within 30 seconds
- SubAgent returns an error status
- SubAgent is unavailable
- For any reason the SubAgent invocation fails

### Fallback Execution

**Execute make-decision.md inline:**

```markdown
## Fallback: Inline Decision Execution

!include tasks/make-decision.md

Input:
decision_type: {decision_type}
context: {context_object}

[Execute make-decision.md directly]
```

**Log the fallback:**

```
⚠️ Decision Evaluator SubAgent unavailable, using inline fallback
Decision Type: {decision_type}
Fallback Method: make-decision.md
```

**Extract result** from make-decision.md execution and continue.

---

## Complete Example: SM Story Status Decision

### Primary Path (SubAgent):

```markdown
## Step 5: Determine Story Status

### 5.1: Prepare Decision Request

Decision Type: sm-story-status
Context:
architect_review_result: {{architect_review_result from step 4}}
test_design_level: {{test_design_level from step 4}}

### 5.2: Call Decision Evaluator

@decision-evaluator Please execute decision evaluation:

Decision Type: sm-story-status
Context:
architect_review_result: NOT_REQUIRED
test_design_level: Simple

### 5.3: Extract Result

[Wait for SubAgent response]

Decision Result: TestDesignComplete
Reasoning: High quality story with no complexity, no architect review needed
Next Action: handoff_to_dev

### 5.4: Continue Workflow

Story Status: TestDesignComplete
[Continue to next step...]
```

### Fallback Path (if SubAgent fails):

```markdown
## Step 5: Determine Story Status (Fallback)

⚠️ SubAgent unavailable, using inline fallback

!include tasks/make-decision.md

Input:
decision_type: sm-story-status
context:
architect_review_result: NOT_REQUIRED
test_design_level: Simple

[Execute make-decision.md]

Decision Result: TestDesignComplete
[Continue workflow...]
```

---

## Decision Types Reference

### Quick Reference Table

| Decision Type              | Required Context Fields                                                                                                                       | Agent     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| sm-story-status            | architect_review_result, test_design_level                                                                                                    | SM        |
| sm-architect-review-needed | quality_score, complexity_indicators                                                                                                          | SM        |
| sm-test-design-level       | complexity_indicators, quality_score, security_sensitive                                                                                      | SM        |
| architect-review-result    | architecture_score, critical_issues, review_round                                                                                             | Architect |
| qa-gate-decision           | review_round, issues_by_severity                                                                                                              | QA        |
| qa-post-review-workflow    | gate_result, final_status, review_round, issues_by_severity                                                                                   | QA        |
| dev-self-review-decision   | implementation_gate_score, architecture_compliance, api_contract_compliance, test_integrity, dod_score, critical_issues, implementation_round | Dev       |

For detailed field descriptions, use `@decision-evaluator *list-decisions`

---

## Error Handling

### SubAgent Returns Error

If SubAgent returns `status: error`:

```yaml
status: error
message: "No rules matched for provided context"
context_provided: { ... }
```

**Action**:

1. Review the error message
2. Check if all required context fields are provided
3. Verify context values are correct
4. If error persists, use fallback

### SubAgent Timeout

If SubAgent does not respond within 30 seconds:

**Action**:

1. Log timeout: "SubAgent timeout after 30s"
2. Automatically switch to fallback
3. Continue workflow without interruption

### Fallback Also Fails

If both SubAgent AND fallback fail:

**Action**:

1. HALT workflow
2. Report critical error to user
3. Request manual intervention
4. Log detailed error information for debugging

---

## Performance Monitoring

Track SubAgent usage for monitoring:

```
SubAgent Call Statistics (Session):
- Total Calls: 15
- Successful: 14 (93%)
- Failed: 1 (7%)
- Fallback Used: 1
- Avg Response Time: 2.3s
- Cache Hit Rate: 40%
```

---

## Best Practices

1. **Always Validate Context**: Ensure all required fields are present before calling
2. **Use Fallback**: Never rely solely on SubAgent - always have fallback ready
3. **Log Calls**: Track SubAgent calls for monitoring and debugging
4. **Handle Errors Gracefully**: SubAgent errors should not halt workflows
5. **Cache Awareness**: Multiple calls to same decision type benefit from SubAgent's session cache

---

## Implementation Notes for Task Authors

### When to Use This Utility

Use this utility in tasks that need to execute decisions:

- SM: create-next-story.md, revise-story-from-architect-feedback.md
- Architect: architect-review-story.md
- Dev: dev-self-review.md
- QA: qa-review-story.md

### How to Include

Add to your task file:

```markdown
## Step X: Make Decision

!include tasks/util-call-decision-evaluator.md

Decision Type: {your_decision_type}
Context:
{your_context_fields}

[Follow the invocation pattern above]
```

### Integration Pattern

```markdown
## Step X: Execute Decision (with SubAgent)

1. Prepare context values from previous steps
2. Follow call-decision-evaluator.md invocation pattern
3. Extract result from SubAgent response
4. Use result in next step
5. If SubAgent fails, automatically use fallback (make-decision.md)
```

---

## Testing

To test this utility:

1. Create a test task that calls a decision
2. Verify SubAgent responds correctly
3. Simulate SubAgent failure (disable it)
4. Verify fallback works correctly
5. Compare results from SubAgent vs fallback (should be identical)
