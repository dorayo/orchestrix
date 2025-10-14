# Implement Story

## 🤖 EXECUTION MODE (Command-Line & SubAgent)

**Mission**: Implement approved story with all tasks, subtasks, and tests, fully automated

### Immediate Action Protocol:
1. Load story (status: Approved)
2. Load standards (coding, tech stack, structure)
3. Implement tasks sequentially
4. Write comprehensive tests
5. Validate (tests, linting)
6. Update story (tasks, File List, notes)
7. Execute DoD checklist, set status 'Ready for Review'

### Non-Negotiable Requirements:
- ✅ Only work on status: 'Approved'
- ✅ Implement ALL tasks/subtasks in order
- ✅ Write tests for all functionality
- ✅ Follow coding standards and architecture
- ✅ Never modify test requirements
- ✅ Update only authorized story sections
- ✅ Execute complete DoD checklist

### Halt Conditions:
- ❌ Status not 'Approved'/'TestDesignComplete' → Report, halt
- ❌ Missing critical sections → Report, halt
- ❌ Dependencies unavailable → Ask user approval
- ❌ 3 consecutive failures → Escalate to user
- ❌ Tests fail → Fix implementation, never weaken tests

---

## 🎯 AUTOMATED IMPLEMENTATION ENGINE

### Story Context Loading:
```yaml
# Comprehensive story and context loading
story_loading:
  story_validation:
    - Verify status: 'Approved'/'TestDesignComplete'
    - Confirm required sections present
    - Extract: statement, AC, tasks/subtasks
    - Load Dev Notes
    
  standards_loading:
    - coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
    - Additional docs per Dev Notes
    
  context_assembly:
    - Tech Preferences from Dev Notes
    - Testing Standards, integrity rules
    - Previous story notes (if referenced)
    - File locations, naming conventions
    
  qa_test_design_loading:
    - Check Story.qa_test_design_metadata exists
    - If test_design_document exists:
      - Read test design doc
      - Extract: level (Simple/Standard/Comprehensive), scenarios, priorities (P0/P1/P2), levels (Unit/Integration/E2E)
      - Record test strategy summary
    - Else: Use standard TDD per testing-strategy.md
    
  enhanced_validation:
    - dev-database-migration.md - Handle schema changes with safety
```

### Dev Log Initialization:
```yaml
# Dev Log creation and context recovery
dev_log_setup:
  step_1_construct_path:
    - Read CONFIG_PATH.dev.devLogLocation from core-config.yaml
    - Construct: {devLogLocation}/{story-id}-dev-log.md
    
  step_2_check_existence:
    - Check if Dev Log exists at path
    
  step_3a_create_new_log:
    condition: Dev Log not found
    actions:
      - Read template: orchestrix-core/templates/dev-log-tmpl.md
      - Replace placeholders: storyId, storyTitle, startTimestamp, agentModel, smDesignPath, testDesignLevel
          {{p0Count}}: Initialize as "TBD" or 0
          {{p1Count}}: Initialize as "TBD" or 0
          {{p2Count}}: Initialize as "TBD" or 0
          {{priorityAreas}}: Initialize as "To be determined from test design"
          {{riskCoverage}}: Initialize as "To be determined from test design"
      - Write populated template to Dev Log path
      - Log to console: "✓ Created new Dev Log at {path}"
      - Log to Story Change Log: "Dev Log initialized at {path}"
    
  step_3b_resume_from_existing:
    condition: Dev Log found
    actions:
      - Read Dev Log, parse Resumption Guide
      - Extract: current_phase, current_subtask, next_steps, key_context, recent_decisions, open_issues
      - Display resumption summary to user
      - Continue from current subtask (don't restart)
    
  step_4_check_test_design:
    - Check if Story.qa_test_design_metadata section exists
    - If exists, check if test_design_document field has a value
    - Extract test design document path
    - Example: qa/assessments/EPIC-001.STORY-003-test-design-2024-01-15.md
    
  step_5_load_test_strategy:
    if_test_design_exists:
      - Read test design doc
      - Extract: level, P0/P1/P2 counts, priority areas, risk coverage, scenarios
      - Update Dev Log Test Strategy Summary
    else:
      - Use standard TDD per testing-strategy.md
```

