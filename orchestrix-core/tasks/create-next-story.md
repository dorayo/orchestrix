# Create Next Story Task

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- For existing stories: status must be `Blocked` or `RequiresRevision`
- On failure: HALT with error

## Execution

### 0. Repository Type Detection (Multi-Repo Support)

**Read `{root}/core-config.yaml`**:

Extract `project.type`, `project.repository_id`, `project.product_repo.*`

**Determine mode**:
- If `project.type = monolith` OR `project.type` not set: **MONOLITH MODE** ✅ → Use existing single-repo logic (skip to Step 1)
- If `project.type = product-planning`: **ERROR** → Cannot create stories in product-planning repo (HALT with message)
- If `project.type ∈ {backend, frontend, ios, android, flutter, react-native}`: **MULTI-REPO MODE** ✅ → Continue with multi-repo logic below

**If MONOLITH MODE**: Skip to Step 1 (existing behavior)

**If ERROR (product-planning repo)**:
```
❌ ERROR: Cannot create stories in product-planning repository

Current project type: product-planning
Repository ID: {repository_id}

ACTION: Stories must be created in implementation repositories (backend, frontend, ios, android).
Navigate to the appropriate implementation repository and run *draft there.

HALT: Cannot proceed in product-planning repository
```

**If MULTI-REPO MODE**: Continue below

#### Multi-Repo Configuration

**Extract from core-config.yaml**:
- `current_repo_id` = `project.repository_id` (e.g., "my-product-backend")
- `product_repo_path` = `project.product_repo.path` (e.g., "../my-product")
- `product_repo_enabled` = `project.product_repo.enabled`

**Validate**:
- If `product_repo_enabled = false`: HALT with "Multi-repo mode requires product_repo.enabled = true"
- If `product_repo_path` is empty: HALT with "Multi-repo mode requires product_repo.path to be set"
- If product repo directory doesn't exist: HALT with "Product repo not found at: {product_repo_path}"

**Resolve product repo path**:
```
If product_repo_path is relative: Resolve to absolute path from current directory
If product_repo_path is absolute: Use as-is
```

Announce: `Multi-repo mode detected. Repository: {current_repo_id}, Product repo: {product_repo_path}`

### 1. Load Configuration

Load `{root}/core-config.yaml`. If missing: HALT with "core-config.yaml not found".

Extract: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

**Epics Location**:
- Extract `epics_location` from `config.prd.epicsLocation` (defaults to `docs/epics` if not set)

**If Multi-Repo Mode**: Override document paths to product repo:
- `prd_location` = `{product_repo_path}/docs/prd.md`
- `architecture_location` = `{product_repo_path}/docs/architecture`
- `epics_location` = `{product_repo_path}/{config.prd.epicsLocation}`
- `devStoryLocation` remains in current repo (local stories)

### 2. Identify Next Story

**If MONOLITH MODE** (existing behavior):
1. Locate epic files via `prdSharded` config
2. Load highest `{epicNum}.{storyNum}.story.md` from `devStoryLocation`
3. If story exists:
   - Verify status is 'Done', else alert incomplete story
   - Select next sequential story in current epic
   - If epic complete, prompt: "Epic {epicNum} Complete. Options: 1) Begin Epic {epicNum+1} 2) Select specific story 3) Cancel"
   - NEVER auto-skip epics
4. If no stories: next is 1.1
5. Announce: "Identified next story: {epicNum}.{storyNum} - {Title}"

**If MULTI-REPO MODE** (new behavior):

#### 2.1 Load Epic YAML Files

**Path**: `{epics_location}` (from Step 1, points to product repo)

**Find all epic files**: `{epics_location}/epic-*.yaml`

If no epic files found: HALT with "No epic files found in {epics_location}. Run PO *shard-documents first."

**Load all epic YAML files** (use `{root}/data/epic-story-mapping-schema.yaml` as reference for structure)

Example epic YAML structure:
```yaml
epic_id: 1
title: "User Authentication"
target_repositories: [my-product-backend, my-product-web]
stories:
  - id: "1.1"
    title: "Backend - User API"
    repository: "my-product-backend"
    repository_type: backend
    dependencies: []
    provides_apis: [...]
    ...
  - id: "1.2"
    title: "Frontend - Login UI"
    repository: "my-product-web"
    repository_type: frontend
    dependencies: ["1.1"]
    ...
```

