# Create Next Story Task

## Permission Check

Verify SM agent permissions via `{root}/data/story-status-transitions.yaml`:
- `can_create_story: true` and `can_set_initial_status: true`
- On failure: HALT with error

## Execution

### 0. Idempotency Check (if story_id provided)

**Step 0.1: Check if story_id parameter provided**
- If NO story_id → **SKIP to Step 1**
- If story_id provided → Continue

**Step 0.2: Load configuration and locate story file**

Load `{root}/core-config.yaml` and extract `devStoryLocation`.
Use glob pattern: `{devStoryLocation}/{story_id}*.md`

**Step 0.3: Check if story exists**

**If story file NOT found**:
```
📝 Story {story_id} does not exist yet. Creating it now...
```
Set `next_story_id = {story_id}` and continue to Step 1.

**If story file found** → Continue to Step 0.4

**Step 0.4: Extract current status**

Read story file and extract `Story.status` field.

**Step 0.5: Output handoff based on status**

- **Blocked**:
  ```
  ⚠️ STORY BLOCKED
  Story: {story_id}
  Status: Blocked

  🎯 Use: *correct-course {story_id}
  ```
  **HALT**

- **AwaitingArchReview**:
  ```
  ⏳ STORY AWAITING ARCHITECT REVIEW
  Story: {story_id}

  🎯 HANDOFF TO architect: *review-story {story_id}
  ```
  **HALT**

- **RequiresRevision**:
  ```
  ✏️ STORY REQUIRES REVISION
  Story: {story_id}

  🎯 Use: *revise {story_id}
  ```
  **HALT**

- **Approved** or **TestDesignComplete**:
  ```
  ✅ STORY READY FOR DEVELOPMENT
  Story: {story_id}

  🎯 HANDOFF TO dev: *develop-story {story_id}
  ```
  **HALT**

- **AwaitingTestDesign**:
  ```
  ⏳ STORY AWAITING TEST DESIGN
  Story: {story_id}

  🎯 HANDOFF TO qa: *test-design {story_id}
  ```
  **HALT**

- **InProgress**:
  ```
  🔨 STORY IN PROGRESS
  Story: {story_id}

  💡 No action needed - Dev is working on this story.
  ```
  **HALT**

- **Review**:
  ```
  🔍 STORY IN QA REVIEW
  Story: {story_id}

  🎯 HANDOFF TO qa: *review {story_id}
  ```
  **HALT**

- **Done**:
  ```
  ✅ STORY COMPLETE
  Story: {story_id}

  💡 TIP: Start next story via *draft (no parameters)
  ```
  **HALT**

---

### 1. Repository Type Detection

**Read `{root}/core-config.yaml`**:
Extract `project.mode`, `project.multi_repo.role`, `project.multi_repo.repository_id`, `project.multi_repo.product_repo_path`

**Determine mode**:
- If `project.mode = single-repo` OR not set: **MONOLITH MODE** → Skip to Step 1
- If `project.mode = multi-repo` AND `role = product`: **ERROR** → Cannot create stories in product repo
- If `project.mode = multi-repo` AND `role ∈ {backend, frontend, ios, android, flutter, react-native}`: **MULTI-REPO MODE**

**If ERROR (product repo)**:
```
❌ ERROR: Cannot create stories in product repository

Current project mode: multi-repo
Repository role: product

ACTION: Stories must be created in implementation repositories.
Navigate to implementation repository and run *draft there.

HALT
```

**If MULTI-REPO MODE**:

Extract:
- `current_repo_id` = `project.multi_repo.repository_id`
- `product_repo_path` = `project.multi_repo.product_repo_path`
- `repo_role` = `project.multi_repo.role`

**Validate**:
- If `product_repo_path` empty: HALT with fix instructions
- If product repo directory doesn't exist: HALT with error

### 1. Load Configuration

Load `{root}/core-config.yaml`. If missing: HALT.

Extract: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

**Determine PRD shards location**:
- If `prdSharded` = true: Use `prdShardedLocation`
- If `prdSharded` = false: HALT with "PRD not sharded. Run @po *shard first"

