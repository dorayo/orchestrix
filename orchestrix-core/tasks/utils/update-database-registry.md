# Update Database Registry

**Purpose**: Automatically update the cumulative database registry after story completion with structured database changes from Dev Agent Record.

**Trigger**: Called by Dev Agent in Step 7 (after implementation completion) when story status changes to "Done".

**Update Mode**: Append-only (preserves historical data)

---

## Inputs

**Required**:
1. `story` - Completed story object with Dev Agent Record containing `database_changes` field
2. `CONFIG_PATH.devDocLocation` - Location to write/update registry file

**From Story Dev Agent Record** (structured field):
```yaml
database_changes:
  tables_created:
    - name: orders
      description: "Stores customer orders"
      fields:
        - name: id
          type: uuid
          constraints: primary key, default gen_random_uuid()
        - name: user_id
          type: uuid
          constraints: not null
          references: users.id
        - name: total_amount
          type: decimal(10,2)
          constraints: not null
        - name: status
          type: varchar(50)
          constraints: not null
        - name: created_at
          type: timestamp
          constraints: default now()
      indexes:
        - name: idx_orders_user_id
          fields: user_id
          type: btree
      foreign_keys:
        - name: fk_orders_user
          local_field: user_id
          references: users.id
          on_delete: CASCADE

  tables_modified:
    - name: users
      fields_added:
        - name: last_login_at
          type: timestamp
          constraints: nullable
      indexes_added:
        - name: idx_users_last_login
          fields: last_login_at
          type: btree

  migrations:
    - filename: 20250120_create_orders_table.sql
      tables_affected: [orders]
      type: create
      status: applied
```

---

## Process

### Step 1: Load Existing Registry

**Registry File**: `{devDocLocation}/database-registry.md`

**If file does NOT exist**:
- Initialize new registry from template `templates/database-registry-tmpl.yaml`
- Set metadata:
  ```yaml
  last_updated: {current timestamp}
  total_stories: 1
  repository_id: {from config}
  project_mode: {from config}
  ```

**If file exists**:
- Read existing registry
- Parse current metadata and tables registry

---

### Step 2: Extract New Database Changes

From `story.dev_agent_record.database_changes`:

**Extract Tables Created**:
```javascript
new_tables = story.database_changes.tables_created || []

for (table of new_tables) {
  table_entry = {
    name: table.name,
    created_in_story: story.id,  // e.g., "1.3"
    status: "active",
    description: table.description || "",
    fields: table.fields.map(field => ({
      name: field.name,
      type: field.type,
      constraints: field.constraints,
      added_in_story: story.id,
      notes: field.references ? `FK to ${field.references}` : ""
    })),
    indexes: table.indexes || [],
    foreign_keys: table.foreign_keys || []
  }
}
```

**Extract Tables Modified**:
```javascript
modified_tables = story.database_changes.tables_modified || []

for (mod_table of modified_tables) {
  existing_table = find_in_registry(mod_table.name)

  // Add new fields to existing table
  for (field of mod_table.fields_added) {
    existing_table.fields.push({
      name: field.name,
      type: field.type,
      constraints: field.constraints,
      added_in_story: story.id,  // Mark with CURRENT story
      notes: field.notes || ""
    })
  }

  // Add new indexes
  for (index of mod_table.indexes_added) {
    existing_table.indexes.push({
      ...index,
      added_in_story: story.id
    })
  }
}
```

**Extract Migrations**:
```javascript
new_migrations = story.database_changes.migrations || []

for (migration of new_migrations) {
  migration_entry = {
    filename: migration.filename,
    story_id: story.id,
    tables_affected: migration.tables_affected.join(", "),
    type: migration.type,  // create | alter | drop
    status: migration.status
  }
}
```

---

### Step 3: Merge with Existing Registry

**Merge Tables**:
- For new tables: Append to `tables` array
- For modified tables: Update existing entry (add fields, indexes, etc.)
- Sort tables alphabetically by name

**Merge Migrations**:
- Append to `migrations` array
- Sort chronologically (by story ID)

**Update Schema Evolution Timeline**:
- Add new entry for current story:
  ```yaml
  - story_id: 1.3
    story_title: "Implement order management"
    tables_created: ["orders", "order_items"]
    tables_modified: ["users"]
    fields_added: 7
    indexes_added: 2
    migration_file: 20250120_create_orders_table.sql
  ```

---

### Step 4: Recalculate Metadata

**Update Counts**:
```javascript
metadata.last_updated = current_timestamp()
metadata.total_stories = unique_stories_count()
metadata.total_tables = tables.length
metadata.total_fields = sum(tables.map(t => t.fields.length))
```

