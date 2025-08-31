const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const glob = require("glob");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const { extractYamlFromAgent } = require("../../lib/yaml-utils");

// Dynamic import for ES module
let chalk;
let inquirer;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
  }
  if (!inquirer) {
    inquirer = (await import("inquirer")).default;
  }
}

class IdeSetup {
  constructor() {
    this.ideAgentConfig = null;
  }

  async loadIdeAgentConfig() {
    if (this.ideAgentConfig) return this.ideAgentConfig;
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'ide-agent-config.yaml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.ideAgentConfig = yaml.load(configContent);
      return this.ideAgentConfig;
    } catch (error) {
      console.warn('Failed to load IDE agent configuration, using defaults');
      return {
        'roo-permissions': {},
        'cline-order': {}
      };
    }
  }

  async setup(ide, installDir, selectedAgent = null, spinner = null, preConfiguredSettings = null) {
    await initializeModules();
    const ideConfig = await configLoader.getIdeConfiguration(ide);

    if (!ideConfig) {
      console.log(chalk.yellow(`\nNo configuration available for ${ide}`));
      return false;
    }

    switch (ide) {
      case "cursor":
        return this.setupCursor(installDir, selectedAgent);
      case "claude-code":
        return this.setupClaudeCode(installDir, selectedAgent);
      case "windsurf":
        return this.setupWindsurf(installDir, selectedAgent);
      case "trae":
        return this.setupTrae(installDir, selectedAgent);
      case "roo":
        return this.setupRoo(installDir, selectedAgent);
      case "cline":
        return this.setupCline(installDir, selectedAgent);
      case "gemini":
        return this.setupGeminiCli(installDir, selectedAgent);
      case "github-copilot":
        return this.setupGitHubCopilot(installDir, selectedAgent, spinner, preConfiguredSettings);
      default:
        console.log(chalk.yellow(`\nIDE ${ide} not yet supported`));
        return false;
    }
  }

  async setupCursor(installDir, selectedAgent) {
    const cursorRulesDir = path.join(installDir, ".cursor", "rules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(cursorRulesDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const mdcPath = path.join(cursorRulesDir, `${agentId}.mdc`);

        // Create MDC content with proper format
        let mdcContent = "---\n";
        mdcContent += "description: \n";
        mdcContent += "globs: []\n";
        mdcContent += "alwaysApply: false\n";
        mdcContent += "---\n\n";
        mdcContent += `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        mdcContent += `This rule is triggered when the user types \`@${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        mdcContent += "## Agent Activation\n\n";
        mdcContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        mdcContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdcContent += yamlContent;
        } else {
          // If no YAML found, include the whole content minus the header
          mdcContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdcContent += "\n```\n\n";
        mdcContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdcContent += `The complete agent definition is available in [${relativePath}](mdc:${relativePath}).\n\n`;
        mdcContent += "## Usage\n\n";
        mdcContent += `When the user types \`@${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;

        await fileManager.writeFile(mdcPath, mdcContent);
        // Removed individual file creation messages for cleaner output
      }
    }

    console.log(chalk.green(`\n✓ 已为 Cursor 创建 ${agents.length} 个代理规则`));

    return true;
  }

  // 修改 setupClaudeCode 方法，添加测试选项
 async setupClaudeCode(installDir, selectedAgent, runTests = false) {
  console.log(chalk.blue("\n🔧 设置 Claude Code 双模式集成..."));
  
  // 使用增强的Sub Agent生成
  const useEnhancedTemplate = true;
  
  let subagentsCount;
  if (useEnhancedTemplate) {
    // 先检查模板是否存在
    const templatePath = path.join(__dirname, '..', 'templates', 'orchestrix-subagent-template.md');
    const templateExists = await fileManager.fileExists(templatePath);
    
    if (!templateExists) {
      console.log(chalk.yellow('⚠️  Enhanced template not found, creating default template...'));
      await this.createDefaultSubagentTemplate();
    }
    
    subagentsCount = await this.setupClaudeCodeSubagentsEnhanced(installDir, selectedAgent);
  } else {
    subagentsCount = await this.setupClaudeCodeSubagents(installDir, selectedAgent);
  }
  
  console.log(chalk.green(`✔ 已创建 ${subagentsCount} 个优化的 Claude Code 子代理`));
  
  // 运行测试（如果启用）
  if (runTests) {
    await this.testSubagentGeneration(installDir);
  }
  
  // 继续设置传统的Commands模式
  const coreSlashPrefix = await this.getCoreSlashPrefix(installDir);
  const coreAgents = selectedAgent ? [selectedAgent] : await this.getCoreAgentIds(installDir);
  const coreTasks = await this.getCoreTaskIds(installDir);
  await this.setupClaudeCodeForPackage(installDir, "core", coreSlashPrefix, coreAgents, coreTasks, ".orchestrix-core");
  
  // Setup expansion pack commands
  const expansionPacks = await this.getInstalledExpansionPacks(installDir);
  for (const packInfo of expansionPacks) {
    const packSlashPrefix = await this.getExpansionPackSlashPrefix(packInfo.path);
    const packAgents = await this.getExpansionPackAgents(packInfo.path);
    const packTasks = await this.getExpansionPackTasks(packInfo.path);
    
    if (packAgents.length > 0 || packTasks.length > 0) {
      const rootPath = path.relative(installDir, packInfo.path);
      await this.setupClaudeCodeForPackage(installDir, packInfo.name, packSlashPrefix, packAgents, packTasks, rootPath);
    }
  }
  
  // Summary
  console.log(chalk.green(`\n✅ Claude Code 双模式集成完成:`));
  console.log(chalk.dim(`   • Sub Agents: .claude/agents/ (${subagentsCount} 个优化代理)`));
  console.log(chalk.dim(`   • Commands: .claude/commands/ (${coreAgents.length} 个命令 + ${coreTasks.length} 个任务)`));
  console.log(chalk.dim(`   • 使用方式: 在 Claude Code 中直接选择 Sub Agent 或使用 /命令`));
  
  return true;
 }

  async setupClaudeCodeForPackage(installDir, packageName, slashPrefix, agentIds, taskIds, rootPath) {
    const commandsBaseDir = path.join(installDir, ".claude", "commands", slashPrefix);
    const agentsDir = path.join(commandsBaseDir, "agents");
    const tasksDir = path.join(commandsBaseDir, "tasks");

    // Ensure directories exist
    await fileManager.ensureDirectory(agentsDir);
    await fileManager.ensureDirectory(tasksDir);

    // Setup agents
    for (const agentId of agentIds) {
      // Find the agent file - for expansion packs, prefer the expansion pack version
      let agentPath;
      if (packageName !== "core") {
        // For expansion packs, first try to find the agent in the expansion pack directory
        const expansionPackPath = path.join(installDir, rootPath, "agents", `${agentId}.md`);
        if (await fileManager.pathExists(expansionPackPath)) {
          agentPath = expansionPackPath;
        } else {
          // Fall back to core if not found in expansion pack
          agentPath = await this.findAgentPath(agentId, installDir);
        }
      } else {
        // For core, use the normal search
        agentPath = await this.findAgentPath(agentId, installDir);
      }
      
      const commandPath = path.join(agentsDir, `${agentId}.md`);

      if (agentPath) {
        // Create command file with agent content
        let agentContent = await fileManager.readFile(agentPath);
        
        // Replace {root} placeholder with the appropriate root path for this context
        agentContent = agentContent.replace(/{root}/g, rootPath);

        // Add command header
        let commandContent = `# /${agentId} Command\n\n`;
        commandContent += `When this command is used, adopt the following agent persona:\n\n`;
        commandContent += agentContent;

        await fileManager.writeFile(commandPath, commandContent);
        // Removed individual command creation messages for cleaner output
      }
    }

    // Setup tasks
    for (const taskId of taskIds) {
      // Find the task file - for expansion packs, prefer the expansion pack version
      let taskPath;
      if (packageName !== "core") {
        // For expansion packs, first try to find the task in the expansion pack directory
        const expansionPackPath = path.join(installDir, rootPath, "tasks", `${taskId}.md`);
        if (await fileManager.pathExists(expansionPackPath)) {
          taskPath = expansionPackPath;
        } else {
          // Fall back to core if not found in expansion pack
          taskPath = await this.findTaskPath(taskId, installDir);
        }
      } else {
        // For core, use the normal search
        taskPath = await this.findTaskPath(taskId, installDir);
      }
      
      const commandPath = path.join(tasksDir, `${taskId}.md`);

      if (taskPath) {
        // Create command file with task content
        let taskContent = await fileManager.readFile(taskPath);
        
        // Replace {root} placeholder with the appropriate root path for this context
        taskContent = taskContent.replace(/{root}/g, rootPath);

        // Add command header
        let commandContent = `# /${taskId} Task\n\n`;
        commandContent += `When this command is used, execute the following task:\n\n`;
        commandContent += taskContent;

        await fileManager.writeFile(commandPath, commandContent);
        // Removed individual task creation messages for cleaner output
      }
    }

    const displayName = packageName === "core" ? "Orchestrix 核心系统" : packageName;
    console.log(chalk.green(`\n✓ 已为 ${displayName} 创建 Claude Code 命令 (代理: ${agentIds.length}个, 任务: ${taskIds.length}个)`));
  }

  async setupWindsurf(installDir, selectedAgent) {
    const windsurfRulesDir = path.join(installDir, ".windsurf", "rules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(windsurfRulesDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const mdPath = path.join(windsurfRulesDir, `${agentId}.md`);

        // Create MD content (similar to Cursor but without frontmatter)
        let mdContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        mdContent += `This rule is triggered when the user types \`@${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        mdContent += "## Agent Activation\n\n";
        mdContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        } else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `When the user types \`@${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;

        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }

    console.log(chalk.green(`\n✓ Created Windsurf rules in ${windsurfRulesDir}`));

    return true;
  }

  async setupTrae(installDir, selectedAgent) {
    const traeRulesDir = path.join(installDir, ".trae", "rules");
    const agents = selectedAgent? [selectedAgent] : await this.getAllAgentIds(installDir);
    
    await fileManager.ensureDirectory(traeRulesDir);
    
    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);
      
      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const mdPath = path.join(traeRulesDir, `${agentId}.md`);
        
        // Create MD content (similar to Cursor but without frontmatter)
        let mdContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        mdContent += `This rule is triggered when the user types \`@${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        mdContent += "## Agent Activation\n\n";
        mdContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        }
        else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `When the user types \`@${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;
        
        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }
  }

  async findAgentPath(agentId, installDir) {
    // Try to find the agent file in various locations
    const possiblePaths = [
      path.join(installDir, ".orchestrix-core", "agents", `${agentId}.md`),
      path.join(installDir, "agents", `${agentId}.md`)
    ];
    
    // Also check expansion pack directories
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${agentId}.md`));
    }
    
    for (const agentPath of possiblePaths) {
      if (await fileManager.pathExists(agentPath)) {
        return agentPath;
      }
    }
    
    return null;
  }

  async getAllAgentIds(installDir) {
    const allAgentIds = [];
    
    // Check core agents in .orchestrix-core or root
    let agentsDir = path.join(installDir, ".orchestrix-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "agents");
    }
    
    if (await fileManager.pathExists(agentsDir)) {
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      allAgentIds.push(...agentFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Also check for expansion pack agents in dot folders
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      const fullExpDir = path.join(installDir, expDir);
      const expAgentFiles = glob.sync("*.md", { cwd: fullExpDir });
      allAgentIds.push(...expAgentFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Remove duplicates
    return [...new Set(allAgentIds)];
  }

  async getCoreAgentIds(installDir) {
    const allAgentIds = [];
    
    // Check core agents in .orchestrix-core or root only
    let agentsDir = path.join(installDir, ".orchestrix-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "orchestrix-core", "agents");
    }
    
    if (await fileManager.pathExists(agentsDir)) {
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      allAgentIds.push(...agentFiles.map((file) => path.basename(file, ".md")));
    }
    
    return [...new Set(allAgentIds)];
  }

  async getCoreTaskIds(installDir) {
    const allTaskIds = [];
    
    // Check core tasks in .orchestrix-core or root only
    let tasksDir = path.join(installDir, ".orchestrix-core", "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      tasksDir = path.join(installDir, "orchestrix-core", "tasks");
    }
    
    if (await fileManager.pathExists(tasksDir)) {
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      allTaskIds.push(...taskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check common tasks
    const commonTasksDir = path.join(installDir, "common", "tasks");
    if (await fileManager.pathExists(commonTasksDir)) {
      const commonTaskFiles = glob.sync("*.md", { cwd: commonTasksDir });
      allTaskIds.push(...commonTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    return [...new Set(allTaskIds)];
  }

  async getAgentTitle(agentId, installDir) {
    // Try to find the agent file in various locations
    const possiblePaths = [
      path.join(installDir, ".orchestrix-core", "agents", `${agentId}.md`),
      path.join(installDir, "agents", `${agentId}.md`)
    ];
    
    // Also check expansion pack directories
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${agentId}.md`));
    }
    
    for (const agentPath of possiblePaths) {
      if (await fileManager.pathExists(agentPath)) {
        try {
          const agentContent = await fileManager.readFile(agentPath);
          const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
          
          if (yamlMatch) {
            const yaml = yamlMatch[1];
            const titleMatch = yaml.match(/title:\s*(.+)/);
            if (titleMatch) {
              return titleMatch[1].trim();
            }
          }
        } catch (error) {
          console.warn(`Failed to read agent title for ${agentId}: ${error.message}`);
        }
      }
    }
    
    // Fallback to formatted agent ID
    return agentId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  async getAllTaskIds(installDir) {
    const allTaskIds = [];
    
    // Check core tasks in .orchestrix-core or root
    let tasksDir = path.join(installDir, ".orchestrix-core", "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      tasksDir = path.join(installDir, "orchestrix-core", "tasks");
    }
    
    if (await fileManager.pathExists(tasksDir)) {
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      allTaskIds.push(...taskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check common tasks
    const commonTasksDir = path.join(installDir, "common", "tasks");
    if (await fileManager.pathExists(commonTasksDir)) {
      const commonTaskFiles = glob.sync("*.md", { cwd: commonTasksDir });
      allTaskIds.push(...commonTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Also check for expansion pack tasks in dot folders
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir });
    for (const expDir of expansionDirs) {
      const fullExpDir = path.join(installDir, expDir);
      const expTaskFiles = glob.sync("*.md", { cwd: fullExpDir });
      allTaskIds.push(...expTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check expansion-packs folder tasks
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const expPackDirs = glob.sync("*/tasks", { cwd: expansionPacksDir });
      for (const expDir of expPackDirs) {
        const fullExpDir = path.join(expansionPacksDir, expDir);
        const expTaskFiles = glob.sync("*.md", { cwd: fullExpDir });
        allTaskIds.push(...expTaskFiles.map((file) => path.basename(file, ".md")));
      }
    }
    
    // Remove duplicates
    return [...new Set(allTaskIds)];
  }

  async findTaskPath(taskId, installDir) {
    // Try to find the task file in various locations
    const possiblePaths = [
      path.join(installDir, ".orchestrix-core", "tasks", `${taskId}.md`),
      path.join(installDir, "orchestrix-core", "tasks", `${taskId}.md`),
      path.join(installDir, "common", "tasks", `${taskId}.md`)
    ];
    
    // Also check expansion pack directories
    
    // Check dot folder expansion packs
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${taskId}.md`));
    }
    
    // Check expansion-packs folder
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const expPackDirs = glob.sync("*/tasks", { cwd: expansionPacksDir });
      for (const expDir of expPackDirs) {
        possiblePaths.push(path.join(expansionPacksDir, expDir, `${taskId}.md`));
      }
    }
    
    for (const taskPath of possiblePaths) {
      if (await fileManager.pathExists(taskPath)) {
        return taskPath;
      }
    }
    
    return null;
  }

  async getCoreSlashPrefix(installDir) {
    try {
      const coreConfigPath = path.join(installDir, ".orchestrix-core", "core-config.yaml");
      if (!(await fileManager.pathExists(coreConfigPath))) {
        // Try orchestrix-core directory
        const altConfigPath = path.join(installDir, "orchestrix-core", "core-config.yaml");
        if (await fileManager.pathExists(altConfigPath)) {
          const configContent = await fileManager.readFile(altConfigPath);
          const config = yaml.load(configContent);
          return config.slashPrefix || "orchestrix";
        }
        return "orchestrix"; // fallback
      }
      
      const configContent = await fileManager.readFile(coreConfigPath);
      const config = yaml.load(configContent);
      return config.slashPrefix || "orchestrix";
    } catch (error) {
      console.warn(`Failed to read core slashPrefix, using default 'orchestrix': ${error.message}`);
      return "orchestrix";
    }
  }

  async getInstalledExpansionPacks(installDir) {
    const expansionPacks = [];
    
    // Check for dot-prefixed expansion packs in install directory
    const dotExpansions = glob.sync(".orchestrix-*", { cwd: installDir });
    
    for (const dotExpansion of dotExpansions) {
      if (dotExpansion !== ".orchestrix-core") {
        const packPath = path.join(installDir, dotExpansion);
        const packName = dotExpansion.substring(1); // remove the dot
        expansionPacks.push({
          name: packName,
          path: packPath
        });
      }
    }
    
    // Check for expansion-packs directory style
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const packDirs = glob.sync("*", { cwd: expansionPacksDir });
      
      for (const packDir of packDirs) {
        const packPath = path.join(expansionPacksDir, packDir);
        if ((await fileManager.pathExists(packPath)) && 
            (await fileManager.pathExists(path.join(packPath, "config.yaml")))) {
          expansionPacks.push({
            name: packDir,
            path: packPath
          });
        }
      }
    }
    
    return expansionPacks;
  }

  async getExpansionPackSlashPrefix(packPath) {
    try {
      const configPath = path.join(packPath, "config.yaml");
      if (await fileManager.pathExists(configPath)) {
        const configContent = await fileManager.readFile(configPath);
        const config = yaml.load(configContent);
        return config.slashPrefix || path.basename(packPath);
      }
    } catch (error) {
      console.warn(`Failed to read expansion pack slashPrefix from ${packPath}: ${error.message}`);
    }
    
    return path.basename(packPath); // fallback to directory name
  }

  async getExpansionPackAgents(packPath) {
    const agentsDir = path.join(packPath, "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      return [];
    }
    
    try {
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      return agentFiles.map(file => path.basename(file, ".md"));
    } catch (error) {
      console.warn(`Failed to read expansion pack agents from ${packPath}: ${error.message}`);
      return [];
    }
  }

  async getExpansionPackTasks(packPath) {
    const tasksDir = path.join(packPath, "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      return [];
    }
    
    try {
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      return taskFiles.map(file => path.basename(file, ".md"));
    } catch (error) {
      console.warn(`Failed to read expansion pack tasks from ${packPath}: ${error.message}`);
      return [];
    }
  }

  async setupRoo(installDir, selectedAgent) {
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    // Check for existing .roomodes file in project root
    const roomodesPath = path.join(installDir, ".roomodes");
    let existingModes = [];
    let existingContent = "";

    if (await fileManager.pathExists(roomodesPath)) {
      existingContent = await fileManager.readFile(roomodesPath);
      // Parse existing modes to avoid duplicates
      const modeMatches = existingContent.matchAll(/- slug: ([\w-]+)/g);
      for (const match of modeMatches) {
        existingModes.push(match[1]);
      }
      console.log(chalk.yellow(`Found existing .roomodes file with ${existingModes.length} modes`));
    }

    // Create new modes content
    let newModesContent = "";

    // Load dynamic agent permissions from configuration
    const config = await this.loadIdeAgentConfig();
    const agentPermissions = config['roo-permissions'] || {};

    for (const agentId of agents) {
      // Skip if already exists
      if (existingModes.includes(`orchestrix-${agentId}`)) {
        console.log(chalk.dim(`Skipping ${agentId} - already exists in .roomodes`));
        continue;
      }

      // Read agent file to extract all information
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);

        // Extract YAML content
        const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
        if (yamlMatch) {
          const yaml = yamlMatch[1];

          // Extract agent info from YAML
          const titleMatch = yaml.match(/title:\s*(.+)/);
          const iconMatch = yaml.match(/icon:\s*(.+)/);
          const whenToUseMatch = yaml.match(/whenToUse:\s*(?:"([^"]+)"|'([^']+)'|([^\n\r]+))/);
          const roleDefinitionMatch = yaml.match(/roleDefinition:\s*"(.+)"/);

          const title = titleMatch ? titleMatch[1].trim() : await this.getAgentTitle(agentId, installDir);
          const icon = iconMatch ? iconMatch[1].trim() : "🤖";
          
          let whenToUse = `Use for ${title} tasks`;
          if (whenToUseMatch) {
            // Handle quoted strings (with " or ')
            const whenToUseValue = whenToUseMatch[1] || whenToUseMatch[2];
            // Handle unquoted strings (but trim trailing whitespace)
            if (whenToUseValue) {
              whenToUse = whenToUseValue.trim();
            } else if (whenToUseMatch[3]) {
              whenToUse = whenToUseMatch[3].trim();
            }
          }
          const roleDefinition = roleDefinitionMatch
            ? roleDefinitionMatch[1].trim()
            : `You are a ${title} specializing in ${title.toLowerCase()} tasks and responsibilities.`;

          // Build mode entry with proper formatting (matching exact indentation)
          newModesContent += ` - slug: orchestrix-${agentId}\n`;
          newModesContent += `   name: '${icon} ${title}'\n`;
          newModesContent += `   roleDefinition: ${roleDefinition}\n`;
          newModesContent += `   whenToUse: ${whenToUse}\n`;
          // Get relative path from installDir to agent file
          const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
          newModesContent += `   customInstructions: CRITICAL Read the full YAML from ${relativePath} start activation to alter your state of being follow startup section instructions stay in this being until told to exit this mode\n`;
          newModesContent += `   groups:\n`;
          newModesContent += `    - read\n`;

          // Add permissions based on agent type
          const permissions = agentPermissions[agentId];
          if (permissions) {
            newModesContent += `    - - edit\n`;
            newModesContent += `      - fileRegex: ${permissions.fileRegex}\n`;
            newModesContent += `        description: ${permissions.description}\n`;
          } else {
            newModesContent += `    - edit\n`;
          }

          console.log(chalk.green(`✓ Added mode: orchestrix-${agentId} (${icon} ${title})`));
        }
      }
    }

    // Build final roomodes content
    let roomodesContent = "";
    if (existingContent) {
      // If there's existing content, append new modes to it
      roomodesContent = existingContent.trim() + "\n" + newModesContent;
    } else {
      // Create new .roomodes file with proper YAML structure
      roomodesContent = "customModes:\n" + newModesContent;
    }

    // Write .roomodes file
    await fileManager.writeFile(roomodesPath, roomodesContent);
    console.log(chalk.green("✓ Created .roomodes file in project root"));

    console.log(chalk.green(`\n✓ Roo Code setup complete!`));
    console.log(chalk.dim("Custom modes will be available when you open this project in Roo Code"));

    return true;
  }

  async setupCline(installDir, selectedAgent) {
    const clineRulesDir = path.join(installDir, ".clinerules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(clineRulesDir);

    // Load dynamic agent ordering from configuration
    const config = await this.loadIdeAgentConfig();
    const agentOrder = config['cline-order'] || {};

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);

        // Get numeric prefix for ordering
        const order = agentOrder[agentId] || 99;
        const prefix = order.toString().padStart(2, '0');
        const mdPath = path.join(clineRulesDir, `${prefix}-${agentId}.md`);

        // Create MD content for Cline (focused on project standards and role)
        let mdContent = `# ${await this.getAgentTitle(agentId, installDir)} Agent\n\n`;
        mdContent += `This rule defines the ${await this.getAgentTitle(agentId, installDir)} persona and project standards.\n\n`;
        mdContent += "## Role Definition\n\n";
        mdContent +=
          "When the user types `@" + agentId + "`, adopt this persona and follow these guidelines:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        } else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## Project Standards\n\n";
        mdContent += `- Always maintain consistency with project documentation in .orchestrix-core/\n`;
        mdContent += `- Follow the agent's specific guidelines and constraints\n`;
        mdContent += `- Update relevant project files when making changes\n`;
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `- Reference the complete agent definition in [${relativePath}](${relativePath})\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `Type \`@${agentId}\` to activate this ${await this.getAgentTitle(agentId, installDir)} persona.\n`;

        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${prefix}-${agentId}.md`));
      }
    }

    console.log(chalk.green(`\n✓ Created Cline rules in ${clineRulesDir}`));

    return true;
  }

  async setupGeminiCli(installDir) {
    await initializeModules();
    const geminiDir = path.join(installDir, ".gemini");
    const orchestrixMethodDir = path.join(geminiDir, "Orchestrix");
    await fileManager.ensureDirectory(orchestrixMethodDir);

    // Update logic for existing settings.json
    const settingsPath = path.join(geminiDir, "settings.json");
    if (await fileManager.pathExists(settingsPath)) {
      try {
        const settingsContent = await fileManager.readFile(settingsPath);
        const settings = JSON.parse(settingsContent);
        let updated = false;
        
        // Handle contextFileName property
        if (settings.contextFileName && Array.isArray(settings.contextFileName)) {
          const originalLength = settings.contextFileName.length;
          settings.contextFileName = settings.contextFileName.filter(
            (fileName) => !fileName.startsWith("agents/")
          );
          if (settings.contextFileName.length !== originalLength) {
            updated = true;
          }
        }
        
        if (updated) {
          await fileManager.writeFile(
            settingsPath,
            JSON.stringify(settings, null, 2)
          );
          console.log(chalk.green("✓ Updated .gemini/settings.json - removed agent file references"));
        }
      } catch (error) {
        console.warn(
          chalk.yellow("Could not update .gemini/settings.json"),
          error
        );
      }
    }

    // Remove old agents directory
    const agentsDir = path.join(geminiDir, "agents");
    if (await fileManager.pathExists(agentsDir)) {
      await fileManager.removeDirectory(agentsDir);
      console.log(chalk.green("✓ Removed old .gemini/agents directory"));
    }

    // Get all available agents
    const agents = await this.getAllAgentIds(installDir);
    let concatenatedContent = "";

    for (const agentId of agents) {
      // Find the source agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        
        // Create properly formatted agent rule content (similar to trae)
        let agentRuleContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        agentRuleContent += `This rule is triggered when the user types \`*${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        agentRuleContent += "## Agent Activation\n\n";
        agentRuleContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        agentRuleContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          agentRuleContent += yamlContent;
        }
        else {
          // If no YAML found, include the whole content minus the header
          agentRuleContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        agentRuleContent += "\n```\n\n";
        agentRuleContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        agentRuleContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        agentRuleContent += "## Usage\n\n";
        agentRuleContent += `When the user types \`*${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;
        
        // Add to concatenated content with separator
        concatenatedContent += agentRuleContent + "\n\n---\n\n";
        console.log(chalk.green(`✓ Added context for @${agentId}`));
      }
    }

    // Write the concatenated content to GEMINI.md
    const geminiMdPath = path.join(orchestrixMethodDir, "GEMINI.md");
    await fileManager.writeFile(geminiMdPath, concatenatedContent);
    console.log(chalk.green(`\n✓ Created GEMINI.md in ${orchestrixMethodDir}`));

    return true;
  }

  async setupGitHubCopilot(installDir, selectedAgent, spinner = null, preConfiguredSettings = null) {
    await initializeModules();
    
    // Configure VS Code workspace settings first to avoid UI conflicts with loading spinners
    await this.configureVsCodeSettings(installDir, spinner, preConfiguredSettings);
    
    const chatmodesDir = path.join(installDir, ".github", "chatmodes");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);
     
    await fileManager.ensureDirectory(chatmodesDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);
      const chatmodePath = path.join(chatmodesDir, `${agentId}.chatmode.md`);

      if (agentPath) {
        // Create chat mode file with agent content
        const agentContent = await fileManager.readFile(agentPath);
        const agentTitle = await this.getAgentTitle(agentId, installDir);
        
        // Extract whenToUse for the description
        const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
        let description = `Activates the ${agentTitle} agent persona.`;
        if (yamlMatch) {
          const whenToUseMatch = yamlMatch[1].match(/whenToUse:\s*(?:"([^"]+)"|'([^']+)'|([^\n\r]+))/);
          if (whenToUseMatch) {
            // Handle quoted strings (with " or ')
            const whenToUseValue = whenToUseMatch[1] || whenToUseMatch[2];
            // Handle unquoted strings (but trim trailing whitespace)
            if (whenToUseValue) {
              description = whenToUseValue.trim();
            } else if (whenToUseMatch[3]) {
              description = whenToUseMatch[3].trim();
            }
          }
        }
        
        let chatmodeContent = `---
description: "${description.replace(/"/g, '\\"')}"
tools: ['changes', 'codebase', 'fetch', 'findTestFiles', 'githubRepo', 'problems', 'usages']
---

