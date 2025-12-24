# test-design

Design test strategy: what to test, at which level, and why.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}'
  - story_path: '{devStoryLocation}/{epic}.{story}.*.md'
  - story_title: '{title}' # Derive from H1 if missing
  - story_slug: '{slug}' # Derive from title if missing
```

## Purpose

Identify test scenarios, assign levels (unit/integration/e2e), and priorities (P0-P3) for efficient coverage without redundancy.

## Dependencies

```yaml
data:
  - test-levels-framework.md
  - test-priorities-matrix.md
  - blind-spot-categories.yaml
```

## Prerequisites

- Story.status = AwaitingTestDesign
- Story has test_design_level metadata (Standard or Comprehensive)
- Required data files accessible (test-levels-framework.md, test-priorities-matrix.md)

## Process

### Step 0.5: Permission Validation

Execute:
```
{root}/tasks/util-validate-agent-action.md
```

Input:
```yaml
agent_id: qa
story_path: {story_path}
action: test_design
```

* On failure → output error → **HALT**
* On success → continue

---

### Step 0: Idempotency Check (MANDATORY - Fast Exit)

**Locate Story File** (⚠️ MUST use Glob - filenames include title slug):

> **NEVER** attempt to Read directly with `{story_id}.md` - this will fail.

1. **Use Glob tool FIRST**: `{devStoryLocation}/{story_id}.*.md`
2. **Then Read** the exact file path returned by Glob

**Extract**: Story.status, QA Test Design Metadata.test_design_status

**Check Status and Output Appropriate Message**:

Use template: `{root}/templates/qa-idempotency-messages.yaml`

- **If status = "Approved" AND test_design_status = "Complete"**: Output `test_design_complete` message → **HALT**
- **If status = "TestDesignComplete"**: Output `test_design_auto_transition` message → **Skip to Step 6**
- **If status NOT "AwaitingTestDesign"**: Output `not_ready_test_design` message → **HALT**

**If status = "AwaitingTestDesign"**:
- ✅ Log: "Idempotency check passed - proceeding with test design"
- Continue to Step 1

---

### 1. Analyze Story Requirements

Per AC, identify: core functionality, data variations, error conditions, edge cases.

### 2. Apply Test Level Framework

Load `test-levels-framework.md`.

- **Unit**: Logic, algorithms, calculations
- **Integration**: Component interactions, DB ops
- **E2E**: Critical journeys, compliance

### 3. Assign Priorities

Load `test-priorities-matrix.md`.

- **P0**: Revenue-critical, security, compliance
- **P1**: Core journeys, frequent use
- **P2**: Secondary features, admin
- **P3**: Nice-to-have, rare use

### 4. Design Test Scenarios

```yaml
test_scenario:
  id: '{epic}.{story}-{LEVEL}-{SEQ}'
  requirement: 'AC ref'
  priority: P0|P1|P2|P3
  level: unit|integration|e2e
  description: 'What tested'
  justification: 'Why level'
  mitigates_risks: ['RISK-001']
```

### 4.5. Blind Spot Coverage Design

**Purpose**: Systematically identify test scenarios for Dev blind spots.

**Load**: `{root}/data/blind-spot-categories.yaml`

**4.5.1 Determine Applicable Categories**

Based on story type, select high-priority categories:

| Story Type | High Priority Categories |
|------------|-------------------------|
| Backend API | BOUNDARY, ERROR, CONCURRENCY, DATA, RESOURCE |
| Frontend UI | BOUNDARY, FLOW, ERROR |
| Full-stack | All categories |
| Library | BOUNDARY, ERROR, RESOURCE |

**4.5.2 Generate Blind Spot Scenarios**

For each AC, iterate through applicable categories:

```
FOR each AC in story:
  FOR each category in applicable_categories:
    FOR each check_point in category.check_points:
      IF check_point applies to this AC:
        CREATE test_scenario with:
          id: '{epic}.{story}-BLIND-{category_id}-{SEQ}'
          requirement: 'AC ref'
          priority: P1 (critical path) | P2 (edge case)
          level: unit | integration (based on check_point type)
          description: '{check_point.name}: {specific scenario}'
          blind_spot_ref: '{check_point.id}'
          tag: '[BLIND-SPOT]'
