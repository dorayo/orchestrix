# Decision Evaluator SubAgent - User Guide

## Overview

The Decision Evaluator SubAgent is a specialized agent that executes YAML-based decision rules for the Orchestrix system. It provides automated, consistent, and efficient decision-making across all core agents (SM, Architect, Dev, QA).

**Key Benefits:**

- **Token Efficiency**: Saves 60-80% of token consumption on decision execution
- **Consistency**: 100% accurate rule execution with no interpretation variance
- **Session Caching**: Reuses loaded decision files within the same session
- **Dual-Track Safety**: Automatic fallback to inline execution if SubAgent unavailable

---

## Quick Start

### Installation

The Decision Evaluator is automatically installed with Orchestrix:

```bash
npx orchestrix install
```

After installation, the SubAgent will be available at `.claude/agents/decision-evaluator.md` (for Claude Code).

### Basic Usage

**In Claude Code:**

1. Open the SubAgent selector (`Cmd/Ctrl + Shift + P` → "Switch SubAgent")
2. Select `decision-evaluator`
3. Use commands like `*evaluate-decision`, `*list-decisions`, etc.

**From Other Agents:**
Use the `@decision-evaluator` mention:

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-story-status
Context:
  architect_review_result: NOT_REQUIRED
  test_design_level: Simple
```

---

## Supported Decision Types

### 1. SM Decisions

#### sm-story-status

**Purpose**: Determine final story status after quality assessment

**Required Context:**

- `architect_review_result`: (enum) REQUIRED | NOT_REQUIRED | APPROVED | ESCALATED
- `test_design_level`: (enum) Simple | Standard | Comprehensive

**Possible Results**: TestDesignComplete, AwaitingArchReview, RequiresRevision, Blocked, Escalated

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-story-status
Context:
  architect_review_result: NOT_REQUIRED
  test_design_level: Simple

Expected Result: TestDesignComplete
```

---

#### sm-architect-review-needed

**Purpose**: Determine if story requires architect review

**Required Context:**

- `quality_score`: (number 0-10) Overall quality score
- `complexity_indicators`: (number 0-7) Count of complexity indicators

**Possible Results**: REQUIRED, NOT_REQUIRED, BLOCKED

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-architect-review-needed
Context:
  quality_score: 9.0
  complexity_indicators: 2

Expected Result: REQUIRED (high complexity)
```

---

#### sm-test-design-level

**Purpose**: Determine required test design complexity level

**Required Context:**

- `complexity_indicators`: (number 0-7) Count of complexity indicators
- `quality_score`: (number 0-10) Overall quality score
- `security_sensitive`: (boolean) Whether story involves security operations

**Possible Results**: Simple, Standard, Comprehensive

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: sm-test-design-level
Context:
  complexity_indicators: 3
  quality_score: 8.5
  security_sensitive: true

Expected Result: Comprehensive (security + complexity)
```

---

### 2. Architect Decisions

#### architect-review-result

**Purpose**: Determine review outcome based on architecture score

**Required Context:**

- `architecture_score`: (number 0-10) Technical architecture score
- `critical_issues`: (number) Count of critical issues found
- `review_round`: (number) Current review iteration

**Possible Results**: Approved, RequiresRevision, Escalated

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: architect-review-result
Context:
  architecture_score: 8.5
  critical_issues: 0
  review_round: 1

Expected Result: Approved
```

---

### 3. QA Decisions

#### qa-gate-decision

**Purpose**: Determine if story passes QA gate with progressive standards

**Required Context:**

- `review_round`: (number) Current QA review iteration
- `issues_by_severity`: (object) Issue counts by severity
  - `critical`: (number) Critical issues
  - `high`: (number) High priority issues
  - `medium`: (number) Medium priority issues
  - `low`: (number) Low priority issues

**Possible Results**: PASS, CONCERNS, FAIL, WAIVED

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: qa-gate-decision
Context:
  review_round: 1
  issues_by_severity:
    critical: 0
    high: 0
    medium: 1
    low: 2

Expected Result: PASS (minor issues only)
```

---

#### qa-post-review-workflow

**Purpose**: Determine next workflow action after QA review

**Required Context:**

- `gate_result`: (enum) PASS | CONCERNS | FAIL | WAIVED
- `final_status`: (enum) Done | Review | Escalated | Blocked
- `review_round`: (number) Current review iteration
- `issues_by_severity`: (object) Issue counts

**Returns**: Workflow action object with `workflow_action`, `requires_git_commit`, `next_agent`

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: qa-post-review-workflow
Context:
  gate_result: PASS
  final_status: Done
  review_round: 1
  issues_by_severity:
    critical: 0
    high: 0
    medium: 0
    low: 0

