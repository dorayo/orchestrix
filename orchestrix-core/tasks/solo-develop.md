# Solo Develop

One-stop development flow: story creation, TDD implementation, self-testing, and auto-commit. Dev agent handles everything autonomously without SM, Architect, or QA involvement.

## Applicability

Use when ALL conditions are met:
- Small, self-contained feature or fix
- No database schema changes required
- No security-sensitive logic involved
- Estimated scope: 5 files or fewer
- Low to medium complexity

If ANY condition fails during execution, the task escalates automatically.

## Inputs

```yaml
required:
  - description: 'Natural language description of the feature or fix'
```

## Execution

### Phase 0: Pre-flight Check

**0.1 Verify Clean Working Tree**

```bash
git status --porcelain
```

IF output is non-empty:
```
⚠️ UNCOMMITTED CHANGES DETECTED

Git working tree is not clean. Solo workflow requires a clean state.

Options:
1. Commit changes: git commit -am "wip: save progress"
2. Stash changes: git stash
3. Discard changes: git checkout -- .

Then retry: Dev *solo "{description}"
```
HALT - Do not proceed.

**0.2 Load Configuration**

Read `{root}/core-config.yaml`. Extract:
- `devStoryLocation` (story file directory)
- `project.testCommand` (test runner, may be empty for auto-detect)
- `devLoadAlwaysFiles` (coding standards to follow)

Load files listed in `devLoadAlwaysFiles` for coding standards context.

---

### Phase 1: Story Creation

**1.1 Generate Story ID**

Scan `{devStoryLocation}/` for files matching `S-*.md`:
```bash
ls {devStoryLocation}/S-*.md 2>/dev/null
```

Extract numeric portion from each filename. Calculate next ID:
- If no solo stories exist: `S-0001`
- Otherwise: max existing number + 1, zero-padded to 4 digits

Store as `{story_id}`.

IF file already exists at target path (race condition): retry with next ID. Max 3 retries, then HALT.

**1.2 Generate Acceptance Criteria**

Analyze `{description}` and generate concrete, testable acceptance criteria.

Requirements for each AC:
- Verifiable via automated test
- Uses action verbs: implements, validates, returns, handles, supports
- Covers happy path plus 1-2 edge cases
- Specific about data types, formats, error conditions
- Under 80 characters when possible

AC count validation:
- If fewer than 2 ACs generated: description is too vague. HALT with message:
  ```
  ⚠️ Description too vague for solo workflow (fewer than 2 ACs).
  Provide more detail or use SM *draft for proper story planning.
  ```
- If more than 7 ACs generated: scope is too large. HALT with message:
  ```
  ⚠️ Scope too large for solo workflow (8+ ACs generated).
  Use SM *draft to create a properly scoped story.
  ```

**1.3 Create Story File**

Generate kebab-case slug from `{description}` (max 5 words).

File path: `{devStoryLocation}/{story_id}-{slug}.md`

Use template `story-solo-tmpl.yaml` to create the file with:
- `story_id`: generated ID
- `story_title`: concise title derived from description
- `story_description`: the original description
- `acceptance_criteria`: generated ACs
- `creation_date`: current date/time

**1.4 Output Story Summary**

```
📝 SOLO STORY CREATED
ID: {story_id}
Title: {story_title}
File: {file_path}

Acceptance Criteria:
- [ ] {AC1}
- [ ] {AC2}
...

Proceeding to complexity check...
```

---

### Phase 2: Complexity Check (Escalation Gate)

**2.1 Semantic Analysis**

Analyze the acceptance criteria to determine:

```yaml
involves_db_changes: true | false
  # true IF: creating/altering tables, columns, indexes, migrations
  # false IF: read queries, connection config, ORM without schema change

involves_security: true | false
  # true IF: auth/authz logic, password hashing, token generation/validation
  # false IF: auth-related UI, error messages, documentation

involves_multiple_modules: true | false
  # true IF: changes span >2 distinct modules or domains
  # false IF: localized to single module or 2 closely related modules

estimated_file_count: integer
  # Count distinct source files implied by ACs + test files

estimated_complexity: low | medium | high
  # low: utilities, validators, formatters, simple components
  # medium: business logic with 2-3 deps, single API endpoint
  # high: complex algorithms, state management, multi-service integration
```

