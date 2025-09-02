# Agent Capabilities Registry

## Overview
Comprehensive registry of all Orchestrix agents, their capabilities, tools, and optimal use cases for intelligent handoff decisions.

---

## Core Agents

### orchestrix-master
**Name**: Orchestrix Master
**Role**: Master Task Executor & Orchestrix Expert
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch
**Primary Capabilities**:
- Execute any Orchestrix resource directly without persona transformation
- Universal task execution across all domains
- Knowledge base management (KB mode toggle)
- Direct workflow and template execution
- Document creation and sharding
**Optimal For**:
- One-off tasks across domains without switching personas
- Running any Orchestrix resource directly
- Knowledge base queries and interactions
- Complex multi-resource workflows
- Universal task execution
**Handoff Triggers**: 
- User needs universal task execution
- Cross-domain work without persona switching
- Knowledge base access required
- Complex resource orchestration needed

### orchestrix-orchestrator  
**Name**: Orchestrix Orchestrator
**Role**: Master Orchestrator & Orchestrix Expert
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch
**Primary Capabilities**:
- Transform into any specialized agent on demand
- Multi-agent workflow coordination and automation
- Workflow guidance and selection assistance
- Agent transformation and context management
- Automated development cycles (SM→Architect→Dev→QA)
- Epic-level automation and quality monitoring
**Optimal For**:
- Multi-agent coordination and transformation
- Complex workflow automation
- Agent selection and guidance
- Automated development cycles
- Epic-level project management
- Context bridging between agents
**Handoff Triggers**:
- Multiple agents coordination needed
- Workflow automation required
- Agent transformation guidance needed
- Epic-level automation requested

### analyst
**Name**: Mary
**Role**: Insightful Analyst & Strategic Ideation Partner
**Tools**: Read, Write, Bash, WebSearch
**Primary Capabilities**:
- Market research and competitive analysis
- Brainstorming session facilitation
- Strategic analysis and insights generation
- Project briefing and documentation
- Brownfield project discovery and documentation
- Research prompt creation and planning
**Optimal For**:
- Market research and competitive analysis
- Brainstorming and ideation sessions
- Project briefs and strategic analysis
- Existing project documentation (brownfield)
- Research planning and prompt creation
**Handoff Triggers**:
- Market research or competitive analysis needed
- Brainstorming session required
- Project brief or strategic analysis requested
- Existing project needs documentation

### architect
**Name**: Weizhen
**Role**: Holistic System Architect & Full-Stack Technical Leader
**Tools**: Read, Edit, Write, Bash, WebSearch
**Primary Capabilities**:
- Complete systems architecture design and documentation
- Cross-stack optimization and technical leadership
- Technology selection with pragmatic choices and justification
- API design and infrastructure planning
- **Story technical accuracy review (≥7/10 score, zero critical issues)**
- Architecture-story alignment validation and approval
- Project architecture documentation and updates
**Optimal For**:
- System architecture design and documentation
- Technology evaluation and selection
- **Story technical accuracy review and approval**
- Infrastructure planning and technical validation
- Architecture-requirements alignment verification
**Handoff Triggers**:
- System architecture design needed (Phase 1)
- Technology evaluation and selection required
- **Story technical review needed (development iteration)**
- Architecture-story alignment validation required
- Technical accuracy scoring below 7/10 threshold

### dev
**Name**: Jiangtao
**Role**: Expert Senior Software Engineer & Implementation Specialist
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch, context7
**Primary Capabilities**:
- Story-driven development with comprehensive testing
- Code implementation with strict quality standards
- Database migration management
- Context validation and standards enforcement
- Test-driven development and validation
- Precise story task execution
**Optimal For**:
- Story implementation and development
- Code implementation with testing
- Database migrations and schema changes
- Development standards enforcement
- Test execution and validation
**Handoff Triggers**:
- Story development tasks assigned
- Code implementation needed with testing
- Database migrations required
- Development standards validation needed

### qa
**Name**: James
**Role**: Senior Developer & Test Architect
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch, context7
**Primary Capabilities**:
- Senior code review and mentoring
- Comprehensive test strategy and architecture
- Quality assurance and refactoring guidance
- Multi-level testing (unit/integration/e2e/performance/security)
- Story validation and comprehensive QA workflows
- Code quality enforcement and best practices
**Optimal For**:
- Senior code review and mentoring
- Comprehensive testing strategy development
- Story validation and QA workflows
- Code quality assurance and refactoring
- Multi-level test planning and execution
**Handoff Triggers**:
- Senior code review needed
- Comprehensive testing strategy required
- Story validation and QA workflows needed
- Code quality issues identified

### pm
**Name**: Liangning
**Role**: Investigative Product Strategist & Market-Savvy PM
**Tools**: Read, Edit, MultiEdit, Write, WebSearch
**Primary Capabilities**:
- PRD creation and product documentation
- Product strategy and feature prioritization
- Market research and stakeholder communication
- Brownfield project management (epics and stories)
- Course correction and process improvement
- Product roadmap planning
**Optimal For**:
- PRD creation and product documentation
- Product strategy and feature prioritization
- Market-driven product decisions
- Brownfield project management
- Product roadmap and milestone planning
**Handoff Triggers**:
- PRD or product documentation needed
- Product strategy decisions required
- Market research for product planning
- Brownfield project management needed

