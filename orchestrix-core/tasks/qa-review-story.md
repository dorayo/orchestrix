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

**Locate Story File**:

1. **Use Glob tool** with pattern: `{devStoryLocation}/{story_id}.*.md`
   - Example: For story_id `3.2`, pattern is `docs/stories/3.2.*.md`
2. **Then Read** the file path returned by Glob

**Extract Status**: !include tasks/utils/extract-story-status.md

**Check Status and Output Appropriate Message**:

Use template: `{root}/templates/qa-idempotency-messages.yaml`

- **If status = "Done"**: Output `already_done` message -> **HALT**
- **If status = "Approved"**: Output `not_started` message -> **HALT**
- **If status = "AwaitingTestDesign"**: Output `needs_test_design` message -> **HALT**
- **If status = "InProgress"**: Output `in_progress` message -> **HALT**
- **If status = "AwaitingArchReview"**: Output `needs_arch_review` message -> **HALT**
- **If status in ["Blocked", "RequiresRevision", "Escalated"]**: Output `blocked_or_revision` message -> **HALT**

**If status = "Review"**:
- Log: "Idempotency check passed - proceeding with QA review"
- Continue to Validation

---

## Validation

Execute:
```
{root}/tasks/utils/validate-agent-action.md
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

Execute: `{root}/tasks/utils/detect-project-type.md`

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

## Step 4: Automated Testing

**Purpose**: Run existing automated tests (unit, integration, e2e)

Execute: `{root}/tasks/qa-run-automated-tests.md`

Input:
```yaml
project_type: {from Step 2}
story_id: {story_id}
```

**Store result**:
```yaml
automated_tests:
  passed: true | false
  total: 150
  passed_count: 148
  failed_count: 2
  skipped_count: 5
  pass_rate: 98.7
  coverage_percentage: 85
  failed_tests: []
```

**Decision point**:
- If `automated_tests.passed == false`:
  - Record issues with severity HIGH
  - Continue to Step 7 (Gate Decision) - skip E2E testing
- If `automated_tests.passed == true`:
  - Continue to Step 5

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

## Step 6: Evidence Collection

**Purpose**: Organize all test evidence for the Gate file

**Skip condition**: If no issues found, skip to Step 7.

Execute: `{root}/tasks/qa-collect-evidence.md`

Input:
```yaml
story_id: {story_id}
issues: {collected from Steps 4 and 5}
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
automated_tests_passed: {from Step 4}
automated_tests_metrics: {from Step 4}
e2e_tests_passed: {from Step 5, or null if skipped}
e2e_tests_skipped: {true if review_mode == automated_only}
console_errors_found: {from Step 5}
network_errors_found: {from Step 5}
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

---

## Step 8: Environment Cleanup

**Purpose**: Stop any processes started in Step 3

**Always execute** (even if previous steps failed)

Execute: `{root}/tasks/qa-environment-cleanup.md`

Input:
```yaml
story_id: {story_id}
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
Execute: `{root}/tasks/utils/validate-status-transition.md`

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

### 9.7 OUTPUT HANDOFF MESSAGE (REQUIRED - MUST BE FINAL OUTPUT)

---

### MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST output a handoff message as the FINAL output of this task. The handoff command MUST be the absolute last line - no summaries, tips, or explanations after it.

---

### Pre-Handoff Verification

Before outputting handoff message, verify Step 9.6 was executed:

- **Check commit_result exists** (not empty)
  - If `commit_result` is empty/missing:
    - ERROR: Step 9.6 was not executed
    - Go back to Step 9.6 and execute finalize-story-commit.md
    - Do NOT proceed until commit_result is populated

- **If decision.requires_git_commit = true AND commit_result.skip_reason exists**:
  - WARNING: Commit was expected but skipped
  - Log skip reason in handoff message
  - Suggest manual retry: `*finalize-commit {story_id}`

---

### Handoff Message Selection

Based on workflow state, output ONE of the following messages:

---

#### Scenario A: Architecture Escalation (Step 3.1 triggered)

```
ARCHITECTURE ESCALATION REQUIRED

Story: {story_id}
Status: Escalated
Review Round: {review_round}

Critical architecture concerns detected during QA review.

Issues Found:
{architecture_issues}

Escalation Reason:
{escalation_reason}

---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review-escalation
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

