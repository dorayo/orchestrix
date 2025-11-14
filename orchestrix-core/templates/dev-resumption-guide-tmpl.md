# DEV Resumption Guide Template

**Context**: This template is used by `update-resumption-guide.md` to preserve context and workflow rules when implementation pauses

**Usage**: Replace placeholders with actual values when generating resumption guide

---

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

**Reference**: Full rules in `{root}/agents/common/common-workflow-rules.yaml`

**Key Rules for DEV (must follow strictly)**:

1. ✅ **TDD Flow** - RED → GREEN → REFACTOR (no production code before failing test)
2. ✅ **Dev Log Maintenance** - Append-only, update after every subtask
3. ✅ **Test Integrity** - NEVER weaken tests, fix implementation instead
4. ✅ **Architecture Compliance** - Validate against docs, follow naming conventions
5. ✅ **API Contracts** - Exact schema match (multi-repo)
6. ✅ **COMPLETION GATES** - GATE 1 (self-review ≥95%) → GATE 2 (completion steps 100%) → Handoff
7. ✅ **Status Management** - Validate transitions, update to "Review" only after both gates
8. ✅ **Handoff Protocol** - Handoff message is FINAL output, `*review {story_id}` is LAST LINE

⚠️ **Critical Reminders**:
- Task NOT complete until handoff message output
- DO NOT SKIP GATE 2 even if GATE 1 passes
- Both gates must pass before marking story Review

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

**Placeholder Definitions**:
- `{timestamp}`: Current date/time in YYYY-MM-DD HH:MM:SS format
- `{phase}`: Current phase number (1-4)
- `{subtask}`: Current subtask identifier (e.g., "1.3")
- `{session_number}`: Session count since story started
- `{percentage}`: Completion percentage of current subtask
- `{next_step_N}`: Specific next action to take
- `{key_technical_detail_N}`: Important technical context to remember
- `{blocking_issue_N}`: Issues preventing progress
- `{decision_N}`: Key decisions made in this session
