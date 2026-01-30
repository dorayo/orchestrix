---
description: "risk-profile"
---

When this command is used, execute the following task:

# risk-profile

Generate a comprehensive risk assessment matrix for a story, identifying potential risks and their mitigation strategies.

## Purpose

Identify, assess, and document risks associated with story implementation. This includes security risks, technical risks, business risks, and operational risks. The risk profile informs test design priorities and helps teams make informed decisions about risk mitigation.

## Inputs

```yaml
required:
  - story_id: "{epic}.{story}" # e.g., "1.3"
  - story_path: "{devStoryLocation}/{epic}.{story}.*.md" # Path from core-config.yaml
  - story_title: "{title}" # If missing, derive from story file H1
  - story_slug: "{slug}" # If missing, derive from title (lowercase, hyphenated)
```

## When to Execute

**Trigger Conditions (any of the following):**

- Story has complexity indicators ≥ 3
- Story involves security-sensitive operations
- Story involves authentication/authorization
- Story involves sensitive data handling
- Story involves payment/financial operations
- Story involves performance-critical features
- Story involves cross-service dependencies
- Architect or SM explicitly requests risk assessment

## Process

### 1. Risk Identification

Analyze the story for potential risks across multiple dimensions:

**A. Security Risks**

- Authentication/authorization vulnerabilities
- Data exposure or leakage
- Injection attacks (SQL, XSS, etc.)
- Insecure data storage
- Insufficient encryption
- Access control issues

**B. Technical Risks**

- Performance bottlenecks
- Scalability limitations
- Integration failures
- Data corruption
- System instability
- Technical debt accumulation

**C. Business Risks**

- Requirements misunderstanding
- Scope creep
- User experience degradation
- Compliance violations
- Revenue impact
- Reputation damage

**D. Operational Risks**

- Deployment failures
- Monitoring gaps
- Incident response challenges
- Rollback difficulties
- Data migration issues

### 2. Risk Assessment

For each identified risk, assess:

**Probability (1-5):**

- 1: Very unlikely (< 10%)
- 2: Unlikely (10-30%)
- 3: Possible (30-50%)
- 4: Likely (50-70%)
- 5: Very likely (> 70%)

**Impact (1-5):**

- 1: Negligible (minor inconvenience)
- 2: Low (limited impact)
- 3: Medium (noticeable impact)
- 4: High (significant impact)
- 5: Critical (severe impact)

**Risk Score = Probability × Impact (1-25)**

**Risk Level:**

- 1-5: Low (Green)
- 6-12: Medium (Yellow)
- 13-19: High (Orange)
- 20-25: Critical (Red)

### 3. Mitigation Strategy

For each risk, define:

- **Prevention**: How to prevent the risk from occurring
- **Detection**: How to detect if the risk materializes
- **Response**: How to respond if the risk occurs
- **Owner**: Who is responsible for mitigation

### 4. Test Strategy Alignment

Map risks to test scenarios:

- High/Critical risks → P0 tests (must have)
- Medium risks → P1 tests (should have)
- Low risks → P2 tests (nice to have)

## Outputs

### Output 1: Risk Profile Document

**Save to:** `qa.qaLocation/assessments/{epic}.{story}-risk-{YYYYMMDD}.md`

