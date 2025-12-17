# PM Product-Level PRD Revision

## Purpose

Handle fundamental product changes requiring PRD modification, MVP scope adjustment, or feature redefinition.
Process product-level change descriptions that may affect entire project direction.
This is the highest layer - no further escalation available.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Product-level change description |
| escalation_source | string | No | Agent that escalated (Architect, PO) |
| escalation_context | string | No | Context from escalating agent |

## Process

### Step 1: Validate Product-Level Scope

Verify `change_description` indicates product-level impact:

**Product-level indicators:**
- PRD modification needed
- MVP scope change
- Feature definition change
- Multiple epics affected
- Product direction shift
- Business requirement change

IF NOT clearly product-level:
```
This change may not require PRD revision.
Suggested routing:
- For story-level: 🎯 HANDOFF TO SM: *correct-course {story_id}
- For epic-level: 🎯 HANDOFF TO PO: *correct-course
- For architecture: 🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
```
Request user clarification before proceeding.

### Step 2: Load Product Context

1. Read `core-config.yaml` to determine paths:
   - `prd.prdFile`: PRD document location (e.g., `docs/prd.md`)
   - `project.mode`: monolith or multi-repo

2. Read current PRD document from configured path

3. Read Architecture documents for technical constraints

4. Read all Epic definitions using **Glob**:
   - Monolith: `Glob pattern: docs/prd/epic-*.md`
   - Multi-repo: `Glob pattern: docs/prd/epic-*.yaml`

5. Understand current MVP scope and priorities

6. Note escalation context if escalated from lower layer

### Step 3: Product Impact Analysis

Parse `change_description` to assess:

**Feature Impact:**
- Features to add?
- Features to remove?
- Features to modify?

**MVP Scope Impact:**
- Expand scope?
- Reduce scope?
- Maintain scope with modification?

**Priority Impact:**
- Feature priorities change?
- Epic reordering needed?
- Timeline implications?

**Downstream Impact:**
- Architecture changes triggered?
- Epics requiring restructure?
- Stories requiring revision?

Document impact assessment:
```yaml
affected_prd_sections: ["{section names}"]
affected_epics: ["{epic_ids}"]
affected_stories: ["{story_ids}"]
mvp_scope_change: "expand" | "reduce" | "maintain"
cascade_required: {boolean}
```

### Step 4: Draft PRD Revision

Based on analysis, produce:

1. **PRD Section Changes** (diff format)
   - Identify sections to modify
   - Draft new/modified content
   - Preserve version history

2. **MVP Scope Definition Update**
   - Revised MVP feature list
   - Updated success criteria
   - Modified milestones if applicable

3. **Feature Priority Update**
   - Revised priority ranking
   - Rationale for changes

4. **Epic List Update** (if structural change)
   - New epics to create
   - Epics to deprecate
   - Epic sequence changes

### Step 5: Generate PRD Change Proposal

Create formal proposal:

```markdown
# PRD Change Proposal

## Change Request Summary
{change_description}

Escalation source: {escalation_source or "Direct request"}
Context: {escalation_context or "N/A"}

## Impact Analysis

### Affected PRD Sections
{list of sections with impact level}

### MVP Scope Impact
Current MVP: {summary}
Proposed MVP: {summary}
Change type: {expand/reduce/maintain}

### Affected Downstream Artifacts
- Epics: [{epic_ids}]
- Stories: [{story_ids}] (estimated)
- Architecture: {impact summary}

## Proposed PRD Changes

### Section: {section_name}

**Current:**
```
{current content}
```

**Proposed:**
```
{proposed content}
```

### {repeat for each section}

## Cascade Plan

After PRD approval, the following downstream changes are needed:

1. Architecture Review
   - 🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
   - Context: PRD updated, verify architecture alignment

2. Epic/Story Alignment
   - 🎯 HANDOFF TO PO: *correct-course
   - Context: PRD updated, epic/story alignment needed

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| {risk} | HIGH/MED/LOW | {mitigation} |

## Recommendation
{recommended action with rationale}
```

### Step 6: User Approval

1. Present complete PRD Change Proposal to user
2. Highlight key changes and their implications
3. Request explicit approval

**IF NOT approved:**
- Note user feedback
- Return to Step 4 to iterate
- Ask clarifying questions if needed

**IF approved:**
- Record approval decision
- Proceed to Step 7

### Step 7: Apply Changes and Cascade

Upon approval:

1. **Update PRD document**
   - Apply approved section changes
   - Update version metadata
   - Add change log entry

2. **Output cascade HANDOFF chain**

```
✅ PRD updated successfully

Files modified:
- {docs_path}/prd.md

Cascade HANDOFFs required:


🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
Context: PRD updated - {change_summary}
Sections changed: [{prd_sections}]
Action needed: Review architecture alignment with updated requirements


🎯 HANDOFF TO PO: *correct-course
Context: PRD updated - {change_summary}
Epics affected: [{epic_ids}]
Action needed: Review and update epic/story structure
```

## Output

**Success (approved and applied):**
```yaml
resolution: APPROVED_AND_APPLIED
prd_updated: true
files_modified:
  - path: "{docs_path}/prd.md"
    sections_changed: ["{section names}"]
mvp_scope_change: "expand" | "reduce" | "maintain"
change_summary: "{Brief description}"
cascade_handoffs:
  - to: ARCHITECT
    command: "*resolve-tech-change"
    context: "PRD updated, review architecture alignment"
  - to: PO
    command: "*correct-course"
    context: "PRD updated, epic/story alignment needed"
```

**User requested iteration:**
```yaml
resolution: ITERATION_REQUESTED
user_feedback: "{feedback summary}"
next_action: "Revise proposal based on feedback"
```

**Cascade HANDOFF to Architect:**
```

🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
Context: PRD updated - {change_summary}
PRD sections changed: [{sections}]
Technical implications: {summary}
Action needed: Review architecture alignment with updated requirements
```

**Cascade HANDOFF to PO:**
```

🎯 HANDOFF TO PO: *correct-course
Context: PRD updated - {change_summary}
Epics potentially affected: [{epic_ids}]
MVP scope change: {expand/reduce/maintain}
Action needed: Review and update epic/story structure to align with PRD
```