```

**4.5.3 Blind Spot Scenario Format**

```yaml
test_scenario:
  id: '{epic}.{story}-BLIND-BOUNDARY-001'
  requirement: 'AC1'
  priority: P1
  level: unit
  description: 'Null input handling for user email field'
  blind_spot_ref: 'BOUNDARY-001'
  tag: '[BLIND-SPOT]'
```

**Minimum Coverage Requirements**:
- At least 1 BOUNDARY scenario per input field
- At least 1 ERROR scenario per external dependency
- At least 1 FLOW scenario per multi-step process

### 5. Validate Coverage

**Standard Coverage**:
- Every AC has ≥1 test
- No duplicate coverage
- Critical paths multi-level
- Risks addressed

**Blind Spot Coverage**:
- Each input field has BOUNDARY scenario
- Each external dependency has ERROR scenario
- Each multi-step process has FLOW scenario
- Security-sensitive operations have CONCURRENCY scenario
- Database operations have DATA scenario

---

## Story Status Update (CRITICAL - DO NOT SKIP)

**Execute AFTER test design validation, BEFORE saving outputs**

### Step 6: Two-Phase Status Transition

QA test-design requires **TWO sequential status updates** per `story-status-transitions.yaml`:

**Phase 1: AwaitingTestDesign → TestDesignComplete**

Execute `{root}/tasks/util-validate-agent-action.md` with:
```yaml
agent_id: qa
story_path: {story_path}
action: complete_test_design
target_status: TestDesignComplete
```
- Verify status field updated and saved

**Phase 2: TestDesignComplete → Approved (Auto-transition)**

Execute `{root}/tasks/util-validate-agent-action.md` with:
```yaml
agent_id: qa
story_path: {story_path}
action: approve_after_test_design
target_status: Approved
```
- Verify status field updated and saved

**On validation FAIL**: HALT with error

**Rationale**: Cannot directly jump AwaitingTestDesign → Approved (invalid transition per yaml)

---

## Outputs

### Output 0: Story Status Update (MUST be done first)

**CRITICAL**: Execute TWO-PHASE status update BEFORE generating other outputs.

**Phase 1**: Update `Story.status = "TestDesignComplete"`
**Phase 2**: Update `Story.status = "Approved"` (auto-transition)

**Verify**:
- Re-read Story file after each phase
- Confirm status field updated correctly
- If either phase verification fails: HALT

### Output 1: Test Design Document

**Save:** `qa.qaLocation/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md`

```markdown
# Test Design: {epic}.{story}

{date} | Quinn

## Overview

Total: X | Unit: Y (A%) | Int: Z (B%) | E2E: W (C%)
Priority: P0: X, P1: Y, P2: Z
Blind Spot Scenarios: N

## Scenarios by AC

### AC1: {description}

| ID           | Lvl | Pri | Test              | Why              |
| ------------ | --- | --- | ----------------- | ---------------- |
| 1.3-UNIT-001 | U   | P0  | Validate input    | Pure validation  |
| 1.3-INT-001  | I   | P0  | Service processes | Multi-component  |
| 1.3-E2E-001  | E   | P1  | User journey      | Critical path    |

[Continue for all ACs]

## Blind Spot Scenarios [BLIND-SPOT]

| ID | Category | Pri | Scenario | Ref |
|----|----------|-----|----------|-----|
| 1.3-BLIND-BOUNDARY-001 | BOUNDARY | P1 | Null email input | BOUNDARY-001 |
| 1.3-BLIND-ERROR-001 | ERROR | P1 | API timeout handling | ERROR-001 |
| 1.3-BLIND-FLOW-001 | FLOW | P2 | Cancel mid-submission | FLOW-001 |

[Continue for all blind spot scenarios]

## Risk Coverage

[Map to risks if profile exists]

## Execution Order