Expected Result:
  workflow_action: finalize_commit
  requires_git_commit: true
  next_agent: null
```

---

### 4. Dev Decisions

#### dev-self-review-decision

**Purpose**: Determine if implementation is ready for QA review

**Required Context:**

- `implementation_gate_score`: (number 0-100) Gate checklist percentage
- `architecture_compliance`: (enum) PASS | FAIL
- `api_contract_compliance`: (enum) PASS | FAIL | N_A
- `test_integrity`: (enum) PASS | FAIL
- `dod_score`: (number 0-100) Definition of Done percentage
- `critical_issues`: (number) Count of critical issues
- `implementation_round`: (number) Current implementation iteration

**Possible Results**: PASS, FAIL, ESCALATE

**Example:**

```
@decision-evaluator Please execute decision evaluation:

Decision Type: dev-self-review-decision
Context:
  implementation_gate_score: 97
  architecture_compliance: PASS
  api_contract_compliance: PASS
  test_integrity: PASS
  dod_score: 95
  critical_issues: 0
  implementation_round: 1

Expected Result: PASS
```

---

## Available Commands

### \*evaluate-decision

Execute a single decision rule.

**Usage:**

```
*evaluate-decision

Then provide:
- Decision Type: {type}
- Context: {fields}
```

### \*batch-evaluate

Execute multiple decisions in sequence (useful for workflows).

**Usage:**

```
*batch-evaluate

Then provide array of decisions
```

### \*test-decision

Test decision logic with various scenarios (development/debugging tool).

**Usage:**

```
*test-decision

Decision Type: sm-story-status
Test Mode: comprehensive
```

### \*list-decisions

Show all available decision types with descriptions.

**Usage:**

```
*list-decisions
```

---

## Integration with Agent Tasks

### For Task Authors

Use the standardized invocation pattern via `call-decision-evaluator.md`:

```markdown
## Step X: Make Decision

Reference: {root}/tasks/utils/call-decision-evaluator.md

@decision-evaluator Please execute decision evaluation:

Decision Type: {type}
Context:
field1: {{value1}}
field2: {{value2}}

Extract result and continue workflow.

Fallback: If SubAgent fails, execute {root}/tasks/make-decision.md inline.
```

### Example: SM Story Creation

```markdown
### Step 8A: Determine Architect Review Requirement

@decision-evaluator Please execute decision evaluation:

Decision Type: sm-architect-review-needed
Context:
quality_score: {{quality_score from Step 7}}
complexity_indicators: {{complexity_indicators from Step 7}}

Extract: architect_review_result = SubAgent response.result

Fallback: Execute {root}/tasks/make-decision.md if timeout >30s
```

---

## Response Format

### Success Response

```yaml
# Decision Result

status: success
decision_type: sm-story-status
result: TestDesignComplete
reasoning: |
  Based on sm-story-status.yaml rules:
  - Condition matched: "(architect_review_result == 'NOT_REQUIRED') AND test_design_level == 'Simple'"
  - Rule: Final status determination for no-review + simple-test scenario
  - Evaluation: Story has NOT_REQUIRED architect review and Simple test design level
next_action: handoff_to_dev
confidence: 0.95
metadata:
  decision_file: "sm-story-status.yaml"
  rule_matched: "Rule #3"
  context_used:
    - architect_review_result: NOT_REQUIRED
    - test_design_level: Simple
  timestamp: "2025-11-14T10:30:00Z"
  cached: true
```

### Error Response

```yaml
status: error
message: "Required context field missing: quality_score"
required_fields:
  - quality_score
  - complexity_indicators
provided_fields:
  - complexity_indicators
suggestions:
  - "Ensure all required context fields are provided"
  - "Check field names for typos"
```

---

## Session Caching

The SubAgent maintains a session cache to avoid redundant file reads:

```
Cached Decisions (Session Memory):
- sm-story-status (loaded at 10:30:00, size: 97 lines)
- sm-architect-review-needed (loaded at 10:31:05, size: 81 lines)
- qa-gate-decision (loaded at 10:32:10, size: 138 lines)

Cache Performance:
- Total evaluations: 15
- Cache hits: 6 (40%)
- Avg evaluation time: 1.2s
```

**Benefits:**

- Faster subsequent evaluations
- Reduced file I/O overhead
- Consistent decision state within session

---

## Fallback Mechanism

### When Fallback Activates

- SubAgent not responding within 30 seconds
- SubAgent returns an error status
- SubAgent unavailable or not installed
- Any other SubAgent invocation failure

### Fallback Behavior

The system automatically falls back to inline decision execution using `make-decision.md`:

```
⚠️ Decision Evaluator SubAgent unavailable, using inline fallback

Execute: {root}/tasks/make-decision.md
Input:
  decision_type: sm-story-status
  context: {...}

