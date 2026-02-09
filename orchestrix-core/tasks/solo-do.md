# Solo Do

Implement a feature from a one-line description. Produces working code, passing tests, and a clean commit.

## Inputs

```yaml
required:
  - description: 'Natural language description of the feature to implement'
```

## Execution

### Phase 0: Pre-flight

0.1 Load config:
- Read `core-config.yaml`. Extract `testCommand`, `devLoadAlwaysFiles`.
- Load files in `devLoadAlwaysFiles` if they exist. Skip silently if missing.

0.2 Check git:
- Run `git status --porcelain`.
- IF dirty: warn `"Uncommitted changes detected. Recommend commit or stash first. Continue?"`.
- IF user declines: HALT. IF user confirms: continue.

0.3 Scan project:
- Quick scan of project structure and tech stack (package.json, config files).

### Phase 1: Analyze

1.1 Parse intent:
- Identify: feature goal, modules involved, data requirements.
- Determine commit type: `feat` | `fix` | `refactor` | `chore` | `docs`.

1.2 Plan implementation:
- List files to create or modify.
- List test files to create or modify.
- Estimate file count and complexity.

1.3 Risk assessment (inline, advisory only — never block):
- IF task involves DB schema changes (CREATE/ALTER TABLE, migrations):
  → warn: `"⚠️ DB schema change. Suggest: create migration + verify rollback. Continue?"`
- IF task involves security logic (auth, password hashing, tokens, permissions):
  → warn: `"⚠️ Security-sensitive logic. Suggest: use mature lib (NextAuth, bcrypt). Continue?"`
- IF estimated file count > 8:
  → warn: `"⚠️ Large scope ({count} files). Suggest: split into multiple commits. Continue?"`
- IF high complexity (multi-service integration, complex state management):
  → warn: `"⚠️ High complexity. Suggest: implement core first, edge cases later. Continue?"`
- Multiple risks → combine into one warning.
- Wait for user response. Proceed only on confirmation.

1.4 Large scope handling:
- IF estimated file count > 8 OR description contains multiple distinct features:
  - Propose splitting into N sub-tasks, each with its own commit.
  - Ask: `"Implement step by step (recommended) or all at once?"`
  - IF step-by-step: execute each sub-task as a separate Phase 2→3→4 cycle.

1.5 Output plan:

```
📋 Plan:
- {action_1}
- {action_2}
- {action_3}

Implementing...
```

### Phase 2: Implement (TDD)

For each planned change, follow the Red-Green-Refactor cycle:

2.1 Red — Write failing test first:
- Derive test cases from the feature description.
- Write test(s) that define the expected behavior.
- Run tests to confirm they FAIL (validates the test is meaningful).
- IF no test framework exists in the project: skip TDD, write code directly with manual verification.

2.2 Green — Write minimal code to pass:
- Implement the simplest code that makes the failing test(s) pass.
- Follow project coding standards.
- Run tests to confirm they PASS.

2.3 Refactor (if needed):
- Clean up implementation without changing behavior.
- Re-run tests to confirm they still pass.

2.4 Adapt on the fly:
- Scope larger than expected → continue. Do not stop or escalate.
- New dependency needed → install it. Note in commit body.
- Unexpected issue → handle inline.

2.5 Step-by-step mode (if activated in 1.4):
- After each sub-task: run verify + commit, then proceed to next.
- Output progress: `"🔨 [{current}/{total}] {sub_task_description}..."`.

### Phase 3: Verify

3.1 Run tests:
- Use `testCommand` from config, or auto-detect from project.
- IF no test framework configured: skip test step.

3.2 Run lint:
- Auto-detect lint command from project config.
- IF no linter configured: skip lint step.

3.3 Handle failures:
- IF fail (attempt 1–3): analyze root cause, fix, retry.
- IF fail after 3 attempts:
  - Output: `"❌ Tests/lint not passing after 3 attempts. Code written but not committed. Fix manually then commit."`.
  - HALT. Do not commit broken code.

### Phase 4: Commit

4.1 Stage changes:
- `git add {specific files}`. Do NOT use `git add -A`.

4.2 Commit:

```
{type}: {concise description}

{optional body for multi-file changes}

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
```

4.3 Output:

```
✅ Done
📦 {commit_hash} {type}: {description}
Files: {count} modified | Tests: {test_result}
```

### Phase 4b: Backlog sync (optional)

- IF `BACKLOG.md` exists in project root:
  - Scan "Up Next" items for a fuzzy match to the implemented feature.
  - IF match found: move item to "Done" section, append `({commit_hash})`.
  - IF no match: skip silently.

## Error Handling

| Condition | Action |
|-----------|--------|
| Dirty git (user declines) | HALT |
| Advisory risk (user declines) | HALT |
| Test/lint fail after 3 retries | HALT. Code written but not committed. |
| Git commit fails | Output manual commit instructions. Do not retry. |
