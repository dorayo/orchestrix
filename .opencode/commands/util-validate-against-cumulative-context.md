---
description: "Validate Against Cumulative Context"
---

When this command is used, execute the following task:

# Validate Against Cumulative Context

**Purpose**: Strict validation of current story's planned changes against cumulative context to detect conflicts and prevent duplicate resource creation.

**Validation Mode**: **STRICT (HALT on critical conflicts)**

**Usage**: Called by Dev Agent in Step 2.5 (before implementation) to ensure no conflicts with previous stories.

---

## Inputs

**Required**:

1. `story` - Current story object with planned changes from Dev Notes
2. `cumulative_context` - Loaded from `load-cumulative-context.md`

**From Story Dev Notes**:

- Planned database tables/fields
- Planned API endpoints
- Planned models/types/schemas

---

## Validation Rules

### Rule Category 1: Database Conflicts (HALT Level)

#### Rule 1.1: No Duplicate Table Names

**Severity**: HALT
**Check**: Verify planned table name does not exist in `cumulative_context.database.tables`

**Example Conflict**:

```
❌ HALT: Table 'users' already exists!
   - Created in: Story 1.1
   - Current story: 2.3
   - Planned action: Create table 'users'

🛑 ACTION REQUIRED: This is a critical conflict. Story 2.3 cannot create a table that already exists.

📋 RESOLUTION OPTIONS:
1. If you need to modify 'users' table, change Dev Notes to "ALTER table 'users'"
2. If this is a different table, rename to avoid conflict (e.g., 'user_profiles')
3. Escalate to SM/Architect if this indicates a story design flaw

🚨 HALTING IMPLEMENTATION. Please resolve conflict before proceeding.
```

#### Rule 1.2: No Duplicate Field Names Within Same Table

**Severity**: HALT
**Check**: If altering existing table, verify new field doesn't already exist

**Example Conflict**:

```
❌ HALT: Field 'users.email' already exists!
   - Added in: Story 1.1
   - Type: varchar(255), constraints: unique, not null
   - Current story: 1.5
   - Planned action: Add field 'email' to 'users'

🛑 ACTION REQUIRED: Field already exists with the following definition:
   - Type: varchar(255)
   - Constraints: unique, not null

📋 RESOLUTION OPTIONS:
1. Remove this field from Dev Notes (it's already implemented)
2. If you need different constraints, document why and escalate to Architect
3. If this is a mistake in Dev Notes, update story and re-submit for review

🚨 HALTING IMPLEMENTATION. Please resolve conflict before proceeding.
```

#### Rule 1.3: Foreign Key References Must Exist

**Severity**: HALT
**Check**: If adding foreign key, verify referenced table exists

**Example Conflict**:

```
❌ HALT: Foreign key references non-existent table!
   - Field: orders.user_id
   - References: users.id
   - Problem: Table 'users' not found in cumulative context

🛑 ACTION REQUIRED: Cannot create foreign key to non-existent table.

📋 RESOLUTION OPTIONS:
1. Ensure 'users' table is created BEFORE this story (check story order)
2. If 'users' table should exist, regenerate cumulative registries
3. If 'users' table is created in THIS story, reorder operations in Dev Notes

🚨 HALTING IMPLEMENTATION. Please resolve conflict before proceeding.
```

---

### Rule Category 2: API Endpoint Conflicts (HALT Level)

#### Rule 2.1: No Exact Duplicate Endpoints

**Severity**: HALT
**Check**: Verify `{method} {path}` combination doesn't exist in `cumulative_context.api.endpoints`

**Example Conflict**:

```
❌ HALT: Endpoint 'POST /api/auth/login' already exists!
   - Implemented in: Story 1.2
   - File: src/api/auth/login.ts
   - Current story: 2.1
   - Planned action: Create 'POST /api/auth/login'

🛑 ACTION REQUIRED: This exact endpoint (method + path) already exists.

📋 RESOLUTION OPTIONS:
1. Remove this endpoint from Dev Notes (it's already implemented)
2. If you need to MODIFY the endpoint, update Dev Notes to "Update POST /api/auth/login"
3. If this is a different version, use versioning: 'POST /api/v2/auth/login'

🚨 HALTING IMPLEMENTATION. Please resolve conflict before proceeding.
```

#### Rule 2.2: Similar Endpoint Warning

**Severity**: WARN (does not halt, but requires justification)
**Check**: Detect similar endpoints with different naming (fuzzy match)

**Example Warning**:

```
⚠️ WARNING: Similar endpoint detected!
   - Existing: POST /api/users/register (Story 1.2)
   - Planned: POST /api/auth/signup (Story 2.1)

🔍 These endpoints may serve the same purpose with different naming.

📋 RECOMMENDED ACTIONS:
1. Review if 'signup' and 'register' are truly different operations
2. If same operation, reuse existing endpoint: POST /api/users/register
3. If different, document WHY in Dev Log (e.g., "signup is for OAuth, register is for email/password")

✅ You may proceed, but please address this in Dev Log.
```

---

### Rule Category 3: Model/Type Conflicts (HALT + WARN)

#### Rule 3.1: No Duplicate Model Names

**Severity**: HALT
**Check**: Verify model/type/interface name doesn't exist in `cumulative_context.models`

**Example Conflict**:

```
❌ HALT: Interface 'IUser' already exists!
   - Defined in: Story 1.1
   - File: src/types/user.ts
   - Current story: 2.3
   - Planned action: Create interface 'IUser'

🛑 ACTION REQUIRED: This type already exists in the codebase.

📋 RESOLUTION OPTIONS:
1. Remove from Dev Notes - reuse existing 'IUser' from src/types/user.ts
2. If you need to EXTEND it, update Dev Notes to "Extend interface IUser"
3. If this is a different type, rename (e.g., 'IUserProfile', 'IAdminUser')

🚨 HALTING IMPLEMENTATION. Please resolve conflict before proceeding.
```

#### Rule 3.2: Similar Model Detection

**Severity**: WARN
**Check**: Detect models with similar names or similar properties

**Example Warning**:

```
⚠️ WARNING: Similar model detected!
   - Existing: UserDto (Story 1.4) - Properties: id, email, name
   - Planned: UserResponse (Story 2.1) - Properties: id, email, username

🔍 These models have 80% property overlap. Consider reusing or extending.

📋 RECOMMENDED ACTIONS:
1. Review if UserResponse can reuse UserDto
2. If UserResponse needs to extend UserDto: "interface UserResponse extends UserDto"
3. If truly different, document distinction in Dev Log

✅ You may proceed, but consider model reuse for consistency.
```

---

### Rule Category 4: Data Synchronization Risks (WARN Level with Required Acknowledgment)

**Purpose**: Based on cumulative context, detect if current Story's write operations may need synchronization with other tables.

#### Rule 4.1: Related Status/Expiry Fields Detection

**Severity**: WARN (but requires explicit acknowledgment in Data Sync Requirements section)

**Check Logic**:

1. Extract write operations from current Story's Dev Notes
2. In `cumulative_context.database.tables` search for:
   - Other tables sharing the same entity (user_id, entity_id, etc.)
   - Status/expiry/sync type fields in those tables
3. If potential relationships found, emit warning

**LLM Reasoning Execution**:

```
FOR each write_operation in current_story.db_writes:
  table = write_operation.table
  fields = write_operation.fields

  IF fields contains status/expires/sync type field:
    related_tables = find_tables_with_same_entity_id(table, cumulative_context)

    FOR each related_table:
      related_fields = find_status_expires_sync_fields(related_table)

      IF related_fields is not empty:
        EMIT WARNING with:
          - source: {table}.{field}
          - related: {related_table}.{related_field}
          - reasoning: "Both tables share {entity_id} and have status/expires fields"
          - required_action: "Verify if sync is needed in Data Sync Requirements"
```

