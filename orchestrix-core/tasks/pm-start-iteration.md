# PM - Start New Iteration

## Purpose

Start a new iteration after MVP completion by creating new Epics and updating PRD shard files.
This task assumes the PRD has been sharded (prdSharded: true).

## Prerequisites

1. PRD is sharded: `prd.prdSharded: true` in `core-config.yaml`
2. Shard directory exists: `docs/prd/`
3. At least one MVP iteration has been completed

## Process

### Step 1: Validate Shard Status

Read `{root}/core-config.yaml`:

1. Confirm `prd.prdSharded: true`
2. Get `prd.prdShardedLocation` (default: `docs/prd`)

**IF NOT sharded:**

```
❌ PRD not yet sharded

Please execute initial sharding first:
🎯 HANDOFF TO PO: *shard

Return to execute *start-iteration after sharding is complete.
```

HALT

### Step 2: Load Product Context

Read shard files in order to build complete product understanding:

**2.1 Read PRD Section Files**

Read in the following order (filenames may vary slightly, use Glob to match):

1. `*goals*.md` → Product goals and background
2. `*requirements*.md` → Functional and non-functional requirements
3. `*user-interface*.md` or `*ui-goals*.md` → UI design goals
4. `*technical-assumptions*.md` → Technical assumptions
5. `*epic-list*.md` → Epic summary list
6. `*epics*.md` → Epic detailed definitions (contains YAML blocks)

**2.2 Read Existing Epic Files**

```bash
# Read all Epic YAML files
ls docs/prd/epic-*.yaml
```

Parse each Epic file to extract:
- `epic_id` value
- `title` value
- Story count

**2.3 Determine Next Epic ID**

```
current_max_epic_id = MAX(all epic_id values)
next_epic_id = current_max_epic_id + 1
```

**2.4 Output Product Overview**

Present current product state to user:

```
📖 Current Product Overview
═══════════════════════════════════════════════════════

Product Goals: {goals summary}

Existing Epics:
  - Epic 1: {title} ({story_count} stories)
  - Epic 2: {title} ({story_count} stories)
  ...

Next Available Epic ID: {next_epic_id}

═══════════════════════════════════════════════════════
```

### Step 3: Requirements Discussion

Interact with user to collect new iteration information:

**3.1 Collect New Feature Requirements**

Ask user:
- What features should this new iteration implement?
- Please describe the core value and user scenarios for each feature

**3.2 Determine Epic Planning**

Based on requirements discussion, determine:
- How many new Epics to create
- Title and description for each Epic
- Story overview for each Epic

**3.3 Ask About Section Updates**

Ask user if existing sections need updates:

```
📋 Do any of the following sections need updates?

[1] Goals and Background Context (1-goals-and-background-context.md)
    - Have product goals changed?
    - Does background information need updates?

[2] Requirements (2-requirements.md)
    - Are there new functional requirements (FR)?
    - Are there new non-functional requirements (NFR)?

[3] UI Design Goals (3-user-interface-design-goals.md)
    - Are there new UI/UX goals?
    - Have core screens changed?

[4] Technical Assumptions (4-technical-assumptions.md)
    - Are there new technology choices?
    - Has repository structure changed?

Enter section numbers to update (e.g., 1,2) or "none" to skip:
```

### Step 4: Analyze Impact Scope

Based on Step 3 discussion results, generate affected files list:

```yaml
files_to_update:
  required:  # Must update
    - "5-epic-list.md"      # Append new Epic summary
    - "6-epics.md"          # Append new Epic YAML blocks
    - "8-next-steps.md"     # Complete replacement

  new_files:  # Need to create
    - "epic-{n}-{title-slug}.yaml"  # One file per new Epic

  optional:  # Based on user selection
    - "1-goals-and-background-context.md"  # If selected [1]
    - "2-requirements.md"                   # If selected [2]
    - "3-user-interface-design-goals.md"   # If selected [3]
    - "4-technical-assumptions.md"         # If selected [4]
```

Confirm impact scope with user:

```
📁 This iteration will update the following files:

Required Updates:
  ✓ docs/prd/5-epic-list.md
  ✓ docs/prd/6-epics.md
  ✓ docs/prd/8-next-steps.md (complete replacement)

New Files:
  ✓ docs/prd/epic-{n}-{title}.yaml

Optional Updates:
  {list based on user selection}

Continue? [Y/n]
```

### Step 5: Create New Epics

Generate YAML format content for each new Epic.

**5.1 Epic YAML Format**

Follow the format defined in `prd-tmpl.yaml`:

```yaml
epic_id: {next_epic_id}
title: "{Epic Title}"
description: |
  {Epic description - 2-3 sentences explaining goals and value}

stories:
  - id: "{epic_id}.1"
    title: "{Story Title}"
    repository_type: backend | frontend | ios | android | mobile | monolith
    acceptance_criteria:
      - "AC1: {verifiable acceptance criterion}"
      - "AC2: {verifiable acceptance criterion}"
    estimated_complexity: low | medium | high
    priority: P0 | P1 | P2
    provides_apis: []    # Backend Story: ["POST /api/xxx"]
    consumes_apis: []    # Frontend/Mobile Story: ["POST /api/xxx"]
    dependencies: []     # Story IDs: ["4.1"]

  - id: "{epic_id}.2"
    # ... more Stories
```

