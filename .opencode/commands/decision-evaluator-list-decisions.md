---
description: "Task: List Available Decisions"
---

When this command is used, execute the following task:

# Task: List Available Decisions

**Purpose**: Display all available decision types with descriptions and required context fields.

**Role**: Decision Evaluator SubAgent

**Input**: None

**Output**: Formatted list of all decision types

---

## Execution Steps

### Step 1: List All Decision Files

Scan `.orchestrix-core/data/` directory for all files matching pattern `decisions-*.yaml`.

### Step 2: Display Decision Catalog

```markdown
# Available Decision Types

## SM (Scrum Master) Decisions

### 1. sm-story-status

**File**: decisions-sm-story-status.yaml
**Purpose**: Determine final story status after quality assessment and architect review
**Required Context**:

- `architect_review_result`: (enum) REQUIRED | NOT_REQUIRED | APPROVED | ESCALATED
- `test_design_level`: (enum) Simple | Standard | Comprehensive

**Possible Results**: TestDesignComplete, AwaitingArchReview, RequiresRevision, Blocked, Escalated

**Used By**: SM (create-next-story, revise-story)

---

### 2. sm-architect-review-needed

**File**: decisions-sm-architect-review-needed.yaml
**Purpose**: Determine if story requires architect review based on quality and complexity
**Required Context**:

- `quality_score`: (number 0-10) Overall quality score
- `complexity_indicators`: (number 0-7) Count of complexity indicators

**Possible Results**: REQUIRED, NOT_REQUIRED, BLOCKED

**Used By**: SM (create-next-story)

---

### 3. sm-test-design-level

**File**: decisions-sm-test-design-level.yaml
**Purpose**: Determine required test design level based on complexity and security
**Required Context**:

- `complexity_indicators`: (number 0-7) Count of complexity indicators
- `quality_score`: (number 0-10) Overall quality score
- `security_sensitive`: (boolean) Whether story involves security operations

**Possible Results**: Simple, Standard, Comprehensive

**Used By**: SM (create-next-story)

---

## Architect Decisions

### 4. architect-review-result

**File**: decisions-architect-review-result.yaml
**Purpose**: Determine review outcome based on architecture score and issues
**Required Context**:

- `architecture_score`: (number 0-10) Technical architecture score
- `critical_issues`: (number) Count of critical issues found
- `review_round`: (number) Current review iteration

**Possible Results**: Approved, RequiresRevision, Escalated

**Used By**: Architect (architect-review-story)

---

## QA Decisions

### 5. qa-gate-decision

**File**: decisions-qa-gate-decision.yaml
**Purpose**: Determine if story passes QA gate with progressive standards
**Required Context**:

- `review_round`: (number) Current QA review iteration
- `issues_by_severity`: (object) Issue counts by severity
  - `critical`: (number) Critical issues
  - `high`: (number) High priority issues
  - `medium`: (number) Medium priority issues
  - `low`: (number) Low priority issues
- `previous_issues`: (object, optional) Issues from previous round

**Possible Results**: PASS, CONCERNS, FAIL, WAIVED

**Used By**: QA (qa-review-story)

---

### 6. qa-post-review-workflow

**File**: decisions-qa-post-review-workflow.yaml
**Purpose**: Determine next workflow action after QA review
**Required Context**:

- `gate_result`: (enum) PASS | CONCERNS | FAIL | WAIVED
- `final_status`: (enum) Done | Review | Escalated | Blocked
- `review_round`: (number) Current review iteration
- `issues_by_severity`: (object) Issue counts

**Possible Results**:

- `workflow_action`: finalize_commit | handoff_to_dev_fix | escalate_to_architect | ...
- `requires_git_commit`: (boolean)
- `next_agent`: (string) Target agent ID

**Used By**: QA (qa-review-story)

---

## Dev Decisions

### 7. dev-self-review-decision

**File**: decisions-dev-self-review-decision.yaml
**Purpose**: Determine if implementation is ready for QA review
**Required Context**:

- `implementation_gate_score`: (number 0-100) Gate checklist percentage
- `architecture_compliance`: (enum) PASS | FAIL
- `api_contract_compliance`: (enum) PASS | FAIL | N_A
- `test_integrity`: (enum) PASS | FAIL
- `dod_score`: (number 0-100) Definition of Done percentage
- `critical_issues`: (number) Count of critical issues
- `implementation_round`: (number) Current implementation iteration

**Possible Results**: PASS, FAIL, ESCALATE

**Used By**: Dev (dev-self-review)

---

## Quick Reference Table

| Decision Type              | Agent     | Input Fields        | Output Values   |
| -------------------------- | --------- | ------------------- | --------------- |
| sm-story-status            | SM        | 2 enums             | 5 statuses      |
| sm-architect-review-needed | SM        | 2 numbers           | 3 results       |
| sm-test-design-level       | SM        | 2 numbers + 1 bool  | 3 levels        |
| architect-review-result    | Architect | 3 numbers           | 3 results       |
| qa-gate-decision           | QA        | 1 number + 1 object | 4 results       |
| qa-post-review-workflow    | QA        | 2 enums + others    | Workflow object |
| dev-self-review-decision   | Dev       | 7 mixed inputs      | 3 results       |

---

**Total**: 7 decision types (12 decision files including variants)

**Usage**: Use `*evaluate-decision {decision_type}` with appropriate context
```

---

## Notes

- Decision files are located in `.orchestrix-core/data/` with `decisions-` prefix (e.g., `decisions-qa-gate-decision.yaml`)
- All decisions follow the same rule evaluation pattern
- Context fields must match exactly (case-sensitive)
- Enum values must match exactly (case-sensitive)
