# PO - Shard Documents (Unified)

## Purpose

Automatically shard all configured documents:
1. **PRD → Epics**: Create epic YAML files (multi-repo) or epic MD files (monolith)
2. **Architecture** (if exists): Shard into section files for better context management

Uses `md-tree` CLI tool when available for fast, reliable sharding.

## Prerequisites

1. PRD document exists and is complete
2. Architecture documents exist (especially for multi-repo projects)
3. Core config file exists at `{root}/core-config.yaml`

## Task Instructions

### 0. Check md-tree Availability

**Detect `md-tree` command**:

```bash
if command -v md-tree &> /dev/null; then
  USE_MD_TREE=true
  echo "✅ md-tree available - using fast CLI tool for architecture sharding"
else
  USE_MD_TREE=false
  echo "⚠️ md-tree not found. Architecture sharding will be skipped."
  echo "📦 To enable: npm install -g @kayvan/markdown-tree-parser"
fi
```

---

### 1. Load Configuration and Detect Project Type

**Read `{root}/core-config.yaml`**:

```yaml
project:
  mode: single-repo | multi-repo
  multi_repo:
    role: product | backend | frontend | ios | android
```

**Determine mode**:
- If `mode = single-repo` OR `mode` not set: **MONOLITH MODE** → Use existing single-repo epic format
- If `mode = multi-repo` AND `role = product`: **MULTI-REPO MODE** → Create epic YAML files with cross-repo mapping
- If `mode = multi-repo` AND `role ∈ {backend, frontend, ios, android, mobile, shared, admin}`: **ERROR** → HALT with message below

**ERROR Message for Implementation Repositories**:
```
❌ CANNOT SHARD DOCUMENTS IN IMPLEMENTATION REPOSITORY

Current project mode: multi-repo
Repository role: {role}
Repository: {repository_id}

REASON: Document sharding must be performed in either:
- Product repository (mode: multi-repo, role: product) for multi-repo projects
- Monolith repository (mode: single-repo) for single-repo projects

ACTION: Navigate to the Product repository and run *shard there.

HALT: Cannot proceed in implementation repository
```

---

## MONOLITH MODE (Existing Behavior)

Use existing process - create epic markdown files in `docs/epics/`:

1. Read PRD
2. Identify major features/epics
3. Create epic markdown files (e.g., `epic-1-user-auth.md`)
4. Each epic contains stories in markdown format
5. Output: `docs/epics/epic-{N}-{slug}.md`

**HANDOFF**:
```
✅ EPIC SHARDING COMPLETE
Created {N} epics

🎯 HANDOFF TO SM:
*create-next-story
```

---

## MULTI-REPO MODE (New Behavior)

### 1. Load Required Documents

**Step 1.1: Read PRD**
- Path: `docs/prd.md` (or from config)
- Extract all features and requirements

**Step 1.2: Read Architecture Documents**
- Path: `docs/architecture/` (or from config)
- Key files:
  - `system-architecture.md` - Extract repository list
  - `api-contracts.md` - Extract API endpoints (if exists)

**Step 1.3: Identify Target Repositories**

From system architecture document, identify:
- Backend repository name (e.g., `my-product-backend`)
- Frontend repository name (e.g., `my-product-web`)
- Mobile repositories (e.g., `my-product-ios`, `my-product-android`)

Example extraction:
```
Found repositories:
- my-product-backend (type: backend)
- my-product-web (type: frontend)
- my-product-ios (type: ios)
```

### 2. Identify Epics and Stories

**Progress Feedback**:
```
🔍 STEP 2: Analyzing PRD for Epics and Stories...
📄 Reading: docs/prd.md
```

**Step 2.1: Identify Epics from PRD**

Parse PRD to identify major features that will become epics:
- User Authentication
- Product Management
- Shopping Cart
- Payment Processing
- etc.

Assign epic IDs sequentially (1, 2, 3...)

**Announce**:
```
✅ Found {N} epics in PRD:
  - Epic 1: {title}
  - Epic 2: {title}
  ...
```

**Step 2.2: For Each Epic, Break Down into Repository-Specific Stories**

