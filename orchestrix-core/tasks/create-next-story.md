# Create Next Story Task

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- For existing stories: status must be `Blocked` or `RequiresRevision`
- On failure: HALT with error

## Execution

### 0. Repository Type Detection (Multi-Repo Support)

**Read `{root}/core-config.yaml`**:

Extract `project.mode`, `project.multi_repo.role`, `project.multi_repo.repository_id`, `project.multi_repo.product_repo_path`

**Determine mode**:
- If `project.mode = single-repo` OR `project.mode` not set: **MONOLITH MODE** ✅ → Use existing single-repo logic (skip to Step 1)
- If `project.mode = multi-repo` AND `project.multi_repo.role = product`: **ERROR** → Cannot create stories in product-planning repo (HALT with message)
- If `project.mode = multi-repo` AND `project.multi_repo.role ∈ {backend, frontend, ios, android, flutter, react-native}`: **MULTI-REPO MODE** ✅ → Continue with multi-repo logic below

**If MONOLITH MODE**: Skip to Step 1 (existing behavior)

**If ERROR (product repo)**:
```
❌ ERROR: Cannot create stories in product repository

Current project mode: multi-repo
Repository role: product
Repository ID: {repository_id}

ACTION: Stories must be created in implementation repositories (backend, frontend, ios, android).
Navigate to the appropriate implementation repository and run *draft there.

HALT: Cannot proceed in product repository
```

**If MULTI-REPO MODE**: Continue below

#### Multi-Repo Configuration

**Extract from core-config.yaml**:
- `current_repo_id` = `project.multi_repo.repository_id` (e.g., "my-product-backend")
- `product_repo_path` = `project.multi_repo.product_repo_path` (e.g., "../my-product")
- `repo_role` = `project.multi_repo.role` (e.g., "backend")

**Validate**:
- If `product_repo_path` is empty: HALT with:
  ```
  ❌ PRODUCT REPO PATH NOT SET

  ✅ Fix: Edit core-config.yaml in this repository:
     project:
       mode: multi-repo
       multi_repo:
         role: backend  # or frontend, ios, android
         repository_id: my-product-backend
         product_repo_path: ../my-product  # ⚠️ SET THIS (relative or absolute)

  📍 Example: If Product repo is ../my-app-product:
     product_repo_path: ../my-app-product
  ```

- If product repo directory doesn't exist: HALT with:
  ```
  ❌ PRODUCT REPOSITORY NOT FOUND

  📍 Expected path: {product_repo_path}
  📍 Resolved from: project.multi_repo.product_repo_path in core-config.yaml

  🔍 Possible causes:
    1. Product repo not cloned yet
    2. Wrong path in config (relative path from current repo)
    3. Path typo

  ✅ Fix:
    1. Verify current location: pwd
    2. Check Product repo exists: ls -la {product_repo_path}
    3. If not exists: Clone Product repo or fix path in core-config.yaml
    4. Update config if needed:
       project.multi_repo.product_repo_path: ../correct-path-to-product-repo
  ```

**Resolve product repo path**:
```
If product_repo_path is relative: Resolve to absolute path from current directory
If product_repo_path is absolute: Use as-is
```

Announce: `Multi-repo mode detected. Repository: {current_repo_id}, Product repo: {product_repo_path}`

### 1. Load Configuration

Load `{root}/core-config.yaml`. If missing: HALT with "core-config.yaml not found".

Extract: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

**Determine PRD shards location**:
- If `prdSharded` = true: Use `prdShardedLocation` (e.g., `docs/prd`)
- If `prdSharded` = false: HALT with "PRD not sharded. Run @po *shard first"

**If Multi-Repo Mode**: Override document paths to product repo:
- `prd_sharded_location` = `{product_repo_path}/{prdShardedLocation}` (e.g., `../product-repo/docs/prd`)
- `architecture_location` = `{product_repo_path}/docs/architecture`
- `devStoryLocation` remains in current repo (local stories)

**If Monolith Mode**:
- `prd_sharded_location` = `{prdShardedLocation}` (e.g., `docs/prd`)
- `devStoryLocation` = local `devStoryLocation`

