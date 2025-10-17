# Story Definition of Done (DoD) Checklist

---
metadata:
  type: completion
  threshold: 95%
  on_fail: document_gaps
  purpose: "Developer self-assessment before marking story as Review"
---

## LLM Instructions

**Purpose**: Self-validate work before marking story complete. Be honest - flag issues now rather than in review.

**Execution**:
1. Mark items: [x] Done, [ ] Not Done, [N/A] Not Applicable
2. Comment on [ ] or [N/A] items
3. Flag concerns or technical debt

**Final Summary**: After checklist, provide:
- What was accomplished
- Items not done (with reasons)
- Technical debt or follow-up needed
- Confirmation story is ready for review

## Checklist Items

### 1. Requirements
- [ ] All functional requirements implemented
- [ ] All acceptance criteria met

### 2. Code Quality
- [ ] Code adheres to Operational Guidelines
- [ ] File locations/naming follow Project Structure
- [ ] Tech Stack compliance (versions, technologies)
- [ ] API Reference and Data Models compliance (if applicable)
- [ ] Security best practices applied (input validation, error handling, no secrets)
- [ ] No new linter errors/warnings
- [ ] Complex logic is commented

### 3. Testing
- [ ] Unit tests written for new functionality
- [ ] Edge cases and error scenarios covered
- [ ] All tests pass
- [ ] Testing follows story standards

### 4. Test Design Compliance (if QA test design exists)
- [ ] Test design document reviewed before implementation
- [ ] All P0 tests implemented
- [ ] Test priorities follow recommendations (P0 → P1 → P2)
- [ ] Test levels match specifications (Unit/Integration/E2E)
- [ ] Deviations documented in Dev Log with justification
- [ ] Coverage meets/exceeds requirements

### 5. Test Integrity
- [ ] No test expectations/assertions modified to make tests pass
- [ ] Test failures fixed via implementation, not by weakening tests
- [ ] Test modifications have business justification in Completion Notes
- [ ] Requirement tests remain immutable
- [ ] Coverage validates acceptance criteria
- [ ] No test conditions relaxed without approval

### 6. Functionality
- [ ] Functionality manually verified (local run, UI check, API test)
- [ ] Edge cases and errors handled gracefully

### 7. Story Administration
- [ ] All tasks marked complete
- [ ] Decisions/clarifications documented in Dev Log
- [ ] Dev Agent Record completed:
  - Agent Model Used
  - Implementation Summary (3-5 sentences)
  - File List (added/modified/deleted)
  - Dev Log Reference
- [ ] Changelog updated

### 8. Dev Log
- [ ] Dev Log exists at docs/dev/logs/{story-id}-dev-log.md
- [ ] Story Context complete
- [ ] Test Strategy Summary recorded (if applicable)
- [ ] All phases (1-4) have subtask logs
- [ ] Technical decisions documented with rationale
- [ ] Issues documented with resolutions
- [ ] Deviations from SM design documented
- [ ] Phase Summaries complete
- [ ] Resumption Guide current
- [ ] Final Summary written
- [ ] Dev Agent Record references Dev Log

### 9. Build & Dependencies
- [ ] Project builds without errors
- [ ] Linting passes
- [ ] New dependencies pre-approved or user-approved (documented)
- [ ] Dependencies recorded in project files with justification
- [ ] No security vulnerabilities in new dependencies
- [ ] New env vars/configs documented and secure

### 10. Documentation (if applicable)
- [ ] Inline documentation for public APIs/complex logic
- [ ] User-facing docs updated
- [ ] Technical docs updated for architectural changes

## Final Confirmation
- [ ] All applicable items addressed and story ready for review
