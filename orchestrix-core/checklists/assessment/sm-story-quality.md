# SM Story Creation Checklist

---
metadata:
  type: assessment
  threshold: 80%
  on_fail: continue_with_score
  purpose: "Quality assessment for SM story creation with structure validation gate and technical quality scoring"
  used_by:
    - create-next-story.md
    - validate-story-quality.md
  estimated_tokens: 1500
  version: 1.1
---

## LLM EXECUTION INSTRUCTIONS

| Step | Action | Condition | Outcome |
|------|--------|-----------|---------|
| 1 | Structure Validation | Gate=100% | Fail → Blocked, STOP |
| 2 | Technical Quality | P1=100% | S2<80% → Blocked |
| 3 | Quality Score | P1=100% AND S2≥80% | (S2×0.50)+(S3×0.50) |
| 4 | Complexity Detection | P2 done | 7 indicators |
| 5 | Decisions | All passed | make-decision.md: Arch→Test→Status |

**Rules:** P1 fail → Blocked, STOP | P2<80% → Blocked | Decisions in data/decisions/

**Abbrev:** AC=Acceptance Criteria, Q=Quality, C=Complexity, S=Section, P=Phase, Arch=Architect

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

# DECISION EXECUTION

**Prereqs:** [ ] P1=100% | [ ] P2≥80% | [ ] Quality Score: ___/10

**Execute via make-decision.md in order:**

### 1. Architect Review

**File:** `data/decisions/sm-architect-review-needed.yaml`

**Inputs:** quality_score, complexity_indicators

**Result:** `___` (REQUIRED/NOT_REQUIRED/BLOCKED)

---

### 2. Test Design Level

**File:** `data/decisions/sm-test-design-level.yaml`

**Inputs:** complexity_indicators, quality_score, security_sensitive

**Result:** `___` (Simple/Standard/Comprehensive)

---

### 3. Story Status

**File:** `data/decisions/sm-story-status.yaml`

**Inputs:** architect_review_result, test_design_level

**Results:**
- **Status:** `___`
- **Next Action:** `___`
- **Reasoning:** `___`

---

## Next Steps

| Next Action | Task |
|-------------|------|
| handoff_to_architect | review-story-technical-accuracy |
| handoff_to_qa_test_design | test-design |
| handoff_to_dev | implement-story |
| sm_revise_story | SM revise and re-run |
