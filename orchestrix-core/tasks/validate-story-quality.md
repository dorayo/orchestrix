# validate-story-quality

> **⚠️ DEPRECATED**: This task has been superseded by the unified checklist system.  
> **Recommended**: Use `execute-checklist.md` with `scoring/sm-story-quality.md` for complete story validation.  
> **Status**: Kept for backward compatibility. May be removed in future versions.

Self-validation task for story quality exclusively for SM Agents to ensure that the created story meets strict quality standards.

## Purpose

After the SM Agent completes story creation, conduct comprehensive quality validation to ensure the story has sufficient technical accuracy, implementation guidance, and test verifiability, thereby preventing development and testing difficulties caused by poor story quality.

## Prerequisites

* The story file has been created (status: Draft)
* The SM Agent has completed the `create-next-story` task
* `scoring/sm-story-quality.md` has been executed and meets the minimum standards

## Validation Process

### 1. Load and Review Created Story

- Load the created story file: `{devStoryLocation}/{epicNum}.{storyNum}.story.md`
- Verify basic story structure completeness
- Confirm all required sections are populated

### 2. Technical Extraction Verification Review

**CRITICAL**: Review the technical extraction checklist completion:

- Locate the `scoring/sm-story-quality.md` results from story creation
- **Mandatory Requirements:**
  - Completion rate MUST be > 80% (Done items / Total applicable items)
  - All technical details in Dev Notes MUST have corresponding checklist verification
  - No technical assumptions should be marked as "Not Done" without valid justification
- **If verification fails:** 
  - Mark story status as "Blocked - Technical Verification Incomplete"
  - Document specific gaps in story notes
  - Recommend returning to architecture document review

### 3. Dev Notes Quality Assessment

Execute comprehensive Dev Notes quality check:

#### 3.1 Source Reference Verification
- [ ] Every technical detail has a valid source reference: `[Source: architecture/{filename}.md#{section}]`
- [ ] All referenced documents exist and are accessible
- [ ] Referenced sections contain the claimed information
- [ ] No "invented" or assumed technical details are present

#### 3.2 Implementation Guidance Completeness
- [ ] Data models are sufficiently detailed for implementation
- [ ] API specifications include all necessary details (endpoints, parameters, responses)
- [ ] File locations and naming conventions are explicit
- [ ] Integration points with existing code are clearly identified
- [ ] Error handling and edge cases are addressed

#### 3.3 Technical Consistency Check
- [ ] All technology choices align with `technical-preferences.md`
- [ ] Architecture patterns are consistent with project standards
- [ ] No conflicting technical decisions are present
- [ ] Performance and security requirements are appropriately considered

### 4. Acceptance Criteria and Testing Alignment

Verify that acceptance criteria are implementable and testable:

#### 4.1 Acceptance Criteria Quality
- [ ] Each acceptance criterion is specific and measurable
- [ ] Success conditions are clearly defined
- [ ] Edge cases and error scenarios are covered
- [ ] Criteria align with epic goals and business requirements

#### 4.2 Testing Strategy Validation
- [ ] Test approach is appropriate for the story complexity
- [ ] Unit test requirements are clearly defined
- [ ] Integration test needs are identified (if applicable)
- [ ] Test data requirements are specified
- [ ] Performance testing needs are considered (if applicable)

### 5. Implementation Risk Assessment

Identify and document potential implementation risks:

#### 5.1 Technical Risk Analysis
- **Complexity Risk**: Assess if the story is too complex for a single implementation cycle
- **Dependency Risk**: Identify external dependencies that might block implementation
- **Integration Risk**: Evaluate complexity of integrating with existing systems
- **Performance Risk**: Assess if performance requirements are achievable with proposed approach

#### 5.2 Risk Mitigation Recommendations
- Document specific risks identified
- Suggest risk mitigation strategies
- Recommend story splitting if complexity is too high
- Flag items requiring architect or expert consultation

### 6. Developer Implementability Test

