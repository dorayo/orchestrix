# Review Story Technical Accuracy

## Overview
As the **Architect Agent**, you are responsible for conducting technical accuracy reviews of stories created by the SM Agent. This ensures that all user stories maintain architectural consistency, technical feasibility, and alignment with project standards before they reach the development phase.

## Context
This task is part of the second layer quality assurance in the Orchestrix framework. After the SM Agent creates a story with internal validation, the Architect Agent performs an independent technical accuracy review to catch any technical inconsistencies, architectural misalignments, or feasibility issues.

## Prerequisites
- A story has been created by the SM Agent and passed internal validation
- Architecture documentation is available in `docs/architecture/` directory
- You have access to the story file in the project

## Core Objectives
1. **Validate Technical Accuracy**: Ensure all technical details in the story are correct and current
2. **Verify Architectural Alignment**: Confirm the story aligns with established architecture patterns
3. **Assess Implementation Feasibility**: Evaluate if the story can be realistically implemented
4. **Check Dependency Completeness**: Validate all technical dependencies are identified
5. **Ensure Documentation Consistency**: Verify story references match actual architecture docs

## Step-by-Step Process

### Phase 1: Architecture Context Review
1. **Read Relevant Architecture Documents**
   ```
   Based on story type, read these architecture shards:
   
   **All Stories:**
   - docs/architecture/tech-stack.md
   - docs/architecture/source-tree.md
   - docs/architecture/coding-standards.md
   - docs/architecture/testing-strategy.md
   
   **Backend/API Stories (additional):**
   - docs/architecture/data-models.md
   - docs/architecture/database-schema.md
   - docs/architecture/backend-architecture.md
   - docs/architecture/rest-api-spec.md
   - docs/architecture/external-apis.md
   
   **Frontend/UI Stories (additional):**
   - docs/architecture/frontend-architecture.md
   - docs/architecture/components.md
   - docs/architecture/core-workflows.md
   - docs/architecture/data-models.md
   ```

2. **Establish Technical Baseline**
   - Note current tech stack versions and constraints
   - Identify architectural patterns and conventions
   - Review existing component structure and naming conventions
   - Understand current API contracts and data models

### Phase 2: Story Technical Analysis
3. **Read and Parse the Story**
   - Carefully read the entire story including Dev Notes
   - Extract all technical components mentioned
   - Identify architectural dependencies
   - Note any external service integrations

4. **Technical Component Validation**
   - **Tech Stack Compliance**: Verify all mentioned technologies align with `tech-stack.md`
   - **Naming Conventions**: Check component, file, and variable names follow `coding-standards.md`
   - **Project Structure**: Ensure file paths match `source-tree.md`
   - **API Design**: Validate endpoints follow patterns in `rest-api-spec.md` (if applicable)
   - **Data Models**: Confirm data structures align with `data-models.md` (if applicable)

5. **Architecture Pattern Validation**
   - **Backend Patterns**: Verify adherence to `backend-architecture.md` patterns (if applicable)
   - **Frontend Patterns**: Check compliance with `frontend-architecture.md` patterns (if applicable)
   - **Component Design**: Ensure UI components follow `components.md` guidelines (if applicable)
   - **Workflow Integration**: Validate alignment with `core-workflows.md` (if applicable)

### Phase 3: Dependency and Integration Analysis
6. **Dependency Chain Validation**
   - Map all technical dependencies mentioned in the story
   - Cross-reference with existing system components
   - Identify missing dependencies or circular dependencies
   - Validate external API dependencies against `external-apis.md` (if applicable)

7. **Integration Point Analysis**
   - Check database interaction patterns against `database-schema.md` (if applicable)
   - Validate API integration approaches
   - Ensure proper error handling and security considerations
   - Review testing approach against `testing-strategy.md`

### Phase 4: Feasibility and Quality Assessment
8. **Implementation Feasibility Check**
   - Assess if story scope is appropriate for development capacity
   - Identify potential technical blockers or complex integrations
   - Evaluate if acceptance criteria are technically measurable
   - Check if story can be completed independently

9. **Documentation Reference Verification**
   - Verify all architecture document references in Dev Notes are accurate
   - Ensure referenced sections exist and contain relevant information
   - Check that source citations follow correct format: `[Source: docs/architecture/{filename}.md#{section}]`
   - Validate that no outdated or non-existent references are included

