const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { extractYamlFromAgent, loadAgentYaml, getAgentMetadata } = require('../../lib/yaml-utils');

class ConfigLoader {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'config', 'install.config.yaml');
    this.config = null;
  }

  async load() {
    if (this.config) return this.config;
    
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  async getInstallationOptions() {
    const config = await this.load();
    return config['installation-options'] || {};
  }

  async getAvailableAgents() {
    const agentsDir = path.join(this.getOrchestrixCorePath(), 'agents');
    
    try {
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      const agents = [];
      
      for (const entry of entries) {
        // Support both .yaml and .md files (for backward compatibility)
        if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.md'))) {
          const agentPath = path.join(agentsDir, entry.name);
          const agentId = path.basename(entry.name, entry.name.endsWith('.yaml') ? '.yaml' : '.md');
          
          try {
            let agentConfig = null;
            
            if (entry.name.endsWith('.yaml')) {
              // Direct YAML file loading
              const config = await loadAgentYaml(agentPath);
              if (config) {
                const metadata = getAgentMetadata(config);
                agentConfig = {
                  title: metadata.title,
                  name: metadata.name,
                  whenToUse: metadata.description
                };
              }
            } else {
              // Legacy MD file support
              const agentContent = await fs.readFile(agentPath, 'utf8');
              const yamlContentText = extractYamlFromAgent(agentContent);
              if (yamlContentText) {
                const yamlContent = yaml.load(yamlContentText);
                agentConfig = yamlContent.agent || {};
              }
            }
            
            if (agentConfig) {
              agents.push({
                id: agentId,
                name: agentConfig.title || agentConfig.name || agentId,
                file: `orchestrix-core/agents/${entry.name}`,
                description: agentConfig.whenToUse || 'No description available'
              });
            }
          } catch (error) {
            console.warn(`Failed to read agent ${entry.name}: ${error.message}`);
          }
        }
      }
      
      // Sort agents by name for consistent display
      agents.sort((a, b) => a.name.localeCompare(b.name));
      
      return agents;
    } catch (error) {
      console.warn(`Failed to read agents directory: ${error.message}`);
      return [];
    }
  }

  async getAvailableExpansionPacks() {
    const expansionPacksDir = path.join(this.getOrchestrixCorePath(), '..', 'expansion-packs');
    
    try {
      const entries = await fs.readdir(expansionPacksDir, { withFileTypes: true });
      const expansionPacks = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const packPath = path.join(expansionPacksDir, entry.name);
          const configPath = path.join(packPath, 'config.yaml');
          
          try {
            // Read config.yaml
            const configContent = await fs.readFile(configPath, 'utf8');
            const config = yaml.load(configContent);
            
            expansionPacks.push({
              id: entry.name,
              name: config.name || entry.name,
              description: config['short-title'] || config.description || 'No description available',
              fullDescription: config.description || config['short-title'] || 'No description available',
              version: config.version || '1.0.0',
              author: config.author || 'Orchestrix Team',
              packPath: packPath,
              dependencies: config.dependencies?.agents || []
            });
          } catch (error) {
            // Fallback if config.yaml doesn't exist or can't be read
            console.warn(`Failed to read config for expansion pack ${entry.name}: ${error.message}`);
            
            // Try to derive info from directory name as fallback
            const name = entry.name
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            expansionPacks.push({
              id: entry.name,
              name: name,
              description: 'No description available',
              fullDescription: 'No description available',
              version: '1.0.0',
              author: 'Orchestrix Team',
              packPath: packPath,
              dependencies: []
            });
          }
        }
      }
      
      return expansionPacks;
    } catch (error) {
      console.warn(`Failed to read expansion packs directory: ${error.message}`);
      return [];
    }
  }

  async getAgentDependencies(agentId) {
    // Use DependencyResolver to dynamically parse agent dependencies
    const DependencyResolver = require('../../lib/dependency-resolver');
    const resolver = new DependencyResolver(path.join(__dirname, '..', '..', '..'));
    
    const agentDeps = await resolver.resolveAgentDependencies(agentId);
    
    // Convert to flat list of file paths
    const depPaths = [];
    
    // Core files and utilities are included automatically by DependencyResolver
    
    // Add agent file itself is already handled by installer
    
    // Add all resolved resources
    for (const resource of agentDeps.resources) {
      const filePath = `.orchestrix-core/${resource.type}/${resource.id}.md`;
      if (!depPaths.includes(filePath)) {
        depPaths.push(filePath);
      }
    }
    
    return depPaths;
  }

  async getIdeConfiguration(ide) {
    const config = await this.load();
    const ideConfigs = config['ide-configurations'] || {};
    return ideConfigs[ide] || null;
  }

  getOrchestrixCorePath() {
    // Get the path to orchestrix-core relative to the installer (now under tools)
    return path.join(__dirname, '..', '..', '..', 'orchestrix-core');
  }

  getDistPath() {
    // Get the path to dist directory relative to the installer
    return path.join(__dirname, '..', '..', '..', 'dist');
  }

  getAgentPath(agentId) {
    return path.join(this.getOrchestrixCorePath(), 'agents', `${agentId}.md`);
  }

  async getAvailableTeams() {
    const teamsDir = path.join(this.getOrchestrixCorePath(), 'agent-teams');
    
    try {
      const entries = await fs.readdir(teamsDir, { withFileTypes: true });
      const teams = [];
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.yaml')) {
          const teamPath = path.join(teamsDir, entry.name);
          
          try {
            const teamContent = await fs.readFile(teamPath, 'utf8');
            const teamConfig = yaml.load(teamContent);
            
            if (teamConfig.bundle) {
              teams.push({
                id: path.basename(entry.name, '.yaml'),
                name: teamConfig.bundle.name || entry.name,
                description: teamConfig.bundle.description || 'Team configuration',
                icon: teamConfig.bundle.icon || '📋'
              });
            }
          } catch (error) {
            console.warn(`Warning: Could not load team config ${entry.name}: ${error.message}`);
          }
        }
      }
      
      return teams;
    } catch (error) {
      console.warn(`Warning: Could not scan teams directory: ${error.message}`);
      return [];
    }
  }

  getTeamPath(teamId) {
    return path.join(this.getOrchestrixCorePath(), 'agent-teams', `${teamId}.yaml`);
  }

  /**
   * Resolve document paths for multi-repo configurations
   * If mode is multi-repo and role is implementation, override document locations to point to product repo
   * @param {Object} config - The core config object
   * @returns {Object} - Config with resolved document paths
   */
  resolveDocumentPaths(config) {
    if (!config) return config;

    // Check if this is multi-repo mode with implementation role
    const isMultiRepo = config.project?.mode === 'multi-repo';
    const isImplementation = config.project?.multi_repo?.role &&
                             config.project.multi_repo.role !== 'product';
    const productPath = config.project?.multi_repo?.product_repo_path;

    if (isMultiRepo && isImplementation) {
      if (!productPath) {
        console.warn('Warning: multi-repo mode enabled but product_repo_path is not specified');
        return config;
      }

      // Resolve relative path to absolute
      const absoluteProductPath = path.isAbsolute(productPath)
        ? productPath
        : path.resolve(process.cwd(), productPath);

      // Override document locations to point to product repo
      return {
        ...config,
        document_locations: {
          prd: path.join(absoluteProductPath, 'docs/prd.md'),
          architecture: path.join(absoluteProductPath, 'docs/architecture'),
          api_contracts: path.join(absoluteProductPath, 'docs/architecture/api-contracts.md'),
          epics: path.join(absoluteProductPath, 'docs/epics'),
          // Local paths for stories remain in implementation repo
          devStoryLocation: config.devStoryLocation || 'docs/stories',
        },
        // Preserve other document locations from original config
        prd: {
          ...(config.prd || {}),
          prdFile: path.join(absoluteProductPath, 'docs/prd.md'),
        },
        architecture: {
          ...(config.architecture || {}),
          architectureFile: path.join(absoluteProductPath, 'docs/architecture.md'),
          architectureShardedLocation: path.join(absoluteProductPath, 'docs/architecture'),
        },
      };
    }

    return config;
  }

  /**
   * Load and resolve core config with multi-repo path resolution
   * @param {string} configPath - Path to core-config.yaml
   * @returns {Object} - Resolved config object
   */
  async loadCoreConfig(configPath) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configContent);

      // Apply defaults for new structure
      if (!config.project) {
        config.project = {};
      }

      // Default mode to monolith
      if (!config.project.mode) {
        config.project.mode = 'monolith';
      }

      // Default multi_repo configuration
      if (!config.project.multi_repo) {
        config.project.multi_repo = {
          role: 'implementation',
          repository_id: '',
          product_repo_path: '',
          auto_filter_stories: false,
          assigned_stories: []
        };
      }

      // Migrate old configuration to new structure (backward compatibility)
      if (config.project.type) {
        console.warn('Warning: project.type is deprecated. Use project.mode instead.');

        // Map old type to new mode
        if (config.project.type === 'product-planning') {
          config.project.mode = 'multi-repo';
          config.project.multi_repo.role = 'product';
        } else if (config.project.type !== 'monolith') {
          config.project.mode = 'multi-repo';
          config.project.multi_repo.role = config.project.type; // backend/frontend/ios/etc
        }
      }

      // Migrate old product_repo.enabled to new structure
      if (config.project.product_repo?.enabled) {
        console.warn('Warning: project.product_repo.enabled is deprecated. Use project.mode = "multi-repo"');
        config.project.mode = 'multi-repo';

        if (config.project.product_repo.path) {
          config.project.multi_repo.product_repo_path = config.project.product_repo.path;
        }
      }

      // Migrate old story_assignment to new structure
      if (config.project.story_assignment) {
        console.warn('Warning: project.story_assignment is deprecated. Use project.multi_repo.auto_filter_stories');
        config.project.multi_repo.auto_filter_stories = config.project.story_assignment.auto_filter || false;
        config.project.multi_repo.assigned_stories = config.project.story_assignment.assigned_stories || [];
      }

      // Migrate old repository_id
      if (config.project.repository_id && !config.project.multi_repo.repository_id) {
        config.project.multi_repo.repository_id = config.project.repository_id;
      }

      // Resolve document paths if in multi-repo implementation mode
      return this.resolveDocumentPaths(config);
    } catch (error) {
      throw new Error(`Failed to load core config: ${error.message}`);
    }
  }

  async getTeamDependencies(teamId) {
    // Use DependencyResolver to dynamically parse team dependencies
    const DependencyResolver = require('../../lib/dependency-resolver');
    const resolver = new DependencyResolver(path.join(__dirname, '..', '..', '..'));
    
    try {
      const teamDeps = await resolver.resolveTeamDependencies(teamId);
      
      // Convert to flat list of file paths
      const depPaths = [];
      
      // Add team config file
      depPaths.push(`.orchestrix-core/agent-teams/${teamId}.yaml`);
      
      // Add all agents
      for (const agent of teamDeps.agents) {
        const filePath = `.orchestrix-core/agents/${agent.id}.md`;
        if (!depPaths.includes(filePath)) {
          depPaths.push(filePath);
        }
      }
      
      // Add all resolved resources
      for (const resource of teamDeps.resources) {
        const filePath = `.orchestrix-core/${resource.type}/${resource.id}.${resource.type === 'workflows' ? 'yaml' : 'md'}`;
        if (!depPaths.includes(filePath)) {
          depPaths.push(filePath);
        }
      }
      
      return depPaths;
    } catch (error) {
      throw new Error(`Failed to resolve team dependencies for ${teamId}: ${error.message}`);
    }
  }
}

module.exports = new ConfigLoader();