### 2. Identify Next Story

#### 2.1 Load Epic Definitions from Sharded PRD

**Purpose**: Read epic YAML blocks embedded in sharded PRD files.

**Path**: `{prd_sharded_location}` (from Step 1)
- Monolith: `docs/prd/`
- Multi-repo: `{product_repo_path}/docs/prd/`

**Step 2.1.1: Verify PRD shards exist**

```bash
if [ ! -d "$prd_sharded_location" ]; then
  echo "❌ ERROR: PRD shards directory not found"
  echo "📍 Expected location: $prd_sharded_location"
  echo ""
  echo "🔍 Possible causes:"
  echo "  1. PO *shard not run yet"
  echo "  2. prdSharded flag not set in core-config.yaml"
  echo ""
  echo "✅ Fix:"
  if [ "$PROJECT_MODE" = "multi-repo" ] && [ "$PROJECT_ROLE" != "product" ]; then
    echo "  1. Navigate to Product repo: cd $product_repo_path"
    echo "  2. Run PO shard: @po *shard"
    echo "  3. Verify prd shards created: ls -la $product_repo_path/docs/prd/"
  else
    echo "  1. Run PO shard: @po *shard"
    echo "  2. Verify prd shards created: ls -la docs/prd/"
  fi
  exit 1
fi

echo "✅ PRD shards found: $prd_sharded_location"
```

**Step 2.1.2: Extract Epic YAML blocks from markdown files**

```bash
echo "📖 Reading epic definitions from PRD shards..."

# Find all markdown files in prd shards directory
PRD_FILES=$(ls -1 "$prd_sharded_location"/*.md 2>/dev/null)

if [ -z "$PRD_FILES" ]; then
  echo "❌ ERROR: No markdown files found in $prd_sharded_location"
  exit 1
fi

# Extract YAML blocks containing epic definitions
# Look for ```yaml ... ``` blocks that contain epic_id field
TEMP_EPICS_FILE="/tmp/orchestrix-epics-$$.yaml"
> "$TEMP_EPICS_FILE"

for prd_file in $PRD_FILES; do
  # Extract YAML code blocks (between ```yaml and ```)
  awk '/```yaml/,/```/ {if (!/```/) print}' "$prd_file" >> "$TEMP_EPICS_FILE"
  echo "" >> "$TEMP_EPICS_FILE"  # Add separator
done

# Validate epic YAML blocks found
EPIC_COUNT=$(grep -c 'epic_id:' "$TEMP_EPICS_FILE" 2>/dev/null || echo "0")