**Detect Naming Conventions** (auto-detect from data):
```javascript
naming_conventions = {
  table_naming: detect_pattern(tables.map(t => t.name)),  // e.g., "snake_case, plural"
  field_naming: detect_pattern(all_field_names),
  primary_key_pattern: detect_pk_pattern(),  // e.g., "id (uuid)"
  foreign_key_pattern: detect_fk_pattern(),  // e.g., "{table}_id"
  timestamp_fields: detect_timestamp_pattern(),  // e.g., "created_at, updated_at"
  soft_delete_pattern: detect_soft_delete()  // e.g., "deleted_at (nullable)"
}
```

---

### Step 5: Generate Updated Registry Content

Using `templates/database-registry-tmpl.yaml`, populate with merged data:

**Metadata Section**:
```markdown
## Registry Metadata

**Last Updated**: 2025-01-20 15:30:00
**Total Stories Tracked**: 8
**Repository**: my-app-backend
**Mode**: multi-repo
```

**Tables Registry Section**:
```markdown
## Database Tables Registry

### Table: `orders`

**Created in Story**: 1.3
**Status**: active
**Description**: Stores customer orders

#### Fields

| Field Name | Type | Constraints | Added in Story | Notes |
|------------|------|-------------|----------------|-------|
| `id` | uuid | primary key, default gen_random_uuid() | 1.3 | |
| `user_id` | uuid | not null | 1.3 | FK to users.id |
| `total_amount` | decimal(10,2) | not null | 1.3 | |
| `status` | varchar(50) | not null | 1.3 | |
| `created_at` | timestamp | default now() | 1.3 | |

#### Indexes

| Index Name | Fields | Type | Added in Story |
|------------|--------|------|----------------|
| `idx_orders_user_id` | user_id | btree | 1.3 |

#### Foreign Keys

| FK Name | Local Field | References | Added in Story |
|---------|-------------|------------|----------------|
| `fk_orders_user` | `user_id` | `users.id` | 1.3 |

---

### Table: `users`

**Created in Story**: 1.1
**Status**: active

#### Fields

| Field Name | Type | Constraints | Added in Story | Notes |
|------------|------|-------------|----------------|-------|
| `id` | uuid | primary key | 1.1 | |
| `email` | varchar(255) | unique, not null | 1.1 | |
| `password_hash` | varchar(255) | not null | 1.1 | |
| `created_at` | timestamp | default now() | 1.1 | |
| `last_login_at` | timestamp | nullable | 1.3 | ← ADDED IN THIS STORY |

#### Indexes

| Index Name | Fields | Type | Added in Story |
|------------|--------|------|----------------|
| `idx_users_email` | email | btree | 1.1 |
| `idx_users_last_login` | last_login_at | btree | 1.3 | ← ADDED |

---
```

**Migrations History Section**:
```markdown
## Database Migrations History

| Migration File | Story | Tables Affected | Type | Status |
|----------------|-------|-----------------|------|--------|
| `20250110_create_users_table.sql` | 1.1 | users | create | applied |
| `20250120_create_orders_table.sql` | 1.3 | orders | create | applied |
| `20250120_alter_users_add_last_login.sql` | 1.3 | users | alter | applied |
```

**Schema Evolution Timeline**:
```markdown
## Schema Evolution Timeline

#### Story 1.1: User Authentication

- **Tables Created**: users
- **Tables Modified**: -
- **Fields Added**: 4
- **Indexes Added**: 1
- **Migration File**: `20250110_create_users_table.sql`

#### Story 1.3: Order Management + User Login Tracking

- **Tables Created**: orders
- **Tables Modified**: users
- **Fields Added**: 6
- **Indexes Added**: 2
- **Migration File**: `20250120_create_orders_table.sql, 20250120_alter_users_add_last_login.sql`
```

---

### Step 6: Write Updated Registry to File

**File Path**: `{devDocLocation}/database-registry.md`

**Write Mode**: Overwrite (complete replacement)

**Backup**: Before overwriting, create backup:
- `{devDocLocation}/.backup/database-registry-{timestamp}.md`

**Atomic Write**:
1. Write to temporary file: `database-registry.tmp.md`
2. Verify file integrity (valid markdown, no truncation)
3. Rename temp file to `database-registry.md`
4. Delete temp file if rename successful

---

### Step 7: Validate Updated Registry

**Post-Update Checks**:
1. File exists and is readable
2. Metadata section present and valid
3. Tables count matches metadata
4. No duplicate table names
5. All story IDs are valid format

**If validation fails**:
- Restore from backup
- Log error: "❌ Registry update failed. Restored from backup."
- HALT and escalate to human

**If validation passes**:
- Log success: "✅ Database registry updated successfully."
- Delete backup file (keep only last 3 backups)

---

## Outputs

**Primary Output**: Updated `{devDocLocation}/database-registry.md` file

**Secondary Outputs**:
- Backup file (for rollback)
- Update log entry in Dev Agent Record

