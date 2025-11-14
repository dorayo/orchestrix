# Multi-Repository Architecture Design

**Version**: 1.0.0
**Date**: 2025-01-14
**Status**: Design Proposal

## 🎯 Executive Summary

This design introduces multi-repository support for Orchestrix, enabling frontend-backend separation and multi-platform development (Backend + Web + iOS + Android) while maintaining the core workflow integrity.

**Key Innovation**: Dual-layer architecture separating Planning (Product repository) from Development (Implementation repositories).

**Expected Impact**:

- ✅ Support independent Backend/Frontend/Mobile repositories
- ✅ Centralized product planning and documentation
- ✅ API-first development with contract validation
- ✅ Cross-repository story dependency tracking
- ✅ 100% backward compatible with monorepo projects

---

## 📐 Architecture Overview

### Current Architecture (Monorepo Only)

```
my-project/                    # Single repository
├── docs/
│   ├── prd.md
│   ├── architecture/
│   └── stories/               # All stories in one place
├── backend/                   # Backend code
├── frontend/                  # Frontend code
└── .orchestrix/               # All agents installed
```

**Limitations**:

- Cannot handle separate Git repositories
- No API contract management
- Single Dev agent assumes full-stack capability
- Epic/Story management assumes single codebase

### New Architecture (Multi-Repo Support)

```
my-product/                    # Product Repository (Planning Only)
├── docs/
│   ├── project-brief.md
│   ├── prd.md
│   ├── front-end-spec.md
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── backend-architecture.md
│   │   ├── frontend-architecture.md
│   │   ├── mobile-architecture.md
│   │   └── api-contracts.md        # ✅ NEW: API contracts
│   └── epics/
│       ├── epic-1.yaml             # ✅ NEW: Cross-repo story mapping
│       └── epic-2.yaml
└── .orchestrix/
    └── config.yaml                 # Planning Team only

my-product-backend/            # Implementation Repository (Backend)
├── docs/
│   ├── architecture/          # Symlinks to Product repo
│   └── stories/
│       └── 1.1-backend-user-api/
├── src/                       # Java/Node.js code
└── .orchestrix/
    └── config.yaml            # Dev Team only (Backend-specialized)

my-product-web/                # Implementation Repository (Frontend)
├── docs/
│   ├── architecture/          # Symlinks to Product repo
│   └── stories/
│       └── 1.2-frontend-login/
├── src/                       # React/Vue code
└── .orchestrix/
    └── config.yaml            # Dev Team only (Frontend-specialized)

my-product-ios/                # Implementation Repository (iOS)
my-product-android/            # Implementation Repository (Android)
```

**Key Concepts**:

- **Product Repository**: Planning Team workspace, no code
- **Implementation Repository**: Dev Team workspace, code + stories
- **API Contracts**: Single source of truth for frontend-backend integration
- **Epic Cross-Repo Mapping**: YAML files defining stories across repositories

---

## 🏗️ Three-Stage Implementation Plan

### Stage 1: Foundation (MVP)

**Goal**: Enable basic multi-repo workflow with minimal automation.

**Capabilities**:

1. Project type configuration (product-planning, backend, frontend, ios, android, monolith)
2. Product repository reference from implementation repos
3. API contracts template and basic validation
4. Epic cross-repo story mapping format
5. Manual dependency checking (developers check dependencies)

**Non-Goals**:

- Automatic dependency detection
- Contract-first development
- Advanced API validation

### Stage 2: Automation

**Goal**: Automate cross-repo coordination and dependency tracking.

**Capabilities**:

1. SM auto-filters stories by repository
2. Automatic cross-repo dependency checking
3. Architect validates API contracts automatically
4. Story status synchronization across repos
5. Cross-repo dependency status dashboard

### Stage 3: Advanced Features

**Goal**: API-first development and comprehensive contract validation.

**Capabilities**:

1. Contract-first development workflow
2. API contract change impact analysis
3. Automatic contract validation in CI/CD
4. Cross-repo integration test orchestration
5. Multi-repo story dashboard with dependency graph
6. API versioning and backward compatibility checks

---

## 📋 Detailed Design: Stage 1 (MVP)

### 1.1 Project Type Configuration

#### File: `orchestrix-core/core-config.yaml`

**Add new `project` section**:

```yaml
project:
  name: my-ecommerce-backend

  # ✅ NEW: Project type
  type: monolith # Options: monolith | product-planning | backend | frontend | ios | android | flutter | react-native

  # ✅ NEW: For implementation repos, reference to product repo
  product_repo:
    enabled: false # Set to true for implementation repos
    path: ../my-product # Relative or absolute path to product repo

  # ✅ NEW: Repository identification
  repository_id: my-ecommerce-backend # Unique ID for this repo

  # ✅ NEW: Story filtering (for SM agent)
  story_assignment:
    auto_filter: false # Stage 1: Manual, Stage 2: Auto
    assigned_stories: [] # Empty = all stories, or specific IDs like [1.1, 1.4, 2.1]

# Existing fields remain unchanged
version: "1.0.0"
name: "My Project"

document_locations:
  prd: docs/prd.md # Default for monolith/product-planning
  architecture: docs/architecture # Default for monolith/product-planning


  # ✅ NEW: For implementation repos, can reference product repo
  # Will be dynamically resolved based on product_repo.enabled
  # If product_repo.enabled = true:
  #   prd: ${product_repo.path}/docs/prd.md
  #   architecture: ${product_repo.path}/docs/architecture
```

#### File: `tools/installer/lib/config-loader.js`

**Add product repo resolution logic**:

```javascript
function resolveDocumentPaths(config) {
  if (config.project?.product_repo?.enabled) {
    const productPath = config.project.product_repo.path;

    return {
      ...config,
      document_locations: {
        prd: path.join(productPath, "docs/prd.md"),
        architecture: path.join(productPath, "docs/architecture"),
        api_contracts: path.join(productPath, "docs/architecture/api-contracts.md"),
        epics: path.join(productPath, "docs/epics"),
        // Local paths for stories
        devStoryLocation: config.document_locations.devStoryLocation || "docs/stories",
      },
    };
  }

  return config;
}
```

---

### 1.2 API Contracts Template

#### File: `orchestrix-core/templates/api-contracts-tmpl.yaml` (NEW)

````yaml
name: API Contracts
description: Frontend-Backend API契约定义文档模板
version: "1.0.0"

template: |
  # API Contracts

  **Version**: {{version}}
  **Last Updated**: {{date}}
  **Status**: {{status}}

  ## 1. Overview

  This document defines the API contracts between backend and frontend/mobile clients.

  **Principles**:
  - RESTful design
  - JSON request/response
  - JWT authentication
  - Versioned APIs (v1, v2)

  ## 2. Authentication APIs

  ### POST /api/auth/login

  **Description**: User login with email and password.

  **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
````

**Request Schema**:

```yaml
type: object
required: [email, password]
properties:
  email:
    type: string
    format: email
    example: user@example.com
  password:
    type: string
    minLength: 8
    example: SecurePass123
```

**Response (200 OK)**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-14T10:00:00Z"
  }
}
```

**Response Schema**:

```yaml
type: object
properties:
  token:
    type: string
    description: JWT access token
  user:
    $ref: "#/components/schemas/User"
```

**Error Responses**:

- **401 Unauthorized**:

  ```json
  {
    "error": "Invalid credentials",
    "code": "AUTH_INVALID_CREDENTIALS"
  }
  ```

- **400 Bad Request**:
  ```json
  {
    "error": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format"
    }
  }
  ```

**Security**:

- Rate limiting: 5 requests per minute per IP
- Password must be hashed with bcrypt (backend)
- HTTPS only in production

**Frontend Implementation Notes**:

- Store token in localStorage (Web) or Keychain (iOS) or SharedPreferences (Android)
- Include token in Authorization header for authenticated requests: `Authorization: Bearer <token>`

**Backend Implementation Notes**:

- Validate email format before database query
- Use constant-time comparison for password verification
- Return 401 for both invalid email and invalid password (prevent user enumeration)

---

### POST /api/auth/register

[Similar detailed format...]

---

## 3. User Management APIs

### GET /api/users/:id

[Detailed format...]

### PUT /api/users/:id

[Detailed format...]

---

## 4. Components Schemas

### User

```yaml
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
    created_at:
      type: string
      format: date-time
    updated_at:
      type: string
      format: date-time
```

---

## 5. Error Codes Reference

| Code                     | HTTP Status | Description               |
| ------------------------ | ----------- | ------------------------- |
| AUTH_INVALID_CREDENTIALS | 401         | Invalid email or password |
| AUTH_TOKEN_EXPIRED       | 401         | JWT token has expired     |
| VALIDATION_ERROR         | 400         | Request validation failed |
| NOT_FOUND                | 404         | Resource not found        |
| INTERNAL_ERROR           | 500         | Internal server error     |

---

## 6. Change Log

| Date     | Version     | Changes               | Author    |
| -------- | ----------- | --------------------- | --------- |
| {{date}} | {{version}} | Initial API contracts | Architect |

````

#### File: `orchestrix-core/tasks/pm-create-prd.md`

**Add section to remind Architect to create api-contracts.md**:

```markdown
## Step 6: Handoff to Architect

**Important Notes for Architect**:
- If project involves frontend-backend separation, create `architecture/api-contracts.md`
- Use template: `{root}/templates/api-contracts-tmpl.yaml`
- Define all API endpoints that frontend will consume
````

---

