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
  - cumulative_context: Pre-loaded cumulative context from parent task
```

## Process

### 1. Load Story Context

Read story file from `{story_path}`.

Extract:
- `story.dev_notes` → validation reference
- `story.dev_notes.file_locations` → expected file structure
- `story.dev_notes.technical_constraints` → standards to enforce
- `story.acceptance_criteria` → all ACs to verify implementation against
- `story.ac_traceability` → implementation evidence (if exists)

DO NOT load architecture documents. All relevant constraints are in Dev Notes.

---

### 1.5 Task Checkbox Completion Validation

**Objective**: Verify all Tasks/Subtasks checkboxes are marked complete and match actual deliverables.

**1.5.1 Extract Checkbox Status**

Parse `## Tasks / Subtasks` section from story file.

For each line matching `- [ ]` or `- [x]`:
```yaml
checkbox_item:
  raw_text: '{full line text}'
  checked: true | false
  type: ac | subtask | integration | final
  ac_id: '{AC number if applicable}'
  subtask_type: 'write_test' | 'implement' | 'verify' | 'other'
```

**1.5.2 Validate Checkbox Completion**

**Checks**:

| Condition | Severity | Issue |
|-----------|----------|-------|
| Any AC checkbox unchecked | CRITICAL | "AC{N} not marked complete" |
| Any "Write test" subtask unchecked | CRITICAL | "Test for AC{N} not marked complete" |
| Any "Implement" subtask unchecked | CRITICAL | "Implementation for AC{N} not marked complete" |
| "All tests passing" unchecked | CRITICAL | "Final verification incomplete" |
| "Dev Log complete" unchecked | MAJOR | "Dev Log not marked complete" |

**1.5.3 Cross-Validate Checkbox vs Deliverables**

For each checked "Write test for AC{N}" subtask:
1. Extract AC{N} description from Acceptance Criteria section
2. Search test files for test case matching AC{N} keywords
3. If no matching test found → CRITICAL: "Checkbox checked but test not found for AC{N}"

For each checked "Implement to pass test" subtask:
1. Verify corresponding test exists and passes
2. If test missing or failing → CRITICAL: "Checkbox checked but implementation incomplete for AC{N}"

**1.5.4 Calculate Completion Metrics**

```yaml
task_completion:
  total_checkboxes: {count}
  checked_count: {count}
  unchecked_count: {count}
  completion_rate: {percentage}
  cross_validation:
    tests_claimed: {count of "Write test" checked}
    tests_found: {count of matching test files/cases}
    match_rate: {percentage}
```

**Task Checkbox Result**:
```yaml
task_checkbox_validation:
  result: PASS | FAIL
  completion_rate: {percentage}
  cross_validation_rate: {percentage}
  unchecked_items: [{item_text, type, ac_id}]
  mismatches: [{checkbox_text, expected_deliverable, actual_status}]
  issues:
    critical: [{issue, checkbox_text, action}]
    major: [{issue, checkbox_text, action}]
```

**Decision Logic**:
- PASS: completion_rate = 100% AND cross_validation_rate >= 90% AND zero critical issues
- FAIL: Any unchecked critical item OR cross_validation_rate < 90% OR any critical issue

---

### 1.6 AC Traceability Verification (CRITICAL - Evidence-Based)

**Objective**: Verify EVERY Acceptance Criterion has corresponding implementation WITH EVIDENCE. This replaces subjective "I implemented all ACs" claims with verifiable proof.

**1.6.1 Build AC Traceability Matrix**

For EACH AC in `story.acceptance_criteria`:

```yaml
ac_traceability_entry:
  ac_id: '{AC number}'
  ac_description: '{AC title/description}'

  # MANDATORY - Dev must provide these
  implementation:
    code_locations: []     # List of "file:line_start-line_end" or "file:function_name"
    verification_type: 'unit_test' | 'integration_test' | 'e2e_test' | 'manual'
    test_locations: []     # List of "test_file:test_name" or "test_file:line"

  # Validation results
  validation:
    code_exists: true | false
    code_implements_ac: true | false  # Does the code actually fulfill the AC?
    test_exists: true | false
    test_covers_ac: true | false
    status: VERIFIED | MISSING_CODE | MISSING_TEST | INCOMPLETE | NOT_FOUND
```

