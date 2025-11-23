* This file is the **workflow entry point**, not the rules repository
* All detailed rules are loaded from external documents
* Gates are strict, linear, and non-skippable
---

## 0. Preconditions

Before execution:

* `story.status ∈ {Approved, TestDesignComplete}`
* Story mode is not `draft`
* `CONFIG_PATH` is readable
* Standards files exist: `coding-standards.md`, `testing-strategy.md`

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
{root}/tasks/utils/validate-agent-action.md
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

1. Story (validate status again)
2. `CONFIG_PATH.devLoadAlwaysFiles`
3. QA test design (if present)
4. `utils/load-architecture-context.md`
5. `utils/load-cumulative-context.md`

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
utils/validate-against-cumulative-context.md
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

**Resumption Guide Update Rules** (Deterministic Triggers):

Execute `update-resumption-guide.md` in these cases ONLY:

1. **Phase Transitions** (MANDATORY):
   - When switching from Setup → Implementation
   - When switching from Implementation → Testing
   - When switching from Testing → Self-review

2. **User-Initiated Interruption** (MANDATORY):
   - User says "pause", "stop", or "continue later"
   - Before closing session at user request

3. **Blocker Encountered** (MANDATORY):
   - Missing dependency detected
   - Architecture conflict found
   - Test failures after 3 attempts
   - Any HALT condition triggered

4. **Natural Stopping Points** (RECOMMENDED):
   - Before running self-review (Step 8)
   - After implementing all ACs (before testing phase)
   - After all tests pass (before self-review)

**Do NOT update** for:
- ❌ Arbitrary subtask counts (removed "≥3 subtasks" rule)
- ❌ Time-based triggers (too unpredictable)
- ❌ After every single subtask (wasteful)

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
tasks/dev-self-review.md
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

   * `utils/update-database-registry.md`
   * `utils/update-api-registry.md`

3. Verify results (registry readable, merged successfully)

Failure does **not** halt story completion; log the issue.

---

## 10. GATE 2 – Completion Checklist

Execute:

```
checklists/gate/dev-completion-steps.md
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

## 11. Final Handoff (Mandatory Last Output)

Generate handoff message using:

```
templates/dev-handoff-message-tmpl.md
```

Rules:

* Handoff output is the **final** message
* No summaries or commentary after handoff
* Last line must be:

```
*review {story_id}
```