**5.2 Story repository_type Determination**

Determine repository_type based on Story content:
- Involves API, database, backend logic → `backend`
- Involves Web UI → `frontend`
- Involves iOS app → `ios`
- Involves Android app → `android`
- Generic mobile → `mobile`
- Monolithic app → `monolith`

**5.3 Confirm Epic Content with User**

After generating complete YAML for each Epic, present to user for confirmation:

```
📋 Epic {n}: {title}

```yaml
{complete YAML content}
```

Please confirm or suggest modifications:
```

### Step 6: Update Files

Execute file update operations.

**6.1 Update 5-epic-list.md**

Append new Epic summary at end of file:

```markdown
- **Epic {n}: {title}** - {one sentence goal description}
```

**6.2 Update 6-epics.md**

Append complete Epic definition at end of file (with YAML fence):

```markdown

## Epic {n}: {title}

**Epic Summary:** {2-3 sentence description}

**Target Repositories:** {backend, frontend, ios, android - auto-detected from stories}

```yaml
{complete Epic YAML}
```
```

**6.3 Create Standalone Epic Files**

Create a standalone YAML file for each new Epic:

- Filename format: `epic-{n}-{title-slug}.yaml`
- Location: `docs/prd/`
- Content: Pure YAML (no markdown fence)

title-slug rules:
- Lowercase
- Spaces replaced with hyphens
- Special characters removed
- Example: "Advanced Search" → "advanced-search"

**6.4 Update Other Sections** (if user selected)

Based on optional updates list from Step 4:
- Interact with user to confirm specific update content
- Append or modify corresponding sections

### Step 7: Generate next-steps.md

**Completely replace** the `8-next-steps.md` file.

**7.1 Determine if UI is Involved**

Check `repository_type` of all Stories in new Epics:
- If contains `frontend`, `ios`, `android`, or `mobile` → UI involved
- Otherwise → No UI involved

**7.2 Generate New next-steps.md Content**

```markdown
# Next Steps

This file was auto-generated by PM *start-iteration. Please follow the guidance below.

---
```

**IF UI involved:**

```markdown
## UX Expert Prompt

Please read the following PRD files and update the frontend design specification:

**Files to Read:**
- `docs/prd/3-user-interface-design-goals.md` - UI design goals
{for each new Epic:}
- `docs/prd/epic-{n}-{title-slug}.yaml` - {Epic Title}

**Files to Update:**
- `docs/front-end-spec.md`

**Execute:**
```
@ux-expert
Based on the above PRD files, update front-end-spec.md, focusing on:
- User flows for new pages/components
- Interaction design requirements
- Responsive design requirements
```

---
```

**ALWAYS (Architect Prompt):**

```markdown
## Architect Prompt

Please read the following PRD files and update architecture documents:

**Files to Read:**
- `docs/prd/4-technical-assumptions.md` - Technical assumptions
{for each new Epic:}
- `docs/prd/epic-{n}-{title-slug}.yaml` - {Epic Title}

**Architecture Files to Update:**
{determine based on new Epic content, may include:}
- `docs/architecture/6-components.md` - If new components
- `docs/architecture/9-rest-api-spec.md` - If new APIs
- `docs/architecture/10-database-schema.md` - If data model changes
- `docs/architecture/5-data-models.md` - If new entities
- `docs/architecture/11-source-tree.md` - If new directories/files

**After Completion, Update:**
- `docs/architecture/18-next-steps.md`

**Execute:**
```
@architect
Based on the above PRD files, update architecture documents, focusing on:
- New component design
- API interface definitions
- Data model changes
- Technical implementation approach
```
```

### Step 8: Output Summary

Output completion report:

```
═══════════════════════════════════════════════════════
✅ NEW ITERATION CREATED
═══════════════════════════════════════════════════════

📋 New Epics Created:
{for each new Epic:}
   - Epic {n}: {title} ({story_count} stories)

📁 Files Updated:
   - docs/prd/5-epic-list.md (appended)
   - docs/prd/6-epics.md (appended)
   - docs/prd/8-next-steps.md (complete replacement)
{for each new Epic:}
   - docs/prd/epic-{n}-{title-slug}.yaml (new)
{if other sections updated:}
   - docs/prd/{section-filename} (updated)

═══════════════════════════════════════════════════════
🎯 NEXT STEPS
═══════════════════════════════════════════════════════

Please review docs/prd/8-next-steps.md for detailed guidance.

{IF UI involved:}
1. First: @ux-expert - Read 8-next-steps.md and update front-end-spec.md
2. Then: @architect - Read 8-next-steps.md and update architecture docs

{ELSE:}
Execute: @architect - Read 8-next-steps.md and update architecture docs

After architecture updates are complete, continue with standard development workflow:
SM → Dev → QA

═══════════════════════════════════════════════════════
```

## Output

**On Success:**
- Updated PRD shard files
- Newly created Epic YAML files
- Completely replaced 8-next-steps.md

**On Failure:**
- Error reason
- Remediation steps
- No files modified
