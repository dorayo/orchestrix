# Dev Self-Review

## Purpose

Comprehensive self-review before marking story as Review. This is a MANDATORY gate that enforces quality standards before QA review.

## Prerequisites

- Story implementation complete (all tasks checked)
- All tests passing
- Lint checks passing
- Dev Log completed with Final Summary

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: Path to story file
  - dev_log_path: Path to dev log

optional:
  - architecture_context: Pre-loaded context from develop-story.md Step 3.2
  - cumulative_context: Pre-loaded context from develop-story.md Step 3.4
```

## Validation

**Execute**: `{root}/tasks/util-validate-agent-action.md`

**Input**:
```yaml
agent_id: dev
story_path: {story_path}
action: self_review
```

**On FAIL**: HALT with error message and guidance

**On PASS**: Proceed with self-review process

## Process

### 1. Load Context

**Context Reuse Protocol**:

```yaml
if architecture_context provided in inputs:
  use: inputs.architecture_context
else:
  execute: {root}/tasks/util-load-architecture-context.md

if cumulative_context provided in inputs:
  use: inputs.cumulative_context
else:
  execute: {root}/tasks/util-load-cumulative-context.md
```

**Load Required Documents**:
- Story file: **Use Glob FIRST** with `{devStoryLocation}/{story_id}.*.md`, then Read the returned path
  > NEVER attempt to Read `{story_id}.md` directly - files include title slug
- Dev Log from `{devLogLocation}/{story-id}-dev-log.md`
- Architecture documents: **REUSE from input or load if missing**
- API contracts (if multi-repo, from product repo)
- QA test design (if exists): glob `{qa.qaLocation}/assessments/{story_id}-test-design-*.md`

### 2. Execute Implementation Gate

**Execute**: `{root}/checklists/gate-dev-implementation-gate.md`

**Input**:
```yaml
story_id: {story_id}
story_path: {story_path}
dev_log_path: {dev_log_path}
project_mode: {from core-config.yaml}
repository_role: {from core-config.yaml}
architecture_context: {from Step 1}
```

**Output**: `gate_result` (complete implementation gate validation)

```yaml
gate_result:
  status: {PASS|FAIL}
  overall_score: {percentage}

  critical_items:
    total: 7
    passed: {count}
    status: {PASS|FAIL}
    items: [{id, check, status, evidence}]

  sections:
    - name: {section_name}
      score: {percentage}
      threshold: {required percentage}
      passed: {true|false}
      items_total: {count}
      items_passed: {count}

  issues:
    critical: [{category, section, item_id, issue, location, fix}]
    major: [{category, section, item_id, issue, location, recommendation}]
    minor: [{category, section, item_id, issue, location, suggestion}]

  total_critical_issues: {count}
  total_major_issues: {count}
  total_minor_issues: {count}
  sections_passed: {count}/10
  sections_failed: {count}/10

  blocking: {true|false}
  blocking_reason: {summary if blocking}
  ready_for_qa: {true|false}
```

**On Failure** (`gate_result.status = FAIL` OR `gate_result.overall_score < 95%`):
- Log failed items in Dev Log
- Document all critical/major issues with locations
- Status remains InProgress
- HALT - DO NOT proceed

**On Success** (`gate_result.status = PASS` AND `gate_result.overall_score ≥ 95%`):
- Log gate result in Dev Agent Record
- Proceed to Step 3

---

### 3. Database Migration Validation (Conditional)

**Purpose**: Verify database migrations are properly created and executed for schema changes.

**Skip Condition**: If no database-related files in story's File List, skip to Step 4.

**Detection**: Check story File List for patterns:
- `**/migrations/**`
- `**/*.migration.*`
- `**/*.entity.ts`
- `**/*.model.ts`
- `**/schema.prisma`
- `**/schema.rb`

**If Database Files Detected**:

Execute: `{root}/tasks/validate-database-migration.md`

Input:
```yaml
story_id: {story_id}
story_path: {story_path}
```

**Output**: `migration_result`
```yaml
migration_result:
  schema_changes_detected: {true|false}
  migration_scripts_found: {true|false}
  migrations_executed: {true|false}
  pending_migrations: [{migration_name}]
  validation_status: PASS | FAIL
  issues: [{type, description, action_required}]