### Context Recovery (Resumption Scenario):
```yaml
# Resume work after interruption
context_recovery:
  trigger: Dev Log exists (step 3b)
  
  process:
    step_1_read_dev_log:
      - Read Dev Log: {devLogLocation}/{story-id}-dev-log.md
    
    step_2_parse_resumption_guide:
      - Parse "## Resumption Guide" section
      - Extract: current_phase, current_subtask, next_steps, key_context, recent_decisions, open_issues
    
    step_3_extract_current_state:
      - Extract: current_phase (1-4), current_subtask, progress_percentage
      - Extract: next_steps, key_context, recent_decisions, open_issues
    
    step_5_continue_implementation:
      - Continue from current subtask (don't restart)
      - Use key_context, follow next_steps, address open_issues
      - Validate: current_subtask exists, previous subtasks marked [x], files/tests exist
  
  notes: Dev Log preserves all work, enables seamless resumption
```

### Implementation Sequence:
```yaml
# Systematic task execution with quality gates
implementation_sequence:
  task_processing:
    1. Read next uncompleted task from Tasks/Subtasks list
    2. Identify which Phase (1-4) the task belongs to
    3. Apply phase-specific implementation guidance (see below)
    4. Identify acceptance criteria references (AC: numbers)
    5. Plan implementation approach based on Dev Notes guidance
    6. Implement functionality following coding standards and phase guidance
    7. Write comprehensive tests (unit, integration as specified)
    8. Append subtask log entry to Dev Log with:
       - Current timestamp (ISO 8601 format)
       - Subtask name and description
       - Implementation details (what was built, how it works)
       - Technical decisions made with rationale
       - Issues encountered with resolutions
       - Test results (tests written, pass/fail status)
    9. Execute tests and validation checks
    10. Only if ALL pass → mark task as [x] completed
    11. Update Resumption Guide in Dev Log with:
        - Current phase and subtask number
        - Next steps (what subtask comes next)
        - Key context for resumption (critical state information)
    12. Update File List with new/modified/deleted files
    13. Check if all tasks in current phase are complete:
        - If phase complete → Append Phase Summary to Dev Log with:
          - Phase achievements (what was accomplished)
          - Tests status (count of tests, all passing)
          - Readiness for next phase (confirmation phase objectives met)
    14. Repeat for all tasks and subtasks
    
  phase_specific_guidance:
    phase_1_contract_definition:
      name: "Phase 1: Contract Definition & Test Setup"
      objectives:
        - Read SM Dev Notes business contracts
        - Create technical contracts (TypeScript interfaces, Zod schemas, API types)
        - Write contract validation tests (TDD RED phase)
        - Follow QA test design priorities (P0 → P1 → P2) if test design exists
        - Record contract definitions and design decisions in Dev Log
      implementation_steps:
        - Extract business contracts from SM Dev Notes
        - Define TypeScript interfaces for all data models
        - Create Zod schemas for runtime validation
        - Define API request/response types
        - Write contract validation tests (expect failures initially)
        - If test design exists, prioritize P0 tests first
        - Append contract definitions to Dev Log with rationale
        - Record any design decisions in Dev Log
      success_criteria:
        - All technical contracts defined
        - Contract tests written (RED phase - failing is expected)
        - Dev Log updated with contract definitions
    
    phase_2_walking_skeleton:
      objectives: Minimal API/UI with mock data, wire end-to-end, contract tests pass (GREEN)
      steps: Create minimal handlers, mock responses, basic UI, wire components, verify flow
      success: Endpoints + UI wired, contract tests pass, Dev Log updated
    
    phase_3_business_logic:
      objectives: TDD cycle (RED→GREEN→REFACTOR), P0→P1→P2 priority
      steps: Write test (RED), implement (GREEN), refactor. Replace mocks, add state/validation
      success: All P0/P1 tests pass, P2 as time permits, business logic complete
    
    phase_4_integration_qa:
      objectives: Integration tests, edge cases, performance, validate all AC
      steps: Write/run integration tests, test interactions/errors/boundaries, optimize, regression
      success: All tests pass, edge cases handled, performance optimized, AC verified
  
  quality_validation:
    - Code follows coding-standards.md patterns
    - File locations match source-tree.md
    - Testing follows testing-strategy.md requirements
    - All functionality meets acceptance criteria
    - No test requirements modified inappropriately
    - Phase-specific objectives achieved
```

