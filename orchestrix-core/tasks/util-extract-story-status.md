# extract-story-status

Robust multi-strategy story status extraction utility.

## Purpose

Extract story status from various formats with intelligent fallback strategies, ensuring AI can handle both strict template formats and free-text variations.

## Inputs

```yaml
required:
  - story_file_path: 'Path to story markdown file'
```

## Extraction Strategies

Try the following strategies **in order** until a valid status is found:

### Strategy 1: Standard Format
Look for `## Status` section, extract next non-empty line.

**Example**:
```markdown
## Status

Review
```
→ Extract: `Review`

### Strategy 2: Bold Format (Regex)
Look for `**{Status}**` pattern in Status section using regex.

**Pattern**: `\*\*(Blocked|AwaitingArchReview|AwaitingTestDesign|TestDesignComplete|RequiresRevision|Approved|InProgress|Review|Done|Escalated)\*\*`

**Example**:
```markdown
## Status

**Review** - QA Round 1 fixes applied, awaiting re-review
```
→ Extract: `Review`

### Strategy 3: Change Log Fallback
If above strategies fail, extract from last Change Log entry.

**Steps**:
1. Find `## Change Log` section
2. Locate last table row (most recent entry)
3. Extract status from "Status Transition" column (text after `→`)

**Example**:
```markdown
| 2025-11-17 15:11 | Dev | InProgress → Review | Fixes applied |
```
→ Extract: `Review`

### Strategy 4: Keyword Search
Search entire Status section for valid status keywords.

**Valid statuses**:
- Blocked
- AwaitingArchReview
- AwaitingTestDesign
- TestDesignComplete
- RequiresRevision
- Approved
- InProgress
- Review
- Done
- Escalated

**Method**: Return **first match** found in Status section (case-sensitive).

### Error Handling

**If no valid status found after all strategies**:
```
❌ STATUS EXTRACTION FAILED

Story: {story_id}
File: {story_file_path}

Could not extract valid status using any strategy:
- Strategy 1 (Standard Format): No match
- Strategy 2 (Bold Format): No match
- Strategy 3 (Change Log): No match
- Strategy 4 (Keyword Search): No match

The Status section may be malformed or missing.

Expected format:
## Status

{ValidStatus}

Valid statuses: Blocked, AwaitingArchReview, AwaitingTestDesign,
TestDesignComplete, RequiresRevision, Approved, InProgress, Review, Done, Escalated

HALT: Cannot proceed without valid status ⛔
```

## Output

**On Success**:
```yaml
status: '{extracted_status}'  # One of the valid enum values
strategy_used: '{1|2|3|4}'    # Which strategy succeeded
```

**On Failure**: Error message + HALT

## Design Philosophy

**Robustness over Rigidity**: AI should be smart enough to extract status from various formats, not force users into strict templates. This utility embodies the principle that AI assistants should adapt to human writing styles, not the reverse.

## Usage in Other Tasks

Include this utility at the beginning of any task that needs to extract story status:

```markdown
!include tasks/util-extract-story-status.md

# Use extracted status
{status} → One of the valid enum values
{strategy_used} → Which strategy was used (for debugging)
```

## Testing Examples

**Test Case 1** (Standard):
```markdown
## Status

Review
```
→ `status: Review, strategy: 1`

**Test Case 2** (Bold):
```markdown
## Status

**InProgress** - Dev fixing QA Round 2 issues
```
→ `status: InProgress, strategy: 2`

**Test Case 3** (Change Log):
```markdown
## Status

(malformed or missing)

## Change Log
| Date | Agent | Status Transition | Details |
| 2025-11-17 | Dev | Approved → Review | Complete |
```
→ `status: Review, strategy: 3`

**Test Case 4** (Keyword Search):
```markdown
## Status

Story is currently in Review status awaiting QA feedback.
```
→ `status: Review, strategy: 4`
