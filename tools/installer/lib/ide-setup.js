const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const glob = require("glob");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const { extractYamlFromAgent, extractAgentDependencies, loadAgentYaml, findAgentPath, getAgentMetadata } = require("../../lib/yaml-utils");

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
    this.quiet = false;
    this.language = 'en'; // Default language
  }

  /**
   * 条件日志输出 - 只有在非静默模式下才输出
   * @param {Function} logFn - console.log, console.warn, console.error 等
   * @param {...any} args - 日志参数
   */
  _log(logFn, ...args) {
    if (!this.quiet) {
      logFn(...args);
    }
  }

  async loadIdeAgentConfig() {
    if (this.ideAgentConfig) return this.ideAgentConfig;
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'ide-agent-config.yaml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.ideAgentConfig = yaml.load(configContent);
      return this.ideAgentConfig;
    } catch (error) {
      this._log(console.warn, 'Failed to load IDE agent configuration, using defaults');
      return {
        'roo-permissions': {},
        'cline-order': {}
      };
    }
  }

  async setup(ide, installDir, selectedAgent = null, spinner = null, preConfiguredSettings = null, quiet = false, language = 'en') {
    await initializeModules();
    this.quiet = quiet; // 设置静默模式
    this.language = language || 'en'; // 设置语言

    const ideConfig = await configLoader.getIdeConfiguration(ide);

    if (!ideConfig) {
      this._log(console.log, chalk.yellow(`\nNo configuration available for ${ide}`));
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
        this._log(console.log, chalk.yellow(`\nIDE ${ide} not yet supported`));
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

        // Get agent metadata for description
        const metadata = this.extractAgentMetadata(agentContent);
        const agentTitle = await this.getAgentTitle(agentId, installDir);
        const description = metadata.agent?.whenToUse || `Activate ${agentTitle} agent for specialized tasks`;
        
        // Create MDC content with proper format and meaningful description
        let mdcContent = "---\n";
        mdcContent += `description: "${description}"\n`;
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
        
        // Extract the complete YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          // Clean the YAML content to remove redundant sections
          let cleanedYaml = this.cleanYamlContent(yamlContent);
          // Replace {root} variables for Cursor rules
          // {root} should resolve to .orchestrix-core
          let processedYamlContent = cleanedYaml.replace(/\{root\}/g, '.orchestrix-core');
          mdcContent += processedYamlContent;
        } else {
          // If YAML extraction completely fails, provide meaningful error message
          mdcContent += `# YAML configuration not found for ${agentId}\n`;
          mdcContent += `# Please check the agent file format in:\n`;
          mdcContent += `# ${path.relative(installDir, agentPath)}\n`;
          mdcContent += `# Expected format: \`\`\`yaml ... \`\`\``;
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
      }
    }

    this._log(console.log, chalk.green(`\n✓ 已为 Cursor 创建 ${agents.length} 个代理规则`));

    return true;
  }

  // 修改 setupClaudeCode 方法，添加测试选项
 async setupClaudeCode(installDir, selectedAgent, runTests = false) {
  this._log(console.log, chalk.blue("\n🔧 设置 Claude Code 双模式集成..."));
  
  const subagentsCount = await this.setupClaudeCodeSubagents(installDir, selectedAgent);
  
  this._log(console.log, chalk.green(`✔ 已创建 ${subagentsCount} 个优化的 Claude Code 子代理`));
  
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

  // Install tmux automation files
  await this.setupTmuxAutomation(installDir);

  // Summary
  this._log(console.log, chalk.green(`\n✅ Claude Code 双模式集成完成:`));
  this._log(console.log, chalk.dim(`   • Sub Agents: .claude/agents/ (${subagentsCount} 个优化代理)`));
  this._log(console.log, chalk.dim(`   • Commands: .claude/commands/ (${coreAgents.length} 个命令 + ${coreTasks.length} 个任务)`));
  this._log(console.log, chalk.dim(`   • 使用方式: 在 Claude Code 中直接选择 Sub Agent 或使用 /命令`));

  return true;
 }

  // 统一的路径解析器类
  createPathResolver(installDir, packageName, rootPath) {
    return {
      resolveAgentPath: (agentId) => {
        if (packageName !== "core") {
          // Check for both YAML and MD files in expansion pack
          const expansionYamlPath = path.join(installDir, rootPath, "agents", `${agentId}.yaml`);
          const expansionMdPath = path.join(installDir, rootPath, "agents", `${agentId}.md`);
          if (require('fs').existsSync(expansionYamlPath)) {
            return expansionYamlPath;
          }
          if (require('fs').existsSync(expansionMdPath)) {
            return expansionMdPath;
          }
        }
        // Check for both YAML and MD files in core
        const coreYamlPath = path.join(installDir, ".orchestrix-core", "agents", `${agentId}.yaml`);
        const coreMdPath = path.join(installDir, ".orchestrix-core", "agents", `${agentId}.md`);
        if (require('fs').existsSync(coreYamlPath)) {
          return coreYamlPath;
        }
        return coreMdPath;
      },
      
      resolveTaskPath: (taskId) => {
        if (packageName !== "core") {
          const expansionTaskPath = path.join(installDir, rootPath, "tasks", `${taskId}.md`);
          if (require('fs').existsSync(expansionTaskPath)) {
            return expansionTaskPath;
          }
        }
        return path.join(installDir, ".orchestrix-core", "tasks", `${taskId}.md`);
      },
      
      resolveDependencyPath: (dependencyPath) => {
        // 智能依赖路径解析
        if (dependencyPath.startsWith('.orchestrix-core/')) {
          return dependencyPath; // 保持核心路径不变
        }
        return path.join(rootPath, dependencyPath);
      }
    };
  }

  // Smart path replacement function for handling root placeholder
  smartPathReplacement(content, packageName, rootPath) {
    if (!content) return content;
    
    let result = content;
    
    // Handle complex nested placeholders like "{root} resolves to {root}/"
    // First pass: replace descriptive text patterns
    result = result.replace(/{root}\s+resolves\s+to\s+{root}\//g, 'files are resolved relative to .orchestrix-core/');
    result = result.replace(/where\s+{root}\s+resolves\s+to\s+\.orchestrix-core\//g, 'where files are resolved relative to project root');
    
    if (packageName === "core") {
      // For core package, simple replacement
      return result.replace(/{root}/g, rootPath);
    } else {
      // For expansion packs, preserve core dependencies while replacing package-specific paths
      return result
        // Keep core system dependencies unchanged
        .replace(/{root}\/(?=(?:tasks|templates|checklists|data|utils)\/)/g, '.orchestrix-core/')
        // Replace package-specific root references
        .replace(/{root}/g, rootPath);
    }
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
        const expansionYamlPath = path.join(installDir, rootPath, "agents", `${agentId}.yaml`);
        const expansionMdPath = path.join(installDir, rootPath, "agents", `${agentId}.md`);
        if (await fileManager.pathExists(expansionYamlPath)) {
          agentPath = expansionYamlPath;
        } else if (await fileManager.pathExists(expansionMdPath)) {
          agentPath = expansionMdPath;
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
        
        // Replace {root} placeholder with smart path logic
        agentContent = this.smartPathReplacement(agentContent, packageName, rootPath);

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
        
        // Replace {root} placeholder with smart path logic
        taskContent = this.smartPathReplacement(taskContent, packageName, rootPath);

        // Add command header
        let commandContent = `# /${taskId} Task\n\n`;
        commandContent += `When this command is used, execute the following task:\n\n`;
        commandContent += taskContent;

        await fileManager.writeFile(commandPath, commandContent);
        // Removed individual task creation messages for cleaner output
      }
    }

    const displayName = packageName === "core" ? "Orchestrix 核心系统" : packageName;
    this._log(console.log, chalk.green(`\n✓ 已为 ${displayName} 创建 Claude Code 命令 (代理: ${agentIds.length}个, 任务: ${taskIds.length}个)`));
  }

  /**
   * Setup tmux automation for Claude Code
   * Installs handoff-detector hook and settings configuration
   */
  async setupTmuxAutomation(installDir) {
    const hooksDir = path.join(installDir, ".claude", "hooks");
    const settingsPath = path.join(installDir, ".claude", "settings.local.json");

    // Use configLoader to get the correct base path
    const configLoader = require("./config-loader");
    const basePath = configLoader.getBasePath();

    // Ensure hooks directory exists
    await fileManager.ensureDirectory(hooksDir);

    // Copy handoff-detector.sh
    const sourceHookPath = path.join(basePath, "common", "hooks", "handoff-detector.sh");
    const targetHookPath = path.join(hooksDir, "handoff-detector.sh");

    if (await fileManager.pathExists(sourceHookPath)) {
      await fileManager.copyFile(sourceHookPath, targetHookPath);

      // Ensure script is executable
      try {
        await fs.chmod(targetHookPath, 0o755);
        this._log(console.log, chalk.green(`   ✅ TMUX Hook: .claude/hooks/handoff-detector.sh`));
      } catch (error) {
        console.error(chalk.red(`   ❌ Error: Could not set executable permission on hook script: ${error.message}`));
        throw error; // Stop installation if we can't set permissions
      }
    } else {
      console.error(chalk.red(`   ❌ Error: Hook script template not found at ${sourceHookPath}`));
      throw new Error(`Missing required file: ${sourceHookPath}`);
    }

    // Handle settings.local.json - merge if exists, create if not
    const sourceSettingsPath = path.join(basePath, "common", "hooks", "settings.local.json");

    if (await fileManager.pathExists(sourceSettingsPath)) {
      const hookConfig = JSON.parse(await fs.readFile(sourceSettingsPath, 'utf8'));

      let existingSettings = {};
      if (await fileManager.pathExists(settingsPath)) {
        try {
          existingSettings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
        } catch (error) {
          this._log(console.warn, chalk.yellow(`Warning: Could not parse existing settings.local.json: ${error.message}`));
        }
      }

      // Merge hook configuration
      if (!existingSettings.hooks) {
        existingSettings.hooks = {};
      }
      if (!existingSettings.hooks.Stop) {
        existingSettings.hooks.Stop = hookConfig.hooks.Stop;

        await fs.writeFile(settingsPath, JSON.stringify(existingSettings, null, 2), 'utf8');
        this._log(console.log, chalk.dim(`   • TMUX Config: .claude/settings.local.json`));
      } else {
        this._log(console.log, chalk.dim(`   • TMUX Config: .claude/settings.local.json (existing Stop hook preserved)`));
      }
    } else {
      console.error(chalk.red(`   ❌ Error: Settings template not found at ${sourceSettingsPath}`));
      throw new Error(`Missing required file: ${sourceSettingsPath}`);
    }

    // Copy start-tmux-session.sh to .orchestrix-core/utils/
    const tmuxScriptDir = path.join(installDir, ".orchestrix-core", "utils");
    await fileManager.ensureDirectory(tmuxScriptDir);

    const sourceTmuxScript = path.join(basePath, "orchestrix-core", "utils", "start-tmux-session.sh");
    const targetTmuxScript = path.join(tmuxScriptDir, "start-tmux-session.sh");

    if (await fileManager.pathExists(sourceTmuxScript)) {
      // Read the template and replace {root} placeholder
      let scriptContent = await fs.readFile(sourceTmuxScript, 'utf8');
      scriptContent = scriptContent.replace(/\{root\}/g, '.orchestrix-core');

      // Write the processed script
      await fs.writeFile(targetTmuxScript, scriptContent, 'utf8');

      // Make it executable
      try {
        await fs.chmod(targetTmuxScript, 0o755);
        this._log(console.log, chalk.green(`   ✅ TMUX Launcher: .orchestrix-core/utils/start-tmux-session.sh`));
      } catch (error) {
        console.error(chalk.red(`   ❌ Error: Could not set executable permission on tmux launcher: ${error.message}`));
        throw error;
      }
    } else {
      console.error(chalk.red(`   ❌ Error: TMUX launcher script not found at ${sourceTmuxScript}`));
      throw new Error(`Missing required file: ${sourceTmuxScript}`);
    }

    // Note: Handoff is now hook-based, no skill needed
    // Hook script detects HANDOFF messages and routes automatically

    this._log(console.log, chalk.cyan(`\n   💡 TMUX自动化已安装！使用方法：`));
    this._log(console.log, chalk.dim(`      1. 启动会话: ./.orchestrix-core/utils/start-tmux-session.sh`));
    this._log(console.log, chalk.dim(`      2. 在SM窗口输入 1 开始工作流`));
    this._log(console.log, chalk.dim(`      3. 观察agents自动协作`));
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
        // Extract and clean the YAML content from the agent file
        const processedYamlContent = this.getCleanedYamlForIDE(agentContent, '.orchestrix-core');
        if (processedYamlContent) {
          mdContent += processedYamlContent;
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
        this._log(console.log, chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }

    this._log(console.log, chalk.green(`\n✓ Created Windsurf rules in ${windsurfRulesDir}`));

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
        // Extract and clean the YAML content from the agent file
        const processedYamlContent = this.getCleanedYamlForIDE(agentContent, '.orchestrix-core');
        if (processedYamlContent) {
          mdContent += processedYamlContent;
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
        this._log(console.log, chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }
  }

  async findAgentPath(agentId, installDir) {
    // Build list of possible paths, prioritizing language-specific files if language is not 'en'
    const possiblePaths = [];
    const lang = this.language;

    // Define base directories to search
    const baseDirs = [
      path.join(installDir, ".orchestrix-core", "agents"),
      path.join(installDir, "orchestrix-core", "agents"), // Source directory
      path.join(installDir, "agents")
    ];

    // Add expansion pack directories
    // Exclude IDE configuration directories
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir }).filter(dir => {
      const dirName = path.basename(path.dirname(dir));
      const ideConfigDirs = ['.claude', '.cursor', '.windsurf', '.trae', '.cline', '.clinerules', '.vscode', '.idea', '.roomodes'];
      return !ideConfigDirs.includes(dirName);
    });

    for (const expDir of expansionDirs) {
      baseDirs.push(path.join(installDir, expDir));
    }

    // For each base directory, add paths in priority order:
    // 1. Language-specific YAML (if lang != 'en')
    // 2. Default YAML
    // 3. Language-specific MD (if lang != 'en')
    // 4. Default MD
    for (const baseDir of baseDirs) {
      if (lang && lang !== 'en') {
        possiblePaths.push(path.join(baseDir, `${agentId}.${lang}.yaml`));
      }
      possiblePaths.push(path.join(baseDir, `${agentId}.yaml`));
      if (lang && lang !== 'en') {
        possiblePaths.push(path.join(baseDir, `${agentId}.${lang}.md`));
      }
      possiblePaths.push(path.join(baseDir, `${agentId}.md`));
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

    // Helper to extract agent ID from filename, handling language suffixes
    const extractAgentId = (filename, ext) => {
      const baseName = path.basename(filename, ext);
      // Check if this is a language-specific file (e.g., analyst.zh.yaml -> analyst)
      const langMatch = baseName.match(/^(.+)\.([a-z]{2})$/);
      return langMatch ? langMatch[1] : baseName;
    };

    // Check core agents in .orchestrix-core or root
    let agentsDir = path.join(installDir, ".orchestrix-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "agents");
    }

    if (await fileManager.pathExists(agentsDir)) {
      // Support both YAML and MD files, prioritize YAML
      // Filter out .src.yaml (legacy) and README files
      const yamlFiles = glob.sync("*.yaml", { cwd: agentsDir }).filter(file => !file.endsWith('.src.yaml') && !file.toUpperCase().startsWith('README'));
      const mdFiles = glob.sync("*.md", { cwd: agentsDir }).filter(file => !file.toUpperCase().startsWith('README'));

      // Extract IDs from YAML files (removing language suffixes to get unique IDs)
      const yamlIds = yamlFiles.map((file) => extractAgentId(file, ".yaml"));
      // Extract IDs from MD files
      const mdIds = mdFiles.map((file) => extractAgentId(file, ".md")).filter(id => !yamlIds.includes(id));

      allAgentIds.push(...yamlIds, ...mdIds);
    }

    // Also check for expansion pack agents in dot folders
    // Exclude IDE configuration directories (.claude, .cursor, .windsurf, .trae, etc.)
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir }).filter(dir => {
      const dirName = path.basename(path.dirname(dir));
      const ideConfigDirs = ['.claude', '.cursor', '.windsurf', '.trae', '.cline', '.clinerules', '.vscode', '.idea', '.roomodes'];
      return !ideConfigDirs.includes(dirName);
    });

    for (const expDir of expansionDirs) {
      const fullExpDir = path.join(installDir, expDir);

      // Support both YAML and MD files for expansion packs too
      // Filter out .src.yaml (legacy) and README files
      const expYamlFiles = glob.sync("*.yaml", { cwd: fullExpDir }).filter(file => !file.endsWith('.src.yaml') && !file.toUpperCase().startsWith('README'));
      const expMdFiles = glob.sync("*.md", { cwd: fullExpDir }).filter(file => !file.toUpperCase().startsWith('README'));

      // Extract IDs from YAML files (removing language suffixes)
      const expYamlIds = expYamlFiles.map((file) => extractAgentId(file, ".yaml"));
      // Extract IDs from MD files
      const expMdIds = expMdFiles.map((file) => extractAgentId(file, ".md")).filter(id => !expYamlIds.includes(id));

      allAgentIds.push(...expYamlIds, ...expMdIds);
    }

    // Remove duplicates
    return [...new Set(allAgentIds)];
  }

  async getCoreAgentIds(installDir) {
    const allAgentIds = [];

    // Helper to extract agent ID from filename, handling language suffixes
    const extractAgentId = (filename, ext) => {
      const baseName = path.basename(filename, ext);
      // Check if this is a language-specific file (e.g., analyst.zh.yaml -> analyst)
      const langMatch = baseName.match(/^(.+)\.([a-z]{2})$/);
      return langMatch ? langMatch[1] : baseName;
    };

    // Check core agents in .orchestrix-core or root only
    let agentsDir = path.join(installDir, ".orchestrix-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "orchestrix-core", "agents");
    }

    if (await fileManager.pathExists(agentsDir)) {
      // Support both YAML and MD files, prioritize YAML
      // Filter out .src.yaml (legacy) and README files
      const yamlFiles = glob.sync("*.yaml", { cwd: agentsDir }).filter(file => !file.endsWith('.src.yaml') && !file.toUpperCase().startsWith('README'));
      const mdFiles = glob.sync("*.md", { cwd: agentsDir }).filter(file => !file.toUpperCase().startsWith('README'));

      // Extract IDs from YAML files (removing language suffixes to get unique IDs)
      const yamlIds = yamlFiles.map((file) => extractAgentId(file, ".yaml"));
      // Extract IDs from MD files
      const mdIds = mdFiles.map((file) => extractAgentId(file, ".md")).filter(id => !yamlIds.includes(id));

      allAgentIds.push(...yamlIds, ...mdIds);
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
    // Use the updated findAgentPath method
    const agentPath = await this.findAgentPath(agentId, installDir);
    
    if (agentPath) {
      try {
        if (agentPath.endsWith('.yaml')) {
          // Direct YAML file loading
          const agentConfig = await loadAgentYaml(agentPath);
          if (agentConfig) {
            const metadata = getAgentMetadata(agentConfig);
            return metadata.title;
          }
        } else {
          // Legacy MD file support
          const agentContent = await fileManager.readFile(agentPath);
          const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
          
          if (yamlMatch) {
            const yamlContent = yamlMatch[1];
            const titleMatch = yamlContent.match(/title:\s*(.+)/);
            if (titleMatch) {
              return titleMatch[1].trim();
            }
          }
        }
      } catch (error) {
        this._log(console.warn, `Failed to read agent title for ${agentId}: ${error.message}`);
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
    // Exclude IDE configuration directories
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir }).filter(dir => {
      const dirName = path.basename(path.dirname(dir));
      const ideConfigDirs = ['.claude', '.cursor', '.windsurf', '.trae', '.cline', '.clinerules', '.vscode', '.idea', '.roomodes'];
      return !ideConfigDirs.includes(dirName);
    });
    
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
    // Exclude IDE configuration directories
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir }).filter(dir => {
      const dirName = path.basename(path.dirname(dir));
      const ideConfigDirs = ['.claude', '.cursor', '.windsurf', '.trae', '.cline', '.clinerules', '.vscode', '.idea', '.roomodes'];
      return !ideConfigDirs.includes(dirName);
    });
    
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
      this._log(console.warn, `Failed to read core slashPrefix, using default 'orchestrix': ${error.message}`);
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
      this._log(console.warn, `Failed to read expansion pack slashPrefix from ${packPath}: ${error.message}`);
    }
    
    return path.basename(packPath); // fallback to directory name
  }

  async getExpansionPackAgents(packPath) {
    const agentsDir = path.join(packPath, "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      return [];
    }
    
    try {
      // Support both YAML and MD files, prioritize YAML
      // Filter out .src.yaml (legacy) and README files
      const yamlFiles = glob.sync("*.yaml", { cwd: agentsDir }).filter(file => !file.endsWith('.src.yaml') && !file.toUpperCase().startsWith('README'));
      const mdFiles = glob.sync("*.md", { cwd: agentsDir }).filter(file => !file.toUpperCase().startsWith('README'));

      // Extract IDs from YAML files first
      const yamlIds = yamlFiles.map((file) => path.basename(file, ".yaml"));
      // Extract IDs from MD files, but exclude those already found in YAML
      const mdIds = mdFiles.map((file) => path.basename(file, ".md")).filter(id => !yamlIds.includes(id));
      
      return [...yamlIds, ...mdIds];
    } catch (error) {
      this._log(console.warn, `Failed to read expansion pack agents from ${packPath}: ${error.message}`);
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
      this._log(console.warn, `Failed to read expansion pack tasks from ${packPath}: ${error.message}`);
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
      this._log(console.log, chalk.yellow(`Found existing .roomodes file with ${existingModes.length} modes`));
    }

    // Create new modes content
    let newModesContent = "";

    // Load dynamic agent permissions from configuration
    const config = await this.loadIdeAgentConfig();
    const agentPermissions = config['roo-permissions'] || {};

    for (const agentId of agents) {
      // Skip if already exists
      if (existingModes.includes(`orchestrix-${agentId}`)) {
        this._log(console.log, chalk.dim(`Skipping ${agentId} - already exists in .roomodes`));
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

          this._log(console.log, chalk.green(`✓ Added mode: orchestrix-${agentId} (${icon} ${title})`));
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
    this._log(console.log, chalk.green("✓ Created .roomodes file in project root"));

    this._log(console.log, chalk.green(`\n✓ Roo Code setup complete!`));
    this._log(console.log, chalk.dim("Custom modes will be available when you open this project in Roo Code"));

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
        // Extract and clean the YAML content from the agent file
        const processedYamlContent = this.getCleanedYamlForIDE(agentContent, '.orchestrix-core');
        if (processedYamlContent) {
          mdContent += processedYamlContent;
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
        this._log(console.log, chalk.green(`✓ Created rule: ${prefix}-${agentId}.md`));
      }
    }

    this._log(console.log, chalk.green(`\n✓ Created Cline rules in ${clineRulesDir}`));

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
          this._log(console.log, chalk.green("✓ Updated .gemini/settings.json - removed agent file references"));
        }
      } catch (error) {
        this._log(console.warn, 
          chalk.yellow("Could not update .gemini/settings.json"),
          error
        );
      }
    }

    // Remove old agents directory
    const agentsDir = path.join(geminiDir, "agents");
    if (await fileManager.pathExists(agentsDir)) {
      await fileManager.removeDirectory(agentsDir);
      this._log(console.log, chalk.green("✓ Removed old .gemini/agents directory"));
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
        // Extract and clean the YAML content from the agent file
        const processedYamlContent = this.getCleanedYamlForIDE(agentContent, '.orchestrix-core');
        if (processedYamlContent) {
          agentRuleContent += processedYamlContent;
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
        this._log(console.log, chalk.green(`✓ Added context for @${agentId}`));
      }
    }

    // Write the concatenated content to GEMINI.md
    const geminiMdPath = path.join(orchestrixMethodDir, "GEMINI.md");
    await fileManager.writeFile(geminiMdPath, concatenatedContent);
    this._log(console.log, chalk.green(`\n✓ Created GEMINI.md in ${orchestrixMethodDir}`));

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
        this._log(console.log, chalk.green(`✓ Created chat mode: ${agentId}.chatmode.md`));
      }
    }

    this._log(console.log, chalk.green(`\n✓ Github Copilot setup complete!`));
    this._log(console.log, chalk.dim(`You can now find the orchestrix agents in the Chat view's mode selector.`));

    return true;
  }





  generateDescription(metadata) {
    const title = metadata.agent?.title || metadata.agent?.name || 'AI Assistant';
    const role = metadata.persona?.role || 'Assistant';
    return `${title} - ${role} specialized in Orchestrix workflows`;
  }

  generateWhenToUse(metadata) {
    const whenToUse = metadata.agent?.whenToUse || 'general assistance and task execution';
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
            'Run execute-checklist with completion/story-dod-checklist.md',
            'Update story status to "Ready for Review"'
          ],
          dependencies: ['execute-checklist.md', 'validate-next-story.md'],
          checklist: 'completion/story-dod-checklist.md'
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
            'Run execute-checklist with assessment/architect-technical-review-checklist.md'
          ],
          dependencies: ['review-story-technical-accuracy.md', 'execute-checklist.md'],
          checklist: 'assessment/architect-technical-review-checklist.md'
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
            'Run execute-checklist with assessment/sm-story-quality.md'
          ],
          dependencies: ['create-next-story.md', 'execute-checklist.md'],
          checklist: 'assessment/sm-story-quality.md'
        },
        'story_validation': {
          sequence: [
            'Execute comprehensive story quality check',
            'Analyze story completeness and technical accuracy',
            'Provide automatic status decision and recommendations'
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
    const agentId = metadata.agent?.id || metadata.name || 'agent';
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
    
    let successCount = 0;
    
    for (const agentId of agents) {
      const agentPath = await this.findAgentPath(agentId, installDir);
      
      if (agentPath) {
        try {
          const agentContent = await fileManager.readFile(agentPath);
          const subagentPath = path.join(subagentsDir, `${agentId}.md`);
          
          // 使用增强的模板系统
          const subagentContent = await this.generateEnhancedSubagentContent(agentId, agentContent, installDir);
          
          await fileManager.writeFile(subagentPath, subagentContent);
          successCount++;
        } catch (error) {
          // 跳过无法处理的 agent（如用户自定义的文件）
          this._log(console.warn, chalk.yellow(`⚠️  Skipping ${agentId}: ${error.message}`));
        }
      }
    }
    
    return successCount;
  }



  async generateEnhancedSubagentContent(agentId, agentContent, installDir) {
    try {
      // Parse the YAML content to get structured data
      const yamlContent = this.getYamlContent(agentContent);
      if (!yamlContent) {
        throw new Error(`No YAML content found for agent ${agentId}`);
      }
      
      const yaml = require('js-yaml');
      const agentData = yaml.load(yamlContent);
      
      // Generate subagent content directly without template
      const content = this.generateSubagentContentDirect(agentData, agentId, yamlContent);
      
      return content;
      
    } catch (error) {
      console.error(`Failed to generate enhanced SubAgent for ${agentId}: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
      throw new Error(`SubAgent generation failed for ${agentId}: ${error.message}`);
    }
  }

  // Generate subagent content directly without template - OPTIMIZED for minimal redundancy
  generateSubagentContentDirect(agentData, agentId, yamlContent) {
    const agent = agentData.agent || {};
    const persona = agentData.persona || {};
    const model = this.getAgentModel(agentId);
    const color = this.getAgentColor(agentId);
    
    // Clean the YAML content - remove redundant sections
    const cleanedYaml = this.cleanYamlContent(yamlContent);
    
    // Build concise frontmatter
    let content = `---
name: ${agentId}
description: ${agent.whenToUse || `Use for ${agentId} related tasks`}
model: ${model}
color: ${color}
---

You are **${agent.name || agentId}**, ${agent.title || agentId}. ${persona.identity || `Specialized in ${agentId} workflows`}

## Activation Protocol

**CRITICAL**: Read the complete YAML configuration below — it defines your entire persona, capabilities, and workflows.

`;

    // Add activation instructions (only if they exist and are meaningful)
    if (agentData.activation_instructions && Array.isArray(agentData.activation_instructions)) {
      content += `**Startup Sequence**:\n`;
      agentData.activation_instructions.forEach((instruction, index) => {
        content += `${index + 1}. ${instruction}\n`;
      });
      content += `\n`;
    }

    // The YAML block is the single source of truth
    content += `## Complete Agent Configuration

The following YAML contains your complete persona definition, including:
- Core principles and workflow rules
- Available commands and their specifications
- Dependencies (tasks, templates, checklists, data)
- File resolution patterns
- Request resolution strategy

\`\`\`yaml
${cleanedYaml}
\`\`\`

`;

    // Only add CRITICAL highlights that aren't obvious from YAML
    const criticalNotes = this.generateCriticalNotes(agentData, agentId);
    if (criticalNotes) {
      content += `## Critical Reminders\n\n${criticalNotes}\n`;
    }

    // Add quick reference for commands (just the list, details are in YAML)
    if (agentData.commands && Object.keys(agentData.commands).length > 0) {
      content += `## Quick Command Reference\n\n`;
      content += `Type \`*help\` to see the full command list. Key commands:\n`;
      
      const commandNames = Object.keys(agentData.commands).slice(0, 5); // Top 5 commands
      commandNames.forEach(cmdName => {
        if (cmdName !== 'help' && cmdName !== 'exit') {
          const cmdConfig = agentData.commands[cmdName];
          const desc = typeof cmdConfig === 'object' ? cmdConfig.description : cmdConfig;
          if (desc) {
            content += `- \`*${cmdName}\` — ${desc}\n`;
          }
        }
      });
      content += `\n`;
    }

    content += `---\n\n**Stay in ${agent.name || agentId} mode until explicitly told to exit.**\n`;

    return content;
  }

  // Clean YAML content by removing redundant sections
  cleanYamlContent(yamlContent) {
    if (!yamlContent) return yamlContent;
    
    let cleaned = yamlContent;
    
    // Remove story_update_permissions section (it's in a separate data file)
    // Match the entire section including all nested content
    cleaned = cleaned.replace(/story_update_permissions:\s*\n(?:  \w+:\s*\n(?:    - [^\n]+\n)*)+/g, '');
    
    // Remove instruction_precedence section (overly complex, not needed)
    // Match both simple and complex formats
    cleaned = cleaned.replace(/instruction_precedence:\s*\n(?:  [\s\S]*?)(?=\n\w|\n$)/g, '');
    
    // Clean up multiple consecutive empty lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Trim trailing whitespace from each line
    cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
    
    // Trim overall
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  // Helper method to get cleaned YAML for IDE integrations
  getCleanedYamlForIDE(agentContent, rootReplacement = '.orchestrix-core') {
    const yamlContent = extractYamlFromAgent(agentContent);
    if (!yamlContent) return null;
    
    // Clean redundant sections
    const cleaned = this.cleanYamlContent(yamlContent);
    
    // Replace {root} placeholder
    return cleaned.replace(/\{root\}/g, rootReplacement);
  }

  // Generate only truly critical notes that need emphasis beyond YAML
  generateCriticalNotes(agentData, agentId) {
    const notes = [];
    
    // Agent-specific critical reminders
    const criticalReminders = {
      'dev': [
        '🔴 **Test Integrity**: NEVER modify test expectations to make tests pass — fix implementation instead',
        '📝 **Story Sections**: You may ONLY update Tasks/Subtasks checkboxes and Dev Agent Record section',
        '🚫 **No Draft Work**: Do NOT start implementation on Draft stories without explicit approval'
      ],
      'sm': [
        '🚫 **No Code**: You are NOT allowed to implement stories or modify code — EVER',
        '📊 **Quality Gate**: Stories MUST achieve >80% technical extraction completion rate',
        '✅ **Mandatory Check**: Execute assessment/sm-story-quality.md for EVERY story'
      ],
      'qa': [
        '📝 **Story Sections**: ONLY update QA Results section — never modify other sections',
        '🔍 **Focus**: Comprehensive validation including compilation, containers, functional, and integration testing',
        '♻️ **Refactoring**: Actively improve code quality, don\'t just report issues'
      ],
      'architect': [
        '🏗️ **Consistency**: Maintain architectural integrity across all designs',
        '⚖️ **Standards**: All reviews must enforce established patterns',
        '🎯 **Threshold**: Technical accuracy score must be ≥7/10'
      ]
    };
    
    const agentNotes = criticalReminders[agentId];
    if (agentNotes) {
      return agentNotes.join('\n');
    }
    
    // Generic critical notes based on workflow rules
    if (agentData.workflow_rules) {
      const criticalRules = agentData.workflow_rules.filter(rule => 
        typeof rule === 'string' && (
          rule.includes('NEVER') || 
          rule.includes('MUST') || 
          rule.includes('CRITICAL') ||
          rule.includes('HALT')
        )
      );
      
      if (criticalRules.length > 0) {
        return criticalRules.slice(0, 3).map(rule => `⚠️ ${rule}`).join('\n');
      }
    }
    
    return '';
  }

  // 获取占位符的有意义默认值
  getPlaceholderDefaults(agentId) {
    const agentTitle = agentId.charAt(0).toUpperCase() + agentId.slice(1);
    
    return {
      '{AGENT_TITLE}': agentTitle,
      '{AGENT_NAME}': agentTitle,
      '{AGENT_ROLE}': 'AI Assistant',
      '{PRIMARY_USE_CASES}': 'general assistance and task execution',
      '{MANDATORY_TRIGGERS}': 'user requests assistance',
      '{COMPLETE_TOOLS_LIST}': 'Read, Write',
      '{AGENT_SPECIFIC_STARTUP}': '3. Load relevant project context\n4. Prepare for task execution',
      '{AGENT_STYLE}': 'Professional',
      '{AGENT_IDENTITY}': `You are a ${agentTitle} specialized in Orchestrix workflows`,
      '{AGENT_FOCUS}': 'Execute tasks efficiently and follow Orchestrix standards',
      '{CORE_PRINCIPLES_LIST}': '- Follow Orchestrix workflows precisely\n- Maintain quality standards\n- Execute commands with precision',
      '{CRITICAL_CONSTRAINTS_SECTION}': '',
      '{COMMANDS_WITH_DESCRIPTIONS}': '- help: Show available commands\n- exit: Exit agent mode',
      '{COMPLEX_COMMANDS_SECTION}': '',
      '{WORKFLOW_SECTIONS}': '## Standard Workflow\n\n1. Understand user request\n2. Execute appropriate action\n3. Provide clear feedback',
      '{DEPENDENCY_MAPPING}': 'Dependencies resolve to .orchestrix-core/{type}/{filename}',
      '{PERMISSIONS_SECTION}': '',
      '{QUALITY_SECTION}': '## Quality Standards\n\n- Maintain consistency with project documentation\n- Follow established patterns and conventions\n- Validate all changes before completion',
      '{CONTEXT_DISCOVERY_STEPS}': '1. Check .orchestrix-core/ directory structure\n2. Load relevant configuration files\n3. Understand current project state',
      '{PERFORMANCE_GUIDELINES}': '- Use grep/find for file discovery\n- Load files only when needed\n- Avoid loading entire directories',
      '{AGENT_CLOSING_REMINDER}': `Stay in ${agentTitle} mode until explicitly told to exit`
    };
  }

  // 使用 js-yaml 进行健壮的 YAML 解析
  extractAgentMetadataRobust(agentContent, agentId) {
    // Handle both YAML files and MD files with YAML blocks
    let yamlContent;
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      yamlContent = agentContent;
    } else {
      // MD file with YAML block - extract it
      yamlContent = extractYamlFromAgent(agentContent);
    }
    if (!yamlContent) return this.getDefaultMetadata(agentId);
    
    try {
      const parsed = yaml.load(yamlContent);
      const metadata = {
        agent: parsed.agent || {},
        persona: parsed.persona || {},
        core_principles: parsed.core_principles || parsed.persona?.core_principles || [],
        commands: parsed.commands || [],
        dependencies: parsed.dependencies || {},
        activation_instructions: parsed['activation-instructions'] || [],
        customization: parsed.agent?.customization || [],
        tools: parsed.agent?.tools || this.getAgentPermissions(agentId),
        // Fallback values
        name: parsed.agent?.name || agentId,
        title: parsed.agent?.title || agentId.charAt(0).toUpperCase() + agentId.slice(1),
        role: parsed.persona?.role || 'AI Assistant',
        style: parsed.persona?.style || 'Professional',
        // Claude Code specific fields
        model: this.getAgentModel(agentId),
        color: this.getAgentColor(agentId)
      };
      
      // Merge model and color into agent object for template access
      metadata.agent.model = metadata.model;
      metadata.agent.color = metadata.color;
      
      return metadata;
    } catch (error) {
      this._log(console.warn, `YAML parsing failed for ${agentId}: ${error.message}, falling back to regex extraction`);
      return this.extractAgentMetadata(agentContent); // Fallback to regex method
    }
  }

  // 获取默认元数据结构
  getDefaultMetadata(agentId) {
    const title = agentId.charAt(0).toUpperCase() + agentId.slice(1);
    const metadata = {
      agent: {
        name: title,
        title: title,
        id: agentId,
        whenToUse: 'general assistance and task execution',
        tools: this.getAgentPermissions(agentId).join(', '),
        model: this.getAgentModel(agentId),
        color: this.getAgentColor(agentId)
      },
      persona: {
        role: 'AI Assistant',
        style: 'Professional',
        identity: `You are a ${title} specialized in Orchestrix workflows`,
        focus: 'Execute tasks efficiently and follow Orchestrix standards',
        core_principles: [
          'Follow Orchestrix workflows precisely',
          'Maintain quality standards',
          'Execute commands with precision'
        ]
      },
      name: title,
      title: title,
      role: 'AI Assistant',
      style: 'Professional',
      core_principles: [
        'Follow Orchestrix workflows precisely',
        'Maintain quality standards',
        'Execute commands with precision'
      ],
      activation_instructions: [],
      commands: [],
      dependencies: {},
      customization: [],
      tools: this.getAgentPermissions(agentId),
      model: this.getAgentModel(agentId),
      color: this.getAgentColor(agentId)
    };
    return metadata;
  }
  
  // Get recommended model for each agent type
  getAgentModel(agentId) {
    const modelMap = {
      'orchestrix-master': 'opus',
      'orchestrix-orchestrator': 'opus',
      'qa': 'opus',
      'sm': 'opus',
      'architect': 'sonnet',
      'analyst': 'sonnet',
      'pm': 'sonnet',
      'dev': 'sonnet-4.5',
      'po': 'sonnet',
      'ux-expert': 'sonnet',
      'decision-evaluator': 'sonnet'
    };
    return modelMap[agentId] || 'sonnet';
  }
  
  // Get color for each agent type
  getAgentColor(agentId) {
    const colorMap = {
      'orchestrix-master': 'purple',
      'orchestrix-orchestrator': 'pink',
      'qa': 'red',
      'sm': 'orange',
      'architect': 'cyan',
      'analyst': 'blue',
      'pm': 'green',
      'dev': 'teal',
      'po': 'yellow',
      'ux-expert': 'magenta',
      'decision-evaluator': 'indigo'
    };
    return colorMap[agentId] || 'blue';
  }

  // 增强的metadata提取，确保捕获所有信息
  extractCompleteAgentMetadata(agentContent, agentId) {
    // 使用健壮的 YAML 解析
    const metadata = this.extractAgentMetadataRobust(agentContent, agentId);
    
    // Handle both YAML files and MD files with YAML blocks
    let yamlContent;
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      yamlContent = agentContent;
    } else {
      // MD file with YAML block - extract it
      yamlContent = extractYamlFromAgent(agentContent);
    }
    
    // 特定 agent 的额外信息提取 (如果需要特殊处理)
    if (agentId === 'dev' && metadata.testIntegrityRules === undefined && yamlContent) {
      const testRulesMatch = yamlContent.match(/test-integrity-rules:\s*([\s\S]*?)(?=\n\s{4}\w|$)/);
      if (testRulesMatch) {
        metadata.testIntegrityRules = this.parseListSection(testRulesMatch[1]);
      }
    }
    
    if (agentId === 'qa' && metadata.storyFilePermissions === undefined && yamlContent) {
      const storyPermMatch = yamlContent.match(/story-file-permissions:\s*([\s\S]*?)(?=\ncommands:|$)/);
      if (storyPermMatch) {
        metadata.storyFilePermissions = this.parseListSection(storyPermMatch[1]);
      }
    }
    
    return metadata;
  }

// ============= 辅助方法集合 =============

  // Helper method to get YAML content from both pure YAML files and MD files with YAML blocks
  getYamlContent(agentContent) {
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      return agentContent;
    } else {
      // MD file with YAML block - extract it
      const { extractYamlFromAgent } = require('../../../tools/lib/yaml-utils');
      return extractYamlFromAgent(agentContent);
    }
  }

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
  let principles = metadata.core_principles || metadata.persona?.core_principles || [];
  
  // 确保 principles 是数组并且包含字符串
  if (!Array.isArray(principles)) {
    principles = [];
  }
  
  // 过滤出字符串类型的原则
  principles = principles.filter(p => typeof p === 'string');
  
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
      'MANDATORY: Execute assessment/sm-story-quality.md during story creation'
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
  let commands = metadata.commands || [];
  
  // 确保 commands 是数组
  if (!Array.isArray(commands)) {
    // 如果是对象，转换为数组
    if (typeof commands === 'object') {
      commands = Object.entries(commands).map(([name, config]) => ({
        name: name,
        description: typeof config === 'string' ? config : (config.description || `Execute ${name} command`)
      }));
    } else {
      commands = [];
    }
  }
  
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
  
  // 提取完整的 YAML 内容用于详细分析
  const { extractYamlFromAgent } = require('../../lib/yaml-utils');
  const yamlContent = extractYamlFromAgent(agentContent);
  if (!yamlContent) return section;
  
  try {
    const yaml = require('js-yaml');
    const yamlData = yaml.load(yamlContent);
    
    if (yamlData && yamlData.commands) {
      // 查找复杂的命令定义（包含子配置的命令）
      const complexCommands = [];
      
      for (const [key, value] of Object.entries(yamlData.commands)) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          complexCommands.push({ name: key, config: value });
        }
      }
      
      if (complexCommands.length > 0) {
        section += '\n### Detailed Command Specifications\n\n';
        
        for (const cmd of complexCommands) {
          section += `**${cmd.name} command**:\n`;
          section += this.formatComplexCommand(cmd.config);
          section += '\n';
        }
      }
    }
  } catch (error) {
    // 回退到原始的正则表达式方法
    if (agentId === 'dev') {
      const developStoryMatch = agentContent.match(/develop-story:[\s\S]*?(?=\n\s{0,2}\w|\ndependencies:|$)/);
      if (developStoryMatch) {
        section += '\n### Detailed Command Specifications\n\n';
        section += '**develop-story command**:\n';
        section += this.formatDevelopStoryCommand(developStoryMatch[0]);
      }
    }
  }
  
  return section;
}