### Test Integrity Protection System:
```yaml
# Absolute protection of test requirements
test_integrity:
  core_principles:
    - Tests = requirements (AUTHORITATIVE)
    - NEVER modify test expectations/assertions/AC
    - Tests fail → fix IMPLEMENTATION, never weaken tests
    - Follow QA test design priorities/levels if exists
    - P0 tests MANDATORY, deviations documented
    
  test_types:
    requirement_tests: IMMUTABLE (business logic, AC, contracts, data integrity)
    implementation_tests: ADJUSTABLE with justification (performance, structure, mocks)
  
  test_design_compliance:
    if_test_design_exists:
      1. Load test design, extract scenarios/priorities/levels
      2. Phase 1: Write P0 contract tests
      3. Phase 3: Follow P0→P1→P2 order
      4. Match specified test levels (Unit/Integration/E2E)
      5. Document deviations in Dev Log
      6. Verify all P0 tests implemented before completion
```

---

## 🔧 EXECUTION LOGIC

### Task Implementation Process:
```yaml
# Detailed implementation methodology
task_execution:
  planning_phase:
    - Parse task description and subtasks
    - Identify linked acceptance criteria
    - Review Dev Notes for specific guidance
    - Plan file structure and component approach
    
  implementation_phase:
    - Create/modify files per source-tree.md
    - Follow naming conventions from coding-standards.md
    - Implement functionality per Technical Preferences Summary
    - Apply patterns specified in architecture documents
    
  testing_phase:
    - Write unit tests per testing-strategy.md
    - Create integration tests if specified
    - Follow test file naming and location conventions
    - Ensure test coverage for all acceptance criteria
    
  validation_phase:
    - Execute all tests (unit, integration, regression)
    - Run linting and code quality checks
    - Detect and execute database migrations (dev-database-migration.md)
    - Verify acceptance criteria fulfillment
    - Confirm no test requirements were weakened
```

### Story File Update Management:
```yaml
# Precise story file section updates
authorized_updates:
  tasks_subtasks:
    - Mark completed tasks with [x]
    - Never modify task descriptions or requirements
    - Update only checkbox status
    
  dev_agent_record:
    agent_model: Record AI model and version used
    implementation_summary: High-level summary (3-5 sentences, high-level only)
    file_list: Complete list of created/modified/deleted files
    dev_log_reference: Link to Dev Log file (docs/dev/logs/{story-id}-dev-log.md)
    open_issues: |
      Record any unresolved feedback or issues (if applicable):
      - QA test design feedback (if dev_feedback was added)
      - Technical debt identified
      - Performance concerns
      - Areas needing future improvement
    
  change_log:
    - Add entry for story completion
    - Include date, version, description, author
    
  status:  
    - Update from 'Approved' to 'Ready for Review' when complete
    
forbidden_modifications:
  - Status (except completion update to 'Review')
  - Story statement  
  - Acceptance Criteria
  - Dev Notes
  - Testing sections
  - QA Test Design Metadata
  - Quality Assessment Metadata
  - Architect Review Metadata
  - Any other sections not explicitly authorized
```

### Quality Gates Execution:
```yaml
# Comprehensive quality validation
quality_gates:
  code_quality:
    - Linting passes without errors
    - Coding standards compliance verified
    - File structure follows project conventions
    - No hardcoded secrets or sensitive data
    
  functional_quality:
    - All tasks marked as completed
    - All acceptance criteria satisfied
    - Comprehensive test coverage
    - All tests pass (unit, integration, regression)
    
  documentation_quality:
    - File List complete and accurate
    - Completion Notes document key decisions
    - Debug references provided if applicable
    - Change Log updated appropriately
    
  story_dod_checklist:
    - Execute story-dod-checklist.md
    - Verify 100% completion rate
    - Document any exceptions or issues
    - Only mark story complete if checklist passes
```

---

## ⚡ VALIDATION CHECKPOINTS

