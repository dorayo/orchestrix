# Multi-Repository Greenfield Development Guide

> **Greenfield**: Starting a new project from scratch with multiple repositories (Product repo + Implementation repos).

This guide walks you through the complete Orchestrix workflow for building a new multi-repository project from requirements to deployment-ready code.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Phase 1: Product Planning (Product Repo)](#phase-1-product-planning-product-repo)
- [Phase 2: System Architecture (Product Repo)](#phase-2-system-architecture-product-repo)
- [Phase 3: Implementation Architectures (Implementation Repos)](#phase-3-implementation-architectures-implementation-repos)
- [Phase 4: Story Creation & Development](#phase-4-story-creation--development)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

---

## Overview

**Greenfield Workflow** follows a **top-down approach**:

1. **Product Repo**: Define requirements, design, system-level architecture
2. **Implementation Repos**: Generate detailed architecture aligned with system architecture
3. **Dev Team**: Implement features following architecture blueprints

**Key Benefits**:

- ✅ System-First: Coordinate multiple repos before implementation
- ✅ API Alignment: Frontend/Mobile only call APIs defined by Backend
- ✅ Context Management: Separate docs reduce LLM context by 37-44%
- ✅ Clear Handoffs: Each repo has its own architecture document

---

## Repository Structure

```
my-ecommerce-product/           # Product Repository (Planning Team)
├── core-config.yaml            # mode: multi-repo, role: product
├── docs/
│   ├── project-brief.md        # Analyst output
│   ├── prd.md                  # PM output
│   ├── front-end-spec.md       # UX-Expert output
│   ├── architecture/
│   │   └── system-architecture.md   # Architect output (SYSTEM-LEVEL)
│   └── epics/
│       ├── epic-1-user-auth.yaml
│       └── epic-2-product-catalog.yaml

my-ecommerce-backend/           # Backend Repository (Dev Team)
├── core-config.yaml            # mode: multi-repo, role: backend, product_repo_path: ../my-ecommerce-product
├── docs/
│   └── architecture.md         # Detailed backend architecture
└── src/                        # Implementation code

my-ecommerce-web/               # Frontend Repository (Dev Team)
├── core-config.yaml            # mode: multi-repo, role: frontend, product_repo_path: ../my-ecommerce-product
├── docs/
│   └── ui-architecture.md      # Detailed frontend architecture
└── src/                        # Implementation code

my-ecommerce-ios/               # iOS Repository (Dev Team)
├── core-config.yaml            # mode: multi-repo, role: ios, product_repo_path: ../my-ecommerce-product
├── docs/
│   └── architecture.md         # Detailed iOS architecture
└── MyApp/                      # Implementation code
```

---

## Prerequisites

### 1. Install Orchestrix in Product Repo

```bash
mkdir my-ecommerce-product
cd my-ecommerce-product
git init

# Install Orchestrix (installs all agents by default)
npx orchestrix install

# Verify installation
ls .claude/agents/  # Should see: analyst.md, pm.md, ux-expert.md, architect.md, po.md, sm.md, dev.md, qa.md, etc.
```

### 2. Configure Product Repo

Verify `core-config.yaml`:

```yaml
project:
  name: My E-Commerce App
  mode: multi-repo # Using multi-repo mode
  version: 1.0.0

  multi_repo:
    role: product # This is the product repository

document_locations:
  prd: docs/prd.md
  front_end_spec: docs/front-end-spec.md
  architecture: docs/architecture/system-architecture.md
# No product_repo_path here (this IS the product repo)
```

---

## Phase 1: Product Planning (Product Repo)

### Step 1: Create Project Brief (Analyst)

```bash
cd my-ecommerce-product

# Activate Analyst agent
@analyst
```

**Analyst will**:

1. Ask about project goals, target users, business model
2. Conduct market research (optional)
3. Generate `docs/project-brief.md`

**Output**: `docs/project-brief.md` (10-15 pages)

---

### Step 2: Create PRD (PM)

```bash
# Activate PM agent
@pm
```

**PM will**:

1. Load project brief
2. Elicit features, user stories, acceptance criteria
3. **CRITICAL**: For each Story, specify `target_platform`:
   - `backend`: Backend implements API
   - `frontend`: Web app consumes API
   - `ios`: iOS app consumes API
   - `android`: Android app consumes API
   - `mobile`: Shared mobile story (iOS + Android)
4. Generate `docs/prd.md`

**Example Story with target_platform**:

```yaml
# In docs/epics/epic-1-user-auth.yaml
stories:
  - id: 1.1
    title: "User Registration API"
    target_platform: backend # ← Backend implements this
    description: "Implement user registration endpoint"
    acceptance_criteria:
      - "POST /api/auth/register accepts email, password"
      - "Returns JWT tokens on success"

  - id: 1.2
    title: "User Registration UI"
    target_platform: frontend # ← Frontend consumes backend API
    description: "Create registration form"
    acceptance_criteria:
      - "Form with email, password fields"
      - "Calls POST /api/auth/register from Story 1.1"
      - "Redirects to home on success"

  - id: 1.3
    title: "User Registration Screen (Mobile)"
    target_platform: mobile # ← Both iOS and Android
    description: "Create mobile registration screen"
    acceptance_criteria:
      - "Native form with email, password"
      - "Calls POST /api/auth/register from Story 1.1"
```

**Output**: `docs/prd.md` (30-50 pages) + `docs/epics/*.yaml`

---

### Step 3: Create Front-End Spec (UX-Expert)

```bash
# Activate UX-Expert agent
@ux
```

**UX-Expert will**:

1. Load PRD
2. Design user flows, wireframes, design system
3. Generate `docs/front-end-spec.md` for **all frontend platforms** (Web, iOS, Android)

**Output**: `docs/front-end-spec.md` (20-30 pages)

---

## Phase 2: System Architecture (Product Repo)

### Step 4: Create System Architecture (Architect)

**CRITICAL STEP**: This creates the coordination document for all implementation repos.

```bash
# Activate Architect agent
@architect

# Select command
*create-system-architecture
```

**Architect will**:

1. Load PRD, Front-End Spec, Project Brief
2. Define **Repository Topology** (which repos exist)
3. Define **API Contracts Summary** (which APIs backend provides)
4. Define **Integration Strategy** (JWT auth, JSON format, error handling)
5. Define **Deployment Architecture** (AWS, Vercel, App Store)
6. Generate `docs/architecture/system-architecture.md`

**Example System Architecture Output**:

````markdown
# System Architecture

## Repository Topology

| Repository           | Type           | Responsibility                     | Tech Stack                    |
| -------------------- | -------------- | ---------------------------------- | ----------------------------- |
| my-ecommerce-backend | Backend        | REST API, business logic, database | Node.js + NestJS + PostgreSQL |
| my-ecommerce-web     | Frontend (Web) | Web app UI                         | React + TypeScript + Vite     |
| my-ecommerce-ios     | Mobile (iOS)   | iOS app                            | Swift + SwiftUI               |

## API Contracts Summary

**Authentication & User APIs** (Backend provides):

- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/refresh - Refresh access token
- GET /api/users/:id - Get user profile

**Product APIs** (Backend provides):

- GET /api/products - List products (paginated)
- GET /api/products/:id - Get product details
- POST /api/products - Create product (Admin only)

**Order APIs** (Backend provides):

- POST /api/orders - Create order
- GET /api/orders - List user orders
- GET /api/orders/:id - Get order details

## Integration Strategy

**Authentication**:

- Mechanism: JWT (JSON Web Tokens)
- Access Token Lifetime: 15 minutes
- Refresh Token Lifetime: 7 days
- Storage:
  - Web: HttpOnly cookies
  - iOS: Keychain
  - Android: KeyStore

**Data Format**:

- Content-Type: application/json
- Date Format: ISO 8601 (e.g., "2025-01-14T10:30:00Z")
- Pagination: Cursor-based (`cursor`, `limit`)

**Error Handling**:

- Error Response Format:
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password"
    }
  }
  ```
````

- HTTP Status Codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)

## Deployment Architecture

- **Backend**: AWS Lambda + API Gateway + RDS PostgreSQL
- **Web**: Vercel (Next.js SSR)
- **iOS**: App Store (TestFlight for beta)

````

**Output**: `docs/architecture/system-architecture.md` (15-25 pages)

**✅ CHECKPOINT**: System architecture is now the **single source of truth** for all implementation repos.

---

### Step 5: Update PRD (PM) [Optional but Recommended]

After system architecture is created, PM may want to refine PRD based on technical decisions:

```bash
@pm
# Review system-architecture.md and update PRD if needed
````

---

### Step 6: Validate Consistency (PO)

```bash
# Activate PO agent
@po

# Select command
*validate-consistency
```

**PO will**:

1. Cross-check PRD, Front-End Spec, System Architecture
2. Verify target_platform is specified for all stories
3. Verify all backend APIs in PRD are documented in system-architecture.md
4. Flag inconsistencies

**Output**: Validation report + updated documents if needed

---

## Phase 3: Implementation Architectures (Implementation Repos)

Now create detailed architectures for each implementation repository.

### Backend Repository Setup

```bash
# Create Backend repo
mkdir my-ecommerce-backend
cd my-ecommerce-backend
git init

# Install Orchestrix (installs all agents)
npx orchestrix install

# Configure core-config.yaml
cat > core-config.yaml << EOF
project:
  name: My E-Commerce App - Backend
  mode: multi-repo
  version: 1.0.0

  multi_repo:
    role: backend # ← CRITICAL: Set role to backend
    product_repo_path: ../my-ecommerce-product   # ← CRITICAL: Points to Product repo

document_locations:
  architecture: docs/architecture.md
EOF
```

---

### Step 7: Create Backend Architecture (Architect)

```bash
cd my-ecommerce-backend

# Activate Architect agent
@architect

# Select command
*create-backend-architecture
```

**Architect will**:

1. **Load system-architecture.md** from Product repo (via `product_repo.path`)
2. Extract backend-specific constraints:
   - APIs to implement (from API Contracts Summary)
   - Auth mechanism (JWT validation)
   - Data format standards (JSON, ISO 8601, pagination)
3. Load PRD for business entities and features
4. **Validate**: All APIs from system-architecture.md are covered
5. Design:
   - Service components (Controllers, Services, Repositories)
   - Database schema (tables, relationships, indexes)
   - API implementation details (request/response schemas)
6. Generate `docs/architecture.md`

**Example Backend Architecture Output**:

````markdown
# Backend Architecture

## System Architecture Context

**⚠️ CONSTRAINTS FROM SYSTEM ARCHITECTURE** (loaded from `../my-ecommerce-product/docs/architecture/system-architecture.md`):

**APIs THIS Backend Must Implement**:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/users/:id
- GET /api/products (paginated, cursor-based)
- GET /api/products/:id
- POST /api/products (Admin only)
- POST /api/orders
- GET /api/orders
- GET /api/orders/:id

**✅ VALIDATION**: All implementation details below align with system architecture constraints.

## Service Components

**Three-Layer Architecture**:

**Controllers** (API Layer):

- AuthController: login(), register(), refresh()
- UserController: getUser()
- ProductController: getProducts(), getProduct(), createProduct()
- OrderController: createOrder(), getOrders(), getOrder()

**Services** (Business Logic):

- AuthService: authenticate(), generateTokens(), refreshToken()
- UserService: findById(), create(), update()
- ProductService: findAll(), findById(), create()
- OrderService: create(), findByUser(), calculateTotal()

**Repositories** (Data Access):

- UserRepository: findById(), findByEmail(), create(), update()
- ProductRepository: findAll(), findById(), create(), update()
- OrderRepository: create(), findByUserId(), findById()

## Database Schema

**users**:

- id: UUID (PK)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- Index: email

**products**:

- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- price: DECIMAL(10,2) NOT NULL
- stock_quantity: INT NOT NULL
- created_at: TIMESTAMP
- Index: name

**orders**:

- id: UUID (PK)
- user_id: UUID (FK → users.id)
- status: ENUM('pending', 'confirmed', 'shipped', 'delivered')
- total_amount: DECIMAL(10,2) NOT NULL
- created_at: TIMESTAMP
- Index: user_id, status

**order_items**:

- id: UUID (PK)
- order_id: UUID (FK → orders.id)
- product_id: UUID (FK → products.id)
- quantity: INT NOT NULL
- unit_price: DECIMAL(10,2) NOT NULL

## API Implementation Details

**POST /api/auth/login**:

Request:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
````

Response (200):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  }
}
```

Error Response (401):

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

````

**Output**: `my-ecommerce-backend/docs/architecture.md` (40-60 pages)

**✅ CHECKPOINT**: Backend architecture is complete and **aligned with system architecture**.

---

### Frontend Repository Setup

```bash
# Create Frontend repo
mkdir my-ecommerce-web
cd my-ecommerce-web
git init

