# Structured Termination Block (STB) Template

## Overview

STB is the PRIMARY method for tmux automation handoff detection. It uses pure ASCII markers that are immune to UTF-8/emoji encoding issues.

## Usage

At the END of every task that requires handoff, output BOTH:
1. STB block (for automation - PRIMARY)
2. Emoji HANDOFF line (for human readability - SECONDARY)

## Template Format

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: {agent}
command: {command}
args: {args}
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO {agent}: *{command} {args}
```

## Field Definitions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `target` | Yes | Target agent name (lowercase) | `qa`, `dev`, `sm`, `architect` |
| `command` | Yes | Command name (without `*` prefix) | `review`, `develop-story`, `draft` |
| `args` | No | Command arguments (usually story_id) | `1.3`, `2.1`, empty if none |

## Examples

### Dev → QA (with args)

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: qa
command: review
args: 1.3
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO qa: *review 1.3
```

### QA → SM (no args)

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: sm
command: draft
args:
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO sm: *draft
```

### SM → Architect

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review
args: 2.1
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO architect: *review 2.1
```

### Architect → Dev

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: develop-story
args: 3.2
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO dev: *develop-story 3.2
```

### QA → Dev (fixes required)

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: dev
command: apply-qa-fixes
args: 1.5
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO dev: *apply-qa-fixes 1.5
```

### Dev → Architect (escalation)

```
---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review-escalation
args: 2.3
---ORCHESTRIX-HANDOFF-END---

🎯 HANDOFF TO architect: *review-escalation 2.3
```

## Rules

1. **STB MUST appear BEFORE the emoji HANDOFF line**
2. **All field names are lowercase** (`target:`, `command:`, `args:`)
3. **Target agent names are lowercase** (`qa`, not `QA`)
4. **`args` field should be present even if empty** (just `args:` with nothing after)
5. **No extra whitespace inside marker lines**
6. **Markers must be on their own lines**
7. **This is your FINAL output - nothing after the emoji HANDOFF line**

## Why STB?

- **Reliability**: Pure ASCII markers don't break with UTF-8 encoding issues
- **Consistency**: Structured format prevents LLM "creative" formatting
- **Debuggability**: YAML-like format is easy to parse and log
- **Fallback**: Emoji HANDOFF still works if STB fails somehow
