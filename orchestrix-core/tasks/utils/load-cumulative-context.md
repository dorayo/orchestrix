# Load Cumulative Context

**Purpose**: Load all cumulative registries (database, API, models) to provide complete context of accumulated changes across all completed stories.

**Usage**: Called by SM Agent (during story creation) and Dev Agent (during story implementation) to understand what resources have already been created in previous stories.

---

## Inputs

**From Environment**:
- `CONFIG_PATH.devDocLocation` - Location of dev documentation
- `CONFIG_PATH.project.mode` - Project mode (monolith | multi-repo)
- `CONFIG_PATH.project.multi_repo.repository_id` - Current repository ID (for multi-repo)

**Registry File Locations**:
```
{devDocLocation}/
├── database-registry.md  # Database cumulative registry
├── api-registry.md       # API cumulative registry
└── models-registry.md    # Models cumulative registry
```

---

## Process

### Step 1: Check if Registries Exist

Check for the existence of cumulative registry files:

```bash
ls {devDocLocation}/database-registry.md
ls {devDocLocation}/api-registry.md
ls {devDocLocation}/models-registry.md
```

**If registries do NOT exist**:
- This is the first story in the project OR registries need initialization
- Create placeholder registries with empty content
- Log warning: "⚠️ Cumulative registries not found. This may be the first story. Empty registries created."
- Continue execution (do not halt)

**If registries exist**:
- Proceed to Step 2

---

### Step 2: Load Database Registry

Read `{devDocLocation}/database-registry.md` and extract:

**Key Information to Extract**:

1. **Tables Registry** (from "Database Tables Registry" section):
   - Table name
   - Created in story (e.g., "Story 1.1")
   - Status (active, deprecated, etc.)
   - Fields list with:
     - Field name
     - Field type
     - Constraints
     - Added in story

2. **Naming Conventions** (from "Naming Conventions & Patterns" section):
   - Table naming pattern (e.g., snake_case, plural)
   - Field naming pattern (e.g., snake_case)
   - Primary key pattern (e.g., id, {table}_id)
   - Foreign key pattern
   - Timestamp fields pattern (e.g., created_at, updated_at)

3. **Schema Evolution Timeline** (from "Schema Evolution Timeline" section):
   - Story-by-story changes summary
   - Total tables count
   - Total fields count

**Store as**:
```
database_context = {
  tables: [
    {
      name: "users",
      created_in_story: "1.1",
      status: "active",
      fields: [
        {name: "id", type: "uuid", constraints: "primary key", added_in_story: "1.1"},
        {name: "email", type: "varchar(255)", constraints: "unique, not null", added_in_story: "1.1"},
        {name: "email_verified", type: "boolean", constraints: "default false", added_in_story: "1.3"}
      ]
    }
  ],
  naming_conventions: {
    table_naming: "snake_case, plural",
    field_naming: "snake_case",
    primary_key_pattern: "id (uuid)",
    foreign_key_pattern: "{table}_id"
  },
  total_tables: 5,
  total_fields: 42
}
```

---

### Step 3: Load API Registry

Read `{devDocLocation}/api-registry.md` and extract:

**Key Information to Extract**:

1. **Endpoints Registry** (from "API Endpoints Registry" section):
   - HTTP method (GET, POST, PUT, PATCH, DELETE)
   - Path (e.g., /api/users/:id)
   - Added in story
   - Implementation file path
   - Request/response schemas
   - Authentication requirement

2. **API Patterns** (from "API Design Patterns" section):
   - URL naming convention (e.g., RESTful, kebab-case)
   - Resource naming pattern
   - HTTP method usage statistics
   - Authentication patterns
   - Versioning strategy

3. **Schemas Registry** (from "Request/Response Schemas" section):
   - Schema name
   - Type (Zod, TypeScript, etc.)
   - Added in story
   - File path
   - Used by endpoints count

**Store as**:
```
api_context = {
  endpoints: [
    {
      method: "POST",
      path: "/api/auth/login",
      story: "1.2",
      file: "src/api/auth/login.ts",
      request_schema: "LoginRequest",
      response_schema: "LoginResponse",
      auth_required: false
    },
    {
      method: "GET",
      path: "/api/users/:id",
      story: "1.4",
      file: "src/api/users/get.ts",
      auth_required: true
    }
  ],
  patterns: {
    url_naming: "RESTful, kebab-case",
    resource_naming: "plural nouns",
    versioning: "none (or /v1/ prefix)"
  },
  schemas: [
    {name: "LoginRequest", type: "Zod", story: "1.2", file: "src/schemas/auth.ts"},
    {name: "UserResponse", type: "Zod", story: "1.4", file: "src/schemas/user.ts"}
  ],
  total_endpoints: 12
}
```

---

### Step 4: Load Models Registry

Read `{devDocLocation}/models-registry.md` and extract:

**Key Information to Extract**:

1. **TypeScript Interfaces** (from "TypeScript Interfaces" section):
   - Interface name
   - Added in story
   - File path
   - Properties list
   - Extends/implements relationships

2. **Zod Schemas** (from "Zod Validation Schemas" section):
   - Schema name
   - Added in story
   - File path
   - Inferred type

3. **Enums** (from "Enums & Constants" section):
   - Enum name
   - Added in story
   - Values list

4. **Naming Patterns** (from "Naming Patterns & Conventions" section):
   - Interface naming convention (e.g., IUser, User)
   - Type naming convention
   - Enum naming convention (e.g., UserRole)
   - DTO naming convention (e.g., CreateUserDto)
   - Schema naming convention (e.g., userSchema)

