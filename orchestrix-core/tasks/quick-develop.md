# Quick Develop

Streamlined development for quick tier stories.

## Preconditions

- Story.tier in [trivial, simple]
- Story.status = Approved
- Story.mode = quick

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
```

## Execution

### Step 1: Load Story

**Locate**: Glob `{devStoryLocation}/{story_id}.*.md`

**Extract**:
- Acceptance criteria
- Tasks
- Notes (if present)

**Verify**:
- status = Approved
- mode = quick

If not: HALT with status error.

### Step 2: Update Status

Set Story.status = InProgress

Add Change Log:
```
| {date} | Dev | Approved -> InProgress | Quick development started |
```

### Step 3: Implement

For each task:
1. Implement
2. Mark `[x]`

For each AC:
1. Verify satisfied
2. Mark `[x]`

### Step 4: Test

```bash
# Run tests
npm test  # or project equivalent

# Run lint
npm run lint  # or project equivalent
```

**Pass criteria**:
- All tests pass
- No lint errors

If fail: Fix and retry. Max 3 attempts, then HALT.

### Step 5: Update Record

Update Quick Record:
```markdown
| Field | Value |
|-------|-------|
| Dev | {agent_model} |
| Files | {file1}, {file2}, ... |
| Tests | Pass |
| QA | - |
| Commit | - |
```

### Step 6: Status & Handoff

Set Story.status = Review

Add Change Log:
```
| {date} | Dev | InProgress -> Review | Implementation complete |
```

**Output**:
```
QUICK IMPLEMENTATION COMPLETE
Story: {story_id}
Files: {count} changed
Tests: Pass

HANDOFF TO qa: *quick-verify {story_id}
```

## Skipped (vs develop-story)

- Pending handoff registration
- Architecture context loading
- Cumulative context loading
- UI/UX spec loading
- QA test design loading
- Dev Log initialization
- Dev Log updates
- Resumption guide
- Self-review gate (GATE 1)
- Registry updates
- Completion gate (GATE 2)
