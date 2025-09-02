# Agent Capabilities Registry

## Overview
Comprehensive registry of all Orchestrix agents, their capabilities, tools, and optimal use cases for intelligent handoff decisions.

---

## Core Agents

### orchestrix-master
**Role**: Master Orchestrator & Project Coordinator
**Tools**: All tools, full system access
**Primary Capabilities**:
- Project planning and epic creation
- Multi-agent coordination and workflow management
- Strategic decision making and architecture oversight
- Complex problem decomposition
**Optimal For**:
- New project initialization
- Complex multi-phase planning
- Cross-functional coordination needs
- Strategic architecture decisions
**Handoff Triggers**: 
- User requests project-level planning
- Multi-agent coordination required
- Strategic architecture decisions needed

### orchestrix-orchestrator  
**Role**: Workflow Orchestrator & Task Coordinator
**Tools**: Read, Edit, Write, Bash, WebSearch
**Primary Capabilities**:
- Task sequencing and workflow optimization
- Dependency management between tasks
- Progress tracking and status reporting
- Resource allocation coordination
**Optimal For**:
- Complex workflow coordination
- Task dependency resolution
- Progress monitoring and reporting
- Resource conflict resolution
**Handoff Triggers**:
- Multiple interdependent tasks
- Workflow optimization needed
- Progress tracking required

### analyst
**Role**: Business Analyst & Requirements Specialist  
**Tools**: Read, Edit, Write, WebSearch, context7
**Primary Capabilities**:
- Requirements gathering and analysis
- Business process documentation
- Stakeholder interview facilitation
- Competitive analysis and market research
**Optimal For**:
- Requirements elicitation
- Business process analysis
- Market research tasks
- Stakeholder communication
**Handoff Triggers**:
- User needs requirements gathering
- Business analysis required
- Market research requested

### architect
**Role**: Technical Architect & System Designer
**Tools**: Read, Edit, Write, WebSearch, context7
**Primary Capabilities**:
- System architecture design
- Technology stack recommendations
- Integration pattern design
- Performance and scalability planning
**Optimal For**:
- Architecture design decisions
- Technology selection
- System integration planning
- Performance optimization design
**Handoff Triggers**:
- Architecture design needed
- Technology decisions required
- System integration planning

### dev
**Role**: Full Stack Developer & Implementation Specialist
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch, context7
**Primary Capabilities**:
- Code implementation and development
- Debugging and troubleshooting
- Code refactoring and optimization
- Development best practices application
**Optimal For**:
- Code implementation tasks
- Bug fixing and debugging
- Code refactoring
- Development work execution
**Handoff Triggers**:
- Code implementation needed
- Debugging required
- Development tasks assigned

### qa
**Role**: Quality Assurance & Testing Specialist
**Tools**: Read, Edit, Write, Bash, WebSearch
**Primary Capabilities**:
- Test planning and strategy
- Test case creation and execution
- Quality validation and verification
- Bug reporting and tracking
**Optimal For**:
- Testing strategy development
- Quality validation
- Test automation setup
- Bug verification
**Handoff Triggers**:
- Testing required
- Quality validation needed
- Bug verification requested

### pm
**Role**: Project Manager & Delivery Coordinator
**Tools**: Read, Edit, Write, WebSearch
**Primary Capabilities**:
- Project planning and scheduling
- Risk management and mitigation
- Stakeholder communication
- Delivery coordination
**Optimal For**:
- Project management tasks
- Timeline planning
- Risk assessment
- Stakeholder coordination
**Handoff Triggers**:
- Project management needed
- Timeline planning required
- Risk assessment requested

### po
**Role**: Product Owner & Requirements Manager
**Tools**: Read, Edit, Write, WebSearch, context7
**Primary Capabilities**:
- Product requirement definition
- User story creation and management
- Acceptance criteria specification
- Product backlog management
**Optimal For**:
- Product requirement definition
- User story creation
- Backlog management
- Product planning
**Handoff Triggers**:
- Product requirements needed
- User stories required
- Backlog management tasks

### sm
**Role**: Scrum Master & Process Facilitator
**Tools**: Read, Edit, Write, WebSearch
**Primary Capabilities**:
- Agile process facilitation
- Team coaching and mentoring
- Impediment removal
- Sprint planning and retrospectives
**Optimal For**:
- Process improvement
- Team facilitation
- Agile coaching
- Sprint management
**Handoff Triggers**:
- Process issues identified
- Team facilitation needed
- Agile coaching required

### ux-expert
**Role**: UX Designer & User Experience Specialist
**Tools**: Read, Edit, Write, WebSearch, context7
**Primary Capabilities**:
- User experience design
- Interface design and prototyping
- User research and testing
- Design system development
**Optimal For**:
- UX/UI design tasks
- User research
- Design system work
- Interface optimization
**Handoff Triggers**:
- Design work required
- UX research needed
- Interface design tasks

---

## Handoff Decision Matrix

### By Request Type
| Request Type | Primary Agent | Secondary Options | Avoid |
|--------------|---------------|-------------------|-------|
| Architecture Design | architect | orchestrix-master | dev, qa |
| Code Implementation | dev | architect (for complex) | pm, sm |
| Testing Strategy | qa | dev (for unit tests) | po, ux-expert |
| Requirements Gathering | analyst | po, pm | dev, qa |
| Project Planning | pm | orchestrix-master | dev, qa |
| User Stories | po | analyst, pm | dev, architect |
| Process Issues | sm | pm, orchestrix-orchestrator | dev, qa |
| Design Tasks | ux-expert | architect (for technical) | pm, sm |

### By Complexity Level
- **Simple Tasks**: Direct specialist (dev, qa, ux-expert)
- **Medium Complexity**: Specialist + coordinator (pm, sm)
- **High Complexity**: orchestrix-master or orchestrix-orchestrator
- **Cross-functional**: orchestrix-master with specialist support

### By Project Phase
- **Initiation**: orchestrix-master → analyst → architect
- **Planning**: pm → po → architect → orchestrix-orchestrator
- **Development**: dev → qa → ux-expert
- **Testing**: qa → dev → pm
- **Deployment**: dev → pm → orchestrix-orchestrator
- **Maintenance**: dev → qa → architect (as needed)

---

## Agent Interaction Patterns

### Common Handoff Chains
1. **New Feature**: analyst → po → architect → dev → qa → pm
2. **Bug Fix**: qa → dev → qa → pm
3. **Architecture Change**: architect → dev → qa → orchestrix-master
4. **Process Improvement**: sm → pm → orchestrix-orchestrator
5. **User Research**: ux-expert → analyst → po → architect

### Collaboration Indicators
- **High Synergy**: architect ↔ dev, po ↔ analyst, pm ↔ sm
- **Sequential Flow**: analyst → po → architect → dev → qa
- **Parallel Work**: dev + ux-expert, pm + sm
- **Review Cycles**: dev → qa → dev, architect → dev → architect

---

## Update Guidelines
- Review and update agent capabilities quarterly
- Add new agents with full capability profile
- Update handoff triggers based on real usage patterns
- Maintain accuracy of tool lists and permissions
