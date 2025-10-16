# review-story

Comprehensive test architecture review with quality gate decision.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md'
  - story_title: '{title}'
  - story_slug: '{slug}'
```

## Validation

1. Verify QA agent identity
2. Read Story Status field
3. Confirm Status = Review
4. Check `{root}/data/story-status-transitions.yaml`:
   - QA can modify Review status
   - Allowed transitions: Review → Done/InProgress/Escalated
5. If validation fails: Log error, HALT

**Prerequisites**: Dev completed, File List updated, tests passing

## Review Process

### 0. Initialize Review Round

**CRITICAL**: Update round counter before review:

1. Read Story `QA Review Metadata` section
2. Check `review_round` field:
   - If missing/0: Set to 1
   - If exists: Increment by 1
3. Update `review_round` in Story
4. Record round for standards determination

**Round Standards:**
- Max 3 rounds allowed
- Round 1: Strict (all criteria met)
- Round 2: Moderate (50% reduction + no high severity)
- Round 3: Pragmatic (no critical + acceptable debt)

**If Round ≥ 4:**
- STOP review
- Prompt user: Accept/Escalate/Continue
- Record decision in metadata
- Exit task

### 1. Risk Assessment

Auto-escalate to deep review if:
- Auth/payment/security files modified
- No tests added
- Diff > 500 lines
- Previous gate: FAIL/CONCERNS
- AC count > 5

### 2. Comprehensive Analysis

Apply depth based on review round.

**A. Requirements Traceability**
- Map AC to tests (Given-When-Then)
- Identify coverage gaps
- Verify all requirements tested

**B. Code Quality**
- Architecture, design patterns
- Refactoring opportunities (safe only)
- Duplication, inefficiencies
- Performance, security vulnerabilities
- Best practices

**Architecture Concern Detection:**
If issues detected:
1. Execute `make-decision`:
   - Type: `qa-escalate-architect`
   - Context: {concern_description, severity, impact, concern_type, affects_multiple_components, requires_design_change, has_workaround}
2. Apply result:
   - ESCALATE → Document, Status = Escalated, handoff Architect, exit
   - DOCUMENT → Document, continue

**C. Test Architecture**
- Coverage adequacy
- Level appropriateness (unit/integration/e2e)
- Design quality, maintainability
- Data management, mocks/stubs
- Edge cases, error scenarios
- Execution time, reliability

**D. NFRs**
- Security: Auth, authz, data protection
- Performance: Response times, resources
- Reliability: Error handling, recovery
- Maintainability: Clarity, docs

**E. Testability**
- Controllability: Input control?
- Observability: Output observation?
- Debuggability: Failure debugging?

**F. Technical Debt**
- Shortcuts
- Missing tests
- Outdated dependencies
- Architecture violations

**Round Standards:**
- R1: Strict (all criteria)
- R2: Moderate (50% improvement + no high severity)
- R3: Pragmatic (no critical + acceptable debt)

### 3. Active Refactoring

- Refactor where safe
- Run tests after changes
- Document in QA Results (WHY, HOW)
- Do NOT alter story beyond QA Results
- Do NOT change Status/File List; recommend only

### 4. Standards Compliance

- Verify `docs/coding-standards.md`
- Check `docs/unified-project-structure.md`
- Validate `docs/testing-strategy.md`
- Ensure story guidelines followed

### 5. AC Validation

- Verify each AC implemented
- Check missing functionality
- Validate edge cases

### 6. Documentation

- Verify self-documenting code
- Add comments for complex logic
- Document API changes

## Output 1: Update Story - QA Results ONLY

**CRITICAL**: Update ONLY "QA Results" and "QA Review Metadata" sections.

**QA Results Anchor:**
- If missing: Append at end
- If exists: Append new dated entry
- Never edit other sections

**QA Review Metadata Update:**
1. Update `review_round` with current round
2. Increment `total_reviews_conducted`
3. Append to `review-history`:
   - Round, date, reviewer, gate result
   - Total issues, critical/high counts
   - Previous issues (R2+), resolved (R2+), improvement % (R2+)
   - Decision

Append results to QA Results section:

```markdown
## QA Results

