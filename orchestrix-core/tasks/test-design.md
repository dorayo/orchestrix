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
```

## Prerequisites

- Story.status = AwaitingTestDesign
- Story has test_design_level metadata (Standard or Comprehensive)
- Required data files accessible (test-levels-framework.md, test-priorities-matrix.md)

## Process

### Step 0: Idempotency Check (MANDATORY - Fast Exit)

**Read Story File**: Use glob pattern `{devStoryLocation}/{story_id}.*.md`

**Extract**: Story.status, QA Test Design Metadata.test_design_status

**Check if Already Completed**:

- **If status = "Approved" AND test_design_status = "Complete"**:
  ```
  ℹ️ TEST DESIGN ALREADY COMPLETE
  Story: {story_id}
  Status: Approved
  Test Design: Complete

  Test design already completed. Story ready for Dev implementation.

  🎯 HANDOFF TO dev: *develop-story {story_id}
  ```
  **HALT: Test design already done, Dev handoff sent ✋**

- **If status = "TestDesignComplete"**:
  ```
  ℹ️ TEST DESIGN COMPLETE - AUTO-TRANSITIONING
  Story: {story_id}
  Current Status: TestDesignComplete

  Test design complete, auto-transitioning to Approved for Dev.

  (Proceeding to auto-transition)
  ```
  **Skip to Step 6** (Status Update)

- **If status NOT "AwaitingTestDesign"**:
  ```
  ⚠️ STORY NOT READY FOR TEST DESIGN
  Story: {story_id}
  Current Status: {current_status}

  Required status: AwaitingTestDesign

  HALT: Prerequisites not met ⛔
  ```

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

### 5. Validate Coverage

- Every AC has ≥1 test
- No duplicate coverage
- Critical paths multi-level
- Risks addressed

---

## Story Status Update (CRITICAL - DO NOT SKIP)

**Execute AFTER test design validation, BEFORE saving outputs**

### Step 6: Two-Phase Status Transition

QA test-design requires **TWO sequential status updates**:

**Phase 1: AwaitingTestDesign → TestDesignComplete**

Execute `{root}/tasks/utils/validate-status-transition.md`:

```yaml
story_path: {{story_file_path}}
agent: qa
current_status: AwaitingTestDesign
target_status: TestDesignComplete
context:
  test_design_complete: true
  test_doc_created: true
  scenarios_count: {{total_scenarios}}
```

**On validation PASS**:

1. **Update Story.status field**:
   - Find Story metadata YAML block
   - Update `status: TestDesignComplete`
   - Save the file

2. **Verify update**:
   ```bash
   # Re-read Story file
   # Extract Story.status
   # Confirm: status == "TestDesignComplete"
   ```

3. **If verification fails**: HALT with error

**On validation FAIL**: HALT with error message

---

**Phase 2: TestDesignComplete → Approved (Auto-transition)**

Execute `{root}/tasks/utils/validate-status-transition.md`:

```yaml
story_path: {{story_file_path}}
agent: qa
current_status: TestDesignComplete
target_status: Approved
context:
  test_design_complete: true
  test_doc_created: true
  auto_transition: true
```

**On validation PASS**:

1. **Update Story.status field**:
   - Find Story metadata YAML block
   - Update `status: Approved`
   - Save the file

2. **Verify update**:
   ```bash
   # Re-read Story file
   # Extract Story.status
   # Confirm: status == "Approved"
   ```

3. **If verification fails**: HALT with error

**On validation FAIL**: HALT with error message

---

**Why Two Phases?**

Per `story-status-transitions.yaml`:
- `AwaitingTestDesign.to = [TestDesignComplete]` (only allowed transition)
- `TestDesignComplete.to = [Approved]` (auto-transition by QA)
- Cannot directly jump AwaitingTestDesign → Approved (invalid transition)

**Example Status Update Code** (pseudocode):
```python
# Phase 1: AwaitingTestDesign → TestDesignComplete
story_content = read_file(story_path)
story_yaml = extract_yaml_block(story_content, "Story")
story_yaml['status'] = "TestDesignComplete"
write_file(story_path, replace_yaml_block(story_content, "Story", story_yaml))

# Verify Phase 1
assert extract_yaml_block(read_file(story_path), "Story")['status'] == "TestDesignComplete"

# Phase 2: TestDesignComplete → Approved
story_content = read_file(story_path)
story_yaml = extract_yaml_block(story_content, "Story")
story_yaml['status'] = "Approved"
write_file(story_path, replace_yaml_block(story_content, "Story", story_yaml))

# Verify Phase 2
assert extract_yaml_block(read_file(story_path), "Story")['status'] == "Approved"
```

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

## Scenarios by AC

### AC1: {description}

| ID           | Lvl | Pri | Test              | Why              |
| ------------ | --- | --- | ----------------- | ---------------- |
| 1.3-UNIT-001 | U   | P0  | Validate input    | Pure validation  |
| 1.3-INT-001  | I   | P0  | Service processes | Multi-component  |
| 1.3-E2E-001  | E   | P1  | User journey      | Critical path    |

[Continue for all ACs]

## Risk Coverage

[Map to risks if profile exists]

## Execution Order

1. P0 Unit
2. P0 Int
3. P0 E2E
4. P1
5. P2+
```

### Output 2: Gate YAML Block

```yaml
test_design:
  scenarios_total: X
  by_level: {unit: Y, integration: Z, e2e: W}
  by_priority: {p0: A, p1: B, p2: C}
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

### Output 4: Handoff Message (REQUIRED - MUST BE FINAL OUTPUT)

```text
✅ TEST DESIGN COMPLETE
Story: {epic}.{story} → Status: Approved

📋 Test Design: qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
📊 {total} scenarios ({unit}U, {int}I, {e2e}E) | P0:{p0} P1:{p1} P2:{p2}

🎯 HANDOFF TO dev: *develop-story {epic}.{story}
```

**CRITICAL**: The handoff command `*develop-story {story_id}` MUST be the last line of your output.

### Output 5: Trace References

```text
Test design: qa.qaLocation/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
P0: {count}
```

## Quality Checklist

- [ ] Every AC covered
- [ ] Levels appropriate
- [ ] No duplicates
- [ ] Priorities align with risk
- [ ] IDs follow convention
- [ ] Scenarios atomic

## Principles

- **Shift left**: Unit > Int > E2E
- **Risk-based**: Focus failures
- **Efficient**: Test once, right level
- **Maintainable**: Long-term cost
- **Fast feedback**: Quick first