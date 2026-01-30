---
description: "Revise Story from Architect Feedback"
---

When this command is used, execute the following task:

# Revise Story from Architect Feedback

---

- This file is the **workflow entry point**, not the revision implementation
- Complex logic delegated to gates and decisions only
- All revision logic inline for efficiency

---

## Agent Permission Check

Execute:

```
.orchestrix-core/tasks/util-validate-agent-action.md
```

**Input**:

```yaml
agent_id: sm
story_path: { story_path }
action: revise
```

**On FAIL**: HALT with error message and guidance
**On PASS**: Proceed with revision process

## Prerequisites

- Story status = `RequiresRevision`
- Architect Review Results appended to Story
- Review round = 1

## Execution

### 1. Parse Architect Review Results

Read Story file → Extract latest "Architect Review Results" section

**Extract fields**:

- `decision`: RequiresRevision | Approved | Blocked
- `architecture_score`: X/10
- `review_round`: 1 | 2
- `issues.critical`: [{description, location, fix}]
- `issues.high`: [{description, location, fix}]
- `issues.medium`: [{description, location, recommendation}]
- `issues.low`: [{description, location, suggestion}]
- `recommendations`: [{item}]
- `review_date`: {timestamp}

**Count Issues**:

- Total Critical: {count}
- Total High: {count}
- Total Medium: {count}
- Total Low: {count}

---

### 2. Revise Story Content

**Priority Order**: Critical → High → Medium → Low

**For each issue, update appropriate sections**:

**Dev Notes Issues**:

- Data Model: Add validation rules, correct schemas, clarify relationships
- API: Fix REST conventions, correct HTTP methods, add request/response specs, auth requirements
- Components: Clarify structure, add props/state, specify events
- File Locations: Verify paths match `source-tree.md`, update to conventions
- Testing: Add test scenarios (edge cases, errors), clarify approach (unit/integration/e2e)
- Constraints: Add version requirements, browser compatibility, performance/security constraints

**Architecture References**:

- Verify format: `[Source: docs/architecture/{file}.md#{section}]`
- Verify documents exist
- Verify sections contain claimed information
- Add missing references

**Tasks/Subtasks (if needed)**:

- Add missing tasks with AC mappings
- Reorder incorrect sequences
- Split complex tasks
- Clarify ambiguous descriptions
- Fix frontend-first violations

**Document Changes** (for Change Log):

```markdown
Revision Summary:
Critical Fixed: [{Issue} - {Fix} - {Location} - {Rationale}]
High Fixed: [...]
Medium Fixed: [...]
Low Fixed: [...]
```

---

### 3. GATE 1 – Re-execute Quality Assessment

Execute:

```
checklists/gate-sm-story-creation-gate.md
```

**Input**:

```yaml
story_path: { story_path }
story_id: { story_id }
```

**Output**: `gate_result` (same structure as create-next-story.md Step 7)

**Handle Result**:

**If gate_result.status = FAIL**:

- Update Story.status = Blocked
- Log failure in Change Log
- Output detailed gap report
- **HALT**

**If gate_result.status = PASS**:

- Extract metrics:
  - `new_quality_score` = gate_result.quality_score.final_score
  - `new_s2_score` = gate_result.technical_quality.s2_score
  - `new_s3_score` = gate_result.technical_quality.s3_score
  - `new_complexity_count` = gate_result.complexity_indicators.total_count
- Continue to Step 4

---

### 4. Re-evaluate Test Design Level

**Step 4.1**: Read Current Test Design Metadata

Extract from Story:

- `test_design_level`: Simple | Standard | Comprehensive
- `test_design_status`: Pending | Complete | NotRequired
- `test_design_document`: {path or null}
- `test_design_completion_date`: {date or null}

**Step 4.2**: Execute Test Design Decision

Execute:

```
tasks/make-decision.md
```

**Input**:

```yaml
decision_type: sm-test-design-level
context:
  complexity_indicators: { from Step 3: gate_result.complexity_indicators }
  quality_score: { from Step 3: new_quality_score }
  security_sensitive: { from Step 3: gate_result.complexity_indicators.security_sensitive }
```

**Output**:

```yaml
decision_result:
  test_design_level: Simple | Standard | Comprehensive
  reasoning: { explanation }
```

**Step 4.3**: Handle Test Design Level Changes

**Compare**: `new_test_design_level` vs `current_test_design_level`

**Case 1: Level increased** (Simple → Standard/Comprehensive):

- Update: `test_design_level` = new_level
- Update: `test_design_status` = Pending
- Clear: `test_design_document` = null
- Note: "Test design level increased - QA test design now required"
- Prepare: `next_status` = AwaitingTestDesign

**Case 2: Level decreased** (Standard/Comprehensive → Simple):

- Update: `test_design_level` = Simple
- Update: `test_design_status` = NotRequired
- Note: "Test design level decreased - QA test design no longer required"
- Prepare: `next_status` = TestDesignComplete

**Case 3: Unchanged + Not Started** (status = Pending):

- Keep: test_design_level unchanged
- Keep: test_design_status = Pending
- Prepare: `next_status` = AwaitingTestDesign