#### 2.2 Filter Stories for Current Repository

**Current repo ID**: `{current_repo_id}` (from Step 0)

**Filter all stories**:
```
all_stories = []
for each epic in loaded epics:
  for each story in epic.stories:
    all_stories.append(story)

my_stories = filter(all_stories, story.repository == current_repo_id)
```

Announce: `Found {len(my_stories)} stories assigned to {current_repo_id} (Total: {len(all_stories)} across all repos)`

If `len(my_stories) == 0`: HALT with "No stories assigned to this repository ({current_repo_id}) in epics"

#### 2.3 Identify Next Story to Create

**List existing stories** in `{devStoryLocation}`:
- Extract story IDs from directory names (pattern: `{epicNum}.{storyNum}-*`)
- Example: `1.1-backend-user-api/` → story ID = "1.1"

**Find next story**:
```
existing_ids = [list of story IDs already created in devStoryLocation]

uncreated_stories = filter(my_stories, story.id NOT IN existing_ids)

if len(uncreated_stories) == 0:
  ✅ All stories for this repository have been created!
  HALT with success message

# Sort by story ID (1.1 < 1.2 < 2.1)
next_story = sort(uncreated_stories)[0]
```

Announce: `Identified next story: {next_story.id} - {next_story.title}`

**Store for later steps**:
- `next_story_id` = next_story.id
- `next_story_definition` = next_story (entire story object from epic YAML)
- `next_story_epic` = parent epic object

#### 2.4 Check Cross-Repo Dependencies (Stage 2: Automated)

**If MULTI-REPO MODE**: Execute automatic dependency check.

**Call**: `{root}/utils/dependency-checker.js` (via Node.js)

**Input Parameters**:
- `story_id`: `next_story.id`
- `story_definition`: `next_story_definition`
- `current_repo_id`: `config.project.repository_id`
- `product_repo_path`: `product_repo_path` (from Step 0)
- `all_stories`: `all_stories` (from Step 2.1)

**Store result**: `dependency_check_result`

**Handle Result Based on Status**:

**Case 1: status = "no_dependencies"** or **"same_repo_only"**
```
✅ No cross-repo dependencies

Proceeding with story creation...
```
Continue to Step 3.

**Case 2: status = "satisfied"**
```
✅ ALL CROSS-REPO DEPENDENCIES SATISFIED

Story {next_story.id} dependencies verified:
{{#each dependency_check_result.satisfied_dependencies}}
- ✓ Story {{this.story_id}} "{{this.story_title}}" ({{this.repository}}): Status = Done
{{/each}}

Proceeding with story creation...
```
Continue to Step 3.

**Case 3: status = "blocked"**
```
❌ CANNOT CREATE STORY - BLOCKED BY DEPENDENCIES

Story {next_story.id} "{next_story.title}" is blocked by {dependency_check_result.blocking_dependencies.length} incomplete cross-repo dependencies:

{{#each dependency_check_result.blocking_dependencies}}
───────────────────────────────────────────────────────────────
Dependency: Story {{this.story_id}} "{{this.story_title}}"
Repository: {{this.repository}}
Status: {{this.status}}
{{#if this.story_file}}
Location: {{this.story_file}}
{{/if}}

Action Required: {{this.action}}
───────────────────────────────────────────────────────────────
{{/each}}

⚠️ You must wait for the above dependencies to be completed before creating Story {next_story.id}.

HALT: Cannot proceed until all cross-repo dependencies are satisfied.
```
**HALT execution**. Do not proceed to Step 3.

**Case 4: status = "error"**
```
❌ ERROR CHECKING DEPENDENCIES

Error: {dependency_check_result.message}

Please verify:
1. Epic YAML files are correctly formatted
2. All dependency story IDs exist in epics
3. Repository paths are correct

HALT: Cannot proceed due to dependency check error.
```
**HALT execution**. Report error to user.

### 3. Gather Requirements

**If MONOLITH MODE**:
1. Extract requirements from epic markdown file
2. If previous story exists, review Dev Agent Record for insights
3. Extract relevant information for current story

