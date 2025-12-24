# Create Quick Story

Quick story creation for trivial/simple tier stories.

## Preconditions

- `tier_decision.result` in [trivial, simple]
- `tier_decision.workflow.sm_task` = this file

## Inputs

```yaml
required:
  - story_definition: from Epic YAML
  - epic_definition: from Epic YAML
  - tier_decision: from make-decision sm-story-tier
```

## Execution

### Step 1: Generate Filename

```python
slug = story_definition.title.lower()
slug = re.sub(r'[^\w\s-]', '', slug)
slug = re.sub(r'[\s_]+', '-', slug)
filename = f"{story_definition.id}-{slug}.md"
```

### Step 2: Create Story Document

Template: `{root}/templates/story-quick-tmpl.yaml`

```yaml
Story:
  id: {story_definition.id}
  title: {story_definition.title}
  tier: {tier_decision.result}
  status: Approved
  mode: quick
  repository: {story_definition.repository_type}
```

**Description**: Extract from `story_definition.acceptance_criteria` or `story_definition.title`.

**Multi-Repo Context** (if `project.mode == 'multi-repo'`):
- `repository_name`: from `story_definition.repository_type`
- `target_platform`: from `story_definition.repository_type`
- `provides_apis`: from `story_definition.provides_apis` (if present)
- `consumes_apis`: from `story_definition.consumes_apis` (if present)
- `cross_repo_dependencies`: from `story_definition.dependencies` filtered to cross-repo only

**Acceptance Criteria**:
- Use `story_definition.acceptance_criteria` if array format
- Parse from `story_definition.acceptance_criteria_summary` if paragraph format

**Tasks**: Use default template tasks.

**Change Log**:
```
| {current_date} | SM | Approved | Quick story created, tier={tier} |
```

### Step 3: Validate

- [ ] Story has ≥1 AC
- [ ] Story has description
- [ ] Re-verify LLM analysis from tier_decision:
  - [ ] `analysis.involves_db_changes == false` (no actual DB schema changes)
  - [ ] `analysis.involves_security == false` (no actual security operations)

If validation fails (e.g., tier_decision was incorrect):
- Output: "⚠️ Quick workflow validation failed: {reason}"
- Suggest: "Use standard workflow: *draft {story_id}"
- **HALT**

### Step 4: Write File

Write to: `{devStoryLocation}/{filename}`

### Step 5: Handoff

```
QUICK STORY CREATED
Story: {story_id} | Tier: {tier}
Status: Approved

HANDOFF TO dev: *quick-develop {story_id}
```

## Skipped Steps (vs create-next-story)

- Architecture context loading
- Cumulative context validation
- UI/UX reference extraction
- Quality assessment gate (GATE 1)
- Architect review decision
- Test design level decision
- Story status decision
- Story completion gate (GATE 2)
