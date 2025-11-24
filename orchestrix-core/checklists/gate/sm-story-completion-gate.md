# SM Story Completion Gate

---
metadata:
  type: gate
  threshold: 100%
  on_fail: halt
  purpose: "Verify all administrative and handoff steps completed after story creation"
  scope: "Process completion only - NOT quality validation"
---

## LLM EXECUTION INSTRUCTIONS

**CRITICAL**: This gate MUST be executed at the END of create-next-story.md completion flow, AFTER quality gate PASS and decision execution.

**Purpose**: Verify ALL administrative and handoff steps were completed. This is NOT a quality check.

**Scope**:
- ✅ Process completion (Metadata, Change Log, Status update, Handoff)
- ❌ NOT story quality (covered by sm-story-creation-gate.md)

**Execution**:
- This is a GATE, not a suggestion
- ALL items must be [x] to proceed
- ANY item [ ] = HALT immediately
- Check AFTER quality gate PASS and decisions executed

**On Failure**:
- HALT immediately
- Output: "COMPLETION STEPS INCOMPLETE"
- List missing steps
- DO NOT output handoff message
- DO NOT end task

---

## MANDATORY COMPLETION STEPS

**Instructions**: Mark [x] for completed, [ ] for not done. ALL must be [x].

**Note**: This gate verifies **final administrative steps only**. Story quality was already validated by sm-story-creation-gate.md.

### 1. Story Metadata Fields

| Step | Completed | Evidence |
|------|-----------|----------|
| Quality score recorded in SM Agent Record | [ ] | quality_score: X.X/10 |
| Complexity indicators recorded | [ ] | complexity_indicators: {count}/7 |
| Test design level set in QA Test Design Metadata | [ ] | test_design_level: {Simple\|Standard\|Comprehensive} |
| Architect review requirement set | [ ] | review_required: true/false |

**Result**: ___/4 (Must be 4/4)

---

### 2. Decision Results Documentation

| Step | Completed | Evidence |
|------|-----------|----------|
| Architect review decision recorded | [ ] | Decision 8A result in metadata |
| Test design level decision recorded | [ ] | Decision 8B result in metadata |
| Story status decision recorded | [ ] | Decision 8C result in metadata |
| Decision reasoning documented | [ ] | All decisions include reasoning |

**Result**: ___/4 (Must be 4/4)

---

### 3. Change Log Entry

| Step | Completed | Evidence |
|------|-----------|----------|
| Change Log entry added | [ ] | New entry at top of Change Log |
| Entry includes: timestamp | [ ] | Date and time present |
| Entry includes: quality metrics | [ ] | Quality score, complexity count |
| Entry includes: decisions made | [ ] | Arch review, Test level, Status |
| Entry includes: next action | [ ] | Handoff command or next step |

**Result**: ___/5 (Must be 5/5)

**Example Format**:
```markdown
### {timestamp} - SM Story Creation

**Quality Assessment**:
- Quality Score: {X.X}/10
- Structure Validation: PASS (12/12)
- Technical Extraction: {X}%
- Implementation Readiness: {X}%
- Complexity Indicators: {count}/7 ({list})

**Decisions**:
- Architect Review: {REQUIRED | NOT_REQUIRED} - {reasoning}
- Test Design Level: {Simple | Standard | Comprehensive} - {reasoning}
- Final Status: {status} - {reasoning}

**Next Action**: {handoff_to_architect | handoff_to_dev | handoff_to_qa_test_design}
```

---

### 4. Status Field Update

| Step | Completed | Evidence |
|------|-----------|----------|
| Status transition validated via validate-status-transition.md | [ ] | Validation executed and passed |
| Story.status field updated to final_status | [ ] | Status: {AwaitingArchReview\|Approved\|AwaitingTestDesign\|TestDesignComplete\|Blocked} |
| Status update verified (read back from file) | [ ] | Re-read confirms status updated |

**Result**: ___/3 (Must be 3/3)

**CRITICAL**: You MUST actually update the story file's Status field. Not just say you will - DO IT.

**Allowed Status Values** (based on Decision 8C):
- `AwaitingArchReview` - Architect review required
- `AwaitingTestDesign` - QA test design needed (Standard/Comprehensive)
- `TestDesignComplete` - Ready for Dev (Simple test design OR QA test design complete)
- `Blocked` - Quality issues, SM must revise

---

### 5. Handoff Message Preparation

| Step | Completed | Evidence |
|------|-----------|----------|
| Handoff message prepared | [ ] | Message ready |
| Message includes story ID | [ ] | Story ID: {epic}.{story} |
| Message includes quality metrics | [ ] | Quality score, complexity count |
| Message includes next command | [ ] | Correct *command based on next_action |
| Message is final output | [ ] | Nothing after this message |

