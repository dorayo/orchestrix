---
description: "qa-e2e-testing"
---

When this command is used, execute the following task:

# qa-e2e-testing

Execute end-to-end testing based on risk level and project type.

## Purpose

Perform real user-journey testing by interacting with the running application.
Use MCP tools (Playwright, Chrome DevTools) for web apps, Bash for CLI/API.

## Inputs

```yaml
required:
  - story_id: string
  - review_mode: enum [automated_only, automated_plus_spot_check, full_testing]
  - project_type: object # From detect-project-type.md
  - environment_url: string # From qa-environment-setup.md
  - story_path: string # Path to story file
optional:
  - test_design_path: string # Path to test design document
  - max_scenarios: number # Limit scenarios to test (default: unlimited)
```

## Process

### Step 0: Check Review Mode

```yaml
if review_mode == "automated_only":
  return:
    e2e_executed: false
    skip_reason: "Review mode is automated_only - E2E testing skipped"
    issues: []
  # Proceed directly to gate decision
```

### Step 1: Load Test Scenarios

Load test scenarios based on review mode:

#### Spot Check Mode (2-3 scenarios)

```yaml
# Select highest priority scenarios
selection_criteria:
  - P0 (Critical) scenarios only
  - Focus on happy path + 1 error scenario
  - Prioritize user-facing functionality
  - Maximum 3 scenarios

example_selection:
  - "User can complete login with valid credentials"
  - "User sees appropriate error with invalid password"
  - "User can navigate to dashboard after login"
```

#### Full Testing Mode (all scenarios)

```yaml
# Load all scenarios from test design
source: test_design_path OR story acceptance criteria

scenario_priority:
  P0_critical: Must test all
  P1_high: Must test all
  P2_medium: Test if time permits
  P3_low: Skip unless specifically relevant
```

### Step 2: Prepare Test Context

Extract context from story for testing:

```yaml
# Read story file
story_context:
  acceptance_criteria:
    - ac_id: "AC1"
      description: "User can login with email and password"
      test_scenarios:
        - "Valid login"
        - "Invalid password"
        - "Empty fields"

  dev_notes:
    test_accounts:
      - email: "test@example.com"
        password: "password123"
    api_endpoints:
      - "POST /api/auth/login"
      - "GET /api/user/profile"

  file_list:
    - "src/components/LoginForm.tsx"
    - "src/pages/Login.tsx"
```

### Step 3: Execute Tests by Project Type

---

#### 3A: Web Frontend Testing (Playwright MCP)

**Step 3A.1: Initialize Browser**

```yaml
tool: mcp__playwright__browser_navigate
params:
  url: "{environment_url}"

# Wait for page load
tool: mcp__playwright__browser_snapshot
# Returns accessibility tree for element identification
```

**Step 3A.2: Execute Scenario**

For each test scenario:

```yaml
scenario: "User can login with valid credentials"

steps:
  # Step 1: Navigate to login page
  - tool: mcp__playwright__browser_navigate
    params:
      url: "{environment_url}/login"

  # Step 2: Verify page loaded
  - tool: mcp__playwright__browser_snapshot
    expect: Contains "Login" or "Sign in"

  # Step 3: Fill form
  - tool: mcp__playwright__browser_fill_form
    params:
      fields:
        - name: "Email input"
          type: "textbox"
          ref: "{ref_from_snapshot}"
          value: "test@example.com"
        - name: "Password input"
          type: "textbox"
          ref: "{ref_from_snapshot}"
          value: "password123"

  # Step 4: Click submit
  - tool: mcp__playwright__browser_click
    params:
      element: "Login button"
      ref: "{ref_from_snapshot}"

  # Step 5: Wait for navigation
  - tool: mcp__playwright__browser_wait_for
    params:
      text: "Dashboard" # or "Welcome"
      timeout: 5000

  # Step 6: Verify success
  - tool: mcp__playwright__browser_snapshot
    expect: Contains "Dashboard" or "Welcome"

  # Step 7: Check for errors
  - tool: mcp__playwright__browser_console_messages
    params:
      level: "error"
    expect: No errors
```

**Step 3A.3: Capture Evidence**

```yaml
# Take screenshot at key points
- tool: mcp__playwright__browser_take_screenshot
  params:
    filename: "docs/qa/evidence/{story_id}/screenshots/login-success.png"

# Capture console on error
- tool: mcp__playwright__browser_console_messages
  params:
    level: "error"
  save_to: "docs/qa/evidence/{story_id}/logs/console-errors.log"

# Capture network errors
- tool: mcp__playwright__browser_network_requests
  filter: status >= 400
  save_to: "docs/qa/evidence/{story_id}/logs/network-errors.log"
```

---

#### 3B: Web Backend Testing (Bash/curl)

**Step 3B.1: Test API Endpoints**

```bash
# Define base URL
BASE_URL="${environment_url}"

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_STATUS" != "200" ]; then
  echo "FAIL: Health check returned $HEALTH_STATUS"
  echo "$HEALTH_BODY" > /tmp/qa-evidence/health-failure.log
fi
```

**Step 3B.2: Test Authentication Flow**

```bash
# Login request
echo "Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_STATUS" = "200" ]; then
  # Extract token
  TOKEN=$(echo "$LOGIN_BODY" | jq -r '.token // .accessToken // empty')
  echo "Login successful. Token obtained."
else
  echo "FAIL: Login returned $LOGIN_STATUS"
  echo "$LOGIN_BODY"
fi

# Test authenticated endpoint
echo "Testing protected endpoint..."
PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "${BASE_URL}/api/user/profile" \
  -H "Authorization: Bearer ${TOKEN}")

PROFILE_STATUS=$(echo "$PROFILE_RESPONSE" | tail -1)
if [ "$PROFILE_STATUS" != "200" ]; then
  echo "FAIL: Profile endpoint returned $PROFILE_STATUS"
fi
```