// 格式化复杂命令配置
formatComplexCommand(config) {
  let formatted = '';
  
  for (const [key, value] of Object.entries(config)) {
    formatted += `\n**${key}**:\n`;
    
    if (Array.isArray(value)) {
      // 处理数组类型的配置
      for (const item of value) {
        if (typeof item === 'string') {
          formatted += `- ${item}\n`;
        } else if (typeof item === 'object') {
          // 处理嵌套对象
          for (const [subKey, subValue] of Object.entries(item)) {
            formatted += `- **${subKey}**: ${subValue}\n`;
          }
        }
      }
    } else if (typeof value === 'object') {
      // 处理对象类型的配置
      for (const [subKey, subValue] of Object.entries(value)) {
        formatted += `- **${subKey}**: ${subValue}\n`;
      }
    } else {
      // 处理简单字符串值
      formatted += `${value}\n`;
    }
    formatted += '\n';
  }
  
  return formatted;
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
  let sections = '';
  
  // 首先尝试从原始 YAML 中提取完整的工作流信息
  const { extractYamlFromAgent } = require('../../lib/yaml-utils');
  const yamlContent = extractYamlFromAgent(agentContent);
  
  if (yamlContent) {
    try {
      const yaml = require('js-yaml');
      const yamlData = yaml.load(yamlContent);
      
      // 提取核心原则
      if (yamlData.core_principles) {
        sections += '### Core Principles\n\n';
        if (Array.isArray(yamlData.core_principles)) {
          for (const principle of yamlData.core_principles) {
            sections += `- ${principle}\n`;
          }
        } else if (typeof yamlData.core_principles === 'object') {
          for (const [key, value] of Object.entries(yamlData.core_principles)) {
            sections += `**${key}**: ${value}\n`;
          }
        }
        sections += '\n';
      }
      
      // 提取激活说明
      if (yamlData['activation-instructions']) {
        sections += '### Activation Instructions\n\n';
        for (const instruction of yamlData['activation-instructions']) {
          sections += `${instruction}\n\n`;
        }
      }
      
      // 如果有复杂的命令配置，在这里处理
      if (yamlData.commands) {
        for (const [cmdName, cmdConfig] of Object.entries(yamlData.commands)) {
          if (typeof cmdConfig === 'object' && !Array.isArray(cmdConfig)) {
            sections += `### ${cmdName} Command Workflow\n\n`;
            sections += this.formatComplexCommand(cmdConfig);
          }
        }
      }
      
    } catch (error) {
      this._log(console.warn, `Failed to parse YAML for workflow sections: ${error.message}`);
    }
  }
  
  // 如果没有从 YAML 中提取到内容，使用基于 agent ID 的生成器
  if (!sections) {
    const workflowSections = [];
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
      workflowSections.push(generator());
    }
    
    // 添加通用工作流（如果有create-doc命令）
    if (metadata.commands?.find(c => c.name === 'create-doc')) {
      workflowSections.push(this.generateCreateDocWorkflow(metadata));
    }
    
    sections = workflowSections.filter(s => s).join('\n\n');
  }
  
  return sections;
}

