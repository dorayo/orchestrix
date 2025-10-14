# Dev Log: {{storyId}} - {{storyTitle}}

**Started:** {{startTimestamp}}  
**Agent Model:** {{agentModel}}  
**Story ID:** {{storyId}}

---

## Story Context

[[LLM: Provide a brief summary of the story being implemented, including its purpose, key requirements, and any important context from the SM Design document.]]

**Story Title:** {{storyTitle}}  
**Story ID:** {{storyId}}  
**SM Design Reference:** {{smDesignPath}}

---

## Test Strategy Summary

[[LLM: Document the overall testing approach for this story, including test design level, priority distribution, and key areas of focus.]]

**Test Design Level:** {{testDesignLevel}}  
**Test Priority Distribution:**
- P0 (Critical): {{p0Count}} tests
- P1 (Important): {{p1Count}} tests
- P2 (Nice-to-have): {{p2Count}} tests

**Priority Testing Areas:**
{{priorityAreas}}

**Risk Coverage:**
{{riskCoverage}}

---

## Phase 1: Setup & Foundation

[[LLM: Document all setup activities, including environment preparation, dependency installation, and foundational code structure. For each subtask, include implementation details, key decisions, and any issues encountered.]]

### Subtask Logs

#### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}}  
**Started:** {{subtaskStartTime}}  
**Completed:** {{subtaskEndTime}}

**Implementation Details:**
{{implementationDetails}}

**Key Decisions:**
{{keyDecisions}}

**Issues Encountered:**
{{issuesEncountered}}

---

## Phase 2: Core Implementation

[[LLM: Document the main implementation work, including core functionality, business logic, and primary features. For each subtask, capture what was built, how it was implemented, and any significant technical decisions.]]

### Subtask Logs

#### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}}  
**Started:** {{subtaskStartTime}}  
**Completed:** {{subtaskEndTime}}

**Implementation Details:**
{{implementationDetails}}

**Key Decisions:**
{{keyDecisions}}

**Issues Encountered:**
{{issuesEncountered}}

---

## Phase 3: Testing & Validation

[[LLM: Document all testing activities, including test implementation, test execution results, and any bugs found and fixed. Include coverage metrics and validation outcomes.]]

### Subtask Logs

#### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}}  
**Started:** {{subtaskStartTime}}  
**Completed:** {{subtaskEndTime}}

**Implementation Details:**
{{implementationDetails}}

**Test Results:**
{{testResults}}

**Issues Encountered:**
{{issuesEncountered}}

---

## Phase 4: Integration & Finalization

[[LLM: Document integration work, final adjustments, documentation updates, and any cleanup activities. Include verification that all requirements are met.]]

### Subtask Logs

#### {{subtaskId}}: {{subtaskTitle}}
**Status:** {{subtaskStatus}}  
**Started:** {{subtaskStartTime}}  
**Completed:** {{subtaskEndTime}}

**Implementation Details:**
{{implementationDetails}}

**Key Decisions:**
{{keyDecisions}}

**Issues Encountered:**
{{issuesEncountered}}

---

## Resumption Guide

[[LLM: If work is paused or interrupted, provide clear guidance for resuming. Include current status, immediate next steps, critical context, and any blockers.]]

**Current Status:** {{currentStatus}}

**Next Steps:**
1. {{nextStep1}}
2. {{nextStep2}}
3. {{nextStep3}}

**Key Context to Remember:**
{{keyContext}}

**Recent Decisions:**
{{recentDecisions}}

**Open Issues/Blockers:**
{{openIssues}}

---

## Feedback to QA

[[LLM: Document any feedback for the QA Agent regarding test design issues, missing test scenarios, or concerns about test coverage. This feedback will be reviewed by QA during their next review cycle.]]

### Feedback Item {{feedbackNumber}}

**Feedback Type:** {{feedbackType}}  
**Severity:** {{severity}}  
**Timestamp:** {{feedbackTimestamp}}

**Description:**
{{feedbackDescription}}

**Affected Test Scenarios:**
{{affectedScenarios}}

**Suggested Action:**
{{suggestedAction}}

**Status:** {{feedbackStatus}}

---

## Feedback to SM

[[LLM: Document any feedback for the SM Agent regarding unclear Acceptance Criteria, ambiguous requirements, or blocking issues. If AC is unclear or ambiguous, set Story Status = Blocked and output Handoff message to SM.]]

### Feedback Item {{feedbackNumber}}

**Feedback Type:** {{feedbackType}}  
**Severity:** {{severity}}  
**Timestamp:** {{feedbackTimestamp}}

**Description:**
{{feedbackDescription}}

**Affected Requirements:**
{{affectedRequirements}}

**Blocking Implementation:** {{isBlocking}}

**Suggested Clarification:**
{{suggestedClarification}}

**Status:** {{feedbackStatus}}

---

## Deviations from SM Design

[[LLM: Document any intentional deviations from the SM Design document. Include the reason for each deviation, its impact, and whether it requires architecture review.]]

### Deviation {{deviationNumber}}: {{deviationTitle}}

**Description:**
{{deviationDescription}}

**Reason:**
{{deviationReason}}

**Impact:**
{{deviationImpact}}

**Alternative Approach:**
{{alternativeApproach}}

**Requires Architecture Review:** {{requiresArchReview}}

---

## Final Summary

[[LLM: Provide a comprehensive summary of the entire implementation, including duration, files modified, testing outcomes, achievements, challenges faced, and any technical debt incurred.]]

**Total Duration:** {{totalDuration}}  
**Completed:** {{completionTimestamp}}

**Files Modified:**
{{filesModified}}

**Testing Summary:**
- Total Tests: {{totalTests}}
- Tests Passing: {{passingTests}}
- Coverage: {{coveragePercentage}}%

**Key Achievements:**
{{keyAchievements}}

**Challenges Overcome:**
{{challengesOvercome}}

**Technical Debt Incurred:**
{{technicalDebt}}

**Recommendations for Future Work:**
{{futureRecommendations}}
