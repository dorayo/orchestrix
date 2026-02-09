# Solo Plan

Create or update a lightweight backlog in `BACKLOG.md`.

## Inputs

```yaml
required: none
optional:
  - items: 'Comma-separated list of features to add to backlog'
```

## Execution

### Step 1: Load

- IF `BACKLOG.md` exists in project root: read and parse it.
- IF not: create empty structure.

### Step 2: Display Current State

Output current backlog:

```
📋 Backlog

Up Next:
{numbered list of pending items}

Done:
{list of completed items with commit hashes}
```

### Step 3: Interactive Edit

IF user provided `items` argument:
- Add each item to "Up Next" section.
- Save and output updated backlog.

IF no argument:
- Ask: `"Add items, reorder, or remove? (or type items to add)"`
- Process user input:
  - Text → add as new items to "Up Next"
  - `remove {number}` → remove item at that position
  - `reorder {from} {to}` → move item from position to position
- Save after each change.

### File Format

```markdown
# Backlog

## Up Next
- [ ] {item_1}
- [ ] {item_2}

## Done
- [x] {item_3} ({commit_hash})
- [x] {item_4} ({commit_hash})
```

Rules:
- No story IDs. No status fields. No dev_notes.
- "Done" items include the commit hash in parentheses.
- Items are plain text descriptions, one line each.
