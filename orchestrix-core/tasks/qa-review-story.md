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

#### 3.5 Implementation Shortcuts (Spot Check)
**Focus**: Verify Dev Gate caught critical shortcuts (spot check 4 high-risk items)

**Principle**: Dev Gate executes full implementation-shortcuts.md checklist. QA spot-checks 4 highest-risk categories to ensure critical issues weren't missed.

---

**⚠️ MANDATORY: Execute ALL 4 searches below. Do NOT skip any search.**

---

**Search 1: Hardcoded Credentials** (CRITICAL)

Execute this search:
```
Search pattern: (password|apiKey|token|secret)\s*[:=]\s*["'][^"']+["']
File glob: **/*.{ts,tsx,js,jsx}
```
If matches found → Severity: CRITICAL

---

**Search 2: Hardcoded UI Text / i18n Violations** (HIGH)

First, check if project uses i18n library:
```
Search pattern: (i18next|react-intl|vue-i18n|next-intl|formatjs)
File: package.json
```

Then execute these searches to find hardcoded text:
```
Search pattern: <(button|label|span|p|h[1-6]|a|div)[^>]*>\s*[A-Za-z\u4e00-\u9fff]{3,}\s*</
File glob: **/*.{tsx,jsx}
Exclude: **/*.test.*, **/*.spec.*, **/*.stories.*, **/tests/**, **/__tests__/**
```

```
Search pattern: (placeholder|title|alt|aria-label)=["'][A-Za-z\u4e00-\u9fff]{3,}["']
File glob: **/*.{tsx,jsx}
Exclude: **/*.test.*, **/*.spec.*, **/*.stories.*
```

```
Search pattern: (toast|message|notification)\.(success|error|info|warning)\s*\(\s*["'][A-Za-z\u4e00-\u9fff]{3,}
File glob: **/*.{ts,tsx,js,jsx}
```

If i18n library exists AND hardcoded text found → Severity: HIGH
If no i18n library → Severity: LOW (recommendation)

---

**Search 3: Leftover Debug Code** (HIGH)

Execute this search:
```
Search pattern: console\.(log|debug|info|warn|error)|debugger;
File glob: **/*.{ts,tsx,js,jsx}
Exclude: **/*.test.*, **/*.spec.*
```
If matches found in non-test files → Severity: HIGH

---

**Search 4: Empty Exception Handlers** (CRITICAL)

Execute this search:
```
Search pattern: catch\s*\([^)]*\)\s*\{\s*\}
File glob: **/*.{ts,tsx,js,jsx}
```
If matches found → Severity: CRITICAL

**Spot Check Result**:
```yaml
implementation_shortcuts_spot_check:
  items_checked: 4
  i18n_library_detected: {true|false}
  findings:
    - category: "Hardcoded Credentials"
      severity: CRITICAL | NONE
      locations: []
    - category: "Hardcoded UI Text (i18n)"
      severity: HIGH | MEDIUM | LOW | NONE
      locations: []
    - category: "Leftover Debug Code"
      severity: HIGH | NONE
      locations: []
    - category: "Empty Exception Handlers"
      severity: CRITICAL | NONE
      locations: []
  has_critical: {true|false}
  has_high: {true|false}
```

**Decision**:
- If `has_critical = true`: Add to gate decision as FAIL factor
- If `has_high = true` (including i18n with library): Add to gate decision as CONCERNS factor
- If no critical/high issues: Continue to next step

---

### 4. Code Review Only (No Modifications)

- **IMPORTANT**: QA Agent must NOT modify any code files
- Role: Review, analyze, and report - NOT refactor or fix
- Document all findings in QA Results with specific locations
- If refactoring needed: add to "Issues Breakdown" for Dev to address
- Do NOT alter story beyond QA Results section

## Output 1: Update Story - QA Review Section (Simplified)

Update or create `## QA Review` section in Story with minimal info:

```markdown
## QA Review

- **Round**: {{review_round}}
- **Gate**: {{gate_result}}
- **Issues**: {{critical_count}} critical / {{high_count}} high / {{medium_count}} medium / {{low_count}} low
- **Gate File**: `docs/qa/gates/{{epic}}.{{story}}-{{slug}}.yml`
```

**Notes**:
- If section exists, replace it entirely with updated values
- No history arrays, no cumulative statistics
- Gate YAML contains all details Dev needs

## Output 2: Create Gate File

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

1. Update Story: QA Review section (simplified, see Output 1)
2. Create gate file in `qa.qaLocation/gates` (see Output 2)
3. **Update Story: Change Log** - Add table entry:
   ```
   | {{date}} {{time}} | QA | Review → {{next_status}} | Round {{round}}, Gate: {{gate}}, {{issues_count}} issues |
   ```
4. **Validate and Update Status** (REQUIRED):

   **4.1 Determine Target Status**:
   - If architecture escalation detected in Step 3.1: `target_status = Escalated`
   - Else: Use `result.next_status` from gate decision

   **4.2 Validate Status Transition**:
   Execute: `{root}/tasks/utils/validate-status-transition.md`
   Input:
   ```yaml
   story_path: {story_path}
   current_status: Review
   target_status: {target_status from 4.1}
   agent_id: qa
   ```
   - If validation FAILS: HALT with error message
   - If validation PASSES: Continue to 4.3

   **4.3 Update Story Status Field**:
   - Locate Story's `Status:` field (near top of document)
   - Replace current status with `{target_status}`
   - **Example**: `Status: Review` → `Status: Done`
   - **CRITICAL**: This is a literal string replacement in the Story file, not just logging

5. **DETERMINE POST-REVIEW WORKFLOW** (REQUIRED - Always Execute):

   **5.1. Execute Post-Review Decision**:

   Use `make-decision.md` to determine next actions:
   ```yaml
   decision_type: qa-post-review-workflow
   context:
     gate_result: {from Step 2 gate file}
     final_status: {from Step 4 status field}
     review_round: {current_round}
     issues_by_severity:
       critical: {critical_count}
       high: {high_count}
       medium: {medium_count}
       low: {low_count}
   ```

   **Store decision result for Step 6 handoff**:
   - `workflow_action` (e.g., finalize_commit, handoff_dev, escalate_architect)
   - `requires_git_commit` (boolean)
   - `handoff_target` (e.g., SM, dev, architect)
   - `reasoning` (explanation of the decision)
   - `next_command` (command to execute)

   **5.2. Execute Git Commit (MANDATORY - Always Execute)**:

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

   **Store commit result** for Step 6 handoff:
   - If succeeded: `commit_hash` and `commit_message`
   - If skipped: `skip_reason` (e.g., "Status not Done" or "Gate not PASS")
   - If failed: `commit_error`

6. **OUTPUT HANDOFF MESSAGE** (REQUIRED - MUST BE FINAL OUTPUT):

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST output a handoff message as the FINAL output of this task. The handoff command MUST be the absolute last line - no summaries, tips, or explanations after it.

---

### Pre-Handoff Verification

Before outputting handoff message, verify Step 5.2 was executed:

- **Check commit_result exists** (not empty)
  - If `commit_result` is empty/missing:
    - ❌ **ERROR**: Step 5.2 was not executed
    - Go back to Step 5.2 and execute finalize-story-commit.md
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

---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review-escalation
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

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
✅ Gate File: {gate_file_path}

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

Manual commit retry needed.

---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: finalize-commit
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

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

⚠️ Gate File: {gate_file_path}

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
