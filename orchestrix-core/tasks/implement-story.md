# Implement Story

## Prerequisites
- Story.status ∈ {Approved, TestDesignComplete}
- Story mode != draft
- CONFIG_PATH accessible
- Required standards files available (coding-standards.md, testing-strategy.md)

## Agent Permission Check (MANDATORY)

**Execute**: `{root}/tasks/utils/validate-agent-permission.md`

**Input**:
```yaml
agent_id: dev
story_path: {story_path}
action: implement
```

**On FAIL**:
- Output error_message and guidance
- Show responsible_agent for current status
- HALT - Do NOT proceed with implementation

**On PASS**:
- Log permission validation success
- Proceed with implementation

## Definitions
- **Consecutive failure**: Same task fails 3x (lint/test/exec non-zero)
- **Ambiguity**: AC/Task unresolvable from Story + standards
- **RED**: ≥1 test fails for assertion before implementation
- **GREEN**: All tests pass after minimal implementation
- **REFACTOR**: Improve design with green tests; no behavior change

## Gating Conditions (HALT if violated)
- Missing CONFIG_PATH
- Unapproved dependencies
- Ambiguous AC/Tasks (use make-decision.md → dev-block-story)
- 3 consecutive failures on same task
- Failing regression tests
- Missing standards/config files
- No failing test before implementation (no RED phase)

## Story Section Permissions
**Writable (Allowed)**:
- Tasks/Subtasks checkboxes
- Dev Agent Record (+subsections)
- Agent Model Used
- Dev Log Reference
- Implementation Summary
- File List
- Change Log
- Status

**Forbidden (Read-only)**:
- Story
- Acceptance Criteria
- Dev Notes
- Testing

## Completion Criteria
- Agent permission validated
- Implementation round tracked and logged
- All tasks/subtasks marked [x]
- All validations + regression pass (EXECUTE & CONFIRM)
- Dev Log complete with Final Summary
- **Self-review MANDATORY gate passed (≥95%)**
- Implementation gate checklist passed
- Architecture compliance validated
- API contract compliance validated (if multi-repo)
- Test integrity validated
- DoD critical items 100%
- Dev Agent Record updated with self-review results
- File List complete
- Status transition validated
- Story.status = Review
- HALT after handoff

## Flow

### 0. Implementation Round Tracking

**Read Dev Agent Record**: `implementation_rounds` field (default: 0)

**Initialize/Increment**:
- If field missing or 0: Set to 1
- If field exists: Increment by 1
- Update Dev Agent Record with new round number

**Round Context**:
```yaml
implementation_round: {N}
started_at: {timestamp}
previous_rounds: [{list of previous round summaries if >1}]
```

**If Round ≥ 3**:
- Add NOTE in Dev Log: "Implementation Round {N}"
- Review previous QA feedback patterns
- Consider if recurring issues indicate architectural problems
- Document pattern analysis in Dev Log

**Log**:
```markdown
## Implementation Round {N}
Started: {timestamp}
Previous Rounds: {N-1}
Previous Issues: {summary if exists}
```

### 1. Load Context
- Story (status: Approved/TestDesignComplete)
- Standards (CONFIG_PATH.devLoadAlwaysFiles)
- QA test design (if exists)
- Architecture (utils/load-architecture-context.md if needed)

Validate status + sections → HALT if invalid

### 2. Dev Log
**Path**: `{devLogLocation}/{story-id}-dev-log.md`

**New**: Use dev-log-tmpl.md, init storyId/title/timestamp/model/test_strategy

**Resume** (CRITICAL for multi-session stories):

1. **Load Dev Log** and locate Resumption Guide section

2. **Read ENTIRE Resumption Guide**, especially:
   - ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER section
   - All 8 workflow rules
   - GATE 1 and GATE 2 requirements
   - Handoff protocol

3. **Reload Rules into Working Memory**:
   - Acknowledge: "Resuming from Phase X, Subtask Y"
   - Confirm: "Re-loaded 8 critical workflow rules"
   - Confirm: "Understand GATE 1 (self-review) and GATE 2 (completion steps) required at end"
   - Confirm: "Handoff message must be final output"

4. **Verify Resumption Checklist** (in Resumption Guide):
   - [ ] Read Resumption Guide completely
   - [ ] Understand current phase and subtask
   - [ ] Review critical workflow rules
   - [ ] Understand GATE 1 and GATE 2
   - [ ] Remember: Task NOT complete until handoff output
   - [ ] Check if approaching completion
   - [ ] Load architecture documents if needed
   - [ ] Review previous session's decisions

5. **Continue from current_subtask** with rules reinforced

**Why this matters**: In story spanning 4+ sessions, LLM forgets rules. Explicitly re-loading them from Resumption Guide prevents rule decay.

### 3. Implement Tasks
Per task/subtask:
1. Identify phase (1-4, see contract-driven-phases.md)
2. Map to AC
3. Implement (follow standards + Dev Notes)
4. Write tests (P0→P1→P2 if QA design exists)
5. Validate (tests + lint)
6. Update: Mark [x], Dev Log, Resumption Guide, File List
7. Phase done → Add Phase Summary

