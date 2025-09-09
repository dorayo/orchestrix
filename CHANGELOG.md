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
