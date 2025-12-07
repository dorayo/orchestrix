# Dev Implementation Gate

---
metadata:
  type: gate
  threshold: 95%
  on_fail: halt
  purpose: "Unified quality gate validating architecture compliance, API contracts, test integrity, and implementation standards"
  scope: "Code quality validation - all technical quality checks consolidated here"
---

## Purpose

Unified validation engine for architecture compliance, API contracts, and test integrity. This task consolidates all quality validations into a single execution point for consistency and efficiency.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: Path to story file
  - dev_log_path: Path to dev log

optional:
  - project_mode: 'monolith' | 'multi-repo' (from core-config.yaml)
  - repository_role: 'backend' | 'frontend' | 'ios' | 'android' (from core-config.yaml)
```

## Process

### 1. Load Architecture Context

Execute: `{root}/tasks/utils/load-architecture-context.md`

**Base Documents** (always load):
- `docs/architecture/tech-stack.md`
- `docs/architecture/source-tree.md`
- `docs/architecture/coding-standards.md`
- `docs/architecture/testing-strategy.md`

**Story Type Detection**: Analyze story content and implementation files

**Additional Documents** (based on type):
- Backend: data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md
- Frontend: frontend-architecture.md, components.md, core-workflows.md
- Full-stack: All of the above

---

### 2. Architecture Compliance Validation

**Objective**: Validate implementation against architecture standards

**2.1 Tech Stack Compliance**

Extract technologies/libraries from implementation files and cross-reference with tech-stack.md.

**Checks**:
- Unapproved technologies → CRITICAL
- Wrong versions → MAJOR
- Deprecated packages → MAJOR
- Missing dependencies → MINOR

**2.2 Naming Convention Compliance**

Validate against coding-standards.md patterns.

**Checks**:
- Incorrect casing (camelCase vs kebab-case vs PascalCase) → MAJOR
- Non-standard prefixes/suffixes → MINOR
- Reserved word usage → MAJOR
- Inconsistent naming patterns → MINOR

**2.3 File Structure Alignment**

Validate against source-tree.md structure.

**Checks**:
- Files in wrong directories → MAJOR
- Missing required structure → MAJOR
- Incorrect test file placement → MAJOR
- Config files misplaced → MINOR

**2.4 API Pattern Consistency** (Backend/Full-stack only)

Validate against rest-api-spec.md.

**Checks**:
- Non-standard endpoints → MAJOR
- Incorrect HTTP methods → MAJOR
- Response format violations → MAJOR
- Missing error handling → MAJOR
- Auth pattern violations → CRITICAL

**2.5 Data Model Alignment** (Backend/Full-stack only)

Validate against data-models.md.

**Checks**:
- Model definition mismatches → MAJOR
- Wrong field types → MAJOR
- Missing required fields → MAJOR
- Incorrect relationships → MINOR

**Architecture Compliance Result**:
```yaml
architecture_compliance:
  result: PASS | FAIL
  compliance_score: {percentage}
  issues:
    critical: [{issue, location, fix}]
    major: [{issue, location, fix}]
    minor: [{issue, location, fix}]
