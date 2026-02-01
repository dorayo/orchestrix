# Product Owner (PO) Master Validation Checklist

This checklist serves as a comprehensive framework for the Product Owner to validate project plans before development execution. It adapts intelligently based on project type (greenfield vs brownfield) and includes UI/UX considerations when applicable.

[[LLM: INITIALIZATION INSTRUCTIONS - PO MASTER CHECKLIST

PROJECT TYPE DETECTION:
First, determine the project type by checking:

1. Is this a GREENFIELD project (new from scratch)?
   - Look for: New project initialization, no existing codebase references
   - Check for: prd.md, architecture.md, new project setup stories

2. Is this a BROWNFIELD project (enhancing existing system)?
   - Look for: References to existing codebase, enhancement/modification language
   - Check for: prd.md, architecture.md, existing system analysis

3. Does the project include UI/UX components?
   - Check for: frontend-architecture.md, UI/UX specifications, design files
   - Look for: Frontend stories, component specifications, user interface mentions

DOCUMENT REQUIREMENTS:
Based on project type, ensure you have access to:

For GREENFIELD projects:

- prd.md - The Product Requirements Document
- architecture.md - The system architecture
- frontend-architecture.md - If UI/UX is involved
- All epic and story definitions

For BROWNFIELD projects:

- prd.md - The brownfield enhancement requirements
- architecture.md - The enhancement architecture
- Existing project codebase access (CRITICAL - cannot proceed without this)
- Current deployment configuration and infrastructure details
- Database schemas, API documentation, monitoring setup

SKIP INSTRUCTIONS:

- Skip sections marked [[BROWNFIELD ONLY]] for greenfield projects
- Skip sections marked [[GREENFIELD ONLY]] for brownfield projects
- Skip sections marked [[UI/UX ONLY]] for backend-only projects
- Note all skipped sections in your final report

VALIDATION APPROACH:

1. Deep Analysis - Thoroughly analyze each item against documentation
2. Evidence-Based - Cite specific sections or code when validating
3. Critical Thinking - Question assumptions and identify gaps
4. Risk Assessment - Consider what could go wrong with each decision

EXECUTION MODE:
Ask the user if they want to work through the checklist:

- Section by section (interactive mode) - Review each section, get confirmation before proceeding
- All at once (comprehensive mode) - Complete full analysis and present report at end]]

## 0. PRD DOCUMENT FORMAT & STRUCTURE VALIDATION

[[LLM: Before validating content, ensure the PRD document structure matches the template. This prevents downstream issues during epic sharding and story creation. Pay special attention to multi-repo configurations and API contract completeness.]]

### 0.1 Core Document Structure

[[LLM: PRD structure differs between Greenfield and Brownfield templates. Validate against the correct template.]]

**[[GREENFIELD]]:**

- [ ] PRD contains all required template sections: Goals and Background Context, Requirements, Technical Assumptions, Epic List, Epics, Checklist Results Report, Next Steps
- [ ] Each section follows the template structure (subsections, format types)
- [ ] If project has UI/UX requirements: `User Interface Design Goals` section exists between Requirements and Technical Assumptions
- [ ] Goals and Background Context includes Change Log table with columns: `[Date, Version, Description, Author]`
- [ ] Requirements section has both Functional (FR prefix) and Non-Functional (NFR prefix) subsections
- [ ] Next Steps section includes UX Expert Prompt and Architect Prompt
- [ ] Checklist Results Report section exists (populated after PM checklist execution)

**[[BROWNFIELD]]:**

- [ ] PRD contains all required template sections: Intro Project Analysis and Context, Requirements, Technical Constraints and Integration Requirements, Epic and Story Structure, Epics
- [ ] Each section follows the brownfield template structure
- [ ] If enhancement includes UI changes: `User Interface Enhancement Goals` section exists
- [ ] Intro Project Analysis and Context includes subsections: Existing Project Overview, Available Documentation Analysis, Enhancement Scope Definition, Goals and Background Context, Change Log
- [ ] Change Log table uses columns: `[Change, Date, Version, Description, Author]`
- [ ] Requirements section has Functional (FR prefix), Non-Functional (NFR prefix), and Compatibility Requirements (CR prefix) subsections
- [ ] Existing System Analysis prerequisite document exists (docs/existing-system-analysis.md or docs/existing-system-integration.md)

