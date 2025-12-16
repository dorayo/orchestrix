# Create Next Story Task

---
* This file is the **workflow entry point**, not the implementation repository
* Complex logic delegated to gates and decisions only
* All story creation logic inline for efficiency
---

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- On failure: HALT with error

## Execution

### 0. Idempotency Check (if story_id provided)

**If story_id parameter NOT provided**: Skip to Step 1

**If story_id provided**:

Load `{root}/core-config.yaml` and extract `devStoryLocation`.

Check if story file exists: `{devStoryLocation}/{story_id}*.md`

**If story file NOT found**:
```
📝 Story {story_id} does not exist yet. Creating it now...
```
Set `next_story_id = {story_id}`, continue to Step 1.

**If story file found**: Extract `Story.status` field, output handoff based on status:

- **Blocked**: `⚠️ STORY BLOCKED - Use: *revise {story_id}` → **HALT**
- **AwaitingArchReview**: `⏳ HANDOFF TO architect: *review {story_id}` → **HALT**
- **RequiresRevision**: `✏️ Use: *revise {story_id}` → **HALT**
- **Approved/TestDesignComplete**: `✅ HANDOFF TO dev: *develop-story {story_id}` → **HALT**
- **AwaitingTestDesign**: `⏳ HANDOFF TO qa: *test-design {story_id}` → **HALT**
- **InProgress**: `🔨 STORY IN PROGRESS - No action needed` → **HALT**
- **Review**: `🔍 HANDOFF TO qa: *review {story_id}` → **HALT**
- **Done**: `✅ STORY COMPLETE - Start next via *draft` → **HALT**
- **Escalated**: `🚨 HANDOFF TO architect: *review-escalation {story_id}` → **HALT**

---

### 1. Load Configuration & Validate PRD

**Read**: `{root}/core-config.yaml`

**Extract**:
- `devStoryLocation`: Where story files are stored
- `prdShardedLocation`: Where PRD shards are located
- `prdSharded`: true/false
- `project.mode`: monolith | multi-repo
- `project.multi_repo.role`: product | backend | frontend | ios | android | monolith
- `project.multi_repo.repository_id`: Current repo ID
- `project.multi_repo.product_repo_path`: Path to product repo

**Validation**:
- If `prdSharded = false`: **HALT** with "PRD not sharded. Run @po *shard first"
- If `project.mode = multi-repo` AND `role = product`: **HALT** with "Cannot create stories in product repository. Navigate to implementation repo."
- If multi-repo and `product_repo_path` empty: **HALT** with configuration error

**Path Override** (Multi-Repo Mode):
```
If project.mode = multi-repo:
  prd_sharded_location = {product_repo_path}/{prdShardedLocation}
Else:
  prd_sharded_location = {prdShardedLocation}
```

**Note**: Architecture paths are NOT overridden here. The `load-architecture-context.md` utility reads architecture configuration directly from `core-config.yaml` (architectureFile, architectureSharded, architectureShardedLocation).

---

### 2. Load Epic Definitions & Identify Next Story

**Step 2.1: Locate Epic YAML Files**

Determine `epic_location` based on project mode:
```
If project.mode = multi-repo:
  epic_location = {product_repo_path}/{prdShardedLocation}
Else:
  epic_location = {prdShardedLocation}
```

List Epic YAML files: `{epic_location}/epic-*.yaml`

**If no Epic YAML files found**: **HALT** with:
```
❌ No Epic YAML files found in {epic_location}/
Expected: epic-1-*.yaml, epic-2-*.yaml, ...

Action: Run @po *shard to generate Epic YAML files from PRD
```

---

**Step 2.2: Load Required Epic Files**

**If `next_story_id` set from Step 0** (explicit story requested, e.g., "2.3"):

Parse `epic_id` from story_id: `epic_id = int(story_id.split('.')[0])`

Find and read file matching: `{epic_location}/epic-{epic_id}-*.yaml`