Result: TestDesignComplete (from fallback)
```

**Guarantee**: Workflows never halt due to SubAgent issues - fallback ensures 100% availability.

---

## Performance Metrics

### Token Savings

**Before (per decision):**

- SM Decision: ~800 tokens (load make-decision.md + decision YAML + evaluate)

**After (with SubAgent):**

- SM Decision: ~200 tokens (SubAgent call + response)

**Savings**: 60-80% per decision call

**Per Story Average:**

- SM: 3 decisions × 600 tokens saved = 1,800 tokens
- Architect: 1 decision × 600 tokens saved = 600 tokens
- Dev: 1 decision × 600 tokens saved = 600 tokens
- QA: 2 decisions × 600 tokens saved = 1,200 tokens

**Total: ~4,200 tokens saved per story (75% reduction on decision operations)**

---

## Troubleshooting

### SubAgent Not Available

**Symptom**: `@decision-evaluator` mention doesn't work

**Solution**:

1. Verify SubAgent is installed: `ls .claude/agents/decision-evaluator.md`
2. Reinstall if missing: `npx orchestrix install`
3. Restart Claude Code
4. Fallback will handle this automatically in tasks

---

### Decision File Not Found

**Symptom**: Error "Decision file not found: {type}.yaml"

**Solution**:

1. Check decision type spelling
2. Use `*list-decisions` to see available types
3. Verify `.orchestrix-core/data/decisions/{type}.yaml` exists

---

### Context Field Missing

**Symptom**: Error "Required context field missing: {field}"

**Solution**:

1. Review decision requirements: `*list-decisions`
2. Ensure all required fields are provided
3. Check field names for typos (case-sensitive)

---

### No Rules Matched

**Symptom**: Error "No decision rules matched the provided context"

**Solution**:

1. Review provided context values
2. Check if values are within expected ranges
3. Use `*test-decision` to debug with test scenarios
4. Review decision YAML file for applicable rules

---

## Best Practices

### 1. Always Provide Complete Context

✅ Good:

```
Context:
  quality_score: 9.0
  complexity_indicators: 2
```

❌ Bad:

```
Context:
  quality_score: 9.0
  # Missing complexity_indicators
```

### 2. Use Exact Field Names

Field names are case-sensitive and must match exactly.

✅ Good: `architect_review_result`
❌ Bad: `architectReviewResult`, `review_result`

### 3. Validate Enum Values

✅ Good: `architect_review_result: "NOT_REQUIRED"`
❌ Bad: `architect_review_result: "not_required"` (wrong case)

### 4. Handle Errors Gracefully

Always implement fallback logic in tasks:

```markdown
Primary: Call SubAgent
Fallback: Execute make-decision.md inline
Never HALT on SubAgent failure
```

### 5. Monitor Performance

Track SubAgent usage:

- Call success rate
- Average response time
- Cache hit rate
- Fallback frequency

---

## Developer Guide

### Adding New Decision Types

1. **Create Decision YAML**: `orchestrix-core/data/decisions/new-decision.yaml`
2. **Update decision-evaluator.src.yaml**: Add to `dependencies.data`
3. **Recompile**: `node tools/compile-agents.js compile`
4. **Update Documentation**: Add to this guide
5. **Test**: Use `*test-decision` to validate

### Modifying Existing Decisions

1. **Edit Decision YAML**: Modify rules in `orchestrix-core/data/decisions/{type}.yaml`
2. **Test Changes**: Use `*test-decision` with comprehensive mode
3. **No Recompilation Needed**: Decision files are loaded dynamically
4. **Verify Backward Compatibility**: Ensure existing stories still work

---

## FAQ

**Q: Can I use the SubAgent from non-Orchestrix projects?**
A: Yes, but you need Orchestrix decision files (`.orchestrix-core/data/decisions/`)

**Q: Does the SubAgent work offline?**
A: Yes, all decisions are evaluated locally using YAML files

**Q: Can I customize decision rules?**
A: Yes, edit decision YAML files in `.orchestrix-core/data/decisions/`

**Q: What if I want to add custom logic?**
A: Extend decision YAML files with new rules or create new decision types

**Q: Is the SubAgent required?**
A: No, fallback to inline execution ensures 100% availability without SubAgent

---

## Version History

**v7.1.0** (2025-11-14)

- Initial release of Decision Evaluator SubAgent
- Support for 7 core decision types
- Session caching implementation
- Dual-track execution with fallback
- Integration with SM create-next-story workflow

---

## Support

**Issues**: https://github.com/anthropics/orchestrix/issues
**Documentation**: https://orchestrix.dev/docs/decision-evaluator
**Community**: https://discord.gg/orchestrix

---

**Happy Decision Making! ⚖️**