**2.2 Evaluate Escalation Decision**

Execute `make-decision.md` with decision type `solo-escalation` using the analysis results from step 2.1.

Reference: `data/decisions-solo-escalation.yaml`

**2.3 Handle Result**

IF result == `solo_continue`:
- Output: `✅ Complexity check passed. Proceeding to implementation.`
- Continue to Phase 3.

IF result == `escalate_standard` OR `escalate_complex`:
- Update story file: set `Story.status` = `Blocked`
- Add Change Log entry:
  ```
  | {date} | Dev | InProgress -> Blocked | Escalated: {reason} |
  ```
- Output:
  ```
  ⚠️ SOLO ESCALATION

  Story {story_id} exceeds solo workflow limits.
  Reason: {reason}

  Story file preserved at: {file_path}
  Status: Blocked

  🎯 HANDOFF TO {target_agent}: {target_command} "{description}"
  ```
- HALT.

---

### Phase 3: TDD Implementation

**3.1 Plan Implementation**

Based on ACs, determine:
- Which files to create or modify
- Which test files to create
- Implementation order (test-first for each AC)

**3.2 Implement with TDD**

For each acceptance criterion:

1. **Write failing test**: Create or update test file with test case that verifies this AC. Run to confirm it fails.
2. **Implement code**: Write the minimum code to make the test pass.
3. **Verify**: Run the specific test to confirm it passes.
4. **Mark AC**: Check off the AC in the story file: `- [x] {AC}`

Repeat for all ACs.

**3.3 Mid-flight Escalation Check**

During implementation, if ANY of these conditions are discovered:
- Database schema change is actually needed
- Security-sensitive logic is required
- File count exceeds 5
- Complexity is higher than expected

Then trigger mid-flight escalation:
- Stop implementation immediately
- Update story: `Story.status` = `Blocked`
- Add Change Log entry with escalation reason
- Output:
  ```
  ⚠️ MID-FLIGHT ESCALATION

  During implementation, detected: {issue}

  Story: {story_id} (Status: Blocked)
  Files modified so far: {list}
  Changes remain uncommitted.

  🎯 HANDOFF TO SM: *draft "{description}"
  ```
- HALT. Preserve all uncommitted changes for SM to reference.

---

### Phase 4: Validation

**4.1 Run Full Test Suite**

Determine test command:
1. Use `project.testCommand` from config if set
2. Otherwise auto-detect from project (package.json scripts, pytest, etc.)

```bash
{test_command}
```

**4.2 Run Lint**

Determine lint command from project configuration.

```bash
{lint_command}
```

**4.3 Evaluate Results**

Pass criteria: ALL tests pass AND zero lint errors.

IF pass: proceed to Phase 5.

IF fail (attempt 1 or 2):
```
❌ Validation failed (attempt {N}/3)
{failure_summary}

Analyzing and fixing...
```
- Analyze failure cause
- Fix the issue
- Retry from step 4.1

IF fail (attempt 3):
```
❌ VALIDATION FAILED (3/3 attempts)

Story {story_id} implementation incomplete.
Status: InProgress (blocked on test/lint failures)

Manual intervention required:
1. Review failures in output above
2. Fix issues manually
3. Run tests: {test_command}
4. When passing, update story status and commit

Story: {file_path}
```
- Add Change Log entry documenting failure
- HALT. Do not commit. Do not change status.

---

### Phase 5: Update Story Record

**5.1 Collect Metadata**

```yaml
files_modified: [list of files changed]
file_count: integer
test_files: [list of test files]
test_count: integer
test_results: "Pass ({passed}/{total})"
agent_model: "{model_name}"
```

**5.2 Update Solo Record**