For each epic, identify stories for each repository:

Example for "User Authentication" epic:
- **Backend story**: User Registration and Login API
- **Frontend story**: Login and Registration UI
- **iOS story**: Login Screen
- **Android story**: Login Screen

**Story ID format**: `{epic}.{story}` (e.g., `1.1`, `1.2`, `1.3`)

### 3. Define Cross-Repo Dependencies

**Step 3.1: Identify API Provider Stories (Backend)**

Backend stories typically have NO dependencies on other repos.

Mark these stories with:
- `dependencies: []`
- `provides_apis: ["POST /api/users", "POST /api/auth/login"]`

**Step 3.2: Identify API Consumer Stories (Frontend/Mobile)**

Frontend/mobile stories depend on backend stories providing the APIs.

Mark these stories with:
- `dependencies: ["1.1"]` (the backend story ID)
- `consumes_apis: ["POST /api/auth/login"]`

**Dependency Rules**:
- Frontend/mobile stories MUST depend on backend stories that provide the APIs they consume
- Backend stories should NOT depend on frontend/mobile stories
- Stories within the same epic can have dependencies

### 4. Map API Contracts (if api-contracts.md exists)

**Step 4.1: Load `docs/architecture/api-contracts.md`** (if exists)

**Step 4.2: For Backend Stories (API Providers)**:
- Extract API endpoints from api-contracts.md
- Add to story's `provides_apis` list
- Example: `["POST /api/users", "POST /api/auth/login"]`

**Step 4.3: For Frontend/Mobile Stories (API Consumers)**:
- Identify which APIs from api-contracts.md this story uses
- Add to story's `consumes_apis` list
- Add backend story providing that API to `dependencies`

**If api-contracts.md does NOT exist**:
- Infer APIs from PRD requirements
- Document inferred APIs in `provides_apis` and `consumes_apis`
- **RECOMMEND**: Suggest Architect create api-contracts.md before implementation

### 5. Define Deliverables for Each Story

For each story, define specific, measurable deliverables:

**Backend Story Deliverables**:
- Database models and migrations
- API endpoints implementation
- Business logic services
- Unit tests (>80% coverage)
- Integration tests
- API documentation

**Frontend Story Deliverables**:
- UI components
- State management (Redux/Context)
- API integration
- Form validation
- Unit tests
- E2E tests

**Mobile Story Deliverables**:
- ViewControllers/Activities/Screens
- API service layer
- Local storage (Keychain/SharedPreferences)
- ViewModel/Presenter
- Unit tests
- UI tests

### 6. Create Epic YAML Files

**Progress Feedback**:
```
🔍 STEP 6: Creating Epic YAML Files...
📁 Target directory: docs/epics/
```

**Step 6.1: Create Epic Directory**
- Path: `docs/epics/`
- Create if doesn't exist
- **Announce**: `✅ Epic directory ready: docs/epics/`

**Step 6.2: For Each Epic, Create YAML File**

**Progress Feedback** (for each epic):
```
📝 Creating Epic {N}/{total}: {epic_title}
   - Stories: {story_count}
   - Repositories: {repo_count}
   - Output: docs/epics/epic-{N}-{slug}.yaml
```

Filename: `docs/epics/epic-{N}-{slug}.yaml`

Example: `docs/epics/epic-1-user-auth.yaml`

**File Structure** (follow `{root}/data/epic-story-mapping-schema.yaml`):

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
    dependencies: ["1.1"]  # Must wait for backend API
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
    title: "iOS - Login Screen"
    repository: "my-product-ios"
    repository_type: ios
    dependencies: ["1.1"]
    provides_apis: []
    consumes_apis:
      - "POST /api/auth/login"
    deliverables:
      - "LoginViewController with form validation"
      - "Keychain JWT storage"
      - "AuthService for API calls"
      - "UI tests for login flow"
    acceptance_criteria_summary: |
      iOS user can login using native UI. Token stored securely.
    estimated_complexity: medium
    priority: P1

  - id: "1.4"
    title: "Android - Login Screen"
    repository: "my-product-android"
    repository_type: android
    dependencies: ["1.1"]
    provides_apis: []
    consumes_apis:
      - "POST /api/auth/login"
    deliverables:
      - "LoginActivity with form validation"
      - "SharedPreferences JWT storage"
      - "AuthRepository for API calls"
      - "Instrumented tests for login flow"
    acceptance_criteria_summary: |
      Android user can login using Material Design UI.
    estimated_complexity: medium
    priority: P1
