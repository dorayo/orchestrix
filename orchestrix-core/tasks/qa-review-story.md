# qa-review-story

Test-based quality review with risk-aware E2E testing and evidence collection.

## Purpose

Execute real tests against the running application to verify story implementation.
Uses risk-based approach to determine testing depth, from automated-only for
low-risk stories to full E2E testing for high-risk ones.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md'
```

---

## Step 0: Idempotency Check (MANDATORY - Fast Exit to Save Tokens)

**Purpose**: Prevent re-reviewing already passed stories

**Locate Story File** (⚠️ MUST use Glob - filenames include title slug):

> **NEVER** attempt to Read directly with `{story_id}.md` - this will fail.
> Story files are named `{story_id}.{title-slug}.md` (e.g., `3.2.user-login.md`)

1. **Use Glob tool FIRST** with pattern: `{devStoryLocation}/{story_id}.*.md`
   - Example: For story_id `3.2`, pattern is `docs/stories/3.2.*.md`
2. **Then Read** the exact file path returned by Glob

**Extract Status**: !include tasks/util-extract-story-status.md

**Check Status and Output Appropriate Message**:

Use template: `{root}/templates/qa-idempotency-messages.yaml`

- **If status = "Done"**: Output `already_done` message -> **HALT**
- **If status = "Approved"**: Execute **Status Auto-Recovery** (see Step 0.5)
  - If recovery succeeds: Continue to Validation
  - If recovery fails: Output `not_started` message -> **HALT**
- **If status = "AwaitingTestDesign"**: Output `needs_test_design` message -> **HALT**
- **If status = "InProgress"**: Execute **Status Auto-Recovery** (see below)
  - If recovery succeeds: Continue to Validation
  - If recovery fails: Output `in_progress` message -> **HALT**
- **If status = "AwaitingArchReview"**: Output `needs_arch_review` message -> **HALT**
- **If status in ["Blocked", "RequiresRevision", "Escalated"]**: Output `blocked_or_revision` message -> **HALT**

**If status = "Review"**:
- Log: "Idempotency check passed - proceeding with QA review"
- Continue to Validation

---

## Step 0.5: Status Auto-Recovery (Conditional)

**Purpose**: Recover from context compression scenarios where Dev completed work but forgot to update story status.

**Trigger**: Execute if Step 0 detected status = "InProgress" OR "Approved"

**Note**: Both statuses indicate Dev may have completed work but:
- "InProgress" = Dev started but forgot to update to Review
- "Approved" = Dev completed but forgot to update from start (extreme case)

### 0.5.1 Check Dev Completion Indicators

Look for evidence that Dev work is actually complete:

1. **Check Dev Agent Record** in story file:
   - Has "Final Summary" section? (indicates completion)
   - Has "Implementation Status: COMPLETE"?

2. **Check Dev Log** at `{devLogsLocation}/{story_id}-dev-log.md`:
   - Contains "GATE 1: PASS" or "Self-review: PASS"?
   - Contains "GATE 2: PASS" or "Completion checklist: PASS"?

3. **Check pending-handoff file** at `.orchestrix-core/runtime/pending-handoff.json`:
   - Exists and status = "pending"?
   - source_agent = "dev" and target_agent = "qa"?

### 0.5.2 Recovery Decision

**If ANY of the following is true**:
- Dev Agent Record has Final Summary
- Dev Log shows both GATEs passed
- pending-handoff.json indicates dev -> qa handoff pending

**Then AUTO-RECOVER**:
1. Log: "⚠️ [AUTO-RECOVERY] Dev work appears complete but status not updated. Recovering..."
2. Update story status: InProgress -> Review
3. Add Change Log entry:
   ```
   | {date} {time} | QA | InProgress -> Review | [AUTO-RECOVERY] Status corrected - Dev work verified complete |
   ```
4. Mark pending-handoff.json as "completed_by_auto_recovery" (if exists)
5. Continue to Validation

**Else**:
- Log: "Dev work not yet complete - cannot auto-recover"
- Output `in_progress` message -> **HALT**

---

## Validation

Execute:
```
{root}/tasks/util-validate-agent-action.md
```

Input:
```yaml
agent_id: qa
story_path: {story_path}
action: review
```

* On failure -> output error -> **HALT**
* On success -> continue

---

## Step 1: Risk Assessment

**Purpose**: Determine testing depth based on story risk level

### 1.1 Load Context for Risk Assessment

Read from Story file:
- `complexity_indicators` from metadata (if available from SM assessment)
- `security_sensitive` flag
- File List to detect `has_ui_changes` and `has_api_changes`

Read from Dev Agent Record:
- `self_review.implementation_gate_score` as `dev_gate_score`
- Test coverage information if available

### 1.2 Calculate Risk Level

Execute `make-decision.md`:
```yaml
decision_type: qa-risk-level
context:
  complexity_count: {count from story metadata, default 2}
  security_sensitive: {from story metadata, default false}
  dev_gate_score: {from Dev Agent Record, default 95}
  has_ui_changes: {detected from File List}
  has_api_changes: {detected from File List}
  test_coverage_level: {from Dev Agent Record, default 'medium'}