### 0.2 Epics YAML Format [[CRITICAL]]

[[LLM: Epics section contains structured YAML that will be parsed by SM agents. Invalid or incomplete YAML will block story creation. Both Greenfield and Brownfield PRDs use the Enhanced Structured AC format (objects with `id`, `title`, `scenario`, `business_rules`, etc.).]]

#### Common YAML Validation

- [ ] Epics section exists and contains YAML blocks
- [ ] One YAML block per epic
- [ ] Each YAML block is properly formatted and parseable
- [ ] Epic IDs are sequential (Epic 1 → epic_id: 1, Epic 2 → epic_id: 2)
- [ ] Story IDs follow format: "{epic_id}.{story_number}" (e.g., "1.1", "1.2", "2.1")
- [ ] All YAML blocks include required fields: `epic_id`, `title`, `description`, `stories`
- [ ] Each story includes required fields: `id`, `title`, `repository_type`, `acceptance_criteria`, `estimated_complexity`, `priority`

#### Enhanced Structured AC Format

[[LLM: Both Greenfield and Brownfield PRDs use this format. Each AC is a complete requirement unit that Dev agents implement directly. Validate the full structure.]]

- [ ] Each `acceptance_criteria` entry is an object (not a string)
- [ ] Each AC object has required fields: `id` (AC1, AC2, ...) and `title` (concise, 5-10 words)
- [ ] Each AC has `scenario` with required subfields: `given` (string), `when` (string), `then` (array of strings)
- [ ] Each AC has `business_rules` array with at least 1 entry, format: `{id: "BR-{ac_num}.{seq}", rule: "..."}`
- [ ] Each AC has `error_handling` array with at least 1 entry, format: `{scenario, code, message, action}`
- [ ] ACs involving form input or API request body include `data_validation` array, format: `{field, type, required, rules, error_message}`
- [ ] Frontend/mobile story ACs include `interaction` array when UI behavior exists (optional), format: `{trigger, behavior}`
- [ ] ACs include `examples` array when applicable (recommended), format: `{input, expected}`
- [ ] Each story includes `provides_apis` array (may be empty) — backend stories list provided endpoints
- [ ] Each story includes `consumes_apis` array (may be empty) — frontend/mobile stories list consumed endpoints
- [ ] Each story includes `dependencies` array (may be empty) — story IDs this story depends on
- [ ] Each story includes `sm_hints` field (may be null): `{front_end_spec, architecture}`

#### Epic-Level Fields [[IF post-MVP iteration OR brownfield]]

- [ ] If this is a post-MVP iteration or brownfield project: epics include `reuse_analysis` section (RECOMMENDED)
- [ ] `reuse_analysis` contains subsections: `directly_reusable`, `requires_extension`, `conflicts`, `new_implementations`
- [ ] Each `directly_reusable` entry has: `component`, `location`, `capability`, `usage`
- [ ] Each `requires_extension` entry has: `component`, `location`, `current_capability`, `extension_needed`, `affected_stories`
- [ ] Each `conflicts` entry has: `component`, `location`, `conflict`, `resolution`, `affected_stories`
- [ ] Each `new_implementations` entry has: `feature`, `suggested_location`, `pattern_reference`, `affected_stories`

### 0.3 Multi-Repo Configuration Completeness

[[LLM: Multi-repo projects require additional configuration. Missing these will cause epic sharding and story creation failures.]]

- [ ] Technical Assumptions section specifies Repository Structure (Monorepo/Polyrepo/Multi-repo)
- [ ] If Multi-repo: Repository Details table exists with columns [Repository Name, Type, Technology, Team]
- [ ] If Multi-repo: All repositories listed with correct naming convention ({project}-{type})
- [ ] If Multi-repo: Repository types match available options (backend, frontend, ios, android, mobile, shared)
- [ ] If Monolith: Repository Details section skipped or states "Single repository (monolith architecture)"

### 0.4 Story Repository Assignment [[MULTI-REPO ONLY]]

[[LLM: Each story must be assigned to a specific repository. Skip this subsection for monolith projects.]]