```

**On FAIL** (`migration_result.validation_status = FAIL`):
- Log migration issues in Dev Log
- Store `migration_result` for Step 5 decision
- Continue to Step 4 (issues will be aggregated in final decision)

**On PASS** or **Skip**:
- Log result (if executed) in Dev Agent Record
- Proceed to Step 4

---

### 4. Track Implementation Rounds

**Read Dev Agent Record**: `implementation_rounds` field (default: 0)

**Extract Round Number**:
- If field missing or 0: Current round = 1
- If field exists: Current round = {value}

**If Round ≥ 3**:
- Review previous QA feedback from QA Review Metadata
- Identify recurring issue patterns
- Consider if architectural issue exists
- Prepare pattern analysis for escalation decision

**Log Round Context**:
```yaml
implementation_round: {N}
previous_rounds_summary:
  - round: {N-1}
    issues: {issue types}
  - round: {N-2}
    issues: {issue types}
```

---

### 5. Make Self-Review Decision

**Execute**: `{root}/tasks/make-decision.md`

**Input**:
```yaml
decision_type: dev-self-review-decision
context:
  implementation_gate_score: {from Step 2: gate_result.overall_score}
  architecture_compliance: {PASS if gate_result.sections["Architecture Compliance"].passed else FAIL}
  api_contract_compliance: {PASS if gate_result.sections["API Contract Compliance"].passed else FAIL or N_A}
  test_integrity: {PASS if gate_result.sections["Test Integrity"].passed else FAIL}
  migration_validation: {from Step 3: PASS | FAIL | SKIP}
  migration_issues: {from Step 3: migration_result.issues if FAIL, else []}
  critical_issues: {from Step 2: gate_result.total_critical_issues}
  implementation_round: {from Step 4}
  previous_round_issues: {from Step 4, if round > 1}
```

**Output**: `decision_result`
```yaml
decision_result:
  result: {PASS|FAIL|ESCALATE}
  reasoning: {explanation}
  next_status: {InProgress|Escalated}
  next_action: {action_to_take}
  metadata:
    quality_level: {high|insufficient|unacceptable|stalled}
    blocking_gates: [{gate_name}] if FAIL
    ready_for_qa: {true|false}
```

**Outcomes**:

**PASS** (All gates passed, no critical issues):
- `decision_result.result = PASS`
- `decision_result.ready_for_qa = true`
- Status remains InProgress (will be set to Review by develop-story)
- Proceed to Step 6

**FAIL** (Any gate <95% OR critical issues):
- `decision_result.result = FAIL`
- Status remains InProgress
- HALT - Output detailed gap report
- DO NOT proceed

**ESCALATE** (≥3 rounds with recurring issues):
- `decision_result.result = ESCALATE`
- Status = Escalated
- HALT - Output escalation report
- DO NOT proceed

---

### 6. Update Dev Agent Record

**Only execute if decision_result.result = PASS**

Update the following fields in Story's Dev Agent Record:

```yaml
self_review:
  date: {timestamp}
  implementation_gate_score: {from Step 2: gate_result.overall_score}
  critical_items_passed: {from Step 2: gate_result.critical_items.passed}
  sections_passed: {from Step 2: gate_result.sections_passed}
  architecture_compliance: {derived from Step 2}
  api_contract_compliance: {derived from Step 2}
  test_integrity: {derived from Step 2}
  migration_validation: {from Step 3: PASS | SKIP | N_A}
  critical_issues_found: {from Step 2: gate_result.total_critical_issues}
  ready_for_qa: true
  round: {from Step 4}

decision:
  result: PASS
  reasoning: {from Step 5}
  quality_level: {from Step 5}
  timestamp: {timestamp}
```

---

## Output

### On PASS

```
✅ SELF-REVIEW PASSED
Story: {story_id} ready for QA review
Implementation Gate: {score}% ({critical_items_passed}/7 critical, {sections_passed}/10 sections)
Quality Level: {quality_level}
Round: {N}
```

**Return to develop-story.md with result**:

```yaml
result: PASS
self_review_result:
  date: {timestamp}
  implementation_gate_score: {score}
  critical_items_passed: {count}/7
  sections_passed: {count}/10
  architecture_compliance: {PASS|FAIL}
  api_contract_compliance: {PASS|FAIL|N_A}
  test_integrity: {PASS|FAIL}
  migration_validation: {PASS|SKIP}
  critical_issues_found: 0
  ready_for_qa: true
  round: {N}
  quality_level: {high|insufficient|unacceptable|stalled}
```

**Next Step**: develop-story.md will continue to Step 8 (Registry Update)

---

### On FAIL

```
❌ SELF-REVIEW FAILED
Story: {story_id} not ready for QA review
Status: InProgress (remains)

