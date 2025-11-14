# Orchestrator Automation Engine

## 🎯 PURPOSE

This task defines the automation capabilities for orchestrix-orchestrator, enabling intelligent workflow coordination and agent collaboration in Claude Code environments.

## 🤖 AUTOMATION COMMANDS

### *auto-workflow
**Purpose**: Execute complete workflow automatically using auto-tasks  
**Usage**: `*auto-workflow [workflow_name]`

**Execution Logic**:
1. **Intent Analysis**: Determine workflow from user input or present options
2. **Workflow Loading**: Load specified workflow YAML definition  
3. **Agent Sequence**: Execute each workflow step using appropriate -auto tasks
4. **Quality Gates**: Apply PO validation at key transition points
5. **Progress Tracking**: Monitor and report workflow execution status
6. **Context Management**: Handle automatic context transfer between agents

**Example Workflow Automation**:
```yaml
# Auto-execute greenfield-fullstack workflow
greenfield_automation:
  - analyst: execute create-doc-auto.md with project-brief-tmpl.yaml
  - pm: execute create-doc-auto.md with prd-tmpl.yaml  
  - ux-expert: execute create-doc-auto.md with front-end-spec-tmpl.yaml
  - architect: execute create-doc-auto.md with fullstack-architecture-tmpl.yaml
  - po: execute quality validation and shard-doc-auto.md
  - transition: enter development phase with dev-cycle automation
```

---

### *auto-sequence
**Purpose**: Run predefined agent sequence with minimal interaction  
**Usage**: `*auto-sequence [sequence_name]`

**Available Sequences**:
- `planning-sequence`: analyst → pm → ux-expert → architect → po
- `development-sequence`: sm → architect → dev → qa (repeating cycle)
- `document-creation`: analyst/pm/architect + create-doc-auto
- `story-pipeline`: sm → architect → dev → qa for single story

**Execution Features**:
- Automatic agent switching using Claude Code Task tool
- Context preservation between agents
- Quality validation at each step
- Error handling and recovery
- Progress reporting

---

