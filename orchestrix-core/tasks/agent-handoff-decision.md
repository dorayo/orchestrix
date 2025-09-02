# Agent Handoff Decision

## Task Overview
Execute standardized decision-making process to determine when and how to handoff tasks to other agents within the Orchestrix ecosystem.

## Prerequisites
- Access to agent-capabilities-registry.md
- Understanding of current request scope and requirements
- Knowledge of own agent limitations and write-scope boundaries

## Input Requirements
- Current user request or task
- Assessment of own capabilities vs requirements
- Context of conversation/project state

## Decision Flow

### Step 1: Scope Assessment
1. **Analyze Current Request**
   - Identify primary task type (development, analysis, design, etc.)
   - Determine required tools and permissions
   - Assess complexity and domain expertise needed

2. **Check Own Capabilities**
   - Compare against own write-scope.allowed vs write-scope.forbidden
   - Evaluate if request falls within persona.role boundaries
   - Assess if required tools are available

### Step 2: Handoff Trigger Evaluation
Handoff is required if ANY of the following conditions are met:

- **Out-of-Scope**: Request requires actions in write-scope.forbidden
- **Tool Limitations**: Required tools not available to current agent
- **Domain Expertise**: Request requires specialized knowledge outside persona.role
- **Activation Blocks**: Current request triggers blocked_if conditions
- **Completion Gates**: Current task has reached natural completion point

### Step 3: Target Agent Selection
1. **Load Agent Registry**: Reference agent-capabilities-registry.md
2. **Score Potential Agents**: For each candidate agent, calculate:
   - Capability Match Score (0-1): How well agent's tools/scope match requirements
   - Domain Expertise Score (0-1): Relevance of agent's persona.role to request
   - Context Continuity Score (0-1): Agent's ability to maintain project context
   - **Total Score** = (Capability × 0.4) + (Domain × 0.4) + (Context × 0.2)

3. **Apply Confidence Threshold**: Only suggest agents with Total Score >= handoff.confidence_threshold

### Step 4: Required Inputs Preparation
Identify what information the target agent will need:
- Current project context
- Specific requirements from user request  
- Relevant files or documentation references
- Previous decisions or constraints
- Expected deliverables format

## Output Format
```yaml
handoff_suggestion:
  suggested_agent_id: "<highest-scoring-agent-id>"
  reason: "<one sentence explaining why this agent is better suited>"
  confidence: <total_score_0_to_1>
  required_inputs: ["<input1>", "<input2>", "<input3>"]
  handoff_context: "<brief context for target agent>"
```

## Quality Gates
- [ ] Handoff reason clearly explains capability gap
- [ ] Confidence score reflects actual agent capability match
- [ ] Required inputs are specific and actionable
- [ ] Target agent has confirmed capability for the request type

## Fallback Strategy
If no agent scores above confidence threshold:
1. Request clarification from user to narrow scope
2. Suggest breaking request into smaller, manageable parts
3. Escalate to orchestrix-master for complex multi-agent coordination

## Success Criteria
- Smooth transition with minimal context loss
- Target agent can immediately begin productive work
- User request is fully addressed by appropriate specialist
- No unnecessary handoff loops or agent confusion
