# Create Backend Architecture

## Purpose

Generate a **detailed backend architecture document** for a backend implementation repository. This document provides implementation-level technical details for backend development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:
- ✅ Includes component designs, database schemas, code patterns, and implementation details
- ✅ References and aligns with the system-architecture.md from Product repository
- ✅ Validates that backend implements ALL APIs defined in system-architecture.md
- ✅ Uses `architecture-tmpl.yaml` template for output format
- ❌ Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

## Prerequisites

**Required Documents**:
- ✅ System Architecture exists at `../product-repo/docs/architecture/system-architecture.md` (or configured path)
- ✅ PRD exists at `../product-repo/docs/prd.md` (or configured path)

**Project Configuration**:
- ✅ Project type is `backend` in `core-config.yaml`
- ✅ `product_repo.path` is configured in `core-config.yaml` pointing to Product repository
- ✅ Running in Backend implementation repository (not Product repo)

**Recommended Environment**:
- 🌐 **Web interface** (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- 💻 IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project type
PROJECT_TYPE=$(grep "type:" core-config.yaml | awk '{print $2}')
if [ "$PROJECT_TYPE" != "backend" ]; then
  echo "❌ ERROR: Project type is '$PROJECT_TYPE', expected 'backend'"
  echo "This task should run in Backend implementation repository"
  exit 1
fi

# Check if product repo path is configured
PRODUCT_REPO_PATH=$(grep -A 1 "product_repo:" core-config.yaml | grep "path:" | awk '{print $2}')
if [ -z "$PRODUCT_REPO_PATH" ]; then
  echo "❌ ERROR: product_repo.path not configured in core-config.yaml"
  echo "Add this to core-config.yaml:"
  echo "product_repo:"
  echo "  path: ../my-project-product  # Adjust path to your Product repo"
  exit 1
fi

# Check if system architecture exists
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/architecture/system-architecture.md"
if [ ! -f "$SYSTEM_ARCH" ]; then
  echo "❌ ERROR: System architecture not found at $SYSTEM_ARCH"
  echo "👉 Action: Create system architecture first in Product repository"
  echo "@architect *create-system-architecture"
  exit 1
fi

echo "✅ Prerequisites validated. Proceeding with backend architecture generation..."
```

---

## Task Instructions

### Step 1: Load System Architecture Context

Load the system-level architecture as a CONSTRAINT for this detailed architecture.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture
PRODUCT_REPO_PATH=$(grep -A 1 "product_repo:" core-config.yaml | grep "path:" | awk '{print $2}')
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/architecture/system-architecture.md"
```

Read and analyze the system architecture document.

**Focus Areas**:
1. **Repository Topology**: Understand this backend's role in the overall system
2. **API Contracts Summary**: Identify which APIs THIS backend must implement (CRITICAL)
3. **Integration Strategy**: Authentication mechanism, data format standards, error handling conventions
4. **Deployment Architecture**: Where and how this backend deploys
5. **Cross-Cutting Concerns**: Security, performance, observability requirements

**Step 1.2: Extract Backend-Specific Constraints**

From the system architecture, extract:
- **APIs to Implement**: List of endpoints this backend must provide (CRITICAL)
- **APIs to Consume**: List of external/partner APIs this backend calls
- **Authentication Requirements**: JWT format, token validation, role-based access control
- **Data Format Standards**: JSON structure, date format (ISO 8601), pagination style (offset/cursor)
- **Error Handling Standard**: Error response format, HTTP status codes
- **Performance Requirements**: Response time SLAs (e.g., < 200ms p95), throughput targets
- **Security Requirements**: Encryption (TLS, at-rest), secrets management, security headers

**Elicit User Confirmation**:
```
📖 I've loaded the system architecture from Product repository.

**This Backend Repository's Role**:
- Repository Name: {{backend_repo_name}}
- Primary Responsibility: {{backend_responsibility}}

**APIs This Backend Must Implement** (from system-architecture.md):
[List all API categories and endpoints with clear formatting]

**Integration Constraints**:
- Authentication: {{auth_mechanism}} (JWT validation, RBAC)
- Data Format: {{data_format_standards}}
- Error Handling: {{error_standard}}

**Performance Requirements**:
- Response Time: {{response_sla}}
- Throughput: {{throughput_target}}

Does this match your understanding? Ready to proceed with detailed backend architecture?
```

---

### Step 2: Load PRD Context

Load the PRD to understand functional requirements.

**Step 2.1: Load PRD**

```bash
# Read PRD
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"
```

**Analysis Focus**:
- What are the main features/epics for backend?
- What business entities are involved? (Users, Products, Orders, etc.)
- What are the non-functional requirements? (scale, security, compliance)
- Are there any backend-specific stories or requirements?

**Step 2.2: Map Features to APIs and Data Models**

Cross-reference PRD features with API contracts from system-architecture.md:
- For each Epic, identify which APIs are needed
- For each Story (target_platform = backend), identify which endpoints to implement
- Identify business entities and their relationships
- Validate that all required APIs are covered in system-architecture.md

**Elicit User Confirmation**:
```
📚 I've analyzed the PRD and system architecture.

**Business Entities Identified**:
1. {{entity_1}} - {{description_1}}
2. {{entity_2}} - {{description_2}}
3. {{entity_3}} - {{description_3}}

**Feature-to-API Mapping**:
- Epic: {{epic_1}} → APIs: {{api_list_1}}
- Epic: {{epic_2}} → APIs: {{api_list_2}}

**Database Requirements**:
- Primary Database: {{db_type}} (SQL/NoSQL)
- Estimated Tables/Collections: {{table_count}}
- Key Relationships: {{relationship_summary}}

Does this match the project scope?
```

---

### Step 3: Validate API Implementation (CRITICAL)

**CRITICAL VALIDATION**: Ensure backend implements ALL APIs defined in system-architecture.md.

Based on the PRD features and system architecture API contracts, verify coverage:

**API Implementation Analysis**:
```
⚠️ **API Contract Validation**

I've analyzed the APIs this backend must implement from system-architecture.md:

**Authentication & User APIs**:
- POST /api/auth/login → ✅ Will implement
- POST /api/auth/register → ✅ Will implement
- POST /api/auth/refresh → ✅ Will implement
- GET /api/users/:id → ✅ Will implement

**Product APIs**:
- GET /api/products → ✅ Will implement
- GET /api/products/:id → ✅ Will implement
- POST /api/products → ✅ Will implement (Admin only)
- PUT /api/products/:id → ✅ Will implement (Admin only)

**Order APIs**:
- POST /api/orders → ✅ Will implement
- GET /api/orders → ✅ Will implement
- GET /api/orders/:id → ✅ Will implement

**Shopping Cart APIs**:
- GET /api/cart → ❌ NOT found in system-architecture.md but needed for Cart feature in PRD

**⚠️ VALIDATION WARNING**: Cart feature in PRD requires Cart APIs, but they're not in system-architecture.md

**Action Required**:
1. Option A: Update system-architecture.md to add Cart APIs
2. Option B: Remove Cart feature from PRD
3. Option C: Implement Cart client-side only (no backend APIs)

Please choose how to proceed before I continue with architecture design.
```

**IF all APIs validated successfully**:
```
✅ **API Contract Validation PASSED**

All {{api_count}} APIs defined in system-architecture.md are accounted for in this backend architecture.
Backend will implement all required endpoints. Proceeding with detailed architecture design...
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding.

---

### Step 4: Design Service Components

Based on system constraints and PRD requirements, design the internal component architecture.

**Step 4.1: Choose Architecture Pattern**

Recommend architecture pattern based on tech stack and project complexity:

**Elicit from User**:
```
🏗️ **Backend Architecture Pattern**

Based on your tech stack from system-architecture.md, I recommend:

**Option 1: Three-Layer Architecture** (MVC)
- Controllers (API Layer) → Services (Business Logic) → Repositories (Data Access)
- Pros: Simple, widely understood, good for moderate complexity
- Cons: Can become monolithic, harder to test in isolation

**Option 2: Hexagonal Architecture** (Clean Architecture)
- HTTP Adapters → Use Cases → Domain Models → Repository Interfaces → Repository Implementations
- Pros: Highly testable, business logic independent of infrastructure, easier to swap implementations
- Cons: More boilerplate, steeper learning curve

**Option 3: Domain-Driven Design** (DDD)
- Aggregates, Entities, Value Objects, Domain Services, Application Services
- Pros: Best for complex business logic, clear domain boundaries
- Cons: Overkill for simple CRUD apps, requires DDD expertise

**Recommended**: {{recommended_pattern}}
**Rationale**: {{why_this_pattern}}

What's your preference?
```

**Step 4.2: Define Component Layers**

Based on chosen pattern, define component structure:
- **API Layer**: Controllers, route handlers, middleware
- **Business Logic Layer**: Services, use cases, domain models
- **Data Access Layer**: Repositories, ORMs, database clients
- **Infrastructure Layer**: Auth, logging, monitoring, external integrations

**Step 4.3: Map APIs to Components**

For each API endpoint from system-architecture.md, identify:
- Controller/Route handler name
- Service method name
- Repository methods needed
- Database entities involved

**Elicit User Confirmation**:
```
🧩 **Proposed Backend Component Architecture**:

**API Layer** ({{controller_count}} controllers):
- AuthController: login, register, refresh
- UserController: getUser, updateUser
- ProductController: getProducts, getProduct, createProduct, updateProduct
- OrderController: createOrder, getOrders, getOrder

**Business Logic Layer** ({{service_count}} services):
- AuthService: authenticate, generateToken, refreshToken
- UserService: findById, update, delete
- ProductService: findAll, findById, create, update, delete
- OrderService: create, findByUser, findById, calculateTotal

**Data Access Layer** ({{repository_count}} repositories):
- UserRepository: findById, findByEmail, create, update
- ProductRepository: findAll, findById, create, update, delete
- OrderRepository: create, findByUserId, findById

Does this component structure make sense for your backend?
```

---

### Step 5: Design Database Schema

Based on identified business entities from Step 2, design the database schema.

**Step 5.1: Define Tables/Collections**

For each business entity, define:
- Table/Collection name
- Primary key
- Key fields and data types
- Indexes for performance
- Constraints (NOT NULL, UNIQUE, FOREIGN KEY)

**Step 5.2: Define Relationships**

Document relationships between entities:
- One-to-One (e.g., User ← UserProfile)
- One-to-Many (e.g., User → Orders)
- Many-to-Many (e.g., Orders ↔ Products via OrderItems)

**Step 5.3: Define Migrations Strategy**

Choose migration tool based on tech stack:
- Node.js: Knex, TypeORM, Prisma Migrate
- Python: Alembic, Django Migrations
- Java: Flyway, Liquibase

**Elicit User Confirmation**:
```
🗄️ **Proposed Database Schema**:

**Tables** ({{table_count}} total):

**users**:
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- Index: email

**products**:
- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- description: TEXT
- price: DECIMAL(10,2) NOT NULL
- stock_quantity: INT NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- Index: name

**orders**:
- id: UUID (PK)
- user_id: UUID (FK → users.id)
- status: ENUM('pending', 'confirmed', 'shipped', 'delivered')
- total_amount: DECIMAL(10,2) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- Index: user_id, status

**order_items**:
- id: UUID (PK)
- order_id: UUID (FK → orders.id)
- product_id: UUID (FK → products.id)
- quantity: INT NOT NULL
- unit_price: DECIMAL(10,2) NOT NULL
- Index: order_id, product_id

**Key Relationships**:
- User 1→N Orders
- Order 1→N OrderItems
- Product 1→N OrderItems

Does this database schema cover all requirements?
```

---

### Step 6: Define API Implementation Details

For each API from system-architecture.md, define implementation details.

**Step 6.1: Define Request/Response Schemas**

For each endpoint, define:
- Request body schema (JSON)
- Response body schema (JSON)
- Query parameters
- Path parameters
- Headers (Authorization, Content-Type)

**Step 6.2: Define Validation Rules**

For each request field, define:
- Data type
- Required/Optional
- Min/Max length or value
- Format (email, UUID, ISO 8601 date)
- Custom validation (e.g., password strength)

**Step 6.3: Define Error Responses**

Based on error handling standard from system-architecture.md, define error format:
- HTTP status codes (400, 401, 403, 404, 500)
- Error response structure (code, message, details)
- Validation error format

**Elicit User Confirmation**:
```
📝 **API Implementation Details**:

**Example: POST /api/auth/login**:

**Request**:
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)"
}
```

**Response (200)**:
```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string (JWT)",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "created_at": "ISO 8601"
  }
}
```

**Error Response (401)**:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

Does this API implementation detail level match your expectations?
```