```markdown
| Field | Value |
|-------|-------|
| Dev | {agent_model} |
| Files | {file1}, {file2}, ... ({file_count} total) |
| Tests | Pass ({passed}/{total}) |
| Commit | {updated in Phase 6} |
```

**5.3 Update Implementation Notes**

Fill the Implementation Notes section with:
- Files created or modified (with brief purpose)
- Dependencies added (if any)
- Key decisions made during implementation

**5.4 Mark All ACs Complete**

Verify all ACs are checked: `- [x]`

**5.5 Update Status**

Set `Story.status` = `Review`

Add Change Log:
```
| {date} | Dev | InProgress -> Review | Solo implementation complete |
```

Save story file.

---

### Phase 6: Auto-Commit

**6.1 Stage Changes**

```bash
git add {list of modified files}
```

Stage only files related to this solo story. Do NOT use `git add -A` blindly.

**6.2 Create Commit**

Determine commit type from description:
- Feature/addition: `feat`
- Bug fix: `fix`
- Refactor: `refactor`
- Default: `feat`

```bash
git commit -m "$(cat <<'EOF'
{type}(solo-{story_id}): {story_title}

Solo Story: {story_id}

Acceptance Criteria:
- {AC1}
- {AC2}
- {AC3}

Files: {file_count} modified, {test_count} tests
Tests: All passing ({passed}/{total})

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
EOF
)"
```

**6.3 Verify Commit**

```bash
git log -1 --oneline
```

Capture commit hash.

IF commit fails:
```
❌ GIT COMMIT FAILED
Error: {error_message}

Story {story_id} implementation is complete but not committed.
Status: Review

Manual commit required:
1. git status
2. git add {files}
3. git commit -m "{message}"

Story: {file_path}
```
Do NOT mark story as Done. HALT.

**6.4 Update Story**

Update Solo Record: set `Commit` = `{commit_hash}`

Set `Story.status` = `Done`

Add Change Log:
```
| {date} | Dev | Review -> Done | Committed: {commit_hash} |
```

Save story file (amend into the same commit or leave as unstaged - implementation choice).

---

### Phase 7: Output

```
✅ SOLO STORY COMPLETE
ID: {story_id}
Title: {story_title}
Status: Done

📦 Implementation Summary:
- Files Modified: {file_count} ({file_list})
- Tests: {test_count} files, {passed}/{total} passing

📝 Git Commit:
- Hash: {commit_hash}
- Message: {type}(solo-{story_id}): {story_title}

Story: {file_path}
```

---

## Skipped (vs develop-story)

- SM story creation (Dev creates story directly)
- Architecture context loading
- Cumulative context loading and validation
- UI/UX spec loading
- QA test design
- Dev Log initialization and updates
- Resumption guide
- Self-review gate (GATE 1) - replaced by test + lint pass
- Registry updates (database/API/models)
- Completion gate (GATE 2)
- QA review and handoff

## Constraints

- **Max 5 files**: Exceeding triggers escalation
- **No DB schema changes**: Detected via semantic analysis, triggers escalation
- **No security logic**: Detected via semantic analysis, triggers escalation
- **Max 7 ACs**: More indicates scope too large
- **Min 2 ACs**: Fewer indicates description too vague
- **Clean git required**: Dirty working tree blocks execution
- **Max 3 test retries**: Persistent failures require manual intervention

## Error Handling

| Condition | Action |
|-----------|--------|
| Dirty git working tree | Phase 0 HALT, instruct to commit/stash |
| Description too vague (< 2 ACs) | Phase 1 HALT, request more detail |
| Scope too large (> 7 ACs) | Phase 1 HALT, recommend SM *draft |
| Complexity exceeds limits | Phase 2 HALT, escalate to SM/Architect |
| Mid-flight complexity discovery | Phase 3 HALT, escalate with context |
| Test/lint failures (3 attempts) | Phase 4 HALT, manual intervention |
| Git commit fails | Phase 6 HALT, manual commit instructions |
| Story ID collision | Retry up to 3 times with next ID |
| No test command found | Phase 4 HALT, instruct to configure |