**Case 4: Unchanged + Complete** (status = Complete):

- Keep: test_design_level unchanged
- Keep: test_design_status = Complete
- Add: `requires_review` = true
- Add: `review_reason` = "Story revised after test design completion"
- Check if ACs changed: `ac_changed` = true/false
- Prepare: Handoff to QA for test design review

**Case 5: Simple unchanged**:

- No test design action needed
- Proceed with story status decision

---

### 5. Execute Revision Decision

**Step 5.1**: Gather Decision Inputs

From Steps 1, 3, 4:

```yaml
context:
  previous_architect_score: { from Step 1 }
  new_quality_score: { from Step 3 }
  score_improvement: { new - previous }

  critical_issues_total: { from Step 1 }
  critical_issues_resolved: { count fixed in Step 2 }
  high_issues_total: { from Step 1 }
  high_issues_resolved: { count fixed in Step 2 }
  medium_issues_total: { from Step 1 }
  medium_issues_resolved: { count fixed in Step 2 }
  low_issues_total: { from Step 1 }
  low_issues_resolved: { count fixed in Step 2 }

  structure_validation_passed: { from Step 3: gate_result.structure_validation.passed }
  technical_extraction_rate: { from Step 3: gate_result.technical_quality.s2_score }

  review_round: 1
  test_design_level: { from Step 4 }
  test_design_level_changed: { true/false }
```

**Step 5.2**: Execute Revision Approval Decision

Execute:

```
tasks/make-decision.md
```

**Input**:

```yaml
decision_type: sm-revision-approval
context: { from Step 5.1 }
```

**Output**:

```yaml
decision_result:
  approval_decision: AUTO_APPROVED | ROUND_2_REVIEW_REQUIRED | USER_DECISION_REQUIRED | BLOCKED
  next_status: { status }
  next_action: { action }
  reasoning: { explanation }
```

**Step 5.3**: Handle Revision Decision Result

**If approval_decision = AUTO_APPROVED**:

- Skip Architect Round 2
- Determine final status via Step 5.4
- Skip User Decision (Step 6)
- Continue to Step 7

**If approval_decision = ROUND_2_REVIEW_REQUIRED**:

- Set: `next_status` = AwaitingArchReview
- Set: `next_action` = handoff_to_architect
- Set: `review_round` = 2
- Skip User Decision (Step 6)
- Continue to Step 7

**If approval_decision = USER_DECISION_REQUIRED**:

- Continue to Step 6 (User Decision)

**If approval_decision = BLOCKED**:

- Set: `next_status` = Blocked
- Set: `next_action` = sm_revise_story
- Continue to Step 7

**Step 5.4**: Determine Final Status (AUTO_APPROVED path only)

Execute:

```
tasks/make-decision.md
```

**Input**:

```yaml
decision_type: sm-story-status
context:
  architect_review_result: APPROVED
  test_design_level: { from Step 4 }
```

**Output**:

```yaml
decision_result:
  final_status: TestDesignComplete | AwaitingTestDesign
  next_action: handoff_to_dev | handoff_to_qa_test_design
  reasoning: { explanation }
```

Store `next_status` and `next_action` for Step 7.

---

### 6. User Decision (If Required)

**Prompt User**:

```
Story Revision Summary:
Story: {epic}.{story} - {title}

Quality Improvement:
- Previous Architect Score: {prev}/10
- New Quality Score: {new}/10
- Improvement: +{delta}

Issues Resolved:
- Critical: {resolved}/{total}
- High: {resolved}/{total}
- Medium: {resolved}/{total}
- Low: {resolved}/{total}

Test Design:
- Level: {Simple | Standard | Comprehensive}
- Required: {Yes | No}

Decision Options:
1. TRIGGER_ROUND_2_REVIEW - Send to Architect for Round 2 review
2. ACCEPT_RISK_AND_APPROVE - Accept remaining issues and proceed

Enter choice (1 or 2):
```

**User Input Handling**:

**If user chooses 1** (TRIGGER_ROUND_2_REVIEW):

- Set: `next_status` = AwaitingArchReview
- Set: `next_action` = handoff_to_architect
- Set: `review_round` = 2
- Continue to Step 7

**If user chooses 2** (ACCEPT_RISK_AND_APPROVE):

- Execute Step 5.4 (Determine Final Status)
- Continue to Step 7

---

### 7. Update Story Metadata & Status

**Step 7.1**: Update Quality Assessment Metadata (SM Agent Record)

Add/append to `revision_history`:

```yaml
revision_history:
  - revision_date: {timestamp}
    revision_trigger: architect_feedback_round_1
    previous_architect_score: {score}
    new_technical_quality_score: {score}
    score_improvement: +{delta}
    issues_resolved:
      critical: {resolved}/{total}
      high: {resolved}/{total}
      medium: {resolved}/{total}
      low: {resolved}/{total}
    decision: {auto_approved | round_2_review | user_approved | blocked}
    decision_reasoning: "{explanation}"
```

**Step 7.2**: Update QA Test Design Metadata (if level changed)

