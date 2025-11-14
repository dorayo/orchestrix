# Brownfield Project Enhancement Guide

> **Brownfield Enhancement**: Adding significant features or improvements to an existing codebase.

This guide walks you through the Orchestrix workflow for planning and implementing substantial enhancements to existing projects.

---

## 📋 Table of Contents

- [When to Use This Guide](#when-to-use-this-guide)
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [The 3-Step Enhancement Workflow](#the-3-step-enhancement-workflow)
  - [Step 1: Analyze Existing System](#step-1-analyze-existing-system)
  - [Step 2: Define Enhancement Requirements](#step-2-define-enhancement-requirements)
  - [Step 3: Design Enhancement Architecture](#step-3-design-enhancement-architecture)
- [After Architecture: Development Phase](#after-architecture-development-phase)
- [Document Roles Explained](#document-roles-explained)
- [Best Practices](#best-practices)
- [Common Scenarios](#common-scenarios)

---

## When to Use This Guide

Use this guide when you want to add **significant features** or make **substantial improvements** to an existing project:

✅ **Use this workflow when**:

- Enhancement requires multiple stories (3+ stories)
- Architectural planning is needed
- Risk assessment and mitigation planning is necessary
- You want to improve coding standards for new code
- Significant integration work is required

❌ **Skip this workflow when**:

- Simple bug fixes or minor features (1-2 stories)
- No architectural changes required
- Low risk, isolated changes

For simple changes, use `@po *create-epic` or `@po *create-story` directly.

---

## Overview

### Key Philosophy

**Brownfield Enhancement follows a principled 3-step approach**:

1. **Understand Reality**: Document the existing system **as-is** (including technical debt)
2. **Define Goals**: Specify what enhancements to build based on reality
3. **Design Future**: Create architecture with **improved standards** for new code

### Why 3 Documents?

| Document                      | Purpose                      | Describes              | Quality Standards                   |
| ----------------------------- | ---------------------------- | ---------------------- | ----------------------------------- |
| `existing-system-analysis.md` | **Understand current state** | What EXISTS (honestly) | As-is (may be poor)                 |
| `prd.md`                      | **Define what to build**     | What to ADD/CHANGE     | Requirements-focused                |
| `architecture.md`             | **Guide implementation**     | HOW to build it        | **Improved** (better than existing) |

**Critical Insight**: If existing code has poor coding standards, `existing-system-analysis.md` documents that reality, but `architecture.md` defines **better** standards for new code!

---

## Prerequisites

- Existing codebase with code
- IDE or access to project files
- Understanding of what enhancement you want to build

---

## The 3-Step Enhancement Workflow

### Step 1: Analyze Existing System

**Agent**: `@architect`
**Command**: `*document-project`
**Output**: `docs/existing-system-analysis.md`

#### Purpose

Create an **intermediate analysis document** that captures the **real state** of your existing system.

#### What It Documents

- ✅ Current tech stack and versions (as-is)
- ✅ Actual project structure
- ✅ Real coding standards (including poor practices if they exist)
- ✅ Technical debt and known issues
- ✅ Gaps and recommendations for improvement

#### Key Points

- 📝 This is a **中间文档** (intermediate document) for understanding, not for development
- 🚫 **NOT sharded** - not broken into smaller files
- 🚫 **NOT loaded by Dev agents** - not used directly for coding
- ✅ **Used as input** for Step 2 and Step 3

#### Example Interaction

```bash
# In your IDE
@architect *document-project
```

The architect will:

1. Analyze your codebase
2. Ask clarifying questions
3. Generate comprehensive analysis
4. Save to `docs/existing-system-analysis.md`

**Important**: If your existing code has poor test coverage or messy coding standards, **that's OK**! Document it honestly. You'll improve it in Step 3.

---

### Step 2: Define Enhancement Requirements

**Agent**: `@pm`
**Command**: `*create-doc brownfield-prd-tmpl.yaml`
**Output**: `docs/prd.md`

#### Purpose

Define **what** to build based on your understanding of the existing system.

#### Prerequisites

- ✅ **REQUIRED**: `docs/existing-system-analysis.md` (from Step 1)

If missing, PM will HALT and tell you to run Step 1 first.

#### What It Defines

- Enhancement goals and background
- Functional requirements (what features to add)
- Non-functional requirements (performance, security, etc.)
- Compatibility requirements (what must remain unchanged)
- User stories (high-level scenarios)

#### Key Points

- 📚 References `existing-system-analysis.md` for context
- ⚖️ Balances new features with existing constraints
- 🎯 Focuses on **what** to build, not **how**

#### Example Interaction

```bash
@pm *create-doc brownfield-prd-tmpl.yaml
```

The PM will:

1. Load `docs/existing-system-analysis.md`
2. Ask about enhancement goals
3. Define requirements based on existing system constraints
4. Generate PRD
5. Save to `docs/prd.md`

---

### Step 3: Design Enhancement Architecture

**Agent**: `@architect`
**Command**: `*create-doc brownfield-architecture-tmpl.yaml`
**Output**: `docs/architecture.md`

#### Purpose

Design **how** to build the enhancement with **improved standards**.

#### Prerequisites

- ✅ **REQUIRED**: `docs/prd.md` (from Step 2)
- ✅ **REQUIRED**: `docs/existing-system-analysis.md` (from Step 1)

If missing, Architect will HALT and tell you to complete previous steps.

#### What It Defines

- 🎯 Enhancement scope and integration strategy
- 📦 Tech stack (usually same as existing, with improvements)
- 🗂️ Source tree (where new code goes)
- ✨ **Improved coding standards** (better than existing!)
- 🏗️ Component architecture
- 🔌 API design
- 🧪 Testing strategy (higher coverage if existing is low)

#### Key Points

- 🚀 **This is the final architecture document** that Dev uses
- 📈 Can and SHOULD improve upon poor existing practices
- 🔗 Maintains compatibility where necessary
- ✅ Will be sharded by PO for Dev to load

#### Example Interaction

```bash
@architect *create-doc brownfield-architecture-tmpl.yaml
```

The Architect will:

1. Load `docs/prd.md` and `docs/existing-system-analysis.md`
2. Identify existing system constraints
3. Design enhancement architecture with **improved standards**
4. Generate architecture document
5. Save to `docs/architecture.md`

**Example Improvement**: If existing code has 40% test coverage, architect defines 80% coverage requirement for new code!

---

## After Architecture: Development Phase

Once you have `docs/architecture.md`, proceed with standard Orchestrix development workflow:

### Step 4: Shard Documents

**Agent**: `@po`
**Command**: `*shard`

```bash
@po *shard
```

This will:

- Shard `docs/prd.md` → `docs/prd/epic-*.yaml` (multi-repo) or `epic-*.md` (monolith)
- Shard `docs/architecture.md` → `docs/architecture/*.md`
  - `tech-stack.md`
  - `coding-standards.md` (improved standards!)
  - `source-tree.md`
  - etc.

**Note**: `existing-system-analysis.md` is **NOT sharded** (it's an intermediate document).

### Step 5: Create Stories

**Agent**: `@sm`
**Command**: `*create-next-story`

```bash
@sm *create-next-story
```

SM will create stories based on the epics.

### Step 6: Implement and Review

**Standard Dev/QA Cycle**:

```
@dev *implement {story_id}  # Implement story
@qa *review {story_id}      # QA review
```

**Critical**: Dev agents automatically load `docs/architecture/coding-standards.md` (the **improved** standards from Step 3).

---

## Document Roles Explained

### 📄 `existing-system-analysis.md`

**Role**: Intermediate analysis document
**Path**: `docs/existing-system-analysis.md`
**Content**: Real state of existing system (as-is, including flaws)
**Sharded?**: ❌ No
**Dev Loads?**: ❌ No
**Used By**: PM (Step 2), Architect (Step 3)

**Example Content**:

- Tech Stack: "Node.js 14, Express 4 (outdated)"
- Coding Standards: "No linter, inconsistent naming, 40% test coverage"
- Technical Debt: "Payment service tightly coupled, no error handling"

### 📄 `prd.md`

**Role**: Requirements document
**Path**: `docs/prd.md`
**Content**: What to build
**Sharded?**: ✅ Yes → `docs/prd/epic-*.yaml` or `epic-*.md`
**Dev Loads?**: ❌ No (PO and SM use it)
**Used By**: Architect (Step 3), PO (sharding), SM (story creation)

**Example Content**:

- FR1: Add AI-powered product recommendations
- FR2: Integrate with recommendation service API
- NFR1: Must handle 10,000 requests/min
- CR1: Existing checkout flow must remain unchanged

### 📄 `architecture.md`

**Role**: **Final architecture document** with improved standards
**Path**: `docs/architecture.md`
**Content**: How to build enhancement (with better practices)
**Sharded?**: ✅ Yes → `docs/architecture/*.md`
**Dev Loads?**: ✅ **YES** (automatically loads sharded files)
**Used By**: Dev (implementation), QA (review)

**Example Content**:

- Tech Stack: "Node.js 20 (upgrade), Express 4"
- Coding Standards: "ESLint + Prettier, camelCase, 80% test coverage (improved!)"
- Component Architecture: "Use dependency injection pattern (better than existing)"
- API Design: "RESTful with OpenAPI spec (new standard)"

**Key Difference**: If `existing-system-analysis.md` says "no tests", `architecture.md` says "80% coverage required for new code"!

---

## Best Practices

### 1. Always Follow the 3-Step Sequence

```
Step 1 → Step 2 → Step 3
(Do NOT skip steps or reorder)
```

**Why**: Each step depends on previous steps. Skipping creates incomplete context.

### 2. Be Honest in Step 1

Document reality, not aspirations:

- ✅ "No test coverage" (honest)
- ❌ "Good test coverage" (wishful thinking)

### 3. Improve in Step 3

Use Step 3 to define better standards:

- Existing: "No linter" → Architecture: "ESLint with strict rules"
- Existing: "40% coverage" → Architecture: "80% coverage for new code"
- Existing: "Callbacks" → Architecture: "Async/await for new code"

### 4. Maintain Compatibility

While improving, ensure new code integrates with existing:

- Define clear integration points
- Respect existing API contracts
- Plan migration path if needed

### 5. Use Appropriate Granularity

**Large Enhancement** (multiple epics): Use full 3-step workflow
**Small Enhancement** (1-2 stories): Skip workflow, use `@po *create-story` directly

---

## Common Scenarios

### Scenario 1: Adding Major Feature to Existing App

**Example**: Adding payment processing to existing e-commerce app

```bash
# Step 1: Analyze existing app
@architect *document-project
# Output: docs/existing-system-analysis.md

# Step 2: Define payment feature requirements
@pm *create-doc brownfield-prd-tmpl.yaml
# Output: docs/prd.md

# Step 3: Design payment architecture
@architect *create-doc brownfield-architecture-tmpl.yaml
# Output: docs/architecture.md

# Step 4: Shard and develop
@po *shard
@sm *create-next-story
@dev *implement 1.1
@qa *review 1.1
```

### Scenario 2: Refactoring with New Architecture

**Example**: Refactoring legacy monolith to microservices

```bash
# Step 1: Document current monolith
@architect *document-project
# Captures: tightly coupled code, no tests, poor structure

# Step 2: Define refactoring goals
@pm *create-doc brownfield-prd-tmpl.yaml
# Defines: which services to extract, API boundaries

# Step 3: Design microservice architecture
@architect *create-doc brownfield-architecture-tmpl.yaml
# Defines: service boundaries, API contracts, deployment strategy, improved standards

# Step 4: Implement incrementally
@po *shard
@sm *create-next-story  # Stories for extracting each service
```

### Scenario 3: Upgrading Technology Stack

**Example**: Upgrading from React 16 to React 18

```bash
# Step 1: Document current React 16 app
@architect *document-project
# Captures: component patterns, state management, dependencies

# Step 2: Define upgrade requirements
@pm *create-doc brownfield-prd-tmpl.yaml
# Defines: what features to leverage, compatibility needs

# Step 3: Design migration architecture
@architect *create-doc brownfield-architecture-tmpl.yaml
# Defines: migration strategy, new hooks patterns, concurrent features

# Step 4: Implement migration
@po *shard
@sm *create-next-story  # Stories for migrating components incrementally
```

---

## FAQ

### Q: Why not just update existing code directly?

**A**: The 3-step workflow ensures:

- 📚 You understand existing constraints before making changes
- 🎯 Changes are planned and coordinated, not ad-hoc
- ✨ New code follows improved standards
- 🔗 Compatibility is maintained

### Q: Can I skip Step 1 if I already know the codebase?

**A**: No. Step 1 creates a structured document that Step 2 and Step 3 depend on. Even if you know the code, the PM and Architect agents need this document as input.

### Q: What if my existing code is terrible?

**A**: Perfect! That's exactly why Step 3 exists. Document the terrible reality in Step 1, then define improved standards in Step 3.

### Q: Does Step 3 replace the existing codebase?

**A**: No. Step 3 defines standards for **new code**. Existing code remains unchanged unless explicitly refactored as part of the enhancement.

### Q: Can I improve existing code while adding features?

**A**: Yes! Define "refactoring existing X module" as part of your enhancement requirements in Step 2, then design the improved implementation in Step 3.

---

## Related Guides

- **Multi-Repository System Documentation**: See [MULTI_REPO_BROWNFIELD_GUIDE.md](./MULTI_REPO_BROWNFIELD_GUIDE.md) for documenting existing multi-repo systems
- **Greenfield Development**: See [MULTI_REPO_GREENFIELD_GUIDE.md](./MULTI_REPO_GREENFIELD_GUIDE.md) for new projects

---

**🎉 Ready to enhance your project? Start with Step 1: `@architect *document-project`**