### Phase 5: Quality Score and Recommendations
10. **Generate Technical Accuracy Score**
    Calculate based on these criteria (each worth 1 point, max 10):
    - ✅ Tech stack compliance (1 point)
    - ✅ Naming convention adherence (1 point)
    - ✅ Project structure alignment (1 point)
    - ✅ API design consistency (1 point)
    - ✅ Data model accuracy (1 point)
    - ✅ Architecture pattern compliance (1 point)
    - ✅ Complete dependency mapping (1 point)
    - ✅ Integration feasibility (1 point)
    - ✅ Accurate documentation references (1 point)
    - ✅ Overall implementation feasibility (1 point)

11. **Provide Detailed Feedback**
    Create a technical review report including:
    - **Overall Score**: X/10 with pass/fail recommendation (7+ to pass)
    - **Technical Issues Found**: List specific problems with severity levels
    - **Architecture Misalignments**: Detail any architectural inconsistencies
    - **Missing Dependencies**: Identify overlooked technical dependencies
    - **Improvement Recommendations**: Specific actions to address issues
    - **Documentation Updates Needed**: If architecture docs need updates

## Quality Gates
- **Technical Accuracy Score ≥ 7/10**: Required to pass technical review
- **Zero Critical Issues**: No major architectural violations or impossible requirements
- **Complete Architecture Alignment**: Story must be implementable within current architecture
- **Accurate Documentation References**: All source citations must be valid and current

## Output Format
```markdown
## Technical Accuracy Review Report

**Story ID**: [Story identifier]
**Review Date**: [Current date]
**Reviewer**: Architect Agent

### Overall Assessment
- **Technical Accuracy Score**: X/10
- **Recommendation**: PASS/FAIL/CONDITIONAL_PASS
- **Review Status**: APPROVED/REQUIRES_REVISION/BLOCKED

### Detailed Analysis

#### Technical Compliance (Score: X/5)
- Tech Stack: ✅/❌ [Details]
- Naming Conventions: ✅/❌ [Details]
- Project Structure: ✅/❌ [Details]
- API Design: ✅/❌ [Details]
- Data Models: ✅/❌ [Details]

#### Architecture Alignment (Score: X/3)
- Backend Patterns: ✅/❌ [Details]
- Frontend Patterns: ✅/❌ [Details]
- Integration Patterns: ✅/❌ [Details]

#### Implementation Feasibility (Score: X/2)
- Dependency Completeness: ✅/❌ [Details]
- Technical Feasibility: ✅/❌ [Details]

### Issues Identified

#### Critical Issues (Must Fix)
1. [Issue description with specific location in story]
2. [Issue description with specific location in story]

#### Major Issues (Should Fix)
1. [Issue description with recommended solution]
2. [Issue description with recommended solution]

#### Minor Issues (Consider Fixing)
1. [Issue description with optional improvement]
2. [Issue description with optional improvement]

### Recommendations
1. **Immediate Actions**: [Required changes for approval]
2. **Architecture Updates**: [If architecture docs need updates]
3. **Future Considerations**: [Long-term improvements]

### Next Steps
- [ ] SM Agent to address critical and major issues
- [ ] Re-submit story for technical review
- [ ] Update architecture documentation (if needed)
- [ ] Proceed to development (if approved)
```

## Success Criteria
- Technical review completed within defined quality gates
- All critical and major technical issues identified and documented
- Clear pass/fail recommendation provided with specific reasoning
- Actionable feedback provided for any required improvements
- Architecture consistency maintained across all approved stories

## Risk Mitigation
- **Architectural Drift**: Regular review ensures stories maintain consistency with established patterns
- **Technical Debt**: Early identification of shortcuts or workarounds that could cause future issues
- **Integration Failures**: Validation of dependencies and integration points before development
- **Documentation Inconsistency**: Verification that stories reflect current architecture state

## Notes for Architect Agent
- Focus on technical accuracy and architectural consistency, not business requirements
- Be specific in feedback - point to exact sections in stories and architecture docs
- Consider the story in context of the overall system architecture
- If architecture documentation is outdated, recommend updates rather than accepting misalignment
- Balance thoroughness with practical development timelines 