**If file NOT found**: **HALT** with:
```
❌ Epic file not found: epic-{epic_id}-*.yaml
Story {next_story_id} belongs to Epic {epic_id}, but the Epic file does not exist.

Action: Verify Epic {epic_id} exists in PRD, then run @po *shard
```

Parse YAML and store as `target_epic`.

---

**If `next_story_id` NOT set** (auto-discovery):

1. List existing story files: `{devStoryLocation}/*.md`
2. Extract created story IDs from filenames (pattern: `{epic}.{story}-*.md`)
3. Sort Epic files by number: `[epic-1-*.yaml, epic-2-*.yaml, ...]`

4. **Sequential Epic scan** (read minimum files):
   ```
   For each epic_file in sorted order:
     Read and parse epic_file
     Filter stories by repository_type (see Step 2.3)
     Find uncreated stories in this Epic
     If uncreated stories exist:
       Set target_epic = this epic
       Break (stop scanning)
   ```

5. **If all Epics exhausted** (no uncreated stories): **HALT** with:
   ```
   ✅ ALL STORIES CREATED!
   Repository: {repository_role}

   💡 Next: Check if new Epics added, or run @po *shard
   ```

---

**Epic YAML Structure** (expected format in `epic-{n}-{title-slug}.yaml`):
```yaml
epic_id: {number}
title: "{Epic Title}"
description: "{Epic description}"
stories:
  - id: "{epic}.{story}"
    title: "{Story title}"
    repository_type: {backend | frontend | ios | android | monolith}
    acceptance_criteria:           # PREFERRED: Array format
      - "AC1: {criterion}"
      - "AC2: {criterion}"
    acceptance_criteria_summary: "{summary}"  # DEPRECATED: Fallback for old format
    dependencies: ["{story_id}"]
    provides_apis: ["{endpoint}"]  # Optional
    consumes_apis: ["{endpoint}"]  # Optional
    estimated_complexity: {low | medium | high}
    priority: {P0 | P1 | P2 | P3}
```

---

**Step 2.3: Filter Stories by Repository Type**

From `target_epic.stories`, filter by current repository role:

```python
repository_role = project.multi_repo.role  # from Step 1

if repository_role == "monolith":
    repo_filter = ["monolith", None, ""]
else:
    repo_filter = [repository_role]  # backend, frontend, ios, android

my_stories = []
for story in target_epic['stories']:
    story_repo_type = story.get('repository_type') or 'monolith'
    if story_repo_type in repo_filter:
        my_stories.append(story)
```

**If my_stories is empty**: **HALT** with:
```
❌ No stories for this repository in Epic {target_epic.epic_id}

Repository Role: {repository_role}
Epic contains stories for: {list unique repository_types in target_epic}

Action: Check if correct repository, or verify Epic YAML repository_type assignments
```

---

**Step 2.4: Identify Next Story**

**If `next_story_id` set from Step 0** (explicit selection):

Search for story in `my_stories` by ID.

**If NOT found**: **HALT** with:
```
❌ Story {next_story_id} not found in Epic {target_epic.epic_id}

Available Stories for {repository_role} in this Epic:
{list story IDs and titles from my_stories}
```

**If found**: Set `next_story = matched story`, continue to Step 3.

---

**If `next_story_id` NOT set** (auto-discovery, already filtered in Step 2.2):

The `target_epic` was selected because it has uncreated stories. Now identify the specific story:

```python
existing_ids = [IDs extracted from {devStoryLocation}/*.md filenames]
uncreated_stories = [s for s in my_stories if s['id'] not in existing_ids]
```

Sort by ID (numeric order: 1.1 < 1.2 < 1.3)

Select first: `next_story = uncreated_stories[0]`

---

**Output confirmation**:
```
📝 NEXT STORY IDENTIFIED
Story ID: {next_story['id']}
Title: {next_story['title']}
Epic: {target_epic['epic_id']} - {target_epic['title']}
Repository: {next_story['repository_type']}
```

Store:
- `next_story_id` = next_story['id']
- `story_definition` = next_story (full story object from YAML)
- `epic_definition` = target_epic (full epic object from YAML)

