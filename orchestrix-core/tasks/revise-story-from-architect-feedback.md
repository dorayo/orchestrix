# Revise Story from Architect Feedback

## Agent Permission Check

**CRITICAL - Verify before proceeding:**
1. Confirm you are SM agent
2. Check `{root}/data/story-status-transitions.yaml`
3. Verify SM can modify `RequiresRevision` status
4. Verify SM can transition: RequiresRevision → (AwaitingArchReview / Approved / Blocked)
5. If permission check fails → HALT, inform user

## Prerequisites

- Story status = `RequiresRevision`
- Architect Review Results appended to Story
- Review round = 1

## Execution

### 1. Parse Architect Review

- Open Story → "Architect Review Results" (latest)
- Extract:
  - Decision, Architecture Score
  - Issues by severity: Critical / High / Medium / Low (count + descriptions)
  - Recommendations
  - Review Round (should be 1)

### 2. Revise Story

**Priority**: Critical → High → Medium → Low

**2.1 Update Dev Notes**

**Data Model Issues:**
- Add validation rules (specific constraints)
- Correct schemas (types, required/optional, defaults)
- Clarify relationships
- Add missing fields

**API Issues:**
- Fix REST/GraphQL conventions
- Correct HTTP methods
- Add request/response specs
- Add auth/error specs

**Component Issues:**
- Clarify structure/hierarchy
- Add props (types, descriptions)
- Add state management details
- Specify events/handlers

**File Location Issues:**
- Verify paths match project structure
- Update to follow conventions
- Add directory creation tasks if needed

**Testing Issues:**
- Add test scenarios (edge cases, errors)
- Clarify approach (unit/integration/e2e)
- Specify coverage expectations

**Technical Constraints:**
- Add version requirements
- Add browser/platform compatibility
- Add performance constraints
- Add security constraints

**2.2 Update Architecture References**

- Verify format: `[Source: docs/architecture/{file}.md#{section}]`
- Verify referenced docs exist
- Verify sections contain claimed info
- Add missing references

**2.3 Adjust Tasks if Needed**

- Add missing tasks (with AC mappings)
- Reorder incorrect sequences
- Split complex tasks
- Clarify ambiguous descriptions
- Update task-AC mappings

**2.4 Document Changes**

Track for Change Log:
```
Revision Summary:
Critical Fixed: [Issue] - [Fix] - [Location] - [Rationale]
High Fixed: ...
Medium Fixed: ...
Low Fixed: ...
```

### 3. Re-execute Quality Check

```
Execute: {root}/tasks/execute-checklist.md
Checklist: {root}/checklists/assessment/sm-story-quality.md
Story: docs/stories/{epic-num}/{story-num}-{story-title}.md
```

**Phase 1: Structure Validation** (100% required)
- Template compliance
- AC coverage
- Task sequence

If fails → Status = Blocked, HALT, fix issues

**Phase 2: Technical Quality** (if Phase 1 passes)
- Technical Extraction (50%) - must be ≥80%
- Implementation Readiness (50%)
- Complexity Indicators (0-7)
- Score + Decision

**Record Metrics:**
- Previous Architect Score vs New Quality Score
- Complexity change
- Issue resolution rate

### 4. Re-evaluate Test Design Level

**4.1 Read Current Test Design Metadata**

Extract from Story:
- test_design_level
- test_design_status
- test_design_document
- test_design_completion_date

**4.2 Determine New Level**

```
Execute: {root}/tasks/make-decision.md
Decision: sm-test-design-level
Context:
  complexity_indicators: {from step 3}
  quality_score: {from step 3}
  security_sensitive: {from step 3}
Output:
  test_design_level: Simple/Standard/Comprehensive
  next_status: TestDesignComplete/AwaitingTestDesign
```

**4.3 Handle Level Changes**

**Case 1: Simple → Standard/Comprehensive**
- Update level, set status=Pending
- Clear document
- Note: "Level increased due to revision"
- Prepare Status=AwaitingTestDesign

**Case 2: Standard/Comprehensive → Simple**
- Update level=Simple, status=NotRequired
- Note: "Level decreased, no longer required"
- Prepare Status=TestDesignComplete

**Case 3: Unchanged + Not Started**
- Keep level, status=Pending
- Prepare Status=AwaitingTestDesign

**Case 4: Unchanged + Complete**
- Keep level, status=Complete
- Add: requires_review=true
- Add: review_reason="Story revised after completion"
- Check AC changes:
  - If AC changed: ac_changed=true
  - If only Dev Notes: ac_changed=false
- Prepare QA review handoff

**Case 5: Simple unchanged**
- No action, proceed

**4.4 Update Metadata**

Update QA Test Design Metadata section based on case above.

### 5. Apply Decision Logic

**5.1 Gather Inputs**

From Steps 1-4:
- Prev Architect Score, New Quality Score, Improvement
- Critical/High/Medium/Low: total + resolved
- Structure Validation, Technical Extraction
- Complexity Indicators
- Test Design Level, Status, Changed

**5.2 Execute Revision Decision**

