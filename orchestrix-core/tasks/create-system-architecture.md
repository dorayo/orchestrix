# Create System Architecture

## Workflow Mode

**Default**: Draft-first mode. Generates a complete architecture document in one pass after collecting a small set of upfront questions, then presents key decisions for review.

**`--interactive` flag**: Reverts to step-by-step mode where each section is presented individually for confirmation before proceeding. When `--interactive` is passed, execute the legacy interactive workflow:
- Step 1 confirms context loading
- Steps 2-6 each present one section, elicit user confirmation, then proceed
- Step 7 generates the document
- Steps 8-10 validate and finalize

The steps below describe the **default draft-first workflow**.

---

## Prerequisites

**Required Documents**:
- PRD exists at `docs/prd.md`
- Front-End Spec at `docs/front-end-spec.md` (optional)
- **Brownfield Mode**: `docs/existing-system-integration.md` (multi-repo) or `docs/existing-system-analysis.md` (single-repo)

**Project Configuration**:
- Project mode is `multi-repo` with role `product` in `core-config.yaml`

## Validation

```bash
# Check if PRD exists
if [ ! -f "docs/prd.md" ]; then
  echo "ERROR: PRD not found at docs/prd.md"
  echo "Action: Create PRD first using PM agent: @pm *create-doc prd"
  exit 1
fi

# Detect mode: Greenfield vs Brownfield
MODE="greenfield"
if [ -f "docs/existing-system-integration.md" ]; then
  MODE="brownfield-multi"
  echo "MODE DETECTED: Brownfield Multi-Repository Enhancement"
elif [ -f "docs/existing-system-analysis.md" ]; then
  MODE="brownfield-single"
  echo "MODE DETECTED: Brownfield Single-Repository Enhancement"
else
  echo "MODE DETECTED: Greenfield (New Project)"
fi

# Check project mode and role
PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 1 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')
if [ "$PROJECT_MODE" != "multi-repo" ] || [ "$PROJECT_ROLE" != "product" ]; then
  echo "WARNING: Project mode is '$PROJECT_MODE' with role '$PROJECT_ROLE', expected mode='multi-repo' role='product'"
  echo "Continue? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then exit 1; fi
fi

echo "Prerequisites validated. Proceeding with $MODE system architecture generation..."
```

---

## Task Instructions

### Step 1: Load Context & Validate

**Step 1.1: Mode Detection**

- If `docs/existing-system-integration.md` exists -> **Brownfield Multi-Repo Mode**
- If `docs/existing-system-analysis.md` exists -> **Brownfield Single-Repo Mode**
- Otherwise -> **Greenfield Mode**

**Step 1.2: Load Documents**

**All Modes**:
1. **PRD** (`docs/prd.md`) - REQUIRED
2. **Front-End Spec** (`docs/front-end-spec.md`) - OPTIONAL (if missing, extract UI/UX from PRD)

**Brownfield Multi-Repo Mode (Additional)**:
3. **Existing System Integration Analysis** (`docs/existing-system-integration.md`)

**Brownfield Single-Repo Mode (Additional)**:
3. **Existing System Analysis** (`docs/existing-system-analysis.md`)

**CRITICAL - Document Scope Restriction (Brownfield Multi-Repo Mode ONLY)**:

**ALLOWED - Read ONLY from Product Repository**:
- `docs/prd.md`
- `docs/front-end-spec.md`
- `docs/existing-system-integration.md`

**FORBIDDEN - DO NOT read from Implementation Repositories**:
- DO NOT read `../*/docs/existing-system-analysis.md`
- DO NOT read any files from `../` paths to implementation repos
- DO NOT scan implementation repository source code

**If `existing-system-integration.md` is missing or incomplete**:
- HALT execution immediately
- Instruct user: "Run `@architect *aggregate-system-analysis` first"

**Validation Check**:
```
Check core-config.yaml -> project.multi_repo.role
If role != 'product': HALT with error "This task must run in Product repository"
```

**Step 1.3: Extract Context Summary (No Elicitation)**

Internally extract and record:
- Main functional areas (3-5 feature categories from PRD)
- Platforms identified (Backend API, Web App, iOS App, etc.)
- Brownfield constraints if applicable (existing repos, tech stacks, integration patterns, technical debt)

Proceed directly to Step 2. Do NOT ask for confirmation.

---

### Step 2: Upfront Questions

Present all critical decision questions as a single numbered list. Wait for the user to answer before proceeding.