Based on Step 4.3 cases, update metadata accordingly.

**Step 7.3**: Update Architect Review Metadata

**If Approved (AUTO_APPROVED or USER_APPROVED)**:

```yaml
review_required: false
review_round: 1
review_status: COMPLETED
auto_approved: { true | false }
auto_approval_reason: "{reason}"
```

**If Round 2 Required**:

```yaml
review_required: true
review_round: 2
review_status: PENDING
round_2_trigger: "{reason}"
```

**If Blocked**:

```yaml
review_status: BLOCKED
blocked_reason: "{reason}"
```

**Step 7.4**: Add Change Log Entry

```markdown
### {timestamp} - SM Revision (Post-Architect Round 1)

**Quality Improvement**:

- Previous Architect Score: {prev}/10
- New Quality Score: {new}/10
- Improvement: +{delta}
- Structure Validation: {PASS | FAIL}
- Technical Extraction: {X}%
- Complexity: {count}/7 indicators

**Issues Resolved**:

- Critical: {resolved}/{total} - [{fixes list}]
- High: {resolved}/{total} - [{fixes list}]
- Medium: {resolved}/{total} - [{fixes list}]
- Low: {resolved}/{total} - [{fixes list}]

**Changes Made**:

1. {change description} - {location} - {addresses issue X}
2. {change description} - {location} - {addresses issue Y}

**Decision**: {AUTO_APPROVED | ROUND_2_REVIEW | USER_APPROVED | BLOCKED}
**Reasoning**: {explanation}

**Next Status**: {status}
**Next Action**: {handoff command}
```

**Step 7.5**: Update Story Status Field

Execute status transition validation:

```
.orchestrix-core/tasks/util-validate-agent-action.md
```

**Input**:

```yaml
agent_id: sm
story_path: { story_file_path }
action: revise_story
target_status: { next_status from Step 5 }
```

**On validation PASS - MANDATORY STATUS UPDATE**:

1. **EDIT Story File** (CRITICAL - DO NOT SKIP):
   - Open: `{story_path}`
   - Locate the `Status:` field in Story metadata (typically in YAML frontmatter or header)
   - **Change**: `Status: RequiresRevision` → `Status: {next_status}`
   - Save file immediately

2. **Verify Update** (MANDATORY):
   - Re-read `{story_path}`
   - Extract `Status` field value
   - **Confirm**: Status field = `{next_status}`
   - If mismatch: HALT with "ERROR: Status update failed - expected {next_status}, found {actual}"

3. **Log Status Change**:
   ```
   ✅ Status Updated: RequiresRevision → {next_status}
   ```

**CRITICAL**: If you skip this step, the Story will remain in old status and the workflow will break. The status update is NOT automatic - you MUST edit the file.

**On validation FAIL**:

- HALT with error message
- Do NOT proceed to handoff

---

### 8. Final Handoff (MANDATORY LAST OUTPUT)

**CRITICAL**: This handoff MUST be the absolute last line. Do NOT add any content after it.

Based on `next_status` from Step 7.5:

**If next_status = Approved or TestDesignComplete**:

```
✅ STORY REVISION COMPLETE - READY FOR DEVELOPMENT
Story: {epic}.{story} - {title}
Status: {status}

Quality Improvement:
- Previous Architect Score: {prev}/10
- New Quality Score: {new}/10
- Improvement: +{delta}

Issues Resolved:
- Critical: {c_resolved}/{c_total}
- High: {h_resolved}/{h_total}
- Medium: {m_resolved}/{m_total}
- Low: {l_resolved}/{l_total}

Test Design: {level}


🎯 HANDOFF TO dev: *develop-story {epic}.{story}
```

**If next_status = AwaitingTestDesign**:

```
✅ STORY REVISION COMPLETE - TEST DESIGN REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingTestDesign

Quality Improvement:
- Previous Architect Score: {prev}/10
- New Quality Score: {new}/10
- Improvement: +{delta}

Issues Resolved: Critical {c}, High {h}, Medium {m}, Low {l}
Test Design Level: {Standard | Comprehensive}


🎯 HANDOFF TO qa: *test-design {epic}.{story}
```

**If next_status = AwaitingArchReview (Round 2)**:

```
✅ STORY REVISION COMPLETE - ROUND 2 REVIEW REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingArchReview

Quality Improvement:
- Previous Architect Score: {prev}/10
- New Quality Score: {new}/10
- Improvement: +{delta}

Issues Resolved: Critical {c}, High {h}, Medium {m}, Low {l}
Remaining Issues: Require Architect Round 2 review

Reason for Round 2: {reason}


🎯 HANDOFF TO architect: *review {epic}.{story}
```

**If next_status = Blocked**:

```
⚠️ STORY REVISION INCOMPLETE - BLOCKED
Story: {epic}.{story} - {title}
Status: Blocked

Quality Score: {prev}/10 → {new}/10 (+{delta})

Blocked Reason: {reason}

Action Required: SM must continue revision
Run: *revise {epic}.{story}
```

**STOP HERE** - End task execution
