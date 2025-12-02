# PO Epic-Level Course Correction

## Purpose

Handle Epic-level changes: modify epic, create new epic, merge/split epics, reorder stories, or deprecate epic.
Process free-form change descriptions spanning one or more epics.
Escalate to higher layers if architecture or PRD changes detected.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Textual description of epic-level change |
| epic_id | string | No | Specific epic ID if known (e.g., "5") |
| escalation_source | string | No | Agent that escalated (SM, etc.) |

## Process

### Step 1: Classify Change Level

Execute: `tasks/utils/classify-change-level.md`

```yaml
Input:
  change_description: "{change_description}"
  context:
    explicit_epic_id: "{epic_id}"
    current_agent: "PO"
```

**IF result == REDIRECT:**

- IF level == STORY:
  ```
  🎯 HANDOFF TO SM: *correct-course {story_id} - Single story scope
  ```
- IF level == TECH:
  ```
  🎯 HANDOFF TO ARCHITECT: *resolve-tech-change - {reasoning}
  ```
- IF level == PRODUCT:
  ```
  🎯 HANDOFF TO PM: *revise-prd - {reasoning}
  ```

Output handoff_message and **HALT**.

### Step 2: Determine Action Type

Analyze `change_description` to identify action:

| Indicator Keywords | Action Type |
|-------------------|-------------|
| "reorder", "reprioritize", "move story", "adjust scope" | MODIFY_EPIC |
| "missing epic", "need new epic", "add epic", "new feature area" | CREATE_EPIC |
| "split epic", "too large", "break into" | SPLIT_EPIC |
| "merge epics", "combine", "consolidate" | MERGE_EPICS |
| "remove epic", "obsolete", "no longer needed" | DEPRECATE_EPIC |
| "reorder epics", "change epic sequence", "reprioritize epics" | REORDER_EPICS |

### Step 3: Load Context

1. Read core-config.yaml to determine project mode (monolith/multi-repo)
2. Read all epic files:
   - Monolith: `{epics_path}/epic-*.md`
   - Multi-repo: `{epics_path}/epic-*.yaml`
3. Determine `max_epic_id` across all epics
4. Read stories within affected epic(s)
5. Read PRD for epic alignment verification
6. Read Architecture for technical context

### Step 4: Execute Action

#### IF MODIFY_EPIC:

1. Load epic file
2. Adjust story sequence within epic
3. Update epic scope/description if needed
4. If adding/removing stories:
   - CREATE_STORY/DEPRECATE_STORY → Delegate to SM via downstream HANDOFF
5. Update epic file

#### IF CREATE_EPIC:

1. Calculate new epic number: `max_epic_id + 1`
2. Determine format based on project mode:
   - **Monolith**: Create `epic-{n}.md` using `templates/epic-tmpl.yaml`
   - **Multi-repo**: Create `epic-{n}.yaml` with repository assignments
3. Populate from change_description:
   - Epic title and goal
   - Initial story list (placeholders)
   - Target repository (if multi-repo)
4. Write epic file
5. Update PRD epic list reference (or note for PM)
6. Output downstream HANDOFF to SM for story creation

#### IF SPLIT_EPIC:

1. Load original epic
2. Identify split boundary from change_description
3. Reduce scope of original epic
4. Create new epic: `max_epic_id + 1`
5. Reassign stories to appropriate epic:
   - Update story files with new epic reference
   - Update both epic files
6. Update cross-epic dependencies

#### IF MERGE_EPICS:

1. Identify source and target epics from change_description
2. Keep lower-numbered epic as target
3. Move all stories from source to target:
   - Renumber stories: `{target_epic}.{max + n}`
   - Update story files with new IDs
4. Update target epic with merged content
5. Deprecate source epic(s)

#### IF DEPRECATE_EPIC:

1. Load epic file
2. Set status to "Deprecated"
3. Add deprecation reason
4. Handle contained stories:
   - Move to another epic, OR
   - Deprecate stories (delegate to SM)
5. Update PRD epic list reference

#### IF REORDER_EPICS:

1. Load PRD document
2. Update epic priorities/sequence in PRD
3. **Do NOT renumber epic IDs** - preserve references
4. Update execution_order metadata if exists

### Step 5: Generate Sprint Change Proposal

Create proposal document:

```markdown
# Sprint Change Proposal

## Action Type
{action_type}

## Issue Summary
{change_description}

Analysis: {detailed analysis from change-navigation.md}

## Impact Scope
- Epics affected: {count} - [{epic_ids}]
- Stories affected: {count} - [{story_ids}]

## Proposed Changes

### Epic Changes
{list of epic file changes with diff-style output}

### Story Changes
{list of story file changes}

### PRD Updates Needed
{list of PRD sections to update, if any}

## New IDs Created
- Epic IDs: [{new_epic_ids}]
- Story IDs: [{new_story_ids}]

## Downstream Handoffs Required
{list of HANDOFF messages for downstream agents}

## Risk Assessment
{identified risks and mitigations}
```

