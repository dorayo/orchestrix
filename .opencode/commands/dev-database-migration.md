---
description: "Execute Database Migration"
---

When this command is used, execute the following task:

# Execute Database Migration

## Input

```yaml
story_id: required
story_path: required
```

## Process

### Step 1: Detect Migration Framework

Glob project root for framework indicators (check in order):

| Framework      | Indicator File                       |
| -------------- | ------------------------------------ |
| Prisma         | `**/schema.prisma`                   |
| Drizzle        | `drizzle.config.*`                   |
| TypeORM        | `ormconfig.*`, `**/data-source.ts`   |
| Sequelize      | `.sequelizerc`, `config/config.json` |
| Knex           | `knexfile.*`                         |
| Supabase       | `supabase/config.toml`               |
| Rails          | `db/migrate/`                        |
| Django         | `manage.py` + `**/migrations/`       |
| Alembic        | `alembic.ini`                        |
| Flyway         | `flyway.conf`, `sql/`                |
| Liquibase      | `liquibase.properties`               |
| Goose          | `**/migrations/*.sql` + Go project   |
| golang-migrate | `migrations/*.up.sql`                |

**If no framework detected**:

1. Check `package.json` scripts for migration commands
2. Check for generic `migrations/` directory with `.sql` files
3. If still unknown → Return `{ status: SKIP, reason: "No migration framework found" }`

### Step 2: Check Pending Migrations

Run framework-specific status command:

| Framework      | Status Command                           |
| -------------- | ---------------------------------------- |
| Prisma         | `npx prisma migrate status`              |
| Drizzle        | `npx drizzle-kit check`                  |
| TypeORM        | `npx typeorm migration:show`             |
| Sequelize      | `npx sequelize-cli db:migrate:status`    |
| Knex           | `npx knex migrate:status`                |
| Supabase       | `supabase migration list`                |
| Rails          | `rails db:migrate:status`                |
| Django         | `python manage.py showmigrations --plan` |
| Alembic        | `alembic current`                        |
| Flyway         | `flyway info`                            |
| Liquibase      | `liquibase status`                       |
| Goose          | `goose status`                           |
| golang-migrate | `migrate version`                        |

Parse output:

- **No pending migrations** → Return `{ status: SKIP, reason: "All migrations applied" }`
- **Pending migrations found** → Continue to Step 3
- **Command failed** → Return `{ status: FAIL, error: "{error_message}" }`

### Step 3: Execute Migrations

Run framework-specific execute command:

| Framework      | Execute Command                |
| -------------- | ------------------------------ |
| Prisma         | `npx prisma migrate deploy`    |
| Drizzle        | `npx drizzle-kit push`         |
| TypeORM        | `npx typeorm migration:run`    |
| Sequelize      | `npx sequelize-cli db:migrate` |
| Knex           | `npx knex migrate:latest`      |
| Supabase       | `supabase db push`             |
| Rails          | `rails db:migrate`             |
| Django         | `python manage.py migrate`     |
| Alembic        | `alembic upgrade head`         |
| Flyway         | `flyway migrate`               |
| Liquibase      | `liquibase update`             |
| Goose          | `goose up`                     |
| golang-migrate | `migrate up`                   |

Capture output and exit code.

### Step 4: Verify Execution

Re-run status command from Step 2.

**Decision**:

- No pending migrations → `status: PASS`
- Still pending → `status: FAIL`

## Output

```yaml
migration_result:
  status: PASS | FAIL | SKIP
  framework: "{detected_framework}" | null
  migrations_applied: ["{migration_name}"]
  error: "{error_message}" | null
```

## Fallback: Unknown Framework

If framework detected but not in table above:

1. Read `package.json` → find `scripts` containing `migrate`
2. Read `README.md` or `CONTRIBUTING.md` → search for migration instructions
3. If found custom command → execute it
4. If not found → **HALT** with message: "Unknown migration framework. Manual execution required."

## HALT Conditions

- Migration execution command returns non-zero exit code
- Pending migrations remain after execution
- Database connection failure
- Unknown framework without discoverable migration command