```markdown
# Risk Profile: Story {epic}.{story}

**Story Title:** {title}
**Assessment Date:** {date}
**Assessed By:** Quinn (Test Architect)
**Story Complexity:** {complexity_indicators_count}/7

---

## Executive Summary

**Total Risks Identified:** {count}
**Risk Distribution:**

- Critical (20-25): {count}
- High (13-19): {count}
- Medium (6-12): {count}
- Low (1-5): {count}

**Top 3 Risks:**

1. {risk_id}: {risk_name} (Score: {score})
2. {risk_id}: {risk_name} (Score: {score})
3. {risk_id}: {risk_name} (Score: {score})

---

## Risk Matrix

| Risk ID  | Category  | Risk Description            | Probability | Impact | Score | Level  | Mitigation Owner |
| -------- | --------- | --------------------------- | ----------- | ------ | ----- | ------ | ---------------- |
| SEC-001  | Security  | SQL injection in user input | 3           | 5      | 15    | High   | Dev              |
| PERF-001 | Technical | Database query performance  | 4           | 3      | 12    | Medium | Dev              |
| BUS-001  | Business  | User workflow confusion     | 2           | 4      | 8     | Medium | UX               |

---

## Detailed Risk Analysis

### SEC-001: SQL Injection in User Input

**Category:** Security
**Probability:** 3 (Possible)
**Impact:** 5 (Critical)
**Risk Score:** 15 (High)

**Description:**
User input fields in the registration form are not properly sanitized, potentially allowing SQL injection attacks that could compromise the database.

**Mitigation Strategy:**

- **Prevention:**
  - Use parameterized queries or ORM
  - Implement input validation with whitelist approach
  - Apply principle of least privilege for database access
- **Detection:**
  - Automated security scanning in CI/CD
  - SQL injection test cases (P0)
  - Runtime input validation monitoring
- **Response:**
  - Immediate rollback if detected
  - Security incident response protocol
  - Database integrity verification
- **Owner:** Dev Team

**Test Requirements:**

- P0-SEC-001: SQL injection attack test
- P0-SEC-002: Input validation boundary test
- P1-SEC-003: Parameterized query verification

**References:**

- [Source: architecture/security-standards.md#input-validation]
- [OWASP Top 10: Injection](https://owasp.org/www-project-top-ten/)

---

### PERF-001: Database Query Performance

**Category:** Technical
**Probability:** 4 (Likely)
**Impact:** 3 (Medium)
**Risk Score:** 12 (Medium)

**Description:**
The user search functionality performs full table scans on large datasets, potentially causing slow response times and poor user experience.

**Mitigation Strategy:**

- **Prevention:**
  - Add database indexes on search columns
  - Implement query result caching
  - Use pagination for large result sets
- **Detection:**
  - Performance monitoring and alerting
  - Load testing with realistic data volumes
  - Query execution time tracking
- **Response:**
  - Query optimization
  - Index tuning
  - Caching strategy adjustment
- **Owner:** Dev Team

**Test Requirements:**

- P1-PERF-001: Load test with 10,000 users
- P1-PERF-002: Query response time < 200ms
- P2-PERF-003: Concurrent user stress test

**References:**

- [Source: architecture/performance-requirements.md#database]

---

[Continue for all identified risks...]

---

## Risk Mitigation Roadmap

### Immediate Actions (Before Development)

1. SEC-001: Implement parameterized queries in data access layer
2. SEC-002: Add input validation middleware

### During Development

1. PERF-001: Add database indexes
2. TEST-001: Implement P0 security tests

### Post-Development

1. OPS-001: Set up monitoring and alerting
2. DOC-001: Update security documentation

---

## Test Strategy Alignment

### P0 Tests (Critical Risks)

- SEC-001: SQL injection prevention
- SEC-002: Authentication bypass prevention
- DATA-001: Data loss prevention

### P1 Tests (High/Medium Risks)

- PERF-001: Performance under load
- REL-001: Error recovery
- INT-001: Integration failure handling

### P2 Tests (Low Risks)

- UX-001: Edge case user flows
- MAINT-001: Code maintainability checks

---

## Compliance and Regulatory Considerations

[If applicable, list compliance requirements:]

- GDPR: Data privacy requirements
- PCI-DSS: Payment card data security
- HIPAA: Healthcare data protection
- SOC 2: Security and availability controls

---

## Sign-off

**Risk Assessment Completed By:** Quinn (Test Architect)
**Date:** {date}
**Next Review Date:** {date + 30 days}

**Recommendations:**

- Proceed with development: [Yes/No/Conditional]
- Conditions: [List any conditions if conditional]
- Required approvals: [List stakeholders who should review]
```

### Output 2: Risk Summary for Gate File

Generate a summary block for inclusion in the quality gate file:

```yaml
risk_summary:
  total_risks: { count }
  critical: { count }
  high: { count }
  medium: { count }
  low: { count }
  top_risks:
    - id: SEC-001
      score: 15
      description: "SQL injection vulnerability"
    - id: PERF-001
      score: 12
      description: "Database query performance"
```

### Output 3: Update Story File

Update the Story file at `{devStoryLocation}/{epic}.{story}.*.md`:

**QA Test Design Metadata Section:**

```markdown
## QA Test Design Metadata

- **Test Design Level:** {Simple|Standard|Comprehensive}
- **Test Design Status:** {current status - do not change}
- **Test Design Document:** {existing path if present}
- **Risk Profile Document:** qa/assessments/{epic}.{story}-risk-{YYYYMMDD}.md

### Risk Assessment Summary

- **Total Risks Identified:** {count}
- **Critical/High Risks:** {count}
- **Risk-Based Test Priorities:** P0: {count}, P1: {count}, P2: {count}
```

**Change Log:**

- Append entry:

```markdown
### {YYYY-MM-DD HH:MM} - QA Risk Profile Complete

- Risk profile document created: qa/assessments/{epic}.{story}-risk-{YYYYMMDD}.md
- Total risks identified: {count} (Critical: {count}, High: {count}, Medium: {count}, Low: {count})
- Risk-based test priorities established
```

**Important:** Risk profile task does NOT change Story Status. Status changes only happen when test-design task completes.

## Quality Checklist

Before finalizing, verify:

- [ ] All risk categories considered (Security, Technical, Business, Operational)
- [ ] Each risk has probability, impact, and score
- [ ] Mitigation strategies are specific and actionable
- [ ] Risks are mapped to test requirements
- [ ] High/Critical risks have P0 test coverage
- [ ] Risk owners are clearly identified
- [ ] Compliance requirements are documented (if applicable)

## Key Principles

- **Risk-based prioritization**: Focus on high-impact, high-probability risks
- **Actionable mitigation**: Provide specific, implementable mitigation strategies
- **Test alignment**: Ensure test strategy addresses identified risks
- **Continuous assessment**: Risks should be reassessed as story evolves
- **Stakeholder communication**: Make risks visible to all stakeholders

## Integration with Other QA Tasks

- **test-design**: Uses risk profile to prioritize test scenarios
- **review-story**: References risk profile during comprehensive review
- **nfr-assess**: Aligns NFR validation with identified risks
- **qa-gate**: Includes risk summary in gate decision

---

**Note:** This risk profile is a living document and should be updated if story scope changes or new risks are identified during development.