**Critical Assessment**: Could a competent developer agent implement this story as written?

#### 6.1 Implementation Path Clarity
- [ ] Implementation steps are logically sequenced
- [ ] Dependencies between tasks are clear
- [ ] Required tools and technologies are specified
- [ ] Configuration and setup requirements are documented

#### 6.2 Potential Developer Questions
Identify questions a developer might have:
- Technical implementation details that are unclear
- Architecture decisions that need justification
- Integration patterns that are not well documented
- Testing approaches that are ambiguous

### 7. Quality Score Calculation and Recommendation

Calculate overall story quality score:

```
Quality Score = (
  Technical Extraction Score (30%) +
  Dev Notes Quality Score (25%) +
  Acceptance Criteria Score (20%) +
  Implementation Guidance Score (15%) +
  Risk Management Score (10%)
) / 5

Scoring Scale:
- 9-10: Excellent (Ready for implementation)
- 7-8: Good (Minor improvements recommended)
- 5-6: Adequate (Significant improvements needed)
- 1-4: Poor (Major revision required)
```

### 8. Final Validation Recommendations

Based on assessment results, provide specific recommendations:

#### For High-Quality Stories (Score 8+):
- Update story status to "Approved" 
- Document story as ready for developer assignment
- Note any minor enhancement opportunities

#### For Medium-Quality Stories (Score 6-7):
- Keep status as "Draft"
- Document specific improvement areas
- Provide actionable recommendations for enhancement
- Suggest targeted architecture consultation if needed

#### For Low-Quality Stories (Score < 6):
- Mark story status as "Blocked - Quality Issues"
- Document critical gaps and risks
- Recommend returning to architecture review phase
- Suggest involvement of architect or domain expert

### 9. Validation Report Generation

Generate comprehensive validation report:

```markdown
# Story Quality Validation Report

**Story:** {epicNum}.{storyNum} - {storyTitle}
**Validation Date:** {timestamp}
**Validator:** SM Agent (Self-Validation)

## Validation Summary
- Overall Quality Score: {score}/10
- Recommendation: {APPROVED/NEEDS_IMPROVEMENT/BLOCKED}
- Critical Issues: {count}
- Minor Issues: {count}

## Technical Extraction Results
- Completion Rate: {percentage}%
- Verified Technical Details: {count}
- Missing Source References: {count}
- Technical Assumptions Flagged: {count}

## Implementation Readiness Assessment
- Implementation Path Clarity: {score}/10
- Technical Risk Level: {LOW/MEDIUM/HIGH}
- Estimated Developer Questions: {count}
- Recommended Story Complexity: {SIMPLE/MODERATE/COMPLEX}

## Recommendations
1. {recommendation}
2. {recommendation}
3. {recommendation}

## Next Steps
- {action_item}
- {action_item}
```

### 10. Story Status Update and Handoff

Based on validation results:

- **If APPROVED**: Update story status and prepare for development assignment
- **If NEEDS_IMPROVEMENT**: Document improvement plan and assign back to SM Agent
- **If BLOCKED**: Escalate to architect or domain expert with specific gap documentation

## Quality Gates

This validation process enforces the following quality gates:

1. **Technical Accuracy Gate**: >80% technical extraction completion required
2. **Implementation Guidance Gate**: All technical details must have source references
3. **Risk Management Gate**: High-risk items must have mitigation strategies
4. **Developer Readiness Gate**: Story must be implementable without extensive additional research

**CRITICAL**: Stories that fail any quality gate cannot proceed to development phase and must be revised or escalated for expert consultation.

---

## 9. Comprehensive Quality Scoring & Status Decision

### 9.1 Collect Validation Results

**Input Sources:**
1. **Technical Extraction Score** (from scoring/sm-story-quality.md)
   - Completion Rate: ___% (must be >80%)
   - Critical Issues: ___

2. **Structure Validation Result** (from story-draft-checklist)
   - Result: PASS / FAIL
   - Issues Found: ___

