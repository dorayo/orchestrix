# Aggregate System Architecture (Brownfield)

## Purpose

Generate a **system-level architecture document** for existing (brownfield) multi-repository projects by aggregating information from implementation repositories. This is the **bottom-up** approach, opposite of the greenfield workflow.

**Use Case**: You have existing backend, frontend, and/or mobile repositories with code and possibly architecture documents, and you want to create a system-level coordination document that reflects the current state.

**What This Task Does**:
- Scans implementation repositories for existing architecture documents and code
- Extracts repository information (name, type, tech stack, deployment)
- Identifies API contracts (what APIs each backend provides, what APIs frontends consume)
- Detects integration patterns (authentication, data formats, error handling)
- Aggregates into a system-architecture.md document
- Highlights inconsistencies and gaps that need resolution

**IMPORTANT**: This is an aggregation task, NOT a generation task. It analyzes existing repositories and creates a system-level view from the bottom up.

## Prerequisites

**Required Setup**:
- ✅ Product repository exists with `core-config.yaml` (type: `product-planning`)
- ✅ At least 2 implementation repositories exist (backend, frontend, ios, android, or mobile)
- ✅ Implementation repositories have either:
  - Architecture documents (`docs/architecture.md` or `docs/ui-architecture.md`), OR
  - Working code that can be analyzed

**Project Configuration**:
- ✅ Running in Product repository (not implementation repo)
- ✅ `implementation_repos` list configured in Product repo's `core-config.yaml`

**Example Configuration**:
```yaml
# Product repository: my-app-product/core-config.yaml
project:
  name: My App
  type: product-planning

implementation_repos:
  - path: ../my-app-backend
    type: backend
  - path: ../my-app-web
    type: frontend
  - path: ../my-app-ios
    type: ios
  - path: ../my-app-android
    type: android
```

**Recommended Environment**:
- 🌐 **Web interface** (e.g., claude.ai/code with large context window) - Recommended for analyzing multiple repos
- 💻 IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project type
PROJECT_TYPE=$(grep "type:" core-config.yaml | awk '{print $2}')
if [ "$PROJECT_TYPE" != "product-planning" ]; then
  echo "❌ ERROR: Project type is '$PROJECT_TYPE', expected 'product-planning'"
  echo "This task should run in Product repository"
  exit 1
fi

# Check if implementation_repos is configured
if ! grep -q "implementation_repos:" core-config.yaml; then
  echo "❌ ERROR: implementation_repos not configured in core-config.yaml"
  echo "Add this to core-config.yaml:"
  echo "implementation_repos:"
  echo "  - path: ../my-app-backend"
  echo "    type: backend"
  echo "  - path: ../my-app-web"
  echo "    type: frontend"
  exit 1
fi

# Check if at least 2 implementation repos exist
REPO_COUNT=$(grep -A 10 "implementation_repos:" core-config.yaml | grep "path:" | wc -l)
if [ "$REPO_COUNT" -lt 2 ]; then
  echo "⚠️ WARNING: Only $REPO_COUNT implementation repository configured"
  echo "For meaningful system architecture, at least 2 repos (e.g., backend + frontend) are recommended"
fi

echo "✅ Prerequisites validated. Proceeding with system architecture aggregation..."
```

---

## Task Instructions

### Step 1: Discover Implementation Repositories

Load the list of implementation repositories from Product repo configuration.

**Step 1.1: Parse Configuration**

```bash
# Read implementation_repos from core-config.yaml
REPOS=$(grep -A 100 "implementation_repos:" core-config.yaml | grep -E "path:|type:")
```

**Step 1.2: Validate Repository Existence**

For each repository path:
```bash
REPO_PATH="../my-app-backend"
if [ ! -d "$REPO_PATH" ]; then
  echo "⚠️ WARNING: Repository not found at $REPO_PATH"
  echo "Skipping this repository"
else
  echo "✅ Found: $REPO_PATH"
