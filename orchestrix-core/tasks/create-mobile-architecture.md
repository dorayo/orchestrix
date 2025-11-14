# Create Mobile Architecture

## Purpose

Generate a **detailed mobile architecture document** for a mobile implementation repository (iOS, Android, Flutter, or React Native). This document provides implementation-level technical details for mobile development, referencing and aligning with system-level architecture from the Product repository.

**IMPORTANT**: This is a DETAILED implementation architecture, NOT a system-level coordination document. It:
- ✅ Includes app architecture, screen structures, state management, and implementation details
- ✅ References and aligns with the system-architecture.md and front-end-spec.md from Product repository
- ✅ Validates that mobile app ONLY consumes APIs defined in system-architecture.md
- ✅ Uses `mobile-architecture-tmpl.yaml` template for output format
- ❌ Does NOT duplicate system-level coordination concerns (those are in system-architecture.md)

## Prerequisites

**Required Documents**:
- ✅ System Architecture exists at `../product-repo/docs/architecture/system-architecture.md` (or configured path)
- ✅ Front-End Spec exists at `../product-repo/docs/front-end-spec.md` (or configured path) - recommended
- ✅ PRD exists at `../product-repo/docs/prd.md` (or configured path)

**Project Configuration**:
- ✅ Project type is `ios`, `android`, `flutter`, or `react-native` in `core-config.yaml`
- ✅ `product_repo.path` is configured in `core-config.yaml` pointing to Product repository
- ✅ Running in Mobile implementation repository (not Product repo)

**Recommended Environment**:
- 🌐 **Web interface** (e.g., claude.ai/code with Gemini 1M+ tokens) - Recommended for comprehensive context
- 💻 IDE (Claude Code, Cursor, etc.) - Acceptable but may hit context limits

## Validation

Before starting, validate prerequisites:

```bash
# Check project type
PROJECT_TYPE=$(grep "type:" core-config.yaml | awk '{print $2}')
if [[ "$PROJECT_TYPE" != "ios" && "$PROJECT_TYPE" != "android" && "$PROJECT_TYPE" != "flutter" && "$PROJECT_TYPE" != "react-native" ]]; then
  echo "❌ ERROR: Project type is '$PROJECT_TYPE', expected 'ios', 'android', 'flutter', or 'react-native'"
  echo "This task should run in Mobile implementation repository"
  exit 1
fi

# Check if product repo path is configured
PRODUCT_REPO_PATH=$(grep -A 1 "product_repo:" core-config.yaml | grep "path:" | awk '{print $2}')
if [ -z "$PRODUCT_REPO_PATH" ]; then
  echo "❌ ERROR: product_repo.path not configured in core-config.yaml"
  echo "Add this to core-config.yaml:"
  echo "product_repo:"
  echo "  path: ../my-project-product  # Adjust path to your Product repo"
  exit 1
fi

# Check if system architecture exists
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/architecture/system-architecture.md"
if [ ! -f "$SYSTEM_ARCH" ]; then
  echo "❌ ERROR: System architecture not found at $SYSTEM_ARCH"
  echo "👉 Action: Create system architecture first in Product repository"
  echo "@architect *create-system-architecture"
  exit 1
fi

echo "✅ Prerequisites validated. Proceeding with mobile architecture generation..."
```

---

## Task Instructions

### Step 1: Load System Architecture Context

Load the system-level architecture as a CONSTRAINT for this detailed architecture.

**Step 1.1: Load System Architecture**

```bash
# Read system architecture
PRODUCT_REPO_PATH=$(grep -A 1 "product_repo:" core-config.yaml | grep "path:" | awk '{print $2}')
SYSTEM_ARCH="$PRODUCT_REPO_PATH/docs/architecture/system-architecture.md"
```

Read and analyze the system architecture document.

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

**Elicit User Confirmation**:
```
📖 I've loaded the system architecture from Product repository.

**This Mobile App's Role**:
- Repository Name: {{mobile_repo_name}}
- Platform: {{platform}} (iOS/Android/Flutter/React Native)
- Primary Responsibility: {{mobile_responsibility}}

**APIs This Mobile App Can Consume** (from system-architecture.md):
[List all API categories and endpoints with clear formatting]

**Integration Constraints**:
- Authentication: {{auth_mechanism}} (token storage: Keychain/KeyStore)
- Data Format: {{data_format_standards}}
- Error Handling: {{error_standard}}

**Performance Requirements**:
- App Startup Time: {{startup_time_target}}
- Screen Transitions: {{transition_time_target}}

**Security Requirements**:
- Token Storage: Keychain (iOS) / KeyStore (Android)
- Certificate Pinning: {{pinning_required}}
- Biometric Auth: {{biometric_required}}

Does this match your understanding? Ready to proceed with detailed mobile architecture?
```

