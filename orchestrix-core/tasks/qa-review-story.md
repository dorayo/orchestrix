# qa-review-story

## CRITICAL EXECUTION CONTRACT - DO NOT COMPRESS

The following rules MUST survive context compression:

1. **SEQUENTIAL EXECUTION**: Follow Steps 0 → 0.2 → 0.3 → 0.1 → 0.5 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 IN ORDER. Do NOT skip steps. Do NOT freestyle or combine steps. Do NOT stop after Gate Decision — Steps 8-9 are MANDATORY.
2. HANDOFF message is MANDATORY - task is INVALID without it
3. Last line of output MUST be: 🎯 HANDOFF TO {agent}: *{command} {args}
4. If you are unsure whether you already output HANDOFF → output it again
5. Before ending response, self-check: "Did I output 🎯 HANDOFF TO?"
6. After EVERY "Store result" in Steps 1-6, IMMEDIATELY write results to checkpoint file on disk. Context memory is volatile; disk is permanent.
7. Checkpoint path: `{qa.qaLocation}/checkpoints/{story_id}/step-{N}.yaml` — one file per step.

**Gate Decision is NOT the end of this task.** After Gate Decision (Step 7), you MUST continue:
- Step 8: Environment Cleanup
- Step 9: Story updates, git commit, and HANDOFF output

Violation of rules 1-5 = broken automation pipeline. There is no valid completion without HANDOFF.
Violation of rules 6-7 = wasted tokens on self-retry (all test work must be re-executed).

---

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

## Checkpoint Configuration

```yaml
checkpoint_dir: '{qa.qaLocation}/checkpoints/{story_id}'
# Each step writes its results to: {checkpoint_dir}/step-{N}.yaml
# On self-retry resume, checkpoint files are loaded and execution skips to Step 7
# Cleaned up after successful HANDOFF in Step 9.7
```

**Dual-Write Rule**: After EVERY `**Store result**` block in Steps 1-6, IMMEDIATELY execute a Write tool call to persist that result to `{checkpoint_dir}/step-{step_number}.yaml`. This is non-negotiable — each step's write instruction is co-located with its Store result so it cannot be separated by compression.

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

## Step 0.2: Pre-Register Pending HANDOFF (Anti-Compression Safety Net)

**Purpose**: Register pending-handoff early so fallback exists even if later steps are compressed away.

**Check for tmux automation marker**:

Glob: `{root}/runtime/tmux-automation-active`

**If file NOT FOUND** → **Skip to Step 0.1**

**If file EXISTS**:

Write `{root}/runtime/pending-handoff.json` with **safe default values** (qa + review = retry self):

```json
{
  "source_agent": "qa",
  "target_agent": "qa",
  "command": "*review {story_id}",
  "story_id": "{story_id}",
  "task_description": "QA review for Story {story_id} (fallback retry)",
  "gate_result": "PENDING",
  "registered_at": "{current_ISO_timestamp}",
  "status": "pending"
}
```

Log: `[PRE-REGISTERED] pending-handoff.json with safe defaults (qa/review retry, will be updated in Step 7.3)`

> **Why QA self-retry as default?**
> If compression kills Steps 7-9, the gate decision was never made — we don't know PASS or FAIL.
> - Cannot route to dev: Story status is still `Review`, Dev cannot modify `Review` stories (permission denied → HALT → pipeline stuck).
> - Cannot route to sm: May skip a failing story into the next draft (dangerous).
> - Route to QA self: Story stays in `Review` (valid for QA), QA re-executes review from scratch.
>   Step 0 idempotency check will NOT block because status is still `Review`.
>   Worst case: one redundant review cycle. Best case: review completes normally this time.
> Step 7.3 will overwrite this with the actual gate_result and correct target_agent.

---

## Step 0.3: Checkpoint Resume Detection (Anti-Compression Recovery)

**Purpose**: If this is a self-retry after compression failure, detect persisted checkpoint data and skip directly to Gate Decision (Step 7), avoiding re-execution of all expensive test steps.

**Check**: Glob `{qa.qaLocation}/checkpoints/{story_id}/step-*.yaml`

**If NO checkpoint files found** → Continue to Step 0.1

**If checkpoint files found**:

1. Log: `⚡ [CHECKPOINT-RESUME] Found {N} checkpoint files. Loading and skipping to Step 7.`
2. Read each checkpoint file and restore context variables:

| File | Restores |
|------|----------|
| `step-1.yaml` | risk_level, review_mode, skip_e2e, review_round |
| `step-2.yaml` | project_type, test_strategy |
| `step-4.yaml` | automated_tests |
| `step-4.5.yaml` | task_checkbox_verification |
| `step-4.6.yaml` | ac_coverage |
| `step-4.7.yaml` | regression |
| `step-5.yaml` | e2e_tests |
| `step-5.5.yaml` | blind_spot_verification |
| `step-6.yaml` | evidence |

3. For any missing checkpoint file, use safe defaults:
```yaml
# Missing test step defaults (assume not executed)
regression: { executed: false, passed: true, tests_total: 0, tests_failed: 0, issues: [] }
e2e_tests: { executed: false, skipped: true, issues: [] }
blind_spot_verification: { total_scenarios: 0, covered: 0, coverage_rate: 0, issues: [] }
evidence: { files_collected: 0, issues_with_evidence: [] }
```

4. Set `review_mode_type: checkpoint_resume`
5. **Jump directly to Step 7** (Gate Decision)

> **Why this works**: Each test step writes its checkpoint immediately after execution.
> If compression kills Steps 7-9, all test data from Steps 1-6 is already on disk.
> Self-retry loads the data and goes straight to the gate decision — zero wasted work.

---

## Step 0.1: Review Mode Detection (CRITICAL - Token Optimization)