---

### 3. Validate Dependencies (Multi-Repo Only)

**Skip if**: `project.mode = monolith`

**If multi-repo**:

Check if `story_definition.dependencies` exists and not empty.

For each dependency story_id:
1. Determine which repository it belongs to (from Epic YAML)
2. Check if dependency is in same repo OR different repo
3. If different repo: Check if dependency story status = Done

**If any dependency NOT met**: **HALT** with:
```
🚫 DEPENDENCY BLOCKED
Story: {next_story_id}

Blocking Dependencies:
- {dep_story_id} (Repository: {repo}, Status: {status} - Required: Done)

Action: Complete blocking stories first
```

**If all dependencies satisfied or none exist**: Continue to Step 4.

---

### 4. Load Architecture Context

Execute:
```
{root}/tasks/util-load-architecture-context.md
```

**Input**:
```yaml
story_type: {from story_definition or epic}
```

**Note**: The utility automatically reads architecture paths from `core-config.yaml`. Do NOT pass `architecture_location` - it will be determined by:
- `architectureSharded`: Whether to use sharded or monolithic mode
- `architectureFile`: Path for monolithic architecture
- `architectureShardedLocation`: Path for sharded architecture directory

**Output**: `architecture_context` containing:
- `tech_stack`: Technology stack content
- `source_tree`: Project structure content
- `coding_standards`: Coding rules content
- `testing_strategy`: Testing approach content
- Type-specific: `data_models`, `database_schema`, `rest_api_spec`, `frontend_architecture`, `components`, etc.

---

### 5. Load & Validate Cumulative Context

**Step 5.1: Load Cumulative Context**

Execute:
```
{root}/tasks/util-load-cumulative-context.md
```

**Input**: `{devStoryLocation}`

**Output**: `cumulative_context` containing:
```yaml
database_registry:
  tables: [{name, story_id, fields}]
  total_tables: {count}
api_registry:
  endpoints: [{method, path, story_id}]
  schemas: [{name, story_id}]
  total_endpoints: {count}
models_registry:
  models: [{name, type, story_id, namespace}]
  total_models: {count}
```

---

**Step 5.2: Validate Against Cumulative Context**

Execute:
```
{root}/tasks/util-validate-against-cumulative-context.md
```

**Input**:
```yaml
planned_resources:
  database_changes:
    new_tables: [{name}]  # From story requirements analysis
    alter_tables: [{name, operations}]
    new_fields: [{table, field}]
    foreign_keys: [{from_table, to_table}]
  api_endpoints:
    new_endpoints: [{method, path}]
    schemas: [{name}]
  models:
    new_models: [{name, type, namespace}]
cumulative_context: {from Step 5.1}
```

**Output**: `validation_result` with status PASS | CONFLICT

**Decision**:
- **PASS**: Continue to Step 6
- **CONFLICT**: **HALT** with conflict details and resolution options (Rename/Change Operation/Remove/Escalate)

**Critical**: Do NOT proceed with unresolved conflicts. SM must resolve during design phase.

---

### 5.5. Extract UI/UX References (Conditional)

**Skip if**: `docs/front-end-spec.md` does NOT exist

**If file exists**:

1. **Read** `docs/front-end-spec.md`

2. **Analyze Story Content** for UI/UX relevance:
   - Story title and description
   - Acceptance criteria
   - Tasks involving user-facing features

3. **Match to front-end-spec.md sections** using this mapping:

   | Story Keywords | Relevant Section |
   |---------------|------------------|
   | Navigation, menu, routing, sidebar, breadcrumb | Information Architecture (IA) |
   | User flow, registration, login, checkout, wizard | User Flows |
   | Page, screen, layout, dashboard, modal | Wireframes & Mockups |
   | Form, button, input, select, checkbox, component | Component Library / Design System |
   | Color, font, icon, spacing, theme | Branding & Style Guide |
   | Keyboard, screen reader, WCAG, a11y | Accessibility Requirements |
   | Mobile, tablet, responsive, breakpoint | Responsiveness Strategy |
   | Animation, transition, loading, feedback | Animation & Micro-interactions |
   | Load time, render, performance, lazy | Performance Considerations |

