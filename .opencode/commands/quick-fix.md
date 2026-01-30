---
description: "Quick Fix"
---

When this command is used, execute the following task:

# Quick Fix

Lightweight bug fix without story creation. Enforces context loading and impact analysis.

## Applicability

Use when ALL conditions met:

- Bug is localized (≤3 files affected)
- Root cause is clear
- No design/architecture change required
- Fix approach is obvious

If ANY condition fails → Create story via SM instead.

## Inputs

```yaml
required:
  - bug_description: "Natural language description of the bug"

optional:
  - files: "Suspected file paths (comma-separated)"
```

## Execution

### Phase 1: Context Loading (MANDATORY)

**1.1 Locate Bug**

Find bug location using `files` hint or by searching:

```bash
# Search for relevant code
grep -rn "{keywords}" src/
```

Record:

```yaml
bug_location:
  file: "{path}"
  lines: "{start}-{end}"
  function: "{name}"
```

**1.2 Trace Source Story**

Attempt to find the story that created this code:

```bash
# Method 1: Git blame
git blame -L {start},{end} {file}
# Extract story ID from commit message (format: feat(story-X.Y): ...)

# Method 2: Reverse search in stories
grep -r "{filename}" docs/stories/
```

**1.3 Load Context**

IF source story found:

- Read story file
- Extract: AC list, design intent, technical constraints
- Extract: Files list from Quick Record or Dev Agent Record

IF source story NOT found:

- Read the bug-containing file completely
- Read files that import/call the bug location
- Analyze: What is this code's purpose?

**1.4 Output Context Summary**

```markdown
## Context Summary

### Bug Location

- File: {file_path}
- Lines: {line_range}
- Function: {function_name}

### Source Story

- ID: {story_id} | NOT FOUND
- Design Intent: {intent_summary}

### Code Purpose

{What this code is supposed to do}

### Related Files

- {file1} - {relationship}
- {file2} - {relationship}
```

**CHECKPOINT**: Proceed only after context is documented.

---

### Phase 2: Impact Analysis (MANDATORY)

**2.1 Analyze Call Graph**

Identify:

```yaml
callers: # Functions that call the bug location
  - file: "{path}"
    function: "{name}"
    line: { n }

callees: # Functions called by the bug location
  - file: "{path}"
    function: "{name}"
```

**2.2 Analyze Data Flow**

Identify:

```yaml
data_input: # Where does data come from?
  - source: "{description}"
    type: "{data_type}"

data_output: # Where does data go?
  - destination: "{description}"
    consumers: ["{list}"]
```

**2.3 Identify Sync Points**

List ALL locations that may need modification:

```yaml
sync_points:
  - file: '{path}'
    reason: '{why this needs checking/modification}'
    action: 'modify' | 'verify'
```

**2.4 Output Impact Report**

```markdown
## Impact Report

### Directly Affected

| File    | Lines   | Reason             |
| ------- | ------- | ------------------ |
| {file}  | {lines} | Bug location       |
| {file2} | {lines} | Calls bug location |

### Call Graph

- {function}() called by:
  - {caller1}:{line}
  - {caller2}:{line}

### Sync Points (MUST check/modify)

- [ ] {file1} - {reason}
- [ ] {file2} - {reason}

### Test Files to Verify

- {test_file1}
- {test_file2}

### Estimated Scope

Files: {count} | Sync Points: {count}
```

**SCOPE CHECK**:

```
IF files_count > 3 OR sync_points > 5:
  ⚠️ Scope exceeds quick-fix threshold
  RECOMMEND: Create story for systematic fix
  ASK: "Continue with quick-fix anyway? (y/n)"
```

**CHECKPOINT**: User must confirm Impact Report before proceeding.

---

### Phase 3: Fix Plan (USER CONFIRMATION REQUIRED)

**3.1 Root Cause Analysis**

Document:

```yaml
root_cause:
  what: "{What is actually broken}"
  why: "{Why it broke}"
  where: "{Exact location}"
```

**3.2 Generate Fix Plan**

```markdown
## Fix Plan

### Root Cause

{root_cause_description}

### Solution

{solution_description}

### Modification Checklist

| #   | File    | Change           | Status |
| --- | ------- | ---------------- | ------ |
| 1   | {file1} | {what to change} | ⏳     |
| 2   | {file2} | {what to change} | ⏳     |
| 3   | {file3} | {what to verify} | ⏳     |

### Tests to Run

- {test_command_1}
- {test_command_2}
```

**CHECKPOINT**: User must approve Fix Plan before execution.

---

