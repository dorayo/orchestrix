# SM Story Creation Comprehensive Checklist

This comprehensive checklist implements a **two-phase quality assessment system** for SM story creation:
- **Phase 1: Structure Validation (Gate Condition)** - Must achieve 100% to proceed
- **Phase 2: Technical Quality Assessment (Scoring)** - Only executed if Phase 1 passes

[[LLM: INITIALIZATION INSTRUCTIONS - SM STORY CREATION QUALITY CHECK

CRITICAL TWO-PHASE PROCESS:

PHASE 1: STRUCTURE VALIDATION (GATE CONDITION)
- Execute Section 1 (Structure Validation) first
- Calculate completion rate
- IF completion rate < 100%:
  - IMMEDIATELY set Status = "Blocked"
  - SKIP Phase 2 entirely
  - Generate report with structure issues
  - STOP processing
- IF completion rate = 100%:
  - Proceed to Phase 2

PHASE 2: TECHNICAL QUALITY ASSESSMENT (SCORING)
- Only execute if Phase 1 passed (100%)
- Execute Section 2 (Technical Extraction) - Weight: 50%
- Execute Section 3 (Implementation Readiness) - Weight: 50%
- Check Technical Extraction completion rate >= 80% (hard requirement)
- Calculate Technical Quality Score (0-10)
- Execute Complexity Detection
- Apply Decision Matrix
- Set Status based on matrix

This checklist MUST result in automatic status assignment based on the two-phase evaluation.]]

## Prerequisites

- Story file has been created using story template
- Epic requirements have been extracted
- Architecture documents have been reviewed
- All technical details have been populated in Dev Notes

---

# PHASE 1: STRUCTURE VALIDATION (GATE CONDITION)

[[LLM: This is a GATE CONDITION. Must achieve 100% completion to proceed to Phase 2.
If any item fails, immediately set Status = "Blocked" and stop processing.]]

## Section 1: Structure Validation (Gate Condition - Must be 100%)

[[LLM: Structure validation is a GATE CONDITION. Every item must pass. Mark each as [x] Pass or [ ] Fail.
If ANY item fails, the gate fails and Status must be set to "Blocked" immediately.]]

### 1.1 Template Compliance (4 items)
- [ ] All required template sections are present
- [ ] No placeholders ({{variables}}) remain unfilled
- [ ] Story follows standard template structure
- [ ] Status field is properly set

### 1.2 Acceptance Criteria Coverage (4 items)
- [ ] All ACs have corresponding tasks in Tasks/Subtasks
- [ ] Task-AC mapping is explicit (e.g., "Task 1 (AC: 1, 3)")
- [ ] Tasks logically cover all AC requirements
- [ ] No ACs are left without implementation tasks

### 1.3 Task Sequence & Logic (4 items)
- [ ] Tasks follow logical implementation order
- [ ] Dependencies between tasks are clear and documented
- [ ] No circular dependencies exist
- [ ] Frontend-first strategy applied correctly (if enabled)

**Section 1 Completion Rate: ___% (Passed items / 12 total items)**

**GATE DECISION:**
- [ ] **PASS** (100% completion) → Proceed to Phase 2
- [ ] **FAIL** (< 100% completion) → Status = "Blocked", STOP processing

[[LLM: If FAIL, immediately:
1. Set Status = "Blocked"
2. List all failed items with specific issues
3. Generate report with remediation steps
4. DO NOT proceed to Phase 2
5. DO NOT calculate Technical Quality Score]]

**If FAIL - Failed Items:**
{List each failed item with specific issue and location}

**If FAIL - Required Actions:**
{List specific remediation steps for SM to fix structure issues}

---

# PHASE 2: TECHNICAL QUALITY ASSESSMENT (SCORING)

[[LLM: Only execute this phase if Phase 1 (Structure Validation) achieved 100% completion.
This phase calculates Technical Quality Score (0-10) based on two equally-weighted components.]]

**Phase 2 Execution:** [ ] Executing (Phase 1 passed) / [ ] Skipped (Phase 1 failed)

## Section 2: Technical Extraction Quality (Weight: 50%)

[[LLM: Check that technical information has been accurately extracted from architecture documents. 
Each item must be marked as [x] Done, [ ] Not Done, or [N/A] Not Applicable.
CRITICAL: Calculate completion rate. If < 80%, immediately set Status = "Blocked".]]

### 2.1 Architecture Information Completeness
- [ ] Data models extracted with valid source references
- [ ] API specifications extracted with valid source references  
- [ ] Technology stack verified with valid source references
- [ ] File structure and naming conventions identified
- [ ] Integration points with existing code documented

### 2.2 Technical Preferences Alignment
- [ ] Architecture patterns consistent with technical-preferences.md
- [ ] Technology choices comply with approved standards
- [ ] No conflicting technical decisions introduced
- [ ] Performance and security requirements addressed