**Purpose**: Detect if this is a re-review (Round >= 2) and switch to incremental mode to save tokens.

### 0.1.1 Load Previous Gate File

**Glob**: `{qa.qaLocation}/gates/{story_id}-*.yml`

**If Gate file NOT found**:
- Set `review_mode_type: full`
- Set `review_round: 1`
- Continue to Step 0.5

**If Gate file found**, extract:
```yaml
previous_gate:
  review_round: {from gate file}
  risk_level: {from gate file, e.g., LOW/MEDIUM/HIGH}
  review_mode: {from gate file, e.g., automated_only/full_testing}
  project_type: {from gate file test_results section}
  top_issues: [{id, severity, finding}]
  ac_coverage:
    failed_acs: [AC IDs that failed verification]
  blind_spot:
    missing_scenarios: [{id, category, description}]
  e2e:
    failed_scenarios: [{scenario_name, failure_reason}]
```

### 0.1.2 Determine Review Mode Type

| Condition | Mode | Behavior |
|-----------|------|----------|
| `review_round == 0` OR Gate not found | `full` | Execute all steps completely |
| `review_round >= 1` | `incremental` | Skip/simplify steps, focus on previous failures |

**Set**:
```yaml
review_mode_type: full | incremental
current_round: {previous_round + 1}
previous_context: {extracted from gate file}
```

**Log**:
- If `full`: "Mode: FULL REVIEW (Round 1)"
- If `incremental`: "Mode: INCREMENTAL REVIEW (Round {current_round}) - {N} previous issues to verify"

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

### INCREMENTAL MODE SKIP

**If `review_mode_type == incremental`**:
- Use cached values from `previous_context`:
  ```yaml
  risk_level: {previous_context.risk_level}
  review_mode: {previous_context.review_mode}
  ```
- Set `review_round: {current_round}` (already incremented in Step 0.1)
- Log: "⏭️ SKIP: Risk Assessment (using cached: {risk_level}, {review_mode})"
- **Jump to Step 2**

---

### 1.1 Load Context for Risk Assessment

Read from Story file:
- `complexity_indicators` from metadata (if available from SM assessment)
- `security_sensitive` flag
- File List to detect `has_ui_changes` and `has_api_changes`
- `deliverable_bindings` to detect `has_user_facing_deliverable`

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
  has_user_facing_deliverable: {from story deliverable_bindings, default false}
  test_coverage_level: {from Dev Agent Record, default 'medium'}
```

**Store result**:
```yaml
risk_level: LOW | MEDIUM | HIGH
review_mode: automated_only | automated_plus_spot_check | full_testing
skip_e2e: true | false
```

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-1.yaml`

### 1.3 Initialize Review Round

1. Read/update `review_round` in Story `QA Review Metadata`:
   - If missing/0: Set to 1
   - Else: Increment by 1
2. If Round >= 4: STOP, prompt user (Accept/Escalate/Continue), exit

---

## Step 2: Project Type Detection

**Purpose**: Determine how to test this project (web, CLI, API, etc.)

### INCREMENTAL MODE SKIP

**If `review_mode_type == incremental`**:
- Use cached values from `previous_context.project_type`
- Log: "⏭️ SKIP: Project Type Detection (using cached)"
- **Jump to Step 3**

---

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

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-2.yaml`

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

## Step 4: Independent Automated Test Execution

**Purpose**: Execute the project's automated test suite independently to verify all tests pass. QA runs tests directly rather than relying on Dev's evidence.

**Rationale**: Independent test execution catches cases where code changed after Dev's last test run, tests with weak assertions that Dev self-review missed, or environment-specific failures. This is the single highest-impact quality gate.

### 4.1 Detect Test Command

Read `orchestrix/core-config.yaml` for `project.testCommand`.

If not configured, auto-detect from project:

| Detection Method | Test Command |
|-----------------|--------------|
| `package.json` has `scripts.test` | `npm test` |
| `package.json` has `scripts.test` with vitest | `npx vitest run` |
| `deno.json` exists | `deno test -A` |
| `Cargo.toml` exists | `cargo test` |
| `go.mod` exists | `go test ./...` |
| `pyproject.toml` or `setup.py` | `pytest` |
| None detected | Record as FAIL: "No test runner detected" |

**Store**:
```yaml
test_command: '{detected command}'
test_runner_type: 'npm' | 'deno' | 'cargo' | 'go' | 'pytest' | 'unknown'
```

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
  execution_method: 'independent_execution'
  test_command: '{command used}'
  exit_code: {0 or non-zero}
  passed: {true if exit_code == 0}
  total: {parsed from output}
  passed_count: {parsed from output}
  failed_count: {parsed from output}
  skipped_count: {parsed from output}
  pass_rate: {percentage}
  execution_time_seconds: {duration}
  raw_output_summary: '{first 500 chars of output if failed}'
```

**Parsing patterns by runner**:

| Runner | Pass Pattern | Fail Pattern |
|--------|-------------|--------------|
| vitest/jest | `Tests: X passed` | `Tests: X failed` |
| deno | `ok \| X passed` | `FAILED \| X failed` |
| cargo | `test result: ok. X passed` | `test result: FAILED. X failed` |
| go | `ok` (per package) | `FAIL` |
| pytest | `X passed` | `X failed` |

If output cannot be parsed, use exit code as sole indicator: 0 = PASS, non-zero = FAIL.

### 4.4 Cross-Reference with Dev Evidence (Optional Integrity Check)

After independent execution, compare with Dev's claimed results:

| QA Result | Dev Claim | Action |
|-----------|-----------|--------|
| PASS | PASS | Consistent - no issue |
| PASS | No evidence | Record LOW issue: "Dev Log missing test evidence" |
| FAIL | PASS | Record CRITICAL issue: "Tests fail independently but Dev claimed PASS - possible code change after Dev's test run or environment difference" |
| FAIL | FAIL | Dev was honest - continue with FAIL |
| FAIL | No evidence | Record HIGH issue: "Tests fail and no Dev evidence found" |

### 4.5 Evidence Validation Decision

| Condition | Result | Action |
|-----------|--------|--------|
| Independent tests PASS (exit_code == 0) | PASS | Continue to Step 4.5 (checkbox verification) |
| Independent tests FAIL | FAIL | Record HIGH severity issue with failed test names, continue to Step 4.5 |
| No test runner found | FAIL | Record HIGH severity issue: "No automated test suite found", continue to Step 4.5 |
| Test execution timeout | FAIL | Record HIGH severity issue: "Test execution timed out", continue to Step 4.5 |

**Store result for Step 7**:
```yaml
automated_tests:
  verification_method: 'independent_execution'
  test_command: '{command}'
  exit_code: {code}
  passed: true | false
  pass_rate: {percentage}
  execution_time_seconds: {duration}
  failed_test_names: ['{test1}', '{test2}']  # if any failed
  integrity_check:
    dev_evidence_found: true | false
    dev_claimed_pass: true | false | null
    discrepancy: true | false
  issues: []
```

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-4.yaml`

---

## Step 4.5: Task Checkbox Verification

**Purpose**: Verify all Task/Subtask checkboxes are complete AND match actual deliverables. Detects cases where Dev checked boxes without completing work.

### INCREMENTAL MODE: Focus on Previous Failures

**If `review_mode_type == incremental`**:
- Only verify checkboxes that were flagged in `previous_context.top_issues` with `failure_type: checkbox_*`
- Skip full consistency verification if previous round had no checkbox issues
- Log: "⚡ INCREMENTAL: Verifying {N} previously flagged checkboxes"

---

### 4.5.1 Extract Checkbox Status

Parse `## Tasks / Subtasks` section from story file.

Categorize each checkbox:
```yaml
checkboxes:
  - text: '{raw checkbox text}'
    checked: true | false
    category: 'ac' | 'write_test' | 'implement' | 'verify' | 'integration' | 'final'
    ac_ref: '{AC number if applicable}'
```

### 4.5.2 Verify Checkbox-Deliverable Consistency

For each checkbox where `checked = true`:

**Test Checkboxes** (`category = 'write_test'`):
1. Extract AC reference from checkbox text
2. Search test files for test case matching AC keywords
3. Verify test file exists AND contains relevant assertions

| Finding | Severity | Issue |
|---------|----------|-------|
| Test file not found | HIGH | "Checkbox claims test written but no test file found for AC{N}" |
| Test exists but empty/stub | HIGH | "Test file exists but contains no assertions for AC{N}" |
| Test exists and valid | - | No issue |

**Implementation Checkboxes** (`category = 'implement'`):
1. Verify corresponding test passes (from Step 4 evidence)
2. Check implementation files exist in Dev Agent Record File List

| Finding | Severity | Issue |
|---------|----------|-------|
| Test not passing | HIGH | "Checkbox claims implementation complete but test failing for AC{N}" |
| No implementation files | HIGH | "Checkbox claims implementation complete but no files in File List for AC{N}" |

**Final Verification Checkboxes** (`category = 'final'`):
1. "All tests passing" → Cross-check with Step 4 automated_tests.passed
2. "Dev Log complete" → Verify Dev Log has Final Summary section

| Finding | Severity | Issue |
|---------|----------|-------|
| Mismatch with test evidence | CRITICAL | "Checkbox claims all tests passing but evidence shows failures" |
| Dev Log incomplete | MEDIUM | "Checkbox claims Dev Log complete but Final Summary missing" |

### 4.5.3 Check Unchecked Boxes

For each checkbox where `checked = false`:

| Category | Severity | Issue |
|----------|----------|-------|
| ac | CRITICAL | "AC{N} marked incomplete - story not ready for review" |
| write_test | CRITICAL | "Test not written for AC{N} - story not ready for review" |
| implement | CRITICAL | "Implementation not complete for AC{N} - story not ready for review" |
| final | HIGH | "Final verification step incomplete" |

### 4.5.4 Calculate Verification Result

```yaml
task_checkbox_verification:
  total_checkboxes: {count}
  checked_count: {count}
  unchecked_count: {count}
  completion_rate: {percentage}
  consistency_checks:
    total: {count of checked boxes verified}
    passed: {count matching deliverables}
    failed: {count mismatched}
    consistency_rate: {percentage}
  issues:
    critical: [{issue, checkbox_text, evidence}]
    high: [{issue, checkbox_text, evidence}]
    medium: [{issue, checkbox_text, evidence}]
```

**Decision**:

| Condition | Action |
|-----------|--------|
| Any unchecked AC/test/implement checkbox | Record CRITICAL issue, continue to Step 5 |
| Any checked box with missing deliverable | Record HIGH issue, continue to Step 5 |
| All checkboxes complete AND consistent | Continue to Step 5 |

**Note**: Task checkbox issues are aggregated into Step 7 Gate Decision. They do not independently block review but heavily weight FAIL outcome.

📎 **CHECKPOINT**: Write `task_checkbox_verification` result to `{checkpoint_dir}/step-4.5.yaml`

---

## Step 4.6: AC Coverage Verification (CRITICAL - Before Code Review)

**Purpose**: Verify EVERY Acceptance Criterion has been implemented with traceable evidence. This is QA's primary validation - ensuring Dev claims match actual deliverables.

**Rationale**: QA Report showed 5/6 issues were "AC defined but not implemented". This step catches those before they reach E2E testing.

### INCREMENTAL MODE: Verify Only Failed ACs

