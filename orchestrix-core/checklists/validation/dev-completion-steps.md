# Dev Completion Steps Checklist

---
metadata:
  type: validation
  threshold: 100%
  on_fail: halt
  purpose: "MANDATORY verification that all completion steps executed after implementation - prevents premature termination"
---

## LLM EXECUTION INSTRUCTIONS

**CRITICAL**: This checklist MUST be executed at the END of implement-story.md completion flow.

**Purpose**: Verify ALL administrative and handoff steps were completed. This is NOT optional.

**Execution**:
- This is a GATE, not a suggestion
- ALL items must be [x] to proceed
- ANY item [ ] = HALT immediately
- Check AFTER all implementation and self-review done

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

### 2. Self-Review Execution

| Step | Completed | Evidence |
|------|-----------|----------|
| Self-review task executed | [ ] | dev-self-review.md completed |
| Self-review result: PASS | [ ] | Score: ___% (must be ≥95%) |
| Self-review report generated | [ ] | Logged in Dev Agent Record |

**Result**: ___/3 (Must be 3/3)

**If self-review result was FAIL or ESCALATE**: HALT - This checklist should NOT be reached.

### 3. Dev Agent Record Update

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

### 4. Change Log Entry

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

### 5. Status Field Update

| Step | Completed | Evidence |
|------|-----------|----------|
| Status transition validated | [ ] | validate-agent-permission.md executed |
| Story Status field changed to "Review" | [ ] | Status: Review in story file |
| Status update verified (read back from file) | [ ] | Confirmed "Review" |

**Result**: ___/3 (Must be 3/3)

**CRITICAL**: You MUST actually update the story file's Status field. Not just say you will - DO IT.

### 6. Handoff Message Output

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

🎯 HANDOFF TO QA:
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

**Total Completion**: ___/25 items (Must be 25/25 = 100%)

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

## References

- Called by: `implement-story.md` (Step 5, after self-review)
- Status transitions: `data/story-status-transitions.yaml`
- Permission validation: `tasks/utils/validate-agent-permission.md`
