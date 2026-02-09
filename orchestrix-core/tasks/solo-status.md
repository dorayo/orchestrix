# Solo Status

Show project status: recent git activity and backlog state.

## Inputs

```yaml
required: none
```

## Execution

### Step 1: Git Log

Run `git log --oneline -10` to get recent commits.

### Step 2: Backlog

IF `BACKLOG.md` exists: read and count pending / done items.
IF not: note "No backlog file."

### Step 3: Project Stats

- Count source files (exclude node_modules, .git, dist, build, __pycache__).
- Read package.json (or equivalent) for dependency count.

### Step 4: Output

```
📊 {project_name}

🔧 Recent commits:
- {hash} {message} ({time_ago})
- {hash} {message} ({time_ago})
- ...

📋 Backlog: {pending_count} pending, {done_count} done
{list pending items, max 5}

📁 {file_count} source files | 📦 {dep_count} dependencies
```
