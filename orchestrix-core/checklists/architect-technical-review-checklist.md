# Architect Technical Review Checklist

## Overview
This checklist ensures comprehensive and consistent technical accuracy reviews by the Architect Agent for all stories created by the SM Agent.

## Prerequisites Verification
- [ ] Story file exists and is accessible
- [ ] Architecture documentation is current and available
- [ ] SM Agent has completed internal validation (validated via checklist completion)
- [ ] Story includes required Dev Notes section

## Phase 1: Architecture Context Setup (Required for All Reviews)

### Documentation Access Check
- [ ] **Core Architecture Docs Available**:
  - [ ] `docs/architecture/tech-stack.md` accessible
  - [ ] `docs/architecture/unified-project-structure.md` accessible  
  - [ ] `docs/architecture/coding-standards.md` accessible
  - [ ] `docs/architecture/testing-strategy.md` accessible

- [ ] **Story-Type Specific Docs Available**:
  - [ ] **Backend/API Stories**: data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md, external-apis.md
  - [ ] **Frontend/UI Stories**: frontend-architecture.md, components.md, core-workflows.md, data-models.md

### Technical Baseline Establishment
- [ ] Current tech stack versions and constraints documented
- [ ] Architectural patterns and conventions identified
- [ ] Component structure and naming conventions reviewed
- [ ] API contracts and data models understood

## Phase 2: Technical Compliance Verification (5 Points Maximum)

### Tech Stack Compliance (1 Point)
- [ ] **All Technologies Verified**: Every technology mentioned exists in `tech-stack.md`
- [ ] **Version Compatibility**: All specified versions are compatible with current stack
- [ ] **No Prohibited Technologies**: No technologies marked as deprecated or forbidden
- [ ] **Performance Implications**: Technology choices align with performance requirements

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

### Naming Conventions Adherence (1 Point)
- [ ] **Component Names**: Follow patterns in `coding-standards.md`
- [ ] **File Names**: Match established naming conventions
- [ ] **Variable/Function Names**: Consistent with project standards
- [ ] **API Endpoint Names**: Follow REST naming conventions (if applicable)

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

### Project Structure Alignment (1 Point)
- [ ] **File Locations**: All proposed files match `unified-project-structure.md`
- [ ] **Directory Organization**: Follows established folder hierarchy
- [ ] **Module Separation**: Proper separation of concerns maintained
- [ ] **Import/Export Patterns**: Consistent with project structure

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

### API Design Consistency (1 Point - If Applicable)
- [ ] **Endpoint Patterns**: Follow patterns in `rest-api-spec.md`
- [ ] **Request/Response Format**: Match established schemas
- [ ] **Authentication**: Proper auth requirements specified
- [ ] **Error Handling**: Consistent with API error patterns

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts) / N/A
**Critical Issues Found**: ________________

### Data Model Accuracy (1 Point - If Applicable)
- [ ] **Entity References**: All mentioned entities exist in `data-models.md`
- [ ] **Relationship Accuracy**: Entity relationships correctly described
- [ ] **Field Specifications**: Types and constraints match schema
- [ ] **Database Implications**: Schema changes properly considered

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts) / N/A
**Critical Issues Found**: ________________

**Technical Compliance Total**: ___/5 points

## Phase 3: Architecture Alignment Verification (3 Points Maximum)

### Backend Patterns Compliance (1 Point - If Applicable)
- [ ] **Service Layer Design**: Follows `backend-architecture.md` patterns
- [ ] **Data Access Patterns**: Consistent with established DAL approaches
- [ ] **Business Logic Organization**: Proper separation and encapsulation
- [ ] **Integration Patterns**: Matches existing service integration approaches

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts) / N/A
**Critical Issues Found**: ________________

### Frontend Patterns Compliance (1 Point - If Applicable)
- [ ] **Component Architecture**: Follows `frontend-architecture.md` patterns
- [ ] **State Management**: Consistent with established state patterns
- [ ] **UI Component Design**: Matches `components.md` guidelines
- [ ] **Workflow Integration**: Aligns with `core-workflows.md`

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts) / N/A
**Critical Issues Found**: ________________

### Integration Patterns Compliance (1 Point)
- [ ] **Cross-Component Communication**: Follows established patterns
- [ ] **Event Handling**: Consistent with system event architecture
- [ ] **Data Flow**: Matches architectural data flow diagrams
- [ ] **Security Boundaries**: Respects established security patterns

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