### 1.3 Epic Cross-Repo Story Mapping

#### File: `orchestrix-core/data/epic-story-mapping-schema.yaml` (NEW)

```yaml
# Epic Cross-Repo Story Mapping Schema
# Defines the format for epic YAML files in product repository

schema_version: "1.0.0"

epic:
  type: object
  required: [epic_id, title, description, stories]
  properties:
    epic_id:
      type: integer
      description: Unique epic identifier (1, 2, 3...)

    title:
      type: string
      description: Short epic title
      example: "User Authentication"

    description:
      type: string
      description: Detailed epic description

    target_repositories:
      type: array
      description: List of repositories involved in this epic
      items:
        type: string
        enum: [backend, frontend, ios, android, flutter, react-native]
      example: [backend, frontend, ios]

    stories:
      type: array
      description: List of stories in this epic
      items:
        type: object
        required: [id, title, repository, repository_type]
        properties:
          id:
            type: string
            description: Story ID (epic.story format)
            pattern: "^\\d+\\.\\d+$"
            example: "1.1"

          title:
            type: string
            description: Story title
            example: "Backend - User Registration API"

          repository:
            type: string
            description: Repository name where this story will be implemented
            example: "my-product-backend"

          repository_type:
            type: string
            enum: [backend, frontend, ios, android, flutter, react-native]
            description: Type of repository

          dependencies:
            type: array
            description: Story IDs this story depends on (must be completed first)
            items:
              type: string
              pattern: "^\\d+\\.\\d+$"
            example: ["1.1"]

          api_contracts:
            type: array
            description: API endpoints this story provides or consumes
            items:
              type: string
            example: ["POST /api/users", "POST /api/auth/login"]

          provides_apis:
            type: array
            description: APIs this story implements (for backend stories)
            items:
              type: string
            example: ["POST /api/users"]

          consumes_apis:
            type: array
            description: APIs this story consumes (for frontend/mobile stories)
            items:
              type: string
            example: ["POST /api/auth/login"]

          deliverables:
            type: array
            description: Expected deliverables for this story
            items:
              type: string
            example:
              - "User model and database schema"
              - "Registration endpoint with validation"
              - "Unit tests for user service"

          acceptance_criteria_summary:
            type: string
            description: Brief summary of key acceptance criteria

          estimated_complexity:
            type: string
            enum: [simple, medium, complex]
            description: Estimated story complexity

          priority:
            type: string
            enum: [P0, P1, P2, P3]
            description: Story priority

example_epic:
  epic_id: 1
  title: "User Authentication"
  description: |
    Implement complete user authentication system across all platforms.
    Users can register, login, and logout. Backend provides JWT-based auth.

  target_repositories: [backend, frontend, ios, android]

  stories:
    - id: "1.1"
      title: "Backend - User Registration and Login API"
      repository: "my-product-backend"
      repository_type: backend
      dependencies: []
      provides_apis:
        - "POST /api/users"
        - "POST /api/auth/login"
        - "POST /api/auth/logout"
      consumes_apis: []
      deliverables:
        - "User model and database migration"
        - "Registration endpoint with email validation"
        - "Login endpoint with JWT generation"
        - "Logout endpoint with token invalidation"
        - "Unit tests (>80% coverage)"
        - "Integration tests for auth flow"
      acceptance_criteria_summary: |
        User can register with email/password, login to get JWT token,
        and logout to invalidate token. All endpoints follow api-contracts.md.
      estimated_complexity: medium
      priority: P0

    - id: "1.2"
      title: "Frontend - Login and Registration UI"
      repository: "my-product-web"
      repository_type: frontend
      dependencies: ["1.1"] # Must wait for backend API
      provides_apis: []
      consumes_apis:
        - "POST /api/users"
        - "POST /api/auth/login"
      deliverables:
        - "Login page component with form validation"
        - "Registration page component"
        - "JWT token storage in localStorage"
        - "Auth context provider for React"
        - "Unit tests for components"
        - "E2E tests for login/registration flow"
      acceptance_criteria_summary: |
        User can access login page, enter credentials, and be redirected
        to dashboard on success. Registration form validates inputs.
      estimated_complexity: medium
      priority: P0

    - id: "1.3"
      title: "iOS - Login and Registration Screens"
      repository: "my-product-ios"
      repository_type: ios
      dependencies: ["1.1"]
      provides_apis: []
      consumes_apis:
        - "POST /api/users"
        - "POST /api/auth/login"
      deliverables:
        - "LoginViewController with form validation"
        - "RegisterViewController"
        - "JWT storage in Keychain"
        - "AuthService for API calls"
        - "Unit tests for ViewModels"
        - "UI tests for login flow"
      acceptance_criteria_summary: |
        iOS user can login and register using native UI. Token stored securely.
      estimated_complexity: medium
      priority: P1

    - id: "1.4"
      title: "Android - Login and Registration Screens"
      repository: "my-product-android"
      repository_type: android
      dependencies: ["1.1"]
      provides_apis: []
      consumes_apis:
        - "POST /api/users"
        - "POST /api/auth/login"
      deliverables:
        - "LoginActivity with form validation"
        - "RegisterActivity"
        - "JWT storage in SharedPreferences"
        - "AuthRepository for API calls"
        - "Unit tests for ViewModels"
        - "Instrumented tests for login flow"
      acceptance_criteria_summary: |
        Android user can login and register using Material Design UI.
      estimated_complexity: medium
      priority: P1
```

#### Example: `my-product/docs/epics/epic-1-user-auth.yaml`

```yaml
epic_id: 1
title: "User Authentication"
description: |
  Implement complete user authentication system across all platforms.
  Users can register with email/password, login to receive JWT token,
  and logout to invalidate session.

target_repositories: [my-product-backend, my-product-web, my-product-ios, my-product-android]

stories:
  - id: "1.1"
    title: "Backend - User Registration and Login API"
    repository: "my-product-backend"
    repository_type: backend
    dependencies: []
    provides_apis:
      - "POST /api/users"
      - "POST /api/auth/login"
      - "POST /api/auth/logout"
    deliverables:
      - "User model and database migration"
      - "Registration endpoint with email validation"
      - "Login endpoint with JWT generation"
      - "Logout endpoint with token invalidation"
      - "Unit tests (>80% coverage)"
    priority: P0

  - id: "1.2"
    title: "Frontend - Login and Registration UI"
    repository: "my-product-web"
    repository_type: frontend
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/users"
      - "POST /api/auth/login"
    deliverables:
      - "Login page with form validation"
      - "Registration page"
      - "Auth context provider"
      - "E2E tests for auth flow"
    priority: P0

  - id: "1.3"
    title: "iOS - Login Screen"
    repository: "my-product-ios"
    repository_type: ios
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/auth/login"
    deliverables:
      - "LoginViewController"
      - "Keychain JWT storage"
      - "UI tests"
    priority: P1

  - id: "1.4"
    title: "Android - Login Screen"
    repository: "my-product-android"
    repository_type: android
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/auth/login"
    deliverables:
      - "LoginActivity"
      - "SharedPreferences JWT storage"
      - "Instrumented tests"
    priority: P1
```

---

### 1.4 PO Agent Changes (Epic Sharding)

#### File: `orchestrix-core/agents/po.src.yaml`

**Update `shard-documents` command**:

```yaml
commands:
  - name: shard-documents
    syntax: "*shard-documents"
    description: "Shard PRD into Epics with cross-repo story mapping"
    task: tasks/po-shard-documents.md
    context:
      - Load project type from core-config.yaml
      - If type = product-planning: Create epic YAML files with cross-repo mapping
      - If type = monolith: Use existing single-repo epic format
      - Reference: data/epic-story-mapping-schema.yaml
```

#### File: `orchestrix-core/tasks/po-shard-documents.md`

**Add multi-repo logic**:

````markdown
## 2. Identify Project Type and Repositories

**Read `core-config.yaml`**:

```yaml
project:
  type: product-planning | monolith | backend | frontend | ...
```
````

**If `type = product-planning`** (Multi-repo mode):

1. **Identify target repositories** from architecture documents:
   - Read `architecture/system-architecture.md`
   - Extract repository list (e.g., backend, frontend, ios, android)

2. **For each Epic**:
   - Identify which repositories are involved
   - Create story assignments per repository
   - Define cross-repo dependencies

3. **Create Epic YAML file**:
   - Path: `docs/epics/epic-{N}-{slug}.yaml`
   - Format: Follow `{root}/data/epic-story-mapping-schema.yaml`
   - Include:
     - `epic_id`, `title`, `description`
     - `target_repositories` list
     - `stories` array with:
       - `id` (e.g., "1.1", "1.2")
       - `repository` (which repo this story belongs to)
       - `repository_type` (backend, frontend, ios, android)
       - `dependencies` (story IDs this depends on)
       - `provides_apis` (for backend stories)
       - `consumes_apis` (for frontend/mobile stories)
       - `deliverables`
       - `priority`

**Example**:

```yaml
epic_id: 1
title: "User Authentication"
target_repositories: [my-product-backend, my-product-web, my-product-ios]
stories:
  - id: "1.1"
    title: "Backend - User API"
    repository: "my-product-backend"
    repository_type: backend
    dependencies: []
    provides_apis: ["POST /api/users", "POST /api/auth/login"]

  - id: "1.2"
    title: "Frontend - Login UI"
    repository: "my-product-web"
    repository_type: frontend
    dependencies: ["1.1"] # ← Depends on backend story
    consumes_apis: ["POST /api/auth/login"]
```

