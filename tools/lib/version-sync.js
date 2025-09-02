/**
 * Version synchronization and auto-update utilities
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const { extractYamlFromAgent, extractAgentDependencies } = require('./yaml-utils');

class VersionSyncManager {
  constructor() {
    this.manifestFile = 'orchestrix-version-manifest.json';
  }

  /**
   * Generate version manifest for all agents and their dependencies
   * @param {string} installDir - Installation directory
   * @returns {Promise<Object>} - Version manifest
   */
  async generateVersionManifest(installDir) {
    const agentsDir = path.join(installDir, '.orchestrix-core', 'agents');
    const manifest = {
      version: await this.getFrameworkVersion(),
      generated: new Date().toISOString(),
      agents: {}
    };

    try {
      const agentFiles = await fs.readdir(agentsDir);
      
      for (const agentFile of agentFiles) {
        if (agentFile.endsWith('.yaml') || agentFile.endsWith('.md')) {
          const agentId = path.basename(agentFile, agentFile.endsWith('.yaml') ? '.yaml' : '.md');
          const agentPath = path.join(agentsDir, agentFile);
          const agentContent = await fs.readFile(agentPath, 'utf8');
          
          const yamlContent = extractYamlFromAgent(agentContent);
          if (yamlContent) {
            const dependencies = extractAgentDependencies(yamlContent);
            
            manifest.agents[agentId] = {
              file: agentFile,
              dependencies,
              lastModified: (await fs.stat(agentPath)).mtime.toISOString(),
              checksum: this.generateChecksum(agentContent)
            };
          }
        }
      }
    } catch (error) {
      console.warn('Failed to generate version manifest:', error.message);
    }

    return manifest;
  }

  /**
   * Get framework version from package.json
   * @returns {Promise<string>} - Framework version
   */
  async getFrameworkVersion() {
    try {
      const packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  /**
   * Generate simple checksum for content
   * @param {string} content - Content to checksum
   * @returns {string} - MD5-like checksum
   */
  generateChecksum(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if agent needs update based on version manifest
   * @param {string} agentId - Agent ID
   * @param {string} installDir - Installation directory
   * @returns {Promise<boolean>} - Whether update is needed
   */
  async needsUpdate(agentId, installDir) {
    const manifestPath = path.join(installDir, this.manifestFile);
    
    try {
      const manifest = await fs.readJson(manifestPath);
      const agentInfo = manifest.agents[agentId];
      
      if (!agentInfo) return true;
      
      // Check for both YAML and MD files
      let agentPath = path.join(installDir, '.orchestrix-core', 'agents', `${agentId}.yaml`);
      if (!await fs.pathExists(agentPath)) {
        agentPath = path.join(installDir, '.orchestrix-core', 'agents', `${agentId}.md`);
        if (!await fs.pathExists(agentPath)) return true;
      }
      
      const currentContent = await fs.readFile(agentPath, 'utf8');
      const currentChecksum = this.generateChecksum(currentContent);
      
      return currentChecksum !== agentInfo.checksum;
    } catch (error) {
      return true; // If manifest doesn't exist, needs update
    }
  }

  /**
   * Update version manifest
   * @param {string} installDir - Installation directory
   */
  async updateManifest(installDir) {
    const manifest = await this.generateVersionManifest(installDir);
    const manifestPath = path.join(installDir, this.manifestFile);
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  }

  /**
   * Auto-update IDE configurations for changed agents
   * @param {string} installDir - Installation directory
   * @param {Array<string>} ides - List of IDEs to update
   */
  async autoUpdateIDEConfigurations(installDir, ides = ['cursor', 'claude-code', 'windsurf', 'trae', 'roo', 'cline']) {
    const ideSetup = require('../installer/lib/ide-setup');
    const updatedAgents = [];

    for (const agentId of await this.getAllAgentIds(installDir)) {
      if (await this.needsUpdate(agentId, installDir)) {
        console.log(`🔄 检测到代理 ${agentId} 需要更新...`);
        
        for (const ide of ides) {
          try {
            await ideSetup.setup(ide, installDir, agentId);
            updatedAgents.push(`${agentId}@${ide}`);
          } catch (error) {
            console.warn(`⚠️  更新 ${ide} 的 ${agentId} 时出错:`, error.message);
          }
        }
      }
    }

    // Update manifest after successful updates
    if (updatedAgents.length > 0) {
      await this.updateManifest(installDir);
      console.log(`✅ 已更新 ${updatedAgents.length} 个代理配置: ${updatedAgents.join(', ')}`);
    }

    return updatedAgents;
  }

  /**
   * Get all agent IDs from installation directory
   * @param {string} installDir - Installation directory
   * @returns {Promise<Array<string>>} - Array of agent IDs
   */
  async getAllAgentIds(installDir) {
    const agentsDir = path.join(installDir, '.orchestrix-core', 'agents');
    try {
      const files = await fs.readdir(agentsDir);
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => path.basename(file, '.md'));
    } catch (error) {
      return [];
    }
  }
}

module.exports = VersionSyncManager;