```

**Store result**:
```yaml
risk_level: LOW | MEDIUM | HIGH
review_mode: automated_only | automated_plus_spot_check | full_testing
skip_e2e: true | false
```

### 1.3 Initialize Review Round

1. Read/update `review_round` in Story `QA Review Metadata`:
   - If missing/0: Set to 1
   - Else: Increment by 1
2. If Round >= 4: STOP, prompt user (Accept/Escalate/Continue), exit

---

## Step 2: Project Type Detection

**Purpose**: Determine how to test this project (web, CLI, API, etc.)

Execute: `{root}/tasks/util-detect-project-type.md`

**Store result**:
```yaml
project_type:
  type: web_frontend | web_backend | cli_tool | fullstack | library
  subtype: next | express | etc.

test_strategy:
  primary_tool: playwright_mcp | bash | bash_curl | automated_tests_only
  requires_environment: true | false
  startup_command: "npm run dev"
  expected_port: 3000
```

---

## Step 3: Environment Setup

**Purpose**: Start the application server for testing

**Skip condition**: If `test_strategy.requires_environment == false`, skip to Step 4.

Execute: `{root}/tasks/qa-environment-setup.md`

Input:
```yaml
project_type: {from Step 2}
test_strategy: {from Step 2}
story_id: {story_id}
```

**On failure**: HALT with error message. Environment must be running for E2E tests.

**Store result**:
```yaml
environment_ready: true
environment_url: "http://localhost:3000"
process_ids: [12345]
```

---

## Step 3.5: Database Migration Verification (Conditional)

**Purpose**: Verify database migrations are executed before running tests.

**Skip Condition**: If no database-related files in story's File List, skip to Step 4.

**Detection**: Check story File List for patterns:
- `**/migrations/**`
- `**/*.migration.*`
- `**/*.entity.ts`
- `**/*.model.ts`
- `**/schema.prisma`
- `**/schema.rb`

**If Database Files Detected**:

Execute: `{root}/tasks/validate-database-migration.md`

Input:
```yaml
story_id: {story_id}
story_path: {story_path}
mode: verify_only  # QA does not execute migrations, only verifies status
```

**Store result**:
```yaml
migration_verification:
  schema_changes_detected: true | false
  migrations_executed: true | false
  pending_migrations: []
  verification_status: PASS | FAIL
```

**On FAIL** (`migration_verification.verification_status = FAIL`):
- Record as HIGH severity issue
- Log: `Pending migrations detected: {pending_migrations}`
- Skip to Step 8 (Environment Cleanup)
- Gate will be set to FAIL in Step 7

**On PASS** or **Skip**:
- Proceed to Step 4

---

## Step 4: Automated Test Evidence Verification

**Purpose**: Verify Dev has executed automated tests successfully. Do NOT re-run tests.

**Rationale**: Dev has already run unit/integration tests. QA verifies evidence exists rather than duplicating execution.

### 4.1 Locate Evidence Sources

Check the following locations for test evidence:

```yaml
evidence_sources:
  - path: '{devLogsLocation}/{story_id}-dev-log.md'
    section: 'Test Results'
  - path: '{story_path}'
    section: 'Dev Agent Record.self_review'
  - path: 'CI pipeline logs (if available)'