**Store as**:
```
models_context = {
  interfaces: [
    {
      name: "IUser",
      story: "1.1",
      file: "src/types/user.ts",
      properties: ["id", "email", "createdAt"],
      used_by_stories: ["1.1", "1.4", "2.2"]
    }
  ],
  zod_schemas: [
    {
      name: "UserSchema",
      story: "1.1",
      file: "src/models/user.ts",
      inferred_type: "IUser"
    }
  ],
  enums: [
    {
      name: "UserRole",
      story: "1.2",
      values: ["USER", "ADMIN", "MODERATOR"]
    }
  ],
  naming_conventions: {
    interface_naming: "PascalCase with 'I' prefix",
    type_naming: "PascalCase",
    enum_naming: "PascalCase",
    dto_naming: "PascalCase with 'Dto' suffix",
    schema_naming: "camelCase with 'Schema' suffix"
  },
  total_models: 18
}
```

---

### Step 5: Consolidate Cumulative Context

Combine all loaded contexts into a single cumulative_context object:

```
cumulative_context = {
  metadata: {
    loaded_at: "{current timestamp}",
    project_mode: "{mode}",
    repository_id: "{repository_id}",
    registries_found: {
      database: true/false,
      api: true/false,
      models: true/false
    }
  },
  database: {database_context},
  api: {api_context},
  models: {models_context},
  summary: {
    total_stories_tracked: {unique story count from all registries},
    total_tables: {database_context.total_tables},
    total_endpoints: {api_context.total_endpoints},
    total_models: {models_context.total_models}
  }
}
```

---

### Step 6: Validate Registry Consistency

**Cross-Registry Validation**:

1. **Database-Models Alignment**:
   - Check if database tables have corresponding TypeScript interfaces
   - Warn if orphaned tables exist (table without interface)

2. **API-Schemas Alignment**:
   - Check if API endpoints reference existing schemas
   - Warn if endpoints lack validation schemas

3. **Story ID Consistency**:
   - Verify story IDs are consistent across all registries
   - Check for story ID format (e.g., "1.1", "2.3")

**Output Validation Summary**:
```
✅ Database registry loaded: {total_tables} tables, {total_fields} fields
✅ API registry loaded: {total_endpoints} endpoints, {total_schemas} schemas
✅ Models registry loaded: {total_models} models/types

⚠️ Warnings (if any):
- 3 database tables without corresponding interfaces
- 2 API endpoints without validation schemas
```

---

## Outputs

**Primary Output**: `cumulative_context` object (structured as in Step 5)

**Accessible by**:
- SM Agent: Use in story creation workflow (Step 6 - Dev Notes population)
- Dev Agent: Use in implementation workflow (Step 1 - Context loading)
- Architect Agent: Use in technical review workflow

---

## Error Handling

### Error: Registry file corrupted or malformed

**Symptom**: Cannot parse registry markdown structure

**Action**:
1. Log error: "❌ Failed to parse {registry_name}. File may be corrupted."
2. Attempt to load other registries
3. If critical failure (all registries unreadable), HALT and escalate to human

### Error: Story ID inconsistencies detected

**Symptom**: Same story ID has conflicting information across registries

**Action**:
1. Log warning: "⚠️ Story {story_id} has inconsistent data across registries"
2. Display conflicting data for human review
3. Continue execution with warning flag

### Error: Missing expected sections in registry

**Symptom**: Registry file exists but lacks key sections (e.g., "Database Tables Registry")

**Action**:
1. Log warning: "⚠️ {registry_name} missing expected section: {section_name}"
2. Continue with partial data
3. Flag registry for regeneration

---

## Performance Considerations

**Registry File Size**: Registries can grow large in long-running projects.

**Optimization**:
- Only extract essential metadata, not full content
- Cache loaded contexts within same agent session
- Consider pagination for very large registries (>1000 entries)

**Typical Load Time**: < 2 seconds for projects with <100 stories

---

## Usage Examples

### Example 1: SM Agent loads context before creating Story 2.5

```markdown
### Step 4.5: Load Cumulative Context

Execute: utils/load-cumulative-context.md

Result:
✅ Database registry loaded: 8 tables, 67 fields
✅ API registry loaded: 24 endpoints, 15 schemas
✅ Models registry loaded: 32 models/types

Cumulative context stored for use in Dev Notes (Step 6).
```

### Example 2: Dev Agent loads context before implementing Story 1.7

```markdown
### Step 1: Load Context

Execute: utils/load-cumulative-context.md

Result:
✅ Database registry loaded: 5 tables, 42 fields
✅ API registry loaded: 12 endpoints, 8 schemas
✅ Models registry loaded: 18 models/types

⚠️ Warning: 2 database tables without corresponding interfaces
- Table: notifications (created in Story 1.6)
- Table: sessions (created in Story 1.5)

Cumulative context available for conflict validation (Step 2.5).
```

---

## Related Tasks

- `update-database-registry.md` - Updates database registry after story completion
- `update-api-registry.md` - Updates API registry after story completion
- `validate-against-cumulative-context.md` - Validates story against loaded context
- `parse-legacy-dev-record.md` - Parses old format stories to extract structured data

---

## Maintenance

**When to regenerate registries**:
- After major refactoring
- If registries become corrupted
- If manual updates were made to story files

**Regeneration command**: `node tools/init-cumulative-registries.js`
