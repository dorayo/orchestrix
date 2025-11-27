# Change Level Classification Utility

## Purpose

Analyze change description semantically and route to appropriate layer (STORY/EPIC/TECH/PRODUCT).
This utility is called by all layer tasks as the first step to ensure correct routing.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| change_description | string | Yes | Free-form textual description of the change |
| context.explicit_story_id | string | No | Story ID if user specified (e.g., "5.3") |
| context.explicit_epic_id | string | No | Epic ID if user specified (e.g., "5") |
| context.current_agent | string | Yes | Agent executing this utility (SM/PO/ARCHITECT/PM) |

## Process

### Step 1: Extract Semantic Indicators

Scan `change_description` for indicator keywords defined in `change-level-classification.yaml`:

**Story-level indicators**: "AC unclear", "acceptance criteria", "task blocked", "single story", "this story", "clarify requirements"

**Epic-level indicators**: "multiple stories", "story dependencies", "epic scope", "reorder stories", "add story", "remove story", "cross-story"

**Tech-level indicators**: "architecture", "API contract", "database schema", "tech stack", "security vulnerability", "performance issue", "system design"

**Product-level indicators**: "PRD", "MVP scope", "feature definition", "requirement change", "product direction", "multiple epics"

Count indicators for each level.

### Step 2: Identify Explicit References

Extract explicit IDs from change_description:
- Story ID pattern: `\d+\.\d+` (e.g., "5.3")
- Epic ID pattern: `Epic \d+` or `epic-\d+` (e.g., "Epic 5")
- Multi-reference pattern: Detect "and", "," between IDs

### Step 3: Apply Classification Rules

Execute decision: `data/decisions/change-level-classification.yaml`

Input:
```yaml
change_description: "{change_description}"
context:
  explicit_story_id: "{context.explicit_story_id or null}"
  explicit_epic_id: "{context.explicit_epic_id or null}"
  current_agent: "{context.current_agent}"
```

### Step 4: Determine Routing

Based on decision output:

```yaml
level: STORY | EPIC | TECH | PRODUCT
handler: SM | PO | ARCHITECT | PM
confidence: 0.0-1.0
reasoning: "Brief explanation"
```

### Step 5: Output Result

IF `context.current_agent == handler`:
```yaml
result: CONTINUE
level: "{level}"
handler: "{handler}"
confidence: {confidence}
reasoning: "{reasoning}"
```

IF `context.current_agent != handler`:
```yaml
result: REDIRECT
level: "{level}"
handler: "{handler}"
confidence: {confidence}
reasoning: "{reasoning}"
redirect_command: "{appropriate command for handler}"
handoff_message: "🎯 HANDOFF TO {handler}: {redirect_command} - {reasoning}"
```

## Output

```yaml
result: CONTINUE | REDIRECT
level: STORY | EPIC | TECH | PRODUCT
handler: SM | PO | ARCHITECT | PM
confidence: number
reasoning: string
redirect_command: string  # Only if result == REDIRECT
handoff_message: string   # Only if result == REDIRECT
```

## Behavior Notes

1. **Low confidence handling**: If confidence < 0.6, include note in reasoning suggesting user clarification may help
2. **Ambiguous cases**: If multiple levels have similar indicator counts, prefer lower level (STORY > EPIC > TECH > PRODUCT)
3. **Explicit ID priority**: Explicit story_id/epic_id takes precedence over semantic analysis
4. **HALT on redirect**: Calling task MUST halt processing if result == REDIRECT and output the handoff_message
