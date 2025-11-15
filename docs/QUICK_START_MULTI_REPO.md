# Multi-Repository Quick Start Guide

> **5-minute setup** for multi-repository projects with Orchestrix

## 🎯 What You'll Get

✅ Coordinate development across multiple repos (Backend, Frontend, Mobile)
✅ Define stories with cross-repo dependencies
✅ Automatic dependency checking
✅ Centralized planning with distributed execution

---

## 📋 Prerequisites

- ✅ Node.js ≥ 20.0.0
- ✅ Multiple repositories for your project (backend, frontend, ios, android, etc.)
- ✅ Basic understanding of Agile/Scrum

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Product Repository

```bash
# Create and setup Product repo
mkdir my-app-product
cd my-app-product
npx orchestrix install
```

**Configure** `core-config.yaml`:

```yaml
project:
  name: My App
  type: product-planning # ⚠️ REQUIRED for multi-repo

implementation_repos:
  - repository_id: my-app-backend # ⚠️ Must match Epic YAML
    path: ../my-app-backend
    type: backend
  - repository_id: my-app-web
    path: ../my-app-web
    type: frontend
  # Add more repos as needed (ios, android, mobile, etc.)
```

### Step 2: Setup Implementation Repositories

```bash
# In each implementation repo (backend, frontend, etc.)
cd my-app-backend
npx orchestrix install

# Edit core-config.yaml
vi core-config.yaml
```

**Configure each repo**:

```yaml
project:
  type: backend # ⚠️ Change from 'monolith'
  repository_id: my-app-backend # ⚠️ Must match Product config
  product_repo:
    enabled: false # Enable after Product repo setup
    path: ""
```

### Step 3: Validate Configuration

```bash
cd my-app-product

# Validate configuration
npm run validate:multi-repo .

# Expected output:
# ✅ PASSED CHECKS:
#   ✓ [Product Type] Project type is "product-planning"
#   ✓ [Implementation Repos] Found 2 implementation repositories
#   ...
```

✅ **Done!** Now you're ready to create PRD and Epics.

---

## 📝 Quick Workflow

### 1️⃣ Document Existing System (Brownfield Only)

```bash
# In each implementation repo
cd my-app-backend
@architect *document-project  # Creates existing-system-analysis.md

cd my-app-web
@architect *document-project

# Back to Product repo
cd my-app-product
@architect *aggregate-system-analysis  # Creates existing-system-integration.md
```

### 2️⃣ Create PRD

```bash
cd my-app-product
@pm *create-doc brownfield-prd  # Or greenfield-prd
```

### 3️⃣ Create Architecture

```bash
@architect *create-system-architecture
```

### 4️⃣ Shard Documents

```bash
@po *shard  # Creates Epic YAML files
```

### 5️⃣ Validate

```bash
# Validate everything
npm run validate:all

# Or validate individually
npm run validate:epics docs/epics/
npm run validate:story-sync .
```

### 6️⃣ Create Stories

```bash
# In implementation repo
cd my-app-backend
@sm *create-next-story  # Reads Epic from Product repo
```

---

## 🛠️ Helpful Commands

### Validation

```bash
# Validate multi-repo config
npm run validate:multi-repo <product-repo-path>

# Validate Epic YAML files
npm run validate:epics <epics-directory>

# Check Story sync
npm run validate:story-sync <product-repo-path>

# Validate all
npm run validate:all
```

### Development

```bash
# Create next story (in implementation repo)
@sm *create-next-story

# Implement story
@dev *implement-story <story-id>

# Review code
@qa *review <story-id>
```

### Information

```bash
# List agents
npm run list:agents

# Check installation
npx orchestrix status
```

---

## 📂 Directory Structure

```
my-app-product/          # Product Repository (Coordinator)
├── docs/
│   ├── prd.md          # Product Requirements
│   ├── architecture/   # System Architecture
│   │   └── system-architecture.md
│   └── epics/          # Epic YAML files (Story mapping)
│       ├── epic-1-user-auth.yaml
│       └── epic-2-product-mgmt.yaml
└── core-config.yaml    # implementation_repos configuration

my-app-backend/          # Implementation Repository
├── docs/
│   ├── architecture.md # Backend architecture
│   └── stories/        # Story files
│       └── 1.1-backend-user-api/
│           └── story.md
└── core-config.yaml    # type: backend, product_repo link

my-app-web/             # Implementation Repository
├── docs/
│   ├── architecture.md
│   └── stories/
│       └── 1.2-frontend-login-ui/
│           └── story.md
└── core-config.yaml    # type: frontend, product_repo link
```

---

## ⚠️ Common Pitfalls

### 1. Forgot to change `project.type`

**Error**: "Cannot create stories in product-planning repository"

**Fix**: In implementation repos, change:

```yaml
project:
  type: monolith  # ❌ Wrong
  type: backend   # ✅ Correct
```

### 2. Missing `repository_id`

**Error**: "Cannot resolve path for repository"

**Fix**: Add `repository_id` to Product repo config:

```yaml
implementation_repos:
  - repository_id: my-app-backend # ⚠️ Required
    path: ../my-app-backend
    type: backend
```

### 3. Epic YAML repository mismatch

**Error**: "Story references unknown repository"

**Fix**: Ensure Epic YAML uses same `repository_id` as config:

```yaml
# In epic-1-*.yaml
stories:
  - id: "1.1"
    repository: "my-app-backend" # Must match config
```

---

## 📚 Next Steps

**Learn More**:

- [Multi-Repo Brownfield Enhancement Guide](./MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md) - Complete guide
- [Phase 1 Migration Guide](./PHASE_1_MIGRATION_GUIDE.md) - Upgrading from older versions
- [Multi-Repo Greenfield Guide](./MULTI_REPO_GREENFIELD_GUIDE.md) - New projects

**Get Help**:

- Run validators: `npm run validate:all`
- Check docs: `cat docs/PHASE_1_MIGRATION_GUIDE.md`
- Report issues: [GitHub Issues](https://github.com/dorayo/ORCHESTRIX/issues)

---

**Total Setup Time**: ~5 minutes
**Next**: Create your first PRD with `@pm *create-doc`
