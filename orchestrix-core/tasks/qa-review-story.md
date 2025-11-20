# review-story

Comprehensive test architecture review with quality gate decision.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md'
```

## Step 0: Idempotency Check (MANDATORY - Fast Exit to Save Tokens)

**Purpose**: Prevent re-reviewing already passed stories

**Read Story File**: Use glob pattern `{devStoryLocation}/{story_id}.*.md` to find the story file (handles both `5.2.md` and `5.2.20241117.md` formats)

**Extract Status**: !include tasks/utils/extract-story-status.md

- Uses robust multi-strategy extraction (handles standard format, bold format, Change Log fallback, keyword search)
- Returns: `{status}` = valid enum value, `{strategy_used}` = which strategy succeeded

**Check if Already Reviewed**:

- **If status = "Done"**:
  ```
  ✅ STORY ALREADY PASSED QA
  Story: {story_id}
  Status: Done

  QA review already completed and passed.
  Story is ready for deployment.

  💡 TIP: Story is complete. Commit or start new work.
  - To commit: *finalize-commit {story_id}
  - For new work: Switch to SM and run *draft

  (No HANDOFF - workflow complete)
  ```
  **HALT: QA already passed ✅**

- **If status NOT in ["Review"]**:

  **Determine appropriate handoff based on current status**:

  - **If status = "Approved"**:
    ```
    ℹ️ STORY NOT STARTED YET
    Story: {story_id}
    Current Status: Approved

    Story has been approved but not yet implemented.
    Dev needs to start implementation.

    🎯 HANDOFF TO dev: *develop-story {story_id}
    ```

  - **If status = "AwaitingTestDesign"**:
    ```
    ℹ️ STORY NEEDS TEST DESIGN
    Story: {story_id}
    Current Status: AwaitingTestDesign

    Story needs QA test design before Dev can implement.

    🎯 HANDOFF TO qa: *test-design {story_id}
    ```

  - **If status = "InProgress"**:
    ```
    ℹ️ STORY IN DEVELOPMENT
    Story: {story_id}
    Current Status: InProgress

    Story is currently being worked on by Dev.
    Waiting for Dev to complete and set Status = "Review".

    🎯 HANDOFF TO dev: *develop-story {story_id}
    ```

  - **If status = "AwaitingArchReview"**:
    ```
    ℹ️ STORY NEEDS ARCHITECT REVIEW
    Story: {story_id}
    Current Status: AwaitingArchReview

    Story needs Architect review before implementation.

    🎯 HANDOFF TO architect: *review-story {story_id}
    ```

  - **If status in ["Blocked", "RequiresRevision", "Escalated"]**:
    ```
    ⚠️ STORY BLOCKED OR NEEDS REVISION
    Story: {story_id}
    Current Status: {current_status}

    Story requires human intervention or SM revision.

    Next actions:
    - If "Blocked": SM must resolve blockers (*correct-course {story_id})
    - If "RequiresRevision": SM must revise story (*revise-story {story_id})
    - If "Escalated": Wait for Architect decision

    (No HANDOFF - human intervention required)
    ```

  **HALT: Prerequisites not met ⛔**

**If status = "Review"**:
- ✅ Log: "Idempotency check passed - proceeding with QA review"
- Continue to Validation

---

## Validation

1. Verify QA agent identity
2. Confirm Story Status = Review
3. Validate transition permissions via `{root}/data/story-status-transitions.yaml`
4. If validation fails: HALT

## Review Process

### 0. Initialize Review Round

1. Read/update `review_round` in Story `QA Review Metadata`:
   - If missing/0: Set to 1
   - Else: Increment by 1
   - **IMPORTANT**: If story was previously Escalated and returned from Architect, review_round continues from last value (does NOT reset)
   - Escalation is considered an intervention, not a reset of quality expectations
2. Apply progressive standards based on round:
   - Round 1 (Strict): All criteria must be met
   - Round 2 (Moderate): 50% improvement required, no high severity issues
   - Round 3 (Pragmatic): No critical issues, acceptable technical debt
3. If Round ≥ 4: STOP, prompt user (Accept/Escalate/Continue), exit

### 1. Risk Assessment

Auto-escalate to deep review if:
- Auth/payment/security files modified
- No tests added, diff > 500 lines, AC count > 5
- Previous gate: FAIL/CONCERNS

### 2. Comprehensive Analysis

Apply review criteria based on current round (see Initialize Review Round for standards).

**Review Areas:**
- **Requirements Traceability**: AC-to-test mapping, coverage gaps
- **Code Quality**: Architecture, patterns, refactoring, security, performance
- **Test Architecture**: Coverage, levels, design, edge cases, reliability
- **NFRs**: Security, performance, reliability, maintainability
- **Testability**: Controllability, observability, debuggability
- **Technical Debt**: Shortcuts, missing tests, violations

**Architecture Concern Detection:**
If detected, execute `make-decision` (type: `qa-escalate-architect`):
- ESCALATE → Document, Status = Escalated, handoff Architect, exit
- DOCUMENT → Document, continue

### 3. Code Review Only (No Modifications)

- **IMPORTANT**: QA Agent must NOT modify any code files
- Role: Review, analyze, and report - NOT refactor or fix
- Document all findings in QA Results with specific locations
- If refactoring needed: add to "Improvements Checklist" for Dev to address
- Do NOT alter story beyond QA Results section

### 4. Standards & AC Validation

- Verify compliance: coding-standards.md, unified-project-structure.md, testing-strategy.md
- Validate each AC implemented with edge cases
- Verify documentation and comments for complex logic

## Output 1: Create Detailed Review Report

**Save to**: `{qa.qaReviewsLocation}/{story_id}-qa-r{review_round}.md`

Use template: `{root}/templates/qa-review-tmpl.yaml`

**Include**:
- Review summary with metrics
- Complete code quality assessment
- Architecture concerns
- Compliance check results
- Improvements checklist (completed + pending)
- Security & performance findings
- Issues breakdown by severity
- Technical debt (if Round 3)
- Gate decision reasoning
- Review metadata

### Output 2: Update Story - QA Review Metadata ONLY

**QA Review Metadata section:**
- Update `review_round` (increment by 1)
- Increment `total_reviews_conducted`
- Append to `review_history`:
  ```yaml
  - round: {{round_number}}
    date: {{review_date}}
    reviewer: {{reviewer_id}}
    gate: {{gate_result}}
    total_issues: {{total_issues}}
    critical: {{critical_count}}
    high: {{high_count}}
    issues_from_previous: {{previous_issues}}
    issues_resolved: {{resolved_count}}
    improvement_percentage: {{improvement_pct}}
    decision: {{decision}}
  ```

**QA Review Summary section:**

```markdown
## QA Review Summary

