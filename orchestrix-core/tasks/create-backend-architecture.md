# Create Backend Architecture

## Purpose

Generate a **detailed backend architecture document** for a backend implementation repository. This document provides implementation-level technical details for backend development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:
- Includes component designs, database schemas, code patterns, and implementation details
- References and aligns with the system-architecture.md from Product repository
- Validates that backend implements ALL APIs defined in system-architecture.md
- Uses `architecture-tmpl.yaml` template for output format
- Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

## Workflow Mode

**Default: Draft-First** -- Generate the complete architecture in one pass after collecting upfront inputs, then present key decisions for review.

**Flag: `--interactive`** -- Revert to step-by-step interactive mode where each design phase requires user confirmation before proceeding. When `--interactive` is set, treat every "Generation Instructions" section below as a separate step with its own "Elicit User Confirmation" stop. Present the designed artifacts and wait for approval before moving to the next section.

## Prerequisites

**Required Documents**:
- System Architecture exists at `../product-repo/docs/system-architecture.md`
- PRD exists at `../product-repo/docs/prd.md` (optional)

**Project Configuration**:
- Project mode is `multi-repo` with role `backend` in `core-config.yaml`
- `multi_repo.product_repo_path` is configured in `core-config.yaml` pointing to Product repository
- Running in Backend implementation repository (not Product repo)

