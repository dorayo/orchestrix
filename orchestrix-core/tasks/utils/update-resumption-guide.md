# Update Resumption Guide

## Purpose

Mandatory utility for updating Dev Log Resumption Guide whenever implementation pauses. Preserves dynamic state (current progress, active work, next steps) to enable seamless resumption across multiple interaction sessions.

## Critical Context: Long-Running Tasks

**Problem**: In complex stories requiring multiple interaction rounds (4+ exchanges), context can be lost between sessions:
- Where did I leave off?
- What was I working on?
- What files were in progress?
- What are the next steps?

**Solution**: Record dynamic state (current progress, active work, next steps) in Resumption Guide at key stopping points.

**Not a Solution**: Duplicating static workflow rules. Those are defined in task files (develop-story.md, dev-self-review.md, etc.) and should not be copied to Resumption Guide.

## When to Call This Utility

**MANDATORY** in these situations:

1. **Phase Transitions**:
   - When switching from Setup → Implementation
   - When switching from Implementation → Testing
   - When switching from Testing → Self-review

2. **User-Initiated Interruption**:
   - User says "pause", "stop", or "continue later"
   - Before closing session at user request

3. **Blocker Encountered**:
   - Missing dependency detected
   - Architecture conflict found
   - Test failures after 3 attempts
   - Any HALT condition triggered

4. **Natural Stopping Points** (recommended):
   - Before running self-review (Step 8)
   - After implementing all ACs (before testing phase)
   - After all tests pass (before self-review)

**Do NOT call** for:
- ❌ Arbitrary subtask counts (removed "≥3 subtasks" rule)
- ❌ Time-based triggers (too unpredictable)
- ❌ After every single subtask (wasteful)

## Inputs

```yaml
required:
  - dev_log_path: Path to dev log file
  - current_phase: Current phase number (1-4)
  - current_subtask: Current subtask identifier
  - next_steps: What to do when resuming

optional:
  - context_notes: Important technical context to preserve
  - blocking_issues: Issues that need resolution
  - decisions_made: Key decisions in this session
```

## Process

### 1. Load Current Dev Log

Read: `{dev_log_path}`

Locate: `## Resumption Guide` section

### 2. Generate Resumption Content

**Template**: Use `{root}/templates/dev-resumption-guide-tmpl.md`

**Fill in these placeholders**:
- `{timestamp}`: Current date/time
- `{phase}`: Current phase number (1-4)
- `{subtask}`: Current subtask identifier
- `{session_number}`: Session count since story started
- Progress summaries, next steps, technical context, blocking issues, decisions

**IMPORTANT**: The Resumption Guide should contain ONLY dynamic state information. Static rules (GATE requirements, handoff protocols) are defined in task files and should NOT be duplicated here.

### 3. Update Dev Log

**Replace** existing Resumption Guide section with new content.

**Critical**: Focus on dynamic state only (current progress, pending work, context). Do NOT duplicate static rules from task files.

### 4. Verification

After updating:
- [ ] Resumption Guide section present
- [ ] Current phase and subtask documented
- [ ] Next steps clearly listed (specific, actionable)
- [ ] Active files and context documented
- [ ] Blockers documented (if any)
- [ ] NO duplication of static rules (GATE requirements, handoff protocols)

## Output

```yaml
result: SUCCESS
message: "Resumption Guide updated with current state"
phase: {current_phase}
subtask: {current_subtask}
next_steps_count: {count}
dev_log_path: {path}
```

## Usage Examples

### Example 1: Pausing After Phase 1