`;
        chatmodeContent += agentContent;

        await fileManager.writeFile(chatmodePath, chatmodeContent);
        console.log(chalk.green(`✓ Created chat mode: ${agentId}.chatmode.md`));
      }
    }

    console.log(chalk.green(`\n✓ Github Copilot setup complete!`));
    console.log(chalk.dim(`You can now find the orchestrix agents in the Chat view's mode selector.`));

    return true;
  }

  async loadSubagentTemplate() {
    const templatePath = path.join(__dirname, '..', 'templates', 'deterministic-subagent-template.md');
    try {
      return await fileManager.readFile(templatePath);
    } catch (error) {
      // Fallback to simple template if deterministic template not found
      const fallbackPath = path.join(__dirname, '..', 'templates', 'simple-subagent-template.md');
      try {
        return await fileManager.readFile(fallbackPath);
      } catch (fallbackError) {
        console.warn(`Could not load subagent templates: ${error.message}`);
        return null;
      }
    }
  }

  async generateSubagentFromTemplate(agentId, agentContent, installDir) {
    const template = await this.loadSubagentTemplate();
    if (!template) {
      return null;
    }

    const metadata = this.extractAgentMetadata(agentContent);
    
    // Deterministic workflow placeholders
    const placeholders = {
      '{AGENT_ID}': agentId,
      '{DESCRIPTION}': this.generateDescription(metadata),
      '{WHEN_TO_USE}': this.generateWhenToUse(metadata),
      '{TOOLS}': this.getAgentPermissions(agentId).join(', '),
      '{AGENT_NAME}': metadata.agent.name || agentId,
      '{ROLE}': metadata.persona.role || 'AI Assistant',
      '{FOCUS}': metadata.persona.focus || 'Execute tasks efficiently and follow Orchestrix workflows.',
      '{INTENT_PATTERNS}': this.generateIntentPatterns(metadata, agentContent, agentId),
      '{WORKFLOW_DEFINITIONS}': this.generateWorkflowDefinitions(metadata, agentContent, agentId),
      '{DEPENDENCIES}': this.generateDependencies(metadata),
      '{SPECIAL_INSTRUCTIONS}': this.generateSpecialInstructions(metadata, agentId)
    };
    
    // Replace all placeholders in the template
    let content = template;
    for (const [placeholder, value] of Object.entries(placeholders)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, value);
    }
    
    // Finally replace {root} with .orchestrix-core (this should be the LAST step)
    content = content.replace(/\{root\}/g, '.orchestrix-core');
    
    return content;
  }

  generateDescription(metadata) {
    const title = metadata.agent.title || metadata.agent.name || 'AI Assistant';
    const role = metadata.persona.role || 'Assistant';
    return `${title} - ${role} specialized in Orchestrix workflows`;
  }

  generateWhenToUse(metadata) {
    const whenToUse = metadata.agent.whenToUse || 'general assistance and task execution';
    // Clean up the description to avoid redundancy
    return whenToUse.replace(/^use for /i, '').replace(/^Use for /i, '');
  }

  generateCorePrinciples(metadata) {
    const principles = metadata.core_principles || [];
    if (principles.length === 0) {
      return '- Follow Orchestrix workflows and maintain quality standards\n- Execute commands with precision and provide clear feedback';
    }
    
    // Take top 3-4 most important principles and format them
    return principles.slice(0, 4).map(p => `- ${p}`).join('\n');
  }

  generateCommands(metadata, agentContent) {
    const commands = metadata.commands || [];
    if (commands.length === 0) {
      return '- `*help`: Show available commands\n- `*exit`: Exit agent mode';
    }
    
    return commands.map(cmd => {
      const description = this.getCommandDescription(cmd, agentContent);
      return `- \`*${cmd.name}\`: ${description}`;
    }).join('\n');
  }

  generateDependencies(metadata) {
    const deps = metadata.dependencies || {};
    const depTypes = Object.keys(deps).filter(key => deps[key] && deps[key].length > 0);
    
    if (depTypes.length === 0) {
      return 'Standard Orchestrix resources (tasks, templates, checklists)';
    }
    
    return depTypes.map(type => 
      `**${type}**: ${deps[type].join(', ')}`
    ).join('\n');
  }

  generateIntentPatterns(metadata, agentContent, agentId) {
    // Extract REQUEST-RESOLUTION patterns and convert to intent patterns
    const requestResolution = this.extractRequestResolution(agentContent);
    const commands = metadata.commands || [];
    
    // Agent-specific intent patterns based on commands and REQUEST-RESOLUTION
    const agentPatterns = {
      'dev': {
        'story_implementation': [
          'implement this story', 'develop the feature', 'code this requirement',
          'build this functionality', 'create the implementation'
        ],
        'testing_validation': [
          'run tests', 'validate the code', 'check for bugs',
          'execute linting', 'verify implementation'
        ],
        'code_explanation': [
          'explain what you did', 'teach me about the code', 'how does this work',
          'walk me through the implementation'
        ]
      },
      'architect': {
        'architecture_design': [
          'design system architecture', 'create architecture document', 'architectural guidance',
          'system design help', 'technical architecture planning'
        ],
        'technology_research': [
          'research technology options', 'investigate solutions', 'technology recommendations',
          'evaluate technical approaches'
        ],
        'technical_review': [
          'review story for technical accuracy', 'validate technical approach',
          'assess technical feasibility'
        ],
        'project_documentation': [
          'document existing project', 'analyze current system', 'understand codebase',
          'create project overview'
        ]
      },
      'qa': {
        'story_review': [
          'review story', 'validate story implementation', 'check story completion',
          'quality assurance review', 'story qa validation'
        ],
        'document_creation': [
          'create documentation', 'document test results', 'generate qa report',
          'create test documentation'
        ],
        'quality_validation': [
          'review code quality', 'check for issues', 'validate requirements',
          'test the implementation', 'quality assurance'
        ]
      },
      'sm': {
        'story_creation': [
          'create next story', 'draft new story', 'prepare story',
          'generate user story', 'story development'
        ],
        'story_validation': [
          'validate story quality', 'review story completeness',
          'check story criteria'
        ],
        'project_adjustment': [
          'correct course', 'adjust project direction', 'handle project deviation',
          'course correction', 'fix project issues', 'pivot strategy',
          'resolve project conflicts', 'navigate project changes'
        ]
      },
      'analyst': {
        'document_creation': [
          'create document', 'draft documentation', 'generate report',
          'create analysis document'
        ],
        'research_analysis': [
          'research market trends', 'analyze competition', 'market analysis',
          'business intelligence', 'data analysis'
        ],
        'project_documentation': [
          'document current project', 'analyze existing system',
          'project discovery', 'system analysis'
        ],
        'brainstorming': [
          'facilitate brainstorming', 'brainstorm ideas', 'ideation session',
          'generate ideas', 'creative session'
        ],
        'elicitation': [
          'elicit requirements', 'gather requirements', 'requirement discovery',
          'advanced elicitation'
        ]
      },
      'pm': {
        'document_creation': [
          'create PRD', 'draft product document', 'generate requirements',
          'create product specification'
        ],
        'product_planning': [
          'create product requirements', 'draft PRD', 'product strategy',
          'requirements documentation', 'feature planning'
        ],
        'brownfield_management': [
          'create epic for existing project', 'brownfield epic creation',
          'manage existing system', 'legacy project planning'
        ],
        'document_processing': [
          'shard document', 'split document', 'organize documentation',
          'document sharding'
        ]
      },
      'po': {
        'document_creation': [
          'create document', 'draft specification', 'generate requirements',
          'create product document'
        ],
        'backlog_management': [
          'manage product backlog', 'prioritize features', 'backlog refinement',
          'requirements organization'
        ],
        'story_management': [
          'create epic', 'create story', 'validate story draft',
          'story validation', 'epic creation'
        ],
        'document_processing': [
          'shard document', 'split document', 'organize documentation',
          'document sharding'
        ],
        'checklist_execution': [
          'run checklist', 'execute checklist', 'validate with checklist',
          'quality validation'
        ]
      },
      'ux-expert': {
        'document_creation': [
          'create frontend spec', 'design documentation', 'UI specification',
          'create design document'
        ],
        'ui_generation': [
          'generate UI prompt', 'create AI prompt for UI', 'UI generation prompt',
          'craft frontend prompt'
        ],
        'design_planning': [
          'create UI design', 'design user interface', 'user experience design',
          'frontend specifications', 'design wireframes'
        ],
        'design_research': [
          'research design patterns', 'UX research', 'design investigation',
          'user experience research'
        ]
      },
      'orchestrix-master': {
        'knowledge_base': [
          'knowledge base mode', 'KB mode', 'orchestrix knowledge',
          'framework documentation'
        ],
        'task_execution': [
          'execute task', 'run task', 'task execution',
          'specific task'
        ],
        'document_creation': [
          'create document', 'generate documentation', 'create doc',
          'document generation'
        ],
        'checklist_validation': [
          'run checklist', 'execute checklist', 'checklist validation',
          'quality gate'
        ],
        'document_processing': [
          'shard document', 'split document', 'document sharding',
          'organize documentation'
        ]
      },
      'orchestrix-orchestrator': {
        'agent_coordination': [
          'coordinate agents', 'switch agent', 'agent transformation',
          'multi-agent workflow'
        ],
        'workflow_management': [
          'start workflow', 'manage workflow', 'workflow execution',
          'process orchestration'
        ],
        'status_tracking': [
          'check status', 'show progress', 'workflow status',
          'current state'
        ],
        'planning': [
          'create plan', 'workflow planning', 'detailed planning',
          'plan workflow'
        ],
        'chat_mode': [
          'chat mode', 'conversational assistance', 'detailed help',
          'interactive guidance'
        ]
      }
    };

    const patterns = agentPatterns[agentId] || {};
    
    // Filter out inappropriate intents for subagent mode
    const filteredPatterns = { ...patterns };
    
    // Remove document_output from all agents except dev, qa, sm
    if (!['dev', 'qa', 'sm'].includes(agentId)) {
      delete filteredPatterns.document_output;
    }
    
    // Agent-specific intent removal
    if (agentId === 'architect') {
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'dev') {
      delete filteredPatterns.story_validation;
    }
    
    if (agentId === 'sm') {
      delete filteredPatterns.checklist_execution;
    }
    
    if (agentId === 'pm') {
      delete filteredPatterns.document_processing;
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'po') {
      delete filteredPatterns.document_processing;
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'orchestrix-master') {
      delete filteredPatterns.knowledge_base;
      delete filteredPatterns.document_processing;
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'orchestrix-orchestrator') {
      delete filteredPatterns.chat_mode;
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'analyst') {
      delete filteredPatterns.document_output;
    }
    
    if (agentId === 'ux-expert') {
      delete filteredPatterns.document_output;
    }
    
    let result = [];
    
    for (const [intentName, triggers] of Object.entries(filteredPatterns)) {
      result.push(`**${intentName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:**`);
      result.push(triggers.map(t => `- "${t}"`).join('\n'));
      result.push('');
    }
    
    return result.join('\n').trim();
  }

  generateWorkflowDefinitions(metadata, agentContent, agentId) {
    const commands = metadata.commands || [];
    const deps = metadata.dependencies || {};
    
    // Convert commands to workflow sequences
    const workflowMappings = {
      'dev': {
        'story_implementation': {
          sequence: [
            'Load story file and analyze requirements',
            'Execute develop-story workflow: Read task → Implement → Test → Validate → Update progress',
            'Run execute-checklist with story-dod-checklist.md',
            'Update story status to "Ready for Review"'
          ],
          dependencies: ['execute-checklist.md', 'validate-next-story.md'],
          checklist: 'story-dod-checklist.md'
        },
        'testing_validation': {
          sequence: [
            'Execute linting and test suite',
            'Analyze test results and coverage',
            'Report findings and recommendations'
          ],
          dependencies: ['validate-next-story.md']
        },
        'story_validation': {
          sequence: [
            'Execute validate-next-story.md task',
            'Analyze story completeness and quality',
            'Provide validation results and recommendations'
          ],
          dependencies: ['validate-next-story.md']
        }
      },
      'architect': {
        'architecture_design': {
          sequence: [
            'Load technical-preferences.md and project context',
            'Execute create-doc.md task with architecture template',
            'Generate comprehensive architecture document',
            'Run execute-checklist with architect-checklist.md'
          ],
          dependencies: ['create-doc.md', 'execute-checklist.md'],
          templates: ['architecture-tmpl.yaml', 'fullstack-architecture-tmpl.yaml'],
          checklist: 'architect-checklist.md'
        },
        'technology_research': {
          sequence: [
            'Execute create-deep-research-prompt.md task',
            'Analyze technology options and trade-offs',
            'Provide recommendations with rationale'
          ],
          dependencies: ['create-deep-research-prompt.md']
        },
        'technical_review': {
          sequence: [
            'Load story and analyze technical accuracy',
            'Execute review-story-technical-accuracy.md task',
            'Run execute-checklist with architect-technical-review-checklist.md'
          ],
          dependencies: ['review-story-technical-accuracy.md', 'execute-checklist.md'],
          checklist: 'architect-technical-review-checklist.md'
        },
        'project_documentation': {
          sequence: [
            'Execute document-project.md task',
            'Analyze existing codebase and documentation',
            'Generate comprehensive project overview'
          ],
          dependencies: ['document-project.md']
        },
        'document_output': {
          sequence: [
            'Generate final document output',
            'Export document to specified location',
            'Ensure document format and completeness'
          ]
        }
      },
      'sm': {
        'story_creation': {
          sequence: [
            'Execute create-next-story.md task',
            'Generate comprehensive story with acceptance criteria',
            'Run execute-checklist with story-draft-checklist.md'
          ],
          dependencies: ['create-next-story.md', 'execute-checklist.md'],
          checklist: 'story-draft-checklist.md'
        },
        'story_validation': {
          sequence: [
            'Execute validate-story-quality task',
            'Analyze story completeness and technical accuracy',
            'Provide improvement recommendations'
          ]
        },
        'project_adjustment': {
          sequence: [
            'Execute correct-course.md task',
            'Analyze project direction and issues using change-checklist.md',
            'Generate Sprint Change Proposal with specific edits',
            'Provide corrective action plan for project realignment'
          ],
          dependencies: ['correct-course.md'],
          checklist: 'change-checklist.md'
        },
        'checklist_execution': {
          sequence: [
            'Execute execute-checklist.md task',
            'Validate against specified checklist',
            'Report validation results'
          ],
          dependencies: ['execute-checklist.md']
        }
      },
      'qa': {
        'story_review': {
          sequence: [
            'Load story file and implementation',
            'Execute review-story.md task',
            'Update QA Results section only',
            'Provide detailed quality feedback'
          ],
          dependencies: ['review-story.md']
        },
        'document_creation': {
          sequence: [
            'Execute create-doc.md task',
            'Generate QA documentation',
            'Ensure quality standards compliance'
          ],
          dependencies: ['create-doc.md']
        }
      },
      'pm': {
        'document_creation': {
          sequence: [
            'Execute create-doc.md task with PRD template',
            'Generate comprehensive product requirements',
            'Run execute-checklist with pm-checklist.md'
          ],
          dependencies: ['create-doc.md', 'execute-checklist.md'],
          templates: ['prd-tmpl.yaml'],
          checklist: 'pm-checklist.md'
        },
        'brownfield_management': {
          sequence: [
            'Execute brownfield-create-epic.md or brownfield-create-story.md',
            'Analyze existing system requirements',
            'Generate appropriate documentation for legacy system'
          ],
          dependencies: ['brownfield-create-epic.md', 'brownfield-create-story.md']
        },
        'document_processing': {
          sequence: [
            'Execute shard-doc.md task',
            'Split large documents into manageable sections',
            'Organize documentation structure'
          ],
          dependencies: ['shard-doc.md']
        }
      },
      'analyst': {
        'document_creation': {
          sequence: [
            'Execute create-doc.md task',
            'Generate analytical documentation',
            'Run execute-checklist for validation'
          ],
          dependencies: ['create-doc.md', 'execute-checklist.md']
        },
        'project_documentation': {
          sequence: [
            'Execute document-project.md task',
            'Analyze existing codebase and documentation',
            'Generate comprehensive project overview'
          ],
          dependencies: ['document-project.md']
        },
        'brainstorming': {
          sequence: [
            'Execute facilitate-brainstorming-session.md task',
            'Guide structured ideation process',
            'Document and organize generated ideas'
          ],
          dependencies: ['facilitate-brainstorming-session.md']
        },
        'elicitation': {
          sequence: [
            'Execute advanced-elicitation.md task',
            'Gather detailed requirements through structured questioning',
            'Document elicited requirements'
          ],
          dependencies: ['advanced-elicitation.md']
        },
        'research_analysis': {
          sequence: [
            'Execute create-deep-research-prompt.md task',
            'Conduct comprehensive market and competitive analysis',
            'Generate research report with findings'
          ],
          dependencies: ['create-deep-research-prompt.md']
        }
      },
      'po': {
        'document_creation': {
          sequence: [
            'Execute create-doc.md task',
            'Generate product documentation',
            'Validate document completeness'
          ],
          dependencies: ['create-doc.md']
        },
        'story_management': {
          sequence: [
            'Execute brownfield-create-epic.md or brownfield-create-story.md',
            'Create and organize user stories',
            'Validate story readiness'
          ],
          dependencies: ['brownfield-create-epic.md', 'brownfield-create-story.md']
        },
        'document_processing': {
          sequence: [
            'Execute shard-doc.md task',
            'Split and organize large documents',
            'Ensure document accessibility'
          ],
          dependencies: ['shard-doc.md']
        },
        'checklist_execution': {
          sequence: [
            'Execute execute-checklist.md task',
            'Run comprehensive quality validation',
            'Report validation results'
          ],
          dependencies: ['execute-checklist.md'],
          checklist: 'po-master-checklist.md'
        }
      },
      'ux-expert': {
        'document_creation': {
          sequence: [
            'Execute create-doc.md task with frontend template',
            'Generate UI/UX specifications',
            'Validate design documentation'
          ],
          dependencies: ['create-doc.md'],
          templates: ['front-end-spec-tmpl.yaml']
        },
        'ui_generation': {
          sequence: [
            'Execute generate-ai-frontend-prompt.md task',
            'Craft optimized AI prompts for UI generation',
            'Provide implementation guidance'
          ],
          dependencies: ['generate-ai-frontend-prompt.md']
        },
        'design_research': {
          sequence: [
            'Execute create-deep-research-prompt.md task',
            'Research UX patterns and design trends',
            'Provide research-based recommendations'
          ],
          dependencies: ['create-deep-research-prompt.md']
        }
      },
      'orchestrix-master': {
        'knowledge_base': {
          sequence: [
            'Load orchestrix-kb.md knowledge base',
            'Activate KB mode for framework guidance',
            'Provide comprehensive Orchestrix assistance'
          ]
        },
        'task_execution': {
          sequence: [
            'Load and execute specified task',
            'Apply task instructions precisely',
            'Report task completion status'
          ]
        },
        'document_creation': {
          sequence: [
            'Execute create-doc.md task',
            'Select appropriate template',
            'Generate comprehensive documentation'
          ],
          dependencies: ['create-doc.md']
        },
        'checklist_validation': {
          sequence: [
            'Execute execute-checklist.md task',
            'Select appropriate checklist',
            'Perform thorough validation'
          ],
          dependencies: ['execute-checklist.md']
        },
        'document_processing': {
          sequence: [
            'Execute shard-doc.md task',
            'Process and organize documentation',
            'Ensure document structure integrity'
          ],
          dependencies: ['shard-doc.md']
        }
      },
      'orchestrix-orchestrator': {
        'agent_coordination': {
          sequence: [
            'Assess user needs and recommend appropriate agent',
            'Transform into specified agent persona',
            'Coordinate multi-agent workflows'
          ]
        },
        'workflow_management': {
          sequence: [
            'Identify optimal workflow for user requirements',
            'Initialize workflow execution',
            'Track and manage workflow progress'
          ]
        },
        'status_tracking': {
          sequence: [
            'Assess current project context',
            'Report active agent and workflow status',
            'Provide next-step recommendations'
          ]
        },
        'planning': {
          sequence: [
            'Analyze project requirements',
            'Create detailed workflow plan',
            'Organize task sequences and dependencies'
          ]
        },
        'chat_mode': {
          sequence: [
            'Activate conversational assistance mode',
            'Provide detailed interactive guidance',
            'Adapt responses to user expertise level'
          ]
        }
      }
    };

    const agentWorkflows = workflowMappings[agentId] || {};
    
    // Filter out inappropriate workflows for subagent mode
    const filteredWorkflows = { ...agentWorkflows };
    
    // Remove document_output workflows from all agents except dev, qa, sm
    if (!['dev', 'qa', 'sm'].includes(agentId)) {
      delete filteredWorkflows.document_output;
    }
    
    // Agent-specific workflow removal
    if (agentId === 'architect') {
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'dev') {
      delete filteredWorkflows.story_validation;
    }
    
    if (agentId === 'sm') {
      delete filteredWorkflows.checklist_execution;
    }
    
    if (agentId === 'pm') {
      delete filteredWorkflows.document_processing;
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'po') {
      delete filteredWorkflows.document_processing;
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'orchestrix-master') {
      delete filteredWorkflows.knowledge_base;
      delete filteredWorkflows.document_processing;
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'orchestrix-orchestrator') {
      delete filteredWorkflows.chat_mode;
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'analyst') {
      delete filteredWorkflows.document_output;
    }
    
    if (agentId === 'ux-expert') {
      delete filteredWorkflows.document_output;
    }
    
    let result = [];

    for (const [workflowName, workflow] of Object.entries(filteredWorkflows)) {
      result.push(`**${workflowName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Flow:**`);
      result.push('```');
      workflow.sequence.forEach((step, index) => {
        result.push(`${index + 1}. ${step}`);
      });
      if (workflow.checklist) {
        result.push(`Final: Validate with ${workflow.checklist}`);
      }
      result.push('```');
      result.push('');
    }

    return result.join('\n').trim();
  }

  extractRequestResolution(agentContent) {
    // Extract REQUEST-RESOLUTION section from agent content
    const match = agentContent.match(/REQUEST-RESOLUTION:\s*(.*?)(?=\n[A-Z-]+:|```|\n$)/s);
    return match ? match[1].trim() : '';
  }

  generateSpecialInstructions(metadata, agentId) {
    // Agent-specific critical instructions
    const specialInstructions = {
      'dev': 'Only update story file Dev Agent Record sections. Never modify tests to make them pass.',
      'qa': 'Focus on finding issues Dev might miss. Test boundary conditions and edge cases.',
      'architect': 'Think holistically about system design. Consider scalability, maintainability, and user experience.',
      'sm': 'Create clear, complete stories with proper acceptance criteria and technical details.',
      'po': 'Maintain product vision alignment while managing backlog priorities.',
      'analyst': 'Provide data-driven insights and thorough market research.',
      'pm': 'Balance user needs, technical constraints, and business objectives.',
      'ux-expert': 'Focus on user experience and accessibility in all design decisions.',
      'orchestrix-master': 'Coordinate across all domains and provide strategic guidance.',
      'orchestrix-orchestrator': 'Manage workflow coordination and ensure quality gates are met.'
    };
    
    return specialInstructions[agentId] || 'Follow standard Orchestrix workflow patterns';
  }

  generateActivationStepsStructured(metadata, agentContent) {
    const sections = this.parseStructuredActivationInstructions(this.extractActivationSection(agentContent));
    if (sections.length === 0) {
      return `**Startup Protocol:**
- Adopt the ${metadata.persona.role || 'agent'} persona immediately
- Load any devLoadAlwaysFiles from core-config.yaml
- Announce readiness and available commands
- Await user instructions`;
    }
    
    return sections.map(section => 
      `**${section.title}:**\n${section.items.map(item => `- ${item}`).join('\n')}`
    ).join('\n\n');
  }

  generateFileLoadingRulesSimplified(metadata) {
    return `**Auto-Load:** devLoadAlwaysFiles from core-config.yaml at startup
**On-Demand:** Load dependency files only when executing specific commands
**Restriction:** Never load external documentation unless explicitly requested in story or user command`;
  }

  generateExecutionRulesHierarchical(metadata) {
    return `**Priority 1:** Execute activation instructions in sequence
**Priority 2:** Process user commands with * prefix (e.g., *help, *create)
**Priority 3:** Apply core behavioral principles to all actions
**Priority 4:** Load workflow dependencies only when specific tasks require them`;
  }

  generateBehavioralConstraintsActionable(metadata) {
    const principles = metadata.core_principles || [];
    if (principles.length === 0) {
      return `**Quality Control:**
- Verify all work meets project standards
- Ask for clarification when requirements are ambiguous
- Document all significant decisions and changes`;
    }
    
    return `**Quality Control:**\n${principles.slice(0, 3).map(p => `- ${p}`).join('\n')}`;
  }

  generateCommandsWithCompleteSpecs(metadata, agentContent) {
    const commands = metadata.commands || [];
    if (commands.length === 0) {
      return `**\`*help\`**: Display all available commands with descriptions
**\`*exit\`**: Exit agent mode and return to normal operation`;
    }
    
    return commands.map(cmd => {
      const description = this.getCommandDescription(cmd, agentContent);
      return `**\`*${cmd.name}\`**: ${description}`;
    }).join('\n');
  }

  generateDependenciesStructured(metadata) {
    const deps = metadata.dependencies || {};
    const depTypes = Object.keys(deps).filter(key => deps[key] && deps[key].length > 0);
    
    if (depTypes.length === 0) {
      return `**Resource Types:** tasks, templates, checklists, data
**Loading Rule:** Access resources only when executing specific workflows`;
    }
    
    const resourceList = depTypes.map(type => 
      `**${type}**: ${deps[type].map(item => `\`${item}\``).join(', ')}`
    ).join('\n');
    
    return `${resourceList}\n\n**Loading Rule:** Access resources only when executing specific workflows`;
  }

  generateFileResolutionSimplified(metadata) {
    return `Dependencies map to .orchestrix-core/{type}/{name} where {type} is the folder (tasks, templates, checklists, etc.) and {name} is the filename
**Example:** create-doc.md → .orchestrix-core/tasks/create-doc.md
**Rule:** Load files only when executing specific commands that require them`;
  }

  generateRequestResolutionExamples(metadata, agentContent) {
    const agentId = metadata.agent.id || metadata.name || 'agent';
    return `**Pattern Matching:** Map user requests to available commands and dependencies
**Examples:**
- "help me get started" → *help command
- "create something" → *create command + relevant task dependencies
- "validate this" → *validate command + checklist dependencies

**Clarification Rule:** Ask for specific details when user requests are ambiguous or could match multiple workflows`;
  }

  async setupClaudeCodeSubagents(installDir, selectedAgent) {
    const subagentsDir = path.join(installDir, ".claude", "agents");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(subagentsDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const subagentPath = path.join(subagentsDir, `${agentId}.md`);
        
        const subagentContent = await this.generateSubagentContent(agentId, agentContent, installDir);
        
        await fileManager.writeFile(subagentPath, subagentContent);
        // Removed individual subagent creation messages for cleaner output
      }
    }

    // Return count instead of displaying message here
    return agents.length;
  }

  // 在 ide-setup.js 中添加新方法

  async setupClaudeCodeSubagentsEnhanced(installDir, selectedAgent) {
    const subagentsDir = path.join(installDir, ".claude", "agents");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);
    
    await fileManager.ensureDirectory(subagentsDir);
    
    for (const agentId of agents) {
      const agentPath = await this.findAgentPath(agentId, installDir);
      
      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const subagentPath = path.join(subagentsDir, `${agentId}.md`);
        
        // 使用增强的模板系统
        const subagentContent = await this.generateEnhancedSubagentContent(agentId, agentContent, installDir);
        
        await fileManager.writeFile(subagentPath, subagentContent);
      }
    }
    
    return agents.length;
  }

  async generateEnhancedSubagentContent(agentId, agentContent, installDir) {
    const templatePath = path.join(__dirname, '..', 'templates', 'orchestrix-subagent-template.md');
    
    try {
      const template = await fileManager.readFile(templatePath);
      const metadata = this.extractCompleteAgentMetadata(agentContent, agentId);
      
      // 生成所有占位符的值
      const replacements = await this.generateAllReplacements(agentId, metadata, agentContent);
      
      // 替换模板中的占位符
      let content = template;
      for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        content = content.replace(regex, value || '');
      }
      
      return content;
      
    } catch (error) {
      console.warn(`Failed to use enhanced template for ${agentId}, falling back to original method`);
      return this.generateSubagentContent(agentId, agentContent, installDir);
    }
  }

  // 增强的metadata提取，确保捕获所有信息
  extractCompleteAgentMetadata(agentContent, agentId) {
    const metadata = this.extractAgentMetadata(agentContent); // 使用现有方法
    
    // 增强提取额外的关键信息
    const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      
      // 提取 customization 字段
      const customizationMatch = yamlContent.match(/customization:\s*(.+)/);
      if (customizationMatch) {
        metadata.customization = customizationMatch[1].trim();
      }
      
      // 提取完整的 tools 列表
      const toolsMatch = yamlContent.match(/tools:\s*(.+)/);
      if (toolsMatch) {
        metadata.tools = toolsMatch[1].split(',').map(t => t.trim());
      }
      
      // 提取特定agent的约束（如dev的test integrity rules）
      if (agentId === 'dev') {
        const testRulesMatch = yamlContent.match(/test-integrity-rules:\s*([\s\S]*?)(?=\n\s{4}\w|$)/);
        if (testRulesMatch) {
          metadata.testIntegrityRules = this.parseListSection(testRulesMatch[1]);
        }
      }
      
      // 提取特定agent的权限（如QA的story-file-permissions）
      if (agentId === 'qa') {
        const storyPermMatch = yamlContent.match(/story-file-permissions:\s*([\s\S]*?)(?=\ncommands:|$)/);
        if (storyPermMatch) {
          metadata.storyFilePermissions = this.parseListSection(storyPermMatch[1]);
        }
      }
    }
    
    return metadata;
  }

// ============= 辅助方法集合 =============

// 提取主要使用场景
extractPrimaryUseCases(metadata) {
  const whenToUse = metadata.agent?.whenToUse || '';
  // 移除开头的 "Use for" 避免重复
  return whenToUse.replace(/^Use for /i, '').trim();
}

// 提取强制触发条件
extractMandatoryTriggers(metadata, agentId) {
  const triggers = {
    'dev': 'implementing any approved story or development task',
    'sm': 'creating new stories from sharded PRD/architecture docs',
    'qa': 'reviewing code quality and performing testing',
    'architect': 'technical review of stories or architecture design',
    'pm': 'creating or updating product requirements documentation',
    'po': 'validating project artifacts and managing backlog',
    'analyst': 'market research, analysis, or documenting existing projects',
    'ux-expert': 'UI/UX design, specifications, or prototyping',
    'orchestrix-master': 'comprehensive project work requiring all capabilities',
    'orchestrix-orchestrator': 'coordinating multiple agents for complex workflows'
  };
  return triggers[agentId] || 'executing specialized workflows';
}

// 获取完整的工具列表
getCompleteToolsList(metadata, agentId) {
  // 先尝试从metadata中获取
  if (metadata.agent?.tools) {
    return metadata.agent.tools;
  }
  
  // 如果metadata中有tools数组
  if (metadata.tools && Array.isArray(metadata.tools)) {
    return metadata.tools.join(', ');
  }
  
  // 使用预定义的工具映射
  const toolsMap = {
    'dev': 'Read, Edit, MultiEdit, Write, Bash, WebSearch',
    'qa': 'Read, Edit, MultiEdit, Write, Bash',
    'sm': 'Read, Edit, MultiEdit, Write',
    'po': 'Read, Edit, Write, Bash, WebSearch',
    'architect': 'Read, Edit, Write, Bash, WebSearch',
    'analyst': 'Read, Write, WebSearch',
    'pm': 'Read, Write, WebSearch',
    'ux-expert': 'Read, Write, WebSearch',
    'orchestrix-master': 'Read, Edit, MultiEdit, Write, Bash, WebSearch',
    'orchestrix-orchestrator': 'Read, Edit, MultiEdit, Write, Bash, WebSearch'
  };
  
  return toolsMap[agentId] || 'Read, Write';
}

// 格式化启动步骤
formatStartupSteps(metadata, agentId) {
  const agentSpecificSteps = {
    'dev': `3. Load any active story in \`docs/stories/\` directory (check status != "Done")
4. Check \`.orchestrix-core/core-config.yaml\` for \`devLoadAlwaysFiles\` if present
5. Verify project structure matches Orchestrix standards`,
    
    'sm': `3. Look for sharded docs in \`docs/prd/\` and \`docs/architecture/\`
4. Check \`docs/stories/\` for existing stories to understand naming/numbering
5. Identify the next story to create based on epic files`,
    
    'qa': `3. Check for stories in review status in \`docs/stories/\`
4. Load technical preferences if available
5. Prepare for code quality review and refactoring`,
    
    'architect': `3. Check for architecture documentation in \`docs/architecture/\`
4. Load technical standards and patterns
5. Prepare for technical review or design work`,
    
    'pm': `3. Check for existing PRD in \`docs/prd.md\` or sharded in \`docs/prd/\`
4. Load project brief if available
5. Prepare for requirements documentation`,
    
    'analyst': `3. Check for existing project documentation
4. Prepare for analysis or research tasks
5. Load any existing project brief`,
    
    'po': `3. Check for all project artifacts (PRD, architecture, stories)
4. Load validation checklists
5. Prepare for cross-document validation`,
    
    'ux-expert': `3. Check for UI/UX specifications in docs
4. Load design system if available
5. Prepare for design work`,
    
    'orchestrix-master': `3. Load comprehensive project context
4. Check all available resources
5. Prepare for multi-domain work`,
    
    'orchestrix-orchestrator': `3. Identify available agents and their states
4. Load project workflow definitions
5. Prepare for multi-agent coordination`
  };
  
  return agentSpecificSteps[agentId] || '3. Load relevant project context\n4. Prepare for task execution';
}