**Greenfield Mode Questions**:
```
I've loaded the PRD {{and_frontend_spec}}.

**Mode**: Greenfield (New Project)

**Main Functional Areas Detected**:
- [List 3-5 main feature categories from PRD]

**Platforms Identified**:
- [List platforms: Backend API, Web App, iOS App, etc.]

Before I generate the complete system architecture, I need your input on a few key decisions:

1. **Repository Topology** — Does the platform list above look correct? Any repos to add/remove? Confirm the tech stack preferences per repo (e.g., Node.js + Express for backend, React + Next.js for web).

2. **Authentication Mechanism** — Which approach?
   - (a) JWT — Stateless, scalable, recommended for multi-platform
   - (b) Session-based — Stateful, simpler
   - (c) OAuth 2.0 — For third-party identity providers
   - (d) Other / combination

3. **Deployment Platform Preferences** — Where will each component be deployed? (e.g., AWS Lambda, Vercel, App Store, Google Play, self-hosted)

4. **Compliance & Security Requirements** — Any compliance standards? (GDPR, HIPAA, PCI-DSS, SOC 2, none)

5. **API Versioning Strategy** — Which approach?
   - (a) URL Path Versioning (e.g., `/api/v1/users`) — recommended
   - (b) Header Versioning (e.g., `Accept: application/vnd.myapp.v1+json`)
   - (c) No Versioning

Please answer all 5 (brief answers are fine). If you want me to use sensible defaults for any, just say "default".
```

**Brownfield Multi-Repo Mode Questions**:
```
I've loaded the PRD, Front-End Spec, and Existing System Integration Analysis.

**Mode**: Brownfield Multi-Repository Enhancement

**Existing Repositories**:
- [List existing repos with tech stacks]

**New/Enhanced Functional Areas**:
- [List enhancements from PRD]

**Existing Constraints**:
- Technical Debt: [Key issues]
- Current Integration Patterns: [Auth, data formats]

Before I generate the complete system architecture, I need your input on a few key decisions:

1. **Repository Changes** — Should I add new repositories, or extend existing ones? Any repos to rename?

2. **Authentication Mechanism** — Keep existing approach ([detected approach]) or change?
   - (a) Keep current: [detected approach]
   - (b) JWT — Stateless, scalable
   - (c) Session-based — Stateful, simpler
   - (d) OAuth 2.0 — For third-party identity providers
   - (e) Other / combination

3. **Deployment Platform Preferences** — Keep existing platforms or migrate? (current: [detected platforms])

4. **Compliance & Security Requirements** — Any new compliance standards beyond existing? (GDPR, HIPAA, PCI-DSS, SOC 2, none)

5. **API Versioning Strategy** — Keep existing ([detected strategy]) or change?
   - (a) URL Path Versioning (e.g., `/api/v1/users`)
   - (b) Header Versioning
   - (c) No Versioning

Please answer all 5 (brief answers are fine). If you want me to use sensible defaults for any, just say "default".
```

**Wait for user response before proceeding to Step 3.**

---

### Step 3: Generate Complete Architecture Document

Using context from Step 1 and user answers from Step 2, generate the COMPLETE system architecture document in one pass. Use `system-architecture-tmpl.yaml` template as the structural guide.

**Step 3.1: Determine Output Path**

```bash
mkdir -p docs/architecture

PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 2 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')

if [ "$PROJECT_MODE" = "multi-repo" ] && [ "$PROJECT_ROLE" = "product" ]; then
  OUTPUT_PATH="docs/system-architecture.md"
else
  OUTPUT_PATH="docs/architecture.md"
fi
```

**Step 3.2: Generate All Sections**

The document MUST include all of the following sections. Use the user's answers from Step 2 combined with PRD analysis to make informed decisions for each section. Where the user said "default", apply the recommended defaults noted below.

**Section A: Repository Topology**

Apply the decision matrix:

| Requirement | Repository Needed |
|------------|------------------|
| Backend API functionality | `{project}-backend` |
| Web UI functionality | `{project}-web` |
| iOS app | `{project}-ios` |
| Android app | `{project}-android` |
| Cross-platform mobile | `{project}-mobile` |

For each repository, define:
1. **Repository Name**: `{project-name}-{type}`
2. **Repository Type**: backend | frontend | ios | android | mobile
3. **Primary Responsibility**: 1-2 sentences describing WHAT this repo does
4. **Technology Stack**: Language + Framework (high-level only)
5. **Deployment Platform**: From user's Step 2 answer
6. **Team Ownership**: Backend Team, Frontend Team, etc.

**Section B: API Contracts Summary**

Group related endpoints into logical categories:
- **Authentication APIs**: Login, logout, token refresh
- **User Management APIs**: User CRUD, profiles
- **[Business Entity] APIs**: For each main entity in PRD