---

### Step 7: Generate Backend Architecture Document Using Template

Now generate the complete document using the `architecture-tmpl.yaml` template.

**Step 7.1: Prepare Output Directory**

```bash
# Ensure docs directory exists
mkdir -p docs

# Set output path
OUTPUT_PATH="docs/architecture.md"
```

**Step 7.2: Load Template and Fill Sections**

Use the `architecture-tmpl.yaml` template to generate the document. The template defines the output format for:

1. **System Architecture Context** - Present loaded constraints from Step 1
2. **High Level Architecture** - Technical summary, overview, project diagram, architectural patterns
3. **Tech Stack** - Cloud infrastructure, technology stack table with versions
4. **Data Models** - Core business entities with attributes and relationships
5. **Components** - Service components with responsibilities, interfaces, dependencies
6. **External APIs** - Third-party integrations (if any)
7. **Core Workflows** - Sequence diagrams for key workflows
8. **REST API Spec** - OpenAPI 3.0 specification
9. **Database Schema** - Complete schema with tables, relationships, indexes
10. **Authentication & Authorization** - Auth implementation details
11. **Testing Strategy** - Unit, integration, E2E test approach
12. **Deployment** - Deployment architecture and CI/CD pipeline
13. **Monitoring & Logging** - Observability strategy

