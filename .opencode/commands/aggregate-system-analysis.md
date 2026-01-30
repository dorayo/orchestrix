---
description: "Aggregate System Analysis (Brownfield Multi-Repository)"
---

When this command is used, execute the following task:

# Aggregate System Analysis (Brownfield Multi-Repository)

## Purpose

Generate a **system-level analysis document** for existing (brownfield) multi-repository projects by aggregating existing-system-analysis documents from implementation repositories. This is the **first step** in the Multi-Repository Brownfield Enhancement workflow.

**Use Case**: You have multiple existing repositories (backend, frontend, mobile) with `docs/existing-system-analysis.md` files documenting their current state, and you want to create a unified system-level analysis that captures the overall integration and gaps.

**What This Task Does**:

- Reads `existing-system-analysis.md` from each implementation repository
- Extracts cross-repository integration information
- Identifies API contracts and communication patterns
- Detects integration gaps and inconsistencies
- Aggregates into `docs/existing-system-integration.md` in Product repository
- Provides foundation for creating Brownfield PRD

**IMPORTANT**: This is the first step of a 3-step Brownfield Enhancement workflow:

1. **Step 1** (this task): Aggregate analysis → `existing-system-integration.md`
2. **Step 2**: Create PRD → `prd.md` (using `*create-doc brownfield-prd`)
3. **Step 3**: Design improved architecture → `architecture.md`

## Prerequisites

**Required Setup**:

- ✅ Product repository exists with `core-config.yaml` (mode: `multi-repo`, role: `product`)
- ✅ At least 2 implementation repositories exist
- ✅ Each implementation repo has `docs/existing-system-analysis.md` (generated via `*document-project`)

**Project Configuration**:

- ✅ Running in Product repository (not implementation repo)
- ✅ `implementation_repos` list configured in Product repo's `core-config.yaml`

**Example Configuration**:

```yaml
# Product repository: my-app-product/core-config.yaml
project:
  name: My App
  mode: multi-repo

  multi_repo:
    role: product

    implementation_repos:
      - repository_id: my-app-backend
        path: ../my-app-backend
        type: backend
      - repository_id: my-app-web
        path: ../my-app-web
        type: frontend
      - repository_id: my-app-ios
        path: ../my-app-ios
        type: ios
```

**Recommended Environment**:

- 🌐 Web interface (large context window) - Recommended
- 💻 IDE (Claude Code, Cursor, etc.) - Acceptable

## Validation

Before starting, validate prerequisites:

```bash
# Check project mode and role
PROJECT_MODE=$(grep -A 1 "^project:" core-config.yaml | grep "mode:" | awk '{print $2}')
PROJECT_ROLE=$(grep -A 5 "multi_repo:" core-config.yaml | grep "^\s*role:" | awk '{print $2}')

if [ "$PROJECT_MODE" != "multi-repo" ] || [ "$PROJECT_ROLE" != "product" ]; then
  echo "❌ ERROR: Invalid project configuration"
  echo "   Current: mode='$PROJECT_MODE', role='$PROJECT_ROLE'"
  echo "   Expected: mode='multi-repo', role='product'"
  echo "This task should run in Product repository"
  exit 1
fi

# Check if implementation_repos is configured
if ! grep -q "implementation_repos:" core-config.yaml; then
  echo "❌ ERROR: implementation_repos not configured in core-config.yaml"
  exit 1
fi

# Check if at least 2 implementation repos exist
REPO_COUNT=$(grep -A 10 "implementation_repos:" core-config.yaml | grep "path:" | wc -l)
if [ "$REPO_COUNT" -lt 2 ]; then
  echo "⚠️ WARNING: Only $REPO_COUNT implementation repository configured"
  echo "For multi-repository analysis, at least 2 repos are recommended"
fi

echo "✅ Prerequisites validated. Proceeding with system analysis aggregation..."
```

---

## Task Instructions

### Step 1: Discover Implementation Repositories

Load the list of implementation repositories from Product repo configuration.

**Step 1.1: Parse Configuration**

Read `implementation_repos` from `core-config.yaml` to get list of repositories.

**Step 1.2: Validate Repository Existence**

For each repository path:

- Check if directory exists
- Check if `docs/existing-system-analysis.md` exists
- Report status

**Step 1.3: Present Discovery Results**