### Step 6: Escalation Decision

Collect analysis results:
```yaml
analysis_result:
  epics_impacted: {count}
  requires_architecture_change: {boolean}
  requires_prd_change: {boolean}
  mvp_scope_affected: {boolean}
  resolvable_within_epic: {boolean}
  action_type: "{action_type}"
  story_changes:
    - story_id: "{story_id}"
      change_type: "AC_ADD" | "AC_MODIFY" | "AC_DELETE" | "STORY_CREATE" | "STORY_RESTRUCTURE"
      story_exists: {boolean}
```

Execute: `data/decisions/po-change-escalation.yaml`

- **ROUTE_TO_DEV**: Proceed to Step 7a (direct to Dev)
- **HANDLE_IN_EPIC**: Proceed to Step 7b (via SM)
- **ESCALATE_TO_TECH**: Output HANDOFF to Architect and **HALT**
- **ESCALATE_TO_PRODUCT**: Output HANDOFF to PM and **HALT**

### Step 7a: Finalize - Direct to Dev (if ROUTE_TO_DEV)

适用条件：所有变更都是对已存在Story的AC修改（增加/修改/删除），无需创建新Story或重构Story结构。

1. Present Sprint Change Proposal to user
2. Request explicit approval
3. IF approved:
   - Apply approved changes to story files
   - Set affected stories status to `Approved`
   - Determine implementation order based on story dependencies
4. Output HANDOFF directly to Dev

**实现顺序判定**：
- 检查Story间的依赖关系（如Story A的AC引用Story B的输出）
- 无依赖时按Story ID升序
- 有依赖时按依赖拓扑排序

### Step 7b: Finalize - Via SM (if HANDLE_IN_EPIC)

适用条件：需要创建新Story，或Story需要重新分解/重构。

1. Present Sprint Change Proposal to user
2. Request explicit approval
3. IF approved:
   - Apply approved changes to epic/story files
   - Update PRD epic list if structure changed
4. Output HANDOFF to SM

## Output

**Success - Direct to Dev (ROUTE_TO_DEV):**
```yaml
routing: DEV_DIRECT
action_type: MODIFY_EPIC
affected_stories:
  - story_id: "{story_id}"
    change_type: "AC_ADD" | "AC_MODIFY" | "AC_DELETE"
    changes:
      - "{description of AC change}"
implementation_order: ["{story_id_1}", "{story_id_2}", ...]
dependency_notes: "{dependency explanation}"
change_summary: "{Brief description}"
```

**Downstream HANDOFF to Dev:**
```
🎯 HANDOFF TO DEV: *develop-story {first_story_id}

## 变更上下文
- 来源: PRD修订 → Epic {epic_id} 影响
- 变更类型: Story AC修改

## 受影响的Stories（按实现顺序）
1. Story {story_id_1}:
   - 新增AC: AC-{n}: {description}
   - 修改AC: AC-{m}: {old_description} → {new_description}
   - 删除AC: AC-{k}: {description} (已移除)

2. Story {story_id_2}: (依赖 Story {story_id_1})
   - 新增AC: ...

## 实现顺序
{story_id_1} → {story_id_2} → ...
依赖说明: {dependency_notes}

---
请先实现 Story {first_story_id}，完成后继续下一个。
```

---

**Success - Via SM (HANDLE_IN_EPIC):**
```yaml
routing: VIA_SM
action_type: {MODIFY_EPIC | CREATE_EPIC | SPLIT_EPIC | MERGE_EPICS | DEPRECATE_EPIC | REORDER_EPICS}
affected_epics:
  - id: "{epic_id}"
    action: "modified" | "created" | "deprecated" | "merged_into_{target}"
    file_path: "{path}"
new_epic_ids: ["{new_id}", ...]
affected_stories: ["{story_id}", ...]
prd_updated: {boolean}
change_summary: "{Brief description}"
```

**Downstream HANDOFF to SM:**
```
🎯 HANDOFF TO SM: *correct-course
Context: Epic {epic_id} restructured, stories need alignment
Stories to review: [{story_ids}]
Action needed: Review and update story references
```

---

**Escalate to Architect:**
```
🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
Context: {escalation_context}
Architecture impact: {description}
Epics affected: {count}
Reason: {reasoning}
```

**Escalate to PM:**
```
🎯 HANDOFF TO PM: *revise-prd
Context: {escalation_context}
PRD sections affected: {sections}
MVP impact: {boolean}
Epics affected: {count}
Reason: {reasoning}
```
