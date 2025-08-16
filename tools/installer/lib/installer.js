const path = require("node:path");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const ideSetup = require("./ide-setup");
const { extractYamlFromAgent } = require("../../lib/yaml-utils");

// Dynamic imports for ES modules
let chalk, ora, inquirer;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
    ora = (await import("ora")).default;
    inquirer = (await import("inquirer")).default;
  }
}

class Installer {
  async getCoreVersion() {
    const yaml = require("js-yaml");
    const fs = require("fs-extra");
    const coreConfigPath = path.join(__dirname, "../../../orchestrix-core/core-config.yaml");
    try {
      const coreConfigContent = await fs.readFile(coreConfigPath, "utf8");
      const coreConfig = yaml.load(coreConfigContent);
      return coreConfig.version || "unknown";
    } catch (error) {
      console.warn("Could not read version from core-config.yaml, using 'unknown'");
      return "unknown";
    }
  }

  async install(config) {
    // Initialize ES modules
    await initializeModules();
    
    const spinner = ora("Analyzing installation directory...").start();

    try {
      // Store the original CWD where npx was executed
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      
      // Resolve installation directory relative to where the user ran the command
      let installDir = path.isAbsolute(config.directory) 
        ? config.directory 
        : path.resolve(originalCwd, config.directory);
        
      if (path.basename(installDir) === '.orchestrix-core') {
        // If user points directly to .orchestrix-core, treat its parent as the project root
        installDir = path.dirname(installDir);
      }
      
      // Log resolved path for clarity
      if (!path.isAbsolute(config.directory)) {
        spinner.text = `Resolving "${config.directory}" to: ${installDir}`;
      }

      // Check if directory exists and handle non-existent directories
      if (!(await fileManager.pathExists(installDir))) {
        spinner.stop();
        console.log(chalk.yellow(`\n目录 ${chalk.bold(installDir)} 不存在。`));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '您希望做什么？',
            choices: [
              {
                name: '创建目录并继续',
                value: 'create'
              },
              {
                name: '选择一个不同的目录',
                value: 'change'
              },
              {
                name: '取消安装',
                value: 'cancel'
              }
            ]
          }
        ]);

