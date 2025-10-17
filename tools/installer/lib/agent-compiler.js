const path = require('path');
const fs = require('fs-extra');
const YamlCompiler = require('../../lib/yaml-compiler');

/**
 * Agent Compiler Integration for Installer
 * 
 * Handles compilation of agent YAML files during installation process
 */
class AgentCompiler {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.compiler = new YamlCompiler({ verbose: this.verbose });
  }

  /**
   * Compile agents before installation
   * @param {string} sourceDir - Source directory (orchestrix-core)
   * @param {string} tempDir - Temporary directory for compiled files
   * @returns {Promise<Object>} - Compilation result
   */
  async compileForInstallation(sourceDir, tempDir) {
    try {
      const agentsSourceDir = path.join(sourceDir, 'agents');
      const agentsTempDir = path.join(tempDir, 'agents');
      
      // Ensure temp directory exists
      await fs.ensureDir(agentsTempDir);
      
      // Check if there are any .src.yaml files
      const files = await fs.readdir(agentsSourceDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      
      if (srcFiles.length === 0) {
        // No source files, just copy existing .yaml files
        this.log('No .src.yaml files found, using existing .yaml files');
        return {
          compiled: 0,
          copied: 0,
          usedExisting: true
        };
      }
      
      this.log(`Found ${srcFiles.length} agent source files to compile`);
      
      // Compile all source files
      const compiled = await this.compiler.compileAllAgents(agentsSourceDir, agentsTempDir);
      
      // Also copy any existing .yaml files that don't have .src.yaml counterparts
      const yamlFiles = files.filter(f => f.endsWith('.yaml') && !f.endsWith('.src.yaml'));
      let copied = 0;
      
      for (const yamlFile of yamlFiles) {
        const baseName = yamlFile.replace('.yaml', '');
        const hasSrcFile = srcFiles.some(f => f.startsWith(baseName + '.'));
        
        if (!hasSrcFile) {
          // No source file, copy the existing .yaml
          await fs.copy(
            path.join(agentsSourceDir, yamlFile),
            path.join(agentsTempDir, yamlFile)
          );
          copied++;
          this.log(`Copied existing: ${yamlFile}`);
        }
      }
      
      // Copy common directory if it exists
      const commonSourceDir = path.join(agentsSourceDir, 'common');
      if (await fs.pathExists(commonSourceDir)) {
        const commonTempDir = path.join(agentsTempDir, 'common');
        await fs.copy(commonSourceDir, commonTempDir);
        this.log('Copied common configuration files');
      }
      
      return {
        compiled,
        copied,
        usedExisting: false
      };
      
    } catch (error) {
      console.error('Failed to compile agents:', error.message);
      throw error;
    }
  }

  /**
   * Compile agents in-place (for development/testing)
   * @param {string} agentsDir - Agents directory
   * @returns {Promise<number>} - Number of files compiled
   */
  async compileInPlace(agentsDir) {
    try {
      return await this.compiler.compileAllAgents(agentsDir, agentsDir);
    } catch (error) {
      console.error('Failed to compile agents in-place:', error.message);
      throw error;
    }
  }

  /**
   * Check if agents need compilation
   * @param {string} agentsDir - Agents directory
   * @returns {Promise<boolean>} - True if compilation needed
   */
  async needsCompilation(agentsDir) {
    try {
      const files = await fs.readdir(agentsDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      
      if (srcFiles.length === 0) {
        return false; // No source files
      }
      
      // Check if any source file is newer than its compiled version
      for (const srcFile of srcFiles) {
        const sourcePath = path.join(agentsDir, srcFile);
        const outputPath = path.join(agentsDir, srcFile.replace('.src.yaml', '.yaml'));
        
        if (await this.compiler.needsCompilation(sourcePath, outputPath)) {
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      return true; // On error, assume compilation needed
    }
  }

  /**
   * Get compilation status for display
   * @param {string} agentsDir - Agents directory
   * @returns {Promise<Object>} - Status information
   */
  async getCompilationStatus(agentsDir) {
    try {
      const files = await fs.readdir(agentsDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      const yamlFiles = files.filter(f => f.endsWith('.yaml') && !f.endsWith('.src.yaml'));
      
      const status = {
        hasSrcFiles: srcFiles.length > 0,
        srcCount: srcFiles.length,
        yamlCount: yamlFiles.length,
        needsCompilation: false,
        outdated: []
      };
      
      if (srcFiles.length > 0) {
        for (const srcFile of srcFiles) {
          const sourcePath = path.join(agentsDir, srcFile);
          const outputPath = path.join(agentsDir, srcFile.replace('.src.yaml', '.yaml'));
          
          if (await this.compiler.needsCompilation(sourcePath, outputPath)) {
            status.needsCompilation = true;
            status.outdated.push(srcFile);
          }
        }
      }
      
      return status;
      
    } catch (error) {
      return {
        hasSrcFiles: false,
        srcCount: 0,
        yamlCount: 0,
        needsCompilation: false,
        outdated: [],
        error: error.message
      };
    }
  }

  /**
   * Log message if verbose mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }
}

module.exports = AgentCompiler;