### Pre-Implementation Validation:
```bash
✓ Story status is 'Approved' or 'TestDesignComplete'
✓ All required story sections present
✓ Acceptance Criteria are clear and unambiguous
✓ Dev Notes contain sufficient implementation guidance  
✓ Technical standards documents accessible
✓ Development environment ready
```

### AC Clarity Check:
```yaml
# Check Acceptance Criteria clarity before starting implementation
ac_clarity_check:
  when: Before starting any implementation work
  
  process:
    1. Review all Acceptance Criteria for clarity
    2. Assess AC clarity score (0-10 scale)
    3. If concerns identified, call make-decision task:
       - decision_type: "dev-block-story"
       - context:
           issue_description: "{description of clarity issues}"
           severity: "{LOW|MEDIUM|HIGH|CRITICAL}"
           ac_clarity: {0-10 score}
    4. Apply decision result:
       - If BLOCK: Set Status=Blocked, handoff to SM
       - If ESCALATE: Escalate to Architect
       - If FEEDBACK: Log feedback, continue
       - If CONTINUE: Proceed with implementation
```

### During Implementation Validation:
```bash
✓ Each task implemented per Dev Notes guidance
✓ Code follows coding standards and architecture patterns
✓ Files created in correct locations per project structure
✓ Tests written and passing for implemented functionality
✓ No test requirements modified inappropriately
```

### Post-Implementation Validation:
```bash
✓ All tasks and subtasks marked as completed [x]
✓ Comprehensive tests written and passing
✓ Linting and code quality checks pass
✓ File List updated with all changes
✓ Completion Notes document key decisions
✓ Story DoD checklist executed and passed
✓ Story status updated to 'Ready for Review'
```

---

## 🛠️ ERROR HANDLING & RECOVERY

### Implementation Failure Management:
```yaml
error_handling:
  dependency_issues:
    detection: Required library/service unavailable
    action: Document in Dev Log, ask user approval, update Resumption Guide
    blocking: HALT until user provides guidance
    
  test_failures:
    detection: Tests fail after implementation
    action: Fix IMPLEMENTATION, never modify test requirements
    dev_log_action: Log failure details and resolution attempts
    escalation: After 3 attempts, escalate to user
    
  ac_clarity_issues:
    detection: Acceptance Criteria unclear, ambiguous, or contradictory
    action: Use decision system to determine response
    process: |
      1. Call make-decision task:
         - decision_type: "dev-block-story"
         - context:
             issue_description: "{AC clarity issue description}"
             severity: "{assess severity: LOW|MEDIUM|HIGH|CRITICAL}"
             ac_clarity: {assess clarity score 0-10}
      2. Apply decision result per decision metadata
      3. If BLOCK result:
         - Append issue to Dev Log with AC details
         - Update Resumption Guide with blocking issue
         - Set Story Status = Blocked
         - Add Change Log entry
         - Output handoff message to SM
         - HALT until SM clarifies
      4. If other result: Follow decision guidance
    
  ambiguous_requirements:
    detection: Task description unclear (AC is clear)
    action: Use dev-block-story decision with lower severity
    process: Document in Dev Log, use best judgment per Dev Notes
    
  architecture_conflicts:
    detection: Implementation conflicts with architecture standards
    action: Use decision system to determine escalation need
    process: |
      1. Call make-decision task:
         - decision_type: "dev-escalate-architect"
         - context:
             deviation_reason: "{conflict description}"
             impact: "{LOW|MEDIUM|HIGH|CRITICAL}"
             alternatives: "{alternatives considered}"
             affects_architecture: true
             affects_other_services: {true|false}
             security_implications: {true|false}
      2. Apply decision result:
         - If ESCALATE: Add Dev Escalation to Architect Review Metadata, handoff to Architect
         - If DOCUMENT: Record in Dev Log, proceed with documented approach
  
  technical_decisions:
    detection: Need to deviate from SM's planned approach
    action: Use decision system to determine if escalation needed
    process: |
      1. Call make-decision task:
         - decision_type: "dev-escalate-architect"
         - context:
             deviation_reason: "{reason for deviation}"
             impact: "{assess impact: LOW|MEDIUM|HIGH|CRITICAL}"
             alternatives: "{alternatives considered}"
             affects_architecture: {assess if architectural change}
             affects_other_services: {assess cross-service impact}
             security_implications: {assess security impact}
      2. Apply decision result:
         - If ESCALATE: Add Dev Escalation marker, handoff to Architect, wait for guidance
         - If DOCUMENT: Record decision in Dev Log with full rationale, proceed
      3. Document in Dev Log:
         - Decision made
         - Rationale
         - Alternatives considered
         - Expected impact
    
  deviations_from_sm_design:
    detection: Implementation requires deviation from SM Dev Notes design
    action: Evaluate necessity and impact of deviation
    dev_log_action: Append deviation entry to Dev Log with:
      - Description of deviation
      - Reason for deviation (why necessary)
      - Impact assessment (what changes, what risks)
      - Architect review flag (if deviation is significant)
    escalation: Flag for architect review if deviation affects architecture
  
  qa_test_design_issues:
    detection: QA test design unreasonable or missing important scenarios
    action: Record feedback for QA review
    dev_log_action: |
      1. Append feedback entry to Dev Log with:
         - Test design issue description
         - Missing or unreasonable scenarios
         - Suggested improvements
         - Impact on implementation
    story_action: |
      1. Add or update Story.qa_test_design_metadata.dev_feedback field:
         ```yaml
         dev_feedback:
           - issue: "{description of test design issue}"
             missing_scenarios: "{list of missing test scenarios}"
             suggestions: "{suggested improvements}"
             impact: "{impact on implementation}"
             timestamp: "{current timestamp}"
         ```
      2. Add entry to Story Change Log:
         - Date: Current timestamp
         - Description: "Dev feedback on test design: {brief description}"
         - Author: Dev Agent
    handoff_note: |
      Include in completion handoff to QA:
      "⚠️ Dev Feedback on Test Design
      
      The Dev Agent has provided feedback on the test design.
      Please review Story.qa_test_design_metadata.dev_feedback before QA review."
    blocking: NO - Continue implementation, QA will review feedback
  
  before_halt:
    detection: Any condition requiring HALT (dependency, escalation, blocking issue)
    action: Update Resumption Guide before halting
    dev_log_action: Update Resumption Guide in Dev Log with:
      - Current state (phase, subtask, progress)
      - Blocking issue description
      - Context needed for resumption
      - Recommended next steps
```

