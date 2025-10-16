# SM Agent Technical Detail Extraction Checklist

---
metadata:
  type: validation
  threshold: 80%
  on_fail: HALT
  purpose: "Gate-based validation ensuring SM Agent accurately extracts technical information from architecture documents when creating stories"
  used_by:
    - create-next-story.md
  estimated_tokens: 2500
  version: 1.0
---

> **⚠️ DEPRECATED**: This checklist has been superseded by `assessment/sm-story-quality.md` which provides unified validation.  
> **Recommended**: Use `assessment/sm-story-quality.md` for complete story validation.  
> **Status**: Kept for backward compatibility. May be removed in future versions.

This checklist ensures that the SM Agent accurately and comprehensively extracts technical information from architecture documents when creating stories, preventing information gaps or misinterpretations.

[[LLM: INITIALIZATION INSTRUCTIONS - SM AGENT TECHNICAL EXTRACTION VERIFICATION

This checklist is for SM AGENT use during create-next-story task execution for self-verification.

CRITICAL: This is not optional guidance, but a mandatory verification step that must be executed.

EXECUTION APPROACH:

1. Complete this checklist before populating Dev Notes
2. Each item must be marked as [x] Done, [ ] Not Done, or [N/A] Not Applicable  
3. For [ ] Not Done items, must explain reason and plan for resolution
4. For [N/A] items, must explain why not applicable
5. All [x] Done items must have corresponding detailed information and source document references in Dev Notes

QUALITY STANDARD: If more than 20% of checklist items are marked [ ] Not Done, must return to re-extract information.]]

## 1. Architecture Information Completeness Verification

[[LLM: Verify that all relevant architecture information has been identified and extracted. Each [x] item must have detailed explanation and source document reference in Dev Notes.]]

### 1.1 Data Models and Structure  
- [ ] Relevant data entities identified (e.g., User, Order, Product)
- [ ] Entity fields and attributes clarified (including types, constraints, defaults)
- [ ] Entity relationships identified (one-to-one, one-to-many, many-to-many)
- [ ] Data validation rules extracted (required, format, range, etc.)
- [ ] Database constraints identified (foreign keys, indexes, unique constraints)

**Required Source Reference:** `[Source: docs/architecture/data-models.md#{section}]`

### 1.2 API Specifications  
- [ ] Relevant API endpoints identified (paths, HTTP methods)
- [ ] Request parameters clarified (path params, query params, request body)
- [ ] Response formats defined (success responses, error responses, status codes)
- [ ] Authentication/authorization requirements identified
- [ ] API versioning requirements confirmed

**Required Source Reference:** `[Source: docs/architecture/rest-api-spec.md#{section}]`

### 1.3 Technology Stack and Dependencies
- [ ] Relevant frameworks and libraries confirmed (including version requirements)
- [ ] Configuration requirements identified (environment variables, config files)
- [ ] External service dependencies identified (database, cache, third-party APIs)
- [ ] Performance requirements clarified (response time, concurrency, memory usage)
- [ ] Security requirements confirmed (encryption, HTTPS, input validation)

**Required Source Reference:** `[Source: docs/architecture/tech-stack.md#{section}]`

## 2. Technical Preferences Consistency Verification

[[LLM: Ensure story technical solutions align with established project technical preferences.]]

### 2.1 Architecture Pattern Consistency
- [ ] Adopted architecture patterns align with technical-preferences.md specifications
- [ ] Code organization approach follows project conventions
- [ ] Component design patterns follow established standards
- [ ] State management approach aligns with project conventions

### 2.2 Technology Selection Validation
- [ ] Selected technology stack complies with project technical preference constraints
- [ ] Library and framework versions meet project requirements
- [ ] No conflicting technologies introduced without proper justification
- [ ] Technology choices have clear business or technical rationale