1. P0 Unit
2. P0 Int
3. P0 E2E
4. P1 (including blind spot scenarios)
5. P2+
```

### Output 2: Gate YAML Block

```yaml
test_design:
  scenarios_total: X
  by_level: {unit: Y, integration: Z, e2e: W}
  by_priority: {p0: A, p1: B, p2: C}
  blind_spot_scenarios:
    total: N
    by_category: {BOUNDARY: X, ERROR: Y, FLOW: Z, CONCURRENCY: A, DATA: B, RESOURCE: C}
  coverage_gaps: []
```

### Output 3: Update Story File Metadata

Update `{devStoryLocation}/{epic}.{story}.*.md`:

**QA Test Design Metadata:**
```markdown
## QA Test Design Metadata

- **Level:** {Simple|Standard|Comprehensive}
- **Status:** Complete
- **Test Design Status:** Complete
- **Document:** qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
- **Risk Profile:** {path if exists}
```

**Change Log** (add entry):
```markdown
### {YYYY-MM-DD HH:MM} - Test Design Complete, Story Approved
- Test Design Doc: qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
- Scenarios: {total} (P0: {p0}, P1: {p1}, P2: {p2})
- Status: AwaitingTestDesign → TestDesignComplete → Approved (QA two-phase transition)
- Ready for Dev implementation
```

**Note**: Story.status field is updated in Output 0, not here. This section only updates metadata.

### Output 3.5: Backfill Test Specs to Story Tasks (Standard/Comprehensive ONLY)

**Skip if**: test_design_level = Simple

**Purpose**: Embed key test scenarios into Story Tasks section for Dev reference.

**Process**:

1. Locate Tasks section in Story file
2. For each AC task block, insert Test Specs table between AC title and TDD steps

**Before (SM created)**:
```markdown
- [ ] AC{N}: {ac_title}
  - [ ] Write test for AC{N}
  - [ ] Implement to pass test
  - [ ] Verify & refactor
```

**After (QA backfilled)**:
```markdown
- [ ] AC{N}: {ac_title}

  **Test Specs** (white-box scenarios from test-design):
  | Scenario | Input | Expected | Level |
  |----------|-------|----------|-------|
  | {success_case} | {valid_input} | {success_result} | unit |
  | {error_case_1} | {invalid_input} | {error_code} | unit |
  | {error_case_2} | {edge_condition} | {error_code} | unit |
  | {integration_case} | {complex_flow} | {expected_state} | integration |

  - [ ] Write tests (cover above scenarios)
  - [ ] Implement to pass tests
  - [ ] Verify & refactor
```

**Table columns**:
- **Scenario**: Short name (success/error/edge)
- **Input**: Trigger condition
- **Expected**: Result or error code
- **Level**: unit | integration | e2e

**Scenario selection per AC**:
- Include all P0 scenarios
- Include P1 scenarios if ≤5 total per AC
- Omit P2/P3 (reference full doc)

**Validation**:
- Each AC has ≥1 scenario
- Table renders correctly in markdown
- TDD steps preserved below table

### Output 4: Handoff Message (REQUIRED - MUST BE FINAL OUTPUT)

Use template: `{root}/templates/qa-handoff-message-tmpl.yaml`

Select message: `test_design_complete`

**CRITICAL**: The handoff command `*develop-story {story_id}` MUST be the last line of your output.

### Output 5: Trace References

```text
Test design: qa.qaLocation/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
P0: {count}
```

## Quality Checklist

**Standard Coverage**:
- [ ] Every AC covered
- [ ] Levels appropriate
- [ ] No duplicates
- [ ] Priorities align with risk
- [ ] IDs follow convention
- [ ] Scenarios atomic

**Blind Spot Coverage**:
- [ ] BOUNDARY scenarios for input fields
- [ ] ERROR scenarios for external dependencies
- [ ] FLOW scenarios for multi-step processes
- [ ] All [BLIND-SPOT] scenarios tagged correctly

## Principles

- **Shift left**: Unit > Int > E2E
- **Risk-based**: Focus failures
- **Efficient**: Test once, right level
- **Maintainable**: Long-term cost
- **Fast feedback**: Quick first