```

### 4.2 Extract Test Evidence

From Dev Log or Story file, extract:

```yaml
automated_tests:
  evidence_found: true | false
  source: 'dev-log' | 'story' | 'ci'
  passed: true | false
  total: {from evidence}
  passed_count: {from evidence}
  failed_count: {from evidence}
  pass_rate: {from evidence}
  coverage_percentage: {from evidence, if available}
  evidence_timestamp: {when tests were run}
```

### 4.3 Evidence Validation

| Condition | Result | Action |
|-----------|--------|--------|
| Evidence found AND passed = true | PASS | Continue to Step 5 |
| Evidence found AND passed = false | FAIL | Record HIGH severity issue, skip to Step 7 |
| Evidence NOT found | FAIL | Record HIGH severity issue: "No test evidence found", skip to Step 7 |

**Store result for Step 7**:
```yaml
automated_tests:
  verification_method: 'evidence_check'
  evidence_found: true | false
  passed: true | false
  pass_rate: {percentage}
  issues: [] # populated if evidence missing or tests failed
```

---

## Step 5: E2E Testing (Conditional)

**Purpose**: Execute end-to-end tests based on risk level

**Skip condition**: If `review_mode == "automated_only"`, skip to Step 7.

Execute: `{root}/tasks/qa-e2e-testing.md`

Input:
```yaml
story_id: {story_id}
review_mode: {from Step 1}
project_type: {from Step 2}
environment_url: {from Step 3}
story_path: {story_path}
test_design_path: {glob "{qa.qaLocation}/assessments/{story_id}-test-design-*.md", use latest if multiple}
```

**Store result**:
```yaml
e2e_tests:
  executed: true
  passed: true | false
  skipped: false
  scenarios_tested: 5
  scenarios_passed: 4
  scenarios_failed: 1
  console_errors_found: false
  network_errors_found: false
  issues: [{id, severity, finding, evidence}]
```

---

## Step 5.5: Blind Spot Verification

**Purpose**: Verify implementation handles blind spot scenarios identified in test-design. This is QA's unique value - covering Dev's blind spots.

**Load**: `{root}/data/blind-spot-categories.yaml`

### 5.5.1 Load Blind Spot Scenarios from Test Design

**Locate test design file**:
```
{qa.qaLocation}/assessments/{story_id}-test-design-*.md
```

**Extract**: All scenarios with `[BLIND-SPOT]` tag

```yaml
blind_spot_scenarios:
  - id: '{story_id}-BLIND-BOUNDARY-001'
    category: 'BOUNDARY'
    check_point_ref: 'BOUNDARY-001'
    description: 'Null email input'
  - id: '{story_id}-BLIND-ERROR-001'
    category: 'ERROR'
    check_point_ref: 'ERROR-001'
    description: 'API timeout handling'
```

### 5.5.2 Verify Implementation Coverage

For each blind spot scenario:

**Check 1: Code Handling Exists**

Search implementation files for handling logic:

| Category | Search Patterns |
|----------|----------------|
| BOUNDARY | null check, empty check, length validation, type guard |
| ERROR | try-catch, error handler, timeout config, retry logic |
| FLOW | cancel handler, duplicate check, session validation |
| CONCURRENCY | lock, mutex, transaction, optimistic locking |
| DATA | rollback, cascade, foreign key check |
| RESOURCE | finally, defer, close(), dispose() |

**Check 2: Test Coverage Exists**

Search test files for corresponding test case:

```
grep -r "{scenario.description}" {test_files}
```

### 5.5.3 Record Verification Results

For each blind spot scenario:

```yaml
blind_spot_verification:
  scenario_id: '{id}'
  code_handling_found: true | false
  code_location: '{file}:{line}' | null
  test_coverage_found: true | false
  test_location: '{file}:{line}' | null
  status: COVERED | MISSING_CODE | MISSING_TEST | MISSING_BOTH
```

### 5.5.4 Generate Issues

**Issue severity mapping**:

| Status | Severity | Issue Description |
|--------|----------|-------------------|
| MISSING_BOTH | HIGH | "Blind spot not handled: {category} - {description}" |
| MISSING_CODE | HIGH | "No handling logic for: {category} - {description}" |
| MISSING_TEST | MEDIUM | "No test coverage for: {category} - {description}" |
| COVERED | - | No issue |

**Store result**:
```yaml
blind_spot_verification:
  total_scenarios: {count}
  covered: {count}
  missing_code: {count}
  missing_test: {count}
  missing_both: {count}
  coverage_rate: {percentage}
  issues: [{severity, category, description, recommendation}]
