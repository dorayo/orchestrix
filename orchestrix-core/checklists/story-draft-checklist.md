# Story Draft Checklist

> **⚠️ DEPRECATED**: This checklist has been superseded by `sm-story-creation-comprehensive-checklist.md` which provides unified validation.  
> **Recommended**: Use `sm-story-creation-comprehensive-checklist.md` for complete story validation.  
> **Status**: Kept for backward compatibility. May be removed in future versions.

The Scrum Master should use this checklist to validate story structure and completeness AFTER technical extraction has been completed. This checklist focuses on story-specific validation that is NOT covered by the technical extraction checklist.

[[LLM: INITIALIZATION INSTRUCTIONS - STORY DRAFT VALIDATION

Before proceeding with this checklist, ensure you have access to:

1. The story document being validated (usually in docs/stories/ or provided directly)
2. The parent epic context
3. Any referenced architecture or design documents
4. Previous related stories if this builds on prior work

IMPORTANT: This checklist validates individual stories BEFORE implementation begins.

VALIDATION PRINCIPLES:

1. Clarity - A developer should understand WHAT to build
2. Context - WHY this is being built and how it fits
3. Guidance - Key technical decisions and patterns to follow
4. Testability - How to verify the implementation works
5. Self-Contained - Most info needed is in the story itself

REMEMBER: We assume competent developer agents who can:

- Research documentation and codebases
- Make reasonable technical decisions
- Follow established patterns
- Ask for clarification when truly stuck

We're checking for SUFFICIENT guidance, not exhaustive detail.]]

## 1. GOAL & CONTEXT CLARITY

[[LLM: Without clear goals, developers build the wrong thing. Verify:

1. The story states WHAT functionality to implement
2. The business value or user benefit is clear
3. How this fits into the larger epic/product is explained
4. Dependencies are explicit ("requires Story X to be complete")
5. Success looks like something specific, not vague]]

- [ ] Story goal/purpose is clearly stated
- [ ] Relationship to epic goals is evident
- [ ] How the story fits into overall system flow is explained
- [ ] Dependencies on previous stories are identified (if applicable)
- [ ] Business context and value are clear

## 2. STRUCTURE & TEMPLATE COMPLIANCE

[[LLM: Verify story follows template structure and has all required sections filled.]]

- [ ] All required template sections are present
- [ ] No placeholders ({{variables}}) remain unfilled
- [ ] Story follows standard template structure
- [ ] Status field is properly set
- [ ] Change Log has initial entry

## 3. ACCEPTANCE CRITERIA COVERAGE

[[LLM: Verify all acceptance criteria are properly mapped to implementation tasks.]]

- [ ] All ACs have corresponding tasks in Tasks/Subtasks section
- [ ] Task-AC mapping is explicit (e.g., "Task 1 (AC: 1, 3)")
- [ ] Tasks logically cover all AC requirements
- [ ] No ACs are left without implementation tasks
- [ ] AC numbering is consistent and clear

## 4. TASK SEQUENCE & LOGIC

[[LLM: Verify tasks are logically ordered and dependencies are clear.]]

- [ ] Tasks follow logical implementation order
- [ ] Dependencies between tasks are clear and documented
- [ ] No circular dependencies exist
- [ ] Frontend-first strategy applied correctly (if enabled)
- [ ] User confirmation checkpoints included (if required)

## 5. TESTING GUIDANCE

[[LLM: Testing ensures the implementation actually works. Check:

1. Test approach is specified (unit, integration, e2e)
2. Key test scenarios are listed
3. Success criteria are measurable
4. Special test considerations are noted
5. Acceptance criteria in the story are testable]]

- [ ] Required testing approach is outlined
- [ ] Key test scenarios are identified
- [ ] Success criteria are defined
- [ ] Special testing considerations are noted (if applicable)

## VALIDATION RESULT

[[LLM: FINAL STORY VALIDATION REPORT

Generate a concise validation report:

1. Quick Summary

   - Story readiness: READY / NEEDS REVISION / BLOCKED
   - Clarity score (1-10)
   - Major gaps identified

2. Fill in the validation table with:

   - PASS: Requirements clearly met
   - PARTIAL: Some gaps but workable
   - FAIL: Critical information missing

3. Specific Issues (if any)

   - List concrete problems to fix
   - Suggest specific improvements
   - Identify any blocking dependencies

4. Developer Perspective
   - Could YOU implement this story as written?
   - What questions would you have?
   - What might cause delays or rework?

Be pragmatic - perfect documentation doesn't exist, but it must be enough to provide the extreme context a dev agent needs to get the work down and not create a mess.]]

| Category | Status | Issues |
|----------|--------|--------|
| 1. Goal & Context Clarity | _TBD_ | |
| 2. Structure & Template Compliance | _TBD_ | |
| 3. AC Coverage | _TBD_ | |
| 4. Task Sequence & Logic | _TBD_ | |
| 5. Testing Guidance | _TBD_ | |

**Final Assessment:**

- **PASS**: All sections marked PASS 
- **FAIL**: Any section marked FAIL

**Note:** This checklist focuses on story structure and completeness. Technical accuracy and extraction completeness are validated separately by the sm-technical-extraction-checklist.