### *smart-intent
**Purpose**: Analyze user intent and suggest automated execution path  
**Usage**: `*smart-intent` (analyzes user's previous request)

**Intent Recognition Patterns**:
```yaml
intent_mapping:
  "开发新项目": greenfield-fullstack workflow
  "创建项目文档": analyst + create-doc-auto 
  "实现功能": development-sequence (SM→Architect→Dev→QA)
  "代码审查": qa + review-code-auto
  "架构设计": architect + create-doc-auto with architecture templates
  "项目规划": planning-sequence automation
```

**Smart Suggestions**:
- Analyze user input context and project state
- Recommend most appropriate automation approach
- Provide confidence level and alternative options
- Explain reasoning and expected outcomes

---

### *dev-cycle
**Purpose**: Automatically execute SM→Architect→Dev→QA development cycle  
**Usage**: `*dev-cycle [story_id]` or `*dev-cycle` (next story)

**Cycle Execution**:
1. **SM Phase**: execute create-story-auto.md → Draft story
2. **Architect Phase**: execute architect-review-story.md → Approved/Revision
3. **Dev Phase**: execute implement-story-auto.md → Ready for Review
4. **QA Phase**: execute review-code-auto.md → Done/Review
5. **Cycle Management**: Continue with next story or Epic completion

**Quality Controls**:
- Each phase must complete successfully before next
- Automatic quality validation at each transition
- Error handling and retry mechanisms
- Progress tracking and reporting

---

### *epic-automation
**Purpose**: Manage Epic-level automated development workflow  
**Usage**: `*epic-automation [epic_number]`

**Epic Management**:
- Track all stories within an Epic
- Coordinate development cycle execution for each story
- Monitor Epic completion progress
- Handle Epic transitions and dependencies
- Generate Epic completion reports

**Automation Features**:
- Automatic story prioritization and sequencing
- Parallel development coordination (where safe)
- Quality assurance across entire Epic
- Stakeholder reporting and visibility

---

### *context-bridge
**Purpose**: Handle automated context transfer between agents  
**Usage**: Internal command used by other automation

**Context Management**:
- Automatic file-based context sharing (docs/*, core-config.yaml)
- Agent-specific context preparation
- Quality validation of context completeness
- Context integrity verification

---

### *quality-monitor
**Purpose**: Monitor and enforce quality standards across automation  
**Usage**: `*quality-monitor` (shows current quality status)

**Quality Tracking**:
- Template compliance monitoring
- Checklist execution verification  
- Architecture standard adherence
- Test integrity preservation
- Documentation completeness

---

## 🔧 AUTOMATION INTELLIGENCE

### Intent Recognition Engine
```yaml
# Smart user intent analysis
intent_analysis:
  context_factors:
    - Current project state (existing docs, stories, code)
    - User request patterns and keywords  
    - Project type and complexity
    - Available time and resources
    
  confidence_scoring:
    - High (>80%): Auto-suggest with explanation
    - Medium (60-80%): Present options with reasoning
    - Low (<60%): Ask clarifying questions
    
  learning_capability:
    - Track successful automation patterns
    - Refine intent recognition based on outcomes
    - Adapt suggestions to user preferences
```

### Workflow State Management
```yaml
# Comprehensive workflow tracking
state_management:
  current_phase: [planning/transition/development/completion]
  active_agents: List of agents currently involved
  completed_artifacts: Documents and outputs generated
  quality_status: Validation results and compliance scores
  blocking_issues: Problems requiring attention
  next_actions: Recommended next steps
  
automation_coordination:
  agent_queue: Ordered list of agents to execute
  context_handoffs: Data transfer requirements
  quality_gates: Validation checkpoints
  error_recovery: Fallback procedures
```

### Error Handling & Recovery
```yaml
# Robust automation error management
error_handling:
  agent_failures:
    - Detect execution failures or timeouts
    - Attempt automatic retry with adjusted parameters
    - Escalate to manual intervention after 3 failures
    - Document failure reasons and recovery actions
    
  quality_failures:
    - Identify quality standard violations
    - Block progression until issues resolved
    - Provide specific remediation guidance
    - Track quality improvement over time
    
  context_issues:
    - Detect missing or corrupted context
    - Attempt context reconstruction from available data
    - Request user input for critical missing information
    - Validate context integrity before proceeding
```

---

## 📊 AUTOMATION REPORTING

### Progress Tracking
```markdown
## Automation Status Report

**Workflow**: {{workflow_name}}
**Current Phase**: {{current_phase}}
**Progress**: {{completed_steps}}/{{total_steps}} ({{percentage}}%)
**Quality Score**: {{overall_quality_score}}/10

### Completed Phases
{{auto_generated_completion_list}}

### Current Status
- **Active Agent**: {{current_agent}}
- **Current Task**: {{current_task}}
- **Expected Completion**: {{eta}}
- **Quality Status**: {{quality_indicators}}

### Upcoming Steps
{{next_phase_preview}}

### Issues & Blockers
{{current_issues_list}}
```

### Quality Dashboard
```markdown
## Quality Monitoring Dashboard

### Template Compliance: {{compliance_percentage}}%
- ✅ Documents using correct templates: {{template_compliant_count}}
- ❌ Template violations: {{template_violation_count}}

### Architecture Adherence: {{architecture_score}}/10
- Standards compliance across all generated artifacts
- Pattern consistency verification results
- Technical preference alignment status

### Test Integrity: {{integrity_status}}
- No inappropriate test modifications detected
- Business logic preservation verified
- Test coverage adequacy confirmed

### Process Efficiency
- Average automation time per story: {{avg_story_time}}
- Quality gate pass rate: {{pass_rate}}%
- Manual intervention required: {{intervention_rate}}%
```

---

## 🎯 SUCCESS CRITERIA

### Automation Effectiveness
- ✅ Workflows execute end-to-end without manual intervention
- ✅ Quality standards maintained at same level as manual processes
- ✅ Context properly preserved and transferred between agents
- ✅ Error handling gracefully manages edge cases
- ✅ Progress tracking provides clear visibility

### User Experience
- ✅ Intent recognition accurately understands user needs
- ✅ Automation suggestions are relevant and helpful
- ✅ Manual override options available when needed
- ✅ Clear reporting on automation status and results
- ✅ Reduced cognitive load for complex workflow management

### Quality Assurance
- ✅ No compromise in output quality compared to manual execution
- ✅ Template and checklist compliance maintained
- ✅ Architecture standards consistently enforced
- ✅ Test integrity preserved throughout automation
- ✅ Documentation standards upheld across all artifacts

**Implementation Note**: This automation engine transforms orchestrix-orchestrator from a coordination interface into an intelligent automation system that can execute complete workflows with minimal user intervention while maintaining all quality standards.