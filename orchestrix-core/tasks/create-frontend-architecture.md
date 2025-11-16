# Create Frontend Architecture

## Purpose

Generate a **detailed frontend architecture document** for a frontend implementation repository (Web). This document provides implementation-level technical details for frontend development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:
- ✅ Includes component designs, state management patterns, routing setup, and implementation details
- ✅ References and aligns with the system-architecture.md and front-end-spec.md from Product repository
- ✅ Validates that frontend ONLY consumes APIs defined in system-architecture.md
- ✅ Uses `front-end-architecture-tmpl.yaml` template for output format
- ❌ Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

## Prerequisites

**Required Documents**:
- ✅ System Architecture exists at `../product-repo/docs/system-architecture.md`
- ✅ PRD exists at `../product-repo/docs/prd.md` (contains UI/UX Goals if front-end-spec is missing)
- ⚪ Front-End Spec exists at `../product-repo/docs/front-end-spec.md` (optional - use if available, otherwise extract UI/UX from PRD)

**Project Configuration**:
- ✅ Project mode is `multi-repo` with role `frontend` in `core-config.yaml`
- ✅ `multi_repo.product_repo_path` is configured in `core-config.yaml` pointing to Product repository
- ✅ Running in Frontend implementation repository (not Product repo)

**Recommended Environment**:
- 🌐 **Web interface** (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- 💻 IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project mode and role
PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 1 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')
if [ "$PROJECT_MODE" != "multi-repo" ] || [ "$PROJECT_ROLE" != "frontend" ]; then
  echo "❌ ERROR: Project mode is '$PROJECT_MODE' with role '$PROJECT_ROLE', expected mode='multi-repo' role='frontend'"
  echo "This task should run in Frontend implementation repository"
  exit 1
fi

# Check if product repo path is configured
PRODUCT_REPO_PATH_RAW=$(grep -A 3 "multi_repo:" core-config.yaml | grep "product_repo_path:" | awk '{print $2}')
if [ -z "$PRODUCT_REPO_PATH_RAW" ]; then
  echo "❌ ERROR: multi_repo.product_repo_path not configured in core-config.yaml"
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
    echo "❌ ERROR: Product repo not found at: $PRODUCT_REPO_PATH_RAW"
    echo "   Tried to resolve from: $(pwd)"
    echo "   Check if the path is correct and the directory exists"
    exit 1
  fi
fi

echo "📍 Product repo resolved to: $PRODUCT_REPO_PATH"

# Check if system architecture exists
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"
if [ ! -f "$SYSTEM_ARCH" ]; then
  echo "❌ ERROR: System architecture not found at $SYSTEM_ARCH"
  echo ""
  echo "👉 Action: Create system architecture first in Product repository"
  echo "   cd $PRODUCT_REPO_PATH"
  echo "   @architect *create-system-architecture"
  exit 1
fi

echo "✅ Found system architecture: docs/system-architecture.md"

# Check if front-end spec exists (optional)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"
if [ -f "$FRONTEND_SPEC" ]; then
  echo "✅ Found Front-End Spec: docs/front-end-spec.md"
else
  echo "⚪ Front-End Spec not found (OK - will extract UI/UX from PRD)"
fi

echo "✅ Prerequisites validated. Proceeding with frontend architecture generation..."
```

---

## Task Instructions

### Step 1: Load System Architecture Context

Load the system-level architecture as a CONSTRAINT for this detailed architecture.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture
PRODUCT_REPO_PATH=$(grep -A 3 "multi_repo:" core-config.yaml | grep "product_repo_path:" | awk '{print $2}')
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"

echo "📄 Reading system architecture from: $SYSTEM_ARCH"
```

Read and analyze the **complete** system architecture document (not the sharded files).

**Why read the complete file?**
- Even if Product repo has sharded the architecture, the complete `system-architecture.md` file still exists
- Reading the complete file ensures we get the full context in one pass
- Sharded files are for PO/SM story creation, not for implementation architecture generation

**Focus Areas**:
1. **Repository Topology**: Understand this frontend's role in the overall system
2. **API Contracts Summary**: Identify which APIs THIS frontend can consume
3. **Integration Strategy**: Authentication mechanism, data format standards, error handling conventions
4. **Deployment Architecture**: Where and how this frontend deploys
5. **Cross-Cutting Concerns**: Security, performance, observability requirements

**Step 1.2: Extract Frontend-Specific Constraints**

From the system architecture, extract:
- **APIs to Consume**: List of endpoints this frontend can call (CRITICAL)
- **Authentication Requirements**: JWT format, token storage, token refresh strategy
- **Data Format Standards**: JSON structure, date format (ISO 8601), pagination style (offset/cursor)
- **Error Handling Standard**: Error response format, HTTP status codes, display patterns
- **Performance Requirements**: Page load time, Time to Interactive, Core Web Vitals targets
- **Security Requirements**: XSS protection, CSRF protection, secure token storage

**Elicit User Confirmation**:
```
📖 I've loaded the system architecture from Product repository.

**This Frontend Repository's Role**:
- Repository Name: {{frontend_repo_name}}
- Platform: Web
- Primary Responsibility: {{frontend_responsibility}}

**APIs This Frontend Can Consume** (from system-architecture.md):
[List all API categories and endpoints with clear formatting]

**Integration Constraints**:
- Authentication: {{auth_mechanism}} (token storage: {{token_storage}})
- Data Format: {{data_format_standards}}
- Error Handling: {{error_standard}}

**Performance Requirements**:
- Page Load Time: {{load_time_target}}
- Core Web Vitals: {{cwv_targets}}

Does this match your understanding? Ready to proceed with detailed frontend architecture?
```

---

### Step 2: Load UI/UX Requirements and PRD Context

Load UI/UX requirements from Front-End Spec (if available) or PRD's UI Goals section, and functional requirements from PRD.

**Step 2.1: Attempt to Load Front-End Spec (Optional)**

```bash
# Try to read Front-End Spec (optional - gracefully handle if missing)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"

if [ -f "$FRONTEND_SPEC" ]; then
  echo "✅ Found Front-End Spec: docs/front-end-spec.md"
else
  echo "⚪ Front-End Spec not found (OK - will extract UI/UX from PRD)"
fi
```

**IF Front-End Spec exists**, analyze:
- What are the core user flows? (Registration, Login, Product Browsing, Checkout, etc.)
- What screens/pages are needed?
- What's the design system? (colors, typography, spacing, components)
- What are the interaction patterns? (modals, drawers, tabs, infinite scroll)

**IF Front-End Spec is missing**, note that UI/UX will be extracted from PRD in Step 2.2.

**Step 2.2: Load PRD Context (Required)**

```bash
# Read PRD (required)
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"

if [ ! -f "$PRD_PATH" ]; then
  echo "❌ ERROR: PRD not found at $PRD_PATH"
  echo "PRD is required for frontend architecture generation"
  exit 1
fi

echo "✅ Found PRD: docs/prd.md"
```

**Analysis Focus**:
- What are the main features/epics for frontend?
- What are the user stories for this platform (target_platform = frontend)?
- What are the UI-specific non-functional requirements? (accessibility, responsiveness, performance)

**IF Front-End Spec is missing**, also extract UI/UX from PRD's "User Interface Design Goals" section:
- Overall UX Vision - What's the high-level UX approach?
- Key Interaction Paradigms - How should users interact with the application?
- Core Screens and Views - What are the critical screens/pages?
- Accessibility - What accessibility level? (None, WCAG AA, WCAG AAA)
- Branding - Any branding requirements or style guidelines?
- Target Platforms - Which platforms/devices? (Web Responsive, Desktop Only, Mobile Only)

**Step 2.3: Map User Flows to Pages and Components**

Cross-reference UI/UX requirements (from Front-End Spec OR PRD UI Goals) with PRD stories:
- For each user flow, identify required pages/screens
- For each page, identify required components (pages, layouts, shared, feature components)
- For each component, identify state management needs
- For each page, identify API calls needed

**Elicit User Confirmation**:
```
🎨 I've analyzed the {{ui_source}} and PRD.

{{ui_source}} = "Front-End Spec" if exists, else "PRD UI Goals section"

**Core User Flows Identified**:
1. {{flow_1}} → Pages: {{pages_1}}
2. {{flow_2}} → Pages: {{pages_2}}
3. {{flow_3}} → Pages: {{pages_3}}

**Total Pages/Screens**: {{page_count}}
**Estimated Components**: {{component_estimate}}

**Design System**:
- Primary Color: {{primary_color}} (or TBD if not specified)
- UI Framework: {{ui_framework}} (Material-UI, Ant Design, Chakra UI, etc.)
- Accessibility: {{accessibility_level}}

**Note**: {{if_no_frontend_spec_note}}
Example: "Front-End Spec not available - extracted UI/UX vision from PRD. Detailed design system will be refined during implementation."
- Responsive Breakpoints: {{breakpoints}}

Does this match your vision? Ready to design component architecture?
```

---

### Step 3: Validate API Consumption (CRITICAL)

**CRITICAL VALIDATION**: Ensure frontend ONLY calls APIs defined in system-architecture.md.

Based on the pages and components identified in Step 2, list ALL API calls this frontend will make:

**API Consumption Analysis**:
```
⚠️ **API Contract Validation**

I've analyzed the APIs this frontend will call based on identified pages and features:

**Authentication & User APIs**:
- POST /api/auth/login → ✅ Defined in system-architecture.md
- POST /api/auth/register → ✅ Defined in system-architecture.md
- POST /api/auth/refresh → ✅ Defined in system-architecture.md
- GET /api/users/:id → ✅ Defined in system-architecture.md

**Product APIs**:
- GET /api/products → ✅ Defined in system-architecture.md
- GET /api/products/:id → ✅ Defined in system-architecture.md

**Order APIs**:
- POST /api/orders → ✅ Defined in system-architecture.md
- GET /api/orders → ✅ Defined in system-architecture.md

**Shopping Cart APIs**:
- GET /api/cart → ❌ NOT in system-architecture.md
- POST /api/cart/items → ❌ NOT in system-architecture.md

**❌ VALIDATION FAILED**: Frontend needs 2 Cart APIs not defined in system-architecture.md

**Action Required**:
1. Option A: Update system-architecture.md to include Cart APIs (and ensure backend implements them)
2. Option B: Remove Cart feature from frontend or implement it client-side only

Please choose how to proceed before I continue with architecture design.
```

**IF all APIs validated successfully**:
```
✅ **API Contract Validation PASSED**

All {{api_count}} APIs this frontend will call are defined in system-architecture.md.
No undefined API calls detected. Proceeding with architecture generation...
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding.

---

### Step 4: Design Component Architecture, State Management, and Routing

**Step 4.1: Define Component Categories**

Based on pages identified in Step 2, organize components into categories:
- **Page Components**: One per route (LoginPage, HomePage, ProductListPage, etc.)
- **Layout Components**: Reusable layouts (AppLayout, AuthLayout, etc.)
- **Shared Components**: Reusable UI elements (Button, Input, Modal, Card, etc.)
- **Feature Components**: Domain-specific (ProductCard, CartItem, OrderSummary, etc.)

**Step 4.2: Define State Management Strategy**

Identify state types:
- **Global State**: Authentication, shopping cart, UI state (theme, language)
- **Server State**: Products, orders, user profile (data from backend)
- **Local State**: Form inputs, modal state, loading states

Choose state management solution based on tech stack:
- React: Context API + useReducer, Redux Toolkit, Zustand, or React Query
- Vue: Pinia, Composition API
- Ask user for preference if multiple valid options exist

**Step 4.3: Define Routing Structure**

Map pages to routes with:
- Path (e.g., `/`, `/login`, `/products`, `/products/:id`)
- Component name
- Protected (yes/no)
- Layout (AppLayout, AuthLayout)

Define protected route strategy based on framework conventions.

**Elicit User Confirmation**:
```
🧩 **Proposed Frontend Architecture Summary**:

**Pages**: {{page_count}} (LoginPage, HomePage, ProductListPage, etc.)
**Layouts**: {{layout_count}} (AppLayout, AuthLayout)
**Shared Components**: {{shared_count}} (Button, Input, Modal, Card, etc.)
**Feature Components**: {{feature_count}} (ProductCard, CartItem, etc.)

**State Management**: {{state_solution}} ({{rationale}})
**Routing**: {{route_count}} routes ({{protected_count}} protected)

**API Integration**:
- API Services: {{service_count}} (userService, productService, orderService, etc.)
- Authentication: {{auth_strategy}} (token refresh, interceptors)

Does this architecture structure make sense for your frontend?
```

---

### Step 5: Generate Frontend Architecture Document

**Output Document**:
Use template: `orchestrix-core/templates/front-end-architecture-tmpl.yaml`

**Prepare Output**:
```bash
# Ensure docs directory exists
mkdir -p docs
OUTPUT_PATH="docs/ui-architecture.md"  # or docs/architecture.md
```

**Fill Template Sections** with information collected in Steps 1-4:
- System Architecture Context: Constraints from system-architecture.md (Step 1)
- Tech Stack: Framework, UI library, state management, routing, styling, testing tools
- Source Tree: Project directory structure following framework conventions
- Component Standards: Component template and naming conventions
- State Management: Store structure and state management patterns
- API Integration: Service templates and API client configuration (with auth interceptors)
- Routing: Route configuration with protected routes
- Styling Guidelines: Styling approach and global theme variables
- Testing Strategy: Component test templates and best practices
- Environment Configuration: Required environment variables
- Coding Standards: Critical coding rules and quick reference

---

### Step 6: Validate Against System Architecture

Perform final cross-validation to ensure alignment.

**Validation Checklist**:
```
📋 **Final Validation Checklist**:

**API Contract Alignment**:
- [ ] All API calls consume ONLY APIs defined in system-architecture.md
- [ ] No undefined API calls
- [ ] API client configured with correct base URL from system-architecture.md

**Authentication Alignment**:
- [ ] Token storage mechanism matches system-architecture.md (localStorage/cookies)
- [ ] Token refresh strategy matches system-architecture.md
- [ ] Auth interceptors/middleware configured correctly

**Data Format Alignment**:
- [ ] JSON parsing expects structure from system-architecture.md
- [ ] Date handling uses format from system-architecture.md (ISO 8601)
- [ ] Pagination expects style from system-architecture.md (offset/cursor)

**Error Handling Alignment**:
- [ ] Error display matches system-architecture.md error format
- [ ] HTTP status codes handled per system-architecture.md

**Performance Requirements**:
- [ ] Page load time target documented
- [ ] Time to Interactive (TTI) target documented
- [ ] Core Web Vitals targets documented

**Security Implementation**:
- [ ] XSS protection implemented
- [ ] CSRF protection implemented (if required)
- [ ] Token storage is secure per system-architecture.md

**Deployment Alignment**:
- [ ] Deployment platform matches system-architecture.md
- [ ] Environment variables configured correctly
- [ ] CI/CD strategy documented

All checks passed? ✅
```

---

### Step 7: Output Handoff

Present the completed frontend architecture document and provide next steps.

**Success Output**:
```
✅ FRONTEND ARCHITECTURE COMPLETE

📄 Generated Document: docs/ui-architecture.md (or docs/architecture.md)

📦 Frontend Repository: {{frontend_repo_name}}
🖥️ Platform: Web
📚 Framework: {{framework}} {{version}}

🧩 Component Architecture:
  - {{page_count}} Pages
  - {{shared_component_count}} Shared Components
  - {{feature_component_count}} Feature Components
  - {{layout_count}} Layouts

🔄 State Management:
  - Solution: {{state_solution}}
  - Global Stores: {{store_count}}
  - Custom Hooks: {{hook_count}}

🛤️ Routing:
  - Total Routes: {{route_count}}
  - Protected Routes: {{protected_count}}
  - Public Routes: {{public_count}}

🔌 API Integration:
  - API Services: {{api_service_count}}
  - Endpoints Consumed: {{endpoint_count}} (all from system-architecture.md ✅)
  - Auth Strategy: {{auth_strategy}}

🎨 UI/UX Implementation:
  - Design System: {{design_system}}
  - Styling Solution: {{styling_solution}}
  - Responsive: {{breakpoint_count}} breakpoints

---

📋 **NEXT STEPS**:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate component structure matches your vision

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all user flows are covered

3. **Dev: Begin Frontend Implementation**

   **Setup Project**:
   ```bash
   # Initialize project (adjust based on your framework choice)
   npx create-react-app {{project_name}} --template typescript
   # or
   npx create-next-app {{project_name}} --typescript
   # or
   npm create vue@latest {{project_name}} -- --typescript

   # Install dependencies from architecture doc
   npm install {{dependencies}}
   npm install --save-dev {{dev_dependencies}}
   ```

   **Implementation Order** (follow Story priorities from PRD):
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
   - Reference this architecture.md in each Story
   - Sequence stories by dependencies

5. **QA: Test Frontend**
   - Verify all user flows work end-to-end
   - Test responsive design across devices
   - Validate accessibility (WCAG AA)
   - Performance testing (Lighthouse, Core Web Vitals)

---

🎉 **Frontend architecture is now the technical blueprint for UI development!**

All frontend development will reference this document to ensure consistency with system architecture and design specifications.
```

---

## Notes for Agent Execution

- **Context Management**: This task requires significant context (system-architecture.md + PRD + optional front-end-spec.md + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All API calls MUST be defined in system-architecture.md. If frontend needs an API not in system-arch, either add it to system-arch or remove it from frontend-arch.

- **UI/UX Source Flexibility**:
  - **IF Front-End Spec exists**: UI components, design system, user flows MUST match front-end-spec.md
  - **IF Front-End Spec is missing**: Extract UI/UX requirements from PRD's "User Interface Design Goals" section. This is common for brownfield projects or backend-first development.

- **Template Reference**: This task uses `front-end-architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **Iterative Refinement**: Expect 2-4 rounds of user feedback, especially for:
  - Component hierarchy (page breakdown, reusable components)
  - State management strategy (global vs local state)
  - Routing structure (protected routes, navigation patterns)

- **API Validation is Critical**: Step 3 is the most important validation. If it fails, STOP and wait for user to resolve before proceeding.

## Success Criteria

- ✅ Frontend architecture document exists at `docs/ui-architecture.md` or `docs/architecture.md`
- ✅ All API calls reference APIs from system-architecture.md (Step 3 validation passed)
- ✅ Component architecture covers all pages from Front-End Spec (if available) or PRD UI Goals
- ✅ State management strategy is clear and appropriate for chosen framework
- ✅ Routing structure covers all user flows
- ✅ API integration pattern is defined with error handling and token refresh
- ✅ Design system implementation matches Front-End Spec
- ✅ Responsive design strategy is documented
- ✅ Testing strategy is comprehensive (unit, integration, E2E)
- ✅ Project folder structure follows framework conventions
- ✅ User has approved the document
- ✅ Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:
```
❌ ERROR: System architecture not found

Frontend architecture requires system-architecture.md from Product repository.

Please ensure:
1. Product repository path is correct in core-config.yaml
2. System architecture exists at ../product-repo/docs/architecture/system-architecture.md

If system architecture doesn't exist:
cd ../my-project-product
@architect *create-system-architecture

After system architecture is ready, return here and run:
@architect *create-frontend-architecture
```

**If API contracts are missing in system-architecture.md**:
```
⚠️ WARNING: System architecture lacks API Contracts Summary

Frontend needs to know which APIs are available to consume.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If frontend tries to call undefined APIs** (Step 3 validation failure):
```
❌ ERROR: Frontend calls APIs not defined in system-architecture.md

The following APIs are called by frontend but NOT in system-architecture.md:
- {{undefined_api_1}}
- {{undefined_api_2}}

**Action Required**:
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
| 2.1.0 | 2025-01-15 | REFACTOR: Simplified Step 5 template section description, reduced by 35 lines | Orchestrix Team |
| 2.0.0 | 2025-01-14 | REFACTOR: Reduced from 902 to 250 lines, removed template duplication, focused on procedures only | Orchestrix Team |
| 1.0.0 | 2025-01-14 | Initial creation for Phase 2 | Orchestrix Team |
