# PO - Shard Documents

## Purpose

Automatically shard all configured documents using `md-tree` CLI tool:

1. **PRD → Sharded PRD**: Split prd.md into docs/prd/*.md (preserves epic YAML blocks)
2. **Architecture** (if exists): Shard into section files for better context management

Epic definitions are embedded as YAML code blocks in prd.md (created by PM in "Epic Planning" section).
After sharding, these YAML blocks remain in the sharded prd files for SM agents to read and filter by repository_type.

## Prerequisites

1. PRD document exists at `docs/prd.md` with "Epic Planning" section containing YAML blocks
2. Architecture documents exist (for multi-repo: `docs/system-architecture.md`, for monolith: `docs/architecture.md`)
3. Core config file exists at `{root}/core-config.yaml`
4. `md-tree` CLI tool is installed: `npm install -g @kayvan/markdown-tree-parser`

## Task Instructions

### 0. Check md-tree Availability

**Detect `md-tree` command**:

```bash
if command -v md-tree &> /dev/null; then
  USE_MD_TREE=true
  echo "✅ md-tree available - using fast CLI tool for sharding"
else
  USE_MD_TREE=false
  echo "❌ ERROR: md-tree not found"
  echo "📦 Required: npm install -g @kayvan/markdown-tree-parser"
  echo "HALT: Cannot proceed without md-tree"
  exit 1
fi
```

---

### 1. Load Configuration and Detect Project Type

**Read `{root}/core-config.yaml`**:

```yaml
project:
  mode: monolith | multi-repo
  multi_repo:
    role: product | backend | frontend | ios | android
```

**Determine mode**:
- If `mode = monolith` OR `mode` not set: **MONOLITH MODE** → Shard both PRD and Architecture
- If `mode = multi-repo` AND `role = product`: **MULTI-REPO PRODUCT MODE** → Shard both PRD and System Architecture
- If `mode = multi-repo` AND `role ∈ {backend, frontend, ios, android, mobile, shared, admin}`: **MULTI-REPO IMPLEMENTATION MODE** → Shard Architecture ONLY (skip PRD)

**Info Message for Implementation Repositories**:
```
ℹ️ IMPLEMENTATION REPOSITORY DETECTED

Current project mode: multi-repo
Repository role: {role}
Repository: {repository_id}

SHARDING BEHAVIOR:
✅ Architecture: Will be sharded (docs/architecture.md → docs/architecture/*.md)
⏭️ PRD: Will be skipped (PRD is sharded in Product repository)

Implementation repositories shard their own architecture documents,
but read PRD and epics from the Product repository.
```

---

### 2. Shard PRD Document

**Purpose**: Split prd.md into multiple section files. Epic YAML blocks in the "Epic Planning" section will be preserved in the sharded files.

**⚠️ SKIP THIS STEP if in MULTI-REPO IMPLEMENTATION MODE**

If current repository role ∈ {backend, frontend, ios, android, mobile, shared, admin}:
- Skip all PRD sharding steps (2.1 - 2.5)
- Display info message:
  ```
  ℹ️ Skipping PRD sharding (implementation repository)
  PRD is managed in Product repository at: {product_repo_path}
  ```
- Proceed directly to Step 3 (Architecture sharding)

**Step 2.1: Check if PRD exists** (MONOLITH or PRODUCT mode only)

```bash
PRD_FILE="docs/prd.md"

if [ ! -f "$PRD_FILE" ]; then
  echo "❌ ERROR: PRD not found at $PRD_FILE"
  echo "ACTION: Create PRD first using PM agent"
  echo "HALT: Cannot proceed without PRD"
  exit 1
fi

echo "📄 PRD document found: $PRD_FILE"
```

**Step 2.2: Check if PRD already sharded**

```bash
PRD_SHARDED=$(grep "prdSharded:" core-config.yaml | awk '{print $2}')

if [ "$PRD_SHARDED" = "true" ]; then
  echo "⚠️ WARNING: PRD already sharded (prdSharded: true in core-config.yaml)"
  echo "📁 Existing shards location: docs/prd/"
  echo ""
  echo "❓ Do you want to re-shard? This will:"
  echo "   - Delete existing docs/prd/ directory"
  echo "   - Re-create prd shards from docs/prd.md"
  echo ""
  read -p "Re-shard PRD? [y/N]: " RESHARD

  if [ "$RESHARD" != "y" ] && [ "$RESHARD" != "Y" ]; then
    echo "ℹ️ Skipping PRD sharding (already complete)"
    echo "Proceeding to architecture sharding..."
  else
    echo "🗑️ Removing existing prd shards..."
    rm -rf docs/prd
    # Update config to mark as not sharded
    sed -i.bak 's|prdSharded:.*|prdSharded: false|' core-config.yaml
  fi
fi
```

**Step 2.3: Shard PRD using md-tree**

```bash
echo ""
echo "🔍 STEP 2: Sharding PRD Document..."
echo "📄 Source: $PRD_FILE"
echo "📁 Target: docs/prd/"
echo ""

# Use md-tree to shard PRD
md-tree --input "$PRD_FILE" --output docs/prd

if [ $? -ne 0 ]; then
  echo "❌ ERROR: PRD sharding failed"
  echo "HALT: Cannot proceed"
  exit 1
fi

echo "✅ PRD sharded successfully to: docs/prd/"
echo ""
echo "📋 PRD sections created:"
ls -1 docs/prd/*.md | xargs -n1 basename
echo ""
```

**Step 2.4: Validate Epic YAML blocks exist**

```bash
echo "🔍 Validating epic YAML blocks in sharded PRD..."

# Search for YAML blocks containing epic_id
EPIC_COUNT=$(grep -r '```yaml' docs/prd/*.md | grep -A 5 'epic_id:' | grep -c 'epic_id:')

if [ "$EPIC_COUNT" -eq 0 ]; then
  echo "⚠️ WARNING: No epic YAML blocks found in sharded PRD"
  echo ""
  echo "Expected format in Epic Planning section of prd.md:"
  echo '```yaml'
  echo 'epic_id: 1'
  echo 'title: "Epic Title"'
  echo 'stories:'
  echo '  - id: "1.1"'
  echo '    repository_type: backend'
  echo '    ...'
  echo '```'
  echo ""
  echo "⚠️ WARNING: SM agents will not be able to create stories without epic definitions"
  echo ""
  read -p "Continue anyway? [y/N]: " CONTINUE

  if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
    echo "HALT: Fix PRD Epic Planning section and re-run *shard"
    exit 1
  fi
else
  echo "✅ Found $EPIC_COUNT epic definitions in sharded PRD"
fi
```

**Step 2.5: Update core-config.yaml**

```bash
# Update prd configuration in core-config.yaml
sed -i.bak 's|prdSharded:.*|prdSharded: true|' core-config.yaml
sed -i.bak 's|prdShardedLocation:.*|prdShardedLocation: docs/prd|' core-config.yaml

echo "✅ Updated core-config.yaml:"
echo "   - prdSharded: true"
echo "   - prdShardedLocation: docs/prd"
echo ""
```

---

### 3. Shard Architecture Document (if exists)

**After completing PRD sharding** (or skipping it in implementation repos), automatically shard architecture document if it exists.

**Architecture File Paths by Repository Type**:
- **Product Repo** (role: product): `docs/system-architecture.md` (system-level architecture)
- **Implementation Repos** (role: backend/frontend/ios/android): `docs/architecture.md` (implementation-level architecture)
- **Monolith Repo**: `docs/architecture.md`

**Step 3.1: Check for Architecture Document**

```bash
# Get architecture file path from config
ARCH_FILE=$(grep "architectureFile:" core-config.yaml | awk '{print $2}')

if [ -z "$ARCH_FILE" ]; then
  echo "ℹ️ No architecture file configured, skipping architecture sharding"
else
  if [ ! -f "$ARCH_FILE" ]; then
    echo "⚠️ WARNING: Architecture file configured but not found: $ARCH_FILE"
    echo "   Expected paths by repository type:"
    echo "   - Product repo (role: product): docs/system-architecture.md"
    echo "   - Implementation repos (role: backend/frontend/ios/android): docs/architecture.md"
    echo "   - Monolith repo: docs/architecture.md"
    echo ""
    echo "   Recommendations:"
    echo "   - Product repo: Run @architect *create-system-architecture"
    echo "   - Implementation repos: Run @architect *create-{backend|mobile|frontend}-architecture"
    echo "   - Monolith repo: Run @architect *document-project"
    echo ""
    echo "ℹ️ Skipping architecture sharding"
  else
    echo "📄 Architecture document found: $ARCH_FILE"
  fi
fi
```

**Step 3.2: Check if Architecture already sharded**

```bash
if [ -f "$ARCH_FILE" ]; then
  ARCH_SHARDED=$(grep "architectureSharded:" core-config.yaml | awk '{print $2}')

  if [ "$ARCH_SHARDED" = "true" ]; then
    ARCH_DIR=$(grep "architectureShardedLocation:" core-config.yaml | awk '{print $2}')
    echo "⚠️ WARNING: Architecture already sharded (architectureSharded: true)"
    echo "📁 Existing shards location: $ARCH_DIR"
    echo ""
    read -p "Re-shard architecture? [y/N]: " RESHARD_ARCH

    if [ "$RESHARD_ARCH" != "y" ] && [ "$RESHARD_ARCH" != "Y" ]; then
      echo "ℹ️ Skipping architecture re-sharding"
      ARCH_FILE=""  # Clear to skip sharding
    else
      echo "🗑️ Removing existing architecture shards..."
      rm -rf "$ARCH_DIR"
      sed -i.bak 's|architectureSharded:.*|architectureSharded: false|' core-config.yaml
    fi
  fi
fi
```

**Step 3.3: Shard Architecture using md-tree**

```bash
if [ -n "$ARCH_FILE" ] && [ -f "$ARCH_FILE" ]; then
  echo ""
  echo "🔍 STEP 3: Sharding Architecture Document..."
  echo "📄 Source: $ARCH_FILE"

  # Determine output directory based on architecture file name
  # docs/system-architecture.md → docs/system-architecture/
  # docs/architecture.md → docs/architecture/
  ARCH_BASE=$(basename "$ARCH_FILE" .md)
  ARCH_DIR="docs/$ARCH_BASE"

  echo "📁 Target: $ARCH_DIR/"
  echo ""

  # Use md-tree for sharding
  md-tree --input "$ARCH_FILE" --output "$ARCH_DIR"

  if [ $? -eq 0 ]; then
    echo "✅ Architecture sharded to: $ARCH_DIR/"
    echo ""
    echo "📋 Architecture sections created:"
    ls -1 "$ARCH_DIR"/*.md | xargs -n1 basename
    echo ""

    # Update core-config.yaml
    sed -i.bak "s|architectureSharded:.*|architectureSharded: true|" core-config.yaml
    sed -i.bak "s|architectureShardedLocation:.*|architectureShardedLocation: $ARCH_DIR|" core-config.yaml

    echo "✅ Updated core-config.yaml:"
    echo "   - architectureSharded: true"
    echo "   - architectureShardedLocation: $ARCH_DIR"
    echo ""
  else
    echo "❌ Architecture sharding failed"
    echo "⚠️ Continuing without architecture shards"
  fi
fi
```

---

### 4. Final Report

**Step 4.1: Count epics and stories** (only for MONOLITH or PRODUCT mode)

```bash
# Skip epic/story counting for implementation repositories
if [ "$REPO_MODE" = "IMPLEMENTATION" ]; then
  TOTAL_EPICS=0
  TOTAL_STORIES=0
  REPO_TYPES="N/A (read from product repo)"
else
  # Count epics by counting epic_id occurrences in prd/ files
  TOTAL_EPICS=$(grep -r 'epic_id:' docs/prd/*.md 2>/dev/null | grep -c 'epic_id:')

  # Count total stories by counting id fields under stories: sections
  TOTAL_STORIES=$(grep -r -A 1000 'stories:' docs/prd/*.md 2>/dev/null | grep '  - id:' | wc -l | tr -d ' ')

  # Detect repository types mentioned in epic YAML blocks
  if [ "$TOTAL_STORIES" -gt 0 ]; then
    REPO_TYPES=$(grep -r 'repository_type:' docs/prd/*.md 2>/dev/null | awk '{print $NF}' | sort -u | tr '\n' ', ' | sed 's/,$//')
  else
    REPO_TYPES="none"
  fi
fi
```

**Step 4.2: Display comprehensive summary**

```
═══════════════════════════════════════════════════════
✅ DOCUMENT SHARDING COMPLETE
═══════════════════════════════════════════════════════

{if REPO_MODE = MONOLITH or PRODUCT}
📋 PRD SHARDING:
  - Source: docs/prd.md
  - Output: docs/prd/
  - Epic definitions: {TOTAL_EPICS} epics found
  - Total stories: {TOTAL_STORIES} stories across all repos
  - Repository types: {REPO_TYPES}
  - Status: ✅ Complete
{else if REPO_MODE = IMPLEMENTATION}
📋 PRD SHARDING:
  - Status: ⏭️ Skipped (implementation repository)
  - PRD location: {PRODUCT_REPO_PATH}/docs/prd/
  - Note: SM will read epics from product repository
{endif}

🏗️ ARCHITECTURE SHARDING:
  {if ARCH_FILE sharded}
  - Source: {ARCH_FILE}
  - Output: {ARCH_DIR}/
  - Section files: {count} created
  - Tool: md-tree
  - Status: ✅ Complete
  - Dev auto-load files: coding-standards.md, tech-stack.md, source-tree.md
  {else}
  - Status: ⏭️ Skipped (not configured or already sharded)
  {endif}

⚙️ CONFIGURATION UPDATED (core-config.yaml):
  {if REPO_MODE != IMPLEMENTATION}
  - prdSharded: true
  - prdShardedLocation: docs/prd
  {endif}
  {if ARCH sharded}
  - architectureSharded: true
  - architectureShardedLocation: {ARCH_DIR}
  {endif}

{if REPO_MODE = MONOLITH or PRODUCT}
📊 EPIC SUMMARY:
  Epic YAML blocks are embedded in docs/prd/*.md files.
  SM agents will read these files, extract YAML blocks, and filter
  stories by repository_type matching their repository role.

  Example epic file location: docs/prd/XX-epic-planning.md
{endif}

🎯 NEXT STEPS:

  {if REPO_MODE = MONOLITH}
  **For Monolith Projects:**
    SM can create stories: @sm *create-next-story
    SM will read epics from docs/prd/ and create all stories locally.
  {endif}

  {if REPO_MODE = PRODUCT}
  **For Product Repository:**
    1. PRD and System Architecture are now sharded
    2. Navigate to implementation repositories (backend, frontend, ios, android)
    3. In each implementation repo:
       - Run: @architect *create-{backend|mobile|frontend}-architecture
       - Run: @po *shard (to shard implementation architecture)
       - Run: @sm *create-next-story (to create stories filtered by repo type)
  {endif}

  {if REPO_MODE = IMPLEMENTATION}
  **For Implementation Repository:**
    1. Architecture is now sharded into {ARCH_DIR}/
    2. Dev agents will auto-load: coding-standards.md, tech-stack.md, source-tree.md
    3. Create stories: @sm *create-next-story
       - SM will read epics from: {PRODUCT_REPO_PATH}/docs/prd/
       - SM will filter by: repository_type = {CURRENT_ROLE}
       - SM will create only stories assigned to this repository
  {endif}

  **Story Creation Logic:**
    - Backend repo (role: backend) → gets stories with repository_type: backend
    - Frontend repo (role: frontend) → gets stories with repository_type: frontend
    - iOS repo (role: ios) → gets stories with repository_type: ios
    - Android repo (role: android) → gets stories with repository_type: android

═══════════════════════════════════════════════════════
```

---

## Important Notes

### Epic Format in PRD

Epics are defined in the "Epic Planning" section of prd.md using YAML code blocks:

```markdown
## Epic Planning

### Epic 1: User Authentication

**Epic Summary:** Complete user authentication system

**Target Repositories:** backend, frontend

```yaml
epic_id: 1
title: "User Authentication"
description: |
  Implement user authentication across all platforms

stories:
  - id: "1.1"
    title: "Backend Auth API"
    repository_type: backend
    acceptance_criteria_summary: |
      User can register and login...
    estimated_complexity: medium
    priority: P0
    provides_apis:
      - "POST /api/auth/login"
    consumes_apis: []
    cross_repo_dependencies: []
```
```

After sharding, this YAML block will be preserved in one of the prd/*.md files.

### Multi-Repo Best Practices

1. **Epic definitions in Product Repo**: All epics defined in Product repo's prd.md
2. **Story filtering**: Each implementation repo's SM filters by repository_type
3. **repository_type is mandatory**: Every story must have repository_type field
4. **Cross-repo dependencies**: Use cross_repo_dependencies field to track dependencies
5. **API tracking**: Backend stories list provides_apis, frontend/mobile list consumes_apis

### Sharding Benefits

1. **Consistency**: Both PRD and architecture use md-tree for sharding
2. **Maintainability**: Single source of truth (prd.md), shards auto-generated
3. **Clarity**: Epic data lives where it belongs (in PRD)
4. **Simplicity**: No separate docs/epics/ directory needed

---

## Error Handling

### If PRD Not Found

```
❌ ERROR: PRD not found at expected location
Expected: docs/prd.md

ACTION: Create PRD first using PM agent
HALT: Cannot proceed without PRD
```

### If md-tree Not Installed

```
❌ ERROR: md-tree not found

The md-tree CLI tool is required for document sharding.

INSTALLATION:
npm install -g @kayvan/markdown-tree-parser

After installation, run: @po *shard

HALT: Cannot proceed without md-tree
```

### If No Epic YAML Blocks Found

```
⚠️ WARNING: No epic YAML blocks found in sharded PRD

Expected format in Epic Planning section of prd.md:
```yaml
epic_id: 1
title: "Epic Title"
stories:
  - id: "1.1"
    repository_type: backend
    ...
```

SM agents will not be able to create stories without epic definitions.

ACTION: Add Epic Planning section to prd.md following template format.
Then re-run: @po *shard
```

### If Implementation Repo Detected

```
❌ ERROR: Cannot shard documents in implementation repository

Current project type: {backend|frontend|ios|android}
Repository ID: {repository_id}

ACTION: Document sharding must be done in the product repository.
Navigate to: {product_repo_path}
Run: @po *shard

HALT: Cannot proceed in implementation repository
```

---

## Migration from Old Format

If you have an existing project with docs/epics/*.yaml files:

1. **Migrate epic data to prd.md**: Add "Epic Planning" section to prd.md with YAML blocks
2. **Delete old epics directory**: `rm -rf docs/epics/`
3. **Update core-config.yaml**: Set `prdSharded: false`
4. **Run sharding**: `@po *shard`

The new format embeds epic data in PRD where it conceptually belongs, then shards naturally with the rest of the PRD content.