        if (action === 'cancel') {
          console.log(chalk.red('安装已取消。'));
          process.exit(0);
        } else if (action === 'change') {
          const { newDirectory } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newDirectory',
              message: '请输入新的目录路径:',
              validate: (input) => {
                if (!input.trim()) {
                  return '请输入有效的目录路径';
                }
                return true;
              }
            }
          ]);
          // Preserve the original CWD for the recursive call
          config.directory = newDirectory;
          return await this.install(config); // Recursive call with new directory
        } else if (action === 'create') {
          try {
            await fileManager.ensureDirectory(installDir);
            console.log(chalk.green(`✓ 已创建目录: ${installDir}`));
          } catch (error) {
            console.error(chalk.red(`创建目录失败: ${error.message}`));
            console.error(chalk.yellow('您可能需要检查权限或使用不同的路径。'));
            process.exit(1);
          }
        }
        
        spinner.start("正在分析安装目录...");
      }

      // If this is an update request from early detection, handle it directly
      if (config.installType === 'update') {
        const state = await this.detectInstallationState(installDir);
        if (state.type === 'existing') {
          return await this.performUpdate(config, installDir, state.manifest, spinner);
        } else {
          spinner.fail('未找到要更新的现有安装');
          throw new Error('未找到现有安装');
        }
      }

      // Detect current state
      const state = await this.detectInstallationState(installDir);

      // Handle different states
      switch (state.type) {
        case "clean":
          return await this.performFreshInstall(config, installDir, spinner);

        case "existing":
          return await this.handleExistingInstallation(
            config,
            installDir,
            state,
            spinner
          );

        case "unknown_existing":
          return await this.handleUnknownInstallation(
            config,
            installDir,
            state,
            spinner
          );
      }
    } catch (error) {
      spinner.fail("Installation failed");
      throw error;
    }
  }

  async detectInstallationState(installDir) {
    // Ensure modules are initialized
    await initializeModules();
    const state = {
      type: "clean",
      hasManifest: false,
      hasorchestrixCore: false,
      hasOtherFiles: false,
      manifest: null,
      expansionPacks: {},
    };

    // Check if directory exists
    if (!(await fileManager.pathExists(installDir))) {
      return state; // clean install
    }

    // Check for existing installation (has .orchestrix-core with manifest)
    const orchestrixCorePath = path.join(installDir, ".orchestrix-core");
    const manifestPath = path.join(orchestrixCorePath, "install-manifest.yaml");

    if (await fileManager.pathExists(manifestPath)) {
      state.type = "existing";
      state.hasManifest = true;
      state.hasorchestrixCore = true;
      state.manifest = await fileManager.readManifest(installDir);
      return state;
    }



    // Check for .orchestrix-core without manifest (broken installation or manual copy)
    if (await fileManager.pathExists(orchestrixCorePath)) {
      state.type = "unknown_existing";
      state.hasorchestrixCore = true;
      return state;
    }

    // Check if directory has other files
    const glob = require("glob");
    const files = glob.sync("**/*", {
      cwd: installDir,
      nodir: true,
      ignore: ["**/.git/**", "**/node_modules/**"],
    });

    if (files.length > 0) {
      // Directory has other files, but no orchestrix installation.
      // Treat as clean install but record that it isn't empty.
      state.hasOtherFiles = true;
    }

    // Check for expansion packs (folders starting with .)
    const expansionPacks = await this.detectExpansionPacks(installDir);
    state.expansionPacks = expansionPacks;

    return state; // clean install
  }

  async performFreshInstall(config, installDir, spinner, options = {}) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.text = "正在安装 Orchestrix...";

    let files = [];

    if (config.installType === "full") {
      // Full installation - copy entire .orchestrix-core folder as a subdirectory
      spinner.text = "正在复制完整的 .orchestrix-core 文件夹...";
      const sourceDir = configLoader.getOrchestrixCorePath();
      const orchestrixCoreDestDir = path.join(installDir, ".orchestrix-core");
      await fileManager.copyDirectoryWithRootReplacement(sourceDir, orchestrixCoreDestDir, ".orchestrix-core");
      
      // Copy common/ items to .orchestrix-core
      spinner.text = "正在复制通用工具...";
      await this.copyCommonItems(installDir, ".orchestrix-core", spinner);

      // Get list of all files for manifest
      const glob = require("glob");
      files = glob
        .sync("**/*", {
          cwd: orchestrixCoreDestDir,
          nodir: true,
          ignore: ["**/.git/**", "**/node_modules/**"],
        })
        .map((file) => path.join(".orchestrix-core", file));
    } else if (config.installType === "single-agent") {
      // Single agent installation
      spinner.text = `正在安装 ${config.agent} 代理...`;

      // Copy agent file with {root} replacement
      const agentPath = configLoader.getAgentPath(config.agent);
      const destAgentPath = path.join(
        installDir,
        ".orchestrix-core",
        "agents",
        `${config.agent}.md`
      );
      await fileManager.copyFileWithRootReplacement(agentPath, destAgentPath, ".orchestrix-core");
      files.push(`.orchestrix-core/agents/${config.agent}.md`);

      // Copy dependencies
      const dependencies = await configLoader.getAgentDependencies(
        config.agent
      );
      const sourceBase = configLoader.getOrchestrixCorePath();

      for (const dep of dependencies) {
        spinner.text = `Copying dependency: ${dep}`;

        if (dep.includes("*")) {
          // Handle glob patterns with {root} replacement
          const copiedFiles = await fileManager.copyGlobPattern(
            dep.replace(".orchestrix-core/", ""),
            sourceBase,
            path.join(installDir, ".orchestrix-core"),
            ".orchestrix-core"
          );
          files.push(...copiedFiles.map(f => `.orchestrix-core/${f}`));
        } else {
          // Handle single files with {root} replacement if needed
          const sourcePath = path.join(
            sourceBase,
            dep.replace(".orchestrix-core/", "")
          );
          const destPath = path.join(
            installDir,
            dep
          );

          const needsRootReplacement = dep.endsWith('.md') || dep.endsWith('.yaml') || dep.endsWith('.yml');
          let success = false;
          
          if (needsRootReplacement) {
            success = await fileManager.copyFileWithRootReplacement(sourcePath, destPath, ".orchestrix-core");
          } else {
            success = await fileManager.copyFile(sourcePath, destPath);
          }

          if (success) {
            files.push(dep);
          }
        }
      }
      
      // Copy common/ items to .orchestrix-core
      spinner.text = "Copying common utilities...";
      const commonFiles = await this.copyCommonItems(installDir, ".orchestrix-core", spinner);
      files.push(...commonFiles);
    } else if (config.installType === "team") {
      // Team installation
      spinner.text = `正在安装 ${config.team} 团队...`;
      
      // Get team dependencies
      const teamDependencies = await configLoader.getTeamDependencies(config.team);
      const sourceBase = configLoader.getOrchestrixCorePath();
      
      // Install all team dependencies
      for (const dep of teamDependencies) {
        spinner.text = `Copying team dependency: ${dep}`;
        
        if (dep.includes("*")) {
          // Handle glob patterns with {root} replacement
          const copiedFiles = await fileManager.copyGlobPattern(
            dep.replace(".orchestrix-core/", ""),
            sourceBase,
            path.join(installDir, ".orchestrix-core"),
            ".orchestrix-core"
          );
          files.push(...copiedFiles.map(f => `.orchestrix-core/${f}`));
        } else {
          // Handle single files with {root} replacement if needed
          const sourcePath = path.join(sourceBase, dep.replace(".orchestrix-core/", ""));
          const destPath = path.join(installDir, dep);
          
          const needsRootReplacement = dep.endsWith('.md') || dep.endsWith('.yaml') || dep.endsWith('.yml');
          let success = false;
          
          if (needsRootReplacement) {
            success = await fileManager.copyFileWithRootReplacement(sourcePath, destPath, ".orchestrix-core");
          } else {
            success = await fileManager.copyFile(sourcePath, destPath);
          }

          if (success) {
            files.push(dep);
          }
        }
      }
      
      // Copy common/ items to .orchestrix-core
      spinner.text = "Copying common utilities...";
      const commonFiles = await this.copyCommonItems(installDir, ".orchestrix-core", spinner);
      files.push(...commonFiles);
    } else if (config.installType === "expansion-only") {
      // Expansion-only installation - DO NOT create .orchestrix-core
      // Only install expansion packs
      spinner.text = "正在安装扩展包...";
    }

    // Install expansion packs if requested
    const expansionFiles = await this.installExpansionPacks(installDir, config.expansionPacks, spinner, config);
    files.push(...expansionFiles);

    // Install web bundles if requested
    if (config.includeWebBundles && config.webBundlesDirectory) {
      spinner.text = "正在安装 web bundles...";
      // Resolve web bundles directory using the same logic as the main installation directory
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      let resolvedWebBundlesDir = path.isAbsolute(config.webBundlesDirectory) 
        ? config.webBundlesDirectory 
        : path.resolve(originalCwd, config.webBundlesDirectory);
      await this.installWebBundles(resolvedWebBundlesDir, config, spinner);
    }

    // Set up IDE integration if requested
    const ides = config.ides || (config.ide ? [config.ide] : []);
    if (ides.length > 0) {
      for (const ide of ides) {
        spinner.text = `Setting up ${ide} integration...`;
        const preConfiguredSettings = ide === 'github-copilot' ? config.githubCopilotConfig : null;
        await ideSetup.setup(ide, installDir, config.agent, spinner, preConfiguredSettings);
      }
    }

    // Modify core-config.yaml if sharding preferences were provided
    if (config.installType !== "expansion-only" && (config.prdSharded !== undefined || config.architectureSharded !== undefined)) {
      spinner.text = "Configuring document sharding settings...";
      await fileManager.modifyCoreConfig(installDir, config);
    }

    // Create manifest (skip for expansion-only installations)
    if (config.installType !== "expansion-only") {
      spinner.text = "Creating installation manifest...";
      await fileManager.createManifest(installDir, config, files);
    }

    spinner.succeed("安装完成！");
    this.showSuccessMessage(config, installDir, options);
  }

  async handleExistingInstallation(config, installDir, state, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.stop();

    const currentVersion = state.manifest.version;
    const newVersion = await this.getCoreVersion();
    const versionCompare = this.compareVersions(currentVersion, newVersion);

    console.log(chalk.yellow("\n🔍 发现现有的 orchestrix 安装"));
    console.log(`   目录: ${installDir}`);
    console.log(`   当前版本: ${currentVersion}`);
    console.log(`   可用版本: ${newVersion}`);
    console.log(
      `   安装日期: ${new Date(
        state.manifest.installed_at
      ).toLocaleDateString()}`
    );

    // Check file integrity
    spinner.start("正在检查安装完整性...");
    const integrity = await fileManager.checkFileIntegrity(installDir, state.manifest);
    spinner.stop();
    
    const hasMissingFiles = integrity.missing.length > 0;
    const hasModifiedFiles = integrity.modified.length > 0;
    const hasIntegrityIssues = hasMissingFiles || hasModifiedFiles;
    
    if (hasIntegrityIssues) {
      console.log(chalk.red("\n⚠️  检测到安装问题:"));
      if (hasMissingFiles) {
        console.log(chalk.red(`   丢失的文件: ${integrity.missing.length}`));
        if (integrity.missing.length <= 5) {
          integrity.missing.forEach(file => console.log(chalk.dim(`     - ${file}`)));
        }
      }
      if (hasModifiedFiles) {
        console.log(chalk.yellow(`   修改的文件: ${integrity.modified.length}`));
        if (integrity.modified.length <= 5) {
          integrity.modified.forEach(file => console.log(chalk.dim(`     - ${file}`)));
        }
      }
    }

    // Show existing expansion packs
    if (Object.keys(state.expansionPacks).length > 0) {
      console.log(chalk.cyan("\n📦 已安装的扩展包:"));
      for (const [packId, packInfo] of Object.entries(state.expansionPacks)) {
        if (packInfo.hasManifest && packInfo.manifest) {
          console.log(`   - ${packId} (v${packInfo.manifest.version || '未知'})`);
        } else {
          console.log(`   - ${packId} (无清单文件)`);
        }
      }
    }

    let choices = [];
    
    if (versionCompare < 0) {
      console.log(chalk.cyan("\n⬆️  orchestrix 核心有可用升级"));
      choices.push({ name: `升级 orchestrix 核心 (v${currentVersion} → v${newVersion})`, value: "upgrade" });
    } else if (versionCompare === 0) {
      if (hasIntegrityIssues) {
        // Offer repair option when files are missing or modified
        choices.push({ 
          name: "修复安装 (恢复丢失/修改的文件)", 
          value: "repair" 
        });
      }
      console.log(chalk.yellow("\n⚠️  已安装相同版本"));
      choices.push({ name: `强制重新安装 orchestrix 核心 (v${currentVersion} - 重新安装)`, value: "reinstall" });
    } else {
      console.log(chalk.yellow("\n⬇️  已安装的版本比可用版本新"));
      choices.push({ name: `降级 orchestrix 核心 (v${currentVersion} → v${newVersion})`, value: "reinstall" });
    }
    
    choices.push(
      { name: "仅添加/更新扩展包", value: "expansions" },
      { name: "取消", value: "cancel" }
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "您希望做什么？",
        choices: choices,
      },
    ]);

    switch (action) {
      case "upgrade":
        return await this.performUpdate(config, installDir, state.manifest, spinner);
      case "repair":
        // For repair, restore missing/modified files while backing up modified ones
        return await this.performRepair(config, installDir, state.manifest, integrity, spinner);
      case "reinstall":
        // For reinstall, don't check for modifications - just overwrite
        return await this.performReinstall(config, installDir, spinner);
      case "expansions":
        // Ask which expansion packs to install
        const availableExpansionPacks = await this.getAvailableExpansionPacks();
        
        if (availableExpansionPacks.length === 0) {
          console.log(chalk.yellow("没有可用的扩展包。"));
          return;
        }
        
        const { selectedPacks } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedPacks',
            message: '选择要安装/更新的扩展包:',
            choices: availableExpansionPacks.map(pack => ({
              name: `${pack.name} v${pack.version} - ${pack.description}`,
              value: pack.id,
              checked: state.expansionPacks[pack.id] !== undefined
            }))
          }
        ]);
        
        if (selectedPacks.length === 0) {
          console.log(chalk.yellow("未选择任何扩展包。"));
          return;
        }
        
        spinner.start("正在安装扩展包...");
        const expansionFiles = await this.installExpansionPacks(installDir, selectedPacks, spinner, { ides: config.ides || [] });
        spinner.succeed("扩展包安装成功！");
        
        console.log(chalk.green("\n✓ 安装完成！"));
        console.log(chalk.green(`✓ 已安装/更新的扩展包:`));
        for (const packId of selectedPacks) {
          console.log(chalk.green(`  - ${packId} → .${packId}/`));
        }
        return;
      case "cancel":
        console.log("安装已取消。");
        return;
    }
  }

  async handleUnknownInstallation(config, installDir, state, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    spinner.stop();

    console.log(chalk.yellow("\n⚠️  目录包含现有文件"));
    console.log(`   目录: ${installDir}`);

    if (state.hasorchestrixCore) {
      console.log("   发现: .orchestrix-core 目录 (但没有清单文件)");
    }
    if (state.hasOtherFiles) {
      console.log("   发现: 目录中有其他文件");
    }

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "您希望做什么？",
        choices: [
          { name: "仍然安装 (可能会覆盖文件)", value: "force" },
          { name: "选择不同的目录", value: "different" },
          { name: "取消", value: "cancel" },
        ],
      },
    ]);

    switch (action) {
      case "force":
        return await this.performFreshInstall(config, installDir, spinner);
      case "different": {
        const { newDir } = await inquirer.prompt([
          {
            type: "input",
            name: "newDir",
            message: "输入新的安装目录:",
            default: path.join(path.dirname(installDir), "orchestrix-project"),
          },
        ]);
        config.directory = newDir;
        return await this.install(config);
      }
      case "cancel":
        console.log("安装已取消。");
        return;
    }
  }

  async performUpdate(newConfig, installDir, manifest, spinner) {
    spinner.start("Checking for updates...");

    try {
      // Get current and new versions
      const currentVersion = manifest.version;
      const newVersion = await this.getCoreVersion();
      const versionCompare = this.compareVersions(currentVersion, newVersion);
      
      // Only check for modified files if it's an actual version upgrade
      let modifiedFiles = [];
      if (versionCompare !== 0) {
        spinner.text = "Checking for modified files...";
        modifiedFiles = await fileManager.checkModifiedFiles(
          installDir,
          manifest
        );
      }

      if (modifiedFiles.length > 0) {
        spinner.warn("Found modified files");
        console.log(chalk.yellow("\n以下文件已被修改:"));
        for (const file of modifiedFiles) {
          console.log(`  - ${file}`);
        }

        const { action } = await inquirer.prompt([
          {
            type: "list",
            name: "action",
            message: "您希望如何继续？",
            choices: [
              { name: "备份并覆盖修改过的文件", value: "backup" },
              { name: "跳过修改过的文件", value: "skip" },
              { name: "取消更新", value: "cancel" },
            ],
          },
        ]);

        if (action === "cancel") {
          console.log("更新已取消。");
          return;
        }

        if (action === "backup") {
          spinner.start("Backing up modified files...");
          for (const file of modifiedFiles) {
            const filePath = path.join(installDir, file);
            const backupPath = await fileManager.backupFile(filePath);
            console.log(
              chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`)
            );
          }
        }
      }

      // Perform update by re-running installation
      spinner.text = versionCompare === 0 ? "Reinstalling files..." : "Updating files...";
      const config = {
        installType: manifest.install_type,
        agent: manifest.agent,
        directory: installDir,
        ides: newConfig?.ides || manifest.ides_setup || [],
      };

      await this.performFreshInstall(config, installDir, spinner, { isUpdate: true });
      
      // Clean up .yml files that now have .yaml counterparts
      spinner.text = "正在清理旧的 .yml 文件...";
      await this.cleanupLegacyYmlFiles(installDir, spinner);
    } catch (error) {
      spinner.fail("Update failed");
      throw error;
    }
  }

  async performRepair(config, installDir, manifest, integrity, spinner) {
    spinner.start("Preparing to repair installation...");

    try {
      // Back up modified files
      if (integrity.modified.length > 0) {
        spinner.text = "Backing up modified files...";
        for (const file of integrity.modified) {
          const filePath = path.join(installDir, file);
          if (await fileManager.pathExists(filePath)) {
            const backupPath = await fileManager.backupFile(filePath);
            console.log(chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`));
          }
        }
      }

      // Restore missing and modified files
      spinner.text = "Restoring files...";
      const sourceBase = configLoader.getOrchestrixCorePath();
      const filesToRestore = [...integrity.missing, ...integrity.modified];
      
      for (const file of filesToRestore) {
        // Skip the manifest file itself
        if (file.endsWith('install-manifest.yaml')) continue;
        
        const relativePath = file.replace('.orchestrix-core/', '');
        const destPath = path.join(installDir, file);
        
        // Check if this is a common/ file that needs special processing
        const commonBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename))));
        const commonSourcePath = path.join(commonBase, 'common', relativePath);
        
        if (await fileManager.pathExists(commonSourcePath)) {
          // This is a common/ file - needs template processing
          const fs = require('fs').promises;
          const content = await fs.readFile(commonSourcePath, 'utf8');
          const updatedContent = content.replace(/\{root\}/g, '.orchestrix-core');
          await fileManager.ensureDirectory(path.dirname(destPath));
          await fs.writeFile(destPath, updatedContent, 'utf8');
          spinner.text = `Restored: ${file}`;
        } else {
          // Regular file from orchestrix-core
          const sourcePath = path.join(sourceBase, relativePath);
          if (await fileManager.pathExists(sourcePath)) {
            await fileManager.copyFile(sourcePath, destPath);
            spinner.text = `Restored: ${file}`;
            
            // If this is a .yaml file, check for and remove corresponding .yml file
            if (file.endsWith('.yaml')) {
              const ymlFile = file.replace(/\.yaml$/, '.yml');
              const ymlPath = path.join(installDir, ymlFile);
              if (await fileManager.pathExists(ymlPath)) {
                const fs = require('fs').promises;
                await fs.unlink(ymlPath);
                console.log(chalk.dim(`  Removed legacy: ${ymlFile} (replaced by ${file})`));
              }
            }
          } else {
            console.warn(chalk.yellow(`  Warning: Source file not found: ${file}`));
          }
        }
      }
      
      // Clean up .yml files that now have .yaml counterparts
      spinner.text = "正在清理旧的 .yml 文件...";
      await this.cleanupLegacyYmlFiles(installDir, spinner);
      
      spinner.succeed("Repair completed successfully!");
      
      // Show summary
      console.log(chalk.green("\n✓ 安装已修复！"));
      if (integrity.missing.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.missing.length} missing files`));
      }
      if (integrity.modified.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.modified.length} modified files (backups created)`));
      }
      
      // Warning for Cursor custom modes if agents were repaired
      const ides = manifest.ides_setup || [];
      if (ides.includes('cursor')) {
        console.log(chalk.yellow.bold("\n⚠️  重要提示：需要更新 Cursor 自定义模式"));
        console.log(chalk.yellow("由于代理文件已修复，您需要根据 Cursor 文档在 Cursor 自定义代理 GUI 中更新任何已配置的自定义代理模式。"));
      }
      
    } catch (error) {
      spinner.fail("Repair failed");
      throw error;
    }
  }

  async performReinstall(config, installDir, spinner) {
    spinner.start("Preparing to reinstall Orchestrix...");

    // Remove existing .orchestrix-core
    const orchestrixCorePath = path.join(installDir, ".orchestrix-core");
    if (await fileManager.pathExists(orchestrixCorePath)) {
      spinner.text = "Removing existing installation...";
      await fileManager.removeDirectory(orchestrixCorePath);
    }
    
    spinner.text = "Installing fresh copy...";
    const result = await this.performFreshInstall(config, installDir, spinner, { isUpdate: true });
    
    // Clean up .yml files that now have .yaml counterparts
    spinner.text = "正在清理旧的 .yml 文件...";
    await this.cleanupLegacyYmlFiles(installDir, spinner);
    
    return result;
  }

  showSuccessMessage(config, installDir, options = {}) {
    console.log(chalk.green("\n✓ Orchestrix 安装成功！\n"));

    const ides = config.ides || (config.ide ? [config.ide] : []);
    if (ides.length === 0) {
      console.log(chalk.yellow("未设置 IDE 配置。"));
      console.log(
        "您可以手动配置您的 IDE，使用以下目录中的代理文件:",
        installDir
      );
    }

    // Information about installation components
    console.log(chalk.bold("\n🎯 安装摘要:"));
    if (config.installType !== "expansion-only") {
      console.log(chalk.green("✓ 核心框架和代理已安装"));
    }
    
    if (config.expansionPacks && config.expansionPacks.length > 0) {
      console.log(chalk.green(`✓ 扩展包: ${config.expansionPacks.join(', ')}`));
    }
    
    if (config.includeWebBundles && config.webBundlesDirectory) {
      console.log(chalk.green(`✓ Web bundles 已安装`));
    }
    
    if (ides.length > 0) {
      const ideNames = ides.map(ide => {
        const ideConfig = configLoader.getIdeConfiguration(ide);
        return ideConfig?.name || ide;
      }).join(", ");
      console.log(chalk.green(`✓ IDE 集成: ${ideNames}`));
    }

    // Simplified web bundles info
    if (!config.includeWebBundles) {
      console.log(chalk.dim("\n💡 提示: 可运行安装程序添加 Web bundles (适用于 ChatGPT, Claude, Gemini)"));
    }

    if (config.installType === "single-agent") {
      console.log(chalk.dim("\n💡 提示: 运行 'npx orchestrix install --full' 安装完整版本"));
    }

    // Cursor custom mode warning removed per user request
  }

  // Legacy method for backward compatibility
  async update() {
    // Initialize ES modules
    await initializeModules();
    console.log(chalk.yellow(' "update" 命令已弃用。'));
    console.log(
      '请改用 "install" - 它将检测并提供更新现有安装的选项。'
    );

    const installDir = await this.findInstallation();
    if (installDir) {
      const config = {
        installType: "full",
        directory: path.dirname(installDir),
        ide: null,
      };
      return await this.install(config);
    }
    console.log(chalk.red("未找到 orchestrix 安装。"));
  }

  async listAgents() {
    // Initialize ES modules
    await initializeModules();
    const agents = await configLoader.getAvailableAgents();

    console.log(chalk.bold("\n可用的 orchestrix 代理:\n"));

    for (const agent of agents) {
      console.log(chalk.cyan(`  ${agent.id.padEnd(20)}`), agent.description);
    }

    console.log(
      chalk.dim("\n使用以下命令安装: npx orchestrix install --agent=<id>\n")
    );
  }

  async listExpansionPacks() {
    // Initialize ES modules
    await initializeModules();
    const expansionPacks = await this.getAvailableExpansionPacks();

    console.log(chalk.bold("\n可用的 orchestrix 扩展包:\n"));

    if (expansionPacks.length === 0) {
      console.log(chalk.yellow("未找到扩展包。"));
      return;
    }

    for (const pack of expansionPacks) {
      console.log(chalk.cyan(`  ${pack.id.padEnd(20)}`), 
                  `${pack.name} v${pack.version}`);
      console.log(chalk.dim(`  ${' '.repeat(22)}${pack.description}`));
      if (pack.author && pack.author !== '未知') {
        console.log(chalk.dim(`  ${' '.repeat(22)}作者 ${pack.author}`));
      }
      console.log();
    }

    console.log(
      chalk.dim("使用以下命令安装: npx orchestrix install --full --expansion-packs <id>\n")
    );
  }

  async showStatus() {
    // Initialize ES modules
    await initializeModules();
    const orchestrixCoreDir = await this.findInstallation();

    if (!orchestrixCoreDir) {
      console.log(
        chalk.yellow("在当前目录树中未找到 orchestrix 安装")
      );
      return;
    }

    // Convert .orchestrix-core path to project root path
    const installDir = path.dirname(orchestrixCoreDir);
    const manifest = await fileManager.readManifest(installDir);

    if (!manifest) {
      console.log(chalk.red("无效的安装 - 未找到清单文件"));
      return;
    }

    console.log(chalk.bold("\norchestrix 安装状态:\n"));
    console.log(`  目录:      ${installDir}`);
    console.log(`  版本:        ${manifest.version}`);
    console.log(
      `  安装日期:      ${new Date(
        manifest.installed_at
      ).toLocaleDateString()}`
    );
    console.log(`  类型:           ${manifest.install_type}`);

    if (manifest.agent) {
      console.log(`  代理:          ${manifest.agent}`);
    }

    if (manifest.ides_setup && manifest.ides_setup.length > 0) {
      console.log(`  IDE 设置:      ${manifest.ides_setup.join(', ')}`);
    }

    console.log(`  总文件数:    ${manifest.files.length}`);

    // Check for modifications
    const modifiedFiles = await fileManager.checkModifiedFiles(
      installDir,
      manifest
    );
    if (modifiedFiles.length > 0) {
      console.log(chalk.yellow(`  修改的文件: ${modifiedFiles.length}`));
    }

    console.log("");
  }

  async getAvailableAgents() {
    return configLoader.getAvailableAgents();
  }

  async getAvailableExpansionPacks() {
    return configLoader.getAvailableExpansionPacks();
  }

  async getAvailableTeams() {
    return configLoader.getAvailableTeams();
  }

  async installExpansionPacks(installDir, selectedPacks, spinner, config = {}) {
    if (!selectedPacks || selectedPacks.length === 0) {
      return [];
    }

    const installedFiles = [];
    const glob = require('glob');

    for (const packId of selectedPacks) {
      spinner.text = `正在安装扩展包: ${packId}...`;
      
      try {
        const expansionPacks = await this.getAvailableExpansionPacks();
        const pack = expansionPacks.find(p => p.id === packId);
        
        if (!pack) {
          console.warn(`未找到扩展包 ${packId}，正在跳过...`);
          continue;
        }
        
        // Check if expansion pack already exists
        let expansionDotFolder = path.join(installDir, `.${packId}`);
        const existingManifestPath = path.join(expansionDotFolder, 'install-manifest.yaml');
        
        if (await fileManager.pathExists(existingManifestPath)) {
          spinner.stop();
          const existingManifest = await fileManager.readExpansionPackManifest(installDir, packId);
          
          console.log(chalk.yellow(`\n🔍 发现现有的 ${pack.name} 安装`));
          console.log(`   当前版本: ${existingManifest.version || '未知'}`);
          console.log(`   新版本: ${pack.version}`);
          
          // Check integrity of existing expansion pack
          const packIntegrity = await fileManager.checkFileIntegrity(installDir, existingManifest);
          const hasPackIntegrityIssues = packIntegrity.missing.length > 0 || packIntegrity.modified.length > 0;
          
          if (hasPackIntegrityIssues) {
            console.log(chalk.red("   ⚠️  检测到安装问题:"));
            if (packIntegrity.missing.length > 0) {
              console.log(chalk.red(`     丢失的文件: ${packIntegrity.missing.length}`));
            }
            if (packIntegrity.modified.length > 0) {
              console.log(chalk.yellow(`     修改的文件: ${packIntegrity.modified.length}`));
            }
          }
          
          const versionCompare = this.compareVersions(existingManifest.version || '0.0.0', pack.version);
          
          if (versionCompare === 0) {
            console.log(chalk.yellow('   ⚠️  已安装相同版本'));
            
            const choices = [];
            if (hasPackIntegrityIssues) {
              choices.push({ name: '修复 (恢复丢失/修改的文件)', value: 'repair' });
            }
            choices.push(
              { name: '强制重新安装 (覆盖)', value: 'overwrite' },
              { name: '跳过此扩展包', value: 'skip' },
              { name: '取消安装', value: 'cancel' }
            );
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: `${pack.name} v${pack.version} 已安装。您希望做什么？`,
              choices: choices
            }]);
            
            if (action === 'skip') {
              spinner.start();
              continue;
            } else if (action === 'cancel') {
              console.log(chalk.red('安装已取消。'));
              process.exit(0);
            } else if (action === 'repair') {
              // Repair the expansion pack
              await this.repairExpansionPack(installDir, packId, pack, packIntegrity, spinner);
              continue;
            }
          } else if (versionCompare < 0) {
            console.log(chalk.cyan('   ⬆️  有可用升级'));
            
            const { proceed } = await inquirer.prompt([{
              type: 'confirm',
              name: 'proceed',
              message: `将 ${pack.name} 从 v${existingManifest.version} 升级到 v${pack.version}？`,
              default: true
            }]);
            
            if (!proceed) {
              spinner.start();
              continue;
            }
          } else {
            console.log(chalk.yellow('   ⬇️  已安装的版本比可用版本新'));
            
            const { action } = await inquirer.prompt([{
              type: 'list',
              name: 'action',
              message: '您希望做什么？',
              choices: [
                { name: '保留当前版本', value: 'skip' },
                { name: '降级到可用版本', value: 'downgrade' },
                { name: '取消安装', value: 'cancel' }
              ]
            }]);
            
            if (action === 'skip') {
              spinner.start();
              continue;
            } else if (action === 'cancel') {
              console.log(chalk.red('安装已取消。'));
              process.exit(0);
            }
          }
          
          // If we get here, we're proceeding with installation
          spinner.start(`正在移除旧的 ${pack.name} 安装...`);
          await fileManager.removeDirectory(expansionDotFolder);
        }

        const expansionPackDir = pack.packPath;
        
        // Ensure dedicated dot folder exists for this expansion pack
        expansionDotFolder = path.join(installDir, `.${packId}`);
        await fileManager.ensureDirectory(expansionDotFolder);
        
        // Define the folders to copy from expansion packs
        const foldersToSync = [
          'agents',
          'agent-teams',
          'templates',
          'tasks',
          'checklists',
          'workflows',
          'data',
          'utils',
          'schemas'
        ];

        // Copy each folder if it exists
        for (const folder of foldersToSync) {
          const sourceFolder = path.join(expansionPackDir, folder);
          
          // Check if folder exists in expansion pack
          if (await fileManager.pathExists(sourceFolder)) {
            // Get all files in this folder
            const files = glob.sync('**/*', {
              cwd: sourceFolder,
              nodir: true
            });

            // Copy each file to the expansion pack's dot folder with {root} replacement
            for (const file of files) {
              const sourcePath = path.join(sourceFolder, file);
              const destPath = path.join(expansionDotFolder, folder, file);
              
              const needsRootReplacement = file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml');
              let success = false;
              
              if (needsRootReplacement) {
                success = await fileManager.copyFileWithRootReplacement(sourcePath, destPath, `.${packId}`);
              } else {
                success = await fileManager.copyFile(sourcePath, destPath);
              }
              
              if (success) {
                installedFiles.push(path.join(`.${packId}`, folder, file));
              }
            }
          }
        }

        // Copy config.yaml with {root} replacement
        const configPath = path.join(expansionPackDir, 'config.yaml');
        if (await fileManager.pathExists(configPath)) {
          const configDestPath = path.join(expansionDotFolder, 'config.yaml');
          if (await fileManager.copyFileWithRootReplacement(configPath, configDestPath, `.${packId}`)) {
            installedFiles.push(path.join(`.${packId}`, 'config.yaml'));
          }
        }
        
        // Copy README if it exists with {root} replacement
        const readmePath = path.join(expansionPackDir, 'README.md');
        if (await fileManager.pathExists(readmePath)) {
          const readmeDestPath = path.join(expansionDotFolder, 'README.md');
          if (await fileManager.copyFileWithRootReplacement(readmePath, readmeDestPath, `.${packId}`)) {
            installedFiles.push(path.join(`.${packId}`, 'README.md'));
          }
        }

        // Copy common/ items to expansion pack folder
        spinner.text = `Copying common utilities to ${packId}...`;
        await this.copyCommonItems(installDir, `.${packId}`, spinner);
        
        // Check and resolve core dependencies
        await this.resolveExpansionPackCoreDependencies(installDir, expansionDotFolder, packId, spinner);
        
        // Check and resolve core agents referenced by teams
        await this.resolveExpansionPackCoreAgents(installDir, expansionDotFolder, packId, spinner);

        // Create manifest for this expansion pack
        spinner.text = `Creating manifest for ${packId}...`;
        const expansionConfig = {
          installType: 'expansion-pack',
          expansionPackId: packId,
          expansionPackName: pack.name,
          expansionPackVersion: pack.version,
          ides: config.ides || []  // Use ides_setup instead of ide_setup
        };
        
        // Get all files installed in this expansion pack
        const expansionPackFiles = glob.sync('**/*', {
          cwd: expansionDotFolder,
          nodir: true
        }).map(f => path.join(`.${packId}`, f));
        
        await fileManager.createExpansionPackManifest(installDir, packId, expansionConfig, expansionPackFiles);

        console.log(chalk.green(`✓ 已安装扩展包: ${pack.name} 到 ${`.${packId}`}`));
      } catch (error) {
        console.error(chalk.red(`安装扩展包 ${packId} 失败: ${error.message}`));
        console.error(chalk.red(`堆栈跟踪: ${error.stack}`));
      }
    }

    return installedFiles;
  }

  async resolveExpansionPackCoreDependencies(installDir, expansionDotFolder, packId, spinner) {
    const glob = require('glob');
    const yaml = require('js-yaml');
    const fs = require('fs').promises;
    
    // Find all agent files in the expansion pack
    const agentFiles = glob.sync('agents/*.md', {
      cwd: expansionDotFolder
    });

    for (const agentFile of agentFiles) {
      const agentPath = path.join(expansionDotFolder, agentFile);
      const agentContent = await fs.readFile(agentPath, 'utf8');
      
      // Extract YAML frontmatter to check dependencies
      const yamlContent = extractYamlFromAgent(agentContent);
      if (yamlContent) {
        try {
          const agentConfig = yaml.load(yamlContent);
          const dependencies = agentConfig.dependencies || {};
          
          // Check for core dependencies (those that don't exist in the expansion pack)
          for (const depType of ['tasks', 'templates', 'checklists', 'workflows', 'utils', 'data']) {
            const deps = dependencies[depType] || [];
            
            for (const dep of deps) {
              const depFileName = dep.endsWith('.md') ? dep : `${dep}.md`;
              const expansionDepPath = path.join(expansionDotFolder, depType, depFileName);
              
              // Check if dependency exists in expansion pack
              if (!(await fileManager.pathExists(expansionDepPath))) {
                // Try to find it in core
                const coreDepPath = path.join(configLoader.getOrchestrixCorePath(), depType, depFileName);
                
                if (await fileManager.pathExists(coreDepPath)) {
                  spinner.text = `Copying core dependency ${dep} for ${packId}...`;
                  
                  // Copy from core to expansion pack dot folder with {root} replacement
                  const destPath = path.join(expansionDotFolder, depType, depFileName);
                  await fileManager.copyFileWithRootReplacement(coreDepPath, destPath, `.${packId}`);
                  
                  console.log(chalk.dim(`  Added core dependency: ${depType}/${depFileName}`));
                } else {
                  console.warn(chalk.yellow(`  Warning: Dependency ${depType}/${dep} not found in core or expansion pack`));
                }
              }
            }
          }
        } catch (error) {
          console.warn(chalk.yellow(`  Warning: Could not parse agent dependencies: ${error.message}`));
        }
      }
    }
  }

  async resolveExpansionPackCoreAgents(installDir, expansionDotFolder, packId, spinner) {
    const glob = require('glob');
    const yaml = require('js-yaml');
    const fs = require('fs').promises;
    
    // Find all team files in the expansion pack
    const teamFiles = glob.sync('agent-teams/*.yaml', {
      cwd: expansionDotFolder
    });

    // Also get existing agents in the expansion pack
    const existingAgents = new Set();
    const agentFiles = glob.sync('agents/*.md', {
      cwd: expansionDotFolder
    });
    for (const agentFile of agentFiles) {
      const agentName = path.basename(agentFile, '.md');
      existingAgents.add(agentName);
    }

    // Process each team file
    for (const teamFile of teamFiles) {
      const teamPath = path.join(expansionDotFolder, teamFile);
      const teamContent = await fs.readFile(teamPath, 'utf8');
      
      try {
        const teamConfig = yaml.load(teamContent);
        const agents = teamConfig.agents || [];
        
        // Add orchestrix-orchestrator if not present (required for all teams)
        if (!agents.includes('orchestrix-orchestrator')) {
          agents.unshift('orchestrix-orchestrator');
        }
        
        // Check each agent in the team
        for (const agentId of agents) {
          if (!existingAgents.has(agentId)) {
            // Agent not in expansion pack, try to get from core
            const coreAgentPath = path.join(configLoader.getOrchestrixCorePath(), 'agents', `${agentId}.md`);
            
            if (await fileManager.pathExists(coreAgentPath)) {
              spinner.text = `Copying core agent ${agentId} for ${packId}...`;
              
              // Copy agent file with {root} replacement
              const destPath = path.join(expansionDotFolder, 'agents', `${agentId}.md`);
              await fileManager.copyFileWithRootReplacement(coreAgentPath, destPath, `.${packId}`);
              existingAgents.add(agentId);
              
              console.log(chalk.dim(`  Added core agent: ${agentId}`));
              
              // Now resolve this agent's dependencies too
              const agentContent = await fs.readFile(coreAgentPath, 'utf8');
              const yamlContent = extractYamlFromAgent(agentContent, true);
              
              if (yamlContent) {
                try {
                  
                  const agentConfig = yaml.load(yamlContent);
                  const dependencies = agentConfig.dependencies || {};
                  
                  // Copy all dependencies for this agent
                  for (const depType of ['tasks', 'templates', 'checklists', 'workflows', 'utils', 'data']) {
                    const deps = dependencies[depType] || [];
                    
                    for (const dep of deps) {
                      const depFileName = dep.endsWith('.md') || dep.endsWith('.yaml') ? dep : `${dep}.md`;
                      const expansionDepPath = path.join(expansionDotFolder, depType, depFileName);
                      
                      // Check if dependency exists in expansion pack
                      if (!(await fileManager.pathExists(expansionDepPath))) {
                        // Try to find it in core
                        const coreDepPath = path.join(configLoader.getOrchestrixCorePath(), depType, depFileName);
                        
                        if (await fileManager.pathExists(coreDepPath)) {
                          const destDepPath = path.join(expansionDotFolder, depType, depFileName);
                          await fileManager.copyFileWithRootReplacement(coreDepPath, destDepPath, `.${packId}`);
                          console.log(chalk.dim(`    Added agent dependency: ${depType}/${depFileName}`));
                        } else {
                          // Try common folder
                          const sourceBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename)))); // Go up to project root
                          const commonDepPath = path.join(sourceBase, 'common', depType, depFileName);
                          if (await fileManager.pathExists(commonDepPath)) {
                            const destDepPath = path.join(expansionDotFolder, depType, depFileName);
                            await fileManager.copyFile(commonDepPath, destDepPath);
                            console.log(chalk.dim(`    Added agent dependency from common: ${depType}/${depFileName}`));
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.warn(chalk.yellow(`  Warning: Could not parse agent ${agentId} dependencies: ${error.message}`));
                }
              }
            } else {
              console.warn(chalk.yellow(`  Warning: Core agent ${agentId} not found for team ${path.basename(teamFile, '.yaml')}`));
            }
          }
        }
      } catch (error) {
        console.warn(chalk.yellow(`  Warning: Could not parse team file ${teamFile}: ${error.message}`));
      }
    }
  }

  getWebBundleInfo(config) {
    const webBundleType = config.webBundleType || 'all';
    
    switch (webBundleType) {
      case 'all':
        return 'all bundles';
      case 'agents':
        return 'individual agents only';
      case 'teams':
        return config.selectedWebBundleTeams ? 
          `teams: ${config.selectedWebBundleTeams.join(', ')}` : 
          'selected teams';
      case 'custom':
        const parts = [];
        if (config.selectedWebBundleTeams && config.selectedWebBundleTeams.length > 0) {
          parts.push(`teams: ${config.selectedWebBundleTeams.join(', ')}`);
        }
        if (config.includeIndividualAgents) {
          parts.push('individual agents');
        }
        return parts.length > 0 ? parts.join(' + ') : 'custom selection';
      default:
        return 'selected bundles';
    }
  }

  async installWebBundles(webBundlesDirectory, config, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    
    try {
      // Find the dist directory in the orchestrix installation
      const distDir = configLoader.getDistPath();
      
      if (!(await fileManager.pathExists(distDir))) {
        console.warn(chalk.yellow('Web bundles not found. Run "npm run build" to generate them.'));
        return;
      }

      // Ensure web bundles directory exists
      await fileManager.ensureDirectory(webBundlesDirectory);
      
      const webBundleType = config.webBundleType || 'all';
      
      if (webBundleType === 'all') {
        // Copy the entire dist directory structure
        await fileManager.copyDirectory(distDir, webBundlesDirectory);
        console.log(chalk.green(`✓ Installed all web bundles to: ${webBundlesDirectory}`));
      } else {
        let copiedCount = 0;
        
        // Copy specific selections based on type
        if (webBundleType === 'agents' || (webBundleType === 'custom' && config.includeIndividualAgents)) {
          const agentsSource = path.join(distDir, 'agents');
          const agentsTarget = path.join(webBundlesDirectory, 'agents');
          if (await fileManager.pathExists(agentsSource)) {
            await fileManager.copyDirectory(agentsSource, agentsTarget);
            console.log(chalk.green(`✓ Copied individual agent bundles`));
            copiedCount += 10; // Approximate count for agents
          }
        }
        
        if (webBundleType === 'teams' || webBundleType === 'custom') {
          if (config.selectedWebBundleTeams && config.selectedWebBundleTeams.length > 0) {
            const teamsSource = path.join(distDir, 'teams');
            const teamsTarget = path.join(webBundlesDirectory, 'teams');
            await fileManager.ensureDirectory(teamsTarget);
            
            for (const teamId of config.selectedWebBundleTeams) {
              const teamFile = `${teamId}.txt`;
              const sourcePath = path.join(teamsSource, teamFile);
              const targetPath = path.join(teamsTarget, teamFile);
              
              if (await fileManager.pathExists(sourcePath)) {
                await fileManager.copyFile(sourcePath, targetPath);
                copiedCount++;
                console.log(chalk.green(`✓ Copied team bundle: ${teamId}`));
              }
            }
          }
        }
        
        // Always copy expansion packs if they exist
        const expansionSource = path.join(distDir, 'expansion-packs');
        const expansionTarget = path.join(webBundlesDirectory, 'expansion-packs');
        if (await fileManager.pathExists(expansionSource)) {
          await fileManager.copyDirectory(expansionSource, expansionTarget);
          console.log(chalk.green(`✓ Copied expansion pack bundles`));
        }
        
        console.log(chalk.green(`✓ Installed ${copiedCount} selected web bundles to: ${webBundlesDirectory}`));
      }
    } catch (error) {
      console.error(chalk.red(`Failed to install web bundles: ${error.message}`));
    }
  }

  async copyCommonItems(installDir, targetSubdir, spinner) {
    // Ensure modules are initialized
    await initializeModules();
    
    const glob = require('glob');
    const fs = require('fs').promises;
    const sourceBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename)))); // Go up to project root
    const commonPath = path.join(sourceBase, 'common');
    const targetPath = path.join(installDir, targetSubdir);
    const copiedFiles = [];
    
    // Check if common/ exists
    if (!(await fileManager.pathExists(commonPath))) {
      console.warn(chalk.yellow('Warning: common/ folder not found'));
      return copiedFiles;
    }
    
    // Copy all items from common/ to target
    const commonItems = glob.sync('**/*', {
      cwd: commonPath,
      nodir: true
    });
    
    for (const item of commonItems) {
      const sourcePath = path.join(commonPath, item);
      const destPath = path.join(targetPath, item);
      
      // Read the file content
      const content = await fs.readFile(sourcePath, 'utf8');
      
      // Replace {root} with the target subdirectory
      const updatedContent = content.replace(/\{root\}/g, targetSubdir);
      
      // Ensure directory exists
      await fileManager.ensureDirectory(path.dirname(destPath));
      
      // Write the updated content
      await fs.writeFile(destPath, updatedContent, 'utf8');
      copiedFiles.push(path.join(targetSubdir, item));
    }
    
    console.log(chalk.dim(`  Added ${commonItems.length} common utilities`));
    return copiedFiles;
  }

  async detectExpansionPacks(installDir) {
    const expansionPacks = {};
    const glob = require("glob");
    
    // Find all dot folders that might be expansion packs
    const dotFolders = glob.sync(".*", {
      cwd: installDir,
      ignore: [".git", ".git/**", ".orchestrix-core", ".orchestrix-core/**"],
    });
    
    for (const folder of dotFolders) {
      const folderPath = path.join(installDir, folder);
      const stats = await fileManager.pathExists(folderPath);
      
      if (stats) {
        // Check if it has a manifest
        const manifestPath = path.join(folderPath, "install-manifest.yaml");
        if (await fileManager.pathExists(manifestPath)) {
          const manifest = await fileManager.readExpansionPackManifest(installDir, folder.substring(1));
          if (manifest) {
            expansionPacks[folder.substring(1)] = {
              path: folderPath,
              manifest: manifest,
              hasManifest: true
            };
          }
        } else {
          // Check if it has a config.yaml (expansion pack without manifest)
          const configPath = path.join(folderPath, "config.yaml");
          if (await fileManager.pathExists(configPath)) {
            expansionPacks[folder.substring(1)] = {
              path: folderPath,
              manifest: null,
              hasManifest: false
            };
          }
        }
      }
    }
    
    return expansionPacks;
  }

  async repairExpansionPack(installDir, packId, pack, integrity, spinner) {
    spinner.start(`Repairing ${pack.name}...`);
    
    try {
      const expansionDotFolder = path.join(installDir, `.${packId}`);
      
      // Back up modified files
      if (integrity.modified.length > 0) {
        spinner.text = "Backing up modified files...";
        for (const file of integrity.modified) {
          const filePath = path.join(installDir, file);
          if (await fileManager.pathExists(filePath)) {
            const backupPath = await fileManager.backupFile(filePath);
            console.log(chalk.dim(`  Backed up: ${file} → ${path.basename(backupPath)}`));
          }
        }
      }
      
      // Restore missing and modified files
      spinner.text = "Restoring files...";
      const filesToRestore = [...integrity.missing, ...integrity.modified];
      
      for (const file of filesToRestore) {
        // Skip the manifest file itself
        if (file.endsWith('install-manifest.yaml')) continue;
        
        const relativePath = file.replace(`.${packId}/`, '');
        const sourcePath = path.join(pack.packPath, relativePath);
        const destPath = path.join(installDir, file);
        
        // Check if this is a common/ file that needs special processing
        const commonBase = path.dirname(path.dirname(path.dirname(path.dirname(__filename))));
        const commonSourcePath = path.join(commonBase, 'common', relativePath);
        
        if (await fileManager.pathExists(commonSourcePath)) {
          // This is a common/ file - needs template processing
          const fs = require('fs').promises;
          const content = await fs.readFile(commonSourcePath, 'utf8');
          const updatedContent = content.replace(/\{root\}/g, `.${packId}`);
          await fileManager.ensureDirectory(path.dirname(destPath));
          await fs.writeFile(destPath, updatedContent, 'utf8');
          spinner.text = `Restored: ${file}`;
        } else if (await fileManager.pathExists(sourcePath)) {
          // Regular file from expansion pack
          await fileManager.copyFile(sourcePath, destPath);
          spinner.text = `Restored: ${file}`;
        } else {
          console.warn(chalk.yellow(`  Warning: Source file not found: ${file}`));
        }
      }
      
      spinner.succeed(`${pack.name} repaired successfully!`);
      
      // Show summary
      console.log(chalk.green(`\n✓ ${pack.name} repaired!`));
      if (integrity.missing.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.missing.length} missing files`));
      }
      if (integrity.modified.length > 0) {
        console.log(chalk.green(`  Restored ${integrity.modified.length} modified files (backups created)`));
      }
      
    } catch (error) {
      spinner.fail(`Failed to repair ${pack.name}`);
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }

  compareVersions(v1, v2) {
    // Simple semver comparison
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  async cleanupLegacyYmlFiles(installDir, spinner) {
    const glob = require('glob');
    const fs = require('fs').promises;
    
    try {
      // Find all .yml files in the installation directory
      const ymlFiles = glob.sync('**/*.yml', {
        cwd: installDir,
        ignore: ['**/node_modules/**', '**/.git/**']
      });
      
      let deletedCount = 0;
      
      for (const ymlFile of ymlFiles) {
        // Check if corresponding .yaml file exists
        const yamlFile = ymlFile.replace(/\.yml$/, '.yaml');
        const ymlPath = path.join(installDir, ymlFile);
        const yamlPath = path.join(installDir, yamlFile);
        
        if (await fileManager.pathExists(yamlPath)) {
          // .yaml counterpart exists, delete the .yml file
          await fs.unlink(ymlPath);
          deletedCount++;
          console.log(chalk.dim(`  Removed legacy: ${ymlFile} (replaced by ${yamlFile})`));
        }
      }
      
      if (deletedCount > 0) {
        console.log(chalk.green(`✓ Cleaned up ${deletedCount} legacy .yml files`));
      }
      
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not cleanup legacy .yml files: ${error.message}`));
    }
  }

  async findInstallation() {
    // Look for .orchestrix-core in current directory or parent directories
    let currentDir = process.cwd();

    while (currentDir !== path.dirname(currentDir)) {
      const orchestrixDir = path.join(currentDir, ".orchestrix-core");
      const manifestPath = path.join(orchestrixDir, "install-manifest.yaml");

      if (await fileManager.pathExists(manifestPath)) {
        return orchestrixDir;
      }

      currentDir = path.dirname(currentDir);
    }

    // Also check if we're inside a .orchestrix-core directory
    if (path.basename(process.cwd()) === ".orchestrix-core") {
      const manifestPath = path.join(process.cwd(), "install-manifest.yaml");
      if (await fileManager.pathExists(manifestPath)) {
        return process.cwd();
      }
    }

    return null;
  }
}

module.exports = new Installer();