**Elicit User Confirmation**:

```
🔍 **Implementation Repositories Discovered**:

| Repository Path | Type | Status | Analysis Doc |
|----------------|------|--------|--------------|
| ../my-app-backend | backend | ✅ Exists | ✅ Found at docs/existing-system-analysis.md |
| ../my-app-web | frontend | ✅ Exists | ✅ Found at docs/existing-system-analysis.md |
| ../my-app-ios | ios | ✅ Exists | ❌ Not found |

**Total Repositories**: 3
**Repositories with Analysis Docs**: 2

**Note**: Repositories without analysis docs will be skipped (or you can analyze their code directly).

Ready to proceed with aggregation?
```

---

### Step 2: Read and Parse Analysis Documents

For each implementation repository with `existing-system-analysis.md`, extract key information.

**Step 2.1: Read Analysis Document**

For each repository:

```bash
REPO_PATH="../my-app-backend"
ANALYSIS_DOC="$REPO_PATH/docs/existing-system-analysis.md"

if [ -f "$ANALYSIS_DOC" ]; then
  echo "✅ Reading: $ANALYSIS_DOC"
  # Extract information (see below)
else
  echo "⚠️ Skipping: No analysis document found"
fi
```

**Step 2.2: Extract Repository Information**

From each analysis document, extract:

**1. Repository Identity**:

- Repository name
- Repository type (backend, frontend, ios, android, mobile)
- Primary responsibility

**2. Tech Stack**:

- Languages and versions
- Frameworks and versions
- Database/storage
- Key dependencies

**3. API Information**:

- **Backend**: APIs provided (endpoints list)
- **Frontend/Mobile**: APIs consumed (API calls list)

**4. Integration Patterns**:

- Authentication mechanism
- Data format standards
- Error handling patterns

**5. Technical Debt**:

- Critical technical debt
- Known issues
- Workarounds

**6. Deployment**:

- Deployment platform
- Environment URLs

**Example Extraction from Backend Analysis**:

```markdown
# Extracted from: ../my-app-backend/docs/existing-system-analysis.md

**Repository**: my-app-backend
**Type**: backend
**Tech Stack**: Node.js 20 + Express 4 + PostgreSQL 15
**Responsibility**: REST APIs for task management

**APIs Provided** (11 endpoints):

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/users/me
- PUT /api/users/me
- GET /api/tasks
- GET /api/tasks/:id
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

**Authentication**: JWT (15min access token, 7day refresh token)
**Data Format**: JSON, ISO 8601 dates, camelCase fields
**Technical Debt**:

- No API documentation (OpenAPI)
- No rate limiting
- Inconsistent error response format
```

---

### Step 3: Analyze Cross-Repository Integration

This is the **most important step** - analyze how repositories integrate.

**Step 3.1: Create Repository Topology**

Create a table showing all repositories and their relationships:

| Repository     | Type     | Responsibility | Tech Stack            | Team     |
| -------------- | -------- | -------------- | --------------------- | -------- |
| my-app-backend | backend  | REST APIs      | Node.js 20 + Express  | Backend  |
| my-app-web     | frontend | Web UI         | React 18 + Next.js 14 | Frontend |
| my-app-ios     | ios      | iOS app        | Swift 5 + SwiftUI     | Mobile   |

**Step 3.2: Map API Contracts**

Create a comprehensive API contract map:

**Backend APIs Provided** (from backend analysis):

```
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
```

**Frontend APIs Consumed** (from frontend analysis):

```
- POST /api/auth/register ✅
- POST /api/auth/login ✅
- POST /api/auth/logout ✅
- GET /api/users/me ✅
- GET /api/tasks ✅
- GET /api/tasks/:id ✅
- POST /api/tasks ✅
- PUT /api/tasks/:id ✅
- DELETE /api/tasks/:id ✅
```

**iOS APIs Consumed** (from iOS analysis):

```
- POST /api/auth/register ✅
- POST /api/auth/login ✅
- POST /api/auth/logout ✅
- GET /api/users/me ✅
- GET /api/tasks ✅
- GET /api/tasks/:id ✅
- POST /api/tasks ✅
- PUT /api/tasks/:id ✅
- DELETE /api/tasks/:id ✅
```

**Step 3.3: Validate API Alignment**

Cross-reference APIs:

```
✅ Aligned APIs (9):
  All frontend and iOS API calls are provided by backend

⚠️ Backend APIs NOT consumed (2):
  - POST /api/auth/refresh (not called by frontend, might be called by iOS)
  - PUT /api/users/me (not called by any client)

❌ Frontend APIs NOT provided (0):
  (None - good alignment)

❌ iOS APIs NOT provided (0):
  (None - good alignment)
```

**Step 3.4: Compare Integration Patterns**

Compare auth, data formats, error handling across repositories:

**Authentication Comparison**:
| Repository | Mechanism | Token Storage | Refresh Strategy |
|-----------|-----------|---------------|------------------|
| Backend | JWT | N/A (generates) | 15min access, 7day refresh |
| Frontend | JWT | localStorage ⚠️ | Manual refresh |
| iOS | JWT | Keychain ✅ | Automatic refresh |

**⚠️ Issue Detected**: Frontend uses localStorage (XSS risk), iOS uses Keychain (secure)

**Data Format Comparison**:
| Repository | Content-Type | Date Format | Pagination | Field Naming |
|-----------|-------------|-------------|-----------|--------------|
| Backend | JSON | ISO 8601 | Cursor-based | camelCase |
| Frontend | JSON | ISO 8601 | Cursor-based | camelCase |
| iOS | JSON | ISO 8601 | Cursor-based | camelCase |

**✅ Consistent**: All repositories use same data format standards

---

### Step 4: Identify System-Level Issues

Aggregate issues that span multiple repositories.

**Step 4.1: API Alignment Issues**

Document APIs that are:

- Provided but not consumed (unused endpoints)
- Consumed but not provided (missing endpoints)
- Inconsistent across repositories

**Step 4.2: Integration Pattern Inconsistencies**

Document inconsistencies in:

- Authentication mechanisms
- Token storage strategies
- Data format standards
- Error handling patterns

**Step 4.3: Cross-Repository Technical Debt**

Identify technical debt that affects multiple repositories:

- Shared data models not synchronized
- API contracts not documented (no OpenAPI spec)
- Inconsistent error responses
- Missing integration tests

**Step 4.4: Deployment and Infrastructure Gaps**

Identify gaps in:

- Deployment coordination (deploy order, versioning)
- Environment synchronization
- CI/CD integration
- Monitoring and observability

---

### Step 5: Generate System Integration Analysis Document

Now generate `docs/existing-system-integration.md` using aggregated information.

**Step 5.1: Prepare Output Directory**

```bash
mkdir -p docs
OUTPUT_PATH="docs/existing-system-integration.md"
```

**Step 5.2: Document Structure**

Generate document with the following sections:

```markdown
# System Integration Analysis (Multi-Repository Brownfield)

> **Status**: Aggregated from {{repo_count}} implementation repositories on {{date}}

## Introduction

This document captures the CURRENT STATE of the multi-repository system integration, aggregated from individual repository analyses. It serves as the foundation for planning system-wide enhancements.

### Document Scope

- Source repositories: {{list_of_repos}}
- Analysis date: {{date}}
- Purpose: Understand existing system integration for enhancement planning

### Change Log

| Date     | Version | Description                         | Author    |
| -------- | ------- | ----------------------------------- | --------- |
| {{date}} | 1.0     | Initial system integration analysis | Architect |

## Repository Topology

[Insert repository topology table]

**Integration Overview**:

- Total repositories: {{count}}
- Backend repositories: {{backend_count}}
- Frontend/Mobile repositories: {{frontend_count}}

## Cross-Repository API Contracts

### Backend APIs Provided

[List all backend APIs organized by category]

### Frontend/Mobile APIs Consumed

[List all frontend/mobile API calls with alignment status]

### API Alignment Analysis

[Show alignment matrix with ✅ ⚠️ ❌ indicators]

## Integration Patterns

### Authentication & Authorization

[Compare auth mechanisms across repositories]

### Data Format Standards

[Compare data format standards]

### Error Handling Standards

[Compare error handling patterns]

## Current System Integration

### How Repositories Communicate

[Describe actual communication patterns]

### Data Flow

[Describe data flow between repositories]

### Shared Resources

[List shared databases, caches, message queues, etc.]

## Technical Debt (System-Level)

### Critical Cross-Repository Issues

[List critical issues affecting multiple repos]

### Integration Gaps

[List missing integration points]

### Consistency Issues

[List inconsistencies across repositories]

## Deployment Architecture

### Current Deployment Topology

[Describe how repositories are deployed]

### Environment Configuration

[List environments and URLs]

### CI/CD Strategy

[Describe current CI/CD setup]

## Gaps and Recommendations

### High Priority Issues

1. [Issue 1]
   - **Impact**: [Which repositories affected]
   - **Risk**: [Severity]
   - **Recommendation**: [How to fix]

### Medium Priority Issues

[List medium priority issues]

### Low Priority Issues

[List low priority issues]

## Appendix - Aggregation Metadata

**Aggregation Method**: Bottom-up from existing-system-analysis.md files
**Source Documents**:

- {{repo_1}}/docs/existing-system-analysis.md
- {{repo_2}}/docs/existing-system-analysis.md
- {{repo_3}}/docs/existing-system-analysis.md

**Data Quality**:

- Repositories with analysis docs: {{count_with_docs}}/{{total_count}}
- Confidence level: {{confidence}} (High/Medium/Low)

**Known Limitations**:

- [List any limitations in the analysis]

**Next Steps**:

1. Review this analysis with stakeholders
2. Use this document as input for creating Brownfield PRD
3. Plan system-wide enhancements based on identified gaps
```

