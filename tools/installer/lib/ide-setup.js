const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");
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
        console.log(chalk.green(`✓ Created rule: ${agentId}.mdc`));
      }
    }

    console.log(chalk.green(`\n✓ Created Cursor rules in ${cursorRulesDir}`));

    return true;
  }

  async setupClaudeCode(installDir, selectedAgent) {
    // Setup Claude Code Subagents
    await this.setupClaudeCodeSubagents(installDir, selectedAgent);

    // Setup orchestrix-core commands
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
        // Use the actual directory name where the expansion pack is installed
        const rootPath = path.relative(installDir, packInfo.path);
        await this.setupClaudeCodeForPackage(installDir, packInfo.name, packSlashPrefix, packAgents, packTasks, rootPath);
      }
    }

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
        console.log(chalk.green(`✓ Created agent command: /${agentId}`));
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
        console.log(chalk.green(`✓ Created task command: /${taskId}`));
      }
    }

    console.log(chalk.green(`\n✓ Created Claude Code commands for ${packageName} in ${commandsBaseDir}`));
    console.log(chalk.dim(`  - Agents in: ${agentsDir}`));
    console.log(chalk.dim(`  - Tasks in: ${tasksDir}`));
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
    const glob = require("glob");
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
    const glob = require("glob");
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
      const glob = require("glob");
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
      const glob = require("glob");
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
    const glob = require("glob");
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
    const glob = require("glob");
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
    const glob = require("glob");
    
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
    const glob = require("glob");
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
      const glob = require("glob");
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
      const glob = require("glob");
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
          const whenToUseMatch = yaml.match(/whenToUse:\s*"(.+)"/);
          const roleDefinitionMatch = yaml.match(/roleDefinition:\s*"(.+)"/);

          const title = titleMatch ? titleMatch[1].trim() : await this.getAgentTitle(agentId, installDir);
          const icon = iconMatch ? iconMatch[1].trim() : "🤖";
          const whenToUse = whenToUseMatch ? whenToUseMatch[1].trim() : `Use for ${title} tasks`;
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
          const whenToUseMatch = yamlMatch[1].match(/whenToUse:\s*"(.*?)"/);
          if (whenToUseMatch && whenToUseMatch[1]) {
            description = whenToUseMatch[1];
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
        console.log(chalk.green(`✓ Created Claude Code subagent: ${agentId}.md`));
      }
    }

    console.log(chalk.green(`\n✓ Created Claude Code subagents in ${subagentsDir}`));
    return true;
  }

  async generateSubagentContent(agentId, agentContent, installDir) {
    // Extract agent metadata from YAML block
    const agentMetadata = this.extractAgentMetadata(agentContent);
    
    // Generate YAML frontmatter for Claude Code Subagent
    const yamlFrontmatter = this.generateSubagentYaml(agentId, agentMetadata);
    
    // Generate markdown content with agent persona and principles
    const markdownContent = this.generateSubagentMarkdown(agentId, agentMetadata);
    
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
      core_principles: []
    };

    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      
      // Extract agent section
      const agentMatch = yamlContent.match(/agent:\s*([\s\S]*?)(?=\n\w|$)/);
      if (agentMatch) {
        const agentSection = agentMatch[1];
        const nameMatch = agentSection.match(/name:\s*(.+)/);
        const titleMatch = agentSection.match(/title:\s*(.+)/);
        const whenToUseMatch = agentSection.match(/whenToUse:\s*(.+)/);
        
        if (nameMatch) metadata.agent.name = nameMatch[1].trim();
        if (titleMatch) metadata.agent.title = titleMatch[1].trim();
        if (whenToUseMatch) metadata.agent.whenToUse = whenToUseMatch[1].trim();
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
        
        // Extract core principles
        const principlesMatch = personaSection.match(/core_principles:\s*([\s\S]*?)(?=\n\s{0,2}\w|$)/);
        if (principlesMatch) {
          const principlesText = principlesMatch[1];
          const principles = principlesText.split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2).trim());
          metadata.persona.core_principles = principles;
        }
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
      'orchestrix-orchestrator': 'claude-opus-4-20250514',   // 复杂编排协调 
      'qa': 'claude-opus-4-1-20250805',                     // 质量守门员 - 需要超越Dev的能力发现问题
      
      // Tier 2: High capability - Core workflow drivers
      'architect': 'claude-sonnet-4-20250514',              // 系统架构决策
      'analyst': 'claude-sonnet-4-20250514',                // 战略分析和研究
      'sm': 'claude-opus-4-20250514',                       // Story质量是开发成功的关键 - 升级到Opus
      
      // Tier 3: Professional execution - Implementation focused
      'dev': 'claude-3-7-sonnet-20250219',                  // 开发执行 - 基于高质量Story进行实现
      'pm': 'claude-sonnet-4-20250514',                     // 产品战略需要高水平思考
      
      // Tier 4: Efficient execution - Structured tasks
      'po': 'claude-3-7-sonnet-20250219',                  // 需求整理和管理
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
      'po': ['Read', 'Write'],
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
}

module.exports = new IdeSetup();
