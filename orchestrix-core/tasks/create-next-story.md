# Create Next Story Task

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- **No status prerequisite**: SM can create next story regardless of previous story status
- On failure: HALT with error

**Rationale**: Allows SM to create stories in advance for planning purposes, while other status transitions (Dev, QA, Architect) continue to enforce their dependencies.

## Execution

### 0. Idempotency Check (MANDATORY - if story_id provided)

**Purpose**: Handle cases where user specifies a story ID that already exists (e.g., `*draft 5.3`)

**Step 0.1: Check if story_id parameter is provided**

- If NO story_id parameter provided → **SKIP to Step 1** (create next uncreated story - existing behavior)
- If story_id parameter IS provided → Continue with idempotency check below

**Step 0.2: Load configuration and locate story file**

Load `{root}/core-config.yaml` and extract `devStoryLocation`.

Use glob pattern to find story file: `{devStoryLocation}/{story_id}*.md`
- Example: `docs/stories/5.3*.md` matches `5.3-user-authentication-api.md`
- Note: Glob pattern also matches legacy formats like `5.3.story.md` or `5.3.md` for backward compatibility

**Step 0.3: Check if story exists**

- **If story file NOT found**:
  ```
  📝 Story {story_id} does not exist yet. Creating it now...
  ```
  **Continue to Step 1** to create the specified story

  Note: Set `next_story_id = {story_id}` for use in later steps to create this specific story instead of searching for the next uncreated one.

- **If story file found** → Continue to Step 0.4

**Step 0.4: Extract current status from story file**

Read the story file and extract `Story.status` field.

**Step 0.5: Output appropriate handoff based on status**

Based on the current status, output the corresponding handoff message and HALT:

- **If status = "Blocked"**:
  ```
  ⚠️ STORY BLOCKED
  Story: {story_id}
  Status: Blocked

  This story has quality issues that must be fixed before proceeding.

  Next action: SM needs to fix blockers

  🎯 Use: *correct-course {story_id}
  ```
  **HALT: Story blocked, needs SM correction ⚠️**

- **If status = "AwaitingArchReview"**:
  ```
  ⏳ STORY AWAITING ARCHITECT REVIEW
  Story: {story_id}
  Status: AwaitingArchReview

  This story is waiting for technical review from Architect.

  🎯 HANDOFF TO architect: *review-story {story_id}
  ```
  **HALT: Forwarded to Architect ✋**

- **If status = "RequiresRevision"**:
  ```
  ✏️ STORY REQUIRES REVISION
  Story: {story_id}
  Status: RequiresRevision

  Architect has requested revisions to this story.

  Next action: SM needs to revise per Architect feedback

  🎯 Use: *revise {story_id}
  ```
  **HALT: Story needs SM revision ✏️**

- **If status = "Approved"**:
  ```
  ✅ STORY APPROVED - READY FOR DEVELOPMENT
  Story: {story_id}
  Status: Approved

  This story has been approved and is ready for implementation.

  🎯 HANDOFF TO dev: *develop-story {story_id}
  ```
  **HALT: Forwarded to Dev ✋**

- **If status = "TestDesignComplete"**:
  ```
  ✅ STORY READY - TEST DESIGN COMPLETE
  Story: {story_id}
  Status: TestDesignComplete

  This story has test design completed and is ready for implementation.

  🎯 HANDOFF TO dev: *develop-story {story_id}
  ```
  **HALT: Forwarded to Dev ✋**

- **If status = "AwaitingTestDesign"**:
  ```
  ⏳ STORY AWAITING TEST DESIGN
  Story: {story_id}
  Status: AwaitingTestDesign

  This story is waiting for QA to design tests.

  🎯 HANDOFF TO qa: *test-design {story_id}
  ```
  **HALT: Forwarded to QA for test design ✋**

- **If status = "InProgress"**:
  ```
  🔨 STORY IN PROGRESS
  Story: {story_id}
  Status: InProgress

  This story is currently being implemented by Dev.

  💡 No action needed - Dev is working on this story.
  ```
  **HALT: Story in progress ✋**

- **If status = "Review"**:
  ```
  🔍 STORY IN QA REVIEW
  Story: {story_id}
  Status: Review

  This story is currently being reviewed by QA.

  🎯 HANDOFF TO qa: *review {story_id}
  ```
  **HALT: Forwarded to QA ✋**

