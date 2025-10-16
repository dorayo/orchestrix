# Implement Story

## 🤖 EXECUTION MODE

**Mission**: Implement approved story - all tasks, subtasks, tests, fully automated

### Action Protocol:
1. Load story (status: Approved/TestDesignComplete)
2. Load standards (coding, tech stack, structure)
3. Implement tasks sequentially
4. Write tests
5. Validate (tests, linting)
6. Update story (tasks, File List, notes)
7. Execute DoD checklist → status 'Ready for Review'

### Requirements:
- ✅ Status: 'Approved'/'TestDesignComplete' only
- ✅ ALL tasks/subtasks in order
- ✅ Tests for all functionality
- ✅ Follow standards/architecture
- ✅ NEVER modify test requirements
- ✅ Update authorized sections only
- ✅ Complete DoD checklist

### Halt Conditions:
- ❌ Invalid status → Report, halt
- ❌ Missing sections → Report, halt
- ❌ Dependencies unavailable → Ask approval
- ❌ 3 failures → Escalate
- ❌ Tests fail → Fix implementation, not tests

---

## 🎯 IMPLEMENTATION ENGINE

### Story Context Loading:
```yaml
story_loading:
  validation:
    - Verify status: Approved/TestDesignComplete
    - Confirm required sections
    - Extract: statement, AC, tasks/subtasks, Dev Notes
    
  standards:
    - Load: coding-standards.md, tech-stack.md, source-tree.md, testing-strategy.md
    - Additional docs per Dev Notes
    
  context:
    - Tech Preferences, Testing Standards
    - Previous story notes (if referenced)
    - File locations, naming conventions
    
  qa_test_design:
    - Check qa_test_design_metadata exists
    - If test_design_document exists:
      - Read doc
      - Extract: level, scenarios, priorities (P0/P1/P2), levels (Unit/Integration/E2E)
      - Record strategy
    - Else: Standard TDD per testing-strategy.md
    
  validation:
    - dev-database-migration.md for schema changes
```

### Dev Log Setup:
```yaml
dev_log_setup:
  construct_path:
    - Read CONFIG_PATH.dev.devLogLocation from core-config.yaml
    - Path: {devLogLocation}/{story-id}-dev-log.md
    
  check_existence:
    - Check if Dev Log exists
    
  create_new:
    condition: Not found
    actions:
      - Read template: dev-log-tmpl.md
      - Replace: storyId, storyTitle, startTimestamp, agentModel, smDesignPath, testDesignLevel
      - Initialize: p0Count, p1Count, p2Count as "TBD" or 0
      - Initialize: priorityAreas, riskCoverage as "TBD"
      - Write to path
      - Log: "✓ Created Dev Log at {path}"
      - Update Story Change Log
    
  resume_existing:
    condition: Found
    actions:
      - Read Dev Log, parse Resumption Guide
      - Extract: current_phase, current_subtask, next_steps, key_context, recent_decisions, open_issues
      - Display summary
      - Continue from current subtask
    
  load_test_strategy:
    if_test_design_exists:
      - Read test design doc
      - Extract: level, P0/P1/P2 counts, priority areas, risk coverage, scenarios
      - Update Dev Log Test Strategy
    else:
      - Use standard TDD per testing-strategy.md
```

### Context Recovery:
```yaml
context_recovery:
  trigger: Dev Log exists
  
  process:
    - Read Dev Log: {devLogLocation}/{story-id}-dev-log.md
    - Parse Resumption Guide section
    - Extract: current_phase, current_subtask, next_steps, key_context, recent_decisions, open_issues
    - Continue from current subtask (don't restart)
    - Use key_context, follow next_steps, address open_issues
    - Validate: subtask exists, previous marked [x], files/tests exist
```