**Success Message**:
```
✅ Database Registry Updated

Story 1.3 changes merged into cumulative registry:
- Tables created: 1 (orders)
- Tables modified: 1 (users)
- Fields added: 6
- Indexes added: 2
- Migrations recorded: 2

Registry file: docs/dev/database-registry.md
Last updated: 2025-01-20 15:30:00
Total stories tracked: 8
Total tables: 5
Total fields: 42
```

---

## Error Handling

### Error: Missing database_changes field in Dev Agent Record

**Symptom**: `story.dev_agent_record.database_changes` is null/undefined

**Action**:
1. Check if story involves database work (keywords: "database", "table", "migration")
2. If YES: Log warning: "⚠️ Database work detected but database_changes field missing. Using legacy parsing."
   - Call `parse-legacy-dev-record.md` to extract from free-form text
3. If NO: Skip registry update (not all stories modify database)

### Error: Malformed database_changes structure

**Symptom**: Cannot parse tables_created/tables_modified

**Action**:
1. Log error: "❌ Malformed database_changes in story {story_id}"
2. Display problematic data for human review
3. Skip registry update (do not corrupt registry)
4. Flag story for manual registry update

### Error: Conflicting data (duplicate table in same story)

**Symptom**: Story attempts to create table that was already created in previous story

**Action**:
1. Log error: "❌ Conflict detected: Table '{table_name}' already exists (Story {existing_story})"
2. This should have been caught by `validate-against-cumulative-context.md`
3. Do not add duplicate entry to registry
4. Log warning in registry: "⚠️ Story {story_id} attempted to re-create '{table_name}' (already exists)"

---

## Backward Compatibility

**For Legacy Stories** (without structured database_changes field):

**Option 1: Skip**
- If story Dev Agent Record lacks `database_changes`, skip registry update
- Registry will only reflect stories with structured data

**Option 2: Auto-Parse** (recommended)
- Call `parse-legacy-dev-record.md` to extract database changes from free-form text
- Use LLM to parse Implementation Summary and File List
- Generate structured `database_changes` and update registry

**Option 3: Manual Initialization**
- Run `node tools/init-cumulative-registries.js` to bulk-parse all legacy stories
- One-time operation to bootstrap registries

---

## Usage Examples

### Example 1: Story 1.3 Creates 'orders' Table

**Dev Agent Record** (structured):
```yaml
database_changes:
  tables_created:
    - name: orders
      fields: [...]
  migrations:
    - filename: 20250120_create_orders_table.sql
```

**Update Process**:
```markdown
### Step 7: Update Cumulative Registries

Execute: utils/update-database-registry.md
Input: story = Story 1.3

Processing...
- Extracted 1 new table: orders (5 fields, 1 index, 1 FK)
- Extracted 1 migration: 20250120_create_orders_table.sql

Merging with existing registry...
- Previous tables: 4
- New total tables: 5
- Previous fields: 36
- New total fields: 41

Writing to: docs/dev/database-registry.md
✅ Registry updated successfully

Updated metadata:
- Last updated: 2025-01-20 15:30:00
- Total stories: 8
- Total tables: 5
- Total fields: 41
```

---

### Example 2: Story 1.5 Modifies 'users' Table

**Dev Agent Record**:
```yaml
database_changes:
  tables_modified:
    - name: users
      fields_added:
        - name: verified_at
          type: timestamp
```

**Update Process**:
```markdown
### Step 7: Update Cumulative Registries

Execute: utils/update-database-registry.md
Input: story = Story 1.5

Processing...
- No new tables created
- Modified table: users (added 1 field)

Merging with existing registry...
- Found existing table 'users' (created in Story 1.1)
- Appending field 'verified_at' with marker "Added in Story: 1.5"

✅ Registry updated successfully

'users' table now has 6 fields (5 from Story 1.1, 1 from Story 1.5)
```

---

## Performance Considerations

**Registry Size Growth**:
- Each story adds ~10-50 lines to registry
- For 100-story project: ~1000-5000 lines
- Markdown file size: typically <500 KB
- Load time: <1 second

**Optimization for Large Projects**:
- Consider pagination (split by epic or time period)
- Implement registry compression (archive old stories)
- Use database backend for very large projects (>500 stories)

---

## Related Tasks

- `load-cumulative-context.md` - Reads this registry
- `validate-against-cumulative-context.md` - Validates against this registry before update
- `update-api-registry.md` - Updates API registry (parallel process)
- `parse-legacy-dev-record.md` - Parses legacy format for backward compatibility

---

## Maintenance

**Registry Regeneration**:
```bash
# If registry becomes corrupted or out-of-sync
node tools/init-cumulative-registries.js --force

# Output: Rescans all Done stories and rebuilds registry from scratch
```

**Manual Edits** (discouraged but possible):
- Edit `database-registry.md` directly for corrections
- Use markdown editor to maintain table formatting
- Re-run validation after manual edits

**Backup Policy**:
- Keep last 3 backups in `.backup/` directory
- Automatic backup before each update
- Backups older than 7 days auto-deleted
