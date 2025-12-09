# PO Review Tech Proposal

## Purpose

Evaluate Architect's technical proposal and determine Epic assignment for implementation Story.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| proposal_path | string | Yes | Path to proposal file (e.g., `docs/architecture/proposals/xxx.md`) |

## Process

### Step 1: Load Proposal Document

Read: `{proposal_path}`

**Extract from proposal**:
- `proposal_id`: From metadata or filename
- `title`: Proposal title
- `components_affected`: List of affected components
- `estimated_effort`: low | medium | high
- `implementation_phases`: Number of phases
- `risk_level`: From risk matrix

**IF file not found**: HALT with error

---

### Step 2: Load Project Context & Resolve Epic Location

Read: `{root}/core-config.yaml`

**Extract**:
- `project.mode`: monolith | multi-repo
- `project.multi_repo.repository_id`: Current repository identifier

**Execute**: `tasks/utils/resolve-epic-location.md`

```yaml
Input:
  epic_id: "0"
  create_if_missing: false
```

**IF result.error**:
- Output: `result.error_message`
- **HALT**

**Store**:
- `epic_location = result.epic_location`
- `has_epic_0 = result.epic_exists`

Read all Epic files: `{epic_location}/epic-*.yaml`

**Build**:
- `epic_list`: All existing epics with titles and story counts
- `max_epic_id`: Highest epic ID

---

### Step 3: Analyze Epic Assignment

**Criteria for Epic 0 (Technical Debt)**:
- Pure infrastructure change (no feature impact)
- Cross-cutting concern affecting multiple epics
- No clear functional Epic alignment

**Criteria for Existing Epic**:
- Change directly supports specific feature Epic
- Components affected are scoped to one Epic

**Criteria for New Epic**:
- Large scope requiring multiple related stories
- Represents new architectural capability

**Decision Matrix**:

| Condition | Decision |
|-----------|----------|
| components_affected ⊂ single Epic scope | ADD_TO_EPIC |
| cross_epic OR infrastructure-only | ADD_TO_EPIC_0 |
| estimated_effort = high AND phases >= 3 | CREATE_EPIC |
| unclear | ADD_TO_EPIC_0 (default) |

---

### Step 4: Execute Decision

#### IF ADD_TO_EPIC or ADD_TO_EPIC_0:

1. Determine `target_epic_id`:
   - ADD_TO_EPIC: Epic ID aligned with proposal scope
   - ADD_TO_EPIC_0: `0`

2. **IF target_epic_id = "0" AND has_epic_0 = false**:

   **Execute**: `tasks/utils/resolve-epic-location.md`
   ```yaml
   Input:
     epic_id: "0"
     create_if_missing: true
   ```

   Update: `has_epic_0 = true`

3. Read target Epic file: `{epic_location}/epic-{target_epic_id}-*.yaml`

4. Generate Story definition from proposal:
   ```yaml
   - id: "{target_epic_id}.{max_story_number + 1}"
     title: "{proposal.title}"
     repository_type: {infer from components}
     acceptance_criteria:
       - "AC1: {from proposal phase 1 deliverables}"
       - "AC2: {from proposal phase 2 deliverables}"
       - "ACn: {from proposal phase n deliverables}"
     estimated_complexity: {map from proposal.estimated_effort}
     priority: P1
     dependencies: []
     tech_proposal_ref: "{proposal_path}"
   ```

5. Append Story to Epic YAML `stories` array

6. Write updated Epic file

#### IF CREATE_EPIC:

1. Calculate `new_epic_id`: `max_epic_id + 1`

2. Generate Epic file: `{epic_location}/epic-{new_epic_id}-{slug}.yaml`
   ```yaml
   epic_id: {new_epic_id}
   title: "{proposal.title}"
   description: |
     {from proposal.problem_statement}
   stories:
     - id: "{new_epic_id}.1"
       title: "Phase 1: {proposal.phase_1_title}"
       ...
   ```

3. Write new Epic file

---

### Step 5: Output

**Success**:
```yaml
decision: ADD_TO_EPIC | ADD_TO_EPIC_0 | CREATE_EPIC
target_epic:
  id: "{epic_id}"
  title: "{epic_title}"
  file: "{epic_file_path}"
story_definition:
  id: "{story_id}"
  title: "{story_title}"
tech_proposal_ref: "{proposal_path}"
```

**HANDOFF**:
```
---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO SM: *draft {story_id}
Context: Tech proposal {proposal_id} added to Epic {target_epic_id}
Story: {story_id} - {story_title}
Action: Create Story file from Epic definition
```