- [ ] All stories have `repository_type` field populated
- [ ] Repository types match template options: backend, frontend, ios, android, flutter, react-native, monolith
- [ ] Story repository types align with Repository Details table entries
- [ ] For multi-repo: No stories use `repository_type: monolith`
- [ ] For monolith: All stories use `repository_type: monolith`
- [ ] Stories with `repository_type != monolith` have `repository-name` field populated
- [ ] Repository names in stories match Repository Details table

### 0.5 API Contract Completeness [[MULTI-REPO ONLY]]

[[LLM: API contracts enable cross-repo dependency tracking and validation. This is CRITICAL for multi-repo projects to prevent integration failures.]]

- [ ] All backend stories include `provides_apis` list (even if empty)
- [ ] Backend `provides_apis` entries use correct format: "METHOD /path" (e.g., "POST /api/users")
- [ ] All frontend/mobile stories include `consumes_apis` list (even if empty)
- [ ] Frontend/mobile `consumes_apis` entries use correct format: "METHOD /path"
- [ ] API consumption forms closed loop: APIs in `consumes_apis` exist in some story's `provides_apis`
- [ ] API provisioning is sequenced before consumption (backend story comes before frontend story)

### 0.6 Cross-Repo Dependencies [[MULTI-REPO ONLY]]

[[LLM: Cross-repo dependencies create blocking relationships. These must be explicitly tracked to prevent integration issues.]]

- [ ] All stories include `cross_repo_dependencies` field (even if empty array)
- [ ] Dependencies use correct format: "Story ID - Brief Description" (e.g., "1.2 - Backend auth API must be complete")
- [ ] Dependency Story IDs reference valid stories from Epics section
- [ ] Dependencies are properly sequenced (dependent story comes after prerequisite story)
- [ ] Frontend/mobile stories depending on backend APIs have explicit dependencies listed
- [ ] No circular dependencies exist

### 0.7 Epic and Story Metadata

[[LLM: Complete metadata enables quality assessment and prioritization during story creation.]]

- [ ] All stories have `estimated_complexity` field with valid values: low, medium, high
- [ ] All stories have `priority` field with valid values: P0, P1, P2
- [ ] Each AC has clear, testable scenario in GIVEN/WHEN/THEN format with at least 1 business rule and 1 error handling scenario
- [ ] Story titles are descriptive and include repository context for multi-repo (e.g., "Backend - User Registration API")

### 0.8 Architecture Document Template Compliance [[MULTI-REPO ONLY]]

[[LLM: For multi-repo projects, each repository must have an architecture document that follows the standardized template for its type. This ensures Dev agents can correctly load architecture context during story implementation. Skip this subsection for monolith projects.]]

**Purpose**: Validate that architecture documents use standardized Section IDs, enabling the Dev agent's `load-architecture-context.md` utility to correctly extract implementation guidance.

**Critical**: Dev agents expect specific section names (`tech-stack`, `source-tree`, `coding-standards`, `testing-strategy`). Mismatched section names will cause context loading failures.

#### 0.8.1 Architecture Document Existence

- [ ] Product repo has `docs/architecture/system-architecture.md` (if system architecture exists)
- [ ] Backend repo(s) have `docs/architecture.md`
- [ ] Frontend/Web repo(s) have `docs/ui-architecture.md` or `docs/architecture.md`
- [ ] Mobile repo(s) have `docs/architecture.md`

#### 0.8.2 Backend Architecture Template Compliance

[[LLM: Backend repos must follow `architecture-tmpl.yaml` structure. Read the architecture.md file and verify section headings.]]

For each Backend repository's `docs/architecture.md`, verify it contains these **exact section headings**:

- [ ] Section exists: `## Tech Stack` (or `## Technology Stack`)
- [ ] Section exists: `## Source Tree` (or `## Project Structure`)
- [ ] Section exists: `## Coding Standards`
- [ ] Section exists: `## Testing Strategy`
- [ ] Section exists: `## Data Models`
- [ ] Section exists: `## Database Schema`
- [ ] Section exists: `## REST API Spec` or `## API Specification`
- [ ] Section exists: `## Components`
- [ ] Section exists: `## External APIs` (if external integrations exist)

