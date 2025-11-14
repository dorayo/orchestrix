# DEV Change Log Entry Template

**Context**: Add this entry to Story Change Log when transitioning story status

## Simple Format (Implementation Complete)

Use this format when marking story as Review after implementation:

```
| {YYYY-MM-DD HH:MM:SS} | Dev | InProgress → Review | Round {N}, Self-Review: PASS ({score}%), Tests: {test_count}, Files: {file_count} |
```

**Required Fields**:
- Date/Time: Current timestamp in YYYY-MM-DD HH:MM:SS format
- Agent: "Dev"
- Transition: "InProgress → Review"
- Round: Implementation round number
- Self-Review: PASS with gate score percentage
- Tests: Total number of tests written
- Files: Number of files added/modified

**Example**:
```
| 2025-01-14 16:30:00 | Dev | InProgress → Review | Round 1, Self-Review: PASS (96%), Tests: 15, Files: 8 |
```

---

## Detailed Format (QA Fixes Applied)

Use this format when applying QA fixes (see apply-qa-fixes.md for full details):

```markdown
### {YYYY-MM-DD HH:MM:SS} - Dev QA Fixes (QA Review Round {review_round})

**Action:** Applied fixes based on QA review findings

**QA Review Context:**
- QA Review Round: {review_round}
- Previous Gate Result: {PASS/CONCERNS/FAIL}
- Issues Addressed: {count} total issues

**Fixes Applied:**
{Detailed list of fixes - see apply-qa-fixes.md}

**Files Modified:**
- Added: {list}
- Modified: {list}
- Deleted: {list}

**Validation Results:**
- Lint Status: {PASS/issues resolved}
- Test Status: {all tests passing}
- Build Status: {successful}

**Next Status:** `{Review/InProgress}`
**Reasoning:** {Dev's assessment}

---
```

**Note**: For QA fixes, use the detailed format from `apply-qa-fixes.md` task file.
