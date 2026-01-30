---
description: "Execute the develop-story task"
---

When this command is used, execute the following task:

- This file is the **workflow entry point**, not the rules repository
- All detailed rules are loaded from external documents
- Gates are strict, linear, and non-skippable

**Path Convention**: `.orchestrix-core` refers to `.orchestrix-core/` directory (the Orchestrix installation root).
Example: `.orchestrix-core/tasks/util-load-architecture-context.md` → `.orchestrix-core/tasks/util-load-architecture-context.md`

---

## 0. Automation Mode Detection & Conditional HANDOFF Registration

### Step 0.1: Detect Automation Mode

**Check for tmux automation marker file**:

Glob: `.orchestrix-core/runtime/tmux-automation-active`

**Decision**:

- **If file EXISTS** → tmux automation mode → continue to Step 0.2
- **If file NOT FOUND** → manual mode → **skip to Step 0.3**

### Step 0.2: Register Pending HANDOFF (tmux only)

> Prevents workflow breakage if context compression causes HANDOFF to be forgotten.

**Action**: Write `.orchestrix-core/runtime/pending-handoff.json`:

```json
{
  "source_agent": "dev",
  "target_agent": "qa",
  "command": "*review {story_id}",
  "story_id": "{story_id}",
  "task_description": "Story {story_id} implementation",
  "registered_at": "{current_ISO_timestamp}",
  "status": "pending"
}
```

**Verify**: Read file → Output: `[HANDOFF-REGISTERED] dev -> qa: *review {story_id}`

⛔ **HALT if** file creation failed (tmux mode requires fallback).

---

### Step 0.3: Preconditions

Before execution:

- `story.status ∈ {Approved, TestDesignComplete}`
- Story mode is not `draft`
- `core-config.yaml` is readable

If any condition fails → **HALT**

---

## 1. Idempotency Check (Explicit Gate)

**Locate Story File** (⚠️ MUST use Glob - filenames include title slug):

> **NEVER** attempt to Read directly with `{story_id}.md` - this will fail.
> Story files are named `{story_id}.{title-slug}.md` (e.g., `3.2.user-login.md`)

1. **Use Glob tool FIRST**: `{devStoryLocation}/{story_id}.*.md`
2. **Then Read** the exact file path returned by Glob

Extract: `story.status`

**If status = Review:**
Output QA handoff (`*review {story_id}`) → **HALT**

**If status = Done:**
Output completion notice → **HALT**

**If status ∉ {Approved, TestDesignComplete}:**
Output status error → **HALT**

**Else:**
Continue execution

---

## 2. Permission Validation

Execute:

```
.orchestrix-core/tasks/util-validate-agent-action.md
```

Input:

```yaml
agent_id: dev
story_path: { story_path }
action: implement
```

- On failure → output error → **HALT**
- On success → continue

---

## 3. Context Loading

### 3.1 Story File

Read story from `{devStoryLocation}/{story_id}.*.md`.

Extract and store:

- `story.dev_notes` → primary implementation context
- `story.tasks` → implementation checklist
- `story.acceptance_criteria` → validation criteria

Dev Notes contains all architecture-relevant information pre-extracted by SM. DO NOT load architecture documents separately.

### 3.2 QA Test Design (Conditional)

Glob: `{qa.qaLocation}/assessments/{story_id}-test-design-*.md`

If found: Load for TDD reference.
If not found: Skip.

### 3.3 Cumulative Context

Execute: `.orchestrix-core/tasks/util-load-cumulative-context.md`

On failure or empty: Log warning, continue with `cumulative_context = null`

---

## 4. Dev Log Handling

If log does not exist:

- Initialize using `dev-log-tmpl.md`

If log exists (resuming work):

- Load full Dev Log
- Load the Resumption Guide section
- Restore:
  - active phase
  - current subtask
  - all workflow rules (load from Resumption Guide only; this file does not restate them)

- Continue exactly from restored phase/subtask

---

## 5. Validate Against Cumulative Context (Secondary Check)

**Purpose**: Re-validate to catch any conflicts missed during story creation. This is a **safety net** - SM should have already validated in create-next-story.md Step 4.6.

Execute:

```
.orchestrix-core/tasks/util-validate-against-cumulative-context.md
```

**Expected Result**: PASS (SM should have already caught conflicts)

**Decision**:

- **PASS:** proceed to Step 6
- **WARN:** record warnings in Dev Log, continue to Step 6
- **HALT** (rare case - indicates SM missed a conflict):
  - Update story.status = Blocked
  - Output escalation message with conflict details
  - Include note: "This conflict should have been caught by SM during story creation (Step 4.6)"
  - Handoff to SM: "Story design conflict detected - please revise story"
  - Stop execution

**Note**: If this step HALTs frequently, it indicates SM is not properly executing Step 4.6 validation during story creation.

---

## 6. Implementation (Process Declaration Only)

For each task/subtask in the story:

1. Map to the acceptance criteria
2. Implement according to standards (from loaded files)
3. Write tests (unit → integration → E2E if applicable)
4. Run lint + tests
5. Mark the checkbox `[x]`
6. Update Dev Log
7. Update File List

**Resumption Guide Update Rules**:

Execute `.orchestrix-core/tasks/util-update-resumption-guide.md` ONLY when:

1. **HALT condition** - Any blocker or error
2. **User pause** - User requests to stop
3. **Before self-review** - Final checkpoint

---

## 7. Database Migration Execution (Conditional)

**Purpose**: Execute pending database migrations BEFORE running tests to ensure schema consistency.

### Step 7.1: Detect Schema Changes

Check if the story involves database changes:

**Detection Signals**:

- Tasks mentioning: database, schema, migration, table, column, index, constraint
- Dev Notes containing DB-related keywords
- Files created/modified in `**/migrations/**`, `**/*.entity.ts`, `**/*.model.ts`, `**/schema.prisma`

**If no database changes detected**: Skip to Step 9 (GATE 1 - Self Review)

### Step 7.2: Check Pending Migrations

Execute: `.orchestrix-core/tasks/dev-database-migration.md` (Step 1-2 only)

Framework detection and status check are defined in that task.

**If no pending migrations**: Log "✅ Migrations already applied" → Skip to Step 9

### Step 7.3: Execute Migrations

**⚠️ CRITICAL**: Execute migrations BEFORE running any tests.

Execute: `.orchestrix-core/tasks/dev-database-migration.md` (Step 3-4)

**On Success** (migration_result.status = PASS):

- Log: "✅ Database migrations executed successfully"
- Update Dev Log with migration execution record
- Continue to Step 9

**On Failure** (migration_result.status = FAIL):

- Log: "❌ Migration execution failed: {migration_result.error}"
- Update Dev Log with error details
- Status: Remains InProgress
- Update Resumption Guide with failure details
- **HALT** - Dev must fix migration before continuing

**On Skip** (migration_result.status = SKIP):

- Log reason and continue to Step 9

---

## 8. Error Handling (Delegation Only)

Do not define rules here. Use external decision files:

- Ambiguous AC → `make-decision.md` → block story
- Architecture conflict → escalate via architect decision file
- Test design issues → write feedback + continue
- Test failures → fix (max 3 attempts) → escalate if unresolved
- Missing dependency → document + **HALT**

Before halting:

- Update Resumption Guide with current phase/subtask

---

## 9. GATE 1 – Self Review

Execute:

```
.orchestrix-core/tasks/dev-self-review.md
```

**Input**:

```yaml
story_id: { story_id }
story_path: { story_path }
dev_log_path: { dev_log_path }
cumulative_context: { from Step 3.3 }
```

**Handle return value**:

**If result = "PASS"**:

- Log: "✅ Self-review passed (Gate: {score}%, Round: {N})"
- Store self_review_result in context
- Continue to Step 10 (Registry Update)

**If result = "FAIL"**:

- Output: Detailed failure report from gate_result
- Output: Required actions list with priorities
- Status: Remains InProgress
- Action Required: Fix issues listed in gate_result
- Command to retry: \*develop-story {story_id}
- **HALT**

**If result = "ESCALATE"**:

- Output: Escalation report with recurring issue analysis
- Update: story.status = Escalated
- Update: Add Change Log entry:
  ```
  | {date} {time} | Dev | InProgress → Escalated | Round {N}, Recurring issues detected - Architect review needed |
  ```
- Handoff: {handoff_command from escalation_report}
- **HALT**

---

## 10. Registry Update (Cumulative System Sync)

Only if the story includes DB / API / Model changes:

1. Ensure Dev Agent Record contains structured fields:
   - `database-changes`
   - `api-endpoints-created`
   - `shared-models-created`

2. Execute (as applicable):
   - `.orchestrix-core/tasks/util-update-database-registry.md`
   - `.orchestrix-core/tasks/util-update-api-registry.md`

3. Verify results (registry readable, merged successfully)

Failure does **not** halt story completion; log the issue.

---

## 11. GATE 2 – Completion Checklist

Execute:

```
.orchestrix-core/checklists/gate-dev-completion-steps.md
```

- 100% required
- Any missing item → **HALT**

Checklist verifies (externally defined):

- Dev Log Final Summary
- Dev Agent Record fields
- Change Log entry
- Status transition
- Implementation metadata
- Test integrity
- Story.status = Review

---

## 12. Final Handoff (REQUIRED - MUST BE FINAL OUTPUT)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST complete BOTH sub-steps below.

---

### Step 12.1: Output Human-Readable Handoff Message

Generate handoff message using template:

```
.orchestrix-core/templates/dev-handoff-message-tmpl.md
```

**Required format** (for human visibility and logging):

```
✅ IMPLEMENTATION COMPLETE
Story: {story_id}
Status: Review

🎯 HANDOFF TO qa: *review {story_id}
```

**STOP**: The `🎯 HANDOFF TO` line must be your FINAL output. Hook handles the rest.