**Recommended Environment**:
- Web interface (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project mode and role
PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 1 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')
if [ "$PROJECT_MODE" != "multi-repo" ] || [ "$PROJECT_ROLE" != "backend" ]; then
  echo "ERROR: Project mode is '$PROJECT_MODE' with role '$PROJECT_ROLE', expected mode='multi-repo' role='backend'"
  echo "This task should run in Backend implementation repository"
  exit 1
fi

# Check if product repo path is configured
PRODUCT_REPO_PATH_RAW=$(grep -A 3 "multi_repo:" core-config.yaml | grep "product_repo_path:" | awk '{print $2}')
if [ -z "$PRODUCT_REPO_PATH_RAW" ]; then
  echo "ERROR: multi_repo.product_repo_path not configured in core-config.yaml"
  echo "Add this to core-config.yaml:"
  echo "project:"
  echo "  mode: multi-repo"
  echo "  multi_repo:"
  echo "    role: backend"
  echo "    product_repo_path: ../my-project-product  # Adjust path to your Product repo"
  exit 1
fi

# Resolve relative path to absolute path
if [[ "$PRODUCT_REPO_PATH_RAW" = /* ]]; then
  # Already absolute path
  PRODUCT_REPO_PATH="$PRODUCT_REPO_PATH_RAW"
else
  # Relative path - resolve from current directory
  PRODUCT_REPO_PATH=$(cd "$PRODUCT_REPO_PATH_RAW" 2>/dev/null && pwd)
  if [ $? -ne 0 ] || [ -z "$PRODUCT_REPO_PATH" ]; then
    echo "ERROR: Product repo not found at: $PRODUCT_REPO_PATH_RAW"
    echo "   Tried to resolve from: $(pwd)"
    echo "   Check if the path is correct and the directory exists"
    exit 1
  fi
fi

echo "Product repo resolved to: $PRODUCT_REPO_PATH"

# Check if system architecture exists
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"
if [ ! -f "$SYSTEM_ARCH" ]; then
  echo "ERROR: System architecture not found at $SYSTEM_ARCH"
  echo ""
  echo "Action: Create system architecture first in Product repository"
  echo "   cd $PRODUCT_REPO_PATH"
  echo "   @architect *create-system-architecture"
  exit 1
fi

echo "Found system architecture: docs/system-architecture.md"

echo "Prerequisites validated. Proceeding with backend architecture generation..."
```

---

## Task Instructions

### Step 1: Load Context & Validate

Load both the system-level architecture and the PRD as constraints and requirements for this detailed architecture. **No user interaction required** -- this is pure context ingestion.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture (path already resolved in validation)
# PRODUCT_REPO_PATH is the absolute path set during prerequisite validation
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"

echo "Reading system architecture from: $SYSTEM_ARCH"
```

Read and analyze the **complete** system architecture document (not the sharded files).

**Why read the complete file?**
- Even if Product repo has sharded the architecture, the complete `system-architecture.md` file still exists
- Reading the complete file ensures we get the full context in one pass
- Sharded files are for PO/SM story creation, not for implementation architecture generation

**Extract from System Architecture** (retain internally, do not present to user yet):
1. **Repository Topology**: This backend's role in the overall system
2. **API Contracts Summary**: Which APIs THIS backend must implement (CRITICAL)
3. **Integration Strategy**: Authentication mechanism, data format standards, error handling conventions
4. **Deployment Architecture**: Where and how this backend deploys
5. **Cross-Cutting Concerns**: Security, performance, observability requirements
6. **APIs to Implement**: List of endpoints this backend must provide
7. **APIs to Consume**: List of external/partner APIs this backend calls
8. **Authentication Requirements**: JWT format, token validation, role-based access control
9. **Data Format Standards**: JSON structure, date format (ISO 8601), pagination style (offset/cursor)
10. **Error Handling Standard**: Error response format, HTTP status codes
11. **Performance Requirements**: Response time SLAs (e.g., < 200ms p95), throughput targets
12. **Security Requirements**: Encryption (TLS, at-rest), secrets management, security headers

**Step 1.2: Load PRD**

```bash
# Read PRD
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"
```

**Extract from PRD** (retain internally):
- Main features/epics for backend
- Business entities involved (Users, Products, Orders, etc.)
- Non-functional requirements (scale, security, compliance)
- Backend-specific stories or requirements

**Step 1.3: Cross-Reference Features to APIs**

Map PRD features against API contracts from system-architecture.md:
- For each Epic, identify which APIs are needed
- For each Story (target_platform = backend), identify which endpoints to implement
- Identify business entities and their relationships
- Flag any PRD features that require APIs NOT in system-architecture.md (used in Step 3)

---

### Step 2: Upfront Questions

Present all critical decision questions as a single consolidated list. Wait for answers before proceeding.

```
I've loaded the system architecture and PRD. Before generating the backend architecture, I need your input on a few key decisions:

1. **Backend Tech Stack Confirmation**
   System architecture specifies: {{language}} + {{framework}} ({{version}})
   Database: {{database}} ({{db_version}})
   Is this correct, or do you want to adjust?

2. **Architecture Pattern Preference**
   Based on project complexity ({{complexity_assessment}}), options are:

   [A] Three-Layer Architecture (MVC)
       Controllers -> Services -> Repositories
       Best for: Moderate complexity, widely understood

   [B] Hexagonal Architecture (Clean Architecture)
       HTTP Adapters -> Use Cases -> Domain Models -> Repository Interfaces
       Best for: Highly testable, business logic independent of infrastructure

   [C] Domain-Driven Design (DDD)
       Aggregates, Entities, Value Objects, Domain Services
       Best for: Complex business logic, clear domain boundaries

   Recommendation: {{recommended_pattern}} because {{rationale}}
   Your preference? (A/B/C or custom)

3. **Framework & Tooling Preferences**
   Any specific preferences for:
   - ORM / Database client? (e.g., Prisma, TypeORM, Knex, SQLAlchemy)
   - Validation library? (e.g., Zod, Joi, class-validator)
   - Testing framework? (e.g., Jest, Vitest, pytest)
   - API documentation? (e.g., Swagger/OpenAPI auto-generation)
   - Migration tool? (e.g., Prisma Migrate, Knex migrations, Alembic)
   (Leave blank to use sensible defaults based on your stack)

Please answer all three (or type "defaults" to accept all recommendations).
```

---

### Step 3: Validate API Implementation (CRITICAL -- HARD STOP)

**CRITICAL VALIDATION**: Ensure backend implements ALL APIs defined in system-architecture.md.

Based on the PRD features and system architecture API contracts, verify coverage:

**API Implementation Analysis**:
```
API Contract Validation

I've analyzed the APIs this backend must implement from system-architecture.md:

**Authentication & User APIs**:
- POST /api/auth/login      -> Will implement
- POST /api/auth/register   -> Will implement
- POST /api/auth/refresh    -> Will implement
- GET /api/users/:id        -> Will implement

**Product APIs**:
- GET /api/products          -> Will implement
- GET /api/products/:id      -> Will implement
- POST /api/products         -> Will implement (Admin only)
- PUT /api/products/:id      -> Will implement (Admin only)

**Order APIs**:
- POST /api/orders           -> Will implement
- GET /api/orders            -> Will implement
- GET /api/orders/:id        -> Will implement

**Shopping Cart APIs**:
- GET /api/cart               -> NOT found in system-architecture.md but needed for Cart feature in PRD

VALIDATION WARNING: Cart feature in PRD requires Cart APIs, but they're not in system-architecture.md

**Action Required**:
1. Option A: Update system-architecture.md to add Cart APIs
2. Option B: Remove Cart feature from PRD
3. Option C: Implement Cart client-side only (no backend APIs)

Please choose how to proceed before I continue with architecture design.
```

**IF all APIs validated successfully**:
```
API Contract Validation PASSED

All {{api_count}} APIs defined in system-architecture.md are accounted for in this backend architecture.
Backend will implement all required endpoints. Proceeding with architecture generation...
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding. Do NOT generate the architecture document with unresolved API mismatches.

---

### Step 4: Generate Complete Architecture Document

Using all loaded context (Step 1), user answers (Step 2), and validated APIs (Step 3), generate the **complete** backend architecture document in one pass.

**Output Document**:
Use template: `{root}/templates/architecture-tmpl.yaml`

**Prepare Output**:
```bash
# Ensure docs directory exists
mkdir -p docs
OUTPUT_PATH="docs/architecture.md"
```

Generate all sections below into `docs/architecture.md`. Each subsection provides generation instructions -- follow them to produce the content.

#### 4.1: Service Components

**Generation Instructions -- Component Architecture**:

Choose component structure based on the architecture pattern selected in Step 2:

- **API Layer**: Controllers, route handlers, middleware. Map each API endpoint from system-architecture.md to a controller and handler method.
- **Business Logic Layer**: Services, use cases, domain models. Each service encapsulates business rules for one domain area.
- **Data Access Layer**: Repositories, ORMs, database clients. Each repository handles CRUD and queries for one entity.
- **Infrastructure Layer**: Auth middleware, logging, monitoring, external integrations.

For each API endpoint from system-architecture.md, document:
- Controller/Route handler name
- Service method name
- Repository methods needed
- Database entities involved

#### 4.2: Database Schema

**Generation Instructions -- Database Design**:

For each business entity identified in Step 1.3:
- Table/Collection name
- Primary key (UUID recommended)
- Key fields and data types
- Indexes for performance (foreign keys, frequently queried fields)
- Constraints (NOT NULL, UNIQUE, FOREIGN KEY)

Document relationships:
- One-to-One (e.g., User <-> UserProfile)
- One-to-Many (e.g., User -> Orders)
- Many-to-Many (e.g., Orders <-> Products via OrderItems)

Choose migration tool based on user's tooling preference from Step 2 (or sensible default for tech stack).

#### 4.3: API Implementation Details

**Generation Instructions -- API Specifications**:

For each endpoint validated in Step 3:
- Request body schema (JSON with field types, required/optional)
- Response body schema (JSON)
- Query parameters and path parameters
- Headers (Authorization, Content-Type)
- Validation rules per field (data type, min/max, format)
- Error responses per endpoint (HTTP status codes, error code, message)

Follow the error handling standard extracted from system-architecture.md in Step 1.

#### 4.4: Code Patterns & Cross-Cutting Concerns

**Generation Instructions -- Implementation Patterns**:

- Authentication flow (JWT validation middleware, token refresh)
- Authorization (RBAC middleware, permission checks)
- Request validation pattern (middleware vs in-handler)
- Error handling pattern (global error handler, custom error classes)
- Logging strategy (structured logging, correlation IDs)
- Testing strategy (unit tests for services, integration tests for repositories, E2E for API endpoints)
- Deployment configuration (environment variables, Docker, CI/CD)
- Security headers (CORS, CSP, X-Frame-Options)
- Secrets management (env vars, vault)

#### 4.5: Track Key Decisions

While generating, track every significant design decision made, categorized as:
- **Needs Confirmation**: Decisions where the AI was uncertain or the user's preference was ambiguous
- **Suggest Review**: Reasonable defaults applied that the user may want differently
- **Standard Practice**: Industry conventions applied without controversy

Save the document to `docs/architecture.md`.

---

### Step 5: Decision Review

After saving the document, present key decisions for review.

```
Backend architecture draft saved to docs/architecture.md

## Key Decisions & Uncertainties

[RED] Needs Confirmation:
- [List decisions where AI was uncertain, e.g., "Chose cursor-based pagination
  over offset-based -- system-architecture.md didn't specify clearly"]

[YELLOW] Suggest Review:
- [List reasonable defaults, e.g., "Used UUID v4 for all primary keys",
  "Added soft-delete (deleted_at) to users and products tables",
  "Set JWT expiration to 15 minutes with 7-day refresh token"]

[GREEN] Standard Practice:
- [List industry conventions, e.g., "bcrypt for password hashing",
  "Parameterized queries for SQL injection prevention",
  "ISO 8601 for all date fields"]

## Document Structure Summary
- {{controller_count}} Controllers / {{service_count}} Services / {{repository_count}} Repositories
- {{table_count}} Database tables with {{relationship_count}} relationships
- {{api_count}} API endpoints (all validated against system-architecture.md)
- Architecture Pattern: {{architecture_pattern}}

Please review docs/architecture.md. Let me know if you want changes to any
[RED] or [YELLOW] decisions, or if this looks good to finalize.
```

Wait for user feedback. Apply requested changes to `docs/architecture.md` before proceeding.

---

### Step 6: Validate, Finalize & Handoff

#### 6.1: Cross-Validation Checklist

Perform final validation to ensure alignment:

```
Final Validation Checklist:

**API Contract Alignment**:
- [ ] All APIs from system-architecture.md are implemented
- [ ] Request/response schemas match system-architecture.md expectations
- [ ] API base URL matches system-architecture.md

**Authentication Alignment**:
- [ ] JWT format matches system-architecture.md (header, payload, expiration)
- [ ] Token validation implemented correctly
- [ ] RBAC roles match system-architecture.md (if applicable)

**Data Format Alignment**:
- [ ] JSON responses follow structure from system-architecture.md
- [ ] Dates formatted as ISO 8601 per system-architecture.md
- [ ] Pagination style matches system-architecture.md (offset/cursor)

**Error Handling Alignment**:
- [ ] Error response format matches system-architecture.md
- [ ] HTTP status codes per system-architecture.md standard

**Performance Requirements**:
- [ ] Response time SLA documented (e.g., < 200ms p95)
- [ ] Throughput target documented
- [ ] Caching strategy documented (if applicable)

**Security Implementation**:
- [ ] TLS/HTTPS enforced
- [ ] Secrets management configured (env vars, vault)
- [ ] Security headers configured (CORS, CSP, X-Frame-Options)
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection in API responses

**Deployment Alignment**:
- [ ] Deployment platform matches system-architecture.md
- [ ] Environment variables documented
- [ ] CI/CD strategy documented

All checks passed?
```

If any check fails, fix the document before proceeding.

#### 6.2: Handoff

Present the completed backend architecture document and provide next steps.

**Success Output**:
```
BACKEND ARCHITECTURE COMPLETE

Generated Document: docs/architecture.md

Backend Repository: {{backend_repo_name}}
Tech Stack: {{language}} + {{framework}} ({{version}})
Database: {{database}} ({{db_version}})

Component Architecture:
  - {{controller_count}} Controllers
  - {{service_count}} Services
  - {{repository_count}} Repositories
  - Architecture Pattern: {{architecture_pattern}}

API Implementation:
  - Endpoints: {{api_count}} (all from system-architecture.md validated)
  - Auth Strategy: {{auth_strategy}}
  - OpenAPI Spec: Generated

Database Schema:
  - Tables: {{table_count}}
  - Relationships: {{relationship_count}}
  - Migration Tool: {{migration_tool}}

Security:
  - Authentication: {{auth_mechanism}}
  - Authorization: {{rbac_details}}
  - Security Headers: {{security_headers}}

---

NEXT STEPS:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate database schema covers all requirements

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all backend features are covered

3. **Dev: Begin Backend Implementation**

   **Setup Project**:
   # Initialize project (adjust based on your framework choice)
   mkdir {{project_name}}
   cd {{project_name}}
   npm init -y  # or python -m venv venv, etc.

   # Install dependencies from architecture doc
   npm install {{dependencies}}
   npm install --save-dev {{dev_dependencies}}

   **Implementation Order** (follow Story priorities from PRD):
   1. Set up project structure and configuration
   2. Set up database connection and migrations
   3. Implement authentication (login, register, refresh)
   4. Implement core entities (User, Product, Order, etc.)
   5. Implement business logic services
   6. Implement API endpoints
   7. Write unit and integration tests
   8. Configure CI/CD pipeline

4. **SM: Create Backend Stories**
   - Filter PRD stories where target_platform = backend
   - Reference this architecture.md in each Story
   - Sequence stories by dependencies

5. **QA: Test Backend**
   - API contract testing (request/response validation)
   - Integration testing (database operations)
   - Load testing (performance SLAs)
   - Security testing (OWASP Top 10)

---

Backend architecture is now the technical blueprint for API development.

All backend development will reference this document to ensure consistency
with system architecture and frontend expectations.

🎯 HANDOFF TO po: *shard
```

---

## Notes for Agent Execution

- **Workflow Mode**: Default is draft-first. If user passes `--interactive`, treat every generation subsection in Step 4 as a separate interactive step with its own confirmation stop.

- **Context Management**: This task requires significant context (system-architecture.md + PRD + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All APIs from system-architecture.md MUST be implemented. If system-arch is missing APIs needed for PRD features, either add them to system-arch or remove the features from PRD.

- **PRD is Blueprint**: Backend must support all features defined in PRD where target_platform = backend.

- **Template Reference**: This task uses `architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **Decision Tracking**: In draft-first mode, the agent must internally track every non-obvious design decision and categorize it (Red/Yellow/Green) for presentation in Step 5.

- **API Validation is Critical**: Step 3 is the most important validation. If it fails, STOP and wait for user to resolve before proceeding. This is a technical correctness gate, not a UX preference.

## Success Criteria

- Backend architecture document exists at `docs/architecture.md`
- All APIs from system-architecture.md are implemented (Step 3 validation passed)
- Component architecture is clear and follows chosen pattern
- Database schema covers all business entities with proper relationships
- API implementation details are complete (request/response schemas, validation, errors)
- Authentication and authorization implementation is detailed
- Testing strategy is comprehensive (unit, integration, E2E)
- Deployment and monitoring strategy is documented
- Key decisions presented and approved by user (Step 5)
- Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:
```
ERROR: System architecture not found

Backend architecture requires system-architecture.md from Product repository.

Please ensure:
1. Product repository path is correct in core-config.yaml
2. System architecture exists at ../product-repo/docs/architecture/system-architecture.md

If system architecture doesn't exist:
cd ../my-project-product
@architect *create-system-architecture

After system architecture is ready, return here and run:
@architect *create-backend-architecture
```

**If API contracts are missing in system-architecture.md**:
```
WARNING: System architecture lacks API Contracts Summary

Backend needs to know which APIs to implement.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If backend needs to implement APIs not in system-architecture.md** (Step 3 validation failure):
```
ERROR: PRD features require APIs not defined in system-architecture.md

The following APIs are needed for PRD features but NOT in system-architecture.md:
- {{undefined_api_1}}
- {{undefined_api_2}}

**Action Required**:
1. If these APIs are necessary: Update system-architecture.md to include them (and ensure frontend consumes them)
2. If these APIs are not necessary: Remove the features from PRD

All backend API implementations MUST be pre-defined in system-architecture.md to ensure frontend-backend alignment.
```

## Related Tasks

- **Prerequisites**: `create-system-architecture.md` (Product repo), `pm-create-prd.md` (Product repo)
- **Parallel**: `create-frontend-architecture.md`, `create-mobile-architecture.md`
- **Next Steps**: `sm-create-next-story.md` (Story creation for backend)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 3.0.0 | 2026-01-29 | REFACTOR: Draft-first workflow -- consolidated 9 interactive steps into 6 steps (context load, upfront questions, API gate, full generation, decision review, finalize). Added --interactive flag for backward compat. | Orchestrix Team |
| 2.1.0 | 2025-01-15 | REFACTOR: Simplified Step 7 template section description, reduced by 30 lines | Orchestrix Team |
| 2.0.0 | 2025-01-14 | REFACTOR: Reduced from 1047 to 300 lines, removed template duplication, focused on procedures only | Orchestrix Team |
| 1.0.0 | 2025-01-14 | Initial creation for Phase 2 | Orchestrix Team |