For each category define:
1. **Category Name**
2. **Purpose**: 1 sentence
3. **Provider Repository**: Usually `{project}-backend`
4. **Consumer Repositories**: Which repos call these APIs
5. **Key Endpoints**: 3-10 main endpoints (method + path only)
   - Format: `POST /api/users`, `GET /api/products/:id`
6. **Authentication Requirement**: public | authenticated | admin-only
7. **Rate Limiting**: If applicable

Apply the user's chosen API versioning strategy from Step 2.

**Section C: Integration Strategy**

Generate all four subsections:

**C.1: Authentication & Authorization**

Use the user's chosen mechanism from Step 2. Include:
- **Authentication Mechanism**: JWT / Session / OAuth 2.0 (as chosen)
- If JWT:
  - Token Format: Bearer token in Authorization header
  - Token Storage: Web (HttpOnly cookies or localStorage), Mobile (Secure Keychain/KeyStore)
  - Token Lifetime: Access token (15min), Refresh token (7 days)
- **Authorization Pattern**: RBAC / ABAC / Simple (select based on PRD complexity)

**C.2: Data Format Standards**

Apply sensible defaults:
- **API Data Format**: JSON
- **Date/Time Format**: ISO 8601 (e.g., "2025-01-14T10:30:00Z")
- **Timezone Handling**: All dates in UTC
- **Pagination Style**: Cursor-based for large datasets, offset-based for simple lists
- **Field Naming Convention**: camelCase (default for JS/TS ecosystems) or snake_case (default for Python ecosystems) - match the backend tech stack

**C.3: Error Handling Standard**

All APIs MUST return errors in this standard format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email", "value": "invalid-email" },
    "timestamp": "2025-01-14T10:30:00Z",
    "request_id": "uuid-1234-5678"
  }
}
```

**HTTP Status Code Usage**:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid auth token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unexpected error

**C.4: Logging & Monitoring**

Select defaults based on deployment platform:
- **Log Format**: JSON structured logging
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Logging Platform**: Match deployment (AWS -> CloudWatch, GCP -> Cloud Logging, etc.)
- **Monitoring**: Match deployment (AWS -> CloudWatch Metrics, etc.)
- **Distributed Tracing**: OpenTelemetry (vendor-neutral default)

**Section D: Deployment Architecture**

Generate deployment targets table:

| Repository | Platform | Dev URL | Staging URL | Production URL |
|-----------|----------|---------|-------------|----------------|
| `{project}-backend` | [Platform] | `https://dev-api.{domain}` | `https://staging-api.{domain}` | `https://api.{domain}` |
| `{project}-web` | [Platform] | `https://dev.{domain}` | `https://staging.{domain}` | `https://{domain}` |

CI/CD defaults:
- **Platform**: GitHub Actions (default)
- **Deployment Triggers**: develop -> Dev, staging -> Staging, main -> Production (manual approval)
- **Quality Gates**: Coverage > 80%, no critical vulnerabilities

**Section E: Cross-Cutting Concerns**

**E.1: Security Requirements**

Based on user's compliance answer from Step 2:
- **Data Encryption**: In Transit (TLS 1.3), At Rest (AES-256)
- **Compliance Standards**: As specified by user
- **Security Scanning**: Dependabot (dependency), SonarQube (SAST)
- **Secrets Management**: Match deployment platform

**E.2: Performance Requirements**

Apply standard defaults (adjust based on PRD scale):
- **Response Time SLAs**: API < 200ms (p95), < 500ms (p99); Web Page Load < 2s; Mobile Launch < 1s
- **Throughput Targets**: 1000 requests/second per endpoint
- **Concurrent Users**: 10,000 simultaneous users
- **Availability Target**: 99.9% uptime

**E.3: Observability Strategy**

- **Logging**: Platform-matched, 30-day retention (90-day for compliance)
- **Monitoring**: Key metrics: request rate, error rate, latency, CPU/memory
- **Tracing**: OpenTelemetry, 1% sampling (production), 100% (dev/staging)
- **Alerting**: Critical (immediate), High (15min), Medium (1hr), Low (24hr)

**Section F: Topology Diagram**

Generate a Mermaid diagram showing repository relationships:

```mermaid
graph TB
    subgraph "Frontend Repositories"
        WEB[{{project}}-web<br/>React + Next.js]
        IOS[{{project}}-ios<br/>Swift + SwiftUI]
    end

    subgraph "Backend Repositories"
        API[{{project}}-backend<br/>Node.js + Express]
        DB[(PostgreSQL)]
    end

    WEB -->|REST API| API
    IOS -->|REST API| API
    API -->|SQL| DB
```

**Step 3.3: Add Document Metadata**

```yaml
---
document_type: system-architecture
version: 1.0.0
last_updated: {{current_date}}
status: draft
project_name: {{project_name}}
repositories: {{repository_count}}
---
```