**Fill each template section** with information collected in Steps 1-6:
- Use actual tech stack from system-architecture.md
- Use actual API endpoints from system-architecture.md
- Use actual auth mechanism from system-architecture.md
- Include all validated API implementations from Step 3
- Include complete database schema from Step 5

**Template Reference Pattern**:
```markdown
## Output Document Structure

This task generates a backend architecture document following the structure defined in:
`orchestrix-core/templates/architecture-tmpl.yaml`

The template sections will be filled with:
- System constraints from system-architecture.md (Step 1)
- PRD requirements (Step 2)
- Validated API implementations (Step 3)
- Component architecture decisions (Step 4)
- Database schema design (Step 5)
- API implementation details (Step 6)
```

---

### Step 8: Validate Against System Architecture

Perform final cross-validation to ensure alignment.

**Validation Checklist**:
```
📋 **Final Validation Checklist**:

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

All checks passed? ✅
```

---

### Step 9: Output Handoff

Present the completed backend architecture document and provide next steps.

**Success Output**:
```
✅ BACKEND ARCHITECTURE COMPLETE

📄 Generated Document: docs/architecture.md

📦 Backend Repository: {{backend_repo_name}}
🖥️ Tech Stack: {{language}} + {{framework}} ({{version}})
🗄️ Database: {{database}} ({{db_version}})

🧩 Component Architecture:
  - {{controller_count}} Controllers
  - {{service_count}} Services
  - {{repository_count}} Repositories
  - Architecture Pattern: {{architecture_pattern}}

🔌 API Implementation:
  - Endpoints: {{api_count}} (all from system-architecture.md ✅)
  - Auth Strategy: {{auth_strategy}}
  - OpenAPI Spec: Generated

🗄️ Database Schema:
  - Tables: {{table_count}}
  - Relationships: {{relationship_count}}
  - Migration Tool: {{migration_tool}}

🔒 Security:
  - Authentication: {{auth_mechanism}}
  - Authorization: {{rbac_details}}
  - Security Headers: {{security_headers}}

---

📋 **NEXT STEPS**:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate database schema covers all requirements

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all backend features are covered

3. **Dev: Begin Backend Implementation**

   **Setup Project**:
   ```bash
   # Initialize project (adjust based on your framework choice)
   mkdir {{project_name}}
   cd {{project_name}}
   npm init -y  # or python -m venv venv, etc.

   # Install dependencies from architecture doc
   npm install {{dependencies}}
   npm install --save-dev {{dev_dependencies}}
   ```

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

🎉 **Backend architecture is now the technical blueprint for API development!**

All backend development will reference this document to ensure consistency with system architecture and frontend expectations.
```