```

**Decision Logic**:
- PASS: Zero critical issues AND ≤2 major issues
- FAIL: Any critical issues OR >2 major issues

---

### 3. API Contract Compliance Validation

**Applicability**: Only execute if:
```yaml
project.mode = 'multi-repo' AND project.multi_repo.role ∈ {backend, frontend, ios, android}
```

**Skip if**: `project.mode = 'monolith'` OR `role = 'product'`

**3.1 Load Epic and API Contracts**

Read epic YAML from product repo:
```
{product_repo_path}/docs/prd/epic-{epic_id}-*.yaml
```

Extract:
- `provides_apis: []` (backend stories)
- `consumes_apis: []` (frontend/mobile stories)

Read API contracts:
```
{product_repo_path}/docs/api-contracts.md
```

**Error Handling**:
- If epic YAML not found: WARNING, skip validation
- If api-contracts.md not found: ERROR, fail validation
- If no APIs defined in epic: Return N_A, skip validation

**3.2 Backend Validation** (provides_apis)

For each API endpoint in `provides_apis`:

**Checks**:
- Endpoint documented in api-contracts.md → CRITICAL if missing
- Request schema exact match → MAJOR if mismatch
- Response schema exact match → MAJOR if mismatch
- All error codes handled → MAJOR if incomplete
- Security requirements implemented → CRITICAL if missing
  - Authentication (Bearer token, API key)
  - Authorization (role-based, permission-based)
  - Rate limiting
  - Input sanitization

**3.3 Frontend/Mobile Validation** (consumes_apis)

For each API endpoint in `consumes_apis`:

**Checks**:
- Request payload construction matches contract → MAJOR if mismatch
- Response handling complete for all fields → MAJOR if incomplete
- All error status codes handled → MAJOR if missing
- UI error feedback implemented → MINOR if missing

**API Contract Compliance Result**:
```yaml
api_contract_compliance:
  result: PASS | FAIL | N_A
  compliance_score: {percentage}
  apis_validated:
    provides: [{endpoint list}]  # backend
    consumes: [{endpoint list}]  # frontend/mobile
  violations:
    critical: [{endpoint, type, message, action}]
    major: [{endpoint, type, message, action}]
    minor: [{endpoint, type, message, action}]
```

**Decision Logic**:
- PASS: Zero critical violations AND ≤1 major violations
- FAIL: Any critical violations OR >1 major violations
- N_A: Not applicable (monolith or no APIs in epic)

---

### 4. Test Integrity Validation

**Objective**: Ensure tests were not weakened to make implementation pass

**4.1 Git Diff Analysis**

Check for test file modifications:
```bash
git diff --name-only | grep -E "test|spec"
```

**4.2 For Each Modified Test File**

Analyze changes:
- Review assertions/expectations changes
- Check if expectations were weakened (RED FLAG)
- Verify business justification exists in Dev Log
- Confirm changes are requirement-driven, not implementation-driven

**Violations**:
- Weakened assertions without business justification → CRITICAL
- Test conditions relaxed without approval → CRITICAL
- Requirement tests modified to pass → CRITICAL
- Mocked incorrectly to bypass validation → MAJOR

**4.3 Verify Test Coverage**

Compare with QA test design (if exists):
- All P0 tests implemented → CRITICAL if missing
- Test priorities followed → MAJOR if not
- Coverage meets requirements → MAJOR if below threshold

**Test Integrity Result**:
```yaml
test_integrity:
  result: PASS | FAIL
  test_files_modified: {count}
  violations:
    critical: [{file, line, violation_type, justification_status}]
    major: [{file, line, violation_type, justification_status}]
  coverage_validation:
    p0_tests_implemented: {true/false}
    coverage_percentage: {percentage}
    meets_requirements: {true/false}