### Implementation Sequence:
```yaml
implementation_sequence:
  task_processing:
    1. Read next uncompleted task
    2. Identify Phase (1-4)
    3. Apply phase guidance
    4. Identify AC references
    5. Plan approach per Dev Notes
    6. Implement per standards
    7. Write tests (unit, integration)
    8. Append to Dev Log: timestamp, subtask, details, decisions, issues, test results
    9. Execute tests/validation
    10. If pass → mark [x]
    11. Update Resumption Guide: phase, subtask, next steps, context
    12. Update File List
    13. If phase complete → Append Phase Summary: achievements, tests, readiness
    14. Repeat
    
  phase_guidance:
    phase_1_contract_definition:
      objectives: Read SM contracts, create technical contracts (TS interfaces, Zod schemas, API types), write tests (TDD RED), follow P0→P1→P2
      steps: Extract contracts, define interfaces/schemas/types, write tests, prioritize P0, log decisions
      success: Contracts defined, tests written (RED), Dev Log updated
    
    phase_2_walking_skeleton:
      objectives: Minimal API/UI, mock data, wire end-to-end, tests pass (GREEN)
      steps: Create handlers, mock responses, basic UI, wire, verify
      success: Wired, tests pass, logged
    
    phase_3_business_logic:
      objectives: TDD (RED→GREEN→REFACTOR), P0→P1→P2
      steps: Write test, implement, refactor, replace mocks, add state/validation
      success: P0/P1 pass, P2 as time permits, logic complete
    
    phase_4_integration_qa:
      objectives: Integration tests, edge cases, performance, validate AC
      steps: Write/run integration tests, test interactions/errors/boundaries, optimize, regression
      success: All pass, edges handled, optimized, AC verified
  
  validation:
    - Follow coding-standards.md
    - Match source-tree.md
    - Follow testing-strategy.md
    - Meet AC
    - No test modifications
    - Phase objectives met
```

### Test Integrity:
```yaml
test_integrity:
  principles:
    - Tests = requirements (AUTHORITATIVE)
    - NEVER modify expectations/assertions/AC
    - Tests fail → fix implementation, not tests
    - Follow QA priorities/levels if exists
    - P0 MANDATORY, document deviations
    
  types:
    requirement_tests: IMMUTABLE (logic, AC, contracts, integrity)
    implementation_tests: ADJUSTABLE with justification (performance, structure, mocks)
  
  compliance:
    if_test_design_exists:
      1. Load design, extract scenarios/priorities/levels
      2. Phase 1: Write P0 contract tests
      3. Phase 3: P0→P1→P2 order
      4. Match levels (Unit/Integration/E2E)
      5. Document deviations
      6. Verify P0 complete
```

---

## 🔧 EXECUTION LOGIC

### Task Implementation:
```yaml
task_execution:
  planning:
    - Parse task/subtasks
    - Identify AC
    - Review Dev Notes
    - Plan structure
    
  implementation:
    - Create/modify files per source-tree.md
    - Follow naming per coding-standards.md
    - Implement per Technical Preferences
    - Apply architecture patterns
    
  testing:
    - Write unit tests per testing-strategy.md
    - Create integration tests if specified
    - Follow test naming/location
    - Ensure AC coverage
    
  validation:
    - Execute tests (unit, integration, regression)
    - Run linting/quality checks
    - Execute DB migrations (dev-database-migration.md)
    - Verify AC fulfillment
    - Confirm no test weakening
```

### Story Updates:
```yaml
authorized_updates:
  tasks_subtasks:
    - Mark [x] completed
    - Never modify descriptions/requirements
    
  dev_agent_record:
    agent_model: AI model/version
    implementation_summary: 3-5 sentences, high-level
    file_list: Created/modified/deleted files
    dev_log_reference: docs/dev/logs/{story-id}-dev-log.md
    open_issues: QA feedback, tech debt, performance concerns, improvements
    
  change_log:
    - Add completion entry: date, version, description, author
    
  status:  
    - Update: Approved → Ready for Review
    
forbidden:
  - Status (except completion)
  - Story statement  
  - AC
  - Dev Notes
  - Testing sections
  - QA/Quality/Architect metadata
  - Other sections
```

### Quality Gates:
```yaml
quality_gates:
  code:
    - Linting passes
    - Standards compliance
    - Structure follows conventions
    - No secrets/sensitive data
    
  functional:
    - All tasks completed
    - All AC satisfied
    - Test coverage
    - All tests pass
    
  documentation:
    - File List complete
    - Completion Notes document decisions
    - Debug references if applicable
    - Change Log updated
    
  dod_checklist:
    - Execute story-dod-checklist.md
    - Verify 100% completion
    - Document exceptions
    - Mark complete only if passes
```

