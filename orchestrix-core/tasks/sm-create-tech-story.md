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
- `project.multi_repo.repository_id`: Current repository identifier

---

### Step 3: Resolve Epic Location & Determine Assignment

**IF epic_id provided**: Use provided value
**ELSE**: Set `epic_id = "0"` (Technical Debt Epic)

**Execute**: `tasks/utils/resolve-epic-location.md`

```yaml
Input:
  epic_id: "{epic_id}"
  create_if_missing: true
```

**IF result.error**:
- Output: `result.error_message`
- **HALT**

**Store**:
- `epic_location = result.epic_location`
- `epic_file = result.epic_file`
- `epic_created = result.created`

**Read Epic file**: `{epic_file}`

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
  repository_type: "{result.config.role}"  # From resolve-epic-location result
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
---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review
args: {new_story_id}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO architect: *review {new_story_id}
Context: Tech Story from proposal {proposal_id}
Complexity: high - requires Architect review
```

**ELSE**:
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: develop-story
args: {new_story_id}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO dev: *develop-story {new_story_id}
Context: Tech Story from proposal {proposal_id}
Status: Ready for implementation
```
