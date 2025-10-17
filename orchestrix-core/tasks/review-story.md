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

### 3. Active Refactoring

- Refactor where safe, run tests after changes
- Document in QA Results (WHY, HOW)
- Do NOT alter story beyond QA Results section

### 4. Standards & AC Validation

- Verify compliance: coding-standards.md, unified-project-structure.md, testing-strategy.md
- Validate each AC implemented with edge cases
- Verify documentation and comments for complex logic

## Output 1: Update Story - QA Results ONLY

**Update ONLY "QA Results" and "QA Review Metadata" sections.**

**QA Review Metadata:**
- Update `review_round`, increment `total_reviews_conducted`
- Append to `review-history`: round, date, reviewer, gate, issues, improvement %

**QA Results:** Append new dated entry:

```markdown
## QA Results

### Review Date: [Date] - Round [N] - [Strict/Moderate/Pragmatic]
**Reviewed By**: Quinn (Test Architect)
**Issues from Previous**: [count] | **Resolved**: [count] | **Improvement**: [%]

### Code Quality Assessment
[Overall assessment]

### Architecture Concerns
[Document concerns or state "None". If escalation required, note it.]

### Refactoring Performed
- **File**: [filename] - **Change**: [what] - **Why**: [reason]

### Compliance Check
- Coding Standards: [✓/✗] | Project Structure: [✓/✗] | Testing Strategy: [✓/✗] | All ACs Met: [✓/✗]

### Improvements Checklist
- [x] [Completed items]
- [ ] [Items for Dev to address]

### Security & Performance
[Findings and actions]

### Files Modified During Review
[List if any - ask Dev to update File List]

### Gate Status
Gate: {STATUS} → qa.qaLocation/gates/{epic}.{story}-{slug}.yml

### Technical Debt (Round 3 only)
[Document if applicable: Issue, Impact, Severity, Follow-up Plan]
```

## Output 2: Create Gate File

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

1. Update QA Review Metadata and QA Results section
2. Create gate file in `qa.qaLocation/gates`
3. **Validate and Update Status:**
   - If architecture escalation: Status = Escalated, skip gate decision, proceed to handoff
   - Else: Use `result.next_status` from gate decision
   - Validate transition via `{root}/data/story-status-transitions.yaml`
   - If validation fails: HALT
   - If succeeds: Update Status, log transition with reasoning
4. If files modified: List in QA Results, ask Dev to update File List

### Handoff Message

- **Architecture Escalation:** `Architecture concerns detected. Next: Architect execute 'review-escalation {story_id}'`
- **Gate Escalation:** Use `result.next_action` from decision
- **Complete:** `Story completed! Gate: {result.result}. {result.reasoning}`
- **Review:** Use `result.next_action` from decision