# Configuration Structure Migration Guide

> **Version 8.3.0+** - Simplified Multi-Repo Configuration

This guide helps you migrate from the old multi-repo configuration structure to the new simplified structure introduced in Orchestrix 8.3.0.

---

## 🎯 Why This Change?

**Problem with Old Structure:**

- Configuration was scattered across multiple top-level fields
- `project.type` served dual purposes (mode AND role)
- `product_repo.enabled` was redundant
- Configuration complexity was high

**Benefits of New Structure:**

- ✅ **Clearer**: `mode` indicates single vs multi-repo, `role` indicates repository purpose
- ✅ **Organized**: All multi-repo config under `multi_repo` namespace
- ✅ **Simpler**: No redundant `enabled` flag - mode implies multi-repo
- ✅ **Consistent**: Same pattern across all repositories

---

## 📊 Configuration Comparison

### Old Structure (≤ 8.2.x)

```yaml
project:
  name: My Project
  type: product-planning # or: monolith, backend, frontend, ios, android

  # Scattered configuration
  repository_id: my-app-backend

  product_repo:
    enabled: true
    path: ../my-app-product

  story_assignment:
    auto_filter: true
    assigned_stories: []

# Top-level implementation repos (product repos only)
implementation_repos:
  - repository_id: my-app-backend
    path: ../my-app-backend
    type: backend
```

### New Structure (8.3.0+)

```yaml
project:
  name: My Project
  mode: multi-repo # monolith | multi-repo

  # All multi-repo config centralized
  multi_repo:
    role: product # product | implementation | backend | frontend | ios | android | mobile
    repository_id: my-app-backend
    product_repo_path: ../my-app-product

    # Product repos only
    implementation_repos:
      - repository_id: my-app-backend
        path: ../my-app-backend
        type: backend

    # Story filtering (optional)
    auto_filter_stories: true
    assigned_stories: []
```

---

## 🔄 Migration Mapping

### Field-by-Field Mapping

| Old Field                           | New Field                                                 | Notes                         |
| ----------------------------------- | --------------------------------------------------------- | ----------------------------- |
| `project.type: monolith`            | `project.mode: monolith`                                  | Mode unchanged                |
| `project.type: product-planning`    | `project.mode: multi-repo`<br>`multi_repo.role: product`  | Separated mode from role      |
| `project.type: backend`             | `project.mode: multi-repo`<br>`multi_repo.role: backend`  | Separated mode from role      |
| `project.type: frontend`            | `project.mode: multi-repo`<br>`multi_repo.role: frontend` | Separated mode from role      |
| `project.type: ios`                 | `project.mode: multi-repo`<br>`multi_repo.role: ios`      | Separated mode from role      |
| `project.type: android`             | `project.mode: multi-repo`<br>`multi_repo.role: android`  | Separated mode from role      |
| `project.repository_id`             | `multi_repo.repository_id`                                | Nested under multi_repo       |
| `product_repo.enabled`              | _(removed)_                                               | Implied by `mode: multi-repo` |
| `product_repo.path`                 | `multi_repo.product_repo_path`                            | Renamed and nested            |
| `story_assignment.auto_filter`      | `multi_repo.auto_filter_stories`                          | Nested under multi_repo       |
| `story_assignment.assigned_stories` | `multi_repo.assigned_stories`                             | Nested under multi_repo       |
| `implementation_repos` (top-level)  | `multi_repo.implementation_repos`                         | Nested under multi_repo       |

---

## 🚀 Quick Migration (Automated)

### Option 1: Use Migration Script

```bash
# Migrate single config file
node tools/migrate-config-structure.js core-config.yaml

# Migrate all config files in current directory tree
node tools/migrate-config-structure.js --all

# Show help
node tools/migrate-config-structure.js --help
```

The script will:

- ✅ Automatically detect old structure
- ✅ Convert to new structure
- ✅ Create `.backup` files
- ✅ Validate the migration

### Option 2: Manual Migration

