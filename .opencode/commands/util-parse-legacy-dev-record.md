---
description: "Parse Legacy Dev Agent Record"
---

When this command is used, execute the following task:

# Parse Legacy Dev Agent Record

**Purpose**: Extract structured database/API/model changes from legacy (free-form text) Dev Agent Records using LLM-assisted parsing for backward compatibility.

**Usage**: Called when encountering stories without structured `database_changes`, `api_endpoints_created`, or `shared_models_created` fields.

**Approach**: Use LLM to intelligently parse free-form Implementation Summary and File List.

---

## Inputs

**Required**:

1. `story` - Story object with legacy Dev Agent Record format
2. `extraction_target` - What to extract: "database" | "api" | "models" | "all"

**From Legacy Dev Agent Record**:

```yaml
dev-agent-record:
  implementation-summary: |
    Created the orders management system with the following components:

    Database Changes:
    - Created 'orders' table with fields: id (uuid, PK), user_id (FK to users),
      total_amount (decimal), status (varchar), created_at (timestamp)
    - Added index on user_id for performance
    - Created foreign key constraint to users table
    - Migration file: 20250120_create_orders.sql

    API Endpoints:
    - POST /api/orders - Creates new order (auth required)
    - GET /api/orders/:id - Gets order by ID (auth required)
    - Request/response use OrderSchema for validation

    Models Created:
    - IOrder interface in src/types/order.ts
    - OrderSchema (Zod) in src/schemas/order.ts
    - OrderStatus enum with values: PENDING, CONFIRMED, SHIPPED, DELIVERED

  file-list:
    - src/api/orders/create.ts
    - src/api/orders/get.ts
    - src/types/order.ts
    - src/schemas/order.ts
    - src/models/order.ts
    - migrations/20250120_create_orders.sql
```

---

## Process

### Step 1: Determine Extraction Strategy

**Check for Structured Fields First**:

```javascript
if (story.dev_agent_record.database_changes) {
  return story.dev_agent_record.database_changes; // Already structured
}

// No structured data found → Use LLM parsing
use_llm_parsing = true;
```

---

### Step 2: Prepare Context for LLM

**Extraction Prompt Template**:

````markdown
You are a code analysis assistant. Your task is to extract structured database/API/model changes from a free-form Dev Agent Record.

## Story Information

- Story ID: {story.id}
- Story Title: {story.title}
- Story Type: {story.type} // Backend, Frontend, FullStack

## Dev Agent Record - Implementation Summary

{story.dev_agent_record.implementation_summary}

## Dev Agent Record - File List

{story.dev_agent_record.file_list}

---

## Extraction Task: {extraction_target}

{if extraction_target == "database" or "all"}

### Extract Database Changes

Identify all database-related changes and output in the following JSON structure:

```json
{
  "tables_created": [
    {
      "name": "table_name",
      "description": "brief description",
      "fields": [
        {
          "name": "field_name",
          "type": "data_type",
          "constraints": "constraints (e.g., not null, unique)",
          "references": "foreign_key_reference (if applicable)"
        }
      ],
      "indexes": [
        {
          "name": "index_name",
          "fields": "indexed_field(s)",
          "type": "btree | hash | gin | etc"
        }
      ],
      "foreign_keys": [
        {
          "name": "fk_name",
          "local_field": "local_field",
          "references": "table.field",
          "on_delete": "CASCADE | SET NULL | RESTRICT"
        }
      ]
    }
  ],
  "tables_modified": [
    {
      "name": "table_name",
      "fields_added": [...],
      "indexes_added": [...],
      "fields_removed": [...],
      "fields_modified": [...]
    }
  ],
  "migrations": [
    {
      "filename": "migration_file_name",
      "tables_affected": ["table1", "table2"],
      "type": "create | alter | drop",
      "status": "applied | pending"
    }
  ]
}
```
````

**Instructions**:

- If no database changes mentioned, return empty arrays
- Infer field types from context (e.g., "user ID" → uuid)
- Detect primary keys from keywords: "PK", "primary key", "id field"
- Detect foreign keys from keywords: "FK", "foreign key", "references"
- Extract migration filenames from file list or summary

{/if}

{if extraction_target == "api" or "all"}

### Extract API Endpoints

Identify all API endpoints created/modified and output:

```json
{
  "endpoints": [
    {
      "method": "GET | POST | PUT | PATCH | DELETE",
      "path": "/api/resource/path",
      "description": "brief description",
      "file_path": "src/api/path/to/file.ts",
      "auth_required": true | false,
      "auth_type": "JWT | API Key | OAuth | etc",
      "request_schema": "SchemaName (if mentioned)",
      "success_schema": "ResponseSchemaName (if mentioned)",
      "notes": "additional notes"
    }
  ],
  "schemas_created": [
    {
      "name": "SchemaName",
      "type": "Zod | TypeScript | JSON Schema",
      "file_path": "src/schemas/file.ts"
    }
  ]
}
```

**Instructions**:

- Extract HTTP method and path from phrases like "POST /api/users", "GET endpoint at /api/orders"
- Match endpoints to file paths from file list (e.g., src/api/orders/create.ts → POST /api/orders)
- Detect auth from keywords: "authenticated", "auth required", "JWT", "protected"
- Extract schema names from validation mentions

{/if}

{if extraction_target == "models" or "all"}

### Extract Models & Types

Identify all TypeScript interfaces, Zod schemas, enums, classes created:

```json
{
  "interfaces": [
    {
      "name": "IInterfaceName",
      "file_path": "src/types/file.ts",
      "category": "entity | dto | response | request"
    }
  ],
  "zod_schemas": [
    {
      "name": "SchemaName",
      "file_path": "src/schemas/file.ts",
      "inferred_type": "ITypeName (if mentioned)"
    }
  ],
  "enums": [
    {
      "name": "EnumName",
      "file_path": "src/types/file.ts",
      "values": ["VALUE1", "VALUE2"]
    }
  ],
  "classes": [
    {
      "name": "ClassName",
      "file_path": "src/models/file.ts",
      "category": "model | service | controller"
    }
  ]
}
```

**Instructions**:

- Match file paths from file list
- Detect interfaces from keywords: "interface", "ITypeName"
- Detect Zod schemas from keywords: "schema", "validation", "Zod"
- Extract enum values if mentioned (e.g., "OrderStatus: PENDING, CONFIRMED, SHIPPED")
- Categorize by file location (types/ → interface, schemas/ → zod, models/ → class)

{/if}

---

## Output Format

Return ONLY valid JSON. No markdown code blocks, no explanations.

If no relevant information found for a category, return empty array.

````

---

### Step 3: Call LLM for Parsing

**LLM Configuration**:
- Model: claude-sonnet-4-5 (or haiku for speed)
- Temperature: 0 (deterministic output)
- Max tokens: 4000

**Error Handling**:
- If LLM returns invalid JSON, retry once
- If still fails, return empty structure with warning flag
- Log parsing failure for human review

**Example LLM Call**:
```javascript
const response = await llm.complete({
  model: "claude-sonnet-4-5",
  temperature: 0,
  max_tokens: 4000,
  messages: [{
    role: "user",
    content: extraction_prompt
  }]
})

parsed_data = JSON.parse(response.content)
````

---

### Step 4: Validate Parsed Output

**Validation Checks**:

1. **JSON Structure Validity**:
   - Contains expected top-level keys
   - Arrays are properly formatted
   - Required fields present

2. **Data Integrity**:
   - Table names are non-empty strings
   - Field names and types are present
   - Endpoint paths start with `/`
   - HTTP methods are valid (GET, POST, etc.)

3. **Cross-Reference with File List**:
   - Verify mentioned files exist in story's file list
   - Warn if LLM hallucinated file paths

**Validation Example**:

```javascript
function validate_parsed_database(data) {
  for (table of data.tables_created) {
    if (!table.name || typeof table.name !== "string") {
      throw new Error("Invalid table name");
    }
    if (!table.fields || !Array.isArray(table.fields)) {
      throw new Error("Table must have fields array");
    }
    for (field of table.fields) {
      if (!field.name || !field.type) {
        throw new Error("Field missing name or type");
      }
    }
  }
  return true;
}
```

---

### Step 5: Enrich Parsed Data with Story Metadata

Add story-specific metadata to parsed structure:

```javascript
enriched_data = {
  ...parsed_data,
  _metadata: {
    story_id: story.id,
    story_title: story.title,
    parsing_method: "llm_legacy_parse",
    parsed_at: current_timestamp(),
    confidence: estimate_confidence(), // High | Medium | Low
    warnings: [],
  },
};