if [ "$EPIC_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No epic YAML blocks found in PRD shards"
  echo ""
  echo "Expected format in prd.md (Epic Planning section):"
  echo '```yaml'
  echo 'epic_id: 1'
  echo 'title: "Epic Title"'
  echo 'stories:'
  echo '  - id: "1.1"'
  echo '    repository_type: backend'
  echo '    ...'
  echo '```'
  echo ""
  echo "✅ Fix:"
  echo "  1. Add Epic Planning section to docs/prd.md with YAML blocks"
  echo "  2. Run PO shard: @po *shard"
  echo "  3. Re-run story creation: @sm *create-next-story"
  exit 1
fi

echo "✅ Found $EPIC_COUNT epic definitions in PRD shards"
```

**Step 2.1.3: Parse YAML and extract all stories**

Parse the extracted YAML blocks to create a list of all stories across all epics.

```python
# Pseudo-code (implement using Python, yq, or similar YAML parser)

all_epics = []
all_stories = []

# Parse YAML blocks from TEMP_EPICS_FILE
for yaml_block in parse_yaml_blocks(TEMP_EPICS_FILE):
    if 'epic_id' in yaml_block and 'stories' in yaml_block:
        epic = yaml_block
        all_epics.append(epic)

        for story in epic['stories']:
            # Add epic context to each story
            story['epic_id'] = epic['epic_id']
            story['epic_title'] = epic['title']
            all_stories.append(story)

announce(f"Loaded {len(all_epics)} epics with {len(all_stories)} total stories")
```

#### 2.2 Filter Stories by Repository Type

**Determine current repository type**:

```bash
if [ "$PROJECT_MODE" = "multi-repo" ]; then
  # Multi-repo: Use repository role (backend, frontend, ios, android, etc.)
  CURRENT_REPO_TYPE="$PROJECT_ROLE"
  echo "🔍 Filtering stories for repository_type: $CURRENT_REPO_TYPE"
elif [ "$PROJECT_MODE" = "monolith" ]; then
  # Monolith: Accept all repository_type values (or specifically 'monolith')
  CURRENT_REPO_TYPE="monolith"
  echo "🔍 Monolith mode: Including all stories"
else
  # Default to monolith if mode not set
  CURRENT_REPO_TYPE="monolith"
  echo "🔍 Default mode: Including all stories"
fi
```

**Filter stories by repository_type**:

```python
# Pseudo-code

if CURRENT_REPO_TYPE == "monolith":
    # Monolith mode: Include all stories or filter by repository_type: monolith
    my_stories = [s for s in all_stories if s.get('repository_type') == 'monolith' or len(all_stories) > 0]
else:
    # Multi-repo mode: Filter by matching repository_type
    my_stories = [s for s in all_stories if s.get('repository_type') == CURRENT_REPO_TYPE]

announce(f"Found {len(my_stories)} stories for repository_type={CURRENT_REPO_TYPE} (Total: {len(all_stories)} across all repos)")
```

**Validation**:

```bash
if [ ${#my_stories[@]} -eq 0 ]; then
  echo "❌ ERROR: No stories assigned to repository_type: $CURRENT_REPO_TYPE"
  echo ""
  echo "📊 Available repository types in epics:"
  # List all unique repository_type values found
  grep -r 'repository_type:' "$prd_sharded_location"/*.md 2>/dev/null | \
    awk '{print $NF}' | sort -u
  echo ""
  echo "🔍 Current repository configuration:"
  echo "   - Mode: $PROJECT_MODE"
  echo "   - Role: $PROJECT_ROLE"
  echo "   - Repository ID: $CURRENT_REPO_ID"
  echo ""
  echo "✅ Fix:"
  echo "  1. Verify PRD Epic Planning section has stories with repository_type: $CURRENT_REPO_TYPE"
  echo "  2. Or check core-config.yaml multi_repo.role matches story assignments"
  exit 1
fi
```

#### 2.3 Identify Next Story to Create

**List existing stories** in `{devStoryLocation}`:
- Extract story IDs from directory names (pattern: `{epicNum}.{storyNum}-*`)
- Example: `1.1-backend-user-api/` → story ID = "1.1"

**Find next story**:
```python
# Pseudo-code

# Get existing story IDs from filesystem
existing_story_dirs = list_directories(devStoryLocation)
existing_ids = [extract_story_id(dirname) for dirname in existing_story_dirs]
# Example: ["1.1", "1.2", "2.1"]

# Filter to uncreated stories
uncreated_stories = [s for s in my_stories if s['id'] not in existing_ids]

if len(uncreated_stories) == 0:
    announce("✅ All stories for this repository have been created!")
    announce(f"Total stories created: {len(existing_ids)}")
    exit(0)

# Sort by story ID (1.1 < 1.2 < 2.1)
next_story = sort_stories_by_id(uncreated_stories)[0]
```

Announce: `📌 Identified next story: {next_story.id} - {next_story.title}`

**Store for later steps**:
- `next_story_id` = next_story['id']
- `next_story_definition` = next_story (entire story object from epic YAML)
- `next_story_epic_id` = next_story['epic_id']
- `next_story_epic_title` = next_story['epic_title']

#### 2.4 Check Cross-Repo Dependencies (Stage 2: Automated)

**If MULTI-REPO MODE**: Execute automatic dependency check.

**Call**: `{root}/utils/dependency-checker.js` (via Node.js)

**Input Parameters**:
- `story_id`: `next_story.id`
- `story_definition`: `next_story_definition`
- `current_repo_id`: `config.project.multi_repo.repository_id`
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


