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
3. Quality Score (P1=100% AND S2≥80%) → (S2×0.50)+(S3×0.50)
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

**S2 Score: ___% (Done/Total)** | **HARD REQ:** [ ] PASS (≥80%) | [ ] FAIL → Blocked

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

## Quality Score

**Formula:** `(S2 × 0.50) + (S3 × 0.50)`

**Calc:** S2: ___% × 0.50 = ___ | S3: ___% × 0.50 = ___ | **Score: ___/10**

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

**Total: ___/7** | **Security Sensitive:** [ ] Yes (if #5) | [ ] No

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
  
quality_score:
  final_score: 0-10
  calculation: "(S2 × 0.50) + (S3 × 0.50)"
  
complexity_indicators:
  api_changes: true/false
  db_schema: true/false
  new_patterns: true/false
  cross_service: true/false
  security: true/false
  performance: true/false
  core_docs: true/false
  total_count: 0-7
  security_sensitive: true/false
```

**Note**: Decision execution (architect review, test design level, story status) is handled by the calling task, not by this checklist.
