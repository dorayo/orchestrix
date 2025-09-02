const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { extractYamlFromAgent, loadAgentYaml, findAgentPath } = require('./yaml-utils');

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.orchestrixCore = path.join(rootDir, 'orchestrix-core');
    this.common = path.join(rootDir, 'common');
    this.cache = new Map();
  }

  async resolveAgentDependencies(agentId) {
    // Use findAgentPath to support both .yaml and .md files
    const agentPath = await findAgentPath(agentId, this.rootDir);
    if (!agentPath) {
      throw new Error(`Agent file not found for ${agentId}`);
    }
    
    let agentConfig;
    let agentContent;
    
    if (agentPath.endsWith('.yaml')) {
      // Direct YAML file loading
      agentConfig = await loadAgentYaml(agentPath);
      if (!agentConfig) {
        throw new Error(`Failed to load YAML configuration from agent ${agentId}`);
      }
      // For backward compatibility, also read raw content
      agentContent = await fs.readFile(agentPath, 'utf8');
    } else {
      // Legacy MD file support
      agentContent = await fs.readFile(agentPath, 'utf8');
      const yamlContent = extractYamlFromAgent(agentContent, true);
      if (!yamlContent) {
        throw new Error(`No YAML configuration found in agent ${agentId}`);
      }
      agentConfig = yaml.load(yamlContent);
    }
    
    const dependencies = {
      agent: {
        id: agentId,
        path: agentPath,
        content: agentContent,
        config: agentConfig
      },
      resources: []
    };

    // Personas are now embedded in agent configs, no need to resolve separately

    // Resolve other dependencies
    const depTypes = ['tasks', 'templates', 'checklists', 'data', 'utils'];
    for (const depType of depTypes) {
      const deps = agentConfig.dependencies?.[depType] || [];
      for (const depId of deps) {
        const resource = await this.loadResource(depType, depId);
        if (resource) dependencies.resources.push(resource);
      }
    }

    return dependencies;
  }

  async resolveTeamDependencies(teamId) {
    const teamPath = path.join(this.orchestrixCore, 'agent-teams', `${teamId}.yaml`);
    const teamContent = await fs.readFile(teamPath, 'utf8');
    const teamConfig = yaml.load(teamContent);
    
    const dependencies = {
      team: {
        id: teamId,
        path: teamPath,
        content: teamContent,
        config: teamConfig
      },
      agents: [],
      resources: new Map() // Use Map to deduplicate resources
    };

    // Always add orchestrix-orchestrator agent first if it's a team
    const orchestrixAgent = await this.resolveAgentDependencies('orchestrix-orchestrator');
    dependencies.agents.push(orchestrixAgent.agent);
    orchestrixAgent.resources.forEach(res => {
      dependencies.resources.set(res.path, res);
    });

    // Resolve all agents in the team
    let agentsToResolve = teamConfig.agents || [];
    
    // Handle wildcard "*" - include all agents except orchestrix-master
    if (agentsToResolve.includes('*')) {
      const allAgents = await this.listAgents();
      // Remove wildcard and add all agents except those already in the list and orchestrix-master
      agentsToResolve = agentsToResolve.filter(a => a !== '*');
      for (const agent of allAgents) {
        if (!agentsToResolve.includes(agent) && agent !== 'orchestrix-master') {
          agentsToResolve.push(agent);
        }
      }
    }
    
    for (const agentId of agentsToResolve) {
      if (agentId === 'orchestrix-orchestrator' || agentId === 'orchestrix-master') continue; // Already added or excluded
      const agentDeps = await this.resolveAgentDependencies(agentId);
      dependencies.agents.push(agentDeps.agent);
      
      // Add resources with deduplication
      agentDeps.resources.forEach(res => {
        dependencies.resources.set(res.path, res);
      });
    }

    // Resolve workflows
    for (const workflowId of teamConfig.workflows || []) {
      const resource = await this.loadResource('workflows', workflowId);
      if (resource) dependencies.resources.set(resource.path, resource);
    }

    // Convert Map back to array
    dependencies.resources = Array.from(dependencies.resources.values());

    return dependencies;
  }

  async loadResource(type, id) {
    const cacheKey = `${type}#${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let content = null;
      let filePath = null;

      // First try orchestrix-core
      try {
        filePath = path.join(this.orchestrixCore, type, id);
        content = await fs.readFile(filePath, 'utf8');
      } catch (e) {
        // If not found in orchestrix-core, try common folder
        try {
          filePath = path.join(this.common, type, id);
          content = await fs.readFile(filePath, 'utf8');
        } catch (e2) {
          // File not found in either location
        }
      }

      if (!content) {
        console.warn(`Resource not found: ${type}/${id}`);
        return null;
      }

      const resource = {
        type,
        id,
        path: filePath,
        content
      };

      this.cache.set(cacheKey, resource);
      return resource;
    } catch (error) {
      console.error(`Error loading resource ${type}/${id}:`, error.message);
      return null;
    }
  }

  async listAgents() {
    try {
      const files = await fs.readdir(path.join(this.orchestrixCore, 'agents'));
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
    } catch (error) {
      return [];
    }
  }

  async listTeams() {
    try {
      const files = await fs.readdir(path.join(this.orchestrixCore, 'agent-teams'));
      return files
        .filter(f => f.endsWith('.yaml'))
        .map(f => f.replace('.yaml', ''));
    } catch (error) {
      return [];
    }
  }
}

module.exports = DependencyResolver;