---

## Notes for Agent Execution

- **Context Management**: This task requires significant context (system-architecture.md + PRD + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All APIs from system-architecture.md MUST be implemented. If system-arch is missing APIs needed for PRD features, either add them to system-arch or remove the features from PRD.

- **PRD is Blueprint**: Backend must support all features defined in PRD where target_platform = backend.

- **Template Reference**: This task uses `architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **Iterative Refinement**: Expect 2-4 rounds of user feedback, especially for:
  - Architecture pattern choice (Three-Layer vs Hexagonal vs DDD)
  - Database schema design (tables, relationships, indexes)
  - API implementation details (validation rules, error handling)

- **API Validation is Critical**: Step 3 is the most important validation. If it fails, STOP and wait for user to resolve before proceeding.

## Success Criteria

- ✅ Backend architecture document exists at `docs/architecture.md`
- ✅ All APIs from system-architecture.md are implemented (Step 3 validation passed)
- ✅ Component architecture is clear and follows chosen pattern
- ✅ Database schema covers all business entities with proper relationships
- ✅ API implementation details are complete (request/response schemas, validation, errors)
- ✅ Authentication and authorization implementation is detailed
- ✅ Testing strategy is comprehensive (unit, integration, E2E)
- ✅ Deployment and monitoring strategy is documented
- ✅ User has approved the document
- ✅ Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:
```
❌ ERROR: System architecture not found

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
⚠️ WARNING: System architecture lacks API Contracts Summary

Backend needs to know which APIs to implement.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If backend needs to implement APIs not in system-architecture.md** (Step 3 validation failure):
```
❌ ERROR: PRD features require APIs not defined in system-architecture.md

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
| 2.0.0 | 2025-01-14 | REFACTOR: Reduced from 1047 to 300 lines, removed template duplication, focused on procedures only | Orchestrix Team |
| 1.0.0 | 2025-01-14 | Initial creation for Phase 2 | Orchestrix Team |