---

### Step 2: Load Front-End Spec and PRD Context

Load the Front-End Spec to understand UI/UX requirements and PRD for functional requirements.

**Step 2.1: Load Front-End Spec**

```bash
# Read Front-End Spec (if exists)
FRONTEND_SPEC="$PRODUCT_REPO_PATH/docs/front-end-spec.md"
```

**Analysis Focus**:
- What are the core user flows for mobile? (Registration, Login, Product Browsing, Checkout, etc.)
- What screens are needed?
- What's the design system? (colors, typography, spacing, components)
- What are mobile-specific interaction patterns? (swipe gestures, pull-to-refresh, bottom sheets)
- Platform-specific guidelines? (iOS Human Interface Guidelines, Android Material Design)

**Step 2.2: Load PRD Context**

```bash
# Read PRD
PRD_PATH="$PRODUCT_REPO_PATH/docs/prd.md"
```

**Analysis Focus**:
- What are the main features/epics for mobile?
- What are the user stories for this platform (target_platform = ios/android/mobile)?
- What are the mobile-specific non-functional requirements? (offline support, push notifications, biometric auth)

**Step 2.3: Map User Flows to Screens and Components**

Cross-reference Front-End Spec user flows with PRD stories:
- For each user flow, identify required screens
- For each screen, identify required components (buttons, lists, forms, modals)
- For each screen, identify state management needs
- For each screen, identify API calls needed

**Elicit User Confirmation**:
```
🎨 I've analyzed the Front-End Spec and PRD.

**Core User Flows Identified**:
1. {{flow_1}} → Screens: {{screens_1}}
2. {{flow_2}} → Screens: {{screens_2}}
3. {{flow_3}} → Screens: {{screens_3}}

**Total Screens**: {{screen_count}}
**Estimated Components**: {{component_estimate}}

**Platform**: {{platform}} (iOS Native/Android Native/Flutter/React Native)
**Design System**:
- Primary Color: {{primary_color}}
- UI Style: {{ui_style}} (iOS HIG / Material Design / Custom)

Does this match your vision? Ready to design app architecture?
```

---

### Step 3: Validate API Consumption (CRITICAL)

**CRITICAL VALIDATION**: Ensure mobile app ONLY calls APIs defined in system-architecture.md.

Based on the screens and features identified in Step 2, list ALL API calls this mobile app will make:

**API Consumption Analysis**:
```
⚠️ **API Contract Validation**

I've analyzed the APIs this mobile app will call based on identified screens and features:

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

**Push Notification APIs**:
- POST /api/devices/register → ❌ NOT in system-architecture.md
- PUT /api/devices/:id/token → ❌ NOT in system-architecture.md

**❌ VALIDATION FAILED**: Mobile app needs 2 Device APIs not defined in system-architecture.md

**Action Required**:
1. Option A: Update system-architecture.md to include Device APIs (and ensure backend implements them)
2. Option B: Remove push notification feature from mobile app

Please choose how to proceed before I continue with architecture design.
```

**IF all APIs validated successfully**:
```
✅ **API Contract Validation PASSED**

All {{api_count}} APIs this mobile app will call are defined in system-architecture.md.
No undefined API calls detected. Proceeding with architecture generation...
```

**CRITICAL RULE**: If validation fails, STOP and wait for user to resolve the mismatch before proceeding.

---

### Step 4: Design App Architecture

**Step 4.1: Choose Architecture Pattern**

Based on platform, recommend architecture pattern:

**Elicit from User**:
```
🏗️ **Mobile Architecture Pattern**

Based on platform {{platform}}, I recommend:

**For iOS Native (Swift)**:
- Option 1: MVVM with Combine - Modern, reactive, SwiftUI-friendly
- Option 2: Clean Architecture - Highly testable, complex but scalable
- Option 3: VIPER - Very modular, overkill for simple apps

**For Android Native (Kotlin)**:
- Option 1: MVVM with ViewModel + StateFlow - Google recommended, Jetpack-friendly
- Option 2: MVI with Kotlin Flows - Predictable state, great for complex UIs
- Option 3: Clean Architecture - Highly testable, layered approach

**For Flutter (Dart)**:
- Option 1: BLoC pattern - Official recommendation, reactive, testable
- Option 2: Provider - Simpler, good for moderate complexity
- Option 3: Riverpod - Modern, compile-safe, better than Provider

**For React Native (TypeScript)**:
- Option 1: Redux Toolkit - Predictable state, good dev tools
- Option 2: MobX - Simpler, less boilerplate
- Option 3: Context API + Hooks - Built-in, good for simple apps

**Recommended**: {{recommended_pattern}}
**Rationale**: {{why_this_pattern}}

What's your preference?
```

