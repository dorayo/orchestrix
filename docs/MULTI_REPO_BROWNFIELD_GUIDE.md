# Multi-Repository Brownfield Development Guide

> **Brownfield**: Working with existing codebases across multiple repositories that need architecture documentation.

This guide walks you through the Orchestrix workflow for documenting and coordinating existing multi-repository projects using **bottom-up aggregation**.

---

**📖 Looking for something else?**

If you want to **add significant features to a single existing project**, see the [Brownfield Enhancement Guide](./BROWNFIELD_ENHANCEMENT_GUIDE.md) instead.

This guide is specifically for **documenting and coordinating multiple existing repositories**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Brownfield vs Greenfield](#brownfield-vs-greenfield)
- [Prerequisites](#prerequisites)
- [Phase 1: Document Implementation Repositories](#phase-1-document-implementation-repositories)
- [Phase 2: Aggregate System Architecture](#phase-2-aggregate-system-architecture)
- [Phase 3: Extract and Validate API Contracts](#phase-3-extract-and-validate-api-contracts)
- [Phase 4: Create PRD from Architecture](#phase-4-create-prd-from-architecture)
- [Best Practices](#best-practices)
- [Common Issues](#common-issues)

---

## Overview

**Brownfield Workflow** follows a **bottom-up approach**:

1. **Implementation Repos**: Document existing architecture from code
2. **Product Repo**: Aggregate system-level architecture from implementation repos
3. **Product Repo**: Extract API contracts and validate alignment
4. **Product Repo**: Create PRD from documented architecture (optional)

**Key Benefits**:

- ✅ Document existing systems quickly
- ✅ Identify architectural gaps and inconsistencies
- ✅ Validate API alignment across repos
- ✅ Create foundation for future feature development

---

## Brownfield vs Greenfield

| Aspect                  | Greenfield                         | Brownfield                                |
| ----------------------- | ---------------------------------- | ----------------------------------------- |
| **Direction**           | Top-Down                           | Bottom-Up                                 |
| **Starting Point**      | Requirements → Architecture → Code | Code → Architecture → Documentation       |
| **System Architecture** | Created first in Product repo      | Aggregated last from Implementation repos |
| **API Contracts**       | Defined before implementation      | Extracted from existing code              |
| **Use Case**            | New projects                       | Existing projects                         |
| **Goal**                | Guide implementation               | Document existing system                  |

---

## Prerequisites

You have existing repositories with code but missing architecture documentation:

```
existing-app-backend/          # Backend code exists
├── src/
│   ├── controllers/
│   ├── services/
│   └── repositories/
├── package.json
└── README.md                  # Minimal docs

existing-app-web/              # Frontend code exists
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
├── package.json
└── README.md

existing-app-ios/              # iOS code exists
├── MyApp/
│   ├── Views/
│   ├── ViewModels/
│   └── Services/
└── MyApp.xcodeproj

# No Product repo yet!
```

---

## Phase 1: Document Implementation Repositories

First, generate architecture documentation for each implementation repository.

### Step 1: Setup Backend Repo

```bash
cd existing-app-backend

# Install Orchestrix (installs all agents)
npx orchestrix install

# Create core-config.yaml
cat > core-config.yaml << EOF
project:
  name: Existing App - Backend
  type: backend
  version: 1.0.0

document_locations:
  architecture: docs/brownfield-architecture.md
EOF
```

**Note**: Do NOT set `product_repo.path` yet (Product repo doesn't exist).

---

### Step 2: Document Backend Architecture (Architect)

```bash
cd existing-app-backend

# Activate Architect agent
@architect

# Select command
*document-project
```

**Architect will**:

1. Analyze existing codebase:
   - Detect tech stack (Node.js + NestJS + PostgreSQL)
   - Identify architecture pattern (MVC, Clean Architecture, etc.)
   - Scan route files for API endpoints
   - Analyze database schema (migrations, models)
2. Interview user about:
   - Authentication mechanism
   - Data format conventions
   - Deployment platform
3. Generate `docs/brownfield-architecture.md`

**Example Brownfield Backend Architecture**:

````markdown
# Backend Architecture (Brownfield)

> **Status**: Reverse-engineered from existing codebase on 2025-01-14

## Tech Stack (Detected)

| Category  | Technology | Version |
| --------- | ---------- | ------- |
| Language  | TypeScript | 5.3.3   |
| Runtime   | Node.js    | 20.11.0 |
| Framework | NestJS     | 10.3.2  |
| Database  | PostgreSQL | 15.5    |
| ORM       | TypeORM    | 0.3.20  |

## Architecture Pattern (Detected)

**Three-Layer Architecture (MVC)**:

- Controllers: `src/*/\*.controller.ts` (14 controllers)
- Services: `src/*/\*.service.ts` (18 services)
- Repositories: TypeORM entities (10 entities)

## API Endpoints (Detected from Routes)

**Authentication & User APIs**:

- POST /api/auth/login (`AuthController.login()`)
- POST /api/auth/register (`AuthController.register()`)
- POST /api/auth/refresh (`AuthController.refresh()`)
- GET /api/users/:id (`UserController.getUser()`)
- PUT /api/users/:id (`UserController.updateUser()`)

**Product APIs**:

- GET /api/products (`ProductController.getProducts()`)
  - Query params: ?page=1&limit=20 (offset pagination)
- GET /api/products/:id (`ProductController.getProduct()`)
- POST /api/products (`ProductController.createProduct()`, Admin only)
- PUT /api/products/:id (`ProductController.updateProduct()`, Admin only)
- DELETE /api/products/:id (`ProductController.deleteProduct()`, Admin only)

**Order APIs**:

- POST /api/orders (`OrderController.createOrder()`)
- GET /api/orders (`OrderController.getOrders()`)
  - Query params: ?userId=xxx
- GET /api/orders/:id (`OrderController.getOrder()`)
- PUT /api/orders/:id/status (`OrderController.updateStatus()`, Admin only)

**Total**: 13 endpoints

## Authentication (Detected)

**Mechanism**: JWT (JSON Web Tokens)

- Access Token Lifetime: 15 minutes (from code)
- Refresh Token Lifetime: 7 days (from code)
- Token Storage: Not specified (client responsibility)
- Authorization: Bearer token in `Authorization` header

## Data Format (Detected)

**Content-Type**: application/json
**Date Format**: ISO 8601 (detected in TypeORM entities)
**Pagination**: Offset-based (`page`, `limit`)

**Example Response**:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```
````

## Database Schema (Detected)

**Tables** (from TypeORM migrations):

**users**:

- id: UUID (PK)
- email: VARCHAR(255) UNIQUE NOT NULL
- password_hash: VARCHAR(255) NOT NULL
- role: ENUM('user', 'admin')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

**products**:

- id: UUID (PK)
- name: VARCHAR(255) NOT NULL
- description: TEXT
- price: DECIMAL(10,2) NOT NULL
- stock_quantity: INT NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

**orders**:

- id: UUID (PK)
- user_id: UUID (FK → users.id)
- status: ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
- total_amount: DECIMAL(10,2) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

**order_items**:

- id: UUID (PK)
- order_id: UUID (FK → orders.id)
- product_id: UUID (FK → products.id)
- quantity: INT NOT NULL
- unit_price: DECIMAL(10,2) NOT NULL

## Deployment (User Provided)

- Platform: AWS ECS (Docker containers)
- Database: AWS RDS PostgreSQL
- Load Balancer: AWS ALB
- CI/CD: GitHub Actions

## Gaps and Recommendations

**Gaps Identified**:

1. ⚠️ No API documentation (OpenAPI/Swagger)
2. ⚠️ Inconsistent error response format (some endpoints return different structures)
3. ⚠️ No rate limiting
4. ⚠️ No API versioning strategy

**Recommendations**:

1. Generate OpenAPI specification from routes
2. Standardize error response format
3. Add rate limiting middleware
4. Implement API versioning (e.g., /api/v1/)

````

**Output**: `existing-app-backend/docs/brownfield-architecture.md` (30-50 pages)

---

### Step 3: Document Frontend Architecture (Architect)

```bash
cd existing-app-web

# Install Orchestrix (installs all agents)
npx orchestrix install

# Create core-config.yaml
cat > core-config.yaml << EOF
project:
  name: Existing App - Web
  type: frontend
  version: 1.0.0

document_locations:
  architecture: docs/brownfield-architecture.md
EOF

# Document architecture
@architect
*document-project
````

**Architect will**:

1. Analyze existing codebase:
   - Detect tech stack (React + TypeScript + Vite)
   - Identify architecture pattern (Component-based, hooks)
   - Scan components for API calls
   - Identify state management (Zustand, Redux, Context API)
2. Interview user about:
   - Authentication strategy
   - API base URL
   - Deployment platform
3. Generate `docs/brownfield-architecture.md`

**Example Brownfield Frontend Architecture**:

```markdown
# Frontend Architecture (Brownfield)

> **Status**: Reverse-engineered from existing codebase on 2025-01-14

## Tech Stack (Detected)

| Category         | Technology   | Version |
| ---------------- | ------------ | ------- |
| Framework        | React        | 18.2.0  |
| Language         | TypeScript   | 5.3.3   |
| Build Tool       | Vite         | 5.0.10  |
| State Management | Zustand      | 4.5.0   |
| Routing          | React Router | 6.21.1  |
| HTTP Client      | Axios        | 1.6.5   |
| UI Library       | Material-UI  | 5.15.3  |

## Component Architecture (Detected)

**Pages** (8 detected in `src/pages/`):

- HomePage, LoginPage, RegisterPage
- ProductListPage, ProductDetailPage
- CartPage, CheckoutPage
- OrderHistoryPage

**Shared Components** (25 detected in `src/components/`):

- Button, Input, Modal, Card, Spinner, Toast
- Navbar, Footer, SearchBar, Pagination
- ProductCard, CartItem, OrderSummary, etc.

## State Management (Detected)

**Solution**: Zustand (detected in `src/stores/`)

**Stores** (3 detected):

- `auth.store.ts`: user, isAuthenticated, login(), logout()
- `cart.store.ts`: items, total, addItem(), removeItem(), clearCart()
- `ui.store.ts`: theme, language, showToast()

## Routing (Detected)

**React Router v6** (from `src/App.tsx`):

| Path          | Component         | Protected |
| ------------- | ----------------- | --------- |
| /             | HomePage          | No        |
| /login        | LoginPage         | No        |
| /register     | RegisterPage      | No        |
| /products     | ProductListPage   | No        |
| /products/:id | ProductDetailPage | No        |
| /cart         | CartPage          | No        |
| /checkout     | CheckoutPage      | Yes       |
| /orders       | OrderHistoryPage  | Yes       |

**Protected Routes**: Implemented via `<ProtectedRoute>` wrapper

## API Integration (Detected)

**API Base URL**: `https://api.existing-app.com` (from `.env.production`)

**API Calls Detected** (from `src/services/`):

**Authentication & User APIs**:

- POST /api/auth/login (`userService.login()`)
- POST /api/auth/register (`userService.register()`)
- POST /api/auth/refresh (`userService.refresh()`)
- GET /api/users/:id (`userService.getUser()`)

**Product APIs**:

- GET /api/products (`productService.getProducts()`)
  - Used in: ProductListPage
- GET /api/products/:id (`productService.getProduct()`)
  - Used in: ProductDetailPage

**Order APIs**:

- POST /api/orders (`orderService.createOrder()`)
  - Used in: CheckoutPage
- GET /api/orders (`orderService.getOrders()`)
  - Used in: OrderHistoryPage
- GET /api/orders/:id (`orderService.getOrder()`)
  - Used in: OrderDetailPage

**Cart APIs** ⚠️:

- ❌ GET /api/cart - **NOT FOUND in backend** (Cart is client-side only)
- ❌ POST /api/cart/items - **NOT FOUND in backend**

**Total**: 9 API calls (2 undefined in backend)

## Authentication (Detected)

**Token Storage**: localStorage (detected in `auth.store.ts`)

- `access_token` stored in localStorage
- `refresh_token` stored in localStorage

**Token Refresh**: Automatic (Axios interceptor in `api.client.ts`)

- Intercepts 401 responses
- Calls POST /api/auth/refresh
- Retries original request

## Deployment (User Provided)

- Platform: Vercel
- Build Command: `npm run build`
- Output Directory: `dist`

## Gaps and Recommendations

**Gaps Identified**:

1. ⚠️ Cart APIs called but don't exist in backend (client-side cart only)
2. ⚠️ Token storage in localStorage (insecure for XSS attacks)
3. ⚠️ No API error boundary (crashes on network errors)
4. ⚠️ No loading states for API calls

**Recommendations**:

1. Document that Cart is client-side only OR add Cart APIs to backend
2. Move to HttpOnly cookies for token storage
3. Add ErrorBoundary component
4. Add consistent loading states (Suspense, skeleton screens)
```

**Output**: `existing-app-web/docs/brownfield-architecture.md` (30-50 pages)

---

### Step 4: Document iOS Architecture (Architect)

```bash
cd existing-app-ios

# Install Orchestrix (installs all agents)
npx orchestrix install

# Create core-config.yaml
cat > core-config.yaml << EOF
project:
  name: Existing App - iOS
  type: ios
  version: 1.0.0

document_locations:
  architecture: docs/brownfield-architecture.md
EOF

# Document architecture
@architect
*document-project
```

**Architect will**:

1. Analyze existing iOS codebase
2. Generate `docs/brownfield-architecture.md`

**Output**: `existing-app-ios/docs/brownfield-architecture.md` (30-50 pages)

---

## Phase 2: Aggregate System Architecture

Now create a Product repository and aggregate system architecture from implementation repos.

### Step 5: Create Product Repository

```bash
# Create Product repo
mkdir existing-app-product
cd existing-app-product
git init

# Install Orchestrix (installs all agents)
npx orchestrix install

# Create core-config.yaml
cat > core-config.yaml << EOF
project:
  name: Existing App
  type: product-planning
  version: 1.0.0

# List implementation repositories
implementation_repos:
  - path: ../existing-app-backend
    type: backend
  - path: ../existing-app-web
    type: frontend
  - path: ../existing-app-ios
    type: ios

document_locations:
  architecture: docs/architecture/system-architecture.md
EOF
```

---

### Step 6: Aggregate System Architecture (Architect)

```bash
cd existing-app-product

# Activate Architect agent
@architect

# Select command
*aggregate-system-architecture
```

**Architect will**:

1. Read brownfield-architecture.md from each implementation repo
2. Extract system-level information:
   - Repository topology
   - Tech stacks
   - API endpoints (from backend)
   - API calls (from frontend/iOS)
   - Authentication mechanism
   - Data format standards
   - Deployment platforms
3. Identify gaps and inconsistencies:
   - APIs called by frontend/iOS but not provided by backend
   - APIs provided by backend but not used by any client
   - Inconsistent authentication mechanisms
   - Inconsistent data formats
4. Generate `docs/architecture/system-architecture.md`

**Example Aggregated System Architecture**:

````markdown
# System Architecture (Aggregated from Brownfield)

> **Status**: Aggregated from 3 implementation repositories on 2025-01-14

## Repository Topology

| Repository           | Type           | Tech Stack                    | Status        |
| -------------------- | -------------- | ----------------------------- | ------------- |
| existing-app-backend | Backend        | Node.js + NestJS + PostgreSQL | ✅ Documented |
| existing-app-web     | Frontend (Web) | React + TypeScript + Vite     | ✅ Documented |
| existing-app-ios     | Mobile (iOS)   | Swift + SwiftUI               | ✅ Documented |

## API Contracts Summary

**Backend Provides** (13 endpoints):

**Authentication & User APIs**:

- POST /api/auth/login - User login
- POST /api/auth/register - User registration
- POST /api/auth/refresh - Refresh access token
- GET /api/users/:id - Get user profile
- PUT /api/users/:id - Update user profile

**Product APIs**:

- GET /api/products - List products (paginated)
- GET /api/products/:id - Get product details
- POST /api/products - Create product (Admin only)
- PUT /api/products/:id - Update product (Admin only)
- DELETE /api/products/:id - Delete product (Admin only)

**Order APIs**:

- POST /api/orders - Create order
- GET /api/orders - List orders (filtered by userId)
- GET /api/orders/:id - Get order details

**Frontend Consumes** (9 endpoints):

- ✅ POST /api/auth/login
- ✅ POST /api/auth/register
- ✅ POST /api/auth/refresh
- ✅ GET /api/users/:id
- ✅ GET /api/products
- ✅ GET /api/products/:id
- ✅ POST /api/orders
- ✅ GET /api/orders
- ✅ GET /api/orders/:id

**iOS Consumes** (9 endpoints):

- ✅ POST /api/auth/login
- ✅ POST /api/auth/register
- ✅ POST /api/auth/refresh
- ✅ GET /api/users/:id
- ✅ GET /api/products
- ✅ GET /api/products/:id
- ✅ POST /api/orders
- ✅ GET /api/orders
- ✅ GET /api/orders/:id

## Integration Strategy

**Authentication**:

- Mechanism: JWT (JSON Web Tokens)
- Access Token Lifetime: 15 minutes
- Refresh Token Lifetime: 7 days
- Token Storage:
  - Web: localStorage (⚠️ Security risk - recommend HttpOnly cookies)
  - iOS: Keychain ✅

**Data Format**:

- Content-Type: application/json
- Date Format: ISO 8601
- Pagination: Offset-based (`page`, `limit`)

**Error Handling**:

- Error Response Format:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
  }
  ```
````

- HTTP Status Codes: 400, 401, 403, 404, 500

## Deployment Architecture

- **Backend**: AWS ECS (Docker) + RDS PostgreSQL + ALB
- **Frontend**: Vercel (Static site)
- **iOS**: App Store (TestFlight for beta)
- **CI/CD**: GitHub Actions (all repos)

## Gaps and Inconsistencies

**API Alignment**:

- ✅ All frontend API calls are provided by backend
- ✅ All iOS API calls are provided by backend
- ⚠️ Backend provides 4 APIs not used by any client:
  - PUT /api/users/:id
  - POST /api/products (Admin API)
  - PUT /api/products/:id (Admin API)
  - DELETE /api/products/:id (Admin API)

**Authentication**:

- ⚠️ Inconsistent token storage:
  - Web: localStorage (security risk)
  - iOS: Keychain (secure)
  - **Recommendation**: Move Web to HttpOnly cookies

**Data Format**:

- ✅ Consistent: All repos use JSON + ISO 8601
- ⚠️ Pagination inconsistency:
  - Backend: Offset-based (`page`, `limit`)
  - iOS: Expects cursor-based (not implemented yet)
  - **Recommendation**: Document offset pagination as standard OR migrate to cursor

**Error Handling**:

- ⚠️ Inconsistent error response format:
  - Most endpoints: `{ statusCode, message, error }`
  - Some endpoints: `{ error: { code, message } }`
  - **Recommendation**: Standardize to one format

## Recommendations

**High Priority**:

1. 🔴 Fix Web token storage (move to HttpOnly cookies)
2. 🔴 Standardize error response format across all backend endpoints
3. 🟡 Document unused Admin APIs (or remove if not needed)
4. 🟡 Align pagination strategy (offset vs cursor)

**Medium Priority**: 5. 🟢 Generate OpenAPI specification from backend routes 6. 🟢 Add API rate limiting 7. 🟢 Implement API versioning (e.g., /api/v1/)

**Low Priority**: 8. ⚪ Add ErrorBoundary in Web app 9. ⚪ Add loading states in Web app 10. ⚪ Consider adding Cart APIs to backend (currently client-side only)

````

**Output**: `existing-app-product/docs/architecture/system-architecture.md` (20-30 pages)

---

## Phase 3: Extract and Validate API Contracts

Now extract API contracts and validate alignment.

### Step 7: Extract API Contracts (Architect)

```bash
cd existing-app-product

@architect
*extract-api-contracts
````

**Architect will**:

1. Scan backend code for route definitions
2. Extract endpoint details:
   - Method, path, params
   - Request/response schemas
   - Authentication requirements
3. Scan frontend/iOS code for API calls
4. Cross-validate:
   - APIs called by clients exist in backend
   - APIs provided by backend are used by clients
5. Generate `docs/architecture/api-contracts.md`

**Example API Contracts Document**:

````markdown
# API Contracts

> **Status**: Extracted from backend code on 2025-01-14

## Backend APIs (Extracted from Code)

### POST /api/auth/login

**File**: `src/auth/auth.controller.ts:25`

**Request**:

```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars)"
}
```
````

**Response (200)**:

```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string (JWT)",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "user | admin"
  }
}
```

**Error Response (401)**:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Authentication**: None (public endpoint)

**Consumed by**:

- ✅ Web: `src/services/user.service.ts:10`
- ✅ iOS: `Services/AuthService.swift:45`

---

### GET /api/products

**File**: `src/products/product.controller.ts:40`

**Query Parameters**:

- `page`: number (optional, default: 1)
- `limit`: number (optional, default: 20, max: 100)

**Response (200)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "price": number,
      "stock_quantity": number,
      "created_at": "ISO 8601"
    }
  ],
  "meta": {
    "page": number,
    "limit": number,
    "total": number
  }
}
```

**Authentication**: None (public endpoint)

**Consumed by**:

- ✅ Web: `src/services/product.service.ts:20`
- ✅ iOS: `Services/ProductService.swift:30`

---

### PUT /api/users/:id

**File**: `src/users/user.controller.ts:60`

**Authentication**: Required (JWT, same user or admin)

**Consumed by**:

- ❌ **NOT USED** by any client

**Recommendation**: Document or consider removing

---

## Frontend API Calls (Extracted from Code)

**Web**:

- POST /api/auth/login (`src/services/user.service.ts:10`) → ✅ Backend provides
- POST /api/auth/register (`src/services/user.service.ts:25`) → ✅ Backend provides
- POST /api/auth/refresh (`src/services/user.service.ts:40`) → ✅ Backend provides
- GET /api/users/:id (`src/services/user.service.ts:55`) → ✅ Backend provides
- GET /api/products (`src/services/product.service.ts:20`) → ✅ Backend provides
- GET /api/products/:id (`src/services/product.service.ts:35`) → ✅ Backend provides
- POST /api/orders (`src/services/order.service.ts:15`) → ✅ Backend provides
- GET /api/orders (`src/services/order.service.ts:30`) → ✅ Backend provides
- GET /api/orders/:id (`src/services/order.service.ts:45`) → ✅ Backend provides

**Total**: 9 API calls, **9 aligned** ✅

**iOS**:

- [Similar list]
  **Total**: 9 API calls, **9 aligned** ✅

## Validation Summary

**✅ API Alignment**: 100%

- All frontend API calls exist in backend
- All iOS API calls exist in backend
- No undefined APIs called

**⚠️ Unused APIs**: 4

- PUT /api/users/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id

**Recommendations**:

1. Document unused Admin APIs (or remove if truly unused)
2. Consider adding API usage tracking

````

**Output**: `existing-app-product/docs/architecture/api-contracts.md` (15-25 pages)

---

## Phase 4: Create PRD from Architecture

Optionally, create a PRD from the documented architecture to guide future development.

### Step 8: Create Brownfield PRD (PM)

```bash
cd existing-app-product

@pm
*create-doc brownfield-prd-tmpl.yaml
````

**PM will**:

1. Load system-architecture.md
2. Load api-contracts.md
3. Interview user about:
   - Product goals and vision
   - Target users
   - Competitive landscape
   - Feature priorities
4. Generate PRD based on existing architecture

**Brownfield PRD Structure**:

```markdown
# PRD (Brownfield)

## Executive Summary

This PRD documents the existing E-Commerce App as of 2025-01-14, based on reverse-engineered architecture.

## Current Features

**1. User Authentication**

- User registration (email + password)
- User login (JWT tokens)
- Token refresh (automatic)
- User profile management

**2. Product Catalog**

- Browse products (paginated list)
- View product details
- Search products (to be implemented)

**3. Order Management**

- Create orders
- View order history
- View order details

**4. Shopping Cart**

- Add/remove items (client-side only, no backend)
- View cart
- Proceed to checkout

## Architecture Context

**Implementation Status**: Brownfield (existing codebase)
**System Architecture**: docs/architecture/system-architecture.md
**API Contracts**: docs/architecture/api-contracts.md

**Repository Structure**: Multi-repository

- Backend: existing-app-backend
- Frontend (Web): existing-app-web
- Mobile (iOS): existing-app-ios

## Future Epics (Priority Order)

**Epic 1: Fix Security Issues** (High Priority)

- Story 1.1: Move Web token storage to HttpOnly cookies
- Story 1.2: Implement CSRF protection
- Story 1.3: Add rate limiting

**Epic 2: Standardize Error Handling** (High Priority)

- Story 2.1: Standardize error response format
- Story 2.2: Add ErrorBoundary in Web app
- Story 2.3: Add consistent error messages

**Epic 3: Add Product Search** (Medium Priority)

- Story 3.1: Backend: Add product search endpoint
- Story 3.2: Web: Add search bar to ProductListPage
- Story 3.3: iOS: Add search functionality

**Epic 4: Server-Side Shopping Cart** (Medium Priority)

- Story 4.1: Backend: Add Cart APIs
- Story 4.2: Web: Migrate to server-side cart
- Story 4.3: iOS: Migrate to server-side cart

...
```

**Output**: `existing-app-product/docs/prd.md` (40-60 pages)

---

## Best Practices

### 1. Document Implementation Repos First

✅ **Do**: Document each implementation repo independently
❌ **Don't**: Try to create system architecture without implementation docs

**Why**: Bottom-up aggregation needs detailed architecture from each repo.

---

### 2. Configure implementation_repos in Product Repo

```yaml
# In existing-app-product/core-config.yaml
implementation_repos:
  - path: ../existing-app-backend
    type: backend
  - path: ../existing-app-web
    type: frontend
  - path: ../existing-app-ios
    type: ios
```

**Why**: Architect agent needs to know which repos to scan for aggregation.

---

### 3. Review and Validate Gaps

After aggregation, **carefully review** the Gaps and Recommendations section:

- API alignment issues
- Security vulnerabilities
- Inconsistent patterns
- Unused code

**Create stories to fix critical issues before adding new features.**

---

### 4. Link Implementation Repos to Product Repo

After system architecture is created, update implementation repos:

```bash
cd existing-app-backend

# Edit core-config.yaml
cat >> core-config.yaml << EOF

product_repo:
  path: ../existing-app-product
EOF
```

**Why**: Future stories in implementation repos can reference system-architecture.md.

---

## Common Issues

### Issue 1: "No brownfield-architecture.md found"

**Error**:

```
❌ ERROR: No architecture docs found in implementation repos
```

**Solution**:

1. Run `*document-project` in each implementation repo first
2. Verify `docs/brownfield-architecture.md` exists
3. Then run `*aggregate-system-architecture` in Product repo

---

### Issue 2: "API calls don't match backend"

**Warning**:

```
⚠️ Frontend calls GET /api/cart but backend doesn't provide it
```

**Solution**:

1. **Option A**: Add Cart APIs to backend (make cart server-side)
2. **Option B**: Document that cart is client-side only
3. Update system-architecture.md with the decision

---

### Issue 3: "Token storage security risk"

**Warning**:

```
⚠️ Web stores tokens in localStorage (XSS vulnerability)
```

**Solution**:

1. Create Story: "Migrate Web token storage to HttpOnly cookies"
2. Update backend to return tokens in HttpOnly cookies
3. Update frontend to remove localStorage token handling
4. Test token refresh flow

---

## Summary

**Brownfield Workflow** (Bottom-Up):

```
Implementation Repos:
  Step 1: Setup Backend repo
  Step 2: Architect → brownfield-architecture.md (backend)
  Step 3: Setup Frontend repo
  Step 4: Architect → brownfield-architecture.md (frontend)
  Step 5: Setup iOS repo
  Step 6: Architect → brownfield-architecture.md (iOS)

Product Repo:
  Step 7: Setup Product repo (configure implementation_repos)
  Step 8: Architect → Aggregate system-architecture.md
  Step 9: Architect → Extract api-contracts.md
  Step 10: PM → Create brownfield PRD (optional)

Next Steps:
  - Review gaps and create fix stories
  - Link implementation repos to Product repo
  - Start using Orchestrix for new features
```

**Key Success Factors**:

- ✅ Bottom-Up: Document implementation repos first, then aggregate
- ✅ Validation: Automatic validation identifies gaps and inconsistencies
- ✅ API Contracts: Extracted from code, validated across repos
- ✅ Future-Ready: PRD guides future development with existing context

---

## Next Steps

1. Try the [Multi-Repository Greenfield Guide](./MULTI_REPO_GREENFIELD_GUIDE.md) for new features
2. Read the [Core Architecture](./02-核心架构.md) for deep technical details
3. See [Workflow Guide](./03-工作流程指南.md) for advanced workflow patterns

---

**Questions or Issues?**

- GitHub Issues: https://github.com/anthropics/orchestrix/issues
- Documentation: https://github.com/anthropics/orchestrix/tree/main/docs
