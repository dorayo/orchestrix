# Dev Log: {{storyId}}

**Story:** {{storyId}} | **Started:** {{startTimestamp}} | **Agent:** {{agentModel}}

---

## Implementation

[[LLM: For each AC, apply TDD: write failing test → implement → refactor. Document progress below.]]

### AC {{acNumber}}: {{acTitle}}

**Test:** {{testFile}}:{{testLine}}
**Implementation:** {{implFile}}
**Status:** {{acStatus}}

---

## Test Results

**Total:** {{totalTests}} | **Passing:** {{passingTests}} | **Coverage:** {{coveragePercentage}}%

---

## Blockers

[[LLM: Document issues that block progress. Format: issue → resolution or escalation]]

---

## Feedback to SM

[[LLM: Document unclear AC, ambiguous requirements. If blocking, set Status=Blocked, output Handoff to SM]]

---

## Feedback to QA

[[LLM: Document test design issues, missing scenarios, coverage concerns]]

---

## Deviations from SM Design

[[LLM: Document intentional deviations: reason, impact, arch review needed]]

---

## Resumption Guide

[[LLM: Update ONLY when: HALT condition, user pause, or before self-review]]

**Current:** {{currentTask}}
**Next:** {{nextTask}}
**Blockers:** {{openBlockers}}

---

## Final Summary

**Duration:** {{totalDuration}} | **Completed:** {{completionTimestamp}}
**Files Modified:** {{filesModified}}
**Tests:** {{passingTests}}/{{totalTests}} | **Coverage:** {{coveragePercentage}}%
