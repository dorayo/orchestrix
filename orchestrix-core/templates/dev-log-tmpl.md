# Dev Log: {{storyId}} - {{storyTitle}}

**Started:** {{startTimestamp}} | **Agent:** {{agentModel}} | **Story:** {{storyId}}

---

## Story Context

[[LLM: Summarize story purpose, key requirements, SM Design context]]

**Title:** {{storyTitle}} | **ID:** {{storyId}} | **SM Design:** {{smDesignPath}}

---

## Test Strategy

[[LLM: Document test approach, design level, priority distribution, focus areas]]

**Level:** {{testDesignLevel}}  
**Priority Distribution:** P0: {{p0Count}} | P1: {{p1Count}} | P2: {{p2Count}}

**Focus Areas:** {{priorityAreas}}  
**Risk Coverage:** {{riskCoverage}}

---

## Phase 1: Setup & Foundation

[[LLM: Document setup: environment, dependencies, foundation code, decisions, issues]]

### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}} | **Time:** {{subtaskStartTime}} - {{subtaskEndTime}}

**Implementation:** {{implementationDetails}}  
**Decisions:** {{keyDecisions}}  
**Issues:** {{issuesEncountered}}

---

## Phase 2: Core Implementation

[[LLM: Document core functionality, business logic, features, technical decisions]]

### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}} | **Time:** {{subtaskStartTime}} - {{subtaskEndTime}}

**Implementation:** {{implementationDetails}}  
**Decisions:** {{keyDecisions}}  
**Issues:** {{issuesEncountered}}

---

## Phase 3: Testing & Validation

[[LLM: Document tests, execution results, bugs, coverage, validation]]

### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}} | **Time:** {{subtaskStartTime}} - {{subtaskEndTime}}

**Implementation:** {{implementationDetails}}  
**Results:** {{testResults}}  
**Issues:** {{issuesEncountered}}

---

## Phase 4: Integration & Finalization

[[LLM: Document integration, adjustments, docs, cleanup, requirement verification]]

### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}} | **Time:** {{subtaskStartTime}} - {{subtaskEndTime}}

**Implementation:** {{implementationDetails}}  
**Decisions:** {{keyDecisions}}  
**Issues:** {{issuesEncountered}}

---

## Resumption Guide

[[LLM: If paused, provide status, next steps, context, blockers]]

**Status:** {{currentStatus}}

**Next Steps:**
1. {{nextStep1}}
2. {{nextStep2}}
3. {{nextStep3}}

**Context:** {{keyContext}}  
**Recent Decisions:** {{recentDecisions}}  
**Blockers:** {{openIssues}}

---

## Feedback to QA

[[LLM: Document test design issues, missing scenarios, coverage concerns for QA review]]

### Item {{feedbackNumber}}

**Type:** {{feedbackType}} | **Severity:** {{severity}} | **Time:** {{feedbackTimestamp}}

**Description:** {{feedbackDescription}}  
**Affected Scenarios:** {{affectedScenarios}}  
**Suggested Action:** {{suggestedAction}}  
**Status:** {{feedbackStatus}}

---

## Feedback to SM

[[LLM: Document unclear AC, ambiguous requirements, blockers. If blocking, set Status=Blocked, output Handoff to SM]]

### Item {{feedbackNumber}}

**Type:** {{feedbackType}} | **Severity:** {{severity}} | **Time:** {{feedbackTimestamp}}

**Description:** {{feedbackDescription}}  
**Affected Requirements:** {{affectedRequirements}}  
**Blocking:** {{isBlocking}}  
**Suggested Clarification:** {{suggestedClarification}}  
**Status:** {{feedbackStatus}}

---

## Deviations from SM Design

[[LLM: Document intentional deviations: reason, impact, arch review needed]]

### {{deviationNumber}}: {{deviationTitle}}

**Description:** {{deviationDescription}}  
**Reason:** {{deviationReason}}  
**Impact:** {{deviationImpact}}  
**Alternative:** {{alternativeApproach}}  
**Arch Review Required:** {{requiresArchReview}}

---

## Final Summary

[[LLM: Summarize implementation: duration, files, tests, achievements, challenges, tech debt]]

**Duration:** {{totalDuration}} | **Completed:** {{completionTimestamp}}

**Files Modified:** {{filesModified}}

**Testing:** Total: {{totalTests}} | Passing: {{passingTests}} | Coverage: {{coveragePercentage}}%

**Achievements:** {{keyAchievements}}  
**Challenges:** {{challengesOvercome}}  
**Tech Debt:** {{technicalDebt}}  
**Future Work:** {{futureRecommendations}}
