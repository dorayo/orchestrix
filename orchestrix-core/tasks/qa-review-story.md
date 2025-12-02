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

**Locate Story File**:

1. **Use Glob tool** with pattern: `{devStoryLocation}/{story_id}.*.md`
   - Example: For story_id `3.2`, pattern is `docs/stories/3.2.*.md`
2. **Then Read** the file path returned by Glob

**Extract Status**: !include tasks/utils/extract-story-status.md

**Check Status and Output Appropriate Message**:

Use template: `{root}/templates/qa-idempotency-messages.yaml`

- **If status = "Done"**: Output `already_done` message → **HALT**
- **If status = "Approved"**: Output `not_started` message → **HALT**
- **If status = "AwaitingTestDesign"**: Output `needs_test_design` message → **HALT**
- **If status = "InProgress"**: Output `in_progress` message → **HALT**
- **If status = "AwaitingArchReview"**: Output `needs_arch_review` message → **HALT**
- **If status in ["Blocked", "RequiresRevision", "Escalated"]**: Output `blocked_or_revision` message → **HALT**

**If status = "Review"**:
- ✅ Log: "Idempotency check passed - proceeding with QA review"
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

* On failure → output error → **HALT**
* On success → continue

## Review Process

### 1. Initialize Review Round

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

### 2. Load Context

Load required documents:
- Story file from `{devStoryLocation}/{epic}.{story}.*.md`
- Dev Agent Record → Extract `self_review.implementation_gate_score`
- Dev Log from `{devLogLocation}/{story-id}-dev-log.md`
- Architecture documents (via load-architecture-context.md if needed)

### 3. Differential Review (4 Dimensions Only)

**Principle**: Trust Dev Gate ≥95%, focus on what Dev cannot validate

#### 3.1 Architecture Concerns (Architect-Level Perspective)
**Focus**: Cross-component impact, design patterns, scalability
- Evaluate architectural patterns and SOLID principles
- Check for circular dependencies or tight coupling
- Assess data flow design and component boundaries
- Identify violations of separation of concerns

**Architecture Concern Detection**:
If detected, execute `make-decision.md` (type: `qa-escalate-architect`) and follow result actions

---

#### 3.2 NFR Deep Dive (Security & Performance Critical Paths)
**Focus**: OWASP Top 10, performance bottlenecks, production risks

**Security Checklist**:
- SQL injection prevention (parameterized queries)
- XSS vulnerability scan (output encoding)
- CSRF protection (tokens, SameSite cookies)
- Authentication/authorization correctness
- Sensitive data encryption (at rest, in transit)
- Secrets management (no hardcoded credentials)
- Error messages (no info leakage)

**Performance Checklist**:
- N+1 query detection
- Memory leak risks (closures, event listeners)
- Batch operation optimization
- Caching strategy appropriateness
- Index usage for database queries

---

#### 3.3 Technical Debt & Long-Term Impact
**Focus**: Shortcuts, maintainability, future burden
- Identify quick-fix solutions vs proper implementation
- Assess code maintainability and readability
- Evaluate extensibility for future requirements
- Document acceptable technical debt with rationale
- Flag code that will become maintenance burden

---

#### 3.4 Requirements Trace (Sampling, Not Exhaustive)
**Focus**: Spot-check 3 most complex ACs (not full coverage)
- Select 3 most complex ACs for validation
- Verify edge case handling for selected ACs
- Check business logic correctness
- Validate error scenario implementation

---

### 4. Code Review Only (No Modifications)

- **IMPORTANT**: QA Agent must NOT modify any code files
- Role: Review, analyze, and report - NOT refactor or fix
- Document all findings in QA Results with specific locations
- If refactoring needed: add to "Issues Breakdown" for Dev to address
- Do NOT alter story beyond QA Results section

## Output 1: Create Detailed Review Report

**Save to**: `{qa.qaReviewsLocation}/{story_id}-qa-r{review_round}.md`

Use template: `{root}/templates/qa-review-lite-tmpl.yaml`

**Include** (Lite Version):
- Review summary (gate, issues count, quality score)
- Architecture concerns (if any)
- Security & performance findings (NFR deep dive)
- Issues breakdown by severity
- Gate decision reasoning
- Next steps

**Exclude** (Dev Gate Already Verified):
- ❌ Code quality assessment (Gate Section 2)
- ❌ Compliance check (Gate Sections 2,3,6)
- ❌ Test architecture details (Gate Section 3,4)
- ❌ Detailed metrics (simplified in lite version)

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

