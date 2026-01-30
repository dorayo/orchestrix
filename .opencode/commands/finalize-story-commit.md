---
description: "finalize-story-commit"
---

When this command is used, execute the following task:

# finalize-story-commit

Finalize a completed story by creating a git commit. This task creates a conventional commit for a story that has been approved by QA with a PASS gate.

## Purpose

This task is the **final step** in the story completion workflow. It should be executed after QA review has confirmed that the story meets all quality criteria (Gate = PASS, Status = Done).

## Agent Permission

This task can be executed by:

- **QA agent** (primary use case - after successful review)
- **Dev agent** (if QA requests manual commit)
- **SM agent** (as workflow orchestration)

## Prerequisites

**ALL of the following conditions must be met**:

1. Story Status = `Done`
2. Latest QA Gate = `PASS`
3. All code changes are staged and ready to commit
4. QA review has been completed (gate file exists)

## Process

### Step 1: Verify Prerequisites (MANDATORY - DO NOT SKIP)

**1.1. Load Story File** (⚠️ MUST use Glob - filenames include title slug):

> **NEVER** attempt to Read directly with `{story_id}.md` - this will fail.

1. **Use Glob tool FIRST**: `{devStoryLocation}/{story_id}.*.md`
2. **Then Read** the exact file path returned by Glob

- Extract:
  - `story_id`
  - `story_title`
  - Current `Status` value
  - Story metadata (epic, feature, ACs)

**1.2. Load Latest QA Gate File**:

- Read from `{qa.qaLocation}/gates/{story_id}*.yml`
- If multiple gate files exist, select the most recent
- Extract:
  - `gate` result (PASS/CONCERNS/FAIL)
  - `review_round`
  - `quality_score`
  - Total issues count

**1.3. Verify Conditions (MANDATORY OUTPUT)**:

Output the verification result (even if conditions fail):

```
📋 GIT COMMIT PREREQUISITES CHECK
Story: {story_id}
├─ Status: {current_status} (requires: Done) [{✅|❌}]
├─ Gate: {gate_result} (requires: PASS) [{✅|❌}]
└─ Decision: {PROCEED|ABORT}
```

**If ANY condition fails**:

```
❌ COMMIT PREREQUISITES NOT MET
Cannot create git commit. Story must be completed and approved first.

Current Status:
- Story Status: {current_status} (Expected: Done)
- QA Gate: {gate_result} (Expected: PASS)

Required Actions:
{suggest appropriate next steps based on status}
```

**HALT** - Do not proceed with git commit.

**If ALL conditions pass**:

```
✅ Prerequisites verified. Proceeding with git commit...
```

Continue to Step 2.

---

### Step 2: Collect Commit Metadata

From Story file and gate file, extract the following information:

**From Story**:

- `story_id` (e.g., "1.3")
- `story_title` (e.g., "User Login")
- `epic` (if present)
- `feature` (if present)
- Key Acceptance Criteria (ACs) - extract up to 3 most important
- Dev Agent Record: File List (count of modified files)

**From QA Gate**:

- `review_round` (final review round number)
- `quality_score` (0-100)
- `total_tests_added` (if available from Dev Agent Record)

**Prepare Commit Message Variables**:

```yaml
story_id: "{epic}.{story}"
story_title: "{title}"
implemented_features: |
  - {AC1 summary}
  - {AC2 summary}
  - {AC3 summary}
files_modified: { count }
tests_added: { count }
review_round: { round }
quality_score: { score }
```

---

### Step 3: Execute Git Commit

**3.1. Stage All Changes**:

```bash
# Stage story file + code changes
git add -A
```

**3.2. Create Commit with Conventional Commit Format**:

```bash
git commit -m "$(cat <<'EOF'
feat(story-{story_id}): complete story {story_title}

Story: {story_id} - {story_title}

**Implemented**:
{list key ACs or features from story - use actual values from Step 2}

**Files Modified**: {files_modified} files
**Tests Added**: {tests_added} tests
**QA Gate**: PASS (Round {review_round})

Quality Score: {quality_score}/100

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
EOF
)"
```

**IMPORTANT**: Replace all `{placeholders}` with actual values collected in Step 2. Do not leave any placeholders in the commit message.

**3.3. Verify Commit Succeeded**:

```bash
# Get commit hash and message
git log -1 --oneline
```

**If commit succeeds**: Capture commit hash (e.g., `abc123def`) and continue to Step 4.

**If commit fails**:

- Output error message with git error details
- Suggest troubleshooting steps (check git config, repo state, etc.)
- Ask user if they want to retry or abort
- If aborting, still proceed to Step 4 to update Change Log with failure note

---

### Step 4: Update Story Change Log

**4.1. Add Change Log Entry**:

Update Story file's `## Change Log` section by adding a new table row:

```markdown
| {current_date} | Git commit created: `{commit_hash}` - Story finalized and committed to repository | QA |
```

**If commit failed in Step 3**:

```markdown
| {current_date} | Git commit attempt failed: {error_summary} - Manual intervention required | QA |
```

