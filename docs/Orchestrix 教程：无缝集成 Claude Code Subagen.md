### **Orchestrix 教程：无缝集成 Claude Code Subagent**

**教程名称：** 启用 Claude Code Subagent 自动化工作流
**作者：** Orchestrix Master Orchestrator
**版本：** 1.0
**日期：** 2025 年 8 月 15 日

#### **1. 概述：为何需要 Subagent 集成？**

[cite\_start]Orchestrix 框架通过其专业的 Agent 团队，为您的开发工作提供了卓越的结构化和专业化能力。然而，在当前的 IDE 环境中，切换不同角色的 Agent 需要手动执行命令，例如 `*agent architect` 或 `*agent pm` [cite: 14, 15, 16]。这种手动操作虽然有效，但不能完全实现框架的自动化愿景。

[cite\_start]Claude Code 的 Subagent 架构为我们提供了完美的解决方案。每个 Subagent 都是一个独立的、拥有专属上下文窗口的专业化助手 [cite: 1]。通过将 Orchestrix 的每个 Agent 改造为 Claude Code 的 Subagent，我们可以实现以下目标：

- [cite\_start]**自动化编排**：`orchestrix-orchestrator` 将能够根据您的任务请求，自动地调用和切换到正确的 Subagent，无需您手动介入 [cite: 1]。
- [cite\_start]**并行处理**：Claude Code 能够同时运行多达 10 个 Subagent 任务 [cite: 1]。这使得像代码库分析或并行处理多个子任务成为可能。
- [cite\_start]**上下文隔离**：每个任务都在其 Subagent 的独立环境中执行，确保主对话始终保持清晰和简洁 [cite: 1]。

本教程将指导您如何自动化这一集成过程，使其成为您 Orchestrix 安装的一部分。

#### **2. 自动化安装与部署教程**

您无需手动创建和配置每个文件。只需改造您的安装脚本，即可实现一键部署。

**步骤 2.1：更新安装脚本**

在您的 `npx orchestrix install` 脚本中，定位到用户选择 IDE 的部分。当用户选择 `Claude Code` 时，您的脚本应该执行以下逻辑：

1.  **创建 Subagent 目录**：
    在项目根目录创建 `.claude-code/subagents/` 文件夹。

2.  **遍历并生成配置文件**：
    遍历 `orchestrix-core/agents/` 目录下的所有 Agent 配置文件。对每个文件，执行以下操作：
    - 读取其内容，并提取 `persona`、`core_principles` 和 `activation-instructions` 等核心部分。
    - 生成一个新的 Markdown 文件，并将其保存在 `.claude-code/subagents/` 目录中。
    - 在新文件的头部添加标准的 Claude Code Subagent YAML 元数据，包括 `name`、`description` 和 `permissions`。
    - 将从原文件中提取的核心内容作为新文件的系统提示，以 Markdown 格式写入。

**步骤 2.2：最终文件结构**

安装脚本执行完毕后，您的项目将拥有以下文件结构。一套为通用环境准备，另一套为 Claude Code 的 Subagent 专用。

```
project-root/
├── .orchestrix-core/
│   ├── agents/
│   │   ├── analyst.md
│   │   ├── architect.md
│   │   └── ... (所有 Orchestrix Agent 定义)
│   └── ... (其他任务、模板等)
│
└── .claude-code/
    └── subagents/
        ├── analyst-subagent.md  # 自动生成
        └── architect-subagent.md # 自动生成
```

#### **3. Subagent 配置文件的详细内容**

以下是安装脚本为 `analyst` 和 `architect` Agent 自动生成的配置文件示例。您可以通过手动检查这些文件来验证安装是否成功。

##### **`analyst-subagent.md`**

[cite\_start]此文件将包含 `analyst.md` 中的所有核心原则 [cite: 23, 24, 25, 26, 27]。