### po
**Name**: Jianghuan
**Role**: Technical Product Owner & Process Steward
**Tools**: Read, Edit, MultiEdit, Write, Bash, WebSearch
**Primary Capabilities**:
- **Cross-document consistency validation and quality assurance**
- **Document sharding for IDE development preparation**
- Backlog management and story refinement
- Acceptance criteria specification and validation
- Sprint planning and prioritization decisions
- Epic creation and story validation with quality gates
- Course correction and process stewardship
**Optimal For**:
- **Cross-document consistency validation (PRD, Architecture, UI specs)**
- **Document sharding and IDE development preparation**
- Quality assurance and process stewardship
- Backlog management and story refinement
- Epic and story creation/validation
**Handoff Triggers**:
- **Cross-document validation needed (Phase 2 quality gate)**
- **Document sharding for IDE development required**
- Backlog refinement and story acceptance criteria needed
- Process improvement and quality control required
- Epic planning and validation needed

### sm
**Name**: Bob
**Role**: Technical Scrum Master - Story Preparation Specialist
**Tools**: Read, Edit, MultiEdit, Write
**Primary Capabilities**:
- Story creation with mandatory technical extraction (≥80% completion rate)
- Story quality validation with scoring (≥7/10 pass threshold)
- Technical extraction checklist execution and validation
- Epic management and story preparation for AI developers
- Frontend user confirmation processes
- Course correction and iterative improvement
**Optimal For**:
- User story creation with quality gates
- Technical extraction and validation (≥80% completion)
- Story quality assurance (≥7/10 scoring)
- Epic management and planning
- Preparing detailed stories for AI developer handoff
**Handoff Triggers**:
- New story creation needed in development iteration
- Technical extraction validation required
- Story quality scoring below 7/10 threshold
- Epic planning and story preparation required

### ux-expert
**Name**: Jingwen
**Role**: User Experience Designer & UI Specialist
**Tools**: Read, Write, WebSearch
**Primary Capabilities**:
- UI/UX design and wireframing
- Front-end specifications and prototypes
- User experience optimization and accessibility
- AI-driven UI prompt generation
- User research synthesis and interaction design
- Design system development
**Optimal For**:
- UI/UX design and wireframing
- Front-end specifications and prototypes
- User experience optimization
- AI frontend prompt generation
- Accessibility and design system work
**Handoff Triggers**:
- UI/UX design work required
- Front-end specifications needed
- AI frontend prompt generation requested
- Accessibility optimization needed

---

## Handoff Decision Matrix

### By Request Type
| Request Type | Primary Agent | Secondary Options | Avoid |
|--------------|---------------|-------------------|-------|
| Architecture Design | architect | orchestrix-master | dev, qa |
| Story Development | dev | sm (for story prep) | pm, analyst |
| Code Review & QA | qa | dev (for fixes) | pm, po |
| Market Research | analyst | pm (for product focus) | dev, qa |
| PRD Creation | pm | analyst (for research) | dev, qa |
| Story Creation | sm | po (for refinement) | dev, architect |
| Backlog Management | po | sm (for story prep) | dev, architect |
| UI/UX Design | ux-expert | architect (for technical) | pm, sm |
| Multi-Agent Coordination | orchestrix-orchestrator | orchestrix-master | specialist agents |
| Universal Task Execution | orchestrix-master | orchestrix-orchestrator | specialist agents |

### By Complexity Level
- **Simple Tasks**: Direct specialist (dev, qa, ux-expert)
- **Medium Complexity**: Specialist + coordinator (pm, sm)
- **High Complexity**: orchestrix-master or orchestrix-orchestrator
- **Cross-functional**: orchestrix-master with specialist support

### By Project Phase (Orchestrix Standard Workflow)
- **Phase 1 - Requirements Analysis & Planning (Web UI)**:
  - analyst → pm → ux-expert → architect → pm (update PRD)
- **Phase 2 - Quality Assurance & Validation (Web UI)**:
  - po (cross-document validation) → po (document sharding for IDE)
- **Phase 3 - Development Iteration Loop (IDE)**:
  - sm (story creation + quality gates) → architect (technical review ≥7/10) → dev (implementation) → qa (code review) → [repeat until complete]
- **Special Workflows**:
  - **Multi-agent coordination**: orchestrix-orchestrator
  - **Universal task execution**: orchestrix-master
  - **Complex orchestration**: orchestrix-orchestrator → orchestrix-master

---

## Agent Interaction Patterns

### Common Handoff Chains
1. **Standard Orchestrix Workflow**: analyst → pm → ux-expert → architect → pm → po → [development iteration loop]
2. **Development Iteration Loop**: sm (≥80% + ≥7/10) → architect (≥7/10 + 0 critical) → dev → qa → [repeat]
3. **Story Quality Gate Failure**: sm → sm (revision) → architect (re-review)
4. **Cross-Document Validation**: po → [back to relevant agent for fixes] → po
5. **Bug Fix Cycle**: qa → dev → qa
6. **Architecture Change**: architect → dev → qa → orchestrix-master (if complex)
7. **Market Research Deep Dive**: analyst → pm → po
8. **Multi-Agent Coordination**: orchestrix-orchestrator → specialist agents → orchestrix-orchestrator

### Collaboration Indicators
- **High Synergy**: architect ↔ dev, po ↔ sm, pm ↔ analyst, qa ↔ dev
- **Standard Sequential Flow**: analyst → pm → ux-expert → architect → pm → po
- **Development Iteration Flow**: sm → architect → dev → qa
- **Quality Gate Partnerships**: sm ↔ architect (story quality), po ↔ all (validation)
- **Parallel Work**: dev + ux-expert (technical integration), pm + analyst (requirements)
- **Review Cycles**: dev → qa → dev, sm → architect → sm, po → [agent] → po
- **Coordination Hubs**: orchestrix-orchestrator ↔ all agents, orchestrix-master ↔ all resources

---

## Update Guidelines
- Review and update agent capabilities quarterly
- Add new agents with full capability profile
- Update handoff triggers based on real usage patterns
- Maintain accuracy of tool lists and permissions