**1.6.2 Verify Each AC Implementation**

For each AC entry:

**Step A: Code Location Verification**
1. Check if `code_locations` is populated (not empty)
2. Navigate to each listed location
3. Read the code at that location
4. Verify the code actually implements the AC requirement (semantic check)

**Validation Checks**:

| Condition | Severity | Issue |
|-----------|----------|-------|
| `code_locations` is empty | CRITICAL | "No implementation location provided for {AC_ID}" |
| File does not exist | CRITICAL | "Implementation file not found: {file_path} for {AC_ID}" |
| Code at location is unrelated to AC | CRITICAL | "Code at {location} does not implement {AC_ID}" |
| Code partially implements AC | MAJOR | "Partial implementation for {AC_ID}: {missing_aspect}" |

**Step B: Test Coverage Verification**
1. Check if `test_locations` is populated
2. Navigate to each test location
3. Verify test actually tests the AC (not just "exists")

**Validation Checks**:

| Condition | Severity | Issue |
|-----------|----------|-------|
| `test_locations` is empty | HIGH | "No test location provided for {AC_ID}" |
| Test file does not exist | HIGH | "Test file not found: {test_file} for {AC_ID}" |
| Test doesn't assert AC behavior | MAJOR | "Test at {location} doesn't verify {AC_ID} requirements" |
| Test is stub/empty | CRITICAL | "Test for {AC_ID} is a stub with no assertions" |

**1.6.3 Cross-Reference with AC Requirements**

For each AC, verify ALL aspects are covered:

| AC Aspect | Verification Method |
|-----------|-------------------|
| Business Rules (BR-X.x) | Search code for rule implementation |
| Data Validation | Search for validation logic/schema |
| Error Handling | Search for error scenarios handling |
| UI Interaction (if any) | Search for interaction handlers |

**1.6.4 Generate AC Traceability Report**

```yaml
ac_traceability_result:
  total_acs: {count}
  verified: {count}
  missing_code: {count}
  missing_test: {count}
  incomplete: {count}

  coverage_rate: {percentage}  # verified / total_acs

  matrix:
    - ac_id: AC1
      description: "..."
      code_locations: ["src/service.ts:45-67"]
      test_locations: ["tests/service.test.ts:23"]
      code_verified: true | false
      test_verified: true | false
      status: VERIFIED | MISSING_CODE | MISSING_TEST | INCOMPLETE
      issues: []
    # ... repeat for each AC

  issues:
    critical: [{ac_id, issue, expected, actual}]
    high: [{ac_id, issue, recommendation}]
    major: [{ac_id, issue, recommendation}]
```

**AC Traceability Gate Decision**:

```yaml
ac_traceability:
  result: PASS | FAIL
  coverage_rate: {percentage}
  acs_verified: {count}/{total}
```

**Decision Logic**:
- PASS: coverage_rate = 100% AND zero critical issues AND zero high issues
- FAIL: coverage_rate < 100% OR any critical issue OR any high issue

**Important**: This is a HARD GATE. A single unverified AC = FAIL.

---

### 2. Architecture Compliance Validation

Validate implementation against `story.dev_notes`.

**2.1 Tech Stack Compliance**

Cross-reference implementation files with `dev_notes.technical_constraints`.

**Checks**:
- Unapproved technologies → CRITICAL
- Wrong versions → MAJOR
- Deprecated packages → MAJOR

**2.2 Naming Convention Compliance**

Validate against patterns in `dev_notes.technical_constraints`.

**Checks**:
- Incorrect casing → MAJOR
- Non-standard prefixes/suffixes → MINOR
- Inconsistent naming patterns → MINOR

