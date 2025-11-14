# Dev Implementation Gate Checklist

---
metadata:
  type: validation
  threshold: 95%
  on_fail: halt
  purpose: "Mandatory quality gate before marking story as Review - enforces standards and prevents low-quality implementations from reaching QA"
---

## LLM EXECUTION INSTRUCTIONS

**Purpose**: Mandatory quality gate to enforce implementation standards before QA review.

**Execution**:
1. This is NOT self-assessment - enforce strict validation
2. Must pass ≥95% threshold to proceed to Review
3. Any critical item failure = automatic HALT
4. Mark items: [x] Pass, [ ] Fail, [N/A] Not Applicable

**Critical Items**: These MUST ALL pass (100% required)
- All tests passing
- No lint errors
- Test integrity maintained
- All AC implemented
- Security requirements met

**On Failure (<95%)**:
- HALT immediately
- Document all failed items
- Status remains InProgress
- Do NOT proceed to Review
- Return detailed failure report

---

## CRITICAL GATE ITEMS (100% Required)

These items are MANDATORY and must ALL pass:

| # | Item | Status | Notes |
|---|------|--------|-------|
| C1 | All tests passing (no failures, no skips) | [ ] | |
| C2 | Zero lint errors | [ ] | |
| C3 | Test integrity maintained (no weakened assertions) | [ ] | |
| C4 | All acceptance criteria implemented | [ ] | |
| C5 | Security requirements met (auth, validation, sanitization) | [ ] | |
| C6 | No unhandled error conditions | [ ] | |
| C7 | Dev Log complete with Final Summary | [ ] | |

**Critical Gate Pass**: ___/7 (Must be 7/7 = 100%)

**If ANY critical item fails**: HALT - Fix issues before proceeding

---

## 1. REQUIREMENTS COMPLETENESS (Required: 100%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1.1 | All functional requirements implemented | [ ] | |
| 1.2 | All acceptance criteria met | [ ] | |
| 1.3 | All tasks checked off | [ ] | |
| 1.4 | Edge cases handled | [ ] | |
| 1.5 | Error scenarios implemented | [ ] | |

**Section Score**: ___/5 (___%)

---

## 2. CODE QUALITY (Required: ≥90%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 2.1 | Follows coding standards (naming, structure) | [ ] | |
| 2.2 | File locations match project structure | [ ] | |
| 2.3 | Tech stack compliance (approved technologies only) | [ ] | |
| 2.4 | API patterns consistent (if applicable) | [ ] | |
| 2.5 | Data model alignment (if applicable) | [ ] | |
| 2.6 | No code duplication (DRY principle) | [ ] | |
| 2.7 | Complex logic documented with comments | [ ] | |
| 2.8 | No security vulnerabilities (SQL injection, XSS, etc.) | [ ] | |
| 2.9 | Input validation comprehensive | [ ] | |
| 2.10 | Error handling robust | [ ] | |

**Section Score**: ___/10 (___%)

---

## 3. TESTING QUALITY (Required: ≥95%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 3.1 | Unit tests written for all new functions/methods | [ ] | |
| 3.2 | Integration tests for cross-component interactions | [ ] | |
| 3.3 | Edge cases covered in tests | [ ] | |
| 3.4 | Error scenarios tested | [ ] | |
| 3.5 | Test coverage meets requirements | [ ] | |
| 3.6 | Tests follow testing-strategy.md | [ ] | |
| 3.7 | Test names clear and descriptive | [ ] | |
| 3.8 | No flaky tests (consistent pass/fail) | [ ] | |
| 3.9 | Test data realistic and representative | [ ] | |
| 3.10 | Cleanup/teardown proper | [ ] | |

**Section Score**: ___/10 (___%)

---

## 4. TEST INTEGRITY (Required: 100%)

**CRITICAL**: Test integrity violations are automatic gate failures

| # | Item | Status | Violation? |
|---|------|--------|------------|
| 4.1 | No test expectations modified to make tests pass | [ ] | [ ] |
| 4.2 | Test failures fixed via implementation changes only | [ ] | [ ] |
| 4.3 | Any test modifications have business justification | [ ] | [ ] |
| 4.4 | Requirement tests remain immutable | [ ] | [ ] |
| 4.5 | No test conditions relaxed without approval | [ ] | [ ] |
| 4.6 | Coverage validates actual behavior (not mocked incorrectly) | [ ] | [ ] |

