#!/usr/bin/env node

/**
 * Configuration Structure Migration Script
 *
 * Migrates from old multi-repo config structure to new simplified structure:
 *
 * Old:
 *   project.type: monolith|product-planning|backend|frontend|...
 *   project.product_repo.enabled / product_repo.path
 *   project.repository_id
 *   project.story_assignment.auto_filter
 *
 * New:
 *   project.mode: monolith|multi-repo
 *   project.multi_repo.role: product|implementation|backend|frontend|...
 *   project.multi_repo.repository_id
 *   project.multi_repo.product_repo_path
 *   project.multi_repo.auto_filter_stories
 *
 * Usage:
 *   node tools/migrate-config-structure.js <core-config.yaml>
 *   node tools/migrate-config-structure.js --all  # Migrate all found configs
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

/**
 * Migrate a single config file
 */
function migrateConfig(configPath) {
  console.log(`\n📝 Migrating: ${configPath}`);

  // Read config
  const content = fs.readFileSync(configPath, 'utf8');
  const config = yaml.load(content);

  if (!config.project) {
    console.log('  ⏭️  No project section found, skipping');
    return false;
  }

  let modified = false;

  // Check if already using new structure
  if (config.project.mode && config.project.multi_repo) {
    console.log('  ✅ Already using new structure');
    return false;
  }

  // Create new structure
  const newProject = {
    name: config.project.name || 'My Project',
    mode: 'monolith', // default
    multi_repo: {
      role: 'implementation',
      repository_id: '',
      product_repo_path: '',
      auto_filter_stories: false,
      assigned_stories: []
    }
  };

  // Migrate from old structure

  // 1. Migrate project.type to mode and role
  if (config.project.type) {
    console.log(`  🔄 Migrating project.type: ${config.project.type}`);

    if (config.project.type === 'product-planning') {
      newProject.mode = 'multi-repo';
      newProject.multi_repo.role = 'product';
      modified = true;
    } else if (config.project.type !== 'monolith') {
      newProject.mode = 'multi-repo';
      newProject.multi_repo.role = config.project.type;
      modified = true;
    }
  }

  // 2. Migrate product_repo
  if (config.project.product_repo) {
    console.log('  🔄 Migrating product_repo configuration');

    if (config.project.product_repo.enabled) {
      newProject.mode = 'multi-repo';
      modified = true;
    }

    if (config.project.product_repo.path) {
      newProject.multi_repo.product_repo_path = config.project.product_repo.path;
      modified = true;
    }
  }

  // 3. Migrate repository_id
  if (config.project.repository_id) {
    console.log(`  🔄 Migrating repository_id: ${config.project.repository_id}`);
    newProject.multi_repo.repository_id = config.project.repository_id;
    modified = true;
  }

  // 4. Migrate story_assignment
  if (config.project.story_assignment) {
    console.log('  🔄 Migrating story_assignment configuration');

    if (config.project.story_assignment.auto_filter) {
      newProject.multi_repo.auto_filter_stories = config.project.story_assignment.auto_filter;
      modified = true;
    }

    if (config.project.story_assignment.assigned_stories) {
      newProject.multi_repo.assigned_stories = config.project.story_assignment.assigned_stories;
      modified = true;
    }
  }

  // 5. Migrate implementation_repos (if present at top level)
  if (config.implementation_repos) {
    console.log('  🔄 Moving implementation_repos to multi_repo section');
    newProject.multi_repo.implementation_repos = config.implementation_repos;
    modified = true;
  }

  if (!modified) {
    console.log('  ⏭️  No migration needed');
    return false;
  }

  // Create backup
  const backupPath = configPath + '.backup';
  fs.copyFileSync(configPath, backupPath);
  console.log(`  💾 Backup created: ${backupPath}`);

  // Update config
  config.project = newProject;

  // Write back
  const newContent = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  });

  fs.writeFileSync(configPath, newContent, 'utf8');
  console.log('  ✅ Migration complete!');
  console.log(`\n  📋 Summary:`);
  console.log(`     Mode: ${newProject.mode}`);
  if (newProject.mode === 'multi-repo') {
    console.log(`     Role: ${newProject.multi_repo.role}`);
    console.log(`     Repository ID: ${newProject.multi_repo.repository_id || '(not set)'}`);
    console.log(`     Product Repo Path: ${newProject.multi_repo.product_repo_path || '(not set)'}`);
  }

  return true;
}

/**
 * Find all core-config.yaml files
 */
async function findAllConfigs(baseDir) {
  const pattern = path.join(baseDir, '**/core-config.yaml');
  const files = await glob(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    windowsPathsNoEscape: true
  });
  return files;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  console.log('🔧 Orchestrix Configuration Migration Tool\n');
  console.log('Old structure → New structure');
  console.log('━'.repeat(50));

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('\nUsage:');
    console.log('  node tools/migrate-config-structure.js <core-config.yaml>');
    console.log('  node tools/migrate-config-structure.js --all');
    console.log('\nOptions:');
    console.log('  --all     Migrate all core-config.yaml files found in current directory tree');
    console.log('  --help    Show this help message');
    console.log('\nExample:');
    console.log('  node tools/migrate-config-structure.js orchestrix-core/core-config.yaml');
    console.log('  node tools/migrate-config-structure.js --all');
    return;
  }

  let configsToMigrate = [];

  if (args[0] === '--all') {
    console.log('🔍 Searching for all core-config.yaml files...\n');
    configsToMigrate = await findAllConfigs(process.cwd());

    if (configsToMigrate.length === 0) {
      console.log('❌ No core-config.yaml files found');
      process.exit(1);
    }

    console.log(`Found ${configsToMigrate.length} config file(s):`);
    configsToMigrate.forEach((f, i) => {
      console.log(`  ${i + 1}. ${path.relative(process.cwd(), f)}`);
    });
  } else {
    const configPath = path.resolve(args[0]);

    if (!fs.existsSync(configPath)) {
      console.error(`❌ File not found: ${configPath}`);
      process.exit(1);
    }

    configsToMigrate = [configPath];
  }

  console.log('\n' + '━'.repeat(50));

  let successCount = 0;
  let skipCount = 0;

  for (const configPath of configsToMigrate) {
    try {
      const migrated = migrateConfig(configPath);
      if (migrated) {
        successCount++;
      } else {
        skipCount++;
      }
    } catch (error) {
      console.error(`\n❌ Error migrating ${configPath}:`);
      console.error(`   ${error.message}`);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Migrated: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   📁 Total: ${configsToMigrate.length}`);

  if (successCount > 0) {
    console.log('\n💡 Next Steps:');
    console.log('   1. Review the migrated configuration files');
    console.log('   2. Test your project with the new configuration');
    console.log('   3. Delete .backup files if everything works correctly');
    console.log('   4. Commit the changes to your repository');
  }

  console.log('');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error.message);
    console.error(error.stack);
    process.exit(2);
  });
}

module.exports = { migrateConfig };