# Install Orchestrix (installs all agents)
npx orchestrix install

# Configure core-config.yaml
cat > core-config.yaml << EOF
project:
  name: My E-Commerce App - Web
  mode: multi-repo
  version: 1.0.0

  multi_repo:
    role: frontend # ← CRITICAL: Set role to frontend
    product_repo_path: ../my-ecommerce-product   # ← CRITICAL: Points to Product repo

document_locations:
  architecture: docs/ui-architecture.md
EOF
````

---

### Step 8: Create Frontend Architecture (Architect)

```bash
cd my-ecommerce-web

# Activate Architect agent
@architect

# Select command
*create-frontend-architecture
```

**Architect will**:

1. **Load system-architecture.md** from Product repo
2. Extract frontend-specific constraints:
   - APIs to consume (from API Contracts Summary)
   - Auth mechanism (token storage: HttpOnly cookies)
   - Data format expectations (JSON, ISO 8601, pagination)
3. Load front-end-spec.md for UI/UX requirements
4. Load PRD for features and user stories (target_platform = frontend)
5. **CRITICAL VALIDATION**: Ensure frontend ONLY calls APIs defined in system-architecture.md
6. Design:
   - Component architecture (pages, shared components, layouts)
   - State management (Zustand, Redux, Context API)
   - Routing (React Router)
   - API integration (Axios with interceptors)
