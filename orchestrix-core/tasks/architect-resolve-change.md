# Architect Tech-Level Change Resolution

## Purpose

Handle architecture-level changes: API contracts, database schemas, system design, tech stack.
Process technical change descriptions that may span multiple epics.
Escalate to PM if PRD/feature changes required.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Technical change description |
| scope | string | No | Affected scope (story_id, epic_id, or "system") |
| escalation_source | string | No | Agent that escalated (SM, PO, Dev, QA) |

## Process

### Step 1: Classify Change Level

Execute: `tasks/utils/classify-change-level.md`

```yaml
Input:
  change_description: "{change_description}"
  context:
    current_agent: "ARCHITECT"
```

**IF result == REDIRECT:**

- IF level == STORY or level == EPIC:
  ```
  ---ORCHESTRIX-HANDOFF-BEGIN---
  target: {handler}
  command: {command}
  args:
  ---ORCHESTRIX-HANDOFF-END---

  🎯 HANDOFF TO {handler}: *{command} - Not architecture scope
  ```
- IF level == PRODUCT:
  ```
  ---ORCHESTRIX-HANDOFF-BEGIN---
  target: pm
  command: revise-prd
  args:
  ---ORCHESTRIX-HANDOFF-END---

  🎯 HANDOFF TO PM: *revise-prd - PRD change required
  ```

Output handoff_message and **HALT**.

### Step 2: Load Technical Context

1. Read architecture documents:
   - `{docs_path}/architecture.md` (or system-architecture.md)
   - Frontend/Mobile architecture if applicable
2. Read affected epic/story files based on scope
3. Read API contracts if multi-repo project:
   - `{docs_path}/api-contracts/` directory
4. Read database schemas if applicable
5. Identify cross-service dependencies

### Step 3: Technical Impact Analysis

Parse `change_description` to assess impact across dimensions:

**Architecture Components:**
- Which components are affected?
- Are new components needed?
- Should components be removed/merged?

**API Contracts:**
- Endpoint changes (add/modify/remove)?
- Request/response schema changes?
- Breaking vs non-breaking changes?

**Database Schema:**
- Table changes?
- Migration required?
- Data integrity implications?

**Security:**
- Authentication/authorization impact?
- Data exposure risks?
- Compliance implications?

**Performance:**
- Latency impact?
- Scalability concerns?
- Resource utilization?

**Cross-Service:**
- Service communication changes?
- Dependency changes?
- Deployment order implications?

Generate impact matrix:
```markdown
| Component | Impact Level | Change Required |
|-----------|-------------|-----------------|
| {component} | HIGH/MEDIUM/LOW | {description} |
```

**Store impact_analysis** for scope classification:
```yaml
impact_analysis:
  api_contracts_affected: {boolean}
  api_consumers_external: {boolean}  # Do other repos consume these APIs?
  shared_schema_affected: {boolean}
  shared_data_structures: {boolean}
  system_architecture_affected: {boolean}
  new_services_added: {boolean}
  messaging_changes: {boolean}
  deployment_coordination_needed: {boolean}
  breaking_changes: {boolean}
```

---

### Step 3.5: Classify Proposal Scope (Multi-Repo Only)

Read: `{root}/core-config.yaml`
Extract: `project.mode`, `project.multi_repo.role`, `project.multi_repo.product_repo_path`

**IF project.mode = "multi-repo"**:

**Execute**: `tasks/utils/classify-proposal-scope.md`

```yaml
Input:
  impact_analysis: {impact_analysis from Step 3}
  project_mode: "multi-repo"
```

**Store**:
- `proposal_scope = result.scope`  # "LOCAL" | "CROSS_REPO"
- `scope_indicators = result.indicators_triggered`

**ELSE**:
- `proposal_scope = "LOCAL"`
- `scope_indicators = []`

---

### Step 4: Design Technical Solution

Based on analysis, produce:

1. **Architecture Change Proposal**
   - Component modifications
   - New patterns/approaches
   - Diagrams if structural change (Mermaid format)

2. **API Contract Modifications** (if applicable)
   - OpenAPI diff or new endpoint specs
   - Versioning strategy

3. **Database Migration Strategy** (if schema change)
   - Migration steps
   - Rollback plan
   - Data transformation logic

4. **Risk Assessment**
   - Identified risks
   - Mitigation strategies
   - Contingency plans

5. **Implementation Guidance**
   - Step-by-step for Dev
   - Testing requirements
   - Deployment considerations

### Step 5: Generate Technical Change Proposal

**Determine proposal location based on scope**:

```
IF proposal_scope = "CROSS_REPO" AND project.mode = "multi-repo":
  proposal_location = {product_repo_path}/docs/architecture/proposals/

  # Validate product repo access
  IF {product_repo_path} NOT exists:
    HALT with error: "Cannot store cross-repo proposal - product repo not accessible"
ELSE:
  proposal_location = docs/architecture/proposals/
```

**Filename pattern**: `{proposal-id}-{title-slug}.md`
- Example: `tcp-2025-001-workflow-data-access-refactor.md`

**Generate proposal_id**: `TCP-{YYYY}-{NNN}` (auto-increment)

Create proposal document:

```markdown
# Technical Change Proposal

## Metadata

| Property | Value |
|----------|-------|
| Proposal ID | {proposal_id} |
| Created | {YYYY-MM-DD} |
| Author | Architect Agent |
| Status | DRAFT |
| Scope | {proposal_scope} |
| Repository Origin | {repository_id} |
| Storage Location | {proposal_location} |

## Problem Statement
{change_description}

## Technical Analysis

### Impact Assessment
{impact matrix from Step 3}

### Root Cause / Trigger
{analysis of why this change is needed}

## Proposed Solution

### Architecture Changes
{detailed architecture modifications}

### API Changes
{API contract modifications if any}

### Database Changes
{schema changes and migration plan if any}

### Implementation Plan
Phase 1: {title}
- {deliverable 1}
- {deliverable 2}

Phase 2: {title}
- {deliverable 1}
...

## Risk Matrix

| Risk | Severity | Mitigation |
|------|----------|------------|
| {risk} | HIGH/MED/LOW | {mitigation} |

## Downstream Impact
- Components affected: [{components}]
- Epics affected: [{epic_ids}]
- Estimated effort: {low|medium|high}

## Testing Requirements
{testing approach for this change}
```

**Write file**: `docs/architecture/proposals/{filename}`

**Store**: `proposal_path = docs/architecture/proposals/{filename}`

### Step 6: Escalation Decision

Collect analysis results:
```yaml
analysis_result:
  requires_feature_change: {boolean}
  requires_scope_reduction: {boolean}
  mvp_viability_affected: {boolean}
  resolvable_with_tech_solution: {boolean}
  architecture_components_affected: [{components}]
  api_contracts_affected: {boolean}
  database_schema_affected: {boolean}
  estimated_effort: {low|medium|high}
  cross_epic_impact: {boolean}
  proposal_path: "{proposal_path from Step 5}"
```

Execute: `data/decisions/architect-change-escalation.yaml`

**Decision outcomes**:
- **ESCALATE_TO_PRODUCT**: Output HANDOFF to PM and **HALT**
- **HANDLE_IN_TECH + route_to_po**: Large scope, route to PO
- **HANDLE_IN_TECH + route_to_sm**: Small scope, route to SM

---

### Step 7: Finalize (if HANDLE_IN_TECH)

1. Present Technical Change Proposal summary to user
2. Request explicit approval for architecture changes
3. IF approved:
   - Update architecture documents (if needed)
   - Update API contracts (if changed)
4. Execute routing decision from Step 6

---

## Output

**Success - Large Scope (route to PO):**
```yaml
resolution: RESOLVED
proposal_path: "{proposal_path}"
architecture_updated: {boolean}
api_contracts_updated: {boolean}
files_modified:
  - path: "{file_path}"
    change: "{description}"
change_summary: "{Brief description}"
routing: PO
```

**HANDOFF (Large Scope)**:
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: po
command: review-tech-proposal
args: {proposal_path}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO PO: *review-tech-proposal {proposal_path}
Context: Tech proposal requires scope evaluation
Components affected: [{components}]
Estimated effort: {estimated_effort}
Action: Determine Epic assignment and create Story definition
```

---

**Success - Small Scope (route to SM):**
```yaml
resolution: RESOLVED
proposal_path: "{proposal_path}"
architecture_updated: {boolean}
files_modified:
  - path: "{file_path}"
    change: "{description}"
change_summary: "{Brief description}"
routing: SM
default_epic: "0"
```

**HANDOFF (Small Scope - LOCAL)**:
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: create-tech-story
args: {proposal_path}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO SM: *create-tech-story {proposal_path}
Context: Small-scope technical improvement
Default Epic: 0 (Technical Debt)
Action: Create Story directly from proposal
```

---

**Success - Cross-Repo Scope (multi-repo only):**

```yaml
resolution: RESOLVED
proposal_path: "{proposal_path}"  # In product repo
proposal_scope: "CROSS_REPO"
scope_indicators: [{triggered indicators}]
architecture_updated: {boolean}
files_modified:
  - path: "{file_path}"
    change: "{description}"
change_summary: "{Brief description}"
routing: PRODUCT_ARCHITECT
```

**Cross-Repo Guidance Message**:
```
⚠️ CROSS-REPOSITORY CHANGE DETECTED

This technical change affects multiple repositories and requires coordination
at the product level.

📍 ACTION REQUIRED:
1. Switch to product repository: cd {product_repo_path}
2. Execute: @architect *review-cross-repo-change {proposal_path}

Context:
- Scope: CROSS_REPO
- Indicators: [{scope_indicators}]
- Source repository: {repository_id}
- Affected repos: [{affected_repository_ids}]
- Proposal location: {proposal_path}

The proposal has been saved to the product repository for centralized review.
```

---

**Escalate to PM:**

**IF project.mode = "multi-repo" AND role != "product"**:
```
⚠️ PRODUCT-LEVEL CHANGE REQUIRED

This change requires PRD modification, which must be done in the product repository.

📍 ACTION REQUIRED:
1. Switch to product repository: cd {product_repo_path}
2. Execute: @pm *revise-prd

Context:
- Source repository: {repository_id}
- Technical Analysis: {summary}
- Feature impact: {description}
- MVP risk: {boolean}
- Reason: {reasoning}

The PRD and Epic definitions are managed in the product repository.
```

**ELSE** (monolith or product repo):
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: pm
command: revise-prd
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO PM: *revise-prd
Context: {escalation_context}
Technical Analysis: {summary}
Feature impact: {description}
MVP risk: {boolean}
Reason: {reasoning}
```