### 2.3 Source Reference Verification
- [ ] Every technical detail has format: [Source: docs/architecture/{filename}.md#{section}]
- [ ] All referenced documents exist and are accessible
- [ ] Referenced sections contain the claimed information
- [ ] No invented or assumed technical details present

**Section 2 Score: ___% (Done items / Total applicable items)**
**Section 2 Completion Rate: ___% (Done items / (Total items - N/A items))**

**HARD REQUIREMENT CHECK:**
- [ ] **PASS** (Completion rate ≥ 80%) → Continue scoring
- [ ] **FAIL** (Completion rate < 80%) → Status = "Blocked", STOP processing

[[LLM: If completion rate < 80%, immediately:
1. Set Status = "Blocked"
2. Note: "Technical Extraction completion rate < 80% (hard requirement)"
3. DO NOT calculate final Technical Quality Score
4. DO NOT proceed to Complexity Detection
5. Generate report with missing technical details]]

## Section 3: Implementation Readiness Assessment (Weight: 50%)

[[LLM: Assess whether the story provides sufficient guidance for developer implementation.
Each item must be marked as [x] Done, [ ] Not Done, or [N/A] Not Applicable.]]

### 3.1 Dev Notes Quality
- [ ] Data models are sufficiently detailed for implementation
- [ ] API specifications include all necessary details
- [ ] File locations and naming conventions are explicit
- [ ] Integration points with existing code are clearly identified
- [ ] Error handling and edge cases are addressed

### 3.2 Testing Strategy
- [ ] Required testing approach is outlined
- [ ] Key test scenarios are identified
- [ ] Testing follows testing-strategy.md standards
- [ ] Test integrity requirements are documented

### 3.3 Developer Implementability
- [ ] Implementation steps are logically sequenced
- [ ] Required tools and technologies are specified
- [ ] Configuration and setup requirements are documented
- [ ] Story can be implemented without extensive additional research

**Section 3 Score: ___% (Done items / Total applicable items)**

---

## Technical Quality Score Calculation

[[LLM: Calculate the Technical Quality Score using the weighted average of Phase 2 sections.
Only execute if Phase 1 passed (100%) AND Section 2 completion rate ≥ 80%.]]

**NEW Scoring Formula (Two-Phase System):**
```
Technical Quality Score = (
  Section 2 (Technical Extraction) × 0.50 +
  Section 3 (Implementation Readiness) × 0.50
)
```

**Note:** Structure Validation (Section 1) is now a gate condition, not part of the score.

**Calculation:**
- Section 2 (Technical Extraction): ___% × 0.50 = ___
- Section 3 (Implementation Readiness): ___% × 0.50 = ___
- **Technical Quality Score: ___/10**

**Quality Score Status:**
- [ ] Calculated successfully
- [ ] Not calculated (Phase 1 failed)
- [ ] Not calculated (Technical Extraction < 80%)

---

# DECISION MATRIX APPLICATION

[[LLM: Apply the decision matrix to automatically assign story status based on Technical Quality Score and Complexity Indicators.
Only execute if both Phase 1 and Phase 2 completed successfully.]]

## Prerequisite Checks Summary

**Before applying Decision Matrix, verify:**

1. **Phase 1 (Structure Validation):**
   - [ ] PASSED (100% completion)
   - [ ] FAILED (< 100% completion) → Status = "Blocked", STOP

2. **Phase 2 - Technical Extraction Hard Requirement:**
   - [ ] PASSED (≥ 80% completion rate)
   - [ ] FAILED (< 80% completion rate) → Status = "Blocked", STOP

3. **Technical Quality Score:**
   - [ ] Calculated: ___/10
   - [ ] Not calculated (prerequisites failed)

**If any prerequisite failed, Status = "Blocked" and Decision Matrix is NOT applied.**

---

## ARCHITECT REVIEW PRIORITY PRINCIPLE

[[LLM: CRITICAL COORDINATION RULE - READ THIS FIRST BEFORE APPLYING DECISION MATRIX

This principle ensures efficient coordination between Architect and QA:

**The Rule:**
- Architect review ALWAYS happens BEFORE test design when both are needed
- If Architect review is required → Set Status = AwaitingArchReview, do NOT evaluate test design yet
- After Architect approval → Re-evaluate test design level and set appropriate status
- This prevents wasted test design effort if Architect requires revisions

**When Architect Review is Required:**
- Quality Score 6.0-7.9 (any complexity), OR
- Quality Score ≥ 8.0 AND Complexity ≥ 2

**When to Evaluate Test Design Immediately:**
- Quality Score ≥ 8.0 AND Complexity ≤ 1 (no Architect review needed)

**Implementation in Decision Matrix:**
- If Architect review required → Status = AwaitingArchReview, Test Design Level = "Deferred"
- If no Architect review → Evaluate test design level immediately and set appropriate status

This principle is implemented throughout the Decision Matrix below.]]

---

## Decision Matrix (Technical Quality Score + Complexity Indicators + Test Design Level)

[[LLM: Apply this matrix only if all prerequisites passed.
The matrix uses Technical Quality Score (0-10), Complexity Indicators count (0-7), and Test Design Level to determine Status.

CRITICAL COORDINATION PRINCIPLE - ARCHITECT REVIEW PRIORITY:
- Architect review ALWAYS happens BEFORE test design when needed
- If Architect review is required, set Status = AwaitingArchReview (do NOT check test design yet)
- After Architect approval, THEN evaluate test design level and set appropriate status
- This ensures architectural validation happens first, preventing wasted test design effort

The matrix now includes test design routing to ensure QA test design happens before development when needed.]]

### High Quality (Score ≥ 8.0)

**Complexity 0 indicators:**
- **Architect Review Decision:** NOT_NEEDED (skip Architect review)
- **Test Design Level:** Simple (NotRequired) - evaluated immediately since no Architect review
- **Status:** `TestDesignComplete`
- **Reasoning:** High quality + low complexity + no security = skip both Architect review and test design
- **Metadata:** quality_level: "excellent", risk_level: "low", test_design: "not_required"
- **Next Step:** Dev can implement immediately
- **Coordination Note:** No Architect review needed, test design level evaluated immediately

**Complexity 1 indicator:**
- **Architect Review Decision:** OPTIONAL (skip Architect review by default)
- **Test Design Level:** Standard (if quality < 8.5) or Simple (if quality ≥ 8.5 and no security) - evaluated immediately since no Architect review
- **Status:** `AwaitingTestDesign` (if Standard) or `TestDesignComplete` (if Simple)
- **Reasoning:** High quality with single complexity point = optional arch review (skip by default), test design based on quality threshold
- **Metadata:** quality_level: "excellent", risk_level: "low-medium"
- **Recommendation:** Consider arch review to validate complexity point (but not required)
- **Next Step:** 
  - If Simple: Dev can implement
  - If Standard: QA executes `test-design` task
- **Coordination Note:** No Architect review by default, test design level evaluated immediately

**Complexity 2+ indicators:**
- **Architect Review Decision:** RECOMMENDED (Architect review required)
- **Test Design Level:** Standard or Comprehensive (if security sensitive) - NOT evaluated yet, will be evaluated after Architect approval
- **Status:** `AwaitingArchReview`
- **Reasoning:** High quality but high complexity = Architect review FIRST (priority principle), test design evaluation deferred
- **Metadata:** quality_level: "excellent", risk_level: "medium", test_design: "deferred"
- **Recommendation:** Strongly recommend review to ensure architectural consistency
- **Next Step:** Architect reviews first
- **After Arch Review:** Re-evaluate test design level, then transition to `AwaitingTestDesign` or `TestDesignComplete`
- **Coordination Note:** ARCHITECT REVIEW PRIORITY - Test design level will be determined AFTER Architect approval

### Medium Quality (Score 6.0-7.9)

**Complexity 0 indicators:**
- **Architect Review Decision:** RECOMMENDED (Architect review required)
- **Test Design Level:** Standard - NOT evaluated yet, will be evaluated after Architect approval
- **Status:** `AwaitingArchReview`
- **Reasoning:** Medium quality + low complexity = Architect review FIRST to improve quality (priority principle), test design evaluation deferred
- **Metadata:** quality_level: "good", risk_level: "medium", test_design: "deferred"
- **Recommendation:** Review can help improve technical accuracy
- **Next Step:** Architect reviews first
- **After Arch Review:** Re-evaluate test design level, then transition to `AwaitingTestDesign`
- **Coordination Note:** ARCHITECT REVIEW PRIORITY - Test design level will be determined AFTER Architect approval

**Complexity 1-2 indicators:**
- **Architect Review Decision:** RECOMMENDED (Architect review required)
- **Test Design Level:** Standard - NOT evaluated yet, will be evaluated after Architect approval
- **Status:** `AwaitingArchReview`
- **Reasoning:** Medium quality + moderate complexity = Architect review FIRST (priority principle), test design evaluation deferred
- **Metadata:** quality_level: "good", risk_level: "medium-high", test_design: "deferred"
- **Recommendation:** Must review to ensure technical feasibility
- **Next Step:** Architect reviews first
- **After Arch Review:** Re-evaluate test design level, then transition to `AwaitingTestDesign`
- **Coordination Note:** ARCHITECT REVIEW PRIORITY - Test design level will be determined AFTER Architect approval

**Complexity 3+ indicators:**
- **Architect Review Decision:** RECOMMENDED (Architect review required)
- **Test Design Level:** Comprehensive - NOT evaluated yet, will be evaluated after Architect approval
- **Status:** `AwaitingArchReview`
- **Reasoning:** Medium quality + high complexity = Architect review FIRST (priority principle), test design evaluation deferred
- **Metadata:** quality_level: "good", risk_level: "high", test_design: "deferred"
- **Recommendation:** Critical to review before proceeding
- **Next Step:** Architect reviews first
- **After Arch Review:** Re-evaluate test design level, then transition to `AwaitingTestDesign` for comprehensive testing
- **Coordination Note:** ARCHITECT REVIEW PRIORITY - Test design level will be determined AFTER Architect approval

### Low Quality (Score < 6.0)

**Any complexity:**
- **Architect Review Decision:** N/A (quality too low for review)
- **Test Design Level:** N/A (not evaluated)
- **Status:** `Blocked`
- **Reasoning:** Low quality = must revise first, neither Architect review nor test design applicable yet
- **Metadata:** quality_level: "insufficient", risk_level: "high"
- **Required Action:** SM must revise and resubmit
- **Coordination Note:** Must improve quality before any coordination with Architect or QA

---

### Test Design Routing Summary

**CRITICAL COORDINATION PRINCIPLE:**
- **Architect review ALWAYS happens BEFORE test design when needed**
- If Architect review is required → Set Status = `AwaitingArchReview`, do NOT evaluate test design yet
- After Architect approval → Re-evaluate test design level and set appropriate status
- This prevents wasted test design effort if Architect requires revisions

**The Decision Matrix routes Stories with the following coordination sequence:**

1. **Simple Level (Skip Both Architect Review and Test Design):**
   - Complexity = 0 AND Quality ≥ 8.5 AND No Security
   - Architect Review: NOT_NEEDED
   - Test Design: Evaluated immediately (Simple level)
   - Status: `TestDesignComplete` → Direct to Dev
   - Coordination: No Architect review, no test design needed

2. **Standard Level (May Need Architect Review First):**
   - Complexity = 1-2 OR Quality = 7.0-8.4
   - **If Architect review needed (Quality 6.0-7.9 OR Complexity ≥ 2):**
     - Status: `AwaitingArchReview` (test design NOT evaluated yet)
     - After Architect approval → Re-evaluate test design → `AwaitingTestDesign`
   - **If no Architect review needed (Quality ≥ 8.0 AND Complexity = 1):**
     - Test Design: Evaluated immediately (Standard level)
     - Status: `AwaitingTestDesign`
   - QA Task: `test-design`
   - Coordination: Architect review FIRST if needed, then test design

3. **Comprehensive Level (Architect Review Required First):**
   - Complexity ≥ 3 OR Security Sensitive
   - Architect Review: RECOMMENDED (required)
   - Test Design: NOT evaluated yet (deferred until after Architect approval)
   - Status: `AwaitingArchReview` → (after approval) → `AwaitingTestDesign`
   - QA Tasks: `test-design` + `risk-profile`
   - Coordination: Architect review FIRST (priority), then comprehensive test design

**Status Flow with Architect Review Priority and Test Design:**
```
COORDINATION PRINCIPLE: Architect Review → Test Design → Development

Path 1: Architect Review Required (Quality 6.0-7.9 OR Complexity ≥ 2)
─────────────────────────────────────────────────────────────────
Blocked (quality < 6.0)
    ↓ (revise)
AwaitingArchReview (Architect review FIRST - test design NOT evaluated yet)
    ↓ (arch approved)
[Re-evaluate test design level based on Story metadata]
    ↓
AwaitingTestDesign (Standard or Comprehensive level)
    ↓ (test design complete)
TestDesignComplete
    ↓
Approved → InProgress → Review → Done

Path 2: No Architect Review (Quality ≥ 8.0 AND Complexity ≤ 1)
─────────────────────────────────────────────────────────────────
[Evaluate test design level immediately]
    ↓
AwaitingTestDesign (Standard level, if Complexity = 1 AND Quality < 8.5)
    ↓ (test design complete)
TestDesignComplete
    ↓
Approved → InProgress → Review → Done

Path 3: Skip Both (Quality ≥ 8.5 AND Complexity = 0 AND No Security)
─────────────────────────────────────────────────────────────────
TestDesignComplete (Simple level - no Architect review, no test design)
    ↓
Approved → InProgress → Review → Done
```

---

## Final Status Assignment

[[LLM: Based on the Decision Matrix, assign the final status including test design routing.]]

**Input Values:**
- Technical Quality Score: ___/10
- Complexity Indicators Detected: ___ / 7
- Test Design Level: _______________ (Simple / Standard / Comprehensive)
- Security Sensitive: [ ] Yes / [ ] No

**Decision Matrix Result:**
- **Final Status:** `_______________` (Blocked / AwaitingArchReview / AwaitingTestDesign / TestDesignComplete)
- **Test Design Level:** `_______________` (Simple / Standard / Comprehensive / N/A)
- **Test Design Status:** `_______________` (NotRequired / Pending / N/A)
- **Architect Review Recommendation:** _______________ (NOT_NEEDED / OPTIONAL / RECOMMENDED / N/A)
- **Reasoning:** {Explanation based on score, complexity, and test design level}
- **Quality Level:** {excellent / good / insufficient}
- **Risk Level:** {low / low-medium / medium / medium-high / high}

**Status Assignment Logic Applied (Updated with Architect Review Priority and Test Design Routing):**
```
CRITICAL: Architect Review ALWAYS happens BEFORE Test Design when needed

IF Structure Validation < 100%:
    Status = "Blocked"
    Reason = "Structure validation failed"
    
ELIF Technical Extraction < 80%:
    Status = "Blocked"
    Reason = "Technical extraction completion rate < 80%"
    
ELIF Technical Quality Score < 6.0:
    Status = "Blocked"
    Reason = "Technical quality score below minimum threshold"
    
ELIF Technical Quality Score >= 8.0 AND Complexity = 0 AND NOT SecuritySensitive:
    # No Architect review needed, evaluate test design immediately
    Test Design Level = "Simple"
    Status = "TestDesignComplete"
    Arch Review = "NOT_NEEDED"
    Reason = "High quality + no complexity + no security = skip both Architect review and test design"
    
ELIF Technical Quality Score >= 8.0 AND Complexity = 1:
    # No Architect review needed, evaluate test design immediately
    Arch Review = "OPTIONAL" (skip by default)
    IF Quality >= 8.5 AND NOT SecuritySensitive:
        Test Design Level = "Simple"
        Status = "TestDesignComplete"
    ELSE:
        Test Design Level = "Standard"
        Status = "AwaitingTestDesign"
    Reason = "High quality + low complexity = skip Architect review, evaluate test design immediately"
    
ELIF Technical Quality Score >= 8.0 AND Complexity >= 2:
    # Architect review REQUIRED - do NOT evaluate test design yet
    Status = "AwaitingArchReview"
    Arch Review = "RECOMMENDED"
    Test Design Level = "Deferred" (will be determined after Architect approval)
    Reason = "High quality but high complexity = Architect review FIRST (priority principle)"
    Note = "After Architect approval, re-evaluate test design level and transition to AwaitingTestDesign or TestDesignComplete"
    
ELIF Technical Quality Score 6.0-7.9:
    # Architect review REQUIRED - do NOT evaluate test design yet
    Status = "AwaitingArchReview"
    Arch Review = "RECOMMENDED"
    Test Design Level = "Deferred" (will be determined after Architect approval)
    Reason = "Medium quality = Architect review FIRST to improve quality (priority principle)"
    Note = "After Architect approval, re-evaluate test design level and transition to AwaitingTestDesign"
```

**Next Steps Based on Status (Following Architect Review Priority Principle):**
- **Blocked:** SM must revise Story to address issues, then re-run quality check
- **AwaitingArchReview:** Architect should execute `review-story-technical-accuracy` task
  - **CRITICAL:** Test design level is NOT evaluated yet (deferred until after Architect approval)
  - After Architect approval, SM will re-evaluate test design level from Story metadata
  - Then Story will transition to `AwaitingTestDesign` or `TestDesignComplete` based on re-evaluation
  - **Coordination:** Architect review FIRST, test design SECOND
- **AwaitingTestDesign:** QA should execute test design tasks:
  - Standard level: `test-design {story-id}`
  - Comprehensive level: `test-design {story-id}` AND `risk-profile {story-id}`
  - After completion, Story will transition to `TestDesignComplete`
  - **Coordination:** This status is only set AFTER Architect approval (if review was needed)
- **TestDesignComplete:** Dev can begin implementation with `implement-story` task
  - **Coordination:** This status means both Architect review (if needed) and test design (if needed) are complete

---

# COMPLEXITY INDICATOR DETECTION

[[LLM: Analyze Story content to detect complexity indicators.
Only execute if Phase 2 (Technical Quality Assessment) completed successfully.
Results are used in Decision Matrix to determine final Status.]]

**Purpose:** Detect complexity factors that influence whether Architect review is needed, even for high-quality Stories.

**When to Execute:** After calculating Technical Quality Score, before applying Decision Matrix.

**Execution Status:**
- [ ] Executing (Phase 2 completed)
- [ ] Skipped (Phase 1 or Phase 2 failed)

### Detection Process

Analyze Story content for the following 7 complexity indicators:

#### Indicator 1: API Contract Changes

**Detection Pattern:**
- **Dev Notes** mention: "endpoint", "API", "REST", "GraphQL", "request", "response", "route", "controller"
- **Tasks** include: API implementation, endpoint creation, schema definition, API documentation
- **Acceptance Criteria** reference: API behavior, data formats, HTTP methods, status codes

**Example Triggers:**
- "Create new POST /api/users endpoint"
- "Modify response schema for GET /api/products"
- "Add authentication to existing API"
- "Update API contract to include new fields"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 2: Database Schema Modifications

**Detection Pattern:**
- **Dev Notes** mention: "database", "schema", "migration", "table", "column", "index", "foreign key", "relationship"
- **Tasks** include: schema changes, migration scripts, data model updates, entity modifications
- **Data Models** section shows: new entities, relationship changes, field additions/modifications

**Example Triggers:**
- "Add new 'orders' table"
- "Modify 'users' table to include 'role' column"
- "Create foreign key relationship between tables"
- "Add index on 'email' column for performance"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 3: New Architectural Patterns

**Detection Pattern:**
- **Dev Notes** mention: "new pattern", "different approach", "alternative architecture", "design pattern", "architectural change"
- **Tasks** include: implementing patterns not referenced in architecture docs, introducing new architectural concepts
- **Technical Preferences** section notes: deviations or new approaches not in existing architecture

**Example Triggers:**
- "Implement event-driven pattern for notifications"
- "Use CQRS pattern for order processing"
- "Introduce microservice for payment handling"
- "Apply repository pattern for data access"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 4: Cross-Service Dependencies

**Detection Pattern:**
- **Dev Notes** mention: multiple services, service integration, inter-service communication, "service A calls service B"
- **Tasks** include: calling external services, service orchestration, API integration with other services
- **Integration** section shows: dependencies on other services, service-to-service communication

**Example Triggers:**
- "Integrate with payment service API"
- "Call user service to validate permissions"
- "Coordinate between order and inventory services"
- "Subscribe to events from notification service"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 5: Security-Sensitive Operations

**Detection Pattern:**
- **Dev Notes** mention: "authentication", "authorization", "encryption", "security", "permissions", "PII", "access control", "JWT", "OAuth"
- **Tasks** include: security implementation, access control, data protection, credential handling
- **Acceptance Criteria** reference: security requirements, permission checks, data privacy

**Example Triggers:**
- "Implement JWT authentication"
- "Add role-based access control"
- "Encrypt sensitive user data"
- "Validate user permissions before data access"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 6: Performance-Critical Features

**Detection Pattern:**
- **Dev Notes** mention: "performance", "optimization", "caching", "high-traffic", "real-time", "scalability", "load", "throughput"
- **Tasks** include: performance optimization, caching strategies, query optimization, load handling
- **Non-functional Requirements** reference: performance targets, response time requirements, throughput goals

**Example Triggers:**
- "Optimize query for 10k+ records"
- "Implement Redis caching for user sessions"
- "Handle real-time updates via WebSocket"
- "Support 1000 concurrent users"

**Detection:** [ ] Detected / [ ] Not Detected

#### Indicator 7: Core Architecture Document Modifications

**Detection Pattern:**
- **Dev Notes** reference: modifications to core architecture docs (data-models.md, rest-api-spec.md, tech-stack.md, etc.)
- **Tasks** include: updating architecture documentation, modifying core specifications
- **Story** explicitly mentions: architecture changes, document updates

**Example Triggers:**
- "Update data-models.md with new entity"
- "Modify rest-api-spec.md to add endpoints"
- "Change tech-stack.md to include new library"
- "Update architecture diagram with new component"

**Detection:** [ ] Detected / [ ] Not Detected

---

### Complexity Scoring

**Total Indicators Detected:** ___ / 7

**Detected Indicators List:**
{For each detected indicator, provide brief explanation of what was found and where}

---

## TEST DESIGN LEVEL DETERMINATION

[[LLM: Determine the test design level based on complexity, quality score, and security sensitivity.
This determination affects the Decision Matrix routing and whether QA test design is required before development.
Execute this after Complexity Detection and before applying Decision Matrix.

CRITICAL COORDINATION RULE:
- If Architect review is required (Quality 6.0-7.9 OR Complexity ≥ 2), do NOT finalize test design level yet
- Mark test design level as "Deferred" and set Status = AwaitingArchReview
- Test design level will be re-evaluated AFTER Architect approval
- This follows the Architect Review Priority Principle]]

**Purpose:** Determine whether QA test design is required and at what level (Simple/Standard/Comprehensive).

**When to Execute:** After Complexity Detection, before Decision Matrix application.

**When to Defer:** If Architect review is required, mark as "Deferred" and re-evaluate after Architect approval.

**Configuration Reference:** `core-config.yaml` → `qa.testDesignThresholds`

### Test Design Level Logic

Evaluate the following criteria in order:

#### Level 1: Simple (No Test Design Required)

**Criteria (ALL must be true):**
- [ ] Complexity Indicators = 0
- [ ] Technical Quality Score ≥ 8.5
- [ ] Security Sensitive = false (no security-sensitive operations detected)

**If ALL criteria met:**
- **Test Design Level:** `Simple`
- **Test Design Status:** `NotRequired`
- **QA Tasks:** None (skip test design)
- **Reasoning:** Low complexity + high quality + no security concerns = standard testing sufficient

**Evaluation:** [ ] Meets Simple criteria / [ ] Does not meet

---

#### Level 2: Standard (Basic Test Design Required)

**Criteria (ANY must be true):**
- [ ] Complexity Indicators = 1-2
- [ ] Technical Quality Score = 7.0-8.4
- [ ] Does not meet Simple criteria but not Comprehensive

**If criteria met:**
- **Test Design Level:** `Standard`
- **Test Design Status:** `Pending`
- **QA Tasks:** `test-design`
- **Reasoning:** Moderate complexity or quality requires structured test planning

**Evaluation:** [ ] Meets Standard criteria / [ ] Does not meet

---

#### Level 3: Comprehensive (Full Test Design + Risk Profile Required)

**Criteria (ANY must be true):**
- [ ] Complexity Indicators ≥ 3
- [ ] Security Sensitive = true (security-sensitive operations detected)
- [ ] High risk factors present

**If criteria met:**
- **Test Design Level:** `Comprehensive`
- **Test Design Status:** `Pending`
- **QA Tasks:** `test-design` + `risk-profile`
- **Reasoning:** High complexity or security sensitivity requires comprehensive test strategy and risk assessment

**Evaluation:** [ ] Meets Comprehensive criteria / [ ] Does not meet

---

### Test Design Level Determination Result

**Input Values:**
- Complexity Indicators: ___ / 7
- Technical Quality Score: ___/10
- Security Sensitive: [ ] Yes / [ ] No

**Determination Logic Applied (with Architect Review Priority):**
```
# First check if Architect review is required
IF Quality 6.0-7.9 OR (Quality >= 8.0 AND Complexity >= 2):
    # Architect review required - defer test design level determination
    Level = "Deferred"
    Status = "Deferred"
    Tasks = ["Will be determined after Architect approval"]
    Note = "Test design level will be re-evaluated after Architect approval"
    
# If no Architect review needed, evaluate test design level immediately
ELIF Complexity = 0 AND Quality ≥ 8.5 AND NOT SecuritySensitive:
    Level = "Simple"
    Status = "NotRequired"
    Tasks = []
    
ELIF Complexity ≥ 3 OR SecuritySensitive:
    Level = "Comprehensive"
    Status = "Pending"
    Tasks = ["test-design", "risk-profile"]
    
ELSE:
    Level = "Standard"
    Status = "Pending"
    Tasks = ["test-design"]
```

**Result:**
- **Test Design Level:** `_______________` (Simple / Standard / Comprehensive / Deferred)
- **Test Design Status:** `_______________` (NotRequired / Pending / Deferred)
- **Required QA Tasks:** {list tasks or "None" or "Deferred until after Architect approval"}
- **Reasoning:** {Explanation based on criteria evaluation}
- **Coordination Note:** {If Deferred: "Test design level will be re-evaluated after Architect approval per priority principle"}

**This determination will be used in the Decision Matrix to route the Story appropriately.**

**If Deferred:** The test design level is not finalized yet. After Architect approval, SM will:
1. Re-read the Story metadata (test design level may have been updated by Architect)
2. Re-evaluate test design level using the same logic above
3. Set Status to `AwaitingTestDesign` or `TestDesignComplete` based on re-evaluation

---

### Architect Review Recommendation

[[LLM: This recommendation is now automatically determined by the Decision Matrix.
The matrix considers both Technical Quality Score and Complexity Indicators count.
This section documents the recommendation for reference.]]

**Recommendation is determined by Decision Matrix:**

The Decision Matrix automatically assigns Architect Review recommendation based on:
- Technical Quality Score (0-10)
- Complexity Indicators count (0-7)

**Recommendation Levels:**

1. **NOT_NEEDED**
   - Condition: Score ≥ 8.0 AND Complexity = 0
   - Status: `Approved`
   - Reasoning: High quality + no complexity = standard implementation

2. **OPTIONAL**
   - Condition: Score ≥ 8.0 AND Complexity = 1
   - Status: `Approved`
   - Reasoning: High quality with single complexity point = review may add value but not critical

3. **RECOMMENDED**
   - Conditions:
     - Score ≥ 8.0 AND Complexity ≥ 2, OR
     - Score 6.0-7.9 (any complexity)
   - Status: `AwaitingArchReview`
   - Reasoning: Either high complexity or medium quality warrants expert validation

4. **N/A**
   - Condition: Score < 6.0
   - Status: `Blocked`
   - Reasoning: Quality too low, must revise before considering review

**Current Recommendation:** {Will be set by Decision Matrix}

**Next Steps:**
- **If NOT_NEEDED or OPTIONAL:** Story proceeds to `Approved` status, Dev can implement
- **If RECOMMENDED:** Story set to `AwaitingArchReview`, Architect should execute `review-story-technical-accuracy`
- **If N/A:** Story set to `Blocked`, SM must revise



---

# QUALITY CHECK SUMMARY REPORT

[[LLM: Generate a comprehensive summary report using the two-phase assessment results.]]

```markdown
## Story Quality Check Report (Two-Phase Assessment)

**Story:** {epicNum}.{storyNum} - {storyTitle}
**Validation Date:** {timestamp}
**Validator:** SM Agent (Two-Phase Comprehensive Checklist)

---

### Phase 1: Structure Validation (Gate Condition)

**Result:** {PASS / FAIL}
**Completion Rate:** {rate}% (must be 100% to proceed)

**Items Checked:** 12 total
- Template Compliance: {pass/fail count}
- Acceptance Criteria Coverage: {pass/fail count}
- Task Sequence & Logic: {pass/fail count}

{If FAIL:}
**Failed Items:**
1. {specific item with issue description}
2. {specific item with issue description}

**Required Actions:**
- {specific remediation step}
- {specific remediation step}

**Phase 2 Execution:** {Skipped due to Phase 1 failure / Proceeded}

---

### Phase 2: Technical Quality Assessment

{If Phase 1 passed:}

**Technical Quality Score:** {score}/10

**Score Breakdown:**
- Technical Extraction: {score}% × 0.50 = {weighted_score}
- Implementation Readiness: {score}% × 0.50 = {weighted_score}

**Technical Extraction Completion Rate:** {rate}%
- **Hard Requirement (≥80%):** {PASS / FAIL}

{If Technical Extraction < 80%:}
**⚠️ CRITICAL:** Technical extraction completion rate below 80% threshold.
**Missing Technical Details:**
- {specific missing item}
- {specific missing item}

---

### Complexity Analysis

**Detected Indicators:** {count} / 7

**Indicators Checklist:**
- [X/  ] API Contract Changes
- [X/  ] Database Schema Modifications
- [X/  ] New Architectural Patterns
- [X/  ] Cross-Service Dependencies
- [X/  ] Security-Sensitive Operations
- [X/  ] Performance-Critical Features
- [X/  ] Core Architecture Document Modifications

**Detected Details:**
{For each detected indicator:}
- **{Indicator name}:** {What was detected and where (Dev Notes/Tasks/AC)}

---

### Test Design Level Determination

**Input Values:**
- Complexity Indicators: {count}/7
- Technical Quality Score: {score}/10
- Security Sensitive: {Yes / No}

**Determination:**
- **Test Design Level:** `{Simple / Standard / Comprehensive}`
- **Test Design Status:** `{NotRequired / Pending}`
- **Required QA Tasks:** {None / test-design / test-design + risk-profile}
- **Reasoning:** {Explanation based on test design criteria}

---

### Decision Matrix Result

**Input Values:**
- Technical Quality Score: {score}/10
- Complexity Indicators: {count}/7
- Test Design Level: {Simple / Standard / Comprehensive}

**Decision:**
- **Final Status:** `{Blocked / AwaitingArchReview / AwaitingTestDesign / TestDesignComplete}`
- **Test Design Level:** `{Simple / Standard / Comprehensive / N/A}`
- **Test Design Status:** `{NotRequired / Pending / N/A}`
- **Architect Review:** {NOT_NEEDED / OPTIONAL / RECOMMENDED / N/A}
- **Quality Level:** {excellent / good / insufficient}
- **Risk Level:** {low / low-medium / medium / medium-high / high}

**Reasoning:** {Explanation based on decision matrix logic including test design routing}

---

### Critical Issues (if any)

{If Status = Blocked:}
1. {issue with specific location and remediation}
2. {issue with specific location and remediation}

{If no critical issues:}
No critical issues detected.

---

### Recommendations

{Based on status and findings:}
- {specific actionable recommendation}
- {specific actionable recommendation}

---

### Next Steps

**Based on Status: `{Status}`**

{If Blocked:}
- [ ] SM must revise Story to address structure/quality issues
- [ ] Re-run quality check after revision
- [ ] Address all failed items listed above

{If AwaitingArchReview:}
- [ ] Architect should execute `review-story-technical-accuracy` task
- [ ] Review will validate {count} complexity indicators
- [ ] Review results will be appended to Story file

{If Approved:}
- [ ] Dev can begin implementation with `implement-story` task
- [ ] {If complexity > 0:} Monitor for architectural concerns during implementation
- [ ] {If Arch Review = OPTIONAL:} Consider requesting Architect review if issues arise

---

### Handoff Message

{Generate appropriate handoff message based on status:}

{If Blocked:}
```
Story blocked due to quality issues. SM must revise and resubmit.
```

{If AwaitingArchReview:}
```
Next: Architect please execute command `review-story {story_id}`
Note: After arch review, Story will transition to AwaitingTestDesign for QA test design.
```

{If AwaitingTestDesign:}
```
Next: QA please execute command `test-design {story_id}`
{If Comprehensive level or SecuritySensitive:}
Also execute: `risk-profile {story_id}`
```

{If TestDesignComplete:}
```
Next: Dev please execute command `implement-story {story_id}`
{If test design documents exist:}
Note: Review test design document at qa/assessments/{story-id}-test-design-{date}.md
```
```

---

# STORY FILE UPDATES

[[LLM: Update the story file with quality check results from the two-phase assessment.]]

## Required Updates

### 1. Update Status Field

Set the Status field to the value determined by the Decision Matrix:
- `Blocked` - if Phase 1 failed OR Technical Extraction < 80% OR Technical Quality Score < 6.0
- `AwaitingArchReview` - if score 6.0-7.9 OR (score ≥8.0 AND complexity ≥2) OR (score ≥8.0 AND complexity =1 with medium quality)
- `Approved` - if score ≥8.0 AND complexity 0-1

### 2. Add/Update Quality Assessment Metadata Section

Add this section to the Story file (after Status field, before main content):

```yaml
---
Quality Assessment Metadata:
  assessment_date: {timestamp}
  assessment_version: "two-phase-v1-with-test-design"
  
  phase_1_structure_validation:
    result: {PASS / FAIL}
    completion_rate: {rate}%
    failed_items: [{list if any}]
  
  phase_2_technical_quality:
    executed: {true / false}
    technical_quality_score: {score}/10
    technical_extraction_score: {score}%
    technical_extraction_completion_rate: {rate}%
    implementation_readiness_score: {score}%
  
  complexity_analysis:
    total_indicators_detected: {count}
    detected_indicators:
      - {indicator_name}: {brief description}
      - {indicator_name}: {brief description}
  
  test_design_determination:
    test_design_level: {Simple / Standard / Comprehensive}
    test_design_status: {NotRequired / Pending}
    required_qa_tasks: [{list of tasks or empty}]
    security_sensitive: {true / false}
    reasoning: {explanation}
  
  decision_matrix_result:
    final_status: {Blocked / AwaitingArchReview / AwaitingTestDesign / TestDesignComplete}
    test_design_level: {Simple / Standard / Comprehensive / N/A}
    architect_review_recommendation: {NOT_NEEDED / OPTIONAL / RECOMMENDED / N/A}
    quality_level: {excellent / good / insufficient}
    risk_level: {low / low-medium / medium / medium-high / high}
    reasoning: {explanation}
---
```

### 3. Update Architect Review Metadata Section

Update or add this section:

```yaml
Architect Review Metadata:
  review_required: {true / false}
  review_recommendation: {NOT_NEEDED / OPTIONAL / RECOMMENDED / N/A}
  complexity_indicators_count: {count}
  detected_indicators: [{list}]
  review_round: 0  # Will be incremented when Architect reviews
  review_status: {PENDING / NOT_REQUIRED / COMPLETED}
```

### 4. Add Change Log Entry

Add an entry to the Change Log section:

```markdown
## Change Log

### {timestamp} - SM Quality Check (Two-Phase Assessment with Test Design)
- **Phase 1 (Structure Validation):** {PASS / FAIL} ({rate}%)
- **Phase 2 (Technical Quality):** {Executed / Skipped} - Score: {score}/10
- **Complexity Indicators:** {count}/7 detected
- **Test Design Level:** {Simple / Standard / Comprehensive}
- **Test Design Status:** {NotRequired / Pending}
- **Status Set:** `{Status}`
- **Architect Review:** {recommendation}
- **Reasoning:** {brief explanation}
```

### 5. Add Handoff Message (at end of Story file)

Add the appropriate handoff message based on status:

```markdown
---

## Next Steps

{If Blocked:}
**Status:** `Blocked`
**Action Required:** SM must revise Story to address quality issues and re-run quality check.

{If AwaitingArchReview:}
**Status:** `AwaitingArchReview`
**Test Design Level:** `{Simple / Standard / Comprehensive}`
**Next:** Architect please execute command `review-story {story_id}`
**After Arch Review:** Story will transition to `AwaitingTestDesign` for QA test design.

{If AwaitingTestDesign:}
**Status:** `AwaitingTestDesign`
**Test Design Level:** `{Standard / Comprehensive}`
**Next:** QA please execute command `test-design {story_id}`
{If Comprehensive or SecuritySensitive:}
**Also Execute:** `risk-profile {story_id}`

{If TestDesignComplete:}
**Status:** `TestDesignComplete`
**Test Design Level:** `{Simple / Standard / Comprehensive}`
**Next:** Dev please execute command `implement-story {story_id}`
{If test design documents exist:}
**Test Design Document:** qa/assessments/{story-id}-test-design-{date}.md
{If risk profile exists:}
**Risk Profile Document:** qa/assessments/{story-id}-risk-{date}.md
```

---

## Update Guidelines

**CRITICAL RULES:**
1. Only update Status, Quality Assessment Metadata, Architect Review Metadata, QA Test Design Metadata, Change Log, and Next Steps sections
2. Do NOT modify Story content, Acceptance Criteria, Tasks, or Dev Notes
3. Preserve all existing Story information
4. Use exact status values: `Blocked`, `AwaitingArchReview`, `AwaitingTestDesign`, `TestDesignComplete`
5. Include all metadata fields for audit trail including test design determination
6. Generate handoff message in standardized format with test design routing information