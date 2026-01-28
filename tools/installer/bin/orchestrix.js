#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');

// Dynamic imports for ES modules
let chalk, inquirer;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
    inquirer = (await import('inquirer')).default;
  }
}

// Handle both execution contexts (from root via npx or from installer directory)
let version;
let installer;
try {
  // Try installer context first (when run from tools/installer/)
  version = require('../package.json').version;
  installer = require('../lib/installer');
} catch (e) {
  // Fall back to root context (when run via npx from GitHub)
  console.log(`Installer context not found (${e.message}), trying root context...`);
  try {
    version = require('../../../package.json').version;
    installer = require('../../../tools/installer/lib/installer');
  } catch (e2) {
    console.error('Error: Could not load required modules. Please ensure you are running from the correct directory.');
    console.error('Debug info:', {
      __dirname,
      cwd: process.cwd(),
      error: e2.message
    });
    process.exit(1);
  }
}

program
  .version(version)
  .description('Orchestrix 安装器 - 适用于任何领域的通用 AI 代理框架');

program
  .command('install')
  .description('安装 Orchestrix 代理和工具 (默认极速模式: 自动安装 Cursor + Claude Code + Web Bundle)')
  .option('-i, --interactive', '交互式安装模式 (原默认模式)')
  .option('-f, --full', '安装完整的 Orchestrix')
  .option('-x, --expansion-only', '仅安装扩展包 (不含 orchestrix-core)')
  .option('-d, --directory <path>', '安装目录')
  .option('--ide <ide...>', '为指定的 IDE 配置 (可指定多个:cursor, claude-code, windsurf, trae, roo, cline, gemini, github-copilot, other)')
  .option('-e, --expansion-packs <packs...>', '安装指定的扩展包 (可指定多个)')
  .option('-l, --lang <lang>', '设置 Agent 语言 (例如: zh, en，默认为 en)')
  .action(async (options) => {
    try {
      await initializeModules();
      
      if (options.interactive) {
        // Interactive mode (when -i flag is used)
        const answers = await promptInstallation();
        if (!answers._alreadyInstalled) {
          await installer.install(answers);
        }
      } else if (options.full || options.expansionOnly) {
        // Explicit direct mode with specific options
        let installType = 'full';
        if (options.expansionOnly) installType = 'expansion-only';

        const config = {
          installType,
          directory: options.directory || '.',
          ides: (options.ide || []).filter(ide => ide !== 'other'),
          expansionPacks: options.expansionPacks || [],
          language: options.lang || 'en'
        };
        await installer.install(config);
      } else {
        // Default: Speed mode (Cursor + Claude Code + Web Bundle) - silent by default
        // Display ASCII logo
        console.log(chalk.bold.cyan(`
  ██████╗ ██████╗  ██████╗██╗  ██╗███████╗███████╗████████╗██████╗ ██╗██╗  ██╗
  ██╔═══██╗██╔══██╗██╔════╝██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██║╚██╗██╔╝
  ██║   ██║██████╔╝██║     ███████║█████╗  ███████╗   ██║   ██████╔╝██║ ╚███╔╝
  ██║   ██║██╔══██╗██║     ██╔══██║██╔══╝  ╚════██║   ██║   ██╔══██╗██║ ██╔██╗
  ╚██████╔╝██║  ██║╚██████╗██║  ██║███████╗███████║   ██║   ██║  ██║██║██╔╝ ██╗
   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝`));

        const config = {
          installType: 'full',
          directory: options.directory || '.',
          ides: ['cursor', 'claude-code'],
          expansionPacks: [],
          includeWebBundles: true,
          webBundleType: 'all',
          webBundlesDirectory: `${options.directory || '.'}/web-bundles`,
          prdSharded: true,
          architectureSharded: true,
          quiet: true, // 默认静默模式
          language: options.lang || 'en'
        };
        await installer.install(config);

        // Get installed version
        const installedVersion = await installer.getCoreVersion();
        console.log(chalk.green.bold(`\n  ✅ Orchestrix v${installedVersion} 已安装`));
      }
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('安装失败:'), error.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('更新现有的 Orchestrix 安装')
  .option('--force', '强制更新，覆盖已修改的文件')
  .option('--dry-run', '显示将要更新的内容，但不执行实际更改')
  .action(async () => {
    try {
      await installer.update();
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('更新失败:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('列出可用的代理和扩展包')
  .option('-e, --expansions', '仅列出扩展包')
  .option('-a, --agents', '仅列出代理')
  .action(async (options) => {
    try {
      if (options.expansions) {
        await installer.listExpansionPacks();
      } else if (options.agents) {
        await installer.listAgents();
      } else {
        // Show both agents and expansion packs
        console.log('=== Orchestrix 代理 ===');
        await installer.listAgents();
        console.log('\n=== Orchestrix 扩展包 ===');
        await installer.listExpansionPacks();
      }
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list:expansions')
  .description('列出可用的扩展包')
  .action(async () => {
    try {
      await installer.listExpansionPacks();
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('显示安装状态')
  .action(async () => {
    try {
      await installer.showStatus();
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('错误:'), error.message);
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('同步代理配置和版本更新')
  .option('--dry-run', '显示将要同步的内容，但不执行实际更改')
  .option('--ide <ide...>', '指定要同步的 IDE (cursor, claude-code, windsurf, trae, roo, cline)')
  .action(async (options) => {
    try {
      await initializeModules();
      const VersionSyncManager = require('../../../tools/lib/version-sync');
      const syncManager = new VersionSyncManager();
      
      const installDir = process.cwd();
      const ides = options.ide || ['cursor', 'claude-code', 'windsurf', 'trae', 'roo', 'cline'];
      
      if (options.dryRun) {
        console.log(chalk.cyan('🔍 干运行模式 - 显示将要同步的内容:'));
        const manifest = await syncManager.generateVersionManifest(installDir);
        console.log('版本清单:', JSON.stringify(manifest, null, 2));
      } else {
        console.log(chalk.cyan('🔄 同步代理配置...'));
        const updated = await syncManager.autoUpdateIDEConfigurations(installDir, ides);
        console.log(chalk.green(`✅ 同步完成！更新了 ${updated.length} 个配置`));
      }
    } catch (error) {
      if (!chalk) await initializeModules();
      console.error(chalk.red('同步失败:'), error.message);
      process.exit(1);
    }
  });

async function promptInstallation() {
  await initializeModules();
  
  // Display ASCII logo
  console.log(chalk.bold.cyan(`
 ██████╗ ██████╗  ██████╗██╗  ██╗███████╗███████╗████████╗██████╗ ██╗██╗  ██╗
██╔═══██╗██╔══██╗██╔════╝██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██║╚██╗██╔╝
██║   ██║██████╔╝██║     ███████║█████╗  ███████╗   ██║   ██████╔╝██║ ╚███╔╝ 
██║   ██║██╔══██╗██║     ██╔══██║██╔══╝  ╚════██║   ██║   ██╔══██╗██║ ██╔██╗ 
╚██████╔╝██║  ██║╚██████╗██║  ██║███████╗███████║   ██║   ██║  ██║██║██╔╝ ██╗
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ 
  `));
  
  console.log(chalk.bold.magenta('🚀 适用于任何领域的通用 AI 代理框架'));
  console.log(chalk.bold.blue(`✨ 安装器 v${version}\n`));

  const answers = {};

  // Ask for installation directory first
  const { directory } = await inquirer.prompt([
    {
      type: 'input',
      name: 'directory',
      message: '请输入Orchestrix的安装项目目录的完整路径:',
      validate: (input) => {
        if (!input.trim()) {
          return '请输入有效的项目路径';
        }
        return true;
      }
    }
  ]);
  answers.directory = directory;

  // Detect existing installations
  const installDir = path.resolve(directory);
  const state = await installer.detectInstallationState(installDir);
  
  // Check for existing expansion packs
  const existingExpansionPacks = state.expansionPacks || {};
  
  // Get available expansion packs
  const availableExpansionPacks = await installer.getAvailableExpansionPacks();
  
  // Build choices list
  const choices = [];
  
  // Load core config to get short-title
  const coreConfigPath = path.join(__dirname, '..', '..', '..', 'orchestrix-core', 'core-config.yaml');
  const coreConfig = yaml.load(await fs.readFile(coreConfigPath, 'utf8'));
  const coreShortTitle = coreConfig['short-title'] || 'Orchestrix 敏捷核心系统';
  
      // Add Orchestrix core option
    let orchestrixOptionText;
  if (state.type === 'existing') {
    const currentVersion = state.manifest?.version || '未知';
    const newVersion = coreConfig.version || '未知'; // Use version from core-config.yaml
    const versionInfo = currentVersion === newVersion 
      ? `(v${currentVersion} - 重新安装)`
      : `(v${currentVersion} → v${newVersion})`;
          orchestrixOptionText = `更新 ${coreShortTitle} ${versionInfo} .orchestrix-core`;
    } else {
      orchestrixOptionText = `安装 ${coreShortTitle} (v${coreConfig.version || version}) .orchestrix-core`;
  }
  
  choices.push({
          name: orchestrixOptionText,
      value: 'orchestrix-core',
    checked: true
  });
  
  // Add expansion pack options
  for (const pack of availableExpansionPacks) {
    const existing = existingExpansionPacks[pack.id];
    let packOptionText;
    
    if (existing) {
      const currentVersion = existing.manifest?.version || '未知';
      const newVersion = pack.version;
      const versionInfo = currentVersion === newVersion 
        ? `(v${currentVersion} - 重新安装)`
        : `(v${currentVersion} → v${newVersion})`;
      packOptionText = `更新 ${pack.description} ${versionInfo} .${pack.id}`;
    } else {
      packOptionText = `安装 ${pack.description} (v${pack.version}) .${pack.id}`;
    }
    
    choices.push({
      name: packOptionText,
      value: pack.id,
      checked: false
    });
  }
  
  // Ask what to install
  // const { selectedItems } = await inquirer.prompt([
  //   {
  //     type: 'checkbox',
  //     name: 'selectedItems',
  //     message: 'Select what to install/update (use space to select, enter to continue):',
  //     choices: choices,
  //     validate: (selected) => {
  //       if (selected.length === 0) {
  //         return 'Please select at least one item to install';
  //       }
  //       return true;
  //     }
  //   }
  // ]);
  const selectedItems = ['orchestrix-core'];
  
  // Process selections
      answers.installType = selectedItems.includes('orchestrix-core') ? 'full' : 'expansion-only';
    answers.expansionPacks = selectedItems.filter(item => item !== 'orchestrix-core');

      // Ask sharding questions if installing Orchestrix core
    if (selectedItems.includes('orchestrix-core')) {
    console.log(chalk.cyan('\n📋 文档组织设置'));
    console.log(chalk.dim('配置您的项目文档应如何组织。\n'));
    
    // Ask about PRD sharding
    const { prdSharded } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'prdSharded',
        message: 'PRD (产品需求文档) 是否会分片到多个文件中？',
        default: true
      }
    ]);
    answers.prdSharded = prdSharded;
    
    // Ask about architecture sharding
    const { architectureSharded } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'architectureSharded',
        message: '架构文档是否会分片到多个文件中？',
        default: true
      }
    ]);
    answers.architectureSharded = architectureSharded;
    
    // Show warning if architecture sharding is disabled
    if (!architectureSharded) {
      console.log(chalk.yellow.bold('\n⚠️  重要提示：架构分片已禁用'));
      console.log(chalk.yellow('在禁用架构分片的情况下，您仍应创建 devLoadAlwaysFiles 中列出的文件 (例如 coding-standards.md, tech-stack.md, source-tree.md)'));
      console.log(chalk.yellow('因为开发代理在运行时会使用这些文件。'));
      console.log(chalk.yellow('\n或者，您可以在安装后从 core-config.yaml 的 devLoadAlwaysFiles 列表中删除这些文件。'));
      
      const { acknowledge } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'acknowledge',
          message: '您是否确认此要求并希望继续？',
          default: false
        }
      ]);
      
      if (!acknowledge) {
        console.log(chalk.red('安装已取消。'));
        process.exit(0);
      }
    }
  }

  // Ask for IDE configuration
  let ides = [];
  let ideSelectionComplete = false;
  
  while (!ideSelectionComplete) {
    console.log(chalk.cyan('\n🛠️  IDE 配置'));
    console.log(chalk.bold.yellow.bgRed(' ⚠️  重要提示：这是一个多选列表！请使用空格键来选择/取消选择每个 IDE！ '));
    console.log(chalk.bold.magenta('🔸 使用方向键导航'));
    console.log(chalk.bold.magenta('🔸 使用空格键选择/取消选择 IDE'));
    console.log(chalk.bold.magenta('🔸 选择完成后按 Enter 键\n'));
    
    const ideResponse = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'ides',
        message: '您希望配置哪个 IDE？ (使用空格键选择，按 Enter 键确认):',
        choices: [
          { name: 'Cursor', value: 'cursor' },
          { name: 'Claude Code', value: 'claude-code' },
          { name: 'Windsurf', value: 'windsurf' },
          { name: 'Trae', value: 'trae' }, // { name: 'Trae', value: 'trae'}
          { name: 'Roo Code', value: 'roo' },
          { name: 'Cline', value: 'cline' },
          { name: 'Gemini CLI', value: 'gemini' },
          { name: 'Github Copilot', value: 'github-copilot' }
        ]
      }
    ]);
    
    ides = ideResponse.ides;

    // Confirm no IDE selection if none selected
    if (ides.length === 0) {
      const { confirmNoIde } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmNoIde',
          message: chalk.red('⚠️  您尚未选择任何 IDE。这意味着不会设置 IDE 集成。是否正确？'),
          default: false
        }
      ]);
      
      if (!confirmNoIde) {
        console.log(chalk.bold.red('\n🔄 正在返回 IDE 选择。请记得使用空格键选择 IDE！\n'));
        continue; // Go back to IDE selection only
      }
    }
    
    ideSelectionComplete = true;
  }

  // Use selected IDEs directly
  answers.ides = ides;

  // Configure GitHub Copilot immediately if selected
  if (ides.includes('github-copilot')) {
    console.log(chalk.cyan('\n🔧 GitHub Copilot 配置'));
    console.log(chalk.dim('Orchestrix 需要特定的 VS Code 设置以获得最佳的代理体验。\n'));
    
    const { configChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configChoice',
        message: chalk.yellow('您希望如何配置 GitHub Copilot 设置？'),
        choices: [
          {
            name: '使用推荐的默认设置 (最快设置)',
            value: 'defaults'
          },
          {
            name: '手动配置每个设置 (根据您的偏好自定义)',
            value: 'manual'
          },
          {
            name: '跳过设置配置 (我稍后会手动配置)',
            value: 'skip'
          }
        ],
        default: 'defaults'
      }
    ]);
    
    answers.githubCopilotConfig = { configChoice };
  }

  // Ask for web bundles installation
  const { includeWebBundles } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'includeWebBundles',
      message: '您想包含预构建的 Web bundles 吗？ (适用于 ChatGPT, Claude, Gemini 的独立文件)',
      default: false
    }
  ]);

  if (includeWebBundles) {
    console.log(chalk.cyan('\n📦 Web bundles 是非常适合 Web AI 平台的独立文件。'));
    console.log(chalk.dim('   您可以选择与 IDE 安装不同的团队/代理。\n'));

    const { webBundleType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'webBundleType',
        message: '您想包含哪些 Web bundles？',
        choices: [
          {
            name: '所有可用的 bundles (代理, 团队, 扩展包)',
            value: 'all'
          },
          {
            name: '仅特定团队',
            value: 'teams'
          },
          {
            name: '仅单个代理',
            value: 'agents'
          },
          {
            name: '自定义选择',
            value: 'custom'
          }
        ]
      }
    ]);

    answers.webBundleType = webBundleType;

    // If specific teams, let them choose which teams
    if (webBundleType === 'teams' || webBundleType === 'custom') {
      const teams = await installer.getAvailableTeams();
      const { selectedTeams } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'selectedTeams',
          message: '选择要包含的团队 bundles:',
          choices: teams.map(t => ({
            name: `${t.icon || '📋'} ${t.name}: ${t.description}`,
            value: t.id,
            checked: webBundleType === 'teams' // Check all if teams-only mode
          })),
          validate: (answer) => {
            if (answer.length < 1) {
              return '您必须至少选择一个团队。';
            }
            return true;
          }
        }
      ]);
      answers.selectedWebBundleTeams = selectedTeams;
    }

    // If custom selection, also ask about individual agents
    if (webBundleType === 'custom') {
      const { includeIndividualAgents } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'includeIndividualAgents',
          message: '是否也包含单个代理的 bundles？',
          default: true
        }
      ]);
      answers.includeIndividualAgents = includeIndividualAgents;
    }

    const { webBundlesDirectory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'webBundlesDirectory',
        message: '输入 Web bundles 的目录:',
        default: `${answers.directory}/web-bundles`,
        validate: (input) => {
          if (!input.trim()) {
            return '请输入有效的目录路径';
          }
          return true;
        }
      }
    ]);
    answers.webBundlesDirectory = webBundlesDirectory;
  }

  answers.includeWebBundles = includeWebBundles;

  return answers;
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}