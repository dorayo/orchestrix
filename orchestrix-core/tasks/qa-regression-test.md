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
```

## Prerequisites

- E2E test directory exists: `{project_root}/tests/e2e/`
- At least 1 persisted test file exists
- Application environment is running

## Process

### Step 1: Discover Persisted Test Files

```yaml
if scope == 'epic':
  pattern: '{project_root}/tests/e2e/story-{epic}.*.spec.ts'
else:
  pattern: '{project_root}/tests/e2e/story-*.spec.ts'
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
  total_files: {count}
  total_tests: {count}
  passed: {count}
  failed: {count}
  skipped: {count}
  pass_rate: {percentage}
  failed_tests:
    - file: 'story-{epic}.{story}.spec.ts'
      test_name: '{name}'
      error: '{error message}'
      story_id: '{extracted from filename}'
  execution_time_seconds: {duration}
```

### Step 4: Report Regression Failures

For each failed test:

```yaml
regression_issue:
  severity: CRITICAL
  finding: "Regression: Story {original_story_id} test '{test_name}' now fails"
  evidence: '{error message}'
  suggested_action: "Investigate if current Story {current_story_id} broke Story {original_story_id} functionality"
  category: 'regression'
```

## Output

```yaml
regression:
  executed: true
  scope: '{scope}'
  files_tested: {count}
  tests_total: {count}
  tests_passed: {count}
  tests_failed: {count}
  pass_rate: {percentage}
  regression_issues: [{severity, finding, evidence}]
```