### Review Date: [Date] - Round [N]

### Reviewed By: Quinn (Test Architect)

### Review Round Information

- **Round**: [1/2/3]
- **Standards Applied**: [Strict/Moderate/Pragmatic]
- **Issues from Previous Round**: [count] (if Round 2+)
- **Issues Resolved**: [count] (if Round 2+)
- **Improvement Percentage**: [percentage]% (if Round 2+)

### Code Quality Assessment

[Overall assessment of implementation quality]

### Architecture Concerns Detected

[If architecture concerns are found, document them here. Otherwise, state "None"]

**Concern Type**: [Performance/Security/Scalability/Design/Data Integrity/Technical Debt]
**Severity**: [High/Critical]
**Description**: [Detailed description of the architecture concern]
**Impact**: [Potential impact on system quality, performance, or maintainability]
**Recommendation**: [Suggested approach or questions for Architect]
**Files Affected**: [List of files with architecture concerns]

[If multiple concerns exist, repeat the above structure for each]

**Escalation Required**: [Yes/No]
- If Yes: Story Status will be set to Escalated and Architect will be notified

### Refactoring Performed

[List any refactoring you performed with explanations]

- **File**: [filename]
  - **Change**: [what was changed]
  - **Why**: [reason for change]
  - **How**: [how it improves the code]

### Compliance Check

- Coding Standards: [✓/✗] [notes if any]
- Project Structure: [✓/✗] [notes if any]
- Testing Strategy: [✓/✗] [notes if any]
- All ACs Met: [✓/✗] [notes if any]

### Improvements Checklist

[Check off items you handled yourself, leave unchecked for dev to address]

- [x] Refactored user service for better error handling (services/user.service.ts)
- [x] Added missing edge case tests (services/user.service.test.ts)
- [ ] Consider extracting validation logic to separate validator class
- [ ] Add integration test for error scenarios
- [ ] Update API documentation for new error codes

### Security Review

[Any security concerns found and whether addressed]

### Performance Considerations

[Any performance issues found and whether addressed]

### Files Modified During Review

[If you modified files, list them here - ask Dev to update File List]

### Gate Status

Gate: {STATUS} → qa.qaLocation/gates/{epic}.{story}-{slug}.yml
Risk profile: qa.qaLocation/assessments/{epic}.{story}-risk-{YYYYMMDD}.md
NFR assessment: qa.qaLocation/assessments/{epic}.{story}-nfr-{YYYYMMDD}.md

# Note: Paths should reference core-config.yaml for custom configurations

### Recommended Status

[✓ Ready for Done] / [✗ Changes Required - See unchecked items above]
(Story owner decides final status)

### Technical Debt (Round 3 only, if applicable)

[If Round 3 and accepting technical debt, document here:]

- **Issue**: [description]
- **Impact**: [impact assessment]
- **Severity**: [Low/Medium]
- **Follow-up Plan**: [plan for addressing in future]
```

## Output 2: Create Gate File

**Template:** `../templates/qa-gate-tmpl.yaml`
**Directory:** `qa.qaLocation/gates` (from `core-config.yaml`)
**Path:** `qa.qaLocation/gates/{epic}.{story}-{slug}.yml`

Structure:

```yaml
schema: 1
story: '{epic}.{story}'
story_title: '{story title}'
gate: PASS|CONCERNS|FAIL|WAIVED
status_reason: '1-2 sentence explanation of gate decision'
reviewer: 'Quinn (Test Architect)'
updated: '{ISO-8601 timestamp}'

# Review round tracking (REQUIRED)
review_round: {current_round}  # 1, 2, or 3
issues_from_previous_round: {count}  # 0 if Round 1, else count from previous gate file
issues_resolved: {count}  # 0 if Round 1, else (issues_from_previous - current_issues)
improvement_percentage: {percentage}  # 0 if Round 1, else (issues_resolved / issues_from_previous) × 100

