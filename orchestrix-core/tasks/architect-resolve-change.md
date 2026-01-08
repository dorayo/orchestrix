# Architect Technical Change Resolution

## Purpose

Handle technical changes: API contracts, database schemas, system design, tech stack.
Generate a Technical Change Proposal (TCP) document for SM to execute.
If linked to a Product Proposal, establish bidirectional linkage.

## Command

```
*resolve-change <change_description>
```

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Technical change description |
| related_product_proposal | string | No | PCP ID if triggered by product change (e.g., PCP-2025-001) |

## Process

### Step 1: Load Technical Context

1. Read `core-config.yaml`:
   - `project.mode`: monolith or multi-repo
   - `docs_path`: Documentation directory

2. Read architecture documents:
   - `{docs_path}/architecture.md` (or system-architecture.md)
   - Frontend/Mobile architecture if applicable

3. Read API contracts if multi-repo project:
   - `{docs_path}/api-contracts/` directory

4. Read database schemas if applicable

5. If `related_product_proposal` provided:
   - Read the PCP file to understand product context
   - Extract `tech_change_hints` from the proposal

### Step 1b: Load Story Context

Before designing Story requirements, load existing Stories to determine correct IDs:

1. Read `core-config.yaml`:
   - `devStoryLocation`: Story files directory

2. Identify affected Epic(s) from the change description

3. For each affected Epic, load existing Stories:
   ```
   Glob: {devStoryLocation}/{epic_id}.*.md
   ```

4. Determine `max_story_id` for each affected Epic:
   ```
   max_story_id[epic_id] = highest story number found
   ```

5. Record for use in Step 3:
   ```yaml
   story_context:
     epic_9:
       existing_stories: [9.1, 9.2, ..., 9.27]
       max_story_id: 27
       next_available: 28
   ```

### Step 2: Technical Impact Analysis

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

**Performance:**
- Latency impact?
- Scalability concerns?

Generate impact matrix:
```markdown
| Component | Impact Level | Change Required |
|-----------|--------------|-----------------|
| {component} | HIGH/MEDIUM/LOW | {description} |
```

### Step 3: Design Technical Solution

Based on analysis, produce:

1. **Architecture Change Design**
   - Component modifications
   - New patterns/approaches
   - Diagrams if structural change (Mermaid format)

2. **API Contract Modifications** (if applicable)
   - OpenAPI diff or new endpoint specs
   - Versioning strategy

3. **Database Migration Strategy** (if schema change)
   - Migration steps
   - Rollback plan

4. **Risk Assessment**
   - Identified risks
   - Mitigation strategies

5. **Story Requirements**
   - Break down into implementable Stories
   - Define acceptance criteria hints
   - Specify technical notes for each Story
   - **Use `story_context` from Step 1b to assign correct Story IDs**:
     ```
     For epic_id N with max_story_id M:
       First new story: N.(M+1)
       Second new story: N.(M+2)
       ...
     ```

### Step 4: Generate Proposal ID

1. Scan `docs/proposals/tech/` directory
2. Find files matching `TCP-{current_year}-*.md`
3. Extract highest sequence number
4. Generate new ID: `TCP-{year}-{max + 1, zero-padded to 3 digits}`

```
Example:
  Existing: TCP-2025-001.md, TCP-2025-002.md
  New ID: TCP-2025-003
```

### Step 5: Create Technical Change Proposal

Create file: `docs/proposals/tech/{proposal_id}-{title_slug}.md`

Use template from `templates/tech-proposal-tmpl.yaml`:

```markdown
---
metadata:
  proposal_id: {proposal_id}
  proposal_type: technical
  title: "{title}"
  status: draft
  created_at: {YYYY-MM-DD}
  author: Architect

linkage:
  related_product_proposal: {related_product_proposal or null}
  triggered_by: {product_change | tech_debt | performance | security}
---

# {proposal_id}: {title}

## Change Summary
{summary of the technical change}

## Change Background

### Trigger Reason
- [{x if product_change}] Product requirement driven
- [{x if tech_debt}] Technical debt cleanup
- [{x if performance}] Performance optimization
- [{x if security}] Security hardening
- [ ] Architecture evolution

### Related Product Proposal
{#if related_product_proposal}
```yaml
related_product_proposal: {related_product_proposal}
product_proposal_title: "{pcp_title}"
```
{else}
No related product proposal (standalone technical change).
{/if}

### Context
{background_context}

## Technical Analysis

### Current State
{current_state_description}

### Problem Identification
1. {problem_1}
2. {problem_2}

### Technical Constraints
- {constraint_1}
- {constraint_2}

## Proposed Solution

### Solution Overview
{solution_overview}

### Component Changes

| Component | Change Type | Description |
|-----------|-------------|-------------|
| {component} | {add/modify/remove} | {description} |

{#if api_changes}
### API Design

```yaml
{api_specification}
```
{/if}

{#if database_changes}
### Database Changes

```sql
{migration_sql}
```
{/if}

## Impact Analysis

### Affected Components

| Layer | Component | Change Type |
|-------|-----------|-------------|
| {layer} | {component} | {change_type} |

### Dependencies
- {dependency_1}
- {dependency_2}

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
technical_notes:
  - {tech_note_1}
  - {tech_note_2}
complexity: {low | medium | high}
```