**If `review_mode_type == incremental`**:

1. **Load failed ACs from previous round**:
   ```yaml
   failed_acs: {previous_context.ac_coverage.failed_acs}
   ```

2. **If `failed_acs` is empty**:
   - Log: "⏭️ SKIP: AC Coverage (all ACs passed in previous round)"
   - Set `ac_coverage_result.result: PASS` (inherited)
   - **Jump to Step 5**

3. **If `failed_acs` has items**:
   - Log: "⚡ INCREMENTAL: Verifying {N} previously failed ACs: {ac_ids}"
   - Execute Steps 4.6.1-4.6.5 ONLY for ACs in `failed_acs` list
   - Skip verification for ACs not in the list

---

### 4.6.1 Load AC Traceability Data

**Locate AC Traceability Section** in Story file:

Read from `story.ac_traceability` (populated by Dev during self-review):

```yaml
expected_structure:
  - ac_id: '{AC identifier}'
    code_locations: ['file:line-range', ...]
    test_locations: ['test_file:test_name', ...]
    verification_type: 'unit_test' | 'integration_test' | 'e2e_test' | 'manual'
```

**If `ac_traceability` section is MISSING or EMPTY**:
- Record CRITICAL issue: "AC Traceability Matrix not populated by Dev"
- Status: Cannot verify implementation
- Skip to Step 4.6.5 with FAIL result

### 4.6.1.5 Placeholder Pattern Pre-Scan (MANDATORY - Before Semantic Verification)

**Purpose**: Fast-fail detection of unpopulated template defaults. Catches incomplete traceability matrices before per-AC semantic verification begins.

For EACH AC entry in `ac_traceability`, scan for these placeholder patterns:

**PLACEHOLDER DETECTION RULES**:

A `code_locations` or `test_locations` value is a **PLACEHOLDER** (not real evidence) if ANY of these is true:
- Array is empty: `[]`
- Array contains empty strings: `[""]` or `["", ""]`
- Any element is whitespace-only (matches `^\s*$`)
- Any element contains literal text: `TODO`, `FIXME`, `pending`, `TBD`
- Any element is the template default: `""  # TODO: Add file:line-range` or `""  # TODO: Add test_file:test_name`
- Any element does not contain a `:` separator (valid format requires `file:line-range` or `file:function`)

An `aspects_covered` section is **UNCHANGED FROM TEMPLATE** if ALL boolean values (`main_scenario`, `business_rules`, `data_validation`, `error_handling`) are `false`.

**Scan each AC entry**:

| Check | Condition | Severity | Issue |
|-------|-----------|----------|-------|
| code_locations placeholder | `code_locations` matches any PLACEHOLDER rule above | CRITICAL | "AC{N} code_locations contains template placeholder — Dev did not provide implementation evidence" |
| test_locations placeholder | `test_locations` matches any PLACEHOLDER rule above | HIGH | "AC{N} test_locations contains template placeholder — Dev did not provide test evidence" |
| aspects_covered unchanged | ALL `aspects_covered` flags are `false` | HIGH | "AC{N} aspects_covered flags are all false — unchanged from template defaults" |
| combined signal | code_locations is PLACEHOLDER AND aspects_covered all `false` | CRITICAL | "AC{N} traceability entry is entirely template default — never populated by Dev" |

**Pre-Scan Result**:

```yaml
placeholder_scan:
  total_acs: {count}
  placeholder_detected: {count}
  aspects_unchanged: {count}
  clean_entries: {count}
  flagged_acs: [{ac_id, issues}]
```

**Pre-Scan Decision**:

| Condition | Action |
|-----------|--------|
| Zero placeholders AND zero unchanged aspects | PASS — continue to 4.6.2 for full semantic verification |
| Some placeholders detected | Record issues above. Skip semantic verification (Steps B/C in 4.6.2) for flagged ACs only — they are already confirmed FAIL. Continue 4.6.2 for clean ACs |
| ALL ACs are placeholders | Record CRITICAL: "AC Traceability Matrix entirely unpopulated — all entries are template defaults". Set `ac_traceability_found: false`. Skip to Step 4.6.5 with FAIL |

### 4.6.2 Verify Each AC Implementation

For EACH AC in `story.acceptance_criteria`:

**A. Check Traceability Entry Exists and Is Not Placeholder**

| Condition | Severity | Issue |
|-----------|----------|-------|
| No entry for AC in traceability matrix | CRITICAL | "AC{N} has no traceability entry — cannot verify implementation" |
| Entry exists but `code_locations` is `[]` (empty array) | CRITICAL | "AC{N} has no code locations — empty array" |
| Entry exists but `code_locations` contains only empty strings `[""]` | CRITICAL | "AC{N} code_locations is template placeholder (empty string) — not populated by Dev" |
| Entry exists but `code_locations` values contain `TODO` or `FIXME` | CRITICAL | "AC{N} code_locations contains TODO marker — not populated by Dev" |
| Entry exists but `test_locations` is `[]` or contains only `[""]` | HIGH | "AC{N} test_locations is empty or template placeholder — not populated by Dev" |
| Entry exists but `test_locations` values contain `TODO` or `FIXME` | HIGH | "AC{N} test_locations contains TODO marker — not populated by Dev" |
| Entry exists but ALL `aspects_covered` values are `false` | HIGH | "AC{N} aspects_covered unchanged from template defaults — Dev did not verify coverage" |

**CRITICAL RULE**: An AC with PLACEHOLDER `code_locations` (empty string, TODO, empty array) MUST NOT proceed to semantic verification (Steps B and C below). It is an automatic CRITICAL issue. Only ACs with real file:line-range references proceed to semantic verification.

**B. Verify Code Actually Implements AC**