7. Generate `docs/ui-architecture.md`

**Example Frontend Architecture Output**:

````markdown
# Frontend Architecture

## System Architecture Context

**⚠️ CONSTRAINTS FROM SYSTEM ARCHITECTURE** (loaded from `../my-ecommerce-product/docs/architecture/system-architecture.md`):

**APIs This Frontend Can Consume**:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/users/:id
- GET /api/products
- GET /api/products/:id
- POST /api/orders
- GET /api/orders
- GET /api/orders/:id

**Integration Constraints**:

- Authentication: JWT (storage: HttpOnly cookies, refresh every 15 min)
- Data Format: JSON, ISO 8601 dates, cursor pagination
- Error Handling: Display error.message from backend

**✅ CRITICAL VALIDATION**: All API calls consume ONLY APIs defined in system-architecture.md:

- POST /api/auth/login → ✅ Defined
- POST /api/auth/register → ✅ Defined
- POST /api/auth/refresh → ✅ Defined
- GET /api/products → ✅ Defined
- GET /api/products/:id → ✅ Defined
- POST /api/orders → ✅ Defined
- GET /api/orders → ✅ Defined

**No undefined APIs called** ✅

## Component Architecture

**Pages** (8 total):

- HomePage, LoginPage, RegisterPage
- ProductListPage, ProductDetailPage
- CartPage, CheckoutPage
- OrderHistoryPage

