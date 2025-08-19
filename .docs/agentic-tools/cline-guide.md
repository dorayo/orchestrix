# Orchestrix Guide for Cline (VS Code)

For the complete workflow, see the [orchestrix Workflow Guide](../orchestrix-workflow-guide.md).

## Installation

When running `npx orchestrix install`, select **Cline** as your IDE. This creates:

- `.clinerules/` directory with numbered agent rule files (`.md`)
- Agents ordered by priority (orchestrix-master first)

## Using orchestrix Agents in Cline

1. **Open Cline panel** in VS Code
2. **Type `@agent-name`** in the chat (e.g., `@dev`, `@sm`, `@architect`)
3. The agent adopts that persona for the conversation
