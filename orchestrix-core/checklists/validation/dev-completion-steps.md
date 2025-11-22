# Dev Completion Steps Checklist

---
metadata:
  type: validation
  threshold: 100%
  on_fail: halt
  purpose: "MANDATORY verification that all administrative and handoff steps executed after implementation - prevents premature termination"
  scope: "Process completion only - NOT quality validation"
---

## LLM EXECUTION INSTRUCTIONS

**CRITICAL**: This checklist MUST be executed at the END of implement-story.md completion flow, AFTER self-review PASS.

**Purpose**: Verify ALL administrative and handoff steps were completed. This is NOT a quality check.

**Scope**:
- ✅ Process completion (Dev Log, Agent Record, Change Log, Status, Handoff)
- ❌ NOT code quality (covered by validate-quality-gates.md in self-review)

**Execution**:
- This is a GATE, not a suggestion
- ALL items must be [x] to proceed
- ANY item [ ] = HALT immediately
- Check AFTER self-review PASS

**On Failure**:
- HALT immediately
- Output: "COMPLETION STEPS INCOMPLETE"
- List missing steps
- DO NOT output handoff message
- DO NOT end task

---

## MANDATORY COMPLETION STEPS

**Instructions**: Mark [x] for completed, [ ] for not done. ALL must be [x].

### 1. Dev Log Completion

| Step | Completed | Evidence |
|------|-----------|----------|
| Dev Log Final Summary written | [ ] | Path: {dev_log_path} |
| Final Summary includes: story outcome, challenges, decisions | [ ] | Verified in Dev Log |
| Resumption Guide removed or marked N/A | [ ] | No longer needed |

**Result**: ___/3 (Must be 3/3)

### 2. Dev Agent Record Update

| Step | Completed | Evidence |
|------|-----------|----------|
| Agent Model Used filled | [ ] | Model name present |
| Implementation Summary written (3-5 sentences) | [ ] | Summary present |
| File List complete (added/modified/deleted) | [ ] | All files listed |
| Dev Log Reference added | [ ] | Path to dev log |
| Implementation rounds field updated | [ ] | Current round number |
| Self-review results logged | [ ] | Date and score present |
| Open issues documented (if any) | [ ] | Listed or marked "none" |

**Result**: ___/7 (Must be 7/7)

### 3. Change Log Entry

| Step | Completed | Evidence |
|------|-----------|----------|
| Change Log entry added | [ ] | New entry at top of Change Log |
| Entry includes: date, time, agent, transition | [ ] | All fields present |
| Entry includes: round number, gate score | [ ] | Round and score present |
| Entry includes: test count, file count | [ ] | Metrics present |

**Result**: ___/4 (Must be 4/4)

**Example Format**:
```
| 2025-01-14 16:30:00 | Dev | InProgress → Review | Round 1, Self-Review: PASS (96%), Tests: 15, Files: 8 |
```

### 4. Status Field Update

| Step | Completed | Evidence |
|------|-----------|----------|
| Status transition validated | [ ] | validate-agent-permission.md executed |
| Story Status field changed to "Review" | [ ] | Status: Review in story file |
| Status update verified (read back from file) | [ ] | Confirmed "Review" |

**Result**: ___/3 (Must be 3/3)

**CRITICAL**: You MUST actually update the story file's Status field. Not just say you will - DO IT.

### 5. Handoff Message Output

| Step | Completed | Evidence |
|------|-----------|----------|
| Handoff message prepared | [ ] | Message ready |
| Message includes story ID | [ ] | Story ID: ___ |
| Message includes QA command | [ ] | Command: *review {story_id} |
| Message includes summary metrics | [ ] | Round, gate, tests, files |
| Message is final output | [ ] | Nothing after this message |

**Result**: ___/5 (Must be 5/5)

**Handoff Message Template** (MUST USE):
```
✅ IMPLEMENTATION COMPLETE
Story: {id} → Status: Review
Round: {N} | Gate: {score}% | Tests: {count} | Files: {count}
Dev Log: {path}

Self-Review Results:
✅ Implementation Gate: {score}% (≥95% required)
✅ Architecture Compliance: PASS
✅ API Contract Compliance: {PASS|N_A}
✅ Test Integrity: PASS
✅ DoD Critical Items: 100%

⚠️ Warnings: {list or "none"}

🎯 HANDOFF TO qa:
*review {story_id}
```

---

## FINAL VERIFICATION

**Before outputting handoff message, verify**:

- [ ] ALL sections above show X/X (100% completion)
- [ ] Story file actually updated (not just planned)
- [ ] Dev Log file exists at specified path
- [ ] Change Log entry visible in story file
- [ ] Status field reads "Review" (not "InProgress")
- [ ] This is my FINAL action in this task

**Total Completion**: ___/22 items (Must be 22/22 = 100%)

---

## IF ANY ITEM IS NOT COMPLETE

**DO NOT PROCEED**

**Output**:
```
❌ COMPLETION STEPS INCOMPLETE
Cannot proceed to Review status

Missing Steps:
- [ ] {step name}: {what's missing}
- [ ] {step name}: {what's missing}

Action Required:
1. Complete all missing steps
2. Re-run this completion checklist
3. Only after 100% completion, output handoff message

HALTING - Complete missing steps first
```

**DO NOT**:
- Output handoff message
- Say task is complete
- Update status to Review
- Continue to next step

---

## WHEN ALL ITEMS COMPLETE

**You MUST now**:

1. Output the handoff message (use template above)
2. Make handoff message your FINAL output
3. Do NOT add any text after handoff message
4. End task execution

**The handoff command `*review {story_id}` MUST be the last line visible to user.**

---

## Key Principles

- **100% Completion Required**: No partial completion accepted
- **Verify, Don't Trust**: Check that story file actually changed
- **Handoff is Sacred**: Must be final output, clearly visible
- **No Shortcuts**: Every step serves a purpose
- **Audit Trail**: Change Log and Dev Agent Record are permanent records
- **Process, Not Quality**: This checklist verifies administrative steps, not code quality

## Scope Clarification

**This checklist covers** (Process Completion):
- ✅ Dev Log Final Summary written
- ✅ Dev Agent Record updated (7 fields)
- ✅ Change Log entry added
- ✅ Story Status updated to "Review"
- ✅ Handoff message prepared

**This checklist does NOT cover** (Quality Validation):
- ❌ Code quality (covered by validate-quality-gates.md)
- ❌ Test passing (covered by gate Critical Item 1)
- ❌ Architecture compliance (covered by gate Section 6)
- ❌ Self-review execution (already completed before this checklist)

**Why the separation?**
- Quality checks belong in dev-self-review.md (GATE 1)
- Process checks belong here (GATE 2)
- This prevents duplication and maintains clear responsibilities

## References

- Called by: `implement-story.md` (GATE 2, after self-review PASS and registry update)
- Quality validation: `tasks/dev-self-review.md` → `tasks/utils/validate-quality-gates.md`
- Status transitions: `data/story-status-transitions.yaml`
- Permission validation: `tasks/utils/validate-agent-permission.md`
