# validate-story-quality

> **⚠️ DEPRECATED**: This task has been superseded by the unified checklist system.  
> **Recommended**: Use `execute-checklist.md` with `sm-story-creation-comprehensive-checklist.md` for complete story validation.  
> **Status**: Kept for backward compatibility. May be removed in future versions.

Self-validation task for story quality exclusively for SM Agents to ensure that the created story meets strict quality standards.

## Purpose

After the SM Agent completes story creation, conduct comprehensive quality validation to ensure the story has sufficient technical accuracy, implementation guidance, and test verifiability, thereby preventing development and testing difficulties caused by poor story quality.

## Prerequisites

* The story file has been created (status: Draft)
* The SM Agent has completed the `create-next-story` task
* `sm-technical-extraction-checklist` has been executed and meets the minimum standards

## Validation Process

### 1. Load and Review Created Story

- Load the created story file: `{devStoryLocation}/{epicNum}.{storyNum}.story.md`
- Verify basic story structure completeness
- Confirm all required sections are populated

### 2. Technical Extraction Verification Review

**CRITICAL**: Review the technical extraction checklist completion:

- Locate the `sm-technical-extraction-checklist` results from story creation
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
1. **Technical Extraction Score** (from sm-technical-extraction-checklist)
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