**Layouts** (2 total):

- AppLayout (with navbar, footer)
- AuthLayout (centered, no navbar)

**Shared Components** (15 total):

- Button, Input, Modal, Card, Spinner, Toast
- Navbar, Footer, SearchBar, etc.

**Feature Components** (10 total):

- ProductCard, CartItem, OrderSummary
- ProductFilter, ProductGrid, etc.

## State Management

**Solution**: Zustand (lightweight, simple API)

**Global State**:

- Auth Store: user, token, isAuthenticated, login(), logout()
- Cart Store: items, total, addItem(), removeItem()

**Server State**: React Query

- useProducts() - GET /api/products
- useProduct(id) - GET /api/products/:id
- useOrders() - GET /api/orders

## Routing

**React Router v6**:

| Path          | Component         | Protected                  | Layout     |
| ------------- | ----------------- | -------------------------- | ---------- |
| /             | HomePage          | No                         | AppLayout  |
| /login        | LoginPage         | No (redirect if logged in) | AuthLayout |
| /register     | RegisterPage      | No                         | AuthLayout |
| /products     | ProductListPage   | No                         | AppLayout  |
| /products/:id | ProductDetailPage | No                         | AppLayout  |
| /cart         | CartPage          | No                         | AppLayout  |
| /checkout     | CheckoutPage      | Yes                        | AppLayout  |
| /orders       | OrderHistoryPage  | Yes                        | AppLayout  |

