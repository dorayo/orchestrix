# Create Frontend Architecture

## Purpose

Generate a **detailed frontend architecture document** for a frontend implementation repository (Web). This document provides implementation-level technical details for frontend development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:
- Includes component designs, state management patterns, routing setup, and implementation details
- References and aligns with the system-architecture.md and front-end-spec.md from Product repository
- Validates that frontend ONLY consumes APIs defined in system-architecture.md
- Uses `front-end-architecture-tmpl.yaml` template for output format
- Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

**Workflow Mode**:
- **Default**: Draft-first. Generate complete architecture in one pass, then review decisions.
- **`--interactive`**: Step-by-step with confirmation at each phase (legacy behavior).

## Prerequisites

**Required Documents**:
- System Architecture exists at `../product-repo/docs/system-architecture.md`
- PRD exists at `../product-repo/docs/prd.md` (contains UI/UX Goals if front-end-spec is missing)
- Front-End Spec exists at `../product-repo/docs/front-end-spec.md` (optional - use if available, otherwise extract UI/UX from PRD)

**Project Configuration**:
- Project mode is `multi-repo` with role `frontend` in `core-config.yaml`
- `multi_repo.product_repo_path` is configured in `core-config.yaml` pointing to Product repository
- Running in Frontend implementation repository (not Product repo)

