## [11.1.1](https://github.com/dorayo/ORCHESTRIX/compare/v11.1.0...v11.1.1) (2025-11-17)


### Bug Fixes

* **automation:** enforce HANDOFF must be final output + increase hook capture range ([6d574e0](https://github.com/dorayo/ORCHESTRIX/commit/6d574e003dfc750d3d5d116da19c59e71e906bc6))

# [11.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.0.0...v11.1.0) (2025-11-17)


### Features

* **automation:** implement automatic story cycling with context clearing ([819058f](https://github.com/dorayo/ORCHESTRIX/commit/819058f37d43d84ea0a5b859676e9654c07752ea))

# [11.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v10.4.2...v11.0.0) (2025-11-17)


### Bug Fixes

* **automation:** correct tmux pane navigation instructions ([92bd846](https://github.com/dorayo/ORCHESTRIX/commit/92bd846d8f38e3b37189cfb71768b9e141f4f628))
* **automation:** fix hook script errors and status bar display ([0b30213](https://github.com/dorayo/ORCHESTRIX/commit/0b30213e110dbaabb10a3b231b3d15c86d7b5450))
* **automation:** fix regex syntax errors in handoff-detector hook ([9f78eba](https://github.com/dorayo/ORCHESTRIX/commit/9f78eba6c61f63cfbad3fe259d212efe5c7268aa))
* **automation:** remove auto-activation of agents in tmux script ([7cfea5f](https://github.com/dorayo/ORCHESTRIX/commit/7cfea5f8df1eef1724be687cf9ceb2015483b74b))
* **automation:** remove window flags from status bar for cleaner display ([56fb456](https://github.com/dorayo/ORCHESTRIX/commit/56fb4562560ed3a2be67725e8d8751f9c09c732e))


### Code Refactoring

* **automation:** change from panes to windows for simpler navigation ([1fc98eb](https://github.com/dorayo/ORCHESTRIX/commit/1fc98eb500a630ae33866f5961538f5a2eb335b2))


### Features

* **automation:** add tmux multi-agent automation with auto-handoff ([9227a1d](https://github.com/dorayo/ORCHESTRIX/commit/9227a1dda9ab2353138a2a4cf2cd0f9ed3fe2a3d))
* **automation:** implement tmux-based multi-agent HANDOFF automation ([ccfe0e4](https://github.com/dorayo/ORCHESTRIX/commit/ccfe0e4a0a581e48633062ad7d0e3dbab19471cb))
* **tasks:** add idempotency checks to prevent duplicate work ([af484d6](https://github.com/dorayo/ORCHESTRIX/commit/af484d65a5ed07e175328c68ff9c5764d50e883b))
* **tasks:** add idempotency checks with smart HANDOFF to all review tasks ([b9d290f](https://github.com/dorayo/ORCHESTRIX/commit/b9d290f05458a941c07a422d6a2b6d7ebd149c0c))
* **tasks:** add robust multi-strategy status extraction ([7ceb522](https://github.com/dorayo/ORCHESTRIX/commit/7ceb5223ae062d91110a2eab34db6b13928dedb7))


### Reverts

* restore window flags in status bar ([749fc8d](https://github.com/dorayo/ORCHESTRIX/commit/749fc8d981f36d5241afa251a5e8cd2beaf56edd))


### BREAKING CHANGES

* **automation:** tmux layout changed from 2x2 pane layout to 4 separate windows

Why this change:
- Pane navigation was confusing for users (Ctrl+b → q + number)
- Window navigation is much simpler (Ctrl+b → 0/1/2/3 directly)
- Each agent gets full screen space
- Matches user mental model (like browser tabs)
- Status bar clearly shows all windows

Changes:
- start-tmux-session.sh: Create 4 windows instead of 4 panes
- handoff-detector.sh: Send commands to windows instead of panes
- Updated all instructions and help text

New Layout:
- Window 0: Architect (Ctrl+b → 0)
- Window 1: SM (Ctrl+b → 1)
- Window 2: Dev (Ctrl+b → 2)
- Window 3: QA (Ctrl+b → 3)

Navigation:
  Ctrl+b → 0/1/2/3  Jump directly to window
  Ctrl+b → n        Next window
  Ctrl+b → p        Previous window
  Ctrl+b → w        List all windows

Bottom status bar shows: [0:Architect] [1:SM*] [2:Dev] [3:QA]
(* indicates current window)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

## [10.4.2](https://github.com/dorayo/ORCHESTRIX/compare/v10.4.1...v10.4.2) (2025-11-16)


### Bug Fixes

* **multi-repo:** correct dependency-checker import path in dashboard ([7e1afe2](https://github.com/dorayo/ORCHESTRIX/commit/7e1afe226e645869ca3d2b38326907fefb1a5d1f))

## [10.4.1](https://github.com/dorayo/ORCHESTRIX/compare/v10.4.0...v10.4.1) (2025-11-16)


### Bug Fixes

* **tasks:** improve shell compatibility in po-shard-documents task ([525ccf6](https://github.com/dorayo/ORCHESTRIX/commit/525ccf6269ec5af5274646fbf6245d3addf5c14a))

# [10.4.0](https://github.com/dorayo/ORCHESTRIX/compare/v10.3.4...v10.4.0) (2025-11-16)


### Features

* **workflow:** allow parallel story creation and auto-preserve user config ([27bda38](https://github.com/dorayo/ORCHESTRIX/commit/27bda38c45d7a32889fa44c1f03f0b5593a631a1))

## [10.3.4](https://github.com/dorayo/ORCHESTRIX/compare/v10.3.3...v10.3.4) (2025-11-16)


### Bug Fixes

* **multi-repo:** optimize brownfield workflow implementation ([b780dbb](https://github.com/dorayo/ORCHESTRIX/commit/b780dbbf2c04fc4872d2df24e0f7e63c260db243))

## [10.3.3](https://github.com/dorayo/ORCHESTRIX/compare/v10.3.2...v10.3.3) (2025-11-16)


### Bug Fixes

* **dev:** prevent loading architecture from product repo path ([f8778ec](https://github.com/dorayo/ORCHESTRIX/commit/f8778ec8daca59e213cee91fcabc620f4c26056f))

## [10.3.2](https://github.com/dorayo/ORCHESTRIX/compare/v10.3.1...v10.3.2) (2025-11-16)


### Bug Fixes

* **po-shard:** correct md-tree command syntax for document sharding ([b2c5fc6](https://github.com/dorayo/ORCHESTRIX/commit/b2c5fc6436c9c3ac7f654102a06c919757f38af4))

## [10.3.1](https://github.com/dorayo/ORCHESTRIX/compare/v10.3.0...v10.3.1) (2025-11-15)


### Bug Fixes

* **po-shard:** allow architecture sharding in implementation repos ([250adbf](https://github.com/dorayo/ORCHESTRIX/commit/250adbfc2d37d437384afc69ca85a63bbe8084f5))

# [10.3.0](https://github.com/dorayo/ORCHESTRIX/compare/v10.2.0...v10.3.0) (2025-11-15)


### Features

* **po-checklist:** add architecture template compliance validation ([cb9ded6](https://github.com/dorayo/ORCHESTRIX/commit/cb9ded65e92e1b71d520890ffebed158ddb51668))

# [10.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v10.1.0...v10.2.0) (2025-11-15)


### Features

* **architecture:** make front-end-spec optional for all architecture tasks ([4722631](https://github.com/dorayo/ORCHESTRIX/commit/472263102583dd559f6989caaed35a061cc2ef07))

# [10.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v10.0.0...v10.1.0) (2025-11-15)


### Features

* **po-checklist:** add PRD format validation section for multi-repo support ([128d3e5](https://github.com/dorayo/ORCHESTRIX/commit/128d3e542cf5342b8b92be6d8ec67a2782c6d22a))

# [10.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v9.0.0...v10.0.0) (2025-11-15)


### Bug Fixes

* **architecture:** standardize system-architecture.md path across all tasks ([bcd575d](https://github.com/dorayo/ORCHESTRIX/commit/bcd575da20d4a6eae529e7b4f93c052de12f1e6d))


* feat!: integrate epic definitions into PRD sharding workflow ([90cc93e](https://github.com/dorayo/ORCHESTRIX/commit/90cc93e3446c5b42b5235d07f16df17d7f77c119))


### BREAKING CHANGES

* Epic storage architecture has been fundamentally redesigned

## What Changed

### Epic Storage Architecture
- **OLD**: Separate epic YAML files in `docs/epics/epic-*.yaml`
- **NEW**: Epic YAML blocks embedded in PRD's "Epic Planning" section
- After PO *shard: YAML blocks preserved in `docs/prd/*.md` files

### PRD Sharding
- PRD now sharded using md-tree: `prd.md` → `prd/*.md`
- Epic YAML blocks remain intact in sharded files
- Eliminates redundant `docs/epics/` directory

### Story Filtering
- Stories now filtered by `repository_type` field (backend/frontend/ios/android)
- Matches `project.multi_repo.role` in core-config.yaml
- `repository` field is now optional (used for documentation only)

## Files Modified

### Templates
- prd-tmpl.yaml: Added "Epic Planning" section with YAML block examples
- brownfield-prd-tmpl.yaml: Added brownfield-specific epic planning section

### Tasks
- po-shard-documents.md: Complete rewrite - PRD sharding with md-tree
- create-next-story.md: Reads epics from prd/*.md, filters by repository_type

### Configuration
- core-config.yaml: Added prdSharded/prdShardedLocation config
- epic-story-mapping-schema.yaml: Clarified repository_type is primary filter field

### Documentation
- MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md: Updated for new epic format

## Migration Required

Existing projects must:
1. Add "Epic Planning" section to prd.md with YAML blocks
2. Delete old `docs/epics/` directory
3. Run `@po *shard` to create new prd shards

## Benefits

✅ Conceptual clarity: Epics belong in PRD
✅ Consistency: Both PRD and architecture use md-tree sharding
✅ Simplicity: One less directory to manage
✅ Maintainability: Single source of truth (prd.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
* **architecture:** System architecture path changed from docs/architecture/system-architecture.md to docs/system-architecture.md for multi-repo Product repositories.

Changes:
- Update create-system-architecture.md to output to docs/system-architecture.md (multi-repo) or docs/architecture.md (single-repo)
- Add automatic core-config.yaml update after architecture creation
- Update all implementation repo tasks (backend, frontend, mobile) to read from correct path
- Remove legacy path compatibility to avoid ambiguity
- Add document scope restrictions to prevent reading from implementation repos
- Update MULTI_REPO_BROWNFIELD_ENHANCEMENT_GUIDE.md with correct paths
- Add CORE_CONFIG_ARCHITECTURE_PATHS.md configuration guide

Migration for existing projects:
1. Move docs/architecture/system-architecture.md to docs/system-architecture.md
2. Update core-config.yaml: architectureFile to docs/system-architecture.md
3. Re-run @po *shard to regenerate sharded files

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# [9.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v8.4.0...v9.0.0) (2025-11-15)


### Code Refactoring

* **architect:** remove deprecated aggregate-system-architecture command ([1b59a41](https://github.com/dorayo/ORCHESTRIX/commit/1b59a410a11fb8efedf08f67497a0ba64aa5f37f))


### BREAKING CHANGES

* **architect:** aggregate-system-architecture command removed.
Use aggregate-system-analysis + create-system-architecture workflow instead.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# [8.4.0](https://github.com/dorayo/ORCHESTRIX/compare/v8.3.1...v8.4.0) (2025-11-15)


### Features

* add comprehensive core-config template with detailed documentation ([034e04b](https://github.com/dorayo/ORCHESTRIX/commit/034e04bfe31c35fead55a16d23a1f5fa739f3fc3))

## [8.3.1](https://github.com/dorayo/ORCHESTRIX/compare/v8.3.0...v8.3.1) (2025-11-15)


### Bug Fixes

* add missing comments and implementation_repos example to core-config.yaml ([a447288](https://github.com/dorayo/ORCHESTRIX/commit/a4472883172fb603b172918e5eb16e006f5acda1))

# [8.3.0](https://github.com/dorayo/ORCHESTRIX/compare/v8.2.0...v8.3.0) (2025-11-15)


### Features

* simplify multi-repo configuration structure ([5bd9868](https://github.com/dorayo/ORCHESTRIX/commit/5bd986830f3a602fba49a84a9b9bee8e6a17973f))

# [8.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v8.1.1...v8.2.0) (2025-11-15)


### Bug Fixes

* **config:** revert epicsLocation - use hardcoded docs/epics for simplicity ([7b897c5](https://github.com/dorayo/ORCHESTRIX/commit/7b897c55b037f94575a82b55d297895f1296b104))
* **multi-repo:** critical path fixes for multi-repository workflow ([74bdef1](https://github.com/dorayo/ORCHESTRIX/commit/74bdef1f46e10b2e56f23dbd0bd9e95a63596066)), closes [#4](https://github.com/dorayo/ORCHESTRIX/issues/4) [#5](https://github.com/dorayo/ORCHESTRIX/issues/5) [#22](https://github.com/dorayo/ORCHESTRIX/issues/22) [#26](https://github.com/dorayo/ORCHESTRIX/issues/26) [#9](https://github.com/dorayo/ORCHESTRIX/issues/9) [#18](https://github.com/dorayo/ORCHESTRIX/issues/18) [#21](https://github.com/dorayo/ORCHESTRIX/issues/21) [#3](https://github.com/dorayo/ORCHESTRIX/issues/3) [#8](https://github.com/dorayo/ORCHESTRIX/issues/8) [#1](https://github.com/dorayo/ORCHESTRIX/issues/1) [#2](https://github.com/dorayo/ORCHESTRIX/issues/2) [#7](https://github.com/dorayo/ORCHESTRIX/issues/7) [#2](https://github.com/dorayo/ORCHESTRIX/issues/2)


### Features

* **ux:** improve error messages and execution feedback (Phase 2 [#11](https://github.com/dorayo/ORCHESTRIX/issues/11)-[#13](https://github.com/dorayo/ORCHESTRIX/issues/13)) ([94aec28](https://github.com/dorayo/ORCHESTRIX/commit/94aec28e649574fc7fc34ef163f007477caef200)), closes [#12](https://github.com/dorayo/ORCHESTRIX/issues/12)
* **validation:** add Epic YAML, Story sync, and enhanced validation tools (Phase 2 [#16](https://github.com/dorayo/ORCHESTRIX/issues/16), [#10](https://github.com/dorayo/ORCHESTRIX/issues/10), [#14](https://github.com/dorayo/ORCHESTRIX/issues/14)) ([6f02df1](https://github.com/dorayo/ORCHESTRIX/commit/6f02df12dba783a7802f016c7e3492661eb44dcd))

## [8.1.1](https://github.com/dorayo/ORCHESTRIX/compare/v8.1.0...v8.1.1) (2025-11-14)


### Bug Fixes

* **multi-repo:** add implementation_repos config and clarify sharding ([02a187a](https://github.com/dorayo/ORCHESTRIX/commit/02a187ad7731868dcd2e5d1c3f56caa427b137d6))

# [8.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v8.0.0...v8.1.0) (2025-11-14)


### Features

* **multi-repo:** add brownfield enhancement workflow support ([7f937d4](https://github.com/dorayo/ORCHESTRIX/commit/7f937d45c6102fc5b3f16c3e08d28d167e6ad69d))

# [8.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v7.2.0...v8.0.0) (2025-11-14)


* feat(brownfield)!: implement 3-step enhancement workflow with improved standards ([fb622f9](https://github.com/dorayo/ORCHESTRIX/commit/fb622f96a6f6b173679cc9f744eca19e2962b4d9))


### BREAKING CHANGES

* document-project task now outputs to docs/existing-system-analysis.md
instead of docs/brownfield-architecture.md. The document is now explicitly an intermediate
analysis document rather than the final architecture.

This commit implements a comprehensive refactoring of the brownfield enhancement workflow
to address a critical design flaw: existing code with poor standards should not dictate
standards for new code.

## Core Changes

### 1. Brownfield 3-Step Workflow
- **Step 1**: @architect *document-project → docs/existing-system-analysis.md
  - Captures real state of existing system (as-is, including poor practices)
  - Intermediate document, not loaded by Dev agents
  - Input for Steps 2 and 3

- **Step 2**: @pm *create-doc brownfield-prd-tmpl.yaml → docs/prd.md
  - Defines enhancement requirements based on existing system analysis
  - REQUIRED prerequisite: existing-system-analysis.md

- **Step 3**: @architect *create-doc brownfield-architecture-tmpl.yaml → docs/architecture.md
  - Designs enhancement architecture with IMPROVED standards
  - REQUIRED prerequisites: prd.md + existing-system-analysis.md
  - This is the final architecture that Dev follows (can improve upon poor existing practices)

### 2. PO Shard Command Unification
- Removed: *shard-doc and *shard-documents commands
- Added: unified *shard command
- Automatically shards both PRD and Architecture documents
- Uses md-tree CLI tool when available for fast architecture sharding

### 3. Task and Template Updates
- document-project.md: Output path and document role clarified
- brownfield-prd-tmpl.yaml: Explicit prerequisite validation added
- brownfield-architecture-tmpl.yaml: Emphasis on improved standards for new code
- po-shard-documents.md: Enhanced to handle both PRD and Architecture sharding

### 4. Documentation
- NEW: docs/BROWNFIELD_ENHANCEMENT_GUIDE.md (comprehensive 500+ line guide)
  - Complete 3-step workflow explanation
  - Document roles and purposes
  - Best practices and common scenarios

- UPDATED: docs/MULTI_REPO_BROWNFIELD_GUIDE.md
  - Added link to new enhancement guide
  - Clarified this is for multi-repo system documentation

- UPDATED: README.md
  - Reorganized documentation section with Brownfield/Greenfield categories
  - Added links to new guides

### 5. Cleanup
- Removed 17 temporary fix and test documents
- Cleaned up root and docs directories

## Document Role Clarity

| Document | Path | Role | Sharded? | Dev Loads? |
|----------|------|------|----------|------------|
| Existing System Analysis | docs/existing-system-analysis.md | Intermediate (as-is) | No | No |
| PRD | docs/prd.md | Requirements | Yes | No |
| Architecture | docs/architecture.md | Final (improved) | Yes | Yes |

## Migration Guide

If you were using document-project before:
1. The output file is now docs/existing-system-analysis.md (not brownfield-architecture.md)
2. This is an intermediate document for planning, not for development
3. Follow the 3-step workflow to create the final docs/architecture.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# [7.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v7.1.0...v7.2.0) (2025-11-14)


### Features

* **subagent:** add Decision Evaluator SubAgent for automated decision execution ([5c88ce0](https://github.com/dorayo/ORCHESTRIX/commit/5c88ce0b50277b1bad6b8a7f5947c8ac0fcc1b64))

# [7.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v7.0.0...v7.1.0) (2025-11-14)


### Bug Fixes

* **dev:** enforce completion steps to prevent premature task termination ([c7cc9d1](https://github.com/dorayo/ORCHESTRIX/commit/c7cc9d14190fc8df1f7e6a433cd4c8d0223163f9))
* **dev:** implement rule retention system for multi-session stories ([2b5b785](https://github.com/dorayo/ORCHESTRIX/commit/2b5b78547c4734edc900b1ba2c396a77f28182fd))


### Features

* **dev:** implement comprehensive quality gate system ([09ff38f](https://github.com/dorayo/ORCHESTRIX/commit/09ff38f06ccb01f67eea0af4929426dc105e3aca))
* **qa:** implement automatic git commit in QA review workflow ([a7a450f](https://github.com/dorayo/ORCHESTRIX/commit/a7a450f4f5a2baf4fd1cc882e134edafc47e775e))

# [7.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v6.1.2...v7.0.0) (2025-11-14)


### Features

* **multi-repo:** implement complete multi-repository architecture support ([33c5029](https://github.com/dorayo/ORCHESTRIX/commit/33c5029368a680ac7241d2f823c05742d6e1c6c5))


### BREAKING CHANGES

* **multi-repo:** none

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

## [6.1.2](https://github.com/dorayo/ORCHESTRIX/compare/v6.1.1...v6.1.2) (2025-11-14)


### Bug Fixes

* **workflow:** enforce mandatory handoff messages and status updates ([1a4c8e1](https://github.com/dorayo/ORCHESTRIX/commit/1a4c8e1f903adf26da77aeddadaec285ebd5ef5e))

## [6.1.1](https://github.com/dorayo/ORCHESTRIX/compare/v6.1.0...v6.1.1) (2025-11-14)


### Bug Fixes

* **architect:** prevent HALT for missing entities/dependencies ([9d9c2f7](https://github.com/dorayo/ORCHESTRIX/commit/9d9c2f76bca8e897a8fa68463b0a10d7f8764f5a))

# [6.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v6.0.3...v6.1.0) (2025-11-14)


### Features

* **workflow:** optimize story workflow and reduce file size by 85% ([1e3ab4f](https://github.com/dorayo/ORCHESTRIX/commit/1e3ab4f66c80e61d98ad7751dfae541a575bb2ca))

## [6.0.3](https://github.com/dorayo/ORCHESTRIX/compare/v6.0.2...v6.0.3) (2025-10-20)


### Bug Fixes

* **installer:** resolve dev agent subagent generation and remove config redundancy ([902310f](https://github.com/dorayo/ORCHESTRIX/commit/902310f8233a2be55e6a77b96117bc6c4972b38a))

## [6.0.2](https://github.com/dorayo/ORCHESTRIX/compare/v6.0.1...v6.0.2) (2025-10-17)


### Bug Fixes

* 修复 checklist 路径引用问题 ([0ab3890](https://github.com/dorayo/ORCHESTRIX/commit/0ab3890f40b7156013a986c91f39ecb178793387))

## [6.0.1](https://github.com/dorayo/ORCHESTRIX/compare/v6.0.0...v6.0.1) (2025-10-17)


### Bug Fixes

* **claude-code:** fix subagent frontmatter format and improve error handling ([26cb96b](https://github.com/dorayo/ORCHESTRIX/commit/26cb96b7e586afa07d012f7200defffe9de14bae))
* 修复 SM 决策流程逻辑 bug - 职责分离 ([43bb481](https://github.com/dorayo/ORCHESTRIX/commit/43bb481a2e2ab90fd703b03ba387ceea52a2e749))

# [6.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v5.2.0...v6.0.0) (2025-10-17)


### Bug Fixes

* documentation and inconsistency ([6ea1750](https://github.com/dorayo/ORCHESTRIX/commit/6ea17507d960b7e9f84bb1bdcc847f5ecf48c870))


### Code Refactoring

* **agents:** Phase 1 - extract common config and reorganize checklists ([e106ab8](https://github.com/dorayo/ORCHESTRIX/commit/e106ab89ea6bdd2eb1f8079e202a6d5328f3616c))
* **core:** 架构优化与内容分层重构 ([2b54b84](https://github.com/dorayo/ORCHESTRIX/commit/2b54b84c32810413c662d73b92036ca916bb7024))


### Features

* cross-agent coordination enhancement with decision system ([71bae22](https://github.com/dorayo/ORCHESTRIX/commit/71bae22e6c6cab19995e8f7a9ff23cdeee3287ac))
* **installer:** improve agent configuration handling and compilation ([7f221e8](https://github.com/dorayo/ORCHESTRIX/commit/7f221e81beafca5a894c04fc6ed5c023d6633d81))


### BREAKING CHANGES

* **core:** agent 配置文件结构调整，引入 .src.yaml 源文件
* **agents:** Checklist file paths have changed. Update any external references to use new paths:
  - architect-technical-review-checklist.md → checklists/assessment/
  - sm-story-creation-comprehensive-checklist.md → checklists/assessment/sm-story-quality.md
  - story-dod-checklist.md → checklists/completion/
  - sm-technical-extraction-checklist.md → checklists/validation/

# [5.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v5.1.4...v5.2.0) (2025-09-09)


### Features

* Field-Level API Contract ([287e3e5](https://github.com/dorayo/ORCHESTRIX/commit/287e3e54c3a5c3b3397223caafb3678259bafc9f))

## [5.1.4](https://github.com/dorayo/ORCHESTRIX/compare/v5.1.3...v5.1.4) (2025-09-08)


### Bug Fixes

* md prefix -> yaml ([c1f655c](https://github.com/dorayo/ORCHESTRIX/commit/c1f655cca7b57f2f7fb1a4e6b8a7fe8c2c28998f))
* minor fix for dev ([007bf4d](https://github.com/dorayo/ORCHESTRIX/commit/007bf4d5bf7d7b721e0efd317c609f5ced166211))

## [5.1.3](https://github.com/dorayo/ORCHESTRIX/compare/v5.1.2...v5.1.3) (2025-09-05)


### Bug Fixes

* a little change of create-next-story.md ([ebc739c](https://github.com/dorayo/ORCHESTRIX/commit/ebc739cecae9c567e25c061a16be2efe79b9c238))
* enhance create-next-story with Task/Subtasks needs testing ([443aa2e](https://github.com/dorayo/ORCHESTRIX/commit/443aa2e8ac0d32bf8bdf078e7a8787647ad1847e))

## [5.1.2](https://github.com/dorayo/ORCHESTRIX/compare/v5.1.1...v5.1.2) (2025-09-05)


### Bug Fixes

* resolve {root} variable replacement issues in IDE integrations ([2d90ae4](https://github.com/dorayo/ORCHESTRIX/commit/2d90ae4780a2155248a47bd7e365f321b250b7b0))

## [5.1.1](https://github.com/dorayo/ORCHESTRIX/compare/v5.1.0...v5.1.1) (2025-09-05)


### Bug Fixes

* add qa:qaLocation into core-config.yaml ([823d1d2](https://github.com/dorayo/ORCHESTRIX/commit/823d1d2514a9f6307a58ae649f98deea350233c5))

## [4.2.3](https://github.com/dorayo/ORCHESTRIX/compare/v4.2.2...v4.2.3) (2025-09-03)


### Bug Fixes

* add missing spinner.warn method in installer ([d2bbac3](https://github.com/dorayo/ORCHESTRIX/commit/d2bbac3f68ce6269da4f47c47066d54fb53eda5d))

## [4.2.2](https://github.com/dorayo/ORCHESTRIX/compare/v4.2.1...v4.2.2) (2025-09-03)


### Bug Fixes

* remove visibility_rule restrictions from agents and add Docker priority to dev agent ([d593b39](https://github.com/dorayo/ORCHESTRIX/commit/d593b394cab000fe5a0a5e4438902587fce30625))

## [4.2.1](https://github.com/dorayo/ORCHESTRIX/compare/v4.2.0...v4.2.1) (2025-09-02)


### Bug Fixes

* Update agent file detection for YAML format ([639c5a3](https://github.com/dorayo/ORCHESTRIX/commit/639c5a3d4d68b9122f42b70ccf7ec4af4af8ee04))

## [4.0.5](https://github.com/dorayo/ORCHESTRIX/compare/v4.0.4...v4.0.5) (2025-08-30)


### Bug Fixes

* 修复安装程序占位符替换和缩进问题 ([c33a156](https://github.com/dorayo/ORCHESTRIX/commit/c33a156057ca8f1b678b99c8b2bcc94cc5460920))

## [4.0.4](https://github.com/dorayo/ORCHESTRIX/compare/v4.0.3...v4.0.4) (2025-08-30)


### Bug Fixes

* 修复安装程序中占位符替换和缩进问题 ([b4e36b7](https://github.com/dorayo/ORCHESTRIX/commit/b4e36b7135fcaec023d6d85741df9e35b795fa1a))

## [4.0.3](https://github.com/dorayo/ORCHESTRIX/compare/v4.0.2...v4.0.3) (2025-08-30)


### Bug Fixes

* **installer:** 彻底修复Claude Code子代理模板占位符替换问题 ([167c796](https://github.com/dorayo/ORCHESTRIX/commit/167c796a1d8c1d5bf00ea933c7c124b81ee0a7f8))

## [4.0.2](https://github.com/dorayo/ORCHESTRIX/compare/v4.0.1...v4.0.2) (2025-08-30)


### Bug Fixes

* **installer:** 修复Claude Code子代理模板占位符和缩进问题 ([0795c3c](https://github.com/dorayo/ORCHESTRIX/commit/0795c3c0b099d43bbceda31bac89ec00e155e19a))

## [4.0.1](https://github.com/dorayo/ORCHESTRIX/compare/v4.0.0...v4.0.1) (2025-08-30)


### Bug Fixes

* **installer:** 修复Claude Code子代理增强功能时生成格式问题 ([b238578](https://github.com/dorayo/ORCHESTRIX/commit/b23857886e0efda1ee0cf416adf83120459eb6a5))

# [4.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v3.1.0...v4.0.0) (2025-08-21)


### Features

* redesign version management and docs structure ([4736504](https://github.com/dorayo/ORCHESTRIX/commit/47365046c3d80acba6271d688a3c3e674421c27e))


### BREAKING CHANGES

* Manual version management scripts removed, now use semantic-release

# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] - 2025-01-19

### 🚀 Major Features

#### Claude Code Auto-Execution System
- **Revolutionary automation system** for Claude Code SubAgent mode
- **10x efficiency improvement** with 100% quality preservation
- **Intelligent template selection** - automation-optimized vs standard templates
- **Smart task simplification** - dual-track system with auto-execution versions

### ✨ New Features

#### Core Automation Tasks
- `create-story-auto.md` - Automated story creation with context assembly
- `review-story-technical-auto.md` - Technical review automation with scoring
- `implement-story-auto.md` - Story implementation with test integrity protection
- `review-code-auto.md` - Code review automation with direct refactoring
- `shard-doc-auto.md` - Document sharding automation for phase transitions

#### Enhanced Agent Capabilities
- **orchestrix-orchestrator** enhanced with 7 new automation commands
- **Intelligent workflow coordination** with auto-workflow and dev-cycle commands
- **Context-aware orchestration** with automatic dependency resolution

#### Installation System Improvements
- **Automation-optimized SubAgent templates** for Claude Code
- **Intelligent template selection** based on agent automation capabilities
- **Enhanced IDE configuration** with automation preferences
- **Comprehensive template variable substitution** system

### 🔧 Technical Improvements

#### Template System
- New `claude-code-auto-template.md` with comprehensive automation features
- **Auto-startup sequences** with context loading and mode detection
- **Quality gates enforcement** with non-negotiable standards
- **Error handling and recovery** procedures for automated workflows

#### Installation Infrastructure
- Updated `ide-setup.js` with automation detection logic
- Enhanced `ide-agent-config.yaml` with Claude Code automation preferences
- **Agent ordering optimization** for automation-first approach
- **Comprehensive helper methods** for template generation

### 📋 Quality Assurance

#### Automation Quality Gates
- **Template compliance** - 100% adherence to specified templates
- **Standard compliance** - Full adherence to coding/architecture standards
- **Context integrity** - Complete information preservation across agents
- **Test integrity protection** - Never compromise test requirements
- **Documentation quality** - Professional standard documentation

#### Validation System
- **Automated checklist execution** with quality scoring
- **Cross-agent validation** with dependency checking
- **Workflow integration** testing for seamless agent collaboration

### 🎯 Agent Enhancements

#### Development Cycle Agents (High Automation)
- **SM**: Automated story creation with epic context assembly
- **Architect**: Technical review automation with 7/10 quality gates
- **Dev**: Implementation automation with DoD compliance
- **QA**: Code review automation with refactoring capabilities
- **PO**: Document sharding automation for workflow transitions

#### Planning Phase Agents (Selective Automation)
- **Analyst**: Research document automation with market intelligence
- **PM**: Requirements automation with stakeholder alignment

### 🛠️ Developer Experience

#### Claude Code Integration
- **Seamless SubAgent activation** via @agent-name syntax
- **Automatic context loading** with project awareness
- **Quality preservation** while maximizing automation
- **Error escalation** with clear user intervention triggers

#### Backward Compatibility
- **Full compatibility** with existing command mode
- **No impact** on other IDE integrations
- **Preserved workflow** standards and quality requirements

### 📚 Documentation Updates

#### Core Documentation
- Updated `CLAUDE.md` with automation system description
- Enhanced `README.md` with Claude Code automation features
- Added automation architecture documentation
- Updated installation instructions with Claude Code specifics

#### Technical Documentation  
- Comprehensive automation design document in `docs/claude-code-automation-design.md`
- Updated agent dependency specifications
- Enhanced workflow documentation with automation details

### 🧪 Testing & Validation

- **Template generation testing** with automation capability detection
- **Quality assurance validation** for all automation workflows  
- **Integration testing** for Claude Code SubAgent mode
- **Backward compatibility verification** for existing installations

---

## Previous Versions

### [2.2.9] - 2025-01-18
- Agent refinements for Claude Code sub agents and IDE compatibility
- Version consistency updates

### [2.2.8] - 2025-01-17  
- Core agent improvements and bug fixes

### [2.2.6] - 2025-01-16
- Agent ecosystem enhancements
- Build system improvements