4. **Generate `ui_ux_references`**:
   ```yaml
   ui_ux_references:
     - section: "{Matched Section Title}"
       why_relevant: "{Brief reason based on story content}"
   ```

5. **If no matches found**: Set `ui_ux_references = []` (Story has no UI/UX relevance)

**Output**: `ui_ux_references` list for use in Step 6

---

### 6. Create Story Document

**Step 6.1: Load Template**

Read: `{root}/templates/story-tmpl.yaml`

**Step 6.2: Generate Filename**

Convert title to kebab-case:
```python
kebab_title = story_definition['title'].lower()
kebab_title = re.sub(r'[^\w\s-]', '', kebab_title)
kebab_title = re.sub(r'[\s_]+', '-', kebab_title)
filename = f"{story_definition['id']}-{kebab_title}.md"
```

Example: "User Authentication API" → `1.3-user-authentication-api.md`

**Step 6.3: Populate Sections**

Follow template instructions (story-tmpl.yaml lines 206-251):

**Story Metadata**:
```yaml
Story:
  id: {story_definition.id}
  title: {story_definition.title}
  epic: {epic.epic_id} - {epic.title}
  status: Draft
  mode: plan
  repository: {story_definition.repository_type}
  priority: {story_definition.priority}
  estimated_complexity: {story_definition.estimated_complexity}
```

**Epic Context**:
```markdown
**Epic**: {epic.epic_id} - {epic.title}
{epic.description}
**Story Deliverables**: {format deliverables as list}
```

**Acceptance Criteria**:
- **PREFERRED**: Use `story_definition.acceptance_criteria` (array format, each item starts with "ACn:")
- **FALLBACK**: If `acceptance_criteria` not present, parse from `story_definition.acceptance_criteria_summary` (deprecated paragraph format)

**Tasks/Subtasks**: Render the template from `story-tmpl.yaml` section `tasks-subtasks` verbatim.

- One task per AC with TDD cycle (Write test → Implement → Verify & refactor)
- Fixed Integration & Edge Cases section
- Fixed Final Verification section
- Tasks define WHAT to do; Dev Notes define HOW (technical details, patterns, file paths)

**Dev Notes** (following template instructions):
- **Technical Constraints**: Story-specific constraints with doc references `[→ file.md#section]`
- **UI/UX Specification Reference** (from Step 5.5, if `ui_ux_references` not empty):
  ```markdown
  | Section | Why Relevant |
  |---------|--------------|
  | {section} | {why_relevant} |
  ```
  If `ui_ux_references` is empty or Step 5.5 was skipped: Omit this section entirely
- **Accumulated Context**: Table format listing relevant resources from cumulative_context
  ```markdown
  | Resource Type | Name | Source Story | Action | Key Info |
  |--------------|------|--------------|--------|----------|
  | Table | users | 1.1 | REUSE | {key_fields} |
  ```
- **Database Design**: Design decisions (WHY), not full SQL
- **Data Models**: Interface contracts, not implementations
- **File Locations**: Exact paths per source-tree.md
- **Testing Requirements**: Story-specific test focus areas

**Key Principle** (from template line 211): "Put enough information so Dev Agent should NEVER need to read architecture documents"

**Agent Records**: Initialize empty structures

**Change Log**: Initialize with creation entry

**Step 6.4: Write File**

Write to: `{devStoryLocation}/{filename}`

Verify file written successfully.

---

### 7. GATE 1 – Story Quality Assessment

Execute:
```
checklists/gate-sm-story-creation-gate.md
```

**Input**:
```yaml
story_path: {file path from Step 6}
story_id: {next_story_id}
```

**Output**: `gate_result` containing:
```yaml
status: PASS | FAIL
overall_score: X%
structure_validation: {passed, score, failed_items}
technical_quality: {s2_score, s3_score, passed_threshold, failed_items}
quality_score: {final_score, calculation}
complexity_indicators: {7 booleans, total_count, security_sensitive}
blocking: true/false
blocking_reason: {if blocking}
```