## API Integration

**API Client** (Axios + Interceptors):

```typescript
// services/api.client.ts
const apiClient = axios.create({
  baseURL: "https://api.my-ecommerce.com",
  withCredentials: true, // Send cookies
});

// Request interceptor: Refresh token if expired
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      return apiClient(error.config); // Retry original request
    }
    return Promise.reject(error);
  }
);
```
````

**API Services**:

- userService: login(), register(), getUser()
- productService: getProducts(), getProduct()
- orderService: createOrder(), getOrders()

````

**Output**: `my-ecommerce-web/docs/ui-architecture.md` (40-60 pages)

**✅ CHECKPOINT**: Frontend architecture is complete and **aligned with system architecture**. Frontend only calls APIs defined by backend.

---

### Mobile Repository Setup (iOS Example)

```bash
# Create iOS repo
mkdir my-ecommerce-ios
cd my-ecommerce-ios
git init

# Install Orchestrix (installs all agents)
npx orchestrix install

# Configure core-config.yaml
cat > core-config.yaml << EOF
project:
  name: My E-Commerce App - iOS
  mode: multi-repo
  version: 1.0.0

  multi_repo:
    role: ios # ← CRITICAL: Set role to ios
    product_repo_path: ../my-ecommerce-product   # ← CRITICAL: Points to Product repo

document_locations:
  architecture: docs/architecture.md
EOF
````

---

### Step 9: Create Mobile Architecture (Architect)

```bash
cd my-ecommerce-ios

# Activate Architect agent
@architect

# Select command
*create-mobile-architecture
```

**Architect will**:

1. **Load system-architecture.md** from Product repo
2. Extract mobile-specific constraints:
   - APIs to consume
   - Auth mechanism (token storage: Keychain)
   - Security requirements (certificate pinning, biometric auth)
3. Load front-end-spec.md for UI/UX (mobile sections)
4. Load PRD for mobile features (target_platform = ios)
5. **CRITICAL VALIDATION**: Ensure iOS app ONLY calls APIs defined in system-architecture.md
6. Design:
   - App architecture (MVVM with Combine)
   - Screen structure and navigation flow
   - State management (@StateObject, @EnvironmentObject)
   - API integration (URLSession with token refresh)
   - Security (Keychain, certificate pinning)
7. Generate `docs/architecture.md`

**Example Mobile Architecture Output**:

````markdown
# iOS Architecture

## System Architecture Context

**⚠️ CONSTRAINTS FROM SYSTEM ARCHITECTURE** (loaded from `../my-ecommerce-product/docs/architecture/system-architecture.md`):

**APIs This iOS App Can Consume**: [Same as frontend]

**Integration Constraints**:

- Authentication: JWT (storage: Keychain, refresh every 15 min)
- Security: Certificate pinning enabled

**✅ CRITICAL VALIDATION**: All API calls consume ONLY APIs defined in system-architecture.md ✅

## App Architecture

**Pattern**: MVVM (Model-View-ViewModel) with Combine

**Layers**:

- Views (SwiftUI): LoginView, ProductListView, ProductDetailView, etc.
- ViewModels: LoginViewModel, ProductListViewModel, etc.
- Models: User, Product, Order, etc.
- Services: AuthService, ProductService, OrderService
- Repositories: Network layer (URLSession)

## Screen Structure

**Screens** (8 total):

- SplashScreen, LoginScreen, RegisterScreen
- HomeScreen, ProductListScreen, ProductDetailScreen
- CartScreen, CheckoutScreen, OrderHistoryScreen

**Navigation**: SwiftUI NavigationStack

## State Management

**Global State** (@EnvironmentObject):

- AuthViewModel: user, isAuthenticated, login(), logout()
- CartViewModel: items, total, addItem(), removeItem()

**Screen State** (@StateObject):

- ProductListViewModel: products, isLoading, fetchProducts()
- ProductDetailViewModel: product, isLoading, fetchProduct(id:)

## Security

**Secure Token Storage** (Keychain):

```swift
// Store access token in Keychain
KeychainHelper.save(token, for: "access_token")

