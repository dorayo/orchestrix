# Story Definition of Done (DoD) Checklist

## Instructions for Developer Agent

Before marking a story as 'Review', please go through each item in this checklist. Report the status of each item (e.g., [x] Done, [ ] Not Done, [N/A] Not Applicable) and provide brief comments if necessary.

[[LLM: INITIALIZATION INSTRUCTIONS - STORY DOD VALIDATION

This checklist is for DEVELOPER AGENTS to self-validate their work before marking a story complete.

IMPORTANT: This is a self-assessment. Be honest about what's actually done vs what should be done. It's better to identify issues now than have them found in review.

EXECUTION APPROACH:

1. Go through each section systematically
2. Mark items as [x] Done, [ ] Not Done, or [N/A] Not Applicable
3. Add brief comments explaining any [ ] or [N/A] items
4. Be specific about what was actually implemented
5. Flag any concerns or technical debt created

The goal is quality delivery, not just checking boxes.]]

## Checklist Items

1. **Requirements Met:**

   [[LLM: Be specific - list each requirement and whether it's complete]]

   - [ ] All functional requirements specified in the story are implemented.
   - [ ] All acceptance criteria defined in the story are met.

2. **Coding Standards & Project Structure:**

   [[LLM: Code quality matters for maintainability. Check each item carefully]]

   - [ ] All new/modified code strictly adheres to `Operational Guidelines`.
   - [ ] All new/modified code aligns with `Project Structure` (file locations, naming, etc.).
   - [ ] Adherence to `Tech Stack` for technologies/versions used (if story introduces or modifies tech usage).
   - [ ] Adherence to `Api Reference` and `Data Models` (if story involves API or data model changes).
   - [ ] Basic security best practices (e.g., input validation, proper error handling, no hardcoded secrets) applied for new/modified code.
   - [ ] No new linter errors or warnings introduced.
   - [ ] Code is well-commented where necessary (clarifying complex logic, not obvious statements).

3. **Testing:**

   [[LLM: Verify testing is complete and follows requirements]]

   - [ ] Unit tests are written for all new functionality.
   - [ ] Tests cover edge cases and error scenarios.
   - [ ] All tests pass successfully.
   - [ ] Testing follows the standards outlined in the story.

3.5. **Test Design Compliance (if applicable):**

   [[LLM: If QA test design exists, verify compliance with test design document]]

   - [ ] QA test design document was read and understood before implementation
   - [ ] All P0 tests from test design document are implemented
   - [ ] Test priorities follow test design recommendations (P0 → P1 → P2)
   - [ ] Test levels match test design specifications (Unit/Integration/E2E)
   - [ ] Any deviations from test design are documented in Dev Log with justification
   - [ ] Test coverage meets or exceeds test design requirements

4. **Test Integrity Verification:**

   [[LLM: CRITICAL - Verify test integrity and prevent inappropriate test modifications]]

   - [ ] No test expectations, assertions, or acceptance criteria were modified to make tests pass
   - [ ] All test failures were addressed by fixing implementation, not by weakening tests
   - [ ] Any test modifications have explicit business justification documented in Completion Notes
   - [ ] Requirement tests (business logic) remain immutable and authoritative
   - [ ] Test coverage adequately validates the acceptance criteria
   - [ ] No test conditions were relaxed or removed without proper approval

5. **Functionality & Verification:**

   [[LLM: Did you actually run and test your code? Be specific about what you tested]]

   - [ ] Functionality has been manually verified by the developer (e.g., running the app locally, checking UI, testing API endpoints).
   - [ ] Edge cases and potential error conditions considered and handled gracefully.

6. **Story Administration:**

   [[LLM: Documentation helps the next developer. What should they know?]]

   - [ ] All tasks within the story file are marked as complete.
   - [ ] Any clarifications or decisions made during development are documented in the Dev Log file
   - [ ] The Dev Agent Record has been completed with:
     - Agent Model Used
     - Implementation Summary (3-5 sentences, high-level only)
     - File List (simple list of added/modified/deleted files)
     - Dev Log Reference (link to detailed development history)
   - [ ] The changelog of any changes is properly updated.

6.5. **Dev Log Completeness:**

   [[LLM: Dev Log provides detailed development history for context recovery and knowledge transfer]]

   - [ ] Dev Log file exists at docs/dev/logs/{story-id}-dev-log.md
   - [ ] Story Context section is complete with story metadata
   - [ ] Test Strategy Summary is recorded (if test design exists)
   - [ ] All phases (1-4) have subtask logs with implementation details
   - [ ] All technical decisions are documented with rationale
   - [ ] All issues encountered are documented with resolutions
   - [ ] Any deviations from SM design are documented with reasons and impact
   - [ ] Each phase has a Phase Summary
   - [ ] Resumption Guide is up-to-date (for context recovery)
   - [ ] Final Summary is written with achievements, challenges, and technical debt
   - [ ] Dev Agent Record in Story file includes reference to Dev Log

7. **Dependencies, Build & Configuration:**

   [[LLM: Build issues block everyone. Ensure everything compiles and runs cleanly]]

   - [ ] Project builds successfully without errors.
   - [ ] Project linting passes
   - [ ] Any new dependencies added were either pre-approved in the story requirements OR explicitly approved by the user during development (approval documented in story file).
   - [ ] If new dependencies were added, they are recorded in the appropriate project files (e.g., `package.json`, `requirements.txt`) with justification.
   - [ ] No known security vulnerabilities introduced by newly added and approved dependencies.
   - [ ] If new environment variables or configurations were introduced by the story, they are documented and handled securely.

8. **Documentation (If Applicable):**

   [[LLM: Good documentation prevents future confusion. What needs explaining?]]

   - [ ] Relevant inline code documentation (e.g., JSDoc, TSDoc, Python docstrings) for new public APIs or complex logic is complete.
   - [ ] User-facing documentation updated, if changes impact users.
   - [ ] Technical documentation (e.g., READMEs, system diagrams) updated if significant architectural changes were made.

## Final Confirmation

[[LLM: FINAL DOD SUMMARY

After completing the checklist:

1. Summarize what was accomplished in this story
2. List any items marked as [ ] Not Done with explanations
3. Identify any technical debt or follow-up work needed
4. Note any challenges or learnings for future stories
5. Confirm whether the story is truly ready for review

Be honest - it's better to flag issues now than have them discovered later.]]

- [ ] I, the Developer Agent, confirm that all applicable items above have been addressed.