---

### Step 6: Validate Aggregated Analysis

Perform validation to ensure quality.

**Validation Checklist**:

- [ ] All implementation repositories with analysis docs are represented
- [ ] Repository topology is complete and accurate
- [ ] API contracts are comprehensive (backend provides + frontend/mobile consumes)
- [ ] Integration patterns are compared across repositories
- [ ] API alignment issues are clearly documented
- [ ] Cross-repository technical debt is identified
- [ ] Deployment architecture is complete
- [ ] Gaps and recommendations are actionable
- [ ] Aggregation metadata is complete

**Final Elicitation**:

```
📋 **System Integration Analysis Complete**

I've aggregated information from {{repo_count}} implementation repositories:
- {{backend_count}} backend repositories
- {{frontend_count}} frontend/mobile repositories

**Aggregated Content**:
✅ Repository Topology ({{repo_count}} repositories)
✅ API Contracts ({{api_count}} endpoints analyzed)
✅ Integration Patterns (Auth, Data Standards, Error Handling)
✅ Deployment Architecture ({{platform_count}} platforms)
✅ Cross-Repository Technical Debt

**Quality Indicators**:
- API Alignment: {{alignment_percent}}%
- Repositories with Docs: {{repos_with_docs}}/{{total_repos}}
- Confidence Level: {{confidence}}

**Identified Issues**:
- High Priority: {{high_count}}
- Medium Priority: {{medium_count}}
- Low Priority: {{low_count}}

**Output**: docs/existing-system-integration.md

Ready to review the system integration analysis?
```

---

### Step 7: Output Handoff

Present the completed document and next steps.

**Success Output**:

````
✅ SYSTEM INTEGRATION ANALYSIS COMPLETE

📄 Generated Document: docs/existing-system-integration.md

📊 **Analysis Summary**:

**Source Repositories** ({{repo_count}}):
- [backend] {{backend_repo_1}} ({{backend_tech_1}})
- [frontend] {{frontend_repo_1}} ({{frontend_tech_1}})
- [mobile] {{mobile_repo_1}} ({{mobile_tech_1}})

**API Contracts Analyzed**:
- Backend provides: {{backend_api_count}} endpoints
- Frontend consumes: {{frontend_api_count}} endpoints
- Mobile consumes: {{mobile_api_count}} endpoints
- Alignment: {{alignment_percent}}%

**Integration Issues Identified**:
- High Priority: {{high_count}}
- Medium Priority: {{medium_count}}
- Low Priority: {{low_count}}

**Quality Metrics**:
- Repositories with Analysis Docs: {{repos_with_docs}}/{{total_repos}}
- Confidence: {{confidence_level}}

---

📋 **NEXT STEPS** (Multi-Repo Brownfield Enhancement Workflow):

**Step 1 ✅ COMPLETE**: System Integration Analysis
  - Output: docs/existing-system-integration.md