// Retrieve token
let token = KeychainHelper.load(for: "access_token")
```
````

**Certificate Pinning**:

```swift
// Pin backend certificate
URLSession.shared.delegate = CertificatePinner(
  certificates: ["api.my-ecommerce.com": sha256Pin]
)
```

## Deployment

- **Platform**: iOS 16.0+
- **Distribution**: App Store Connect
- **CI/CD**: Fastlane + GitHub Actions
- **Beta Testing**: TestFlight

````

**Output**: `my-ecommerce-ios/docs/architecture.md` (40-60 pages)

**✅ CHECKPOINT**: iOS architecture is complete and **aligned with system architecture**.

---

## Phase 4: Story Creation & Development

Now that all architectures are in place, start implementing features.

### Step 10: Create Stories (Scrum Master)

**In Backend Repo**:

```bash
cd my-ecommerce-backend

# Activate Scrum Master agent
@sm

# Select command
*create-next-story
````

**SM will**:

1. Load PRD from Product repo (via `product_repo.path`)
2. **Filter stories** where `target_platform = backend`
3. Load `docs/architecture.md` (backend architecture)
4. Create Story 1.1 (User Registration API) referencing architecture
5. Generate `docs/stories/story-1.1.yaml`

**Example Story**:

```yaml
# docs/stories/story-1.1.yaml
story_id: 1.1
title: User Registration API
epic_id: 1
target_platform: backend
status: Approved

description: |
  Implement POST /api/auth/register endpoint for user registration.
  Reference: Backend Architecture Section "API Implementation Details".

acceptance_criteria:
  - AC1: Endpoint accepts email and password in request body
  - AC2: Validates email format and password strength (min 8 chars)
  - AC3: Hashes password using bcrypt
  - AC4: Stores user in database
  - AC5: Returns JWT access_token and refresh_token
  - AC6: Returns 400 if validation fails
  - AC7: Returns 409 if email already exists

technical_requirements:
  - Use NestJS @Controller and @Post decorators
  - Use UserService.create() from architecture
  - Use bcrypt for password hashing
  - Generate JWT with 15min expiration

architecture_context:
  file: docs/architecture.md
  relevant_sections:
    - "API Implementation Details > POST /api/auth/register"
    - "Service Components > AuthService"
    - "Database Schema > users table"
```

---

### Step 11: Implement Story (Dev)

```bash
cd my-ecommerce-backend

# Activate Dev agent
@dev

# Select command
*implement-story 1.1
```

**Dev will**:

1. Load Story 1.1
2. Load architecture context from `docs/architecture.md`
3. Implement the feature:
   - Create `src/auth/auth.controller.ts`
   - Create `src/auth/auth.service.ts`
   - Create `src/users/user.repository.ts`
   - Write tests
4. Update Story status to `Review`

---

### Step 12: Review Story (QA)

```bash
@qa

# Select command
*review 1.1
```

**QA will**:

1. Load Story 1.1
2. Review implementation against AC
3. Run tests
4. If pass: Mark Story as `Done`, create git commit
5. If fail: Mark Story as `InProgress`, list issues for Dev to fix

---

### Step 13: Repeat for Frontend/Mobile

**In Frontend Repo**:

```bash
cd my-ecommerce-web

@sm
*create-next-story  # Creates Story 1.2 (User Registration UI)

@dev
*implement-story 1.2  # Implements registration form

@qa
*review 1.2  # Reviews frontend implementation
```

**In iOS Repo**:

```bash
cd my-ecommerce-ios

@sm
*create-next-story  # Creates Story 1.3 (User Registration Screen)

@dev
*implement-story 1.3  # Implements iOS registration screen

@qa
*review 1.3  # Reviews iOS implementation
```

---

## Best Practices

### 1. Always Create System Architecture First

❌ **Don't**: Create backend/frontend architectures without system architecture
✅ **Do**: Create system-architecture.md first, then create implementation architectures

**Why**: System architecture defines API contracts. Implementation architectures reference these contracts.

---

### 2. Validate API Alignment

**Backend**: Ensure all APIs from system-architecture.md are implemented
**Frontend/Mobile**: Ensure ONLY APIs from system-architecture.md are called

**Architect tasks automatically validate this in Step 3 of architecture generation.**

---

### 3. Use target_platform in PRD

