# SM Create Tech Story

## Purpose

Create a Story directly from Architect's technical proposal for small-scope technical improvements.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| proposal_path | string | Yes | Path to proposal file (e.g., `docs/architecture/proposals/xxx.md`) |
| epic_id | string | No | Target Epic ID. Default: `0` (Technical Debt) |

## Process

### Step 1: Load Proposal Document

Read: `{proposal_path}`

**Extract**:
- `proposal_id`: From metadata table or filename
- `title`: Proposal title
- `problem_statement`: From Problem Statement section
- `components_affected`: From Impact Assessment
- `implementation_phases`: From Implementation Plan
- `risk_matrix`: From Risk Matrix section
- `testing_requirements`: From Testing Requirements

**IF file not found**: HALT with `Proposal file not found: {proposal_path}`

---

### Step 2: Load Configuration

Read: `{root}/core-config.yaml`

**Extract**:
- `devStoryLocation`: Story file destination (local)
- `prdShardedLocation`: Epic YAML location (relative path)
- `project.mode`: monolith | multi-repo
- `project.multi_repo.role`: product | backend | frontend | ios | android
- `project.multi_repo.product_repo_path`: Path to product repo (if multi-repo)

**Resolve Epic Location**:
```
If project.mode = multi-repo AND role != product:
  epic_location = {product_repo_path}/{prdShardedLocation}
Else:
  epic_location = {prdShardedLocation}
```

---

### Step 3: Determine Epic Assignment

**IF epic_id provided**: Use provided value

**ELSE**: Set `epic_id = "0"` (Technical Debt Epic)

Read Epic file: `{epic_location}/epic-{epic_id}-*.yaml`

**IF Epic 0 not exists**:

Create file: `{epic_location}/epic-0-technical-debt.yaml`
```yaml
epic_id: 0
title: "Technical Foundation & Debt"
description: |
  Technical improvements, refactoring, and debt reduction.
  Stories prioritized by impact and urgency.
stories: []
```

**Extract from Epic**:
- `max_story_number`: Highest story number in Epic
- `new_story_id`: `{epic_id}.{max_story_number + 1}`

---

### Step 4: Generate Story Content

**Map proposal to Story structure**:

1. **Title**: `{proposal.title}` (prefix with "Tech:" if not already)

2. **Acceptance Criteria**: Extract from implementation phases
   ```
   FOR each phase in proposal.implementation_phases:
     AC{n}: {phase.deliverable} - {phase.validation_criteria}
   ```

3. **Tasks**: Map from implementation plan
   ```
   Phase 1 tasks → Task 1.x
   Phase 2 tasks → Task 2.x
   ...
   ```

4. **Dev Notes**:
   - Technical Constraints: From proposal risk mitigation
   - Architecture Reference: `→ {proposal_path}`
   - Components: `{components_affected}`

5. **Complexity**: Map from proposal.estimated_effort
   - low → low
   - medium → medium
   - high → high

---

### Step 5: Create Story File

**Generate filename**:
```
{new_story_id}-{kebab-case(title)}.md
```

**Write to**: `{devStoryLocation}/{filename}`

**Use template**: `{root}/templates/story-tmpl.yaml`

**Populate fields**:
```yaml
Story:
  id: "{new_story_id}"
  title: "{title}"
  epic: "{epic_id} - {epic.title}"
  status: Draft
  mode: plan
  priority: P1
  estimated_complexity: "{complexity}"
  tech_proposal_ref: "{proposal_path}"
```

---

### Step 6: Update Epic YAML

Append to Epic stories array:
```yaml
- id: "{new_story_id}"
  title: "{title}"
  repository_type: monolith
  acceptance_criteria:
    - "AC1: ..."
  estimated_complexity: "{complexity}"
  priority: P1
  dependencies: []
  tech_proposal_ref: "{proposal_path}"
```

Write updated Epic file.

---

### Step 7: Quality Check

Execute: `checklists/gate/sm-story-creation-gate.md`

**IF gate FAIL**:
- Update Story.status = Blocked
- Output issues
- HALT

**IF gate PASS**: Continue to Step 8

---

### Step 8: Output

```yaml
result: SUCCESS
story:
  id: "{new_story_id}"
  title: "{title}"
  file: "{story_file_path}"
epic:
  id: "{epic_id}"
  file: "{epic_file_path}"
tech_proposal_ref: "{proposal_path}"
```

**HANDOFF** (based on complexity):

**IF complexity = high**:
```
🎯 HANDOFF TO architect: *review {new_story_id}
Context: Tech Story from proposal {proposal_id}
Complexity: high - requires Architect review
```

**ELSE**:
```
🎯 HANDOFF TO dev: *develop-story {new_story_id}
Context: Tech Story from proposal {proposal_id}
Status: Ready for implementation
```
