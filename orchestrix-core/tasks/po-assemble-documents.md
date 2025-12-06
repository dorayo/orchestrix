# PO - Assemble Sharded Documents

## Purpose

Reassemble sharded PRD and Architecture directories into complete Markdown documents.
Used for export, sharing, or archival scenarios.

**Important:** Assembled files are **derived files**, not the source of truth.
The source of truth is always the sharded directories (`docs/prd/`, `docs/architecture/`).

## Prerequisites

1. md-tree CLI installed: `npm install -g @kayvan/markdown-tree-parser`
2. At least one document has been sharded

## Input

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| document_type | string | No | both | `prd` \| `architecture` \| `both` |

## Process

### Step 1: Check md-tree

Confirm md-tree CLI is available:

```bash
if ! command -v md-tree > /dev/null 2>&1; then
  echo "❌ md-tree not found"
  echo "Install: npm install -g @kayvan/markdown-tree-parser"
  exit 1
fi

echo "✅ md-tree $(md-tree version) available"
```

**IF NOT available:**

```
❌ md-tree not found

Please install md-tree CLI:
npm install -g @kayvan/markdown-tree-parser

Re-execute *assemble after installation is complete.
```

HALT

### Step 2: Confirm Shard Status

Read `{root}/core-config.yaml`:

**PRD Status:**
```yaml
prd:
  prdSharded: true | false
  prdShardedLocation: docs/prd  # Shard directory path
```

**Architecture Status:**
```yaml
architecture:
  architectureSharded: true | false
  architectureShardedLocation: docs/architecture  # Shard directory path
```

**Output Current Status:**

```
📊 Shard Status Check
═══════════════════════════════════════════════════════

PRD:
  - Sharded: {prdSharded}
  - Shard Directory: {prdShardedLocation}

Architecture:
  - Sharded: {architectureSharded}
  - Shard Directory: {architectureShardedLocation}

═══════════════════════════════════════════════════════
```

### Step 3: Assemble PRD

**Condition:** `document_type = "prd"` OR `document_type = "both"`

**IF prdSharded = true:**

```bash
PRD_SHARD_DIR="{prdShardedLocation}"  # Default: docs/prd
PRD_OUTPUT="docs/prd.md"

echo "📄 Assembling PRD..."
md-tree assemble "$PRD_SHARD_DIR" "$PRD_OUTPUT"

if [ $? -eq 0 ]; then
  echo "✅ Assembled: $PRD_OUTPUT"
else
  echo "❌ PRD assembly failed"
  exit 1
fi
```

**ELSE:**

```
ℹ️ PRD not sharded, skipping PRD assembly
```

### Step 4: Assemble Architecture

**Condition:** `document_type = "architecture"` OR `document_type = "both"`

**IF architectureSharded = true:**

```bash
ARCH_SHARD_DIR="{architectureShardedLocation}"  # Default: docs/architecture
ARCH_OUTPUT="docs/architecture.md"

echo "🏗️ Assembling Architecture..."
md-tree assemble "$ARCH_SHARD_DIR" "$ARCH_OUTPUT"

if [ $? -eq 0 ]; then
  echo "✅ Assembled: $ARCH_OUTPUT"
else
  echo "❌ Architecture assembly failed"
  exit 1
fi
```

**ELSE:**

```
ℹ️ Architecture not sharded, skipping Architecture assembly
```

### Step 5: Output Results

**Generate completion report:**

```
═══════════════════════════════════════════════════════
✅ DOCUMENT ASSEMBLY COMPLETE
═══════════════════════════════════════════════════════

📄 Generated Files:
{IF PRD assembled:}
   - docs/prd.md ({file_size})
{IF Architecture assembled:}
   - docs/architecture.md ({file_size})

═══════════════════════════════════════════════════════
⚠️ IMPORTANT - READ CAREFULLY
═══════════════════════════════════════════════════════

These are DERIVED files for export/sharing purposes.

The SINGLE SOURCE OF TRUTH remains in the sharded directories:
{IF PRD sharded:}
   - PRD: {prdShardedLocation}/
{IF Architecture sharded:}
   - Architecture: {architectureShardedLocation}/

┌─────────────────────────────────────────────────────┐
│  DO NOT edit these assembled files directly.        │
│  All changes should be made to the sharded files.  │
│                                                     │
│  For new iterations: @pm *start-iteration          │
│  To re-assemble: @po *assemble                     │
└─────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════
```

## Output

**On Success:**
- `docs/prd.md` - Assembled complete PRD document (if requested)
- `docs/architecture.md` - Assembled complete architecture document (if requested)
- Completion status report

**On Failure:**
- Error message
- Remediation suggestions

## Examples

**Assemble all documents:**
```
@po *assemble
```

**Assemble PRD only:**
```
@po *assemble prd
```

**Assemble architecture only:**
```
@po *assemble architecture
```

## Notes

1. **File Overwrite:** Assembly will overwrite existing files with the same name, no confirmation required
2. **Epic YAML Files:** `epic-*.yaml` files are not included in assembly results (they are standalone structured data)
3. **index.md:** The shard directory's `index.md` is used by md-tree as the assembly index
4. **File Order:** md-tree assembles by filename sort order, ensuring correct section sequence
