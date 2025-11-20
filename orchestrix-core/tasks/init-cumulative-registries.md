# Initialize Cumulative Registries

**Purpose**: Scan all completed stories (status = Done) and generate cumulative registries for database, API, and models. This provides the foundation for the cumulative context system.

**When to Use**:
- First time setup after Orchestrix installation (if project has existing stories)
- When registries are corrupted or out of sync
- After major refactoring or manual story edits
- When user explicitly requests registry refresh via `*init-registries` command

**Execution Context**: SM Agent

---

## Prerequisites

**Check Configuration**:
1. Verify `core-config.yaml` exists in `.orchestrix-core/` directory
2. Extract story location from `locations.devStoryLocation` (default: `docs/stories`)
3. Extract dev doc location from `locations.devDocLocation` (default: `docs/dev`)

**Check Existing Registries**:
```
{devDocLocation}/database-registry.md
{devDocLocation}/api-registry.md
{devDocLocation}/models-registry.md
```

If registries exist:
- Warn user: "Registries already exist. This will overwrite them."
- Ask for confirmation (unless --force flag)
- If user confirms, create backup:
  - `{devDocLocation}/.backup/database-registry-{timestamp}.md`
  - `{devDocLocation}/.backup/api-registry-{timestamp}.md`
  - `{devDocLocation}/.backup/models-registry-{timestamp}.md`

---

## Process

### Step 1: Scan Story Directory

**Action**: Find all story files in `{devStoryLocation}`

**Pattern**: `**/*.story.md` (recursive search)

**Output**: List of story file paths

**Example**:
```
Found 15 story files:
  - docs/stories/1.1.story.md
  - docs/stories/1.2.story.md
  - docs/stories/1.3.story.md
  ...
```

If no story files found:
- Log: "No story files found. Nothing to do."
- Exit gracefully

---

### Step 2: Parse Each Story File

For each story file:

**2.1 Extract Story Metadata**:
- Story ID (from filename: `1.3.story.md` → `1.3`)
- Story Title (from `# Story X.X: {title}`)
- Story Status (from Status section: `**Current Status**: Done`)

**2.2 Filter by Status**:
- Only process stories with `Status = Done`
- Skip stories with other statuses (Approved, Review, InProgress, etc.)

**2.3 Extract Dev Agent Record**:

Locate the `## Dev Agent Record` section in the story file.

**Check for Structured Fields** (new format):
- Look for `### Database Changes (Structured)` with YAML code block
- Look for `### API Endpoints Created (Structured)` with YAML code block
- Look for `### Shared Models Created (Structured)` with YAML code block

**Example Structured Field**:
```markdown
### Database Changes (Structured)

```yaml
tables_created:
  - name: orders
    description: "Customer orders table"
    fields:
      - name: id
        type: uuid
        constraints: primary key
      - name: user_id
        type: uuid
        references: users.id
migrations:
  - filename: 20250120_create_orders.sql
    tables_affected: [orders]
    type: create
```
```

**Parse YAML**:
- Extract the YAML content from the code block
- Parse it into structured data
- Store as `story.databaseChanges`, `story.apiEndpoints`, `story.sharedModels`

**If Structured Fields Not Found** (legacy format):
- Extract `### Implementation Summary` text
- Flag as `format: legacy`
- Note: Legacy stories will have minimal data extraction (only story ID and title in timeline)
- Recommend: "Consider updating Story {id} Dev Agent Record to structured format for better tracking"

---

### Step 3: Build Cumulative Registries

Initialize three registry objects:

**3.1 Database Registry**:
```
database_registry = {
  metadata: {
    last_updated: {current timestamp},
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
    last_updated: {current timestamp},
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
    last_updated: {current timestamp},
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
    - name: table.name
    - created_in_story: story.id
    - status: active
    - description: table.description
    - fields: table.fields (with added_in_story = story.id)
    - indexes: table.indexes
    - foreign_keys: table.foreign_keys
```

If `story.databaseChanges.tables_modified` exists:
```
For each modification:
  Find existing table in database_registry.tables
  Append new fields with added_in_story = story.id
  Append new indexes with added_in_story = story.id
```

If `story.databaseChanges.migrations` exists:
```
For each migration:
  Add to database_registry.migrations:
    - filename: migration.filename
    - story_id: story.id
    - tables_affected: migration.tables_affected
    - type: migration.type (create | alter | drop)
    - status: migration.status
```

Add to timeline:
```
database_registry.timeline.push({
  story_id: story.id,
  story_title: story.title,
  tables_created: [list of table names],
  tables_modified: [list of table names],
  fields_added: count,
  indexes_added: count,
  migration_file: filename
})
```

---

**4.2 Process API Endpoints**:

If `story.apiEndpoints` exists (array of endpoints):
```
For each endpoint:
  Add to api_registry.endpoints:
    - method: endpoint.method
    - path: endpoint.path
    - story_id: story.id
    - file_path: endpoint.file_path
    - auth_required: endpoint.auth_required
    - description: endpoint.description
    - (all other endpoint fields)

  Group by resource:
    resource_name = extract from path (e.g., /api/orders → "orders")
    Add to api_registry.resources[resource_name].endpoints

  Extract schemas:
    If endpoint.request_schema:
      Add to api_registry.schemas (deduplicate by name)
    If endpoint.success_schema:
      Add to api_registry.schemas (deduplicate by name)
```

Add to timeline:
```
api_registry.timeline.push({
  story_id: story.id,
  story_title: story.title,
  endpoints: [{method, path, description}],
  schemas: [{name, type, file_path}]
})
```

---

**4.3 Process Shared Models**:

If `story.sharedModels.interfaces` exists:
```
For each interface:
  Add to models_registry.interfaces:
    - name: interface.name
    - story_id: story.id
    - file_path: interface.file_path
    - category: interface.category
    - description: interface.description
```

If `story.sharedModels.zod_schemas` exists:
```
For each schema:
  Add to models_registry.zod_schemas:
    - name: schema.name
    - story_id: story.id
    - file_path: schema.file_path
    - inferred_type: schema.inferred_type
```

If `story.sharedModels.enums` exists:
```
For each enum:
  Add to models_registry.enums:
    - name: enum.name
    - story_id: story.id
    - file_path: enum.file_path
    - values: enum.values
```

(Similar for classes, dtos)

Add to timeline:
```
models_registry.timeline.push({
  story_id: story.id,
  story_title: story.title,
  interfaces: [list of names],
  zod_schemas: [list of names],
  enums: [list of names],
  classes: [list of names],
  dtos: [list of names]
})
```

---

**For stories with `format: legacy`**:

Add placeholder entries to timelines only:
```
database_registry.timeline.push({
  story_id: story.id,
  story_title: story.title,
  tables_created: [],
  tables_modified: [],
  fields_added: 0,
  warning: "⚠️ Legacy format - limited data extraction"
})
```

(Similar for API and models registries)

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
metadata.total_models =
  interfaces.length +
  zod_schemas.length +
  enums.length +
  classes.length +
  dtos.length
```

---

### Step 6: Generate Markdown Files

**6.1 Generate Database Registry Markdown**:

Use template structure from `templates/database-registry-tmpl.yaml`

**Output file**: `{devDocLocation}/database-registry.md`

**Content**:
```markdown
# Database Cumulative Registry

> Auto-generated by SM Agent
> Updated by Dev Agent after each story completion

## Registry Metadata

**Last Updated**: {timestamp}
**Total Stories Tracked**: {count}
**Repository**: {repository_id}
**Mode**: {project_mode}

## Database Tables Registry

### Table: `orders`

**Created in Story**: 1.3
**Status**: active
**Description**: Customer orders table

#### Fields

| Field Name | Type | Constraints | Added in Story | Notes |
|------------|------|-------------|----------------|-------|
| `id` | uuid | primary key | 1.3 | |
| `user_id` | uuid | not null | 1.3 | FK to users.id |
| `total_amount` | decimal(10,2) | not null | 1.3 | |

#### Indexes

| Index Name | Fields | Type | Added in Story |
|------------|--------|------|----------------|
| `idx_orders_user_id` | user_id | btree | 1.3 |

#### Foreign Keys

| FK Name | Local Field | References | Added in Story |
|---------|-------------|------------|----------------|
| `fk_orders_user` | `user_id` | `users.id` | 1.3 |

---

## Schema Evolution Timeline

#### Story 1.1: User Authentication

- **Tables Created**: users
- **Tables Modified**: -
- **Fields Added**: 4
- **Indexes Added**: 1
- **Migration File**: `20250110_create_users.sql`

#### Story 1.3: Order Management

- **Tables Created**: orders
- **Tables Modified**: -
- **Fields Added**: 5
- **Indexes Added**: 2
- **Migration File**: `20250120_create_orders.sql`
```

---

**6.2 Generate API Registry Markdown**:

Use template structure from `templates/api-registry-tmpl.yaml`

**Output file**: `{devDocLocation}/api-registry.md`

**Content**:
```markdown
# API Cumulative Registry

> Auto-generated by SM Agent
> Updated by Dev Agent after each story completion

## Registry Metadata

**Last Updated**: {timestamp}
**Total Stories Tracked**: {count}
**Total Endpoints**: {count}
**Repository**: {repository_id}

## API Endpoints Registry

## Resource: orders

**Base Path**: `/api/orders`

### `POST /api/orders`

**Added in Story**: 1.3
**Implementation File**: `src/api/orders/create.ts`
**Status**: active
**Description**: Create a new order

**Request**:
- **Request Body**: { user_id, items[], total_amount }
- **Schema**: `CreateOrderRequest`
- **Authentication**: JWT Bearer

**Response**:
- **Success (201)**: { order_id, status, created_at }
- **Schema**: `OrderResponse`

---

## Endpoints by Story

### Story 1.3: Order Management API

**Endpoints Added**:
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details