**Section Score**: ___/6 (___%)

**If ANY violation detected**: AUTOMATIC FAIL - HALT immediately

---

## 5. TEST DESIGN COMPLIANCE (Required if test design exists: 100%)

**Check**: Does QA test design document exist?
- [ ] Yes - Execute validation below
- [ ] No - Mark all N/A and skip

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 5.1 | Test design reviewed before implementation | [ ] [N/A] | |
| 5.2 | All P0 tests implemented | [ ] [N/A] | |
| 5.3 | Test priorities followed (P0 → P1 → P2) | [ ] [N/A] | |
| 5.4 | Test levels match specifications | [ ] [N/A] | |
| 5.5 | Deviations documented with justification | [ ] [N/A] | |
| 5.6 | Coverage meets/exceeds requirements | [ ] [N/A] | |

**Section Score**: ___/6 or N/A (___%)

---

## 6. ARCHITECTURE COMPLIANCE (Required: ≥90%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 6.1 | Architecture patterns followed | [ ] | |
| 6.2 | Component boundaries respected | [ ] | |
| 6.3 | Dependencies injected properly (DI) | [ ] | |
| 6.4 | No circular dependencies | [ ] | |
| 6.5 | Separation of concerns maintained | [ ] | |
| 6.6 | Integration points match architecture | [ ] | |
| 6.7 | No architectural shortcuts taken | [ ] | |
| 6.8 | Performance considerations addressed | [ ] | |
| 6.9 | Scalability implications considered | [ ] | |
| 6.10 | Technical debt documented if any | [ ] | |

**Section Score**: ___/10 (___%)

---

## 7. API CONTRACT COMPLIANCE (Required if multi-repo: 100%)

**Check**: Is this a multi-repo project (backend/frontend/ios/android)?
- [ ] Yes - Execute validation below
- [ ] No - Mark all N/A and skip

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 7.1 | All API endpoints match contracts (provides_apis) | [ ] [N/A] | |
| 7.2 | Request schemas exact match | [ ] [N/A] | |
| 7.3 | Response schemas exact match | [ ] [N/A] | |
| 7.4 | Error handling for all contract error codes | [ ] [N/A] | |
| 7.5 | Security requirements implemented (auth, rate limit) | [ ] [N/A] | |
| 7.6 | API consumption correct (consumes_apis) | [ ] [N/A] | |
| 7.7 | Request payload construction matches contract | [ ] [N/A] | |
| 7.8 | Response handling complete for all fields | [ ] [N/A] | |
| 7.9 | Error response handling complete | [ ] [N/A] | |
| 7.10 | Cross-repo dependencies noted and verified | [ ] [N/A] | |

**Section Score**: ___/10 or N/A (___%)

---

## 8. BUILD & DEPENDENCIES (Required: 100%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 8.1 | Project builds without errors | [ ] | |
| 8.2 | All tests pass | [ ] | |
| 8.3 | Linting passes | [ ] | |
| 8.4 | No new warnings introduced | [ ] | |
| 8.5 | Dependencies approved and documented | [ ] | |
| 8.6 | No security vulnerabilities in dependencies | [ ] | |
| 8.7 | Environment variables documented | [ ] | |
| 8.8 | Configuration changes documented | [ ] | |

**Section Score**: ___/8 (___%)

---

## 9. DOCUMENTATION (Required: ≥80%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 9.1 | Dev Log complete with all sections | [ ] | |
| 9.2 | Dev Agent Record updated | [ ] | |
| 9.3 | File List complete (added/modified/deleted) | [ ] | |
| 9.4 | Change Log updated | [ ] | |
| 9.5 | Technical decisions documented | [ ] | |
| 9.6 | Deviations from SM design documented | [ ] | |
| 9.7 | Complex logic explained in Dev Log | [ ] | |
| 9.8 | Open issues documented | [ ] | |
| 9.9 | Final Summary written | [ ] | |
| 9.10 | Inline comments for complex code | [ ] | |

**Section Score**: ___/10 (___%)

---