Follow the [Step-by-Step Manual Migration](#-step-by-step-manual-migration) below.

---

## 📝 Step-by-Step Manual Migration

### Scenario 1: Product Repository

**Before:**

```yaml
project:
  name: My E-Commerce App
  type: product-planning

implementation_repos:
  - repository_id: my-app-backend
    path: ../my-app-backend
    type: backend
  - repository_id: my-app-web
    path: ../my-app-web
    type: frontend
```

**After:**

```yaml
project:
  name: My E-Commerce App
  mode: multi-repo

  multi_repo:
    role: product
    repository_id: "" # Optional for product repos

    implementation_repos:
      - repository_id: my-app-backend
        path: ../my-app-backend
        type: backend
      - repository_id: my-app-web
        path: ../my-app-web
        type: frontend
```

**Steps:**

1. Change `type: product-planning` → `mode: multi-repo`
2. Add `multi_repo.role: product`
3. Move `implementation_repos` under `multi_repo`

---

### Scenario 2: Backend Implementation Repository

**Before:**

```yaml
project:
  name: My E-Commerce App
  type: backend
  repository_id: my-app-backend

  product_repo:
    enabled: true
    path: ../my-app-product

  story_assignment:
    auto_filter: true
    assigned_stories: []
```

**After:**

```yaml
project:
  name: My E-Commerce App
  mode: multi-repo

  multi_repo:
    role: backend
    repository_id: my-app-backend
    product_repo_path: ../my-app-product
    auto_filter_stories: true
    assigned_stories: []
```

**Steps:**

1. Change `type: backend` → `mode: multi-repo`
2. Add `multi_repo.role: backend`
3. Move `repository_id` → `multi_repo.repository_id`
4. Change `product_repo.path` → `multi_repo.product_repo_path`
5. Remove `product_repo.enabled` (no longer needed)
6. Move `story_assignment` fields → `multi_repo.auto_filter_stories` and `multi_repo.assigned_stories`

---

### Scenario 3: Monolith Repository (No Change Needed)

**Before:**

```yaml
project:
  name: My Monolith App
  type: monolith
```

**After:**

```yaml
project:
  name: My Monolith App
  mode: monolith

  multi_repo:
    role: implementation
    repository_id: ""
    product_repo_path: ""
    auto_filter_stories: false
    assigned_stories: []
```

**Steps:**

1. Change `type: monolith` → `mode: monolith`
2. Add default `multi_repo` section (will be ignored)

---

## ✅ Validation After Migration

### 1. Validate Configuration Structure

```bash
# For product repos
node tools/utils/validate-multi-repo-config.js .

# Check for syntax errors
yq eval '.' core-config.yaml
```

### 2. Check Configuration Values

**Product Repository:**

```bash
# Should output: multi-repo
yq eval '.project.mode' core-config.yaml

# Should output: product
yq eval '.project.multi_repo.role' core-config.yaml

# Should output list of implementation repos
yq eval '.project.multi_repo.implementation_repos' core-config.yaml
```

**Implementation Repository:**

```bash
# Should output: multi-repo
yq eval '.project.mode' core-config.yaml

# Should output: backend, frontend, ios, android, or mobile
yq eval '.project.multi_repo.role' core-config.yaml

# Should output path to product repo
yq eval '.project.multi_repo.product_repo_path' core-config.yaml

# Should output your repository ID
yq eval '.project.multi_repo.repository_id' core-config.yaml
```

### 3. Test Agent Commands

```bash
# In implementation repo - should work correctly
@sm *create-next-story

# In product repo - should work correctly
@po *shard

# Verify no errors about missing configuration
```

---

## 🔍 Troubleshooting

### Issue: "project.type is deprecated" Warning

**Cause:** Your config still has the old `project.type` field.

**Fix:**

```yaml
# Remove this:
project:
  type: backend

# Replace with:
project:
  mode: multi-repo
  multi_repo:
    role: backend
```

---

### Issue: "product_repo.enabled is deprecated" Warning

**Cause:** Your config still references `product_repo.enabled`.

**Fix:**

```yaml
# Remove this:
product_repo:
  enabled: true
  path: ../my-app-product

# Replace with:
project:
  mode: multi-repo
  multi_repo:
    product_repo_path: ../my-app-product
```

---

### Issue: Validation Errors After Migration

**Check:**

1. Run migration script again: `node tools/migrate-config-structure.js core-config.yaml`
2. Validate YAML syntax: `yq eval '.' core-config.yaml`
3. Check for typos in field names
4. Ensure `mode` is either `monolith` or `multi-repo`
5. Ensure `role` is valid: `product`, `implementation`, `backend`, `frontend`, `ios`, `android`, or `mobile`

---

### Issue: Epic YAML Stories Not Found

**Cause:** Repository ID mismatch.

**Fix:**

```yaml
# In implementation repo core-config.yaml
project:
  multi_repo:
    repository_id: my-app-backend # Must match Epic YAML

# In Epic YAML (docs/epics/epic-1-*.yaml)
stories:
  - id: "1.1"
    repository: "my-app-backend" # Must match config
```

---

## 📚 Migration Checklist

- [ ] **Backup your config files**

  ```bash
  cp core-config.yaml core-config.yaml.backup
  ```

- [ ] **Run migration script** (or manual migration)

  ```bash
  node tools/migrate-config-structure.js core-config.yaml
  ```

- [ ] **Validate structure**

  ```bash
  yq eval '.' core-config.yaml
  ```

- [ ] **Test in Product Repo** (if applicable)

  ```bash
  node tools/utils/validate-multi-repo-config.js .
  ```

- [ ] **Test Agent Commands**
  - [ ] `@sm *create-next-story` (implementation repos)
  - [ ] `@po *shard` (product repos)
  - [ ] `@architect *create-system-architecture` (product repos)

- [ ] **Update all implementation repos**

  ```bash
  # In each implementation repo
  node ../product-repo/tools/migrate-config-structure.js core-config.yaml
  ```

- [ ] **Re-validate entire multi-repo setup**

  ```bash
  # From product repo
  node tools/utils/validate-multi-repo-config.js .
  ```

- [ ] **Commit changes**

  ```bash
  git add core-config.yaml
  git commit -m "feat: migrate to new config structure (v8.3.0+)"
  ```

- [ ] **Delete backup files** (after confirming everything works)
  ```bash
  rm core-config.yaml.backup
  ```

---

## 🆘 Need Help?

**Common Resources:**

- [Multi-Repo Quick Start](./QUICK_START_MULTI_REPO.md)
- [Multi-Repo Greenfield Guide](./MULTI_REPO_GREENFIELD_GUIDE.md)
- [Multi-Repo Brownfield Guide](./MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md)

**Report Issues:**

- GitHub: https://github.com/dorayo/ORCHESTRIX/issues
- Include your `core-config.yaml` (redact sensitive info)
- Specify Orchestrix version: `npx orchestrix --version`

---

## 📖 Additional Notes

### Backward Compatibility

The config loader (`tools/installer/lib/config-loader.js`) includes automatic migration logic, so old configs will still work with deprecation warnings. However, it's recommended to migrate to the new structure for clarity and future compatibility.

### Breaking Changes

None. The new structure is additive - old configs are automatically migrated at runtime.

### Future Deprecation

In Orchestrix 9.0.0, the old configuration fields will no longer be supported. Migrate now to avoid issues.

---

**Migration Complete!** 🎉

Your configuration now uses the simplified structure, making multi-repo setup clearer and easier to maintain.