// 格式化核心原则
formatCorePrinciples(metadata) {
  const principles = metadata.core_principles || metadata.persona?.core_principles || [];
  
  if (principles.length === 0) {
    return '- Follow Orchestrix workflows precisely\n- Maintain quality standards\n- Execute commands with precision';
  }
  
  // 格式化原则，确保每个都是列表项
  return principles.map(p => {
    // 清理原则文本
    let cleaned = p.trim();
    // 移除已有的列表标记
    cleaned = cleaned.replace(/^-\s*/, '');
    // 移除引号
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    return `- ${cleaned}`;
  }).join('\n');
}

// 生成约束部分
generateConstraintsSection(metadata, agentId) {
  // 从核心原则中提取约束
  const principles = metadata.core_principles || metadata.persona?.core_principles || [];
  const constraints = principles.filter(p => 
    p.includes('NOT') || p.includes('NEVER') || p.includes('ONLY') || 
    p.includes('MUST') || p.includes('MANDATORY') || p.includes('CRITICAL')
  );
  
  // Agent特定的约束
  const agentSpecificConstraints = {
    'dev': [
      'NEVER modify test expectations to make tests pass - fix implementation instead',
      'ONLY update authorized sections of story files',
      'Do NOT begin development until story is approved and you are told to proceed'
    ],
    'sm': [
      'You are NOT allowed to implement stories or modify code EVER!',
      'Stories MUST achieve >80% technical extraction completion rate',
      'MANDATORY: Execute sm-technical-extraction-checklist during story creation'
    ],
    'qa': [
      'ONLY update QA Results section of story files',
      'NEVER modify other story sections',
      'Focus on code quality and refactoring, not just finding issues'
    ],
    'architect': [
      'MUST maintain architectural consistency across all designs',
      'NEVER approve stories that violate established patterns',
      'CRITICAL: All technical reviews must be thorough'
    ],
    'pm': [
      'MUST align all requirements with business objectives',
      'NEVER include implementation details in requirements',
      'CRITICAL: All user stories must be testable'
    ],
    'po': [
      'MUST validate cross-document consistency',
      'NEVER approve incomplete artifacts',
      'CRITICAL: Quality gates must be enforced'
    ]
  };
  
  const specificConstraints = agentSpecificConstraints[agentId] || [];
  const allConstraints = [...new Set([...constraints, ...specificConstraints])]; // 去重
  
  if (allConstraints.length === 0) return '';
  
  return `\n**CRITICAL CONSTRAINTS**:\n${allConstraints.map(c => `- ${c}`).join('\n')}`;
}

