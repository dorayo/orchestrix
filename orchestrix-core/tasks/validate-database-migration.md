# Validate Database Migration

## Input

```yaml
story_id: required
story_path: required
mode: full | verify_only  # Default: full
```

**Mode Behavior**:
- `full` (Dev): Validate scripts exist + check execution status
- `verify_only` (QA): Only verify migrations are already executed

## Process

### Step 1: Detect Schema Changes

Read story file → Extract File List.

Check for database-related files:

```yaml
patterns:
  - "**/migrations/**"
  - "**/*.entity.ts"
  - "**/*.model.ts"
  - "**/schema.prisma"
  - "**/schema.rb"
  - "**/*.sql"
```

**If no matches**: Return `{ status: SKIP }`

### Step 2: Detect Framework

Same as `dev-database-migration.md` Step 1.

**If no framework detected**: Return `{ status: SKIP }`

### Step 3: Validate Migration Scripts

**3.1 Check migration files exist**:
- Glob: `**/migrations/**`
- Verify timestamped naming convention

**3.2 Check for destructive operations** (flag only):
```
DROP TABLE | DROP COLUMN | TRUNCATE | DELETE FROM
```

Store in `destructive_operations[]`.

### Step 4: Check Execution Status

Run framework-specific status command:

| Framework | Status Command |
|-----------|---------------|
| Prisma | `npx prisma migrate status` |
| Drizzle | `npx drizzle-kit check` |
| TypeORM | `npx typeorm migration:show` |
| Sequelize | `npx sequelize-cli db:migrate:status` |
| Knex | `npx knex migrate:status` |
| Supabase | `supabase migration list` |
| Rails | `rails db:migrate:status` |
| Django | `python manage.py showmigrations --plan` |
| Alembic | `alembic current` |
| Flyway | `flyway info` |
| Liquibase | `liquibase status` |
| Goose | `goose status` |
| golang-migrate | `migrate version` |

Parse output → Identify `pending_migrations[]`.

## Decision Logic

```yaml
# Mode: verify_only (QA)
IF mode == verify_only:
  IF pending_migrations.length > 0:
    RETURN { status: FAIL, reason: "Pending migrations found" }
  ELSE:
    RETURN { status: PASS }

# Mode: full (Dev)
IF mode == full:
  IF no_migration_scripts AND schema_changes_detected:
    RETURN { status: FAIL, reason: "Missing migration scripts" }
  IF pending_migrations.length > 0:
    RETURN { status: WARN, pending: pending_migrations }
  ELSE:
    RETURN { status: PASS }
```

## Output

```yaml
migration_result:
  status: PASS | FAIL | WARN | SKIP
  schema_changes_detected: true | false
  migration_scripts_found: true | false
  pending_migrations: ["{name}"]
  destructive_operations: ["{operation}"]
  reason: "{message}" | null
```

## Integration

| Caller | Mode | On FAIL |
|--------|------|---------|
| `dev-self-review.md` | full | Block self-review |
| `qa-review-story.md` | verify_only | Fail QA gate |
