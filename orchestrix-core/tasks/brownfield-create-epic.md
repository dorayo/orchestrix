# Create Brownfield Epic Task

## When to Use

- Enhancement can be completed in 1-3 stories
- No significant architectural changes required
- Follows existing project patterns
- Low risk to existing system

If scope exceeds 3 stories or requires architectural planning, use full brownfield PRD process instead.

## Execution

### 1. Project Analysis

**Existing Project Context:**
- [ ] Project purpose and current functionality understood
- [ ] Existing technology stack identified
- [ ] Current architecture patterns noted
- [ ] Integration points with existing system identified

**Enhancement Scope:**
- [ ] Enhancement clearly defined and scoped
- [ ] Impact on existing functionality assessed
- [ ] Required integration points identified
- [ ] Success criteria established

### 2. Epic Creation

**Epic Title:** {{Enhancement Name}} - Brownfield Enhancement

**Epic Goal:** {{1-2 sentences describing what the epic will accomplish}}

**Existing System Context:**
- Current relevant functionality: {{brief description}}
- Technology stack: {{relevant existing technologies}}
- Integration points: {{where new work connects to existing system}}

**Enhancement Details:**
- What's being added/changed: {{clear description}}
- How it integrates: {{integration approach}}
- Success criteria: {{measurable outcomes}}

**Stories (1-3):**
1. {{Story title and brief description}}
2. {{Story title and brief description}}
3. {{Story title and brief description}} (if needed)

**Compatibility Requirements:**
- [ ] Existing APIs remain unchanged
- [ ] Database schema changes are backward compatible
- [ ] UI changes follow existing patterns
- [ ] Performance impact is minimal

**Risk Mitigation:**
- Primary Risk: {{main risk to existing system}}
- Mitigation: {{how risk will be addressed}}
- Rollback Plan: {{how to undo changes if needed}}

**Definition of Done:**
- [ ] All stories completed with acceptance criteria met
- [ ] Existing functionality verified through testing
- [ ] Integration points working correctly
- [ ] No regression in existing features
- [ ] Documentation updated appropriately

### 3. Generate Epic YAML File

**Step 3.1: Determine Epic ID**

Read `{root}/core-config.yaml` to get `prdShardedLocation` (default: `docs/prd`).

List existing Epic files: `{prdShardedLocation}/epic-*.yaml`

```python
existing_ids = [extract number from epic-{n}-*.yaml filenames]
if existing_ids:
    next_epic_id = max(existing_ids) + 1
else:
    next_epic_id = 1
```

**Step 3.2: Generate Epic YAML Content**

```yaml
epic_id: {next_epic_id}
title: "{Epic Title from Step 2}"
description: |
  {Epic Description from Step 2}

stories:
  - id: "{epic_id}.1"
    title: "{Story 1 title}"
    repository_type: {monolith | backend | frontend | ios | android}
    acceptance_criteria:
      - "AC1: {Clear, testable criterion from Step 2}"
      - "AC2: {Another criterion}"
      - "AC3: {Existing system verification criterion}"
    estimated_complexity: {low | medium | high}
    priority: P1
    dependencies: []

  - id: "{epic_id}.2"
    title: "{Story 2 title}"
    repository_type: {same as story 1}
    acceptance_criteria:
      - "AC1: {Story 2 criterion}"
      - "AC2: {Another criterion}"
    estimated_complexity: {low | medium | high}
    priority: P1
    dependencies: ["{epic_id}.1"]

  # Add Story 3 if applicable
```

**Step 3.3: Write Epic File**

Generate title slug from Epic title:
```python
title_slug = slugify(epic_title)  # e.g., "Payment Integration" → "payment-integration"
```

Ensure `{prdShardedLocation}` directory exists, create if not:
```bash
mkdir -p {prdShardedLocation}
```

Write to: `{prdShardedLocation}/epic-{next_epic_id}-{title_slug}.yaml`

**Step 3.4: Verify Output**

```bash
if [ -f "{prdShardedLocation}/epic-{next_epic_id}-{title_slug}.yaml" ]; then
  echo "✅ Epic YAML file created: {prdShardedLocation}/epic-{next_epic_id}-{title_slug}.yaml"
else
  echo "❌ Failed to create Epic YAML file"
  exit 1
fi
```

### 4. Validation

**Scope Validation:**
- [ ] Epic can be completed in 1-3 stories maximum
- [ ] No architectural documentation required
- [ ] Enhancement follows existing patterns
- [ ] Integration complexity is manageable

**Risk Assessment:**
- [ ] Risk to existing system is low
- [ ] Rollback plan is feasible
- [ ] Testing approach covers existing functionality

**Completeness:**
- [ ] Epic goal is clear and achievable
- [ ] Stories are properly scoped
- [ ] Success criteria are measurable
- [ ] Dependencies are identified
- [ ] Epic YAML file created at `{prdShardedLocation}/epic-{n}-{title-slug}.yaml`

### 5. Handoff

```
✅ BROWNFIELD EPIC CREATED

Epic: {epic_id} - {Epic Title}
File: {prdShardedLocation}/epic-{epic_id}-{title_slug}.yaml
Stories:
  - {story_id_1}: {story_title_1}
  - {story_id_2}: {story_title_2}
  - {story_id_3}: {story_title_3} (if applicable)

Technology Stack: {technology stack}
Integration Points: {key integration points}

🎯 HANDOFF TO sm: *draft
```
