# Extract API Contracts

## Purpose

Extract and document API contracts from existing backend code. This task analyzes backend repositories to identify all API endpoints, generate documentation, and optionally create an OpenAPI specification.

**Use Case**: You have an existing backend with API endpoints defined in code, and you want to:
- Document all available APIs
- Generate API reference documentation
- Create OpenAPI/Swagger specification
- Validate frontend API calls against backend APIs

**What This Task Does**:
- Scans backend code for API endpoint definitions (routes, controllers)
- Extracts HTTP methods, paths, parameters, request/response schemas
- Documents authentication requirements per endpoint
- Generates API contract documentation
- Optionally generates OpenAPI 3.0 specification

**IMPORTANT**: This task focuses ONLY on API contract extraction, not full architecture. For complete system architecture aggregation, use `aggregate-system-architecture.md`.

## Prerequisites

**Required Setup**:
- ✅ Backend repository exists with API code
- ✅ Project type is `backend` in `core-config.yaml`

**Supported Backend Frameworks**:
- Express (Node.js)
- NestJS (Node.js)
- FastAPI (Python)
- Django REST Framework (Python)
- Spring Boot (Java)
- Ruby on Rails (Ruby)

**Recommended Environment**:
- 💻 IDE (Claude Code, Cursor, etc.) - Recommended for code analysis
- 🌐 Web interface - Also suitable

## Validation

```bash
# Check project type
PROJECT_TYPE=$(grep "type:" core-config.yaml | awk '{print $2}')
if [ "$PROJECT_TYPE" != "backend" ]; then
  echo "❌ ERROR: Project type is '$PROJECT_TYPE', expected 'backend'"
  echo "This task should run in Backend repository"
  exit 1
fi

echo "✅ Prerequisites validated. Proceeding with API contract extraction..."
```

---

## Task Instructions

### Step 1: Detect Backend Framework

Identify the backend framework to determine extraction strategy.

**Framework Detection**:
```bash
# Node.js/Express
if grep -q '"express":' package.json; then
  echo "Framework: Express (Node.js)"
  ROUTES_PATH="src/routes"
fi

# NestJS
if grep -q '@nestjs/core' package.json; then
  echo "Framework: NestJS (Node.js)"
  ROUTES_PATH="src/**/*.controller.ts"
fi

# FastAPI (Python)
if grep -q 'fastapi' requirements.txt; then
  echo "Framework: FastAPI (Python)"
  ROUTES_PATH="app/routers"
fi

# Django REST Framework
if grep -q 'djangorestframework' requirements.txt; then
  echo "Framework: Django REST Framework (Python)"
  ROUTES_PATH="*/views.py"
fi

# Spring Boot (Java)
if grep -q 'spring-boot-starter-web' pom.xml; then
  echo "Framework: Spring Boot (Java)"
  ROUTES_PATH="src/main/java/**/controller"
fi

# Ruby on Rails
if [ -f "config/routes.rb" ]; then
  echo "Framework: Ruby on Rails"
  ROUTES_PATH="config/routes.rb"
fi
```

**Elicit User Confirmation**:
```
🔍 **Backend Framework Detected**: {{framework}}
**Routes Location**: {{routes_path}}

Is this correct? (If wrong, please specify framework and routes location)
```

---

### Step 2: Scan Route Definitions

Extract API endpoints from route files.

**Express (Node.js) Example**:
```typescript
// src/routes/auth.routes.ts
router.post('/api/auth/register', authController.register);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', authMiddleware, authController.logout);
```

**Extraction Pattern**:
- Method: `post`, `get`, `put`, `delete`, `patch`
- Path: `/api/auth/register`
- Middleware: `authMiddleware` (indicates authentication required)
- Handler: `authController.register`

**NestJS Example**:
```typescript
// src/auth/auth.controller.ts
@Controller('api/auth')
export class AuthController {
  @Post('register')
  async register(@Body() dto: RegisterDto) { ... }

  @Post('login')
  async login(@Body() dto: LoginDto) { ... }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout() { ... }
}
```

**Extraction Pattern**:
- Controller path: `/api/auth`
- Method decorator: `@Post('register')` → POST
- Route: `/api/auth/register`
- Guard: `@UseGuards(AuthGuard)` → authentication required