**Result**: ___/5 (Must be 5/5)

**Handoff Message Templates** (choose based on next_action from Decision 8C):

**If next_action = handoff_to_architect**:
```
✅ STORY CREATED - ARCHITECT REVIEW REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingArchReview

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design Level: {level} (deferred until after review)

Architect Review Reason:
{reasoning from Decision 8A}

🎯 HANDOFF TO architect: *review {epic}.{story}
```

**If next_action = handoff_to_dev**:
```
✅ STORY CREATED - READY FOR DEVELOPMENT
Story: {epic}.{story} - {title}
Status: TestDesignComplete

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design: Simple (unit tests only)

🎯 HANDOFF TO dev: *develop-story {epic}.{story}
```

**If next_action = handoff_to_qa_test_design**:
```
✅ STORY CREATED - TEST DESIGN REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingTestDesign

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design Level: {Standard | Comprehensive}

🎯 HANDOFF TO qa: *test-design {epic}.{story}
```

**If story blocked (quality gate failed)**:
```
⚠️ STORY CREATION INCOMPLETE - BLOCKED
Story: {epic}.{story} - {title}
Status: Blocked

Quality Issues:
{list issues from gate_result.failed_items}

Action Required: SM must revise story to fix quality issues
Run: *revise {epic}.{story}
```

---

## FINAL VERIFICATION

**Before outputting handoff message, verify**:

- [ ] ALL sections above show X/X (100% completion)
- [ ] Story file actually updated (not just planned)
- [ ] Change Log entry visible in story file
- [ ] Status field reads correct value (not default)
- [ ] This is my FINAL action in this task

**Total Completion**: ___/21 items (Must be 21/21 = 100%)

---

## IF ANY ITEM IS NOT COMPLETE

**DO NOT PROCEED**

**Output**:
```
❌ COMPLETION STEPS INCOMPLETE
Cannot finalize story creation

Missing Steps:
- [ ] {section name}: {what's missing}
- [ ] {section name}: {what's missing}

Action Required:
1. Complete all missing steps
2. Re-run this completion gate
3. Only after 100% completion, output handoff message

HALTING - Complete missing steps first
```

**DO NOT**:
- Output handoff message
- Say task is complete
- Update status if not all steps done
- Continue to next step

---

## WHEN ALL ITEMS COMPLETE

**You MUST now**:

1. Output the handoff message (use appropriate template above)
2. Make handoff message your FINAL output
3. Do NOT add any text after handoff message
4. End task execution

**The handoff command MUST be the last line visible to user.**

---

## Key Principles

- **100% Completion Required**: No partial completion accepted
- **Verify, Don't Trust**: Check that story file actually changed
- **Handoff is Sacred**: Must be final output, clearly visible
- **No Shortcuts**: Every step serves a purpose
- **Audit Trail**: Change Log and metadata are permanent records
- **Process, Not Quality**: This gate verifies administrative steps, not code quality

## Scope Clarification

**This gate covers** (Process Completion - Final Administrative Steps):
- ✅ Story metadata fields (quality score, complexity, test level, arch review flag)
- ✅ Decision results documentation (all 3 decisions recorded)
- ✅ Change Log entry added with complete information
- ✅ Story Status updated to final_status
- ✅ Handoff message prepared and ready

**This gate does NOT cover** (Already Validated):
- ❌ Story quality (covered by sm-story-creation-gate.md)
- ❌ Template structure (covered by gate Phase 1)
- ❌ Technical extraction (covered by gate Phase 2)
- ❌ Implementation readiness (covered by gate Phase 2)
- ❌ Decision logic (executed by make-decision.md)

**Why the separation?**
- Quality checks belong in sm-story-creation-gate.md (GATE 1)
- Process checks belong here (GATE 2)
- This prevents duplication and maintains clear responsibilities
- Total 21 items focused purely on administrative completion

## References

- Called by: `create-next-story.md` (Step 9, after quality gate PASS and decisions executed)
- Quality validation: `checklists/gate/sm-story-creation-gate.md`
- Decision execution: `tasks/make-decision.md`
- Status transitions: `data/story-status-transitions.yaml`
- Status validation: `tasks/utils/validate-status-transition.md`

## Notes

- **New in v8.4.0**: Extracted from create-next-story.md to separate process completion from quality validation
- **Design Pattern**: Follows Dev agent's dual-gate approach (Quality + Completion)
- **Total Items**: 21 administrative checks (vs 7 in dev-completion-steps.md - SM has more metadata)