**4.2. Save Story File**:

- Write updated Story file back to the same path found in Step 1.1 (maintains original filename with or without timestamp)
- Verify file write succeeded

---

### Step 5: Output Final Result

**If commit succeeded**:

```
✅ STORY COMMIT COMPLETE
Story: {story_id} - {story_title}
Status: Done
Gate: PASS (Round {review_round})

📦 Git Commit Details:
- Hash: {commit_hash}
- Type: feat(story-{story_id})
- Files: {files_modified} modified, {tests_added} tests added
- Quality: {quality_score}/100

🎉 Story {story_id} is now committed and ready for deployment.

Next Steps:
- Story is complete and can be closed
- Code is committed to the repository
- Ready for merge/deployment workflow
```

**If commit failed**:

```
❌ GIT COMMIT FAILED
Story: {story_id} - {story_title}
Status: Done (but not committed)

Error: {git_error_message}

⚠️ Manual Intervention Required:
1. Check git repository status: `git status`
2. Verify git configuration: `git config --list`
3. Check for conflicts or unstaged changes
4. Retry commit manually or run `*finalize-commit {story_id}` again

Story Change Log has been updated with failure notice.
```

---

## Output

### Success Output Format

```
✅ STORY COMMIT COMPLETE
Story: {story_id}
Commit: {commit_hash}
Message: feat(story-{story_id}): {story_title}

Story is now committed and ready for deployment.
```

### Failure Output Format

```
❌ COMMIT PREREQUISITES NOT MET
Story: {story_id}
Status: {current_status} (Expected: Done)
Gate: {gate_result} (Expected: PASS)

Cannot create git commit. {remediation_advice}
```

---

## Workflow Integration

This task fits into the overall workflow as follows:

```
QA: *review {story_id}
  ↓
QA creates gate file (Gate = PASS, Status = Done)
  ↓
QA: *finalize-commit {story_id}   ← THIS TASK
  ↓
Git commit created
  ↓
Story workflow complete
```

### Alternative Workflows

**Scenario 1: QA calls this task automatically**

- In `qa-review-story.md`, if Gate = PASS, QA can optionally call this task
- Or QA suggests this task in handoff message

**Scenario 2: SM orchestrates the final step**

- After QA review completes with PASS, SM can call this task to finalize

**Scenario 3: Manual execution**

- User can manually trigger `*finalize-commit {story_id}` if needed

---

## Error Handling

### Common Errors and Solutions

**Error: Story Status is not 'Done'**

- **Cause**: Story is still in Review or another non-Done status
- **Solution**: Complete QA review first with Gate = PASS

**Error: QA Gate is not 'PASS'**

- **Cause**: Latest gate result is CONCERNS or FAIL
- **Solution**: Fix issues and re-run QA review until Gate = PASS

**Error: Git commit command fails**

- **Cause**: Git configuration issues, conflicts, or repository problems
- **Solution**: Check git status, resolve conflicts, verify git config

**Error: Gate file not found**

- **Cause**: QA review hasn't been completed or gate file missing
- **Solution**: Run `*review {story_id}` first to generate gate file

---

## Quality Assurance

**Before executing git commit, verify**:

- [ ] Story Status field shows "Done"
- [ ] Latest gate file shows Gate: PASS
- [ ] All required metadata is present in Story and gate files
- [ ] Commit message contains no placeholder values
- [ ] Git repository is in clean state (no conflicts)

**After executing git commit, verify**:

- [ ] Commit hash is captured and logged
- [ ] Change Log entry is added to Story file
- [ ] Output message contains all required information
- [ ] Story can be closed or moved to next phase

---

## Design Notes

### Why This Task Exists Separately

**Original Problem**: Git commit was embedded in `qa-review-story.md` as step 7 of 8, leading to:

- High risk of being skipped due to attention fatigue (30-40% miss rate)
- Conditional logic (`ONLY if`) was ambiguous
- Long task (292 lines) made late steps easy to overlook

**Solution Benefits**:

- **Clear responsibility**: Single-purpose task focused only on git commit
- **Explicit prerequisites**: Forced verification step prevents accidental commits
- **Mandatory output**: Always outputs decision, even if skipping
- **Reusable**: Can be called by multiple agents or manually
- **Testable**: Independent task is easier to test and validate
- **Maintainable**: Git commit logic is isolated and easy to update

### Conventional Commit Format

This task uses the **conventional commit** format:

```
feat(story-{id}): {description}
```

This aligns with the project's semantic-release workflow and ensures:

- Automatic changelog generation
- Proper version bumping
- Clear commit history
- Integration with CI/CD pipelines

---

## Related Tasks

- `qa-review-story.md` - QA review that produces the Gate file
- `develop-story.md` - Dev implementation that this commit finalizes
- `apply-qa-fixes.md` - Dev fixes that may precede final approval

---

## Change History

| Date       | Change                                               | Author |
| ---------- | ---------------------------------------------------- | ------ |
| 2025-01-14 | Initial creation - extracted from qa-review-story.md | System |
