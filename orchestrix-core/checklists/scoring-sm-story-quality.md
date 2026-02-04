# SM Story Creation Checklist

---
metadata:
  type: assessment
  threshold: 80%
  on_fail: continue_with_score
  purpose: "Quality assessment for SM story creation with structure validation gate and technical quality scoring"
---

## LLM EXECUTION INSTRUCTIONS

**Execution Flow**:
1. Structure Validation (Gate=100%) → Fail = Blocked, STOP
2. Technical Quality (P1=100%) → S2<80% = Blocked
3. Quality Score (P1=100% AND S2≥80%) → (S2×0.45)+(S3×0.45)+S4
4. Complexity Detection (P2 done) → 7 indicators

**Rules**: P1 fail → Blocked, STOP | P2<80% → Blocked

**Abbrev**: AC=Acceptance Criteria, Q=Quality, C=Complexity, S=Section, P=Phase

---

## Prerequisites

| Requirement | Status |
|-------------|--------|
| Story from template | [ ] |
| Epic requirements extracted | [ ] |
| Architecture docs reviewed | [ ] |
| Dev Notes populated | [ ] |

---

# PHASE 1: STRUCTURE VALIDATION (GATE=100%)

| Category | Item | Pass |
|----------|------|------|
| **Template** | All sections present | [ ] |
| | No placeholders | [ ] |
| | Standard structure | [ ] |
| | Status field set | [ ] |
| **AC Coverage** | All ACs have tasks | [ ] |
| | Task-AC mapping explicit | [ ] |
| | Tasks cover all AC reqs | [ ] |
| | No ACs without tasks | [ ] |
| **Task Logic** | Logical order | [ ] |
| | Dependencies clear | [ ] |
| | No circular deps | [ ] |
| | Frontend-first applied | [ ] |

**Completion: ___/12 (___%)** | **GATE:** [ ] PASS (100%) | [ ] FAIL → Blocked

---

# PHASE 2: TECHNICAL QUALITY (SCORING)

**Execute:** [ ] Yes (P1=100%) | [ ] No (P1 failed)

## S2: Technical Extraction (Weight: 50%)

| Category | Item | Status |
|----------|------|--------|
| **Arch Info** | Data models + refs | [ ] |
| | API specs + refs | [ ] |
| | Tech stack + refs | [ ] |
| | File structure | [ ] |
| | Integration points | [ ] |
| **Tech Prefs** | Patterns consistent | [ ] |
| | Tech choices comply | [ ] |
| | No conflicts | [ ] |
| | Perf/security addressed | [ ] |
| **Source Refs** | Format: [Source: docs/...] | [ ] |
| | Docs exist/accessible | [ ] |
| | Sections match claims | [ ] |
| | No invented details | [ ] |
| **Type Consistency** | Types match cumulative registry | [ ] |
| | No invented type names | [ ] |
| | Enum values match existing | [ ] |
| | New types explicitly marked | [ ] |

**S2 Score: ___% (Done/Total)** | **HARD REQ:** [ ] PASS (≥80%) | [ ] FAIL → Blocked

### Type Consistency Verification (CRITICAL)

**Purpose**: Prevent type mismatches between Story design and existing codebase.

**Background**: QA Report identified that Epic 12 used `AcpAgentType` while Story 9.7 had already changed the type system to use `architect-planning` and `architect-engineering` instead of simple `'architect'`. This type of mismatch causes runtime errors.

**Verification Steps**:

1. **Load Cumulative Models Registry**:
   ```
   docs/cumulative/models-registry.md
   ```

2. **Extract All Type References from Story**:
   - Scan AC for type names (e.g., `AgentType`, `StatusEnum`, `IUser`)
   - Scan Dev Notes for data model references
   - Scan Tasks for any type-specific implementations

3. **Cross-Reference with Registry**:

   | Story Type Reference | Registry Status | Action |
   |---------------------|-----------------|--------|
   | Exists in registry | ✅ Valid | Use as-is |
   | NOT in registry | ⚠️ Check | Is this NEW or TYPO? |
   | Different from registry | ❌ Mismatch | Update Story to match registry |

4. **For Each Unmatched Type**:
   - If genuinely NEW type: Mark explicitly as `[NEW TYPE]` with justification
   - If TYPO/outdated: Correct to match registry
   - If MISMATCH with recent change: Check git history for TCPs that modified types

**Scoring Impact**:
- Unverified type reference: -2 points per instance
- Type mismatch with registry: -3 points per instance (MAJOR)
- Using deprecated type: -2 points per instance

## S3: Implementation Readiness (Weight: 50%)