// For database changes
if (enriched_data.tables_created) {
  for (table of enriched_data.tables_created) {
    for (field of table.fields) {
      field.added_in_story = story.id; // Tag each field with story ID
    }
  }
}

// For API endpoints
if (enriched_data.endpoints) {
  for (endpoint of enriched_data.endpoints) {
    endpoint.story_id = story.id;
    endpoint.status = "active";
  }
}
```

---

### Step 6: Output Structured Data

**Return Format**:

```javascript
{
  success: true,
  extraction_target: "database | api | models | all",
  confidence: "high | medium | low",
  data: {
    database_changes: {...},  // if database extracted
    api_endpoints_created: {...},  // if API extracted
    shared_models_created: {...}  // if models extracted
  },
  warnings: [
    "Could not determine type for field 'metadata' in table 'orders'",
    "File 'src/api/orders/list.ts' mentioned but not in file list"
  ],
  parsing_metadata: {
    llm_model: "claude-sonnet-4-5",
    tokens_used: 1234,
    parsing_time_ms: 856
  }
}
```

---

## Confidence Estimation

**High Confidence** (90-100%):

- Clear, structured mentions of tables/endpoints/models
- File paths match file list exactly
- Detailed descriptions with types and constraints
- No ambiguities or conflicts

**Medium Confidence** (60-89%):

- Some missing details (e.g., field types inferred)
- Minor mismatches between summary and file list
- Some vague descriptions

**Low Confidence** (0-59%):

- Minimal information in summary
- Significant mismatches
- LLM had to make many assumptions
- Recommend human review

---

## Outputs

### Success Output

```markdown
✅ Legacy Dev Agent Record Parsed Successfully

Story: 1.3 - Implement Order Management
Extraction Target: all
Confidence: High (92%)

Extracted Data:

- Database: 1 table created (orders), 5 fields, 1 index, 1 FK
- API: 2 endpoints created (POST /api/orders, GET /api/orders/:id)
- Models: 3 items (IOrder interface, OrderSchema, OrderStatus enum)

Structured data ready for registry update.
```

### Failure Output

```markdown
❌ Legacy Dev Agent Record Parsing Failed

Story: 2.5 - Refactor User Module
Extraction Target: database
Confidence: Low (45%)

Issues:

- Implementation summary lacks database details
- Could not extract table structure
- File list contains migration file but no details in summary

⚠️ Recommendation: Manual review required.

Partial data extracted:

- Migration file detected: 20250125_refactor_users.sql
- Tables possibly affected: users
```

---

## Error Handling

### Error: LLM Returns Invalid JSON

**Action**:

1. Retry with more explicit JSON format instructions
2. If fails again, return empty structure
3. Log error for human review
4. Set confidence to "low"

### Error: Parsed Data Conflicts with File List

**Example**: LLM extracts `src/api/orders/create.ts` but file not in file list

**Action**:

1. Add warning to output
2. Reduce confidence score
3. Include in registry with warning flag
4. Recommend human verification

### Error: Ambiguous or Incomplete Information

**Example**: "Added some fields to users table" (no details)

**Action**:

1. Return partial data with warning
2. Set confidence to "low"
3. Flag story for manual review
4. Include in registry with note: "⚠️ Incomplete data from Story 1.5"

---

## Performance Considerations

**Caching**:

- Cache parsed results to avoid re-parsing same story
- Cache key: `story_id + extraction_target`
- Cache expiry: Never (immutable historical data)

**Batch Processing**:

- For initialization script, batch multiple stories in single LLM call
- Max 5 stories per batch to stay within token limits

**Cost Optimization**:

- Use haiku model for simple stories
- Use sonnet only for complex stories (>1000 tokens in summary)

**Typical Performance**:

- Simple story: ~500ms (haiku)
- Complex story: ~1.5s (sonnet)
- Batch of 5 stories: ~3s

---

## Usage Examples

### Example 1: Parse Database Changes from Legacy Story

**Input**:

```yaml
story_id: 1.3
implementation_summary: |
  Created orders table with id, user_id (FK), total, status, created_at.
  Migration: 20250120_create_orders.sql
```

**Execute**:

```markdown
Execute: utils/parse-legacy-dev-record.md
Input: story = Story 1.3, extraction_target = "database"

Calling LLM for parsing...
✅ Parsing successful (confidence: 85%)

Extracted:

- 1 table: orders
- 5 fields detected
- 1 FK reference: user_id → users.id
- 1 migration file: 20250120_create_orders.sql

Structured data:
{
"tables_created": [{
"name": "orders",
"fields": [
{"name": "id", "type": "uuid", "constraints": "primary key"},
{"name": "user_id", "type": "uuid", "references": "users.id"},
{"name": "total", "type": "decimal"},
{"name": "status", "type": "varchar"},
{"name": "created_at", "type": "timestamp"}
]
}],
"migrations": [{
"filename": "20250120_create_orders.sql",
"tables_affected": ["orders"],
"type": "create",
"status": "applied"
}]
}
```

---

### Example 2: Parse API Endpoints from Legacy Story

**Input**:

```yaml
story_id: 1.4
implementation_summary: |
  Implemented order list endpoint: GET /api/orders
  Added pagination and filtering. Auth required.
file_list:
  - src/api/orders/list.ts
```

**Execute**:

```markdown
Execute: utils/parse-legacy-dev-record.md
Input: story = Story 1.4, extraction_target = "api"

Calling LLM for parsing...
✅ Parsing successful (confidence: 78%)

Extracted:

- 1 endpoint: GET /api/orders
- Auth: JWT (inferred from "auth required")
- File: src/api/orders/list.ts (verified in file list)

Structured data:
{
"endpoints": [{
"method": "GET",
"path": "/api/orders",
"description": "List orders with pagination and filtering",
"file_path": "src/api/orders/list.ts",
"auth_required": true,
"auth_type": "JWT",
"notes": "Supports pagination and filtering"
}]
}
```

---

## Integration with Registry Updates

**Automatic Integration**:

```markdown
### In update-database-registry.md Step 2

if (!story.dev_agent_record.database_changes) {
// No structured data → Use legacy parser
parsed = execute("parse-legacy-dev-record.md", {
story: story,
extraction_target: "database"
})

if (parsed.success && parsed.confidence != "low") {
// Use parsed data for registry update
database_changes = parsed.data.database_changes
} else {
// Skip or flag for manual review
log_warning("Story {story.id} needs manual registry update")
}
}
```

---

## Related Tasks

- `update-database-registry.md` - Uses this for backward compat
- `update-api-registry.md` - Uses this for backward compat
- `load-cumulative-context.md` - Benefits from parsed legacy data

---

## Maintenance

**Improving Parsing Accuracy**:

1. Collect failed parses for analysis
2. Update LLM prompt based on common patterns
3. Add more example patterns to prompt
4. Consider fine-tuning for domain-specific parsing

**Manual Corrections**:

- If LLM parse is incorrect, manually edit registry
- Add note in registry: "⚠️ Manually corrected from Story 1.5"
- Optionally update story Dev Agent Record with structured fields