**If Multi-Repo Mode**: Override paths to product repo:
- `prd_sharded_location` = `{product_repo_path}/{prdShardedLocation}`
- `architecture_location` = `{product_repo_path}/docs/architecture`
- `devStoryLocation` remains in current repo

### 2. Identify Next Story

#### 2.1 Load Epic Definitions from Sharded PRD

**Path**: `{prd_sharded_location}`

**Step 2.1.1: Verify PRD shards exist**

```bash
if [ ! -d "$prd_sharded_location" ]; then
  echo "❌ ERROR: PRD shards directory not found"
  echo "📍 Expected location: $prd_sharded_location"
  echo "✅ Fix:"
  if [ "$PROJECT_MODE" = "multi-repo" ]; then
    echo "  1. Navigate to Product repo: cd $product_repo_path"
    echo "  2. Run PO shard: @po *shard"
  else
    echo "  1. Run PO shard: @po *shard"
  fi
  exit 1
fi
```

**Step 2.1.2: Extract Epic YAML blocks**

```bash
PRD_FILES=$(ls -1 "$prd_sharded_location"/*.md 2>/dev/null)
TEMP_EPICS_FILE="/tmp/orchestrix-epics-$$.yaml"

for prd_file in $PRD_FILES; do
  awk '/```yaml/,/```/ {if (!/```/) print}' "$prd_file" >> "$TEMP_EPICS_FILE"
done

EPIC_COUNT=$(grep -c 'epic_id:' "$TEMP_EPICS_FILE" || echo "0")

