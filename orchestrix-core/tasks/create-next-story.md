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
- **AwaitingArchReview**: `⏳ HANDOFF TO architect: *review-story {story_id}` → **HALT**
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
  architecture_location = {product_repo_path}/docs/architecture
Else:
  prd_sharded_location = {prdShardedLocation}
  architecture_location = docs/architecture
```

---

### 2. Load Epic Definitions & Identify Next Story

**Step 2.1: Load Epic YAML from PRD Shards**

List all files: `{prd_sharded_location}/*.md`

**If no files found**: **HALT** with "No PRD shard files found. Run @po *shard"

For each PRD shard file:
1. Read file content
2. Extract YAML blocks between triple backticks (```yaml ... ```)
3. Parse each YAML block

Expected structure:
```yaml
epic_id: {number}
title: "{Epic Title}"
description: "{Epic description}"
stories:
  - id: "{epic}.{story}"
    title: "{Story title}"
    repository_type: {backend | frontend | ios | android | monolith}
    deliverables: ["{item}"]
    acceptance_criteria_summary: "{summary}"
    dependencies: ["{story_id}"]
    provides_apis: ["{endpoint}"]  # Optional
    consumes_apis: ["{endpoint}"]  # Optional
    estimated_complexity: {low | medium | high}
    priority: {P0 | P1 | P2 | P3}
```

Accumulate into:
- `all_epics`: Array of Epic objects (with full story arrays)
- `all_stories`: Flat array of all stories from all Epics (each story includes `epic_id`, `epic_title`, `epic_description`)

**If epic_count = 0**: **HALT** with "No epic YAML blocks found in PRD shards"

---

**Step 2.2: Filter Stories by Repository Type**

Determine filter:
```python
if repository_role == "monolith":
    repo_filter = ["monolith", None, ""]
else:
    repo_filter = [repository_role]  # backend, frontend, ios, android
```

Filter stories:
```python
my_stories = []
for story in all_stories:
    story_repo_type = story.get('repository_type') or 'monolith'
    if story_repo_type in repo_filter:
        my_stories.append(story)
```

**If my_stories is empty**: **HALT** with "No stories assigned to this repository ({repository_role})"

---

**Step 2.3: Identify Next Story**

**If `next_story_id` set from Step 0** (explicit selection):

Search for story in my_stories by ID.

**If NOT found**: **HALT** with:
```
❌ Story {next_story_id} not found in Epic definitions

Available Stories for {repository_role}:
{list story IDs and titles}
```

**If found**: Set `next_story`, continue to Step 3.

---

**If `next_story_id` NOT set** (auto-discovery):

List existing story files: `{devStoryLocation}/*.md`

Extract story IDs from filenames (pattern: `{epic}.{story}-{title}.md`)

Find uncreated stories:
```python
existing_ids = [extracted IDs from filenames]
uncreated_stories = [s for s in my_stories if s['id'] not in existing_ids]
```

**If uncreated_stories is empty**: **HALT** with:
```
✅ ALL STORIES CREATED!
Repository: {repository_role}
Total Stories: {len(my_stories)}

💡 Next: Check if new Epics added, or run @po *shard
```

Sort uncreated stories by ID (numeric order: 1.1 < 1.2 < 2.1)

Select first: `next_story = uncreated_stories[0]`

---

**Output confirmation**:
```
📝 NEXT STORY IDENTIFIED
Story ID: {next_story.id}
Title: {next_story.title}
Epic: {epic_id} - {epic_title}
Repository: {repository_type}
```

Store:
- `next_story_id` = next_story['id']
- `story_definition` = next_story (full YAML)
- `epic_definition` = matching epic from all_epics

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
{root}/tasks/utils/load-architecture-context.md
```

**Input**:
```yaml
story_type: {from story_definition or epic}
architecture_location: {from Step 1}
```

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
{root}/tasks/utils/load-cumulative-context.md
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
{root}/tasks/utils/validate-against-cumulative-context.md
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

**Acceptance Criteria**: Parse from `story_definition.acceptance_criteria` or `acceptance_criteria_summary`

**Tasks/Subtasks**: Generate following template's TDD-First Vertical Slice structure (lines 142-202)
- Map each task to acceptance criteria
- Use template's Phase 1 (Test-Driven) + Phase 2 (QA) structure
- Ensure all ACs covered

**Dev Notes** (following template instructions lines 206-251):
- **Technical Constraints**: Story-specific constraints with doc references `[→ file.md#section]`
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
checklists/gate/sm-story-creation-gate.md
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
checklists/gate/sm-story-completion-gate.md
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

### 10. Final Handoff (MANDATORY LAST OUTPUT)

**CRITICAL**: This handoff MUST be the absolute last line. Do NOT add any content after it.

Based on `next_action` from Step 8C:

**If next_action = handoff_to_architect**:
```
✅ STORY CREATED - ARCHITECT REVIEW REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingArchReview

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design Level: {level} (deferred until after review)

Architect Review Reason: {reasoning from Decision 8A}

🎯 HANDOFF TO architect: *review-story {epic}.{story}
```

**If next_action = handoff_to_dev**:
```
✅ STORY CREATED - READY FOR DEVELOPMENT
Story: {epic}.{story} - {title}
Status: TestDesignComplete

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design: Simple (unit tests only)

🎯 HANDOFF TO dev: *develop-story {epic}.{story}
```

**If next_action = handoff_to_qa_test_design**:
```
✅ STORY CREATED - TEST DESIGN REQUIRED
Story: {epic}.{story} - {title}
Status: AwaitingTestDesign

Quality Metrics:
- Quality Score: {score}/10
- Complexity: {count}/7 indicators ({list})
- Test Design Level: {Standard | Comprehensive}

🎯 HANDOFF TO qa: *test-design {epic}.{story}
```

**STOP HERE** - End task execution