**Schemas Created**:
- `CreateOrderRequest` (Zod) - src/schemas/order.ts
- `OrderResponse` (Zod) - src/schemas/order.ts
```

---

**6.3 Generate Models Registry Markdown**:

Use template structure from `templates/models-registry-tmpl.yaml`

**Output file**: `{devDocLocation}/models-registry.md`

**Content**:
```markdown
# Models & Types Cumulative Registry

> Auto-generated by SM Agent
> Updated by Dev Agent after each story completion

## Registry Metadata

**Last Updated**: {timestamp}
**Total Stories Tracked**: {count}
**Total Models**: {count}
**Repository**: {repository_id}

## TypeScript Interfaces

### `IOrder`

**Added in Story**: 1.3
**File**: `src/types/order.ts`
**Category**: entity
**Description**: Order entity interface

---

## Zod Validation Schemas

### `OrderSchema`

**Added in Story**: 1.3
**File**: `src/schemas/order.ts`
**Inferred Type**: `IOrder`
**Description**: Zod validation schema for orders

---

## Enums & Constants

### `OrderStatus`

**Added in Story**: 1.3
**File**: `src/types/order.ts`
**Values**: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED

---

## Models by Story

### Story 1.3: Order Management

**Created**:
- **Interfaces**: IOrder, IOrderItem
- **Zod Schemas**: OrderSchema, OrderItemSchema
- **Enums**: OrderStatus
```

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
- Check files are not empty
- Check files are valid markdown

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
- Registries are now ready for use by SM and Dev agents
- New stories will automatically update these registries in Step 7.5
- To refresh registries, run: *init-registries
```

---

### Warning Output (if legacy stories found):

```
⚠️ Legacy Format Stories Detected

The following stories use legacy (free-form) Dev Agent Record format:
- Story 1.2: User Authentication
- Story 2.1: Payment Integration
- Story 3.4: Notification System

These stories have limited data extraction (only timeline entries).

📋 Recommendation:
Consider updating these stories to use structured Dev Agent Record fields:
- database-changes (YAML)
- api-endpoints-created (YAML)
- shared-models-created (YAML)

See: templates/story-tmpl.yaml for field structure examples.
```

---

### Error Handling

**Error: Story directory not found**:
```
❌ Story directory not found: {devStoryLocation}

Check core-config.yaml:
  locations:
    devStoryLocation: docs/stories

Ensure the path is correct relative to project root.
```

**Error: No completed stories**:
```
⚠️ No completed stories found (status = Done)

Registries cannot be initialized without completed stories.
Registries will be created automatically as stories are completed.
```

**Error: Cannot write to dev doc location**:
```
❌ Failed to write registry files to: {devDocLocation}

Possible causes:
- Directory does not exist (will be created automatically)
- Permission denied (check file permissions)
- Disk full (check available space)

Please resolve the issue and try again.
```

---

## Usage Examples

### Example 1: First Time Setup

**User**: `/sm init-registries` or `*init-registries`

**SM Agent**:
```
🔍 Scanning story directory: docs/stories

Found 15 story files

📖 Parsing stories...
  ✓ Story 1.1: User Authentication (structured)
  ✓ Story 1.2: Login API (structured)
  ✓ Story 1.3: Order Management (structured)
  ...
  ⚠️ Story 2.4: Legacy format (limited extraction)

📊 Building registries...

✅ Cumulative Registries Initialized Successfully

Statistics:
- Stories Processed: 15 (12 structured, 3 legacy)
- Database: 8 tables, 67 fields
- API: 28 endpoints
- Models: 38 types

Registry files: docs/dev/
```

---

### Example 2: Refresh After Manual Edits

**User**: `*init-registries`

**SM Agent**:
```
⚠️ Existing registries found:
  - database-registry.md
  - api-registry.md
  - models-registry.md

This will overwrite existing registries.

Do you want to continue? (y/n)
```

**User**: `y`

**SM Agent**:
```
📦 Creating backups...
  ✓ database-registry-20250120-153000.md
  ✓ api-registry-20250120-153000.md
  ✓ models-registry-20250120-153000.md

🔍 Scanning stories...
[... initialization proceeds ...]

✅ Registries refreshed successfully!

Backups saved to: docs/dev/.backup/
```

---

## Notes

**Performance**:
- Typical initialization: 15 stories in ~2-3 seconds
- Large projects (100+ stories): ~10-15 seconds

**When to Refresh**:
- After manual story edits
- After importing stories from another branch
- After major refactoring
- When registries appear out of sync

**Registry Maintenance**:
- Registries are automatically updated by Dev Agent (Step 7.5) after each story completion
- Manual refresh should rarely be needed
- If registries are corrupted, delete them and run `*init-registries`

---

## Related Tasks

- `create-next-story.md` - Uses registries in Step 4.5
- `implement-story.md` - Uses registries in Step 1, updates in Step 7.5
- `utils/load-cumulative-context.md` - Reads registries
- `utils/update-database-registry.md` - Incremental update (single story)
- `utils/update-api-registry.md` - Incremental update (single story)