For each AC with populated `code_locations`:

1. Navigate to each listed code location
2. Read the code at that location
3. **Semantic verification**: Does this code actually fulfill the AC requirement?

**Verification checklist per AC**:

| AC Aspect | How to Verify | Status |
|-----------|---------------|--------|
| Main scenario (GIVEN/WHEN/THEN) | Code handles the flow | [ ] |
| Business Rules (BR-X.x) | Rules are implemented | [ ] |
| Data Validation (if any) | Validation logic exists | [ ] |
| Error Handling | Error scenarios handled | [ ] |
| UI Interaction (if any) | Interaction logic exists | [ ] |

**Issue Detection**:

| Finding | Severity | Issue |
|---------|----------|-------|
| Code location doesn't exist | CRITICAL | "File/line {location} not found for AC{N}" |
| Code exists but doesn't implement AC | CRITICAL | "Code at {location} does not implement AC{N} requirements" |
| Business Rule not implemented | HIGH | "BR-{N}.{X} not found in implementation for AC{N}" |
| Error handling missing | HIGH | "Error scenario '{scenario}' not handled for AC{N}" |
| Data validation missing | MEDIUM | "Validation for '{field}' not implemented for AC{N}" |

**C. Verify Tests Cover AC Requirements**

For each AC with populated `test_locations`:

1. Navigate to test location
2. Verify test actually tests the AC behavior (not just "exists")
3. Check test assertions match AC requirements

| Finding | Severity | Issue |
|---------|----------|-------|
| Test location doesn't exist | HIGH | "Test file/line {location} not found for AC{N}" |
| Test exists but doesn't test AC | HIGH | "Test at {location} doesn't verify AC{N} requirements" |
| Test is stub/placeholder | CRITICAL | "Test for AC{N} is empty or stub" |
| Test asserts wrong behavior | CRITICAL | "Test for AC{N} asserts incorrect behavior" |

### 4.6.3 Cross-Reference with Dev Self-Review

Compare QA findings with Dev's self-review claims:

| Dev Claim | QA Finding | Discrepancy |
|-----------|------------|-------------|
| "AC1 implemented at service.ts:45" | Code exists but missing error handling | HIGH: "Dev claims complete but error handling missing" |
| "AC2 tested in service.test.ts" | Test exists but is stub | CRITICAL: "Dev claims tested but test is placeholder" |

**Discrepancy Detection**:

| Condition | Severity | Issue |
|-----------|----------|-------|
| Dev claims implemented, QA finds missing | CRITICAL | "Discrepancy: Dev claimed AC{N} complete but implementation missing" |
| Dev claims tested, QA finds stub | CRITICAL | "Discrepancy: Dev claimed AC{N} tested but test is stub" |
| Minor gap (partial implementation) | MAJOR | "Partial implementation: AC{N} missing {aspect}" |

### 4.6.4 Generate AC Coverage Report

```yaml
ac_coverage_verification:
  story_id: {story_id}
  verification_date: {timestamp}

  summary:
    total_acs: {count}
    fully_verified: {count}
    partially_verified: {count}
    not_verified: {count}
    coverage_rate: {percentage}  # fully_verified / total_acs

  details:
    - ac_id: AC1
      traceability_entry_found: true | false
      code_locations_verified: {count}/{total}
      test_locations_verified: {count}/{total}
      aspects_verified:
        main_scenario: true | false
        business_rules: {verified}/{total}
        data_validation: true | false | N_A
        error_handling: true | false
        ui_interaction: true | false | N_A
      status: VERIFIED | PARTIAL | MISSING
      issues: []
    # ... repeat for each AC

  discrepancies:
    - ac_id: AC{N}
      dev_claim: "..."
      qa_finding: "..."
      severity: CRITICAL | HIGH

  issues_by_severity:
    critical: [{ac_id, issue, evidence}]
    high: [{ac_id, issue, evidence}]
    medium: [{ac_id, issue, recommendation}]
```

### 4.6.5 AC Coverage Decision

```yaml
ac_coverage_result:
  result: PASS | FAIL
  coverage_rate: {percentage}
  blocking_issues: {count of critical + high}
```

**Decision Logic**:

| Condition | Result | Action |
|-----------|--------|--------|
| coverage_rate = 100% AND zero critical AND zero high | PASS | Continue to Step 5 |
| coverage_rate ≥ 80% AND zero critical AND ≤2 high | CONCERNS | Continue with issues logged |
| coverage_rate < 80% OR any critical OR >2 high | FAIL | Skip E2E, go to Step 7 with FAIL |

**Store result for Step 7 Gate Decision**:
```yaml
ac_coverage:
  verification_method: 'traceability_verification'
  coverage_rate: {percentage}
  passed: true | false
  blocking_issues_count: {count}
  issues: [{ac_id, severity, issue, evidence}]
```

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-4.6.yaml`

---

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
story_id: {story_id}
scope: 'epic'  # Test stories within the same epic
```

### 4.7.3 Handle Regression Results

| Condition | Action |
|-----------|--------|
| All regression tests pass | Log: "Regression suite PASS ({N} tests)". Continue to Step 5 |
| Any regression test fails | Record each failure as CRITICAL issue. Continue to Step 5 |
| Regression execution fails (infra) | Record as MEDIUM issue: "Regression suite execution failed". Continue to Step 5 |

