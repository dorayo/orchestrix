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

7. **AUTOMATIC GIT COMMIT** (Conditional - executes if Gate=PASS and Status=Done):

   **7.1. Check Commit Conditions**:

   Read the following from previous steps:
   - `gate_result` from Step 4 (gate file)
   - `story_status` from Step 6 (updated Status field)

   **7.2. Execute Finalize Commit (ONLY IF gate_result=PASS AND story_status=Done)**:

   If conditions are NOT met:
   - Skip to Step 8 (OUTPUT HANDOFF MESSAGE)

   If conditions ARE met:
   - Execute the following git commit process (based on `finalize-story-commit.md`):

   **A. Collect Commit Metadata**:
   - From Story file: `story_id`, `story_title`, key ACs (up to 3), File List count
   - From Gate file: `review_round`, `quality_score`
   - From Dev Agent Record: tests added count (if available)

   **B. Execute Git Commit**:
   ```bash
   # Stage all changes (story file + code changes)
   git add -A

   # Create commit with conventional commit format
   git commit -m "$(cat <<'EOF'
   feat(story-{story_id}): complete story {story_title}

   Story: {story_id} - {story_title}

   **Implemented**:
   {list key ACs from story - use actual values}

   **Files Modified**: {count} files
   **Tests Added**: {count} tests
   **QA Gate**: PASS (Round {review_round})

   Quality Score: {quality_score}/100

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

   **IMPORTANT**: Replace all `{placeholders}` with actual values from metadata. Do not leave any placeholders in the commit message.

   **C. Verify Commit Succeeded**:
   ```bash
   # Get commit hash
   git log -1 --oneline
   ```

   **D. Update Story Change Log**:
   Add new table row:
   ```markdown
   | {current_date} | Git commit created: `{commit_hash}` - Story finalized and committed to repository | QA |
   ```

   **E. Store Commit Result**:
   - If commit succeeded: Store commit_hash for handoff message
   - If commit failed: Store error message for handoff warning

8. **OUTPUT HANDOFF MESSAGE** (REQUIRED - MUST BE FINAL OUTPUT):

### Handoff Messages

Based on the review outcome, output the appropriate handoff (use exact format):

#### Architecture Escalation:
```
⚠️ ESCALATED TO ARCHITECT
Story: {story_id} → Status: Escalated
Reason: {escalation_reason}

🎯 HANDOFF TO architect: *review-escalation {story_id}
```

#### Gate PASS (Story Complete):

**If Step 7 executed git commit successfully**:
```
✅ STORY COMPLETE
Story: {story_id} → Status: Done
Gate: PASS | Round: {review_round} | Quality: {score}/100
{result.reasoning}

📦 Git Commit: {commit_hash}
   Message: feat(story-{story_id}): {story_title}
   Files: {files_count} modified, {tests_count} tests added

🎉 STORY {story_id} DONE - COMMITTED AND READY FOR DEPLOYMENT ✅

🎯 HANDOFF TO sm: *draft
```

**If Step 7 skipped git commit (conditions not met - should not happen if Status=Done)**:
```
✅ QA REVIEW COMPLETE
Story: {story_id} → Status: Done
Gate: PASS | Round: {review_round} | Quality: {score}/100
{result.reasoning}

⚠️ Git commit was NOT created (unexpected state)

🎯 MANUAL ACTION REQUIRED:
Verify story status and run: *finalize-commit {story_id}
```

**If Step 7 git commit failed**:
```
✅ QA REVIEW COMPLETE - COMMIT FAILED
Story: {story_id} → Status: Done
Gate: PASS | Round: {review_round} | Quality: {score}/100

⚠️ Git commit failed: {error_message}

🎯 RETRY COMMIT:
*finalize-commit {story_id}

Or investigate git error and retry manually.
```

#### Gate CONCERNS/FAIL (Need Dev Fix):
```
⚠️ QA REVIEW COMPLETE - ISSUES FOUND
Story: {story_id} → Status: Review (Round {review_round})
Gate: {CONCERNS|FAIL} | Issues: {issues_count} ({critical}C, {high}H, {medium}M)

Review: docs/qa/reviews/{story_id}-qa-r{review_round}.md

🎯 HANDOFF TO dev: *review-qa {story_id}
```

#### Gate FAIL with Major Rework:
```
❌ QA REVIEW COMPLETE - MAJOR REWORK REQUIRED
Story: {story_id} → Status: Review (Round {review_round})
Gate: FAIL | Critical Issues: {critical_count}

Review: docs/qa/reviews/{story_id}-qa-r{review_round}.md

🎯 HANDOFF TO dev: *review-qa {story_id}
⚠️ Major rework required
```

#### Escalate to Architect (No Improvement):
```
🚨 ESCALATED - NO IMPROVEMENT
Story: {story_id} → Status: Escalated
Reason: No improvement after {review_round} rounds

🎯 HANDOFF TO architect: *review-escalation {story_id}
```

**CRITICAL**: The handoff command (e.g., `*review {story_id}`) MUST be clearly visible as the final line of your output.