```markdown
## Resumption Guide

**Last Updated**: 2025-01-22 14:30:00
**Session**: 1

**Current Progress**:
- Phase: Implementation (Phase 2 of 4)
- Current Subtask: AC-3: Implement password validation
- Subtask Index: 5/12

**Completed Work**:
- ✅ AC-1: User model interface
- ✅ AC-2: Database schema
- ✅ Subtasks 1-4 completed
- ✅ Files created: User.ts, user-schema.sql

**Next Steps** (when resuming):
1. Complete AC-3: Add password strength validation to PasswordValidator class
2. Write unit tests for password validation (min 8 chars, special chars, etc.)
3. Update User model to include password field
4. Run tests and verify password validation works

**Active Files**:
- src/auth/PasswordValidator.ts (in progress - 50% done)
- src/models/User.ts (needs password field addition)
- tests/auth/password-validator.test.ts (not started)

**Context Notes**:
- Using bcrypt library (approved in architecture)
- Minimum password length: 8 characters (from PRD)
- Must validate: length, uppercase, lowercase, number, special char

**Blockers**: None
```

### Example 2: User Says "Pause"

```
DEV: Completed Phase 2, moving to Phase 3...

User: pause here, I need to review

DEV: [Before stopping]
→ Call update-resumption-guide.md
→ Update Resumption Guide with:
  - Current Phase: Testing (Phase 3)
  - Completed: All implementation done, 8 ACs finished
  - Next Steps: Run full test suite, fix any failures, then self-review
  - Active Files: List all modified files
  - Context: All tests passing locally

[Then stop - NO duplication of GATE rules or handoff protocols]
```

### Example 3: Multiple Sessions

```
Session 1:
→ Implement ACs 1-4
→ Update Resumption Guide: Phase 2, Subtask 5, next steps
→ User: continue later

Session 2: [Resume from Resumption Guide]
→ Load Dev Log
→ Read Resumption Guide
→ See: Current Phase = Implementation (Phase 2), Subtask 5
→ See: Next Steps = "Complete AC-5: Email validation"
→ See: Active Files = EmailValidator.ts (in progress)
→ Continue from Subtask 5 (exactly where left off)

Session 3: [After blocker]
→ Encountered blocker: Missing email validation library
→ Update Resumption Guide: Blocker documented
→ HALT and escalate

Session 4: [After blocker resolved]
→ Load Dev Log
→ Read Resumption Guide
→ See: Blocker resolved, library approved
→ Continue implementation
```

## Key Principles

### 1. Dynamic State Only

Store ONLY information that changes during implementation:
- Current phase and subtask
- Completed work
- Next steps
- Active files and context
- Blockers (if any)

### 2. No Static Rule Duplication

DO NOT include in Resumption Guide:
- ❌ GATE 1/GATE 2 requirements (defined in dev-self-review.md and dev-completion-steps.md)
- ❌ Handoff protocols (defined in develop-story.md Step 10)
- ❌ Architecture standards (loaded via load-architecture-context.md)
- ❌ Story ACs (in story file, always accessible)

**Why**: Static rules don't change and create bloat. The task files are the source of truth.

### 3. Actionable Next Steps

Next steps should be:
- Specific: "Implement AC-3: Password validation" (not "continue implementation")
- Concrete: "Write unit tests for PasswordValidator class" (not "write tests")
- Ordered: List in execution order

### 4. Minimal but Sufficient

Include only what's needed to resume work efficiently:
- ✅ Where you left off (phase, subtask)
- ✅ What's been done (completed ACs, files)
- ✅ What's next (specific tasks)
- ✅ Context (active files, pending work)
- ❌ NOT: Full workflow rules, gate checklists, handoff templates

## Integration Points

**Called by**:
- `develop-story.md` - Before each pause
- `apply-qa-fixes.md` - Before each pause
- Any task that may span multiple interactions

**Calls**:
- None (utility, updates Dev Log only)

## Blocking Conditions

- Dev Log file not found (create if needed)
- Cannot write to Dev Log (permission issue)
- Missing required inputs (phase, subtask, next_steps)

## Success Criteria

- Resumption Guide updated in Dev Log
- Current phase and subtask documented
- Next steps are specific and actionable
- Active files and context preserved
- Blockers documented (if any)
- NO duplication of static rules from task files

## References

- `tasks/develop-story.md` - Main implementation flow
- `tasks/dev-self-review.md` - GATE 1 details
- `checklists/gate/dev-completion-steps.md` - GATE 2 details
