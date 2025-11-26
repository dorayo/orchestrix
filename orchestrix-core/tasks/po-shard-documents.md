# PO - Shard Documents

## Prerequisites

1. PRD: `docs/prd.md` with "Epic Planning" section containing YAML blocks
2. Architecture: `docs/architecture.md` or `docs/system-architecture.md`
3. `md-tree` CLI: `npm install -g @kayvan/markdown-tree-parser`

## Execution

### 0. Check md-tree

```bash
if ! command -v md-tree > /dev/null 2>&1; then
  echo "❌ md-tree not found. Install: npm install -g @kayvan/markdown-tree-parser"
  exit 1
fi
```

### 1. Load Configuration

Read `{root}/core-config.yaml`:

```yaml
project:
  mode: monolith | multi-repo
  multi_repo:
    role: product | backend | frontend | ios | android
```

**Mode Detection:**
- `mode = monolith` OR not set → Shard PRD + Architecture
- `mode = multi-repo` AND `role = product` → Shard PRD + Architecture
- `mode = multi-repo` AND `role ∈ {backend, frontend, ios, android, mobile, shared, admin}` → **Skip PRD**, Shard Architecture only

**For Implementation Repos:**
```
ℹ️ Skipping PRD sharding (implementation repository)
PRD is managed in Product repository at: {product_repo_path}
```
Proceed directly to Step 3.

### 2. Shard PRD (Skip for Implementation Repos)

**Step 2.1: Check PRD exists**

```bash
PRD_FILE="docs/prd.md"
if [ ! -f "$PRD_FILE" ]; then
  echo "❌ PRD not found at $PRD_FILE"
  echo "ACTION: Create PRD first using PM agent"
  exit 1
fi
```

**Step 2.2: Check if already sharded**

```bash
PRD_SHARDED=$(grep "prdSharded:" core-config.yaml | awk '{print $2}')
if [ "$PRD_SHARDED" = "true" ]; then
  echo "⚠️ PRD already sharded"
  echo "📁 Existing shards: docs/prd/"
  # Prompt: Re-shard? [y/N]
  # If yes: rm -rf docs/prd && sed -i.bak 's|prdSharded:.*|prdSharded: false|' core-config.yaml
  # If no: Skip to Step 3
fi
```

**Step 2.3: Shard PRD using md-tree**

```bash
md-tree explode docs/prd.md docs/prd

if [ $? -ne 0 ]; then
  echo "❌ PRD sharding failed"
  exit 1
fi

echo "✅ PRD sharded to: docs/prd/"
ls -1 docs/prd/*.md | xargs -n1 basename
```

**Step 2.4: Extract Epic YAML to standalone files**

Find YAML blocks containing `epic_id:` in sharded PRD files, extract each to `docs/prd/epic-{n}-{title-slug}.yaml`:

```python
for md_file in glob("docs/prd/*.md"):
    content = read(md_file)
    yaml_blocks = extract_yaml_blocks(content)  # Find ```yaml ... ```

    for block in yaml_blocks:
        if 'epic_id:' in block:
            epic_data = parse_yaml(block)
            epic_id = epic_data['epic_id']
            title_slug = slugify(epic_data['title'])  # e.g., "User Authentication" → "user-authentication"
            output_path = f"docs/prd/epic-{epic_id}-{title_slug}.yaml"
            write_yaml(output_path, epic_data)
            print(f"✅ Extracted: epic-{epic_id}-{title_slug}.yaml")
```

**Validate extraction:**

```bash
EPIC_COUNT=$(ls docs/prd/epic-*.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "$EPIC_COUNT" -eq 0 ]; then
  echo "⚠️ WARNING: No Epic YAML files extracted"
  echo ""
  echo "Expected format in Epic Planning section:"
  echo '```yaml'
  echo 'epic_id: 1'
  echo 'title: "Epic Title"'
  echo 'stories:'
  echo '  - id: "1.1"'
  echo '    repository_type: backend'
  echo '```'
  # Prompt: Continue anyway? [y/N]
else
  echo "✅ Extracted $EPIC_COUNT Epic YAML files:"
  ls -1 docs/prd/epic-*.yaml | xargs -n1 basename
