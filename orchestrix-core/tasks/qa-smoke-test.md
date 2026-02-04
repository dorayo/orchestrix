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

| Concern | Verification Method |
|---------|-------------------|
| **Console Errors** | Check browser console for any `error` level messages |
| **Network Failures** | Check for failed XHR/Fetch requests (non-2xx responses) |
| **Visual Consistency** | Take full-page screenshot, verify no layout breaks |
| **Performance** | Verify page load < 3 seconds (no spinner stuck) |
| **Auth Flow** | If applicable, verify login → action → logout cycle |

### Step 4: Record Results

```yaml
smoke_test:
  epic_id: '{epic}'
  stories_verified: {count}
  regression_suite:
    executed: true | false
    passed: true | false
    tests_total: {count}
    tests_failed: {count}
  core_journeys:
    total: {count}
    passed: {count}
    failed: {count}
  cross_cutting:
    console_errors: {count}
    network_failures: {count}
    performance_ok: true | false
  overall: PASS | FAIL
  issues: [{severity, finding, evidence, journey}]
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
