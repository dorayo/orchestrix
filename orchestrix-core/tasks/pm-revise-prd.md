# PM Product Change Resolution

## Purpose

Handle product-level changes requiring PRD modification, MVP scope adjustment, or feature redefinition.
Generate a Product Change Proposal (PCP) document.
If technical changes are needed, trigger Architect to create linked Technical Proposal.

## Command

```
*revise-prd <change_description>
```

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Product-level change description |

## Process

### Step 1: Load Product Context

1. Read `core-config.yaml`:
   - `prd.prdFile`: PRD document location
   - `project.mode`: monolith or multi-repo
   - `docs_path`: Documentation directory

2. Read current PRD document

3. Read Architecture documents for technical constraints

4. Read all Epic definitions using **Glob**:
   - Monolith: `docs/prd/epic-*.md`
   - Multi-repo: `docs/prd/epic-*.yaml`

5. Understand current MVP scope and priorities

### Step 2: Product Impact Analysis

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

**Technical Impact:**
- Does this require technical architecture changes?
- New APIs, database changes, or infrastructure?

Generate impact assessment:
```yaml
affected_prd_sections: ["{section names}"]
affected_epics: ["{epic_ids}"]
mvp_scope_change: "expand" | "reduce" | "maintain"
requires_tech_change: {boolean}
tech_change_hints: ["{hints if applicable}"]
```

### Step 3: Draft PRD Changes

Based on analysis, produce:

1. **PRD Section Changes**
   - Identify sections to modify
   - Draft new/modified content
   - Preserve version history

2. **MVP Scope Definition Update**
   - Revised MVP feature list
   - Updated success criteria

3. **Feature Priority Update**
   - Revised priority ranking
   - Rationale for changes

4. **Epic Impact Summary**
   - Epics requiring changes
   - New epics to create

5. **Story Requirements**
   - Break down into implementable Stories
   - Define acceptance criteria hints

### Step 4: Generate Proposal ID

1. Scan `docs/proposals/product/` directory
2. Find files matching `PCP-{current_year}-*.md`
3. Extract highest sequence number
4. Generate new ID: `PCP-{year}-{max + 1, zero-padded to 3 digits}`

```
Example:
  Existing: PCP-2025-001.md, PCP-2025-002.md
  New ID: PCP-2025-003
```

### Step 5: Create Product Change Proposal

Create file: `docs/proposals/product/{proposal_id}-{title_slug}.md`

Use template from `templates/product-proposal-tmpl.yaml`:

```markdown
---
metadata:
  proposal_id: {proposal_id}
  proposal_type: product
  title: "{title}"
  status: draft
  created_at: {YYYY-MM-DD}
  author: PM

linkage:
  requires_tech_change: {boolean}
  related_tech_proposal: null
  triggered_by: {user_request | market_feedback | strategic_pivot}
---

# {proposal_id}: {title}

## Change Summary
{summary of the product change}

## Change Background

### Trigger Reason
- [{x if user_requirement}] User requirement change
- [{x if market_feedback}] Market feedback
- [{x if resource_constraint}] Resource constraint
- [{x if technical_limitation}] Technical limitation
- [{x if strategic_pivot}] Strategic pivot

### Context
{background_context}

## PRD Changes

### Affected PRD Sections

| Section | Change Type | Impact Level |
|---------|-------------|--------------|
| {section} | {add/modify/remove} | {HIGH/MEDIUM/LOW} |

### Detailed Changes

#### Section: {section_name}

**Current:**
```
{current_content}
```

**Proposed:**
```
{proposed_content}
```

{repeat for each section}

## Impact Analysis

### MVP Scope Impact

- [{x if expand}] Expand scope
- [{x if reduce}] Reduce scope
- [{x if maintain}] Maintain scope with modifications

**Current MVP:** {current_mvp_summary}
**Proposed MVP:** {proposed_mvp_summary}

### Epic Impact

| Epic ID | Epic Title | Impact Type |
|---------|------------|-------------|
| {id} | {title} | {create/modify/deprecate} |

### Estimated Story Impact

- New stories: ~{count}
- Modified stories: ~{count}
- Removed stories: ~{count}

## Story Requirements

> This section is used by SM when executing `*apply-proposal`

### Story Requirement 1

```yaml
epic_id: {epic_id}
action: create
suggested_story_id: {epic_id}.{story_num}
title: "{story_title}"
description: |
  {story_description}
acceptance_criteria_hints:
  - {ac_hint_1}
  - {ac_hint_2}
complexity_hints: "{complexity_description}"
```

{repeat for each story requirement}

## Technical Change Requirements

### Requires Technical Change

- [{x if requires_tech_change}] Yes
- [{x if not requires_tech_change}] No

{#if requires_tech_change}
### Technical Change Overview

```yaml
tech_change_hints:
  - "{hint_1}"
  - "{hint_2}"