fi
```

**Step 1.3: Present Discovery Results**

**Elicit User Confirmation**:
```
🔍 **Implementation Repositories Discovered**:

| Repository Path | Type | Status | Architecture Doc |
|----------------|------|--------|------------------|
| ../my-app-backend | backend | ✅ Exists | ✅ Found at docs/architecture.md |
| ../my-app-web | frontend | ✅ Exists | ✅ Found at docs/architecture.md |
| ../my-app-ios | ios | ✅ Exists | ❌ Not found |
| ../my-app-android | android | ⚠️ Not found | N/A |

**Total Repositories**: 3 (1 missing)
**Repositories with Architecture Docs**: 2

**Analysis Approach**:
- Repositories WITH architecture docs: Extract information from docs
- Repositories WITHOUT architecture docs: Analyze codebase directly

Ready to proceed with aggregation?
```

---

### Step 2: Extract Repository Information

For each implementation repository, extract key information.

**Step 2.1: Read Repository Configuration**

```bash
REPO_PATH="../my-app-backend"
REPO_CONFIG="$REPO_PATH/core-config.yaml"

if [ -f "$REPO_CONFIG" ]; then
  PROJECT_NAME=$(grep "name:" "$REPO_CONFIG" | head -1 | awk '{print $2}')
  PROJECT_TYPE=$(grep "type:" "$REPO_CONFIG" | awk '{print $2}')
  echo "Repository: $PROJECT_NAME, Type: $PROJECT_TYPE"
fi
```

**Step 2.2: Extract from Architecture Document (if exists)**

If `docs/architecture.md` or `docs/ui-architecture.md` exists, extract:

**Key Information to Extract**:
1. **Repository Name**: From document title or config
2. **Repository Type**: backend, frontend, ios, android, mobile
3. **Tech Stack**: Languages, frameworks, databases (look for "Tech Stack" table)
4. **Deployment Platform**: Where it deploys (AWS, Vercel, App Store, etc.)
5. **Primary Responsibility**: 1-2 sentence description

**Example Extraction from Backend Architecture**:
```markdown
# Document Analysis: ../my-app-backend/docs/architecture.md

**Repository Name**: my-app-backend
**Type**: backend
**Tech Stack** (from Tech Stack table):
  - Language: TypeScript 5.3.3
  - Runtime: Node.js 20.11.0
  - Framework: Express 4.18.2
  - Database: PostgreSQL 15.5
  - ORM: Prisma 5.7.1
**Deployment**: AWS Lambda + API Gateway
**Responsibility**: "REST APIs for task management, user authentication"
```

**Step 2.3: Extract from Codebase (if no architecture doc)**

If no architecture document exists, analyze codebase:

**Backend Repository Analysis**:
- Check `package.json` for tech stack (dependencies)
- Check root directory for framework indicators (e.g., `next.config.js` = Next.js)
- Check database config files (e.g., `prisma/schema.prisma` = PostgreSQL + Prisma)
- Estimate responsibility from API routes or controllers

**Frontend Repository Analysis**:
- Check `package.json` for framework (React, Vue, Angular)
- Check for mobile framework indicators (`android/`, `ios/`, `lib/` for Flutter)
- Check config files (`next.config.js`, `nuxt.config.js`, `angular.json`)

**Step 2.4: Aggregate Repository Topology**

Create Repository Topology table:

| Repository Name | Type | Responsibility | Tech Stack | Deployment Platform | Team |
|----------------|------|----------------|------------|---------------------|------|
| my-app-backend | backend | REST APIs for task management | Node.js 20 + Express 4 + PostgreSQL 15 | AWS Lambda | Backend Team |
| my-app-web | frontend | Web UI for task management | React 18 + Next.js 14 | Vercel | Frontend Team |
| my-app-ios | ios | iOS native app | Swift 5 + SwiftUI | App Store | Mobile Team |

**Elicit User Confirmation**:
```
🗂️ **Repository Topology Aggregated**:

[Present table above]

