# Implement Story (Auto-Execution)

## 🤖 AUTO-EXECUTION MODE (Claude Code SubAgent Default)

**Mission**: Implement approved story with all tasks, subtasks, and tests, fully automated

### Immediate Action Protocol:
1. **Auto-Load Story**: Read story file (must be status: Approved)
2. **Auto-Load Standards**: Load coding standards, tech stack, project structure
3. **Auto-Implement Tasks**: Execute each task and subtask sequentially  
4. **Auto-Write Tests**: Create comprehensive tests for all functionality
5. **Auto-Validate**: Run tests, linting, and validation checks
6. **Auto-Update Story**: Mark completed tasks, update File List, add completion notes
7. **Auto-Final Check**: Execute DoD checklist, set status to 'Ready for Review'

### Non-Negotiable Requirements:
- ✅ MUST only work on stories with status: 'Approved'  
- ✅ MUST implement ALL tasks and subtasks in order
- ✅ MUST write tests for all new functionality
- ✅ MUST follow coding standards and architecture patterns
- ✅ MUST never modify test requirements to make tests pass
- ✅ MUST update only authorized story sections
- ✅ MUST execute complete DoD checklist before completion

### Auto-Halt Conditions:
- ❌ Story status not 'Approved' → Report status issue, halt
- ❌ Story missing critical sections → Report malformed story, halt
- ❌ Required dependencies unavailable → Report dependency issue, ask user approval
- ❌ 3 consecutive implementation failures → Report blocking issue, escalate to user
- ❌ Tests fail after implementation → Fix implementation, never weaken tests

---

## 🎯 AUTOMATED IMPLEMENTATION ENGINE

### Story Context Auto-Loading:
```yaml
# Comprehensive story and context loading
story_loading:
  story_validation:
    - Verify story status is 'Approved' 
    - Confirm all required sections present
    - Extract story statement, acceptance criteria, tasks/subtasks
    - Load Dev Notes with technical specifications
    
  standards_loading:
    - docs/architecture/coding-standards.md
    - docs/architecture/tech-stack.md  
    - docs/architecture/unified-project-structure.md
    - docs/architecture/testing-strategy.md
    - Additional architecture docs as specified in Dev Notes
    
  context_assembly:
    - Technical Preferences Summary from Dev Notes
    - Testing Standards and integrity rules
    - Previous story completion notes (if referenced)
    - File locations and naming conventions
```

### Implementation Auto-Sequence:
```yaml
# Systematic task execution with quality gates
implementation_sequence:
  task_processing:
    1. Read next uncompleted task from Tasks/Subtasks list
    2. Identify acceptance criteria references (AC: numbers)
    3. Plan implementation approach based on Dev Notes guidance
    4. Implement functionality following coding standards
    5. Write comprehensive tests (unit, integration as specified)
    6. Execute tests and validation checks
    7. Only if ALL pass → mark task as [x] completed
    8. Update File List with new/modified/deleted files
    9. Repeat for all tasks and subtasks
    
  quality_validation:
    - Code follows coding-standards.md patterns
    - File locations match unified-project-structure.md
    - Testing follows testing-strategy.md requirements
    - All functionality meets acceptance criteria
    - No test requirements modified inappropriately
```

### Test Integrity Protection System:
```yaml
# Absolute protection of test requirements
test_integrity:
  core_principles:
    - Tests represent requirements and business logic - AUTHORITATIVE
    - NEVER modify test expectations, assertions, or acceptance criteria
    - If tests fail, fix IMPLEMENTATION, never weaken tests
    - Test modifications require explicit business justification
    
  requirement_vs_implementation_tests:
    requirement_tests: IMMUTABLE
      - Business logic validation
      - Acceptance criteria verification  
      - API contract compliance
      - Data integrity checks
      
    implementation_tests: ADJUSTABLE (with justification)
      - Performance optimization tests
      - Internal structure tests  
      - Mock configurations
      - Development utility tests
      
  violation_detection:
    - Monitor for test expectation changes
    - Flag any assertion modifications
    - Document all test changes in Completion Notes
    - Escalate unexplained test modifications
```

