# review-story

Comprehensive test architecture review with quality gate decision.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md'
```

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

1. Create detailed review report in `{qa.qaReviewsLocation}/{story_id}-qa-r{review_round}.md`
2. Update Story: QA Review Metadata section
3. Update Story: QA Review Summary section
4. Create gate file in `qa.qaLocation/gates`
5. **Update Story: Change Log** - Add table entry:
   ```
   | {{date}} {{time}} | QA | Review → {{next_status}} | Round {{round}}, Gate: {{gate}}, {{issues_count}} issues [QA R{{round}}](docs/qa/reviews/{{story_id}}-qa-r{{round}}.md) |
   ```
6. **Validate and Update Status:**
   - If architecture escalation: Status = Escalated, skip gate decision, proceed to handoff
   - Else: Use `result.next_status` from gate decision
   - Validate transition via `{root}/data/story-status-transitions.yaml`
   - If validation fails: HALT
   - If succeeds: Update Status field

### Handoff Message

Based on the review outcome, output the appropriate handoff message:

- **Architecture Escalation:**
  ```
  Next: Architect please execute command `review-escalation {story_id}`
  ```

- **Gate PASS (next_action = mark_story_complete):**
  ```
  Story completed! Gate: PASS. {result.reasoning}
  ```

- **Gate CONCERNS/FAIL (next_action = handoff_to_dev_fix):**
  ```
  Next: Dev please execute command `review-qa {story_id}`
  ```

- **Gate FAIL with rework (next_action = handoff_to_dev_rework):**
  ```
  Next: Dev please execute command `review-qa {story_id}` - Major rework required
  ```

- **Escalate to Architect (next_action = escalate_to_architect):**
  ```
  Next: Architect please execute command `review-escalation {story_id}` - No improvement after multiple reviews
  ```