**Recommended Environment**:
- **Web interface** (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project mode and role
PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 1 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')
if [ "$PROJECT_MODE" != "multi-repo" ] || [ "$PROJECT_ROLE" != "frontend" ]; then
  echo "ERROR: Project mode is '$PROJECT_MODE' with role '$PROJECT_ROLE', expected mode='multi-repo' role='frontend'"
  echo "This task should run in Frontend implementation repository"
  exit 1
fi

# Check if product repo path is configured
PRODUCT_REPO_PATH_RAW=$(grep -A 3 "multi_repo:" core-config.yaml | grep "product_repo_path:" | awk '{print $2}')
if [ -z "$PRODUCT_REPO_PATH_RAW" ]; then
  echo "ERROR: multi_repo.product_repo_path not configured in core-config.yaml"
  echo "Add this to core-config.yaml:"
  echo "project:"
  echo "  mode: multi-repo"
  echo "  multi_repo:"
  echo "    role: frontend"
  echo "    product_repo_path: ../my-project-product  # Adjust path to your Product repo"
  exit 1
fi

# Resolve relative path to absolute path
if [[ "$PRODUCT_REPO_PATH_RAW" = /* ]]; then
  # Already absolute path
  PRODUCT_REPO_PATH="$PRODUCT_REPO_PATH_RAW"
else
  # Relative path - resolve from current directory
  PRODUCT_REPO_PATH=$(cd "$PRODUCT_REPO_PATH_RAW" 2>/dev/null && pwd)
  if [ $? -ne 0 ] || [ -z "$PRODUCT_REPO_PATH" ]; then
    echo "ERROR: Product repo not found at: $PRODUCT_REPO_PATH_RAW"
    echo "   Tried to resolve from: $(pwd)"
    echo "   Check if the path is correct and the directory exists"
    exit 1
  fi
fi

echo "Product repo resolved to: $PRODUCT_REPO_PATH"

# Check if system architecture exists
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"
if [ ! -f "$SYSTEM_ARCH" ]; then
  echo "ERROR: System architecture not found at $SYSTEM_ARCH"
  echo ""
  echo "Action: Create system architecture first in Product repository"
  echo "   cd $PRODUCT_REPO_PATH"
  echo "   @architect *create-system-architecture"
  exit 1
fi

echo "Found system architecture: docs/system-architecture.md"

# Check if front-end spec exists (optional)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"
if [ -f "$FRONTEND_SPEC" ]; then
  echo "Found Front-End Spec: docs/front-end-spec.md"
else
  echo "Front-End Spec not found (OK - will extract UI/UX from PRD)"
fi

echo "Prerequisites validated. Proceeding with frontend architecture generation..."
```

---

## Task Instructions

### Step 1: Load Context & Validate

Load all source documents in a single pass. No user interaction needed here.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture
PRODUCT_REPO_PATH=$(grep -A 3 "multi_repo:" core-config.yaml | grep "product_repo_path:" | awk '{print $2}')
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"

echo "Reading system architecture from: $SYSTEM_ARCH"
```

Read and analyze the **complete** system architecture document (not the sharded files).

**Why read the complete file?**
- Even if Product repo has sharded the architecture, the complete `system-architecture.md` file still exists
- Reading the complete file ensures we get the full context in one pass
- Sharded files are for PO/SM story creation, not for implementation architecture generation

**Extract from system architecture**:
1. **Repository Topology**: This frontend's role in the overall system
2. **APIs to Consume**: List of endpoints this frontend can call (CRITICAL - used in Step 3)
3. **Authentication Requirements**: JWT format, token storage, token refresh strategy
4. **Data Format Standards**: JSON structure, date format (ISO 8601), pagination style (offset/cursor)
5. **Error Handling Standard**: Error response format, HTTP status codes, display patterns
6. **Performance Requirements**: Page load time, Time to Interactive, Core Web Vitals targets
7. **Security Requirements**: XSS protection, CSRF protection, secure token storage
8. **Deployment Architecture**: Where and how this frontend deploys

**Step 1.2: Load UI/UX Requirements**

```bash
# Try to read Front-End Spec (optional)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"

if [ -f "$FRONTEND_SPEC" ]; then
  echo "Found Front-End Spec: docs/front-end-spec.md"
else
  echo "Front-End Spec not found (OK - will extract UI/UX from PRD)"
fi
```

**IF Front-End Spec exists**, analyze:
- Core user flows (Registration, Login, Product Browsing, Checkout, etc.)
- Screens/pages needed
- Design system (colors, typography, spacing, components)
- Interaction patterns (modals, drawers, tabs, infinite scroll)

**IF Front-End Spec is missing**, extract UI/UX from PRD's "User Interface Design Goals" section:
- Overall UX Vision
- Key Interaction Paradigms
- Core Screens and Views
- Accessibility level (None, WCAG AA, WCAG AAA)
- Branding requirements
- Target Platforms (Web Responsive, Desktop Only, Mobile Only)

**Step 1.3: Load PRD Context**

```bash
# Read PRD (required)
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"

if [ ! -f "$PRD_PATH" ]; then
  echo "ERROR: PRD not found at $PRD_PATH"
  echo "PRD is required for frontend architecture generation"
  exit 1
fi

echo "Found PRD: docs/prd.md"
```

**Analysis Focus**:
- Main features/epics for frontend
- User stories where target_platform = frontend
- UI-specific non-functional requirements (accessibility, responsiveness, performance)

**Step 1.4: Map User Flows to Pages and Components (Internal)**

Cross-reference UI/UX requirements with PRD stories:
- For each user flow, identify required pages/screens
- For each page, identify required components (pages, layouts, shared, feature components)
- For each component, identify state management needs
- For each page, identify API calls needed

> **No user interaction at this step.** All context is loaded silently. Proceed directly to Step 2.

---

### Step 2: Upfront Questions

Present a single consolidated list of questions. Wait once for all answers before proceeding.

**Present to User**:
```
I've loaded the system architecture, PRD, and {{ui_source}} from the Product repository.

Before generating the frontend architecture, I need to confirm a few preferences:

1. **Frontend Framework & Version**
   Detected from system-architecture.md: {{detected_framework}}
   Confirm or override: (e.g., React 18, Next.js 14, Vue 3, Nuxt 3, Angular 17)

2. **State Management Preference**
   Options for {{detected_framework}}:
   {{framework_specific_options}}
   (e.g., React: Context API / Redux Toolkit / Zustand / Jotai;
    Vue: Pinia / Vuex;
    Angular: NgRx / Signals)

3. **Server State / Data Fetching**
   Recommendation: {{recommendation_based_on_framework}}
   (e.g., TanStack Query, SWR, Apollo Client, built-in fetch)

4. **UI Component Library Preference**
   (e.g., Material UI, Ant Design, Chakra UI, shadcn/ui, Headless UI, custom, none)

5. **Styling Approach**
   (e.g., CSS Modules, Tailwind CSS, Styled Components, Emotion, vanilla CSS)

6. **Any routing or component library preferences?**
   Default: {{framework_default_router}}
   Other preferences: (e.g., file-based routing, code splitting strategy)

7. **Additional constraints or preferences?**
   (e.g., monorepo structure, micro-frontend, specific testing framework, CI/CD platform)

Please reply with your answers (numbers or inline).
```

> **`--interactive` mode**: If `--interactive` flag is set, also present the full context summary from Step 1 (repository role, extracted API list, integration constraints, performance requirements) and wait for confirmation before proceeding. In draft-first mode, this summary is included in the generated document and reviewed at Step 5.

**Wait for user response. Do NOT proceed until answers are received.**

---

### Step 3: Validate API Consumption (CRITICAL HARD STOP)

**CRITICAL VALIDATION**: Ensure frontend ONLY calls APIs defined in system-architecture.md.

Based on the pages and components identified in Step 1.4 and confirmed preferences from Step 2, list ALL API calls this frontend will make.

**API Consumption Analysis**:

For each API category (Authentication, Users, Products, Orders, etc.):
- List every endpoint the frontend needs to call
- Mark each as DEFINED or NOT DEFINED in system-architecture.md

**IF all APIs validated successfully**:
```
API Contract Validation PASSED

All {{api_count}} APIs this frontend will call are defined in system-architecture.md.
No undefined API calls detected. Proceeding with architecture generation...
```

**IF validation fails**:
```
API Contract Validation FAILED

Frontend needs {{count}} APIs not defined in system-architecture.md:
{{list_of_undefined_apis}}

Action Required:
1. Option A: Update system-architecture.md to include these APIs (and ensure backend implements them)
2. Option B: Remove these features from frontend or implement them client-side only

Please choose how to proceed before I continue with architecture design.
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding. Do NOT generate the architecture document with undefined APIs.

---

### Step 4: Generate Complete Architecture Document

Generate the entire frontend architecture in a single pass. No intermediate confirmations.

**Output Document**:
Use template: `{root}/templates/front-end-architecture-tmpl.yaml`

**Prepare Output**:
```bash
# Ensure docs directory exists
mkdir -p docs
OUTPUT_PATH="docs/ui-architecture.md"  # or docs/architecture.md
```

**Fill ALL template sections using information from Steps 1-3**:

1. **System Architecture Context**: Constraints from system-architecture.md
   - Repository role and responsibility
   - API contracts this frontend consumes (full list with methods/paths)
   - Authentication mechanism and token strategy
   - Data format standards (JSON structure, date format, pagination)
   - Error handling conventions
   - Performance requirements and targets

2. **Tech Stack**: Framework, UI library, state management, data fetching, routing, styling, testing tools (from Step 2 answers)

3. **Source Tree**: Project directory structure following framework conventions
   - Pages/routes directory
   - Components directory (shared, feature, layout)
   - State management directory (stores, slices, hooks)
   - API services directory
   - Styles/theme directory
   - Test directory structure

4. **Component Architecture**:
   - **Page Components**: One per route (LoginPage, HomePage, ProductListPage, etc.)
   - **Layout Components**: Reusable layouts (AppLayout, AuthLayout, etc.)
   - **Shared Components**: Reusable UI elements (Button, Input, Modal, Card, etc.)
   - **Feature Components**: Domain-specific (ProductCard, CartItem, OrderSummary, etc.)
   - Component naming conventions and template patterns

5. **State Management Strategy**:
   - **Global State**: Authentication, cart, UI state (theme, language)
   - **Server State**: Products, orders, user profile (data from backend) - managed by data fetching library
   - **Local State**: Form inputs, modal state, loading states
   - Store structure and patterns

6. **Routing Structure**:
   - Route-to-component mapping with paths
   - Protected vs public routes
   - Layout assignments per route
   - Protected route strategy (guards, middleware, HOC)

7. **API Integration Layer**:
   - API client configuration (base URL, interceptors, auth headers)
   - Service modules per domain (userService, productService, etc.)
   - Token refresh and retry logic
   - Error transformation and display patterns

8. **Styling Guidelines**: Styling approach, global theme variables, responsive breakpoints

9. **Testing Strategy**: Component test templates, testing library choices, coverage targets

10. **Environment Configuration**: Required environment variables

11. **Coding Standards**: Critical coding rules and quick reference

**Track all decisions made during generation** (used in Step 5).

> **`--interactive` mode**: After generating each major section (Component Architecture, State Management, Routing, API Integration), present it and wait for user confirmation before proceeding to the next section.

---

### Step 5: Decision Review

Present all architecture decisions made during generation, categorized by confidence level.

**Present to User**:
```
ARCHITECTURE DECISIONS REVIEW

The frontend architecture document has been generated at {{output_path}}.
Here are the key decisions made, categorized for your review:

--- NEEDS CONFIRMATION (please approve or override) ---

These decisions have significant impact and multiple valid alternatives:

  [1] {{decision_description}}
      Chose: {{chosen_option}}
      Reasoning: {{why}}
      Alternatives: {{alternatives}}

  [2] ...

--- SUGGEST REVIEW (reasonable defaults, worth verifying) ---

These follow best practices but depend on project-specific preferences:

  [3] {{decision_description}}
      Chose: {{chosen_option}}
      Reasoning: {{why}}

  [4] ...

--- STANDARD PRACTICE (no action needed unless you disagree) ---

These follow established conventions for {{framework}}:

  [5] {{decision_description}} -> {{chosen_option}}
  [6] {{decision_description}} -> {{chosen_option}}
  ...

Please review the items above. Reply with any changes needed
(e.g., "Change #1 to use Zustand instead", "Approve all").
I will update the architecture document accordingly.
```

**Decision Categories**:

| Category | Criteria | Examples |
|----------|----------|---------|
| NEEDS CONFIRMATION | Multiple valid options with different tradeoffs; high impact on codebase | State management library, component library choice, routing strategy |
| SUGGEST REVIEW | Reasonable default chosen but project context may differ | Directory structure, naming conventions, testing library |
| STANDARD PRACTICE | Industry standard for the chosen framework; changing would be unusual | File extensions, import patterns, build tool defaults |

**After user responds**:
- Apply requested changes to the architecture document
- If no changes requested ("approve all"), proceed to Step 6

---

### Step 6: Validate, Finalize & Handoff

**Step 6.1: Final Cross-Validation**

Perform final validation to ensure alignment with system architecture.

**Validation Checklist**:
```
Final Validation Checklist:

API Contract Alignment:
- [ ] All API calls consume ONLY APIs defined in system-architecture.md
- [ ] No undefined API calls
- [ ] API client configured with correct base URL from system-architecture.md

Authentication Alignment:
- [ ] Token storage mechanism matches system-architecture.md (localStorage/cookies)
- [ ] Token refresh strategy matches system-architecture.md
- [ ] Auth interceptors/middleware configured correctly

Data Format Alignment:
- [ ] JSON parsing expects structure from system-architecture.md
- [ ] Date handling uses format from system-architecture.md (ISO 8601)
- [ ] Pagination expects style from system-architecture.md (offset/cursor)

Error Handling Alignment:
- [ ] Error display matches system-architecture.md error format
- [ ] HTTP status codes handled per system-architecture.md

Performance Requirements:
- [ ] Page load time target documented
- [ ] Time to Interactive (TTI) target documented
- [ ] Core Web Vitals targets documented

Security Implementation:
- [ ] XSS protection implemented
- [ ] CSRF protection implemented (if required)
- [ ] Token storage is secure per system-architecture.md

Deployment Alignment:
- [ ] Deployment platform matches system-architecture.md
- [ ] Environment variables configured correctly
- [ ] CI/CD strategy documented

All checks passed?
```

**Step 6.2: Success Output & Handoff**

```
FRONTEND ARCHITECTURE COMPLETE

Generated Document: {{output_path}}

Frontend Repository: {{frontend_repo_name}}
Platform: Web
Framework: {{framework}} {{version}}

Component Architecture:
  - {{page_count}} Pages
  - {{shared_component_count}} Shared Components
  - {{feature_component_count}} Feature Components
  - {{layout_count}} Layouts

State Management:
  - Solution: {{state_solution}}
  - Global Stores: {{store_count}}
  - Custom Hooks: {{hook_count}}

Routing:
  - Total Routes: {{route_count}}
  - Protected Routes: {{protected_count}}
  - Public Routes: {{public_count}}

API Integration:
  - API Services: {{api_service_count}}
  - Endpoints Consumed: {{endpoint_count}} (all from system-architecture.md)
  - Auth Strategy: {{auth_strategy}}

UI/UX Implementation:
  - Design System: {{design_system}}
  - Styling Solution: {{styling_solution}}
  - Responsive: {{breakpoint_count}} breakpoints

---

NEXT STEPS:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate component structure matches your vision

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all user flows are covered

3. **Dev: Begin Frontend Implementation**

   Setup Project:
   # Initialize project (adjust based on your framework choice)
   {{framework_init_command}}

   # Install dependencies from architecture doc
   npm install {{dependencies}}
   npm install --save-dev {{dev_dependencies}}

   Implementation Order (follow Story priorities from PRD):
   1. Set up project structure and configuration
   2. Implement design system and shared components
   3. Set up routing and layouts
   4. Implement authentication pages (login, register)
   5. Implement core pages per user flows
   6. Add state management and API integration
   7. Write unit and integration tests
   8. Configure CI/CD pipeline

4. **SM: Create Frontend Stories**
   - Filter PRD stories where target_platform = frontend
   - Reference this architecture document in each Story
   - Sequence stories by dependencies

5. **QA: Test Frontend**
   - Verify all user flows work end-to-end
   - Test responsive design across devices
   - Validate accessibility (WCAG AA)
   - Performance testing (Lighthouse, Core Web Vitals)

---

Frontend architecture is now the technical blueprint for UI development.
All frontend development will reference this document to ensure consistency
with system architecture and design specifications.

🎯 HANDOFF TO po: *shard
```

---

## Notes for Agent Execution

- **Draft-First by Default**: Generate the complete architecture in one pass (Step 4), then present decisions for review (Step 5). This minimizes back-and-forth while still giving the user control over key decisions.

- **`--interactive` Flag**: When `--interactive` is passed, revert to step-by-step confirmation behavior:
  - After Step 1: Present full context summary (repo role, APIs, constraints) and wait for confirmation
  - After Step 1.4: Present user flow / page / component mapping and wait for confirmation
  - During Step 4: Present each major section and wait for confirmation before proceeding
  - Skip Step 5 (decisions were confirmed inline)

- **Context Management**: This task requires significant context (system-architecture.md + PRD + optional front-end-spec.md + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All API calls MUST be defined in system-architecture.md. If frontend needs an API not in system-arch, either add it to system-arch or remove it from frontend-arch.

- **UI/UX Source Flexibility**:
  - **IF Front-End Spec exists**: UI components, design system, user flows MUST match front-end-spec.md
  - **IF Front-End Spec is missing**: Extract UI/UX requirements from PRD's "User Interface Design Goals" section. This is common for brownfield projects or backend-first development.

- **Template Reference**: This task uses `front-end-architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **API Validation is Critical**: Step 3 is the only hard stop in draft-first mode. If it fails, STOP and wait for user to resolve before proceeding.

## Success Criteria

- Frontend architecture document exists at `docs/ui-architecture.md` or `docs/architecture.md`
- All API calls reference APIs from system-architecture.md (Step 3 validation passed)
- Component architecture covers all pages from Front-End Spec (if available) or PRD UI Goals
- State management strategy is clear and appropriate for chosen framework
- Routing structure covers all user flows
- API integration pattern is defined with error handling and token refresh
- Design system implementation matches Front-End Spec (if available)
- Responsive design strategy is documented
- Testing strategy is comprehensive (unit, integration, E2E)
- Project folder structure follows framework conventions
- Key decisions are categorized and reviewed by user (Step 5)
- Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:
```
ERROR: System architecture not found

Frontend architecture requires system-architecture.md from Product repository.

Please ensure:
1. Product repository path is correct in core-config.yaml
2. System architecture exists at ../product-repo/docs/system-architecture.md

If system architecture doesn't exist:
cd ../my-project-product
@architect *create-system-architecture

After system architecture is ready, return here and run:
@architect *create-frontend-architecture
```

**If API contracts are missing in system-architecture.md**:
```
WARNING: System architecture lacks API Contracts Summary

Frontend needs to know which APIs are available to consume.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If frontend tries to call undefined APIs** (Step 3 validation failure):
```
ERROR: Frontend calls APIs not defined in system-architecture.md

The following APIs are called by frontend but NOT in system-architecture.md:
- {{undefined_api_1}}
- {{undefined_api_2}}

Action Required:
1. If these APIs are necessary: Update system-architecture.md to include them (and ensure backend implements them)
2. If these APIs are not necessary: Remove them from frontend architecture

All frontend API calls MUST be pre-approved in system-architecture.md to ensure frontend-backend alignment.
```

## Related Tasks

- **Prerequisites**: `create-system-architecture.md` (Product repo)
- **Optional Prerequisites**: `ux-create-front-end-spec.md` (Product repo - recommended but not required)
- **Parallel**: `create-backend-architecture.md`, `create-mobile-architecture.md`
- **Next Steps**: `sm-create-next-story.md` (Story creation for frontend)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 3.0.0 | 2025-01-29 | REFACTOR: Draft-first workflow, consolidated upfront questions, decision review step, --interactive flag for backward compat | Orchestrix Team |
| 2.1.0 | 2025-01-15 | REFACTOR: Simplified Step 5 template section description, reduced by 35 lines | Orchestrix Team |
| 2.0.0 | 2025-01-14 | REFACTOR: Reduced from 902 to 250 lines, removed template duplication, focused on procedures only | Orchestrix Team |
| 1.0.0 | 2025-01-14 | Initial creation for Phase 2 | Orchestrix Team |
