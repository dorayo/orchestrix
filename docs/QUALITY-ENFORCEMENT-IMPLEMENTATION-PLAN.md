# Quality Enforcement Implementation Plan

> **Purpose**: Close the gap between Orchestrix's quality _design_ and quality _execution_.
> This document contains exact, unambiguous instructions for an LLM to implement each change.
> All changes are backward-compatible and can be implemented incrementally.

**Problem Statement**: After Orchestrix-orchestrated development completes, the delivered code consistently requires manual human testing to discover bugs. The root cause is that the current workflow _validates_ quality rather than _executing_ quality verification. QA trusts Dev's evidence instead of independently running tests, E2E tests are ad-hoc and non-reusable, and there is no cross-Story regression or integration testing.

**Goal**: Make the Orchestrix development output production-ready — bugs that remain should only be about ambiguous feature specifications, not implementation defects.

---

## Table of Contents

1. [P0: QA Independent Test Execution](#p0-qa-independent-test-execution)
2. [P1: Persistent E2E Test Suite with Regression](#p1-persistent-e2e-test-suite-with-regression)
3. [P2: Epic-Level Integration Verification](#p2-epic-level-integration-verification)
4. [P3: AC Quality Enforcement in Story Creation](#p3-ac-quality-enforcement-in-story-creation)
5. [P4: Test Design Generates Executable Test Skeletons](#p4-test-design-generates-executable-test-skeletons)
6. [P5: Post-Epic Smoke Test](#p5-post-epic-smoke-test)
7. [Implementation Order and Dependencies](#implementation-order-and-dependencies)

---

## P0: QA Independent Test Execution

**Impact**: HIGH | **Effort**: LOW | **Files Modified**: 1

### Rationale

Current `qa-review-story.md` Step 4 explicitly says:

```
Verify Dev has executed automated tests successfully. Do NOT re-run tests.
```

This means QA only checks Dev's _claim_ that tests passed. If Dev's code changed after the last test run, or tests have weak assertions, QA will not catch it.

### Change: Modify `orchestrix-core/tasks/qa-review-story.md`

**Replace Step 4 entirely** (lines 336-388 in current file).

Find this exact text block:

```markdown
## Step 4: Automated Test Evidence Verification

**Purpose**: Verify Dev has executed automated tests successfully. Do NOT re-run tests.

**Rationale**: Dev has already run unit/integration tests. QA verifies evidence exists rather than duplicating execution.
```

Replace with:

````markdown
## Step 4: Independent Automated Test Execution

**Purpose**: Execute the project's automated test suite independently to verify all tests pass. QA runs tests directly rather than relying on Dev's evidence.

**Rationale**: Independent test execution catches cases where code changed after Dev's last test run, tests with weak assertions that Dev self-review missed, or environment-specific failures. This is the single highest-impact quality gate.

### 4.1 Detect Test Command

Read `orchestrix/core-config.yaml` for `project.testCommand`.

If not configured, auto-detect from project:

| Detection Method                              | Test Command                              |
| --------------------------------------------- | ----------------------------------------- |
| `package.json` has `scripts.test`             | `npm test`                                |
| `package.json` has `scripts.test` with vitest | `npx vitest run`                          |
| `deno.json` exists                            | `deno test -A`                            |
| `Cargo.toml` exists                           | `cargo test`                              |
| `go.mod` exists                               | `go test ./...`                           |
| `pyproject.toml` or `setup.py`                | `pytest`                                  |
| None detected                                 | Record as FAIL: "No test runner detected" |

**Store**:

```yaml
test_command: '{detected command}'
test_runner_type: 'npm' | 'deno' | 'cargo' | 'go' | 'pytest' | 'unknown'
```
````

### 4.2 Execute Test Suite

Run the detected test command via Bash tool:

```bash
{test_command} 2>&1
```

**Timeout**: 300 seconds (5 minutes). If exceeded, record as FAIL with reason "Test execution timed out after 300s".

**Capture**:

- Exit code (0 = pass, non-zero = fail)
- Full stdout/stderr output
- Parse test count, pass count, fail count from output

### 4.3 Parse Test Results

Extract from test runner output:

```yaml
automated_tests:
  execution_method: "independent_execution"
  test_command: "{command used}"
  exit_code: { 0 or non-zero }
  passed: { true if exit_code == 0 }
  total: { parsed from output }
  passed_count: { parsed from output }
  failed_count: { parsed from output }
  skipped_count: { parsed from output }
  pass_rate: { percentage }
  execution_time_seconds: { duration }
  raw_output_summary: "{first 500 chars of output if failed}"
```

**Parsing patterns by runner**:

| Runner      | Pass Pattern                | Fail Pattern                    |
| ----------- | --------------------------- | ------------------------------- |
| vitest/jest | `Tests: X passed`           | `Tests: X failed`               |
| deno        | `ok \| X passed`            | `FAILED \| X failed`            |
| cargo       | `test result: ok. X passed` | `test result: FAILED. X failed` |
| go          | `ok` (per package)          | `FAIL`                          |
| pytest      | `X passed`                  | `X failed`                      |

If output cannot be parsed, use exit code as sole indicator: 0 = PASS, non-zero = FAIL.

### 4.4 Cross-Reference with Dev Evidence (Optional Integrity Check)

After independent execution, compare with Dev's claimed results:

| QA Result | Dev Claim   | Action                                                                                                                                       |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PASS      | PASS        | Consistent - no issue                                                                                                                        |
| PASS      | No evidence | Record LOW issue: "Dev Log missing test evidence"                                                                                            |
| FAIL      | PASS        | Record CRITICAL issue: "Tests fail independently but Dev claimed PASS - possible code change after Dev's test run or environment difference" |
| FAIL      | FAIL        | Dev was honest - continue with FAIL                                                                                                          |
| FAIL      | No evidence | Record HIGH issue: "Tests fail and no Dev evidence found"                                                                                    |

### 4.5 Evidence Validation Decision

| Condition                               | Result | Action                                                                            |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Independent tests PASS (exit_code == 0) | PASS   | Continue to Step 4.5 (checkbox verification)                                      |
| Independent tests FAIL                  | FAIL   | Record HIGH severity issue with failed test names, continue to Step 4.5           |
| No test runner found                    | FAIL   | Record HIGH severity issue: "No automated test suite found", continue to Step 4.5 |
| Test execution timeout                  | FAIL   | Record HIGH severity issue: "Test execution timed out", continue to Step 4.5      |

**Store result for Step 7**:

```yaml
automated_tests:
  verification_method: "independent_execution"
  test_command: "{command}"
  exit_code: { code }
  passed: true | false
  pass_rate: { percentage }
  execution_time_seconds: { duration }
  failed_test_names: ["{test1}", "{test2}"] # if any failed
  integrity_check:
    dev_evidence_found: true | false
    dev_claimed_pass: true | false | null
    discrepancy: true | false
  issues: []
```

```

Also update **Key Principles** at the end of the file (line ~1311). Find:

```

1. **Trust Dev evidence**: Verify test results exist, do NOT re-run automated tests

```

Replace with:

```

1. **Independent verification**: Execute automated tests independently, then cross-reference with Dev evidence

````

### Change: Modify `orchestrix-core/core-config.yaml`

Add an optional `testCommand` field under the `project` section:

```yaml
project:
  # ... existing fields ...
  testCommand: ''  # Optional. Auto-detected if empty. Examples: 'npm test', 'deno test -A', 'pytest'
````

---

## P1: Persistent E2E Test Suite with Regression

**Impact**: HIGH | **Effort**: MEDIUM | **Files Created**: 2 | **Files Modified**: 2

### Rationale

Currently, QA executes E2E tests via ad-hoc MCP tool calls during each review. These tests are:

- Not saved to disk (lost after QA review completes)
- Not reusable across reviews
- Not runnable for regression testing

This means Story 1.1's functionality is never re-verified after Story 2.3 is completed.

### Change 1: Create `orchestrix-core/tasks/qa-persist-e2e-tests.md`

Create this new file:

````markdown
# qa-persist-e2e-tests

Persist E2E test scenarios as executable Playwright test files after QA review.

## Purpose

Convert ad-hoc MCP-based E2E test scenarios into reusable Playwright test files.
These files accumulate across Stories, forming a regression test suite.

## Inputs

```yaml
required:
  - story_id: "{epic}.{story}"
  - e2e_results: object # From qa-e2e-testing.md output
  - project_type: object # From detect-project-type.md
  - environment_url: string
optional:
  - test_design_path: string
```
````

## Prerequisites

- E2E testing was executed (not skipped)
- At least 1 E2E scenario was tested
- Project type is web_frontend or fullstack

## Process

### Step 1: Determine Test File Location

```yaml
e2e_test_dir: "{project_root}/tests/e2e"
story_test_file: "{e2e_test_dir}/story-{epic}.{story}.spec.ts"
```

If `{e2e_test_dir}` does not exist, create it.

If `{e2e_test_dir}/playwright.config.ts` does not exist, generate a minimal config:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
```

### Step 2: Convert E2E Scenarios to Playwright Tests

For each scenario tested during QA review, generate a Playwright test:

**Input**: The MCP tool calls and their results from E2E testing.

**Output**: A `.spec.ts` file with one `test()` block per scenario.

**Conversion rules**:

| MCP Action                         | Playwright Equivalent                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `navigate_page(url)`               | `await page.goto(url)`                                                               |
| `click(uid)`                       | `await page.locator('{selector}').click()`                                           |
| `fill(uid, value)`                 | `await page.locator('{selector}').fill(value)`                                       |
| `take_snapshot()` → verify text    | `await expect(page.locator('{selector}')).toContainText('{text}')`                   |
| `take_screenshot()` → visual check | `await expect(page).toHaveScreenshot()`                                              |
| Console error check                | `page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })` |
| Network request check              | `await page.waitForResponse(resp => resp.url().includes('{pattern}'))`               |

**Template for generated test file**:

```typescript
/**
 * E2E Tests for Story {story_id}: {story_title}
 * Auto-generated by QA Agent during review Round {round}
 * Date: {date}
 *
 * These tests verify the acceptance criteria implemented in this story.
 * They are designed to be run as part of the regression suite.
 */
import { test, expect } from "@playwright/test";

test.describe("Story {story_id}: {story_title}", () => {
  test.beforeEach(async ({ page }) => {
    // Common setup for this story's tests
    // {any shared navigation or auth steps}
  });

  test("{scenario_name}", async ({ page }) => {
    // AC: {ac_reference}
    // Scenario: {scenario_description}

    {
      converted_playwright_steps;
    }

    // Assertions
    {
      converted_assertions;
    }
  });

  // ... additional test blocks for each scenario
});
```

### Step 3: Validate Generated Tests

After writing the test file:

1. Check syntax: `npx tsc --noEmit {story_test_file}` (if TypeScript available)
2. If syntax check fails, fix the generated code
3. Log: "Persisted {N} E2E test scenarios to {story_test_file}"

### Step 4: Update Test Index (Optional)

If file `{e2e_test_dir}/index.md` exists, append:

```markdown
| {story_id} | {story_title} | {scenario_count} | {date} |
```

If not exists, create with header:

```markdown
# E2E Regression Test Index

| Story      | Title         | Scenarios        | Date   |
| ---------- | ------------- | ---------------- | ------ |
| {story_id} | {story_title} | {scenario_count} | {date} |
```

## Output

```yaml
persisted_tests:
  file_path: "{story_test_file}"
  scenarios_persisted: { count }
  syntax_valid: true | false
```

````

### Change 2: Create `orchestrix-core/tasks/qa-regression-test.md`

Create this new file:

```markdown
# qa-regression-test

Execute all persisted E2E tests from previous Stories as a regression suite.

## Purpose

Before testing a new Story's functionality, verify that all previously completed
Stories still work correctly. This catches cross-Story integration bugs and regressions.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'  # Current story being reviewed
optional:
  - scope: 'epic' | 'all'  # Default: 'epic' (only tests from same epic)
````

## Prerequisites

- E2E test directory exists: `{project_root}/tests/e2e/`
- At least 1 persisted test file exists
- Application environment is running

## Process

### Step 1: Discover Persisted Test Files

```yaml
if scope == 'epic':
  pattern: "{project_root}/tests/e2e/story-{epic}.*.spec.ts"
else:
  pattern: "{project_root}/tests/e2e/story-*.spec.ts"
```

Exclude the current story's test file (it may not exist yet or is being updated).

**If no test files found**:

- Log: "No regression tests found for scope '{scope}'. Skipping regression."
- Return: `regression_skipped: true, reason: 'no_test_files'`

### Step 2: Execute Regression Suite

Run via Bash:

```bash
npx playwright test {test_files} --reporter=json 2>&1
```

**Timeout**: 600 seconds (10 minutes) for full regression suite.

### Step 3: Parse Results

```yaml
regression_results:
  total_files: { count }
  total_tests: { count }
  passed: { count }
  failed: { count }
  skipped: { count }
  pass_rate: { percentage }
  failed_tests:
    - file: "story-{epic}.{story}.spec.ts"
      test_name: "{name}"
      error: "{error message}"
      story_id: "{extracted from filename}"
  execution_time_seconds: { duration }
```

### Step 4: Report Regression Failures

For each failed test:

```yaml
regression_issue:
  severity: CRITICAL
  finding: "Regression: Story {original_story_id} test '{test_name}' now fails"
  evidence: "{error message}"
  suggested_action: "Investigate if current Story {current_story_id} broke Story {original_story_id} functionality"
  category: "regression"
```

## Output

```yaml
regression:
  executed: true
  scope: "{scope}"
  files_tested: { count }
  tests_total: { count }
  tests_passed: { count }
  tests_failed: { count }
  pass_rate: { percentage }
  regression_issues: [{ severity, finding, evidence }]
```

````

### Change 3: Modify `orchestrix-core/tasks/qa-review-story.md`

**Insert new Step 4.7 after Step 4.6** (AC Coverage Verification).

Find this text:

```markdown
---

## Step 5: E2E Testing (Conditional)
````

Insert BEFORE it:

````markdown
## Step 4.7: Regression Test Execution (Conditional)

**Purpose**: Run all persisted E2E tests from previous Stories to catch regressions before testing the current Story.

**Skip conditions**:

- If `review_mode == "automated_only"` AND `risk_level == LOW`, skip
- If no persisted E2E test files exist, skip
- If `review_mode_type == incremental` AND previous round regression passed, skip

### 4.7.1 Check for Persisted Tests

Glob: `{project_root}/tests/e2e/story-*.spec.ts`

**If no files found**:

- Log: "No regression test files found. Skipping regression step."
- Set `regression.executed: false, regression.reason: 'no_test_files'`
- Continue to Step 5

### 4.7.2 Execute Regression Suite

Execute: `{root}/tasks/qa-regression-test.md`

Input:

```yaml
story_id: { story_id }
scope: "epic" # Test stories within the same epic
```
````

### 4.7.3 Handle Regression Results

| Condition                          | Action                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| All regression tests pass          | Log: "Regression suite PASS ({N} tests)". Continue to Step 5                    |
| Any regression test fails          | Record each failure as CRITICAL issue. Continue to Step 5                       |
| Regression execution fails (infra) | Record as MEDIUM issue: "Regression suite execution failed". Continue to Step 5 |

**Store result for Step 7**:

```yaml
regression:
  executed: true | false
  passed: true | false
  tests_total: { count }
  tests_failed: { count }
  issues: [{ severity: CRITICAL, finding, evidence }]
```

---

````

**Also insert Step 9.5.3 after Step 9.5.2** (after git commit, before cleanup).

Find:

```markdown
### 9.6 Final Test Process Cleanup (MANDATORY - Post-Commit)
````

Insert BEFORE it:

````markdown
### 9.5.3 Persist E2E Tests (Conditional)

**Condition**: Execute ONLY if ALL of the following are true:

- E2E tests were executed (not skipped)
- Gate result is PASS or CONCERNS
- Project type is web_frontend or fullstack

Execute: `{root}/tasks/qa-persist-e2e-tests.md`

Input:

```yaml
story_id: { story_id }
e2e_results: { from Step 5 }
project_type: { from Step 2 }
environment_url: { from Step 3 }
```
````

Log result. Do not block on failures.

---

````

**Update Step 7.1** to include regression data in the gate decision context.

Find this text in Step 7.1:

```yaml
# Step 5: E2E Testing
e2e_tests_passed: {from Step 5, or null if skipped}
````

Insert AFTER it:

```yaml
# Step 4.7: Regression Testing
regression_executed: { from Step 4.7, default false }
regression_passed: { from Step 4.7, default true }
regression_failures_count: { from Step 4.7, default 0 }
```

**Update the workflow summary table** at the end of the file. Add a new row after Step 4.6:

```
| 4.7 | **Regression Testing** | Execute all | ⏭️ **SKIP** if previous round passed |
```

And add after Step 9.5.2:

```
| 9.5.3 | **Persist E2E Tests** | Execute | Execute |
```

### Change 4: Modify `orchestrix-core/data/decisions-qa-gate-decision.yaml`

Add a new input field after `e2e_tests_skipped`:

```yaml
- name: regression_tests_passed
  type: boolean
  required: false
  description: "Whether regression tests from previous stories passed (null if not executed)"

- name: regression_failures_count
  type: number
  required: false
  description: "Count of regression test failures (0 if not executed or all passed)"
```

Add a new FAIL rule after `fail_e2e_critical` (priority 11):

```yaml
# FAIL: Regression tests failed (current story broke previous stories)
- id: fail_regression
  priority: 9
  condition: >
    regression_tests_passed == false AND
    regression_failures_count >= 1
  result: FAIL
  reasoning: "Regression tests failed. Current story implementation broke previously working functionality."
  next_status: InProgress
  next_action: "handoff_to_dev_rework"
  metadata:
    quality_level: "regression_failure"
    expected_effort: "high"
    test_based_decision: true
    failure_type: "regression"
    fix_guidance: "Fix regression failures before proceeding. Check if current story's code changes conflict with previous stories."
```

---

## P2: Epic-Level Integration Verification

**Impact**: MEDIUM-HIGH | **Effort**: MEDIUM | **Files Created**: 1 | **Files Modified**: 1

### Rationale

Stories are developed and QA-reviewed in isolation. Story 1.1 (user registration) and Story 1.2 (user login) may each pass independently but fail when combined ("register then login" flow). There is no mechanism to verify cross-Story integration within an Epic.

### Change 1: Create `orchestrix-core/tasks/qa-epic-integration-test.md`

Create this new file:

````markdown
# qa-epic-integration-test

Execute cross-Story integration tests after each Story completion within an Epic.

## Purpose

Verify that Stories within the same Epic work together correctly.
Individual Stories pass QA independently, but may fail when combined.
This task catches integration bugs between Stories.

## Inputs

```yaml
required:
  - epic_id: "{epic}" # e.g., "1"
  - completed_story_id: "{epic}.{story}" # Story that just completed
  - story_root: "{devStoryLocation}"
optional:
  - skip_if_single_story: true # Skip if only 1 story is Done in epic
```
````

## Prerequisites

- At least 2 Stories in the Epic have Status = Done
- Application environment is running
- E2E test files exist for completed stories

## Process

### Step 0: Check Prerequisites

1. Glob: `{story_root}/{epic_id}.*.md`
2. Read each story file and extract Status
3. Count stories with Status = Done

**If Done count < 2**:

- Log: "Only 1 completed story in Epic {epic_id}. Skipping integration test."
- Return: `integration_skipped: true, reason: 'insufficient_stories'`

### Step 1: Identify Integration Touchpoints

For each pair of Done stories in the epic, identify shared resources:

1. Read each story's `Dev Agent Record.file_list`
2. Find **overlapping files** (files modified by multiple stories)
3. Find **dependency chains** (Story A creates API, Story B consumes it)
4. Find **shared data models** (stories that touch the same DB tables/models)

```yaml
integration_touchpoints:
  - stories: ["{epic}.1", "{epic}.2"]
    type: "shared_file"
    resource: "src/services/auth.ts"
    risk: "Both stories modify the auth service"
  - stories: ["{epic}.1", "{epic}.3"]
    type: "api_dependency"
    resource: "/api/users"
    risk: "Story 1 creates endpoint, Story 3 extends it"
  - stories: ["{epic}.2", "{epic}.3"]
    type: "shared_data_model"
    resource: "User model"
    risk: "Both stories add fields to User"
```

### Step 2: Design Cross-Story Test Scenarios

For each integration touchpoint, create a test scenario that exercises the combined flow:

```yaml
integration_scenario:
  id: "EPIC-{epic}-INT-{SEQ}"
  stories_involved: ["{epic}.1", "{epic}.2"]
  description: "User registers (Story 1) then logs in (Story 2)"
  steps:
    - action: "Complete Story 1 happy path"
      expected: "User created successfully"
    - action: "Complete Story 2 happy path using Story 1 output"
      expected: "Login succeeds with registered credentials"
  priority: P0 # Cross-story flows are always critical
```

### Step 3: Execute Integration Tests

**Method 1: Playwright (if persisted E2E tests exist)**

Run all persisted E2E tests in sequence:

```bash
npx playwright test tests/e2e/story-{epic}.*.spec.ts --reporter=json
```

**Method 2: Manual MCP (if no persisted tests)**

Execute each integration scenario using MCP browser tools:

1. Navigate to application
2. Execute the combined user flow
3. Verify each step produces expected output
4. Capture screenshots at each step

### Step 4: Record Results

```yaml
epic_integration:
  epic_id: "{epic}"
  stories_tested: ["{epic}.1", "{epic}.2", "{epic}.3"]
  touchpoints_found: { count }
  scenarios_executed: { count }
  scenarios_passed: { count }
  scenarios_failed: { count }
  issues:
    - id: "EPIC-{epic}-INT-001"
      severity: CRITICAL
      stories_involved: ["{epic}.1", "{epic}.2"]
      finding: "Registration flow completes but login fails with registered credentials"
      evidence: "{screenshot path}"
      suggested_action: "Verify Story 1 user creation format matches Story 2 login expectations"
```

## Output

```yaml
integration_result:
  executed: true
  epic_id: "{epic}"
  passed: true | false
  touchpoints: { count }
  scenarios_total: { count }
  scenarios_passed: { count }
  issues: [{ severity, finding, evidence }]
```

## Trigger Conditions

This task should be executed:

1. **After each Story QA PASS** within an Epic (if ≥2 stories Done)
2. **After the final Story** in an Epic completes (mandatory full integration)
3. **On demand** via SM or PM request

````

### Change 2: Modify `orchestrix-core/tasks/qa-review-story.md`

**Insert integration test trigger in Step 9.5**, after the git commit step.

Find:

```markdown
### 9.5.3 Persist E2E Tests (Conditional)
````

Insert AFTER the persist E2E tests step (before Step 9.6):

````markdown
### 9.5.4 Epic Integration Test (Conditional)

**Condition**: Execute ONLY if ALL of the following are true:

- Gate result is PASS
- Status is Done
- At least 2 Stories in the same Epic have Status = Done

**Check**: Glob `{story_root}/{epic_id}.*.md`, count stories with Status = Done.

**If count >= 2**:

Execute: `{root}/tasks/qa-epic-integration-test.md`

Input:

```yaml
epic_id: "{epic_id}"
completed_story_id: "{story_id}"
story_root: "{devStoryLocation}"
```
````

**Handle results**:

- If integration PASS: Log "Epic integration: PASS ({N} scenarios)"
- If integration FAIL:
  - Do NOT change gate result (Story itself passed)
  - Record integration issues in gate file under `epic_integration` section
  - Add WARNING to handoff message: "⚠️ Epic integration issues detected - see gate file"

---

````

---

## P3: AC Quality Enforcement in Story Creation

**Impact**: MEDIUM | **Effort**: LOW | **Files Modified**: 1 | **Files Created**: 1

### Rationale

The user reports that remaining bugs are often about "feature details not specified." This means AC quality is insufficient — ACs lack boundary conditions, error states, and interaction state descriptions. The SM agent creates stories but has no checklist enforcing AC precision.

### Change 1: Create `orchestrix-core/data/ac-quality-requirements.yaml`

Create this new file:

```yaml
# AC Quality Requirements
# Used by SM during story creation to enforce precise, unambiguous ACs.

description: >
  Minimum quality standards for Acceptance Criteria. Each AC must be precise
  enough that two independent developers would implement the same behavior.
  Vague ACs are the #1 source of post-development bugs.

rules:
  # ============================================
  # MANDATORY: Every AC must satisfy these
  # ============================================

  - id: ac_has_error_path
    applies_to: all
    requirement: >
      Every AC that describes a user action MUST include at least one
      error/failure scenario. Use "Given... When [error condition]...
      Then [specific error behavior]" format.
    examples:
      good: |
        AC1: User can login with email and password
        - Given valid credentials, When user submits login form, Then redirect to dashboard
        - Given invalid password, When user submits login form, Then show error "Invalid email or password" below the form, login button re-enables
        - Given unregistered email, When user submits login form, Then show same error "Invalid email or password" (no info leak)
      bad: |
        AC1: User can login with email and password
        - User enters email and password and clicks login
        - System should show appropriate error if login fails
    scoring_impact: -1.0 per AC missing error path

  - id: ac_no_vague_words
    applies_to: all
    requirement: >
      ACs MUST NOT use vague/ambiguous words. Each of the following words
      MUST be replaced with specific, testable descriptions.
    prohibited_words:
      - word: "appropriate"
        replace_with: "specify exactly what is appropriate"
        example: "show appropriate error → show red error banner with text 'Invalid input' that auto-dismisses after 5 seconds"
      - word: "proper"
        replace_with: "specify exactly what proper means"
      - word: "correctly"
        replace_with: "specify what correct behavior looks like"
      - word: "should handle"
        replace_with: "specify the exact handling behavior"
      - word: "etc."
        replace_with: "list all items explicitly"
      - word: "similar"
        replace_with: "list all items explicitly"
      - word: "as needed"
        replace_with: "specify exact conditions"
      - word: "properly"
        replace_with: "specify exact behavior"
      - word: "nicely"
        replace_with: "specify exact visual/behavioral requirements"
      - word: "reasonable"
        replace_with: "specify exact threshold or criteria"
    scoring_impact: -0.5 per vague word found

  # ============================================
  # CONDITIONAL: Apply based on AC type
  # ============================================

  - id: ac_ui_three_states
    applies_to: ui_interaction
    condition: "AC involves user interface interaction (forms, buttons, navigation)"
    requirement: >
      UI ACs MUST describe three states:
      1. Default/ready state (what user sees initially)
      2. Loading/processing state (what happens while action executes)
      3. Result state (success AND error outcomes)
    examples:
      good: |
        AC: User can submit feedback form
        - Default: Form shows text area (max 500 chars) with char counter, Submit button enabled
        - Loading: Submit button shows spinner and disables, form fields become read-only
        - Success: Form clears, green toast "Feedback submitted" appears for 3s
        - Error: Form retains input, red toast "Submission failed, please retry" appears, Submit re-enables
      bad: |
        AC: User can submit feedback form
        - User fills in form and clicks submit
        - System saves feedback
    scoring_impact: -1.0 per UI AC missing states

  - id: ac_form_validation_rules
    applies_to: form_input
    condition: "AC involves form input or data entry"
    requirement: >
      Form ACs MUST specify for each input field:
      1. Validation rules (required, format, min/max length, allowed characters)
      2. When validation triggers (on blur, on submit, on change)
      3. Error message text and position (inline, toast, banner)
      4. What happens to the submit button when validation fails
    examples:
      good: |
        AC: User registration form
        - Email: required, valid email format, max 255 chars
          - Validates on blur
          - Error: red inline text below field "Please enter a valid email address"
        - Password: required, min 8 chars, must contain 1 uppercase + 1 number
          - Validates on blur, strength indicator updates on change
          - Error: red inline text "Password must be at least 8 characters with 1 uppercase and 1 number"
        - Submit: disabled until all fields valid
      bad: |
        AC: User registration form
        - User enters email and password
        - Form validates input
    scoring_impact: -1.5 per form AC without validation rules

  - id: ac_api_response_format
    applies_to: api_endpoint
    condition: "AC involves API endpoint creation or modification"
    requirement: >
      API ACs MUST specify:
      1. HTTP method and path
      2. Request body/params schema
      3. Success response status code and body shape
      4. Error response status codes and body shape for each error case
      5. Authentication/authorization requirements
    scoring_impact: -1.0 per API AC missing response format

  - id: ac_data_boundary
    applies_to: data_processing
    condition: "AC involves data processing, list display, or calculations"
    requirement: >
      Data ACs MUST specify boundary behaviors:
      1. Empty state (what happens with 0 items / no data)
      2. Single item state
      3. Maximum/overflow state (what happens with very large data sets)
      4. Pagination or truncation strategy if applicable
    scoring_impact: -0.5 per data AC missing boundaries

output:
  ac_quality_score:
    type: number
    description: "Deduction from quality score based on AC violations"
  violations:
    type: array
    items:
      rule_id: string
      ac_ref: string
      violation: string
      deduction: number

metadata:
  version: "1.0.0"
  last_updated: "2025-02-04"
  owner: "SM Agent"
  usage_context: >
    Referenced by scoring-sm-story-quality.md during Phase 2 scoring.
    SM MUST check each AC against these rules before finalizing the story.
    Violations reduce the quality score and may trigger Blocked status.
````

### Change 2: Modify `orchestrix-core/checklists/scoring-sm-story-quality.md`

**Add a new section to Phase 2** after the existing S3 (Implementation Readiness) section.

Find this text:

```markdown
**S3 Score: \_\_\_% (Done/Total)**

---

## Quality Score
```

Insert BETWEEN them:

````markdown
## S4: AC Precision Validation (CRITICAL - Quality Multiplier)

**Purpose**: Verify Acceptance Criteria are precise, unambiguous, and testable.

**Load**: `{root}/data/ac-quality-requirements.yaml`

**For each AC in the story, verify**:

| Rule                       | Check                                     | Deduction          | Status |
| -------------------------- | ----------------------------------------- | ------------------ | ------ |
| `ac_has_error_path`        | AC has ≥1 error/failure scenario          | -1.0 per violation | [ ]    |
| `ac_no_vague_words`        | No prohibited vague words                 | -0.5 per word      | [ ]    |
| `ac_ui_three_states`       | UI ACs have default/loading/result states | -1.0 per violation | [ ]    |
| `ac_form_validation_rules` | Form ACs have validation rules per field  | -1.5 per violation | [ ]    |
| `ac_api_response_format`   | API ACs have request/response specs       | -1.0 per violation | [ ]    |
| `ac_data_boundary`         | Data ACs have empty/single/max states     | -0.5 per violation | [ ]    |

**AC Precision Deduction: -\_\_\_** (sum of all deductions, cap at -3.0)

**S4 Result**:

```yaml
ac_precision:
  total_acs_checked: { count }
  violations_found: { count }
  total_deduction: { number, max -3.0 }
  violations:
    - rule: "{rule_id}"
      ac: "AC{N}"
      issue: "{description}"
      deduction: { number }
```
````

---

````

**Update the Quality Score formula**. Find:

```markdown
**Formula:** `(S2 × 0.50) + (S3 × 0.50)`
````

Replace with:

```markdown
**Formula:** `(S2 × 0.45) + (S3 × 0.45) + max(0, 1.0 + S4_deduction) × 1.0`

Where:

- S2 (Technical Extraction): 45% weight
- S3 (Implementation Readiness): 45% weight
- S4 (AC Precision): 10% weight (1.0 base, reduced by deductions, minimum 0)

**Example**: S2=90%, S3=85%, S4 deduction=-1.5:

- (0.90 × 0.45) + (0.85 × 0.45) + max(0, 1.0 - 1.5) × 1.0
- = 0.405 + 0.3825 + 0 = 0.7875 → Score: 7.9/10
```

**Update the checklist output** at the end. Find:

```yaml
quality_score:
  final_score: 0-10
  calculation: "(S2 × 0.50) + (S3 × 0.50)"
```

Replace with:

```yaml
quality_score:
  final_score: 0-10
  calculation: "(S2 × 0.45) + (S3 × 0.45) + max(0, 1.0 + S4_deduction) × 1.0"

ac_precision:
  total_acs_checked: 0
  violations_found: 0
  total_deduction: 0
  violations: []
```

---

## P4: Test Design Generates Executable Test Skeletons

**Impact**: MEDIUM | **Effort**: MEDIUM | **Files Modified**: 1

### Rationale

`test-design.md` produces excellent test scenario documents (Markdown tables with ID, level, priority, description). But these are documentation-only — Dev must manually interpret them and write tests from scratch. This creates a gap where designed scenarios are missed or incorrectly implemented.

### Change: Modify `orchestrix-core/tasks/test-design.md`

**Add a new Output section** after the existing `Output 1: Test Design Document`.

Find this text near the end of the file (after the Output 1 section):

```markdown
### Output 2: Backfill Story Test Specs (Standard/Comprehensive Only)
```

Insert a NEW output BEFORE Output 2 (renumber Output 2 → Output 3, and existing Output 3 becomes Output 4 if it exists):

````markdown
### Output 2: Executable Test Skeleton File (Standard/Comprehensive Only)

**Purpose**: Generate a test skeleton file that Dev MUST use as the starting point for writing tests. Each test scenario from the design document becomes a skeleton test case with clear TODO markers.

**Skip condition**: If test_design_level = "Simple", skip this output.

**Determine skeleton file path**:

Read `orchestrix/core-config.yaml` for `project.testDirectory` (default: `tests` or `__tests__` or `src/**/*.test.*`).

Auto-detect test file pattern from existing tests:

- Glob: `**/*.test.ts`, `**/*.spec.ts`, `**/*.test.js`, `**/*.spec.js`
- Use the first matching pattern's directory and extension

**Skeleton file path**: `{test_directory}/{epic}.{story}-{slug}.test.{ext}`

**Generate test skeleton**:

```typescript
/**
 * Test Skeleton for Story {epic}.{story}: {story_title}
 *
 * AUTO-GENERATED by QA Test Design. Dev MUST implement all TODO blocks.
 * Do NOT delete any test case — each maps to a designed scenario.
 * If a scenario is not applicable, change the test to `test.skip` with a reason.
 *
 * Test Design: {test_design_document_path}
 * Generated: {date}
 */

// ============================================================
// AC1: {ac1_description}
// ============================================================

describe("AC1: {ac1_description}", () => {
  // --- Core Scenarios ---

  test("{scenario_id}: {scenario_description}", () => {
    // Priority: {P0|P1|P2|P3}
    // Level: {unit|integration|e2e}
    // Input: {described input}
    // Expected: {described expected outcome}
    //
    // TODO: Implement this test
    throw new Error("Test not implemented: {scenario_id}");
  });

  // ... repeat for each scenario in this AC

  // --- Blind Spot Scenarios ---

  test("[BLIND-SPOT] {blind_spot_id}: {description}", () => {
    // Category: {BOUNDARY|ERROR|FLOW|CONCURRENCY|DATA|RESOURCE}
    // Priority: {P1|P2}
    // Ref: {blind_spot_ref}
    //
    // TODO: Implement this blind spot test
    throw new Error("Test not implemented: {blind_spot_id}");
  });

  // ... repeat for each blind spot scenario for this AC
});

// ============================================================
// AC2: {ac2_description}
// ============================================================

// ... repeat for all ACs
```
````

**Rules for skeleton generation**:

1. Each test scenario from the design document MUST have exactly one `test()` block
2. Each `test()` block MUST throw an error by default (ensures Dev cannot skip it)
3. Blind spot scenarios MUST be clearly tagged with `[BLIND-SPOT]`
4. Comments MUST include all context from the design (priority, level, input, expected)
5. Use `describe()` blocks to group by AC
6. Test file MUST be valid syntax (parseable by test runner)

**Validation**: After generating the file, verify:

1. File parses without syntax errors
2. Count of `test()` blocks matches count of designed scenarios
3. Log: "Generated test skeleton: {path} ({N} test cases, {M} blind spots)"

**Store result**:

```yaml
test_skeleton:
  file_path: "{skeleton_file_path}"
  total_test_cases: { count }
  blind_spot_test_cases: { count }
  syntax_valid: true | false
```

````

**Also update the existing Output 2 (now Output 3) reference** in the backfill section. Add a note:

```markdown
> **Note**: Dev MUST implement tests in the skeleton file (Output 2) rather than
> creating new test files from scratch. The skeleton ensures all designed scenarios
> are covered. QA will verify that no `throw new Error('Test not implemented')` remains.
````

---

## P5: Post-Epic Smoke Test

**Impact**: MEDIUM | **Effort**: LOW | **Files Created**: 1

### Rationale

After all Stories in an Epic are Done, there is no final verification that the entire feature works end-to-end. A lightweight smoke test of core user journeys provides final confidence before the Epic is considered complete.

### Change: Create `orchestrix-core/tasks/qa-smoke-test.md`

Create this new file:

````markdown
# qa-smoke-test

Execute a final smoke test after all Stories in an Epic are completed.

## Purpose

Verify the complete user experience for an Epic's feature set works end-to-end.
This is the final quality gate before an Epic is considered production-ready.

## Inputs

```yaml
required:
  - epic_id: '{epic}'
  - story_root: '{devStoryLocation}'
optional:
  - trigger: 'auto' | 'manual'  # How this was triggered
```
````

## Prerequisites

- ALL Stories in the Epic have Status = Done
- Application environment is running
- Regression test suite has been executed (or no tests exist)

## Process

### Step 0: Verify Epic Completeness

1. Glob: `{story_root}/{epic_id}.*.md`
2. Read each story file and extract Status
3. Verify ALL stories have Status = Done

**If any story is NOT Done**:

- Log: "Epic {epic_id} not complete. Stories not Done: {list}"
- Return: `smoke_test_skipped: true, reason: 'epic_incomplete'`

### Step 1: Run Full Regression Suite

Execute all E2E tests for this epic:

```bash
npx playwright test tests/e2e/story-{epic_id}.*.spec.ts --reporter=json
```

**If no test files exist, proceed to Step 2 with manual testing.**

### Step 2: Execute Core User Journeys

Identify the Epic's primary user journeys by reading the PRD or Epic description.

For each core journey:

1. **Start from clean state** (clear cookies, fresh session)
2. **Execute the complete flow** using MCP browser tools
3. **Verify each step** produces expected output
4. **Check browser console** for zero errors
5. **Check network requests** for zero failures
6. **Capture final state screenshot**

### Step 3: Verify Cross-Cutting Concerns

| Concern                | Verification Method                                     |
| ---------------------- | ------------------------------------------------------- |
| **Console Errors**     | Check browser console for any `error` level messages    |
| **Network Failures**   | Check for failed XHR/Fetch requests (non-2xx responses) |
| **Visual Consistency** | Take full-page screenshot, verify no layout breaks      |
| **Performance**        | Verify page load < 3 seconds (no spinner stuck)         |
| **Auth Flow**          | If applicable, verify login → action → logout cycle     |

### Step 4: Record Results

```yaml
smoke_test:
  epic_id: "{epic}"
  stories_verified: { count }
  regression_suite:
    executed: true | false
    passed: true | false
    tests_total: { count }
    tests_failed: { count }
  core_journeys:
    total: { count }
    passed: { count }
    failed: { count }
  cross_cutting:
    console_errors: { count }
    network_failures: { count }
    performance_ok: true | false
  overall: PASS | FAIL
  issues: [{ severity, finding, evidence, journey }]
```

## Output

```yaml
smoke_test_result:
  executed: true
  epic_id: '{epic}'
  overall: PASS | FAIL
  confidence_level: HIGH | MEDIUM | LOW
  issues: []
  recommendation: "Epic {epic_id} is production-ready" | "Epic {epic_id} has {N} issues to resolve"
```

## Trigger Conditions

This task should be executed:

1. **Automatically** when the last Story in an Epic reaches Status = Done
2. **Manually** via PM or SM request: `QA *smoke-test {epic_id}`

```

---

## Implementation Order and Dependencies

```

Phase 1 (Immediate - Independent Changes):
├── P0: QA Independent Test Execution
│ └── Modify: qa-review-story.md (Step 4)
│ └── Modify: core-config.yaml (add testCommand)
│
└── P3: AC Quality Enforcement
└── Create: data/ac-quality-requirements.yaml
└── Modify: checklists/scoring-sm-story-quality.md

Phase 2 (Core - Depends on P0):
├── P1: Persistent E2E Test Suite
│ └── Create: tasks/qa-persist-e2e-tests.md
│ └── Create: tasks/qa-regression-test.md
│ └── Modify: tasks/qa-review-story.md (Steps 4.7, 9.5.3)
│ └── Modify: data/decisions-qa-gate-decision.yaml
│
└── P4: Test Design → Executable Skeletons
└── Modify: tasks/test-design.md (add Output 2)

Phase 3 (Enhancement - Depends on P1):
├── P2: Epic Integration Verification
│ └── Create: tasks/qa-epic-integration-test.md
│ └── Modify: tasks/qa-review-story.md (Step 9.5.4)
│
└── P5: Post-Epic Smoke Test
└── Create: tasks/qa-smoke-test.md

```

### Summary of All File Changes

| Priority | Action | File Path | Change Type |
|----------|--------|-----------|-------------|
| P0 | Modify | `orchestrix-core/tasks/qa-review-story.md` | Replace Step 4, update Key Principles |
| P0 | Modify | `orchestrix-core/core-config.yaml` | Add `testCommand` field |
| P1 | Create | `orchestrix-core/tasks/qa-persist-e2e-tests.md` | New file |
| P1 | Create | `orchestrix-core/tasks/qa-regression-test.md` | New file |
| P1 | Modify | `orchestrix-core/tasks/qa-review-story.md` | Add Steps 4.7, 9.5.3, update Step 7.1 |
| P1 | Modify | `orchestrix-core/data/decisions-qa-gate-decision.yaml` | Add regression input + rule |
| P2 | Create | `orchestrix-core/tasks/qa-epic-integration-test.md` | New file |
| P2 | Modify | `orchestrix-core/tasks/qa-review-story.md` | Add Step 9.5.4 |
| P3 | Create | `orchestrix-core/data/ac-quality-requirements.yaml` | New file |
| P3 | Modify | `orchestrix-core/checklists/scoring-sm-story-quality.md` | Add S4, update formula |
| P4 | Modify | `orchestrix-core/tasks/test-design.md` | Add Output 2 (test skeleton) |
| P5 | Create | `orchestrix-core/tasks/qa-smoke-test.md` | New file |

### Verification After Each Phase

After implementing each phase, verify:

1. **P0**: Run `npm run validate` to ensure no config errors. Manually test by triggering QA review on a story — QA should now execute `npm test` independently.

2. **P1**: After a story QA PASS, verify that `tests/e2e/story-*.spec.ts` files are created. On the next story review, verify regression tests execute before new E2E tests.

3. **P2**: After 2+ stories in an Epic are Done, verify integration test triggers automatically.

4. **P3**: Create a test story with vague ACs ("should handle errors appropriately") and verify SM scoring penalizes it.

5. **P4**: After test-design runs, verify a `.test.ts` skeleton file is generated with `throw new Error('Test not implemented')` for each scenario.

6. **P5**: After all stories in an Epic are Done, verify smoke test triggers and runs the full regression suite.
```
