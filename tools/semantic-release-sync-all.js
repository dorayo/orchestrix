/**
 * Semantic-release plugin to sync all version-related files
 * This replaces the old semantic-release-sync-installer.js with comprehensive version management
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function prepare(pluginConfig, context) {
  // pluginConfig is required by semantic-release interface but unused here
  const { nextRelease, logger } = context;
  const newVersion = nextRelease.version;
  
  logger.log(`🚀 Starting comprehensive version sync to ${newVersion}`);
  
  try {
    // 1. Sync installer package.json
    const installerPackagePath = path.join(process.cwd(), 'tools', 'installer', 'package.json');
    if (fs.existsSync(installerPackagePath)) {
      const installerPackage = JSON.parse(fs.readFileSync(installerPackagePath, 'utf8'));
      const oldInstallerVersion = installerPackage.version;
      installerPackage.version = newVersion;
      fs.writeFileSync(installerPackagePath, JSON.stringify(installerPackage, null, 2) + '\n');
      logger.log(`✓ Synced installer package.json: ${oldInstallerVersion} → ${newVersion}`);
    } else {
      logger.warn('⚠️  Installer package.json not found, skipping');
    }
    
    // 2. Sync orchestrix-core config
    const coreConfigPath = path.join(process.cwd(), 'orchestrix-core', 'core-config.yaml');
    if (fs.existsSync(coreConfigPath)) {
      const coreConfig = yaml.load(fs.readFileSync(coreConfigPath, 'utf8'));
      const oldCoreVersion = coreConfig.version || 'unknown';
      coreConfig.version = newVersion;
      fs.writeFileSync(coreConfigPath, yaml.dump(coreConfig, { indent: 2 }));
      logger.log(`✓ Synced orchestrix-core config: ${oldCoreVersion} → ${newVersion}`);
    } else {
      logger.warn('⚠️  Core config not found, skipping');
    }
    
    // 3. Fix CLI hardcoded version by making it dynamic
    const cliPath = path.join(process.cwd(), 'tools', 'cli.js');
    if (fs.existsSync(cliPath)) {
      let cliContent = fs.readFileSync(cliPath, 'utf8');
      
      // Check if it still has hardcoded version
      if (cliContent.includes(`.version('1.0.0')`) || cliContent.match(/\.version\(['"`]\d+\.\d+\.\d+['"`]\)/)) {
        cliContent = cliContent.replace(
          /\.version\(['"`][^'"`]+['"`]\)/,
          `.version(require('../package.json').version)`
        );
        fs.writeFileSync(cliPath, cliContent);
        logger.log(`✓ Fixed CLI to use dynamic version loading`);
      } else {
        logger.log(`✓ CLI already using dynamic version loading`);
      }
    } else {
      logger.warn('⚠️  CLI file not found, skipping');
    }
    
    logger.log(`🎉 Version sync completed successfully for v${newVersion}`);
    
  } catch (error) {
    logger.error('❌ Error during version sync:', error.message);
    throw error;
  }
}

module.exports = { prepare };