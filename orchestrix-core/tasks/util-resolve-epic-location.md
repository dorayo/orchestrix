# Resolve Epic Location

## Purpose

Unified utility for resolving Epic file paths across monolith and multi-repo modes.
Handles path validation, access verification, and optional Epic 0 creation.

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| epic_id | string | No | Epic ID to locate. Default: `"0"` |
| create_if_missing | boolean | No | Create Epic 0 if not found. Default: `false` |

## Process

### Step 1: Load Configuration

Read: `{root}/core-config.yaml`

**Extract**:
- `prdShardedLocation`: Epic YAML location (relative path, default: `docs/prd`)
- `project.mode`: `monolith` | `multi-repo`
- `project.multi_repo.role`: `product` | `backend` | `frontend` | `ios` | `android`
- `project.multi_repo.product_repo_path`: Path to product repo (if multi-repo)
- `project.multi_repo.repository_id`: Current repository identifier

**Store**:
```yaml
config:
  mode: "{project.mode}"
  role: "{project.multi_repo.role}"
  product_repo_path: "{project.multi_repo.product_repo_path}"
  repository_id: "{project.multi_repo.repository_id}"
  prd_location: "{prdShardedLocation}"
```

---

### Step 2: Resolve Epic Location Path

**Apply resolution rules**:

```
IF config.mode = "multi-repo" AND config.role != "product":
  epic_location = {config.product_repo_path}/{config.prd_location}
ELSE:
  epic_location = {config.prd_location}
```

**Store**: `epic_location`

---

### Step 3: Validate Access (Multi-Repo Only)

**IF config.mode = "multi-repo" AND config.role != "product"**:

#### 3.1 Validate Product Repository Exists

Check if `{config.product_repo_path}` directory exists.

**IF NOT exists**:

```
❌ PRODUCT REPOSITORY NOT FOUND

Configured path: {config.product_repo_path}
Resolved absolute path: {absolute_path}

This is a configuration error. In multi-repo mode, implementation
repositories MUST be able to access the product repository.

TO FIX:
1. Verify product repository exists at the configured path
2. Check core-config.yaml:
   project:
     mode: multi-repo
     multi_repo:
       product_repo_path: {current_value}  ← Verify this path
3. Ensure the path is correct (relative or absolute)

Example correct configuration:
  project:
    mode: multi-repo
    multi_repo:
      role: backend
      product_repo_path: ../my-product-repo

If you need to work offline without product repo access:
- Consider using monolith mode temporarily
- Or create a local copy of the product repo
```

**HALT** - Do not proceed.

#### 3.2 Validate PRD Sharded Location Exists

Check if `{epic_location}` directory exists.

**IF NOT exists**:

```
❌ PRD SHARDED LOCATION NOT FOUND IN PRODUCT REPO

Product repo: {config.product_repo_path} (exists ✓)
Expected directory: {epic_location}

The product repository exists but PRD sharding has not been completed.

TO FIX:
1. Navigate to product repository:
   cd {config.product_repo_path}

2. Run the PO shard command:
   @po *shard

3. Return to this repository and retry the current operation

Alternatively, create the directory manually:
  mkdir -p {epic_location}
```

**HALT** - Do not proceed.

---

### Step 4: Locate Epic File

**Search for Epic file**:

```bash
ls {epic_location}/epic-{epic_id}-*.yaml
```

**IF file found**:
- Store `epic_file = {found_file_path}`
- Store `epic_exists = true`

**IF file NOT found**:
- Store `epic_file = null`
- Store `epic_exists = false`

---

### Step 5: Create Epic 0 (Conditional)

**IF epic_exists = false AND create_if_missing = true AND epic_id = "0"**:

#### 5.1 Generate Epic 0 File

**Filename**: `epic-0-technical-debt.yaml`

**Content**:
```yaml
epic_id: 0
title: "Technical Foundation & Debt"
description: |
  Technical improvements, refactoring, and debt reduction.
  Stories prioritized by impact and urgency.

  This Epic serves as a catch-all for:
  - Infrastructure improvements
  - Cross-cutting technical concerns
  - Technical debt paydown
  - Small-scope refactoring

repository_scope: all

stories: []
```

#### 5.2 Write File

Write to: `{epic_location}/epic-0-technical-debt.yaml`

**Store**:
- `epic_file = {epic_location}/epic-0-technical-debt.yaml`
- `created = true`

---

## Output

```yaml
result:
  epic_location: "{epic_location}"
  epic_file: "{epic_file}"          # Full path to Epic file, or null if not found
  epic_exists: {boolean}            # Whether Epic file was found
  created: {boolean}                # Whether Epic 0 was created by this execution
  config:
    mode: "{mode}"
    role: "{role}"
    repository_id: "{repository_id}"
```

**Error Output** (if validation failed):

```yaml
error: true
error_type: "PRODUCT_REPO_NOT_FOUND" | "PRD_LOCATION_NOT_FOUND"
error_message: "{detailed error message}"
```

---

## Usage Examples

### Example 1: Locate Epic 0 (Read-Only)

```yaml
Input:
  epic_id: "0"
  create_if_missing: false

Output:
  epic_location: "../product-repo/docs/prd"
  epic_file: "../product-repo/docs/prd/epic-0-technical-debt.yaml"
  epic_exists: true
  created: false
```

### Example 2: Locate Epic 0, Create If Missing

```yaml
Input:
  epic_id: "0"
  create_if_missing: true

Output:
  epic_location: "../product-repo/docs/prd"
  epic_file: "../product-repo/docs/prd/epic-0-technical-debt.yaml"
  epic_exists: true
  created: true   # Was just created
```

### Example 3: Locate Specific Epic

```yaml
Input:
  epic_id: "3"
  create_if_missing: false

Output:
  epic_location: "docs/prd"
  epic_file: "docs/prd/epic-3-user-auth.yaml"
  epic_exists: true
  created: false
```

### Example 4: Error - Product Repo Not Found

```yaml
Input:
  epic_id: "0"
  create_if_missing: true

Output:
  error: true
  error_type: "PRODUCT_REPO_NOT_FOUND"
  error_message: "❌ PRODUCT REPOSITORY NOT FOUND..."
```
