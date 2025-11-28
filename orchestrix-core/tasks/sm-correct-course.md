# SM Story-Level Course Correction

## Purpose

Handle Story-level changes: modify existing story, create new story, split story, or deprecate story.
Escalate to higher layers if cross-story or architectural impact detected.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| story_id | string | No | Target story ID if modifying existing (e.g., "5.3") |
| change_description | string | Yes | User's description of the change needed |

## Process

### Step 1: Classify Change Level

Execute: `tasks/utils/classify-change-level.md`

```yaml
Input:
  change_description: "{change_description}"
  context:
    explicit_story_id: "{story_id}"
    current_agent: "SM"
```

**IF result == REDIRECT:**
Output handoff_message and **HALT**.

Example:
```
🎯 HANDOFF TO PO: *correct-course - Multi-story impact detected
```

### Step 2: Determine Action Type

Analyze `change_description` to identify action:

| Indicator Keywords | Action Type |
|-------------------|-------------|
| "unclear", "clarify", "revise", "update", "fix" | MODIFY_STORY |
| "missing", "need new", "add story", "forgot", "additional" | CREATE_STORY |
| "too large", "split", "break down", "decompose" | SPLIT_STORY |
| "not needed", "remove", "obsolete", "skip", "deprecated" | DEPRECATE_STORY |

### Step 3: Load Context

1. Read epic file containing the story:
   - For monolith: `{epics_path}/epic-{epic_id}.md`
   - For multi-repo: `{epics_path}/epic-{epic_id}.yaml`
2. Get story list and determine `max_story_number` in epic
3. Read target story file if MODIFY or SPLIT:
   - `{stories_path}/{story_id}.md`
4. Read relevant architecture sections for technical context

### Step 4: Execute Action

#### IF MODIFY_STORY:

1. Load story file: `{stories_path}/{story_id}.md`
2. Based on change_description, revise:
   - **Acceptance Criteria**: Clarify or adjust
   - **Tasks/Subtasks**: Add, remove, or reorder
   - **Dev Notes**: Add clarifications
3. Preserve: Story ID, Epic reference, Architecture references
4. Update Change Log section with modification record

#### IF CREATE_STORY:

1. Calculate new story number: `max_story_number + 1`
2. New story ID: `{epic_id}.{new_story_number}`
3. Generate story using template: `templates/story-tmpl.yaml`
4. Populate from change_description:
   - Title and description
   - Acceptance Criteria (draft)
   - Initial task breakdown
5. Add story reference to epic file
6. Write story file: `{stories_path}/{new_story_id}.md`

#### IF SPLIT_STORY:

1. Load original story: `{stories_path}/{story_id}.md`
2. Identify split boundary from change_description
3. Reduce scope of original story
4. For each new story:
   - Calculate ID: `{epic_id}.{max + n}`
   - Create story file with extracted scope
   - Establish dependencies if needed
5. Update epic file with new story references
6. Update original story's Change Log

#### IF DEPRECATE_STORY:

1. Load story file: `{stories_path}/{story_id}.md`
2. Set status to "Deprecated"
3. Add deprecation reason to Change Log
4. Update epic file: mark story as skipped
5. **Do NOT delete file** - preserve for history

### Step 5: Validate Quality

For each affected story, execute: `checklists/scoring/sm-story-quality.md`

- IF any score < 6.0: Return to Step 4, continue revision
- IF all scores >= 6.0: Proceed to Step 6

### Step 6: Escalation Check

Collect analysis results:
```yaml
analysis_result:
  stories_impacted: {count}
  requires_architecture_change: {boolean}
  requires_epic_restructure: {boolean}
  resolvable_within_story: {boolean}
  action_type: "{action_type}"
```

Execute: `data/decisions/sm-change-escalation.yaml`

- **HANDLE_IN_STORY**: Proceed to Step 7
- **ESCALATE_TO_EPIC**: Output HANDOFF to PO and **HALT**
- **ESCALATE_TO_TECH**: Output HANDOFF to Architect and **HALT**

### Step 7: Finalize

1. Write all updated/new story file(s)
2. Update epic file if story list changed
3. Log changes in each story's Change Log section

Output completion summary:
```yaml
action_type: {MODIFY_STORY | CREATE_STORY | SPLIT_STORY | DEPRECATE_STORY}
affected_stories:
  - id: "{epic_id}.{story_id}"
    action: "modified" | "created" | "deprecated"
    file_path: "{path}"
epic_updated: {boolean}
change_summary: "{Brief description of changes made}"
```

## Output

**Success (handled locally):**
```
✅ Story course correction complete

Action: {action_type}
Stories affected:
- {story_id}: {action} - {file_path}

Summary: {change_summary}
```

**Escalate to PO:**
```
🎯 HANDOFF TO PO: *correct-course
Context: {escalation_context}
Stories affected: {count}
Reason: {reasoning}
```

**Escalate to Architect:**
```
🎯 HANDOFF TO ARCHITECT: *resolve-tech-change
Context: {escalation_context}
Architecture impact: {description}
Reason: {reasoning}
```