**Example Warning**:

```
⚠️ DATA SYNC WARNING: Potential synchronization required!

Current Story updates: subscriptions.current_period_end (UPDATE)
Related field detected: license_keys.expires_at

🔍 Detection reason:
   - Both tables share 'user_id' as entity identifier
   - 'current_period_end' is an expiration-type field
   - 'expires_at' is an expiration-type field in related table

📋 REQUIRED ACTION:
   Verify in Story's "Data Synchronization Requirements" section:
   1. Is this relationship already analyzed?
   2. Is sync needed? If YES, is it covered by an AC?
   3. If sync not needed, is the reason documented?

✅ This warning can be dismissed if properly addressed in Data Sync Requirements.
```

**Field Type Detection Patterns**:

- **Status fields**: status, state, is_active, enabled, verified, is_valid
- **Expiry fields**: expires_at, valid_until, period_end, expiry_date, expire_time
- **Sync fields**: synced_at, last_updated, updated_at, last_synced

**Related Table Detection**:

- Tables sharing user_id, account_id, customer_id, organization_id
- Tables with foreign key relationships to same parent
- Tables in same business domain (subscription/license, payment/order, user/profile)

**Warning Handling**:

- **If addressed in Data Sync Requirements**: Log warning but allow proceed
- **If NOT addressed**: Log warning and flag for SM review (does not HALT, but logged in validation_result)

---

## Validation Process

### Step 1: Parse Current Story's Planned Changes

**From Story Dev Notes**, extract:

**Database Changes**:

```
planned_db_changes = {
  tables_to_create: ["orders", "order_items"],
  tables_to_alter: ["users"],
  fields_to_add: [
    {table: "users", field: "verified_at", type: "timestamp"},
    {table: "orders", field: "user_id", type: "uuid", references: "users.id"}
  ]
}
```

**API Changes**:

```
planned_api_changes = {
  endpoints_to_create: [
    {method: "POST", path: "/api/orders"},
    {method: "GET", path: "/api/orders/:id"}
  ]
}
```

**Model Changes**:

```
planned_model_changes = {
  interfaces_to_create: ["IOrder", "IOrderItem"],
  zod_schemas_to_create: ["OrderSchema", "OrderItemSchema"],
  enums_to_create: ["OrderStatus"]
}
```

---

### Step 2: Validate Database Changes

For each `tables_to_create`:

- Check if `table.name` exists in `cumulative_context.database.tables[]`
- If exists → **HALT** with Rule 1.1 message

For each `fields_to_add`:

- Check if `{table}.{field}` combination exists in cumulative context
- If exists → **HALT** with Rule 1.2 message
- If field has foreign key reference:
  - Check if referenced table exists in cumulative context
  - If not exists → **HALT** with Rule 1.3 message

**Naming Convention Check** (WARN level):

- Compare planned table/field names with `cumulative_context.database.naming_conventions`
- If inconsistent → WARN with suggestion

**Example**:

```
⚠️ WARNING: Naming convention inconsistency
   - Existing convention: snake_case for tables
   - Planned table: 'OrderItems' (PascalCase)
   - Suggestion: Rename to 'order_items' for consistency
```

---

### Step 3: Validate API Changes

For each `endpoints_to_create`:

- Check if `{method} {path}` exists in `cumulative_context.api.endpoints[]`
- If exact match → **HALT** with Rule 2.1 message
- If similar match (fuzzy matching) → **WARN** with Rule 2.2 message

**Fuzzy Matching Logic**:

- Same resource but different path structure (e.g., `/users/new` vs `/users/create`)
- Similar verbs in path (e.g., `/register` vs `/signup`)
- Same path different method may be OK (RESTful: GET/POST/PUT/DELETE on same resource)

**API Pattern Consistency Check** (WARN level):

- Compare with `cumulative_context.api.patterns`
- Check URL naming, resource naming, versioning strategy