**Handle Result**:

**If gate_result.status = FAIL**:
- Update Story.status = Blocked
- Log failure in Change Log
- Output detailed gap report with all failed items
- **HALT**

**If gate_result.status = PASS**:
- Extract metrics for decisions
- Continue to Step 8

---

### 8. Execute Decisions (Sequential)

**Decision 8A: Architect Review Requirement**

Execute:
```
tasks/make-decision.md
```

**Input**:
```yaml
decision_type: sm-architect-review-needed
context:
  quality_score: {gate_result.quality_score.final_score}
  complexity_indicators: {gate_result.complexity_indicators.total_count}
```

**Output**:
```yaml
decision_result:
  result: REQUIRED | NOT_REQUIRED | BLOCKED
  reasoning: {explanation}
  next_status: AwaitingArchReview | null | Blocked
  next_action: handoff_to_architect | check_test_design_level | sm_revise_story
```

**If result = BLOCKED**: Set Story.status = Blocked, **HALT** with revision message

---

**Decision 8B: Test Design Level**

Execute:
```
tasks/make-decision.md
```

**Input**:
```yaml
decision_type: sm-test-design-level
context:
  complexity_indicators: {gate_result.complexity_indicators}
  quality_score: {gate_result.quality_score.final_score}
  security_sensitive: {gate_result.complexity_indicators.security_sensitive}
```

**Output**:
```yaml
decision_result:
  test_design_level: Simple | Standard | Comprehensive
  reasoning: {explanation}
```

---

**Decision 8C: Story Status**

Execute:
```
tasks/make-decision.md
```

**Input**:
```yaml
decision_type: sm-story-status
context:
  architect_review_result: {from 8A: result}
  test_design_level: {from 8B: test_design_level}
```

**Output**:
```yaml
decision_result:
  final_status: AwaitingArchReview | AwaitingTestDesign | TestDesignComplete | Blocked
  next_action: handoff_to_architect | handoff_to_qa_test_design | handoff_to_dev | sm_revise_story
  reasoning: {explanation}
  metadata: {additional context}
```

Store `final_status` and `next_action` for Step 9.

---

### 9. GATE 2 – Story Completion Steps

Execute:
```
checklists/gate-sm-story-completion-gate.md
```

**Verify** (100% required, 21 items):
1. Story Metadata Fields (4 items)
2. Decision Results Documentation (4 items)
3. Change Log Entry (5 items)
4. Status Field Update (3 items)
5. Handoff Message Preparation (5 items)

**If any item missing**: **HALT** with missing steps report

**If all items complete**: Continue to Step 10

---

### 10. Final Handoff (MANDATORY)

---

### ⚠️ MANDATORY HANDOFF - DO NOT SKIP

**CRITICAL**: Output the HANDOFF message as the **LAST LINE** of your response.
The hook script will automatically detect it and route to the target agent.

Based on `next_action` from Step 8C, output ONE of the following:

**If next_action = handoff_to_architect**:
```
✅ STORY CREATED - ARCHITECT REVIEW REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingArchReview
Quality: {score}/10 | Complexity: {count}/7

🎯 HANDOFF TO architect: *review {epic}.{story}
```

**If next_action = handoff_to_dev**:
```
✅ STORY CREATED - READY FOR DEVELOPMENT
Story: {epic}.{story} - {title}
Status: TestDesignComplete
Quality: {score}/10 | Test Design: Simple

🎯 HANDOFF TO dev: *develop-story {epic}.{story}
```

**If next_action = handoff_to_qa_test_design**:
```
✅ STORY CREATED - TEST DESIGN REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingTestDesign
Quality: {score}/10 | Test Design: {Standard | Comprehensive}

🎯 HANDOFF TO qa: *test-design {epic}.{story}
```

**STOP**: The `🎯 HANDOFF TO` line must be your FINAL output. Hook handles the rest.