**If MULTI-REPO MODE**:

Use `next_story_definition` (from Step 2.3) which contains:
- `id`: Story ID (e.g., "1.1")
- `title`: Story title
- `repository`: Repository name
- `repository_type`: Repository type (backend/frontend/ios/android)
- `dependencies`: Array of story IDs this story depends on
- `provides_apis`: APIs this story implements (for backend)
- `consumes_apis`: APIs this story consumes (for frontend/mobile)
- `deliverables`: List of expected deliverables
- `acceptance_criteria_summary`: Brief AC summary
- `estimated_complexity`: Complexity level
- `priority`: Story priority

**Load API contracts** (if available):
- Path: `{product_repo_path}/docs/architecture/api-contracts.md`
- For backend stories: Reference API definitions for `provides_apis`
- For frontend/mobile stories: Reference API definitions for `consumes_apis`

**Load epic description**: Use `next_story_epic.description` for business context

**If previous story exists**: Review Dev Agent Record for insights

### 4. Load Architecture Context

Execute `{root}/tasks/utils/load-architecture-context.md`:
- `story_type`: From epic (Backend | Frontend | FullStack)
- `architecture_sharded`: From config
- `architecture_location`: From config

Use returned `context` for Dev Notes. Cite sources: `[Source: docs/architecture/{file}.md#{section}]`

### 5. Verify Structure Alignment

Cross-reference requirements with `context.file_structure`. Document conflicts in "Project Structure Notes".

### 6. Populate Story Template

Create `{devStoryLocation}/{epicNum}.{storyNum}.story.md` using `{root}/templates/story-tmpl.yaml`:
- Fill all sections per template
- Use `context` from Step 4 for Dev Notes
- Include structure alignment from Step 5
- Follow Field-Level API Contract format for API/shared data stories

**If MULTI-REPO MODE**: Add multi-repo context section after the main story sections:

```markdown
## Multi-Repo Context

- **Repository**: {next_story_definition.repository}
- **Repository Type**: {next_story_definition.repository_type}
- **Epic**: Epic {next_story_epic.epic_id} - {next_story_epic.title}

{{#if next_story_definition.provides_apis}}
### APIs Provided by This Story

{{#each next_story_definition.provides_apis}}
- `{{this}}` - See [API Contracts]({product_repo_path}/docs/architecture/api-contracts.md)
{{/each}}

**Responsibility**: This story MUST implement these APIs exactly as defined in the API contract.
{{/if}}

{{#if next_story_definition.consumes_apis}}
### APIs Consumed by This Story

{{#each next_story_definition.consumes_apis}}
- `{{this}}` - Defined in [API Contracts]({product_repo_path}/docs/architecture/api-contracts.md)
{{/each}}

**Responsibility**: This story MUST consume these APIs exactly as defined in the API contract.
{{/if}}

{{#if next_story_definition.dependencies}}
### Cross-Repo Dependencies

⚠️ This story depends on the following stories being completed first:

{{#each next_story_definition.dependencies}}
- **Story {{this}}** (Repository: {{lookup dependency_repos this}})
  - Must be Status = Done before starting this story
  - Check status: `{product_repo_path}/../{repository}/docs/stories/{{this}}-*/story.md`
{{/each}}
{{/if}}
```

**Use deliverables from epic**: Populate Acceptance Criteria using `next_story_definition.deliverables` as a starting point

### 7. Quality Assessment

Execute `{root}/tasks/execute-checklist.md`:
- Checklist: `{root}/checklists/assessment/sm-story-quality.md`
- Context: Story file from Step 6

Extract from result:
- `quality_score` (0-10)
- `complexity_indicators`
- `security_sensitive`
- Structure validation status (must be 100%)
- Technical quality status (must be ≥80%)

If validation fails: Set Status = `Blocked`, document in Change Log, HALT

### 8. Execute Decisions

**Decision Execution Strategy**: Use Decision Evaluator SubAgent with fallback to inline execution.

Reference: `{root}/tasks/utils/call-decision-evaluator.md` for invocation pattern.

#### 8A. Determine Architect Review Requirement

