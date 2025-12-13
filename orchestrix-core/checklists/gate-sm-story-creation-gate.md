# SM Story Creation Gate

---
metadata:
  type: gate
  threshold: structure=100%, technical=80%, overall=80%
  on_fail: halt
  purpose: "Unified quality gate for SM story creation validating structure, technical quality, and complexity"
  scope: "Story quality validation - structure compliance, technical extraction, implementation readiness"
---

## Purpose

Unified validation engine for SM story creation. This gate consolidates all quality validations into a single execution point for consistency and efficiency.

**What This Gate Validates**:
- ✅ Template structure compliance (100% required)
- ✅ AC-Task mapping completeness (100% required)
- ✅ Technical information extraction (≥80% required)
- ✅ Implementation readiness assessment
- ✅ Complexity indicators detection

**What This Gate Does NOT Validate**:
- ❌ Decision logic (handled by make-decision.md)
- ❌ Status transitions (handled by validate-status-transition.md)
- ❌ File system operations (handled by calling task)

## Inputs

```yaml
required:
  - story_path: Path to story file

optional:
  - story_id: '{epic}.{story}' (for logging)
```

## Process

### Phase 1: Structure Validation (GATE - 100% Required)

**Purpose**: Binary pass/fail check - ensures story follows template structure and has complete AC-Task mapping.

**Critical Items**:

| ID | Item | Pass Criteria |
|----|------|---------------|
| C1 | All template sections present | Story, Epic Context, Requirements, Acceptance Criteria, Tasks, Dev Notes, SM Agent Record, QA Agent Record, Dev Agent Record, Architect Review Metadata, QA Test Design Metadata, Change Log |
| C2 | No placeholder text | No `{placeholder}` or `TODO` markers in required sections |
| C3 | Standard structure | Sections in correct order per story-tmpl.yaml |
| C4 | Status field set | Story.status field exists and not empty |
| C5 | All ACs have tasks | Each AC maps to ≥1 task |
| C6 | Task-AC mapping explicit | Each task references AC via `[AC: X.Y]` |
| C7 | Tasks cover all AC requirements | No ACs without corresponding implementation tasks |
| C8 | No ACs without tasks | Zero orphaned acceptance criteria |
| C9 | Logical task order | Tasks sequenced: Setup → Core → Integration → Testing |
| C10 | Dependencies clear | Task dependencies documented if present |
| C11 | No circular dependencies | Task graph is acyclic |
| C12 | Frontend-first applied | UI tasks before API tasks (if applicable) |

**Scoring**: ___/12 items

**Result**:
```yaml
structure_validation:
  passed: true/false
  score_percentage: X%  # (passed_items / 12) * 100
  failed_items:
    - id: C{N}
      check: {description}
      location: {section or line reference}
      issue: {what's wrong}
      fix: {how to fix}
```

**Decision**:
- **PASS**: 12/12 (100%) → Continue to Phase 2
- **FAIL**: <12/12 → **HALT**, set Status=Blocked, return failure report

---

### Phase 2: Technical Quality Scoring (Only if Phase 1 PASS)

**Purpose**: Assess technical information quality and implementation readiness.

#### Section 2: Technical Extraction (Weight: 50%)

**Hard Requirement**: Must score ≥80% to proceed

| Category | Item | Pass Criteria |
|----------|------|---------------|
| **Architecture Info** | Data models + refs | Data models documented with `[Source: docs/architecture/...]` |
| | API specs + refs | API endpoints documented with source refs |
| | Tech stack + refs | Technologies/frameworks referenced to tech-stack.md |
| | File structure | File paths match source-tree.md structure |
| | Integration points | External dependencies/services documented |
| **Tech Preferences** | Patterns consistent | Design patterns match technical-preferences.md |
| | Tech choices comply | No unapproved technologies used |
| | No conflicts | No contradictions with architecture docs |
| | Perf/security addressed | Performance and security constraints documented |
| **Source References** | Format correct | All refs use `[Source: docs/...]` format |
| | Docs exist/accessible | Referenced documents actually exist |
| | Sections match claims | Referenced sections contain claimed information |
| | No invented details | All technical details traceable to source docs |

**Scoring**: ___/13 items = ___% (S2 Score)

**Result**:
```yaml
technical_extraction:
  score_percentage: X%
  passed_threshold: true/false  # ≥80%
  failed_items:
    - item: {description}
      location: {section}
      issue: {what's missing or wrong}
      recommendation: {how to fix}
```

**Hard Gate Check**:
- **PASS**: S2 ≥ 80% → Continue to Section 3
- **FAIL**: S2 < 80% → **HALT**, set Status=Blocked, return failure report

---

#### Section 3: Implementation Readiness (Weight: 50%)

**Purpose**: Assess if story provides sufficient detail for Dev agent implementation.