**Step 3B.3: Test Error Handling**

```bash
# Test invalid credentials
echo "Testing invalid login..."
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}')

INVALID_STATUS=$(echo "$INVALID_RESPONSE" | tail -1)
if [ "$INVALID_STATUS" != "401" ]; then
  echo "FAIL: Expected 401 for invalid password, got $INVALID_STATUS"
fi

# Test missing fields
echo "Testing missing fields..."
MISSING_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}')

MISSING_STATUS=$(echo "$MISSING_RESPONSE" | tail -1)
if [ "$MISSING_STATUS" != "400" ]; then
  echo "FAIL: Expected 400 for missing fields, got $MISSING_STATUS"
fi
```

---

#### 3C: CLI Testing (Bash)

**Step 3C.1: Test Basic Commands**

```bash
CLI_COMMAND="./node_modules/.bin/mycli"
# or: CLI_COMMAND="npx mycli"

# Test help
echo "Testing --help..."
HELP_OUTPUT=$($CLI_COMMAND --help 2>&1)
HELP_EXIT=$?

if [ $HELP_EXIT -ne 0 ]; then
  echo "FAIL: --help returned exit code $HELP_EXIT"
fi

if ! echo "$HELP_OUTPUT" | grep -q "Usage:"; then
  echo "FAIL: --help output missing Usage section"
fi

# Test version
echo "Testing --version..."
VERSION_OUTPUT=$($CLI_COMMAND --version 2>&1)
if ! echo "$VERSION_OUTPUT" | grep -qE "[0-9]+\.[0-9]+\.[0-9]+"; then
  echo "FAIL: --version did not output a valid semver"
fi
```

**Step 3C.2: Test Core Functionality**

```bash
# Test create command
echo "Testing create command..."
CREATE_OUTPUT=$($CLI_COMMAND create --name "test-project" 2>&1)
CREATE_EXIT=$?

if [ $CREATE_EXIT -ne 0 ]; then
  echo "FAIL: create command failed with exit code $CREATE_EXIT"
  echo "$CREATE_OUTPUT"
fi

# Verify output
if [ -d "test-project" ]; then
  echo "PASS: Project directory created"
else
  echo "FAIL: Project directory not created"
fi

# Cleanup
rm -rf test-project
```

**Step 3C.3: Test Error Handling**

```bash
# Test invalid command
echo "Testing invalid command..."
INVALID_OUTPUT=$($CLI_COMMAND invalid-command 2>&1)
INVALID_EXIT=$?

if [ $INVALID_EXIT -eq 0 ]; then
  echo "FAIL: Invalid command should return non-zero exit code"
fi

if ! echo "$INVALID_OUTPUT" | grep -qiE "error|unknown|invalid"; then
  echo "FAIL: Error message not shown for invalid command"
fi
```

---

### Step 4: Record Test Results

For each scenario, record:

```yaml
scenario_result:
  scenario_name: "User can login with valid credentials"
  status: PASS | FAIL | SKIPPED
  duration_seconds: 3.5
  steps_executed: 7
  steps_passed: 7
  steps_failed: 0

  # If failed
  failure_details:
    step: 5
    expected: "Page should show Dashboard"
    actual: "Page shows error message: 'Session expired'"
    screenshot: "docs/qa/evidence/{story_id}/screenshots/login-fail.png"

  # Evidence collected
  evidence:
    screenshots:
      - path: "login-form.png"
        description: "Login form with filled fields"
      - path: "login-success.png"
        description: "Dashboard after successful login"
    logs:
      - path: "console.log"
        type: "console"
    network:
      - path: "network.log"
        type: "requests"
```

### Step 5: Generate Summary

Compile all scenario results:

```yaml
e2e_test_summary:
  executed: true
  mode: "automated_plus_spot_check"
  total_scenarios: 3
  passed: 2
  failed: 1
  skipped: 0
  duration_seconds: 15.2

  passed_scenarios:
    - "User can login with valid credentials"
    - "User sees dashboard after login"

  failed_scenarios:
    - name: "User sees error for invalid password"
      failure: "Error message not displayed"
      evidence: "docs/qa/evidence/1.3/screenshots/invalid-login.png"

  issues_found:
    - id: "E2E-001"
      severity: HIGH
      finding: "Invalid password error message not shown"
      expected: "Show 'Invalid password' message"
      actual: "Form clears but no error shown"
      evidence:
        screenshot: "docs/qa/evidence/1.3/screenshots/no-error-message.png"
      suggested_action: "Add error message display in LoginForm component"

  console_errors: 0
  network_errors: 0
```

## Output

Return E2E testing results:

```yaml
e2e_executed: true
e2e_passed: true | false
skip_reason: null | "Review mode is automated_only"

summary:
  total: 3
  passed: 2
  failed: 1
  skipped: 0
  pass_rate: 66.7
  duration_seconds: 15.2

issues:
  - id: "E2E-001"
    severity: HIGH | MEDIUM | LOW
    type: "functionality" | "ui" | "performance" | "error_handling"
    finding: string
    expected: string
    actual: string
    evidence:
      screenshots: [paths]
      logs: [paths]
    suggested_action: string
    owner: "dev"

console_errors_found: false
network_errors_found: false

evidence_directory: "docs/qa/evidence/{story_id}/"
```

## Integration Notes

- Uses MCP tools which must be available in the environment
- Falls back gracefully if MCP tools unavailable (use Bash alternatives)
- Evidence is saved to project directory for persistence
- Issues are formatted for inclusion in Gate file
- Console and network errors are automatic blockers
