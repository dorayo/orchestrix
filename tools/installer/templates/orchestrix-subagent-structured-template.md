# {{agent.name}} — {{agent.title}}

---

ID: {{agent.id}}
Icon: {{agent.icon}}
When To Use: {{agent.whenToUse}}
Tools: {{agent.tools[]}}
Persona Role: {{agent.persona.role}}
Persona Style: {{agent.persona.style}}
Persona Identity: {{agent.persona.identity}}
Persona Focus: {{agent.persona.focus}}

---

## Activation

### Load Policy

Allowed Reads:

- {{activation.load_policy.allowed_reads[]}}

Forbidden Reads: {{activation.load_policy.forbidden_reads}}

Visibility Rule: {{activation.load_policy.visibility_rule}}

Assigned Story Source: {{activation.load_policy.assigned_story_source}}

### Blocked If

- Reason: {{activation.blocked_if[].reason}}
- When: {{activation.blocked_if[].when}}
- Action: {{activation.blocked_if[].action}}

### On Start

- {{activation.on_start[]}}

## Dev Standards Contract

File: {{dev_standards_contract.file}}
Must Contain Keys: {{dev_standards_contract.must_contain_keys[]}}
Fail If Missing: {{dev_standards_contract.fail_if_missing}}

## Conflict Resolution

Invariants:

- {{conflict-resolution.invariants[]}}
  Precedence:
- {{conflict-resolution.precedence[]}}
  Rules:
- {{conflict-resolution.rules[]}}

## Core Principles

- {{core_principles[]}}

## State Machine

States: {{state-machine.states[]}}

Transitions:
{{state-machine.transitions[]}}

## Output Invariants

- {{output-invariants[]}}

## Elicitation

Mandatory: {{elicitation.mandatory}}
Rule: {{elicitation.rule}}
Generic Form:

- {{elicitation.generic-form[]}}

## Formal Workflow

Definition:

- {{formal_workflow.definition[]}}
  When Active:
- {{formal_workflow.when_active[]}}
  Override Scope:
- {{formal_workflow.override_scope[]}}
  If Missing:
- {{formal_workflow.if_missing[]}}

## Commands

Grammar: {{commands.grammar}}

### Index

Common:

- {{commands.common[].name}} — {{commands.common[].desc}}

Role-specific:

- {{commands.role-specific[].name}} — {{commands.role-specific[].desc}}

### Command Specs

#### \*{{commands.common[].name}} (Common)

Intent: {{commands.common[].desc}}
Preconditions:

- none
  Guards:
- none
  Order:
- none
  Blocking Conditions:
- none
  Review Gate:
- none
  Completion Gate:
- none
  Failure Policy:
- none

#### \*{{commands.role-specific[].name}}

Intent: {{commands.role-specific[].desc}}
Preconditions:

- {{commands.role-specific[].preconditions[] | commands.role-specific[].checks[] }}
  Guards:
- {{commands.role-specific[].guard | commands.role-specific[].test-integrity-rules[] }}
  Order:
- {{commands.role-specific[].order[]}}
  Blocking Conditions:
- {{commands.role-specific[].blocking[]}}
  Review Gate:
- {{commands.role-specific[].ready-for-review[]}}
  Completion Gate:
- {{commands.role-specific[].completion[]}}
  Failure Policy:
- {{commands.role-specific[].on_fail}}
  Write Policy: {{commands.role-specific[].write-policy}}

## Write Scope

Allowed:

- {{write-scope.allowed[]}}

Forbidden:

- {{write-scope.forbidden[]}}

## Capabilities

Database Enabled: {{capabilities.database.enabled}}

## Security

- {{security[]}}

## Telemetry

- {{telemetry[]}}
  Metrics: {{telemetry.metrics[]}}

## Help Template

```
{{help-template.text}}
```

## Blocked Response

```
{{blocked-response.text}}
```

## Exit Policy

- {{exit-policy[]}}

## Dependencies

Tasks:

- {{dependencies.tasks[]}}
  Checklists:
- {{dependencies.checklists[]}}

## IDE File Resolution

Mapping: {{ide-file-resolution.mapping}}
Types: {{ide-file-resolution.types[]}}
Example: {{ide-file-resolution.example}}
Load Policy: {{ide-file-resolution.load_policy}}

## Request Resolution

Policy: {{request-resolution.policy}}
Examples:

- User: {{request-resolution.examples[].user}}
  Action: {{request-resolution.examples[].action}}

## Handoff and Agent Switching

Switch Criteria:

- Out-of-scope from write-scope.forbidden
- Activation blocks from blocked_if
- Completion indicators from command completion gates
  Routing Policy: {{handoff.policy}}
  Confidence Threshold: {{handoff.confidence_threshold}}
  Targets:
- {{handoff.targets[].id}} when {{handoff.targets[].when}} requires {{handoff.targets[].required_inputs[]}}
  Output Block:

```yaml
handoff_suggestion:
  suggested_agent_id: "<agent-id>"
  reason: "<one sentence>"
  confidence: 0.0-1.0
  required_inputs: ["<input1>", "<input2>"]
```

Next Required Information: {{handoff.next_required_info_line}}
