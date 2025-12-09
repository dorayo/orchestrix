# Dev Self-Review

## Purpose

Comprehensive self-review before marking story as Review. This is a MANDATORY gate that enforces quality standards before QA review.

## Prerequisites

- Story implementation complete (all tasks checked)
- All tests passing
- Lint checks passing
- Dev Log completed with Final Summary

## Validation

**Execute**: `{root}/tasks/utils/validate-agent-action.md`

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

Load required documents:
- Story file from `{devStoryLocation}/{epic}.{story}.*.md`
- Dev Log from `{devLogLocation}/{story-id}-dev-log.md`
- Architecture documents (via load-architecture-context.md)
- API contracts (if multi-repo, from product repo)
- QA test design (if exists)

### 2. Execute Implementation Gate

**Execute**: `{root}/checklists/gate/dev-implementation-gate.md`

This is a complex validation engine with a complete ## Process section. Follow its execution flow:
- Read the ## Inputs section to understand required parameters
- Execute the ## Process section step-by-step
- Generate gate_result as defined

**Input**:
```yaml
story_id: {story_id}
story_path: {story_path}
dev_log_path: {dev_log_path}
project_mode: {from core-config.yaml}
repository_role: {from core-config.yaml}
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

### 3. Track Implementation Rounds

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

### 4. Make Self-Review Decision

**Execute**: `{root}/tasks/make-decision.md`

**Input**:
```yaml
decision_type: dev-self-review-decision
context:
  implementation_gate_score: {from Step 2: gate_result.overall_score}
  architecture_compliance: {PASS if gate_result.sections["Architecture Compliance"].passed else FAIL}
  api_contract_compliance: {PASS if gate_result.sections["API Contract Compliance"].passed else FAIL or N_A}
  test_integrity: {PASS if gate_result.sections["Test Integrity"].passed else FAIL}
  critical_issues: {from Step 2: gate_result.total_critical_issues}
  implementation_round: {from Step 3}
  previous_round_issues: {from Step 3, if round > 1}
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
- DO NOT proceed to Step 6

**ESCALATE** (≥3 rounds with recurring issues):
- `decision_result.result = ESCALATE`
- Status = Escalated
- HALT - Output escalation report
- DO NOT proceed to Step 6

---

### 5. Update Dev Agent Record

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
  critical_issues_found: {from Step 2: gate_result.total_critical_issues}
  ready_for_qa: true
  round: {from Step 3}

decision:
  result: PASS
  reasoning: {from Step 4}
  quality_level: {from Step 4}
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

Failed Critical Items ({count}):
{list from gate_result.critical_items where status = FAIL}

Failed Sections ({count}):
{list from gate_result.sections where passed = false}

Critical Issues ({count}):
{list from gate_result.issues.critical with item_id, issue, location, fix}

Major Issues ({count}):
{list from gate_result.issues.major with item_id, issue, location, recommendation}

Required Actions (Priority Order):
{prioritized list derived from critical and major issues}

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

---ORCHESTRIX-HANDOFF-BEGIN---
target: architect
command: review-escalation
args: {story_id}
---ORCHESTRIX-HANDOFF-END---

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
- All critical items passed (7/7)
- All required sections passed thresholds
- Zero critical issues
- Decision made: PASS (Step 4)
- Dev Agent Record updated with self-review results (Step 5)

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

- `checklists/gate/dev-implementation-gate.md` - Implementation Gate (unified quality validation engine)
- `tasks/make-decision.md` - Decision execution framework
- `data/decisions/dev-self-review-decision.yaml` - Self-review decision rules
- `data/story-status-transitions.yaml` - Status transition permissions

## Notes

- **DoD Checklist Removed**: Completion steps (Dev Log, Agent Record, Change Log, Status, Handoff) are verified in develop-story.md GATE 2 (dev-completion-steps.md)
- **Single Quality Gate**: dev-implementation-gate.md is the only quality checklist, covering all 10 sections including Documentation
