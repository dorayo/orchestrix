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

**Resume**: Parse Resumption Guide → continue from current_subtask

### 3. Implement Tasks
Per task/subtask:
1. Identify phase (1-4, see contract-driven-phases.md)
2. Map to AC
3. Implement (follow standards + Dev Notes)
4. Write tests (P0→P1→P2 if QA design exists)
5. Validate (tests + lint)
6. Update: Mark [x], Dev Log, Resumption Guide, File List
7. Phase done → Add Phase Summary

### 4. Errors
Use `make-decision.md`:

**AC unclear**: dev-block-story → BLOCK → Status=Blocked, handoff SM, HALT

**Architecture conflict**: dev-escalate-architect → ESCALATE (HALT) | DOCUMENT (proceed)

**Test design issue**: Update qa_test_design_metadata.dev_feedback, continue

**Test fail**: Fix implementation, 3 attempts max → escalate

**Dependency missing**: Document, HALT

**Before HALT**: Update Resumption Guide (current_phase, current_subtask, next_steps, context)

### 5. Complete

**Execute these steps in order (ALL MANDATORY):**

1. Add Dev Log Final Summary

2. **MANDATORY SELF-REVIEW GATE**:

   **Execute**: `{root}/tasks/dev-self-review.md`

   This executes:
   - Implementation gate checklist (must pass ≥95%)
   - Architecture compliance validation
   - API contract validation (multi-repo)
   - Test integrity validation
   - DoD checklist (100% of critical items)
   - Implementation rounds analysis

   **On FAIL**:
   - HALT immediately
   - Status remains InProgress
   - Output detailed failure report with action items
   - DO NOT proceed to Review
   - Fix issues and re-run *develop-story

   **On PASS**:
   - Self-review report generated
   - Dev Agent Record updated with self-review results
   - Proceed with status transition

   **On ESCALATE** (≥3 rounds with recurring issues):
   - HALT
   - Status = Escalated
   - Output escalation report
   - Handoff to Architect
   - EXIT task

3. Update Dev Agent Record (if not done by self-review):
   - model, summary, file_list, dev_log_reference
   - open_issues, implementation_rounds
   - self_review_result, self_review_date

4. Add Change Log entry with transition details:
   ```
   | {date} {time} | Dev | InProgress → Review | Round {N}, Self-Review: PASS, Gate: {score}%, Tests: {count}, Files: {count} |
   ```

5. **VALIDATE STATUS TRANSITION**:

   **Execute**: `{root}/tasks/utils/validate-agent-permission.md`

   **Input**:
   ```yaml
   agent_id: dev
   story_path: {story_path}
   action: mark_complete
   target_status: Review
   ```

   **On FAIL**:
   - Log validation error
   - HALT with error details
   - DO NOT update status

   **On PASS**:
   - Proceed with status update

6. **UPDATE STORY STATUS FIELD** (REQUIRED):
   - Set Story Status = `Review`
   - Verify status update succeeded before proceeding

7. **OUTPUT HANDOFF MESSAGE** (REQUIRED - MUST BE FINAL OUTPUT):

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

⚠️ Warnings: {list any: open_issues, dev_feedback, minor issues}

🎯 HANDOFF TO QA:
*review {story_id}
```

**CRITICAL**: The handoff command `*review {story_id}` MUST be the last line of your output, clearly visible.

## Refs
- contract-driven-phases.md, coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
- dev-self-review.md, validate-implementation.md
- utils/load-architecture-context.md, make-decision.md, execute-checklist.md
- utils/validate-agent-permission.md, utils/validate-api-contract.md
- data/decisions/dev-block-story.yaml, dev-escalate-architect.yaml
- data/story-status-transitions.yaml
- dev-log-tmpl.md, checklists/completion/story-dod-checklist.md
- checklists/validation/dev-implementation-gate.md