---

## 🔧 EXECUTION LOGIC

### Task Implementation Auto-Process:
```yaml
# Detailed implementation methodology
task_execution:
  planning_phase:
    - Parse task description and subtasks
    - Identify linked acceptance criteria
    - Review Dev Notes for specific guidance
    - Plan file structure and component approach
    
  implementation_phase:
    - Create/modify files per unified-project-structure.md
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
    - Verify acceptance criteria fulfillment
    - Confirm no test requirements were weakened
```

### Story File Update Auto-Management:
```yaml
# Precise story file section updates
authorized_updates:
  tasks_subtasks:
    - Mark completed tasks with [x]
    - Never modify task descriptions or requirements
    - Update only checkbox status
    
  dev_agent_record:
    agent_model: Record AI model and version used
    debug_log_references: Link to any debug traces
    completion_notes: Document implementation decisions and challenges
    file_list: Complete list of created/modified/deleted files
    
  change_log:
    - Add entry for story completion
    - Include date, version, description, author
    
  status:  
    - Update from 'Approved' to 'Ready for Review' when complete
    
forbidden_modifications:
  - Status (except completion update)
  - Story statement  
  - Acceptance Criteria
  - Dev Notes
  - Testing sections
  - Any other sections not explicitly authorized
```

### Quality Gates Auto-Execution:
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
    - Auto-execute story-dod-checklist.md
    - Verify 100% completion rate
    - Document any exceptions or issues
    - Only mark story complete if checklist passes
```

---

## ⚡ AUTO-VALIDATION CHECKPOINTS

### Pre-Implementation Validation:
```bash
✓ Story status is 'Approved'
✓ All required story sections present
✓ Dev Notes contain sufficient implementation guidance  
✓ Technical standards documents accessible
✓ Development environment ready
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
    action: Document issue, ask user for approval to add dependency
    blocking: HALT until user provides guidance
    
  test_failures:
    detection: Tests fail after implementation
    action: Fix IMPLEMENTATION, never modify test requirements
    escalation: After 3 failed attempts, escalate to user
    
  ambiguous_requirements:
    detection: Task description unclear or contradictory
    action: Document ambiguity, request clarification
    fallback: Use best judgment based on Dev Notes, document assumption
    
  architecture_conflicts:
    detection: Implementation conflicts with architecture standards
    action: Revise approach to align with standards
    escalation: If unresolvable, flag for architect review
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

## 📊 COMPLETION REPORT AUTO-GENERATION

### Story Implementation Summary:
```markdown
## Implementation Completion Report

**Story ID**: {{story_id}}
**Implementation Date**: {{completion_date}}
**Developer**: Dev Agent (Auto)
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
{{auto_generated_file_list}}

### Key Implementation Decisions
{{auto_generated_completion_notes}}

### Quality Validation Results
- **Unit Tests**: {{pass_count}}/{{total_tests}} passed
- **Linting**: {{✅/❌}} {{details}}
- **DoD Checklist**: {{completion_percentage}}% complete
- **Overall Quality**: {{READY_FOR_REVIEW/NEEDS_WORK/BLOCKED}}

### Next Steps
{{auto_generated_next_steps}}
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
- **Test Integrity**: Tests preserved and enhanced, never weakened
- **Documentation**: File List complete, Completion Notes comprehensive
- **Standards Compliance**: Adheres to all technical preferences and constraints

### Blocking Conditions Resolution:
- **Dependency Issues**: User approval obtained for new dependencies
- **Architecture Conflicts**: Implementation revised to align with standards  
- **Test Failures**: Implementation fixed, test requirements preserved
- **Ambiguous Requirements**: Clarification obtained or assumptions documented

**Fallback Reference**: Use manual `*develop-story` command for complex edge cases or when auto-implementation encounters unresolvable issues.