Gate Status: {gate_result.status}
Overall Score: {gate_result.overall_score}% (Required: ≥95%)
Critical Items: {critical_items_passed}/7
Sections Passed: {sections_passed}/10
Migration Status: {migration_validation}

Failed Critical Items ({count}):
{list from gate_result.critical_items where status = FAIL}

Failed Sections ({count}):
{list from gate_result.sections where passed = false}

Migration Issues ({count if migration_validation = FAIL}):
{list from migration_result.issues with type, description, action_required}

Critical Issues ({count}):
{list from gate_result.issues.critical with item_id, issue, location, fix}

Major Issues ({count}):
{list from gate_result.issues.major with item_id, issue, location, recommendation}

Required Actions (Priority Order):
{prioritized list derived from all issues including migration}

Estimated Effort to Fix:
{based on issue count: <1h, 1-4h, >4h}

Fix issues and re-run *self-review before marking Review.
```

**Return to develop-story.md with result**:

```yaml
result: FAIL
gate_result:
  status: FAIL
  overall_score: {percentage}
  critical_items_passed: {count}/7
  sections_passed: {count}/10
  failed_sections: [{section_name, score, threshold}]
  migration_validation: {PASS|FAIL|SKIP}
  migration_issues: [{type, description, action_required}]
  critical_issues: [{issue, location, fix}]
  major_issues: [{issue, location, recommendation}]
required_actions:
  - action: {description}
    priority: {critical|high|medium}
    estimated_effort: {<1h|1-4h|>4h}
```

**Next Step**: develop-story.md will HALT with detailed failure report

---

### On ESCALATE

```
🚨 ESCALATED - RECURRING ISSUES
Story: {story_id} → Status: Escalated
Round: {N} (≥3 rounds with similar issues)

Recurring Issue Patterns:
{analysis from previous_rounds_summary}

Previous QA Feedback Summary:
{summary from QA Review Metadata for last 3 rounds}

Pattern Analysis:
{why same issues keep recurring - possible architectural problem}

Recommendation: Architectural review needed to break the cycle


🎯 HANDOFF TO architect: *review-escalation {story_id}
```

**Return to develop-story.md with result**:

```yaml
result: ESCALATE
escalation_report:
  story_id: {story_id}
  round: {N}
  recurring_issue_patterns: {analysis}
  previous_rounds_summary: [{round, issues}]
  recommendation: "Architectural review needed to break the cycle"
handoff_command: "*review-escalation {story_id}"
```

**Next Step**: develop-story.md will update Status=Escalated, add Change Log entry, and HALT with handoff to architect

---

## Blocking Conditions

HALT immediately if:
- Missing Dev Log or incomplete
- No tests written
- Tests not passing
- Lint errors present
- Critical architecture violations
- API contract mismatches (multi-repo)
- Test integrity violations
- Implementation gate < 95%
- Any critical issues found

## Completion Criteria

- Agent permission validated
- Quality gate validation: PASS with ≥95% score (Step 2)
- Database migration validation: PASS or SKIP (Step 3)
- All critical items passed (7/7)
- All required sections passed thresholds
- Zero critical issues
- Decision made: PASS (Step 5)
- Dev Agent Record updated with self-review results (Step 6)

## Key Principles

- **Quality over speed**: Better to halt now than rework later
- **Test integrity is sacred**: Never weaken tests to pass
- **Architecture compliance is mandatory**: No shortcuts
- **API contracts are binding**: Exact match required (multi-repo)
- **Honest self-assessment**: Report issues, don't hide them
- **Continuous improvement**: Learn from previous rounds
- **Unified validation**: Single call validates all quality gates
- **Structured decisions**: All decisions driven by YAML rules
- **Zero manual filling**: All gate results auto-generated by validation engine

## References

- `checklists/gate-dev-implementation-gate.md` - Implementation Gate (unified quality validation engine)
- `tasks/validate-database-migration.md` - Database migration validation
- `tasks/make-decision.md` - Decision execution framework
- `data/decisions-dev-self-review-decision.yaml` - Self-review decision rules
- `data/story-status-transitions.yaml` - Status transition permissions

## Notes

- **DoD Checklist Removed**: Completion steps (Dev Log, Agent Record, Change Log, Status, Handoff) are verified in develop-story.md GATE 2 (dev-completion-steps.md)
- **Single Quality Gate**: dev-implementation-gate.md is the only quality checklist, covering all 10 sections including Documentation