**⚠️ CRITICAL: Before ANY pause/interruption**:

**If you must stop or pause** (user says "continue", completing a phase, blocking issue, etc.):

Execute: `{root}/tasks/utils/update-resumption-guide.md`

**This preserves**:
- Current progress and next steps
- **8 critical workflow rules** (TDD, test integrity, completion gates)
- **GATE 1 and GATE 2 requirements**
- Handoff protocol
- Resumption checklist

**Why critical**: In multi-session stories (4+ interactions), LLM gradually forgets workflow rules. Resumption Guide forces rule preservation and reload on resume.

**When to call**:
- ✅ After completing a Phase (before user continues)
- ✅ User says "pause" or "continue later"
- ✅ Encountering blocking issue
- ✅ After ≥3 subtasks in one session
- ✅ ANY interruption in flow

**Do NOT skip this** - Rule retention depends on it.

### 4. Errors
Use `make-decision.md`:

**AC unclear**: dev-block-story → BLOCK → Status=Blocked, handoff SM, HALT

**Architecture conflict**: dev-escalate-architect → ESCALATE (HALT) | DOCUMENT (proceed)

**Test design issue**: Update qa_test_design_metadata.dev_feedback, continue

**Test fail**: Fix implementation, 3 attempts max → escalate

**Dependency missing**: Document, HALT

**Before HALT**: Update Resumption Guide (current_phase, current_subtask, next_steps, context)

### 5. Complete

**⚠️ CRITICAL WORKFLOW CHANGE - READ CAREFULLY**:

This completion phase has **TWO MANDATORY GATES** that must be executed in order:

---

#### GATE 1: SELF-REVIEW GATE (Quality) ✅

**Execute**: `{root}/tasks/dev-self-review.md` (see file for detailed criteria)

**Validates**: Implementation gate ≥95%, architecture compliance, API contracts, test integrity, DoD critical items

**Outcomes**: PASS → Continue to GATE 2 | FAIL → HALT, fix issues | ESCALATE → Exit to Architect

---

#### GATE 2: COMPLETION STEPS CHECKLIST (Execution) ✅

**⚠️ CRITICAL**: Only execute if GATE 1 = PASS

**Execute**: `{root}/tasks/execute-checklist.md` with `{root}/checklists/validation/dev-completion-steps.md`

**Verifies** (25 items, 100% required): Dev Log Final Summary, Dev Agent Record (7 fields), Change Log entry, Status = "Review", handoff message ready

**Execution Mode**: STRICT - HALT if <100%, proceed to handoff if 100%

**⚠️ DO NOT SKIP** - Prevents premature termination, guarantees handoff output

---

#### FINAL OUTPUT: HANDOFF MESSAGE 🎯

**After GATE 2 checklist shows 100% completion**:

**Template**: Use `{root}/templates/dev-handoff-message-tmpl.md`

**Key Rules**:
- Handoff message is your FINAL output
- Command `*review {story_id}` is LAST LINE
- Nothing comes after handoff command

---

#### Common Mistake: Premature Termination ❌

**WRONG** (Stopping after GATE 1):
```
✅ SELF-REVIEW PASSED
Story ready for review.

[Agent stops here - WRONG!]
```

**CORRECT** (Complete both gates):
```
✅ SELF-REVIEW PASSED
→ Proceeding to GATE 2: Completion Steps

[Execute completion checklist]
[Update all fields]
[Verify 25/25 items complete]

✅ IMPLEMENTATION COMPLETE
Story: 2.3 → Status: Review
[Full handoff message]

🎯 HANDOFF TO QA:
*review 2.3
```

---

#### Execution Checklist for You (LLM)

Before ending this task, verify:

- [ ] GATE 1 (Self-review) executed → Result: PASS
- [ ] GATE 2 (Completion steps) executed → Result: 100%
- [ ] Dev Log Final Summary written
- [ ] Dev Agent Record updated with 7 fields
- [ ] Change Log entry added to story
- [ ] Story Status field = "Review" (actually changed)
- [ ] Handoff message prepared
- [ ] Handoff message output as FINAL action
- [ ] Command `*review {story_id}` is last line
- [ ] Task ended immediately after handoff

**If ANY [ ] above**: You are NOT done. Complete missing items.

**If ALL [x] above**: Output handoff message NOW and END.

## Refs
- contract-driven-phases.md, coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
- dev-self-review.md, validate-implementation.md
- utils/load-architecture-context.md, make-decision.md, execute-checklist.md
- utils/validate-agent-permission.md, utils/validate-api-contract.md
- data/decisions/dev-block-story.yaml, dev-escalate-architect.yaml
- data/story-status-transitions.yaml
- dev-log-tmpl.md, checklists/completion/story-dod-checklist.md
- checklists/validation/dev-implementation-gate.md