**Step 4.2: Define Screen Structure**

Based on user flows from Step 2, organize screens:
- Authentication Screens (Splash, Login, Register)
- Main Screens (Home, Product List, Product Detail, Cart, Profile)
- Supporting Screens (Settings, About, Order History, Order Detail)

Define navigation flow between screens.

**Step 4.3: Define State Management**

Identify state types:
- **Global State**: Authentication, cart, app settings
- **Screen State**: Form inputs, loading states, error messages
- **Server State**: Products, orders, user profile (cached data from APIs)

Choose state management solution based on architecture pattern.

**Elicit User Confirmation**:
```
📱 **Proposed Mobile App Architecture**:

**Platform**: {{platform}}
**Architecture Pattern**: {{arch_pattern}}
**UI Framework**: {{ui_framework}}

**Screens** ({{screen_count}} total):
- {{auth_screens}} Authentication Screens
- {{main_screens}} Main Screens
- {{support_screens}} Supporting Screens

**Navigation**: {{navigation_pattern}}

**State Management**: {{state_solution}}
- Global State: {{global_state_details}}
- Screen State: Per-screen ViewModels/BLoCs/Controllers
- Server State: {{server_state_caching}}

**Local Storage**:
- Sensitive Data: Keychain/KeyStore
- Cache: {{cache_solution}} (Core Data/Room/SQLite/Hive)
- Settings: UserDefaults/SharedPreferences

Does this app architecture make sense for your mobile platform?
```

---

### Step 5: Generate Mobile Architecture Document Using Template

Now generate the complete document using the `mobile-architecture-tmpl.yaml` template.

**Step 5.1: Prepare Output Directory**

```bash
# Ensure docs directory exists
mkdir -p docs

# Set output path
OUTPUT_PATH="docs/architecture.md"
```

**Step 5.2: Load Template and Fill Sections**

Use the `mobile-architecture-tmpl.yaml` template to generate the document. The template defines the output format for:

1. **System Architecture Context** - Present loaded constraints from Step 1
2. **Mobile Tech Stack** - Language, UI framework, architecture pattern, networking, local storage, DI, testing
3. **App Architecture** - Architecture pattern details, architecture diagram
4. **Screen Structure** - Screen list, navigation flow diagram
5. **State Management** - State types, state management template/code
6. **API Integration** - API client configuration, service templates, API validation
7. **Local Data Management** - Local storage strategy, caching strategy
8. **Security** - Secure token storage, certificate pinning, biometric auth
9. **Offline Support** - Offline capabilities, sync strategy (if applicable)
10. **Push Notifications** - Notification setup and handling (if applicable)
11. **Testing Strategy** - Unit tests, UI tests, testing best practices
12. **Deployment** - App versioning, build configuration, CI/CD pipeline, App Store/Play Store release process
13. **Monitoring & Analytics** - Crash reporting, analytics tracking, performance monitoring
14. **Mobile Developer Standards** - Critical coding rules, quick reference

**Fill each template section** with information collected in Steps 1-4:
- Use actual platform (iOS/Android/Flutter/React Native)
- Use actual technology stack with versions
- Use actual API endpoints from system-architecture.md
- Use actual auth mechanism from system-architecture.md
- Include all validated API calls from Step 3
- Include platform-specific security implementations (Keychain/KeyStore)

**Template Reference Pattern**:
```markdown
## Output Document Structure

This task generates a mobile architecture document following the structure defined in:
`orchestrix-core/templates/mobile-architecture-tmpl.yaml`

The template sections will be filled with:
- System constraints from system-architecture.md (Step 1)
- UI/UX requirements from front-end-spec.md (Step 2)
- Validated API contracts (Step 3)
- App architecture and state management decisions (Step 4)
```

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

All checks passed? ✅
```

---

### Step 7: Output Handoff

Present the completed mobile architecture document and provide next steps.

**Success Output**:
```
✅ MOBILE ARCHITECTURE COMPLETE

📄 Generated Document: docs/architecture.md

📦 Mobile Repository: {{mobile_repo_name}}
📱 Platform: {{platform}}
🎨 UI Framework: {{ui_framework}}
🏗️ Architecture: {{arch_pattern}}

