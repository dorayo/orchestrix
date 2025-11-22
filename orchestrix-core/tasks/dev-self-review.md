# Dev Self-Review

## Purpose

Comprehensive self-review before marking story as Review. This is a MANDATORY gate that enforces quality standards before QA review.

## Prerequisites

- Story implementation complete (all tasks checked)
- All tests passing
- Lint checks passing
- Dev Log completed with Final Summary

## Validation

**Execute**: `{root}/tasks/utils/validate-agent-permission.md`

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

- Story file from `{devStoryLocation}/{epic}.{story}.*.md`
- Dev Log from `{devLogLocation}/{story-id}-dev-log.md`
- Architecture documents (as needed)
- API contracts (if multi-repo)
- QA test design (if exists)

### 2. Execute Implementation Gate Checklist

**MANDATORY GATE**: Must pass ≥95% threshold to proceed

Execute: `{root}/tasks/execute-checklist.md`
Checklist: `{root}/checklists/validation/dev-implementation-gate.md`

**On Failure (<95%)**:
- Log failed items in Dev Log
- Status remains InProgress
- Document gaps and action items
- HALT - DO NOT proceed to Review

**On Success (≥95%)**:
- Log result in Dev Agent Record
- Proceed to next validation steps

### 3. Validate Architecture Compliance

Execute: `{root}/tasks/validate-implementation.md`

**Validation Areas**:
- Tech stack compliance
- Naming conventions
- File structure alignment
- API pattern consistency (if applicable)
- Data model alignment (if applicable)

**On Issues Found**:
- If Critical: HALT, fix before proceeding
- If Major: Document in Dev Log, consider fixing
- If Minor: Document, can proceed

### 4. Validate API Contracts (Multi-Repo Only)

**Only if** `project.mode = 'multi-repo'` AND `project.multi_repo.role ∈ {backend, frontend, ios, android}`:

Execute: `{root}/tasks/utils/validate-api-contract.md`

**Backend Stories** (provides_apis):
- Verify request/response schemas match api-contracts.md
- Check all required fields present with correct types
- Validate error handling for all error codes
- Verify authentication/authorization implementation

**Frontend/Mobile Stories** (consumes_apis):
- Verify request payloads match contract schemas
- Check response handling for all status codes
- Validate error message display
- Verify loading states and error states

**On Mismatch**:
- CRITICAL: HALT, fix contract violations
- Document in Dev Log with specific mismatches
- Update implementation to match contracts

### 5. Test Integrity Validation

**Check Git Diff** for test file modifications:

```bash
git diff --name-only | grep -E "test|spec"
```

**For each modified test file**:
1. Review assertions/expectations changes
2. Check if expectations were weakened (RED FLAG)
3. Verify business justification exists in Dev Log
4. Confirm changes are requirement-driven, not implementation-driven

**On Test Weakening**:
- CRITICAL: HALT
- Restore original test expectations
- Fix implementation instead
- Document rationale if legitimate requirement change

### 7. Implementation Rounds Tracking

**Read from Dev Agent Record**: `implementation_rounds` (default: 1)

**If ≥3 rounds**:
- Review previous QA feedback
- Identify recurring issue patterns
- Consider if architectural issue exists
- If same issue type for 3 rounds: RECOMMEND escalation to Architect
- Document in Dev Log: "Round {N} implementation - recurring issues: {list}"

### 8. Generate Self-Review Report

**Update Dev Agent Record** with self-review results:

```yaml
self_review:
  date: {timestamp}
  implementation_gate_score: {percentage}
  architecture_compliance: {PASS/FAIL}
  api_contract_compliance: {PASS/FAIL/N_A}
  test_integrity: {PASS/FAIL}
  critical_issues_found: {count}
  ready_for_qa: {true/false}
  round: {implementation_round}
```

### 9. Decision Point

**Execute**: `{root}/tasks/make-decision.md`

**Decision type**: `dev-self-review-decision`