```

---

## Step 6: Evidence Collection

**Purpose**: Organize all test evidence for the Gate file

**Skip condition**: If no issues found in Steps 4, 5, and 5.5, skip to Step 7.

Execute: `{root}/tasks/qa-collect-evidence.md`

Input:
```yaml
story_id: {story_id}
issues: {collected from Steps 4, 5, and 5.5}
```

**Store result**:
```yaml
evidence:
  directory: "docs/qa/evidence/{story_id}/"
  files_collected: 5
  issues_with_evidence: [{issue_id, screenshots, logs, reproduction_steps}]
```

---

## Step 7: Gate Decision

**Purpose**: Determine PASS/FAIL/CONCERNS based on test results

### 7.1 Prepare Decision Context

Compile test results:
```yaml
# Step 4: Automated Test Evidence
automated_tests_passed: {from Step 4}
automated_tests_evidence_found: {from Step 4}

# Step 5: E2E Testing
e2e_tests_passed: {from Step 5, or null if skipped}
e2e_tests_skipped: {true if review_mode == automated_only}
console_errors_found: {from Step 5}
network_errors_found: {from Step 5}

# Step 5.5: Blind Spot Verification
blind_spot_coverage_rate: {from Step 5.5}
blind_spot_missing_code: {count from Step 5.5}
blind_spot_missing_test: {count from Step 5.5}

# Aggregated Issues
issues_by_severity:
  critical: {count}
  high: {count}
  medium: {count}
  low: {count}

review_round: {current round}
review_mode: {from Step 1}
```

### 7.2 Execute Gate Decision

Execute `make-decision.md`:
```yaml
decision_type: qa-gate-decision
context: {prepared above}
```

**Store result**:
```yaml
gate_result: PASS | FAIL | CONCERNS
reasoning: "..."
next_status: Done | InProgress | Escalated
next_action: "mark_story_complete" | "handoff_to_dev_fix" | etc.
```

### 7.3 ⚠️ MANDATORY: Register Pending HANDOFF

> **CRITICAL**: This step MUST be executed immediately after Gate Decision.
> Context compression may cause you to forget the final HANDOFF message.
> This fallback file ensures workflow continuity.

**Determine HANDOFF target based on gate_result**:

| gate_result | next_status | target_agent | command |
|-------------|-------------|--------------|---------|
| PASS | Done | sm | *draft |
| FAIL/CONCERNS | InProgress | dev | *apply-qa-fixes {story_id} |
| any | Escalated | architect | *review-escalation {story_id} |

**Action**: Use Write tool to create file:

**File path**: `{root}/runtime/pending-handoff.json`

**Content** (replace placeholders with actual values):
```json
{
  "source_agent": "qa",
  "target_agent": "{determined_target}",
  "command": "{determined_command}",
  "story_id": "{story_id}",
  "task_description": "QA review for Story {story_id}",
  "gate_result": "{gate_result}",
  "registered_at": "{current_ISO_timestamp}",
  "status": "pending"
}
```

**Verify**: Read file to confirm creation, then output:
```
[HANDOFF-REGISTERED] qa -> {target_agent}: {command}
```

⛔ **HALT if file creation fails** - workflow cannot continue without fallback.

---

## Step 8: Environment and Test Runner Cleanup

**Purpose**: Stop any processes started in Step 3 and clean up orphaned test runners

**Always execute** (even if previous steps failed)

### 8.1 Environment Cleanup

Execute: `{root}/tasks/qa-environment-cleanup.md`

Input:
```yaml
story_id: {story_id}
```

### 8.2 Test Runner Cleanup

Clean up any orphaned test runner processes that may have been left behind:

```bash
# Test runner cleanup
echo "Cleaning up test runner processes..."