**Example**:

```
⚠️ WARNING: API pattern inconsistency
   - Existing pattern: RESTful with plural nouns (e.g., /api/users)
   - Planned endpoint: /api/get-user/:id (verb in path)
   - Suggestion: Use 'GET /api/users/:id' for RESTful consistency
```

---

### Step 4: Validate Model Changes

For each `interfaces_to_create`, `zod_schemas_to_create`, `enums_to_create`:

- Check if name exists in `cumulative_context.models.*`
- If exact match → **HALT** with Rule 3.1 message
- If similar name (e.g., "User" vs "UserProfile") → **WARN** with Rule 3.2 message

**Property-Level Similarity Check**:

- If new interface has >70% property overlap with existing interface → WARN

**Naming Convention Check** (WARN level):

- Compare with `cumulative_context.models.naming_conventions`

**Example**:

```
⚠️ WARNING: Model naming convention inconsistency
   - Existing convention: Interfaces with 'I' prefix (IUser, IOrder)
   - Planned interface: User (no prefix)
   - Suggestion: Rename to 'IUser' or update convention across codebase
```

---

### Step 5: Generate Validation Report

**Report Structure**:

```markdown
## Cumulative Context Validation Report

**Story**: {story_id} - {story_title}
**Validated At**: {timestamp}

---

### 🔍 Validation Summary

✅ **PASSED**: X checks
⚠️ **WARNINGS**: Y checks
❌ **FAILED (HALT)**: Z checks

---

### Database Validation

✅ No duplicate tables detected
✅ No duplicate fields detected
⚠️ 1 naming convention inconsistency (see details below)

---

### API Validation

❌ **HALT**: 1 duplicate endpoint detected (see details below)
⚠️ 1 similar endpoint detected (see details below)

---

### Models Validation

✅ No duplicate models detected
✅ Naming conventions followed

---

### 🚨 CRITICAL ISSUES (HALT)

#### Issue #1: Duplicate API Endpoint

{Detailed conflict message from Rule 2.1}

---

### ⚠️ WARNINGS (Review Recommended)

#### Warning #1: Similar Endpoint Detected

{Detailed warning message from Rule 2.2}

#### Warning #2: Naming Convention Inconsistency

{Detailed warning message}

---

### 📋 NEXT ACTIONS

**IF HALTS EXIST**:

1. Resolve all HALT-level conflicts listed above
2. Update Story Dev Notes as needed
3. Re-submit story for validation
4. Do NOT proceed with implementation

**IF ONLY WARNINGS**:

1. Review warnings and address in Dev Log
2. Document why existing resources cannot be reused (if applicable)
3. Proceed with implementation
```

---

## Outputs

### Output 1: Validation Result Object

```javascript
validation_result = {
  status: "HALT" | "WARN" | "PASS",
  passed_checks: 12,
  warnings: 2,
  critical_failures: 1,
  details: {
    database: {
      duplicate_tables: [],
      duplicate_fields: [],
      invalid_fk_references: [],
      naming_warnings: [...]
    },
    api: {
      duplicate_endpoints: [{...}],
      similar_endpoints: [{...}],
      pattern_warnings: [...]
    },
    models: {
      duplicate_models: [],
      similar_models: [{...}],
      naming_warnings: [...]
    },
    data_sync: {
      potential_sync_required: [{
        source_table: "subscriptions",
        source_field: "current_period_end",
        related_table: "license_keys",
        related_field: "expires_at",
        shared_entity: "user_id",
        reasoning: "Both are expiry fields for same user",
        addressed_in_story: true/false
      }],
      unaddressed_warnings: [...]
    }
  },
  report_markdown: "{full validation report}"
}
```

### Output 2: HALT Decision

**If `validation_result.status === "HALT"`**:

- Display validation report
- Stop Dev Agent workflow immediately
- Log to Dev Log: "❌ Implementation halted due to conflicts. See validation report."
- Escalate to SM with conflict details
- **DO NOT PROCEED** to Step 3 (Implementation)