3. **Implementation Readiness** (from current task Sections 1-8)
   - Dev Notes Quality: ___/10
   - Anti-Hallucination Score: ___/10
   - Developer Readiness: ___/10

### 9.2 Calculate Quality Score

**Scoring Formula:**
```
Quality Score = (
  Technical Extraction Score × 0.40 +
  Structure Validation Score × 0.30 +
  Implementation Readiness Score × 0.30
)

Where:
- Technical Extraction Score = Completion Rate (e.g., 85% = 8.5/10)
- Structure Validation Score = PASS: 10/10, FAIL: 0/10
- Implementation Readiness = Average of (Dev Notes + Anti-Hallucination + Developer Readiness)
```

**Example Calculation:**
```
Technical Extraction: 85% = 8.5/10
Structure Validation: PASS = 10/10
Implementation Readiness: (8 + 9 + 7) / 3 = 8.0/10

Quality Score = 8.5×0.4 + 10×0.3 + 8.0×0.3 = 3.4 + 3.0 + 2.4 = 8.8/10
```

### 9.3 Automatic Status Decision

**Decision Matrix:**

| Quality Score | Status | Next Action | Rationale |
|--------------|--------|-------------|-----------|
| **≥ 8.0** | **Approved** | Ready for Dev implementation | High quality, minimal risk |
| **6.0 - 7.9** | **Draft** | Recommend Architect review | Medium quality, needs expert validation |
| **< 6.0** | **Blocked** | Return to SM for revision | Low quality, high risk |

**Special Rules:**
- If Technical Extraction < 80%: Automatic **Blocked** (regardless of total score)
- If Structure Validation = FAIL: Automatic **Blocked**
- If Critical Issues > 3: Automatic **Blocked**

### 9.3.5 Complexity Indicator Detection

**Purpose:** Analyze Story content to detect complexity indicators that may warrant Architect review, even for high-quality Stories.

**When to Execute:** After calculating Quality Score (Section 9.2) and before generating final report (Section 9.4).

**Detection Process:**

Before generating the final report, analyze Story content for the following 7 complexity indicators:

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

**Detection Logic:**
```
IF (dev_notes OR tasks OR acceptance_criteria) contains API-related keywords
THEN indicator_1 = TRUE
ELSE indicator_1 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks OR data_models) contains database schema keywords
THEN indicator_2 = TRUE
ELSE indicator_2 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks) mentions new/different patterns NOT in architecture docs
THEN indicator_3 = TRUE
ELSE indicator_3 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks OR integration_section) mentions multiple services or service dependencies
THEN indicator_4 = TRUE
ELSE indicator_4 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks OR acceptance_criteria) contains security-related keywords
THEN indicator_5 = TRUE
ELSE indicator_5 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks OR nfr_section) contains performance-related keywords
THEN indicator_6 = TRUE
ELSE indicator_6 = FALSE
```

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

**Detection Logic:**
```
IF (dev_notes OR tasks) mentions modifications to architecture documents
THEN indicator_7 = TRUE
ELSE indicator_7 = FALSE
```

---

#### Complexity Scoring Logic

**Calculate Total Indicators:**
```
total_indicators = sum([
  indicator_1,  # API Contract Changes
  indicator_2,  # Database Schema Modifications
  indicator_3,  # New Architectural Patterns
  indicator_4,  # Cross-Service Dependencies
  indicator_5,  # Security-Sensitive Operations
  indicator_6,  # Performance-Critical Features
  indicator_7   # Core Architecture Document Modifications
])

Range: 0-7 indicators
```

#### Recommendation Logic

