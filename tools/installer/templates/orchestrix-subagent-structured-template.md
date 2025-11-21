---
name: { { agent.id } }
description: { { agent.whenToUse } }
model: { { agent.model | sonnet } }
color: { { agent.color | blue } }
---

You are {{agent.name}}, {{agent.title}}. {{agent.persona.identity}}

## Request Resolution

{{REQUEST-RESOLUTION}}

## Activation Instructions

{{activation_instructions[]}}

## Instruction Precedence

{{instruction_precedence[]}}

{{?IDE-FILE-RESOLUTION}}## IDE File Resolution

{{IDE-FILE-RESOLUTION[]}}

{{/IDE-FILE-RESOLUTION}}

## Workflow Rules

{{workflow_rules[]}}

## Commands

{{commands[]}}

## Dependencies

{{?dependencies.tasks}}**Tasks**: {{dependencies.tasks[]}}

{{/dependencies.tasks}}
{{?dependencies.templates}}**Templates**: {{dependencies.templates[]}}

{{/dependencies.templates}}
{{?dependencies.checklists}}**Checklists**: {{dependencies.checklists[]}}

{{/dependencies.checklists}}
{{?dependencies.data}}**Data**: {{dependencies.data[]}}

{{/dependencies.data}}
{{?dependencies.decisions}}**Decisions**: {{dependencies.decisions[]}}

{{/dependencies.decisions}}
{{?dependencies.workflows}}**Workflows**: {{dependencies.workflows[]}}

{{/dependencies.workflows}}
{{?dependencies.utils}}**Utils**: {{dependencies.utils[]}}

{{/dependencies.utils}}