```

**Decision Logic**:
- PASS: Zero violations
- FAIL: Any violation detected

---

### 5. Implementation Shortcuts Validation

**Objective**: Detect common developer shortcuts and anti-patterns

**Execute**: `{root}/checklists/gate/implementation-shortcuts.md`

**Input**:
```yaml
story_id: {story_id}
story_path: {story_path}
implementation_files: {list of modified files from story}
```

**6 Validation Categories**:

1. **Hardcoding Detection** (Weight: 25%)
   - Hardcoded URLs / API endpoints
   - Hardcoded configuration values (timeout, retry count)
   - Hardcoded credentials (password, API Key, Token) → CRITICAL
   - Hardcoded environment-specific values (IP, port, domain)
   - Magic numbers/strings

2. **Leftover Code Detection** (Weight: 20%)
   - TODO/FIXME/HACK/XXX comments
   - console.log / print / debugger statements
   - Commented-out code blocks
   - Debug-only code

3. **Exception Handling Anti-patterns** (Weight: 20%)
   - Empty catch blocks → CRITICAL
   - Log-only exception handling
   - Swallowed exceptions (silent failures) → HIGH
   - Overly broad catch

4. **Stub Implementation Detection** (Weight: 15%)
   - `return null/[]` fake implementations → CRITICAL
   - TODO without implementation → CRITICAL
   - Mock data in production code
   - Placeholder functions

5. **Test Integrity Issues** (Weight: 10%)
   - Skipped tests (@Skip, xit, .skip)
   - Weakened assertions
   - Empty test cases
   - Happy-path-only tests

6. **Dependency Hygiene** (Weight: 10%)
   - Unused dependencies
   - Dev dependencies in production
   - Duplicate/outdated dependencies

**Implementation Shortcuts Result**:
```yaml
implementation_shortcuts:
  result: PASS | FAIL
  overall_score: {percentage}
  sections:
    - name: "Hardcoding Detection"
      weight: 25%
      score: {percentage}
      findings: []
    - name: "Leftover Code Detection"
      weight: 20%
      score: {percentage}
      findings: []
    - name: "Exception Handling Anti-patterns"
      weight: 20%
      score: {percentage}
      findings: []
    - name: "Stub Implementation Detection"
      weight: 15%
      score: {percentage}
      findings: []
    - name: "Test Integrity Issues"
      weight: 10%
      score: {percentage}
      findings: []
    - name: "Dependency Hygiene"
      weight: 10%
      score: {percentage}
      findings: []
  summary:
    critical_count: {count}
    high_count: {count}
    medium_count: {count}
    low_count: {count}