**Template:** `{root}/templates/qa-gate-tmpl.yaml`
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

   **6.1 Determine Target Status**:
   - If architecture escalation detected in Step 3.1: `target_status = Escalated`
   - Else: Use `result.next_status` from gate decision (Step 4)

   **6.2 Validate Status Transition**:
   Execute: `{root}/tasks/utils/validate-status-transition.md`
   Input:
   ```yaml
   story_path: {story_path}
   current_status: Review
   target_status: {target_status from 6.1}
   agent_id: qa
   ```
   - If validation FAILS: HALT with error message
   - If validation PASSES: Continue to 6.3

   **6.3 Update Story Status Field**:
   - Locate Story's `Status:` field (near top of document)
   - Replace current status with `{target_status}`
   - **Example**: `Status: Review` → `Status: Done`
   - **CRITICAL**: This is a literal string replacement in the Story file, not just logging

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

   **7.2. Execute Git Commit (MANDATORY - Always Execute)**:

   **ALWAYS execute finalize-story-commit.md regardless of decision**:

   Execute `finalize-story-commit.md` task with `story_id` parameter.

   The task will internally verify prerequisites (Step 1):
   - If Status = Done AND Gate = PASS → Execute commit
   - Otherwise → Skip with informative message

   This task will:
   - Verify prerequisites (Status=Done, Gate=PASS)
   - Collect commit metadata from Story, Gate, and Dev Agent Record
   - Stage all changes with `git add -A` (if prerequisites met)
   - Create conventional commit with proper formatting
   - Verify commit succeeded and capture commit hash
   - Update Story Change Log with commit entry
   - Return commit result (success with hash OR skip reason OR error message)

   **Store commit result** for Step 8 handoff:
   - If succeeded: `commit_hash` and `commit_message`
   - If skipped: `skip_reason` (e.g., "Status not Done" or "Gate not PASS")
   - If failed: `commit_error`

8. **OUTPUT HANDOFF MESSAGE** (REQUIRED - MUST BE FINAL OUTPUT):

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST output a handoff message as the FINAL output of this task. The handoff command MUST be the absolute last line - no summaries, tips, or explanations after it.

---

### Pre-Handoff Verification

Before outputting handoff message, verify Step 7.2 was executed:

- **Check commit_result exists** (not empty)
  - If `commit_result` is empty/missing:
    - ❌ **ERROR**: Step 7.2 was not executed
    - Go back to Step 7.2 and execute finalize-story-commit.md
    - Do NOT proceed until commit_result is populated

- **If decision.requires_git_commit = true AND commit_result.skip_reason exists**:
  - ⚠️ **WARNING**: Commit was expected but skipped
  - Log skip reason in handoff message
  - Suggest manual retry: `*finalize-commit {story_id}`

---

### Handoff Message Selection

Based on workflow state, output ONE of the following messages:

---

#### Scenario A: Architecture Escalation (Step 3.1 triggered)

```
🚨 ARCHITECTURE ESCALATION REQUIRED

Story: {story_id}
Status: Escalated
Review Round: {review_round}

Critical architecture concerns detected during QA review.

Issues Found:
{architecture_issues}

Escalation Reason:
{escalation_reason}

🎯 HANDOFF TO architect: *review-escalation {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario B: Gate PASS + Status Done + Commit Success

```
🎉 STORY {story_id} DONE - COMMITTED AND READY FOR DEPLOYMENT ✅

Story: {story_id}
Status: Done
Review Round: {review_round}
Gate Result: PASS
Quality Score: {quality_score}/100

All quality checks passed. Code committed successfully.

📦 Git Commit: {commit_hash}
📊 Review Report: {review_report_path}
✅ Gate File: {gate_file_path}

Total Issues Found: {total_issues}
- Critical: {critical_count}
- High: {high_count}
- Medium: {medium_count}
- Low: {low_count}

🎯 HANDOFF TO sm: *draft
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario C: Gate PASS + Status Done + Commit Failed

```
⚠️ STORY {story_id} PASSED QA - COMMIT FAILED

Story: {story_id}
Status: Done
Gate Result: PASS
Commit Status: FAILED

Quality gate passed, but git commit failed.

Error: {commit_error}

Quality Summary:
- Gate: PASS
- Quality Score: {quality_score}/100
- Review Report: {review_report_path}

Manual commit retry needed.

🎯 HANDOFF TO qa: *finalize-commit {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

#### Scenario D: Gate CONCERNS or FAIL (Issues Found)

```
⚠️ QA REVIEW COMPLETE - ISSUES FOUND

Story: {story_id}
Status: {status}
Review Round: {review_round}
Gate Result: {gate_result}
Quality Score: {quality_score}/100

Issues detected during QA review. Dev action required.

📊 Review Report: {review_report_path}
⚠️ Gate File: {gate_file_path}

Issues Breakdown:
- Critical: {critical_count}
- High: {high_count}
- Medium: {medium_count}
- Low: {low_count}

Top Priority Fixes:
{top_issues_summary}

🎯 HANDOFF TO dev: *apply-qa-fixes {story_id}
```

**STOP HERE**: Handoff message must be the last line. No additional output allowed.

---

### ❌ FORBIDDEN After Handoff

After outputting the handoff message, you MUST NOT output any of the following:
- ❌ Summaries or recaps
- ❌ Tips or recommendations
- ❌ Questions to the user
- ❌ Explanations of what was done
- ❌ Suggestions for next steps (beyond the handoff)
- ❌ Any text whatsoever

**The handoff command (`🎯 HANDOFF TO...`) is your FINAL output. STOP IMMEDIATELY after it.**
