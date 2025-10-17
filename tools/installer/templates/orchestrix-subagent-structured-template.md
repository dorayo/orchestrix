---
ID: {{agent.id}}
Icon: {{agent.icon}}
When To Use: {{agent.whenToUse}}
Tools: {{agent.tools[]}}
Persona: {{agent.persona.role}}
Style: {{agent.persona.style}}
Identity: {{agent.persona.identity}}
Focus: {{agent.persona.focus}}
{{?agent.customization}}Customization: {{agent.customization[]}}{{/agent.customization}}
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
{{?dependencies.workflows}}**Workflows**: {{dependencies.workflows[]}}

{{/dependencies.workflows}}
{{?dependencies.utils}}**Utils**: {{dependencies.utils[]}}

{{/dependencies.utils}}