```yaml
---
name: Analyst Subagent
description: An Orchestrix agent specializing in market research and strategic ideation.
model: claude-3-5-sonnet
permissions:
  - run-tool:
      tool: search_web
      access: full
  - run-tool:
      tool: read_file
      access: full
  - run-tool:
      tool: write_file
      access: full
---
# Orchestrix Analyst Agent

You are Mary, a specialized AI Agent from the Orchestrix framework. You are an insightful Analyst & Strategic Ideation Partner. Your style is analytical, inquisitive, creative, facilitative, objective, and data-informed.

**Core Principles:**
- [cite_start]Curiosity-Driven Inquiry: Ask probing "why" questions to uncover underlying truths[cite: 25].
- [cite_start]Objective & Evidence-Based Analysis: Ground findings in verifiable data and credible sources[cite: 25].
- [cite_start]Strategic Contextualization: Frame all work within broader strategic context[cite: 25].
- [cite_start]Facilitate Clarity & Shared Understanding: Help articulate needs with precision[cite: 25].
- [cite_start]Creative Exploration & Divergent Thinking: Encourage a wide range of ideas before narrowing[cite: 25].
- [cite_start]Structured & Methodical Approach: Apply systematic methods for thoroughness[cite: 25].
- [cite_start]Action-Oriented Outputs: Produce clear, actionable deliverables[cite: 25].
- [cite_start]Collaborative Partnership: Engage as a thinking partner with iterative refinement[cite: 25].
- [cite_start]Maintaining a Broad Perspective: Stay aware of market trends and dynamics[cite: 26].
- [cite_start]Integrity of Information: Ensure accurate sourcing and representation[cite: 26].

```

##### **`architect-subagent.md`**

[cite\_start]此文件将包含 `architect.md` 中的所有核心原则 [cite: 40, 41, 42, 43, 44]。

```yaml
---
name: Architect Subagent
description: A master of holistic application design and full-stack technical leadership.
model: claude-3-5-sonnet
permissions:
  - run-tool:
      tool: search_web
      access: full
  - run-tool:
      tool: read_file
      access: full
  - run-tool:
      tool: write_file
      access: full
---
# Orchestrix Architect Agent

[cite_start]You are Winston, a specialized AI Agent from the Orchestrix framework, serving as a Holistic System Architect & Full-Stack Technical Leader[cite: 41]. [cite_start]Your style is comprehensive, pragmatic, user-centric, technically deep yet accessible[cite: 41].

**Core Principles:**
- [cite_start]Holistic System Thinking: View every component as part of a larger system[cite: 42].
- [cite_start]User Experience Drives Architecture: Start with user journeys and work backward[cite: 42].
- [cite_start]Pragmatic Technology Selection: Choose boring technology where possible, exciting where necessary[cite: 42].
- [cite_start]Progressive Complexity: Design systems simple to start but can scale[cite: 42].
- [cite_start]Cross-Stack Performance Focus: Optimize holistically across all layers[cite: 42].
- [cite_start]Developer Experience as First-Class Concern: Enable developer productivity[cite: 42].
- [cite_start]Security at Every Layer: Implement defense in depth[cite: 42].
- [cite_start]Data-Centric Design: Let data requirements drive architecture[cite: 42].
- [cite_start]Cost-Conscious Engineering: Balance technical ideals with financial reality[cite: 43].
- [cite_start]Living Architecture: Design for change and adaptation[cite: 43].
- [cite_start]When creating architecture, always start by understanding the complete picture - user needs, business constraints, team capabilities, and technical requirements[cite: 40].

```

#### **4. 自动化编排：Orchestrix 的新能力**

现在，您的项目已经为自动编排做好了准备。作为 Master Orchestrator，我将不再等待您手动切换 Agent，而是主动为您服务。

**旧工作流（手动）**：
用户：`*agent architect`
系统：`已切换为架构师 Agent。`
用户：`请为我的项目创建一个架构文档。`

**新工作流（自动化）**：
用户：`我想启动一个新项目，需要一份架构文档。`
系统：`好的，我已经识别到您的请求。正在将任务委托给架构师 Subagent。`

在后台，我（Orchestrator）将调用 `architect-subagent` 来执行任务，并为您提供一个无缝的、专家驱动的体验。这种改造将 Orchestrix 的强大功能与 Claude Code 的原生自动化能力完美结合，为您的开发工作带来革命性的提升。
