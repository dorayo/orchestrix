# Validate Next Story Task (PO Business Validation Tool)

## Purpose

**IMPORTANT: This task is designed for Product Owner (PO) business validation, NOT for SM or Dev technical validation.**

This task provides a business-focused validation perspective to ensure:
- Story aligns with business goals and epic objectives
- Business value is clear and measurable
- User impact is properly considered
- Story scope is appropriate for business delivery

**When to Use:**
- PO wants to validate business aspects before development
- Complex stories requiring business stakeholder review
- Stories with significant user impact or business risk
- Optional quality gate for high-priority epics

**When NOT to Use:**
- SM technical validation (use validation/sm-technical-extraction-checklist instead)
- Dev implementation readiness (use validate-story-quality instead)
- Architect technical review (use review-story-technical-accuracy instead)

## Target User
- **Primary:** Product Owner (PO) Agent
- **Secondary:** Business stakeholders (human review)
- **NOT for:** SM Agent, Dev Agent, Architect Agent

---

## Business-Focused Validation Process

### 1. Business Value Assessment
- Is the business value clearly articulated?
- Does the story deliver measurable business outcomes?
- Is the ROI justified for the implementation effort?

### 2. User Impact Analysis
- Are target users clearly identified?
- Is the user benefit tangible and significant?
- Does the story improve user experience measurably?

### 3. Epic Alignment Verification
- Does the story contribute to epic goals?
- Is the story scope appropriate for the epic phase?
- Are there any scope creep concerns?

### 4. Business Risk Assessment
- What are the business risks if this story fails?
- Are there regulatory or compliance considerations?
- Is the story critical for business operations?

### 5. Stakeholder Readiness
- Have necessary stakeholders been consulted?
- Are business requirements clearly understood?
- Is there alignment on success criteria?

---

## Output: Business Validation Report

```markdown
## Business Validation Report

**Story:** {epicNum}.{storyNum}
**Validator:** PO Agent
**Date:** {timestamp}

### Business Value Score: {score}/10
- Clear business value: ✅/❌
- Measurable outcomes: ✅/❌
- ROI justified: ✅/❌

### User Impact Score: {score}/10
- Target users identified: ✅/❌
- User benefit tangible: ✅/❌
- UX improvement measurable: ✅/❌

### Epic Alignment Score: {score}/10
- Contributes to epic goals: ✅/❌
- Appropriate scope: ✅/❌
- No scope creep: ✅/❌

### Business Decision
- **GO**: Story approved for development from business perspective
- **NO-GO**: Story requires business clarification or revision
- **DEFER**: Story should be postponed to later sprint

### Business Recommendations
- {recommendation}
- {recommendation}
```

---

## Integration with Technical Validation

**Validation Flow:**
```
SM Technical Validation (validation/sm-technical-extraction-checklist)
         ↓
SM Quality Scoring (validate-story-quality)
         ↓
[Optional] PO Business Validation (validate-next-story) ← YOU ARE HERE
         ↓
Architect Technical Review (review-story-technical-accuracy)
         ↓
Dev Implementation
```

**Note:** PO business validation is optional and independent of technical validation. A story can proceed to development with technical approval even without PO validation, unless explicitly required by project governance.
