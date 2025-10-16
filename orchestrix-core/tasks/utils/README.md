# Utility Tasks

This directory contains reusable utility tasks that can be called by other tasks to avoid code duplication and improve maintainability.

## Purpose

Utility tasks extract common logic patterns that are used across multiple task files. They follow the single responsibility principle and provide well-defined interfaces for specific operations.

## Usage

Utility tasks are referenced from other task files using the relative path:

```markdown
Execute: utils/load-architecture-context.md
- story_type: {from epic}
- architecture_sharded: {from config}
```

## Planned Utility Tasks

According to the Core Agents Architecture Optimization design:

1. **load-architecture-context.md** - Load relevant architecture documents based on story type
2. **validate-status-transition.md** - Validate story status transitions according to rules

## Guidelines

When creating utility tasks:

- Define clear input parameters
- Return structured output (YAML format preferred)
- Include comprehensive error handling
- Document usage examples
- Keep tasks focused on a single responsibility
- Ensure tasks are reusable across different contexts
