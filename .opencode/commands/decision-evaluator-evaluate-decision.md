---
description: "Task: Evaluate Decision"
---

When this command is used, execute the following task:

# Task: Evaluate Decision

**Purpose**: Execute a decision rule by loading its YAML definition, evaluating conditions against provided context, and returning a structured result.

**Role**: Decision Evaluator SubAgent

**Input**:

- `decision_type`: Name of the decision file (without .yaml extension)
- `context`: Object containing all required context fields for the decision

**Output**: Structured YAML block with decision result

---

## Execution Steps

### Step 1: Validate Input

Check that all required inputs are provided:

- `decision_type` is not empty
- `context` object is provided
- Decision type is one of the supported types:
  - sm-story-status
  - sm-architect-review-needed
  - sm-test-design-level
  - sm-revision-approval
  - architect-review-result
  - qa-gate-decision
  - qa-post-review-workflow
  - qa-test-design-update
  - qa-escalate-architect
  - dev-self-review-decision
  - dev-block-story
  - dev-escalate-architect

If validation fails, return error:

```yaml
status: error
message: "Invalid input: [specific issue]"
suggestions:
  - "Check decision_type spelling"
  - "Ensure context object is provided"
  - "Use *list-decisions to see available types"
```

### Step 2: Load Decision File (with Session Caching)

**Check Session Cache First:**

- Look in session memory for previously loaded decision file
- If found and timestamp < 5 minutes old: use cached version
- If not found or expired: load from file system

**Load from File:**

```
Decision File Path: .orchestrix-core/data/decisions-{decision_type}.yaml
```

Use the Read tool to load the file.

**Cache the loaded file:**

- Store in session memory with timestamp
- Format: `{decision_type}: {content} [loaded at {timestamp}]`

**Session Cache Status:**
Maintain a running list of cached decisions:

```
Cached Decisions (Session Memory):
- sm-story-status (loaded at 10:30:00, size: 97 lines)
- qa-gate-decision (loaded at 10:31:15, size: 138 lines)
[Cache hit rate: 40%]
```

If file not found or invalid YAML:

```yaml
status: error
message: "Decision file not found or invalid: decisions-{decision_type}.yaml"
file_path: ".orchestrix-core/data/decisions-{decision_type}.yaml"
suggestions:
  - "Check if decision file exists"
  - "Verify YAML syntax is valid"
  - "Use *list-decisions to see available decisions"
```

### Step 3: Parse Decision Rules

Extract the decision rules structure from the YAML:

- `rules`: Array of rule objects
- Each rule has: `condition`, `result`, `reasoning`, `metadata` (optional)

Expected structure:

```yaml
decision:
  name: "..."
  description: "..."

rules:
  - condition: "quality_score >= 8.0 AND complexity_indicators >= 2"
    result: "AwaitingArchReview"
    reasoning: "High complexity requires architect review"

  - condition: "quality_score < 6.0"
    result: "Blocked"
    reasoning: "Quality too low, story needs revision"
```

### Step 4: Evaluate Conditions

**For each rule in order:**

1. **Extract the condition string**

2. **Replace variables with context values:**
   - Example: `"quality_score >= 8.0"` → `"9.0 >= 8.0"`
   - Support operators: `>=`, `<=`, `>`, `<`, `==`, `!=`, `AND`, `OR`, `IN`, `NOT`
   - Support boolean values: `true`, `false`
   - Support enum matching: `"value" == "EXPECTED"`

3. **Evaluate the condition:**
   - Parse as boolean expression
   - Return `true` or `false`

4. **If condition evaluates to true:**
   - This rule is matched!
   - Extract: `result`, `reasoning`, `next_action` (if present), `metadata`
   - STOP evaluation (first match wins)

5. **If no rules match:**
   ```yaml
   status: error
   message: "No rules matched for provided context"
   context_provided: { show context }
   suggestions:
     - "Check if all required context fields are provided"
     - "Verify context values are correct"
     - "Review decision file for applicable rules"
   ```

### Step 5: Return Structured Result

**Success Response:**

```yaml
# Decision Result

status: success
decision_type: { decision_type }
result: { matched_result }
reasoning: |
  Based on {decision_type}.yaml rules:
  - Condition matched: "{condition_string}"
  - Rule: {rule description or index}
  - Evaluation: {brief explanation of why this rule matched}
next_action: { next_action_if_present }
confidence: 0.95
metadata:
  decision_file: "{decision_type}.yaml"
  rule_matched: "Rule #{index}"
  context_used: { list of context fields used }
  timestamp: { current_timestamp }
  cached: { true/false }
```

**Example Output:**

```yaml
# Decision Result

status: success
decision_type: sm-story-status
result: TestDesignComplete
reasoning: |
  Based on sm-story-status.yaml rules:
  - Condition matched: "(architect_review_result == 'NOT_REQUIRED') AND test_design_level == 'Simple'"
  - Rule: Final status determination for no-review + simple-test scenario
  - Evaluation: Story has NOT_REQUIRED architect review and Simple test design level
next_action: handoff_to_dev
confidence: 0.95
metadata:
  decision_file: "sm-story-status.yaml"
  rule_matched: "Rule #3"
  context_used:
    - architect_review_result: NOT_REQUIRED
    - test_design_level: Simple
  timestamp: "2025-11-14T10:30:00Z"
  cached: true
```

---

## Error Handling

### Error Types:

1. **Missing Context Field:**

```yaml
status: error
message: "Required context field missing: {field_name}"
required_fields: [list all required fields for this decision]
provided_fields: [list what was provided]
```

2. **Invalid Context Value:**

```yaml
status: error
message: "Invalid value for {field_name}: expected {type}, got {actual}"
```

3. **No Rules Matched:**

```yaml
status: error
message: "No decision rules matched the provided context"
context: { show full context }
available_rules: [list all rule conditions]
```

4. **File Load Error:**

```yaml
status: error
message: "Failed to load decision file"
file_path: "{path}"
error_details: "{error message}"
```

---

## Notes

- **Strict Evaluation**: Follow rule conditions exactly as written in YAML
- **First Match Wins**: Stop at the first rule that evaluates to true
- **Context Validation**: Ensure all required fields are present before evaluation
- **Cache Management**: Keep session cache to avoid redundant file reads
- **Error Clarity**: Provide actionable error messages with troubleshooting steps

---

## Session State Management

Track decision evaluations in this session:

```
Decision Evaluation History:
1. [10:30:00] sm-story-status (context: {architect_review_result: NOT_REQUIRED, test_design_level: Simple}) → TestDesignComplete
2. [10:31:05] sm-architect-review-needed (context: {quality_score: 9.0, complexity_indicators: 2}) → REQUIRED
3. [10:32:10] qa-gate-decision (context: {review_round: 1, issues_by_severity: {critical: 0, high: 0, medium: 1, low: 2}}) → PASS

Cache Performance:
- Total evaluations: 3
- Cache hits: 1 (33%)
- Avg evaluation time: 1.2s
```