**Observations**:
- ✅ 3 repositories identified
- ✅ Clear separation: 1 backend, 2 frontends
- ⚠️ my-app-ios has no architecture doc (analyzed from codebase)

Any corrections or missing repositories?
```

---

### Step 3: Extract API Contracts

This is the MOST IMPORTANT step for system architecture. Identify what APIs exist and how repositories communicate.

**Step 3.1: Identify Backend APIs (APIs Provided)**

**For Backend Repositories with Architecture Docs**:
- Look for "REST API Specification" or "API Endpoints" section
- Extract endpoint list: method + path
- Extract authentication requirements
- Group into logical categories

**Example from Backend Architecture**:
```markdown
# Extracted from: ../my-app-backend/docs/architecture.md

**APIs Provided by my-app-backend**:

Authentication APIs:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/users/me
- PUT /api/users/me

Task Management APIs:
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

**Total Endpoints**: 11
```

**For Backend Repositories without Architecture Docs**:
- Scan route files (e.g., `src/routes/*.ts`, `app/routes.rb`, `routes/api.php`)
- Scan controller files (e.g., `src/controllers/*.ts`, `app/controllers/`)
- Extract HTTP method + path from route definitions

**Step 3.2: Identify Frontend API Consumption (APIs Consumed)**

**For Frontend Repositories with Architecture Docs**:
- Look for "API Integration" or "API Services" section
- Extract list of API calls from service files

**Example from Frontend Architecture**:
```markdown
# Extracted from: ../my-app-web/docs/architecture.md

**APIs Consumed by my-app-web**:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/users/me
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

**Total API Calls**: 9
```

**For Frontend Repositories without Architecture Docs**:
- Scan API service files (e.g., `src/services/*.ts`, `lib/api/`)
- Search for HTTP client calls (axios, fetch, http)
- Extract URLs from API calls

**Step 3.3: Validate API Alignment**

Cross-reference backend APIs provided with frontend APIs consumed:

**Alignment Check**:
```
✅ Aligned APIs (9/9):
  - POST /api/auth/register (backend provides, frontend consumes)
  - POST /api/auth/login (backend provides, frontend consumes)
  - POST /api/auth/logout (backend provides, frontend consumes)
  - GET /api/users/me (backend provides, frontend consumes)
  - GET /api/tasks (backend provides, frontend consumes)
  - GET /api/tasks/:id (backend provides, frontend consumes)
  - POST /api/tasks (backend provides, frontend consumes)
  - PUT /api/tasks/:id (backend provides, frontend consumes)
  - DELETE /api/tasks/:id (backend provides, frontend consumes)

⚠️ Backend APIs NOT consumed by any frontend (2):
  - POST /api/auth/refresh (unused or consumed by mobile only)
  - PUT /api/users/me (unused or not yet implemented in frontend)

⚠️ Frontend APIs NOT provided by backend (0):
  (None - good alignment)
```

**Step 3.4: Group APIs into Categories**

Organize APIs into logical categories:

```markdown
### Authentication APIs
**Provider**: my-app-backend
**Consumers**: my-app-web, my-app-ios

**Endpoints**:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Authenticate user
- POST /api/auth/logout - End session
- POST /api/auth/refresh - Refresh access token
- GET /api/users/me - Get current user profile
- PUT /api/users/me - Update user profile

**Authentication Required**: Mixed (register/login public, others authenticated)

---

### Task Management APIs
**Provider**: my-app-backend
**Consumers**: my-app-web, my-app-ios

**Endpoints**:
- GET /api/tasks - List tasks (paginated)
- GET /api/tasks/:id - Get task details
- POST /api/tasks - Create task
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task

**Authentication Required**: All endpoints require valid JWT
```

**Elicit User Confirmation**:
```
🔌 **API Contracts Aggregated**:

**Total API Endpoints**: 11
**API Categories**: 2 (Authentication, Task Management)

**Backend Providers**: my-app-backend (11 endpoints)
**Frontend Consumers**: my-app-web (9 endpoints), my-app-ios (estimated 9 endpoints)

**Alignment Score**: 9/11 APIs consumed (82%)
**Unused APIs**: 2 (refresh token, update profile)

Does this API summary accurately reflect your system?
```

---

### Step 4: Detect Integration Patterns

Analyze how repositories integrate and identify common patterns.

**Step 4.1: Authentication Mechanism**

**From Backend Architecture**:
- Look for auth implementation details
- Identify: JWT, session-based, OAuth, API keys
- Extract token lifetime, storage location, refresh strategy

**From Frontend Architecture**:
- Look for token storage strategy (cookies, localStorage, Keychain)
- Identify refresh logic

**Aggregate Authentication Pattern**:
```markdown
### Authentication & Authorization

**Mechanism**: JWT (JSON Web Tokens)
**Source**: Detected in backend architecture (jsonwebtoken library, JWT payload structure)

**Token Format**: Bearer token in Authorization header
**Token Storage**:
- Web (my-app-web): HttpOnly cookies (access token), localStorage (refresh token)
- iOS (my-app-ios): Keychain

**Token Lifetime**:
- Access Token: 15 minutes (detected in backend config)
- Refresh Token: 7 days (detected in backend config)

**Refresh Strategy**: Automatic silent refresh before expiration (frontend interceptor)

**Authorization Pattern**: RBAC (Role-Based Access Control)
- Roles: admin, user (detected in backend User model)
```

**Step 4.2: Data Format Standards**

**From API Responses** (analyze backend architecture or sample responses):
- Identify data format: JSON, XML, Protocol Buffers
- Identify date format: ISO 8601, Unix timestamp, custom
- Identify pagination style: offset, cursor, page-based
- Identify field naming: camelCase, snake_case, PascalCase

**Aggregate Data Format Standards**:
```markdown
### Data Format Standards

**API Data Format**: JSON (detected in backend architecture)

**Date/Time Format**: ISO 8601 (e.g., "2025-01-14T10:30:00Z")
- Source: Detected in backend timestamp fields (`createdAt`, `updatedAt`)

**Timezone Handling**: UTC timestamps, client-side conversion
- Source: Backend database timestamps in UTC

**Pagination Style**: Cursor-based
- Source: Backend API response structure `{data, pagination: {cursor, hasMore, limit}}`

**Field Naming Convention**: camelCase
- Source: API response fields use camelCase (`firstName`, `createdAt`, `userId`)
```

**Step 4.3: Error Handling Standard**

**From Backend Architecture**:
- Look for error response format
- Identify error codes
- Identify HTTP status code usage

**Aggregate Error Handling Standard**:
```markdown
### Error Handling Standard

**Standard Error Response Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email" },
    "timestamp": "2025-01-14T10:30:00Z",
    "request_id": "uuid"
  }
}
```

**Error Code Taxonomy**:
- VALIDATION_ERROR, AUTHENTICATION_ERROR, AUTHORIZATION_ERROR, NOT_FOUND, RATE_LIMIT_EXCEEDED
- Source: Detected in backend error middleware

**HTTP Status Code Usage**:
- 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error
- Source: Backend controller responses
```

---

### Step 5: Extract Deployment Architecture

Identify where and how each repository deploys.

**Step 5.1: Deployment Targets**

**From Architecture Docs or CI/CD Files**:
- Check architecture docs for deployment section
- Check `.github/workflows/`, `.gitlab-ci.yml`, `vercel.json`, etc.
- Check `Dockerfile`, `serverless.yml`, `app.yaml`

**Aggregate Deployment Targets**:

| Repository | Platform | Dev URL | Production URL |
|-----------|----------|---------|----------------|
| my-app-backend | AWS Lambda + API Gateway | https://dev-api.myapp.com | https://api.myapp.com |
| my-app-web | Vercel | https://dev.myapp.com | https://myapp.com |
| my-app-ios | TestFlight | TestFlight Beta | App Store |

**Step 5.2: CI/CD Strategy**

**Detect from CI/CD Files**:
- GitHub Actions: `.github/workflows/*.yml`
- GitLab CI: `.gitlab-ci.yml`
- CircleCI: `.circleci/config.yml`

**Aggregate CI/CD Strategy**:
```markdown
### CI/CD Strategy

**CI/CD Platform**: GitHub Actions (detected from .github/workflows/)

**Deployment Triggers**:
- Dev: On push to `develop` branch (detected from workflow files)
- Production: On push to `main` branch + manual approval

**Build & Test**:
- Unit tests run on every commit
- Integration tests before deployment
- Quality gates: Code coverage > 80%
```

---

### Step 6: Identify Cross-Cutting Concerns

Extract system-wide requirements affecting all repositories.

**Step 6.1: Security Requirements**

**From Architecture Docs and Code**:
- Encryption standards (TLS version, at-rest encryption)
- Secrets management (AWS Secrets Manager, HashiCorp Vault, .env)
- Security scanning tools (Dependabot, Snyk, SonarQube)

**Aggregate Security Requirements**:
```markdown
### Security Requirements

**Data Encryption**:
- In Transit: TLS 1.3 (detected in backend API Gateway config)
- At Rest: AES-256 (detected in database config)

**Secrets Management**:
- Development: .env files (git-ignored)
- Production: AWS Secrets Manager (detected in backend code)

**Security Scanning**:
- Dependency Scanning: Dependabot (detected in .github/dependabot.yml)
- SAST: SonarQube (detected in CI/CD workflow)
```

**Step 6.2: Performance Requirements**

**From Architecture Docs or Monitoring Configs**:
- Response time SLAs
- Throughput targets
- Availability targets

**Aggregate Performance Requirements**:
```markdown
### Performance Requirements

**Response Time SLAs**:
- API Endpoints: < 150ms (p95) (detected in backend architecture)
- Web Page Load: < 2s First Contentful Paint (detected in frontend architecture)

**Availability Target**: 99.5% uptime (detected in infrastructure config)
```

**Step 6.3: Observability Strategy**

**From Architecture Docs and Code**:
- Logging platform
- Monitoring platform
- Distributed tracing

**Aggregate Observability Strategy**:
```markdown
### Observability Strategy

**Logging**:
- Platform: AWS CloudWatch (detected in backend Winston logger config)
- Format: JSON structured logging

**Monitoring**:
- Platform: Datadog (detected in backend config)
- Key Metrics: Request rate, error rate, latency

**Tracing**:
- Platform: AWS X-Ray (detected in backend middleware)
- Sampling Rate: 1% production, 100% dev
```

---

### Step 7: Identify Gaps and Inconsistencies

Analyze aggregated information for problems that need resolution.

**Step 7.1: API Alignment Gaps**

**Check for**:
- Backend APIs not consumed by any frontend → Unused or documented incorrectly
- Frontend calls to APIs not provided by backend → Integration errors waiting to happen
- Inconsistent API paths across repos

**Example Gap Report**:
```
⚠️ **API Alignment Issues Detected**:

1. **Unused Backend APIs** (2):
   - POST /api/auth/refresh (provided by backend, not consumed by web frontend)
     → Recommendation: Check if mobile apps use it, or remove if truly unused

   - PUT /api/users/me (provided by backend, not consumed by web frontend)
     → Recommendation: Implement profile editing in frontend, or remove API if not needed

2. **Missing Backend APIs** (0):
   (None - all frontend API calls have corresponding backend endpoints)

**Action Required**: Review unused APIs with team to decide keep/remove.
```

**Step 7.2: Integration Pattern Inconsistencies**

**Check for**:
- Different auth mechanisms across repos
- Inconsistent date formats
- Mismatched error formats
- Different field naming conventions

**Example Inconsistency Report**:
```
⚠️ **Integration Pattern Inconsistencies Detected**:

1. **Date Format Mismatch**:
   - Backend returns: ISO 8601 ("2025-01-14T10:30:00Z")
   - iOS app expects: Unix timestamp (1736853000)
   → Recommendation: Standardize on ISO 8601, update iOS date parsing

2. **Field Naming Inconsistency**:
   - Backend API returns: camelCase (`firstName`, `createdAt`)
   - Database uses: snake_case (`first_name`, `created_at`)
   → Note: This is acceptable (Prisma transforms snake_case to camelCase)

**Action Required**: Fix date format inconsistency in iOS app.
```

**Step 7.3: Missing Documentation**

**Check for**:
- Repositories without architecture docs
- Undocumented APIs
- Missing tech stack information

**Example Missing Documentation Report**:
```
📋 **Missing Documentation**:

1. **my-app-ios** (ios repository):
   - ❌ No architecture document
   - ✅ Tech stack detected from code (Swift 5 + SwiftUI)
   - ⚠️ API consumption patterns inferred (not documented)
   → Recommendation: Create architecture doc using `@architect *create-frontend-architecture`

2. **API Documentation**:
   - ❌ No OpenAPI specification for backend APIs
   - ⚠️ Request/response schemas inferred from code
   → Recommendation: Generate OpenAPI spec from backend code or architecture doc

**Action Required**: Create missing architecture docs and API specs.
```

---

### Step 8: Generate System Architecture Document

Now generate the system-architecture.md document using aggregated information.

**Step 8.1: Prepare Output Directory**

```bash
mkdir -p docs/architecture
OUTPUT_PATH="docs/architecture/system-architecture.md"
```

**Step 8.2: Render Template**

Use the `system-architecture-tmpl.yaml` template and fill in with aggregated data:

**Sections to Populate**:
1. **Introduction**: Project overview, brownfield context
2. **Repository Topology**: Aggregated repository table + relationship diagram
3. **API Contracts Summary**: Aggregated API categories and endpoints
4. **Integration Strategy**: Aggregated auth, data formats, error handling
5. **Deployment Architecture**: Aggregated deployment targets and CI/CD
6. **Cross-Cutting Concerns**: Aggregated security, performance, observability
7. **Appendix - Aggregation Notes**: Document gaps, inconsistencies, recommendations

**Step 8.3: Add Brownfield Metadata**

```yaml
---
document_type: system-architecture
version: 1.0.0
last_updated: {{current_date}}
status: aggregated
aggregation_source: brownfield
source_repositories: [my-app-backend, my-app-web, my-app-ios]
---
```

**Step 8.4: Include Aggregation Notes Section**

Add special section documenting the aggregation process:

```markdown
## Appendix - Aggregation Notes

**Aggregation Method**: Bottom-up from existing implementation repositories
**Aggregation Date**: 2025-01-14
**Source Repositories**: 3 (my-app-backend, my-app-web, my-app-ios)

### Data Sources

**my-app-backend**:
- ✅ Architecture document analyzed (docs/architecture.md)
- ✅ Configuration file read (core-config.yaml)
- ✅ Code analysis: Route files, controller files

**my-app-web**:
- ✅ Architecture document analyzed (docs/architecture.md)
- ✅ Configuration file read (core-config.yaml)
- ✅ Code analysis: API service files

**my-app-ios**:
- ❌ No architecture document
- ✅ Configuration file read (core-config.yaml)
- ✅ Code analysis: Tech stack inferred from files

### Confidence Levels

- **Repository Topology**: High (all repos have core-config.yaml)
- **API Contracts**: High (backend has detailed architecture doc)
- **Authentication**: High (both backend and frontend docs specify JWT)
- **Data Formats**: High (consistent ISO 8601, camelCase detected)
- **Error Handling**: Medium (backend specifies format, frontend compliance assumed)
- **Deployment**: Medium (some inferred from CI/CD files)
- **Performance**: Low (only backend specifies SLAs, frontend requirements inferred)

### Known Gaps

1. **Unused APIs**: 2 backend endpoints not consumed by web frontend
2. **Missing Docs**: iOS repository has no architecture document
3. **API Specs**: No OpenAPI specification exists
4. **Performance**: Frontend and iOS performance requirements not documented

### Recommendations

1. **Create iOS Architecture Doc**: Use `@architect *create-frontend-architecture` in iOS repo
2. **Review Unused APIs**: Decide whether to keep POST /api/auth/refresh and PUT /api/users/me
3. **Generate OpenAPI Spec**: Create formal API specification for backend
4. **Document Performance**: Add explicit performance requirements for frontend and iOS
5. **Validate Integration**: Test API alignment between backend and all frontends
```

---

### Step 9: Validate Aggregated Architecture

Perform validation to ensure quality of aggregated document.

**Validation Checklist**:
- [ ] All implementation repositories are represented in Repository Topology
- [ ] All backend-provided APIs are documented in API Contracts Summary
- [ ] Frontend API consumption is documented (even if inferred)
- [ ] Integration patterns are consistent (or inconsistencies are noted)
- [ ] Deployment architecture is complete
- [ ] Cross-cutting concerns are comprehensive
- [ ] Gaps and inconsistencies are documented in Aggregation Notes
- [ ] Recommendations for improvement are provided

**Final Elicitation**:
```
📋 **System Architecture Aggregation Complete**

I've aggregated information from {{repo_count}} implementation repositories:
- {{backend_count}} backend repositories
- {{frontend_count}} frontend/mobile repositories

**Aggregated Content**:
✅ Repository Topology ({{repo_count}} repositories)
✅ API Contracts Summary ({{endpoint_count}} endpoints)
✅ Integration Strategy (Auth, Data Standards, Error Handling)
✅ Deployment Architecture ({{platform_count}} platforms)
✅ Cross-Cutting Concerns (Security, Performance, Observability)

**Quality Indicators**:
- API Alignment: {{alignment_percent}}% ({{aligned_count}}/{{total_api_count}} APIs aligned)
- Documentation Coverage: {{doc_coverage}}% ({{repos_with_docs}}/{{total_repos}} repos with architecture docs)
- Confidence Level: {{confidence}} (High/Medium/Low)

**Known Issues**:
{{gap_count}} gaps identified:
1. {{gap_1}}
2. {{gap_2}}
...

**Recommendations**:
{{recommendation_count}} recommendations provided in Aggregation Notes section.

Ready to review the aggregated system architecture document?
```

---

### Step 10: Output Handoff

Present the completed system-architecture.md and next steps.

**Success Output**:
```
✅ SYSTEM ARCHITECTURE AGGREGATED (BROWNFIELD)

📄 Generated Document: docs/architecture/system-architecture.md

📊 **Aggregation Summary**:

**Source Repositories** ({{repo_count}}):
- [backend] {{backend_repo_1}} ({{backend_tech_1}})
- [frontend] {{frontend_repo_1}} ({{frontend_tech_1}})
- [mobile] {{mobile_repo_1}} ({{mobile_tech_1}})

**API Contracts** ({{endpoint_count}} endpoints):
- {{api_category_1}}: {{endpoint_count_1}} endpoints
- {{api_category_2}}: {{endpoint_count_2}} endpoints

**Integration Patterns Detected**:
- Authentication: {{auth_mechanism}}
- Data Format: {{data_format}}
- Error Handling: {{error_format}}

**Deployment Platforms** ({{platform_count}}):
- Backend: {{backend_platform}}
- Frontend: {{frontend_platform}}
- Mobile: {{mobile_platform}}

**Quality Metrics**:
- API Alignment: {{alignment_percent}}%
- Documentation Coverage: {{doc_coverage}}%
- Confidence: {{confidence_level}}

---

📋 **NEXT STEPS**:

1. **Review Aggregated Architecture**
   - Check Repository Topology accuracy
   - Verify API Contracts Summary completeness
   - Validate Integration Strategy correctness

2. **Address Gaps** ({{gap_count}} identified):
   {{#each gaps}}
   - {{this}}
   {{/each}}

3. **Implement Recommendations** ({{recommendation_count}} provided):
   {{#each recommendations}}
   - {{this}}
   {{/each}}

4. **Improve Documentation**:
   For repositories without architecture docs:
   {{#each repos_without_docs}}
   ```bash
   cd {{this.path}}
   @architect *create-{{this.type}}-architecture
   # Output: docs/architecture.md (detailed architecture)
   ```
   {{/each}}

5. **Validate API Alignment**:
   - Review unused APIs: {{unused_apis}}
   - Test API integration between backend and all frontends
   - Update API documentation (consider OpenAPI spec)

6. **Sync Future Changes**:
   - When adding new APIs: Update system-architecture.md first
   - When changing integration patterns: Update system-architecture.md
   - Re-run aggregation periodically to detect drift

---

🎉 **System architecture now reflects the current state of your brownfield project!**

Use this as the baseline for future development and to ensure new changes align with existing patterns.
```

---

## Notes for Agent Execution

- **Brownfield Context**: This task analyzes EXISTING repositories, not creating new ones. Be prepared to work with incomplete or inconsistent information.

- **Flexibility Required**: Not all repos will have architecture docs. Be ready to analyze code directly using grep, file scanning, and pattern detection.

- **Confidence Levels**: Clearly communicate confidence in aggregated information. Some data will be certain (from docs), some will be inferred (from code).

- **Gap Documentation**: Don't hide problems. Document gaps, inconsistencies, and missing information in the Aggregation Notes section.

- **Iterative Refinement**: User may provide corrections after seeing initial aggregation. Be ready to adjust and re-aggregate.

## Success Criteria

- ✅ System architecture document exists at `docs/architecture/system-architecture.md`
- ✅ All implementation repositories are represented in Repository Topology
- ✅ API contracts are aggregated from all backends
- ✅ Frontend API consumption is documented
- ✅ Integration patterns are detected and documented
- ✅ Deployment architecture is aggregated
- ✅ Cross-cutting concerns are comprehensive
- ✅ Gaps and inconsistencies are explicitly documented
- ✅ Recommendations for improvement are provided
- ✅ User understands confidence levels and data sources

## Error Handling

**If no implementation repositories are configured**:
```
❌ ERROR: No implementation repositories configured

Brownfield aggregation requires existing implementation repositories.

Add implementation repositories to core-config.yaml:

implementation_repos:
  - path: ../my-app-backend
    type: backend
  - path: ../my-app-web
    type: frontend

Then run: @architect *aggregate-system-architecture
```

**If all repositories are missing architecture docs**:
```
⚠️ WARNING: No architecture documents found in any repository

Aggregation will rely entirely on code analysis, which may be incomplete.

**Recommendation**:
1. Create architecture docs in implementation repos first:
   cd ../my-app-backend && @architect *create-backend-architecture
   cd ../my-app-web && @architect *create-frontend-architecture

2. Then return here and run: @architect *aggregate-system-architecture

**Or continue anyway?** (Code analysis will be used, confidence will be lower)
```

**If API alignment is very poor**:
```
🚨 CRITICAL: API Alignment is only {{alignment_percent}}%

**Misalignment Issues**:
- Frontend calls {{missing_api_count}} APIs not provided by backend
- Backend provides {{unused_api_count}} APIs not consumed by any frontend

**This indicates serious integration problems.**

**Action Required**:
1. Review API mismatches in the generated system-architecture.md
2. Fix integration issues in code
3. Re-run aggregation to verify fixes

Proceed with current aggregation? (Document will include warnings)
```

## Related Tasks

- **Prerequisites**: None (brownfield starting point)
- **Alternatives**: `create-system-architecture.md` (greenfield approach)
- **Follow-up**: `create-backend-architecture.md`, `create-frontend-architecture.md` (for repos without docs)
- **Related**: `extract-api-contracts.md` (detailed API contract extraction)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-14 | Initial creation for Phase 3 | Orchestrix Team |