📱 Screen Structure:
  - {{screen_count}} Screens
  - Navigation: {{navigation_pattern}}

🔄 State Management:
  - Solution: {{state_solution}}
  - Global State: {{global_state_stores}}
  - Local Storage: {{local_storage_solution}}

🔌 API Integration:
  - API Services: {{api_service_count}}
  - Endpoints Consumed: {{endpoint_count}} (all from system-architecture.md ✅)
  - Auth Strategy: {{auth_strategy}}

🔒 Security:
  - Token Storage: {{token_storage}} (Keychain/KeyStore)
  - Certificate Pinning: {{pinning_status}}
  - Biometric Auth: {{biometric_status}}

---

📋 **NEXT STEPS**:

1. **Review Architecture Document**
   - Verify all sections are complete
   - Confirm alignment with system-architecture.md
   - Validate screen structure matches your vision

2. **PO: Review and Approve** (if applicable)
   - Validate against PRD requirements
   - Confirm all mobile user flows are covered

3. **Dev: Begin Mobile Implementation**

   **Setup Project**:
   ```bash
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
   ```

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

🎉 **Mobile architecture is now the technical blueprint for mobile development!**

All mobile development will reference this document to ensure consistency with system architecture and design specifications.
```

---

## Notes for Agent Execution

- **Context Management**: This task requires significant context (system-architecture.md + front-end-spec.md + PRD + user interactions). Recommend using **Web interface with large context window** (Gemini 1M+).

- **System Architecture is Constraint**: All API calls MUST be defined in system-architecture.md. If mobile app needs an API not in system-arch, either add it to system-arch or remove it from mobile app.

- **Front-End Spec is Blueprint**: UI screens, design system, user flows MUST match front-end-spec.md (or adapt for mobile patterns).

- **Template Reference**: This task uses `mobile-architecture-tmpl.yaml` for output format. Do NOT duplicate template content in this task file.

- **Platform-Specific Patterns**: Adapt recommendations based on platform (iOS Native, Android Native, Flutter, React Native). Each platform has different conventions.

- **API Validation is Critical**: Step 3 is the most important validation. If it fails, STOP and wait for user to resolve before proceeding.

## Success Criteria

- ✅ Mobile architecture document exists at `docs/architecture.md`
- ✅ All API calls reference APIs from system-architecture.md (Step 3 validation passed)
- ✅ Screen structure covers all user flows from Front-End Spec/PRD
- ✅ Architecture pattern is clear and appropriate for chosen platform
- ✅ State management strategy is well-defined
- ✅ API integration pattern includes error handling and token refresh
- ✅ Security implementation follows platform best practices (Keychain/KeyStore)
- ✅ Local storage and caching strategy is documented
- ✅ Testing strategy is comprehensive (unit, UI, integration)
- ✅ Deployment strategy for App Store/Google Play is documented
- ✅ User has approved the document
- ✅ Next steps are clear for Dev agent

## Error Handling

**If system architecture is missing**:
```
❌ ERROR: System architecture not found

Mobile architecture requires system-architecture.md from Product repository.

Please ensure:
1. Product repository path is correct in core-config.yaml
2. System architecture exists at ../product-repo/docs/architecture/system-architecture.md

If system architecture doesn't exist:
cd ../my-project-product
@architect *create-system-architecture

After system architecture is ready, return here and run:
@architect *create-mobile-architecture
```

**If API contracts are missing in system-architecture.md**:
```
⚠️ WARNING: System architecture lacks API Contracts Summary

Mobile app needs to know which APIs are available to consume.

Please update system-architecture.md to include an "API Contracts Summary" section, then return here.
```

**If mobile app tries to call undefined APIs** (Step 3 validation failure):
```
❌ ERROR: Mobile app calls APIs not defined in system-architecture.md

The following APIs are called by mobile app but NOT in system-architecture.md:
- {{undefined_api_1}}
- {{undefined_api_2}}

**Action Required**:
1. If these APIs are necessary: Update system-architecture.md to include them (and ensure backend implements them)
2. If these APIs are not necessary: Remove them from mobile architecture

All mobile API calls MUST be pre-approved in system-architecture.md to ensure mobile-backend alignment.
```

## Related Tasks

- **Prerequisites**: `create-system-architecture.md` (Product repo), `ux-create-front-end-spec.md` (Product repo)
- **Parallel**: `create-backend-architecture.md`, `create-frontend-architecture.md`
- **Next Steps**: `sm-create-next-story.md` (Story creation for mobile)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-14 | Initial creation for Phase 2 mobile support | Orchestrix Team |
