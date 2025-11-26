# Architect Task: Lock API Contract

## Purpose

Lock API contract to prevent breaking changes during active development.

**Stage**: Stage 3 (Advanced Features)

## Prerequisites

- API contracts document exists (`docs/architecture/api-contracts.md`)
- Stories referencing the contract are identified
- Contract version is defined (semver format)

## Task Instructions

### Step 1: Validate Prerequisites

**Check if contract file exists**:
- Path: `{product_repo_path}/docs/architecture/api-contracts.md`
- If not found: HALT with error

### Step 2: Determine Contract Version

**Options**:
1. **Auto-generate from current state**: `1.0.0` (first lock)
2. **User-specified version**: Ask Architect for version

**Version format**: Semantic versioning (X.Y.Z)

### Step 3: Identify Referencing Stories

**Query epic YAML files** to find stories that reference API endpoints:
- Load all epic YAML files from `{product_repo_path}/docs/prd/epic-*-*.yaml`
- Extract stories with `provides_apis` or `consumes_apis`
- Filter by epic (if specified) or all stories

**Result**: List of `{ story_id, repository, api_endpoints }`

### Step 4: Lock Contract

**Execute**: `{root}/utils/api-contract-locker.js lock`

**Parameters**:
- `contract_file_path`: Full path to api-contracts.md
- `version`: Contract version (from Step 2)
- `product_repo_path`: Product repo path
- `locked_by`: `"architect_manual"`
- `referencing_stories`: List from Step 3

**Handle Result**:
- **Success**: Display lock file path and hash
- **Already locked**: Show existing lock details
- **Error**: HALT with error message

### Step 5: Announce Lock

```
✅ API CONTRACT LOCKED

Version: {version}
Contract: {contract_file}
Hash: {contract_hash} (first 16 chars)

Referencing Stories ({count}):
{{#each referencing_stories}}
- Story {{this.story_id}} ({{this.repository}}): {{this.api_endpoints.join(', ')}}
{{/each}}

Lock File: {lock_file_path}

🔒 This contract is now locked. Any breaking changes will be blocked.

To unlock: Architect must execute `unlock-api-contract {version} "reason"`
```

### Step 6: Log Operation

Log to `{product_repo_path}/.ai/contract-lock-log.md`:
- Timestamp
- Version
- Locked by
- Referencing stories count
- Lock file path

## Usage Examples

### Lock Current API Contract
```
Architect: Execute architect-lock-api-contract

System: What version should this be? (current: none)
Architect: 1.0.0

System: Found 4 stories referencing API contract:
- Story 1.1 (backend): POST /api/auth/register, POST /api/auth/login
- Story 1.2 (frontend): POST /api/auth/login
- Story 2.1 (backend): GET /api/products
- Story 2.2 (frontend): GET /api/products

Lock these stories with version 1.0.0? [Y/n]
Architect: Y

System: ✅ API CONTRACT LOCKED (v1.0.0)
```

## Error Handling

**Contract file not found**:
```
❌ ERROR: API contract not found
Expected: {product_repo_path}/docs/architecture/api-contracts.md

Please create API contract document first.
```

**Invalid version format**:
```
❌ ERROR: Invalid version format: {version}
Expected: Semantic versioning (e.g., 1.0.0, 2.1.3)
```

**Lock failed**:
```
❌ ERROR: Failed to lock contract
Error: {error_message}
```

---

**END OF TASK**