fi
```

**Step 2.5: Update core-config.yaml**

```bash
sed -i.bak 's|prdSharded:.*|prdSharded: true|' core-config.yaml
sed -i.bak 's|prdShardedLocation:.*|prdShardedLocation: docs/prd|' core-config.yaml
```

### 3. Shard Architecture

**Architecture File by Repository Type:**
- Product Repo (`role: product`): `docs/system-architecture.md`
- Implementation Repos (`role: backend/frontend/ios/android`): `docs/architecture.md`
- Monolith: `docs/architecture.md`

**Step 3.1: Check architecture file**

```bash
ARCH_FILE=$(grep "architectureFile:" core-config.yaml | awk '{print $2}')

if [ -z "$ARCH_FILE" ] || [ ! -f "$ARCH_FILE" ]; then
  echo "ℹ️ Architecture file not found, skipping"
  # Continue to Step 4
fi
```

**Step 3.2: Check if already sharded**

```bash
ARCH_SHARDED=$(grep "architectureSharded:" core-config.yaml | awk '{print $2}')
if [ "$ARCH_SHARDED" = "true" ]; then
  ARCH_DIR=$(grep "architectureShardedLocation:" core-config.yaml | awk '{print $2}')
  echo "⚠️ Architecture already sharded at $ARCH_DIR"
  # Prompt: Re-shard? [y/N]
  # If yes: rm -rf "$ARCH_DIR" && sed -i.bak 's|architectureSharded:.*|architectureSharded: false|' core-config.yaml
  # If no: Skip to Step 4
fi
```

**Step 3.3: Shard Architecture**

```bash
ARCH_BASE=$(basename "$ARCH_FILE" .md)
ARCH_DIR="docs/$ARCH_BASE"

md-tree explode "$ARCH_FILE" "$ARCH_DIR"

if [ $? -eq 0 ]; then
  echo "✅ Architecture sharded to: $ARCH_DIR/"
  ls -1 "$ARCH_DIR"/*.md | xargs -n1 basename

  sed -i.bak "s|architectureSharded:.*|architectureSharded: true|" core-config.yaml
  sed -i.bak "s|architectureShardedLocation:.*|architectureShardedLocation: $ARCH_DIR|" core-config.yaml
else
  echo "❌ Architecture sharding failed"
fi
```

### 4. Final Report

**Count epics and stories (Monolith/Product only):**

```bash
TOTAL_EPICS=$(ls docs/prd/epic-*.yaml 2>/dev/null | wc -l | tr -d ' ')
TOTAL_STORIES=$(grep -h '  - id:' docs/prd/epic-*.yaml 2>/dev/null | wc -l | tr -d ' ')
REPO_TYPES=$(grep -h 'repository_type:' docs/prd/epic-*.yaml 2>/dev/null | awk '{print $NF}' | sort -u | tr '\n' ', ' | sed 's/,$//')
```

**Output:**

```
═══════════════════════════════════════════════════════
✅ DOCUMENT SHARDING COMPLETE
═══════════════════════════════════════════════════════

📋 PRD:
   - Location: docs/prd/
   - Epic files: docs/prd/epic-*.yaml
   - Epics: {TOTAL_EPICS}
   - Stories: {TOTAL_STORIES}
   - Repository types: {REPO_TYPES}

🏗️ Architecture:
   - Location: {ARCH_DIR}/

⚙️ Config Updated:
   - prdSharded: true
   - prdShardedLocation: docs/prd
   - architectureSharded: true
   - architectureShardedLocation: {ARCH_DIR}

🎯 NEXT STEPS:
   Monolith: @sm *draft
   Multi-Repo Product: Navigate to implementation repos, run @sm *draft
   Multi-Repo Implementation: @sm *draft (reads from {product_repo_path}/docs/prd/epic-*.yaml)

═══════════════════════════════════════════════════════
```

## Output Structure

```
docs/prd/
├── 01-goals.md              # PRD section (md-tree output)
├── 02-requirements.md       # PRD section
├── ...
├── XX-epic-planning.md      # Original PRD section (reference)
├── epic-1-user-authentication.yaml    # Extracted Epic 1 (SM reads this)
├── epic-2-product-catalog.yaml        # Extracted Epic 2 (SM reads this)
└── epic-3-checkout.yaml               # Extracted Epic 3 (SM reads this)
```

## Epic YAML Format

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
      User can register and login
    estimated_complexity: medium
    priority: P0
    provides_apis:
      - "POST /api/auth/login"
    consumes_apis: []
    dependencies: []

  - id: "1.2"
    title: "Frontend Login UI"
    repository_type: frontend
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/auth/login"
```