### Recovery Procedures:
```yaml
recovery_strategies:
  partial_completion:
    - Save progress on completed tasks
    - Document blocking issue in Completion Notes
    - Leave story status as 'Approved' for continuation
    - Provide clear next steps for resolution
    
  rollback_scenarios:
    - Revert implementation if tests fail repeatedly
    - Restore previous working state
    - Document rollback reason in Completion Notes
    - Request user guidance for alternative approach
    
  escalation_triggers:
    - 3 consecutive implementation failures
    - Unresolvable architecture conflicts
    - Required dependencies unavailable
    - Test requirements appear incorrect (never modify without approval)
```

---

## 📊 COMPLETION REPORT GENERATION

### Dev Log Final Summary:
```yaml
# Before generating Story Implementation Summary, append Final Summary to Dev Log
dev_log_final_summary:
  append_to_dev_log:
    section: "## Final Summary"
    content:
      completion_timestamp: Current timestamp (ISO 8601 format)
      total_duration: Calculate from Dev Log start timestamp to completion
      
      implementation_overview:
        - Write 3-5 sentences high-level summary
        - What was accomplished
        - How it aligns with story objectives
        - Overall approach taken
      
      phases_completed:
        - Total phases completed (1-4)
        - Total subtasks completed across all phases
        - Phase-by-phase completion summary
      
      files_modified:
        - Count of files added
        - Count of files modified
        - Count of files deleted
        - List of key files changed
      
      testing_summary:
        - Total tests written (unit, integration, e2e)
        - Test coverage percentage (if available)
        - All tests passing confirmation
        - Test execution results
      
      key_achievements:
        - Major features implemented
        - Technical challenges solved
        - Quality improvements made
        - Performance optimizations achieved
      
      challenges_overcome:
        - Technical obstacles encountered
        - How they were resolved
        - Lessons learned
      
      technical_debt_identified:
        - Known limitations or shortcuts
        - Areas needing future improvement
        - Refactoring opportunities
        - Performance bottlenecks to address
      
      recommendations_for_future:
        - Suggestions for related features
        - Architecture improvements
        - Testing enhancements
        - Documentation needs
  
  log_action:
    - Log to console: "✓ Dev Log Final Summary written"
    - Log to Story Change Log: "Dev Log completed with Final Summary"
```

