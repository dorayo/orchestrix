# SM Story Creation Comprehensive Checklist

This comprehensive checklist consolidates all quality checks for SM story creation, including technical extraction, structure checks, and quality assessment.

[[LLM: INITIALIZATION INSTRUCTIONS - SM STORY CREATION QUALITY CHECK

Execute all sections systematically and calculate final quality score for automatic status decision.

CRITICAL: This checklist MUST result in automatic status assignment based on scoring.]]

## Prerequisites

- Story file has been created using story template
- Epic requirements have been extracted
- Architecture documents have been reviewed
- All technical details have been populated in Dev Notes

## Section 1: Technical Extraction Check (Weight: 40%)

[[LLM: Check that technical information has been accurately extracted from architecture documents. Each item must be marked as [x] Done, [ ] Not Done, or [N/A] Not Applicable.]]

### 1.1 Architecture Information Completeness
- [ ] Data models extracted with valid source references
- [ ] API specifications extracted with valid source references  
- [ ] Technology stack verified with valid source references
- [ ] File structure and naming conventions identified
- [ ] Integration points with existing code documented

### 1.2 Technical Preferences Alignment
- [ ] Architecture patterns consistent with technical-preferences.md
- [ ] Technology choices comply with approved standards
- [ ] No conflicting technical decisions introduced
- [ ] Performance and security requirements addressed

### 1.3 Source Reference Verification
- [ ] Every technical detail has format: [Source: docs/architecture/{filename}.md#{section}]
- [ ] All referenced documents exist and are accessible
- [ ] Referenced sections contain the claimed information
- [ ] No invented or assumed technical details present

**Section 1 Score: ___% (Done items / Total applicable items)**

## Section 2: Story Structure Check (Weight: 30%)

[[LLM: Check story structure and template compliance.]]

### 2.1 Template Compliance
- [ ] All required template sections are present
- [ ] No placeholders ({{variables}}) remain unfilled
- [ ] Story follows standard template structure
- [ ] Status field is properly set

### 2.2 Acceptance Criteria Coverage
- [ ] All ACs have corresponding tasks in Tasks/Subtasks
- [ ] Task-AC mapping is explicit (e.g., "Task 1 (AC: 1, 3)")
- [ ] Tasks logically cover all AC requirements
- [ ] No ACs are left without implementation tasks

### 2.3 Task Sequence & Logic
- [ ] Tasks follow logical implementation order
- [ ] Dependencies between tasks are clear and documented
- [ ] No circular dependencies exist
- [ ] Frontend-first strategy applied correctly (if enabled)

**Section 2 Score: ___% (Done items / Total applicable items)**

## Section 3: Implementation Readiness Assessment (Weight: 30%)

[[LLM: Assess whether the story provides sufficient guidance for developer implementation.]]

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

## Quality Score Calculation

[[LLM: Calculate the final quality score using the weighted average of all sections.]]

**Scoring Formula:**
```
Quality Score = (
  Section 1 Score × 0.40 +
  Section 2 Score × 0.30 +
  Section 3 Score × 0.30
)
```

**Calculation:**
- Section 1 (Technical Extraction): ___% × 0.40 = ___
- Section 2 (Structure Validation): ___% × 0.30 = ___  
- Section 3 (Implementation Readiness): ___% × 0.30 = ___
- **Total Quality Score: ___/10**

## Automatic Status Decision

[[LLM: Apply the decision matrix to automatically assign story status.]]

**Decision Matrix:**

| Quality Score | Status | Next Action | Rationale |
|--------------|--------|-------------|-----------|
| **≥ 8.0** | **Approved** | Ready for Dev implementation | High quality, minimal risk |
| **6.0 - 7.9** | **Draft** | Recommend Architect review | Medium quality, needs expert validation |
| **< 6.0** | **Blocked** | Return to SM for revision | Low quality, high risk |

**Special Override Rules:**
- If Section 1 (Technical Extraction) < 80%: Automatic **Blocked** (regardless of total score)
- If Section 2 (Structure Validation) < 70%: Automatic **Blocked**
- If any section has > 3 critical issues: Automatic **Blocked**

**Final Status Assignment: _______________**

## Quality Check Summary Report

[[LLM: Generate a comprehensive summary report.]]

```markdown
## Story Quality Check Report

**Story:** {epicNum}.{storyNum} - {storyTitle}
**Validation Date:** {timestamp}
**Validator:** SM Agent (Comprehensive Checklist)

### Quality Score Breakdown
- Technical Extraction: {score}% (weight: 40%)
- Structure Validation: {score}% (weight: 30%)
- Implementation Readiness: {score}% (weight: 30%)
- **Total Quality Score: {total}/10**

### Status Decision
- **Final Status:** {Approved/Draft/Blocked}
- **Rationale:** {explanation based on decision matrix}

### Critical Issues (if any)
1. {issue with specific location}
2. {issue with specific location}

### Recommendations
- {specific actionable recommendation}
- {specific actionable recommendation}

### Next Steps
- [ ] {action based on status}
- [ ] {action based on status}
```

## Story File Updates

[[LLM: Update the story file with quality check results.]]

**Required Updates:**
1. **Update Status field** to the assigned status (Approved/Draft/Blocked)
2. **Add SM Quality Check Summary section** with:
   - Quality Score: {score}/10
   - Status: {Approved/Draft/Blocked}
   - Check Date: {timestamp}
   - Critical Issues: {count}
   - Recommendations: {summary}

**CRITICAL:** Only update the Status field and add the SM Quality Check Summary section. Do not modify Story content, Acceptance Criteria, or other sections.