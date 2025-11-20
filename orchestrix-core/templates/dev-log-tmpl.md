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

## Phase 1: Test-Driven Implementation

[[LLM: Document TDD implementation: contracts, tests, features by priority (P0→P1→P2), decisions, issues]]

### 1.1 Technical Contracts
**Status:** {{contractStatus}} | **Time:** {{contractStartTime}} - {{contractEndTime}}

**Contracts Defined:** {{contractsCreated}}
**Schemas:** {{schemasCreated}}
**Decisions:** {{contractDecisions}}

### 1.2 P0 Features (Critical Path)
**Status:** {{p0Status}} | **Time:** {{p0StartTime}} - {{p0EndTime}}

**Tests Written:** {{p0TestsWritten}} (RED phase)
**Implementation:** {{p0Implementation}} (GREEN phase)
**Refactoring:** {{p0Refactoring}} (REFACTOR phase)
**Tests Passing:** {{p0TestsPassing}}/{{p0TestsTotal}}
**Decisions:** {{p0Decisions}}
**Issues:** {{p0Issues}}

### 1.3 P1 Features (Important)
**Status:** {{p1Status}} | **Time:** {{p1StartTime}} - {{p1EndTime}}

**Tests Written:** {{p1TestsWritten}} (RED phase)
**Implementation:** {{p1Implementation}} (GREEN phase)
**Refactoring:** {{p1Refactoring}} (REFACTOR phase)
**Tests Passing:** {{p1TestsPassing}}/{{p1TestsTotal}}
**Decisions:** {{p1Decisions}}
**Issues:** {{p1Issues}}

### 1.4 P2 Features (Nice-to-Have)
**Status:** {{p2Status}} | **Time:** {{p2StartTime}} - {{p2EndTime}}

**Tests Written:** {{p2TestsWritten}} (RED phase)
**Implementation:** {{p2Implementation}} (GREEN phase)
**Refactoring:** {{p2Refactoring}} (REFACTOR phase)
**Tests Passing:** {{p2TestsPassing}}/{{p2TestsTotal}}
**Decisions:** {{p2Decisions}}
**Issues:** {{p2Issues}}

---

## Phase 2: Quality Assurance

[[LLM: Document integration testing, edge cases, performance optimization, QA prep]]

### 2.1 Integration Testing
**Status:** {{integrationStatus}} | **Time:** {{integrationStartTime}} - {{integrationEndTime}}

**Integration Tests:** {{integrationTests}}
**E2E Workflows:** {{e2eWorkflows}}
**Test Results:** {{integrationResults}}
**Issues:** {{integrationIssues}}

### 2.2 Edge Case Handling
**Status:** {{edgeCaseStatus}} | **Time:** {{edgeCaseStartTime}} - {{edgeCaseEndTime}}

**Edge Cases Tested:** {{edgeCasesTested}}
**Error Handling:** {{errorHandling}}
**Boundary Conditions:** {{boundaryConditions}}
**Issues:** {{edgeCaseIssues}}

### 2.3 Performance Optimization
**Status:** {{performanceStatus}} | **Time:** {{performanceStartTime}} - {{performanceEndTime}}

**Bottlenecks Identified:** {{bottlenecks}}
**Optimizations Applied:** {{optimizations}}
**Performance Results:** {{performanceResults}}
**Issues:** {{performanceIssues}}

### 2.4 QA Review Preparation
**Status:** {{qaRepStatus}} | **Time:** {{qaPrepStartTime}} - {{qaPrepEndTime}}

**All ACs Met:** {{allACsMet}}
**Tests Passing:** {{totalTestsPassing}}/{{totalTestsTotal}}
**Dev Log Complete:** {{devLogComplete}}
**Dev Agent Record Updated:** {{recordUpdated}}

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
