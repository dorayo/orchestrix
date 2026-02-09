# Solo Fix

Fix a bug from a one-line description. Locate root cause, fix, test, commit.

## Inputs

```yaml
required:
  - bug: 'Natural language description of the bug'
```

## Execution

### Step 1: Locate

- Search codebase for code related to the bug description (grep, read files).
- Identify the root cause. Do NOT just patch the symptom.

### Step 2: Write regression test

- IF test framework exists: write a test that reproduces the bug (should FAIL before fix).
- IF no test framework: skip to Step 3.

### Step 3: Fix

- Apply minimal change to fix the root cause.
- Run the regression test to confirm it now PASSES.
- IF fix requires more than 5 files: warn user `"Fix scope is large ({count} files). Continue?"`.

### Step 4: Verify

- Run full test suite + lint.
- IF fail: fix and retry (max 3 attempts).
- IF still failing: HALT with details.

### Step 5: Commit

```
fix: {concise description of what was fixed}

Root cause: {one-line explanation}

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
```

### Step 6: Output

```
✅ Fixed
🔍 Root cause: {explanation}
🔧 Changed: {file1}, {file2}
📦 {commit_hash} fix: {description}
```