**Architecture Alignment Total**: ___/3 points

## Phase 4: Implementation Feasibility Assessment (2 Points Maximum)

### Dependency Completeness (1 Point)
- [ ] **All Dependencies Identified**: No missing technical dependencies
- [ ] **External Dependencies**: All external APIs/services identified per `external-apis.md`
- [ ] **Circular Dependencies**: No circular dependencies introduced
- [ ] **Version Conflicts**: No conflicting dependency versions

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

### Technical Feasibility (1 Point)
- [ ] **Implementation Scope**: Appropriate for single development iteration
- [ ] **Technical Complexity**: Within reasonable complexity bounds for team
- [ ] **Resource Requirements**: Achievable with available technical resources
- [ ] **Testing Feasibility**: Can be adequately tested per `testing-strategy.md`

**Score**: ✅ Pass (1 pt) / ❌ Fail (0 pts)
**Critical Issues Found**: ________________

**Implementation Feasibility Total**: ___/2 points

## Phase 5: Documentation Quality Verification

### Documentation Reference Accuracy (Required)
- [ ] **Citation Format**: All references use format `[Source: docs/architecture/{filename}.md#{section}]`
- [ ] **Reference Validity**: All cited documents and sections exist
- [ ] **Content Alignment**: Referenced content actually supports the story details
- [ ] **Completeness**: All technical claims have appropriate source citations

**Critical Verification**: Are all documentation references accurate and current?
✅ Yes - Continue / ❌ No - FAIL Review

## Quality Gate Assessment

### Overall Technical Accuracy Score
- **Technical Compliance**: ___/5 points
- **Architecture Alignment**: ___/3 points  
- **Implementation Feasibility**: ___/2 points
- **Total Score**: ___/10 points

### Pass/Fail Determination
- [ ] **Score ≥ 7/10**: PASS threshold met
- [ ] **Zero Critical Issues**: No critical technical violations
- [ ] **Documentation Accuracy**: All references verified
- [ ] **Architecture Alignment**: No major architectural conflicts

**Final Recommendation**: 
- [ ] **APPROVED**: Story ready for development
- [ ] **CONDITIONAL_PASS**: Minor issues identified, development can proceed with notes
- [ ] **REQUIRES_REVISION**: Moderate issues require SM Agent revision
- [ ] **BLOCKED**: Critical issues require major revision or architectural consultation

## Issue Severity Classification

### Critical Issues (Must Fix - Block Development)
- [ ] Architectural violations that break system consistency
- [ ] Impossible technical requirements or constraints
- [ ] Security vulnerabilities or major performance risks
- [ ] Invalid or non-existent technical references

**Critical Issues Identified**: ________________

### Major Issues (Should Fix - Development Risk)
- [ ] Non-optimal patterns that increase technical debt
- [ ] Missing significant dependencies or considerations
- [ ] Performance concerns or scalability risks
- [ ] Integration complexity that could cause delays

**Major Issues Identified**: ________________

### Minor Issues (Consider Fixing - Improvement Opportunities)
- [ ] Style or convention inconsistencies
- [ ] Minor optimization opportunities
- [ ] Documentation clarification suggestions
- [ ] Non-essential technical improvements

**Minor Issues Identified**: ________________

## Review Completion Requirements

### Mandatory Documentation
- [ ] Technical accuracy score calculated and documented
- [ ] All identified issues categorized by severity
- [ ] Specific recommendations provided for each issue
- [ ] Clear next steps documented

### Quality Assurance
- [ ] Review completed by qualified Architect Agent
- [ ] All checklist items verified with evidence
- [ ] Recommendation aligns with identified issues
- [ ] Documentation follows standard review report format

### Handoff Requirements
- [ ] **For Approved Stories**: Document approval and any notes
- [ ] **For Revision Required**: Provide specific revision requirements
- [ ] **For Blocked Stories**: Document blocking issues and escalation path
- [ ] **For All Reviews**: Update story status appropriately

## Continuous Improvement Notes

### Common Issues Pattern (To Improve SM Agent Process)
- Issues repeatedly found: ________________
- Architecture doc clarity problems: ________________
- Technical extraction improvements needed: ________________

### Architecture Documentation Gaps (To Improve Architecture Docs)
- Missing technical details causing confusion: ________________
- Outdated information discovered: ________________
- Structural improvements needed: ________________

**Review Completed By**: ________________
**Review Date**: ________________
**Time Spent**: ________________ minutes 