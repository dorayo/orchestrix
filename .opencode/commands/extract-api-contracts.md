---
description: "Extract API Contracts"
---

When this command is used, execute the following task:

# Extract API Contracts

Extract and document API contracts from existing backend code.

**What This Task Does**:

- Scans backend code for API endpoint definitions
- Extracts HTTP methods, paths, parameters, request/response schemas
- Documents authentication requirements
- Generates API contract documentation
- Optionally generates OpenAPI 3.0 specification

## Prerequisites

**Required Setup**:

- ✅ Backend repository exists with API code
- ✅ Project type is `backend` in `core-config.yaml`

**Supported Frameworks**:

- Express (Node.js)
- NestJS (Node.js)
- FastAPI (Python)
- Django REST Framework (Python)
- Spring Boot (Java)
- Ruby on Rails (Ruby)

## Validation

```bash
PROJECT_TYPE=$(grep "type:" core-config.yaml | awk '{print $2}')
if [ "$PROJECT_TYPE" != "backend" ]; then
  echo "❌ ERROR: Project type is '$PROJECT_TYPE', expected 'backend'"
  exit 1
fi

echo "✅ Prerequisites validated. Proceeding with API contract extraction..."
```

---

## Task Instructions

### Step 1: Detect Backend Framework

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

Is this correct?
```

---

### Step 2: Scan Route Definitions

Extract API endpoints from route files.

**Express Example**:

```typescript
// src/routes/auth.routes.ts
router.post("/api/auth/register", authController.register);
router.post("/api/auth/login", authController.login);
router.post("/api/auth/logout", authMiddleware, authController.logout);
```

**Extraction Pattern**:

- Method: `post`, `get`, `put`, `delete`, `patch`
- Path: `/api/auth/register`
- Middleware: `authMiddleware` (auth required)
- Handler: `authController.register`

**NestJS Example**:

```typescript
@Controller('api/auth')
export class AuthController {
  @Post('register')
  async register(@Body() dto: RegisterDto) { ... }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout() { ... }
}
```

**Extraction Pattern**:

- Controller path: `/api/auth`
- Method: `@Post('register')` → POST
- Route: `/api/auth/register`
- Guard: `@UseGuards(AuthGuard)` → auth required

**FastAPI Example**:

```python
@router.post("/api/auth/register")
async def register(user: UserCreate):
    ...

@router.post("/api/auth/logout", dependencies=[Depends(get_current_user)])
async def logout():
    ...
```

**Extraction Pattern**:

- Decorator: `@router.post`
- Path: `/api/auth/register`
- Dependency: `dependencies=[Depends(get_current_user)]` → auth required

---

### Step 3: Extract Endpoint Details

For each endpoint, extract:

1. **HTTP Method**: GET, POST, PUT, DELETE, PATCH
2. **Path**: `/api/auth/register`
3. **Path Parameters**: `:id` in `/api/users/:id`
4. **Query Parameters**: `?status=active&limit=10`
5. **Request Body Schema**: DTO or schema
6. **Response Schema**: Return type
7. **Authentication Required**: Yes/No
8. **Authorization**: Required roles
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
  const { email, password, name } = req.body;
  const user = await authService.register(email, password, name);
  res.status(201).json(user);
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

**Extracted Documentation**:

````markdown
### POST /api/auth/register

**Description**: Register a new user account

**Authentication**: None (public endpoint)

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```
````

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

- `400 Bad Request`: Validation failed
- `409 Conflict`: Email already exists

````

---

### Step 4: Group Endpoints into Categories

Organize by logical grouping:
1. By Resource: Users, Products, Orders
2. By Feature: Authentication, Task Management
3. By Route Prefix: `/api/auth/*`, `/api/tasks/*`

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

---

## Task Management APIs

### GET /api/tasks
**Description**: List all tasks (paginated)
**Authentication**: Required (JWT)

### POST /api/tasks
**Description**: Create new task
**Authentication**: Required (JWT)
````

---

### Step 5: Generate OpenAPI Specification (Optional)

Generate OpenAPI 3.0 specification:

```yaml
openapi: 3.0.0
info:
  title: {{project_name}} API
  version: {{api_version}}
servers:
  - url: https://api.example.com
    description: Production

security:
  - bearerAuth: []

paths:
  /api/auth/register:
    post:
      summary: Register new user
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                name:
                  type: string
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
```

Save to `docs/api-contracts.yaml`

---

### Step 6: Validate Frontend API Calls (Optional)

If frontend repositories exist, validate their API calls.

**Step 6.1: Scan Frontend API Service Files**

```bash
grep -r "apiClient\." src/services/ | grep -E "get|post|put|delete"
```

**Extracted Frontend Calls**:

```typescript
apiClient.post("/api/auth/register", data);
apiClient.post("/api/auth/login", data);
apiClient.get("/api/tasks", { params });
apiClient.post("/api/tasks", data);
```

**Step 6.2: Cross-Reference with Backend APIs**

```markdown
### API Alignment Validation

**Backend APIs Provided** (11 endpoints):

1. ✅ POST /api/auth/register
2. ✅ POST /api/auth/login
3. ⚠️ POST /api/auth/refresh (not consumed by frontend)
4. ✅ GET /api/tasks
5. ✅ POST /api/tasks

**Frontend APIs Consumed** (4 endpoints):

1. ✅ POST /api/auth/register → Backend provides ✓
2. ✅ POST /api/auth/login → Backend provides ✓
3. ✅ GET /api/tasks → Backend provides ✓
4. ✅ POST /api/tasks → Backend provides ✓

**Validation Result**: ✅ 100% Alignment (4/4 calls have backend endpoints)

**Unused Backend APIs** (1):

- POST /api/auth/refresh (may be used by mobile)
```

---

### Step 7: Generate API Contracts Document

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

Total Endpoints: {{endpoint_count}}
Authentication: JWT (Bearer token)

---

## Authentication

All authenticated endpoints require JWT access token:
```

Authorization: Bearer <access_token>

````

Token Acquisition: `POST /api/auth/login`
Token Lifetime: 15 minutes
Token Refresh: `POST /api/auth/refresh`

---

## API Endpoints

[Include all endpoint documentation from Steps 3-4]

---

## Data Models

[Include schema definitions]

---

## Error Responses

Standard error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2025-01-14T10:30:00Z",
    "request_id": "uuid"
  }
}
````

**Common Error Codes**:

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid/missing auth token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Rate Limiting

- Authentication Endpoints: 10 requests/minute per IP
- General Endpoints: 100 requests/minute per user

---

## Appendix

**Extraction Date**: {{date}}
**Backend Framework**: {{framework}}
**Extraction Method**: Code analysis

```

---

### Step 8: Output Handoff

```

✅ API CONTRACTS EXTRACTED

📄 Generated Documents:

- docs/api-contracts.md ({{line_count}} lines)
  {{#if openapi_generated}}
- docs/api-contracts.yaml (OpenAPI 3.0)
  {{/if}}

📊 **Extraction Summary**:

**Total Endpoints**: {{endpoint_count}}
**API Categories**: {{category_count}}

- {{category_1}}: {{count_1}} endpoints
- {{category_2}}: {{count_2}} endpoints

**Authentication**:

- Public endpoints: {{public_count}}
- Authenticated endpoints: {{auth_count}}
- Admin-only endpoints: {{admin_count}}

{{#if frontend_validation}}
**Frontend Validation**:

- Frontend API calls: {{frontend_call_count}}
- Alignment: {{alignment_percent}}% ({{aligned_count}}/{{frontend_call_count}})
  {{/if}}

---

📋 **NEXT STEPS**:

1. Review API Contracts
2. Share with Frontend Team
3. Update System Architecture (if exists)
4. Consider API Improvements
5. Keep Contracts Updated

🎉 **API contracts are now documented!**

```

---

## Error Handling

**If backend framework cannot be detected**:
```

⚠️ WARNING: Could not detect backend framework

Please specify:

1. Framework (Express, NestJS, FastAPI, etc.)
2. Routes location (e.g., src/routes)

Or provide guidance on finding endpoints in your codebase.

```

## Related Tasks

- **Prerequisites**: None
- **Related**: `aggregate-system-architecture.md`
- **Follow-up**: Update system-architecture.md
```