**Common Errors to Flag**:
- ❌ `Backend Tech Stack` → Should be `Tech Stack`
- ❌ `Test Strategy` → Should be `Testing Strategy`
- ❌ `Backend Developer Standards` → Should be `Coding Standards`

#### 0.8.3 Frontend Architecture Template Compliance

[[LLM: Frontend repos must follow `front-end-architecture-tmpl.yaml` structure. Read the architecture file and verify section headings.]]

For each Frontend repository's `docs/ui-architecture.md` (or `docs/architecture.md`), verify it contains these **exact section headings**:

- [ ] Section exists: `## Tech Stack` (or `## Frontend Tech Stack` - both acceptable)
- [ ] Section exists: `## Source Tree` or `## Project Structure`
- [ ] Section exists: `## Coding Standards`
- [ ] Section exists: `## Testing Strategy`
- [ ] Section exists: `## Component Standards`
- [ ] Section exists: `## State Management`
- [ ] Section exists: `## API Integration`
- [ ] Section exists: `## Routing`
- [ ] Section exists: `## Styling Guidelines`

**Common Errors to Flag**:
- ❌ `Frontend Developer Standards` → Should be `Coding Standards`
- ❌ `Testing Requirements` → Should be `Testing Strategy`

#### 0.8.4 Mobile Architecture Template Compliance

[[LLM: Mobile repos must follow `mobile-architecture-tmpl.yaml` structure. Read the architecture.md file and verify section headings.]]

For each Mobile repository's `docs/architecture.md`, verify it contains these **exact section headings**:

- [ ] Section exists: `## Tech Stack` (or `## Mobile Tech Stack` - both acceptable)
- [ ] Section exists: `## Source Tree` or `## Project Structure` (CRITICAL - must exist)
- [ ] Section exists: `## Coding Standards`
- [ ] Section exists: `## Testing Strategy`
- [ ] Section exists: `## App Architecture`
- [ ] Section exists: `## Screen Structure`
- [ ] Section exists: `## State Management`
- [ ] Section exists: `## API Integration`
- [ ] Section exists: `## Security`

**Common Errors to Flag**:
- ❌ `Mobile Developer Standards` → Should be `Coding Standards`
- ❌ Missing `Source Tree` section → CRITICAL, must add

#### 0.8.5 Section ID Consistency Across Repos

[[LLM: Verify that core sections use consistent naming across ALL repos for Dev agent compatibility.]]

- [ ] All architecture documents use `Coding Standards` (not `*-Developer Standards`)
- [ ] All architecture documents use `Testing Strategy` (not `Test Strategy` or `Testing Requirements`)
- [ ] All architecture documents have `Source Tree` or `Project Structure` section
- [ ] All architecture documents have `Tech Stack` section (prefix like "Frontend/Mobile/Backend" is acceptable)

**If Validation Fails**:
1. HALT epic sharding process
2. Report specific section naming issues to user
3. Recommend running architecture regeneration with correct templates
4. Wait for user to fix before proceeding

## 1. PROJECT SETUP & INITIALIZATION

[[LLM: Project setup is the foundation. For greenfield, ensure clean start. For brownfield, ensure safe integration with existing system. Verify setup matches project type.]]

### 1.1 Project Scaffolding [[GREENFIELD ONLY]]

- [ ] Epic 1 includes explicit steps for project creation/initialization
- [ ] If using a starter template, steps for cloning/setup are included
- [ ] If building from scratch, all necessary scaffolding steps are defined
- [ ] Initial README or documentation setup is included
- [ ] Repository setup and initial commit processes are defined

### 1.2 Existing System Integration [[BROWNFIELD ONLY]]

- [ ] Existing project analysis has been completed and documented
- [ ] Integration points with current system are identified
- [ ] Development environment preserves existing functionality
- [ ] Local testing approach validated for existing features
- [ ] Rollback procedures defined for each integration point

### 1.3 Development Environment

- [ ] Local development environment setup is clearly defined
- [ ] Required tools and versions are specified
- [ ] Steps for installing dependencies are included
- [ ] Configuration files are addressed appropriately
- [ ] Development server setup is included

### 1.4 Core Dependencies

- [ ] All critical packages/libraries are installed early
- [ ] Package management is properly addressed
- [ ] Version specifications are appropriately defined
- [ ] Dependency conflicts or special requirements are noted
- [ ] [[BROWNFIELD ONLY]] Version compatibility with existing stack verified