### 2.3 Coding Standards and Conventions
- [ ] File naming conventions align with project standards
- [ ] Code structure organization follows project conventions
- [ ] API design patterns follow project standards
- [ ] Error handling approaches follow project conventions

**Required Source Reference:** `[Source: docs/architecture/coding-standards.md#{section} OR data/technical-preferences.md#{section}]`

## 3. File Structure and Project Organization Verification

[[LLM: Ensure new code location and organization align with project structure guidelines.]]

### 3.1 File Location Planning
- [ ] New file creation locations clearly planned
- [ ] File naming follows project conventions
- [ ] Directory structure aligns with project organization standards
- [ ] Module division aligns with architecture design

### 3.2 Project Structure Consistency
- [ ] New component locations align with component organization standards
- [ ] Utility function locations follow project conventions
- [ ] Configuration file locations follow project standards
- [ ] Test file locations and naming follow conventions

**Required Source Reference:** `[Source: docs/architecture/source-tree.md#{section}]`

## 4. Integration and Interface Verification

[[LLM: Ensure new functionality integration points with existing systems are correctly identified and planned.]]

### 4.1 System Integration Points
- [ ] Interfaces with existing modules clearly defined
- [ ] Data flow and transformation planned
- [ ] Event triggering and listening mechanisms identified
- [ ] Caching strategy and data synchronization considered

### 4.2 User Interface Integration (if applicable)
- [ ] UI component integration points identified
- [ ] State management integration planned
- [ ] Routing and navigation integration considered
- [ ] Style and theme consistency confirmed

## 5. Testing Strategy Verification

[[LLM: Ensure testing requirements are complete and align with project testing standards.]]

### 5.1 Testing Scope Definition
- [ ] Unit testing scope clearly defined
- [ ] Integration testing requirements identified
- [ ] End-to-end testing scenarios planned (if applicable)
- [ ] Boundary conditions and error scenarios considered

### 5.2 Testing Completeness Assurance
- [ ] Testing strategy aligns with project testing standards
- [ ] Test data requirements identified
- [ ] Testing environment requirements clarified
- [ ] Performance testing requirements considered (if applicable)

**Required Source Reference:** `[Source: docs/architecture/testing-strategy.md#{section}]`

## 6. Risk and Dependency Analysis

[[LLM: Identify potential risks and dependencies for technical implementation.]]

### 6.1 Technical Risk Identification
- [ ] Technical complexity risk assessed
- [ ] Performance risks identified
- [ ] Security risks considered
- [ ] Compatibility risks assessed

### 6.2 Dependency Relationship Management
- [ ] External dependencies identified and verified
- [ ] Internal module dependencies clarified
- [ ] Data dependency relationships identified
- [ ] Time dependencies (e.g., async operations) considered

## FINAL VALIDATION SUMMARY

[[LLM: After completing checklist, generate validation summary report:

1. Statistical check results:
   - Total Items: X
   - Done: X (X%)
   - Not Done: X (X%)
   - Not Applicable: X (X%)

2. Quality assessment:
   - PASS: > 80% Done, < 10% Not Done
   - REVIEW NEEDED: 60-80% Done or 10-20% Not Done
   - FAIL: < 60% Done or > 20% Not Done

3. Critical issues summary:
   - List all Not Done items and reasons
   - Identify technical details requiring additional clarification
   - Flag major risks that could impact implementation

4. Next steps:
   - If PASS: Continue Story creation process
   - If REVIEW NEEDED: Supplement missing information then re-verify
   - If FAIL: Pause and seek architect or technical expert support]]

**Verification Statistics:**
- Total Items: ___
- Done: ___ (___%)
- Not Done: ___ (___%)
- Not Applicable: ___ (___%)

**Quality Assessment:** [ ] PASS [ ] REVIEW NEEDED [ ] FAIL

**Critical Issues Summary:**
- ___

**Recommended Actions:**
- ___

**Verification Completion Time:** ___
**Validator:** SM Agent (Automated Verification) 