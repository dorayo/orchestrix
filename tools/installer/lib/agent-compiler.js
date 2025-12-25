const path = require('path');
const fs = require('fs-extra');

/**
 * Agent File Manager for Installer
 *
 * Handles copying of agent YAML files during installation process.
 * Note: Compilation is no longer needed - all agents are now standalone .yaml files.
 */
class AgentCompiler {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Copy agents for installation
   * @param {string} sourceDir - Source directory (orchestrix-core)
   * @param {string} tempDir - Temporary directory for files
   * @returns {Promise<Object>} - Copy result
   */
  async compileForInstallation(sourceDir, tempDir) {
    try {
      const agentsSourceDir = path.join(sourceDir, 'agents');
      const agentsTempDir = path.join(tempDir, 'agents');

      // Ensure temp directory exists
      await fs.ensureDir(agentsTempDir);

      // Get all .yaml files (excluding directories)
      const files = await fs.readdir(agentsSourceDir);
      const yamlFiles = files.filter(f => f.endsWith('.yaml'));

      if (yamlFiles.length === 0) {
        this.log('No agent .yaml files found');
        return {
          compiled: 0,
          copied: 0,
          usedExisting: true
        };
      }

      this.log(`Found ${yamlFiles.length} agent files to copy`);

      // Copy all .yaml files
      let copied = 0;
      for (const yamlFile of yamlFiles) {
        await fs.copy(
          path.join(agentsSourceDir, yamlFile),
          path.join(agentsTempDir, yamlFile)
        );
        copied++;
        this.log(`Copied: ${yamlFile}`);
      }

      return {
        compiled: 0,  // No compilation needed
        copied,
        usedExisting: false
      };

    } catch (error) {
      console.error('Failed to copy agents:', error.message);
      throw error;
    }
  }

  /**
   * Check if agents need compilation (always returns false now)
   * @param {string} agentsDir - Agents directory
   * @returns {Promise<boolean>} - Always false since compilation is removed
   */
  async needsCompilation(agentsDir) {
    return false;
  }

  /**
   * Get status for display
   * @param {string} agentsDir - Agents directory
   * @returns {Promise<Object>} - Status information
   */
  async getCompilationStatus(agentsDir) {
    try {
      const files = await fs.readdir(agentsDir);
      const yamlFiles = files.filter(f => f.endsWith('.yaml'));

      return {
        hasSrcFiles: false,  // No more src files
        srcCount: 0,
        yamlCount: yamlFiles.length,
        needsCompilation: false,
        outdated: []
      };

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
