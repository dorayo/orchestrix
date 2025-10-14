# Architect Technical Review Checklist (Streamlined)

## Overview
This checklist focuses on architecture-specific concerns for Stories that have already passed SM quality validation. The Architect review complements (not duplicates) SM validation by focusing on system-level architectural considerations.

**Note**: SM Agent has already validated technical accuracy basics (tech stack compliance, naming conventions, file structure, documentation format). This review focuses exclusively on architectural concerns.

## Prerequisites
- [ ] SM quality validation completed (score available)
- [ ] Story status is "Draft" or "Approved"
- [ ] Complexity indicators documented (if applicable)
- [ ] Architecture documentation accessible
- [ ] SM validation results available for reference

## Architecture-Specific Review (10 Points Total)

### 1. Architectural Pattern Compliance (3 Points)
**Focus**: Does the Story follow established architectural patterns appropriately?

- [ ] **Pattern Consistency**: Implementation approach follows established architectural patterns documented in architecture docs
- [ ] **Pattern Appropriateness**: Chosen patterns are suitable for the use case and context
- [ ] **No Anti-Patterns**: No architectural anti-patterns or violations introduced
- [ ] **Pattern Documentation**: Pattern usage is properly documented and justified

**Scoring**:
- 3 points: Excellent pattern compliance, appropriate choices, well-documented
- 2 points: Good compliance with minor pattern concerns
- 1 point: Pattern issues present but not critical
- 0 points: Significant pattern violations or inappropriate choices

**Score**: ___/3 points
**Issues Found**: ________________

### 2. System Integration Analysis (2 Points)
**Focus**: Are cross-component and cross-service integrations sound?

- [ ] **Integration Approach**: Integration strategy is architecturally sound
- [ ] **Cross-Service Dependencies**: Dependencies on other services are properly identified and manageable
- [ ] **Integration Risks**: Potential integration risks are identified and mitigated
- [ ] **Communication Patterns**: Inter-component communication follows established patterns

**Scoring**:
- 2 points: Integration approach is sound with proper risk mitigation
- 1 point: Integration acceptable with minor concerns
- 0 points: Integration approach has significant risks or issues

**Score**: ___/2 points
**Issues Found**: ________________

### 3. Scalability & Performance (2 Points)
**Focus**: Will the implementation scale and perform acceptably?

- [ ] **Scalability**: Approach scales appropriately with expected load and growth
- [ ] **Performance Implications**: Performance impact is acceptable and documented
- [ ] **Resource Usage**: Resource consumption (memory, CPU, I/O) is reasonable
- [ ] **No Bottlenecks**: No obvious performance bottlenecks introduced

**Scoring**:
- 2 points: Excellent scalability and performance considerations
- 1 point: Acceptable with minor performance concerns
- 0 points: Significant scalability or performance issues

**Score**: ___/2 points
**Issues Found**: ________________

### 4. Security Architecture (2 Points)
**Focus**: Does the implementation maintain security architecture integrity?

- [ ] **Security Alignment**: Security approach aligns with overall security architecture
- [ ] **Risk Assessment**: Security risks are properly identified and addressed
- [ ] **Sensitive Data Handling**: Sensitive data handling follows security guidelines
- [ ] **Security Boundaries**: Security boundaries and access controls are appropriate

**Scoring**:
- 2 points: Excellent security architecture alignment
- 1 point: Acceptable with minor security considerations
- 0 points: Security concerns or violations present

**Score**: ___/2 points
**Issues Found**: ________________

### 5. Technical Feasibility (1 Point)
**Focus**: Is the approach technically sound at the system level?

- [ ] **System-Level Feasibility**: Approach is technically feasible within the system architecture
- [ ] **No Architectural Blockers**: No architectural constraints prevent implementation
- [ ] **Complexity Appropriate**: System-level complexity is manageable
- [ ] **Dependencies Viable**: All architectural dependencies are viable

**Scoring**:
- 1 point: Technically feasible at system level
- 0 points: Architectural feasibility concerns or blockers

**Score**: ___/1 point
**Issues Found**: ________________

## Review Summary

### Total Score
**Architecture Review Score**: ___/10 points

### Outcome Decision
Based on the total score and identified issues:

- [ ] **Approved** (Score ≥7): Story is architecturally sound and ready for development
  - Update Story status to "Approved"
  - Document approval and any advisory notes
  
- [ ] **Revise** (Score <7): Architectural issues require revision
  - Update Story status to "Blocked"
  - Provide specific revision requirements to SM Agent
  - Document all issues that need addressing
  
- [ ] **Escalate**: Requires human architect review
  - Complex architectural decisions beyond agent scope
  - Conflicting architectural requirements
  - Novel patterns requiring human judgment

**Selected Outcome**: ________________

### Findings Summary
**Key Architectural Concerns**: ________________

**Recommendations**: ________________

**Advisory Notes** (for Approved stories): ________________

**Revision Requirements** (for Revise outcome): ________________

**Escalation Reason** (for Escalate outcome): ________________

## Review Metadata
- **Reviewed By**: Architect Agent
- **Review Date**: ________________
- **SM Quality Score** (reference): ___/10
- **Complexity Indicators** (reference): ________________
- **Review Duration**: ________________ minutes

 