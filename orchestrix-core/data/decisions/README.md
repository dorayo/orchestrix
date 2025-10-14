# Decision Data Files

## Overview

This directory contains decision data files that define the decision logic for all agents in the Orchestrix framework. The decision system centralizes decision-making logic, making it reusable, maintainable, and consistent across all agents.

## Purpose

- **Centralize Decision Logic**: Extract decision logic from task files and agent configurations
- **Improve Maintainability**: Update decision rules without modifying task files
- **Ensure Consistency**: All agents use the same decision logic for similar scenarios
- **Reduce Token Consumption**: Remove verbose decision logic from frequently loaded files
- **Enable Traceability**: Track decision reasoning and outcomes

## Decision System Architecture

```
Agent Task → make-decision.md → Decision Data File → Result
     │              │                    │              │
     ▼              ▼                    ▼              ▼
  Context      Load Rules          Evaluate        Return
   Data         from YAML           Rules          Decision
```

## File Structure

Each decision data file follows this structure:

```yaml
decision_type: string           # Unique identifier for this decision type
description: string             # Human-readable description of the decision

inputs:                         # Required and optional inputs
  - name: string                # Input parameter name
    type: string                # Data type (string, number, boolean, object)
    description: string         # What this input represents
    required: boolean           # Whether this input is mandatory

rules:                          # Decision rules (evaluated in order)
  - condition: string           # Logical expression to evaluate
    result: string              # Decision outcome if condition matches
    reasoning: string           # Explanation for this decision
    next_status: string         # (Optional) Story status to set
    next_action: string         # (Optional) Action to take next
    metadata: object            # (Optional) Additional data

output:                         # Output format definition
  result: [enum values]         # Possible result values
  reasoning: string             # Explanation format
  next_status: string           # (Optional) Status field
  next_action: string           # (Optional) Action field
```

## Decision Types by Agent

### SM Agent Decisions

- **architect-review-needed**: Determine if Architect review is required
- **test-design-level**: Determine test design complexity level (Simple/Standard/Comprehensive)
- **story-status**: Determine initial Story status based on review and test design results

### Architect Agent Decisions

- **review-result**: Determine review outcome (Approved/RequiresRevision/Escalated)

### Dev Agent Decisions

- **block-story**: Determine if Story should be blocked due to unclear AC
- **escalate-architect**: Determine if implementation deviation requires Architect review

### QA Agent Decisions

- **gate-decision**: Determine QA gate result (PASS/FAIL/CONCERNS)
- **escalate-architect**: Determine if architecture concerns require Architect review
- **test-design-update**: Determine if test design needs updating after Story revision

## Usage

### From Task Files

```markdown
1. Execute decision task:
   - Task: make-decision.md
   - Inputs:
     - decision_type: "architect-review-needed"
     - context:
       - quality_score: 8.5
       - complexity_indicators: 2

2. Apply decision result:
   - Set Story Status = {result.next_status}
   - Output Handoff = {result.next_action}
```

### From Agent Configurations

```yaml
commands:
  create-story:
    order:
      - Execute task: make-decision
        inputs:
          decision_type: architect-review-needed
          context: {quality_score, complexity_indicators}
      - Apply decision result to Story
```

## Rule Evaluation

Rules are evaluated **in order** from top to bottom. The **first matching rule** is applied.

### Condition Syntax

Conditions use logical expressions:

- **Comparison**: `score >= 8.0`, `complexity <= 1`
- **Logical AND**: `score >= 8.0 AND complexity >= 2`
- **Logical OR**: `score < 6.0 OR quality_issues > 5`
- **Nested**: `(score >= 8.0 AND complexity <= 1) OR (score >= 9.0)`

### Example Rule

```yaml
- condition: quality_score >= 8.0 AND complexity_indicators >= 2
  result: REQUIRED
  reasoning: High quality but high complexity requires architectural validation
  next_status: AwaitingArchReview
```

## Decision Result Format

```yaml
DecisionResult:
  decision_type: string         # Type of decision made
  result: string                # Decision outcome
  reasoning: string             # Why this decision was made
  confidence: number            # Confidence level (0-1)
  next_status: string           # (Optional) Status to set
  next_action: string           # (Optional) Action to take
  metadata: object              # (Optional) Additional data
```

## Best Practices

### Writing Decision Rules

1. **Order Matters**: Place most specific rules first, general rules last
2. **Be Explicit**: Use clear, unambiguous conditions
3. **Provide Reasoning**: Explain why each decision is made
4. **Cover All Cases**: Ensure at least one rule matches for any valid input
5. **Use Defaults**: Add a catch-all rule at the end for unexpected cases

### Maintaining Decision Files

1. **Version Control**: Track all changes to decision files
2. **Test Changes**: Validate rule changes with test cases
3. **Document Updates**: Note why rules were changed
4. **Backward Compatibility**: Consider impact on existing Stories

### Error Handling

1. **Invalid Decision Type**: Return error with available types
2. **Missing Required Input**: Return error with required inputs list
3. **No Matching Rule**: Log context and return safe default
4. **Invalid Condition**: Return error with condition syntax help

## Migration from Inline Logic

When migrating decision logic from task files:

1. **Identify Decision Points**: Find all decision logic in task file
2. **Extract Rules**: Convert if/else logic to rule format
3. **Create Data File**: Define decision type and rules
4. **Update Task File**: Replace logic with decision task call
5. **Test**: Verify same outcomes with new system
6. **Measure**: Confirm token reduction achieved

## Token Reduction Impact

Expected token reduction by removing decision logic:

- **Task Files**: 40% reduction for decision-heavy tasks
- **Agent Configs**: 30% reduction overall
- **Checklists**: 35% reduction by removing decision explanations
- **Overall System**: 30%+ reduction in total token consumption

## Examples

See individual decision data files in this directory:

- `sm-architect-review-needed.yaml`
- `sm-test-design-level.yaml`
- `sm-story-status.yaml`
- `architect-review-result.yaml`
- `dev-block-story.yaml`
- `dev-escalate-architect.yaml`
- `qa-gate-decision.yaml`
- `qa-escalate-architect.yaml`
- `qa-test-design-update.yaml`

## Related Documentation

- **Decision Task**: `orchestrix-core/tasks/make-decision.md`
- **Requirements**: `.kiro/specs/cross-agent-coordination-enhancement/requirements.md` (Requirement 6)
- **Design**: `.kiro/specs/cross-agent-coordination-enhancement/design.md` (Section 2.1)
- **Status Transitions**: `orchestrix-core/data/story-status-transitions.yaml`

## Support

For questions or issues with the decision system:

1. Review this README
2. Check the design document
3. Examine example decision files
4. Test with make-decision.md task