**If `type = monolith`** (Single-repo mode):

- Use existing process (no changes)
- Create epic markdown files in `docs/epics/`

## 3. API Contract Mapping

For multi-repo mode:

1. **Load `architecture/api-contracts.md`**
2. **For each Story that provides APIs** (backend stories):
   - Extract API endpoint definitions from api-contracts.md
   - Add to story's `provides_apis` list
3. **For each Story that consumes APIs** (frontend/mobile):
   - Identify which APIs from api-contracts.md this story uses
   - Add to story's `consumes_apis` list
   - Add backend story providing that API to `dependencies`

## 4. Validation

**Cross-Repo Dependency Validation**:

- ✅ All `dependencies` must reference valid story IDs in the same epic
- ✅ No circular dependencies (1.2 → 1.1 → 1.2)
- ✅ Backend stories (API providers) should have no dependencies on frontend stories
- ✅ All `consumes_apis` must match `provides_apis` from dependency stories

**API Contract Validation**:

- ✅ All APIs in `provides_apis` must exist in api-contracts.md
- ✅ All APIs in `consumes_apis` must exist in api-contracts.md

**Repository Validation**:

- ✅ All `repository` values must match actual repository names
- ✅ `repository_type` must match repository's actual type

## 5. Outputs

### Multi-Repo Mode

**Create Epic YAML files**:

- Path: `docs/epics/epic-{N}-{slug}.yaml`
- One file per epic
- Contains cross-repo story mapping

### Monolith Mode

**Create Epic Markdown files** (existing behavior):

- Path: `docs/epics/epic-{N}-{slug}.md`
- Contains story list for single repository

## 6. Handoff

**Multi-Repo Mode**:

```
✅ EPIC SHARDING COMPLETE (Multi-Repo)
Created {N} epics with cross-repo story mapping

Epic files: docs/epics/epic-*.yaml
Total stories: {count}
Repositories involved: {repo_list}

📋 Next: SM agents in each repository create assigned stories
- Backend repo: Stories {list}
- Frontend repo: Stories {list}
- iOS repo: Stories {list}

⚠️ NOTE: Frontend/mobile stories depend on backend stories.
Ensure backend stories complete first!
```

**Monolith Mode**:

```
✅ EPIC SHARDING COMPLETE
Created {N} epics

🎯 HANDOFF TO SM:
*create-next-story
```

````

---

### 1.5 SM Agent Changes (Story Creation with Repo Awareness)

#### File: `orchestrix-core/agents/sm.src.yaml`

**Add repository awareness**:

```yaml
agent:
  id: sm
  name: Scrum Master
  persona: |
    You are the Scrum Master responsible for creating and managing user stories
    in this repository.

    **Multi-Repo Awareness**:
    - Check project type from core-config.yaml
    - If in implementation repo (backend/frontend/ios/android):
      * Only create stories assigned to this repository
      * Check cross-repo dependencies before creating stories
      * Reference product repo for Epic definitions and API contracts
    - If in monolith repo:
      * Create all stories (existing behavior)

commands:
  - name: create-next-story
    syntax: "*create-next-story"
    task: tasks/sm-create-story.md
    context:
      - Check project.type from core-config.yaml
      - Load epic definitions from product repo (if multi-repo)
      - Filter stories by repository assignment
      - Check cross-repo dependencies (Stage 1: Manual reminder, Stage 2: Auto-check)
````

#### File: `orchestrix-core/tasks/sm-create-story.md`

**Add multi-repo logic at the beginning**:

````markdown
## 0. Repository Type Detection

**Read `core-config.yaml`**:

```yaml
project:
  type: monolith | backend | frontend | ios | android | product-planning
  repository_id: my-product-backend
  product_repo:
    enabled: true
    path: ../my-product
```
````

**Determine mode**:

- If `type = monolith`: Use existing single-repo logic
- If `type = product-planning`: ERROR - Cannot create stories in product repo
- If `type ∈ {backend, frontend, ios, android}`: **Multi-repo mode** ✅

---

## 1. Load Epic Definitions (Multi-Repo Mode)

**Step 1.1: Load Epic YAML files**

```bash
# Path to product repo epics
PRODUCT_REPO=${project.product_repo.path}
EPICS_DIR=${PRODUCT_REPO}/docs/epics

# Load all epic-*.yaml files
for epic_file in ${EPICS_DIR}/epic-*.yaml; do
  parse_yaml $epic_file
done
```

**Step 1.2: Filter Stories for Current Repository**

```javascript
// Filter stories where repository matches current repo
const currentRepoId = config.project.repository_id; // e.g., "my-product-backend"

const myStories = allStories.filter((story) => story.repository === currentRepoId);

// Example result for backend repo:
// [
//   { id: "1.1", title: "Backend - User API", repository: "my-product-backend" },
//   { id: "2.1", title: "Backend - Product API", repository: "my-product-backend" }
// ]
```

**Step 1.3: Identify Next Story to Create**

```javascript
// Find lowest story ID not yet created
const existingStories = listFilesInDirectory("docs/stories/");
const existingIds = existingStories.map((file) => extractStoryId(file));

const nextStory = myStories
  .filter((story) => !existingIds.includes(story.id))
  .sort((a, b) => compareStoryId(a.id, b.id))[0];

if (!nextStory) {
  console.log("✅ All stories for this repository have been created!");
  exit(0);
}
```

---

## 2. Check Cross-Repo Dependencies (Stage 1: Manual)

**For the next story to create**:

```yaml
# Example: Story 1.2 in frontend repo
id: "1.2"
title: "Frontend - Login UI"
dependencies: ["1.1"] # Depends on backend story
```

**Stage 1 (Manual Checking)**:

1. **Identify dependencies**:
   - Story 1.2 depends on Story 1.1
   - Story 1.1 is in `my-product-backend` repository

2. **Display warning to user**:

   ```
   ⚠️ CROSS-REPO DEPENDENCY DETECTED

   Story 1.2 "Frontend - Login UI" depends on:
   - Story 1.1 "Backend - User API" (Repository: my-product-backend)

   ❗ MANUAL ACTION REQUIRED:
   Before starting Story 1.2, verify that Story 1.1 is complete:

   1. Navigate to backend repository: ../my-product-backend
   2. Check story status: docs/stories/1.1-*/story.md
   3. Verify Status = Done

   If Story 1.1 is not Done, DO NOT create Story 1.2 yet.

   Continue creating Story 1.2? (Manual verification required)
   ```

3. **User confirms** (or agent assumes user has verified)

4. **Proceed with story creation** (existing logic)

**Stage 2 (Automatic Checking)** - See Stage 2 design below

---

## 3. Load Story Template from Epic

**Multi-Repo Mode**:

```javascript
// Story definition from epic YAML
const storyDef = {
  id: "1.1",
  title: "Backend - User Registration and Login API",
  repository: "my-product-backend",
  repository_type: "backend",
  provides_apis: ["POST /api/users", "POST /api/auth/login"],
  deliverables: [
    "User model and database migration",
    "Registration endpoint",
    "Login endpoint with JWT",
    "Unit tests (>80% coverage)",
  ],
  priority: "P0",
};

// Use this to pre-fill story template
const storyContent = renderTemplate("story-tmpl.yaml", {
  story_id: storyDef.id,
  title: storyDef.title,
  deliverables: storyDef.deliverables,
  priority: storyDef.priority,
  // Additional context
  api_contracts_ref: `${product_repo}/docs/architecture/api-contracts.md`,
  provides_apis: storyDef.provides_apis,
});
```

**Add to Story file**:

```markdown
## Multi-Repo Context

- **Repository**: {{repository}}
- **Repository Type**: {{repository_type}}
- **Epic**: {{epic_id}} - {{epic_title}}

