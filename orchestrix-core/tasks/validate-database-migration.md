# Validate Database Migration

## Purpose

Validate database migration scripts and execution status for schema changes detected in story implementation.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: Path to story file

optional:
  - mode: 'full' | 'verify_only'  # Default: 'full'
    # full: Dev mode - detect, validate, and can execute migrations
    # verify_only: QA mode - only verify migrations are already executed
```

## Process

### Step 1: Load Story Context

Read story file and extract:
- File List (implementation files)
- Database-related file patterns

### Step 2: Detect Schema Changes

**File Patterns to Check**:
```yaml
database_file_patterns:
  - "**/migrations/**"
  - "**/*.migration.*"
  - "**/*.entity.ts"
  - "**/*.model.ts"
  - "**/schema.prisma"
  - "**/schema.rb"
  - "**/structure.sql"
  - "**/*.sql"
```

**Change Indicators**:
- CREATE TABLE / ALTER TABLE / DROP TABLE
- ADD COLUMN / MODIFY COLUMN / DROP COLUMN
- ADD INDEX / DROP INDEX
- FOREIGN KEY / CONSTRAINT changes
- Entity/Model field modifications

**If no database files detected**:
- Return `validation_status: SKIP`
- Exit early

### Step 3: Validate Migration Scripts

**3.1 Check Migration File Existence**:
- Verify migrations/ directory contains files for detected changes
- Check file naming conventions (timestamped format)
- Ensure up/down migration pairs exist (if applicable)

**3.2 Validate Migration Script Content**:
- Parse migration files for syntax validity
- Verify migration covers all detected schema changes
- Check for destructive operations (DROP TABLE, DROP COLUMN)

**Issue Types**:
```yaml
missing_migration:
  type: CRITICAL
  description: "Schema changes detected but no migration file found"
  action_required: "Create migration script for: {changes}"

incomplete_migration:
  type: MAJOR
  description: "Migration does not cover all schema changes"
  action_required: "Update migration to include: {missing_changes}"

destructive_operation:
  type: WARNING
  description: "Migration contains destructive operation"
  action_required: "Verify data backup and rollback strategy"
```

### Step 4: Check Migration Execution Status

**Framework-Specific Commands**:
```yaml
prisma:
  status: "npx prisma migrate status"
  execute: "npx prisma migrate deploy"

typeorm:
  status: "npx typeorm migration:show"
  execute: "npx typeorm migration:run"

sequelize:
  status: "npx sequelize-cli db:migrate:status"
  execute: "npx sequelize-cli db:migrate"

rails:
  status: "rails db:migrate:status"
  execute: "rails db:migrate"

knex:
  status: "npx knex migrate:status"
  execute: "npx knex migrate:latest"
```

**Execution Status Check**:
- Query migration status table
- Identify pending migrations
- Check for failed migrations

**If mode = 'verify_only' (QA)**:
- Only report status, do not execute
- If pending migrations found, return FAIL

**If mode = 'full' (Dev)**:
- Report pending migrations
- Dev should execute before self-review

### Step 5: Schema Consistency Check

- Compare current database schema with expected state
- Validate migration results match entity/model definitions
- Check for schema drift

## Output

```yaml
migration_result:
  # Detection
  schema_changes_detected: true | false
  database_files_found: [{file_path}]

  # Migration Scripts
  migration_scripts_found: true | false
  migration_files: [{file_path, timestamp, status}]

  # Execution Status
  migrations_executed: true | false
  pending_migrations: [{name, timestamp}]
  failed_migrations: [{name, error}]

  # Validation Result
  validation_status: PASS | FAIL | SKIP

  # Issues (if any)
  issues:
    - type: CRITICAL | MAJOR | WARNING
      category: missing_migration | incomplete_migration | pending_execution | destructive_operation | schema_drift
      description: "..."
      action_required: "..."

  # Safety Assessment
  safety:
    destructive_operations: [{operation, table, column}]
    data_loss_risk: none | low | medium | high
    rollback_available: true | false
```

## Decision Logic

**PASS**:
- No schema changes detected (SKIP), OR
- All schema changes have corresponding migrations, AND
- All migrations have been executed, AND
- No critical issues found

**FAIL**:
- Schema changes detected but missing migrations, OR
- Pending migrations exist (in verify_only mode), OR
- Migration script errors, OR
- Schema drift detected

**SKIP**:
- No database-related files in story implementation

## Integration Points

**Called By**:
- `dev-self-review.md` (Step 3) - mode: full
- `qa-review-story.md` (Step 3.5) - mode: verify_only

**Returns**:
- Structured `migration_result` for caller to process
- Does not modify story status directly

## Key Principles

- **Detection before validation**: Only validate if schema changes detected
- **Mode-aware behavior**: Dev can execute, QA only verifies
- **Structured output**: Machine-readable results for integration
- **Safety-first**: Flag destructive operations explicitly
- **Framework-agnostic**: Support common migration frameworks