**FastAPI (Python) Example**:
```python
# app/routers/auth.py
@router.post("/api/auth/register")
async def register(user: UserCreate):
    ...

@router.post("/api/auth/login")
async def login(credentials: LoginRequest):
    ...

@router.post("/api/auth/logout", dependencies=[Depends(get_current_user)])
async def logout():
    ...
```

**Extraction Pattern**:
- Decorator: `@router.post`
- Path: `/api/auth/register`
- Dependency: `dependencies=[Depends(get_current_user)]` → authentication required

---

### Step 3: Extract Endpoint Details

For each discovered endpoint, extract detailed information.

**Information to Extract**:

1. **HTTP Method**: GET, POST, PUT, DELETE, PATCH
2. **Path**: `/api/auth/register`
3. **Path Parameters**: e.g., `:id` in `/api/users/:id`
4. **Query Parameters**: e.g., `?status=active&limit=10`
5. **Request Body Schema**: DTO or schema definition
6. **Response Schema**: Return type or schema
7. **Authentication Required**: Yes/No (check for middleware/guards/dependencies)
8. **Authorization**: Required roles (if RBAC)
9. **Rate Limiting**: If defined
10. **Description**: Comment or docstring

**Extraction Example (Express)**:
```typescript
/**
 * Register a new user account
 * @route POST /api/auth/register
 * @public
 */
router.post(
  '/api/auth/register',
  validateRequest(RegisterSchema),
  authController.register
);

// Controller
async register(req: Request, res: Response) {
  const { email, password, name } = req.body; // Request body
  const user = await authService.register(email, password, name);
  res.status(201).json(user); // Response: User object
}

// Schema (Zod)
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// Response Type
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}
```

**Extracted Endpoint Documentation**:
```markdown
### POST /api/auth/register

**Description**: Register a new user account

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",    // Required, valid email
  "password": "SecurePass123!",   // Required, min 8 characters
  "name": "John Doe"              // Required, min 1 character
}
```

**Response (201 Created)**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2025-01-14T10:30:00Z"
}
```

**Errors**:
- `400 Bad Request`: Validation failed (invalid email, weak password)
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Unexpected error
```

---

### Step 4: Group Endpoints into Categories

Organize endpoints by logical grouping.

**Common Grouping Strategies**:
1. **By Resource**: Users, Products, Orders, etc.
2. **By Feature**: Authentication, Task Management, Reporting
3. **By Route Prefix**: `/api/auth/*`, `/api/tasks/*`, `/api/users/*`

**Example Grouping**:

```markdown
## Authentication APIs

### POST /api/auth/register
**Description**: Register new user account
**Authentication**: Public

### POST /api/auth/login
**Description**: Authenticate user and issue JWT tokens
**Authentication**: Public

### POST /api/auth/logout
**Description**: Invalidate user session
**Authentication**: Required (JWT)

### POST /api/auth/refresh
**Description**: Refresh access token using refresh token
**Authentication**: Required (Refresh Token)

---

## Task Management APIs

### GET /api/tasks
**Description**: List all tasks (paginated)
**Authentication**: Required (JWT)

### GET /api/tasks/:id
**Description**: Get task details by ID
**Authentication**: Required (JWT)

### POST /api/tasks
**Description**: Create new task
**Authentication**: Required (JWT)

### PUT /api/tasks/:id
**Description**: Update existing task
**Authentication**: Required (JWT)

### DELETE /api/tasks/:id
**Description**: Delete task (soft delete)
**Authentication**: Required (JWT)
```

---

### Step 5: Generate OpenAPI Specification (Optional)

Generate OpenAPI 3.0 specification for API documentation tools (Swagger, Redoc).