// 格式化命令及描述
formatCommandsWithDescriptions(metadata, agentContent) {
  const commands = metadata.commands || [];
  
  if (commands.length === 0) {
    return '- `help` → Show available commands\n- `exit` → Exit agent mode';
  }
  
  return commands.map(cmd => {
    let description = cmd.description;
    
    // 如果没有描述，尝试从agent内容中提取更详细的描述
    if (!description || description.trim() === '') {
      description = this.getCommandDescription(cmd, agentContent);
    }
    
    return `- \`${cmd.name}\` → ${description}`;
  }).join('\n');
}

// 生成复杂命令部分
generateComplexCommandsSection(metadata, agentId, agentContent) {
  let section = '';
  
  // Dev agent 的 develop-story 命令
  if (agentId === 'dev') {
    const developStoryMatch = agentContent.match(/develop-story:[\s\S]*?(?=\n\s{0,2}\w|\ndependencies:|$)/);
    if (developStoryMatch) {
      section += '\n### Detailed Command Specifications\n\n';
      section += '**develop-story command**:\n';
      section += this.formatDevelopStoryCommand(developStoryMatch[0]);
    }
  }
  
  // SM agent 的 draft 命令细节
  if (agentId === 'sm') {
    if (metadata.commands?.find(c => c.name === 'draft')) {
      section += '\n### Story Creation Command Details\n\n';
      section += '**draft command**: Executes create-next-story task with mandatory technical extraction\n';
      section += '- Loads epic and architecture documents\n';
      section += '- Generates comprehensive story with all technical details\n';
      section += '- Validates with sm-technical-extraction-checklist (must achieve >80%)\n';
    }
  }
  
  return section;
}

// 格式化 develop-story 命令
formatDevelopStoryCommand(commandText) {
  const lines = commandText.split('\n');
  let formatted = '';
  let inSubSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('- ') && line.indexOf('-') < 4) { // 主要项
      const content = trimmed.substring(2);
      
      if (content.includes(':')) {
        const [key, value] = content.split(':').map(s => s.trim());
        
        // 特殊处理某些关键部分
        if (key === 'order-of-execution') {
          formatted += '\n**Order of Execution**:\n```\n' + value + '\n```\n';
        } else if (key === 'story-file-updates-ONLY') {
          formatted += '\n**Story File Update Rules**:\n';
          inSubSection = true;
        } else if (key === 'test-integrity-rules') {
          formatted += '\n**Test Integrity Rules**:\n';
          inSubSection = true;
        } else if (key === 'blocking') {
          formatted += '\n**Blocking Conditions**: ' + value + '\n';
        } else if (key === 'ready-for-review') {
          formatted += '\n**Ready for Review Criteria**: ' + value + '\n';
        } else if (key === 'completion') {
          formatted += '\n**Completion Sequence**: ' + value + '\n';
        } else {
          formatted += `- **${key}**: ${value}\n`;
        }
      } else {
        formatted += `- ${content}\n`;
      }
    } else if (inSubSection && trimmed.startsWith('- ')) {
      // 子项
      formatted += `  ${trimmed}\n`;
    }
  }
  
  return formatted;
}

// 生成工作流部分
generateWorkflowSections(metadata, agentId, agentContent) {
  const sections = [];
  
  // 基于agent ID生成特定的工作流
  const workflowGenerators = {
    'dev': () => this.generateDevWorkflow(metadata),
    'sm': () => this.generateSmWorkflow(metadata),
    'qa': () => this.generateQaWorkflow(metadata),
    'architect': () => this.generateArchitectWorkflow(metadata),
    'pm': () => this.generatePmWorkflow(metadata),
    'po': () => this.generatePoWorkflow(metadata),
    'analyst': () => this.generateAnalystWorkflow(metadata),
    'ux-expert': () => this.generateUxWorkflow(metadata),
    'orchestrix-master': () => this.generateMasterWorkflow(metadata),
    'orchestrix-orchestrator': () => this.generateOrchestratorWorkflow(metadata)
  };
  
  const generator = workflowGenerators[agentId];
  if (generator) {
    sections.push(generator());
  }
  
  // 添加通用工作流（如果有create-doc命令）
  if (metadata.commands?.find(c => c.name === 'create-doc')) {
    sections.push(this.generateCreateDocWorkflow(metadata));
  }
  
  return sections.filter(s => s).join('\n\n');
}

// 各种工作流生成方法
generateDevWorkflow(metadata) {
  return `### Story Implementation Workflow

**Trigger Patterns**:
- "implement this story"
- "develop the story"
- "*develop-story"
- "start implementation"
- "code this requirement"

**Execution Sequence**:
\`\`\`
1. Read first/next task from story
2. Implement task and all subtasks
3. Write comprehensive tests
4. Execute validations (lint + test)
5. If ALL pass → Update task checkbox [x]
6. Update story File List with changes
7. Repeat for all tasks
8. Run execute-checklist with story-dod-checklist.md
9. Set status to "Ready for Review"
10. HALT - implementation complete
\`\`\`

**Quality Gates**:
- All validations must pass before marking task complete
- story-dod-checklist must pass before Ready for Review
- File List must be complete and accurate
- No test modifications without business justification

**Blocking Conditions**:
- Unapproved dependencies needed
- Ambiguous requirements after checking story
- 3+ failures on same implementation
- Missing critical configuration
- Failing regression tests
- Need to modify test requirements`;
}

generateSmWorkflow(metadata) {
  return `### Story Creation Workflow

**Trigger Patterns**:
- "create next story"
- "draft new story"
- "*create"
- "*draft"
- "generate user story"

**Execution Sequence**:
\`\`\`
1. Load next epic from docs/prd/epic-*.md
2. Load relevant architecture sections
3. Execute create-next-story.md task
4. Generate story using story-tmpl.yaml
5. Extract ALL technical details from architecture
6. Run sm-technical-extraction-checklist
7. Verify >80% completion rate
8. If pass → Save to docs/stories/
9. If fail → Enhance technical details and retry
\`\`\`

**Quality Gates**:
- Technical extraction completion ≥80%
- All required sections populated
- Acceptance criteria clear and testable
- Dev Notes comprehensive with technical details

**Blocking Conditions**:
- Missing epic files
- Cannot find architecture docs
- Technical extraction <80%
- Ambiguous requirements`;
}

generateQaWorkflow(metadata) {
  return `### Comprehensive QA Validation Workflow

**Trigger Patterns**:
- "review this story"
- "check code quality"
- "*review"
- "qa review"
- "validate compilation"
- "test containers"
- "run functional tests"
- "integration testing"

**Execution Sequence**:
\`\`\`
1. Load story file to review
2. Validate compilation and build processes
3. Test container builds and runtime (if applicable)
4. Check implementation against requirements
5. Review code quality and architecture patterns
6. Execute functional and integration tests
7. Perform refactoring and improvements
8. Update QA Results section with comprehensive findings
9. Update story status based on validation results
10. Provide detailed recommendations
\`\`\`

**Review Focus**:
- Code quality and maintainability
- Test coverage and effectiveness
- Performance implications
- Security considerations
- Architecture compliance
- Compilation and build validation
- Container and deployment testing
- Functional and end-to-end testing
- Integration and system testing`;
}

generateArchitectWorkflow(metadata) {
  return `### Technical Review Workflow

**Trigger Patterns**:
- "review story technical accuracy"
- "validate architecture"
- "*review-story"
- "technical review"

**Execution Sequence**:
\`\`\`
1. Load story and architecture docs
2. Verify technical accuracy
3. Check architectural alignment
4. Assess implementation feasibility
5. Validate dependencies
6. Provide approval or feedback
\`\`\`

**Review Criteria**:
- Technical accuracy score ≥7/10
- Zero critical technical issues
- Complete architecture alignment`;
}

generatePmWorkflow(metadata) {
  return `### PRD Creation Workflow

**Trigger Patterns**:
- "create PRD"
- "*create-doc prd"
- "document requirements"

**Execution Sequence**:
\`\`\`
1. Load project brief if available
2. Execute create-doc with prd-tmpl
3. Gather requirements through elicitation
4. Define epics and user stories
5. Specify acceptance criteria
6. Save to docs/prd.md
\`\`\``;
}