```
Execute: {root}/tasks/make-decision.md
Decision: sm-revision-approval
Context:
  previous_architect_score: {step 1}
  new_quality_score: {step 3}
  critical_issues_total/resolved: {step 1 & 3}
  high_issues_total/resolved: {step 1 & 3}
  medium_issues_total/resolved: {step 1 & 3}
  structure_validation_passed: {step 3}
  technical_extraction_rate: {step 3}
  review_round: 1
Output:
  approval_decision: AUTO_APPROVED/ROUND_2_REVIEW_REQUIRED/USER_DECISION_REQUIRED/BLOCKED
  next_status: AwaitingArchReview/Blocked
  next_action: ...
```

**5.3 Handle Result**

**If AUTO_APPROVED:**
- Skip Round 2
- Determine final status via test design (Step 5.4)
- Skip Step 6

**If ROUND_2_REVIEW_REQUIRED:**
- Status=AwaitingArchReview, Round=2
- Proceed to Step 7
- Skip Step 6

**If USER_DECISION_REQUIRED:**
- Proceed to Step 6

**If BLOCKED:**
- Status=Blocked
- SM must revise further
- Proceed to Step 7

**5.4 Final Status for Auto-Approved**

```
Execute: {root}/tasks/make-decision.md
Decision: sm-story-status
Context:
  architect_review_result: APPROVED
  test_design_level: {from step 4}
Output:
  story_status: TestDesignComplete/AwaitingTestDesign
  next_action: handoff_to_dev/handoff_to_qa_test_design
```

Proceed to Step 7.

### 6. User Decision (If Required)

**Prompt:**
```
Story: [{epicNum}.{storyNum}] {title}
New Quality: {score}/10 (Prev: {prev}/10)
Issues Resolved: Critical {c}, High {h}, Medium {m}, Low {l}
Test Design: {level} {required?}

Choose:
1. TRIGGER_ROUND_2_REVIEW
2. ACCEPT_RISK_AND_APPROVE

Enter 1 or 2:
```

**If 1:** Status=AwaitingArchReview, Round=2
**If 2:** Determine final status via test design (same as 5.4)

### 7. Update Story Metadata

**7.1 Quality Assessment Metadata**

Add/append revision_history:
```yaml
revision_history:
  - revision_date: {timestamp}
    revision_trigger: architect_feedback_round_1
    previous_architect_score: {score}
    new_technical_quality_score: {score}
    score_improvement: +{improvement}
    issues_resolved:
      critical: {resolved}/{total}
      high: {resolved}/{total}
      medium: {resolved}/{total}
      low: {resolved}/{total}
    decision: {auto_approved/round_2_review/user_approved/blocked}
    decision_reasoning: "{explanation}"
```

**7.2 QA Test Design Metadata**

Update based on Step 4 cases.

**7.3 Architect Review Metadata**

**If Approved:**
```yaml
review_required: false
review_round: 1
review_status: COMPLETED
auto_approved: true
auto_approval_reason: "{reason}"
```

**If Round 2:**
```yaml
review_required: true
review_round: 2
review_status: PENDING
round_2_trigger: "{reason}"
```

**If Blocked:**
```yaml
review_status: BLOCKED
blocked_reason: "{reason}"
```

**7.4 Change Log**

Add entry:
```markdown
### {timestamp} - SM Revision (Post-Architect Round 1)

**Quality:**
- Prev: {score}/10 → New: {score}/10 (+{improvement})
- Structure: PASS/FAIL
- Extraction: {%}
- Complexity: {count}

**Issues:**
- Critical: {resolved}/{total} - [list fixes]
- High: {resolved}/{total} - [list fixes]
- Medium: {resolved}/{total} - [list fixes]
- Low: {resolved}/{total} - [list fixes]

**Changes:**
1. {change} - {location} - {addresses issue}
2. ...

**Decision:** {type} - {reasoning}
**Next Status:** {status}
**Next Action:** {handoff}
```

**7.5 Update Status Field**

```yaml
Status: {Approved/AwaitingArchReview/Blocked/AwaitingTestDesign/TestDesignComplete}
```

### 8. Output Handoff

```
IF TestDesignComplete OR Approved:
  "Next: Dev execute `implement-story {story_id}`"

IF AwaitingTestDesign AND requires_review=true:
  "Next: QA review test design for {story_id} - story revised"

IF AwaitingTestDesign:
  "Next: QA execute `test-design {story_id}`"

IF AwaitingArchReview:
  "Next: Architect execute `review-story {story_id}` (Round 2)"

IF Blocked:
  "Story blocked - SM must continue revision"
```

**Final Output:**
```
✅ STORY REVISION COMPLETE

Story: [{epicNum}.{storyNum}] {title}
Issues Addressed: {total}
Quality: {prev}/10 → {new}/10 (+{improvement})
Test Design: {level} ({status})
Decision: {type}
Status: {status}

{handoff_message}
```

## Quality Gates

- Critical issues must be addressed
- Quality score must improve or ≥7.0
- Structure validation must pass (100%)
- Technical extraction ≥80%

## Risk Mitigation

- Insufficient improvement → Blocked
- Critical issues unresolved → Round 2 required
- Max 2 review rounds enforced
- User can override for medium issues