**Primary: Call Decision Evaluator SubAgent**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-architect-review-needed
Context:
  quality_score: {{quality_score from Step 7}}
  complexity_indicators: {{complexity_indicators from Step 7}}

Please return the structured result.
```

**Expected SubAgent Response:**
```yaml
status: success
decision_type: sm-architect-review-needed
result: [REQUIRED | NOT_REQUIRED | BLOCKED]
reasoning: "{{explanation}}"
next_action: "{{action}}"
```

**Extract Result:**
- `architect_review_result` = SubAgent response `result` field
- Store full response as `architect_review_decision`

**Fallback (if SubAgent fails or timeout >30s):**
```
⚠️ SubAgent unavailable, using inline fallback

Execute: {root}/tasks/make-decision.md
Input:
  decision_type: sm-architect-review-needed
  context:
    quality_score: {{quality_score}}
    complexity_indicators: {{complexity_indicators}}

Extract: architect_review_result = result
```

#### 8B. Determine Test Design Level

**Primary: Call Decision Evaluator SubAgent**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-test-design-level
Context:
  complexity_indicators: {{complexity_indicators from Step 7}}
  quality_score: {{quality_score from Step 7}}
  security_sensitive: {{security_sensitive from Step 7}}

Please return the structured result.
```

**Expected SubAgent Response:**
```yaml
status: success
decision_type: sm-test-design-level
result: [Simple | Standard | Comprehensive]
reasoning: "{{explanation}}"
next_action: "{{action}}"
```

**Extract Result:**
- `test_design_level` = SubAgent response `result` field
- Store full response as `test_design_decision`

**Fallback (if SubAgent fails or timeout >30s):**
```
⚠️ SubAgent unavailable, using inline fallback

Execute: {root}/tasks/make-decision.md
Input:
  decision_type: sm-test-design-level
  context:
    complexity_indicators: {{complexity_indicators}}
    quality_score: {{quality_score}}
    security_sensitive: {{security_sensitive}}

Extract: test_design_level = result
```

#### 8C. Determine Story Status

**Primary: Call Decision Evaluator SubAgent**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-story-status
Context:
  architect_review_result: {{architect_review_result from 8A}}
  test_design_level: {{test_design_level from 8B}}

Please return the structured result.
```

**Expected SubAgent Response:**
```yaml
status: success
decision_type: sm-story-status
result: [TestDesignComplete | AwaitingArchReview | RequiresRevision | Blocked | Escalated]
reasoning: "{{explanation}}"
next_action: [handoff_to_architect | handoff_to_dev | handoff_to_qa_test_design | ...]
```

**Extract Result:**
- `final_status` = SubAgent response `result` field
- `next_action` = SubAgent response `next_action` field
- Store full response as `story_status_decision`
- **Apply**: Set story status to `final_status`

**Fallback (if SubAgent fails or timeout >30s):**
```
⚠️ SubAgent unavailable, using inline fallback

Execute: {root}/tasks/make-decision.md
Input:
  decision_type: sm-story-status
  context:
    architect_review_result: {{architect_review_result}}
    test_design_level: {{test_design_level}}

Extract: final_status = result, next_action = next_action
```

**Decision Summary:**
```
Story Decision Results:
- Architect Review: {{architect_review_result}}
- Test Design Level: {{test_design_level}}
- Story Status: {{final_status}}
- Next Action: {{next_action}}
```

### 9. Record Change Log

Add entry to Story Change Log:
- Story creation action
- Quality assessment summary
- Decision results with reasoning
- Final status and next action

### 10. Output Handoff

Based on `next_action` from Step 8C, output the appropriate handoff message:

- If `next_action` = `handoff_to_architect`:
  ```
  Next: Architect please execute command `review-story {epicNum}.{storyNum}`
  ```

- If `next_action` = `handoff_to_dev`:
  ```
  Next: Dev please execute command `implement-story {epicNum}.{storyNum}`
  ```

- If `next_action` = `handoff_to_qa_test_design`:
  ```
  Next: QA please execute command `test-design {epicNum}.{storyNum}`
  ```

- If `next_action` = `sm_revise_story`:
  ```
  Story blocked - SM must revise before proceeding
  ```