| Category | Item | Pass Criteria |
|----------|------|---------------|
| **Dev Notes** | Data models detailed | Schemas/interfaces with field types specified |
| | API specs complete | Request/response schemas with all fields |
| | File locations explicit | Exact file paths provided (not just directory) |
| | Integration clear | How components interact documented |
| | Error handling addressed | Error scenarios and handling approach documented |
| **Testing** | Approach outlined | Testing strategy (unit/integration/e2e) specified |
| | Scenarios identified | Key test scenarios listed with priorities |
| | Follows testing-strategy.md | Approach consistent with project testing strategy |
| | Integrity requirements documented | Test integrity requirements specified (no assertion weakening) |
| **Implementability** | Steps sequenced | Implementation steps in logical order |
| | Tools/tech specified | Specific tools/libraries named (not generic) |
| | Config/setup documented | Configuration requirements documented |
| | No research needed | Dev can implement without additional research |

**Scoring**: ___/13 items = ___% (S3 Score)

**Result**:
```yaml
implementation_readiness:
  score_percentage: X%
  items_total: 13
  items_passed: X
  failed_items:
    - item: {description}
      location: {section}
      issue: {what's missing or unclear}
      suggestion: {how to improve}
```

---

### Phase 3: Quality Score Calculation

**Formula**: `(S2 × 0.50) + (S3 × 0.50)`

**Calculation**:
- S2: ___% × 0.50 = ___
- S3: ___% × 0.50 = ___
- **Quality Score**: ___/10

**Result**:
```yaml
quality_score:
  final_score: X.X/10
  calculation: "(S2 × 0.50) + (S3 × 0.50)"
  s2_contribution: X.XX
  s3_contribution: X.XX
```

---

### Phase 4: Complexity Detection

**Purpose**: Identify complexity indicators for downstream decision-making (Architect review, Test design level).

**8 Complexity Indicators**:

| # | Indicator | Detection Pattern | Detected |
|---|-----------|-------------------|----------|
| 1 | **API Changes** | Keywords: endpoint, REST, GraphQL, route, API contract | [ ] |
| 2 | **DB Schema** | Keywords: schema, migration, table, column, foreign key, index | [ ] |
| 3 | **New Patterns** | Keywords: new pattern, design pattern, architectural change, refactor | [ ] |
| 4 | **Cross-Service** | Keywords: multiple services, microservice, integration, external API | [ ] |
| 5 | **Security** | Keywords: auth, encryption, permissions, PII, security, vulnerability | [ ] |
| 6 | **Performance** | Keywords: optimization, caching, real-time, performance, latency, throughput | [ ] |
| 7 | **Core Docs** | Modifies: data-models.md, rest-api-spec.md, database-schema.md, components.md | [ ] |
| 8 | **Data Sync** | Story involves DB write operations (INSERT/UPDATE/DELETE) | [ ] |

**Detection Method**:
1. Read entire story content (all sections)
2. For each indicator, check if any pattern matches
3. Mark as detected if ≥1 pattern match found
4. Count total detected indicators

**Result**:
```yaml
complexity_indicators:
  api_changes: true/false
  db_schema: true/false
  new_patterns: true/false
  cross_service: true/false
  security: true/false
  performance: true/false
  core_docs: true/false
  data_sync: true/false
  total_count: 0-8
  security_sensitive: true/false  # true if security=true
```

---

### Phase 5: Data Synchronization Analysis (GATE - Conditional)

**Trigger Condition**: `complexity_indicators.data_sync = true` (Story involves DB write operations)

**Purpose**: Ensure Stories with database writes have completed data synchronization analysis to prevent missing cross-table sync requirements.

**Hard Gate Items (100% Required when triggered)**:

| ID | Item | Pass Criteria |
|----|------|---------------|
| D1 | Write operations inventory complete | Dev Notes "Data Synchronization Requirements" section has "Write Operations Inventory" filled with all DB write operations |
| D2 | Status/expiry fields checked | Listed all status/expiry/sync type fields in involved tables (if any) |
| D3 | Related field analysis complete | "Related Field Synchronization Analysis" table filled with LLM reasoning results |
| D4 | Sync requirements handled | All "Sync Needed = YES" items have AC coverage, OR documented as "Known Gap" with explicit reason |

**Scoring**: ___/4 items

**LLM Execution Guidelines**:

When executing D3, LLM should reason based on these dimensions:

1. **Entity Relationship**: Does the same user_id/entity_id have status/expiry fields in different tables?
2. **Business Dependency**: Does table A's status change affect table B's behavior in business logic?
3. **Access Control**: Are permission/License/access control tables related to subscription/payment tables?
4. **Data Consistency**: Are there cache/redundant fields that need synchronization?