**If `validation_result.status === "WARN"`**:

- Display validation report
- Log warnings to Dev Log
- Require Dev to acknowledge warnings and document justifications
- Allow proceeding to Step 3 (Implementation)

**If `validation_result.status === "PASS"`**:

- Display success message: "✅ No conflicts detected. Proceeding with implementation."
- Log to Dev Log: "✅ Cumulative context validation passed."
- Proceed to Step 3 (Implementation)

---

## Error Handling

### Error: Cumulative context not loaded

**Symptom**: `cumulative_context` is null or undefined

**Action**:

1. Log error: "❌ Cumulative context not available. Run load-cumulative-context.md first."
2. HALT validation
3. Instruct agent to load context before retrying

### Error: Story Dev Notes missing planned changes

**Symptom**: Cannot parse planned database/API/model changes from Dev Notes

**Action**:

1. Log warning: "⚠️ Cannot extract planned changes from Dev Notes. Manual review required."
2. Skip validation (assume no conflicts)
3. Flag for human review

---

## Usage Examples

### Example 1: HALT on Duplicate Table

**Story 2.3 Plans to Create 'users' table**

```markdown
### Step 2.5: Validate Against Cumulative Context

Execute: utils/validate-against-cumulative-context.md
Input: story = Story 2.3, cumulative_context = {loaded context}

❌ VALIDATION FAILED - HALTING IMPLEMENTATION

🚨 CRITICAL ISSUE: Duplicate Table Detected

Table 'users' already exists (created in Story 1.1)

Resolution required before proceeding. Escalating to SM.

🛑 IMPLEMENTATION STOPPED
```

**Dev Agent Action**: Log error, escalate to SM, do not proceed

---

### Example 2: WARN on Similar Endpoint

**Story 2.1 Plans to Create 'POST /api/auth/signup'**

```markdown
### Step 2.5: Validate Against Cumulative Context

Execute: utils/validate-against-cumulative-context.md
Input: story = Story 2.1, cumulative_context = {loaded context}

⚠️ VALIDATION PASSED WITH WARNINGS

Warning #1: Similar endpoint detected

- Existing: POST /api/users/register (Story 1.2)
- Planned: POST /api/auth/signup (Story 2.1)

Recommendation: Review if these are duplicate operations.

✅ Proceeding with implementation (warnings logged to Dev Log)
```

**Dev Agent Action**: Log warning, document justification in Dev Log, proceed

---

### Example 3: PASS with No Conflicts

**Story 3.1 Plans to Create 'notifications' table**

```markdown
### Step 2.5: Validate Against Cumulative Context

Execute: utils/validate-against-cumulative-context.md
Input: story = Story 3.1, cumulative_context = {loaded context}

✅ VALIDATION PASSED

- Database: No conflicts detected
- API: No conflicts detected
- Models: No conflicts detected

All naming conventions followed. Proceeding with implementation.
```

**Dev Agent Action**: Proceed to Step 3 (Implementation)

---

## Related Tasks

- `load-cumulative-context.md` - Must be run before this validation
- `update-database-registry.md` - Updates registry after successful implementation
- `update-api-registry.md` - Updates registry after successful implementation

---

## Configuration

**Validation Strictness** (configurable in future):

```yaml
validation_strictness:
  database_conflicts: HALT # HALT | WARN | IGNORE
  api_conflicts: HALT
  model_conflicts: HALT
  naming_conventions: WARN
  similar_resources: WARN
```

**Fuzzy Matching Threshold**:

- Endpoint similarity threshold: 70% (Levenshtein distance)
- Model property overlap threshold: 70%

---

## Maintenance Notes

**When validation rules change**:

1. Update this document
2. Notify all agents via agent configuration updates
3. Test with sample stories

**Performance**: Validation typically completes in <1 second for projects with <100 stories.