**Generate Architect Review Recommendation:**
```
IF total_indicators >= 2:
    recommendation = "RECOMMENDED"
    reasoning = "Multiple complexity indicators detected suggest architectural review would be beneficial"

ELIF total_indicators == 1 AND quality_score >= 8.0:
    recommendation = "OPTIONAL"
    reasoning = "Single complexity indicator with high quality score - review is optional but may provide value"

ELIF total_indicators == 1 AND quality_score < 8.0:
    recommendation = "RECOMMENDED"
    reasoning = "Complexity indicator detected with medium quality score - review recommended for validation"

ELSE:  # total_indicators == 0
    recommendation = "NOT_NEEDED"
    reasoning = "No complexity indicators detected - standard implementation, no architectural review needed"
```

#### Output Format

**Complexity Analysis Result:**
```markdown
### Complexity Analysis
**Detected Indicators:** {total_indicators} / 7

**Indicators Checklist:**
- [X/  ] API Contract Changes
- [X/  ] Database Schema Modifications
- [X/  ] New Architectural Patterns
- [X/  ] Cross-Service Dependencies
- [X/  ] Security-Sensitive Operations
- [X/  ] Performance-Critical Features
- [X/  ] Core Architecture Document Modifications

**Detected Details:**
{For each detected indicator, provide brief explanation of what was found}

**Recommendation:** {RECOMMENDED / OPTIONAL / NOT_NEEDED}
**Reasoning:** {explanation based on indicators and quality score}
```

---

### 9.4 Generate Final Report

```markdown
## Story Quality Validation Report

**Story:** {epicNum}.{storyNum} - {storyTitle}
**Validation Date:** {timestamp}
**Validator:** SM Agent (Automated)

### Quality Score Breakdown
- Technical Extraction: {score}/10 (weight: 40%)
- Structure Validation: {score}/10 (weight: 30%)
- Implementation Readiness: {score}/10 (weight: 30%)
- **Total Quality Score: {total}/10**

### Status Decision
- **Recommended Status:** {Approved/Draft/Blocked}
- **Rationale:** {explanation}

### Complexity Analysis
**Detected Indicators:** {total_indicators} / 7

**Indicators Checklist:**
- [X/  ] API Contract Changes
- [X/  ] Database Schema Modifications
- [X/  ] New Architectural Patterns
- [X/  ] Cross-Service Dependencies
- [X/  ] Security-Sensitive Operations
- [X/  ] Performance-Critical Features
- [X/  ] Core Architecture Document Modifications

**Detected Details:**
{For each detected indicator, provide brief explanation:}
- {Indicator name}: {What was detected and where (Dev Notes/Tasks/AC)}

**Architect Review Recommendation:** {RECOMMENDED / OPTIONAL / NOT_NEEDED}

**Reasoning:** {Explanation based on detected indicators and quality score}

**Decision Guide:**
- **RECOMMENDED**: 2+ indicators detected OR 1 indicator with quality score 6.0-7.9
  - Architectural review would provide significant value
  - Complex changes that benefit from expert validation
  
- **OPTIONAL**: 1 indicator detected AND quality score ≥8.0
  - High quality implementation with single complexity factor
  - Review may provide additional insights but not critical
  
- **NOT_NEEDED**: 0 indicators detected
  - Standard implementation following existing patterns
  - No architectural concerns identified

**Next Steps for Architect Review:**
- To trigger review: Execute task `review-story-technical-accuracy`
- To skip review: Document decision reason in Story metadata
- All decisions will be recorded for audit purposes

### Critical Issues (if any)
1. {issue}
2. {issue}

### Recommendations
- {recommendation}
- {recommendation}

### Next Steps
- [ ] {action}
- [ ] {action}
```

### 9.5 Update Story File

**Automatically update Story status based on decision:**
- If Approved: Set `Status: Approved` in story file
- If Draft: Set `Status: Draft`, add note "Architect review recommended"
- If Blocked: Set `Status: Blocked`, document blocking issues

**Add validation summary to story file:**
```markdown
## SM Validation Summary
- Quality Score: {score}/10
- Status: {Approved/Draft/Blocked}
- Validation Date: {timestamp}
- Issues: {count} critical, {count} minor
``` 