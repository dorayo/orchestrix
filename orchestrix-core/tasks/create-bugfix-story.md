# Create Bugfix Story

Create story for bug fix when scope exceeds quick-fix threshold.

## Trigger

Called when:
- Dev `*quick-fix` escalates due to scope > 3 files
- User reports bug requiring tracked fix
- QA discovers bug during testing

## Inputs

```yaml
required:
  - bug_description: 'Natural language description'

optional:
  - source_story_id: 'Story ID that introduced the bug (from git blame)'
  - affected_files: ['List of affected files']
  - root_cause: 'Root cause if already analyzed'
  - estimated_scope: 'Number of files/components affected'
  - escalation_context: 'Context from quick-fix if escalated'
```

## Execution

### Step 1: Determine Epic

**1.1 If source_story_id provided:**

```bash
# Find source story file
story_file=$(find docs/stories -name "{source_story_id}*.md" | head -1)

# Extract epic ID from story ID (e.g., 2.3 → epic 2)
epic_id=$(echo "{source_story_id}" | cut -d'.' -f1)

# Find epic file
epic_file=$(find docs/prd -name "epic-{epic_id}-*.yaml" | head -1)
```

**1.2 If source_story_id NOT provided:**

```bash
# Check if Maintenance epic exists
maintenance_epic=$(find docs/prd -name "epic-*-maintenance*.yaml" -o -name "epic-*-bugfix*.yaml" | head -1)
```

IF maintenance_epic NOT found:
```
OUTPUT: "No maintenance epic found."
ASK: "Create Maintenance Epic? Or specify source story ID?"
OPTIONS:
  1. Create Maintenance Epic (recommended for ongoing projects)
  2. Specify source story ID
  3. Cancel and return to quick-fix
```

**1.3 Determine next story ID:**

```bash
# Find highest story number in this epic
highest=$(grep -r "^  id: {epic_id}\." docs/stories/*.md |
          sed 's/.*id: //' |
          sort -t'.' -k2 -n |
          tail -1 |
          cut -d'.' -f2)
next_story_num=$((highest + 1))
story_id="{epic_id}.{next_story_num}"
```

### Step 2: Analyze Bug Scope

**2.1 If escalation_context provided (from quick-fix):**

Use existing analysis:
- `affected_files` from Impact Report
- `root_cause` from Phase 3
- `estimated_scope` from scope check

**2.2 If fresh bug report:**

Perform quick analysis:
```bash
# Search for bug keywords in codebase
grep -rn "{bug_keywords}" src/

# Identify affected area
# Estimate scope
```

Output:
```yaml
bug_analysis:
  affected_area: '{module/component}'
  estimated_files: {count}
  complexity: trivial | simple | standard
  requires_arch_review: true | false
```

### Step 3: Determine Tier

Apply decision logic:
```yaml
IF estimated_files <= 3 AND root_cause is clear:
  tier: simple
  skip_arch_review: true

ELIF estimated_files <= 6:
  tier: standard
  skip_arch_review: false

ELSE:
  tier: standard
  skip_arch_review: false
  architect_review_mandatory: true
```

### Step 4: Create Story Document

**Template**: `{root}/templates/story-bugfix-tmpl.yaml`

**Generate filename:**
```python
slug = f"bugfix-{bug_description[:30]}"
slug = re.sub(r'[^\w\s-]', '', slug).lower()
slug = re.sub(r'[\s_]+', '-', slug)
filename = f"{story_id}-{slug}.md"
```

**Populate fields:**

```yaml
Story:
  id: {story_id}
  title: "[Bugfix] {short_description}"
  tier: {tier}
  status: {Approved if simple, else AwaitingArchReview}
  type: bugfix
  source_story: {source_story_id or "unknown"}

Bug Details:
  description: {bug_description}
  root_cause: {root_cause or "To be analyzed"}
  affected_files: {affected_files}
  reported_by: {user or "Dev escalation"}
  reported_date: {current_date}

Acceptance Criteria:
  - "[ ] Bug no longer reproduces under original conditions"
  - "[ ] No regression in related functionality"
  - "[ ] Tests added to prevent recurrence"

Tasks:
  - "[ ] Reproduce and confirm bug"
  - "[ ] Analyze root cause (if not done)"
  - "[ ] Implement fix"
  - "[ ] Add regression test"
  - "[ ] Verify fix"

Dev Notes:
  context: |
    ## Bug Context
    {escalation_context or bug_description}

    ## Affected Files
    {affected_files list}

    ## Source Story Reference
    {source_story_id}: {source_story_title if available}

Change Log:
  - "{date} | SM | Created | Bugfix story created from {source}"
```

### Step 5: Write File

```bash
# Write story file
write_to: docs/stories/{filename}
```

### Step 6: Handoff

**If tier = simple (skip arch review):**
```
BUGFIX STORY CREATED
Story: {story_id} | Type: bugfix | Tier: simple
Source: {source_story_id or "N/A"}
Status: Approved

🎯 HANDOFF TO dev: *quick-develop {story_id}
```

**If tier = standard:**
```
BUGFIX STORY CREATED
Story: {story_id} | Type: bugfix | Tier: standard
Source: {source_story_id or "N/A"}
Status: AwaitingArchReview

🎯 HANDOFF TO architect: *review {story_id}
```

## Special Cases

### Case 1: Create Maintenance Epic

If user chooses to create Maintenance Epic:

```yaml
# Create docs/prd/epic-99-maintenance.yaml (or next available number)
Epic:
  id: 99
  title: "Maintenance & Bug Fixes"
  type: maintenance
  description: "Ongoing maintenance, bug fixes, and technical debt items"

Stories: []  # Bugfix stories added dynamically
```

Then proceed with story creation under this epic.

### Case 2: Security Bug

```yaml
IF bug involves security:
  tier: complex
  architect_review_mandatory: true
  status: AwaitingArchReview
  priority: critical

  OUTPUT: "⚠️ Security bug detected. Architect review mandatory."
```

### Case 3: Data Integrity Bug

```yaml
IF bug affects data integrity:
  tier: standard
  architect_review_mandatory: true
  requires_migration_plan: true

  Dev Notes += "⚠️ Data integrity issue - verify migration/rollback plan"
```

## Constraints

- **NO code implementation** - SM only creates story
- **Must have Epic** - Either source epic or maintenance epic
- **Tier determines flow** - Simple → Dev, Standard → Architect
- **Traceability** - Always record source_story if known

## Error Handling

| Condition | Action |
|-----------|--------|
| Cannot find source story | Ask user or use Maintenance Epic |
| No Maintenance Epic and user declines | HALT, suggest quick-fix with caution |
| Epic YAML malformed | HALT, report error |
| Duplicate story ID | Increment and retry |
