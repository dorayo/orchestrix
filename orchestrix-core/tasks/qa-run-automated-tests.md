# qa-run-automated-tests

Execute the project's existing automated test suite.

## Purpose

Run all existing automated tests (unit, integration, e2e) that Dev has written.
Parse results to determine if tests pass and capture coverage metrics.

## Inputs

```yaml
required:
  - project_type: object  # From detect-project-type.md
  - story_id: string
optional:
  - test_filter: string   # Run specific tests only (e.g., "login")
  - coverage_required: boolean  # Fail if coverage below threshold (default: false)
  - coverage_threshold: number  # Minimum coverage percentage (default: 80)
```

## Process

### Step 1: Detect Test Runner

Identify which test framework and runner the project uses:

```yaml
test_runners:
  jest:
    detect:
      - package.json has "jest" in devDependencies
      - jest.config.js/ts exists
    command: "npx jest --json --outputFile=/tmp/jest-results.json"
    coverage_flag: "--coverage --coverageReporters=json-summary"

  vitest:
    detect:
      - package.json has "vitest" in devDependencies
      - vite.config has test configuration
    command: "npx vitest run --reporter=json --outputFile=/tmp/vitest-results.json"
    coverage_flag: "--coverage"

  mocha:
    detect:
      - package.json has "mocha" in devDependencies
      - .mocharc.js/json exists
    command: "npx mocha --reporter json > /tmp/mocha-results.json"
    coverage_flag: "npx nyc --reporter=json-summary"

  playwright:
    detect:
      - package.json has "@playwright/test" in devDependencies
      - playwright.config.ts exists
    command: "npx playwright test --reporter=json"
    coverage_flag: null  # Playwright doesn't do code coverage

  cypress:
    detect:
      - package.json has "cypress" in devDependencies
      - cypress.config.js/ts exists
    command: "npx cypress run --reporter json"
    coverage_flag: null

  deno:
    detect:
      - deno.json exists
    command: "deno test --allow-all"
    coverage_flag: "--coverage"

  bun:
    detect:
      - bunfig.toml exists
      - bun.lockb exists
    command: "bun test"
    coverage_flag: null  # Limited coverage support
```

### Step 2: Check for Test Script

```bash
# Check package.json for test script
TEST_SCRIPT=$(node -e "console.log(require('./package.json').scripts?.test || '')")

if [ -z "$TEST_SCRIPT" ]; then
  echo "WARNING: No test script found in package.json"
  # Return early with no tests
fi

# Check if test script is a placeholder
if echo "$TEST_SCRIPT" | grep -q "no test specified\|echo.*Error"; then
  echo "WARNING: Test script is a placeholder"
fi
```

### Step 3: Run Tests

Execute the test suite:

```bash
# Determine package manager
if [ -f "bun.lockb" ]; then
  PM="bun"
elif [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"
elif [ -f "yarn.lock" ]; then
  PM="yarn"
else
  PM="npm"
fi

# Run tests with timeout
TIMEOUT=300  # 5 minutes

echo "Running tests with ${PM}..."
START_TIME=$(date +%s)

# Capture output and exit code
$PM test 2>&1 | tee /tmp/test-output.log
TEST_EXIT_CODE=${PIPESTATUS[0]}

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Tests completed in ${DURATION}s with exit code ${TEST_EXIT_CODE}"
```

### Step 4: Parse Test Results

Parse the test output to extract metrics:

#### Jest Results

```javascript
// Parse Jest JSON output
const results = require('/tmp/jest-results.json');

const parsed = {
  total: results.numTotalTests,
  passed: results.numPassedTests,
  failed: results.numFailedTests,
  skipped: results.numPendingTests,
  duration: results.testResults.reduce((sum, r) => sum + r.perfStats.end - r.perfStats.start, 0),
  suites: results.numTotalTestSuites,
  failed_tests: results.testResults
    .filter(r => r.status === 'failed')
    .flatMap(r => r.assertionResults.filter(a => a.status === 'failed'))
    .map(a => ({
      name: a.fullName,
      file: a.ancestorTitles.join(' > '),
      error: a.failureMessages.join('\n')
    }))
};
```

#### Vitest Results

```javascript
// Parse Vitest JSON output
const results = require('/tmp/vitest-results.json');

const parsed = {
  total: results.numTotalTests,
  passed: results.numPassedTests,
  failed: results.numFailedTests,
  skipped: results.numSkippedTests + results.numTodoTests,
  duration: results.duration,
  failed_tests: results.testResults
    .filter(r => r.status === 'fail')
    .map(r => ({
      name: r.name,
      file: r.file,
      error: r.message
    }))
};
```

#### Generic Output Parsing

If no JSON output available, parse text output:

```bash
# Count common test result patterns
PASSED=$(grep -cE "(PASS|passed|✓|ok)" /tmp/test-output.log || echo 0)
FAILED=$(grep -cE "(FAIL|failed|✗|not ok)" /tmp/test-output.log || echo 0)
SKIPPED=$(grep -cE "(SKIP|skipped|pending|todo)" /tmp/test-output.log || echo 0)

# Extract failed test names
FAILED_TESTS=$(grep -E "(FAIL|failed|✗)" /tmp/test-output.log | head -20)
```

### Step 5: Get Coverage (if available)

```bash
# Check for coverage report
COVERAGE_FILE="coverage/coverage-summary.json"

if [ -f "$COVERAGE_FILE" ]; then
  # Parse coverage summary
  LINES_PCT=$(node -e "console.log(require('./${COVERAGE_FILE}').total.lines.pct)")
  BRANCHES_PCT=$(node -e "console.log(require('./${COVERAGE_FILE}').total.branches.pct)")
  FUNCTIONS_PCT=$(node -e "console.log(require('./${COVERAGE_FILE}').total.functions.pct)")
  STATEMENTS_PCT=$(node -e "console.log(require('./${COVERAGE_FILE}').total.statements.pct)")

  # Calculate average
  COVERAGE_AVG=$(echo "scale=2; ($LINES_PCT + $BRANCHES_PCT + $FUNCTIONS_PCT + $STATEMENTS_PCT) / 4" | bc)
else
  COVERAGE_AVG="N/A"
fi
```

### Step 6: Verify P0 Test Coverage

Cross-reference with test-design to verify P0 scenarios are tested:

```yaml
# Load test-design if exists
test_design_path: "docs/qa/assessments/{story_id}-test-design-*.md"

# Extract P0 scenarios from test design
p0_scenarios:
  - name: "User login with valid credentials"
    verified: true  # Found matching test
  - name: "User login with invalid password"
    verified: true
  - name: "Session timeout handling"
    verified: false  # No matching test found

p0_coverage: 2/3 (66%)
```

### Step 7: Generate Report

Compile all results into a structured report:

```yaml
automated_test_results:
  executed: true
  exit_code: 0
  duration_seconds: 45.2

  summary:
    total: 150
    passed: 148
    failed: 2
    skipped: 5
    pass_rate: "98.7%"

  coverage:
    available: true
    lines: 85.2
    branches: 78.4
    functions: 90.1
    statements: 84.5
    average: 84.6
    meets_threshold: true  # >= 80%

  failed_tests:
    - name: "LoginForm > should show error on invalid email"
      file: "src/components/LoginForm.test.tsx"
      error: "Expected element to have text 'Invalid email' but got 'Email required'"
    - name: "API > POST /users > should validate required fields"
      file: "src/api/users.test.ts"
      error: "Expected status 400 but received 500"

  p0_verification:
    total: 10
    covered: 8
    missing:
      - "Password reset email delivery"
      - "Rate limiting on failed logins"

  warnings:
    - "5 tests were skipped"
    - "Coverage decreased by 2% from last run"
```

## Output

Return test execution results:

```yaml
tests_executed: true
tests_passed: true | false  # All tests passed?
exit_code: 0 | 1

metrics:
  total: 150
  passed: 148
  failed: 2
  skipped: 5
  pass_rate: 98.7
  duration_seconds: 45.2

coverage:
  available: true | false
  percentage: 84.6
  meets_threshold: true | false
  details:
    lines: 85.2
    branches: 78.4
    functions: 90.1
    statements: 84.5

failed_tests:
  - name: string
    file: string
    error: string

p0_coverage:
  total: 10
  covered: 8
  percentage: 80
  missing: ["scenario names..."]

raw_output_path: "/tmp/test-output.log"
```

## Decision Points

### Tests All Pass

```yaml
if tests_passed AND pass_rate >= 100:
  result: PASS
  message: "All automated tests passed"
  proceed_to: e2e_testing (based on review_mode)
```

### Tests Have Failures

```yaml
if tests_passed == false:
  result: FAIL
  message: "Automated tests failed"
  issues:
    - severity: HIGH
      type: "test_failure"
      details: failed_tests
  proceed_to: gate_decision (skip e2e)
```

### Coverage Below Threshold

```yaml
if coverage.meets_threshold == false:
  result: CONCERNS
  message: "Test coverage below threshold"
  issues:
    - severity: MEDIUM
      type: "low_coverage"
      current: coverage.percentage
      required: coverage_threshold
  proceed_to: e2e_testing (continue but note in gate)
```

### No Tests Found

```yaml
if tests_executed == false OR total == 0:
  result: CONCERNS
  message: "No automated tests found"
  issues:
    - severity: MEDIUM
      type: "no_tests"
  proceed_to: e2e_testing (full testing required)
```

## Notes

- Always capture raw output for debugging
- Parse multiple result formats (JSON preferred, text fallback)
- Verify P0 scenarios are actually tested, not just that tests exist
- Coverage is informational, not blocking (unless explicitly required)
- Timeouts prevent stuck tests from blocking the review
