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

Execute: `tasks/util-classify-change-level.md`

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

  **IF project.mode = "multi-repo" AND role != "product"**:
  ```
  ⚠️ PRODUCT-LEVEL CHANGE REQUIRED

  This change requires PRD modification, which must be done in the product repository.

  📍 ACTION REQUIRED:
  1. Switch to product repository: cd {product_repo_path}
  2. Execute: @pm *revise-prd

  Context:
  - Source repository: {repository_id}
  - Reason: {reasoning}

  The PRD and Epic definitions are managed in the product repository.
  ```

  **ELSE**:
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

1. Read `core-config.yaml` to determine:
   - `project.mode`: monolith or multi-repo
   - `devStoryLocation`: Story files directory (e.g., `docs/stories`)
   - `prd.prdFile` or `prd.prdShardedLocation`: PRD location

2. Determine paths based on mode:
   ```yaml
   # Path derivation:
   epics_path:
     monolith: "docs/prd"  # Epic files alongside PRD
     multi_repo: "{prdShardedLocation}" or "docs/prd"
   stories_path: "{devStoryLocation}"  # From core-config.yaml
   ```

3. Read all epic files using **Glob**:
   - Monolith: `Glob pattern: docs/prd/epic-*.md`
   - Multi-repo: `Glob pattern: docs/prd/epic-*.yaml`

4. Determine `max_epic_id` across all epics

5. Read stories within affected epic(s) using **Glob**:
   - Pattern: `{devStoryLocation}/{epic_id}.*.md`
   - Example: `docs/stories/3.*.md` for Epic 3's stories
   - **NOT**: `docs/stories/story-3*.md` (incorrect pattern)

6. Read PRD for epic alignment verification

7. Read Architecture for technical context

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
   - **Monolith**: Create `epic-{n}-{title}.md` with epic metadata only
   - **Multi-repo**: Create `epic-{n}-{title}.yaml` with repository assignments
3. Populate from change_description (**Epic metadata only, NO stories**):
   - Epic title and goal
   - Scope description (what this epic covers)
   - Priority/sequence
   - Target repository (if multi-repo)
   - **Empty story list** (placeholder section only)
4. Write epic file
5. Update PRD epic list reference (or note for PM)
6. Output downstream HANDOFF to SM for story creation

**IMPORTANT**: PO is only responsible for Epic structure definition, **not generating any Story content**. Story creation, decomposition, and template population are SM's responsibility.

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

Execute: `data/decisions-po-change-escalation.yaml`

- **ROUTE_TO_DEV**: Proceed to Step 7a (direct to Dev)
- **HANDLE_IN_EPIC**: Proceed to Step 7b (via SM)
- **ESCALATE_TO_TECH**: Output HANDOFF to Architect and **HALT**
- **ESCALATE_TO_PRODUCT**: Output HANDOFF to PM and **HALT**

### Step 7a: Finalize - Direct to Dev (if ROUTE_TO_DEV)

**Applicable when**: All changes are AC modifications (add/modify/delete) to existing Stories, no new Story creation or restructuring required.

1. Present Sprint Change Proposal to user
2. Request explicit approval
3. IF approved:
   - **Read `templates/story-tmpl.yaml` to ensure format compliance**
   - Apply approved changes to story files **following template structure**:
     - AC format: Clear success criteria with Given/When/Then or measurable outcomes
     - Tasks: Maintain TDD cycle structure per AC (Write test → Implement → Verify)
     - Dev Notes: If AC involves DB writes, ensure Data Synchronization Requirements section exists and is populated
   - **Template Compliance Checklist**:
     | Check | Description |
     |-------|-------------|
     | AC ID Format | Use `AC{N}:` prefix (e.g., `AC4:`) |
     | AC Structure | Include clear success criteria |
     | Task Update | Add corresponding task with TDD subtasks for new AC |
     | Dev Notes | If AC involves DB writes → add/update Data Sync Requirements |
     | Section Order | Maintain order per template: Story → Requirements → AC → Tasks → Dev Notes |
   - Set affected stories status to `Approved`
   - Determine implementation order based on story dependencies
4. Output HANDOFF directly to Dev

**Implementation Order Determination**:
- Check dependencies between Stories (e.g., Story A's AC references Story B's output)
- If no dependencies: order by Story ID ascending
- If dependencies exist: order by dependency topological sort

### Step 7b: Finalize - Via SM (if HANDLE_IN_EPIC)

**Applicable when**: New Story creation required, or Story needs decomposition/restructuring.

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
---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: develop-story
args: {first_story_id}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO DEV: *develop-story {first_story_id}

## Change Context
- Source: PRD revision → Epic {epic_id} impact
- Change type: Story AC modification

## Affected Stories (in implementation order)
1. Story {story_id_1}:
   - Added AC: AC-{n}: {description}
   - Modified AC: AC-{m}: {old_description} → {new_description}
   - Removed AC: AC-{k}: {description} (removed)

2. Story {story_id_2}: (depends on Story {story_id_1})
   - Added AC: ...

## Implementation Order
{story_id_1} → {story_id_2} → ...
Dependency notes: {dependency_notes}

---
Please implement Story {first_story_id} first, then continue with the next one.
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

**Downstream HANDOFF to SM (Epic restructure):**
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: correct-course
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO SM: *correct-course
Context: Epic {epic_id} restructured, stories need alignment
Stories to review: [{story_ids}]
Action needed: Review and update story references
```

**Downstream HANDOFF to SM (New epic created):**
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO SM: *draft
Context: New Epic {epic_id} created, requires story creation
Epic title: {epic_title}
Epic goal: {epic_goal}
Epic scope: {scope_description}
Action needed: Create stories for Epic {epic_id} using templates/story-tmpl.yaml
```

---

**Escalate to Architect:**
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: resolve-tech-change
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
Context: {escalation_context}
Architecture impact: {description}
Epics affected: {count}
Reason: {reasoning}
```

**Escalate to PM:**

**IF project.mode = "multi-repo" AND role != "product"**:
```
⚠️ PRODUCT-LEVEL CHANGE REQUIRED

This change requires PRD modification, which must be done in the product repository.

📍 ACTION REQUIRED:
1. Switch to product repository: cd {product_repo_path}
2. Execute: @pm *revise-prd

Context:
- Source repository: {repository_id}
- PRD sections affected: {sections}
- MVP impact: {boolean}
- Epics affected: {count}
- Reason: {reasoning}

The PRD and Epic definitions are managed in the product repository.
```

**ELSE** (monolith or product repo):
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: pm
command: revise-prd
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO PM: *revise-prd
Context: {escalation_context}
PRD sections affected: {sections}
MVP impact: {boolean}
Epics affected: {count}
Reason: {reasoning}
```
