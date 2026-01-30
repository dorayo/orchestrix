---
description: "Quick Verify"
---

When this command is used, execute the following task:

# Quick Verify

Lightweight QA verification for quick tier stories.

## Preconditions

- Story.tier in [trivial, simple]
- Story.status = Review
- Story.mode = quick

## Inputs

```yaml
required:
  - story_id: "{epic}.{story}"
```

## Execution

### Step 1: Load & Verify

**Locate**: Glob `{devStoryLocation}/{story_id}.*.md`

**Extract**:

- Quick Record (Dev, Files, Tests)
- Acceptance criteria

**Verify**:

- status = Review
- mode = quick
- Quick Record.Tests = Pass

If not: HALT with status error.

### Step 2: Run Tests

```bash
npm test  # or project equivalent
```

**Pass criteria**: All tests pass.

### Step 3: Decision

**If tests PASS**:

- Continue to Step 4

**If tests FAIL**:

- Add Change Log:
  ```
  | {date} | QA | Review | Tests failed, returning to Dev |
  ```
- Output:

  ```
  QUICK VERIFY FAILED
  Story: {story_id}
  Issue: Test failures

  🎯 HANDOFF TO dev: *quick-develop {story_id}
  ```

- HALT

### Step 4: Complete

**Update Quick Record**:

```markdown
| Field  | Value            |
| ------ | ---------------- |
| Dev    | {existing}       |
| Files  | {existing}       |
| Tests  | Pass             |
| QA     | Verified {date}  |
| Commit | {will be filled} |
```

**Set Story.status = Done**

**Add Change Log**:

```
| {date} | QA | Review -> Done | Quick verification passed |
```

### Step 5: Git Commit

```bash
git add -A
git commit -m "feat(story-{story_id}): {story_title}

Quick story implementation.

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)"
```

**Update Quick Record**: Set Commit = {commit_hash}

### Step 6: Handoff

```
QUICK STORY DONE
Story: {story_id}
Commit: {commit_hash}

🎯 HANDOFF TO sm: *draft
```

## Skipped (vs qa-review-story)

- Risk assessment
- Project type detection
- Environment setup
- Migration verification
- E2E testing
- Blind spot verification
- Evidence collection
- Gate file creation
- Post-review workflow decision
