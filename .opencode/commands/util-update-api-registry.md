---
description: "Update API Registry"
---

When this command is used, execute the following task:

# Update API Registry

**Purpose**: Automatically update the cumulative API registry after story completion with structured API changes from Dev Agent Record.

**Trigger**: Called by Dev Agent in Step 7 (after implementation completion) when story status changes to "Done".

**Update Mode**: Append-only (preserves historical data)

---

## Inputs

**Required**:

1. `story` - Completed story object with Dev Agent Record containing `api_endpoints_created` field
2. `CONFIG_PATH.devDocLocation` - Location to write/update registry file

**From Story Dev Agent Record** (structured field):

```yaml
api_endpoints_created:
  - method: POST
    path: /api/orders
    description: "Create a new order"
    file_path: src/api/orders/create.ts
    auth_required: true
    auth_type: JWT Bearer
    request_schema: CreateOrderRequest
    request_body: "{ user_id, items[], shipping_address }"
    success_status: 201
    success_response: "{ order_id, status, created_at }"
    success_schema: OrderResponse
    error_responses:
      - status: 400
        description: "Invalid request data"
      - status: 401
        description: "Unauthorized"
      - status: 409
        description: "Order already exists"
    related_endpoints:
      - method: GET
        path: /api/orders/:id
        story_id: 1.4
    notes: "Supports bulk item creation. Max 50 items per order."

  - method: GET
    path: /api/orders/:id
    description: "Get order details by ID"
    file_path: src/api/orders/get.ts
    auth_required: true
    auth_type: JWT Bearer
    request_params: "id (uuid)"
    success_status: 200
    success_schema: OrderResponse
    error_responses:
      - status: 404
        description: "Order not found"
```

---

## Process

### Step 1: Load Existing Registry

**Registry File**: `{devDocLocation}/api-registry.md`

**If file does NOT exist**:

- Initialize new registry from template `templates/api-registry-tmpl.yaml`
- Set metadata

**If file exists**:

- Read existing registry
- Parse current metadata and endpoints registry

---

### Step 2: Extract New API Endpoints

From `story.dev_agent_record.api_endpoints_created`:

```javascript
new_endpoints = story.api_endpoints_created || [];

for (endpoint of new_endpoints) {
  // Detect resource from path (e.g., /api/orders → "orders")
  resource = extract_resource_from_path(endpoint.path);

  endpoint_entry = {
    method: endpoint.method,
    path: endpoint.path,
    story_id: story.id,
    file_path: endpoint.file_path,
    status: "active",
    description: endpoint.description || "",
    request_params: endpoint.request_params || "",
    request_query: endpoint.request_query || "",
    request_body: endpoint.request_body || "",
    request_schema: endpoint.request_schema || "",
    auth_required: endpoint.auth_required || false,
    auth_type: endpoint.auth_type || "",
    success_status: endpoint.success_status || 200,
    success_response: endpoint.success_response || "",
    success_schema: endpoint.success_schema || "",
    error_responses: endpoint.error_responses || [],
    related_endpoints: endpoint.related_endpoints || [],
    notes: endpoint.notes || "",
  };
}
```

**Group endpoints by resource**:

```javascript
// Organize endpoints by resource (e.g., /api/orders/* → "orders" resource)
resources = {
  "orders": {
    name: "orders",
    base_path: "/api/orders",
    endpoints: [...]
  },
  "users": {
    name: "users",
    base_path: "/api/users",
    endpoints: [...]
  }
}
```

---

### Step 3: Merge with Existing Registry

**Merge Endpoints**:

- For new resources: Create new resource section
- For existing resources: Append endpoints to resource
- Sort endpoints within each resource by path

**Update Endpoints by Story**:

- Add new entry for current story:
  ```yaml
  - story_id: 1.3
    story_title: "Implement order management API"
    endpoints:
      - method: POST
        path: /api/orders
        description: "Create a new order"
      - method: GET
        path: /api/orders/:id
        description: "Get order details"
    schemas:
      - name: CreateOrderRequest
        type: Zod
        file_path: src/schemas/order.ts
      - name: OrderResponse
        type: Zod
        file_path: src/schemas/order.ts
  ```

**Update API Patterns** (auto-detect):

```javascript
api_patterns = {
  url_naming: detect_url_naming(), // e.g., "RESTful, kebab-case"
  resource_naming: detect_resource_naming(), // e.g., "plural nouns"
  http_method_usage: count_by_method(), // GET: 15, POST: 8, ...
  auth_patterns: detect_auth_patterns(), // JWT: 20 endpoints, API Key: 5, Public: 3
  versioning_strategy: detect_versioning(), // "none" or "/v1/"
  pagination_pattern: detect_pagination(), // "limit/offset" or "cursor-based"
  error_format: detect_error_format(), // e.g., "{ error, message, details }"
};
```

---

### Step 4: Update Schemas Registry

Extract schemas referenced by endpoints:

```javascript
schemas = []

for (endpoint of new_endpoints) {
  if (endpoint.request_schema) {
    schemas.push({
      name: endpoint.request_schema,
      type: "Zod",  // or TypeScript, JSON Schema, etc.
      story_id: story.id,
      file_path: endpoint.file_path.replace(/\.ts$/, 'Schema.ts'),  // infer
      used_by_endpoints: 1,
      endpoint_count: count_usage(endpoint.request_schema)
    })
  }

  if (endpoint.success_schema) {
    schemas.push({...})
  }
}

// Merge with existing schemas (deduplicate by name)
```

---

### Step 5: Update API Coverage Matrix

Calculate CRUD coverage for each resource:

```javascript
coverage = [];

for (resource of resources) {
  coverage.push({
    resource: resource.name,
    create: has_method(resource, "POST") ? "✅" : "❌",
    read: has_method(resource, "GET", "/:id") ? "✅" : "❌",
    update: has_method(resource, "PUT|PATCH") ? "✅" : "❌",
    delete: has_method(resource, "DELETE") ? "✅" : "❌",
    list: has_method(resource, "GET", "") ? "✅" : "❌",
  });
}
```

Example:

```markdown
| Resource | Create (POST) | Read (GET)   | Update (PUT/PATCH) | Delete (DELETE) | List (GET)   |
| -------- | ------------- | ------------ | ------------------ | --------------- | ------------ |
| orders   | ✅ Story 1.3  | ✅ Story 1.3 | ❌                 | ❌              | ✅ Story 1.4 |
| users    | ✅ Story 1.1  | ✅ Story 1.2 | ✅ Story 1.5       | ❌              | ✅ Story 1.2 |
```

---

### Step 6: Recalculate Metadata

```javascript
metadata.last_updated = current_timestamp();
metadata.total_stories = unique_stories_count();
metadata.total_endpoints = endpoints.length;
metadata.repository_id = config.repository_id;
metadata.project_mode = config.project.mode;
metadata.api_base_url = detect_base_url(); // e.g., "/api" or "/api/v1"
```

---

### Step 7: Generate Updated Registry Content

Using `templates/api-registry-tmpl.yaml`, populate with merged data.

**Endpoints Registry Section** (organized by resource):

```markdown
## API Endpoints Registry

## Resource: orders

**Base Path**: `/api/orders`

### `POST /api/orders`

**Added in Story**: 1.3
**Implementation File**: `src/api/orders/create.ts`
**Status**: active
**Description**: Create a new order

**Request**:

- **Request Body**: { user_id, items[], shipping_address }
- **Schema**: `CreateOrderRequest`
- **Authentication**: JWT Bearer

**Response**:

- **Success (201)**: { order_id, status, created_at }
- **Schema**: `OrderResponse`
- **Error Responses**:
  - `400`: Invalid request data
  - `401`: Unauthorized
  - `409`: Order already exists

**Related Endpoints**:

- `GET /api/orders/:id` (Story 1.4)

**Notes**: Supports bulk item creation. Max 50 items per order.

---

### `GET /api/orders/:id`

**Added in Story**: 1.3
**Implementation File**: `src/api/orders/get.ts`
**Status**: active
**Description**: Get order details by ID

**Request**:

- **Path Parameters**: id (uuid)
- **Authentication**: JWT Bearer

**Response**:

- **Success (200)**: Order object
- **Schema**: `OrderResponse`
- **Error Responses**:
  - `404`: Order not found

---
```

**Endpoints by Story Section**:

```markdown
## Endpoints by Story

### Story 1.3: Implement Order Management API

**Endpoints Added**:

- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details

**Schemas Created**:

- `CreateOrderRequest` (Zod) - src/schemas/order.ts
- `OrderResponse` (Zod) - src/schemas/order.ts
```

---

### Step 8: Write Updated Registry to File

Same process as database registry:

1. Backup existing file
2. Write to temp file
3. Validate
4. Atomic rename
5. Delete backup if successful

---

## Outputs

**Success Message**:

```
✅ API Registry Updated

Story 1.3 changes merged into cumulative registry:
- Endpoints created: 2 (POST /api/orders, GET /api/orders/:id)
- Schemas created: 2 (CreateOrderRequest, OrderResponse)
- Resources affected: 1 (orders)

Registry file: docs/dev/api-registry.md
Last updated: 2025-01-20 15:35:00
Total stories tracked: 8
Total endpoints: 28
Total schemas: 15
```

---

## Error Handling

### Error: Missing api_endpoints_created field

**Action**:

1. Check if story involves API work (keywords: "endpoint", "API", "route")
2. If YES: Use legacy parsing (`parse-legacy-dev-record.md`)
3. If NO: Skip registry update

### Error: Duplicate endpoint detected

**Symptom**: Story attempts to create endpoint that already exists

**Action**:

1. Log error: "❌ Conflict: Endpoint '{method} {path}' already exists (Story {existing_story})"
2. This should have been caught by validation
3. Do not add duplicate entry
4. Log warning in registry

---

## Usage Example

**Story 1.3 Creates Order API Endpoints**:

```markdown
### Step 7: Update Cumulative Registries

Execute: utils/update-api-registry.md
Input: story = Story 1.3

Processing...

- Extracted 2 new endpoints:
  - POST /api/orders
  - GET /api/orders/:id
- Extracted 2 schemas:
  - CreateOrderRequest
  - OrderResponse

Merging with existing registry...

- Previous endpoints: 26
- New total endpoints: 28
- New resource detected: "orders"

Writing to: docs/dev/api-registry.md
✅ Registry updated successfully

API Coverage for 'orders' resource:

- Create: ✅ (Story 1.3)
- Read: ✅ (Story 1.3)
- Update: ❌ (not yet implemented)
- Delete: ❌ (not yet implemented)
- List: ❌ (not yet implemented)
```

---

## Related Tasks

- `load-cumulative-context.md` - Reads this registry
- `validate-against-cumulative-context.md` - Validates against this registry
- `update-database-registry.md` - Parallel update for database registry
- `parse-legacy-dev-record.md` - Backward compatibility

---

## Maintenance

**Registry Regeneration**:

```bash
node tools/init-cumulative-registries.js --api-only
```

**Performance**: Typically <1 second for projects with <100 stories and <500 endpoints.