### Phase 4: Execute Fix

**4.1 Apply Changes**

For each item in Modification Checklist:

1. Make the change
2. Update status: ⏳ → ✅
3. If unexpected issue → STOP, update plan, re-confirm

**4.2 Incremental Verification**

After each file change:

```bash
# Syntax check
npm run lint {file}  # or equivalent

# Quick test
npm test -- --grep "{related_test}"  # or equivalent
```

---

### Phase 5: Verification (MANDATORY)

Execute: `checklists/gate-quick-fix-verification.md`

**5.1 Completeness Check**

```yaml
completeness:
  - check: "All Impact Report files processed"
    status: PASS | FAIL
  - check: "All Sync Points addressed"
    status: PASS | FAIL
  - check: "All Modification Checklist items complete"
    status: PASS | FAIL
```

**5.2 Consistency Check**

```yaml
consistency:
  - check: "Changes follow existing code style"
    status: PASS | FAIL
  - check: "Error handling matches surrounding code"
    status: PASS | FAIL
  - check: "No conflicting changes introduced"
    status: PASS | FAIL
```

**5.3 Test Check**

```yaml
tests:
  - check: "All related tests pass"
    status: PASS | FAIL
  - check: "Bug reproduction scenario fixed"
    status: PASS | FAIL
```

**5.4 Side Effect Check**

```yaml
side_effects:
  - check: "No unrelated functionality affected"
    status: PASS | FAIL
  - check: "No new warnings/errors introduced"
    status: PASS | FAIL
```

**GATE DECISION**:

- PASS: All checks pass
- FAIL: Any check fails → Fix and re-verify

---

## Output

### On Success

```markdown
## Quick Fix Complete

### Bug

{bug_description}

### Root Cause

{root_cause}

### Changes Made

| File    | Change    |
| ------- | --------- |
| {file1} | {change1} |
| {file2} | {change2} |

### Verification

✅ All checks passed

### Commit (if requested)

Ready for: git commit -m "fix: {short_description}"
```

### Optional: Git Commit

If user requests commit:

```bash
git add {modified_files}
git commit -m "$(cat <<'EOF'
fix: {short_description}

{detailed_description}

Root cause: {root_cause}
Files changed: {file_list}

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
EOF
)"
```

---

## Constraints

- **NO story creation**: This flow bypasses story workflow
- **NO architecture changes**: If needed, escalate to story
- **NO skipping phases**: All 5 phases are mandatory
- **User confirmations required**: At Phase 2 (Impact) and Phase 3 (Plan)
- **Max 3 files**: Exceeding triggers story recommendation

## Error Handling

| Condition               | Action                    |
| ----------------------- | ------------------------- |
| Cannot locate bug       | ASK user for more details |
| Impact scope > 3 files  | RECOMMEND story creation  |
| Test failures after fix | REVERT and re-analyze     |
| New bugs introduced     | HALT, document, escalate  |

## Escalation

### Escalation Triggers

Escalate to SM for bugfix story if ANY:

- Scope exceeds 3 files after Impact Analysis
- Root cause unclear after analysis
- Fix requires design change
- Multiple components affected
- Security implications discovered
- Data integrity concerns

### Escalation Procedure

**Step 1: Collect Escalation Context**

```yaml
escalation_context:
  bug_description: "{original bug description}"
  source_story_id: "{from Phase 1 if found}"
  root_cause: "{from Phase 3 if analyzed}"
  affected_files:
    - "{file1}"
    - "{file2}"
  estimated_scope: { file_count }
  escalation_reason: "{why quick-fix is insufficient}"
  analysis_done:
    context_loaded: true | false
    impact_analyzed: true | false
    root_cause_identified: true | false
```

**Step 2: Output Escalation Summary**

```markdown
## Quick Fix Escalation

**Reason**: {escalation_reason}

### Analysis Completed

- Context Summary: ✅
- Impact Report: ✅
- Affected Files: {count}

### Collected Information

{escalation_context in YAML format}

### Recommendation

Scope exceeds quick-fix threshold. Creating tracked bugfix story.
```

**Step 3: Handoff to SM**

```
🎯 HANDOFF TO SM: *draft-bugfix "{bug_description}" --source {source_story_id} --files "{affected_files}"
```

**Alternative: User Declines Story**

If user wants to proceed with quick-fix anyway:

```
⚠️ WARNING: Proceeding with quick-fix despite scope > 3 files.
Risk: Changes may be incomplete or introduce regressions.

Set: scope_alert = true
Continue to Phase 3 with enhanced verification.
```
