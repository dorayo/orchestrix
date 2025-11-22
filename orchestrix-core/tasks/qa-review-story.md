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

### 2. Differential Analysis (Trust Dev Gate ≥95%)

**Prerequisites**:
1. Read Dev Agent Record → `self_review` section
2. Extract `implementation_gate_score`
3. If `implementation_gate_score` < 95%: Execute full 6-dimension review (rare case)
4. If `implementation_gate_score` ≥ 95%: Execute differential review below (common case)

---

**Differential Review (4 Dimensions) - Trust Dev Validation**:

#### 2.1 Architecture Concerns (Architect-Level Perspective)
**Focus**: Cross-component impact, design patterns, scalability
- Evaluate architectural patterns and SOLID principles
- Check for circular dependencies or tight coupling
- Assess data flow design and component boundaries
- Identify violations of separation of concerns

**Skip** (Dev Gate already verified):
- ❌ File structure compliance (Gate Section 2.2)
- ❌ Naming conventions (Gate Section 2.1)
- ❌ Tech stack compliance (Gate Section 2.3)

**Architecture Concern Detection**:
If detected, execute `make-decision` (type: `qa-escalate-architect`):
- ESCALATE → Document, Status = Escalated, handoff Architect, exit
- DOCUMENT → Document, continue

---

#### 2.2 NFR Deep Dive (Security & Performance Critical Paths)
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

**Skip** (Dev Gate already verified):
- ❌ Tests passing (Gate Critical Item 1)
- ❌ Lint errors (Gate Critical Item 2)
- ❌ Build success (Gate Section 8)
- ❌ Basic security (Gate Section 10)

---

#### 2.3 Technical Debt & Long-Term Impact
**Focus**: Shortcuts, maintainability, future burden
- Identify quick-fix solutions vs proper implementation
- Assess code maintainability and readability
- Evaluate extensibility for future requirements
- Document acceptable technical debt with rationale
- Flag code that will become maintenance burden

---

#### 2.4 Requirements Trace (Sampling, Not Exhaustive)
**Focus**: Spot-check complex ACs, not full coverage
- Select 3 most complex ACs for validation (not all)
- Verify edge case handling for selected ACs
- Check business logic correctness
- Validate error scenario implementation

**Skip** (Dev Gate already verified):
- ❌ All ACs implemented (Gate Critical Item 4)
- ❌ Tasks checked off (Gate Section 1.3)
- ❌ Test coverage (Gate Section 3)

---

### 3. Code Review Only (No Modifications)

- **IMPORTANT**: QA Agent must NOT modify any code files
- Role: Review, analyze, and report - NOT refactor or fix
- Document all findings in QA Results with specific locations
- If refactoring needed: add to "Issues Breakdown" for Dev to address
- Do NOT alter story beyond QA Results section

### 4. Skip Standards Validation (Dev Gate Already Enforced)

**Rationale**: Dev Gate Section 2 (Code Quality) already verified compliance with:
- coding-standards.md (Gate 2.1)
- unified-project-structure.md (Gate 2.2)
- testing-strategy.md (Gate 3.6)

**QA Action**: Trust Dev validation, skip redundant checks

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

**CRITICAL VERIFICATION Before Handoff**:

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

### Handoff Messages

Output appropriate handoff based on review outcome. Use template: `{root}/templates/qa-handoff-message-tmpl.md`

**Handoff Formats**:
- **Architecture Escalation**: `🎯 HANDOFF TO architect: *review-escalation {story_id}`
- **Gate PASS + Commit Success**: `🎉 STORY {story_id} DONE - COMMITTED` + `🎯 HANDOFF TO {target}: {command}`
- **Gate PASS + Commit Failed**: `⚠️ COMMIT FAILED` + `🎯 RETRY COMMIT: *finalize-commit {story_id}`
- **Gate CONCERNS/FAIL**: `⚠️ ISSUES FOUND` + `🎯 HANDOFF TO dev: *review-qa {story_id}`

**CRITICAL**: Handoff command MUST be the final line of output. No summaries/tips after handoff.
