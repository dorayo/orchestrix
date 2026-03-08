# qa-smoke-test

Execute a final smoke test after all Stories in an Epic are completed.

## Purpose

Verify the complete user experience for an Epic's feature set works end-to-end.
This is the final quality gate before an Epic is considered production-ready.

**CRITICAL**: Every execution of this task MUST produce a smoke test report at
`docs/qa/evidence/smoke-test-epic-{epic_id}.md` regardless of outcome (PASS, FAIL, or SKIPPED).
Use template: `templates/qa-smoke-test-report-tmpl.yaml`.

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
3. Build the story inventory table (story_id, title, status) for the report

**If any story is NOT Done**:
- Log: "Epic {epic_id} not complete. Stories not Done: {list}"
- Set: `overall_result = SKIPPED`, `skip_reason = 'epic_incomplete'`
- **GOTO Step 5** (generate report with SKIPPED status)
- Do NOT return early. The report MUST still be generated.

### Step 1: Run Full Regression Suite

Execute all E2E tests for this epic:

```bash
npx playwright test tests/e2e/story-{epic_id}.*.spec.ts --reporter=json
```

Record results:

```yaml
regression:
  executed: true | false  # false if no test files found
  passed: true | false
  tests_total: {count}
  tests_failed: {count}
  failed_details: [{test_name, error_message}]  # Empty array if all pass
```

**If no test files exist**: Set `regression.executed = false` and proceed to Step 2.

### Step 2: Execute Core User Journeys

Identify the Epic's primary user journeys by reading the PRD or Epic description.

For each core journey:

1. **Start from clean state** (clear cookies, fresh session)
2. **Execute the complete flow** using MCP browser tools
3. **Verify each step** produces expected output
4. **Record step-level results**: action, expected, actual, result (PASS/FAIL)
5. **Check browser console** for zero errors
6. **Check network requests** for zero failures
7. **Capture final state screenshot** and save to `docs/qa/evidence/smoke-test-epic-{epic_id}/`

### Step 3: Verify Cross-Cutting Concerns

Check each concern and record result + detail:

| Concern | Verification Method | Record Fields |
|---------|---------------------|---------------|
| **Console Errors** | Check browser console for any `error` level messages | result: PASS/FAIL, detail: count or "None" |
| **Network Failures** | Check for failed XHR/Fetch requests (non-2xx responses) | result: PASS/FAIL, detail: count or "None" |
| **Visual Consistency** | Take full-page screenshot, verify no layout breaks | result: PASS/FAIL, detail: description |
| **Performance** | Verify page load < 3 seconds (no spinner stuck) | result: PASS/FAIL, detail: load time |
| **Auth Flow** | If applicable, verify login -> action -> logout cycle | result: PASS/FAIL/N_A, detail: description |

### Step 4: Determine Overall Result

```yaml
decision_logic:
  if: regression.passed == false OR any journey failed OR any cross-cutting FAIL with severity >= HIGH
  then: overall_result = FAIL
  else_if: any cross-cutting FAIL with severity < HIGH
  then: overall_result = PASS  # with noted concerns
  else: overall_result = PASS

confidence_logic:
  HIGH: All journeys pass, no cross-cutting failures, regression 100%
  MEDIUM: All journeys pass, minor cross-cutting issues OR regression not executed
  LOW: Any journey failure OR regression failures
```

Compile the issues list from all steps:

```yaml
issues:
  - issue_id: 'SMOKE-{epic_id}-{SEQ}'
    severity: CRITICAL | HIGH | MEDIUM | LOW
    finding: '{description}'
    journey: '{journey_name or N/A}'
    suggested_action: '{recommendation}'
```

### Step 5: Generate Smoke Test Report (MANDATORY)

**This step executes in ALL cases: PASS, FAIL, or SKIPPED.**

1. Create the evidence directory:

```bash
mkdir -p docs/qa/evidence
```

2. Generate the report file at `docs/qa/evidence/smoke-test-epic-{epic_id}.md`
   using the template `templates/qa-smoke-test-report-tmpl.yaml`.

3. Populate the report using data collected from all preceding steps:

**When overall_result is SKIPPED**:
- Render sections: header, epic_completeness, skipped_section
- Set confidence_level = N/A
- Set recommendation_text = "Epic {epic_id} is not ready for smoke testing. Complete all stories first."

**When overall_result is PASS or FAIL**:
- Render sections: header, epic_completeness, regression_suite, core_journeys, cross_cutting, issues, evidence_files, recommendation
- For PASS: recommendation_text = "Epic {epic_id} is production-ready."
- For FAIL: recommendation_text = "Epic {epic_id} has {N} issues to resolve before production release."

4. If any screenshots or logs were captured during testing, list them in the
   Evidence Files section with their relative paths and descriptions.

5. Log the report path: "Smoke test report generated: docs/qa/evidence/smoke-test-epic-{epic_id}.md"

## Output

```yaml
smoke_test_result:
  executed: true | false  # false when SKIPPED
  epic_id: '{epic}'
  overall: PASS | FAIL | SKIPPED
  confidence_level: HIGH | MEDIUM | LOW | N/A
  issues: []
  recommendation: "Epic {epic_id} is production-ready" | "Epic {epic_id} has {N} issues to resolve" | "Epic {epic_id} is not ready for smoke testing"
  report_path: "docs/qa/evidence/smoke-test-epic-{epic_id}.md"
```

**INVARIANT**: The `report_path` field is ALWAYS populated. The file at that path
ALWAYS exists after this task completes, regardless of the value of `overall`.

## Trigger Conditions

This task should be executed:
1. **Automatically** when the last Story in an Epic reaches Status = Done
2. **Manually** via PM or SM request: `QA *smoke-test {epic_id}`
