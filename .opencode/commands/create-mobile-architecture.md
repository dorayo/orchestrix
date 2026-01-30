---
description: "Create Mobile Architecture"
---

When this command is used, execute the following task:

# Create Mobile Architecture

## Purpose

Generate a **detailed mobile architecture document** for a mobile implementation repository (iOS, Android, Flutter, or React Native). This document provides implementation-level technical details for mobile development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:

- Includes app architecture, screen structures, state management, and implementation details
- References and aligns with the system-architecture.md and front-end-spec.md from Product repository
- Validates that mobile app ONLY consumes APIs defined in system-architecture.md
- Uses `mobile-architecture-tmpl.yaml` template for output format
- Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

**Workflow Mode**: Draft-first by default. Use `--interactive` flag for step-by-step confirmation at each stage.

## Prerequisites

**Required Documents**:

- System Architecture exists at `../product-repo/docs/system-architecture.md`
- PRD exists at `../product-repo/docs/prd.md` (contains UI/UX Goals if front-end-spec is missing)
- Front-End Spec exists at `../product-repo/docs/front-end-spec.md` (optional - use if available, otherwise extract UI/UX from PRD)

**Project Configuration**:

- Project mode is `multi-repo` with role in `{ios, android, flutter, react-native}` in `core-config.yaml`
- `multi_repo.product_repo_path` is configured in `core-config.yaml` pointing to Product repository
- Running in Mobile implementation repository (not Product repo)

**Recommended Environment**:

- Web interface (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project mode and role
PROJECT_MODE=$(grep "mode:" core-config.yaml | awk '{print $2}')
PROJECT_ROLE=$(grep -A 1 "multi_repo:" core-config.yaml | grep "role:" | awk '{print $2}')
if [ "$PROJECT_MODE" != "multi-repo" ] || [[ "$PROJECT_ROLE" != "ios" && "$PROJECT_ROLE" != "android" && "$PROJECT_ROLE" != "flutter" && "$PROJECT_ROLE" != "react-native" ]]; then
  echo "ERROR: Project mode is '$PROJECT_MODE' with role '$PROJECT_ROLE', expected mode='multi-repo' role in {ios, android, flutter, react-native}"
  echo "This task should run in Mobile implementation repository"
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
  echo "    role: ios  # or android, flutter, react-native"
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

echo "Prerequisites validated. Proceeding with mobile architecture generation..."
```

---

## Task Instructions

### Step 1: Load Context & Validate

Load the system-level architecture, UI/UX requirements, and PRD as CONSTRAINTS for this detailed architecture.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture (path already resolved in validation)
# PRODUCT_REPO_PATH is the absolute path set during prerequisite validation
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/system-architecture.md"

echo "Reading system architecture from: $SYSTEM_ARCH"
```

Read and analyze the **complete** system architecture document (not the sharded files).

**Why read the complete file?**

- Even if Product repo has sharded the architecture, the complete `system-architecture.md` file still exists
- Reading the complete file ensures we get the full context in one pass
- Sharded files are for PO/SM story creation, not for implementation architecture generation

**Focus Areas**:

1. **Repository Topology**: Understand this mobile app's role in the overall system
2. **API Contracts Summary**: Identify which APIs THIS mobile app can consume (CRITICAL)
3. **Integration Strategy**: Authentication mechanism, data format standards, error handling conventions
4. **Deployment Architecture**: App Store/Google Play deployment strategy
5. **Cross-Cutting Concerns**: Security (Keychain/KeyStore), performance, observability

**Step 1.2: Extract Mobile-Specific Constraints**

From the system architecture, extract:

- **APIs to Consume**: List of endpoints this mobile app can call (CRITICAL)
- **Authentication Requirements**: JWT format, token storage (Keychain/KeyStore), token refresh strategy
- **Data Format Standards**: JSON structure, date format (ISO 8601), pagination style (offset/cursor)
- **Error Handling Standard**: Error response format, HTTP status codes, display patterns
- **Performance Requirements**: App startup time, screen transition time, API response handling
- **Security Requirements**: Secure token storage, certificate pinning, biometric auth (if required)

**Step 1.3: Load UI/UX Requirements and PRD Context**

```bash
# Try to read Front-End Spec (optional - gracefully handle if missing)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"

if [ -f "$FRONTEND_SPEC" ]; then
  echo "Found Front-End Spec: docs/front-end-spec.md"
else
  echo "Front-End Spec not found (OK - will extract UI/UX from PRD)"
fi

# Read PRD (required)
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"

if [ ! -f "$PRD_PATH" ]; then
  echo "ERROR: PRD not found at $PRD_PATH"
  echo "PRD is required for mobile architecture generation"
  exit 1
fi

echo "Found PRD: docs/prd.md"
```

**IF Front-End Spec exists**, analyze:

- What are the core user flows for mobile? (Registration, Login, Product Browsing, Checkout, etc.)
- What screens are needed?
- What's the design system? (colors, typography, spacing, components)
- What are mobile-specific interaction patterns? (swipe gestures, pull-to-refresh, bottom sheets)
- Platform-specific guidelines? (iOS Human Interface Guidelines, Android Material Design)

**IF Front-End Spec is missing**, extract UI/UX from PRD's "User Interface Design Goals" section:

- Overall UX Vision - What's the high-level UX approach?
- Key Interaction Paradigms - How should users interact with the app?
- Core Screens and Views - What are the critical screens?
- Accessibility - What accessibility level? (None, WCAG AA, WCAG AAA)
- Branding - Any branding requirements or style guidelines?
- Target Platforms - Which platforms/devices? (iOS, Android, responsive web)

**Step 1.4: Detect Platform**

Auto-detect from `core-config.yaml` role field. Record platform for architecture decisions in subsequent steps.

**Step 1.5: Map User Flows to Screens**

Cross-reference UI/UX requirements (from Front-End Spec OR PRD UI Goals) with PRD stories:

- For each user flow, identify required screens
- For each screen, identify required components (buttons, lists, forms, modals)
- For each screen, identify state management needs
- For each screen, identify API calls needed

**IF `--interactive` flag**: Elicit user confirmation of loaded context and screen mapping before proceeding.

---

### Step 2: Upfront Questions

Consolidate all user-facing questions into a single interaction. Present as a numbered list, then wait for answers before proceeding.

```
Before generating the architecture, I need to confirm a few decisions:

1. **Target Platform** (auto-detected: {{detected_platform}})
   Confirm or override:
   - iOS Native (Swift/SwiftUI)
   - Android Native (Kotlin/Jetpack Compose)
   - Flutter (Dart)
   - React Native (TypeScript)

2. **Architecture Pattern Preference**
   Recommended for {{platform}}: {{recommended_pattern}}

   iOS Native options: MVVM with Combine | Clean Architecture | VIPER
   Android Native options: MVVM with ViewModel + StateFlow | MVI with Kotlin Flows | Clean Architecture
   Flutter options: BLoC | Provider | Riverpod
   React Native options: Redux Toolkit | MobX | Context API + Hooks

   Your preference (or "recommended"):

3. **UI Framework / Tooling Preferences**
   Default for {{platform}}: {{default_ui_framework}}
   Any specific preferences? (e.g., SwiftUI vs UIKit, Jetpack Compose vs XML, specific libraries)

Please reply with your choices (e.g., "1: confirmed, 2: recommended, 3: default").
```

**WAIT for user response before proceeding.**

---

### Step 3: API Contract Validation (HARD STOP)

**CRITICAL VALIDATION**: Ensure mobile app ONLY calls APIs defined in system-architecture.md.

Based on the screens and features identified in Step 1, list ALL API calls this mobile app will make and validate each one against system-architecture.md.

**API Consumption Analysis**:

```
API Contract Validation

I've analyzed the APIs this mobile app will call based on identified screens and features:

**Authentication & User APIs**:
- POST /api/auth/login       -> Defined in system-architecture.md
- POST /api/auth/register    -> Defined in system-architecture.md
- POST /api/auth/refresh     -> Defined in system-architecture.md
- GET  /api/users/:id        -> Defined in system-architecture.md

**Product APIs**:
- GET  /api/products          -> Defined in system-architecture.md
- GET  /api/products/:id      -> Defined in system-architecture.md

**Order APIs**:
- POST /api/orders            -> Defined in system-architecture.md
- GET  /api/orders            -> Defined in system-architecture.md

**Push Notification APIs**:
- POST /api/devices/register  -> NOT in system-architecture.md
- PUT  /api/devices/:id/token -> NOT in system-architecture.md

VALIDATION FAILED: Mobile app needs 2 Device APIs not defined in system-architecture.md

**Action Required**:
1. Option A: Update system-architecture.md to include Device APIs (and ensure backend implements them)
2. Option B: Remove push notification feature from mobile app

Please choose how to proceed before I continue with architecture design.
```

**IF all APIs validated successfully**:

```
API Contract Validation PASSED

All {{api_count}} APIs this mobile app will call are defined in system-architecture.md.
No undefined API calls detected. Proceeding with architecture generation...
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding. This is the only hard stop in the draft-first workflow.

---

### Step 4: Generate Complete Architecture Document

Generate the full architecture document in a single pass using all context gathered in Steps 1-3.

**Output Document**:
Use template: `.orchestrix-core/templates/mobile-architecture-tmpl.yaml`

**Prepare Output**:

```bash
# Ensure docs directory exists
mkdir -p docs
OUTPUT_PATH="docs/architecture.md"
```

**Generate ALL sections in one pass**:

1. **System Architecture Context**: Constraints from system-architecture.md (Step 1)
2. **Tech Stack**: Platform, language, UI framework, architecture pattern (Step 2 choices), networking, local storage, DI, testing
3. **Source Tree**: Mobile app directory structure for chosen platform
4. **App Architecture**: Architecture pattern details with diagram (MVVM/MVI/BLoC/Redux)
5. **Screen Structure**: Screen list organized by flow, navigation flow diagram
   - Authentication Screens (Splash, Login, Register)
   - Main Screens (Home, Product List, Product Detail, Cart, Profile)
   - Supporting Screens (Settings, About, Order History, Order Detail)
   - Navigation architecture and flow between screens
6. **State Management**: Platform-specific patterns
   - **Global State**: Authentication, cart, app settings
   - **Screen State**: Form inputs, loading states, error messages
   - **Server State**: Products, orders, user profile (cached data from APIs)
   - State management solution based on architecture pattern from Step 2
7. **API Integration**: API client configuration, service templates, validated API contracts (Step 3)
8. **Local Data Management**: Keychain/KeyStore for tokens, local database, caching strategy
9. **Security**: Secure token storage, certificate pinning (if required), biometric auth (if required)
10. **Offline Support**: Offline capabilities and sync strategy (if applicable)
11. **Push Notifications**: FCM/APNS setup and handling (if applicable)
12. **Testing Strategy**: Unit tests, UI tests (XCTest/Espresso/Detox), best practices
13. **Deployment**: App versioning, build configs, CI/CD, App Store/Play Store release
14. **Monitoring & Analytics**: Crash reporting, analytics, performance monitoring
15. **Coding Standards**: Platform-specific critical rules and quick reference

**Save to `docs/architecture.md`.**

**Track Key Decisions**: As the document is generated, collect all architectural decisions made (pattern choices, library selections, trade-offs) for presentation in Step 5.

---

### Step 5: Decision Review

After generating the document, present all key decisions in a categorized format for user review.

```
Architecture Document Generated: docs/architecture.md

Here are the key decisions made during generation. Please review:

RED - Needs Confirmation (non-obvious or high-impact choices):
- [Decision]: {{description}}
  Reasoning: {{why}}
  Alternatives: {{other_options}}

YELLOW - Suggest Review (reasonable defaults that may need adjustment):
- [Decision]: {{description}}
  Reasoning: {{why}}

GREEN - Standard Practice (industry-standard, low-risk choices):
- [Decision]: {{description}}
  Reasoning: {{why}}

---

Total Decisions: {{count}}
  RED (needs confirmation): {{red_count}}
  YELLOW (suggest review): {{yellow_count}}
  GREEN (standard practice): {{green_count}}

Please review the RED items and confirm or override.
YELLOW items will proceed as-is unless you object.
GREEN items are standard and require no action.
```

**IF user requests changes**: Apply changes to `docs/architecture.md` and re-present only the affected decisions.

**IF `--interactive` flag**: Present the full document for section-by-section review instead of the decision summary.

---

### Step 6: Validate, Finalize & Handoff

**Step 6.1: Final Cross-Validation**

Perform final cross-validation to ensure alignment with system architecture.

**Validation Checklist**:

```
Final Validation Checklist:

**API Contract Alignment**:
- [ ] All API calls consume ONLY APIs defined in system-architecture.md
- [ ] No undefined API calls
- [ ] API client configured with correct base URL from system-architecture.md

**Authentication Alignment**:
- [ ] Token storage uses Keychain (iOS) or KeyStore (Android) per system-architecture.md
- [ ] Token refresh strategy matches system-architecture.md
- [ ] Auth interceptors configured correctly

**Data Format Alignment**:
- [ ] JSON parsing expects structure from system-architecture.md
- [ ] Date handling uses format from system-architecture.md (ISO 8601)
- [ ] Pagination expects style from system-architecture.md (offset/cursor)

**Error Handling Alignment**:
- [ ] Error display matches system-architecture.md error format
- [ ] HTTP status codes handled per system-architecture.md

**Performance Requirements**:
- [ ] App startup time target documented
- [ ] Screen transition time target documented
- [ ] API response handling optimized

**Security Implementation**:
- [ ] Token storage is secure (Keychain/KeyStore)
- [ ] Certificate pinning implemented (if required)
- [ ] Biometric authentication implemented (if required)
- [ ] No sensitive data in UserDefaults/SharedPreferences

**Deployment Alignment**:
- [ ] App Store/Google Play deployment strategy documented
- [ ] Environment variables configured correctly
- [ ] CI/CD pipeline documented

All checks passed?
```

**Step 6.2: Handoff**

Present the completed mobile architecture document and provide next steps.

**Success Output**:

```
MOBILE ARCHITECTURE COMPLETE

Generated Document: docs/architecture.md

Mobile Repository: {{mobile_repo_name}}
Platform: {{platform}}
UI Framework: {{ui_framework}}
Architecture: {{arch_pattern}}

Screen Structure:
  - {{screen_count}} Screens
  - Navigation: {{navigation_pattern}}

State Management:
  - Solution: {{state_solution}}
  - Global State: {{global_state_stores}}
  - Local Storage: {{local_storage_solution}}

API Integration:
  - API Services: {{api_service_count}}
  - Endpoints Consumed: {{endpoint_count}} (all from system-architecture.md)
  - Auth Strategy: {{auth_strategy}}

Security:
  - Token Storage: {{token_storage}} (Keychain/KeyStore)
  - Certificate Pinning: {{pinning_status}}
  - Biometric Auth: {{biometric_status}}

---

NEXT STEPS:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate screen structure matches your vision

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all mobile user flows are covered

3. **Dev: Begin Mobile Implementation**

   **Setup Project**:
   # iOS Native
   xcodegen generate  # or use Xcode directly
   pod install

   # Android Native
   # Open in Android Studio

   # Flutter
   flutter create {{project_name}}
   flutter pub get

   # React Native
   npx react-native init {{project_name}} --template typescript
   npm install

   **Implementation Order** (follow Story priorities from PRD):
   1. Set up project structure and configuration
   2. Implement design system and reusable components
   3. Set up navigation and routing
   4. Implement authentication screens (login, register)
   5. Implement core screens per user flows
   6. Add state management and API integration
   7. Implement local storage and offline support
   8. Write unit and UI tests
   9. Configure CI/CD pipeline for App Store/Play Store

4. **SM: Create Mobile Stories**
   - Filter PRD stories where target_platform = ios/android/mobile
   - Reference this architecture.md in each Story
   - Sequence stories by dependencies

5. **QA: Test Mobile App**
   - Verify all user flows work end-to-end
   - Test on multiple devices and screen sizes
   - Test offline capabilities (if applicable)
   - Test push notifications (if applicable)
   - Performance testing (app startup, screen transitions)

---

Mobile architecture is now the technical blueprint for mobile development!

All mobile development will reference this document to ensure consistency with system architecture and design specifications.
```

---

## Flags

| Flag            | Behavior                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--interactive` | Restores step-by-step confirmation at each stage (Step 1 context review, Step 4 section-by-section review). Use when you want granular control over each decision point. |

**Default (no flag)**: Draft-first workflow. Only two interaction points: upfront questions (Step 2) and decision review (Step 5). API validation (Step 3) is always a hard stop regardless of mode.

---

## Notes for Agent Execution

- **Context Management**: This task requires significant context (system-architecture.md + PRD + optional front-end-spec.md + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All API calls MUST be defined in system-architecture.md. If mobile app needs an API not in system-arch, either add it to system-arch or remove it from mobile app.

- **UI/UX Source Flexibility**:
  - **IF Front-End Spec exists**: UI screens, design system, user flows MUST match front-end-spec.md (or adapt for mobile patterns)
  - **IF Front-End Spec is missing**: Extract UI/UX requirements from PRD's "User Interface Design Goals" section. This is common for brownfield projects or mobile-only additions.

- **Template Reference**: This task uses `mobile-architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **Platform-Specific Patterns**: Adapt recommendations based on platform (iOS Native, Android Native, Flutter, React Native). Each platform has different conventions.

- **API Validation is Critical**: Step 3 is the most important validation. If it fails, STOP and wait for user to resolve before proceeding.

- **Draft-First Rationale**: The draft-first workflow reduces user wait time by consolidating questions upfront and generating the full document before review. This is more efficient for experienced users who trust the agent's defaults. The `--interactive` flag preserves the original step-by-step flow for users who prefer granular control.

## Success Criteria

- Mobile architecture document exists at `docs/architecture.md`
- All API calls reference APIs from system-architecture.md (Step 3 validation passed)
- Screen structure covers all user flows from Front-End Spec (if available) or PRD UI Goals
- Architecture pattern is clear and appropriate for chosen platform
- State management strategy is well-defined
- API integration pattern includes error handling and token refresh
- Security implementation follows platform best practices (Keychain/KeyStore)
- Local storage and caching strategy is documented
- Testing strategy is comprehensive (unit, UI, integration)
- Deployment strategy for App Store/Google Play is documented
- Key decisions reviewed and confirmed by user (Step 5)
- Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:

```
ERROR: System architecture not found

Mobile architecture requires system-architecture.md from Product repository.

Please ensure:
1. Product repository path is correct in core-config.yaml
2. System architecture exists at ../product-repo/docs/system-architecture.md

If system architecture doesn't exist:
cd ../my-project-product
@architect *create-system-architecture

After system architecture is ready, return here and run:
@architect *create-mobile-architecture
```

**If API contracts are missing in system-architecture.md**:

```
WARNING: System architecture lacks API Contracts Summary

Mobile app needs to know which APIs are available to consume.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If mobile app tries to call undefined APIs** (Step 3 validation failure):

```
ERROR: Mobile app calls APIs not defined in system-architecture.md

The following APIs are called by mobile app but NOT in system-architecture.md:
- {{undefined_api_1}}
- {{undefined_api_2}}

**Action Required**:
1. If these APIs are necessary: Update system-architecture.md to include them (and ensure backend implements them)
2. If these APIs are not necessary: Remove them from mobile architecture

All mobile API calls MUST be pre-approved in system-architecture.md to ensure mobile-backend alignment.
```

## Related Tasks

- **Prerequisites**: `create-system-architecture.md` (Product repo)
- **Optional Prerequisites**: `ux-create-front-end-spec.md` (Product repo - recommended but not required)
- **Parallel**: `create-backend-architecture.md`, `create-frontend-architecture.md`
- **Next Steps**: `sm-create-next-story.md` (Story creation for mobile)

## Version History

| Version | Date       | Changes                                                                                                                                                                                                                                     | Author          |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2.0.0   | 2025-01-29 | REFACTOR: Draft-first workflow pattern. Consolidated 7 interactive steps into 6 steps with only 2 interaction points (upfront questions + decision review). Added --interactive flag for backward compat. API validation remains hard stop. | Orchestrix Team |
| 1.1.0   | 2025-01-15 | REFACTOR: Simplified Step 5 template section description, reduced by 40 lines                                                                                                                                                               | Orchestrix Team |
| 1.0.0   | 2025-01-14 | Initial creation for Phase 2 mobile support                                                                                                                                                                                                 | Orchestrix Team |