generatePoWorkflow(metadata) {
  return `### Validation Workflow

**Trigger Patterns**:
- "validate artifacts"
- "check consistency"
- "*execute-checklist po-master-checklist"

**Execution Sequence**:
\`\`\`
1. Load all project artifacts
2. Execute po-master-checklist
3. Verify cross-document consistency
4. Check quality gates
5. Provide validation report
\`\`\``;
}

generateAnalystWorkflow(metadata) {
  return `### Analysis Workflow

**Trigger Patterns**:
- "analyze project"
- "document existing system"
- "*document-project"

**Execution Sequence**:
\`\`\`
1. Analyze project structure
2. Document architecture
3. Extract technical details
4. Generate comprehensive documentation
\`\`\``;
}

generateUxWorkflow(metadata) {
  return `### Design Workflow

**Trigger Patterns**:
- "create UI spec"
- "design interface"
- "*create-doc front-end-spec"

**Execution Sequence**:
\`\`\`
1. Review requirements
2. Create UI/UX specifications
3. Design components
4. Document patterns
5. Save specifications
\`\`\``;
}

generateMasterWorkflow(metadata) {
  return `### Comprehensive Project Workflow

**Trigger Patterns**:
- "complete project setup"
- "full project implementation"
- "*orchestrate-project"

**Execution Sequence**:
\`\`\`
1. Analyze project requirements
2. Coordinate all agent activities
3. Execute comprehensive workflows
4. Ensure quality across all deliverables
5. Validate project completion
\`\`\``;
}

generateOrchestratorWorkflow(metadata) {
  return `### Multi-Agent Coordination Workflow

**Trigger Patterns**:
- "coordinate agents"
- "orchestrate workflow"
- "*coordinate-team"

**Execution Sequence**:
\`\`\`
1. Assess project scope
2. Assign tasks to appropriate agents
3. Monitor progress across agents
4. Coordinate handoffs between agents
5. Ensure workflow completion
\`\`\``;
}

generateCreateDocWorkflow(metadata) {
  return `### Document Creation Workflow

**Trigger**: \`*create-doc [template]\`

**Process**:
1. Show available templates if none specified
2. Load selected template
3. Execute advanced elicitation if needed
4. Generate document progressively
5. Save to appropriate location`;
}

// 格式化依赖映射
formatDependencyMapping(metadata) {
  const deps = metadata.dependencies || {};
  const sections = [];
  
  if (deps.tasks && deps.tasks.length > 0) {
    sections.push(`**Tasks**:\n${deps.tasks.map(t => `- \`${t}\` → \`.orchestrix-core/tasks/${t}\``).join('\n')}`);
  }
  
  if (deps.templates && deps.templates.length > 0) {
    sections.push(`**Templates**:\n${deps.templates.map(t => `- \`${t}\` → \`.orchestrix-core/templates/${t}\``).join('\n')}`);
  }
  
  if (deps.checklists && deps.checklists.length > 0) {
    sections.push(`**Checklists**:\n${deps.checklists.map(c => `- \`${c}\` → \`.orchestrix-core/checklists/${c}\``).join('\n')}`);
  }
  
  if (deps.data && deps.data.length > 0) {
    sections.push(`**Data**:\n${deps.data.map(d => `- \`${d}\` → \`.orchestrix-core/data/${d}\``).join('\n')}`);
  }
  
  if (sections.length === 0) {
    return '- Load dependencies as needed from `.orchestrix-core/` structure';
  }
  
  return sections.join('\n\n');
}

// 生成权限部分
generatePermissionsSection(metadata, agentId) {
  // 这个方法在之前的代码中已经定义了，这里保持原样
  let section = '\n## Permissions & Constraints\n\n';
  
  const allowedActions = {
    'dev': [
      'Read any project file',
      'Create/modify/delete source code files',
      'Execute bash commands for testing/validation',
      'Update specific story file sections (Dev Agent Record)',
      'Web search for technical solutions'
    ],
    'sm': [
      'Create new story files in docs/stories/',
      'Read from docs/prd/ and docs/architecture/',
      'Execute tasks and checklists',
      'Update story status fields'
    ],
    'qa': [
      'Read all project files',
      'Modify code for refactoring',
      'Execute tests and validations',
      'Update QA Results section in stories'
    ],
    'architect': [
      'Read all project documentation',
      'Create/update architecture documents',
      'Review story technical accuracy',
      'Execute validation checklists'
    ],
    'pm': [
      'Create/update PRD documents',
      'Read project documentation',
      'Execute document creation tasks',
      'Web search for market research'
    ],
    'po': [
      'Read all project artifacts',
      'Execute validation checklists',
      'Update story priorities',
      'Manage backlog'
    ],
    'analyst': [
      'Read project files',
      'Create analysis documents',
      'Web search for research',
      'Document existing systems'
    ],
    'ux-expert': [
      'Create UI/UX specifications',
      'Read requirements documents',
      'Web search for design patterns',
      'Create design artifacts'
    ]
  };
  
  const forbiddenActions = {
    'dev': [
      'Modifying test expectations to make them pass',
      'Changing story requirements or acceptance criteria',
      'Starting work on Draft stories without approval',
      'Loading PRD/architecture unless explicitly directed'
    ],
    'sm': [
      'Writing or modifying code files',
      'Implementing story functionality',
      'Modifying PRD or architecture docs',
      'Changing acceptance criteria after approval'
    ],
    'qa': [
      'Modifying story sections outside QA Results',
      'Changing acceptance criteria',
      'Approving own code changes'
    ],
    'architect': [
      'Implementing code directly',
      'Modifying stories without review process',
      'Changing business requirements'
    ],
    'pm': [
      'Writing implementation code',
      'Making technical architecture decisions',
      'Modifying existing code'
    ],
    'po': [
      'Direct code implementation',
      'Modifying technical specifications',
      'Changing architectural decisions'
    ]
  };
  
  const allowed = allowedActions[agentId] || ['Execute assigned tasks'];
  const forbidden = forbiddenActions[agentId] || ['Actions outside assigned role'];
  
  section += `**ALLOWED ACTIONS**:\n${allowed.map(a => `- ${a}`).join('\n')}\n\n`;
  section += `**FORBIDDEN ACTIONS**:\n${forbidden.map(f => `- ${f}`).join('\n')}`;
  
  // 添加文件修改权限（特定agent）
  if (agentId === 'dev' || agentId === 'qa' || agentId === 'sm') {
    section += '\n\n**File Modification Rights**:\n';
    
    if (agentId === 'dev') {
      section += `Story file sections you MAY update:
- Tasks/Subtasks checkboxes \`[ ]\` → \`[x]\`
- Dev Agent Record section (all subsections)
- Status field (only when complete)

Sections you may NEVER modify:
- Story description
- Acceptance Criteria
- Dev Notes
- Testing requirements`;
    } else if (agentId === 'qa') {
      section += `- ONLY update QA Results section
- Append review findings and recommendations
- Never modify other story sections`;
    } else if (agentId === 'sm') {
      section += `- Create new story files in docs/stories/
- Set story status to "Draft"
- Update story metadata
- Never modify stories after approval`;
    }
  }
  
  return section;
}

// 生成质量标准部分（已在之前定义，这里完善）
generateQualitySection(metadata, agentId) {
  const qualitySections = {
    'dev': `\n## Quality Standards & Validation

**Test Integrity Rules**:
1. Tests represent business requirements - they are AUTHORITATIVE
2. NEVER modify existing test expectations/assertions
3. If tests fail → fix the IMPLEMENTATION, not the tests
4. Test modifications require explicit business justification and user approval
5. Document any test changes in Completion Notes

**Mandatory Validations**:
- All tests must pass before marking task complete
- Full regression test before Ready for Review
- story-dod-checklist validation required
- Linting checks must pass

**Success Criteria**:
- All tasks marked [x]
- All validations passing
- Code matches requirements
- File List complete and accurate
- Story status: "Ready for Review"`,

    'sm': `\n## Quality Standards & Validation

**Mandatory Validations**:
- sm-technical-extraction-checklist for EVERY story
- story-draft-checklist before marking as Draft
- Minimum 80% technical extraction score
- Quality score ≥7/10 for approval

**Success Criteria**:
- Story saved to docs/stories/
- Status set to "Draft"
- All technical details extracted from architecture
- Clear, testable acceptance criteria
- Comprehensive Dev Notes with implementation guidance`,

    'qa': `\n## Quality Standards & Validation

**Review Standards**:
- Code quality and maintainability
- Test coverage and effectiveness
- Performance implications
- Security considerations
- Architecture compliance
- Compilation and build validation
- Container and deployment testing
- Functional and end-to-end testing
- Integration and system testing

**Success Criteria**:
- Comprehensive validation completed across all test types
- QA Results section updated with detailed findings
- Refactoring and improvements implemented where needed
- Story status updated based on comprehensive validation results
- Clear recommendations provided for all identified issues`, 

    'architect': `\n## Quality Standards & Validation

**Review Standards**:
- Technical accuracy score ≥7/10
- Zero critical technical issues
- Complete architecture alignment
- Dependency validation
- Implementation feasibility

**Success Criteria**:
- Technical review completed
- Clear pass/fail decision
- Actionable feedback provided
- Architecture consistency maintained`,

    'pm': `\n## Quality Standards & Validation

**Document Standards**:
- Complete requirements coverage
- Clear acceptance criteria
- Testable user stories
- Business value articulated
- Stakeholder needs addressed

**Success Criteria**:
- PRD complete and validated
- All epics and stories defined
- Acceptance criteria measurable
- Document saved to docs/prd.md`,

    'po': `\n## Quality Standards & Validation

**Validation Standards**:
- Cross-document consistency
- Quality gate enforcement
- Complete artifact coverage
- Requirement traceability
- Risk assessment

**Success Criteria**:
- All artifacts validated
- po-master-checklist passed
- Consistency issues resolved
- Quality gates enforced`
  };
  
  return qualitySections[agentId] || '';
}

// 格式化上下文发现步骤
formatContextDiscoverySteps(metadata, agentId) {
  const contextSteps = {
    'dev': `1. Check \`docs/stories/\` for active stories (status != "Done")
2. Load specific story file user references
3. Check \`.orchestrix-core/core-config.yaml\` for project standards
4. Identify relevant source files from story context
5. Use grep/find for patterns rather than loading entire directories`,

    'sm': `1. Check \`docs/prd/\` for next epic to process
2. Identify last created story number in \`docs/stories/\`
3. Load relevant architecture sections based on epic
4. Verify all dependencies are accessible
5. Understand project technical standards from architecture`,

    'qa': `1. Check \`docs/stories/\` for stories in review status
2. Load the specific story to review
3. Identify implementation files from story's File List
4. Check test coverage and existing tests
5. Prepare for comprehensive code review`,

    'architect': `1. Check \`docs/architecture/\` for existing documentation
2. Load technical standards and patterns
3. Identify stories needing technical review
4. Understand project technology stack
5. Prepare for design or review work`,

    'pm': `1. Check for existing PRD in \`docs/\`
2. Load project brief if available
3. Review any existing requirements
4. Understand project scope and objectives
5. Prepare for requirements documentation`,

    'po': `1. Check all project artifacts (PRD, architecture, stories)
2. Load validation checklists
3. Identify any inconsistencies
4. Review quality gates
5. Prepare for validation work`,

    'analyst': `1. Analyze project structure
2. Check for existing documentation
3. Identify areas needing analysis
4. Load relevant project files
5. Prepare for research or documentation`,

    'ux-expert': `1. Check for existing UI/UX specifications
2. Load PRD for requirements
3. Review any design system docs
4. Understand user personas
5. Prepare for design work`
  };
  
  return contextSteps[agentId] || `1. Load relevant project context
2. Identify current task requirements
3. Check for existing artifacts
4. Verify dependencies available
5. Prepare for task execution`;
}

// 生成性能指南
generatePerformanceGuidelines(metadata) {
  return `- Load only files explicitly needed for current task
- Use specific search patterns vs reading entire directories
- Complete workflows before returning control
- Maintain efficiency to preserve main thread context
- Cache frequently accessed information in memory`;
}

// 生成结束提醒
generateClosingReminder(metadata, agentId) {
  const reminders = {
    'dev': 'You are an expert implementer. Follow story requirements exactly, maintain code quality, never compromise test integrity, and ensure all validations pass before marking complete.',
    'sm': 'You are the gatekeeper of story quality. Never compromise on technical extraction standards. The Dev agent depends on your thoroughness.',
    'qa': 'You are a senior developer conducting code review. Focus on quality, refactoring, and mentoring through your reviews.',
    'architect': 'You maintain technical excellence. Ensure all designs align with established patterns and all reviews maintain architectural integrity.',
    'pm': 'You bridge business and technology. Ensure all requirements are clear, testable, and aligned with business objectives.',
    'po': 'You ensure project coherence. Validate thoroughly and maintain quality gates without compromise.',
    'analyst': 'You provide insight through analysis. Be thorough, objective, and data-driven in all your work.',
    'ux-expert': 'You champion user experience. Create designs that are both beautiful and functional.',
    'orchestrix-master': 'You embody all Orchestrix capabilities. Use your comprehensive knowledge wisely.',
    'orchestrix-orchestrator': 'You coordinate the team. Ensure smooth handoffs and maintain workflow efficiency.'
  };
  
  return reminders[agentId] || 'Follow Orchestrix principles and maintain quality in all work.';
}