# Check for story-specific tracking file
PID_FILE="/tmp/test-runner-${STORY_ID}.pid"
if [ -f "$PID_FILE" ]; then
  TRACKED_PID=$(cat "$PID_FILE")
  if [ -n "$TRACKED_PID" ] && kill -0 "$TRACKED_PID" 2>/dev/null; then
    echo "  Terminating tracked test process: $TRACKED_PID"
    kill -TERM $TRACKED_PID 2>/dev/null
    sleep 2
    kill -0 $TRACKED_PID 2>/dev/null && kill -9 $TRACKED_PID 2>/dev/null
  fi
  rm -f "$PID_FILE"
fi

# Kill any test runner processes running longer than 10 minutes
TEST_RUNNERS=("vitest" "jest" "mocha" "playwright" "cypress")
THRESHOLD=600  # 10 minutes in seconds

for RUNNER in "${TEST_RUNNERS[@]}"; do
  PIDS=$(pgrep -f "$RUNNER" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
      ETIME=$(ps -p $PID -o etimes= 2>/dev/null | tr -d ' ' || echo "0")
      if [ "$ETIME" -gt "$THRESHOLD" ]; then
        echo "  Killing long-running $RUNNER process: PID=$PID (${ETIME}s)"
        kill -TERM $PID 2>/dev/null
        sleep 1
        kill -0 $PID 2>/dev/null && kill -9 $PID 2>/dev/null
        pkill -P $PID 2>/dev/null || true
      fi
    done
  fi
done

# Cleanup temp files
rm -f /tmp/test-output-${STORY_ID}*.log 2>/dev/null || true
rm -f /tmp/vitest-results*.json 2>/dev/null || true
rm -f /tmp/jest-results*.json 2>/dev/null || true

echo "Test runner cleanup complete"
```

Log cleanup result but do not block on failures.

---

## Step 9: Output and Handoff

### 9.1 Update Story - QA Review Section

Update or create `## QA Review` section in Story with minimal info:

```markdown
## QA Review

- **Round**: {{review_round}}
- **Risk Level**: {{risk_level}}
- **Review Mode**: {{review_mode}}
- **Gate**: {{gate_result}}
- **Tests**: {{automated_passed}}/{{automated_total}} automated, {{e2e_scenarios_passed}}/{{e2e_scenarios_tested}} E2E
- **Blind Spots**: {{blind_spot_covered}}/{{blind_spot_total}} covered ({{blind_spot_coverage_rate}}%)
- **Issues**: {{critical_count}} critical / {{high_count}} high / {{medium_count}} medium
- **Gate File**: `docs/qa/gates/{{epic}}.{{story}}-{{slug}}.yml`
- **Evidence**: `docs/qa/evidence/{{story_id}}/` (if issues found)
```

### 9.2 Create Gate File

**Template**: `{root}/templates/qa-gate-tmpl.yaml`
**Path**: `qa.qaLocation/gates/{epic}.{story}-{slug}.yml`

Include all required fields plus new test_results and evidence sections.

### 9.3 Update Story Status

**Validate Status Transition**:
Execute: `{root}/tasks/util-validate-status-transition.md`

Input:
```yaml
story_path: {story_path}
current_status: Review
target_status: {from gate decision}
agent_id: qa
```

If validation PASSES, update Story Status field.

### 9.4 Update Change Log

Add table entry:
```
| {{date}} {{time}} | QA | Review -> {{next_status}} | Round {{round}}, Gate: {{gate}}, Tests: {{pass_rate}}% |
```

### 9.5 DETERMINE POST-REVIEW WORKFLOW (REQUIRED - Always Execute)

**9.5.1. Execute Post-Review Decision**:

Use `make-decision.md` to determine next actions:
```yaml
decision_type: qa-post-review-workflow
context:
  gate_result: {from Step 7 gate file}
  final_status: {from Step 9.3 status field}
  review_round: {current_round}
  issues_by_severity:
    critical: {critical_count}
    high: {high_count}
    medium: {medium_count}
    low: {low_count}
```

**Store decision result for Step 9.7 handoff**:
- `workflow_action` (e.g., finalize_commit, handoff_dev, escalate_architect)
- `requires_git_commit` (boolean)
- `handoff_target` (e.g., SM, dev, architect)
- `reasoning` (explanation of the decision)
- `next_command` (command to execute)

**9.5.2. Execute Git Commit (MANDATORY - Always Execute)**:

**ALWAYS execute finalize-story-commit.md regardless of decision**:

Execute `finalize-story-commit.md` task with `story_id` parameter.

The task will internally verify prerequisites (Step 1):
- If Status = Done AND Gate = PASS -> Execute commit
- Otherwise -> Skip with informative message

This task will:
- Verify prerequisites (Status=Done, Gate=PASS)
- Collect commit metadata from Story, Gate, and Dev Agent Record
- Stage all changes with `git add -A` (if prerequisites met)
- Create conventional commit with proper formatting
- Verify commit succeeded and capture commit hash
- Update Story Change Log with commit entry
- Return commit result (success with hash OR skip reason OR error message)

**Store commit result** for Step 9.7 handoff:
- If succeeded: `commit_hash` and `commit_message`
- If skipped: `skip_reason` (e.g., "Status not Done" or "Gate not PASS")
- If failed: `commit_error`

### 9.7 OUTPUT HANDOFF MESSAGE (REQUIRED)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: Output the HANDOFF message as the **LAST LINE** of your response.
The hook script will automatically detect it and route to the target agent.

---

### Pre-Handoff Verification

Before proceeding, verify Step 9.6 was executed:

- **Check commit_result exists** (not empty)
  - If `commit_result` is empty/missing:
    - ERROR: Step 9.6 was not executed
    - Go back to Step 9.6 and execute finalize-story-commit.md
    - Do NOT proceed until commit_result is populated

---

### Step 9.7.1: Output Human-Readable Handoff Message

Based on workflow state, output ONE of the following messages:

#### Scenario A: Architecture Escalation
```
🚨 ARCHITECTURE ESCALATION REQUIRED
Story: {story_id} | Status: Escalated
Issues: {architecture_issues}

🎯 HANDOFF TO architect: *review-escalation {story_id}
```

#### Scenario B: Gate PASS + Status Done + Commit Success
```
✅ STORY {story_id} DONE
Gate: PASS | Commit: {commit_hash}
Tests: {pass_rate}% passed

🎯 HANDOFF TO sm: *draft
```

#### Scenario C: Gate PASS + Status Done + Commit Failed
```
⚠️ STORY {story_id} PASSED QA - COMMIT FAILED
Error: {commit_error}

🎯 HANDOFF TO qa: *finalize-commit {story_id}
```

#### Scenario D: Gate CONCERNS or FAIL (Issues Found)
```
❌ QA REVIEW - ISSUES FOUND
Story: {story_id} | Gate: {gate_result}
Issues: {critical_count} critical / {high_count} high

🎯 HANDOFF TO dev: *apply-qa-fixes {story_id}
```

#### Scenario E: Low Risk - Automated Only Pass
```
✅ STORY {story_id} DONE (Low Risk)
Gate: PASS | Tests: {pass_rate}%

🎯 HANDOFF TO sm: *draft
```

**STOP**: The `🎯 HANDOFF TO` line must be your FINAL output. Hook handles the rest.

---

## Summary of Workflow

| Step | Name | Purpose |
|------|------|---------|
| 0 | Idempotency Check | Skip already-done stories |
| 1 | Risk Assessment | Determine testing depth |
| 2 | Project Type Detection | Choose testing tools |
| 3 | Environment Setup | Start application |
| 3.5 | Migration Verification | Verify DB migrations executed |
| 4 | Automated Test Evidence | Verify Dev test results (no re-run) |
| 5 | E2E Testing | Execute user flows (risk-based) |
| 5.5 | Blind Spot Verification | Check Dev blind spots coverage |
| 6 | Evidence Collection | Capture screenshots/logs |
| 7 | Gate Decision | PASS/FAIL/CONCERNS |
| 8 | Environment Cleanup | Stop processes |
| 9 | Output & Handoff | Update story, commit, handoff |

## Key Principles

1. **Trust Dev evidence**: Verify test results exist, do NOT re-run automated tests
2. **Risk-aware E2E**: Low-risk = skip, Medium = spot check, High = full testing
3. **Blind spot focus**: QA's unique value is covering what Dev missed
4. **Evidence-driven**: Issues include screenshots and reproduction steps
5. **User perspective**: E2E tests verify real user journeys
6. **Clean environment**: Always cleanup, even on failure
