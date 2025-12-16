* This file is the **workflow entry point**, not the rules repository
* All detailed rules are loaded from external documents
* Gates are strict, linear, and non-skippable

**Path Convention**: `{root}` refers to `.orchestrix-core/` directory (the Orchestrix installation root).
Example: `{root}/tasks/util-load-architecture-context.md` → `.orchestrix-core/tasks/util-load-architecture-context.md`

---

## 0. Register Pending HANDOFF (Fallback Safety Net)

**Purpose**: Register handoff information BEFORE starting the task. This ensures the hook can recover the handoff even if context compression causes the agent to forget.

Execute:
```
{root}/tasks/util-register-pending-handoff.md
```

Input:
```yaml
source_agent: dev
target_agent: qa
command: "*review"
story_id: "{story_id}"
task_description: "Story {story_id} implementation"
```

**Output**: `[HANDOFF-REGISTERED] dev -> qa: *review {story_id}`

---

## 0.1. Preconditions

Before execution:

* `story.status ∈ {Approved, TestDesignComplete}`
* Story mode is not `draft`
* `core-config.yaml` is readable

If any condition fails → **HALT**

---

## 1. Idempotency Check (Explicit Gate)

Read file: `{devStoryLocation}/{story_id}.*.md`
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
{root}/tasks/util-validate-agent-action.md
```

Input:

```yaml
agent_id: dev
story_path: {story_path}
action: implement
```

* On failure → output error → **HALT**
* On success → continue

---

## 3. Context Loading (Mandatory Load Order)

Load and parse the following, in this exact order:

### 3.1 Story File
Read story from `{devStoryLocation}/{story_id}.*.md`, validate status again.

### 3.2 Architecture Context (CRITICAL)
Execute `{root}/tasks/util-load-architecture-context.md`:

```yaml
input:
  story_type: {{detected_from_story}}  # Backend | Frontend | FullStack
```

**IMPORTANT**: This utility automatically:
- Reads `core-config.yaml` for architecture configuration
- Uses glob patterns to match files with any prefix
- Handles both sharded and monolithic architecture modes
- Returns structured `architecture_context` with tech_stack, standards, file_structure, etc.

**DO NOT** directly read files like `docs/architecture/coding-standards.md` - use the utility.

### 3.3 QA Test Design (if present)

**Search for test design file**:
```yaml
# Use glob pattern to find test design (filename includes date)
pattern: "{qa.qaLocation}/assessments/{story_id}-test-design-*.md"
example: "docs/qa/assessments/1.3-test-design-20250115.md"

# If multiple matches, use the most recent (latest date in filename)
```

Load the matched file if exists. Extract test scenarios for TDD reference.

### 3.4 Cumulative Context
Execute `{root}/tasks/util-load-cumulative-context.md` to load:
- Database registry
- API registry
- Shared models

Any load failure → **HALT**

---

## 4. Dev Log Handling

If log does not exist:

* Initialize using `dev-log-tmpl.md`

If log exists (resuming work):

* Load full Dev Log
* Load the Resumption Guide section
* Restore:

  * active phase
  * current subtask
  * all workflow rules (load from Resumption Guide only; this file does not restate them)
* Continue exactly from restored phase/subtask

---

## 5. Validate Against Cumulative Context (Secondary Check)

**Purpose**: Re-validate to catch any conflicts missed during story creation. This is a **safety net** - SM should have already validated in create-next-story.md Step 4.6.

Execute:

```
{root}/tasks/util-validate-against-cumulative-context.md
```

**Expected Result**: PASS (SM should have already caught conflicts)

**Decision**:

* **PASS:** proceed to Step 6
* **WARN:** record warnings in Dev Log, continue to Step 6
* **HALT** (rare case - indicates SM missed a conflict):

  * Update story.status = Blocked
  * Output escalation message with conflict details
  * Include note: "This conflict should have been caught by SM during story creation (Step 4.6)"
  * Handoff to SM: "Story design conflict detected - please revise story"
  * Stop execution

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

Execute `{root}/tasks/util-update-resumption-guide.md` ONLY when:

1. **HALT condition** - Any blocker or error
2. **User pause** - User requests to stop
3. **Before self-review** - Final checkpoint

---

## 7. Error Handling (Delegation Only)

Do not define rules here. Use external decision files:

* Ambiguous AC → `make-decision.md` → block story
* Architecture conflict → escalate via architect decision file
* Test design issues → write feedback + continue
* Test failures → fix (max 3 attempts) → escalate if unresolved
* Missing dependency → document + **HALT**

Before halting:

* Update Resumption Guide with current phase/subtask

---

## 8. GATE 1 – Self Review

Execute:

```
{root}/tasks/dev-self-review.md
```

**Input**:
```yaml
story_id: {story_id}
story_path: {story_path}
dev_log_path: {dev_log_path}
architecture_context: {from Step 3.2}
cumulative_context: {from Step 3.4}
```

**Handle return value**:

**If result = "PASS"**:
- Log: "✅ Self-review passed (Gate: {score}%, Round: {N})"
- Store self_review_result in context
- Continue to Step 9 (Registry Update)

**If result = "FAIL"**:
- Output: Detailed failure report from gate_result
- Output: Required actions list with priorities
- Status: Remains InProgress
- Action Required: Fix issues listed in gate_result
- Command to retry: *develop-story {story_id}
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

## 9. Registry Update (Cumulative System Sync)

Only if the story includes DB / API / Model changes:

1. Ensure Dev Agent Record contains structured fields:

   * `database-changes`
   * `api-endpoints-created`
   * `shared-models-created`

2. Execute (as applicable):

   * `{root}/tasks/util-update-database-registry.md`
   * `{root}/tasks/util-update-api-registry.md`

3. Verify results (registry readable, merged successfully)

Failure does **not** halt story completion; log the issue.

---

## 10. GATE 2 – Completion Checklist

Execute:

```
{root}/checklists/gate-dev-completion-steps.md
```

* 100% required
* Any missing item → **HALT**

Checklist verifies (externally defined):

* Dev Log Final Summary
* Dev Agent Record fields
* Change Log entry
* Status transition
* Implementation metadata
* Test integrity
* Story.status = Review

---

## 11. Final Handoff (REQUIRED - MUST BE FINAL OUTPUT)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: This step is NON-NEGOTIABLE. You MUST complete BOTH sub-steps below.

---

### Step 11.1: Output Human-Readable Handoff Message

Generate handoff message using template:
```
{root}/templates/dev-handoff-message-tmpl.md
```

**Required format** (for human visibility and logging):
```
✅ IMPLEMENTATION COMPLETE
Story: {story_id}
Status: Review

🎯 HANDOFF TO qa: *review {story_id}
```

**STOP**: The `🎯 HANDOFF TO` line must be your FINAL output. Hook handles the rest.