if [ "$EPIC_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No epic YAML blocks found in PRD shards"
  exit 1
fi
```

**Step 2.1.3: Parse YAML and extract stories**

```python
all_epics = []
all_stories = []

for yaml_block in parse_yaml_blocks(TEMP_EPICS_FILE):
    if 'epic_id' in yaml_block and 'stories' in yaml_block:
        epic = yaml_block
        all_epics.append(epic)

        for story in epic['stories']:
            story['epic_id'] = epic['epic_id']
            story['epic_title'] = epic['title']
            all_stories.append(story)
```

#### 2.2 Filter Stories by Repository Type

```bash
if [ "$PROJECT_MODE" = "multi-repo" ]; then
  CURRENT_REPO_TYPE="$PROJECT_ROLE"
elif [ "$PROJECT_MODE" = "monolith" ]; then
  CURRENT_REPO_TYPE="monolith"
else
  CURRENT_REPO_TYPE="monolith"
fi
```

```python
if CURRENT_REPO_TYPE == "monolith":
    my_stories = [s for s in all_stories if s.get('repository_type') in ['monolith', None, '']]
else:
    my_stories = [s for s in all_stories if s.get('repository_type') == CURRENT_REPO_TYPE]
```

#### 2.3 Identify Next Story to Create

**If `next_story_id` set from Step 0.3**:

```python
next_story = find_story_by_id(my_stories, next_story_id)

if next_story is None:
    announce(f"❌ Story {next_story_id} not defined in Epic Planning")
    list_available_stories(my_stories)
    exit(1)
```

**Else (no story_id specified)**:

```python
existing_story_dirs = list_directories(devStoryLocation)
existing_ids = [extract_story_id(dirname) for dirname in existing_story_dirs]

uncreated_stories = [s for s in my_stories if s['id'] not in existing_ids]

if len(uncreated_stories) == 0:
    announce("✅ All stories for this repository have been created!")
    exit(0)

next_story = sort_stories_by_id(uncreated_stories)[0]
```

Store:
- `next_story_id`
- `next_story_definition`
- `next_story_epic_id`

#### 2.4 Check Cross-Repo Dependencies

**If MULTI-REPO MODE**: Execute automatic dependency check.

Call `{root}/utils/dependency-checker.js` with:
- `story_id`, `story_definition`, `current_repo_id`, `product_repo_path`, `all_stories`

**Handle Result**:

- **no_dependencies** or **same_repo_only**: Continue to Step 3
- **satisfied**: Continue to Step 3
- **blocked**: HALT with blocking dependencies message
- **error**: HALT with error message

### 3. Gather Requirements

**If MULTI-REPO MODE**:

Use `next_story_definition` containing:
- `id`, `title`, `repository`, `repository_type`
- `dependencies`, `provides_apis`, `consumes_apis`
- `deliverables`, `acceptance_criteria_summary`
- `estimated_complexity`, `priority`

**Load API contracts** (if available):
- Path: `{product_repo_path}/docs/architecture/api-contracts.md`

**Load epic description**: Use `next_story_epic.description`

### 4. Load Architecture Context

Execute `{root}/tasks/utils/load-architecture-context.md`:
- `story_type`: From epic (Backend | Frontend | FullStack)

Use returned `context` for Dev Notes. Cite sources: `[Source: docs/architecture/{file}.md#{section}]`

### 4.5. Load Cumulative Context (MANDATORY)

Execute `{root}/tasks/utils/load-cumulative-context.md`:
- Input: `devStoryLocation`
- Output: `cumulative_context` object

**What is loaded**:
- Database Registry: All tables/fields from previous stories
- API Registry: All endpoints from previous stories
- Models Registry: All interfaces/schemas/enums from previous stories

**Success Output**:
```
✅ Cumulative Context Loaded Successfully

Database Registry: 5 tables, 42 fields (from 7 stories)
API Registry: 24 endpoints, 15 schemas (from 7 stories)
Models Registry: 32 models/types (from 7 stories)
```

---

### 4.6. Validate Against Cumulative Context (MANDATORY - Shift Left)

**Purpose**: Proactively detect resource conflicts BEFORE Dev starts implementation. This prevents costly rework by catching design-level conflicts during story creation.

Execute `{root}/tasks/utils/validate-against-cumulative-context.md`:

**Input**:
- **Planned database changes** (from epic requirements analysis in Step 3):
  - New tables to create
  - Existing tables to alter
  - New fields to add
  - Foreign key references

- **Planned API endpoints** (from epic requirements):
  - New endpoints: method + path
  - Request/response schemas

- **Planned models** (from epic requirements):
  - New interfaces/types/schemas
  - Enum definitions

- **cumulative_context** (from Step 4.5)

**Validation Rules** (Automatic):
- ❌ **HALT**: Duplicate table names
- ❌ **HALT**: Duplicate API endpoints (same method + path)
- ❌ **HALT**: Foreign key references non-existent tables
- ⚠️ **WARN**: Duplicate model names (allowed with different namespaces)
- ⚠️ **WARN**: Similar table names (e.g., "user" vs "users")

**On Conflict Detected**:

SM must resolve conflict BEFORE proceeding to Step 6. Resolution options:

1. **Rename Resource**:
   - Example: `users` already exists → rename to `user_profiles`
   - Example: Endpoint `POST /api/auth` exists → use `POST /api/auth/sessions`

2. **Change Operation Type**:
   - Example: Story says "Create table users" → change to "ALTER table users (add columns)"
   - Update Dev Notes to reflect ALTER instead of CREATE

3. **Remove Duplicate**:
   - If resource already exists and story doesn't need to modify it → remove from story scope
   - Document in Dev Notes: "Using existing {resource} from Story X.Y"

4. **Escalate to Architect**:
   - If conflict indicates fundamental design issue
   - Example: Two stories trying to create same core table (design flaw)

**Success Output**:
```
✅ VALIDATION PASSED - No Conflicts Detected

Validated Resources:
✓ Tables:
  - user_sessions (NEW - no conflict)
  - users (ALTER - add password_hash field)
✓ API Endpoints:
  - POST /api/auth/login (NEW - no conflict)
  - POST /api/auth/logout (NEW - no conflict)
✓ Models:
  - SessionData (NEW - no conflict)
  - LoginRequest (NEW - no conflict)

All planned resources are conflict-free. Safe to proceed to Step 6.
```

**Conflict Output Example**:
```
❌ CONFLICT DETECTED - Cannot Proceed

Conflict #1: Duplicate Table Name
- Resource: Table 'users'
- Already exists in: Story 1.1 (created 2025-01-15)
- Current story plan: Create table 'users'

Resolution Options:
1. Rename to 'user_profiles' (recommended)
2. Change to ALTER table 'users' (if modifying existing)
3. Remove from story scope (if not needed)
4. Escalate to Architect (if design issue)

Conflict #2: Duplicate API Endpoint
- Resource: POST /api/users
- Already exists in: Story 1.2 (created 2025-01-16)
- Current story plan: Create POST /api/users

Resolution Options:
1. Use different path: POST /api/user-profiles
2. Remove from story scope (use existing endpoint)
3. Escalate to Architect (if design issue)

🛑 ACTION REQUIRED: Resolve ALL conflicts before proceeding to Step 6
- Update epic analysis in Step 3 with resolution
- Adjust planned resources accordingly
- Re-run this validation to confirm
```

**Critical Notes**:
- This is **NOT optional** - conflicts MUST be resolved
- Do NOT proceed to Step 6 with unresolved conflicts
- Do NOT defer conflict resolution to Dev agent
- SM owns story design - conflicts are design issues
- Dev agent will re-validate (Step 5 in develop-story.md) as safety net

---

### 5. Verify Structure Alignment

Cross-reference requirements with `context.file_structure`. Document conflicts in "Project Structure Notes".

### 6. Populate Story Template

Create story file using `{root}/templates/story-tmpl.yaml`:
- **Filename**: `{devStoryLocation}/{epicNum}.{storyNum}-{story_title_short}.md`
  - Convert title to kebab-case
  - Example: "User Authentication API" → `5.3-user-authentication-api.md`
- Fill all sections per template
- Use `context` from Step 4 for architecture baseline
- Use `cumulative_context` from Step 4.5 for accumulated context

**OPTIMIZED Dev Notes Guidelines** (Target: ~200 lines):

- **Technical Constraints Summary** (~20 lines): Story-specific constraints with doc references
- **Accumulated Context** (~30 lines): Compact table format listing relevant resources
- **Database Design** (~40 lines): Design decisions and rationale, NOT full SQL
- **Data Models** (~40 lines): Interface contracts, NOT full implementations
- **File Locations** (~20 lines): Exact paths
- **Testing Requirements** (~30 lines): Framework references + story priorities
- **Technical Constraints** (~20 lines): Story-specific constraints

**Key Principles**:
- Reference architecture docs via: `[→ file.md#section]` - DO NOT copy-paste
- Use compact tables for accumulated context
- Record design DECISIONS (WHY), not implementation DETAILS (WHAT)

**Critical Checks**:
- [ ] Dev Notes total < 200 lines
- [ ] No full schema copies (only references)
- [ ] No architecture doc copy-paste
- [ ] All external references use `[→ file.md#section]` format
- [ ] Accumulated context uses compact table format

### 7. Quality Assessment

Execute `{root}/checklists/scoring/sm-story-quality.md`:
- This is a scored quality assessment with embedded instructions
- Follow the checklist's scoring logic (Structure Validation + Technical Quality + Complexity Detection)
- Context: Story file from Step 6

Extract:
- `quality_score` (0-10)
- `complexity_indicators`
- `security_sensitive`
- Structure validation (must be 100%)
- Technical quality (must be ≥80%)

If validation fails: Set Status = `Blocked`, HALT

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

Apply: Set story Status field to `final_status`

### 9. Record Change Log

Add entry to Story Change Log:
- Story creation action
- Quality assessment summary
- Decision results with reasoning
- Final status and next action

### 10. Output Handoff (FINAL STEP)

**CRITICAL**: This handoff MUST be the absolute last line. Do NOT add any content after it.

Based on `next_action` from Step 8C:

- If `handoff_to_architect`:
  ```
  🎯 HANDOFF TO architect: *review-story {epicNum}.{storyNum}
  ```

- If `handoff_to_dev`:
  ```
  🎯 HANDOFF TO dev: *develop-story {epicNum}.{storyNum}
  ```

- If `handoff_to_qa_test_design`:
  ```
  🎯 HANDOFF TO qa: *test-design {epicNum}.{storyNum}
  ```

- If `sm_revise_story`:
  ```
  Story blocked - SM must revise before proceeding
  ```

**STOP HERE**
