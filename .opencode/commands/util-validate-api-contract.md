---
description: "Validate API Contract"
---

When this command is used, execute the following task:

# Validate API Contract

## Purpose

Validate implementation compliance with API contracts in multi-repository projects. Ensures request/response schemas, error handling, and security requirements match documented contracts.

## Applicability

**Only execute if**:

```yaml
project.mode = 'multi-repo' AND project.multi_repo.role ∈ {backend, frontend, ios, android}
```

**Skip if**:

```yaml
project.mode = 'single-repo' OR project.multi_repo.role = 'product'
```

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: Path to story file
  - project_type: backend | frontend | ios | android

optional:
  - product_repo_path: Path to product repo (default from core-config.yaml)
  - api_contracts_path: Path to api-contracts.md (default: product_repo/docs/api-contracts.md)
```

## Process

### 1. Check Applicability

**Read**: `.orchestrix-core/core-config.yaml`

```yaml
project:
  mode: { single-repo|multi-repo }
  multi_repo:
    role: { product|backend|frontend|ios|android }
```

**If** `project.mode = 'single-repo'`:

- Skip validation
- Return: `{result: SKIPPED, reason: "Not a multi-repo project"}`

**If** `project.multi_repo.role = 'product'`:

- Skip validation
- Return: `{result: SKIPPED, reason: "Product repo does not implement APIs"}`

**If** `project.mode = 'multi-repo'` **AND** `project.multi_repo.role ∈ {backend, frontend, ios, android}`:

- Proceed with validation

### 2. Load Epic and Story Metadata

**Read story file**:

- Extract story_id (epic.story)
- Locate epic_id from story

**Load epic YAML** from product repo:

```
{product_repo_path}/docs/prd/epic-{epic_id}-*.yaml
```

**Extract from epic**:

- `provides_apis: []` (backend stories)
- `consumes_apis: []` (frontend/mobile stories)
- `dependencies: []` (cross-repo dependencies)

**Error Handling**:

- If epic YAML not found: WARNING - "Cannot validate, epic YAML missing"
- If no APIs defined: SKIP - "Story has no API contracts"

### 3. Load API Contracts

**Read**: `{product_repo_path}/docs/api-contracts.md`

**Parse structure**:

````markdown
# API Contracts

## 1. User Authentication API

### 1.1 POST /api/auth/login

**Request Schema**:

```json
{
  "email": "string",
  "password": "string"
}
```
````

**Success Response (200)**:

```json
{
  "token": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string"
  }
}
```

**Error Responses**:

- 401: Invalid credentials
- 400: Validation error
- 500: Server error

````

**Error Handling**:
- If api-contracts.md not found: ERROR - "API contracts document missing"
- If cannot parse: ERROR - "API contracts document malformed"

### 4. Backend Validation (provides_apis)

**For each API endpoint in** `provides_apis`:

#### 4.1 Verify Endpoint Exists

**Check**: API endpoint documented in api-contracts.md

**Example**: `POST /api/auth/login`

**If NOT found**:
```yaml
violation:
  severity: CRITICAL
  type: UNDOCUMENTED_ENDPOINT
  endpoint: {endpoint}
  message: "API endpoint not documented in api-contracts.md"
  action: "Add endpoint to api-contracts.md or remove from story"
````

#### 4.2 Validate Request Schema

**Extract from story**:

- Dev Notes - Request structure
- Tasks - Request payload mentions
- Acceptance Criteria - Request field requirements

**Compare with contract**:

- All required fields present
- Field types match (string, number, boolean, object, array)
- Field names exact match (case-sensitive)
- No extra required fields

**On mismatch**:

```yaml
violation:
  severity: MAJOR
  type: REQUEST_SCHEMA_MISMATCH
  endpoint: { endpoint }
  contract_fields: { list from contract }
  story_fields: { list from story }
  missing_fields: { required fields missing in story }
  extra_fields: { fields in story not in contract }
  type_mismatches: { fields with wrong types }
  action: "Update story implementation to match contract schema"
```

#### 4.3 Validate Response Schema

**Extract from story**:

- Dev Notes - Response structure
- Tasks - Response handling
- Acceptance Criteria - Expected response

**Compare with contract**:

- Success response structure matches
- All response fields present with correct types
- Nested objects match structure
- Array element types correct

**On mismatch**:

```yaml
violation:
  severity: MAJOR
  type: RESPONSE_SCHEMA_MISMATCH
  endpoint: { endpoint }
  contract_response: { contract schema }
  story_response: { story schema }
  discrepancies: { list of mismatches }
  action: "Update implementation to return exact contract schema"
```

#### 4.4 Validate Error Handling

**Check story mentions**:

- All error status codes from contract (400, 401, 404, 500, etc.)
- Error response structures
- Error message formats

**On missing error handling**:

```yaml
violation:
  severity: MAJOR
  type: INCOMPLETE_ERROR_HANDLING
  endpoint: { endpoint }
  contract_errors: { list of error codes from contract }
  story_errors: { list of error codes mentioned in story }
  missing_errors: { error codes not handled }
  action: "Add error handling for all contract error codes"
```

#### 4.5 Validate Security Requirements

**Check from contract**:

- Authentication required (Bearer token, API key, etc.)
- Authorization rules (role-based, permission-based)
- Rate limiting specifications
- Input validation requirements

**Check story implements**:

- Authentication middleware
- Authorization checks
- Rate limiting
- Input sanitization

**On missing security**:

```yaml
violation:
  severity: CRITICAL
  type: SECURITY_REQUIREMENT_MISSING
  endpoint: { endpoint }
  contract_security: { security requirements from contract }
  story_security: { security mentions in story }
  missing: { security requirements not implemented }
  action: "Implement all security requirements from contract"
```

### 5. Frontend/Mobile Validation (consumes_apis)

**For each API endpoint in** `consumes_apis`:

#### 5.1 Verify Endpoint Exists

Same as backend validation (4.1)

#### 5.2 Validate Request Payload Construction

**Check story implements**:

- Correct request payload structure
- All required fields included
- Field types correct
- Proper serialization

**On mismatch**:

```yaml
violation:
  severity: MAJOR
  type: REQUEST_PAYLOAD_MISMATCH
  endpoint: { endpoint }
  contract_payload: { expected payload }
  story_implementation: { planned payload }
  action: "Update request construction to match contract"
```

#### 5.3 Validate Response Handling

**Check story handles**:

- Success response (200, 201, etc.)
- Success response structure parsing
- All response fields accessed correctly
- Nested object navigation

**On incomplete handling**:

```yaml
violation:
  severity: MAJOR
  type: RESPONSE_HANDLING_INCOMPLETE
  endpoint: { endpoint }
  contract_response: { response schema }
  story_handling: { fields story accesses }
  missing_fields: { fields not handled }
  action: "Handle all response fields from contract"
```

#### 5.4 Validate Error Response Handling

**Check story handles**:

- All error status codes from contract
- Error message display to user
- Error recovery flows
- Appropriate UI feedback

**On missing error handling**:

```yaml
violation:
  severity: MAJOR
  type: ERROR_HANDLING_INCOMPLETE
  endpoint: { endpoint }
  contract_errors: { error codes from contract }
  story_errors: { errors handled in story }
  missing: { errors not handled }
  action: "Add UI handling for all contract error codes"
```

#### 5.5 Validate Cross-Repo Dependencies

**Check story dependencies**:

- For dependencies in different repos
- Verify dependency story status
- Check if dependency is complete

**Add notes**:

```yaml
note:
  type: CROSS_REPO_DEPENDENCY
  dependency_story: { story_id }
  dependency_repo: { repo_name }
  dependency_status: { status }
  message: "Story depends on {story_id} in {repo}. Verify completion before testing."
  blocking: { true if dependency not Done }
```

### 6. Generate Validation Report

**Structure**:

```yaml
api_contract_validation:
  project_type: { backend|frontend|ios|android }
  validation_date: { timestamp }
  story_id: { story_id }

  apis_validated:
    provides: [{ endpoint list }] # for backend
    consumes: [{ endpoint list }] # for frontend/mobile

  compliance_summary:
    total_endpoints: { count }
    endpoints_validated: { count }
    violations_critical: { count }
    violations_major: { count }
    violations_minor: { count }

  violations:
    critical:
      - endpoint: { endpoint }
        type: { violation_type }
        message: { description }
        action: { required_fix }
    major:
      - endpoint: { endpoint }
        type: { violation_type }
        message: { description }
        action: { recommended_fix }
    minor:
      - endpoint: { endpoint }
        type: { violation_type }
        message: { description }
        action: { optional_improvement }

  cross_repo_dependencies:
    - story: { dependency_story_id }
      repo: { repo_name }
      status: { status }
      blocking: { true/false }

  overall_result: { PASS|FAIL }
  compliance_score: { percentage }
```

## Decision Logic

**PASS** (Contract compliance acceptable):

- Zero critical violations
- ≤1 major violations
- All dependencies noted

**FAIL** (Contract violations require fixes):

- Any critical violations (security, undocumented, missing error handling)
- > 1 major violations (schema mismatches, incomplete handling)
- Blocking cross-repo dependencies unresolved

## Output

### On PASS

```yaml
result: PASS
message: "Implementation complies with API contracts"
compliance_score: 100%
notes:
  - "All request/response schemas match contracts"
  - "Error handling complete for all endpoints"
  - "Security requirements implemented"
cross_repo_notes: [{ dependency notes }]
```

### On FAIL

```yaml
result: FAIL
message: "Implementation violates API contracts"
compliance_score: { percentage }
critical_violations: { count }
major_violations: { count }

required_fixes:
  critical:
    - endpoint: POST /api/auth/login
      issue: "Missing authentication middleware"
      contract: "Requires Bearer token authentication"
      story: "No authentication mentioned"
      fix: "Add JWT authentication check before handler"

  major:
    - endpoint: GET /api/users/:id
      issue: "Response schema mismatch"
      contract: '{"id": "uuid", "email": "string", "name": "string", "created_at": "timestamp"}'
      story: '{"userId": "number", "userEmail": "string"}'
      fix: "Update response to use contract field names and types"

blocking_dependencies:
  - story: 1.2
    repo: backend
    status: InProgress
    message: "Cannot complete until backend story 1.2 is Done"
```

### On SKIPPED

```yaml
result: SKIPPED
reason: "Project mode is single-repo - API contract validation not applicable"
```

## Usage Context

**Called by**:

- `dev-self-review.md` - Before marking story Review
- `validate-implementation.md` - During architecture compliance check
- Dev agent - During implementation for quick checks

## Error Handling

**Missing product repo**:

```yaml
error: PRODUCT_REPO_NOT_FOUND
message: "Cannot locate product repository"
path_checked: { product_repo_path }
config: "Check core-config.yaml project.multi_repo.product_repo_path"
result: ERROR
```

**Missing API contracts**:

```yaml
error: API_CONTRACTS_MISSING
message: "API contracts document not found"
path_checked: { api_contracts_path }
expected: "{product_repo}/docs/api-contracts.md"
result: ERROR
```

**Epic YAML missing**:

```yaml
warning: EPIC_YAML_MISSING
message: "Cannot validate - epic YAML not found"
story: { story_id }
epic: { epic_id }
result: SKIPPED
```

## Key Principles

- **Exact match required**: Request/response schemas must match exactly (field names, types, structure)
- **Security is critical**: Missing security requirements are blocking violations
- **Complete error handling**: All contract error codes must be handled
- **Cross-repo awareness**: Track dependencies, warn about blocking statuses
- **Backend stricter**: Backend violations more severe (provides contract)
- **Frontend completeness**: Frontend must handle all contract scenarios

## References

- `docs/api-contracts.md` (in product repo)
- `docs/prd/epic-{epic_id}-{title-slug}.yaml` (in product repo)
- `core-config.yaml` - project configuration
- `data/epic-story-mapping-schema.yaml` - epic schema
- `data/api-contract-locking.yaml` - contract versioning rules