```

### 7. Validate Epic YAML Files

**Step 7.1: Cross-Repo Dependency Validation**
- ✅ All `dependencies` must reference valid story IDs in the same epic
- ✅ No circular dependencies (1.2 → 1.1 → 1.2)
- ✅ Backend stories (API providers) should have no dependencies on frontend stories
- ✅ All `consumes_apis` must match `provides_apis` from dependency stories

**Step 7.2: API Contract Validation** (if api-contracts.md exists)
- ✅ All APIs in `provides_apis` must exist in api-contracts.md
- ✅ All APIs in `consumes_apis` must exist in api-contracts.md

**Step 7.3: Repository Validation**
- ✅ All `repository` values must match actual repository names from architecture
- ✅ `repository_type` must match repository's actual type

**If validation fails**:
- List all validation errors
- Ask user to fix or proceed with warnings

### 8. Output Summary

**Count Stories per Repository**:

Example:
```
Epic 1 - User Authentication:
- my-product-backend: 1 story (1.1)
- my-product-web: 1 story (1.2)
- my-product-ios: 1 story (1.3)
- my-product-android: 1 story (1.4)

Epic 2 - Product Management:
- my-product-backend: 2 stories (2.1, 2.2)
- my-product-web: 2 stories (2.3, 2.4)
...
```

### 9. Handoff Output

**Multi-Repo Mode**:
```
✅ EPIC SHARDING COMPLETE (Multi-Repo)
Created {N} epics with cross-repo story mapping

Epic files: docs/epics/epic-*.yaml
Total stories: {count}
Repositories involved: {repo_list}

📋 Story Distribution:
- {backend-repo}: Stories {list}
- {frontend-repo}: Stories {list}
- {ios-repo}: Stories {list}
- {android-repo}: Stories {list}

⚠️ IMPORTANT: Frontend/mobile stories depend on backend stories.
Ensure backend stories complete first!

📝 Next Steps:
1. Each repository team should use SM to create their assigned stories
2. Backend team starts first (no dependencies)
3. Frontend/mobile teams wait for backend stories marked "Done"

🎯 HANDOFF TO SM (per repository):
Each repository SM should run: *create-next-story
SM will automatically filter stories for that repository.
```

**Monolith Mode**:
```
✅ EPIC SHARDING COMPLETE
Created {N} epics

🎯 HANDOFF TO SM:
*create-next-story
```

---

## Important Notes

### Multi-Repo Best Practices

1. **Epic Scope**: Keep epics focused (3-7 stories per epic)
2. **Backend First**: Backend stories should have no dependencies
3. **Clear Naming**: Story titles should include repository context (e.g., "Backend - ", "Frontend - ")
4. **API Contracts**: Define all APIs in api-contracts.md before sharding
5. **Priority**: Use P0 for critical path, P1 for important, P2-P3 for nice-to-have
6. **Complexity**: Be realistic about complexity estimates

### Dependency Guidelines

- **Backend → Frontend/Mobile**: Valid (frontend depends on backend)
- **Frontend/Mobile → Backend**: Invalid (backend should not depend on frontend)
- **Frontend ↔ Frontend**: Valid (if needed)
- **Circular**: Invalid (detect and break cycles)

### Validation Checklist

Before completing:
- [ ] All epics have unique IDs (1, 2, 3...)
- [ ] All stories have unique IDs (1.1, 1.2, 2.1...)
- [ ] All dependencies reference valid story IDs
- [ ] No circular dependencies
- [ ] Backend stories provide APIs that frontend/mobile consume
- [ ] All API references match api-contracts.md (if exists)
- [ ] All repository names match architecture document
- [ ] All stories have clear deliverables
- [ ] Priority set for all stories (P0-P3)

---

## Error Handling

### If PRD Not Found
```
❌ ERROR: PRD not found at expected location
Expected: {prd_path}