## 2. INFRASTRUCTURE & DEPLOYMENT

[[LLM: Infrastructure must exist before use. For brownfield, must integrate with existing infrastructure without breaking it.]]

### 2.1 Database & Data Store Setup

- [ ] Database selection/setup occurs before any operations
- [ ] Schema definitions are created before data operations
- [ ] Migration strategies are defined if applicable
- [ ] Seed data or initial data setup is included if needed
- [ ] [[BROWNFIELD ONLY]] Database migration risks identified and mitigated
- [ ] [[BROWNFIELD ONLY]] Backward compatibility ensured

### 2.2 API & Service Configuration

- [ ] API frameworks are set up before implementing endpoints
- [ ] Service architecture is established before implementing services
- [ ] Authentication framework is set up before protected routes
- [ ] Middleware and common utilities are created before use
- [ ] [[BROWNFIELD ONLY]] API compatibility with existing system maintained
- [ ] [[BROWNFIELD ONLY]] Integration with existing authentication preserved

### 2.3 Deployment Pipeline

- [ ] CI/CD pipeline is established before deployment actions
- [ ] Infrastructure as Code (IaC) is set up before use
- [ ] Environment configurations are defined early
- [ ] Deployment strategies are defined before implementation
- [ ] [[BROWNFIELD ONLY]] Deployment minimizes downtime
- [ ] [[BROWNFIELD ONLY]] Blue-green or canary deployment implemented

### 2.4 Testing Infrastructure

- [ ] Testing frameworks are installed before writing tests
- [ ] Test environment setup precedes test implementation
- [ ] Mock services or data are defined before testing
- [ ] [[BROWNFIELD ONLY]] Regression testing covers existing functionality
- [ ] [[BROWNFIELD ONLY]] Integration testing validates new-to-existing connections

## 3. EXTERNAL DEPENDENCIES & INTEGRATIONS