**Store result for Step 7**:
```yaml
regression:
  executed: true | false
  passed: true | false
  tests_total: {count}
  tests_failed: {count}
  issues: [{severity: CRITICAL, finding, evidence}]
```

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-4.7.yaml`

---

## Step 5: E2E Testing (Conditional)

**Purpose**: Execute end-to-end tests based on risk level

**Skip condition**: If `review_mode == "automated_only"`, skip to Step 7.

### INCREMENTAL MODE: Test Only Failed Scenarios

**If `review_mode_type == incremental`**:

1. **Load failed scenarios from previous round**:
   ```yaml
   failed_scenarios: {previous_context.e2e.failed_scenarios}
   ```

2. **If `failed_scenarios` is empty AND previous e2e.passed == true**:
   - Log: "⏭️ SKIP: E2E Testing (all scenarios passed in previous round)"
   - Set `e2e_tests.passed: true` (inherited)
   - **Jump to Step 5.5**

3. **If `failed_scenarios` has items**:
   - Log: "⚡ INCREMENTAL: Re-testing {N} previously failed scenarios"
   - Execute E2E testing ONLY for scenarios in `failed_scenarios` list
   - Pass `incremental_scenarios: {failed_scenarios}` to qa-e2e-testing.md

---

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

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-5.yaml`

---

## Step 5.5: Blind Spot Verification

**Purpose**: Verify implementation handles blind spot scenarios identified in test-design. This is QA's unique value - covering Dev's blind spots.

### INCREMENTAL MODE: Verify Only Missing Scenarios

**If `review_mode_type == incremental`**:

1. **Load missing scenarios from previous round**:
   ```yaml
   missing_scenarios: {previous_context.blind_spot.missing_scenarios}
   ```

2. **If `missing_scenarios` is empty**:
   - Log: "⏭️ SKIP: Blind Spot Verification (all covered in previous round)"
   - Set `blind_spot_verification.coverage_rate: 100` (inherited)
   - **Jump to Step 6**

3. **If `missing_scenarios` has items**:
   - Log: "⚡ INCREMENTAL: Verifying {N} previously missing blind spots"
   - Execute Steps 5.5.1-5.5.4 ONLY for scenarios in `missing_scenarios` list

---

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

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-5.5.yaml`

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

📎 **CHECKPOINT**: Write above result to `{checkpoint_dir}/step-6.yaml`

---

## Step 7: Gate Decision

**Purpose**: Determine PASS/FAIL/CONCERNS based on test results

### 7.1 Prepare Decision Context

Compile test results:
```yaml
# Step 4: Automated Test Evidence
automated_tests_passed: {from Step 4}
automated_tests_evidence_found: {from Step 4}

# Step 4.5: Task Checkbox Verification
task_checkbox_completion_rate: {from Step 4.5}
task_checkbox_consistency_rate: {from Step 4.5}
task_checkbox_unchecked_critical: {count of unchecked AC/test/implement boxes}
task_checkbox_mismatches: {count of checked boxes without matching deliverables}

# Step 4.6: AC Coverage Verification (CRITICAL)
ac_coverage_rate: {from Step 4.6}
ac_coverage_passed: {from Step 4.6}
ac_traceability_found: {true if ac_traceability section exists in story}
ac_discrepancies_count: {count of dev-claim vs qa-finding mismatches}
acs_fully_verified: {count from Step 4.6}
acs_not_verified: {count from Step 4.6}

# Step 5: E2E Testing
e2e_tests_passed: {from Step 5, or null if skipped}

# Step 4.7: Regression Testing
regression_executed: {from Step 4.7, default false}
regression_passed: {from Step 4.7, default true}
regression_failures_count: {from Step 4.7, default 0}
e2e_tests_skipped: {true if review_mode == automated_only}
console_errors_found: {from Step 5}
network_errors_found: {from Step 5}

# Step 5.5: Blind Spot Verification
blind_spot_coverage_rate: {from Step 5.5}
blind_spot_missing_code: {count from Step 5.5}
blind_spot_missing_test: {count from Step 5.5}

# Aggregated Issues (includes Step 4.5 and 4.6 issues)
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

### 7.3 Register Pending HANDOFF (Conditional - tmux only)

**Check for tmux automation marker**:

Glob: `{root}/runtime/tmux-automation-active`

**If file NOT FOUND** → **Skip to Step 8**

**If file EXISTS**:

> Prevents workflow breakage if context compression causes HANDOFF to be forgotten.

**Determine HANDOFF target based on gate_result**:

| gate_result | next_status | target_agent | command |
|-------------|-------------|--------------|---------|
| PASS | Done | sm | *draft {next_story_id} |
| FAIL/CONCERNS | InProgress | dev | *apply-qa-fixes {story_id} |
| any | Escalated | architect | *review-escalation {story_id} |

**Action**: Write `{root}/runtime/pending-handoff.json`:

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

**Verify**: Read file → Output: `[HANDOFF-REGISTERED] qa -> {target_agent}: {command}`

⛔ **HALT if** file creation failed (tmux mode requires fallback).

⚠️ REMINDER: After gate decision, you MUST still output 🎯 HANDOFF in Step 9.7. Do NOT end your response here.

---

## Step 8: Environment Cleanup

**Purpose**: Stop application server started in Step 3

**Always execute** (even if previous steps failed)

Execute: `{root}/tasks/qa-environment-cleanup.md`

Input:
```yaml
story_id: {story_id}
```

Log result. Do not block on failures.

⚠️ REMINDER: Cleanup done. Proceed to Step 9 for MANDATORY HANDOFF output. Do NOT end your response without 🎯 HANDOFF.

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

**CRITICAL: Populate `incremental_context` for Round 2+ optimization**:

```yaml
incremental_context:
  # Cache stable values (never change after Round 1)
  cached_risk_level: {risk_level from Step 1}
  cached_review_mode: {review_mode from Step 1}
  cached_project_type: {project_type.type from Step 2}

  # Failed items for next round (extract from current issues)
  failed_acs: [
    # Extract AC IDs from ac_coverage.issues where status != VERIFIED
    # Example: ["AC1", "AC3"]
  ]
  failed_e2e_scenarios: [
    # Extract from e2e_tests.issues
    # Example: [{scenario_name: "login_flow", failure_reason: "button unresponsive"}]
  ]
  missing_blind_spots: [
    # Extract from blind_spot_verification where status != COVERED
    # Example: [{id: "BLIND-001", category: "BOUNDARY", description: "null input"}]
  ]
  checkbox_issues: [
    # Extract from task_checkbox_verification.issues
    # Example: [{checkbox_text: "Implement AC1", issue_type: "mismatch"}]
  ]
```

**Note**: If `gate_result == PASS`, set all failure arrays to empty `[]`.

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

### 9.5.3 Determine Next Story ID (Conditional - PASS + Done only)

**Condition**: Execute ONLY if `gate_result == PASS` AND `final_status == Done`.

**Purpose**: Compute the next story ID so the HANDOFF to SM is explicit (e.g., `*draft 2.4` instead of bare `*draft`).

**Algorithm**:

1. Parse current `story_id` → `epic = N`, `story = M`
2. Candidate = `N.(M+1)`
3. **Check candidate exists in Epic YAML**:
   - Glob: `{prdShardedLocation}/epic-{N}-*.yaml`
   - Read the epic file, check if `stories` array contains an entry with `id: "N.(M+1)"`
4. **If candidate exists** → `next_story_id = N.(M+1)`
5. **If candidate does NOT exist** (current epic exhausted) → `next_story_id = (N+1).1`

**Examples**:
- Current `2.3`, epic 2 has story `2.4` defined → `next_story_id = 2.4`
- Current `2.3`, epic 2 has NO `2.4` → `next_story_id = 3.1`

**Store result**:
```yaml
next_story_id: '{computed}'  # e.g., '2.4' or '3.1'
```

### 9.5.5 Persist E2E Tests (Conditional)

**Condition**: Execute ONLY if ALL of the following are true:
- E2E tests were executed (not skipped)
- Gate result is PASS or CONCERNS
- Project type is web_frontend or fullstack

Execute: `{root}/tasks/qa-persist-e2e-tests.md`

Input:
```yaml
story_id: {story_id}
e2e_results: {from Step 5}
project_type: {from Step 2}
environment_url: {from Step 3}
```

Log result. Do not block on failures.

---

### 9.5.6 Epic Integration Test (Conditional)

**Condition**: Execute ONLY if ALL of the following are true:
- Gate result is PASS
- Status is Done
- At least 2 Stories in the same Epic have Status = Done

**Check**: Glob `{story_root}/{epic_id}.*.md`, count stories with Status = Done.

**If count >= 2**:

Execute: `{root}/tasks/qa-epic-integration-test.md`

Input:
```yaml
epic_id: '{epic_id}'
completed_story_id: '{story_id}'
story_root: '{devStoryLocation}'
```

**Handle results**:
- If integration PASS: Log "Epic integration: PASS ({N} scenarios)"
- If integration FAIL:
  - Do NOT change gate result (Story itself passed)
  - Record integration issues in gate file under `epic_integration` section
  - Add WARNING to handoff message: "Warning: Epic integration issues detected - see gate file"

⚠️ NEXT: Step 9.7 HANDOFF output is REQUIRED. Do NOT end your response before outputting 🎯 HANDOFF.

---

### 9.6 Final Test Process Cleanup (MANDATORY - Post-Commit)

**Purpose**: Terminate all test runner processes after git operations complete.

**Always execute** - regardless of commit result.

#### 9.6.1 Identify and Kill Test Runner Processes

```bash
#!/bin/bash
set -euo pipefail

echo "=== Final Test Process Cleanup ==="

TEST_RUNNERS=("vitest" "jest" "mocha" "playwright" "cypress" "tsx" "ts-node")
KILLED_COUNT=0

for RUNNER in "${TEST_RUNNERS[@]}"; do
  PIDS=$(pgrep -f "$RUNNER" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
      CMD=$(ps -p $PID -o args= 2>/dev/null | head -c 80 || echo "unknown")
      ETIME=$(ps -p $PID -o etimes= 2>/dev/null | tr -d ' ' || echo "0")
      echo "Found: PID=$PID RUNNER=$RUNNER RUNTIME=${ETIME}s CMD=$CMD"

      kill -TERM $PID 2>/dev/null || true
      sleep 1

      if kill -0 $PID 2>/dev/null; then
        kill -9 $PID 2>/dev/null || true
        echo "  Force killed: PID=$PID"
      else
        echo "  Terminated: PID=$PID"
      fi

      pkill -P $PID 2>/dev/null || true
      KILLED_COUNT=$((KILLED_COUNT + 1))
    done
  fi
done

echo "Processes terminated: $KILLED_COUNT"
```

#### 9.6.2 Cleanup Temporary Files

```bash
STORY_ID="${STORY_ID}"

rm -f /tmp/test-runner-${STORY_ID}.pid 2>/dev/null || true
rm -f /tmp/test-output-${STORY_ID}*.log 2>/dev/null || true
rm -f /tmp/qa-environment-${STORY_ID}.yaml 2>/dev/null || true

find /tmp -name "vitest-*.json" -mmin +30 -delete 2>/dev/null || true
find /tmp -name "jest-*.json" -mmin +30 -delete 2>/dev/null || true
find /tmp -name "playwright-*.json" -mmin +30 -delete 2>/dev/null || true

echo "Temporary files cleaned"
```

#### 9.6.3 Verify Cleanup

```bash
REMAINING=$(pgrep -f "vitest|jest|mocha|playwright|cypress" 2>/dev/null | wc -l | tr -d ' ')
if [ "$REMAINING" -gt 0 ]; then
  echo "Warning: $REMAINING test processes still running"
  pgrep -f "vitest|jest|mocha|playwright|cypress" -a 2>/dev/null || true
else
  echo "All test processes cleaned"
fi
```