**Context**:
```yaml
decision_type: dev-self-review-decision
context:
  implementation_gate_score: {percentage}
  architecture_compliance: {PASS/FAIL}
  api_contract_compliance: {PASS/FAIL/N_A}
  test_integrity: {PASS/FAIL}
  critical_issues: {count}
  implementation_round: {number}
  previous_round_issues: [{array of issue types if round > 1}]
```

**Outcomes**:

**PASS** (All gates passed, no critical issues):
- Status remains InProgress (will be set to Review by implement-story)
- Return to implement-story completion flow
- Proceed with status update to Review

**FAIL** (Any gate <95% OR critical issues OR test integrity fail):
- HALT
- Status remains InProgress
- Output detailed gap report
- List action items to fix
- DO NOT mark as Review

**ESCALATE** (≥3 rounds with recurring issues):
- HALT
- Status = Escalated
- Output escalation report
- Handoff to Architect
- Document recurring issue patterns

## Output

### On PASS

```
✅ SELF-REVIEW PASSED
Story: {story_id} ready for QA review
Implementation Gate: {score}% | Test Integrity: PASS
Round: {N}

⚠️⚠️⚠️ CRITICAL - READ THIS ⚠️⚠️⚠️

Self-review validation PASSED, but task is NOT complete yet.

YOU MUST NOW:
1. Return to implement-story.md
2. Execute GATE 2: Completion Steps Checklist
3. Update Dev Agent Record (7 fields)
4. Update Change Log
5. Update Story Status to "Review"
6. Output handoff message as FINAL action

DO NOT:
❌ Stop here and consider task done
❌ Output handoff message now (too early)
❌ Skip completion checklist
❌ Forget to update story status

NEXT STEP: Continue to implement-story.md GATE 2
```

**Return control to implement-story.md** - Caller MUST execute completion checklist next.

### On FAIL

```
❌ SELF-REVIEW FAILED
Story: {story_id} not ready for QA review
Status: InProgress (remains)

Issues Found:
- Implementation Gate: {score}% (Required: ≥95%)
- Architecture Compliance: {issues_list}
- API Contract: {violations_list}
- Test Integrity: {concerns_list}

Action Items:
1. {action_item_1}
2. {action_item_2}
...

Fix issues and re-run *self-review before marking Review.
```

### On ESCALATE

```
🚨 ESCALATED - RECURRING ISSUES
Story: {story_id} → Status: Escalated
Round: {N} (≥3 rounds with similar issues)

Recurring Issue Patterns:
- {pattern_1}: Occurred in rounds {x, y, z}
- {pattern_2}: Occurred in rounds {x, y}

Previous QA Feedback:
- Round {N-1}: {summary}
- Round {N-2}: {summary}

Recommendation: Architectural review needed

🎯 HANDOFF TO architect: *review-escalation {story_id}
```

## Blocking Conditions

- Missing Dev Log or incomplete
- No tests written
- Tests not passing
- Lint errors present
- Critical architecture violations
- API contract mismatches (multi-repo)
- Test integrity violations

## Completion Criteria

- Implementation gate checklist: ≥95%
- Architecture compliance: PASS
- API contract compliance: PASS (or N/A)
- Test integrity: PASS
- Self-review report generated
- Dev Agent Record updated
- Decision made: PASS/FAIL/ESCALATE

## Key Principles

- **Quality over speed**: Better to halt now than rework later
- **Test integrity is sacred**: Never weaken tests to pass
- **Architecture compliance is mandatory**: No shortcuts
- **API contracts are binding**: Exact match required (multi-repo)
- **Honest self-assessment**: Report issues, don't hide them
- **Continuous improvement**: Learn from previous rounds

## References

- `tasks/execute-checklist.md`
- `tasks/validate-implementation.md`
- `tasks/make-decision.md`
- `tasks/utils/validate-api-contract.md`
- `checklists/validation/dev-implementation-gate.md`
- `data/story-status-transitions.yaml`
- `data/decisions/dev-self-review-decision.yaml`