**OpenAPI Template**:
```yaml
openapi: 3.0.0
info:
  title: {{project_name}} API
  version: {{api_version}}
  description: {{api_description}}
servers:
  - url: https://api.example.com
    description: Production
  - url: https://dev-api.example.com
    description: Development

security:
  - bearerAuth: []

paths:
  /api/auth/register:
    post:
      summary: Register new user
      tags:
        - Authentication
      security: []  # Public endpoint
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - name
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                name:
                  type: string
                  minLength: 1
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Validation error
        '409':
          description: Email already exists

  /api/tasks:
    get:
      summary: List all tasks
      tags:
        - Tasks
      security:
        - bearerAuth: []
      parameters:
        - name: cursor
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            maximum: 100
      responses:
        '200':
          description: Task list returned
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Task'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [admin, user]
        createdAt:
          type: string
          format: date-time

    Task:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [todo, in_progress, done]
        priority:
          type: string
          enum: [low, medium, high]
        createdAt:
          type: string
          format: date-time

    Pagination:
      type: object
      properties:
        cursor:
          type: string
        hasMore:
          type: boolean
        limit:
          type: integer
```

**Save OpenAPI Spec**:
```bash
# Save to docs/api-contracts.yaml
OUTPUT_PATH="docs/api-contracts.yaml"
```

---

### Step 6: Validate Frontend API Calls (Optional)

If frontend repositories exist, validate their API calls against extracted backend APIs.

**Step 6.1: Scan Frontend API Service Files**

```bash
# Example: Scan React/TypeScript frontend
grep -r "apiClient\." src/services/ | grep -E "get|post|put|delete"
```

**Extracted Frontend API Calls**:
```typescript
// src/services/auth.service.ts
apiClient.post('/api/auth/register', data);
apiClient.post('/api/auth/login', data);
apiClient.post('/api/auth/logout');

// src/services/task.service.ts
apiClient.get('/api/tasks', { params });
apiClient.get(`/api/tasks/${id}`);
apiClient.post('/api/tasks', data);
apiClient.put(`/api/tasks/${id}`, data);
apiClient.delete(`/api/tasks/${id}`);
```

**Step 6.2: Cross-Reference with Backend APIs**

```markdown
### API Alignment Validation

**Backend APIs Provided** (11 endpoints):
1. ✅ POST /api/auth/register
2. ✅ POST /api/auth/login
3. ✅ POST /api/auth/logout
4. ⚠️ POST /api/auth/refresh (not consumed by frontend)
5. ✅ GET /api/users/me
6. ⚠️ PUT /api/users/me (not consumed by frontend)
7. ✅ GET /api/tasks
8. ✅ GET /api/tasks/:id
9. ✅ POST /api/tasks
10. ✅ PUT /api/tasks/:id
11. ✅ DELETE /api/tasks/:id

**Frontend APIs Consumed** (9 endpoints):
1. ✅ POST /api/auth/register → Backend provides ✓
2. ✅ POST /api/auth/login → Backend provides ✓
3. ✅ POST /api/auth/logout → Backend provides ✓
4. ✅ GET /api/users/me → Backend provides ✓
5. ✅ GET /api/tasks → Backend provides ✓
6. ✅ GET /api/tasks/:id → Backend provides ✓
7. ✅ POST /api/tasks → Backend provides ✓
8. ✅ PUT /api/tasks/:id → Backend provides ✓
9. ✅ DELETE /api/tasks/:id → Backend provides ✓

**Validation Result**: ✅ 100% Alignment (9/9 frontend calls have corresponding backend endpoints)

**Unused Backend APIs** (2):
- POST /api/auth/refresh (may be used by mobile)
- PUT /api/users/me (profile editing not yet implemented)
```

---

### Step 7: Generate API Contracts Document

Create final API contracts documentation.

**Step 7.1: Prepare Output**

```bash
mkdir -p docs
OUTPUT_PATH="docs/api-contracts.md"
```

**Step 7.2: Document Structure**

```markdown
# {{Project Name}} API Contracts

**Version**: {{api_version}}
**Last Updated**: {{current_date}}
**Base URL**: {{api_base_url}}

---

## Overview

This document specifies all API endpoints provided by the {{backend_repo_name}} backend.

**Total Endpoints**: {{endpoint_count}}
**Authentication**: JWT (Bearer token)

---

## Authentication

All authenticated endpoints require a valid JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

**Token Acquisition**: Obtain access token via `POST /api/auth/login`
**Token Lifetime**: 15 minutes
**Token Refresh**: Use `POST /api/auth/refresh` with refresh token

---

## API Endpoints

[Include all endpoint documentation from Steps 3-4]

---

## Data Models

[Include schema definitions for common data types: User, Task, etc.]

---

## Error Responses

All endpoints use a standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... },
    "timestamp": "2025-01-14T10:30:00Z",
    "request_id": "uuid"
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing auth token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Rate Limiting

- **Authentication Endpoints**: 10 requests/minute per IP
- **General Endpoints**: 100 requests/minute per authenticated user

---

## Appendix

### Extraction Metadata

**Extraction Date**: {{extraction_date}}
**Backend Framework**: {{framework}}
**Extraction Method**: Code analysis
**Confidence Level**: High (extracted from route definitions and controllers)
```

