# Create Next Story Task

## Purpose

To identify the next logical story based on project progress and epic definitions, and then to prepare a comprehensive, self-contained, and actionable story file using the `Story Template`. This task ensures the story is enriched with all necessary technical context, requirements, and acceptance criteria, making it ready for efficient implementation by a Developer Agent with minimal need for additional research or finding its own context.

## SEQUENTIAL Task Execution (Do not proceed until current Task is complete)

### 0. Load Core Configuration and Check Workflow

- Load `{root}/core-config.yaml` from the project root
- If the file does not exist, HALT and inform the user: "core-config.yaml not found. This file is required for story creation. You can either: 1) Copy it from GITHUB orchestrix-core/core-config.yaml and configure it for your project OR 2) Run the Orchestrix installer against your project to upgrade and add the file automatically. Please add and configure core-config.yaml before proceeding."
- Extract key configurations: `devStoryLocation`, `prd.*`, `architecture.*`, `workflow.*`

### 1. Identify Next Story for Preparation

#### 1.1 Locate Epic Files and Review Existing Stories

- Based on `prdSharded` from config, locate epic files (sharded location/pattern or monolithic PRD sections)
- If `devStoryLocation` has story files, load the highest `{epicNum}.{storyNum}.story.md` file
- **If highest story exists:**
  - Verify status is 'Done'. If not, alert user: "ALERT: Found incomplete story! File: {lastEpicNum}.{lastStoryNum}.story.md Status: [current status] You should fix this story first, but would you like to accept risk & override to create the next story in draft?"
  - If proceeding, select next sequential story in the current epic
  - If epic is complete, prompt user: "Epic {epicNum} Complete: All stories in Epic {epicNum} have been completed. Would you like to: 1) Begin Epic {epicNum + 1} with story 1 2) Select a specific story to work on 3) Cancel story creation"
  - **CRITICAL**: NEVER automatically skip to another epic. User MUST explicitly instruct which story to create.
- **If no story files exist:** The next story is ALWAYS 1.1 (first story of first epic)
- Announce the identified story to the user: "Identified next story for preparation: {epicNum}.{storyNum} - {Story Title}"

### 2. Gather Story Requirements and Previous Story Context

- Extract story requirements from the identified epic file
- If previous story exists, review Dev Agent Record sections for:
  - Completion Notes and Debug Log References
  - Implementation deviations and technical decisions
  - Challenges encountered and lessons learned
- Extract relevant insights that inform the current story's preparation

### 3. Gather Architecture Context

#### 3.1 Determine Architecture Reading Strategy

- **If `architectureSharded: true`**: Read `{architectureShardedLocation}/index.md` then follow structured reading order below
- **Else**: Use monolithic `architectureFile` for similar sections

#### 3.2 Read Architecture Documents Based on Story Type

**For ALL Stories:** tech-stack.md, unified-project-structure.md, coding-standards.md, testing-strategy.md

**For Backend/API Stories, additionally:** data-models.md, database-schema.md, backend-architecture.md, rest-api-spec.md, external-apis.md

**For Frontend/UI Stories, additionally:** frontend-architecture.md, components.md, core-workflows.md, data-models.md

**For Full-Stack Stories:** Read both Backend and Frontend sections above

#### 3.3 Extract Story-Specific Technical Details

Extract ONLY information directly relevant to implementing the current story. Do NOT invent new libraries, patterns, or standards not in the source documents.

Extract:

- Specific data models, schemas, or structures the story will use
- API endpoints the story must implement or consume
- Component specifications for UI elements in the story
- File paths and naming conventions for new code
- Testing requirements specific to the story's features
- Security or performance considerations affecting the story

ALWAYS cite source documents: `[Source: docs/architecture/{filename}.md#{section}]`

### 4. Verify Project Structure Alignment

- Cross-reference story requirements with Project Structure Guide from `docs/architecture/unified-project-structure.md`
- Ensure file paths, component locations, or module names align with defined structures
- Document any structural conflicts in "Project Structure Notes" section within the story draft

### 5. **MANDATORY Technical Detail Extraction Verification**

**CRITICAL:** Before populating the Story Template, execute the technical extraction verification process:

- Execute `{root}/checklists/sm-technical-extraction-checklist.md` as a mandatory quality gate
- **Verification Requirements:**
  - Complete ALL sections of the technical extraction checklist
  - Mark each item as [x] Done, [ ] Not Done, or [N/A] Not Applicable
  - Provide detailed explanations for any [ ] Not Done items
  - Achieve minimum 80% completion rate (< 20% Not Done items)
- **Quality Gates:**
  - If > 20% items marked as [ ] Not Done: HALT and re-examine architecture documents
  - If critical technical details are missing: Request clarification from user or architect
  - If technical preferences conflicts detected: Document and flag for resolution