**Result**:
```yaml
data_sync_analysis:
  triggered: true/false  # Based on data_sync indicator
  passed: true/false
  items_total: 4
  items_passed: X
  uncovered_sync_requirements:
    - source_field: {table.field}
      related_field: {table.field}
      reasoning: {why sync is needed}
      ac_coverage: NONE
      acknowledged_gap: true/false
      gap_reason: {if acknowledged}
  failed_items:
    - id: D{N}
      check: {description}
      issue: {what's missing}
      fix: {how to fix}
```

**Decision**:
- **PASS**: All D1-D4 passed → Continue to Output
- **FAIL**: Any D1-D4 failed → **HALT**, set Status=Blocked, return failure report with specific gaps
- **SKIP**: `data_sync = false` → Not triggered, continue to Output

---

## Output Format

**This output serves as the complete Story Creation Gate Result**

```yaml
gate_result:
  story_id: {story_id}
  validation_date: {timestamp}

  # Gate Status
  status: PASS | FAIL
  overall_score: X%  # Average of structure (100%) and technical quality (S2+S3)/2

  # Phase 1: Structure Validation
  structure_validation:
    passed: true/false
    score_percentage: X%
    items_total: 12
    items_passed: X
    failed_items:
      - id: C{N}
        check: {description}
        location: {section}
        issue: {what's wrong}
        fix: {how to fix}

  # Phase 2: Technical Quality
  technical_quality:
    s2_score: X%  # Technical Extraction
    s3_score: X%  # Implementation Readiness
    passed_threshold: true/false  # S2 ≥ 80%
    failed_items:
      - category: {technical_extraction | implementation_readiness}
        item: {description}
        location: {section}
        issue: {what's missing}
        recommendation: {how to fix}

  # Phase 3: Quality Score
  quality_score:
    final_score: X.X/10
    calculation: "(S2 × 0.50) + (S3 × 0.50)"
    s2_contribution: X.XX
    s3_contribution: X.XX

  # Phase 4: Complexity
  complexity_indicators:
    api_changes: true/false
    db_schema: true/false
    new_patterns: true/false
    cross_service: true/false
    security: true/false
    performance: true/false
    core_docs: true/false
    data_sync: true/false
    total_count: 0-8
    security_sensitive: true/false

  # Phase 5: Data Sync Analysis
  data_sync_analysis:
    triggered: true/false
    passed: true/false
    items_total: 4
    items_passed: X
    uncovered_sync_requirements: [...]
    failed_items: [...]

  # Summary
  blocking: true/false
  blocking_reason: {summary if blocking}
  ready_for_decisions: true/false  # true if status=PASS
```

## Decision Logic for Overall Result

**PASS** (Story ready for decision execution):
- `structure_validation.passed = true` (12/12 items, 100%)
- `technical_quality.s2_score ≥ 80%` (Technical Extraction hard requirement)
- `technical_quality.passed_threshold = true`
- `data_sync_analysis.triggered = false` OR `data_sync_analysis.passed = true`

**FAIL** (Story not ready, must be revised):
- `structure_validation.passed = false` (< 12/12 items) OR
- `technical_quality.s2_score < 80%` OR
- `technical_quality.passed_threshold = false` OR
- `data_sync_analysis.triggered = true AND data_sync_analysis.passed = false`

**Overall Score Calculation** (for reference only, not used for PASS/FAIL):
- If PASS: `(structure_score + ((s2_score + s3_score) / 2)) / 2`
- If FAIL: N/A

## Usage Context

**Called by**:
- `create-next-story.md` (Step 7) - After story document creation
- `revise-story-from-architect-feedback.md` (Step 3) - After revision

**Returns to Caller**:
- Validation complete with structured `gate_result`
- All issues documented with specific locations and fixes
- Clear PASS/FAIL decision
- Complexity indicators for downstream decisions

**Do NOT**:
- Modify any files (read-only operation)
- Update story status (caller's responsibility)
- Make decisions beyond validation (use make-decision.md for that)
- Execute decision logic (return data only)

## Key Principles

- **Unified Interface**: Single call validates all quality aspects
- **Structured Output**: All results in consistent YAML format
- **Actionable Feedback**: Specific locations, issues, and recommendations
- **Hard Gates First**: Structure and S2 threshold are blocking
- **Soft Scoring After**: S3 and complexity are informational
- **Read-Only**: This gate only validates, never modifies

## References

- Template: `templates/story-tmpl.yaml`
- Architecture docs: `docs/architecture/*.md`
- Decision files: `data/decisions-sm-*.yaml`
- Story status transitions: `data/story-status-transitions.yaml`

## Notes

- **Replaces**: `checklists/scoring-sm-story-quality.md` (old assessment checklist)
- **New in v8.4.0**: Unified gate approach following Dev agent pattern
- **Breaking Change**: Output format changed from loose checklist to structured gate_result
