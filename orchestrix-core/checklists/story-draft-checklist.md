# Story Draft Checklist

The Scrum Master should use this checklist to validate that each story contains sufficient context for a developer agent to implement it successfully, while assuming the dev agent has reasonable capabilities to figure things out.

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

## 2. TECHNICAL IMPLEMENTATION GUIDANCE

[[LLM: Technical guidance prevents dev agents from making wrong architectural decisions. Verify:

1. Architecture decisions are clearly communicated
2. Technical patterns and conventions are specified
3. Library/framework choices are explicit
4. File locations and naming patterns are provided
5. Integration points are clearly documented]]

- [ ] Key architectural decisions are documented with rationale
- [ ] Required libraries/frameworks are specified with versions
- [ ] File locations follow established project structure
- [ ] Integration patterns with existing code are clear
- [ ] API contracts and data models are referenced

## 2.5. TECHNICAL PREFERENCES ALIGNMENT

[[LLM: Technical preferences ensure consistency across the project and prevent dev agents from making decisions that conflict with established standards. Verify:

1. Technical choices align with original technical-preferences.md
2. Key constraints are preserved and communicated
3. No conflicting technical decisions are introduced
4. Architecture patterns follow established preferences
5. Technology selections match approved standards]]

- [ ] Technical choices align with original technical preferences
- [ ] Key technology constraints are preserved in Dev Notes with source references
- [ ] No conflicting technical decisions introduced without justification
- [ ] Architecture patterns follow established preference specifications
- [ ] Technology stack choices match approved standards from architecture docs
- [ ] Dev Notes include specific guidance on preferred patterns and approaches
- [ ] **MANDATORY**: SM Agent technical extraction checklist completion rate > 80%
- [ ] **MANDATORY**: All technical details in Dev Notes have valid source document references
- [ ] **MANDATORY**: No unverified technical assumptions present in the story

## 3. REFERENCE EFFECTIVENESS

[[LLM: References should help, not create a treasure hunt. Ensure:

1. References point to specific sections, not whole documents
2. The relevance of each reference is explained
3. Critical information is summarized in the story
4. References are accessible (not broken links)
5. Previous story context is summarized if needed]]

- [ ] References to external documents point to specific relevant sections
- [ ] Critical information from previous stories is summarized (not just referenced)
- [ ] Context is provided for why references are relevant
- [ ] References use consistent format (e.g., `docs/filename.md#section`)

## 4. SELF-CONTAINMENT ASSESSMENT

[[LLM: Stories should be mostly self-contained to avoid context switching. Verify:

1. Core requirements are in the story, not just in references
2. Domain terms are explained or obvious from context
3. Assumptions are stated explicitly
4. Edge cases are mentioned (even if deferred)
5. The story could be understood without reading 10 other documents]]

- [ ] Core information needed is included (not overly reliant on external docs)
- [ ] Implicit assumptions are made explicit
- [ ] Domain-specific terms or concepts are explained
- [ ] Edge cases or error scenarios are addressed

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

| Category                                  | Status | Issues |
| ----------------------------------------- | ------ | ------ |
| 1. Goal & Context Clarity                | _TBD_  |        |
| 2. Technical Implementation Guidance     | _TBD_  |        |
| 2.5. Technical Preferences Alignment     | _TBD_  |        |
| 3. Reference Effectiveness               | _TBD_  |        |
| 4. Self-Containment Assessment           | _TBD_  |        |
| 5. Testing Guidance                      | _TBD_  |        |

**Final Assessment:**

- READY: The story provides sufficient context for implementation (ALL mandatory items must be PASS)
- NEEDS REVISION: The story requires updates (see issues) 
- BLOCKED: External information required (specify what information)

**CRITICAL: Stories cannot be marked as READY unless ALL mandatory technical verification requirements are met:**
- SM Agent technical extraction checklist completed with >80% success rate
- All technical details have valid source document references  
- No unverified technical assumptions present
- Technical preferences alignment confirmed

**Quality Gate Enforcement:**
- Any MANDATORY item marked as FAIL automatically downgrades assessment to NEEDS REVISION
- Stories with < 80% technical extraction completion rate are automatically BLOCKED
- Missing source references for technical details require immediate REVISION