- **If status = "Done"**:
  ```
  ✅ STORY COMPLETE
  Story: {story_id}
  Status: Done

  This story has been implemented and passed QA review.
  Story is ready for deployment.

  💡 TIP: Start next story via *draft (no parameters)
  ```
  **HALT: Story already complete ✅**

- **If status is any other value**:
  ```
  ℹ️ STORY EXISTS
  Story: {story_id}
  Status: {current_status}

  This story already exists. Current status: {current_status}

  💡 TIP: To create the next uncreated story, use: *draft (no parameters)
  ```
  **HALT: Story exists with unknown status ⚠️**

**End of Idempotency Check - All paths above HALT here**

---

### 1. Repository Type Detection (Multi-Repo Support)

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
    # Monolith mode: Include stories with repository_type='monolith' OR stories without repository_type field
    my_stories = [s for s in all_stories if s.get('repository_type') in ['monolith', None, '']]
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

**Check if story_id was specified by user (from Step 0.3)**:

If `next_story_id` was set in Step 0.3 (user specified a story ID that doesn't exist):
```python
# Use the specified story ID
specified_story_id = next_story_id  # Set from Step 0.3

# Find this story in the available stories
next_story = None
for story in my_stories:
    if story['id'] == specified_story_id:
        next_story = story
        break

if next_story is None:
    # The specified story ID is not in the epic definitions
    announce(f"❌ Story {specified_story_id} is not defined in the Epic Planning section")
    announce("Available story IDs for this repository:")
    for s in my_stories:
        announce(f"  - {s['id']}: {s['title']}")
    exit(1)

announce(f"📌 Creating specified story: {next_story['id']} - {next_story['title']}")
```
Else (no story_id specified, find next uncreated):

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

# Note: The utility automatically reads architecture configuration from LOCAL core-config.yaml
# (architectureFile, architectureSharded, architectureShardedLocation)

Use returned `context` for Dev Notes. Cite sources: `[Source: docs/architecture/{file}.md#{section}]`

### 4.5. Load Cumulative Context from Previous Stories (MANDATORY)

**Purpose**: Load accumulated database/API/model changes from all completed stories to prevent duplicate resource creation and ensure consistency.

Execute `{root}/tasks/utils/load-cumulative-context.md`:
- Input: `devStoryLocation` (from config)
- Output: `cumulative_context` object

**What is loaded**:
- **Database Registry**: All tables and fields created in previous stories
- **API Registry**: All endpoints created in previous stories
- **Models Registry**: All TypeScript interfaces, Zod schemas, enums created in previous stories

**Handle Empty Registries**:
- If registries don't exist (first story in project), utility creates empty registries
- No error - proceed normally

**Success Output Example**:
```
✅ Cumulative Context Loaded Successfully

Database Registry: 5 tables, 42 fields (from 7 stories)
API Registry: 24 endpoints, 15 schemas (from 7 stories)
Models Registry: 32 models/types (from 7 stories)

Cumulative context ready for Dev Notes population (Step 6).
```

**Use cumulative_context in Step 6**:
- Populate "Accumulated Context from Previous Stories" section in Dev Notes
- List relevant existing resources this story should REUSE or EXTEND
- Prevent SM from designing duplicate tables/endpoints/models

**Critical**: This step ensures Dev Notes include both:
1. Static architecture baseline (from Step 4)
2. Evolved state from previous story implementations (from Step 4.5)

### 5. Verify Structure Alignment

Cross-reference requirements with `context.file_structure`. Document conflicts in "Project Structure Notes".

### 6. Populate Story Template

Create story file using `{root}/templates/story-tmpl.yaml`:
- **Filename**: Follow template's specification: `{devStoryLocation}/{epicNum}.{storyNum}-{story_title_short}.md`
  - Extract story title from epic definition (from Step 2.3: `next_story_definition.title`)
  - Convert title to kebab-case for `story_title_short` (lowercase, hyphens, no special chars)
  - Example: Title "Redesign Locker Order Table" → `10.1-redesign-locker-order-table.md`
  - Example: Title "User Authentication API" → `5.3-user-authentication-api.md`
- Fill all sections per template
- Use `context` from Step 4 for Dev Notes (architecture baseline)
- **NEW**: Use `cumulative_context` from Step 4.5 for Dev Notes "Accumulated Context from Previous Stories" section
- Include structure alignment from Step 5
- Follow optimized Dev Notes guidelines (see below)

**OPTIMIZED Dev Notes Guidelines** (Target: ~200 lines total):

Follow the optimized template structure in `story-tmpl.yaml`:
- **Technical Constraints Summary** (~20 lines): Story-specific constraints with architecture doc references
- **Accumulated Context** (~30 lines): Compact table format listing relevant resources from previous stories
- **Database Design** (~40 lines): Design decisions and rationale, NOT full SQL
- **Data Models** (~40 lines): Interface contracts and business rules, NOT full implementations
- **File Locations** (~20 lines): Exact paths per project structure
- **Testing Requirements** (~30 lines): Framework references + story-specific test priorities
- **Technical Constraints** (~20 lines): Version/performance/security constraints unique to this story

**Key Principles**:
- Reference architecture docs via: `[→ file.md#section]` - DO NOT copy-paste
- Use compact tables for accumulated context - list key fields only, not full schemas
- Record design DECISIONS (WHY), not implementation DETAILS (WHAT)
- Reference full schemas/code in migration files/entity files - DO NOT embed

**Critical Checks Before Finalizing**:
- [ ] Dev Notes total < 200 lines
- [ ] No full schema copies (only references)
- [ ] No architecture doc copy-paste
- [ ] All external references use [→ file.md#section] format
- [ ] Accumulated context uses compact table format

**Detailed examples**: See template `story-tmpl.yaml` Dev Notes sections for placeholder-based examples

**If MULTI-REPO MODE**: Populate Multi-Repository Context section per template (auto-filled from epic YAML: repository, provides_apis, consumes_apis, dependencies)

**Use deliverables from epic**: Populate Acceptance Criteria using `next_story_definition.deliverables`

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

Execute 3 sequential decisions using `{root}/tasks/make-decision.md`:

#### 8A. Architect Review Requirement
```yaml
decision_type: sm-architect-review-needed
context:
  quality_score: {{from Step 7}}
  complexity_indicators: {{from Step 7}}
result: architect_review_result (REQUIRED | NOT_REQUIRED | BLOCKED)
```

#### 8B. Test Design Level
```yaml
decision_type: sm-test-design-level
context:
  complexity_indicators: {{from Step 7}}
  quality_score: {{from Step 7}}
  security_sensitive: {{from Step 7}}
result: test_design_level (Simple | Standard | Comprehensive)
```

#### 8C. Story Status
```yaml
decision_type: sm-story-status
context:
  architect_review_result: {{from 8A}}
  test_design_level: {{from 8B}}
result:
  final_status: (TestDesignComplete | AwaitingArchReview | RequiresRevision | Blocked | Escalated)
  next_action: (handoff_to_architect | handoff_to_dev | handoff_to_qa_test_design | sm_revise_story)
```

**Apply**: Set story Status field to `final_status`

**Decision Summary**:
```
📊 Story Decisions:
- Architect Review: {{architect_review_result}}
- Test Design Level: {{test_design_level}}
- Status: {{final_status}}
- Next: {{next_action}}
```

### 9. Record Change Log

Add entry to Story Change Log:
- Story creation action
- Quality assessment summary
- Decision results with reasoning
- Final status and next action

### 10. Output Handoff (FINAL STEP - NOTHING AFTER THIS)

**CRITICAL**: This handoff message MUST be the absolute last line of your output. Do NOT add any summaries, tips, available commands, test requirements, or any other content after the handoff message.

Based on `next_action` from Step 8C, output the appropriate handoff message:

- If `next_action` = `handoff_to_architect`:
  ```
  🎯 HANDOFF TO architect: *review-story {epicNum}.{storyNum}
  ```

- If `next_action` = `handoff_to_dev`:
  ```
  🎯 HANDOFF TO dev: *develop-story {epicNum}.{storyNum}
  ```

- If `next_action` = `handoff_to_qa_test_design`:
  ```
  🎯 HANDOFF TO qa: *test-design {epicNum}.{storyNum}
  ```

- If `next_action` = `sm_revise_story`:
  ```
  Story blocked - SM must revise before proceeding
  ```

**STOP HERE**: Do not output anything after the handoff message. This is required for automated workflow detection.