**2.3 File Structure Alignment**

Validate against `dev_notes.file_locations`.

**Checks**:
- Files in wrong directories → MAJOR
- Incorrect test file placement → MAJOR

**2.4 API Pattern Consistency** (Backend/Full-stack only)

Validate against `dev_notes.data_models` and acceptance criteria.

**Checks**:
- Non-standard endpoints → MAJOR
- Response format violations → MAJOR
- Auth pattern violations → CRITICAL

**2.5 Data Model Alignment** (Backend/Full-stack only)

Validate against `dev_notes.database_design` and `dev_notes.data_models`.

**Checks**:
- Model definition mismatches → MAJOR
- Wrong field types → MAJOR
- Missing required fields → MAJOR

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

**Execute**: `{root}/checklists/gate-implementation-shortcuts.md`

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

**Note**: Implementation Shortcuts validation is executed externally via `implementation-shortcuts.md`. Its results are merged into `gate_result.sections[10]` (index 10, "Implementation Shortcuts" section).

---

### 6. Deliverable Binding Verification (CRITICAL)

**Objective**: Confirm every new deliverable has verified consumer binding. No orphaned code should pass this gate.

**Purpose**: Prevent "component island" problem where code exists and tests pass but feature is unreachable by users.

**6.1 Load Binding Specifications**

Read `story.deliverable_bindings[]` from story file (under Dev Notes section).

**If empty, missing, or marked "N/A"**:
1. Scan `story.file_list` for files with status "created" or "new"
2. If new files exist without bindings defined:
   - Severity: MAJOR
   - Issue: "New file {path} has no defined consumer binding"
3. If no new files detected: SKIP this section, result = N_A

**6.2 Binding Verification Process**

For each entry in `deliverable_bindings[]`:

```yaml
binding_check:
  deliverable: {from story}
  consumer: {from story}
  binding_type: {from story}
  verify: {regex pattern from story}

  steps:
    1. LOCATE consumer file
       - If file not found: CRITICAL "Consumer file not found: {consumer}"

    2. SEARCH consumer file for verify pattern
       - Command: grep -E "{verify}" {consumer}
       - If pattern not matched: CRITICAL "Binding not found: {verify} not in {consumer}"

    3. IF binding_type == "import_usage":
       - Verify import statement exists (pattern matched in step 2)
       - Verify actual usage exists (deliverable identifier appears after import line)
       - If import exists but no usage: MAJOR "Imported but unused: {deliverable}"

    4. IF binding_type == "export_public":
       - Verify export statement in index/entrypoint file
       - If not exported: CRITICAL "Deliverable not exported from module entrypoint"

  result:
    status: PASS | FAIL
    evidence: "Line {N}: {matching_line}" | "Not found"
```

**6.3 Detect Unlisted Deliverables**

Cross-reference `story.file_list` (created files) with `deliverable_bindings`:

```
For each file in file_list where status == "created":
  If file NOT in any deliverable_bindings[].deliverable:
    Severity: MAJOR
    Issue: "New file {path} created but no binding defined"
    Recommendation: "Add binding entry or confirm file is internal helper"
```

**6.4 Validation Checks**

| Condition | Severity | Issue |
|-----------|----------|-------|
| Consumer file not found | CRITICAL | "Consumer {path} does not exist" |
| Verify pattern not matched | CRITICAL | "Deliverable not bound: {pattern} not in {consumer}" |
| Import exists but no usage | MAJOR | "Deliverable imported but never used in {consumer}" |
| New file without binding entry | MAJOR | "New file {path} has no consumer binding defined" |
| Export missing from index | CRITICAL | "Deliverable not exported from module entrypoint" |

**6.5 Binding Verification Result**

