# Initialize Cumulative Registries

**When to Use**:
- First time setup after Orchestrix installation
- When registries are corrupted or out of sync
- After major refactoring or manual story edits
- User explicitly requests via `*init-registries`

**Execution Context**: SM Agent

---

## Prerequisites

**Check Configuration**:
1. Verify `core-config.yaml` exists in `.orchestrix-core/`
2. Extract `locations.devStoryLocation` (default: `docs/stories`)
3. Extract `locations.devDocLocation` (default: `docs/dev`)

**Check Existing Registries**:
```
{devDocLocation}/database-registry.md
{devDocLocation}/api-registry.md
{devDocLocation}/models-registry.md
```

If registries exist:
- Warn: "Registries already exist. This will overwrite them."
- Ask for confirmation (unless --force flag)
- If confirmed, create backup:
  - `{devDocLocation}/.backup/database-registry-{timestamp}.md`
  - `{devDocLocation}/.backup/api-registry-{timestamp}.md`
  - `{devDocLocation}/.backup/models-registry-{timestamp}.md`

---

## Process

### Step 1: Scan Story Directory

Find all story files in `{devStoryLocation}`

Pattern: `**/*.story.md` (recursive search)

Output: List of story file paths

If no story files found:
- Log: "No story files found. Nothing to do."
- Exit gracefully

---

### Step 2: Parse Each Story File

For each story file:

**2.1 Extract Story Metadata**:
- Story ID (from filename: `1.3.story.md` → `1.3`)
- Story Title (from `# Story X.X: {title}`)
- Story Status (from `**Current Status**: Done`)

**2.2 Filter by Status**:
- Only process stories with `Status = Done`
- Skip stories with other statuses

**2.3 Extract Dev Agent Record**:

Locate `## Dev Agent Record` section.

**Check for Structured Fields** (new format):
- `### Database Changes (Structured)` with YAML code block
- `### API Endpoints Created (Structured)` with YAML code block
- `### Shared Models Created (Structured)` with YAML code block

**Parse YAML**:
- Extract YAML content from code blocks
- Parse into structured data
- Store as `story.databaseChanges`, `story.apiEndpoints`, `story.sharedModels`

**If Structured Fields Not Found** (legacy format):
- Extract `### Implementation Summary` text
- Flag as `format: legacy`
- Recommend: "Consider updating Story {id} to structured format"

---

### Step 3: Build Cumulative Registries

Initialize three registry objects:

**3.1 Database Registry**:
```
database_registry = {
  metadata: {
    last_updated: {timestamp},
    total_stories: 0,
    repository_id: {from config},
    project_mode: {monolith | multi-repo}
  },
  tables: [],
  migrations: [],
  timeline: []
}
```

**3.2 API Registry**:
```
api_registry = {
  metadata: {
    last_updated: {timestamp},
    total_stories: 0,
    total_endpoints: 0,
    repository_id: {from config},
    project_mode: {monolith | multi-repo}
  },
  resources: {},
  endpoints: [],
  schemas: [],
  timeline: []
}
```

**3.3 Models Registry**:
```
models_registry = {
  metadata: {
    last_updated: {timestamp},
    total_stories: 0,
    total_models: 0,
    repository_id: {from config},
    project_mode: {monolith | multi-repo}
  },
  interfaces: [],
  zod_schemas: [],
  enums: [],
  classes: [],
  dtos: [],
  timeline: []
}
```

---

### Step 4: Process Each Completed Story

For each story with `format: structured`:

**4.1 Process Database Changes**:

If `story.databaseChanges.tables_created` exists:
```
For each table in tables_created:
  Add to database_registry.tables:
    - name, created_in_story, status, description
    - fields (with added_in_story = story.id)
    - indexes, foreign_keys
```

If `story.databaseChanges.tables_modified` exists:
```
Find existing table in database_registry.tables
Append new fields with added_in_story = story.id
Append new indexes with added_in_story = story.id
```

If `story.databaseChanges.migrations` exists:
```
Add to database_registry.migrations:
  - filename, story_id, tables_affected, type, status
```

Add to timeline:
```
database_registry.timeline.push({
  story_id, story_title,
  tables_created, tables_modified,
  fields_added, indexes_added,
  migration_file
})
```

**4.2 Process API Endpoints**:

If `story.apiEndpoints` exists:
```
For each endpoint:
  Add to api_registry.endpoints:
    - method, path, story_id, file_path, auth_required, description

  Group by resource:
    resource_name = extract from path
    Add to api_registry.resources[resource_name].endpoints

  Extract schemas:
    If endpoint.request_schema: Add to api_registry.schemas
    If endpoint.success_schema: Add to api_registry.schemas
```

Add to timeline:
```
api_registry.timeline.push({
  story_id, story_title,
  endpoints: [{method, path, description}],
  schemas: [{name, type, file_path}]
})
```

**4.3 Process Shared Models**:

