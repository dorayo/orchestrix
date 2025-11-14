# Update Resumption Guide

## Purpose

Mandatory utility for updating Dev Log Resumption Guide whenever implementation pauses. Ensures critical workflow rules are preserved across multiple interaction sessions.

## Critical Context: Long-Running Tasks

**Problem**: In complex stories requiring multiple interaction rounds (4+ exchanges), LLM gradually "forgets" workflow rules:
- Round 1-2: Strict adherence to all rules
- Round 3-4: Some rules forgotten
- Round 5+: Focus only on implementation, forget completion steps

**Solution**: Force-record workflow rules in Resumption Guide every time work pauses.

## When to Call This Utility

**MANDATORY** in these situations:
1. Completing a Phase (Phase 1 → 2, 2 → 3, etc.)
2. Encountering a blocking issue (need clarification)
3. User says "continue" or "pause here"
4. After completing ≥3 subtasks in one session
5. Before ANY interruption in flow

**Rule**: If you're about to stop/pause for ANY reason, call this FIRST.

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

**Template**:

```markdown
## Resumption Guide

**Last Updated**: {timestamp}
**Current Phase**: {phase}
**Current Subtask**: {subtask}
**Session**: {session_number}

### Where We Are

{brief summary of progress}

**Completed**:
- Phase {X}: {summary}
- Subtasks {list}: {summary}

**In Progress**:
- Current: {subtask_id} - {description}
- Status: {percentage}% complete

### What to Do Next

**Immediate Next Steps**:
1. {next_step_1}
2. {next_step_2}
3. {next_step_3}

**Technical Context**:
- {key_technical_detail_1}
- {key_technical_detail_2}

**Blocking Issues** (if any):
- {blocking_issue_1}

**Decisions Made This Session**:
- {decision_1}
- {decision_2}

---

### ⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER ⚠️⚠️⚠️

**YOU MUST REMEMBER THESE RULES WHEN YOU RESUME**:

1. ✅ **TDD Flow**: RED → GREEN → REFACTOR
   - No production code before failing test
   - Tests are authoritative, never weaken

2. ✅ **Dev Log Maintenance**:
   - Append-only, never overwrite
   - Update after EVERY subtask completion
   - Final Summary required before marking complete

3. ✅ **Test Integrity**:
   - NEVER modify test expectations to make tests pass
   - Fix implementation, not tests
   - Document any test changes with business justification

4. ✅ **Architecture Compliance**:
   - Validate against architecture docs
   - Follow naming conventions
   - Use approved technologies only

5. ✅ **API Contracts** (if multi-repo):
   - Request/response schemas must match exactly
   - Error handling for all contract error codes
   - Validate before marking complete

6. ✅ **COMPLETION REQUIREMENTS** (When all tasks done):

   **GATE 1**: Execute `dev-self-review.md`
   - Implementation gate ≥95%
   - Architecture compliance
   - API contract compliance
   - Test integrity
   - DoD critical items 100%

   **GATE 2**: Execute `dev-completion-steps.md` checklist
   - 25 items, 100% required
   - Update Dev Agent Record (7 fields)
   - Update Change Log
   - Update Status to "Review"
   - Output handoff message as FINAL action

   ⚠️ DO NOT SKIP GATE 2 EVEN IF GATE 1 PASSES
   ⚠️ Task is NOT complete until handoff message output

7. ✅ **Status Management**:
   - Only Dev can modify story in InProgress status
   - Must validate transitions via validate-agent-permission.md
   - Status = "Review" ONLY after both gates pass

8. ✅ **Handoff Protocol**:
   - Handoff message must be FINAL output
   - Command `*review {story_id}` must be LAST LINE
   - Nothing after handoff command

---

### Resumption Checklist

When you resume, verify:
- [ ] Read this Resumption Guide completely
- [ ] Understand current phase and subtask
- [ ] Review critical workflow rules above
- [ ] Understand what GATE 1 and GATE 2 are
- [ ] Remember: Task NOT complete until handoff output
- [ ] Check if approaching completion (need gates?)
- [ ] Load architecture documents if needed
- [ ] Review previous session's decisions

**Then proceed with next steps.**

---
```

### 3. Update Dev Log

**Replace** existing Resumption Guide section with new content.

**Critical**: The "CRITICAL WORKFLOW RULES TO REMEMBER" section must be included EVERY TIME.

### 4. Verification

After updating:
- [ ] Resumption Guide section present
- [ ] Critical rules section present (8 rules)
- [ ] GATE 1 and GATE 2 mentioned explicitly
- [ ] Handoff protocol explained
- [ ] Resumption checklist present

## Output

```yaml
result: SUCCESS
message: "Resumption Guide updated with workflow rules"
rules_preserved: 8
gates_mentioned: [GATE_1, GATE_2]
dev_log_path: {path}
```

## Usage Examples

### Example 1: Pausing After Phase 1

```markdown
**Current Phase**: 1
**Current Subtask**: 1.3
**Next Steps**:
1. Complete Phase 1 remaining subtasks
2. Move to Phase 2 (API implementation)

[Automatically includes 8 critical rules]
[Automatically mentions GATE 1 and GATE 2]
```

### Example 2: User Says "Continue"

```
DEV: Completed Phase 2, moving to Phase 3...

User: pause here, I need to review

DEV: [Before stopping]
→ Call update-resumption-guide.md
→ Preserve: Phase 2 complete, next is Phase 3
→ Include: All 8 workflow rules
→ Remind: GATE 1 and GATE 2 at completion

[Then stop]
```

### Example 3: Multiple Sessions (Critical)

```
Session 1:
→ Update Resumption Guide with rules
→ User: continue

Session 2: [LLM might have forgotten rules]
→ Load Dev Log
→ Read Resumption Guide
→ See: "⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER"
→ See: "GATE 1 and GATE 2 requirements"
→ Reload rules into working memory
→ Continue with rules reinforced

Session 3, 4, 5...:
→ Same: Each resume reloads rules from Resumption Guide
```

## Key Principles

### 1. Explicit is Better Than Implicit

Don't assume LLM will remember rules. Write them down EVERY TIME.

### 2. Repetition for Retention

The same 8 rules appear in Resumption Guide every time. Repetition ensures retention.

### 3. Visual Markers for Attention

```
⚠️⚠️⚠️ CRITICAL WORKFLOW RULES TO REMEMBER ⚠️⚠️⚠️
```

Triple warnings ensure LLM notices this section.

### 4. Gate Awareness

Explicitly mention GATE 1 and GATE 2 requirements, so even if LLM forgets mid-task, the Resumption Guide reminds it.

### 5. Handoff Protocol Preservation

Every Resumption Guide includes handoff protocol, ensuring it's never forgotten.

## Integration Points

**Called by**:
- `implement-story.md` - Before each pause
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
- All 8 critical rules included
- GATE 1 and GATE 2 explicitly mentioned
- Handoff protocol explained
- Resumption checklist present

## References

- `tasks/implement-story.md` - Main implementation flow
- `tasks/dev-self-review.md` - GATE 1 details
- `checklists/validation/dev-completion-steps.md` - GATE 2 details