{repeat for each story requirement}

## Implementation Plan

### Dependency Order
```
{dependency_diagram}
```

### Key Milestones
1. {milestone_1}
2. {milestone_2}

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {risk} | {prob} | {impact} | {mitigation} |

## Approval Record

| Date | Approver | Decision | Notes |
|------|----------|----------|-------|
```

### Step 6: Update Linked Product Proposal (if applicable)

**IF related_product_proposal is provided:**

1. Read the PCP file:
   ```
   Path: docs/proposals/product/{related_product_proposal}-*.md
   ```

2. Update PCP frontmatter:
   ```yaml
   linkage:
     requires_tech_change: true
     related_tech_proposal: {new_tcp_id}  # Add this line
   ```

3. Write updated PCP file

This establishes bidirectional linkage between proposals.

### Step 7: User Approval

1. Present Technical Change Proposal summary to user
2. Highlight key changes:
   - Components affected
   - API changes
   - Database migrations
   - Risk assessment
3. Request explicit approval of the technical design

> **IMPORTANT:** User approval here confirms the TECHNICAL DESIGN is acceptable.
> This does NOT change the proposal status. Status remains `draft` for SM to process.
> Do NOT modify the proposal file's status field.

**IF NOT approved:**
- Note user feedback
- Return to Step 3 to iterate
- Ask clarifying questions if needed

**IF approved:**
- Proceed to commit and output (proposal status remains `draft`)

### Step 7.5: Git Commit

> **Always execute** before HANDOFF to SM.
> This covers both standalone technical changes and linked product+technical changes.

1. **Identify Changed Files**

   Collect all files modified during this task:
   ```yaml
   changed_files:
     - docs/proposals/tech/{proposal_id}-{slug}.md  # TCP file
     # If linked to PCP:
     - docs/proposals/product/{related_product_proposal}-*.md  # Updated PCP with linkage
     # Architecture documents if modified:
     - {architecture_files}  # Any architecture docs updated
   ```

2. **Stage Files**
   ```bash
   git add {changed_files}
   ```

3. **Create Commit**

   Commit message format:
   ```
   docs(proposal): {proposal_id} - {title}

   - Created Technical Change Proposal
   {#if related_product_proposal}
   - Linked to: {related_product_proposal}
   - Updated PCP with bidirectional linkage
   {/if}
   - Components affected: [{components}]
   - Stories defined: {count}

   🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
   ```

4. **Handle Commit Result**

   - **Success:** Record commit hash for HANDOFF message
   - **Failure:** Log warning, do not block HANDOFF
   - **No changes:** Skip commit, note in output

## Output

**Success:**
```yaml
resolution: RESOLVED
proposal_id: "{proposal_id}"
proposal_path: "docs/proposals/tech/{proposal_id}-{slug}.md"
proposal_type: technical
status: draft
linked_product_proposal: "{related_product_proposal or null}"
bidirectional_linkage_updated: {true if PCP was updated, false otherwise}
components_affected: [{components}]
stories_defined: {count}
```

**HANDOFF to SM:**
```

🎯 HANDOFF TO SM: *apply-proposal {proposal_id}

Technical Change Proposal Created:
- Proposal ID: {proposal_id}
- Title: {title}
- Path: docs/proposals/tech/{proposal_id}-{slug}.md

{#if related_product_proposal}
Linked to Product Proposal:
- Product Proposal: {related_product_proposal}
- Bidirectional linkage: Established
{/if}

Stories Defined: {count}
- {story_1_title}
- {story_2_title}
...

📦 Git Commit: {commit_hash | "failed: {error}" | "skipped: no changes"}

Action: Apply this proposal to create/update Stories
```

**HANDOFF to SM (with linked PCP):**

If both PCP and TCP are ready:
```

🎯 HANDOFF TO SM: *apply-proposal

Technical Change Proposal Created:
- Proposal ID: {tcp_id}
- Linked to: {pcp_id}

📦 Git Commit: {commit_hash | "failed: {error}" | "skipped: no changes"}

Both proposals are now ready for processing.
SM will process them in order: Product first, then Technical.
```

## Examples

### Example 1: Standalone Technical Change

**Input:**
```
*resolve-change "API response time is too slow, need query optimization"
```

**Output:**
- Creates: `docs/proposals/tech/TCP-2025-003-api-query-optimization.md`
- HANDOFF to SM

### Example 2: Linked to Product Change

**Input:**
```
*resolve-change "Need background job system for data export"
related_product_proposal: PCP-2025-002
```

**Output:**
- Creates: `docs/proposals/tech/TCP-2025-004-background-job-system.md`
- Updates: `docs/proposals/product/PCP-2025-002-*.md` with bidirectional link
- HANDOFF to SM

## Notes

- Architect focuses on technical design, not product decisions
- If change requires PRD modification, route to PM first
- Technical proposals should be detailed enough for SM to create Stories
- Always include Story Requirements section for SM consumption
- Establish bidirectional linkage when working with Product Proposals
