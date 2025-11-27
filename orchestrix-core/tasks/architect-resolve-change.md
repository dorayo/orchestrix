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

Execute: `utils/classify-change-level.md`

```yaml
Input:
  change_description: "{change_description}"
  context:
    current_agent: "ARCHITECT"
```

**IF result == REDIRECT:**

- IF level == STORY or level == EPIC:
  ```
  🎯 HANDOFF TO {handler}: *{command} - Not architecture scope
  ```
- IF level == PRODUCT:
  ```
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

Create proposal document:

```markdown
# Technical Change Proposal

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
1. {step 1}
2. {step 2}
...

## Risk Matrix

| Risk | Severity | Mitigation |
|------|----------|------------|
| {risk} | HIGH/MED/LOW | {mitigation} |

## Downstream Impact
- Stories requiring update: [{story_ids}]
- Epics requiring review: [{epic_ids}]
- Dev guidance: {summary}

## Testing Requirements
{testing approach for this change}
```

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
```

Execute: `data/decisions/architect-change-escalation.yaml`

- **HANDLE_IN_TECH**: Proceed to Step 7
- **ESCALATE_TO_PRODUCT**: Output HANDOFF to PM and **HALT**

### Step 7: Finalize (if HANDLE_IN_TECH)

1. Present Technical Change Proposal to user
2. Request explicit approval for architecture changes
3. IF approved:
   - Update architecture documents
   - Update API contracts (if changed)
   - Add architecture decision record if significant
4. Output downstream HANDOFF chain

## Output

**Success (handled locally):**
```yaml
resolution: RESOLVED
architecture_updated: {boolean}
api_contracts_updated: {boolean}
files_modified:
  - path: "{file_path}"
    change: "{description}"
change_summary: "{Brief description}"
downstream_handoffs:
  - to: PO
    command: "*correct-course"
    context: "Architecture updated, epic/story adjustment may be needed"
  - to: SM
    command: "*correct-course {story_id}"
    context: "Architecture updated, story revision may be needed"
```

**Downstream HANDOFF to PO:**
```
🎯 HANDOFF TO PO: *correct-course
Context: Architecture updated - {architecture_change_summary}
Components affected: [{components}]
Action needed: Review epic/story alignment with updated architecture
```

**Downstream HANDOFF to SM:**
```
🎯 HANDOFF TO SM: *correct-course {story_id}
Context: Architecture updated - {architecture_change_summary}
Story impact: {story_impact_description}
Action needed: Update story to align with architecture changes
```

**Escalate to PM:**
```
🎯 HANDOFF TO PM: *revise-prd
Context: {escalation_context}
Technical Analysis: {summary}
Feature impact: {description}
MVP risk: {boolean}
Reason: {reasoning}
```