---

## ⚡ VALIDATION

### Pre-Implementation:
```bash
✓ Status: Approved/TestDesignComplete
✓ Required sections present
✓ AC clear/unambiguous
✓ Dev Notes sufficient
✓ Standards accessible
✓ Environment ready
```

### AC Clarity Check:
```yaml
ac_clarity_check:
  when: Before implementation
  
  process:
    1. Review AC clarity
    2. Assess score (0-10)
    3. If concerns, call make-decision:
       - decision_type: "dev-block-story"
       - context: {issue_description, severity, ac_clarity}
    4. Apply result:
       - BLOCK: Status=Blocked, handoff SM
       - ESCALATE: Escalate Architect
       - FEEDBACK: Log, continue
       - CONTINUE: Proceed
```

### During Implementation:
```bash
✓ Tasks per Dev Notes
✓ Follow standards/patterns
✓ Files in correct locations
✓ Tests written/passing
✓ No test modifications
```

### Post-Implementation:
```bash
✓ All tasks [x]
✓ Tests written/passing
✓ Linting/quality pass
✓ File List updated
✓ Completion Notes complete
✓ DoD checklist passed
✓ Status: Ready for Review
```

---

## 🛠️ ERROR HANDLING

### Failure Management:
```yaml
error_handling:
  dependency_issues:
    detection: Library/service unavailable
    action: Document, ask approval, update Resumption Guide
    blocking: HALT until guidance
    
  test_failures:
    detection: Tests fail
    action: Fix implementation, never modify tests
    dev_log: Log failures/resolutions
    escalation: After 3 attempts, escalate
    
  ac_clarity_issues:
    detection: AC unclear/ambiguous/contradictory
    process:
      1. Call make-decision: dev-block-story
         context: {issue_description, severity, ac_clarity}
      2. Apply result
      3. If BLOCK:
         - Log issue
         - Update Resumption Guide
         - Status=Blocked
         - Change Log entry
         - Handoff SM
         - HALT
      4. Else: Follow guidance
    
  ambiguous_requirements:
    detection: Task unclear (AC clear)
    action: Use dev-block-story, lower severity
    process: Document, use judgment per Dev Notes
    
  architecture_conflicts:
    detection: Conflicts with standards
    process:
      1. Call make-decision: dev-escalate-architect
         context: {deviation_reason, impact, alternatives, affects_architecture, affects_other_services, security_implications}
      2. Apply result:
         - ESCALATE: Add escalation, handoff Architect
         - DOCUMENT: Record, proceed
  
  technical_decisions:
    detection: Deviate from SM approach
    process:
      1. Call make-decision: dev-escalate-architect
         context: {deviation_reason, impact, alternatives, affects_architecture, affects_other_services, security_implications}
      2. Apply result:
         - ESCALATE: Add marker, handoff, wait
         - DOCUMENT: Record rationale, proceed
      3. Log: decision, rationale, alternatives, impact
    
  deviations_from_sm_design:
    detection: Deviation from Dev Notes
    action: Evaluate necessity/impact
    dev_log: Description, reason, impact, architect flag
    escalation: Flag if affects architecture
  
  qa_test_design_issues:
    detection: Test design unreasonable/missing scenarios
    action: Record feedback
    dev_log: Issue, missing scenarios, suggestions, impact
    story_action:
      1. Update qa_test_design_metadata.dev_feedback:
         {issue, missing_scenarios, suggestions, impact, timestamp}
      2. Change Log entry
    handoff: "⚠️ Dev Feedback on Test Design - Review qa_test_design_metadata.dev_feedback"
    blocking: NO - Continue, QA reviews
  
  before_halt:
    detection: HALT condition
    action: Update Resumption Guide
    dev_log: State, blocking issue, context, next steps
```