- **Documentation Requirements:**
  - All [x] Done items MUST have corresponding entries in the upcoming Dev Notes section
  - All source document references MUST be accurate and specific
  - All technical assumptions MUST be validated against architecture documents

**FAILURE TO COMPLETE THIS VERIFICATION STEP INVALIDATES THE ENTIRE STORY CREATION PROCESS**

### 6. Populate Story Template with Full Context

- Create new story file: `{devStoryLocation}/{epicNum}.{storyNum}.story.md` using Story Template
- Fill in basic story information: Title, Status (Draft), Story statement, Acceptance Criteria from Epic
- **`Dev Notes` section (CRITICAL):**
  - CRITICAL: This section MUST contain ONLY information extracted and verified in Step 5. NEVER invent or assume technical details.
  - Include ALL relevant technical details from Steps 2-3 and verified in Step 5, organized by category:
    - **Previous Story Insights**: Key learnings from previous story
    - **Technical Preferences Summary**: Key technical choices and constraints from original technical-preferences.md (via architecture docs)
    - **Data Models**: Specific schemas, validation rules, relationships [with source references]
    - **API Specifications**: Endpoint details, request/response formats, auth requirements [with source references]
    - **Component Specifications**: UI component details, props, state management [with source references]
    - **File Locations**: Exact paths where new code should be created based on project structure
    - **Testing Requirements**: Specific test cases or strategies from testing-strategy.md
    - **Testing Integrity Requirements**: CRITICAL test rules that must be preserved
      - Tests represent requirements and are AUTHORITATIVE
      - Test expectations, assertions, and acceptance criteria are IMMUTABLE
      - Implementation must adapt to tests, never the reverse
      - Any test modifications require explicit business justification
      - Distinguish requirement tests (immutable) from implementation tests (adjustable)
    - **Technical Constraints**: Version requirements, performance considerations, security rules
    - **Technical Extraction Verification Summary**: Include completion rate and any flagged issues from Step 5
  - Every technical detail MUST include its source reference: `[Source: docs/architecture/{filename}.md#{section}]`
  - Technical Preferences section MUST explicitly reference original preferences and note any adaptations or constraints
  - If information for a category is not found in the architecture docs, explicitly state: "No specific guidance found in architecture docs"
- **`Tasks / Subtasks` section:**
  - Generate detailed, sequential list of technical tasks based ONLY on: Epic Requirements, Story AC, Reviewed Architecture Information
  - Each task must reference relevant architecture documentation
  - Include unit testing as explicit subtasks based on the Testing Strategy
  - Link tasks to ACs where applicable (e.g., `Task 1 (AC: 1, 3)`)
- Add notes on project structure alignment or discrepancies found in Step 4

### 7. Enhanced Story Quality Verification

**CRITICAL:** Execute enhanced quality verification before completing the story:

- **Dev Notes Accuracy Check:**
  - Verify all technical details in Dev Notes correspond to verified items from Step 5
  - Confirm all source references are accurate and accessible
  - Validate that no unverified technical assumptions are included
- **Implementation Guidance Completeness:**
  - Ensure Dev Notes provide sufficient guidance for implementation
  - Verify that all technical decisions are backed by architecture documents
  - Confirm that file locations and naming conventions are explicitly specified
- **Technical Risk Assessment:**
  - Document any technical risks identified during extraction verification
  - Flag any areas where architecture guidance is incomplete or conflicting
  - Note any dependencies on external clarification or decisions

### 8. Story Draft Completion and Review

- Review all sections for completeness and accuracy
- Verify all source references are included for technical details
- Ensure tasks align with both epic requirements and architecture constraints
- Update status to "Draft" and save the story file
- Execute `{root}/tasks/execute-checklist` `{root}/checklists/story-draft-checklist`
- **MANDATORY**: Execute `{root}/tasks/validate-story-quality` for comprehensive quality verification
- Provide summary to user including:
  - Story created: `{devStoryLocation}/{epicNum}.{storyNum}.story.md`
  - Status: Draft (or Approved/Blocked based on validation results)
  - Technical extraction verification completion rate
  - Quality score and assessment results
  - Key technical components included from architecture docs
  - Any deviations or conflicts noted between epic and architecture
  - Checklist Results and Quality Validation Report
  - **Critical Issues** (if any) that need immediate attention
  - Next steps: 
    - For High-Quality stories (Score 8+): Ready for developer assignment
    - For Medium-Quality stories (Score 6-7): Review improvement recommendations
    - For Low-Quality stories (Score < 6): Return to architecture review or escalate to architect
    - Complex stories should have PO run `{root}/tasks/validate-next-story` for business validation