❌ **Don't**: Create stories without specifying target_platform
✅ **Do**: Every story must have `target_platform: backend|frontend|ios|android|mobile`

**Why**: SM needs to filter stories by platform when creating stories in each repo.

---

### 4. Keep Product Repo as Single Source of Truth

**Product Repo** contains:

- PRD (all requirements)
- Front-End Spec (all UI/UX)
- System Architecture (all API contracts)
- Epics (all stories with target_platform)

**Implementation Repos** reference Product Repo via `product_repo.path`.

---

### 5. Commit Frequently

After each story is Done, QA agent automatically creates a git commit:

```bash
# In backend repo
@qa
*review 1.1

# Output:
# ✅ STORY COMPLETE
# 📦 Git Commit: abc123def
# feat(story-1.1): implement user registration API
```

---

## Common Issues

### Issue 1: "System architecture not found"

**Error**:

```
❌ ERROR: System architecture not found at ../my-project-product/docs/architecture/system-architecture.md
```

**Solution**:

1. Verify `product_repo.path` in `core-config.yaml` is correct
2. Verify system architecture exists in Product repo
3. If missing, create it:
   ```bash
   cd ../my-project-product
   @architect
   *create-system-architecture
   ```

---

### Issue 2: "Frontend calls undefined API"

**Error**:

```
❌ VALIDATION FAILED: Frontend needs GET /api/cart but it's not in system-architecture.md
```

**Solution**:

1. **Option A**: Add Cart APIs to system-architecture.md (and implement in backend)
2. **Option B**: Remove Cart feature from frontend (implement client-side only)

**Why this happens**: Frontend architecture generation validates all API calls against system-architecture.md.

---

### Issue 3: "Story doesn't have target_platform"

**Error**:

```
⚠️ WARNING: Story 1.1 missing target_platform field
```

**Solution**:
Update PRD to add `target_platform` to all stories:

```yaml
# In docs/epics/epic-1.yaml
stories:
  - id: 1.1
    title: "User Registration API"
    target_platform: backend  # ← Add this
    ...
```

---

### Issue 4: "Cannot filter stories by platform"

**Error**:

```
SM: No stories found for target_platform=backend
```

**Solution**:
Verify PRD epics have stories with matching `target_platform`:

```bash
cd my-project-product
@pm
# Review docs/epics/*.yaml and add target_platform to all stories
```

---

## Summary

**Greenfield Workflow** (Top-Down):

```
Product Repo:
  Step 1: Analyst → project-brief.md
  Step 2: PM → prd.md (with target_platform for each story)
  Step 3: UX-Expert → front-end-spec.md
  Step 4: Architect → system-architecture.md (API contracts, integration strategy)
  Step 5: PM → Update prd.md (optional)
  Step 6: PO → Validate consistency

Backend Repo:
  Step 7: Architect → architecture.md (references system-architecture.md)
  Step 10: SM → Create stories (filtered by target_platform=backend)
  Step 11: Dev → Implement stories
  Step 12: QA → Review stories

Frontend Repo:
  Step 8: Architect → ui-architecture.md (references system-architecture.md)
  Step 10: SM → Create stories (filtered by target_platform=frontend)
  Step 11: Dev → Implement stories
  Step 12: QA → Review stories

iOS Repo:
  Step 9: Architect → architecture.md (references system-architecture.md)
  Step 10: SM → Create stories (filtered by target_platform=ios)
  Step 11: Dev → Implement stories
  Step 12: QA → Review stories
```

**Key Success Factors**:

- ✅ System-First: Create system architecture before implementation architectures
- ✅ API Alignment: Backend defines APIs, Frontend/Mobile consume APIs
- ✅ target_platform: Specify for every story in PRD
- ✅ Product Repo: Single source of truth for requirements
- ✅ Validation: Automatic validation at each step prevents misalignment

---

## Next Steps

1. Try the [Multi-Repository Brownfield Guide](./MULTI_REPO_BROWNFIELD_GUIDE.md) for existing projects
2. Read the [Core Architecture](./02-核心架构.md) for deep technical details
3. See [Workflow Guide](./03-工作流程指南.md) for advanced workflow patterns

---

**Questions or Issues?**

- GitHub Issues: https://github.com/anthropics/orchestrix/issues
- Documentation: https://github.com/anthropics/orchestrix/tree/main/docs