### Recovery:
```yaml
recovery:
  partial_completion:
    - Save progress
    - Document blocking issue
    - Status: Approved (for continuation)
    - Provide next steps
    
  rollback:
    - Revert if tests fail repeatedly
    - Restore working state
    - Document reason
    - Request guidance
    
  escalation_triggers:
    - 3 failures
    - Unresolvable conflicts
    - Dependencies unavailable
    - Test requirements incorrect (never modify without approval)
```

---

## 📊 COMPLETION REPORT

### Dev Log Final Summary:
```yaml
dev_log_final_summary:
  append_to_dev_log:
    section: "## Final Summary"
    content:
      completion_timestamp: ISO 8601
      total_duration: Start to completion
      
      implementation_overview: 3-5 sentences - accomplished, alignment, approach
      
      phases_completed: Total (1-4), subtasks, phase summaries
      
      files_modified: Added, modified, deleted counts, key files
      
      testing_summary: Tests written (unit/integration/e2e), coverage %, passing, results
      
      key_achievements: Features, challenges solved, quality improvements, optimizations
      
      challenges_overcome: Obstacles, resolutions, lessons
      
      technical_debt: Limitations, improvements needed, refactoring, bottlenecks
      
      recommendations: Related features, architecture, testing, documentation
  
  log_action:
    - Console: "✓ Dev Log Final Summary written"
    - Story Change Log: "Dev Log completed with Final Summary"
```

### Story Implementation Summary:
```markdown
## Implementation Report

**Story**: {{story_id}}
**Date**: {{completion_date}}
**Developer**: Dev Agent
**Model**: {{ai_model_version}}

### Summary
- Tasks: {{completed_tasks}}/{{total_tasks}}
- Tests: {{test_count}}
- Files: {{file_count}}
- Status: {{COMPLETE/PARTIAL/BLOCKED}}

### Technical
- Architecture: ✅/❌ {{details}}
- Standards: ✅/❌ {{details}}  
- Coverage: ✅/❌ {{details}}
- Performance: {{notes}}

### Files
{{generated_file_list}}

### Decisions
{{generated_completion_notes}}

### Quality
- Unit Tests: {{pass_count}}/{{total_tests}}
- Linting: {{✅/❌}} {{details}}
- DoD: {{completion_percentage}}%
- Overall: {{READY_FOR_REVIEW/NEEDS_WORK/BLOCKED}}

### Next
{{generated_next_steps}}
```

### Handoff Message:
```yaml
handoff_message:
  condition: Status → Ready for Review
  
  base: |
    "✅ IMPLEMENTATION COMPLETE
    
    Story: {story-id}
    Status: Ready for Review
    
    Summary:
    - Tasks: {completed_tasks}/{total_tasks}
    - Tests: {test_count}
    - Files: {file_count}
    - Tests: PASSING
    
    Dev Log: {dev-log-path}
    
    Next: QA execute 'review-story {story-id}'"
  
  with_open_issues:
    condition: open_issues not empty
    append: |
      "⚠️ OPEN ISSUES:
      {list issues}
      Review during QA."
  
  with_qa_feedback:
    condition: dev_feedback exists
    append: |
      "⚠️ DEV FEEDBACK ON TEST DESIGN:
      Review qa_test_design_metadata.dev_feedback."
  
  output:
    - Console
    - Story Change Log
```

---

## 🎯 SUCCESS CRITERIA

### Success Indicators:
- ✅ All tasks [x]
- ✅ Tests written/passing
- ✅ Quality standards met
- ✅ File List accurate
- ✅ DoD 100%
- ✅ Status: Ready for Review
- ✅ No test modifications

### QA Gates:
- **Functional**: All AC satisfied
- **Code**: Standards/patterns followed
- **Context**: No hallucinations, references validated
- **DB**: Schema changes safe, rollback ready
- **Tests**: Preserved/enhanced, never weakened
- **Docs**: File List complete, notes comprehensive
- **Standards**: Technical preferences/constraints met

### Resolution:
- **Dependencies**: User approval
- **Architecture**: Align with standards  
- **Tests**: Fix implementation, preserve tests
- **Requirements**: Clarify or document assumptions

**Fallback**: Use manual `*develop-story` for complex edge cases or unresolvable issues.
