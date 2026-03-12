# PO - Shard Documents

## Prerequisites

1. PRD: `docs/prd.md` with "Epics" section containing YAML blocks
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

**Step 2.3.1: Rename PRD shard files to English section IDs**

[[LLM: After md-tree explode produces sharded files, standardize filenames to English section IDs from the PRD template. This ensures consistent cross-language file naming.

CHECK: List .md files in docs/prd/ (excluding index.md). If all filenames are already ASCII/English and match known section IDs, skip this step.

PRD TYPE DETECTION:
- Read the sharded file headings or index.md content
- If headings contain "Technical Assumptions" or "Epic List" → greenfield mapping
- If headings contain "Intro Project Analysis" or "Technical Constraints" or "Enhancement Scope" → brownfield mapping
- Default: greenfield

GREENFIELD PRD MAPPING (section-id ← keywords):
| Target Filename      | Match Keywords (EN)                      | Match Keywords (ZH)                    |
|----------------------|------------------------------------------|----------------------------------------|
| goals-context        | goals, background context                | 目标, 背景                              |
| requirements         | requirements                             | 需求                                    |
| ui-goals             | user interface, ui design, design goals  | 用户界面, UI设计, 界面设计              |
| technical-assumptions| technical assumption                     | 技术假设                                |
| epic-list            | epic list                                | Epic列表, 史诗列表                      |
| epics                | epics (exact match only)                 | Epics                                   |
| checklist-results    | checklist result                         | 检查结果, 清单结果                      |
| next-steps           | next step                                | 下一步, 后续步骤                        |

BROWNFIELD PRD MAPPING:
| Target Filename        | Match Keywords (EN)                    | Match Keywords (ZH)                  |
|------------------------|----------------------------------------|--------------------------------------|
| intro-analysis         | intro, analysis, project analysis      | 项目分析, 分析和上下文                |
| requirements           | requirements                           | 需求                                  |
| ui-enhancement-goals   | ui enhancement, interface enhancement  | 界面增强, 用户界面增强                |
| technical-constraints  | technical constraint, integration req  | 技术约束, 技术限制                    |
| epic-structure         | epic structure, story structure        | Epic结构, Story结构                   |
| epics                  | epics (exact match only)               | Epics                                 |

RENAME PROCEDURE:
1. List all .md files in docs/prd/ (excluding index.md and epic-*.yaml files)
2. For each file:
   a. Read the first heading line (# ...) to get the section title
   b. Strip any numeric prefix from the filename: remove leading `\d+-` pattern (e.g., `8-next-steps.md` → `next-steps`, `3-Goals-Context.md` → `Goals-Context`). Then lowercase the result for comparison.
   c. If the stripped, lowercased filename already matches a known English section ID → skip
   d. Match the heading text against the appropriate mapping table using case-insensitive keyword matching
   e. If match found and differs from current filename → rename: mv "{old}.md" "{new_section_id}.md"
   f. If no match → keep original filename, log warning
3. After all renames, update index.md:
   a. Read index.md content
   b. For each renamed file, replace old filename references with new filename in markdown links
   c. Write updated index.md
4. Output report

IMPORTANT:
- Do NOT rename epic-*.yaml files (those are handled by extract-epics.js)
- Do NOT rename index.md
- If two files map to the same English name (should not happen), append numeric suffix and warn

REPORT FORMAT:
```
📝 PRD Shard File Renaming:
   Renamed: {old_name}.md → {new_name}.md
   Skipped: {name}.md (already English)
   ⚠️ No match: {name}.md (kept original)
   Updated: index.md ({N} link references updated)
```
]]

**Step 2.4: Extract Epic YAML to standalone files**

Use the `extract-epics.js` script to extract all YAML blocks containing `epic_id:` from the PRD file:

```bash
# Extract Epic YAML files using the dedicated script
node .orchestrix-core/utils/extract-epics.js docs/prd.md docs/prd

# The script automatically:
# - Parses the PRD markdown file
# - Extracts all YAML code blocks with epic_id:
# - Validates Epic structure (required: epic_id, title, stories)
# - Generates slug-based filenames (e.g., "User Authentication" → "user-authentication")
# - Outputs to docs/prd/epic-{n}-{title-slug}.yaml
#
# Example output:
# ═══════════════════════════════════════════════════════
# Epic YAML Extractor
# ═══════════════════════════════════════════════════════
# ✅ 提取完成
# 📋 统计:
#    Epic 数量: 6
#    Story 数量: 42
#    Repository 类型: backend, frontend, android
# 📁 生成的文件:
#    ✓ epic-1-user-authentication.yaml
#    ✓ epic-2-product-catalog.yaml
```

**Fallback (if script not available):**

If the extraction script is not installed, manually extract each `epic_id:` YAML block from the Epics section and save to `docs/prd/epic-{n}-{title}.yaml`.

**Validate extraction:**

```bash
EPIC_COUNT=$(ls docs/prd/epic-*.yaml 2>/dev/null | wc -l | tr -d ' ')

if [ "$EPIC_COUNT" -eq 0 ]; then
  echo "⚠️ WARNING: No Epic YAML files extracted"
  echo ""
  echo "Expected format in Epics section:"
  echo '```yaml'
  echo 'epic_id: 1'
  echo 'title: "Epic Title"'
  echo 'stories:'
  echo '  - id: "1.1"'
  echo '    repository_type: backend'
  echo '    acceptance_criteria:'
  echo '      - "AC1: User can..."'
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

**Step 3.3.1: Rename architecture shard files to English section IDs**

[[LLM: After md-tree explode produces sharded architecture files, standardize filenames to English section IDs from the architecture templates. This is CRITICAL because Dev agent's `load-architecture-context` uses glob patterns like `*tech-stack.md`, `*coding-standards.md` which only match English filenames.

CHECK: List .md files in {ARCH_DIR}/ (excluding index.md). If all filenames are already ASCII/English and match known section IDs, skip this step.

ARCHITECTURE TYPE DETECTION (priority order):
1. Check core-config.yaml `architectureFile` path:
   - Contains "system-architecture" → system type
   - Contains "ui-architecture" → frontend type
2. Check core-config.yaml `multi_repo.role`:
   - role = backend → backend type
   - role = frontend → frontend type
   - role = ios/android/mobile → mobile type
3. Content-based fallback (read sharded file headings):
   - Contains "REST API Spec" or "Database Schema" or "Data Models" → backend
   - Contains "Component Standards" or "Styling Guidelines" → frontend
   - Contains "App Architecture" or "Screen Structure" or "Push Notifications" → mobile
   - Contains "Repository Topology" or "Cross-Cutting Concerns" → system
4. Default for monolith without explicit role → backend

BACKEND ARCHITECTURE MAPPING (architecture-tmpl.yaml):
| Target Filename              | Match Keywords (EN)                      | Match Keywords (ZH)                  |
|------------------------------|------------------------------------------|--------------------------------------|
| introduction                 | introduction                             | 简介, 介绍                            |
| system-architecture-context  | system architecture context              | 系统架构上下文                        |
| high-level-architecture      | high level architecture                  | 高层架构, 高级架构                    |
| tech-stack                   | tech stack, technology stack             | 技术栈                                |
| data-models                  | data model                               | 数据模型                              |
| components                   | components                               | 组件                                  |
| external-apis                | external api                             | 外部API, 外部接口                     |
| core-workflows               | core workflow                            | 核心工作流, 核心流程                  |
| rest-api-spec                | rest api, api spec, api specification    | API规范, API接口, REST API            |
| database-schema              | database schema, database design         | 数据库                                |
| source-tree                  | source tree, project structure           | 源码目录, 项目结构, 源代码            |
| infrastructure-deployment    | infrastructure, deployment               | 基础设施, 部署                        |
| error-handling-strategy      | error handling                           | 错误处理                              |
| coding-standards             | coding standard                          | 编码规范, 编码标准                    |
| testing-strategy             | test strategy, testing strategy          | 测试策略                              |
| security                     | security                                 | 安全                                  |
| checklist-results            | checklist result                         | 检查结果                              |
| next-steps                   | next step                                | 下一步, 后续                          |

FRONTEND ARCHITECTURE MAPPING (front-end-architecture-tmpl.yaml):
| Target Filename              | Match Keywords (EN)                      | Match Keywords (ZH)                  |
|------------------------------|------------------------------------------|--------------------------------------|
| template-framework-selection | template, framework selection            | 模板, 框架选择                        |
| system-architecture-context  | system architecture context              | 系统架构上下文                        |
| tech-stack                   | tech stack, frontend tech                | 技术栈, 前端技术                      |
| source-tree                  | source tree, project structure           | 项目结构, 源码目录                    |
| component-standards          | component standard                       | 组件标准, 组件规范                    |
| state-management             | state management                         | 状态管理                              |
| api-integration              | api integration                          | API集成, API对接                      |
| routing                      | routing                                  | 路由                                  |
| styling-guidelines           | styling, style guide                     | 样式, 样式指南                        |
| testing-strategy             | test strategy, testing                   | 测试策略, 测试                        |
| environment-configuration    | environment configuration                | 环境配置                              |
| coding-standards             | coding standard                          | 编码规范, 编码标准                    |

MOBILE ARCHITECTURE MAPPING (mobile-architecture-tmpl.yaml):
| Target Filename              | Match Keywords (EN)                      | Match Keywords (ZH)                  |
|------------------------------|------------------------------------------|--------------------------------------|
| system-architecture-context  | system architecture context              | 系统架构上下文                        |
| tech-stack                   | tech stack, mobile tech                  | 技术栈, 移动技术                      |
| source-tree                  | source tree, project structure           | 项目结构, 源码目录                    |
| app-architecture             | app architecture                         | 应用架构, App架构                     |
| screen-structure             | screen structure                         | 屏幕结构, 页面结构                    |
| state-management             | state management                         | 状态管理                              |
| api-integration              | api integration                          | API集成                              |
| local-data-management        | local data management, local storage     | 本地数据, 本地存储                    |
| security                     | security                                 | 安全                                  |
| offline-support              | offline support, offline                 | 离线支持, 离线                        |
| push-notifications           | push notification                        | 推送通知                              |
| testing-strategy             | test strategy, testing                   | 测试策略, 测试                        |
| deployment                   | deployment                               | 部署                                  |
| monitoring-and-analytics     | monitoring, analytics                    | 监控, 分析                            |
| coding-standards             | coding standard                          | 编码规范, 编码标准                    |

SYSTEM ARCHITECTURE MAPPING (system-architecture-tmpl.yaml):
| Target Filename              | Match Keywords (EN)                      | Match Keywords (ZH)                  |
|------------------------------|------------------------------------------|--------------------------------------|
| introduction                 | introduction                             | 简介, 介绍                            |
| repository-topology          | repository topology                      | 仓库拓扑, 代码库拓扑                  |
| api-contracts-summary        | api contract, api summary                | API契约, API合约                      |
| integration-strategy         | integration strategy                     | 集成策略                              |
| deployment-architecture      | deployment architecture                  | 部署架构                              |
| cross-cutting-concerns       | cross-cutting, cross cutting             | 横切关注, 跨领域关注                  |
| development-coordination     | development coordination                 | 开发协调                              |
| appendix                     | appendix                                 | 附录                                  |

RENAME PROCEDURE:
1. List all .md files in {ARCH_DIR}/ (excluding index.md)
2. For each file:
   a. Read the first heading line (# ...) to get the section title
   b. Strip any numeric prefix from the filename: remove leading `\d+-` pattern (e.g., `12-coding-standards.md` → `coding-standards`, `3-Tech-Stack.md` → `Tech-Stack`). Then lowercase the result for comparison.
   c. If the stripped, lowercased filename already matches a known English section ID → skip
   d. Match the heading text against the detected architecture type's mapping table using case-insensitive keyword matching
   e. If match found and differs from current filename → rename: mv "{old}.md" "{new_section_id}.md"
   f. If no match → keep original filename, log warning
3. After all renames, update index.md:
   a. Read index.md content
   b. For each renamed file, replace old filename references with new filename in markdown links
   c. Write updated index.md
4. Output report

IMPORTANT:
- Do NOT rename index.md
- If two files map to the same English name (should not happen), append numeric suffix and warn
- The index.md MUST be updated to reflect renames, otherwise *assemble will break

REPORT FORMAT:
```
🏗️ Architecture Shard File Renaming (type: {detected_type}):
   Renamed: {old_name}.md → {new_name}.md
   Skipped: {name}.md (already English)
   ⚠️ No match: {name}.md (kept original)
   Updated: index.md ({N} link references updated)
```
]]

### 4. Archive Original Files

After first sharding, archive original files to prevent confusion about source of truth.

**Create archive directory:**

```bash
mkdir -p docs/.archive
```

**Archive PRD (if exists and was sharded):**

```bash
if [ -f "docs/prd.md" ] && [ "$PRD_SHARDED" = "true" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mv docs/prd.md "docs/.archive/prd.md.${TIMESTAMP}"
  echo "📦 Archived: docs/prd.md → docs/.archive/prd.md.${TIMESTAMP}"
fi
```

**Archive Architecture (if exists and was sharded):**

```bash
if [ -f "docs/architecture.md" ] && [ "$ARCH_SHARDED" = "true" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mv docs/architecture.md "docs/.archive/architecture.md.${TIMESTAMP}"
  echo "📦 Archived: docs/architecture.md → docs/.archive/architecture.md.${TIMESTAMP}"
fi
```

**Archive System Architecture (Multi-repo Product repo):**

```bash
if [ -f "docs/system-architecture.md" ] && [ "$ARCH_SHARDED" = "true" ]; then
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mv docs/system-architecture.md "docs/.archive/system-architecture.md.${TIMESTAMP}"
  echo "📦 Archived: docs/system-architecture.md → docs/.archive/system-architecture.md.${TIMESTAMP}"
fi
```

### 5. Final Report

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

📦 Archived Original Files:
   - docs/.archive/prd.md.{TIMESTAMP}
   - docs/.archive/architecture.md.{TIMESTAMP}

⚙️ Config Updated:
   - prdSharded: true
   - prdShardedLocation: docs/prd
   - architectureSharded: true
   - architectureShardedLocation: {ARCH_DIR}

═══════════════════════════════════════════════════════
⚠️ IMPORTANT - PARADIGM SHIFT
═══════════════════════════════════════════════════════

From now on, the sharded directories are the SINGLE SOURCE OF TRUTH:
   - PRD: docs/prd/
   - Architecture: {ARCH_DIR}/

Original files have been archived. DO NOT recreate them.

For future iterations:
   - Use @pm *start-iteration to add new Epics
   - Use @po *assemble to generate complete documents when needed

═══════════════════════════════════════════════════════

🎯 NEXT STEPS:
   Monolith: @sm *draft
   Multi-Repo Product: Navigate to implementation repos, run @sm *draft
   Multi-Repo Implementation: @sm *draft (reads from {product_repo_path}/docs/prd/epic-*.yaml)

═══════════════════════════════════════════════════════
```

## Output Structure

```
docs/prd/
├── index.md                           # TOC with links to all sections
├── goals-context.md                   # Goals and Background Context
├── requirements.md                    # Functional and Non-Functional Requirements
├── ui-goals.md                        # User Interface Design Goals (if applicable)
├── technical-assumptions.md           # Technical Assumptions
├── epic-list.md                       # Epic List
├── epics.md                           # Full Epics section with YAML blocks (reference)
├── checklist-results.md               # Checklist Results Report
├── next-steps.md                      # Next Steps (UX Expert + Architect prompts)
├── epic-1-user-authentication.yaml    # Extracted Epic 1 (SM reads this)
├── epic-2-product-catalog.yaml        # Extracted Epic 2 (SM reads this)
└── epic-3-checkout.yaml               # Extracted Epic 3 (SM reads this)

docs/architecture/                     # (or docs/system-architecture/ for product repos)
├── index.md                           # TOC with links to all sections
├── introduction.md                    # Introduction
├── high-level-architecture.md         # High Level Architecture
├── tech-stack.md                      # Tech Stack
├── data-models.md                     # Data Models
├── components.md                      # Components
├── rest-api-spec.md                   # REST API Spec
├── database-schema.md                 # Database Schema
├── source-tree.md                     # Source Tree / Project Structure
├── coding-standards.md                # Coding Standards
├── testing-strategy.md                # Testing Strategy
└── ...                                # Other sections per template type
```

> **Note:** File names are standardized to English section IDs from templates (Step 2.3.1 / Step 3.3.1).
> Original non-English filenames are automatically renamed during sharding.

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
    acceptance_criteria:
      - "AC1: User can register with email and password"
      - "AC2: Password is hashed using bcrypt"
      - "AC3: Login returns JWT token on valid credentials"
    estimated_complexity: medium
    priority: P0
    provides_apis:
      - "POST /api/auth/login"
    consumes_apis: []
    dependencies: []

  - id: "1.2"
    title: "Frontend Login UI"
    repository_type: frontend
    acceptance_criteria:
      - "AC1: Login form with validation"
      - "AC2: Successful login redirects to dashboard"
    dependencies: ["1.1"]
    consumes_apis:
      - "POST /api/auth/login"
```