```

### Linked Technical Proposal

> Populated by Architect after creating TCP

```yaml
related_tech_proposal: null
tech_proposal_status: pending
```
{/if}

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| {risk} | {HIGH/MEDIUM/LOW} | {mitigation} |

## Approval Record

| Date | Approver | Decision | Notes |
|------|----------|----------|-------|
```

### Step 6: Update PRD Document

After proposal is created:

1. Apply approved PRD section changes to the actual PRD file
2. Update version metadata
3. Add change log entry

### Step 7: User Approval

1. Present Product Change Proposal summary to user
2. Highlight key changes:
   - MVP scope impact
   - Affected epics
   - Required technical changes
3. Request explicit approval

**IF NOT approved:**
- Note user feedback
- Return to Step 3 to iterate
- Ask clarifying questions if needed

**IF approved:**
- Proceed to output based on technical requirements

## Output

### Case 1: No Technical Change Required

Route directly to SM to apply the proposal.

**Success:**
```yaml
resolution: RESOLVED
proposal_id: "{proposal_id}"
proposal_path: "docs/proposals/product/{proposal_id}-{slug}.md"
proposal_type: product
status: draft
requires_tech_change: false
prd_updated: true
mvp_scope_change: "{expand | reduce | maintain}"
stories_defined: {count}
```

**HANDOFF to SM:**
```

🎯 HANDOFF TO SM: *apply-proposal {proposal_id}

Product Change Proposal Created:
- Proposal ID: {proposal_id}
- Title: {title}
- Path: docs/proposals/product/{proposal_id}-{slug}.md

PRD Updated:
- Sections modified: [{sections}]
- MVP scope: {expand | reduce | maintain}

Stories Defined: {count}
- {story_1_title}
- {story_2_title}
...

No technical changes required.
Action: Apply this proposal to create/update Stories
```

### Case 2: Technical Change Required

Route to Architect first to create linked Technical Proposal.

**Success:**
```yaml
resolution: RESOLVED
proposal_id: "{proposal_id}"
proposal_path: "docs/proposals/product/{proposal_id}-{slug}.md"
proposal_type: product
status: draft
requires_tech_change: true
tech_change_hints: ["{hints}"]
prd_updated: true
mvp_scope_change: "{expand | reduce | maintain}"
stories_defined: {count}
next_step: ARCHITECT
```

**HANDOFF to Architect:**
```

🎯 HANDOFF TO ARCHITECT: *resolve-change
related_product_proposal: {proposal_id}

Product Change Proposal Created:
- Proposal ID: {proposal_id}
- Title: {title}
- Path: docs/proposals/product/{proposal_id}-{slug}.md
- Status: draft (awaiting linked TCP)

PRD Updated:
- Sections modified: [{sections}]
- MVP scope: {expand | reduce | maintain}

Technical Changes Required:
```yaml
tech_change_hints:
{#each tech_change_hints}
  - "{hint}"
{/each}
```

Action: Create Technical Change Proposal (TCP) linked to this PCP.
After TCP is created, SM will apply both proposals together.
```

## Examples

### Example 1: Product Change Without Technical Requirements

**Input:**
```
*revise-prd "Users want a dark mode feature for better night-time usage"
```

**Analysis:**
- Feature addition (dark mode)
- No new APIs needed
- UI/UX change only

**Output:**
- Creates: `docs/proposals/product/PCP-2025-003-dark-mode-feature.md`
- requires_tech_change: false
- HANDOFF to SM

### Example 2: Product Change With Technical Requirements

**Input:**
```
*revise-prd "Need to add data export functionality for enterprise users"
```

**Analysis:**
- New feature (data export)
- Requires new API endpoints
- Requires background job system

**Output:**
- Creates: `docs/proposals/product/PCP-2025-004-data-export.md`
- requires_tech_change: true
- HANDOFF to Architect (to create TCP)

### Example 3: MVP Scope Reduction

**Input:**
```
*revise-prd "Due to timeline constraints, defer the reporting module to Phase 2"
```

**Analysis:**
- MVP scope reduction
- Epic deprecation/deferral
- No new technical requirements

**Output:**
- Creates: `docs/proposals/product/PCP-2025-005-mvp-scope-reduction.md`
- requires_tech_change: false
- HANDOFF to SM

## Notes

- PM focuses on product decisions, not technical implementation
- Always assess whether technical changes are needed
- If technical changes required, Architect creates linked TCP
- Bidirectional linkage is established by Architect
- SM processes both proposals together when linked
- PRD should be updated as part of this task