top_issues: [] # Empty if no issues
waiver: { active: false } # Set active: true only if WAIVED

# Extended fields (optional but recommended):
quality_score: 0-100 # 100 - (20*FAILs) - (10*CONCERNS) or use technical-preferences.md weights
expires: '{ISO-8601 timestamp}' # Typically 2 weeks from review

evidence:
  tests_reviewed: { count }
  risks_identified: { count }
  trace:
    ac_covered: [1, 2, 3] # AC numbers with test coverage
    ac_gaps: [4] # AC numbers lacking coverage

nfr_validation:
  security:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  performance:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  reliability:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'
  maintainability:
    status: PASS|CONCERNS|FAIL
    notes: 'Specific findings'

recommendations:
  immediate: # Must fix before production
    - action: 'Add rate limiting'
      refs: ['api/auth/login.ts']
  future: # Can be addressed later
    - action: 'Consider caching'
      refs: ['services/data.ts']
```

**Round Tracking:**
1. `review_round`: From Story metadata
2. `issues_from_previous_round`: R1=0, R2+=count from prev gate
3. `issues_resolved`: R1=0, R2+=(prev - current)
4. `improvement_percentage`: R1=0, R2+=(resolved/prev)×100

### Gate Decision

Execute `make-decision`:
- Type: `qa-gate-decision`
- Context: {review_round, issues_by_severity, previous_issues}

Apply result:
- PASS → Gate=PASS, Status=Done
- CONCERNS → Gate=CONCERNS, Status=InProgress
- FAIL → Gate=FAIL, Status=InProgress/Escalated

WAIVED: waiver.active=true + reason/approver

### Quality Score

```
score = 100 - (20×FAILs) - (10×CONCERNS)
Range: 0-100
```

Use `technical-preferences.md` weights if defined.

### Issue Owner

`top_issues` suggested_owner:
- `dev`: Code changes
- `sm`: Requirements clarification
- `po`: Business decision

## Principles

- Test Architect: comprehensive quality assessment
- Authority to improve code directly
- Explain changes for learning
- Balance perfection vs pragmatism
- Risk-based prioritization
- Actionable recommendations with ownership

## Blocking Conditions

Stop and request clarification if:
- Story incomplete/missing sections
- File List empty/incomplete
- Required tests missing
- Code misaligned with requirements
- Critical architecture issues

## Completion

1. Update QA Review Metadata with round tracking
2. Update QA Results section
3. Create gate file in `qa.qaLocation/gates`
4. **Validate and Update Status:**
   
   a. **Check Architecture Concerns:**
      - If escalation required:
        - Status = Escalated
        - Skip gate decision
        - Skip remaining validation
        - Proceed to handoff
   
   b. **Validate Transition (no escalation):**
      - Reference `{root}/data/story-status-transitions.yaml`
      - Current: Review
      - Target: Done/InProgress/Escalated
      - Verify allowed_transitions
      - Confirm QA permission
   
   c. **Check Prerequisites:**
      - Done: gate=PASS + all_AC_met + no_critical
      - InProgress: gate=CONCERNS/FAIL + has_issues
      - Escalated: architecture_concerns=true
   
   d. **If validation fails:**
      - Log error from story-status-transitions.yaml
      - HALT, do NOT update
   
   e. **If succeeds:**
      - Update Status:
        - Architecture concerns → Escalated
        - Gate=PASS → Done
        - Gate=CONCERNS/FAIL → InProgress
      - Log transition

5. If files modified: List in QA Results, ask Dev to update File List
6. Provide constructive feedback, actionable recommendations

### Handoff Message

Output based on final status:

- **Escalated:** `Architecture concerns detected. Next: Architect execute 'review-escalation {story_id}'`
- **Done:** `Story completed!`
- **InProgress:** `Next: Dev execute 'review-qa {story_id}'`