// ============= YAML 格式化函数 =============

// 格式化 YAML 激活说明
formatYamlActivationInstructions(metadata) {
  if (metadata.activation_instructions && Array.isArray(metadata.activation_instructions)) {
    return metadata.activation_instructions
      .filter(instruction => typeof instruction === 'string')
      .map(instruction => `  - ${instruction}`)
      .join('\n');
  }
  
  return `  - STEP 1: Read THIS ENTIRE FILE — it contains your complete persona definition.
  - STEP 2: Adopt the persona defined in the 'agent' and 'persona' sections below.
  - STEP 3: Greet the user with your name/role and mention the \`*help\` command.
  - STEP 4: HALT to await user-requested assistance or commands.`;
}

// 格式化 YAML 自定义配置
formatYamlCustomization(metadata) {
  if (metadata.agent?.customization && Array.isArray(metadata.agent.customization)) {
    return metadata.agent.customization
      .map(item => `    - ${item}`)
      .join('\n');
  }
  
  return `    - Follow Orchestrix framework guidelines
    - Maintain consistency with project standards`;
}

// 格式化 YAML 核心原则
formatYamlCorePrinciples(metadata) {
  if (metadata.core_principles && Array.isArray(metadata.core_principles)) {
    return metadata.core_principles
      .filter(principle => typeof principle === 'string')
      .map(principle => `  - ${principle}`)
      .join('\n');
  }
  
  return `  - Follow Orchestrix workflows precisely
  - Maintain quality standards
  - Execute commands with precision`;
}

