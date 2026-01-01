# [15.8.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.5...v15.8.0) (2026-01-01)


### Features

* **pm:** add planning docs commit step to SM handoff in start-iteration ([9564a2b](https://github.com/dorayo/ORCHESTRIX/commit/9564a2b542e1d68e53c4178ac80ca2530b597fec))

## [15.7.5](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.4...v15.7.5) (2025-12-31)


### Bug Fixes

* **pm:** clarify next-steps.md generation as executable prompts ([af9a140](https://github.com/dorayo/ORCHESTRIX/commit/af9a1408ccc4b163907d9951d0f1325f24d9e771))

## [15.7.4](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.3...v15.7.4) (2025-12-30)


### Bug Fixes

* **dev:** add database migration execution step to workflow ([7d7ae7b](https://github.com/dorayo/ORCHESTRIX/commit/7d7ae7b8fc81f96f01203716980ae6706d86bfd9))

## [15.7.3](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.2...v15.7.3) (2025-12-28)


### Bug Fixes

* **qa:** move test process cleanup to post-commit step ([f7ddc53](https://github.com/dorayo/ORCHESTRIX/commit/f7ddc53b9b241b2b0d5dda7745025986aacae1ab))

## [15.7.2](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.1...v15.7.2) (2025-12-26)


### Bug Fixes

* **sm:** simplify HANDOFF section, remove prohibited list ([f047cae](https://github.com/dorayo/ORCHESTRIX/commit/f047cae180fea033877b176916c9e62905358cba))

## [15.7.1](https://github.com/dorayo/ORCHESTRIX/compare/v15.7.0...v15.7.1) (2025-12-26)


### Bug Fixes

* **sm:** merge Step 9 and 10, put PROHIBITED patterns first ([9dd2f6e](https://github.com/dorayo/ORCHESTRIX/commit/9dd2f6e5e81919e67ee77933e7589933b50fad72))

# [15.7.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.6.0...v15.7.0) (2025-12-26)


### Bug Fixes

* **sm:** add stronger transition from Step 9 to Step 10 ([881301c](https://github.com/dorayo/ORCHESTRIX/commit/881301cdd6ba63570003e53e4c159203b3486f77))
* **sm:** enforce strict handoff message format in create-next-story ([2034f12](https://github.com/dorayo/ORCHESTRIX/commit/2034f126c1cdd7bf5a880d244e7f81f9f9a64809))
* **tasks:** standardize HANDOFF emoji to 🎯 for tmux hook detection ([e0fd5ea](https://github.com/dorayo/ORCHESTRIX/commit/e0fd5ea82cdd0a18e9d67c3edaf6459376415c4e))
* **tasks:** strengthen HANDOFF format enforcement in SM and Architect tasks ([af73ea8](https://github.com/dorayo/ORCHESTRIX/commit/af73ea81402df6f82255264a96561bc98e49cb6a))


### Features

* **agents:** add mandatory HANDOFF format rules to workflow_rules ([47a735f](https://github.com/dorayo/ORCHESTRIX/commit/47a735ffd5deeda124408404f6f2097b01b87492))
* **hooks:** add intelligent simplified command detection ([40eb5f1](https://github.com/dorayo/ORCHESTRIX/commit/40eb5f14ede0027f1f9b537ad7d0027da42296ef))

# [15.6.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.5.1...v15.6.0) (2025-12-25)


### Features

* **pm:** enhance start-iteration with technical context and sm_hints ([e73c2bd](https://github.com/dorayo/ORCHESTRIX/commit/e73c2bd9027dd6884a560c1a1c83795fb95c9131))
* **tasks:** make pending-handoff registration conditional on tmux mode ([03570ca](https://github.com/dorayo/ORCHESTRIX/commit/03570ca868964371b92dbc92860cd2b3cf2bca5c))

## [15.5.1](https://github.com/dorayo/ORCHESTRIX/compare/v15.5.0...v15.5.1) (2025-12-25)


### Bug Fixes

* **installer:** filter out legacy .src.yaml files during agent discovery ([46c8513](https://github.com/dorayo/ORCHESTRIX/commit/46c851375f52d4c98c20f64d5bb13a3a1b7252ac))

# [15.5.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.4.1...v15.5.0) (2025-12-25)


### Features

* **agents:** standardize activation output format with markdown tables ([8be8047](https://github.com/dorayo/ORCHESTRIX/commit/8be804716474999a7eca12604abecd2cde5aca18))
* **qa:** add task checkbox verification to prevent incomplete stories ([3aa8d29](https://github.com/dorayo/ORCHESTRIX/commit/3aa8d29539d8ff243f575c3cbc7935b2f1a13e9d))
* **tasks:** add git commit step before SM handoff in change workflow ([d38b33d](https://github.com/dorayo/ORCHESTRIX/commit/d38b33d9f69a89725b4fe832ecfcfd26aed3cceb))

## [15.4.1](https://github.com/dorayo/ORCHESTRIX/compare/v15.4.0...v15.4.1) (2025-12-24)


### Bug Fixes

* **tasks:** add test runner process lifecycle management ([c2cb922](https://github.com/dorayo/ORCHESTRIX/commit/c2cb9222c2d9d71af8b545fb7a3a9552f4d0279e))

# [15.4.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.3.0...v15.4.0) (2025-12-24)


### Bug Fixes

* **agents:** add missing quick workflow commands to Dev and QA agents ([e07f09a](https://github.com/dorayo/ORCHESTRIX/commit/e07f09a5f76f95c79af0d31e090d0542b22fbcf9))
* **workflow:** LLM semantic analysis for tier decision + multi-repo support ([1fc5828](https://github.com/dorayo/ORCHESTRIX/commit/1fc5828ec62690d1a28d0596312b58d789ae4c7c))


### Features

* **workflow:** add quick story workflow for trivial/simple tier stories ([4c04161](https://github.com/dorayo/ORCHESTRIX/commit/4c0416102a0648ec36c334dc86433d496a3297f5))


### Performance Improvements

* **dev:** remove architecture document loading from develop-story ([c211a42](https://github.com/dorayo/ORCHESTRIX/commit/c211a427e06fb59264cf66a7a262c6849e1f38ad))

# [15.3.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.2.0...v15.3.0) (2025-12-24)


### Bug Fixes

* **tasks:** resolve proposal workflow ambiguities and Story ID conflicts ([ea60f8b](https://github.com/dorayo/ORCHESTRIX/commit/ea60f8b1583febdc598c82e9021aef1f786a33b8))


### Features

* **architect:** add dynamic test-design-level calculation for proposal-created Stories ([539e061](https://github.com/dorayo/ORCHESTRIX/commit/539e06162bae33e39679416e6b0611086e143d70))

# [15.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.1.0...v15.2.0) (2025-12-24)


### Features

* **qa:** add Test Specs backfill to Story Tasks section ([4cd2c32](https://github.com/dorayo/ORCHESTRIX/commit/4cd2c3260b8bda02ee08fddfba00245dd2057c8b))

# [15.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v15.0.3...v15.1.0) (2025-12-24)


### Features

* **qa:** add blind spot analysis to reposition QA value ([cffc086](https://github.com/dorayo/ORCHESTRIX/commit/cffc086cf7b9912cb2ad78d5fa6679f236940510))

## [15.0.3](https://github.com/dorayo/ORCHESTRIX/compare/v15.0.2...v15.0.3) (2025-12-20)


### Bug Fixes

* **tasks:** add environment cleanup step to Dev self-review ([5edb51c](https://github.com/dorayo/ORCHESTRIX/commit/5edb51cb45e130394a7d6df52ab9c9ce45fd8ff4))
* **tasks:** enforce Glob-first pattern in Architect tasks ([56a3da6](https://github.com/dorayo/ORCHESTRIX/commit/56a3da6b6e1424bb6d979a1424f9d112387938d4))

## [15.0.2](https://github.com/dorayo/ORCHESTRIX/compare/v15.0.1...v15.0.2) (2025-12-19)


### Bug Fixes

* **tasks:** add explicit status update instructions in SM revise task ([3ff4850](https://github.com/dorayo/ORCHESTRIX/commit/3ff4850aa535879bc6fa82efe09bacae1ce6dfd7))

## [15.0.1](https://github.com/dorayo/ORCHESTRIX/compare/v15.0.0...v15.0.1) (2025-12-18)


### Bug Fixes

* **tasks:** enforce Glob-first pattern for architecture document loading ([10d8a50](https://github.com/dorayo/ORCHESTRIX/commit/10d8a5075e8bfe52560d9dc77239a020b9c4823a))

# [15.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.5...v15.0.0) (2025-12-18)


### Code Refactoring

* **change-handling:** simplify to 2-entry-point proposal-driven system ([0376cef](https://github.com/dorayo/ORCHESTRIX/commit/0376cefcb7aa8b614d28d9de85d69dd76bc5c6f8))


### BREAKING CHANGES

* **change-handling:** Replace 4-layer escalation with simplified change handling

New Architecture:
- Technical changes → Architect (*resolve-change) → TCP
- Product changes → PM (*revise-prd) → PCP
- Unclear/mixed → PO (*route-change) for intelligent routing
- SM (*apply-proposal) applies proposals to create/update Stories

New Files:
- templates/product-proposal-tmpl.yaml - PCP template
- templates/tech-proposal-tmpl.yaml - TCP template with bidirectional linkage
- tasks/po-route-change.md - PO intelligent routing
- tasks/sm-apply-proposal.md - SM proposal application with auto-discovery
- docs/08-变更处理系统设计.md - Design documentation

Modified:
- architect-resolve-change.md - Simplified TCP generation
- pm-revise-prd.md - Simplified PCP generation
- Agent configs (architect, sm, po, pm) - Updated commands

Removed (12 files):
- 4 escalation decision files
- 6 old task files (correct-course, escalation utilities)
- po-review-tech-proposal.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

## [14.0.5](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.4...v14.0.5) (2025-12-17)


### Bug Fixes

* **tasks:** enforce Glob-first pattern for story file location ([ac6d427](https://github.com/dorayo/ORCHESTRIX/commit/ac6d427bcb671171195d88197d9cf6dd3d0455eb))

## [14.0.4](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.3...v14.0.4) (2025-12-16)


### Bug Fixes

* **handoff:** include story_id in fallback hash to prevent false deduplication ([e619eb7](https://github.com/dorayo/ORCHESTRIX/commit/e619eb738ab4bc7fe151cade3662ab77ac4588c0))

## [14.0.3](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.2...v14.0.3) (2025-12-16)


### Bug Fixes

* **handoff:** add hash auto-cleanup and update documentation ([0ef7686](https://github.com/dorayo/ORCHESTRIX/commit/0ef7686c6ad650c4900b7119c3892ed64785392d))
* **handoff:** correct jq syntax for fallback status update ([1ad6b31](https://github.com/dorayo/ORCHESTRIX/commit/1ad6b31bdca3d01df18a50b14f6a1b01c9d34854))

## [14.0.2](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.1...v14.0.2) (2025-12-16)


### Bug Fixes

* **handoff:** add mandatory fallback registration to QA review task ([f53f837](https://github.com/dorayo/ORCHESTRIX/commit/f53f837ea5c522e93804345d803469a190afe118))

## [14.0.1](https://github.com/dorayo/ORCHESTRIX/compare/v14.0.0...v14.0.1) (2025-12-16)


### Bug Fixes

* **handoff:** enforce mandatory fallback file creation in Step 0 ([102bd9f](https://github.com/dorayo/ORCHESTRIX/commit/102bd9fcdc978ca1442954f1b358616b04b8647d))

# [14.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.9.0...v14.0.0) (2025-12-16)


### Bug Fixes

* **story:** ensure Dev loads UI/UX spec when referenced in story ([34a97ec](https://github.com/dorayo/ORCHESTRIX/commit/34a97ecbf316a1295efa9f37a9517e034a57fed0))


### Code Refactoring

* **handoff:** switch from skill-based to pure hook-based handoff ([6420f31](https://github.com/dorayo/ORCHESTRIX/commit/6420f31f424feb10276292a1efc2a7101d3c198c))


### Features

* **handoff:** add fallback recovery for context compression scenarios ([edf13ae](https://github.com/dorayo/ORCHESTRIX/commit/edf13aefb773337d3ccca23b518ec11037ae244c))


### BREAKING CHANGES

* **handoff:** Remove handoff skill, use hook-only mechanism

- Remove handoff skill (common/skills/handoff/SKILL.md)
- Rewrite hook script to be environment-variable independent
- Hook now scans all tmux windows for HANDOFF messages
- Add hash-based deduplication to prevent re-processing
- Update all task files to remove skill invocation steps
- Update workflow rules to emphasize HANDOFF as last line output
- Remove skill copy logic from installer

Design improvements:
- No dependency on AGENT_ID environment variable
- Auto-detect orchestrix session from tmux
- More robust error handling and logging

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# [13.9.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.8.3...v13.9.0) (2025-12-16)


### Bug Fixes

* **handoff:** add lock mechanism to prevent duplicate Stop hook triggers ([8f365d6](https://github.com/dorayo/ORCHESTRIX/commit/8f365d667c58f9e1ca2dcd2e88ce45e7b90c9eca))


### Features

* **handoff:** add explicit skill invocation to task files ([4008484](https://github.com/dorayo/ORCHESTRIX/commit/400848422891095d9e38c312c356f30ce8dbdf08))
* **handoff:** add handoff skill for tmux automation ([26d830c](https://github.com/dorayo/ORCHESTRIX/commit/26d830ce762d990c41413b60627096ee0847d8c5))

## [13.8.3](https://github.com/dorayo/ORCHESTRIX/compare/v13.8.2...v13.8.3) (2025-12-14)


### Bug Fixes

* **handoff:** sync bug fixes from orchestrix-mcp-server ([fbc9ad3](https://github.com/dorayo/ORCHESTRIX/commit/fbc9ad39c6d59bcbac27171f029f1b06465ff7be))

## [13.8.2](https://github.com/dorayo/ORCHESTRIX/compare/v13.8.1...v13.8.2) (2025-12-14)


### Bug Fixes

* **handoff:** skip Layer 3 fallback for dev agent load messages ([583ade4](https://github.com/dorayo/ORCHESTRIX/commit/583ade44bbf01d82ad828929af052a0c6de1cbc3))

## [13.8.1](https://github.com/dorayo/ORCHESTRIX/compare/v13.8.0...v13.8.1) (2025-12-13)


### Bug Fixes

* fix common ide resolution for decision ([51bf28d](https://github.com/dorayo/ORCHESTRIX/commit/51bf28d4e9d8825e02757c7c3f9d1b4b465fa888))

# [13.8.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.7.1...v13.8.0) (2025-12-13)


### Features

* **handoff:** add Layer 3 Dev default fallback with story ID tracking ([61c8e5c](https://github.com/dorayo/ORCHESTRIX/commit/61c8e5c24fc2ba8f18880973e1919e170f93c381))

## [13.7.1](https://github.com/dorayo/ORCHESTRIX/compare/v13.7.0...v13.7.1) (2025-12-13)


### Bug Fixes

* **agents:** correct decisions path mapping in ide_file_resolution ([f7f5eda](https://github.com/dorayo/ORCHESTRIX/commit/f7f5eda080e0bbd50e1596849369bbd49bead18a))

# [13.7.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.6.0...v13.7.0) (2025-12-13)


### Features

* **architect:** allow Draft status stories to enter architecture review ([d4feebf](https://github.com/dorayo/ORCHESTRIX/commit/d4feebf880e2e7cd0cd1570ff021901e00cf6d4e))
* **po:** add story template reference in course correction workflow ([52908b5](https://github.com/dorayo/ORCHESTRIX/commit/52908b557153ebb6e8ff4412972249532ec1c0d6))

# [13.6.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.5.0...v13.6.0) (2025-12-13)


### Features

* **sm:** add Data Synchronization Analysis mechanism ([4f8ae3c](https://github.com/dorayo/ORCHESTRIX/commit/4f8ae3c5173f04ff3acb44ed7d5ebe6a9da25e18)), closes [#8](https://github.com/dorayo/ORCHESTRIX/issues/8)

# [13.5.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.4.0...v13.5.0) (2025-12-12)


### Features

* **qa:** integrate database migration validation into Dev and QA workflows ([a843700](https://github.com/dorayo/ORCHESTRIX/commit/a843700f5bb11ef33b6d15ff58f696a634619742))

# [13.4.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.3.4...v13.4.0) (2025-12-12)


### Features

* **sm:** add UI/UX spec reference extraction for story creation ([9494176](https://github.com/dorayo/ORCHESTRIX/commit/9494176701326e062081b4fb958dc4969f529a47))

## [13.3.4](https://github.com/dorayo/ORCHESTRIX/compare/v13.3.3...v13.3.4) (2025-12-11)


### Bug Fixes

* **qa:** unify test-design file path across Dev and QA workflows ([357857a](https://github.com/dorayo/ORCHESTRIX/commit/357857a977ceefd2d3555c211ae2f3c04f28d345))

## [13.3.3](https://github.com/dorayo/ORCHESTRIX/compare/v13.3.2...v13.3.3) (2025-12-11)


### Bug Fixes

* **sm:** enforce strict template compliance for story tasks structure ([b9d6ffb](https://github.com/dorayo/ORCHESTRIX/commit/b9d6ffbe1e9cbbce1f087fc29f1ff1140bbe996f))

## [13.3.2](https://github.com/dorayo/ORCHESTRIX/compare/v13.3.1...v13.3.2) (2025-12-11)


### Bug Fixes

* **dev:** resolve dev workflow audit issues ([c71ec48](https://github.com/dorayo/ORCHESTRIX/commit/c71ec482173ee0b6ce1c3717d9e805c0bbc2ccb9))

## [13.3.1](https://github.com/dorayo/ORCHESTRIX/compare/v13.3.0...v13.3.1) (2025-12-11)


### Performance Improvements

* **dev:** add context passthrough to avoid redundant architecture loading ([a3625f1](https://github.com/dorayo/ORCHESTRIX/commit/a3625f19351a05c6d2151f3ba267edccbd5a31c6))

# [13.3.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.2.0...v13.3.0) (2025-12-11)


### Features

* **hook:** add STB (Structured Termination Block) detection as Layer 0 ([90d3a46](https://github.com/dorayo/ORCHESTRIX/commit/90d3a46743c80f6e16a176b77d847369f68d5fbf))

# [13.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.1.1...v13.2.0) (2025-12-11)


### Features

* **tmux:** support multi-repo parallel automation with dynamic session naming ([f3f1d03](https://github.com/dorayo/ORCHESTRIX/commit/f3f1d03fe0009a67c58bb3ed71a8580bf19bff82))

## [13.1.1](https://github.com/dorayo/ORCHESTRIX/compare/v13.1.0...v13.1.1) (2025-12-09)


### Bug Fixes

* **release:** restore version sync script and manually sync to 13.1.0 ([bcffa57](https://github.com/dorayo/ORCHESTRIX/commit/bcffa579957d31eea50e62e1c0b4e29da7baea8e))

# [13.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v13.0.1...v13.1.0) (2025-12-09)


### Bug Fixes

* **architect:** use load-architecture-context utility instead of hardcoded paths ([6463558](https://github.com/dorayo/ORCHESTRIX/commit/64635581a1e734a5d0ddd094952c1ca829603fa0))
* **dev:** enforce mandatory HANDOFF format for tmux automation ([b6d7c45](https://github.com/dorayo/ORCHESTRIX/commit/b6d7c4552359e483b4acc604fbfe0b8cc79fc890))
* **dev:** use load-architecture-context utility and fix path references ([bd0372e](https://github.com/dorayo/ORCHESTRIX/commit/bd0372efa5471cb3b460bc3c650743cff88c5e96))
* **hooks:** improve tmux handoff reliability ([d95b8ab](https://github.com/dorayo/ORCHESTRIX/commit/d95b8abf7cb2ad41887dad65240f15f0241bb8be))
* **hooks:** prevent false HANDOFF detection from agent menu examples ([5312e9a](https://github.com/dorayo/ORCHESTRIX/commit/5312e9ab07993e41bd558adb62d98fb8888a09f5))
* **hooks:** support leading whitespace in handoff command detection ([6b4c0b4](https://github.com/dorayo/ORCHESTRIX/commit/6b4c0b4da40ebcc9579dfcf6da9b4d2a397ac6d5))
* **hooks:** use line-by-line matching for implicit command detection ([7de16d7](https://github.com/dorayo/ORCHESTRIX/commit/7de16d70c1a489badc92d2ae44d0b8b120849f61))
* **pm:** standardize next-steps.md output format with HANDOFF pattern ([b0ebe35](https://github.com/dorayo/ORCHESTRIX/commit/b0ebe3543ece01517cc74abf7dfa1ed5d6ab09e7))
* **pm:** use core-config.yaml for path resolution in revise-prd task ([2f0af37](https://github.com/dorayo/ORCHESTRIX/commit/2f0af37d87be8eeb98ae7cc5128e33691cdf7054))
* **po:** enforce role separation - PO creates epic metadata only, SM creates stories ([69d753f](https://github.com/dorayo/ORCHESTRIX/commit/69d753fb084bc0c8ae29af6d975f5938cbe5b8ee))
* **qa:** add i18n hardcoding to QA spot check items ([d26fb08](https://github.com/dorayo/ORCHESTRIX/commit/d26fb088fe0aeffa135fa80691eab72b56961d6f))
* **qa:** clarify story file lookup with explicit Glob-then-Read steps ([f80bddb](https://github.com/dorayo/ORCHESTRIX/commit/f80bddb955d20e4ae53bbd22bacbb1327d625bec))
* **qa:** enforce mandatory handoff message output in review-story task ([2dca0ae](https://github.com/dorayo/ORCHESTRIX/commit/2dca0ae212add2d40d2fa73353b0b4f0000089cc))
* **qa:** make i18n search mandatory with explicit patterns ([512da26](https://github.com/dorayo/ORCHESTRIX/commit/512da260f52e024d08fa4f0d4e4932ac1750643f))
* **release:** disable NPM publishing while keeping semantic versioning ([c2879ce](https://github.com/dorayo/ORCHESTRIX/commit/c2879ce4b1b0551a602baff1e8e34a4339075f0d))
* **sm:** auto-create cumulative registries on first story ([145edd6](https://github.com/dorayo/ORCHESTRIX/commit/145edd6422f181d930ad3bc0b9388c8f3f09e3f9))
* **sm:** use correct story file path pattern in correct-course task ([bc8b3f5](https://github.com/dorayo/ORCHESTRIX/commit/bc8b3f56866d16b5920902a1a7ca40fff68d229d))
* **sm:** use glob pattern for architecture file matching ([93de760](https://github.com/dorayo/ORCHESTRIX/commit/93de760e7bbbc1faf7c6eaff5e75b9c5a08593c1))


### Features

* **handoff:** implement Structured Termination Protocol (STP) for reliable automation ([7216e72](https://github.com/dorayo/ORCHESTRIX/commit/7216e72c11f47b1d7b4baadcacf20bd4003254b9))
* **iteration:** add post-MVP iteration workflow support ([e3c4fa3](https://github.com/dorayo/ORCHESTRIX/commit/e3c4fa304ed5f25736c60bada806a181c04094bd))
* **multi-repo:** add product drift guidance messages for cross-repo escalation ([554af10](https://github.com/dorayo/ORCHESTRIX/commit/554af10873355c94378f835818d50d3c833e606b))
* **multi-repo:** add unified Epic location resolution and proposal scope classification ([acb565d](https://github.com/dorayo/ORCHESTRIX/commit/acb565dbb181c103e6605fc8df447dc76143f3c8))
* **po:** add extract-epics.js script for automated Epic YAML extraction ([732f6d6](https://github.com/dorayo/ORCHESTRIX/commit/732f6d628dbec42cc93e76ea546a1752879d9419))
* **qa:** add implementation shortcuts detection for Dev and QA review ([3260dac](https://github.com/dorayo/ORCHESTRIX/commit/3260dac73e642f8a99d64e108801c0437cfd5e1b))
* **tmux:** auto-activate agents and start workflow on session launch ([500febc](https://github.com/dorayo/ORCHESTRIX/commit/500febcbfcf4a3d47ac4292b423e4eb4d6d6d7ca))
* **workflow:** add direct PO→Dev routing for AC-only changes ([e7d7c22](https://github.com/dorayo/ORCHESTRIX/commit/e7d7c223537819f2c4ddfdbafa435a8e616d759a))

# [12.1.0](https://github.com/dorayo/ORCHESTRIX/compare/v12.0.1...v12.1.0) (2025-11-23)


### Features

* **installer:** 实现默认静默安装模式 ([40d50a7](https://github.com/dorayo/ORCHESTRIX/commit/40d50a70b9b7265b8a0c706f95b0a2a204128bf9))

## [12.0.1](https://github.com/dorayo/ORCHESTRIX/compare/v12.0.0...v12.0.1) (2025-11-23)


### Performance Improvements

* **validation:** optimize agent validation and decision loading to reduce token consumption by 65% ([120a5fb](https://github.com/dorayo/ORCHESTRIX/commit/120a5fb5cd2dfd4830bbc38ad07a3f01e83c9fe4))

# [12.0.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.12...v12.0.0) (2025-11-22)


### Code Refactoring

* **checklists:** restructure 3-tier architecture and remove execute-checklist.md ([a35665b](https://github.com/dorayo/ORCHESTRIX/commit/a35665babb05acae58d3988dec1b413234381429))
* **dev-quality-gates:** eliminate 70% redundancy by unifying validation engine ([b510fa0](https://github.com/dorayo/ORCHESTRIX/commit/b510fa04e9356aa8386cd52ae56a76939b211bc5))
* **dev-self-review:** align with ideal Dev-QA workflow - eliminate DoD redundancy ([db5b43c](https://github.com/dorayo/ORCHESTRIX/commit/db5b43cdbfc9c70d57e5283ea7200910b4d5de30))


### BREAKING CHANGES

* **checklists:** Removed execute-checklist.md intermediate layer. All checklists are now self-contained and executed directly.

## Major Changes

### 1. Three-Tier Checklist Restructure
- workflow/: Comprehensive validation workflows (4 files)
  - architect-checklist.md → workflow/architect-validation.md
  - po-master-checklist.md → workflow/po-master-validation.md
  - pm-checklist.md → workflow/pm-validation.md
  - change-checklist.md → workflow/change-navigation.md

- gate/: Binary quality gates (2 files)
  - validation/dev-completion-steps.md → gate/dev-completion-steps.md
  - tasks/dev-implementation-gate.md → gate/dev-implementation-gate.md

- scoring/: Scored assessments (3 files)
  - assessment/architect-technical-review-checklist.md → scoring/architect-technical-review.md
  - assessment/sm-story-quality.md → scoring/sm-story-quality.md
  - assessment/qa-review-round-management.md → scoring/qa-review-rounds.md

### 2. Removed Intermediate Layer
- Deleted: execute-checklist.md (tasks/, common/tasks/)
- Reason: Checklists are self-contained, no router needed
- Impact: Simpler architecture, direct execution

### 3. Updated All References
- Agents (9 files): Modified commands to load checklists directly
- Tasks (5 files): Updated to execute checklists without intermediate layer
- Workflows (6 files): Updated checklist references
- Documentation: CLAUDE.md updated to reflect new architecture

### 4. Deleted Deprecated Files
- story-draft-checklist.md (superseded by sm-story-quality.md)
- validation/sm-technical-extraction-checklist.md (superseded)

## Architecture Benefits

Before:
  Agent → execute-checklist.md → Checklist file
  (Unnecessary intermediate layer)

After:
  Agent → Checklist file (direct execution)
  (Simpler, clearer, self-contained)

## Files Changed
- Modified: 13 agent configs, 5 tasks, 6 workflows, 1 doc
- Renamed: 9 checklists (organized into 3 tiers)
- Deleted: 3 files (2 deprecated, 1 intermediate layer)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
* **dev-self-review:** Removed DoD checklist from self-review, Section 9 (Documentation) in Implementation Gate covers it

## Changes

### Modified Files

**1. dev-self-review.md** (403→355 lines, -12%)
- **Removed Step 4**: "Calculate DoD Completion Score"
  - DoD quality checks covered by gate Section 9 (Documentation)
  - Process completion checks moved to dev-completion-steps.md (GATE 2)
- **Renumbered steps**: 6 steps → 5 steps
  - Step 4: Make Self-Review Decision (was Step 5)
  - Step 5: Update Dev Agent Record (was Step 6)
- **Removed dod_score** from decision input
- **Added Notes section**: Clarifies terminology and responsibilities

**2. dev-self-review-decision.yaml** (163→154 lines, -6%)
- **Removed input**: `dod_score` (covered by implementation_gate_score)
- **Updated PASS condition**: Removed `dod_score >= 95` check
- **Updated FAIL condition**: Removed `dod_score < 95` check
- **Updated descriptions**: Clarified gate_result field sources
- **Updated examples**: Removed dod_score from all examples
- **Added changelog**: Documents version 2.1.0 changes

**3. dev-completion-steps.md** (204→219 lines, +7%)
- **Deleted Section 2**: "Self-Review Execution" (redundant with GATE 1)
  - Removed 3 items checking self-review execution
- **Renumbered sections**: 6 sections → 5 sections
  - Section 2: Dev Agent Record (was Section 3)
  - Section 3: Change Log (was Section 4)
  - Section 4: Status Field (was Section 5)
  - Section 5: Handoff Message (was Section 6)
- **Updated total count**: 25 items → 22 items (25/25 → 22/22)
- **Enhanced metadata**: Added `scope` field clarifying "Process completion only"
- **Added Scope Clarification section**: Documents what IS and ISN'T covered

**4. CLAUDE.md** (+65 lines)
- **Added new section**: "Dev Implementation Gate System" under Quality Assessment
- **Documents**: 7 Critical Items, 10 Quality Sections, execution flow
- **Clarifies terminology**:
  - Implementation Gate = validate-quality-gates.md
  - Completion Steps = dev-completion-steps.md
  - DoD = Removed (redundant)

## Rationale: Align with Ideal Dev-QA Workflow

### Problem
The ideal Dev-QA workflow specified:
```
阶段2️⃣: Dev质量自检阶段 (单次强制门禁)
  → dev-implementation-gate.md (统一门禁)
  → 7个Critical Items + 8个质量章节
  → 阈值 ≥95%
  → 消除DoD冗余
```

But implementation had:
- GATE 1: validate-quality-gates.md (7 critical + 10 sections)
- GATE 1.5: DoD checklist (redundant with Section 9)
- GATE 2: dev-completion-steps.md (process + quality checks mixed)

### Solution
**Single Quality Gate** principle:
- ✅ GATE 1: validate-quality-gates.md (ALL quality checks)
- ✅ GATE 2: dev-completion-steps.md (ONLY administrative steps)

**Eliminated Redundancy**:
- Section 9 (Documentation) covers DoD quality requirements
- dev-completion-steps verifies process completion (not quality)
- Self-review no longer checks both quality AND completion twice

### Impact

**Metrics**:
- dev-self-review.md: 403→355 lines (-12%)
- dev-self-review-decision.yaml: 163→154 lines (-6%)
- dev-completion-steps.md: 25→22 items (-12%)
- Decision inputs: 8→7 (-12.5%)

**Conceptual Clarity**:
- **Before**: DoD = quality + process (mixed, redundant with Gate)
- **After**: Gate = quality, Completion = process (clear separation)

**Execution Flow**:
```
Before:
  GATE 1: Implementation Gate → gate_result
  Step 4: DoD Checklist → dod_result (redundant)
  Step 5: Decision (gate + dod)
  GATE 2: Completion Steps (includes self-review check - redundant)

After:
  GATE 1: Implementation Gate → gate_result (includes Section 9: Documentation)
  Step 4: Decision (gate only)
  GATE 2: Completion Steps (process only, no quality checks)
```

**Alignment**: Now 100% matches ideal workflow's "single quality gate + administrative completion" model

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
* **dev-quality-gates:** Removed dev-implementation-gate.md checklist in favor of automated validation

## Changes

### Deleted Files (Redundant)
- `checklists/validation/dev-implementation-gate.md` (231 lines)
  - Replaced by automated validation in validate-quality-gates.md
  - Eliminated manual checklist filling requirement
- `tasks/validate-implementation.md` (294 lines)
  - Merged into unified validate-quality-gates.md engine

### New Files
- `tasks/utils/validate-quality-gates.md` (250 lines)
  - Unified validation engine for all quality gates
  - Automatically validates: architecture, API contracts, test integrity
  - Outputs complete gate_result with all 7 critical items + 10 sections
  - Eliminates 70%+ content duplication

### Modified Files
- `tasks/dev-self-review.md` (403→379 lines, -6%)
  - Removed execute-checklist step for implementation gate
  - Simplified from 7 steps to 6 steps
  - Single validate-quality-gates call replaces multiple validation tasks
  - Zero manual checklist filling required

- `data/decisions/dev-self-review-decision.yaml` (219→163 lines, -26%)
  - Consolidated 6 FAIL conditions into 1 unified condition
  - Simplified from 9 decision branches to 3 (PASS/FAIL/ESCALATE)
  - Cleaner metadata structure with blocking_gates array

## Impact

### Metrics
- Files: 5→3 (-40%)
- Total lines: 1,642→816 (-50%)
- LLM reading load: 2,600→900 lines (-65%)
- Content duplication: 70%+ → 0%

### Architecture
Before:
```
dev-self-review
  ├─ execute-checklist → dev-implementation-gate.md (manual filling)
  ├─ validate-implementation.md (architecture)
  ├─ validate-api-contract.md (API)
  └─ make-decision
```

After:
```
dev-self-review
  ├─ validate-quality-gates.md (unified engine)
  │   └─ outputs: gate_result (complete, automated)
  └─ make-decision
```

### Key Improvements
1. **Eliminated circular dependency**: No more "how to fill gate checklist?" problem
2. **Single source of truth**: All validation rules in one engine
3. **Fully automated**: gate_result auto-generated, no manual filling
4. **Zero redundancy**: Each rule defined once, executed once
5. **Structured output**: Consistent YAML format for all gates

## Rationale

The original dev-implementation-gate.md checklist had 70%+ overlap with
validate-implementation.md and validate-api-contract.md, creating confusion
about how the checklist should be filled and maintaining duplicate logic.

The new validate-quality-gates.md engine:
- Defines all validation rules in one place
- Executes all checks automatically
- Outputs structured gate_result with evidence
- Eliminates need for manual checklist management

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

## [11.5.12](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.11...v11.5.12) (2025-11-21)


### Bug Fixes

* **sm+architect:** add missing status update steps in revise and escalation review tasks ([ef951ef](https://github.com/dorayo/ORCHESTRIX/commit/ef951efd91ddb1c9f6f201964db57088ae50595e))

## [11.5.11](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.10...v11.5.11) (2025-11-21)


### Bug Fixes

* **qa:** add missing two-phase status update in test-design task ([eabcb7d](https://github.com/dorayo/ORCHESTRIX/commit/eabcb7d0a3cc7c4bc45cc21aca4c1f0f614153da))

## [11.5.10](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.9...v11.5.10) (2025-11-21)


### Bug Fixes

* **architect:** add missing story status update steps in review task ([b7ae8c3](https://github.com/dorayo/ORCHESTRIX/commit/b7ae8c3c5cabcfa878217fef584b3c799cb43278))

## [11.5.9](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.8...v11.5.9) (2025-11-21)


### Bug Fixes

* **installer:** add support for decisions dependency type ([bcabc19](https://github.com/dorayo/ORCHESTRIX/commit/bcabc19e0bd0e6c212093bf32e248418b66b5b9b))

## [11.5.8](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.7...v11.5.8) (2025-11-20)


### Bug Fixes

* **hook:** increase implicit command detection window to 20 lines ([5c74a1b](https://github.com/dorayo/ORCHESTRIX/commit/5c74a1bafae3a6bfd1649188daef1d10199d9bc4))

## [11.5.7](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.6...v11.5.7) (2025-11-20)


### Performance Improvements

* **core:** optimize task and template files for token efficiency ([fa2e68e](https://github.com/dorayo/ORCHESTRIX/commit/fa2e68e465b0a361e256f9ac2e01af577d6a023d))

## [11.5.6](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.5...v11.5.6) (2025-11-20)


### Bug Fixes

* **hook:** reorder handoff flow - send to target first, then clear source ([9d0a280](https://github.com/dorayo/ORCHESTRIX/commit/9d0a28011784e82d9a89a2ccdcdbf3814244276c))
* **hook:** use background process for agent cleanup to avoid blocking ([740bfa1](https://github.com/dorayo/ORCHESTRIX/commit/740bfa1b78562db049e675bf874565eba9d50903))

## [11.5.5](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.4...v11.5.5) (2025-11-20)


### Performance Improvements

* **hook:** adjust wait times for agent context clearing ([90d6294](https://github.com/dorayo/ORCHESTRIX/commit/90d6294a5d1850f8d175729ce6cfa8ff8ffac390))

## [11.5.4](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.3...v11.5.4) (2025-11-20)


### Bug Fixes

* **hook:** properly send Enter key in tmux send-keys commands ([2467f12](https://github.com/dorayo/ORCHESTRIX/commit/2467f1238ad364311e1f5969cfa5b3f50e81a121))

## [11.5.3](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.2...v11.5.3) (2025-11-20)


### Bug Fixes

* **hook:** remove 'set -e' to prevent non-blocking exit code errors ([d4e062a](https://github.com/dorayo/ORCHESTRIX/commit/d4e062adae085e183d06bc797f32296f32f63cf9))

## [11.5.2](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.1...v11.5.2) (2025-11-20)


### Bug Fixes

* **hook:** improve handoff pattern detection for QA→SM workflow ([9c32f75](https://github.com/dorayo/ORCHESTRIX/commit/9c32f75bb188eaa8578b415db0a2c64305ddce22))

## [11.5.1](https://github.com/dorayo/ORCHESTRIX/compare/v11.5.0...v11.5.1) (2025-11-20)


### Bug Fixes

* **installer:** prevent overwriting existing registry files during reinstall ([efa7c3b](https://github.com/dorayo/ORCHESTRIX/commit/efa7c3b7cd20432d5dae959ac24232ec59f397fd))
* **sm:** standardize story filename format to match template specification ([fadcd0f](https://github.com/dorayo/ORCHESTRIX/commit/fadcd0f76129136d828a7900cbaff957099e8f91))


### Performance Improvements

* **story:** optimize story template and task files to reduce token consumption by 58% ([d059d2a](https://github.com/dorayo/ORCHESTRIX/commit/d059d2a2319598e6fdfa5e98d968f283aed805a1))

# [11.5.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.4.1...v11.5.0) (2025-11-20)


### Features

* **tmux:** add implicit command detection for handoff automation ([8a2e96c](https://github.com/dorayo/ORCHESTRIX/commit/8a2e96c032f311c7d9f069718ef600e4d2431a20))

## [11.4.1](https://github.com/dorayo/ORCHESTRIX/compare/v11.4.0...v11.4.1) (2025-11-20)


### Bug Fixes

* **qa:** refactor git commit automation to use decision system ([65bf28c](https://github.com/dorayo/ORCHESTRIX/commit/65bf28c2964dcf8ec85deed9c2c5dd8efb04d064))
* **tmux:** improve handoff detection with debug logging and stricter pattern matching ([d94b066](https://github.com/dorayo/ORCHESTRIX/commit/d94b066b69511431c286bd2313542df9dbb1c69b))

# [11.4.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.3.0...v11.4.0) (2025-11-20)


### Features

* add cumulative context system to prevent story isolation ([d83ad32](https://github.com/dorayo/ORCHESTRIX/commit/d83ad32e79b3202f93e9cec2c78a57f8688e7e39))

# [11.3.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.6...v11.3.0) (2025-11-18)


### Features

* **sm:** improve draft command to auto-create non-existent stories ([098a546](https://github.com/dorayo/ORCHESTRIX/commit/098a5465433e6c0dc9d4ec0d0801f39d7d8dae74))

## [11.2.6](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.5...v11.2.6) (2025-11-18)


### Bug Fixes

* **installer:** fix missing tmux automation files during installation ([b05275f](https://github.com/dorayo/ORCHESTRIX/commit/b05275f164e46444753007028df16f6d5339996f))

## [11.2.5](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.4...v11.2.5) (2025-11-17)


### Bug Fixes

* **tmux:** fix QA to Dev handoff loop issue in automated workflow ([0d093fa](https://github.com/dorayo/ORCHESTRIX/commit/0d093fa0fb21c580d55e82f693d5a935ab8a3a7b))

## [11.2.4](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.3...v11.2.4) (2025-11-17)


### Bug Fixes

* **tmux:** fix handoff command truncation and Unicode character corruption ([5bc7ae8](https://github.com/dorayo/ORCHESTRIX/commit/5bc7ae85414648860e41a8930ecfa59c2ad89992))

## [11.2.3](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.2...v11.2.3) (2025-11-17)


### Bug Fixes

* **tmux:** fix handoff-detector case sensitivity issue ([f9ca61a](https://github.com/dorayo/ORCHESTRIX/commit/f9ca61a1497c888dd719b220176fdf8bbd4ce1a0))

## [11.2.2](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.1...v11.2.2) (2025-11-17)


### Bug Fixes

* **agents:** ensure command list displays with * prefix ([6de4d3b](https://github.com/dorayo/ORCHESTRIX/commit/6de4d3b590ff3a034fc2d05f02d580ab856a9819))

## [11.2.1](https://github.com/dorayo/ORCHESTRIX/compare/v11.2.0...v11.2.1) (2025-11-17)


### Bug Fixes

* **tmux:** correct handoff-detector argument parsing order ([3f52e9f](https://github.com/dorayo/ORCHESTRIX/commit/3f52e9fa7eee1d53ce09382f38f22b939bf4242c))

# [11.2.0](https://github.com/dorayo/ORCHESTRIX/compare/v11.1.2...v11.2.0) (2025-11-17)


### Features

* **sm:** add idempotency check to *draft command ([b98dcbc](https://github.com/dorayo/ORCHESTRIX/commit/b98dcbc5f831e97215ec9fea7704dd5bc990a7a8))

## [11.1.2](https://github.com/dorayo/ORCHESTRIX/compare/v11.1.1...v11.1.2) (2025-11-17)


### Bug Fixes

* **agents:** ensure agents display output_format with * prefix ([4135541](https://github.com/dorayo/ORCHESTRIX/commit/413554189c5fbab776debd3dd25f5379fc615c8e))

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