- **Total Reviews**: {{total_reviews}}
- **Latest Review**: {{latest_review_date}}
- **Latest Gate**: {{latest_gate}}
- **Final Quality Score**: {{final_quality_score}}/100
- **Total Issues Found**: {{cumulative_issues}}
- **Total Issues Resolved**: {{cumulative_resolved}}
- **Overall Improvement**: {{overall_improvement}}%

### Review History
- **Round {{round}}** ({{date}}): [QA Review R{{round}}](docs/qa/reviews/{{story_id}}-qa-r{{round}}.md) - {{gate}} - {{issues_count}} issues ({{improvement}}% improvement)

### Final Gate
- **Gate File**: [{{gate_file_name}}](docs/qa/gates/{{gate_file_name}})
- **Gate Result**: {{final_gate}}
- **Status Reason**: {{final_status_reason}}
```

## Output 3: Create Gate File

**Template:** `../templates/qa-gate-tmpl.yaml`
**Path:** `qa.qaLocation/gates/{epic}.{story}-{slug}.yml` (from `core-config.yaml`)

**Required Fields:**
- schema, story, story_title, gate, status_reason, reviewer, updated
- review_round, issues_from_previous_round, issues_resolved, improvement_percentage
- top_issues, waiver, quality_score, evidence, nfr_validation, recommendations

**Round Tracking Calculation:**
- `issues_from_previous_round`: 0 if Round 1, else count from previous gate file
- `issues_resolved`: 0 if Round 1, else (previous_issues - current_issues)
- `improvement_percentage`: 0 if Round 1, else (issues_resolved / previous_issues) × 100

### Gate Decision

Execute `make-decision.md`:
```yaml
decision_type: qa-gate-decision
context:
  review_round: {current_round}
  issues_by_severity: {critical, high, medium, low counts}
  previous_issues: {from previous gate file if R2+}
