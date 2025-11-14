# Task: Batch Evaluate Decisions

**Purpose**: Execute multiple decisions in sequence, useful for workflows that require chained decision logic (e.g., SM creating a story requires 3 sequential decisions).

**Role**: Decision Evaluator SubAgent

**Input**:
- `decisions`: Array of decision requests, each containing `decision_type` and `context`

**Output**: Array of decision results in order

---

## Execution Steps

### Step 1: Validate Batch Input

Check that:
- `decisions` array is provided and not empty
- Each item in array has `decision_type` and `context`
- Maximum batch size: 10 decisions (to prevent timeout)

If validation fails:
```yaml
status: error
message: "Invalid batch input: [specific issue]"
batch_size: {actual size}
max_batch_size: 10
```

### Step 2: Execute Decisions Sequentially

For each decision in the array:

1. **Call evaluate-decision task:**
   - Use the same logic as evaluate-decision.md
   - Pass `decision_type` and `context`

2. **Collect result:**
   - Store in results array
   - If error occurs, store error object (don't halt batch)

3. **Update progress:**
   ```
   Batch Progress: [{current}/{total}] {decision_type} → {result}
   ```

### Step 3: Return Batch Results

**Success Response:**
```yaml
# Batch Decision Results

status: success
batch_size: {total}
successful: {count_success}
failed: {count_failed}
results:
  - decision_type: sm-story-status
    result: TestDesignComplete
    status: success
    reasoning: "..."

  - decision_type: sm-architect-review-needed
    result: NOT_REQUIRED
    status: success
    reasoning: "..."

  - decision_type: qa-gate-decision
    status: error
    message: "Missing required context field: review_round"

metadata:
  total_evaluations: {count}
  cache_hits: {count}
  execution_time: {time_ms}ms
  timestamp: {timestamp}
```

---

## Common Use Cases

### SM Story Creation (3 decisions):
```yaml
decisions:
  - decision_type: sm-architect-review-needed
    context:
      quality_score: 9.0
      complexity_indicators: 2

  - decision_type: sm-test-design-level
    context:
      complexity_indicators: 2
      quality_score: 9.0
      security_sensitive: false

  - decision_type: sm-story-status
    context:
      architect_review_result: "{{result from decision 1}}"
      test_design_level: "{{result from decision 2}}"
```

**Note**: For chained decisions where result of one feeds into another, use sequential *evaluate-decision calls instead of batch.

### QA Review Workflow (2 decisions):
```yaml
decisions:
  - decision_type: qa-gate-decision
    context:
      review_round: 1
      issues_by_severity:
        critical: 0
        high: 0
        medium: 1
        low: 2

  - decision_type: qa-post-review-workflow
    context:
      gate_result: "{{result from decision 1}}"
      final_status: "Done"
      review_round: 1
```

---

## Error Handling

- **Partial Success**: If some decisions succeed and others fail, return partial results
- **Complete Failure**: If all decisions fail, return error status with details
- **Timeout**: If batch exceeds 60 seconds, return results collected so far + timeout warning

---

## Performance Optimization

- **Session Cache**: Shared across all decisions in batch
- **Parallel Processing**: NOT supported (decisions must be sequential for dependency reasons)
- **Progress Tracking**: Real-time updates for long-running batches