### Story Implementation Summary:
```markdown
## Implementation Completion Report

**Story ID**: {{story_id}}
**Implementation Date**: {{completion_date}}
**Developer**: Dev Agent
**Agent Model**: {{ai_model_version}}

### Implementation Summary
- **Total Tasks**: {{total_tasks}}
- **Completed Tasks**: {{completed_tasks}}
- **Tests Written**: {{test_count}}
- **Files Modified**: {{file_count}}
- **Implementation Status**: {{COMPLETE/PARTIAL/BLOCKED}}

### Technical Implementation Details
- **Architecture Compliance**: ✅/❌ {{details}}
- **Coding Standards**: ✅/❌ {{details}}  
- **Test Coverage**: ✅/❌ {{details}}
- **Performance Considerations**: {{notes}}

### Files Changed
{{generated_file_list}}

### Key Implementation Decisions
{{generated_completion_notes}}

### Quality Validation Results
- **Unit Tests**: {{pass_count}}/{{total_tests}} passed
- **Linting**: {{✅/❌}} {{details}}
- **DoD Checklist**: {{completion_percentage}}% complete
- **Overall Quality**: {{READY_FOR_REVIEW/NEEDS_WORK/BLOCKED}}

### Next Steps
{{generated_next_steps}}
```

### Handoff Message Generation:
```yaml
# Generate handoff message for QA review
handoff_message:
  condition: Story status updated to 'Ready for Review'
  
  base_message: |
    "✅ STORY IMPLEMENTATION COMPLETE
    
    Story: {story-id}
    Status: Ready for Review
    
    Implementation Summary:
    - Total Tasks: {completed_tasks}/{total_tasks}
    - Tests Written: {test_count}
    - Files Modified: {file_count}
    - All Tests: PASSING
    
    Dev Log: {dev-log-path}
    
    Next: QA please execute command 'review-story {story-id}'"
  
  with_open_issues: |
    # If Dev Agent Record contains open_issues
    condition: Story.dev_agent_record.open_issues is not empty
    append_to_message: |
      "
      ⚠️ OPEN ISSUES FOR QA ATTENTION:
      {list open issues from Dev Agent Record}
      
      Please review these items during QA review."
  
  with_qa_feedback: |
    # If dev_feedback was added to qa_test_design_metadata
    condition: Story.qa_test_design_metadata.dev_feedback exists
    append_to_message: |
      "
      ⚠️ DEV FEEDBACK ON TEST DESIGN:
      The Dev Agent has provided feedback on the test design.
      Please review Story.qa_test_design_metadata.dev_feedback section."
  
  output_location:
    - Console log
    - Story Change Log (as final entry)
```

---

## 🎯 SUCCESS CRITERIA

### Implementation Success Indicators:
- ✅ All tasks and subtasks completed and marked [x]
- ✅ Comprehensive tests written and passing
- ✅ Code quality standards met (linting, architecture compliance)
- ✅ File List accurately reflects all changes
- ✅ Story DoD checklist 100% complete
- ✅ Story status updated to 'Ready for Review'
- ✅ No test requirements inappropriately modified

### Quality Assurance Gates:
- **Functional Completeness**: All acceptance criteria satisfied
- **Code Quality**: Follows all coding standards and architecture patterns
- **Context Validation**: No hallucinations, all references validated
- **Database Migration**: Schema changes handled with safety and rollback
- **Test Integrity**: Tests preserved and enhanced, never weakened
- **Documentation**: File List complete, Completion Notes comprehensive
- **Standards Compliance**: Adheres to all technical preferences and constraints

### Blocking Conditions Resolution:
- **Dependency Issues**: User approval obtained for new dependencies
- **Architecture Conflicts**: Implementation revised to align with standards  
- **Test Failures**: Implementation fixed, test requirements preserved
- **Ambiguous Requirements**: Clarification obtained or assumptions documented

**Fallback Reference**: Use manual `*develop-story` command for complex edge cases or when implementation encounters unresolvable issues.