[[LLM: External dependencies often block progress. For brownfield, ensure new dependencies don't conflict with existing ones.]]

### 3.1 Third-Party Services

- [ ] Account creation steps are identified for required services
- [ ] API key acquisition processes are defined
- [ ] Steps for securely storing credentials are included
- [ ] Fallback or offline development options are considered
- [ ] [[BROWNFIELD ONLY]] Compatibility with existing services verified
- [ ] [[BROWNFIELD ONLY]] Impact on existing integrations assessed

### 3.2 External APIs

- [ ] Integration points with external APIs are clearly identified
- [ ] Authentication with external services is properly sequenced
- [ ] API limits or constraints are acknowledged
- [ ] Backup strategies for API failures are considered
- [ ] [[BROWNFIELD ONLY]] Existing API dependencies maintained

### 3.3 Infrastructure Services

- [ ] Cloud resource provisioning is properly sequenced
- [ ] DNS or domain registration needs are identified
- [ ] Email or messaging service setup is included if needed
- [ ] CDN or static asset hosting setup precedes their use
- [ ] [[BROWNFIELD ONLY]] Existing infrastructure services preserved

## 4. UI/UX CONSIDERATIONS [[UI/UX ONLY]]

[[LLM: Only evaluate this section if the project includes user interface components. Skip entirely for backend-only projects.]]

### 4.1 Design System Setup

- [ ] UI framework and libraries are selected and installed early
- [ ] Design system or component library is established
- [ ] Styling approach (CSS modules, styled-components, etc.) is defined
- [ ] Responsive design strategy is established
- [ ] Accessibility requirements are defined upfront

### 4.2 Frontend Infrastructure

- [ ] Frontend build pipeline is configured before development
- [ ] Asset optimization strategy is defined
- [ ] Frontend testing framework is set up
- [ ] Component development workflow is established
- [ ] [[BROWNFIELD ONLY]] UI consistency with existing system maintained

### 4.3 User Experience Flow

- [ ] User journeys are mapped before implementation
- [ ] Navigation patterns are defined early
- [ ] Error states and loading states are planned
- [ ] Form validation patterns are established
- [ ] [[BROWNFIELD ONLY]] Existing user workflows preserved or migrated

## 5. USER/AGENT RESPONSIBILITY

[[LLM: Clear ownership prevents confusion. Ensure tasks are assigned appropriately based on what only humans can do.]]

### 5.1 User Actions

- [ ] User responsibilities limited to human-only tasks
- [ ] Account creation on external services assigned to users
- [ ] Purchasing or payment actions assigned to users
- [ ] Credential provision appropriately assigned to users

### 5.2 Developer Agent Actions

- [ ] All code-related tasks assigned to developer agents
- [ ] Automated processes identified as agent responsibilities
- [ ] Configuration management properly assigned
- [ ] Testing and validation assigned to appropriate agents

## 6. FEATURE SEQUENCING & DEPENDENCIES

[[LLM: Dependencies create the critical path. For brownfield, ensure new features don't break existing ones.]]

### 6.1 Functional Dependencies

- [ ] Features depending on others are sequenced correctly
- [ ] Shared components are built before their use
- [ ] User flows follow logical progression
- [ ] Authentication features precede protected features
- [ ] [[BROWNFIELD ONLY]] Existing functionality preserved throughout

### 6.2 Technical Dependencies

- [ ] Lower-level services built before higher-level ones
- [ ] Libraries and utilities created before their use
- [ ] Data models defined before operations on them
- [ ] API endpoints defined before client consumption
- [ ] [[BROWNFIELD ONLY]] Integration points tested at each step

### 6.3 Cross-Epic Dependencies

- [ ] Later epics build upon earlier epic functionality
- [ ] No epic requires functionality from later epics
- [ ] Infrastructure from early epics utilized consistently
- [ ] Incremental value delivery maintained
- [ ] [[BROWNFIELD ONLY]] Each epic maintains system integrity

## 7. RISK MANAGEMENT [[BROWNFIELD ONLY]]

[[LLM: This section is CRITICAL for brownfield projects. Think pessimistically about what could break.]]

### 7.1 Breaking Change Risks

- [ ] Risk of breaking existing functionality assessed
- [ ] Database migration risks identified and mitigated
- [ ] API breaking change risks evaluated
- [ ] Performance degradation risks identified
- [ ] Security vulnerability risks evaluated

### 7.2 Rollback Strategy

- [ ] Rollback procedures clearly defined per story
- [ ] Feature flag strategy implemented
- [ ] Backup and recovery procedures updated
- [ ] Monitoring enhanced for new components
- [ ] Rollback triggers and thresholds defined

### 7.3 User Impact Mitigation

- [ ] Existing user workflows analyzed for impact
- [ ] User communication plan developed
- [ ] Training materials updated
- [ ] Support documentation comprehensive
- [ ] Migration path for user data validated

## 8. MVP SCOPE ALIGNMENT

[[LLM: MVP means MINIMUM viable product. For brownfield, ensure enhancements are truly necessary.]]

### 8.1 Core Goals Alignment

- [ ] All core goals from PRD are addressed
- [ ] Features directly support MVP goals
- [ ] No extraneous features beyond MVP scope
- [ ] Critical features prioritized appropriately
- [ ] [[BROWNFIELD ONLY]] Enhancement complexity justified

### 8.2 User Journey Completeness

- [ ] All critical user journeys fully implemented
- [ ] Edge cases and error scenarios addressed
- [ ] User experience considerations included
- [ ] [[UI/UX ONLY]] Accessibility requirements incorporated
- [ ] [[BROWNFIELD ONLY]] Existing workflows preserved or improved

### 8.3 Technical Requirements

- [ ] All technical constraints from PRD addressed
- [ ] Non-functional requirements incorporated
- [ ] Architecture decisions align with constraints
- [ ] Performance considerations addressed
- [ ] [[BROWNFIELD ONLY]] Compatibility requirements met

## 9. DOCUMENTATION & HANDOFF

[[LLM: Good documentation enables smooth development. For brownfield, documentation of integration points is critical.]]

### 9.1 Developer Documentation

- [ ] API documentation created alongside implementation
- [ ] Setup instructions are comprehensive
- [ ] Architecture decisions documented
- [ ] Patterns and conventions documented
- [ ] [[BROWNFIELD ONLY]] Integration points documented in detail

### 9.2 User Documentation

- [ ] User guides or help documentation included if required
- [ ] Error messages and user feedback considered
- [ ] Onboarding flows fully specified
- [ ] [[BROWNFIELD ONLY]] Changes to existing features documented

### 9.3 Knowledge Transfer

- [ ] [[BROWNFIELD ONLY]] Existing system knowledge captured
- [ ] [[BROWNFIELD ONLY]] Integration knowledge documented
- [ ] Code review knowledge sharing planned
- [ ] Deployment knowledge transferred to operations
- [ ] Historical context preserved

## 10. POST-MVP CONSIDERATIONS

[[LLM: Planning for success prevents technical debt. For brownfield, ensure enhancements don't limit future growth.]]

### 10.1 Future Enhancements

- [ ] Clear separation between MVP and future features
- [ ] Architecture supports planned enhancements
- [ ] Technical debt considerations documented
- [ ] Extensibility points identified
- [ ] [[BROWNFIELD ONLY]] Integration patterns reusable

### 10.2 Monitoring & Feedback

- [ ] Analytics or usage tracking included if required
- [ ] User feedback collection considered
- [ ] Monitoring and alerting addressed
- [ ] Performance measurement incorporated
- [ ] [[BROWNFIELD ONLY]] Existing monitoring preserved/enhanced

## VALIDATION SUMMARY

[[LLM: FINAL PO VALIDATION REPORT GENERATION

Generate a comprehensive validation report that adapts to project type:

1. Executive Summary
   - Project type: [Greenfield/Brownfield] with [UI/No UI]
   - Overall readiness (percentage)
   - Go/No-Go recommendation
   - Critical blocking issues count
   - Sections skipped due to project type

2. Project-Specific Analysis

   FOR GREENFIELD:
   - Setup completeness
   - Dependency sequencing
   - MVP scope appropriateness
   - Development timeline feasibility

   FOR BROWNFIELD:
   - Integration risk level (High/Medium/Low)
   - Existing system impact assessment
   - Rollback readiness
   - User disruption potential

3. Risk Assessment
   - Top 5 risks by severity
   - Mitigation recommendations
   - Timeline impact of addressing issues
   - [BROWNFIELD] Specific integration risks

4. MVP Completeness
   - Core features coverage
   - Missing essential functionality
   - Scope creep identified
   - True MVP vs over-engineering

5. Implementation Readiness
   - Developer clarity score (1-10)
   - Ambiguous requirements count
   - Missing technical details
   - [BROWNFIELD] Integration point clarity

6. Recommendations
   - Must-fix before development
   - Should-fix for quality
   - Consider for improvement
   - Post-MVP deferrals

7. [BROWNFIELD ONLY] Integration Confidence
   - Confidence in preserving existing functionality
   - Rollback procedure completeness
   - Monitoring coverage for integration points
   - Support team readiness

After presenting the report, ask if the user wants:

- Detailed analysis of any failed sections
- Specific story reordering suggestions
- Risk mitigation strategies
- [BROWNFIELD] Integration risk deep-dive]]

### Category Statuses

| Category                                | Status | Critical Issues |
| --------------------------------------- | ------ | --------------- |
| 0. PRD Document Format & Structure      | _TBD_  |                 |
| 1. Project Setup & Initialization       | _TBD_  |                 |
| 2. Infrastructure & Deployment          | _TBD_  |                 |
| 3. External Dependencies & Integrations | _TBD_  |                 |
| 4. UI/UX Considerations                 | _TBD_  |                 |
| 5. User/Agent Responsibility            | _TBD_  |                 |
| 6. Feature Sequencing & Dependencies    | _TBD_  |                 |
| 7. Risk Management (Brownfield)         | _TBD_  |                 |
| 8. MVP Scope Alignment                  | _TBD_  |                 |
| 9. Documentation & Handoff              | _TBD_  |                 |
| 10. Post-MVP Considerations             | _TBD_  |                 |

### Critical Deficiencies

(To be populated during validation)

### Recommendations

(To be populated during validation)

### Final Decision

- **APPROVED**: The plan is comprehensive, properly sequenced, and ready for implementation.
- **CONDITIONAL**: The plan requires specific adjustments before proceeding.
- **REJECTED**: The plan requires significant revision to address critical deficiencies.