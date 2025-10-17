# Implement Story

## Prerequisites
- Story.status ∈ {Approved, TestDesignComplete}
- Story mode != draft
- CONFIG_PATH accessible
- Required standards files available (coding-standards.md, testing-strategy.md)

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
- All tasks/subtasks marked [x]
- All validations + regression pass (EXECUTE & CONFIRM)
- Dev Log complete with Final Summary
- Dev Agent Record updated with Dev Log reference
- File List complete
- DoD checklist executed ({root}/tasks/execute-checklist.md with {root}/checklists/completion/story-dod-checklist.md)
- Results logged to Dev Agent Record
- Story.status = Review
- HALT after handoff

## Flow

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
- Add Dev Log Final Summary
- Execute: {root}/tasks/execute-checklist.md
  - Checklist: {root}/checklists/completion/story-dod-checklist.md
- Update Dev Agent Record: model, summary, file_list, dev_log_reference, open_issues, dod_result
- Change Log: Add entry
- Status → Ready for Review

**Handoff**:
```
✅ IMPLEMENTATION COMPLETE
Story: {id} | Status: Ready for Review
Tasks: {done}/{total} | Tests: {count} | Files: {count}
Dev Log: {path} | DoD: {%}
Next: QA 'review-story {id}'
```

Warn if: open_issues, dev_feedback, DoD < 100%

## Refs
- contract-driven-phases.md, coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
- utils/load-architecture-context.md, make-decision.md, execute-checklist.md
- data/decisions/dev-block-story.yaml, dev-escalate-architect.yaml
- dev-log-tmpl.md, checklists/completion/story-dod-checklist.md