| Category | Item | Status |
|----------|------|--------|
| **Dev Notes** | Data models detailed | [ ] |
| | API specs complete | [ ] |
| | File locations explicit | [ ] |
| | Integration clear | [ ] |
| | Error handling addressed | [ ] |
| **Testing** | Approach outlined | [ ] |
| | Scenarios identified | [ ] |
| | Follows testing-strategy.md | [ ] |
| | Integrity reqs documented | [ ] |
| **Implementability** | Steps sequenced | [ ] |
| | Tools/tech specified | [ ] |
| | Config/setup documented | [ ] |
| | No research needed | [ ] |

**S3 Score: ___% (Done/Total)**

---

## S4: AC Precision Validation (CRITICAL - Quality Multiplier)

**Purpose**: Verify Acceptance Criteria are precise, unambiguous, and testable.

**Load**: `{root}/data/ac-quality-requirements.yaml`

**For each AC in the story, verify**:

| Rule | Check | Deduction | Status |
|------|-------|-----------|--------|
| `ac_has_error_path` | AC has ≥1 error/failure scenario | -1.0 per violation | [ ] |
| `ac_no_vague_words` | No prohibited vague words | -0.5 per word | [ ] |
| `ac_ui_three_states` | UI ACs have default/loading/result states | -1.0 per violation | [ ] |
| `ac_form_validation_rules` | Form ACs have validation rules per field | -1.5 per violation | [ ] |
| `ac_api_response_format` | API ACs have request/response specs | -1.0 per violation | [ ] |
| `ac_data_boundary` | Data ACs have empty/single/max states | -0.5 per violation | [ ] |

**AC Precision Deduction: -___** (sum of all deductions, cap at -3.0)

**S4 Result**:
```yaml
ac_precision:
  total_acs_checked: {count}
  violations_found: {count}
  total_deduction: {number, max -3.0}
  violations:
    - rule: '{rule_id}'
      ac: 'AC{N}'
      issue: '{description}'
      deduction: {number}
```

---

## Quality Score

**Formula:** `(S2 × 0.45) + (S3 × 0.45) + max(0, 1.0 + S4_deduction) × 1.0`

Where:
- S2 (Technical Extraction): 45% weight
- S3 (Implementation Readiness): 45% weight
- S4 (AC Precision): 10% weight (1.0 base, reduced by deductions, minimum 0)

**Example**: S2=90%, S3=85%, S4 deduction=-1.5:
- (0.90 × 0.45) + (0.85 × 0.45) + max(0, 1.0 - 1.5) × 1.0
- = 0.405 + 0.3825 + 0 = 0.7875 → Score: 7.9/10

**Calc:** S2: ___% × 0.45 = ___ | S3: ___% × 0.45 = ___ | S4: max(0, 1.0 + ___) × 1.0 = ___ | **Score: ___/10**

---

# COMPLEXITY DETECTION

**Execute:** [ ] Yes (P2 done) | [ ] No (failed)

| # | Indicator | Pattern | Detected |
|---|-----------|---------|----------|
| 1 | API Changes | endpoint, REST, GraphQL, route | [ ] |
| 2 | DB Schema | schema, migration, table, column | [ ] |
| 3 | New Patterns | new pattern, design pattern, arch change | [ ] |
| 4 | Cross-Service | multiple services, integration | [ ] |
| 5 | Security | auth, encryption, permissions, PII | [ ] |
| 6 | Performance | optimization, caching, real-time | [ ] |
| 7 | Core Docs | modify data-models.md, rest-api-spec.md | [ ] |
| 8 | Data Sync | DB write ops affecting multiple tables | [ ] |

**Total: ___/8** | **Security Sensitive:** [ ] Yes (if #5) | [ ] No

---

## CHECKLIST OUTPUT

This checklist returns the following data for use by the calling task:

```yaml
structure_validation:
  passed: true/false
  score_percentage: 0-100

technical_quality:
  section_2_score: 0-100  # Technical Extraction
  section_3_score: 0-100  # Implementation Readiness
  passed_threshold: true/false  # ≥80%

type_consistency:
  types_referenced: []        # List of type names found in Story
  types_verified: 0           # Count matching cumulative registry
  types_unverified: 0         # Count not in registry
  types_mismatched: 0         # Count conflicting with registry
  new_types_declared: []      # Types explicitly marked as [NEW TYPE]
  score_deduction: 0          # Points deducted for type issues
  issues:
    - type_name: "..."
      issue: "not_in_registry | mismatched | deprecated"
      expected: "..."         # What registry says (if applicable)
      action: "..."           # Recommended fix

quality_score:
  final_score: 0-10
  calculation: "(S2 × 0.45) + (S3 × 0.45) + max(0, 1.0 + S4_deduction) × 1.0"

ac_precision:
  total_acs_checked: 0
  violations_found: 0
  total_deduction: 0
  violations: []

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
```

**Note**: Decision execution (architect review, test design level, story status) is handled by the calling task, not by this checklist.