// 解析列表部分（辅助方法）
parseListSection(text) {
  if (!text) return [];
  
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.substring(2).trim())
    .filter(line => line.length > 0);
}

  // 生成所有占位符替换值
  async generateAllReplacements(agentId, metadata, agentContent) {
    return {
      '{AGENT_ID}': agentId,
      '{AGENT_TITLE}': metadata.agent?.title || agentId,
      '{AGENT_NAME}': metadata.agent?.name || agentId,
      '{AGENT_ROLE}': metadata.persona?.role || 'AI Assistant',
      '{PRIMARY_USE_CASES}': this.extractPrimaryUseCases(metadata),
      '{MANDATORY_TRIGGERS}': this.extractMandatoryTriggers(metadata, agentId),
      '{COMPLETE_TOOLS_LIST}': this.getCompleteToolsList(metadata, agentId),
      '{AGENT_SPECIFIC_STARTUP}': this.formatStartupSteps(metadata, agentId),
      '{AGENT_STYLE}': metadata.persona?.style || 'Professional',
      '{AGENT_IDENTITY}': metadata.persona?.identity || '',
      '{AGENT_FOCUS}': metadata.persona?.focus || '',
      '{CORE_PRINCIPLES_LIST}': this.formatCorePrinciples(metadata),
      '{CRITICAL_CONSTRAINTS_SECTION}': this.generateConstraintsSection(metadata, agentId),
      '{COMMANDS_WITH_DESCRIPTIONS}': this.formatCommandsWithDescriptions(metadata, agentContent),
      '{COMPLEX_COMMANDS_SECTION}': this.generateComplexCommandsSection(metadata, agentId, agentContent),
      '{WORKFLOW_SECTIONS}': this.generateWorkflowSections(metadata, agentId, agentContent),
      '{DEPENDENCY_MAPPING}': this.formatDependencyMapping(metadata),
      '{PERMISSIONS_SECTION}': this.generatePermissionsSection(metadata, agentId),
      '{QUALITY_SECTION}': this.generateQualitySection(metadata, agentId),
      '{CONTEXT_DISCOVERY_STEPS}': this.formatContextDiscoverySteps(metadata, agentId),
      '{PERFORMANCE_GUIDELINES}': this.generatePerformanceGuidelines(metadata),
      '{AGENT_CLOSING_REMINDER}': this.generateClosingReminder(metadata, agentId)
    };
  }

  // 格式化启动步骤
  formatStartupSteps(metadata, agentId) {
    const agentSpecificSteps = {
      'dev': `3. Load any active story in \`docs/stories/\` directory (check status != "Done")
4. Check \`.orchestrix-core/core-config.yaml\` for \`devLoadAlwaysFiles\` if present
5. Verify project structure matches Orchestrix standards`,
      
      'sm': `3. Look for sharded docs in \`docs/prd/\` and \`docs/architecture/\`
4. Check \`docs/stories/\` for existing stories to understand naming/numbering
5. Identify the next story to create based on epic files`,
      
      'qa': `3. Check for stories in review status in \`docs/stories/\`
4. Load technical preferences if available
5. Prepare for code quality review`,
      
      'architect': `3. Check for architecture documentation in \`docs/architecture/\`
4. Load technical standards and patterns
5. Prepare for technical review or design work`,
      
      'pm': `3. Check for existing PRD in \`docs/prd.md\` or sharded in \`docs/prd/\`
4. Load project brief if available
5. Prepare for requirements documentation`,
      
      'analyst': `3. Check for existing project documentation
4. Prepare for analysis or research tasks
5. Load any existing project brief`,
      
      'po': `3. Check for all project artifacts (PRD, architecture, stories)
4. Load validation checklists
5. Prepare for cross-document validation`,
      
      'ux-expert': `3. Check for UI/UX specifications in docs
4. Load design system if available
5. Prepare for design work`
    };
    
    return agentSpecificSteps[agentId] || '3. Load relevant project context';
  }

  // 生成约束部分
  generateConstraintsSection(metadata, agentId) {
    const constraints = metadata.core_principles?.filter(p => 
      p.includes('NOT') || p.includes('NEVER') || p.includes('ONLY') || p.includes('MUST')
    ) || [];
    
    // 添加agent特定的约束
    const agentSpecificConstraints = {
      'dev': [
        'NEVER modify test expectations to make tests pass - fix implementation instead',
        'ONLY update authorized sections of story files',
        'Do NOT begin development until story is approved'
      ],
      'sm': [
        'You are NOT allowed to implement stories or modify code EVER!',
        'Stories MUST achieve >80% technical extraction completion rate',
        'MANDATORY: Execute sm-technical-extraction-checklist during story creation'
      ],
      'qa': [
        'ONLY update QA Results section of story files',
        'NEVER modify other story sections',
        'Focus on code quality and refactoring, not just finding issues'
      ]
    };
    
    const specificConstraints = agentSpecificConstraints[agentId] || [];
    const allConstraints = [...constraints, ...specificConstraints];
    
    if (allConstraints.length === 0) return '';
    
    return `\n**CRITICAL CONSTRAINTS**:\n${allConstraints.map(c => `- ${c}`).join('\n')}`;
  }

  // 生成复杂命令部分（如dev的develop-story）
  generateComplexCommandsSection(metadata, agentId, agentContent) {
    if (agentId === 'dev') {
      // 提取develop-story的详细规范
      const developStoryMatch = agentContent.match(/develop-story:[\s\S]*?(?=\n\s{2}\w|\ndependencies:|$)/);
      if (developStoryMatch) {
        return `\n### Detailed Command Specifications\n\n**develop-story command**:\n${this.formatDevelopStoryCommand(developStoryMatch[0])}`;
      }
    }
    
    return '';
  }

  // 格式化develop-story命令
  formatDevelopStoryCommand(commandText) {
    const lines = commandText.split('\n').slice(1); // 跳过第一行
    let formatted = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        const content = trimmed.substring(2);
        if (content.includes(':')) {
          const [key, value] = content.split(':').map(s => s.trim());
          formatted += `\n**${key}**:\n${value}\n`;
        } else {
          formatted += `- ${content}\n`;
        }
      }
    }
    
    return formatted;
  }

  // 生成工作流部分


  // Dev agent工作流
  generateDevWorkflow(metadata) {
    return `### Story Implementation Workflow

**Trigger Patterns**:
- "implement this story"
- "develop the story"
- "*develop-story"
- "start implementation"

**Execution Sequence**:
\`\`\`
1. Read first/next task from story
2. Implement task and all subtasks
3. Write comprehensive tests
4. Execute validations (lint + test)
5. If ALL pass → Update task checkbox [x]
6. Update story File List with changes
7. Repeat for all tasks
8. Run execute-checklist with story-dod-checklist.md
9. Set status to "Ready for Review"
10. HALT - implementation complete
\`\`\`

**Quality Gates**:
- All validations must pass before marking task complete
- story-dod-checklist must pass before Ready for Review
- File List must be complete and accurate

**Blocking Conditions**:
- Unapproved dependencies needed
- Ambiguous requirements
- 3+ failures on same implementation
- Missing critical configuration
- Failing regression tests`;
  }

  // SM agent工作流
  generateSmWorkflow(metadata) {
    return `### Story Creation Workflow

**Trigger Patterns**:
- "create next story"
- "draft new story"
- "*create"
- "*draft"

**Execution Sequence**:
\`\`\`
1. Load next epic from docs/prd/epic-*.md
2. Load relevant architecture sections
3. Execute create-next-story.md task
4. Generate story using story-tmpl.yaml
5. Extract ALL technical details
6. Run sm-technical-extraction-checklist
7. Verify >80% completion rate
8. If pass → Save to docs/stories/
9. If fail → Enhance and retry
\`\`\`

**Quality Gates**:
- Technical extraction ≥80%
- All sections populated
- Acceptance criteria testable
- Dev Notes comprehensive

**Blocking Conditions**:
- Missing epic files
- Cannot find architecture docs
- Technical extraction <80%
- Ambiguous requirements`;
  }

  // 生成权限部分
  generatePermissionsSection(metadata, agentId) {
    let section = '\n## Permissions & Constraints\n\n';
    
    // 允许的操作
    const allowedActions = {
      'dev': [
        'Read any project file',
        'Create/modify/delete source code files',
        'Execute bash commands for testing',
        'Update specific story file sections',
        'Web search for technical solutions'
      ],
      'sm': [
        'Create new story files in docs/stories/',
        'Read from docs/prd/ and docs/architecture/',
        'Execute tasks and checklists',
        'Update story status fields'
      ],
      'qa': [
        'Read all project files',
        'Modify code for refactoring',
        'Execute tests and validations',
        'Update QA Results section in stories'
      ]
    };
    
    // 禁止的操作
    const forbiddenActions = {
      'dev': [
        'Modifying test expectations to pass',
        'Changing story requirements',
        'Starting work on Draft stories without approval',
        'Loading PRD/architecture unless directed'
      ],
      'sm': [
        'Writing or modifying code files',
        'Implementing story functionality',
        'Modifying PRD or architecture docs',
        'Changing acceptance criteria after approval'
      ],
      'qa': [
        'Modifying story sections outside QA Results',
        'Changing acceptance criteria',
        'Approving own code changes'
      ]
    };
    
    const allowed = allowedActions[agentId] || ['Execute assigned tasks'];
    const forbidden = forbiddenActions[agentId] || ['Actions outside assigned role'];
    
    section += `**ALLOWED ACTIONS**:\n${allowed.map(a => `- ${a}`).join('\n')}\n\n`;
    section += `**FORBIDDEN ACTIONS**:\n${forbidden.map(f => `- ${f}`).join('\n')}`;
    
    // 添加文件修改权限（如果适用）
    if (agentId === 'dev' || agentId === 'qa') {
      section += '\n\n**File Modification Rights**:\n';
      if (agentId === 'dev') {
        section += `Story file sections you MAY update:
  - Tasks/Subtasks checkboxes
  - Dev Agent Record section
  - Status field (when complete)

  Sections you may NEVER modify:
  - Story description
  - Acceptance Criteria
  - Testing requirements`;
      } else if (agentId === 'qa') {
        section += `- ONLY update QA Results section
  - Append review findings and recommendations
  - Never modify other story sections`;
      }
    }
    
    return section;
  }

  // 生成质量标准部分
  generateQualitySection(metadata, agentId) {
    if (agentId === 'dev') {
      return `\n## Quality Standards & Validation

  **Test Integrity Rules**:
  1. Tests represent requirements - they are AUTHORITATIVE
  2. NEVER modify existing test expectations
  3. If tests fail → fix the IMPLEMENTATION
  4. Test modifications require explicit justification
  5. Document any test changes in Completion Notes

  **Mandatory Validations**:
  - All tests must pass before marking task complete
  - Full regression test before Ready for Review
  - story-dod-checklist validation required
  - Linting checks must pass

  **Success Criteria**:
  - All tasks marked [x]
  - All validations passing
  - Code matches requirements
  - File List complete
  - Story status: "Ready for Review"`;
    }
    
    if (agentId === 'sm') {
      return `\n## Quality Standards & Validation

  **Mandatory Validations**:
  - sm-technical-extraction-checklist for EVERY story
  - story-draft-checklist before marking as Draft
  - Minimum 80% technical extraction score
  - Quality score ≥7/10 for approval

  **Success Criteria**:
  - Story saved to docs/stories/
  - Status set to "Draft"
  - All technical details extracted
  - Clear acceptance criteria
  - Comprehensive Dev Notes`;
    }
    
    if (agentId === 'qa') {
      return `\n## Quality Standards & Validation

  **Review Standards**:
  - Code quality and maintainability
  - Test coverage and effectiveness
  - Performance implications
  - Security considerations
  - Architecture compliance

  **Success Criteria**:
  - Comprehensive review completed
  - QA Results section updated
  - Refactoring implemented where needed
  - Story status updated appropriately`;
    }
    
    return '';
  }

  // 解析列表部分
  parseListSection(text) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- '))
      .map(line => line.substring(2).trim());
  }
  
  async generateSubagentContent(agentId, agentContent, installDir) {
    try {
      // Try to use the template system first
      const templateContent = await this.generateSubagentFromTemplate(agentId, agentContent, installDir);
      if (templateContent) {
        return templateContent;
      }
    } catch (error) {
      console.warn(`Template system failed for ${agentId}, falling back to direct generation: ${error.message}`);
    }

    // Fallback to direct generation if template fails
    // Extract agent metadata from original orchestrix-core agent
    const agentMetadata = this.extractAgentMetadata(agentContent);
    
    // Generate YAML frontmatter for Claude Code Subagent
    const yamlFrontmatter = this.generateSubagentYaml(agentId, agentMetadata);
    
    // Generate optimized markdown content for LLM consumption
    const markdownContent = this.generateOptimizedSubagentMarkdown(agentId, agentMetadata, agentContent);
    
    return `${yamlFrontmatter}\n${markdownContent}`;
  }

  extractAgentMetadata(agentContent) {
    const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
    const metadata = {
      agent: {},
      persona: {},
      name: 'Agent',
      title: 'AI Agent',
      role: 'Assistant',
      style: 'Professional',
      core_principles: [],
      activation_instructions: [],
      commands: [],
      dependencies: {},
      story_file_permissions: [],
      ideFileResolution: [],
      requestResolution: ''
    };

    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      
      // Extract agent section
      const agentMatch = yamlContent.match(/agent:\s*([\s\S]*?)(?=\n\w|$)/);
      if (agentMatch) {
        const agentSection = agentMatch[1];
        const nameMatch = agentSection.match(/name:\s*(.+)/);
        const titleMatch = agentSection.match(/title:\s*(.+)/);
        const whenToUseMatch = agentSection.match(/whenToUse:\s*(?:"([^"]+)"|'([^']+)'|([^\n\r]+))/);
        
        let whenToUseValue = null;
        if (whenToUseMatch) {
          // Handle quoted strings (with " or ')
          whenToUseValue = whenToUseMatch[1] || whenToUseMatch[2];
          // Handle unquoted strings (but trim trailing whitespace)
          if (!whenToUseValue) {
            whenToUseValue = whenToUseMatch[3]?.trim();
          }
        }
        
        if (nameMatch) metadata.agent.name = nameMatch[1].trim();
        if (titleMatch) metadata.agent.title = titleMatch[1].trim();
        if (whenToUseValue) metadata.agent.whenToUse = whenToUseValue;
      }
      
      // Extract persona section
      const personaMatch = yamlContent.match(/persona:\s*([\s\S]*?)(?=\n\w|$)/);
      if (personaMatch) {
        const personaSection = personaMatch[1];
        const roleMatch = personaSection.match(/role:\s*(.+)/);
        const styleMatch = personaSection.match(/style:\s*(.+)/);
        const identityMatch = personaSection.match(/identity:\s*(.+)/);
        const focusMatch = personaSection.match(/focus:\s*(.+)/);
        
        if (roleMatch) metadata.persona.role = roleMatch[1].trim();
        if (styleMatch) metadata.persona.style = styleMatch[1].trim();
        if (identityMatch) metadata.persona.identity = identityMatch[1].trim();
        if (focusMatch) metadata.persona.focus = focusMatch[1].trim();
        
        // Extract core principles from persona section
        const principlesMatch = personaSection.match(/core_principles:\s*([\s\S]*?)(?=\n\s{0,2}[a-zA-Z]|$)/);
        if (principlesMatch) {
          const principlesText = principlesMatch[1];
          const principles = principlesText.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2).trim().replace(/^["']|["']$/g, ''));
          metadata.persona.core_principles = principles;
        }
      }
      
      // Extract core principles at root level (some agents have it outside persona)
      const rootPrinciplesMatch = yamlContent.match(/(?:^|\n)core_principles:\s*([\s\S]*?)(?=\n[a-zA-Z]|$)/);
      if (rootPrinciplesMatch) {
        const principlesText = rootPrinciplesMatch[1];
        const principles = principlesText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim().replace(/^["']|["']$/g, ''));
        
        // If no principles in persona, use root level ones
        if (!metadata.persona.core_principles || metadata.persona.core_principles.length === 0) {
          metadata.persona.core_principles = principles;
        }
        // Also set at root level for backward compatibility
        metadata.core_principles = principles;
      }
      
      // Extract activation instructions - now structured with sub-sections
      const activationMatch = yamlContent.match(/activation-instructions:\s*([\s\S]*?)(?=\nagent:|$)/);
      if (activationMatch) {
        const activationText = activationMatch[1];
        const instructions = [];
        
        // Extract all bullet points from all sub-sections
        const lines = activationText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ')) {
            instructions.push(trimmed.substring(2).trim().replace(/^["']|["']$/g, ''));
          }
        }
        
        metadata.activation_instructions = instructions;
      }
      
      // Extract commands - only first level are actual commands
      const commandsMatch = yamlContent.match(/commands:\s*([\s\S]*?)(?=\ndependencies:|\n\w(?!\s)|$)/);
      if (commandsMatch) {
        const commandsText = commandsMatch[1];
        const commands = [];
        const lines = commandsText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          // Only process first-level commands: 
          // - Commands can be at root level (no indent) or first level indent (2 spaces)
          // - Skip lines with more indentation (4+ spaces - sub-configurations)
          if ((line.startsWith('- ') && !line.startsWith('  ')) || 
              (line.startsWith('  - ') && !line.startsWith('    '))) {
            const commandText = trimmedLine.substring(2).trim();
            const colonIndex = commandText.indexOf(':');
            
            if (colonIndex > 0) {
              const name = commandText.substring(0, colonIndex).trim();
              const description = commandText.substring(colonIndex + 1).trim();
              commands.push({ name, description });
            } else {
              // Command without description (like develop-story:)
              const commandName = commandText.replace(':', '').trim();
              commands.push({ name: commandName, description: '' });
            }
          }
          // Skip lines with 4+ spaces (sub-configurations) and other lines
        }
        metadata.commands = commands;
      }
      
      // Extract story-file-permissions (QA agent specific)
      const storyPermissionsMatch = yamlContent.match(/story-file-permissions:\s*([\s\S]*?)(?=\n\w|$)/);
      if (storyPermissionsMatch) {
        const permissionsText = storyPermissionsMatch[1];
        const permissions = permissionsText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim().replace(/^["']|["']$/g, ''));
        metadata.story_file_permissions = permissions;
      }
      
      // Extract IDE-FILE-RESOLUTION
      const ideFileResMatch = yamlContent.match(/IDE-FILE-RESOLUTION:\s*([\s\S]*?)(?=\nREQUEST-RESOLUTION:|\nactivation-instructions:|\nagent:|\n\w(?!\s)|$)/);
      if (ideFileResMatch) {
        const ideFileResText = ideFileResMatch[1];
        const ideFileRes = ideFileResText.split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim());
        metadata.ideFileResolution = ideFileRes;
      }

      // Extract REQUEST-RESOLUTION
      const requestResMatch = yamlContent.match(/REQUEST-RESOLUTION:\s*([\s\S]*?)(?=\nIDE-FILE-RESOLUTION:|\nactivation-instructions:|\nagent:|\n\w(?!\s)|$)/);
      if (requestResMatch) {
        const requestResText = requestResMatch[1].trim();
        metadata.requestResolution = requestResText;
      }

      // Extract dependencies
      const dependenciesMatch = yamlContent.match(/dependencies:\s*([\s\S]*?)(?=\n\w(?!\s)|$)/);
      if (dependenciesMatch) {
        const dependenciesText = dependenciesMatch[1];
        const deps = { tasks: [], templates: [], checklists: [], data: [], utils: [] };
        
        let currentSection = null;
        const depLines = dependenciesText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (const line of depLines) {
          if (line.endsWith(':')) {
            currentSection = line.replace(':', '');
          } else if (line.startsWith('- ') && currentSection && deps[currentSection]) {
            deps[currentSection].push(line.substring(2).trim());
          }
        }
        metadata.dependencies = deps;
      }
    }
    
    // Set fallback values
    metadata.name = metadata.agent.name || 'Agent';
    metadata.title = metadata.agent.title || 'AI Agent';
    metadata.role = metadata.persona.role || 'Assistant';
    metadata.style = metadata.persona.style || 'Professional';
    metadata.core_principles = metadata.persona.core_principles || [];
    
    return metadata;
  }

  generateSubagentYaml(agentId, metadata) {
    const name = agentId; // Use agent ID as subagent name per Claude Code specs
    const description = metadata.agent?.whenToUse || `Orchestrix ${metadata.title || agentId} agent specializing in ${metadata.title?.toLowerCase() || 'assistance'}.`;
    
    // Get available tools for this agent
    const tools = this.getAgentPermissions(agentId);
    
    // Build YAML frontmatter according to official Claude Code format
    let yaml = `---\nname: ${name}\ndescription: ${description}`;
    
    // Add tools if specified (optional field)
    if (tools && tools.length > 0) {
      yaml += `\ntools: ${tools.join(', ')}`;
    }
    
    yaml += '\n---';
    return yaml;
  }

  getOptimalModelForAgent(agentId) {
    // Model selection based on workflow quality gates and actual responsibilities
    const modelMap = {
      // Tier 1: Ultimate capability - Critical decision makers and quality gatekeepers
      'orchestrix-master': 'claude-opus-4-1-20250805',      // 终极决策者 - 最强能力
      'orchestrix-orchestrator': 'claude-sonnet-4-20250514',   // 复杂编排协调 
      'qa': 'claude-opus-4-1-20250805',                     // 质量守门员 - 需要超越Dev的能力发现问题
      
      // Tier 2: High capability - Core workflow drivers
      'architect': 'claude-opus-4-20250514',                // 系统架构决策 - 升级到Opus
      'analyst': 'claude-sonnet-4-20250514',                // 战略分析和研究
      'sm': 'claude-opus-4-20250514',                       // Story质量是开发成功的关键 - 升级到Opus
      
      // Tier 3: Professional execution - Implementation focused
      'dev': 'claude-opus-4-1-20250805',                    // 开发执行 
      'pm': 'claude-sonnet-4-20250514',                     // 产品战略需要高水平思考
      
      // Tier 4: Efficient execution - Structured tasks
      'po': 'claude-opus-4-1-20250805',                  // 需求整理和管理
      'ux-expert': 'claude-3-7-sonnet-20250219'            // UI/UX设计建议
    };
    
    return modelMap[agentId] || 'claude-sonnet-4-20250514';
  }

  getAgentColor(agentId) {
    // Professional color scheme based on role categories and color psychology
    const colorMap = {
      // Management Tier (Purple family) - Authority, wisdom, coordination
      'orchestrix-master': '#6b21a8',          // Deep Purple - Ultimate authority
      'orchestrix-orchestrator': '#7c3aed',     // Royal Purple - Orchestration power
      'pm': '#8b5cf6',                         // Medium Purple - Strategic management
      
      // Technical Tier (Blue family) - Trust, reliability, expertise
      'architect': '#1e40af',                   // Deep Blue - Architectural stability
      'dev': '#0891b2',                        // Cyan Blue - Development innovation
      'qa': '#0f766e',                         // Teal Blue - Quality assurance
      
      // Analysis Tier (Green family) - Growth, insight, research
      'analyst': '#059669',                     // Emerald Green - Strategic insights
      
      // Product Tier (Warm family) - Energy, creativity, user focus
      'po': '#ea580c',                         // Orange - Product energy
      'ux-expert': '#e11d48',                  // Rose - Creative user focus
      
      // Process Tier (Neutral family) - Organization, methodology
      'sm': '#475569'                          // Slate Gray - Process structure
    };
    
    return colorMap[agentId] || '#6366f1';
  }

  getAgentPermissions(agentId) {
    // Map to actual Claude Code tool names from the official interface
    const permissionMap = {
      // Full access for orchestration and architecture
      'orchestrix-master': ['Read', 'Edit', 'Write', 'Bash', 'WebSearch'],
      'orchestrix-orchestrator': ['Read', 'Edit', 'Write', 'Bash', 'WebSearch'],
      'architect': ['Read', 'Edit', 'Write', 'Bash', 'WebSearch'],
      
      // Development-focused permissions - dev agent needs comprehensive tools
      'dev': ['Read', 'Edit', 'MultiEdit', 'Write', 'Bash', 'WebSearch'],
      'qa': ['Read', 'Edit', 'Write', 'Bash'],
      
      // Research and analysis focused
      'analyst': ['Read', 'Write', 'WebSearch'],
      'pm': ['Read', 'Write', 'WebSearch'],
      
      // Document-focused permissions
      'po': ['Read', 'Edit', 'Write', 'Bash', 'WebSearch'],
      'sm': ['Read', 'Write'],
      'ux-expert': ['Read', 'Write', 'WebSearch']
    };
    
    return permissionMap[agentId] || ['Read', 'Write', 'WebSearch'];
  }


  getContextWindowSize(model) {
    // Context window based on official specifications
    if (model.includes('opus-4-1')) return 200000;        // Opus 4.1 - 200K上下文
    if (model.includes('opus-4')) return 200000;          // Opus 4 - 200K上下文  
    if (model.includes('sonnet-4')) return 200000;        // Sonnet 4 - 200K上下文
    if (model.includes('3-7-sonnet')) return 200000;      // Sonnet 3.7 - 200K上下文
    return 200000;  // 默认200K，符合最新模型标准
  }

  getCostTier(model) {
    // Cost tiers based on model complexity and workflow criticality
    if (model.includes('opus-4-1')) return 'ultra-premium';  // 质量守门员和终极决策者
    if (model.includes('opus-4')) return 'premium';          // 关键工作流驱动者  
    if (model.includes('sonnet-4')) return 'high-standard';  // 专业分析和架构
    if (model.includes('3-7-sonnet')) return 'standard';     // 执行层任务
    return 'standard';
  }

  generateSubagentMarkdown(agentId, metadata) {
    let content = `# Orchestrix ${metadata.title || agentId} Agent\n\n`;
    
    // Add agent introduction
    if (metadata.name && metadata.role) {
      content += `You are ${metadata.name}, a specialized AI Agent from the Orchestrix framework. You are ${metadata.role.toLowerCase().startsWith('a ') ? metadata.role.toLowerCase() : 'a ' + metadata.role.toLowerCase()}.`;
      
      if (metadata.style) {
        content += ` Your style is ${metadata.style.toLowerCase()}.`;
      }
      content += '\n\n';
    }
    
    if (metadata.persona?.identity) {
      content += `**Identity:** ${metadata.persona.identity}\n\n`;
    }
    
    if (metadata.persona?.focus) {
      content += `**Focus:** ${metadata.persona.focus}\n\n`;
    }
    
    // Add core principles
    if (metadata.core_principles && metadata.core_principles.length > 0) {
      content += '**Core Principles:**\n';
      for (const principle of metadata.core_principles) {
        content += `- ${principle}\n`;
      }
      content += '\n';
    }
    
    // Add Orchestrix-specific activation instructions
    content += `## Orchestrix Integration\n\n`;
    content += `This subagent integrates the Orchestrix ${agentId} agent persona. When activated, follow all core principles and maintain the agent's specialized focus area.\n\n`;
    
    // Add usage notes
    const model = this.getOptimalModelForAgent(agentId);
    const permissions = this.getAgentPermissions(agentId);
    
    content += `**Configuration Notes:**\n`;
    content += `- Recommended Model: ${model}\n`;
    content += `- Available Tools: ${permissions.join(', ')}\n`;
    content += `- Specialization: ${this.getAgentOptimization(agentId)}\n\n`;
    
    return content;
  }

  generateOptimizedSubagentMarkdown(agentId, metadata, agentContent) {
    // Generate highly optimized LLM-focused subagent content with clear hierarchical structure
    let content = `# ${metadata.agent.title || metadata.title || agentId}\n\n`;
    
    // Single unified activation protocol (eliminates redundancy)
    content += `## AGENT ACTIVATION PROTOCOL\n\n`;
    content += `**CRITICAL INSTRUCTION:** You are now **${metadata.agent.name || agentId}**, ${(metadata.persona.role || 'AI Agent').toLowerCase()} from the Orchestrix framework. Adopt this complete persona immediately and execute all instructions below`;
    if (metadata.persona.style) {
      content += ` with ${metadata.persona.style.toLowerCase()} approach`;
    }
    content += `. Stay in this mode until explicitly told to exit.\n\n`;
    
    // Consolidated core identity block (eliminates scattered info)
    content += `**CORE IDENTITY:**\n`;
    if (metadata.persona.identity) {
      content += `- Role: ${metadata.persona.identity}\n`;
    }
    if (metadata.persona.focus) {
      content += `- Focus: ${metadata.persona.focus}\n`;
    }
    if ((metadata.persona.core_principles && metadata.persona.core_principles.length > 0) || 
        (metadata.core_principles && metadata.core_principles.length > 0)) {
      const principles = metadata.persona.core_principles || metadata.core_principles;
      content += `- Behavior: ${principles.slice(0, 2).join('; ')}\n`;
    }
    content += '\n';
    
    // Hierarchical operational parameters (clear priority structure)
    content += `## OPERATIONAL PARAMETERS\n\n`;
    
    // Startup sequence (prioritized actions)
    const sections = this.parseStructuredActivationInstructions(this.extractActivationSection(agentContent));
    if (sections.length > 0) {
      content += `### Startup Sequence\n`;
      for (const section of sections) {
        content += `**${section.title}:**\n`;
        for (const item of section.items) {
          content += `- ${item}\n`;
        }
        content += '\n';
      }
    }
    
    // Complete behavioral rules (all principles together)
    if (metadata.core_principles && metadata.core_principles.length > 0) {
      content += `### Critical Behavioral Rules\n`;
      for (const principle of metadata.core_principles) {
        content += `- ${principle}\n`;
      }
      content += '\n';
    }
    
    // Enhanced command interface (complete specifications)
    if (metadata.commands && metadata.commands.length > 0) {
      content += `## COMMAND INTERFACE\n\n`;
      content += `**Command Syntax:** All commands require \`*\` prefix\n\n`;
      for (const command of metadata.commands) {
        const desc = this.getCommandDescription(command, agentContent);
        content += `- **\`*${command.name}\`**: ${desc}\n`;
      }
      content += '\n';
    }
    
    // Streamlined workflow dependencies (resource map format)
    if (metadata.dependencies && Object.keys(metadata.dependencies).length > 0) {
      content += `## WORKFLOW DEPENDENCIES\n\n`;
      content += `**Resource Map:**\n`;
      
      const depTypes = Object.keys(metadata.dependencies).filter(key => 
        metadata.dependencies[key] && metadata.dependencies[key].length > 0
      );
      
      for (const depType of depTypes) {
        const items = metadata.dependencies[depType];
        content += `- **${depType}**: `;
        content += items.map(item => `\`${item}\``).join(', ');
        content += '\n';
      }
      content += '\n**Usage Rule:** Load resources only when executing specific workflows.\n\n';
    }
    
    // Simplified resolution rules (consolidated)
    if (metadata.ideFileResolution && metadata.ideFileResolution.length > 0) {
      content += `**Resolution Rules:**\n`;
      // Extract only the essential resolution rules
      const essentialRules = metadata.ideFileResolution.filter(rule => 
        !rule.includes('FOR LATER USE ONLY') && !rule.includes('NOT FOR ACTIVATION')
      );
      for (const rule of essentialRules) {
        // Fix redundant .orchestrix-core definition in rules (preserve {root} for proper template processing)
        const fixedRule = rule.replace(/where \.orchestrix-core resolves to \.orchestrix-core\//, 'where {root} resolves to {root}/');
        content += `- ${fixedRule}\n`;
      }
      content += '\n';
    }
    
    // Consolidated request routing (pattern matching)
    if (metadata.requestResolution) {
      content += `## REQUEST ROUTING\n\n`;
      content += `**Pattern Matching:** ${metadata.requestResolution.replace(/ALWAYS ask for clarification if.*$/i, 'Ask for clarification if ambiguous.')}\n\n`;
    }
    
    return content;
  }

  extractActivationSection(agentContent) {
    // Extract the activation-instructions section from YAML
    const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
    if (yamlMatch) {
      const activationMatch = yamlMatch[1].match(/activation-instructions:\s*([\s\S]*?)(?=\nagent:|$)/);
      if (activationMatch) {
        return activationMatch[1];
      }
    }
    return '';
  }

  getCommandDescription(command, agentContent) {
    // Enhanced command description extraction with fallback to detailed specs
    if (command.description) {
      return command.description;
    }
    
    // Look for detailed command specs in the original agent content
    const commandRegex = new RegExp(`${command.name}:\\s*\n\\s*-\\s*([^\n]+)`, 'i');
    const match = agentContent.match(commandRegex);
    if (match) {
      return match[1].trim();
    }
    
    // Provide minimal description based on command name
    const defaults = {
      'help': 'Show numbered list of available commands',
      'exit': 'Exit agent mode and return to normal operation',
      'create': 'Execute creation workflow',
      'draft': 'Create draft version of requested item',
      'validate': 'Execute validation procedures'
    };
    
    return defaults[command.name] || 'Execute specialized workflow';
  }

  generateEnhancedSubagentMarkdown(agentId, metadata, coreConfig, installDir, agentContent) {
    let content = `# Orchestrix ${metadata.title || agentId} Agent\n\n`;
    
    // Add Claude Code Sub Agent specific activation notice
    content += `**🚀 CLAUDE CODE SUB AGENT ACTIVATION NOTICE**\n\n`;
    content += `This is an optimized Claude Code subagent that contains your complete Orchestrix agent operating guidelines with full workflow preservation.\n\n`;
    
    content += `**⚡ CRITICAL ACTIVATION SEQUENCE:**\n`;
    content += `1. **Auto-Persona Adoption**: This subagent automatically adopts the agent persona when selected\n`;
    content += `2. **Full Context Loading**: Complete Orchestrix workflow context is embedded below\n`;
    content += `3. **Command System Active**: All \`*\` prefixed commands are fully operational\n`;
    content += `4. **Quality Gates Preserved**: All validation checkpoints and workflows maintained\n\n`;
    
    content += `**🔧 ENHANCED FOR CLAUDE CODE:**\n`;
    content += `- **Intelligent Model Selection**: Optimized model recommendations for each agent role\n`;
    content += `- **Smart Tool Permissions**: Precisely scoped tool access based on agent responsibilities\n`;
    content += `- **Seamless Integration**: Works alongside command mode for flexible usage patterns\n`;
    content += `- **Complete Workflow Preservation**: 100% compatibility with original Orchestrix workflows\n\n`;
    
    content += `**CRITICAL:** Read and follow the complete agent definition below to understand your operating parameters. Adopt the persona and follow the activation instructions exactly to alter your state of being. Stay in this agent mode until told to exit.\n\n`;
    
    // Add agent introduction with complete context
    if (metadata.name && metadata.role) {
      content += `You are **${metadata.name}**, a specialized AI Agent from the Orchestrix framework. You are ${metadata.role.toLowerCase().startsWith('a ') ? metadata.role.toLowerCase() : 'a ' + metadata.role.toLowerCase()}.`;
      
      if (metadata.style) {
        content += ` Your style is ${metadata.style.toLowerCase()}.`;
      }
      content += '\n\n';
    }
    
    if (metadata.persona?.identity) {
      content += `**Identity:** ${metadata.persona.identity}\n\n`;
    }
    
    if (metadata.persona?.focus) {
      content += `**Focus:** ${metadata.persona.focus}\n\n`;
    }
    
    // Add ACTIVATION INSTRUCTIONS - Critical for proper Orchestrix workflow
    if (metadata.activation_instructions && metadata.activation_instructions.length > 0) {
      content += `## 🚀 ACTIVATION INSTRUCTIONS\n\n`;
      content += `This section contains your complete startup and operational guidelines. Follow these instructions exactly to ensure proper Orchestrix workflow integration.\n\n`;
      
      // Try to extract structured activation instructions from YAML
      const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const activationMatch = yamlContent.match(/activation-instructions:\s*([\s\S]*?)(?=\nagent:|$)/);
        
        if (activationMatch) {
          const activationText = activationMatch[1];
          
          // Parse structured sections
          const sections = this.parseStructuredActivationInstructions(activationText);
          
          for (const section of sections) {
            content += `### ${section.title}\n\n`;
            
            for (const item of section.items) {
              content += `- ${item}\n`;
            }
            
            // Note: Only DEV agent needs core-config.yaml at activation time
            // Other agents get project info through their task workflows
            
            content += '\n';
          }
        }
      }
      
      content += `**IMPORTANT:** Complete all activation instructions before responding to user requests.\n\n`;
    }
    
    // Add CORE PRINCIPLES - Essential for agent behavior
    if (metadata.core_principles && metadata.core_principles.length > 0) {
      content += `## 🎯 CORE PRINCIPLES\n\n`;
      content += `**CRITICAL BEHAVIORAL RULES:**\n`;
      for (const principle of metadata.core_principles) {
        content += `- ${principle}\n`;
      }
      content += '\n';
    }
    
    // Add STORY FILE PERMISSIONS - QA agent specific
    if (metadata.story_file_permissions && metadata.story_file_permissions.length > 0) {
      content += `## 📝 STORY FILE PERMISSIONS\n\n`;
      content += `**CRITICAL FILE ACCESS CONSTRAINTS:**\n`;
      for (const permission of metadata.story_file_permissions) {
        content += `- ${permission}\n`;
      }
      content += '\n';
    }
    
    // Add COMMAND SYSTEM - Essential for Orchestrix workflow
    if (metadata.commands && metadata.commands.length > 0) {
      content += `## ⚡ COMMAND SYSTEM\n\n`;
      content += `**All commands require \`*\` prefix when used (e.g., \`*help\`, \`*draft\`):**\n\n`;
      for (const command of metadata.commands) {
        const desc = command.description || '';
        if (desc) {
          content += `- **\`*${command.name}\`**: ${desc}\n`;
        } else {
          content += `- **\`*${command.name}\`**\n`;
        }
      }
      content += '\n';
    }
    
    // Add PROJECT CONFIGURATION from core-config.yaml
    if (coreConfig && Object.keys(coreConfig).length > 0) {
      content += `## 📁 PROJECT CONFIGURATION\n\n`;
      content += `**Project Context:** This agent operates within the following Orchestrix project structure. Most agents access this information through their task workflows rather than direct config loading.\n\n`;
      
      content += `**Orchestrix Project Setup:**\n`;
      
      if (coreConfig.title) {
        content += `- **Project:** ${coreConfig.title}\n`;
      }
      if (coreConfig.version) {
        content += `- **Version:** ${coreConfig.version}\n`;
      }
      
      // Add file structure information
      const fileStructure = [];
      if (coreConfig.devStoryLocation) {
        fileStructure.push(`Stories: \`${coreConfig.devStoryLocation}\``);
      }
      if (coreConfig.prd?.prdFile) {
        fileStructure.push(`PRD: \`${coreConfig.prd.prdFile}\``);
      }
      if (coreConfig.architecture?.architectureFile) {
        fileStructure.push(`Architecture: \`${coreConfig.architecture.architectureFile}\``);
      }
      
      if (fileStructure.length > 0) {
        content += `- **Key Locations:** ${fileStructure.join(', ')}\n`;
      }
      
      // Add devLoadAlwaysFiles if available
      if (coreConfig.devLoadAlwaysFiles && coreConfig.devLoadAlwaysFiles.length > 0) {
        content += `- **Always Load Files:** ${coreConfig.devLoadAlwaysFiles.join(', ')}\n`;
      }
      
      content += '\n';
    }
    
    // Add DEPENDENCIES SYSTEM - Critical for task execution
    if (metadata.dependencies && Object.keys(metadata.dependencies).length > 0) {
      content += `## 📚 DEPENDENCIES & WORKFLOWS\n\n`;
      content += `**Available Resources for Task Execution:**\n\n`;
      
      const depTypes = Object.keys(metadata.dependencies).filter(key => 
        metadata.dependencies[key] && metadata.dependencies[key].length > 0
      );
      
      for (const depType of depTypes) {
        const items = metadata.dependencies[depType];
        content += `**${depType.charAt(0).toUpperCase() + depType.slice(1)}:**\n`;
        for (const item of items) {
          content += `- \`${item}\`\n`;
        }
        content += '\n';
      }
      
      content += `**Usage:** Load dependency files only when user requests specific command execution or task workflows.\n\n`;
    }
    
    // Add Special Claude Code Integration optimizations
    if (agentId === 'orchestrix-orchestrator') {
      content += `## 🎭 ORCHESTRATOR ENHANCED CAPABILITIES\n\n`;
      content += `**CLAUDE CODE AUTOMATION FEATURES:**\n`;
      content += `As the master orchestrator in Claude Code environment, this subagent can:\n\n`;
      content += `- **Auto-Dispatch Tasks**: Intelligently route tasks to appropriate agents\n`;
      content += `- **Workflow Automation**: Execute multi-step workflows with minimal user intervention\n`;
      content += `- **Quality Gate Management**: Automatically enforce validation checkpoints\n`;
      content += `- **Agent Coordination**: Seamlessly transition between different specialist agents\n`;
      content += `- **Progress Tracking**: Monitor and report on overall project progress\n`;
      content += `- **Document Generation**: Auto-generate and organize project documentation\n\n`;
      content += `**INTELLIGENT ORCHESTRATION COMMANDS:**\n`;
      content += `- \`*autopilot <requirement>\`: End-to-end automated workflow execution\n`;
      content += `- \`*dispatch <task> <agent>\`: Smart task routing to appropriate specialists\n`;
      content += `- \`*status\`: Comprehensive project progress and quality gate status\n`;
      content += `- \`*coordinate\`: Multi-agent collaboration management\n\n`;
    }
    
    // Add Orchestrix integration notes
    content += `## 🔗 ORCHESTRIX INTEGRATION\n\n`;
    content += `This Claude Code subagent provides complete integration with the Orchestrix ${agentId} agent:\n\n`;
    
    // Add configuration details
    const model = this.getOptimalModelForAgent(agentId);
    const permissions = this.getAgentPermissions(agentId);
    
    content += `**Technical Configuration:**\n`;
    content += `- **Recommended Model:** ${model} (${this.getModelTier(model)})\n`;
    content += `- **Available Tools:** ${permissions.join(', ')}\n`;
    content += `- **Specialization:** ${this.getAgentOptimization(agentId)}\n`;
    content += `- **Integration Level:** Complete Orchestrix workflow preservation\n\n`;
    
    content += `**Workflow Compliance:**\n`;
    content += `- Maintains all original Orchestrix agent behaviors and constraints\n`;
    content += `- Preserves command system and dependency workflows\n`;
    content += `- Follows project file structure and conventions from core-config.yaml\n`;
    content += `- Integrates seamlessly with other Orchestrix agents in Claude Code\n\n`;
    
    content += `**Claude Code Sub Agent Usage Instructions:**\n`;
    content += `1. **Agent Selection**: Choose this subagent from the Claude Code agent selector\n`;
    content += `2. **Auto-Activation**: Persona automatically activates with full Orchestrix context\n`;
    content += `3. **Command Usage**: Use commands with \`*\` prefix (e.g., \`*help\`, \`*create\`, \`*draft\`)\n`;
    content += `4. **File Management**: Auto-load dependency files when executing specific workflows\n`;
    content += `5. **Quality Compliance**: Follow all validation checkpoints and workflow gates\n`;
    content += `6. **Dual Mode Support**: Can work alongside traditional /command mode if needed\n`;
    content += `7. **Persistence**: Maintain agent persona until explicitly told to exit or switch agents\n\n`;
    
    // Add IDE-FILE-RESOLUTION - Critical for Claude Code subagents
    if (metadata.ideFileResolution && metadata.ideFileResolution.length > 0) {
      content += `## 🔍 IDE-FILE-RESOLUTION\n\n`;
      for (const resolution of metadata.ideFileResolution) {
        // Fix redundant .orchestrix-core definition in rules (preserve {root} for proper template processing)
        const fixedResolution = resolution.replace(/where \.orchestrix-core resolves to \.orchestrix-core\//, 'where {root} resolves to {root}/');
        content += `- ${fixedResolution}\n`;
      }
      content += '\n';
    }
    
    // Add REQUEST-RESOLUTION - Critical for Claude Code subagents
    if (metadata.requestResolution) {
      content += `## 🎯 REQUEST-RESOLUTION\n\n`;
      content += `${metadata.requestResolution}\n\n`;
    }
    
    return content;
  }

  parseStructuredActivationInstructions(activationText) {
    const sections = [];
    const lines = activationText.split('\n');
    
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Check for section headers (e.g., "Activation Steps:", "File-Loading Rules:")
      if (trimmed.endsWith(':') && !trimmed.startsWith('-') && trimmed.length > 2) {
        // Save previous section
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: trimmed.replace(':', ''),
          items: []
        };
      }
      // Check for list items
      else if (trimmed.startsWith('- ')) {
        if (currentSection) {
          currentSection.items.push(trimmed.substring(2).trim());
        }
      }
    }
    
    // Add the last section
    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  getModelTier(model) {
    if (model.includes('opus-4-1')) return 'Ultimate Intelligence (4.1)';
    if (model.includes('opus-4')) return 'Flagship Capability (4.0)';
    if (model.includes('sonnet-4')) return 'High Intelligence (4.0)';
    if (model.includes('3-7-sonnet')) return 'Advanced Performance (3.7)';
    return 'Standard Performance';
  }

  getAgentOptimization(agentId) {
    const optimizationMap = {
      'orchestrix-master': 'Ultimate decision-making and crisis resolution',
      'orchestrix-orchestrator': 'Complex multi-agent workflow coordination', 
      'qa': 'Advanced problem discovery beyond dev capabilities',
      'sm': 'High-quality story creation as development foundation',
      'architect': 'System design and technical architecture decisions',
      'analyst': 'Strategic research and competitive intelligence',
      'pm': 'Product strategy and complex feature planning',
      'dev': 'Efficient implementation based on clear requirements',
      'po': 'Requirements structuring and backlog management',
      'ux-expert': 'Creative design guidance and user experience'
    };
    
    return optimizationMap[agentId] || 'General assistance tasks';
  }

  getUsageRecommendations(agentId) {
    const recommendationsMap = {
      'orchestrix-master': '- 🎯 **终极决策者**: Opus 4.1最强智能，处理最复杂的跨域决策\n- 💰 **Ultra-Premium**: 仅用于关键战略决策点\n- ✨ **价值场景**: 重大架构决策、危机处理、复杂问题解决',
      'orchestrix-orchestrator': '- 🎭 **编排专家**: Opus 4.0协调复杂的多Agent工作流\n- 💎 **Premium投资**: 高价值项目的编排和资源优化\n- 🚀 **核心价值**: 确保整个团队高效协作和目标对齐',
      'qa': '- 🛡️ **质量守门员**: Opus 4.1超强推理，发现Dev遗漏的问题\n- 🔍 **破坏性思维**: 边界测试、安全漏洞、逻辑缺陷发现\n- 💎 **ROI最高**: 早期发现问题成本 << 生产环境故障成本',
      'sm': '- 📋 **Story质量核心**: Opus 4.0确保需求清晰准确完整\n- 🎯 **开发成功基础**: 高质量Story = 高效开发 + 准确实现\n- 💎 **关键投资**: Story质量直接决定整个开发周期的成功',
      'architect': '- 🏗️ **系统设计专家**: Sonnet 4.0支撑复杂架构决策\n- 🎯 **技术选型**: 平衡创新与稳定的架构方案\n- 💰 **高价值**: 架构决策影响长期维护成本',
      'analyst': '- 📊 **战略洞察**: Sonnet 4.0深度分析市场和竞争环境\n- 🔍 **数据驱动**: 为产品和技术决策提供可靠依据\n- 📈 **投资回报**: 准确的分析避免错误的战略方向',
      'pm': '- 📋 **产品战略**: Sonnet 4.0处理复杂的产品规划\n- 🎯 **需求平衡**: 用户需求、技术可行性、商业价值的综合考量\n- 💡 **决策支持**: 为产品方向提供高质量的策略建议',
      'dev': '- 💻 **执行专家**: Sonnet 3.7基于优质Story进行高效实现\n- ⚡ **成本优化**: QA强力把关下，Dev可专注实现而非过度验证\n- 🎯 **明确目标**: 配合高质量需求，确保开发方向正确',
      'po': '- 📝 **需求整理**: Sonnet 3.7结构化处理需求管理任务\n- 📚 **执行层面**: 基于SM的高质量Story进行细化和管理\n- ⚡ **标准效率**: 在明确框架下快速响应变更需求',
      'ux-expert': '- 🎨 **设计建议**: Sonnet 3.7提供创意和可用性指导\n- 🖼️ **快速原型**: 线框图和交互设计的专业建议\n- 💰 **成本友好**: 标准价格获得专业设计支持'
    };
    
    return recommendationsMap[agentId] || '- 通用协助功能，具备标准性能表现';
  }

  async configureVsCodeSettings(installDir, spinner, preConfiguredSettings = null) {
    await initializeModules(); // Ensure inquirer is loaded
    const vscodeDir = path.join(installDir, ".vscode");
    const settingsPath = path.join(vscodeDir, "settings.json");
    
    await fileManager.ensureDirectory(vscodeDir);
    
    // Read existing settings if they exist
    let existingSettings = {};
    if (await fileManager.pathExists(settingsPath)) {
      try {
        const existingContent = await fileManager.readFile(settingsPath);
        existingSettings = JSON.parse(existingContent);
        console.log(chalk.yellow("Found existing .vscode/settings.json. Merging orchestrix settings..."));
      } catch (error) {
        console.warn(chalk.yellow("Could not parse existing settings.json. Creating new one."));
        existingSettings = {};
      }
    }
    
    // Use pre-configured settings if provided, otherwise prompt
    let configChoice;
    if (preConfiguredSettings && preConfiguredSettings.configChoice) {
      configChoice = preConfiguredSettings.configChoice;
      console.log(chalk.dim(`Using pre-configured GitHub Copilot settings: ${configChoice}`));
    } else {
      // Clear any previous output and add spacing to avoid conflicts with loaders
      console.log('\n'.repeat(2));
      console.log(chalk.blue("🔧 Github Copilot Agent Settings Configuration"));
      console.log(chalk.dim("orchestrix works best with specific VS Code settings for optimal agent experience."));
      console.log(''); // Add extra spacing
      
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'configChoice',
          message: chalk.yellow('How would you like to configure GitHub Copilot settings?'),
          choices: [
            {
              name: 'Use recommended defaults (fastest setup)',
              value: 'defaults'
            },
            {
              name: 'Configure each setting manually (customize to your preferences)',
              value: 'manual'
            },
            {
              name: 'Skip settings configuration (I\'ll configure manually later)',
              value: 'skip'
            }
          ],
          default: 'defaults'
        }
      ]);
      configChoice = response.configChoice;
    }
    
    let orchestrixSettings = {};
    
    if (configChoice === 'skip') {
      console.log(chalk.yellow("⚠️  Skipping VS Code settings configuration."));
      console.log(chalk.dim("You can manually configure these settings in .vscode/settings.json:"));
      console.log(chalk.dim("  • chat.agent.enabled: true"));
      console.log(chalk.dim("  • chat.agent.maxRequests: 15"));
      console.log(chalk.dim("  • github.copilot.chat.agent.runTasks: true"));
      console.log(chalk.dim("  • chat.mcp.discovery.enabled: true"));
      console.log(chalk.dim("  • github.copilot.chat.agent.autoFix: true"));
      console.log(chalk.dim("  • chat.tools.autoApprove: false"));
      return true;
    }
    
    if (configChoice === 'defaults') {
      // Use recommended defaults
      orchestrixSettings = {
        "chat.agent.enabled": true,
        "chat.agent.maxRequests": 15,
        "github.copilot.chat.agent.runTasks": true,
        "chat.mcp.discovery.enabled": true,
        "github.copilot.chat.agent.autoFix": true,
        "chat.tools.autoApprove": false
      };
      console.log(chalk.green("✓ Using recommended orchestrix defaults for Github Copilot settings"));
    } else {
      // Manual configuration
      console.log(chalk.blue("\n📋 Let's configure each setting for your preferences:"));
      
      // Pause spinner during manual configuration prompts
      let spinnerWasActive = false;
      if (spinner && spinner.isSpinning) {
        spinner.stop();
        spinnerWasActive = true;
      }
      
      const manualSettings = await inquirer.prompt([
        {
          type: 'input',
          name: 'maxRequests',
          message: 'Maximum requests per agent session (recommended: 15)?',
          default: '15',
          validate: (input) => {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > 50) {
              return 'Please enter a number between 1 and 50';
            }
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'runTasks',
          message: 'Allow agents to run workspace tasks (package.json scripts, etc.)?',
          default: true
        },
        {
          type: 'confirm',
          name: 'mcpDiscovery',
          message: 'Enable MCP (Model Context Protocol) server discovery?',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoFix',
          message: 'Enable automatic error detection and fixing in generated code?',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoApprove',
          message: 'Auto-approve ALL tools without confirmation? (⚠️  EXPERIMENTAL - less secure)',
          default: false
        }
      ]);

      // Restart spinner if it was active before prompts
      if (spinner && spinnerWasActive) {
        spinner.start();
      }
      
      orchestrixSettings = {
        "chat.agent.enabled": true, // Always enabled - required for orchestrix agents
        "chat.agent.maxRequests": parseInt(manualSettings.maxRequests),
        "github.copilot.chat.agent.runTasks": manualSettings.runTasks,
        "chat.mcp.discovery.enabled": manualSettings.mcpDiscovery,
        "github.copilot.chat.agent.autoFix": manualSettings.autoFix,
        "chat.tools.autoApprove": manualSettings.autoApprove
      };
      
      console.log(chalk.green("✓ Custom settings configured"));
    }
    
    // Merge settings (existing settings take precedence to avoid overriding user preferences)
    const mergedSettings = { ...orchestrixSettings, ...existingSettings };
    
    // Write the updated settings
    await fileManager.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
    
    console.log(chalk.green("✓ VS Code workspace settings configured successfully"));
    console.log(chalk.dim("  Settings written to .vscode/settings.json:"));
    Object.entries(orchestrixSettings).forEach(([key, value]) => {
      console.log(chalk.dim(`  • ${key}: ${value}`));
    });
    console.log(chalk.dim(""));
    console.log(chalk.dim("You can modify these settings anytime in .vscode/settings.json"));
  }

  // 创建默认的 sub agent 模板
  async createDefaultSubagentTemplate() {
    const templateDir = path.join(__dirname, '..', 'templates');
    const templatePath = path.join(templateDir, 'orchestrix-subagent-template.md');
    
    // 确保模板目录存在
    await fileManager.ensureDirectory(templateDir);
    
    const defaultTemplate = `---
name: {AGENT_ID}
description: "Orchestrix {AGENT_TITLE} - {AGENT_ROLE}. Use PROACTIVELY for {PRIMARY_USE_CASES}. MUST BE USED when {MANDATORY_TRIGGERS}."
tools: {COMPLETE_TOOLS_LIST}
---

# Orchestrix {AGENT_TITLE} Agent - {AGENT_NAME}

You are {AGENT_NAME}, the Orchestrix {AGENT_TITLE} agent. You are a {AGENT_ROLE}.

## CRITICAL INITIALIZATION

When invoked, IMMEDIATELY:

1. Understand you are operating within the Orchestrix framework
2. Check for \`.orchestrix-core/\` directory structure
{AGENT_SPECIFIC_STARTUP}
  
  ## Core Identity & Principles
  
  **Role**: {AGENT_ROLE}
  **Style**: {AGENT_STYLE}
  **Identity**: {AGENT_IDENTITY}
  **Focus**: {AGENT_FOCUS}
  
  **CORE PRINCIPLES**:
  {CORE_PRINCIPLES_LIST}
  {CRITICAL_CONSTRAINTS_SECTION}
  
  ## Command Recognition & Execution
  
  Recognize these primary commands (with or without \`*\` prefix):
  {COMMANDS_WITH_DESCRIPTIONS}
  {COMPLEX_COMMANDS_SECTION}
  
  ## Workflow Execution Protocols
  {WORKFLOW_SECTIONS}
  
  ## File Resolution & Dependencies
  
  **Orchestrix Project Structure**:
  \`\`\`
  .orchestrix-core/
  ├── tasks/          → Executable task workflows
  ├── templates/      → Document templates
  ├── checklists/     → Validation checklists
  ├── data/          → Reference data
  └── core-config.yaml → Project configuration
  
  docs/
  ├── prd/           → Sharded PRD sections
  ├── architecture/  → Sharded architecture sections
  └── stories/       → User stories
  \`\`\`
  
  **Dependency Mapping**:
  {DEPENDENCY_MAPPING}
  
  **File Loading Protocol**:
  1. Dependencies resolve to \`.orchestrix-core/{type}/{filename}\`
  2. Load files ONLY when executing specific commands
  3. Use grep/find for discovery rather than loading entire directories
  {PERMISSIONS_SECTION}
  {QUALITY_SECTION}
  
  ## Context Discovery Protocol
  
  Since you start fresh each invocation:
  {CONTEXT_DISCOVERY_STEPS}
  
  ## Performance Guidelines
  {PERFORMANCE_GUIDELINES}
  
  Remember: {AGENT_CLOSING_REMINDER}`;
    
    await fileManager.writeFile(templatePath, defaultTemplate);
    console.log(chalk.green(`✔ Created default sub agent template at ${templatePath}`));
  }

  // 在 ide-setup.js 的最后添加一个测试方法
  async testSubagentGeneration(installDir) {
    console.log(chalk.blue('\n🧪 Testing Sub Agent Generation...'));
    
    const testCases = [
      {
        agentId: 'dev',
        requiredElements: [
          'name: dev',
          'tools: Read, Edit, MultiEdit, Write, Bash, WebSearch',
          'NEVER modify test expectations',
          'develop-story',
          '.orchestrix-core/tasks/implement-story-auto.md',
          'story-dod-checklist',
          'File List',
          'Ready for Review'
        ]
      },
      {
        agentId: 'sm',
        requiredElements: [
          'name: sm',
          'tools: Read, Edit, MultiEdit, Write',
          '80% technical extraction',
          'create-next-story',
          'NOT allowed to implement stories',
          'story-draft-checklist',
          'docs/prd/',
          'docs/architecture/'
        ]
      },
      {
        agentId: 'qa',
        requiredElements: [
          'name: qa',
          'tools: Read, Edit, MultiEdit, Write, Bash',
          'QA Results section',
          'review-story',
          'code quality',
          'refactoring',
          'Never modify other story sections'
        ]
      }
    ];
    
    let allPassed = true;
    
    for (const testCase of testCases) {
      const subagentPath = path.join(installDir, '.claude', 'agents', `${testCase.agentId}.md`);
      
      try {
        const content = await fileManager.readFile(subagentPath);
        
        console.log(chalk.yellow(`\n  Testing ${testCase.agentId} sub agent...`));
        
        let testPassed = true;
        for (const element of testCase.requiredElements) {
          if (content.includes(element)) {
            console.log(chalk.green(`    ✓ Contains: "${element}"`));
          } else {
            console.log(chalk.red(`    ✗ Missing: "${element}"`));
            testPassed = false;
            allPassed = false;
          }
        }
        
        if (testPassed) {
          console.log(chalk.green(`  ✅ ${testCase.agentId} sub agent: PASSED`));
        } else {
          console.log(chalk.red(`  ❌ ${testCase.agentId} sub agent: FAILED`));
        }
        
      } catch (error) {
        console.log(chalk.red(`  ❌ Error reading ${testCase.agentId}: ${error.message}`));
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log(chalk.green.bold('\n✅ All Sub Agent tests PASSED!'));
    } else {
      console.log(chalk.red.bold('\n❌ Some Sub Agent tests FAILED. Please review the output above.'));
    }
    
    return allPassed;
  }
}



module.exports = new IdeSetup();