```yaml
binding_verification:
  result: PASS | FAIL | N_A
  total_bindings: {count}
  verified: {count}
  failed: {count}
  unlisted_new_files: {count}

  details:
    - deliverable: "{path}"
      consumer: "{path}"
      binding_type: "{type}"
      status: PASS | FAIL
      evidence: "Line 12: import { Component } from './component'"
      usage_confirmed: true | false

  issues:
    critical:
      - deliverable: "{path}"
        consumer: "{path}"
        expected: "{verify pattern}"
        actual: "not found"
        fix: "Add import/usage of {deliverable} in {consumer}"
    major:
      - deliverable: "{path}"
        issue: "Imported but unused"
        recommendation: "Add actual usage or remove import"
```

**Decision Logic**:
- PASS: All bindings verified (100% match rate) AND zero unlisted new files
- FAIL: Any CRITICAL binding failed OR >2 MAJOR issues
- N_A: No deliverable_bindings defined AND no new files in file_list

**Weight**: 8% of overall gate score

---

### 7. Generate Unified Validation Report

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

  # Critical Items (10 mandatory items)
  critical_items:
    total: 10
    passed: {count}
    status: {PASS|FAIL}  # PASS only if all 10 pass
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
        check: "AC Traceability: All ACs have verified implementation evidence"
        status: {PASS|FAIL}
        evidence: {ac_traceability_result with coverage_rate and matrix}
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
      - id: C8
        check: "All task checkboxes complete and verified"
        status: {PASS|FAIL}
        evidence: {checkbox completion rate and cross-validation result}
      - id: C9
        check: "AC Traceability Matrix fully populated"
        status: {PASS|FAIL}
        evidence: {ac_traceability section in story file}
      - id: C10
        check: "Deliverable bindings verified (no orphaned code)"
        status: {PASS|FAIL|N_A}
        evidence: {binding_verification result with details}

  # Sections (14 validation sections)
  sections:
    - name: "Task Checkbox Completion"
      score: {percentage}
      threshold: 100%
      weight: 6%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: {total_checkboxes}
      items_passed: {checked_count}
      cross_validation_rate: {percentage}
      unchecked_items: [{item_text, type, ac_id}]
      mismatches: [{checkbox_text, expected, actual}]

    - name: "AC Traceability"
      score: {percentage}
      threshold: 100%
      weight: 12%
      weighted_score: {percentage}
      passed: {true|false}
      items_total: {total_acs}
      items_passed: {verified_count}
      coverage_rate: {percentage}
      matrix:
        - ac_id: {id}
          code_verified: {true|false}
          test_verified: {true|false}
          status: {VERIFIED|MISSING_CODE|MISSING_TEST|INCOMPLETE}
      issues:
        critical: [{ac_id, issue, expected, actual}]
        high: [{ac_id, issue, recommendation}]

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

    - name: "Deliverable Binding Verification"
      score: {percentage|N_A}
      threshold: 100%
      weight: 8%
      weighted_score: {percentage}
      passed: {true|false|N_A}
      items_total: {total_bindings}
      items_passed: {verified_count}
      unlisted_new_files: {count}
      details:
        - deliverable: "{path}"
          consumer: "{path}"
          binding_type: "{type}"
          status: PASS | FAIL
          evidence: "{matching_line}"

  # Detailed Issues
  issues:
    critical:
      - category: {architecture|api_contract|test_integrity|security|build|implementation_shortcuts|binding_verification}
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
  sections_passed: {count}/12
  sections_failed: {count}/12

  # Blocking Status
  blocking: {true if status = FAIL}
  blocking_reason: {summary if blocking}
  ready_for_qa: {true if status = PASS}
```

## Decision Logic for Overall Result

**PASS** (Implementation ready for QA):
- `critical_items.status = PASS` (all 8 critical items pass)
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

- Story Dev Notes (primary validation source)
- API contracts in product repo: `docs/api-contracts.md` (multi-repo only)
- Epic YAML in product repo: `docs/prd/epic-{epic_id}-{title-slug}.yaml` (multi-repo only)
- `core-config.yaml` - project configuration