**Step 2 (Next)**: Create Brownfield PRD
  ```bash
  @pm *create-doc brownfield-prd
  # PM will automatically detect multi-repo mode
  # Will read: docs/existing-system-integration.md
  # Output: docs/prd.md (with embedded epic YAML blocks)
````

**Step 3 (After PRD)**: Design Enhanced System Architecture

```bash
@architect *create-system-architecture
# Will detect brownfield mode
# Will read: docs/prd.md + docs/existing-system-integration.md
# Output: docs/system-architecture.md (with improvements)
```

**Step 4 (After Architecture)**: Shard System Documents (Product Repo)

```bash
@po *shard
# Shards PRD → docs/prd/*.md (preserves epic YAML)
# Shards system-architecture.md → docs/system-architecture/*.md
```

**Step 5 (In Each Implementation Repo)**: Create & Shard Implementation Architectures

**5.1 Configure Product Repo Link** (in each implementation repo):

```bash
cd ../{{backend_repo}}
# Edit core-config.yaml:
# project:
#   mode: multi-repo
#   multi_repo:
#     role: backend
#     product_repo_path: ../{{product_repo}}
```

**5.2 Create Implementation Architecture**:

```bash
@architect *create-backend-architecture
# Reads: {product_repo}/docs/system-architecture.md
# Output: docs/architecture.md (backend-specific)
```

**5.3 Shard Implementation Architecture**:

```bash
@po *shard
# Skips PRD (managed in Product repo)
# Shards architecture.md → docs/architecture/*.md
```

**Repeat for all repos**: frontend, ios, android, etc.

**Step 6 (Development)**: Create Stories & Implement

```bash
# In each implementation repo
@sm *create-next-story  # Reads epics from Product repo, filters by repository_type
@dev *implement {story_id}
@qa *review {story_id}
```

---

🎉 **You now have a comprehensive understanding of your existing multi-repository system!**

Use this analysis to plan system-wide enhancements that improve upon current limitations.

```

---

## Notes for Agent Execution

- **Multi-Repository Context**: This task analyzes MULTIPLE existing repositories. Expect to read multiple analysis documents.

- **Focus on Integration**: The key value is understanding HOW repositories integrate, not just WHAT each repository does individually.

- **Document Gaps Honestly**: Don't hide problems. Document API misalignments, inconsistencies, and technical debt clearly.

- **Prepare for Enhancement**: This analysis is input for the PRD step. Make sure gaps and recommendations are actionable.

## Success Criteria

- ✅ System integration analysis document exists at `docs/existing-system-integration.md`
- ✅ All implementation repositories with analysis docs are represented
- ✅ Repository topology is complete
- ✅ API contracts are comprehensive (backend provides + clients consume)
- ✅ API alignment is validated and documented
- ✅ Integration patterns are compared across repositories
- ✅ Cross-repository technical debt is identified
- ✅ Gaps and recommendations are actionable
- ✅ Document is ready to be used as input for Brownfield PRD

## Error Handling

**If no implementation repositories are configured**:
```

❌ ERROR: No implementation repositories configured

Add implementation repositories to core-config.yaml:

implementation_repos:

- path: ../my-app-backend
  type: backend
- path: ../my-app-web
  type: frontend

Then run: @architect \*aggregate-system-analysis

```

**If no repositories have analysis docs**:
```

❌ ERROR: No existing-system-analysis.md found in any repository

Before aggregating, each repository needs an analysis document.

Run this in each implementation repository:
cd ../my-app-backend
@architect \*document-project

# Output: docs/existing-system-analysis.md

Then return here and run: @architect \*aggregate-system-analysis

```

**If API alignment is very poor**:
```

🚨 CRITICAL: API Alignment is only {{alignment_percent}}%

**Misalignment Issues**:

- Frontend calls {{missing_api_count}} APIs not provided by backend
- Backend provides {{unused_api_count}} APIs not consumed by any client

**This indicates serious integration problems.**

Document will include warnings. Please review carefully.

```

## Related Tasks

- **Prerequisites**: `document-project.md` (must run in each implementation repo first)
- **Next Step**: `create-doc.md` with `brownfield-prd` template (Step 2 of workflow)
- **Related**: `aggregate-system-architecture.md` (aggregates architecture docs, not analysis docs)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-15 | Initial creation for Multi-Repo Brownfield Enhancement | Orchestrix Team |
```