HANDOFF TO architect: *review-escalation {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario B: Gate PASS + Status Done + Commit Success

```
STORY {story_id} DONE - COMMITTED AND READY FOR DEPLOYMENT

Story: {story_id}
Status: Done
Review Round: {review_round}
Risk Level: {risk_level}
Review Mode: {review_mode}
Gate Result: PASS
Quality Score: {quality_score}/100

All quality checks passed. Code committed successfully.

Test Results:
- Automated: {passed}/{total} passed ({pass_rate}%)
- E2E: {e2e_passed}/{e2e_tested} scenarios passed
- Console Errors: None
- Network Errors: None

Git Commit: {commit_hash}
Gate File: {gate_file_path}

Total Issues Found: {total_issues}
- Critical: {critical_count}
- High: {high_count}
- Medium: {medium_count}
- Low: {low_count}

---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args:
---ORCHESTRIX-HANDOFF-END---

HANDOFF TO sm: *draft
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario C: Gate PASS + Status Done + Commit Failed

```
STORY {story_id} PASSED QA - COMMIT FAILED

Story: {story_id}
Status: Done
Gate Result: PASS
Commit Status: FAILED

Quality gate passed, but git commit failed.

Error: {commit_error}

Quality Summary:
- Gate: PASS
- Quality Score: {quality_score}/100

Manual commit retry needed.

---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: finalize-commit
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

HANDOFF TO qa: *finalize-commit {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario D: Gate CONCERNS or FAIL (Issues Found)

```
QA REVIEW COMPLETE - ISSUES FOUND

Story: {story_id}
Status: {status}
Review Round: {review_round}
Risk Level: {risk_level}
Review Mode: {review_mode}
Gate Result: {gate_result}
Quality Score: {quality_score}/100

Issues detected during QA testing. Dev action required.

Test Results:
- Automated: {passed}/{total} passed ({pass_rate}%)
- E2E: {e2e_passed}/{e2e_tested} scenarios passed
- Console Errors: {console_errors_found}
- Network Errors: {network_errors_found}

Gate File: {gate_file_path}
Evidence: docs/qa/evidence/{story_id}/

Issues Breakdown:
- Critical: {critical_count}
- High: {high_count}
- Medium: {medium_count}
- Low: {low_count}

Top Priority Fixes:
{top_issues_summary}

---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: apply-qa-fixes
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

HANDOFF TO dev: *apply-qa-fixes {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario E: Low Risk - Automated Only Pass

```
STORY {story_id} DONE - LOW RISK REVIEW COMPLETE

Story: {story_id}
Status: Done
Review Round: {review_round}
Risk Level: LOW
Review Mode: automated_only
Gate Result: PASS

Test Results:
- Automated: {passed}/{total} passed ({pass_rate}%)
- E2E: Skipped (low risk story)

All automated tests passed. Story approved for low-risk fast-track.

Git Commit: {commit_hash}
Gate File: {gate_file_path}

---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args:
---ORCHESTRIX-HANDOFF-END---

HANDOFF TO sm: *draft
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

### FORBIDDEN After Handoff

After outputting the handoff message, you MUST NOT output any of the following:
- Summaries or recaps
- Tips or recommendations
- Questions to the user
- Explanations of what was done
- Suggestions for next steps (beyond the handoff)
- Any text whatsoever

**The handoff command (`HANDOFF TO...`) is your FINAL output. STOP IMMEDIATELY after it.**

---

## Summary of New Workflow

| Step | Name | Purpose |
|------|------|---------|
| 0 | Idempotency Check | Skip already-done stories |
| 1 | Risk Assessment | Determine testing depth |
| 2 | Project Type Detection | Choose testing tools |
| 3 | Environment Setup | Start application |
| 4 | Automated Testing | Run npm test |
| 5 | E2E Testing | Execute user flows |
| 6 | Evidence Collection | Capture screenshots/logs |
| 7 | Gate Decision | PASS/FAIL/CONCERNS |
| 8 | Environment Cleanup | Stop processes |
| 9 | Output & Handoff | Update story, commit, handoff |

## Key Principles

1. **Test-based decisions**: Gate result based on actual test execution, not code review
2. **Risk-aware**: Low-risk stories get fast-track review (automated only)
3. **Evidence-driven**: Issues include screenshots and reproduction steps
4. **User perspective**: E2E tests verify real user journeys
5. **Clean environment**: Always cleanup, even on failure
