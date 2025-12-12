# Task: Test Decision Logic

**Purpose**: Test a decision file with various scenarios to ensure all rules are covered and working correctly. Useful for development, debugging, and validation.

**Role**: Decision Evaluator SubAgent

**Input**:
- `decision_type`: Name of the decision to test
- `test_mode`: "interactive" or "comprehensive"

**Output**: Test results with coverage analysis

---

## Execution Steps

### Step 1: Load Decision File

Load the specified decision file from `{root}/data/decisions-{decision_type}.yaml`.

Display decision metadata:
```
Testing Decision: {decision_type}
Description: {description}
Total Rules: {count}
```

### Step 2: Interactive Test Mode

If `test_mode == "interactive"`:

1. **Prompt for Context:**
   ```
   Enter context values (or type 'examples' to see sample contexts):

   Required Fields:
   - field_name: {description}
   - field_name: {description}
   ```

2. **Execute Decision:**
   - Call evaluate-decision with provided context
   - Display result

3. **Ask for Another Test:**
   ```
   Test another scenario? (yes/no/examples)
   ```

### Step 3: Comprehensive Test Mode

If `test_mode == "comprehensive"`:

1. **Generate Test Scenarios:**
   - Create test cases to cover all rules
   - Include boundary conditions
   - Include edge cases

2. **Execute All Scenarios:**
   ```
   Running Comprehensive Tests...

   Scenario 1: High Quality + Low Complexity
   - Context: {quality_score: 9.0, complexity_indicators: 0}
   - Expected: Approved
   - Actual: Approved
   - Status: ✅ PASS

   Scenario 2: High Quality + High Complexity
   - Context: {quality_score: 9.0, complexity_indicators: 3}
   - Expected: AwaitingArchReview
   - Actual: AwaitingArchReview
   - Status: ✅ PASS

   ...
   ```

3. **Coverage Analysis:**
   ```
   Test Coverage:
   - Rules Tested: 8/10 (80%)
   - Rules Not Covered:
     * Rule #4: "quality_score == 7.5 AND complexity_indicators == 1"
     * Rule #7: "security_sensitive == true AND quality_score < 8.0"

   Recommendation: Add test cases for uncovered rules
   ```

### Step 4: Return Test Results

```yaml
# Test Results

decision_type: {decision_type}
test_mode: {mode}
total_scenarios: {count}
passed: {count}
failed: {count}
coverage:
  rules_tested: {count}
  rules_total: {count}
  coverage_percentage: {percentage}%
uncovered_rules:
  - rule_index: {index}
    condition: "{condition}"
    reason: "No test scenario triggers this condition"
failed_scenarios:
  - scenario: "{description}"
    expected: "{result}"
    actual: "{result}"
    reason: "{explanation}"
```

---

## Example Test Scenarios by Decision Type

### sm-story-status:
```yaml
scenarios:
  - name: "Perfect Story - No Review"
    context:
      architect_review_result: "NOT_REQUIRED"
      test_design_level: "Simple"
    expected: "TestDesignComplete"

  - name: "Needs Architect Review"
    context:
      architect_review_result: "REQUIRED"
    expected: "AwaitingArchReview"

  - name: "Review Approved"
    context:
      architect_review_result: "APPROVED"
      test_design_level: "Standard"
    expected: "TestDesignComplete"
```

### qa-gate-decision:
```yaml
scenarios:
  - name: "Clean Pass - No Issues"
    context:
      review_round: 1
      issues_by_severity: {critical: 0, high: 0, medium: 0, low: 0}
    expected: "PASS"

  - name: "Minor Issues - Still Pass"
    context:
      review_round: 1
      issues_by_severity: {critical: 0, high: 0, medium: 1, low: 2}
    expected: "PASS"

  - name: "Critical Issue - Fail"
    context:
      review_round: 1
      issues_by_severity: {critical: 1, high: 0, medium: 0, low: 0}
    expected: "FAIL"
```

---

## Notes

- **Use During Development**: Test new decision files before deploying
- **Regression Testing**: Run comprehensive tests after modifying decision rules
- **Documentation**: Generate examples from test scenarios
