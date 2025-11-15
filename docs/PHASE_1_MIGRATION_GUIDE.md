# Phase 1 Migration Guide (v8.1.1+)

> **For existing Orchestrix multi-repository projects**: Quick migration guide for Phase 1 critical fixes.

## 📊 What Changed?

**5 Critical Fixes**:

1. ✅ `repository_id` field now required in `implementation_repos[]`
2. ✅ New multi-repo config validator tool
3. ✅ Fixed dependency checker path resolution
4. ✅ Repository type checks in PO shard
5. ✅ Deprecated legacy brownfield workflows

**Breaking Changes**: **NONE** (backward compatible)

---

## 🚀 Migration Steps

### Step 1: Update Product Repository Config

**File**: `<product-repo>/core-config.yaml`

**Before** (v8.1.0 and earlier):

```yaml
implementation_repos:
  - path: ../my-app-backend
    type: backend
  - path: ../my-app-web
    type: frontend
```

**After** (v8.1.1+):

```yaml
implementation_repos:
  - repository_id: my-app-backend # ⚠️ ADD THIS - must match Epic YAML
    path: ../my-app-backend
    type: backend
  - repository_id: my-app-web # ⚠️ ADD THIS
    path: ../my-app-web
    type: frontend
```

**Rules**:

- `repository_id` must be **unique** across all repos
- Must match the `repository` field in Epic YAML files
- Recommended format: `{project}-{type}` (e.g., `my-app-backend`)

---

### Step 2: Update Implementation Repository Configs (Optional)

**File**: `<impl-repo>/core-config.yaml`

**Add repository_id** for better validation:

```yaml
project:
  name: My App Backend
  type: backend
  repository_id: my-app-backend # ⚠️ ADD THIS (optional but recommended)
  product_repo:
    enabled: true
    path: ../my-app-product
```

**Why?**: Enables bidirectional config validation.

---

### Step 3: Validate Configuration

**Run the new validator**:

```bash
cd <product-repo>
node ../orchestrix/tools/utils/validate-multi-repo-config.js .
```

**Expected output**:

```
=== Multi-Repository Configuration Validation ===

✅ PASSED CHECKS:
  ✓ [Product Type] Project type is "product-planning"
  ✓ [Implementation Repos] Found 3 implementation repositories
  ✓ [Bidirectional Link] my-app-backend correctly links back to Product repo
  ✓ [Bidirectional Link] my-app-web correctly links back to Product repo
  ✓ [Impl Type] my-app-backend type matches: "backend"
  ✓ [Story Repository] All 15 stories reference valid repositories

=== Summary ===
Passed: 10
Warnings: 0
Errors: 0
```

**If you see errors**: Follow the fix suggestions in the output.

---

## 🔧 Troubleshooting

### Error: "Missing repository_id field"

**Solution**: Add `repository_id` to each entry in `implementation_repos[]` (see Step 1).

### Error: "Duplicate repository_id found"

**Solution**: Ensure each `repository_id` is unique. Use project-specific names like `my-app-backend`, not generic ones like `backend`.

### Error: "Story references unknown repository"

**Solution**:

1. Check Epic YAML files in `docs/epics/`
2. Ensure all `repository` fields match a `repository_id` in Product config
3. Fix mismatched names

### Warning: "Repository not referenced in any epic"

**Impact**: Low - repository is configured but not used in current epics.

**Action**: Either remove unused repo from config, or create stories for it.

---

## 🎯 Benefits After Migration

1. ✅ **Reliable Dependency Checking** - No more path resolution bugs
2. ✅ **Early Error Detection** - Validator catches config issues before runtime
3. ✅ **Clear Workflow Guidance** - Deprecated warnings prevent confusion
4. ✅ **Type Safety** - PO shard blocks in wrong repository types
5. ✅ **Future-Proof** - Prepares for Phase 2+ enhancements

---

## 📚 Related Documentation

- [Multi-Repository Brownfield Enhancement Guide](./MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md)
- [Multi-Repository Greenfield Guide](./MULTI_REPO_GREENFIELD_GUIDE.md)
- [Phase 1 Changelog](../CHANGELOG.md) (when released)

---

## ❓ FAQ

### Q: Do I need to migrate immediately?

**A**: No. The old format still works (fallback mode). However, migrating now gives you:

- Better error messages
- Config validation
- Future compatibility

### Q: What if I don't add repository_id?

**A**: Orchestrix will use fallback mode:

1. Reads each implementation repo's `core-config.yaml`
2. Extracts `project.repository_id` from there
3. Slower and less reliable

**Recommended**: Add `repository_id` for best performance.

### Q: Can I use different repository names?

**A**: Yes! `repository_id` is independent of directory name:

```yaml
- repository_id: my-custom-backend-service # Epic YAML uses this
  path: ../backend-api # Directory name
  type: backend
```

Just ensure Epic YAML files use the same `repository_id`.

---

## 🆘 Need Help?

1. Run validator: `node tools/utils/validate-multi-repo-config.js .`
2. Check error messages for fix suggestions
3. Review updated examples in Enhancement Guide
4. Open issue: [GitHub Issues](https://github.com/dorayo/ORCHESTRIX/issues)

---

**Last Updated**: v8.1.1 - Phase 1 Critical Path Fixes