{{#if provides_apis}}

### APIs Provided by This Story

{{#each provides_apis}}

- `{{this}}` - See [API Contracts]({{api_contracts_path}})
  {{/each}}
  {{/if}}

{{#if consumes_apis}}

### APIs Consumed by This Story

{{#each consumes_apis}}

- `{{this}}` - Defined in [API Contracts]({{api_contracts_path}})
  {{/each}}
  {{/if}}

{{#if dependencies}}

### Cross-Repo Dependencies

This story depends on the following stories being completed first:
{{#each dependencies}}

- Story {{this}} (Repository: {{lookup ../dependency_repos this}})
  {{/each}}
  {{/if}}
```

---

## 4. Rest of Story Creation

**Proceed with existing logic**:

- Technical Preferences extraction
- Structure validation
- Quality assessment
- Architect review routing
- etc.

**No changes needed** - multi-repo logic only affects story loading and dependency checking.

---

## Backward Compatibility

**Monolith Mode** (type = monolith):

- ✅ NO CHANGES to existing behavior
- Epic files remain markdown format
- No cross-repo dependencies
- SM creates all stories sequentially

````

---

### 1.6 Architect Agent Changes (API Contract Validation)

#### File: `orchestrix-core/tasks/architect-review-story.md`

**Add API contract validation section**:

```markdown
## Architecture Context Loading

```yaml
architecture_loading:
  base_documents:
    - docs/architecture/tech-stack.md
    - docs/architecture/source-tree.md
    - docs/architecture/coding-standards.md
    - docs/architecture/testing-strategy.md

  # ✅ NEW: Load API contracts for multi-repo projects
  multi_repo_additional:
    - docs/architecture/api-contracts.md  # From product repo
````

---

## Technical Validation Engine

**Add API contract validation**:

```yaml
validation_engine:
  # ... existing validations ...

  # ✅ NEW: API Contract Compliance (for multi-repo)
  api_contract_compliance:
    enabled_for: [backend, frontend, ios, android]  # Not for monolith

    for_backend_stories:
      - Load story's `provides_apis` list from epic YAML
      - For each API endpoint (e.g., "POST /api/users"):
        * Verify endpoint exists in api-contracts.md
        * Validate implementation matches contract:
          - Request schema matches
          - Response schema matches
          - Error codes match
          - Security requirements met (auth, rate limiting)
      - If mismatches found:
        * Record as Major Issue with specific details
        * Lower api_design_score by 1 point

    for_frontend_mobile_stories:
      - Load story's `consumes_apis` list from epic YAML
      - For each API endpoint consumed:
        * Verify endpoint exists in api-contracts.md
        * Validate frontend code matches contract:
          - Request payload structure correct
          - Response handling covers all cases (success + errors)
          - Error handling for all documented error codes
        * Verify dependency story (backend) is completed:
          - Load dependency story status
          - If status != Done: Record as Critical Issue
      - If mismatches found:
        * Record as Major Issue
        * Lower integration_score by 1 point
```

**Add to review process** (after existing validations):

````markdown
## API Contract Validation (Multi-Repo Only)

**Check if multi-repo mode**:

```yaml
project:
  type: backend | frontend | ios | android # Multi-repo
```
````

If multi-repo mode AND story has `provides_apis` or `consumes_apis`:

### For Backend Stories (provides_apis)

**Step 1: Load API Contracts**

```bash
API_CONTRACTS=${product_repo.path}/docs/architecture/api-contracts.md
```

**Step 2: Validate Each Provided API**

For each API in `provides_apis` (e.g., "POST /api/users"):

1. **Verify API exists in api-contracts.md**:
   - Search for section matching the endpoint
   - If not found: **Critical Issue** - "API endpoint not documented in api-contracts.md"

2. **Validate Request Schema**:
   - Load request schema from api-contracts.md
   - Check story's implementation code (if exists) or Dev Notes
   - Verify all required fields are present
   - Verify field types match
   - If mismatch: **Major Issue** - "Request schema does not match api-contracts.md"

3. **Validate Response Schema**:
   - Load success response schema from api-contracts.md
   - Check implementation or Dev Notes
   - Verify response structure matches
   - If mismatch: **Major Issue** - "Response schema does not match api-contracts.md"

4. **Validate Error Handling**:
   - Load error responses from api-contracts.md
   - Verify story mentions handling all documented error cases
   - If missing: **Major Issue** - "Error handling incomplete (missing {error_code})"

5. **Validate Security Requirements**:
   - Check if api-contracts.md specifies auth requirements
   - Verify story mentions authentication implementation
   - Check rate limiting if specified
   - If missing: **Critical Issue** - "Security requirements not addressed"

**Example Issue**:

````markdown
### Major Issue: Response Schema Mismatch

**Location**: Dev Notes - Technical Approach

**Problem**:
Story plans to return:

```json
{
  "userId": "123",
  "userEmail": "user@example.com"
}
```
````

But api-contracts.md specifies:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "timestamp"
}
```

**Missing fields**: `id` (should be UUID not number), `created_at`
**Extra fields**: `userId`, `userEmail` (wrong naming)

**Recommendation**:
Update story to follow exact schema from api-contracts.md Section 2.1.
Use `id` (UUID) instead of `userId` (number).
Add `created_at` timestamp field.

````

---

### For Frontend/Mobile Stories (consumes_apis)

**Step 1: Validate API Consumption**

For each API in `consumes_apis`:

1. **Verify API exists in api-contracts.md**
2. **Check Request Payload**:
   - Verify story mentions sending correct request structure
   - If mismatch: **Major Issue**

3. **Check Response Handling**:
   - Verify story mentions handling success response
   - Verify story mentions handling all error codes
   - If incomplete: **Major Issue** - "Incomplete error handling"

**Step 2: Validate Cross-Repo Dependencies**

```javascript
// Load story dependencies from epic YAML
const dependencies = story.dependencies;  // e.g., ["1.1"]

for (const depId of dependencies) {
  // Find dependency story's repository
  const depStory = findStoryInEpic(depId);
  const depRepo = depStory.repository;

  // Check if dependency is in different repository
  if (depRepo !== currentRepo) {
    // Cross-repo dependency detected

    // Stage 1: Add as note/reminder
    addNote(`Cross-repo dependency: Story ${depId} in ${depRepo}`);
    addNote(`⚠️ Verify Story ${depId} is completed before starting this story`);

    // Stage 2: Auto-check (see Stage 2 design)
  }
}
````

**Example Issue for Frontend Story**:

```markdown
### Major Issue: Incomplete Error Handling

**Location**: Acceptance Criteria

**Problem**:
Story only mentions handling success case (200 OK).

API contract specifies error responses:

- 401 Unauthorized (invalid credentials)
- 400 Bad Request (validation errors)
- 500 Internal Server Error

**Missing**:

- No mention of displaying error messages to user
- No handling of 401 (should redirect to login)
- No handling of 400 (should show validation errors)

**Recommendation**:
Add acceptance criteria:

- AC4: Display validation errors from 400 response
- AC5: Redirect to login page on 401 response
- AC6: Show generic error message on 500 response
```

---

## Scoring Impact

**API Contract Compliance** (new sub-score for multi-repo):

```yaml
api_contract_compliance_score:
  weight: 1 point (added to 10-point scale → now 11 points total for multi-repo)

  calculation:
    - All APIs match contracts: 1 point
    - Minor mismatches (naming): 0.5 points
    - Major mismatches (missing fields, wrong types): 0 points

  thresholds:
    - For multi-repo stories: Minimum 8/11 to pass (≈73%)
    - For monolith stories: Existing 7/10 threshold (70%)
```

**Update scoring section**:

```markdown
## Quality Scoring System

**For Multi-Repo Projects** (11-point scale):

1. Tech stack compliance (1pt)
2. Naming convention adherence (1pt)
3. Project structure alignment (1pt)
4. API design consistency (1pt)
5. Data model accuracy (1pt)
6. Architecture pattern compliance (1pt)
7. Complete dependency mapping (1pt)
8. Integration feasibility (1pt)
9. Accurate documentation references (1pt)
10. Overall implementation feasibility (1pt)
11. **API contract compliance** (1pt) ✅ NEW

**Passing threshold**: ≥8/11 for multi-repo, ≥7/10 for monolith

**For Monolith Projects** (10-point scale):

- Existing scoring (no API contract validation)
- Passing threshold: ≥7/10
```

````

---

## 📋 Detailed Design: Stage 2 (Automation)

### 2.1 Automatic Cross-Repo Dependency Checking

#### File: `orchestrix-core/tasks/utils/check-cross-repo-dependencies.md` (NEW)

```markdown
# Check Cross-Repo Dependencies

## Purpose

Automatically verify that all cross-repository dependencies for a story are completed before allowing story creation or development to proceed.

## Inputs

```yaml
required:
  - story_id: 'Story ID to check (e.g., 1.2)'
  - epic_file: 'Path to epic YAML file'
  - product_repo_path: 'Path to product repository'
````

## Process

### 1. Load Story Definition

```javascript
// Load epic YAML file
const epic = loadYaml(epicFile);

// Find story by ID
const story = epic.stories.find((s) => s.id === storyId);

if (!story.dependencies || story.dependencies.length === 0) {
  return { result: "PASS", message: "No dependencies" };
}
```

### 2. Check Each Dependency

```javascript
const results = [];

for (const depId of story.dependencies) {
  // Find dependency story definition
  const depStory = epic.stories.find((s) => s.id === depId);

  // Determine dependency repository path
  const depRepoPath = resolveRepositoryPath(depStory.repository);

  // Load dependency story status
  const depStoryFile = findStoryFile(depRepoPath, depId);

  if (!depStoryFile) {
    results.push({
      dependency: depId,
      status: "NOT_CREATED",
      repository: depStory.repository,
      pass: false,
    });
    continue;
  }

  // Extract status from dependency story
  const depStatus = extractStatusFromStory(depStoryFile);

  results.push({
    dependency: depId,
    status: depStatus,
    repository: depStory.repository,
    pass: depStatus === "Done",
  });
}
```

### 3. Determine Overall Result

```javascript
const allPassed = results.every((r) => r.pass);

if (allPassed) {
  return {
    result: "PASS",
    message: "All dependencies completed",
    details: results,
  };
} else {
  const failedDeps = results.filter((r) => !r.pass);

  return {
    result: "HALT",
    message: `Cannot proceed: ${failedDeps.length} dependencies not complete`,
    failed_dependencies: failedDeps,
    details: results,
  };
}
```

## Outputs

### Output 1: Dependency Check Result

```yaml
result: PASS | HALT
message: "Description of result"
details:
  - dependency: "1.1"
    status: "Done"
    repository: "my-product-backend"
    pass: true
  - dependency: "2.3"
    status: "InProgress"
    repository: "my-product-backend"
    pass: false
```

### Output 2: User Message (if HALT)

```
❌ DEPENDENCY CHECK FAILED

Cannot create/start Story {{story_id}} because the following dependencies are not complete:

📋 Dependency Status:
- Story 1.1 (my-product-backend): ✅ Done
- Story 2.3 (my-product-backend): ❌ InProgress (Not ready)

⚠️ ACTION REQUIRED:
Wait for Story 2.3 to be completed before starting Story {{story_id}}.

Check status: {{dep_repo_path}}/docs/stories/{{dep_id}}/story.md
```

## Helper Functions

### resolveRepositoryPath()

```javascript
function resolveRepositoryPath(repositoryId) {
  // Option 1: Use configured repository mapping
  const repoMap = loadConfig("core-config.yaml").repository_mapping;
  if (repoMap && repoMap[repositoryId]) {
    return repoMap[repositoryId].path;
  }

  // Option 2: Assume sibling directory (common setup)
  const currentRepoPath = process.cwd();
  const parentDir = path.dirname(currentRepoPath);
  return path.join(parentDir, repositoryId);
}
```

### findStoryFile()

```javascript
function findStoryFile(repoPath, storyId) {
  const storiesDir = path.join(repoPath, "docs/stories");

  // Search for directory matching pattern: {storyId}-*
  const dirs = fs.readdirSync(storiesDir);
  const storyDir = dirs.find((d) => d.startsWith(`${storyId}-`));

  if (!storyDir) return null;

  // Find story.md file
  return path.join(storiesDir, storyDir, "story.md");
}
```

### extractStatusFromStory()

```javascript
function extractStatusFromStory(storyFile) {
  const content = fs.readFileSync(storyFile, "utf8");

  // Extract Status field (YAML frontmatter or markdown section)
  const statusMatch = content.match(/^Status:\s*(.+)$/m);

  return statusMatch ? statusMatch[1].trim() : "Unknown";
}
```

## Integration Points

### Called From: `tasks/sm-create-story.md`

````markdown
## 2. Check Cross-Repo Dependencies (Stage 2)

Execute: `tasks/utils/check-cross-repo-dependencies.md`

**Input**:

```yaml
story_id: {{next_story.id}}
epic_file: {{product_repo}}/docs/epics/epic-{{epic_id}}.yaml
product_repo_path: {{product_repo.path}}
```
````

**If result = HALT**:

- Display dependency status to user
- HALT story creation
- Exit with message: "Complete dependencies first"

**If result = PASS**:

- Proceed with story creation

````

### Called From: `tasks/implement-story.md`

```markdown
## 0. Pre-Development Dependency Check (Stage 2)

Before starting development:

Execute: `tasks/utils/check-cross-repo-dependencies.md`

**If result = HALT**:
- Display dependency status
- HALT development
- Message: "Cannot start development until dependencies are Done"

**If result = PASS**:
- Proceed with development
````

## Configuration

### File: `orchestrix-core/core-config.yaml`

**Add repository mapping** (optional):

```yaml
# Stage 2: Repository mapping for dependency resolution
repository_mapping:
  my-product-backend:
    path: ../my-product-backend
    type: backend

  my-product-web:
    path: ../my-product-web
    type: frontend

  my-product-ios:
    path: ../my-product-ios
    type: ios

  my-product-android:
    path: ../my-product-android
    type: android

# Alternative: Auto-resolve from sibling directories
repository_auto_resolve: true # Default: true
```

````

---

### 2.2 SM Auto-Filter Stories

#### File: `orchestrix-core/tasks/sm-create-story.md`

**Update filtering logic**:

```markdown
## 1. Load Epic Definitions and Filter Stories

**Stage 2: Automatic Filtering**

```yaml
# core-config.yaml
project:
  repository_id: my-product-backend
  story_assignment:
    auto_filter: true  # ✅ Enable auto-filtering
````

**If `auto_filter = true`**:

```javascript
// Automatic filtering (Stage 2)
const currentRepoId = config.project.repository_id;

// Load all epics
const epics = loadAllEpics(`${productRepo}/docs/epics/`);

// Extract all stories
const allStories = epics.flatMap((epic) => epic.stories);

// Filter for current repository
const myStories = allStories.filter((story) => story.repository === currentRepoId);

console.log(`Found ${myStories.length} stories assigned to ${currentRepoId}`);

// Identify next story to create
const existingStories = listExistingStories("docs/stories/");
const nextStory = findNextStoryToCreate(myStories, existingStories);

if (!nextStory) {
  console.log("✅ All stories for this repository completed!");
  exit(0);
}
```

**If `auto_filter = false`** (Stage 1):

```javascript
// Manual mode (Stage 1)
const allStories = loadAllStories();

// Display all stories, let user choose
console.log("Stories assigned to other repositories:");
allStories
  .filter((s) => s.repository !== currentRepoId)
  .forEach((s) => console.log(`  - ${s.id}: ${s.title} (${s.repository})`));

console.log("\nStories assigned to this repository:");
const myStories = allStories.filter((s) => s.repository === currentRepoId);
myStories.forEach((s) => console.log(`  - ${s.id}: ${s.title}`));

// Proceed with manual selection or next available
```

````

---

### 2.3 Story Status Synchronization

#### File: `orchestrix-core/data/story-status-sync.yaml` (NEW)

```yaml
# Story Status Synchronization Configuration
# Enables cross-repo visibility of story status

schema_version: "1.0.0"

description: |
  When a story status changes, update a central status registry
  so other repositories can query dependency status.

status_registry:
  enabled: true  # Stage 2: Enable sync

  # Option 1: Product repo as central registry
  location: ${product_repo.path}/docs/story-status-registry.yaml

  # Option 2: Shared database (Stage 3)
  # database_url: postgresql://...

sync_triggers:
  - on_status_change:
      from: any
      to: any
      action: update_registry

  - on_story_complete:
      status: Done
      action: notify_dependent_stories

registry_format:
  schema:
    stories:
      type: array
      items:
        story_id: string
        repository: string
        status: enum [Blocked, AwaitingArchReview, RequiresRevision, AwaitingTestDesign, Approved, InProgress, Review, Done, Escalated]
        last_updated: datetime
        epic_id: integer

example_registry:
  stories:
    - story_id: "1.1"
      repository: my-product-backend
      status: Done
      last_updated: "2025-01-14T10:30:00Z"
      epic_id: 1

    - story_id: "1.2"
      repository: my-product-web
      status: InProgress
      last_updated: "2025-01-14T11:00:00Z"
      epic_id: 1

    - story_id: "1.3"
      repository: my-product-ios
      status: Blocked
      last_updated: "2025-01-14T09:00:00Z"
      epic_id: 1
      blocked_reason: "Waiting for Story 1.1 completion"
````

#### File: `orchestrix-core/tasks/utils/sync-story-status.md` (NEW)

````markdown
# Sync Story Status to Registry

## Purpose

Update central story status registry when story status changes.

## Inputs

```yaml
required:
  - story_id: "1.1"
  - new_status: "Done"
  - repository: "my-product-backend"
```
````

## Process

### 1. Load Registry

```javascript
const registryPath = `${productRepo}/docs/story-status-registry.yaml`;

let registry = loadYaml(registryPath);

if (!registry.stories) {
  registry.stories = [];
}
```

### 2. Update or Insert Story Status

```javascript
const existingIndex = registry.stories.findIndex((s) => s.story_id === storyId && s.repository === repository);

const statusEntry = {
  story_id: storyId,
  repository: repository,
  status: newStatus,
  last_updated: new Date().toISOString(),
  epic_id: extractEpicId(storyId), // e.g., "1.1" → epic 1
};

if (existingIndex >= 0) {
  registry.stories[existingIndex] = statusEntry;
} else {
  registry.stories.push(statusEntry);
}
```

### 3. Save Registry

```javascript
saveYaml(registryPath, registry);
```

### 4. Notify Dependent Stories (if status = Done)

```javascript
if (newStatus === "Done") {
  // Find stories that depend on this story
  const epics = loadAllEpics(`${productRepo}/docs/epics/`);
  const dependentStories = findStoriesDependingOn(epics, storyId);

  // Update their status (if Blocked due to this dependency)
  for (const depStory of dependentStories) {
    if (allDependenciesCompleted(depStory)) {
      // Optionally update status from Blocked → Approved
      // Or just log that dependency is now ready
      console.log(`✅ Story ${depStory.id} dependency ready: ${storyId} is Done`);
    }
  }
}
```

## Integration

**Call from all tasks that update story status**:

### In `qa-review-story.md`:

````markdown
## Completion Step 6: Update Story Status

**Update Status field** AND **Sync to registry**:

```bash
# Update story status
sed -i 's/^Status: .*/Status: Done/' story.md

# Sync to central registry
execute: tasks/utils/sync-story-status.md
  story_id: {{story_id}}
  new_status: Done
  repository: {{project.repository_id}}
```
````

````

### In `sm-create-story.md`:

```markdown
## After Story Creation

**Sync initial status to registry**:

```bash
execute: tasks/utils/sync-story-status.md
  story_id: {{story_id}}
  new_status: AwaitingArchReview
  repository: {{project.repository_id}}
````

````

---

## 📋 Detailed Design: Stage 3 (Advanced Features)

### 3.1 Contract-First Development Workflow

**Concept**: Define API contracts BEFORE creating stories, enforce contract immutability.

#### File: `orchestrix-core/workflows/contract-first-workflow.md` (NEW)

```markdown
# Contract-First Development Workflow

## Overview

In contract-first development, API contracts are defined and locked before any story implementation begins. This ensures frontend and backend teams can work in parallel without integration issues.

## Workflow Steps

### Phase 1: Contract Definition (Architect)

**Step 1: Architect creates api-contracts.md**

After system architecture is complete:

1. Architect defines ALL API endpoints for the entire project
2. Each endpoint includes:
   - Request schema (required fields, types, validation rules)
   - Response schema (success + all error cases)
   - Security requirements
   - Examples
3. **Lock contract version**: Set `version: 1.0.0` and `status: locked`

**Step 2: Contract Review by PM and Frontend Architect**

- PM validates endpoints match PRD requirements
- Frontend Architect validates endpoints meet frontend needs
- Any changes trigger contract revision

**Step 3: Contract Approval**

- Status changes to `approved`
- **Contract becomes immutable** for current version
- Any breaking changes require version bump (2.0.0)

### Phase 2: Parallel Development

**Backend Team**:
- Creates stories implementing API endpoints
- **MUST follow exact contract** (validated by Architect review)
- Cannot change request/response schemas

**Frontend Team**:
- Creates stories consuming API endpoints
- **Can start immediately** (mock API responses from contract)
- Uses contract schemas for TypeScript interfaces / data models

**Mobile Teams**:
- Same as frontend (parallel development with mocks)

### Phase 3: Contract Validation (CI/CD)

**Automated contract tests**:
- Backend: API tests validate responses match contract schemas
- Frontend: Integration tests use contract as source of truth
- Contract validation tool compares actual API responses to contract

### Phase 4: Contract Evolution

**Non-breaking changes** (minor version bump 1.0.0 → 1.1.0):
- Adding new optional fields
- Adding new endpoints
- Adding new error codes

**Breaking changes** (major version bump 1.0.0 → 2.0.0):
- Removing fields
- Changing field types
- Renaming fields
- Changing required/optional status

## Benefits

1. **Parallel Development**: Frontend and backend don't block each other
2. **No Integration Surprises**: Contract is the truth, both sides implement to it
3. **Testability**: Frontend can mock API from contract
4. **Documentation**: Contract serves as API documentation
````

#### File: `orchestrix-core/tasks/architect-lock-api-contract.md` (NEW)

````markdown
# Lock API Contract (Contract-First)

## Purpose

Lock API contract to prevent changes during development phase.

## Inputs

```yaml
required:
  - contract_file: "docs/architecture/api-contracts.md"
```
````

## Process

### 1. Validate Contract Completeness

Check that contract includes:

- ✅ All endpoints from PRD requirements
- ✅ Request/response schemas for each endpoint
- ✅ Error responses
- ✅ Security requirements
- ✅ Examples

If incomplete: HALT with message listing missing sections

### 2. Set Contract Version and Status

```yaml
# Add to contract frontmatter
version: "1.0.0"
status: locked
locked_date: "2025-01-14T10:00:00Z"
locked_by: Architect
```

### 3. Generate Contract Hash

```bash
# Create SHA256 hash of contract content
CONTRACT_HASH=$(sha256sum api-contracts.md | awk '{print $1}')

# Store hash for integrity checking
echo "contract_hash: $CONTRACT_HASH" >> contract-metadata.yaml
```

### 4. Create Contract Changelog

```markdown
## Contract Changelog

### Version 1.0.0 (2025-01-14)

**Status**: Locked

**Endpoints**:

- POST /api/users
- POST /api/auth/login
- GET /api/users/:id
- PUT /api/users/:id

**Locked for development**: Stories can now be created implementing this contract.

**Change Policy**:

- Breaking changes require new major version (2.0.0)
- Non-breaking additions allowed in minor versions (1.1.0)
```

### 5. Notify Teams

```
✅ API CONTRACT LOCKED

Version: 1.0.0
File: docs/architecture/api-contracts.md
Hash: {{contract_hash}}

📋 Contract includes {{endpoint_count}} endpoints

🚀 Development can now proceed:
- Backend: Implement endpoints per contract
- Frontend/Mobile: Use contract for mocks and interfaces

⚠️ Contract is now immutable for v1.0.0
Breaking changes require version 2.0.0
```

## Outputs

- Contract metadata file with version, status, hash
- Contract changelog
- Notification to teams

````

---

### 3.2 API Contract Change Impact Analysis

#### File: `orchestrix-core/tasks/architect-analyze-contract-changes.md` (NEW)

```markdown
# Analyze API Contract Changes

## Purpose

When API contract needs to change, analyze impact on existing stories and code.

## Inputs

```yaml
required:
  - old_contract_file: 'docs/architecture/api-contracts-v1.0.0.md'
  - new_contract_file: 'docs/architecture/api-contracts-v2.0.0-draft.md'
````

## Process

### 1. Parse Both Contracts

```javascript
const oldContract = parseContract(oldContractFile);
const newContract = parseContract(newContractFile);
```

### 2. Detect Changes

```javascript
const changes = {
  added_endpoints: [],
  removed_endpoints: [],
  modified_endpoints: [],
};

// Detect added endpoints
for (const endpoint of newContract.endpoints) {
  if (!oldContract.endpoints.find((e) => e.path === endpoint.path && e.method === endpoint.method)) {
    changes.added_endpoints.push(endpoint);
  }
}

// Detect removed endpoints
for (const endpoint of oldContract.endpoints) {
  if (!newContract.endpoints.find((e) => e.path === endpoint.path && e.method === endpoint.method)) {
    changes.removed_endpoints.push(endpoint);
  }
}

// Detect modified endpoints
for (const newEp of newContract.endpoints) {
  const oldEp = oldContract.endpoints.find((e) => e.path === newEp.path && e.method === newEp.method);

  if (oldEp && hasSchemaChanges(oldEp, newEp)) {
    const modifications = detectSchemaChanges(oldEp, newEp);
    changes.modified_endpoints.push({
      endpoint: newEp,
      modifications: modifications,
    });
  }
}
```

### 3. Classify Changes (Breaking vs Non-Breaking)

```javascript
function classifyChange(modification) {
  // Breaking changes
  if (modification.type === "field_removed") return "BREAKING";
  if (modification.type === "field_type_changed") return "BREAKING";
  if (modification.type === "field_made_required") return "BREAKING";
  if (modification.type === "endpoint_removed") return "BREAKING";

  // Non-breaking changes
  if (modification.type === "field_added_optional") return "NON_BREAKING";
  if (modification.type === "field_made_optional") return "NON_BREAKING";
  if (modification.type === "endpoint_added") return "NON_BREAKING";

  return "UNKNOWN";
}
```

### 4. Find Affected Stories

```javascript
// Load all stories across all repositories
const allStories = loadAllStoriesFromAllRepos();

const affectedStories = [];

for (const change of changes.modified_endpoints) {
  const endpoint = `${change.endpoint.method} ${change.endpoint.path}`;

  // Find stories that provide this API (backend)
  const providers = allStories.filter((s) => s.provides_apis && s.provides_apis.includes(endpoint));

  // Find stories that consume this API (frontend/mobile)
  const consumers = allStories.filter((s) => s.consumes_apis && s.consumes_apis.includes(endpoint));

  affectedStories.push({
    endpoint: endpoint,
    change: change.modifications,
    breaking: classifyChange(change.modifications[0]) === "BREAKING",
    provider_stories: providers,
    consumer_stories: consumers,
  });
}
```

### 5. Generate Impact Report

```markdown
# API Contract Change Impact Report

**Old Version**: 1.0.0
**New Version**: 2.0.0 (draft)
**Analysis Date**: {{date}}

## Summary

- **Added Endpoints**: {{added_count}}
- **Removed Endpoints**: {{removed_count}}
- **Modified Endpoints**: {{modified_count}}
- **Breaking Changes**: {{breaking_count}}
- **Affected Stories**: {{affected_story_count}}

---

## Breaking Changes (Require Code Updates)

### 1. POST /api/users - Field Type Changed

**Change**:

- Field `id` changed from `string` to `number`

**Classification**: BREAKING

**Affected Stories**:

**Providers** (Backend):

- Story 1.1 "Backend - User API" (my-product-backend)
  - Action Required: Change User model `id` field type
  - Files: `models/User.java`, `migrations/001_users.sql`

**Consumers** (Frontend/Mobile):

- Story 1.2 "Frontend - User Management" (my-product-web)
  - Action Required: Update TypeScript interface `User.id: number`
  - Files: `types/User.ts`, `components/UserProfile.tsx`
- Story 1.3 "iOS - User Profile" (my-product-ios)
  - Action Required: Update User model `id` property type
  - Files: `Models/User.swift`

---

### 2. DELETE /api/users/:id - Endpoint Removed

**Change**: Endpoint deleted

**Classification**: BREAKING

**Affected Stories**:

**Providers**:

- Story 2.5 "Backend - User Deletion" (my-product-backend)
  - Action Required: Remove endpoint or migrate to new design

**Consumers**:

- Story 3.2 "Frontend - Admin Dashboard" (my-product-web)
  - Action Required: Remove delete user functionality or use new endpoint
  - Files: `components/AdminUserList.tsx`

---

## Non-Breaking Changes (Optional Updates)

### 1. POST /api/users - Added Optional Field

**Change**:

- Added optional field `phone_number` (string)

**Classification**: NON-BREAKING

**Affected Stories**:

**Providers**:

- Story 1.1 "Backend - User API" (my-product-backend)
  - Action: Optionally support new field in future iteration

**Consumers**:

- No immediate action required
- Can use new field in future stories

---

## Recommendations

### Option 1: Create Version 2.0.0 (Breaking)

- Implement all changes (breaking + non-breaking)
- Create migration plan for affected stories
- Update all {{breaking_count}} stories

**Timeline**: 2-3 sprints

### Option 2: Create Version 1.1.0 (Non-Breaking Only)

- Implement only non-breaking changes
- Defer breaking changes to later version
- Update {{non_breaking_count}} stories

**Timeline**: 1 sprint

### Option 3: Keep Version 1.0.0 (No Changes)

- Reject proposed changes
- Keep existing contract

**Timeline**: 0 sprints
```

## Outputs

- Impact report markdown file
- List of affected stories with action items
- Recommendation for version strategy

````

---

### 3.3 Cross-Repo Integration Test Orchestration

#### File: `orchestrix-core/data/integration-test-config.yaml` (NEW)

```yaml
# Cross-Repo Integration Test Configuration
# Defines how to orchestrate integration tests across repositories

schema_version: "1.0.0"

description: |
  For epics spanning multiple repositories, integration tests verify
  that frontend/mobile correctly integrate with backend APIs.

integration_test_suites:
  - name: "Epic 1 Integration Tests"
    epic_id: 1
    description: "End-to-end tests for User Authentication across all platforms"

    repositories:
      backend:
        name: my-product-backend
        setup:
          - command: "docker-compose up -d database"
          - command: "npm run migrate"
          - command: "npm run seed:test-data"
          - command: "npm start"
        health_check:
          url: "http://localhost:3000/health"
          timeout: 30

      frontend:
        name: my-product-web
        setup:
          - command: "npm install"
          - command: "npm run build"
          - command: "BACKEND_URL=http://localhost:3000 npm run test:e2e"
        depends_on: [backend]

      ios:
        name: my-product-ios
        setup:
          - command: "pod install"
          - command: "BACKEND_URL=http://localhost:3000 xcodebuild test"
        depends_on: [backend]

    test_scenarios:
      - name: "User Registration Flow"
        description: "User registers on frontend, backend creates user, iOS can login"
        steps:
          - repository: frontend
            action: "Fill registration form and submit"
            expected: "User created, redirected to dashboard"

          - repository: backend
            action: "Verify user in database"
            expected: "User record exists with correct data"

          - repository: ios
            action: "Login with new user credentials"
            expected: "Login successful, JWT received"

      - name: "API Contract Validation"
        description: "Verify all frontend/mobile API calls match backend contract"
        steps:
          - repository: frontend
            action: "Run contract tests"
            expected: "All API responses match contract schemas"

          - repository: ios
            action: "Run contract tests"
            expected: "All API responses match contract schemas"

orchestration:
  mode: "sequential"  # or "parallel" for independent tests

  on_failure:
    action: "stop_all"  # or "continue" to run remaining tests

  reporting:
    format: "junit"
    output: "integration-test-results.xml"
````

#### File: `orchestrix-core/tasks/qa-run-integration-tests.md` (NEW)

````markdown
# Run Cross-Repo Integration Tests

## Purpose

Execute integration tests across multiple repositories to validate epic completion.

## Inputs

```yaml
required:
  - epic_id: 1
  - test_config: "data/integration-test-config.yaml"
```
````

## Process

### 1. Load Test Configuration

```javascript
const config = loadYaml(testConfigFile);
const testSuite = config.integration_test_suites.find((s) => s.epic_id === epicId);

if (!testSuite) {
  console.log(`No integration tests defined for Epic ${epicId}`);
  exit(0);
}
```

### 2. Setup Test Environment

```javascript
const repos = testSuite.repositories;

// Resolve dependency order
const setupOrder = resolveDependencies(repos);

for (const repoName of setupOrder) {
  const repo = repos[repoName];

  console.log(`Setting up ${repoName}...`);

  // Execute setup commands
  for (const setupCmd of repo.setup) {
    execInRepo(repoName, setupCmd.command);
  }

  // Health check (if defined)
  if (repo.health_check) {
    waitForHealthCheck(repo.health_check.url, repo.health_check.timeout);
  }
}
```

### 3. Execute Test Scenarios

```javascript
const results = [];

for (const scenario of testSuite.test_scenarios) {
  console.log(`\nRunning: ${scenario.name}`);

  const scenarioResult = {
    name: scenario.name,
    steps: [],
    passed: true,
  };

  for (const step of scenario.steps) {
    console.log(`  - ${step.repository}: ${step.action}`);

    const result = executeTestStep(step.repository, step.action);

    const stepPassed = verifyExpected(result, step.expected);

    scenarioResult.steps.push({
      repository: step.repository,
      action: step.action,
      expected: step.expected,
      actual: result,
      passed: stepPassed,
    });

    if (!stepPassed) {
      scenarioResult.passed = false;

      if (testSuite.orchestration.on_failure === "stop_all") {
        break;
      }
    }
  }

  results.push(scenarioResult);
}
```

### 4. Generate Integration Test Report

````markdown
# Integration Test Report

**Epic**: {{epic_id}} - {{epic_title}}
**Date**: {{date}}
**Duration**: {{duration}}

## Summary

- **Total Scenarios**: {{total}}
- **Passed**: {{passed}}
- **Failed**: {{failed}}
- **Success Rate**: {{success_rate}}%

---

## Scenario Results

### ✅ PASS: User Registration Flow

1. **Frontend** - Fill registration form and submit
   - Expected: User created, redirected to dashboard
   - Actual: ✅ User created, redirect to /dashboard
   - Status: PASS

2. **Backend** - Verify user in database
   - Expected: User record exists with correct data
   - Actual: ✅ User found: {id: 123, email: test@example.com}
   - Status: PASS

3. **iOS** - Login with new user credentials
   - Expected: Login successful, JWT received
   - Actual: ✅ JWT token received, length: 256
   - Status: PASS

---

### ❌ FAIL: API Contract Validation

1. **Frontend** - Run contract tests
   - Expected: All API responses match contract schemas
   - Actual: ❌ 2 contract violations found:
     - POST /api/users response missing `created_at` field
     - GET /api/users/:id returns `userId` instead of `id`
   - Status: FAIL

**Issue**: Backend implementation does not match api-contracts.md

**Action Required**: Update Story 1.1 (Backend) to fix contract violations

---

## Failed Scenarios Details

### API Contract Validation

**Root Cause**: Backend Story 1.1 implementation diverged from contract

**Contract Expected** (api-contracts.md):

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2025-01-14T10:00:00Z"
}
```
````

**Actual Backend Response**:

```json
{
  "userId": 123,
  "email": "user@example.com"
}
```

**Recommendation**:

- QA should escalate to Dev (Backend)
- Update backend to match contract exactly
- Re-run integration tests after fix

---

## Overall Result

**Status**: ❌ FAIL

Epic 1 integration tests failed due to API contract violations.
Cannot mark Epic as complete until issues are resolved.

```

## Outputs

- Integration test report (markdown)
- JUnit XML format report (for CI/CD)
- List of issues to address
```

---

### 3.4 Multi-Repo Story Dashboard

#### File: `orchestrix-core/tools/multi-repo-dashboard.js` (NEW)

```javascript
#!/usr/bin/env node

/**
 * Multi-Repo Story Dashboard
 *
 * Generates a visual dashboard showing story status across all repositories
 * with dependency graph visualization.
 *
 * Usage:
 *   node tools/multi-repo-dashboard.js
 *   node tools/multi-repo-dashboard.js --epic 1
 *   node tools/multi-repo-dashboard.js --format html
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

function loadConfig() {
  const configPath = path.join(process.cwd(), "orchestrix-core/core-config.yaml");
  return yaml.load(fs.readFileSync(configPath, "utf8"));
}

function loadAllEpics(productRepoPath) {
  const epicsDir = path.join(productRepoPath, "docs/epics");
  const files = fs.readdirSync(epicsDir).filter((f) => f.endsWith(".yaml"));

  return files.map((file) => {
    const content = fs.readFileSync(path.join(epicsDir, file), "utf8");
    return yaml.load(content);
  });
}

function loadStoryStatusRegistry(productRepoPath) {
  const registryPath = path.join(productRepoPath, "docs/story-status-registry.yaml");

  if (!fs.existsSync(registryPath)) {
    return { stories: [] };
  }

  return yaml.load(fs.readFileSync(registryPath, "utf8"));
}

function generateDashboard(epics, statusRegistry, options = {}) {
  const { epic_filter, format = "text" } = options;

  let filteredEpics = epics;
  if (epic_filter) {
    filteredEpics = epics.filter((e) => e.epic_id === parseInt(epic_filter));
  }

  if (format === "html") {
    return generateHTMLDashboard(filteredEpics, statusRegistry);
  } else {
    return generateTextDashboard(filteredEpics, statusRegistry);
  }
}

function generateTextDashboard(epics, statusRegistry) {
  let output = "";

  output += "╔════════════════════════════════════════════════════════════════╗\n";
  output += "║         MULTI-REPO STORY DASHBOARD                             ║\n";
  output += "╚════════════════════════════════════════════════════════════════╝\n\n";

  for (const epic of epics) {
    output += `Epic ${epic.epic_id}: ${epic.title}\n`;
    output += "─".repeat(70) + "\n\n";

    // Group stories by repository
    const byRepo = {};
    for (const story of epic.stories) {
      if (!byRepo[story.repository]) {
        byRepo[story.repository] = [];
      }
      byRepo[story.repository].push(story);
    }

    for (const [repo, stories] of Object.entries(byRepo)) {
      output += `  📦 ${repo}\n`;

      for (const story of stories) {
        const statusEntry = statusRegistry.stories.find(
          (s) => s.story_id === story.id && s.repository === story.repository
        );

        const status = statusEntry ? statusEntry.status : "Not Created";
        const statusIcon = getStatusIcon(status);

        output += `    ${statusIcon} ${story.id}: ${story.title}\n`;
        output += `       Status: ${status}`;

        if (story.dependencies && story.dependencies.length > 0) {
          output += ` | Depends on: ${story.dependencies.join(", ")}`;
        }

        output += "\n";
      }

      output += "\n";
    }

    // Dependency Graph
    output += "  Dependencies:\n";
    const dependencyGraph = buildDependencyGraph(epic.stories);
    output += visualizeDependencyGraph(dependencyGraph);

    output += "\n";
  }

  // Summary Statistics
  output += "\n";
  output += "╔════════════════════════════════════════════════════════════════╗\n";
  output += "║  SUMMARY                                                       ║\n";
  output += "╚════════════════════════════════════════════════════════════════╝\n\n";

  const stats = calculateStats(epics, statusRegistry);
  output += `  Total Epics: ${stats.total_epics}\n`;
  output += `  Total Stories: ${stats.total_stories}\n`;
  output += `  Completed: ${stats.completed} (${stats.completion_rate}%)\n`;
  output += `  In Progress: ${stats.in_progress}\n`;
  output += `  Not Started: ${stats.not_started}\n`;
  output += `  Blocked: ${stats.blocked}\n`;

  return output;
}

function getStatusIcon(status) {
  const icons = {
    Done: "✅",
    InProgress: "🔄",
    Review: "👀",
    Approved: "✔️ ",
    AwaitingArchReview: "⏳",
    RequiresRevision: "⚠️ ",
    Blocked: "🚫",
    "Not Created": "⬜",
  };

  return icons[status] || "❓";
}

function buildDependencyGraph(stories) {
  const graph = {};

  for (const story of stories) {
    graph[story.id] = {
      title: story.title,
      dependencies: story.dependencies || [],
    };
  }

  return graph;
}

function visualizeDependencyGraph(graph) {
  let output = "";

  for (const [storyId, node] of Object.entries(graph)) {
    if (node.dependencies.length === 0) {
      output += `    ${storyId} (no dependencies)\n`;
    } else {
      output += `    ${storyId} ← ${node.dependencies.join(", ")}\n`;
    }
  }

  return output;
}

function calculateStats(epics, statusRegistry) {
  const allStories = epics.flatMap((e) => e.stories);

  const stats = {
    total_epics: epics.length,
    total_stories: allStories.length,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    blocked: 0,
  };

  for (const story of allStories) {
    const statusEntry = statusRegistry.stories.find(
      (s) => s.story_id === story.id && s.repository === story.repository
    );

    const status = statusEntry ? statusEntry.status : "Not Created";

    if (status === "Done") stats.completed++;
    else if (status === "InProgress" || status === "Review") stats.in_progress++;
    else if (status === "Blocked") stats.blocked++;
    else stats.not_started++;
  }

  stats.completion_rate = Math.round((stats.completed / stats.total_stories) * 100);

  return stats;
}

function generateHTMLDashboard(epics, statusRegistry) {
  // HTML generation with interactive dependency graph
  // Using D3.js or Mermaid for visualization
  // (Implementation details omitted for brevity)

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Multi-Repo Story Dashboard</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    /* Dashboard CSS */
  </style>
</head>
<body>
  <h1>Multi-Repo Story Dashboard</h1>
  <!-- Interactive dashboard content -->
</body>
</html>
  `;
}

// Main execution
if (require.main === module) {
  const config = loadConfig();
  const productRepoPath = config.project.product_repo?.path || ".";

  const epics = loadAllEpics(productRepoPath);
  const statusRegistry = loadStoryStatusRegistry(productRepoPath);

  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--epic") {
      options.epic_filter = args[++i];
    } else if (args[i] === "--format") {
      options.format = args[++i];
    }
  }

  const dashboard = generateDashboard(epics, statusRegistry, options);

  console.log(dashboard);
}

module.exports = { generateDashboard };
```

---

## 📊 Backward Compatibility Analysis

### Impact on Monorepo Projects

**VERDICT**: ✅ **100% Backward Compatible** (No Breaking Changes)

### Compatibility Matrix

| Feature                 | Monolith Project           | Multi-Repo Project                      |
| ----------------------- | -------------------------- | --------------------------------------- |
| **Project Type**        | `type: monolith` (default) | `type: backend\|frontend\|...`          |
| **PRD Location**        | `docs/prd.md`              | Same (or `${product_repo}/docs/prd.md`) |
| **Epic Format**         | Markdown files             | YAML files (new)                        |
| **Story Creation**      | SM creates all stories     | SM filters by repository                |
| **API Contracts**       | Optional                   | Recommended                             |
| **Dependency Checking** | N/A                        | Cross-repo only                         |
| **Architect Review**    | Existing logic             | + API contract validation               |
| **Agent Installation**  | All agents                 | Planning Team OR Dev Team               |

### Configuration Defaults (Ensures Backward Compatibility)

```yaml
# orchestrix-core/core-config.yaml (defaults)

project:
  type: monolith # ✅ Default maintains existing behavior

  product_repo:
    enabled: false # ✅ Disabled by default

  story_assignment:
    auto_filter: false # ✅ Stage 1: Manual, no auto-filtering

# If type = monolith:
# - Epic files remain markdown format
# - No cross-repo dependency checking
# - SM creates all stories (existing behavior)
# - No API contract validation (unless manually enabled)
```

### Migration Path (Monolith → Multi-Repo)

**Step 1: Keep Existing Monolith**

- No changes needed
- Continue using current workflow

**Step 2: Split Repositories (Optional)**

1. Create product repo, copy `docs/` folder
2. Create backend repo, move `backend/` code
3. Create frontend repo, move `frontend/` code
4. Update `core-config.yaml` in each repo:
   ```yaml
   project:
     type: backend # or frontend
     product_repo:
       enabled: true
       path: ../my-product
   ```

**Step 3: Convert Epics to YAML (Optional)**

1. Run migration script: `node tools/migrate-epics-to-yaml.js`
2. Script converts epic markdown files to YAML format

**Step 4: Enable Multi-Repo Features**

1. Create `api-contracts.md` in product repo
2. Enable auto-filtering: `story_assignment.auto_filter: true`
3. Enable dependency checking (Stage 2)

### Testing Strategy for Backward Compatibility

```bash
# Test Suite 1: Monolith Project (Existing Behavior)
npm run test:monolith

# Test Suite 2: Multi-Repo Project (New Features)
npm run test:multi-repo

# Test Suite 3: Migration (Monolith → Multi-Repo)
npm run test:migration
```

---

## 🎯 Summary: File Modifications Required

### Stage 1 (MVP)

**Core Configuration**:

- ✅ `orchestrix-core/core-config.yaml` - Add project type, product repo reference
- ✅ `tools/installer/lib/config-loader.js` - Add product repo path resolution

**Templates**:

- ✅ NEW: `orchestrix-core/templates/api-contracts-tmpl.yaml`
- ✅ NEW: `orchestrix-core/data/epic-story-mapping-schema.yaml`

**Agent Changes**:

- ✅ `orchestrix-core/agents/po.src.yaml` - Update shard-documents command
- ✅ `orchestrix-core/agents/sm.src.yaml` - Add repository awareness

**Task Changes**:

- ✅ `orchestrix-core/tasks/po-shard-documents.md` - Add multi-repo epic creation logic
- ✅ `orchestrix-core/tasks/sm-create-story.md` - Add repo filtering and dependency warning
- ✅ `orchestrix-core/tasks/architect-review-story.md` - Add API contract validation
- ✅ `orchestrix-core/tasks/pm-create-prd.md` - Add API contract reminder

### Stage 2 (Automation)

**New Utilities**:

- ✅ NEW: `orchestrix-core/tasks/utils/check-cross-repo-dependencies.md`
- ✅ NEW: `orchestrix-core/tasks/utils/sync-story-status.md`
- ✅ NEW: `orchestrix-core/data/story-status-sync.yaml`

**Task Updates**:

- ✅ `orchestrix-core/tasks/sm-create-story.md` - Add auto-filtering logic
- ✅ `orchestrix-core/tasks/implement-story.md` - Add pre-dev dependency check
- ✅ `orchestrix-core/tasks/qa-review-story.md` - Add status sync after review

**Config Updates**:

- ✅ `orchestrix-core/core-config.yaml` - Add repository mapping, auto-filter toggle

### Stage 3 (Advanced)

**New Workflows**:

- ✅ NEW: `orchestrix-core/workflows/contract-first-workflow.md`

**New Tasks**:

- ✅ NEW: `orchestrix-core/tasks/architect-lock-api-contract.md`
- ✅ NEW: `orchestrix-core/tasks/architect-analyze-contract-changes.md`
- ✅ NEW: `orchestrix-core/tasks/qa-run-integration-tests.md`

**New Tools**:

- ✅ NEW: `orchestrix-core/tools/multi-repo-dashboard.js`

**New Data**:

- ✅ NEW: `orchestrix-core/data/integration-test-config.yaml`

---

## 📝 Total File Count

- **New Files**: 12
- **Modified Files**: 8
- **Total Affected Files**: 20

**Breakdown**:

- Core configs: 2 modified
- Templates: 2 new
- Agents: 2 modified
- Tasks: 4 modified, 6 new
- Utilities: 2 new
- Tools: 1 new
- Data/Schemas: 3 new
- Workflows: 1 new

---

**END OF DESIGN DOCUMENT**
