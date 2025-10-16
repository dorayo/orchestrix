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

## Process

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

## Outputs

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

### Output 3: Update Story File

Update `{devStoryLocation}/{epic}.{story}.*.md`:

**QA Test Design Metadata:**
```markdown
## QA Test Design Metadata

- **Level:** {Simple|Standard|Comprehensive}
- **Status:** Complete
- **Document:** qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
- **Risk Profile:** {path if exists}
```

**Status:** `TestDesignComplete`

**Change Log:**
```markdown
### {YYYY-MM-DD HH:MM} - Test Design Complete
- Doc: qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
- Scenarios: {total} (P0: {p0}, P1: {p1}, P2: {p2})
- Status: TestDesignComplete
```

### Output 4: Handoff Message

```text
✅ Test Design Complete: {epic}.{story}

📋 qa/assessments/{epic}.{story}-test-design-{YYYYMMDD}.md
📊 {total} scenarios ({unit}U, {int}I, {e2e}E) | P0:{p0} P1:{p1} P2:{p2}

Next: Dev execute 'implement-story {epic}.{story}'
```

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