## 10. SECURITY & ROBUSTNESS (Required: 100%)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 10.1 | Input validation comprehensive | [ ] | |
| 10.2 | SQL injection prevented | [ ] [N/A] | |
| 10.3 | XSS vulnerabilities prevented | [ ] [N/A] | |
| 10.4 | CSRF protection implemented | [ ] [N/A] | |
| 10.5 | Authentication/authorization correct | [ ] [N/A] | |
| 10.6 | Sensitive data encrypted | [ ] [N/A] | |
| 10.7 | No secrets in code | [ ] | |
| 10.8 | Error messages don't leak sensitive info | [ ] | |
| 10.9 | Rate limiting implemented (if applicable) | [ ] [N/A] | |
| 10.10 | OWASP Top 10 considered | [ ] | |

**Section Score**: ___/10 (___%)

---

## OVERALL GATE CALCULATION

### Section Scores Summary

| Section | Score | Weight | Weighted Score | Pass? |
|---------|-------|--------|----------------|-------|
| Critical Items | ___/7 | MANDATORY | N/A | [ ] 100% required |
| 1. Requirements | ___% | 10% | ___% | [ ] 100% required |
| 2. Code Quality | ___% | 15% | ___% | [ ] ≥90% required |
| 3. Testing Quality | ___% | 15% | ___% | [ ] ≥95% required |
| 4. Test Integrity | ___% | 10% | ___% | [ ] 100% required |
| 5. Test Design Compliance | ___% or N/A | 5% | ___% | [ ] 100% if applicable |
| 6. Architecture Compliance | ___% | 15% | ___% | [ ] ≥90% required |
| 7. API Contract Compliance | ___% or N/A | 10% | ___% | [ ] 100% if applicable |
| 8. Build & Dependencies | ___% | 10% | ___% | [ ] 100% required |
| 9. Documentation | ___% | 5% | ___% | [ ] ≥80% required |
| 10. Security & Robustness | ___% | 5% | ___% | [ ] 100% required |

**Total Weighted Score**: ___% (Must be ≥95%)

---

## GATE DECISION

### Pass Criteria (ALL must be met)

- [x] Critical Items: 7/7 (100%)
- [ ] Total Weighted Score: ≥95%
- [ ] All "100% required" sections: 100%
- [ ] All "≥X% required" sections: Meet threshold
- [ ] No unresolved critical issues

### Result

**GATE STATUS**: [ ] PASS | [ ] FAIL

**If PASS**:
- ✅ Implementation meets quality standards
- Proceed to mark story as Review
- Ready for QA review

**If FAIL**:
- ❌ Implementation does not meet quality standards
- HALT - Status remains InProgress
- Fix issues below before proceeding

---

## FAILURE DETAILS (Complete if FAIL)

### Critical Items Failed

List each critical item that failed:
1. C__ - {item description} - {reason for failure}
2. ...

### Section Failures

List each section below threshold:
- Section __ ({name}): {actual}% < {required}% - {reason}

### Required Actions

Prioritized list of actions to pass gate:
1. **Critical**: {action 1}
2. **Critical**: {action 2}
3. **High**: {action 3}
4. ...

### Estimated Effort to Fix

- [ ] < 1 hour
- [ ] 1-4 hours
- [ ] > 4 hours (consider architectural review)

---

## FINAL CONFIRMATION

**Dev Declaration**:
- [ ] I confirm all checklist items marked [x] are accurate
- [ ] I have reviewed failed items and understand what needs fixing
- [ ] I confirm this is an honest assessment, not optimistic marking
- [ ] I understand that passing this gate is mandatory to proceed to Review

**Gate Result Return Value**:

```yaml
gate_result:
  status: {PASS|FAIL}
  overall_score: {percentage}
  critical_items: {7/7 or failed count}
  sections_passed: {count}
  sections_failed: {count}
  ready_for_review: {true|false}

  failed_items:
    critical: [{list}]
    sections: [{list with scores}]

  required_actions: [{prioritized list}]
```

---

## Key Principles

- **Honest Assessment**: Mark accurately, don't optimize to pass
- **Quality over Schedule**: Better to fix now than rework after QA
- **Test Integrity is Sacred**: Never compromise tests to pass
- **Security is Non-Negotiable**: 100% security requirements must pass
- **Architecture Compliance Mandatory**: No shortcuts allowed
- **Documentation Complete**: Future maintainers depend on it