**Store result**:
```yaml
final_cleanup:
  executed: true
  processes_killed: {count}
  temp_files_removed: true
  orphans_remaining: {count}
```

Do not block on failures. Proceed to Step 9.7.

---

### 9.7 SELF-CHECK AND HANDOFF (MANDATORY FINAL STEP)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: Output the HANDOFF message as the **LAST LINE** of your response.
The hook script will automatically detect it and route to the target agent.

---

### Self-Check Verification

Before finishing, verify ALL of the following:

- [ ] Gate file created? (Step 7) — If NO → go back and execute Step 7
- [ ] Story status updated? (Step 9.3) — If NO → go back and execute Step 9.3
- [ ] Git commit attempted? (Step 9.5.2) — If NO → go back and execute Step 9.5.2
- [ ] Cleanup executed? (Step 9.6) — If NO → go back and execute Step 9.6
- [ ] Checkpoint cleaned up? — If `{checkpoint_dir}/` exists → delete directory via `rm -rf {checkpoint_dir}`

If ANY check fails (except checkpoint cleanup) → go back and execute the missing step before proceeding.

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

🎯 HANDOFF TO sm: *draft {next_story_id}
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

🎯 HANDOFF TO sm: *draft {next_story_id}
```

**FINAL SELF-CHECK**: Did you output a line starting with `🎯 HANDOFF TO`? If not → output it NOW.
The `🎯 HANDOFF TO` line must be your FINAL output. Do NOT output anything after it. Hook handles the rest.

---

## Summary of Workflow

| Step | Name | Full Mode | Incremental Mode (Round 2+) | Checkpoint Resume |
|------|------|-----------|----------------------------|-------------------|
| 0 | Idempotency Check | Execute | Execute | Execute |
| 0.2 | Pre-Register HANDOFF | Execute (tmux only) | Execute (tmux only) | Execute (tmux only) |
| 0.3 | **Checkpoint Detection** | No checkpoint → continue | No checkpoint → continue | ✅ **Load checkpoint → Jump to Step 7** |
| 0.1 | **Mode Detection** | Set `full` | Set `incremental`, load previous context | ⏭️ SKIP |
| 0.5 | Status Auto-Recovery | Execute | Execute | ⏭️ SKIP |
| 1 | Risk Assessment + 📎 | Calculate | ⏭️ **SKIP** (use cached) | ⏭️ SKIP (from checkpoint) |
| 2 | Project Type Detection + 📎 | Detect | ⏭️ **SKIP** (use cached) | ⏭️ SKIP (from checkpoint) |
| 3 | Environment Setup | Start | Execute | ⏭️ SKIP (not needed) |
| 3.5 | Migration Verification | Verify | Execute | ⏭️ SKIP |
| 4 | Automated Test Evidence + 📎 | Verify | Execute | ⏭️ SKIP (from checkpoint) |
| 4.5 | Task Checkbox Verification + 📎 | Full scan | ⚡ **FOCUS**: Previous failures only | ⏭️ SKIP (from checkpoint) |
| 4.6 | AC Coverage Verification + 📎 | Full scan | ⚡ **FOCUS**: Failed ACs only | ⏭️ SKIP (from checkpoint) |
| 4.7 | **Regression Testing** + 📎 | Execute all | ⏭️ **SKIP** if previous round passed | ⏭️ SKIP (from checkpoint) |
| 5 | E2E Testing + 📎 | Full scenarios | ⚡ **FOCUS**: Failed scenarios only | ⏭️ SKIP (from checkpoint) |
| 5.5 | Blind Spot Verification + 📎 | Full scan | ⚡ **FOCUS**: Missing spots only | ⏭️ SKIP (from checkpoint) |
| 6 | Evidence Collection + 📎 | All issues | New issues only | ⏭️ SKIP (from checkpoint) |
| 7 | Gate Decision | Full context | Full context + populate incremental_context | Execute with loaded data |
| 8 | Environment Cleanup | Execute | Execute | No-op (env not started) |
| 9.5.3 | **Determine Next Story ID** | Check epic YAML → `N.(M+1)` or `(N+1).1` | Check epic YAML → `N.(M+1)` or `(N+1).1` | Execute |
| 9.5.5 | **Persist E2E Tests** | Execute | Execute | Execute |
| 9.5.6 | **Epic Integration Test** | Execute | Execute | Execute |
| 9.7 | Self-Check + HANDOFF + 🗑️ | Execute + cleanup checkpoint | Execute + cleanup checkpoint | Execute + cleanup checkpoint |

📎 = writes checkpoint file after Store result. 🗑️ = deletes checkpoint directory.

**Token Savings**:
- Incremental mode saves ~50-70% execution time by skipping stable checks.
- Checkpoint resume saves ~80-90% by skipping all test execution (Steps 1-6).

## Key Principles

1. **Independent verification**: Execute automated tests independently, then cross-reference with Dev evidence
2. **Checkbox-deliverable consistency**: Verify checked boxes match actual deliverables
3. **AC Traceability verification**: Every AC must have verified code + test locations (CRITICAL)
4. **Risk-aware E2E**: Low-risk = skip, Medium = spot check, High = full testing
5. **Blind spot focus**: QA's unique value is covering what Dev missed
6. **Evidence-driven**: Issues include screenshots and reproduction steps
7. **User perspective**: E2E tests verify real user journeys
8. **Clean environment**: Always cleanup, even on failure
9. **Incremental optimization**: Round 2+ uses cached context, focuses only on previous failures
10. **Checkpoint resilience**: Every test step dual-writes to disk; self-retry loads checkpoint and skips to gate decision