// 格式化 YAML 命令（保持原始结构）
formatYamlCommands(metadata, yamlContent) {
  if (yamlContent) {
    try {
      const yaml = require('js-yaml');
      const yamlData = yaml.load(yamlContent);
      
      if (yamlData && yamlData.commands) {
        // 将命令对象转换为 YAML 格式的字符串，保持原始结构
        const commandsYaml = yaml.dump(yamlData.commands, { indent: 2 });
        // 为每行添加适当的缩进
        return commandsYaml.split('\n')
          .map(line => line ? `  ${line}` : line)
          .join('\n')
          .trim();
      }
    } catch (error) {
      this._log(console.warn, `Failed to parse commands YAML: ${error.message}`);
    }
  }
  
  // 回退到简单格式
  return `  help: Show numbered list of available commands
  exit: Exit agent mode`;
}

// 格式化 YAML 依赖关系
formatYamlDependencies(metadata) {
  if (metadata.dependencies) {
    try {
      const yaml = require('js-yaml');
      const dependenciesYaml = yaml.dump(metadata.dependencies, { indent: 2 });
      return dependenciesYaml.split('\n')
        .map(line => line ? `  ${line}` : line)
        .join('\n')
        .trim();
    } catch (error) {
      this._log(console.warn, `Failed to format dependencies YAML: ${error.message}`);
    }
  }
  
  return `  tasks: []
  templates: []
  checklists: []`;
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
6. Run assessment/sm-story-quality.md
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

  if (deps.decisions && deps.decisions.length > 0) {
    // Note: decisions are now flattened into data/ with 'decisions-' prefix
    sections.push(`**Decisions**:\n${deps.decisions.map(d => `- \`${d}\` → \`.orchestrix-core/data/${d}\``).join('\n')}`);
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
- assessment/sm-story-quality.md for EVERY story
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

  // 生成增强模板的占位符替换值（保持原始YAML结构）
  async generateSimpleReplacements(agentId, metadata, agentContent) {
    const { extractYamlFromAgent } = require('../../lib/yaml-utils');
    
    // Handle both YAML files and MD files with YAML blocks
    let yamlContent;
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      yamlContent = agentContent;
    } else {
      // MD file with YAML block - extract it
      yamlContent = extractYamlFromAgent(agentContent);
    }
    
    return {
      '{AGENT_ID}': agentId,
      '{ AGENT_ID }': agentId, // Template uses spaces
      '{AGENT_TITLE}': metadata.agent?.title || agentId,
      '{AGENT_NAME}': metadata.agent?.name || agentId,
      '{AGENT_ROLE_DESCRIPTION}': this.generateRoleDescription(metadata, agentId),
      '{AGENT_DESCRIPTION}': metadata.agent?.whenToUse || `Use for ${agentId} related tasks`,
      '{AGENT_TOOLS}': this.getCompleteToolsList(metadata, agentId),
      '{ AGENT_TOOLS }': this.getCompleteToolsList(metadata, agentId), // Template uses spaces
      '{ORIGINAL_YAML_CONTENT}': yamlContent || '',
      '{ ORIGINAL_YAML_CONTENT }': yamlContent || '', // Template uses spaces
      '{COMMANDS_SUMMARY}': this.generateCommandsSummary(metadata),
      '{DEPENDENCIES_SUMMARY}': this.generateDependenciesSummary(metadata),
      '{CORE_PRINCIPLES_LIST}': this.formatCorePrinciplesList(metadata),
      '{SPECIALIZED_CAPABILITIES}': this.generateSpecializedCapabilities(metadata, agentId)
    };
  }

  async generateOptimizedReplacements(agentId, metadata, agentContent) {
    const { extractYamlFromAgent } = require('../../lib/yaml-utils');
    
    // Handle both YAML files and MD files with YAML blocks
    let yamlContent;
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      yamlContent = agentContent;
    } else {
      // MD file with YAML block - extract it
      yamlContent = extractYamlFromAgent(agentContent);
    }
    
    return {
      '{AGENT_ID}': agentId,
      '{AGENT_TITLE}': metadata.agent?.title || agentId,
      '{AGENT_NAME}': metadata.agent?.name || agentId,
      '{AGENT_ROLE}': metadata.persona?.role || 'AI Assistant',
      '{AGENT_DESCRIPTION}': metadata.agent?.whenToUse || `Use for ${agentId} related tasks`,
      '{AGENT_TOOLS}': this.getCompleteToolsList(metadata, agentId),
      '{AGENT_FOCUS}': metadata.persona?.focus || 'Execute tasks efficiently',
      '{AGENT_STYLE}': metadata.persona?.style || 'Professional and efficient',
      '{AGENT_ROLE_DESCRIPTION}': this.generateRoleDescription(metadata, agentId),
      '{ORIGINAL_YAML_CONTENT}': yamlContent || '',
      '{COMMANDS_SUMMARY}': this.generateEnhancedCommandsSummary(metadata),
      '{ORCHESTRIX_ASSETS_SUMMARY}': this.generateOrchestrixAssetsSummary(metadata),
      '{WORKFLOW_INTEGRATION_GUIDE}': this.generateWorkflowIntegrationGuide(metadata, agentId),
      '{CORE_PRINCIPLES_LIST}': this.formatCorePrinciplesList(metadata),
      '{QUALITY_STANDARDS}': this.generateQualityStandards(metadata, agentId),
      '{PERFORMANCE_GUIDELINES}': this.generatePerformanceGuidelines(metadata),
      '{PRE_EXECUTION_CHECKLIST}': this.generatePreExecutionChecklist(metadata, agentId),
      '{TASK_EXECUTION_PROTOCOL}': this.generateTaskExecutionProtocol(metadata, agentId),
      '{COMPLETION_CRITERIA}': this.generateCompletionCriteria(metadata, agentId),
      '{COLLABORATION_GUIDELINES}': this.generateCollaborationGuidelines(metadata, agentId),
      '{SPECIALIZED_CAPABILITIES}': this.generateSpecializedCapabilities(metadata, agentId),
      '{TOOL_UTILIZATION_GUIDE}': this.generateToolUtilizationGuide(metadata, agentId),
      '{INTEGRATION_PATTERNS}': this.generateIntegrationPatterns(metadata, agentId),
      '{REQUEST_RESOLUTION_EXAMPLES}': this.generateRequestResolutionExamples(metadata, agentId)
    };
  }

  // 生成角色描述
  generateRoleDescription(metadata, agentId) {
    const identity = metadata.persona?.identity || '';
    const focus = metadata.persona?.focus || '';
    if (identity && focus) {
      return `${identity} Your primary focus is ${focus.toLowerCase()}.`;
    }
    return `Specialized in ${agentId} workflows within the Orchestrix framework.`;
  }

  // 生成增强的命令摘要
  generateEnhancedCommandsSummary(metadata) {
    if (!metadata.commands || !Array.isArray(metadata.commands)) {
      return 'Use `*help` to see available commands';
    }
    
    return metadata.commands
      .map(cmd => {
        if (typeof cmd === 'string') {
          return `- \`*${cmd}\``;
        } else if (typeof cmd === 'object') {
          const cmdName = Object.keys(cmd)[0];
          const cmdDesc = cmd[cmdName];
          if (typeof cmdDesc === 'string') {
            return `- \`*${cmdName}\`: ${cmdDesc.length > 80 ? cmdDesc.substring(0, 80) + '...' : cmdDesc}`;
          } else {
            return `- \`*${cmdName}\`: Advanced workflow (see YAML configuration for details)`;
          }
        }
        return '';
      })
      .filter(line => line)
      .join('\n');
  }

  // 生成 Orchestrix 资产摘要
  generateOrchestrixAssetsSummary(metadata) {
    let summary = '';
    
    if (metadata.dependencies?.tasks && Array.isArray(metadata.dependencies.tasks)) {
      summary += `**Available Tasks**: ${metadata.dependencies.tasks.join(', ')}\n`;
    }
    
    if (metadata.dependencies?.templates && Array.isArray(metadata.dependencies.templates)) {
      summary += `**Document Templates**: ${metadata.dependencies.templates.join(', ')}\n`;
    }
    
    if (metadata.dependencies?.checklists && Array.isArray(metadata.dependencies.checklists)) {
      summary += `**Quality Checklists**: ${metadata.dependencies.checklists.join(', ')}\n`;
    }
    
    if (metadata.dependencies?.data && Array.isArray(metadata.dependencies.data)) {
      summary += `**Reference Data**: ${metadata.dependencies.data.join(', ')}\n`;
    }
    
    return summary || 'Standard Orchestrix framework assets available';
  }

  // 生成工作流集成指南
  generateWorkflowIntegrationGuide(metadata, agentId) {
    return `When executing commands:
1. **Command Recognition**: All commands require \`*\` prefix (e.g., \`*help\`)
2. **Task Execution**: Load and execute tasks from \`.orchestrix-core/tasks/\`
3. **Template Usage**: Generate documents using \`.orchestrix-core/templates/\`
4. **Quality Validation**: Run checklists from \`.orchestrix-core/checklists/\`
5. **Data Reference**: Access knowledge from \`.orchestrix-core/data/\`

**Pattern Matching**: Match user requests to available commands and dependencies flexibly.`;
  }

  // 生成质量标准
  generateQualityStandards(metadata, agentId) {
    const standards = [
      '- Follow Orchestrix framework guidelines and conventions',
      '- Execute all required checklists before marking tasks complete',
      '- Maintain consistency with project standards defined in core-config.yaml',
      '- Document all decisions and changes appropriately'
    ];
    
    // 添加特定于代理的标准
    if (agentId === 'dev') {
      standards.push('- Never modify test expectations to make tests pass');
      standards.push('- All code changes must pass linting and testing validations');
    } else if (agentId === 'qa') {
      standards.push('- Comprehensive testing coverage required');
      standards.push('- All quality gates must be satisfied');
    }
    
    return standards.join('\n');
  }

  // 生成执行前检查清单
  generatePreExecutionChecklist(metadata, agentId) {
    return `- [ ] Confirm task requirements and acceptance criteria
- [ ] Check project standards in core-config.yaml  
- [ ] Identify required Orchestrix assets (tasks/templates/checklists)
- [ ] Verify user permissions and authorization
- [ ] Load necessary dependency files`;
  }

  // 生成任务执行协议
  generateTaskExecutionProtocol(metadata, agentId) {
    return `1. **Parse Request**: Understand user intent and match to available commands
2. **Load Dependencies**: Access required tasks, templates, and checklists  
3. **Execute Workflow**: Follow task instructions exactly as written
4. **Validate Quality**: Run applicable checklists and validations
5. **Report Progress**: Update status and document decisions
6. **Confirm Completion**: Ensure all acceptance criteria are met`;
  }

  // 生成完成标准
  generateCompletionCriteria(metadata, agentId) {
    const criteria = [
      '- All task steps completed successfully',
      '- Required checklists passed',
      '- Documentation updated appropriately',
      '- Quality standards maintained'
    ];
    
    if (agentId === 'dev') {
      criteria.push('- All tests passing');
      criteria.push('- Code review ready');
    }
    
    return criteria.join('\n');
  }

  // 生成协作指南
  generateCollaborationGuidelines(metadata, agentId) {
    return `**Handoff Protocol**: Use story files and standardized status reporting for agent coordination
**Conflict Resolution**: Defer to agent with primary responsibility for the task domain
**Escalation**: Request human input when facing ambiguous requirements or blockers`;
  }

  // 生成专业能力
  generateSpecializedCapabilities(metadata, agentId) {
    const capabilities = metadata.agent?.customization || [];
    if (Array.isArray(capabilities) && capabilities.length > 0) {
      return capabilities.map(cap => `- ${cap}`).join('\n');
    }
    return `- Expert in ${agentId} domain workflows
- Orchestrix framework integration specialist
- Quality-focused execution methodology`;
  }

  // 生成工具利用指南
  generateToolUtilizationGuide(metadata, agentId) {
    const tools = this.getCompleteToolsList(metadata, agentId).split(', ');
    return tools.map(tool => `- **${tool}**: Utilized for ${agentId} specific operations`).join('\n');
  }

  // 生成集成模式
  generateIntegrationPatterns(metadata, agentId) {
    return `**Task Integration**: Execute Orchestrix tasks as atomic, reusable workflows
**Template Integration**: Generate consistent documentation using standard templates  
**Checklist Integration**: Ensure quality through systematic validation processes
**Data Integration**: Leverage centralized knowledge base for informed decisions`;
  }

  // 生成请求解析示例
  generateRequestResolutionExamples(metadata, agentId) {
    const examples = [];
    
    if (metadata.dependencies?.tasks) {
      examples.push(`- "create documentation" → \`*create-doc\` → tasks/create-doc.md + relevant templates`);
    }
    
    if (agentId === 'dev') {
      examples.push(`- "implement story" → \`*develop-story\` → tasks/implement-story-auto.md workflow`);
    } else if (agentId === 'qa') {
      examples.push(`- "validate this" → \`*review\` → tasks/review-story.md + validation checklists`);
    }
    
    examples.push(`- "help me with..." → \`*help\` → show available commands and guidance`);
    
    return examples.join('\n');
  }

  async generateCleanReplacements(agentId, metadata, agentContent) {
    const { extractYamlFromAgent } = require('../../lib/yaml-utils');
    const yamlContent = extractYamlFromAgent(agentContent);
    
    return {
      '{AGENT_ID}': agentId,
      '{AGENT_TITLE}': metadata.agent?.title || agentId,
      '{AGENT_NAME}': metadata.agent?.name || agentId,
      '{AGENT_ROLE}': metadata.persona?.role || 'AI Assistant',
      '{AGENT_DESCRIPTION}': metadata.agent?.whenToUse || `Use for ${agentId} related tasks`,
      '{AGENT_TOOLS}': this.getCompleteToolsList(metadata, agentId),
      '{AGENT_FOCUS}': metadata.persona?.focus || 'Execute tasks efficiently',
      '{ORIGINAL_YAML_CONTENT}': yamlContent || '',
      '{COMMANDS_SUMMARY}': this.generateCommandsSummary(metadata),
      '{DEPENDENCIES_SUMMARY}': this.generateDependenciesSummary(metadata),
      '{CORE_PRINCIPLES_LIST}': this.formatCorePrinciplesList(metadata)
    };
  }

  // 生成简洁的命令摘要
  generateCommandsSummary(metadata) {
    if (!metadata.commands || !Array.isArray(metadata.commands)) {
      return 'No commands configured';
    }
    
    return metadata.commands
      .map(cmd => {
        if (typeof cmd === 'string') {
          return `- \`*${cmd}\``;
        } else if (typeof cmd === 'object') {
          const cmdName = Object.keys(cmd)[0];
          const cmdDesc = cmd[cmdName];
          if (typeof cmdDesc === 'string') {
            return `- \`*${cmdName}\`: ${cmdDesc.length > 100 ? cmdDesc.substring(0, 100) + '...' : cmdDesc}`;
          } else {
            return `- \`*${cmdName}\`: Complex command (see YAML configuration)`;
          }
        }
        return '';
      })
      .filter(line => line)
      .join('\n');
  }

  // 生成简洁的依赖摘要
  generateDependenciesSummary(metadata) {
    if (!metadata.dependencies) {
      return 'No dependencies configured';
    }
    
    let summary = '';
    if (metadata.dependencies.tasks && Array.isArray(metadata.dependencies.tasks)) {
      summary += `**Tasks**: ${metadata.dependencies.tasks.join(', ')}\n`;
    }
    if (metadata.dependencies.templates && Array.isArray(metadata.dependencies.templates)) {
      summary += `**Templates**: ${metadata.dependencies.templates.join(', ')}\n`;
    }
    if (metadata.dependencies.checklists && Array.isArray(metadata.dependencies.checklists)) {
      summary += `**Checklists**: ${metadata.dependencies.checklists.join(', ')}\n`;
    }
    
    return summary || 'No dependencies configured';
  }

  // 格式化核心原则列表
  formatCorePrinciplesList(metadata) {
    if (!metadata.core_principles || !Array.isArray(metadata.core_principles)) {
      return '- Follow Orchestrix framework guidelines';
    }
    
    return metadata.core_principles
      .filter(principle => typeof principle === 'string')
      .map(principle => `- ${principle}`)
      .join('\n');
  }

  async generateEnhancedReplacements(agentId, metadata, agentContent) {
    const { extractYamlFromAgent } = require('../../lib/yaml-utils');
    const yamlContent = extractYamlFromAgent(agentContent);
    
    return {
      '{AGENT_ID}': agentId,
      '{AGENT_TITLE}': metadata.agent?.title || agentId,
      '{AGENT_NAME}': metadata.agent?.name || agentId,
      '{AGENT_ROLE}': metadata.persona?.role || 'AI Assistant',
      '{AGENT_DESCRIPTION}': metadata.agent?.whenToUse || `Use for ${agentId} related tasks`,
      '{AGENT_TOOLS}': this.getCompleteToolsList(metadata, agentId),
      '{AGENT_ICON}': metadata.agent?.icon || '🤖',
      '{AGENT_WHEN_TO_USE}': metadata.agent?.whenToUse || `Use for ${agentId} related tasks`,
      '{AGENT_STYLE}': metadata.persona?.style || 'Professional',
      '{AGENT_IDENTITY}': metadata.persona?.identity || '',
      '{AGENT_FOCUS}': metadata.persona?.focus || '',
      '{ACTIVATION_INSTRUCTIONS}': this.formatYamlActivationInstructions(metadata),
      '{AGENT_CUSTOMIZATION}': this.formatYamlCustomization(metadata),
      '{CORE_PRINCIPLES}': this.formatYamlCorePrinciples(metadata),
      '{COMMANDS_YAML}': this.formatYamlCommands(metadata, yamlContent),
      '{DEPENDENCIES_YAML}': this.formatYamlDependencies(metadata),
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

  // 生成所有占位符替换值（原始版本）
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
    // 首先尝试从 metadata 中获取自定义启动步骤
    if (metadata.startup_steps && metadata.startup_steps.length > 0) {
      return metadata.startup_steps.join('\n');
    }
    
    // 如果 activation_instructions 中有启动步骤
    if (metadata.activation_instructions && metadata.activation_instructions.length > 0) {
      const startupInstructions = metadata.activation_instructions
        .filter(instruction => typeof instruction === 'string' && (instruction.toLowerCase().includes('load') || instruction.toLowerCase().includes('check')))
        .slice(0, 3); // 取前3个相关指令
      
      if (startupInstructions.length > 0) {
        return startupInstructions.map((instruction, index) => `${index + 3}. ${instruction}`).join('\n');
      }
    }
    
    // 回退到硬编码的agent特定步骤
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
    let constraints = [];
    
    // 确保 core_principles 存在并且是数组，且每个元素都是字符串
    if (metadata.core_principles && Array.isArray(metadata.core_principles)) {
      constraints = metadata.core_principles.filter(p => 
        typeof p === 'string' && (p.includes('NOT') || p.includes('NEVER') || p.includes('ONLY') || p.includes('MUST'))
      );
    }
    
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
        'MANDATORY: Execute assessment/sm-story-quality.md during story creation'
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
6. Run assessment/sm-story-quality.md
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
  - assessment/sm-story-quality.md for EVERY story
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
  


  extractAgentMetadata(agentContent) {
    // Handle both YAML files and MD files with YAML blocks
    let yamlContent;
    if (agentContent.trim().startsWith('agent:')) {
      // Pure YAML file - use content directly
      yamlContent = agentContent;
    } else {
      // MD file with YAML block - extract it
      yamlContent = extractYamlFromAgent(agentContent);
    }
    
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

    if (yamlContent) {
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
    
    // Set fallback values with safe property access
    metadata.name = metadata.agent?.name || 'Agent';
    metadata.title = metadata.agent?.title || 'AI Agent';
    metadata.role = metadata.persona?.role || 'Assistant';
    metadata.style = metadata.persona?.style || 'Professional';
    metadata.core_principles = metadata.persona?.core_principles || metadata.core_principles || [];
    
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
    let content = `# ${metadata.agent?.title || metadata.title || agentId}\n\n`;
    
    // Single unified activation protocol (eliminates redundancy)
    content += `## AGENT ACTIVATION PROTOCOL\n\n`;
    content += `**CRITICAL INSTRUCTION:** You are now **${metadata.agent?.name || agentId}**, ${(metadata.persona?.role || 'AI Agent').toLowerCase()} from the Orchestrix framework. Adopt this complete persona immediately and execute all instructions below`;
    if (metadata.persona?.style) {
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
        this._log(console.log, chalk.yellow("Found existing .vscode/settings.json. Merging orchestrix settings..."));
      } catch (error) {
        this._log(console.warn, chalk.yellow("Could not parse existing settings.json. Creating new one."));
        existingSettings = {};
      }
    }
    
    // Use pre-configured settings if provided, otherwise prompt
    let configChoice;
    if (preConfiguredSettings && preConfiguredSettings.configChoice) {
      configChoice = preConfiguredSettings.configChoice;
      this._log(console.log, chalk.dim(`Using pre-configured GitHub Copilot settings: ${configChoice}`));
    } else {
      // Clear any previous output and add spacing to avoid conflicts with loaders
      this._log(console.log, '\n'.repeat(2));
      this._log(console.log, chalk.blue("🔧 Github Copilot Agent Settings Configuration"));
      this._log(console.log, chalk.dim("orchestrix works best with specific VS Code settings for optimal agent experience."));
      this._log(console.log, ''); // Add extra spacing
      
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
      this._log(console.log, chalk.yellow("⚠️  Skipping VS Code settings configuration."));
      this._log(console.log, chalk.dim("You can manually configure these settings in .vscode/settings.json:"));
      this._log(console.log, chalk.dim("  • chat.agent.enabled: true"));
      this._log(console.log, chalk.dim("  • chat.agent.maxRequests: 15"));
      this._log(console.log, chalk.dim("  • github.copilot.chat.agent.runTasks: true"));
      this._log(console.log, chalk.dim("  • chat.mcp.discovery.enabled: true"));
      this._log(console.log, chalk.dim("  • github.copilot.chat.agent.autoFix: true"));
      this._log(console.log, chalk.dim("  • chat.tools.autoApprove: false"));
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
      this._log(console.log, chalk.green("✓ Using recommended orchestrix defaults for Github Copilot settings"));
    } else {
      // Manual configuration
      this._log(console.log, chalk.blue("\n📋 Let's configure each setting for your preferences:"));
      
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
      
      this._log(console.log, chalk.green("✓ Custom settings configured"));
    }
    
    // Merge settings (existing settings take precedence to avoid overriding user preferences)
    const mergedSettings = { ...orchestrixSettings, ...existingSettings };
    
    // Write the updated settings
    await fileManager.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
    
    this._log(console.log, chalk.green("✓ VS Code workspace settings configured successfully"));
    this._log(console.log, chalk.dim("  Settings written to .vscode/settings.json:"));
    Object.entries(orchestrixSettings).forEach(([key, value]) => {
      this._log(console.log, chalk.dim(`  • ${key}: ${value}`));
    });
    this._log(console.log, chalk.dim(""));
    this._log(console.log, chalk.dim("You can modify these settings anytime in .vscode/settings.json"));
  }



  // 在 ide-setup.js 的最后添加一个测试方法
  async testSubagentGeneration(installDir) {
    this._log(console.log, chalk.blue('\n🧪 Testing Sub Agent Generation...'));
    
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
          'assessment/sm-story-quality.md',
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
        
        this._log(console.log, chalk.yellow(`\n  Testing ${testCase.agentId} sub agent...`));
        
        let testPassed = true;
        for (const element of testCase.requiredElements) {
          if (content.includes(element)) {
            this._log(console.log, chalk.green(`    ✓ Contains: "${element}"`));
          } else {
            this._log(console.log, chalk.red(`    ✗ Missing: "${element}"`));
            testPassed = false;
            allPassed = false;
          }
        }
        
        if (testPassed) {
          this._log(console.log, chalk.green(`  ✅ ${testCase.agentId} sub agent: PASSED`));
        } else {
          this._log(console.log, chalk.red(`  ❌ ${testCase.agentId} sub agent: FAILED`));
        }
        
      } catch (error) {
        this._log(console.log, chalk.red(`  ❌ Error reading ${testCase.agentId}: ${error.message}`));
        allPassed = false;
      }
    }
    
    if (allPassed) {
      this._log(console.log, chalk.green.bold('\n✅ All Sub Agent tests PASSED!'));
    } else {
      this._log(console.log, chalk.red.bold('\n❌ Some Sub Agent tests FAILED. Please review the output above.'));
    }
    
    return allPassed;
  }

  // Process structured template with {{field}} syntax and conditional blocks
  processStructuredTemplate(template, agentData, agentId) {
    let content = template;
    
    // First, process conditional blocks {{?field}}...{{/field}}
    content = this.processConditionalBlocks(content, agentData);
    
    // Then replace all remaining {{...}} patterns
    content = content.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      
      // Special handling for specific fields
      if (trimmedPath === 'state-machine.transitions[]') {
        return this.formatStateTransitions(agentData);
      } else if (trimmedPath === 'elicitation.generic-form[]') {
        return this.formatElicitationForm(agentData);
      } else if (trimmedPath === 'commands.role-specific[].detailed_specs') {
        return this.formatRoleSpecificCommandSpecs(agentData);
      } else if (trimmedPath === 'agent.persona') {
        return this.formatPersonaObject(agentData);
      } else if (trimmedPath === 'agent.customization[]') {
        return this.formatCustomizationArray(agentData);
      } else if (trimmedPath === 'commands.common[].command_line') {
        return this.formatCommandLines(agentData, 'commands.common');
      } else if (trimmedPath === 'commands.role-specific[].command_line') {
        return this.formatCommandLines(agentData, 'commands.role-specific');
      } else if (trimmedPath === 'request-resolution.examples[].example_line') {
        return this.formatRequestResolutionExamples(agentData);
      } else if (trimmedPath.includes('commands.') && trimmedPath.includes('[].')) {
        return this.formatCommandSpecs(trimmedPath, agentData);
      }
      
      const value = this.resolveTemplatePath(trimmedPath, agentData, agentId);
      // If value is empty or undefined, return empty string instead of the original template variable
      return value || '';
    });
    
    // Clean up any remaining empty sections
    content = this.cleanupEmptySections(content);
    
    return content;
  }
  
  // Resolve template path like "agent.name" or "commands.common[].name"
  resolveTemplatePath(path, data, agentId) {
    try {
      // Handle array notation like "agent.tools[]"
      if (path.endsWith('[]')) {
        const arrayPath = path.slice(0, -2);
        const arrayValue = this.getNestedValue(data, arrayPath);
        if (Array.isArray(arrayValue)) {
          // Format as comma-separated list for LLM efficiency
          return arrayValue.map(item => {
            if (typeof item === 'object' && item !== null) {
              // For objects, try to get a meaningful string representation
              return item.name || item.title || item.id || JSON.stringify(item);
            }
            return String(item);
          }).join(', ');
        }
        return '';
      }
      
      // Handle array index notation like "commands.common[].name"
      if (path.includes('[].')) {
        return this.resolveArrayTemplate(path, data);
      }
      
      // Handle conditional paths with | separator (fallback/default values)
      if (path.includes(' | ')) {
        const paths = path.split(' | ').map(p => p.trim());
        for (const p of paths) {
          // Check if this is a plain value (not a path)
          if (!p.includes('.') && !p.includes('[')) {
            // This is a default value, return it directly
            return p;
          }
          const value = this.resolveTemplatePath(p, data, agentId);
          if (value && value !== '') {
            return value;
          }
        }
        return '';
      }
      
      // Simple path resolution
      return this.getNestedValue(data, path) || '';
      
    } catch (error) {
      this._log(console.warn, `Template path resolution failed for "${path}": ${error.message}`);
      return `[${path}]`;
    }
  }
  
  // Resolve array template patterns
  resolveArrayTemplate(path, data) {
    const parts = path.split('[].'); 
    const arrayPath = parts[0];
    const itemPath = parts[1];
    
    const arrayValue = this.getNestedValue(data, arrayPath);
    if (!Array.isArray(arrayValue)) {
      return '';
    }
    
    return arrayValue.map(item => {
      return this.getNestedValue(item, itemPath) || '';
    }).filter(v => v).join('\n- ');
  }
  
  // Get nested value from object using dot notation
  getNestedValue(obj, path) {
    if (!obj || !path) return '';
    
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        const value = current[key];
        // Handle different value types
        if (Array.isArray(value)) {
          return value;
        } else if (typeof value === 'object' && value !== null) {
          return value;
        } else {
          return String(value);
        }
      }
      return '';
    }, obj);
  }

  // Special formatters for complex structures
  formatStateTransitions(agentData) {
    const transitions = this.getNestedValue(agentData, 'state-machine.transitions');
    if (!Array.isArray(transitions)) return '';
    
    return transitions.map(t => {
      let line = `From: ${t.from || ''}  To: ${t.to || ''}`;
      if (t.on) line += `  On: ${t.on}`;
      if (t.when) line += `  When: ${t.when}`;
      return `- ${line}`;
    }).join('\n');
  }
  
  formatElicitationForm(agentData) {
    const form = this.getNestedValue(agentData, 'elicitation.generic-form');
    if (!Array.isArray(form)) return '';
    
    return form.map(item => {
      if (typeof item === 'object' && item !== null) {
        // Handle key-value pairs - keep as bullet list for structure
        return `- ${Object.entries(item).map(([key, value]) => `${key}: "${value}"`).join(', ')}`;
      }
      return `- ${String(item)}`;
    }).join('\n');
  }
  
  formatCommandSpecs(path, agentData) {
    // Handle command specification formatting
    const parts = path.split('[].'); 
    const arrayPath = parts[0];
    const itemPath = parts[1];
    
    const arrayValue = this.getNestedValue(agentData, arrayPath);
    if (!Array.isArray(arrayValue)) return '';
    
    return arrayValue.map(item => {
      const value = this.getNestedValue(item, itemPath);
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value || '');
    }).filter(v => v).join('\n- ');
  }

  // Format detailed specs for role-specific commands only
  formatRoleSpecificCommandSpecs(agentData) {
    const roleSpecificCommands = this.getNestedValue(agentData, 'commands.role-specific');
    if (!Array.isArray(roleSpecificCommands)) return '';
    
    return roleSpecificCommands.map(cmd => {
      let spec = `#### \\*${cmd.name || 'command'}\n\n`;
      spec += `Intent: ${cmd.desc || ''}\n`;
      
      // Only include sections that have actual content
      const sections = [
        { title: 'Preconditions', key: 'preconditions', fallback: 'checks' },
        { title: 'Guards', key: 'guard', fallback: 'test-integrity-rules' },
        { title: 'Order', key: 'order' },
        { title: 'Blocking Conditions', key: 'blocking' },
        { title: 'Review Gate', key: 'ready-for-review' },
        { title: 'Completion Gate', key: 'completion' },
        { title: 'Failure Policy', key: 'on_fail' },
        { title: 'Write Policy', key: 'write-policy' }
      ];
      
      sections.forEach(section => {
        let value = cmd[section.key];
        if (!value && section.fallback) {
          value = cmd[section.fallback];
        }
        
        // Only include sections with meaningful content
        if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          spec += `${section.title}:\n\n`;
          if (Array.isArray(value)) {
            const filteredItems = value.filter(item => item && item !== '');
            if (filteredItems.length > 0) {
              spec += filteredItems.map(item => `- ${item}`).join('\n') + '\n';
            }
          } else {
            spec += `- ${value}\n`;
          }
        }
      });
      
      return spec;
    }).join('\n');
  }

  // Process conditional blocks like {{?field}}...{{/field}}
  processConditionalBlocks(content, agentData) {
    // Pattern to match conditional blocks: {{?path}}content{{/path}}
    const conditionalPattern = /\{\{\?([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    
    return content.replace(conditionalPattern, (match, path, innerContent) => {
      const trimmedPath = path.trim();
      const value = this.getNestedValue(agentData, trimmedPath);
      
      // Include the block if the value exists and is not empty
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        return innerContent;
      }
      
      return ''; // Remove the entire block if condition is false
    });
  }

  // Format persona object in YAML-like structure
  formatPersonaObject(agentData) {
    const persona = this.getNestedValue(agentData, 'agent.persona');
    if (!persona || typeof persona !== 'object') return '';
    
    const lines = [];
    if (persona.role) lines.push(`  role: "${persona.role}"`);
    if (persona.style) lines.push(`  style: "${persona.style}"`);
    if (persona.identity) lines.push(`  identity: "${persona.identity}"`);
    if (persona.focus) lines.push(`  focus: "${persona.focus}"`);
    
    return lines.length > 0 ? `\n${lines.join('\n')}` : '';
  }

  // Format customization array
  formatCustomizationArray(agentData) {
    const customization = this.getNestedValue(agentData, 'agent.customization');
    if (!Array.isArray(customization) || customization.length === 0) return '';
    
    return `\n${customization.map(item => `  - "${item}"`).join('\n')}`;
  }

  // Format command lines (name — desc)
  formatCommandLines(agentData, commandPath) {
    const commands = this.getNestedValue(agentData, commandPath);
    if (!Array.isArray(commands) || commands.length === 0) return '';
    
    return commands.map(cmd => {
      const name = cmd.name || '';
      const desc = cmd.desc || '';
      return `- ${name} — ${desc}`;
    }).join('\n');
  }

  // Format request resolution examples (user -> action pairs)
  formatRequestResolutionExamples(agentData) {
    const examples = this.getNestedValue(agentData, 'request-resolution.examples');
    if (!Array.isArray(examples) || examples.length === 0) return '';
    
    return examples.map(example => {
      const user = example.user || '';
      const action = example.action || '';
      return `- User: ${user}\n  Action: ${action}`;
    }).join('\n');
  }

  // Clean up empty sections and extra whitespace
  cleanupEmptySections(content) {
    // Remove sections that are just headers with no content
    content = content.replace(/^## [^\n]*\n\n(?=##|$)/gm, '');
    
    // Remove multiple consecutive empty lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Remove trailing whitespace from lines
    content = content.replace(/[ \t]+$/gm, '');
    
    // Remove empty bullet points
    content = content.replace(/^- *$/gm, '');
    
    // Remove lines that are just dashes or colons (but not YAML frontmatter ---)
    content = content.replace(/^[ \t]*[-:]+[ \t]*$/gm, (match) => {
      // Preserve YAML frontmatter markers (exactly three dashes)
      return match.trim() === '---' ? match : '';
    });
    
    return content.trim();
  }
}

module.exports = new IdeSetup();
