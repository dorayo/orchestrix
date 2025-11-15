# Core Config Architecture Path Configuration

## Overview

The `architecture` section in `core-config.yaml` must be configured differently depending on your project mode.

## Configuration by Project Mode

### Single-Repository (Monolith) Projects

```yaml
# core-config.yaml
project:
  mode: monolith

architecture:
  architectureFile: docs/architecture.md
  architectureSharded: false # Will be set to true after *shard
  architectureShardedLocation: docs/architecture
```

**Workflow**:

1. `@architect *document-project` → Creates `docs/architecture.md`
2. `@po *shard` → Creates `docs/architecture/00-*.md`, `01-*.md`, etc.

### Multi-Repository Product (Planning) Projects

```yaml
# core-config.yaml (Product repository)
project:
  mode: multi-repo
  multi_repo:
    role: product

architecture:
  architectureFile: docs/system-architecture.md
  architectureSharded: false # Will be set to true after *shard
  architectureShardedLocation: docs/system-architecture
```

**Workflow**:

1. `@architect *create-system-architecture` → Creates `docs/system-architecture.md`
2. `@po *shard` → Creates `docs/system-architecture/00-*.md`, `01-*.md`, etc.

### Multi-Repository Implementation Projects

```yaml
# core-config.yaml (Backend/Frontend/Mobile repository)
project:
  mode: multi-repo
  multi_repo:
    role: backend # or frontend, ios, android, mobile
    product_repo_path: ../my-app-product

architecture:
  architectureFile: docs/architecture.md
  architectureSharded: false # Will be set to true after *shard
  architectureShardedLocation: docs/architecture
```

**Workflow**:

1. `@architect *create-backend-architecture` → Creates `docs/architecture.md`
2. `@po *shard` → Creates `docs/architecture/00-*.md`, `01-*.md`, etc.

## Directory Structure Examples

### Single-Repository Project

```
docs/
├── prd.md
├── architecture.md          # ← Source file
└── architecture/            # ← Sharded output
    ├── 00-architecture-overview.md
    ├── 01-tech-stack.md
    ├── 02-source-tree.md
    ├── 03-coding-standards.md
    └── ...
```

### Multi-Repository Product Project

```
docs/
├── prd.md
├── system-architecture.md   # ← Source file
├── system-architecture/     # ← Sharded output
│   ├── 00-system-overview.md
│   ├── 01-repository-topology.md
│   ├── 02-api-contracts.md
│   └── ...
└── epics/
    ├── epic-1-*.yaml
    └── epic-2-*.yaml
```

### Multi-Repository Implementation Project

```
docs/
├── architecture.md          # ← Source file (backend-specific)
└── architecture/            # ← Sharded output
    ├── 00-architecture-overview.md
    ├── 01-tech-stack.md
    ├── 02-source-tree.md
    ├── 03-coding-standards.md
    ├── 04-component-architecture.md
    ├── 05-database-schema.md
    └── ...
```

## Troubleshooting

### Issue: `*shard` shows "architecture.md not found - already sharded"

**Cause**: Mismatch between `architectureFile` in config and actual file path.

**Solution**:

1. Check actual file location: `ls -la docs/*.md docs/architecture/*.md`
2. Update `architectureFile` in `core-config.yaml` to match actual path
3. Set `architectureSharded: false`
4. Run `@po *shard` again

### Issue: Architecture shards to wrong directory

**Example**: `docs/architecture/system-architecture/00-*.md` instead of `docs/system-architecture/00-*.md`

**Cause**: `architectureFile` path is incorrect for project mode.

**Solution**: Use the correct path for your project mode (see above).

## Migration from Old Paths

If you have an existing project with `docs/architecture/system-architecture.md`:

```bash
# In Product repository
cd my-app-product

# Move file to correct location
mv docs/architecture/system-architecture.md docs/system-architecture.md

# Update core-config.yaml
# Change: architectureFile: docs/architecture/system-architecture.md
# To:     architectureFile: docs/system-architecture.md

# Reset sharding flag
# Change: architectureSharded: true
# To:     architectureSharded: false

# Re-shard
@po *shard
```

## Related Documentation

- [Multi-Repository Brownfield Enhancement Guide](MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md)
- [Configuration Migration Guide](CONFIGURATION_MIGRATION_GUIDE.md)