---

### Step 8: Output Handoff

Present completed documentation and next steps.

**Success Output**:
```
✅ API CONTRACTS EXTRACTED

📄 Generated Documents:
- docs/api-contracts.md ({{line_count}} lines)
{{#if openapi_generated}}
- docs/api-contracts.yaml (OpenAPI 3.0 specification)
{{/if}}

📊 **Extraction Summary**:

**Total Endpoints Extracted**: {{endpoint_count}}
**API Categories**: {{category_count}}
- {{category_1}}: {{count_1}} endpoints
- {{category_2}}: {{count_2}} endpoints
- {{category_3}}: {{count_3}} endpoints

**Authentication**:
- Public endpoints: {{public_count}}
- Authenticated endpoints: {{auth_count}}
- Admin-only endpoints: {{admin_count}}

{{#if frontend_validation}}
**Frontend Validation**:
- Frontend API calls: {{frontend_call_count}}
- Alignment: {{alignment_percent}}% ({{aligned_count}}/{{frontend_call_count}})
- Undefined API calls: {{undefined_count}}
{{/if}}

---

📋 **NEXT STEPS**:

1. **Review API Contracts**:
   - Verify endpoint list is complete
   - Check request/response schemas
   - Validate authentication requirements

2. **Share with Frontend Team**:
   - Provide docs/api-contracts.md to frontend developers
   {{#if openapi_generated}}
   - Import docs/api-contracts.yaml into Swagger UI or Postman
   {{/if}}

3. **Update System Architecture** (if exists):
   - Add extracted APIs to system-architecture.md API Contracts Summary section
   - Ensure consistency across documentation

4. **Consider API Improvements**:
   {{#if unused_apis}}
   - Review unused APIs: {{unused_apis}}
   {{/if}}
   - Add missing endpoints if frontend needs them
   - Improve documentation comments in code

5. **Keep Contracts Updated**:
   - Re-run extraction when APIs change
   - Consider automated tools: Swagger/OpenAPI codegen, API testing

---

🎉 **API contracts are now documented!**

Developers can reference docs/api-contracts.md for all available endpoints.
```

---

## Notes for Agent Execution

- **Framework-Specific**: Adjust extraction patterns based on detected framework. Each framework has different routing patterns.

- **Schema Extraction**: Try to extract TypeScript types, Zod schemas, DTOs, or docstrings for request/response schemas. If not available, note "Schema not defined in code".

- **Confidence Levels**: Be transparent about extraction quality. If route definitions are clear, confidence is High. If inferred from controllers only, confidence is Medium.

- **OpenAPI Optional**: Only generate OpenAPI spec if user requests it or if it adds significant value.

## Success Criteria

- ✅ API contracts document exists at `docs/api-contracts.md`
- ✅ All endpoints are extracted and documented
- ✅ Endpoints are grouped by category
- ✅ Request/response schemas documented (or noted as missing)
- ✅ Authentication requirements specified per endpoint
- ✅ (Optional) OpenAPI specification generated
- ✅ (Optional) Frontend API calls validated against backend

## Error Handling

**If backend framework cannot be detected**:
```
⚠️ WARNING: Could not automatically detect backend framework

Please specify:
1. Framework (Express, NestJS, FastAPI, Django, Spring Boot, Rails)
2. Routes location (e.g., src/routes, app/routers, config/routes.rb)

Or provide manual guidance on how to find API endpoints in your codebase.
```

## Related Tasks

- **Prerequisites**: None (can run on any backend repo)
- **Related**: `aggregate-system-architecture.md` (uses API extraction as part of aggregation)
- **Follow-up**: Update system-architecture.md with extracted API contracts

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-14 | Initial creation for Phase 3 | Orchestrix Team |