```

Apply result:
- Set gate file: `gate`, `status_reason` from result
- Use `result.next_status` for Story Status
- Use `result.next_action` for handoff

**WAIVED Gate:** Set `waiver.active: true` with reason, approver, timestamp

**Quality Score:** `100 - (20×FAILs) - (10×CONCERNS)` or use `technical-preferences.md` weights

**Issue Owner:** dev (code), sm (requirements), po (business)

## Principles

- Comprehensive quality assessment with authority to improve code directly
- Balance perfection vs pragmatism, risk-based prioritization
- Actionable recommendations with ownership

## Blocking Conditions

HALT if: Story incomplete, File List empty, required tests missing, code misaligned with requirements, critical architecture issues

## Completion

**Execute these steps in order (ALL MANDATORY):**

1. Create detailed review report in `{qa.qaReviewsLocation}/{story_id}-qa-r{review_round}.md`
2. Update Story: QA Review Metadata section
3. Update Story: QA Review Summary section
4. Create gate file in `qa.qaLocation/gates`
5. **Update Story: Change Log** - Add table entry:
   ```
   | {{date}} {{time}} | QA | Review → {{next_status}} | Round {{round}}, Gate: {{gate}}, {{issues_count}} issues [QA R{{round}}](docs/qa/reviews/{{story_id}}-qa-r{{round}}.md) |
   ```
6. **Validate and Update Status** (REQUIRED):
   - If architecture escalation: Status = Escalated
   - Else: Use `result.next_status` from gate decision
   - Validate transition via `{root}/data/story-status-transitions.yaml`
   - If validation fails: HALT
   - **MUST UPDATE Story Status field before proceeding**

7. **DETERMINE POST-REVIEW WORKFLOW** (REQUIRED - Always Execute):

   **7.1. Execute Post-Review Decision**:

   Use `make-decision.md` to determine next actions:
   ```yaml
   decision_type: qa-post-review-workflow
   context:
     gate_result: {from Step 4 gate file}
     final_status: {from Step 6 status field}
     review_round: {current_round}
     issues_by_severity:
       critical: {critical_count}
       high: {high_count}
       medium: {medium_count}
       low: {low_count}
   ```

   **Store decision result for Step 8 handoff**:
   - `workflow_action` (e.g., finalize_commit, handoff_dev, escalate_architect)
   - `requires_git_commit` (boolean)
   - `handoff_target` (e.g., SM, dev, architect)
   - `reasoning` (explanation of the decision)
   - `next_command` (command to execute)

   **7.2. Execute Git Commit (Conditional)**:

   **IF** decision result `requires_git_commit == true`:

   Execute `finalize-story-commit.md` task with `story_id` parameter.
   This task will:
   - Collect commit metadata from Story, Gate, and Dev Agent Record
   - Stage all changes with `git add -A`
   - Create conventional commit with proper formatting
   - Verify commit succeeded and capture commit hash
   - Update Story Change Log with commit entry
   - Return commit result (success with hash OR error message)

   **Store commit result** for Step 8 handoff:
   - If succeeded: `commit_hash` and `commit_message`
   - If failed: `commit_error`

   **ELSE** (`requires_git_commit == false`):

   Skip commit execution, proceed to Step 8 with decision result only

8. **OUTPUT HANDOFF MESSAGE** (REQUIRED - MUST BE FINAL OUTPUT):

### Handoff Messages

Output appropriate handoff based on review outcome. Use template: `{root}/templates/qa-handoff-message-tmpl.md`

**Handoff Formats**:
- **Architecture Escalation**: `🎯 HANDOFF TO architect: *review-escalation {story_id}`
- **Gate PASS + Commit Success**: `🎉 STORY {story_id} DONE - COMMITTED` + `🎯 HANDOFF TO {target}: {command}`
- **Gate PASS + Commit Failed**: `⚠️ COMMIT FAILED` + `🎯 RETRY COMMIT: *finalize-commit {story_id}`
- **Gate CONCERNS/FAIL**: `⚠️ ISSUES FOUND` + `🎯 HANDOFF TO dev: *review-qa {story_id}`

**CRITICAL**: Handoff command MUST be the final line of output. No summaries/tips after handoff.