```

**Decision Logic**:
- PASS: Zero CRITICAL findings AND overall_score >= 80%
- FAIL: Any CRITICAL finding OR overall_score < 80%

---

### 6. Generate Unified Validation Report

Combine all validation results into a single structured output.

## Output Format

**This output serves as the complete Implementation Gate Result**

```yaml
gate_result:
  story_id: {story_id}
  validation_date: {timestamp}

  # Gate Status
  status: {PASS|FAIL}
  overall_score: {percentage}  # Weighted score across all sections

  # Critical Items (7 mandatory items)
  critical_items:
    total: 7
    passed: {count}
    status: {PASS|FAIL}  # PASS only if all 7 pass
    items:
      - id: C1
        check: "All tests passing"
        status: {PASS|FAIL}
        evidence: {test command output or file reference}
      - id: C2
        check: "Zero lint errors"
        status: {PASS|FAIL}
        evidence: {lint command output}
      - id: C3
        check: "Test integrity maintained"
        status: {PASS|FAIL}
        evidence: {git diff analysis result}
      - id: C4
        check: "All acceptance criteria implemented"
        status: {PASS|FAIL}
        evidence: {AC checklist from story}
      - id: C5
        check: "Security requirements met"
        status: {PASS|FAIL}
        evidence: {security validation results}
      - id: C6
        check: "No unhandled error conditions"
        status: {PASS|FAIL}
        evidence: {error handling validation}
      - id: C7
        check: "Dev Log complete with Final Summary"
        status: {PASS|FAIL}
        evidence: {dev log file reference}

  # Sections (11 validation sections)
  sections:
    - name: "Requirements Completeness"
      score: {percentage}
      threshold: 100%
      weight: 10%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 5
      items_passed: {count}

    - name: "Code Quality"
      score: {percentage}
      threshold: 90%
      weight: 12%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 10
      items_passed: {count}

    - name: "Testing Quality"
      score: {percentage}
      threshold: 95%
      weight: 12%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 10
      items_passed: {count}

    - name: "Test Integrity"
      score: {percentage}
      threshold: 100%
      weight: 10%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 6
      items_passed: {count}
      violations: [{file, line, type, justification_status}]

    - name: "Test Design Compliance"
      score: {percentage|N_A}
      threshold: 100%
      weight: 5%
      weighted_score: {percentage}
      passed: {true|false|N_A}
      items_total: 6
      items_passed: {count}

    - name: "Architecture Compliance"
      score: {percentage}
      threshold: 90%
      weight: 13%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 10
      items_passed: {count}

    - name: "API Contract Compliance"
      score: {percentage|N_A}
      threshold: 100%
      weight: 10%
      weighted_score: {percentage}
      passed: {true|false|N_A}
      items_total: 10
      items_passed: {count}

    - name: "Build & Dependencies"
      score: {percentage}
      threshold: 100%
      weight: 10%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 8
      items_passed: {count}

    - name: "Documentation"
      score: {percentage}
      threshold: 75%
      weight: 3%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 4
      items_passed: {count}

    - name: "Security & Robustness"
      score: {percentage}
      threshold: 100%
      weight: 5%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 10
      items_passed: {count}

    - name: "Implementation Shortcuts"
      score: {percentage}
      threshold: 80%
      weight: 10%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: 25
      items_passed: {count}
      findings:
        hardcoding: []
        leftover_code: []
        exception_handling: []
        stub_implementation: []
        test_integrity: []
        dependency_hygiene: []

  # Detailed Issues
  issues:
    critical:
      - category: {architecture|api_contract|test_integrity|security|build|implementation_shortcuts}
        section: {section_name}
        item_id: {e.g., "2.3", "C1"}
        issue: {description}
        location: {file:line}
        current: {what exists}
        expected: {what's required}
        fix: {how to fix}
    major:
      - category: {architecture|api_contract|code_quality|implementation_shortcuts}
        section: {section_name}
        item_id: {e.g., "6.7"}
        issue: {description}
        location: {file:line}
        recommendation: {how to fix}
    minor:
      - category: {code_quality|documentation|implementation_shortcuts}
        section: {section_name}
        item_id: {e.g., "9.2"}
        issue: {description}
        location: {file:line}
        suggestion: {optional improvement}

  # Summary
  total_critical_issues: {count}
  total_major_issues: {count}
  total_minor_issues: {count}
  sections_passed: {count}/11
  sections_failed: {count}/11

  # Blocking Status
  blocking: {true if status = FAIL}
  blocking_reason: {summary if blocking}
  ready_for_qa: {true if status = PASS}
```

## Decision Logic for Overall Result

**PASS** (Implementation ready for QA):
- `critical_items.status = PASS` (all 7 critical items pass)
- `overall_score ≥ 95%` (weighted score across all sections)
- All "100% required" sections = 100%
- All "≥X% required" sections meet threshold
- `total_critical_issues = 0`

**FAIL** (Implementation not ready):
- `critical_items.status = FAIL` (any critical item fails) OR
- `overall_score < 95%` OR
- Any "100% required" section < 100% OR
- Any "≥X% required" section below threshold OR
- `total_critical_issues > 0`

## Usage Context

**Called by**:
- `dev-self-review.md` - Before marking story as Review
- Dev agent - During implementation for quick checks (optional)

**Returns to Caller**:
- Validation complete with structured result
- All issues documented with specific locations and fixes
- Clear PASS/FAIL decision for each gate

**Do NOT**:
- Modify any files
- Update story status
- Make decisions beyond validation

## Key Principles

- **Unified Interface**: Single call validates all quality gates
- **Structured Output**: All results in consistent YAML format
- **Actionable Feedback**: Specific locations, current vs expected, fixes
- **Non-blocking for Minor**: Allow progress with recommendations
- **Critical Issues Block**: Must fix security and core violations
- **Conditional Execution**: Skip irrelevant validations (e.g., API contracts in monolith)

## References

- `tasks/utils/load-architecture-context.md`
- Architecture documents in `docs/architecture/`
- API contracts in product repo: `docs/api-contracts.md`
- Epic YAML in product repo: `docs/prd/epic-{epic_id}-{title-slug}.yaml`
- `core-config.yaml` - project configuration
- `data/technical-preferences.md`
