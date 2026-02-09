# Solo Init

Bootstrap a new project AND implement the initial features described by the user — all in one shot.

## Inputs

```yaml
required:
  - description: 'Natural language description of the project and its initial features'
```

## Execution

### Phase 0: Validate Environment

0.1 Check directory state:
- Run `ls` in current directory.
- IF non-empty AND not a bare git repo: warn user `"Directory is not empty. Continue anyway?"`. Proceed only on confirmation.

0.2 Detect runtime:
- Check `node --version`, `python --version`, or relevant runtime.
- IF missing: HALT with install instructions.

### Phase 1: Parse Intent

Extract from description:

```yaml
project_type: web_app | api | cli | library | other
framework: next | nuxt | sveltekit | express | fastapi | rails | other
key_dependencies: [list of named deps, e.g. tailwind, prisma, shadcn]
initial_features: [list of features to implement after scaffold]
```

IF description is too vague to determine framework or project type:
- Ask at most 2 clarifying questions. Examples:
  - "Which framework? (Next.js / Nuxt / other)"
  - "Need a database? (Prisma / Drizzle / none)"
- Do NOT ask about features — infer from description.

### Phase 2: Scaffold

2.1 Run framework CLI:
- Example: `npx create-next-app@latest {project_name} --typescript --tailwind --app --eslint`
- Adapt flags to match user-specified deps.
- IF running inside an existing directory (non-empty but user confirmed): adapt accordingly.

2.2 Install additional dependencies:
- For each item in `key_dependencies` not covered by the scaffold CLI, run `npm install` / `pip install` / equivalent.

2.3 Configure tooling:
- Set up config files for added deps (e.g. prisma init, shadcn init).
- Create sensible directory structure if the framework scaffold is minimal.

2.4 Verify scaffold:
- Run dev server briefly OR run build to confirm project compiles.
- IF fails: fix and retry (max 2 attempts). HALT if still broken.

### Phase 3: Implement Initial Features (TDD)

For each feature in `initial_features`:

3.1 Plan: determine files to create/modify and test cases to write.

3.2 Risk check (inline, advisory only — never block):
- IF feature involves DB schema changes → warn: suggest migration + rollback verification.
- IF feature involves security logic → warn: suggest mature library.
- Wait for user confirmation. IF user declines: skip that feature, continue with rest.

3.3 TDD cycle (per feature):
- IF test framework exists in the scaffold:
  - **Red**: Write failing test(s) that define the feature's expected behavior.
  - **Green**: Write minimal code to make tests pass. Follow project coding standards (from `devLoadAlwaysFiles` if available).
  - **Refactor**: Clean up if needed, re-run tests.
- IF no test framework: write code directly, verify manually.

3.4 Verify:
- Run tests + lint after all features are implemented (not after each one).
- IF fail: fix and retry (max 3 attempts).
- IF still failing after 3 attempts: commit what works, note failures in output.

### Phase 4: Commit

4.1 Stage all project files:
- `git init` if no git repo exists.
- `git add` relevant files. Exclude secrets, .env, node_modules, etc.

4.2 Create initial commit:

```
feat: init {project_name} with {framework} and {key_deps_summary}

{brief list of initial features implemented}

🤖 Generated with [Orchestrix](https://orchestrix-mcp.youlidao.ai)
```

4.3 Verify: `git log -1 --oneline` to confirm.

### Phase 5: Output

```
✅ Project initialized

📁 {project_name}/
{tree of key directories, max 2 levels deep}

📦 Stack: {framework}, {dep1}, {dep2}, ...
🔧 Dev server: {start_command}

✅ Initial features:
- {feature_1}
- {feature_2}

📦 {commit_hash} feat: init {project_name} with {summary}

📋 Next: use *do "{description}" to add more features.
```

## Error Handling

| Condition | Action |
|-----------|--------|
| Runtime not installed | HALT with install instructions |
| Scaffold CLI fails | Fix flags and retry once. HALT if still broken. |
| Build/compile fails after scaffold | Fix and retry (max 2). HALT if broken. |
| Test failures after feature impl | Fix and retry (max 3). Commit working code if partially failing. |
| Git commit fails | Output manual commit instructions. |