If `story.sharedModels.interfaces` exists:
```
For each interface:
  Add to models_registry.interfaces:
    - name, story_id, file_path, category, description
```

(Similar for zod_schemas, enums, classes, dtos)

Add to timeline:
```
models_registry.timeline.push({
  story_id, story_title,
  interfaces, zod_schemas, enums, classes, dtos
})
```

**For stories with `format: legacy`**:

Add placeholder entries to timelines only:
```
database_registry.timeline.push({
  story_id, story_title,
  tables_created: [], tables_modified: [],
  fields_added: 0,
  warning: "⚠️ Legacy format - limited data extraction"
})
```

---

### Step 5: Calculate Registry Totals

**Database Registry**:
```
metadata.total_stories = unique stories count
metadata.total_tables = database_registry.tables.length
metadata.total_fields = sum of all table.fields.length
```

**API Registry**:
```
metadata.total_stories = unique stories count
metadata.total_endpoints = api_registry.endpoints.length
metadata.total_schemas = api_registry.schemas.length
```

**Models Registry**:
```
metadata.total_stories = unique stories count
metadata.total_models = interfaces.length + zod_schemas.length + enums.length + classes.length + dtos.length
```

---

### Step 6: Generate Markdown Files

**6.1 Generate Database Registry Markdown**:

Use template structure from `{root}/templates/database-registry-tmpl.yaml`

Output file: `{devDocLocation}/database-registry.md`

Content structure:
```markdown
# Database Cumulative Registry

> Auto-generated by SM Agent
> Updated by Dev Agent after each story completion

## Registry Metadata

**Last Updated**: {timestamp}
**Total Stories Tracked**: {count}

## Database Tables Registry

### Table: `orders`

**Created in Story**: 1.3
**Status**: active

#### Fields

| Field Name | Type | Constraints | Added in Story |
|------------|------|-------------|----------------|
| `id` | uuid | primary key | 1.3 |
| `user_id` | uuid | not null | 1.3 |

## Schema Evolution Timeline

#### Story 1.1: User Authentication
- **Tables Created**: users
- **Fields Added**: 4
- **Migration File**: `20250110_create_users.sql`
```

**6.2 Generate API Registry Markdown**:

Use template structure from `{root}/templates/api-registry-tmpl.yaml`

Output file: `{devDocLocation}/api-registry.md`

**6.3 Generate Models Registry Markdown**:

Use template structure from `{root}/templates/models-registry-tmpl.yaml`

Output file: `{devDocLocation}/models-registry.md`

---

### Step 7: Write Registry Files

**7.1 Ensure Directory Exists**:
```
Create directory if not exists: {devDocLocation}
Create backup directory: {devDocLocation}/.backup
```

**7.2 Write Files**:
```
Write: {devDocLocation}/database-registry.md
Write: {devDocLocation}/api-registry.md
Write: {devDocLocation}/models-registry.md
```

**7.3 Verify Write Success**:
- Check files exist
- Check files not empty
- Check files valid markdown

---

## Output

### Success Output:

```
✅ Cumulative Registries Initialized Successfully

📊 Statistics:
- Stories Processed: 15
  - Structured format: 12
  - Legacy format: 3
  - Skipped (not Done): 5

📁 Registry Files Created:
- database-registry.md
  - Tables: 8
  - Fields: 67
  - Migrations: 12

- api-registry.md
  - Endpoints: 28
  - Schemas: 15

- models-registry.md
  - Interfaces: 18
  - Zod Schemas: 15
  - Enums: 5
  - Total Models: 38

📂 Location: {devDocLocation}/

🎯 Next Steps:
- Registries ready for use by SM and Dev agents
- New stories will auto-update in Step 7.5
- To refresh: *init-registries
```

### Warning Output (if legacy stories found):

```
⚠️ Legacy Format Stories Detected

The following stories use legacy format:
- Story 1.2: User Authentication
- Story 2.1: Payment Integration

These have limited data extraction.

📋 Recommendation:
Consider updating to structured Dev Agent Record fields.
See: templates/story-tmpl.yaml
```

### Error Handling

**Error: Story directory not found**:
```
❌ Story directory not found: {devStoryLocation}

Check core-config.yaml:
  locations:
    devStoryLocation: docs/stories
```

**Error: No completed stories**:
```
⚠️ No completed stories found (status = Done)

Registries will be created automatically as stories are completed.
```

**Error: Cannot write**:
```
❌ Failed to write registry files to: {devDocLocation}

Possible causes:
- Directory does not exist (will be created)
- Permission denied
- Disk full
```

---

## Related Tasks

- `create-next-story.md` - Uses registries in Step 4.5
- `develop-story.md` - Uses registries in Step 1, updates in Step 7.5
- `utils/load-cumulative-context.md` - Reads registries
- `utils/update-database-registry.md` - Incremental update
- `utils/update-api-registry.md` - Incremental update