**Step 3.4: Save Document**

Save the complete document to `{{OUTPUT_PATH}}`.

**Step 3.5: Track Design Decisions**

While generating, internally track every non-trivial decision made, categorized as:
- **Needs Confirmation** (RED): Decisions where user input was ambiguous or where alternatives have significant trade-offs
- **Suggest Review** (YELLOW): Decisions based on reasonable defaults that the user may want to customize
- **Standard Practice** (GREEN): Industry-standard decisions unlikely to need changes

---

### Step 4: Decision Review

Present the saved document path and key decisions to the user:

```
System architecture draft saved to {{OUTPUT_PATH}}

## Key Decisions & Uncertainties

### Needs Confirmation
1. [Decision] -- Reasoning + alternatives considered

### Suggest Review
2. [Decision] -- Reasoning + alternatives considered

### Standard Practice
3. [Decision] -- Brief reasoning

Review the document and let me know what to adjust.
```

**Wait for user feedback.** If the user requests changes:
- Apply changes to the saved document
- Re-present only the affected decisions
- Repeat until user approves

---

### Step 5: Validate and Finalize

**Step 5.1: Validation Checklist**

- [ ] All repositories from PRD covered
- [ ] API contract summary includes all major features
- [ ] Integration strategy complete and consistent
- [ ] Deployment architecture feasible
- [ ] Cross-cutting concerns comprehensive
- [ ] Diagrams accurate
- [ ] Document follows template structure

**Step 5.2: Update core-config.yaml**

```bash
if [ "$PROJECT_MODE" = "multi-repo" ] && [ "$PROJECT_ROLE" = "product" ]; then
  sed -i.bak 's|architectureFile:.*|architectureFile: docs/system-architecture.md|' core-config.yaml
  sed -i.bak 's|architectureSharded:.*|architectureSharded: false|' core-config.yaml
  sed -i.bak 's|architectureShardedLocation:.*|architectureShardedLocation: docs/system-architecture|' core-config.yaml
  echo "Updated core-config.yaml: architectureFile -> docs/system-architecture.md"
else
  sed -i.bak 's|architectureFile:.*|architectureFile: docs/architecture.md|' core-config.yaml
  sed -i.bak 's|architectureSharded:.*|architectureSharded: false|' core-config.yaml
  sed -i.bak 's|architectureShardedLocation:.*|architectureShardedLocation: docs/architecture|' core-config.yaml
  echo "Updated core-config.yaml: architectureFile -> docs/architecture.md"
fi

rm -f core-config.yaml.bak
```

**Step 5.3: Final Confirmation**

```
Validation complete. All checks passed.

Architecture document finalized at {{OUTPUT_PATH}}.

Approve to proceed with handoff?
```

---

### Step 6: Output Handoff

```
SYSTEM ARCHITECTURE COMPLETE

Generated Document: {{OUTPUT_PATH}}

Repository Topology ([N] repositories):
  - [backend] {{project}}-backend ({{tech_stack}})
  - [frontend] {{project}}-web ({{tech_stack}})

API Contracts Summary:
  - Authentication APIs ([M] endpoints)
  - User Management APIs ([M] endpoints)

Deployment Architecture:
  - Backend: [Platform]
  - Frontend: [Platform]

Cross-Cutting Concerns:
  - Security: [Auth mechanism], [Compliance]
  - Performance: [Response SLA], [Availability]
  - Observability: [Logging], [Monitoring], [Tracing]

---

NEXT STEPS:

**Step 4 (Next)**: Shard System Documents
  @po *shard

**Step 5**: Create & Shard Implementation Architectures
  - Configure product repo link in each implementation repo
  - Create implementation architecture: `@architect *create-backend-architecture`
  - Shard architecture: `@po *shard`

**Step 6**: Create Stories & Implement
  @sm *create-next-story
  @dev *implement {story_id}
  @qa *review {story_id}

System architecture is now the single source of truth!
```

---

## Error Handling

**If PRD is missing**:
```
ERROR: PRD not found at docs/prd.md

@pm *create-doc prd

After PRD is ready: @architect *create-system-architecture
```

**If project type is not product-planning**:
```
WARNING: Project type is '{{project_type}}', expected 'product-planning'

If this is a Product repo, update core-config.yaml:
project:
  type: product-planning

If this is an implementation repo:
- Use @architect *create-backend-architecture (for backend)
- Use @architect *create-frontend-architecture (for frontend)
```

## Related Tasks

- **Prerequisites**: `pm-create-prd.md`, `ux-create-front-end-spec.md`
- **Next Steps**: `create-backend-architecture.md`, `create-frontend-architecture.md`
- **Brownfield Alternative**: `aggregate-system-architecture.md`