ACTION: Create PRD first using PM agent
HALT: Cannot proceed without PRD
```

### If Architecture Not Found (Multi-Repo)
```
⚠️ WARNING: Architecture documents not found
Expected: docs/architecture/

RECOMMENDATION: Create architecture documents first using Architect agent
This includes:
- system-architecture.md (repository definitions)
- api-contracts.md (API endpoint definitions)

QUESTION: Proceed with basic epic sharding (using inferred repositories)?
[Y/N]
```

### If Implementation Repo Detected
```
❌ ERROR: Cannot shard documents in implementation repository

Current project type: {backend|frontend|ios|android}
Repository ID: {repository_id}

ACTION: Epic sharding must be done in the product-planning repository.
Navigate to: {product_repo_path}
Run: *shard-documents

HALT: Cannot proceed in implementation repository
```

---

## Architecture Sharding (Automatic)

**After completing PRD sharding**, automatically shard architecture document if it exists.

### Check for Architecture Document

```bash
# Get architecture file path from config
ARCH_FILE=$(grep "architectureFile:" {root}/core-config.yaml | awk '{print $2}')

if [ -z "$ARCH_FILE" ]; then
  echo "ℹ️ No architecture file configured, skipping architecture sharding"
  exit 0
fi

if [ ! -f "$ARCH_FILE" ]; then
  echo "ℹ️ Architecture file not found: $ARCH_FILE, skipping"
  exit 0
fi

echo "📄 Architecture document found: $ARCH_FILE"
```

### Shard Architecture Document

**If USE_MD_TREE=true** (md-tree is available):

```bash
# Get output directory (same as architecture file without extension)
ARCH_DIR=$(dirname "$ARCH_FILE")/$(basename "$ARCH_FILE" .md)

# Use md-tree for fast sharding
md-tree explode "$ARCH_FILE" "$ARCH_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Architecture sharded to: $ARCH_DIR"

  # Update core-config.yaml
  # Set architectureSharded: true
  # Set architectureShardedLocation: $ARCH_DIR

  echo ""
  echo "📋 Architecture sections created:"
  ls -1 "$ARCH_DIR"/*.md | xargs -n1 basename
else
  echo "❌ Architecture sharding failed"
fi
```

**If USE_MD_TREE=false** (md-tree not available):

```
ℹ️ Skipping architecture sharding (md-tree not installed)

To enable architecture sharding:
npm install -g @kayvan/markdown-tree-parser

Then run: @po *shard
```

### Final Report

```
═══════════════════════════════════════════════════════
✅ DOCUMENT SHARDING COMPLETE
═══════════════════════════════════════════════════════

📋 PRD SHARDING:
  - Source: docs/prd.md
  - Output: docs/epics/
  - Epic YAML files: {N} created
  - Total stories: {total_stories} across {total_repos} repositories
  - Status: ✅ Complete

🏗️ ARCHITECTURE SHARDING:
  - Source: {ARCH_FILE}
  - Output: {ARCH_DIR}/
  - Section files: {M} created
  - Tool: md-tree (fast)
  - Status: ✅ Complete

⚙️ CONFIGURATION UPDATED:
  - prdSharded: true
  - architectureSharded: true

📊 EPIC SUMMARY:
{for each epic}
  Epic {N}: {title}
    - Stories: {count}
    - Repositories: {list}
{end for}

🎯 NEXT STEPS:
  1. SM can create stories: *create-next-story
  2. Dev will auto-load: devLoadAlwaysFiles sections
  3. Validate config: node tools/utils/validate-multi-repo-config.js .

📚 REFERENCE:
  - Epic files: docs/epics/epic-*.yaml
  - Story schema: orchestrix-core/data/epic-story-mapping-schema.yaml
  - Enhancement guide: docs/MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md
```

---

## References

- **Schema**: `{root}/data/epic-story-mapping-schema.yaml`
- **API Contracts Template**: `{root}/templates/api-contracts-tmpl.yaml`
- **Config**: `{root}/core-config.yaml`

---

**END OF TASK**
