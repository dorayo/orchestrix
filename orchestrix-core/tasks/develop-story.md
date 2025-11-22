# Implement Story

## Prerequisites
- Story.status ∈ {Approved, TestDesignComplete}
- Story mode != draft
- CONFIG_PATH accessible
- Required standards files available (coding-standards.md, testing-strategy.md)

## Step 0: Idempotency Check (MANDATORY - Fast Exit to Save Tokens)

**Purpose**: Prevent re-implementing already completed stories

**Read Story File**: Use glob pattern `{devStoryLocation}/{story_id}.*.md` to find the story file (handles both `5.2.md` and `5.2.20241117.md` formats)

**Extract**: Story.status

**Check if Already Implemented**:

- **If status = "Review"**:
  ```
  ℹ️ STORY ALREADY IMPLEMENTED (In QA Review)
  Story: {story_id}
  Status: Review

  Implementation already completed. Forwarding to QA for review.

  🎯 HANDOFF TO qa: *review {story_id}
  ```
  **HALT: Implementation already completed, QA handoff sent ✋**

- **If status = "Done"**:
  ```
  ✅ STORY ALREADY COMPLETE (Passed QA)
  Story: {story_id}
  Status: Done

  Story has been implemented AND passed QA review.
  Story is ready for deployment.

  💡 TIP: This story is complete. Start new work via SM *draft

  (No HANDOFF - workflow complete)
  ```
  **HALT: Story already done ✅**

- **If status NOT in ["Approved", "TestDesignComplete"]**:
  ```
  ⚠️ STORY NOT READY FOR IMPLEMENTATION
  Story: {story_id}
  Current Status: {current_status}

  Required status: Approved | TestDesignComplete
  Current status: {current_status}

  Next actions:
  - If "AwaitingArchReview": Architect needs to review (*review-story {story_id})
  - If "RequiresRevision": SM needs to revise (*revise-story {story_id})
  - If "AwaitingTestDesign": QA needs test design (*test-design {story_id})
  - If "Blocked": Fix blockers via SM (*correct-course {story_id})

  HALT: Prerequisites not met ⛔
  ```

**If Status is "Approved" or "TestDesignComplete"**:
- ✅ Log: "Idempotency check passed - proceeding with implementation"
- Continue to Agent Permission Check

---

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

### 1. Load Context (ALL MANDATORY)

Execute utility tasks to load required context:
- Story (status: Approved/TestDesignComplete) - validate status, HALT if invalid
- Standards (CONFIG_PATH.devLoadAlwaysFiles)
- QA test design (if exists)
- Architecture: `utils/load-architecture-context.md`
- Cumulative Context: `utils/load-cumulative-context.md`

**Cumulative Context** loads database/API/models registries from previous stories to avoid duplicates (used in Step 2.5)

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

### 2.5. Validate Against Cumulative Context (MANDATORY)

Execute `{root}/tasks/utils/validate-against-cumulative-context.md`:
- Input: `story`, `cumulative_context` (from Step 1)
- Output: `validation_result` (PASS | WARN | HALT)

**Validates**:
- Database: No duplicate tables/fields, FK references exist
- API: No duplicate endpoints (method + path)
- Models: No duplicate model/interface names

**Actions by Result**:
- **PASS**: Proceed to Step 3
- **WARN**: Log warnings to Dev Log, document justifications, proceed to Step 3
- **HALT**: Stop immediately, set Status="Blocked", escalate to SM with conflict details

**Critical**: This prevents duplicate resources. DO NOT SKIP.

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

**Validates**: Implementation gate ≥95%, architecture compliance, API contracts, test integrity

**Outcomes**: PASS → Continue to GATE 2 | FAIL → HALT, fix issues | ESCALATE → Exit to Architect

---

### 7.5. Update Cumulative Registries (MANDATORY)

**Purpose**: Automatically update cumulative registries with this story's database/API/model changes for future stories to reference.

**⚠️ CRITICAL**: Only execute if GATE 1 = PASS and story involves database/API/model changes.

**Step 1: Update Dev Agent Record with Structured Fields**

Before updating registries, ensure Dev Agent Record contains structured data in these fields:
- `database-changes` (YAML format)
- `api-endpoints-created` (YAML format)
- `shared-models-created` (YAML format)

See story template (`{root}/templates/story-tmpl.yaml`) for field structure and examples.

**If fields are already populated**: Skip to Step 2

**If fields are NOT populated**: Populate them now based on your implementation:

**Example for Backend Story**:
```yaml
database-changes:
  tables_created:
    - name: orders
      description: "Customer orders table"
      fields:
        - name: id
          type: uuid
          constraints: primary key, default gen_random_uuid()
        - name: user_id
          type: uuid
          constraints: not null
          references: users.id
        - name: total_amount
          type: decimal(10,2)
          constraints: not null
      indexes:
        - name: idx_orders_user_id
          fields: user_id
          type: btree
      foreign_keys:
        - name: fk_orders_user
          local_field: user_id
          references: users.id
          on_delete: CASCADE
  migrations:
    - filename: 20250120_create_orders_table.sql
      tables_affected: [orders]
      type: create
      status: applied

api-endpoints-created:
  - method: POST
    path: /api/orders
    description: "Create new order"
    file_path: src/api/orders/create.ts
    auth_required: true
    auth_type: JWT Bearer
    request_schema: CreateOrderRequest
    success_status: 201
    success_schema: OrderResponse

shared-models-created:
  interfaces:
    - name: IOrder
      file_path: src/types/order.ts
      category: entity
  zod_schemas:
    - name: OrderSchema
      file_path: src/schemas/order.ts
      inferred_type: IOrder
```

---

**Step 2: Update Database Registry**

**If story involved database changes**:

Execute `{root}/tasks/utils/update-database-registry.md`:
- Input: `story` (current story with Dev Agent Record)
- Output: Updated `{devDocLocation}/database-registry.md`

**Success Output**:
```
✅ Database Registry Updated

Story 1.3 changes merged:
- Tables created: 1 (orders)
- Tables modified: 0
- Fields added: 5
- Indexes added: 1
- Migrations recorded: 1

Registry: docs/dev/database-registry.md
Total stories tracked: 8
Total tables: 5
Total fields: 42
```

**If no database changes**: Skip this sub-step

---

**Step 3: Update API Registry**

**If story involved API changes**:

Execute `{root}/tasks/utils/update-api-registry.md`:
- Input: `story` (current story with Dev Agent Record)
- Output: Updated `{devDocLocation}/api-registry.md`

**Success Output**:
```
✅ API Registry Updated

Story 1.3 changes merged:
- Endpoints created: 2 (POST /api/orders, GET /api/orders/:id)
- Schemas created: 2 (CreateOrderRequest, OrderResponse)

Registry: docs/dev/api-registry.md
Total stories tracked: 8
Total endpoints: 28
```

**If no API changes**: Skip this sub-step

---

**Step 4: Verify Registry Updates**

**Verification Checks**:
- [ ] Registry files exist and are readable
- [ ] Story data successfully merged
- [ ] No errors during update
- [ ] Backup files created (in case rollback needed)

**If any check fails**:
1. Log error to Dev Log
2. Attempt manual registry update
3. If critical failure, document in Dev Agent Record: "⚠️ Registry update failed - manual sync required"
4. DO NOT halt story completion (registries can be regenerated later)

**If all checks pass**:
```
✅ Cumulative Registries Updated Successfully

All registries synchronized with Story {story_id} changes.
Future stories will see accumulated context from this story.
```

---

**Critical Importance**:

This step closes the loop:
1. Step 1 (Context Loading) → Loaded existing context
2. Step 2.5 (Validation) → Validated no conflicts
3. Step 3 (Implementation) → Created new resources
4. **Step 7.5 (Registry Update) → Recorded new resources for future stories** ← THIS STEP

**Skipping this step BREAKS the system**:
- Next story won't see this story's database tables
- Next story won't see this story's API endpoints
- Next story won't see this story's models/types
- Result: Story isolation problem continues

**DO NOT SKIP THIS STEP.**

---

#### GATE 2: COMPLETION STEPS CHECKLIST (Execution) ✅

**⚠️ CRITICAL**: Only execute if GATE 1 = PASS AND Step 7.5 (Registry Update) = COMPLETE

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

#### Execution Checklist

Complete both gates in sequence:
- [ ] GATE 1 (Self-review) → PASS required
- [ ] Step 7.5 (Registry Update) → COMPLETE required
- [ ] GATE 2 (Completion steps) → 100% required
- [ ] Story Status = "Review"
- [ ] Handoff message as FINAL output (nothing after handoff command)

**CRITICAL**: Handoff message MUST be the absolute last line. Do NOT output summaries/tips after handoff.

## Refs
- contract-driven-phases.md, coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
- dev-self-review.md, validate-implementation.md
- utils/load-architecture-context.md, make-decision.md, execute-checklist.md
- utils/validate-agent-permission.md, utils/validate-api-contract.md
- data/decisions/dev-block-story.yaml, dev-escalate-architect.yaml
- data/story-status-transitions.yaml
- dev-log-tmpl.md, checklists/validation/dev-implementation-gate.md
