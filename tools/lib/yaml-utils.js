/**
 * Utility functions for YAML processing from agent files
 * Updated to work with pure YAML agent files instead of markdown-embedded YAML
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Load and parse YAML agent file
 * @param {string} agentPath - The path to the YAML agent file
 * @param {boolean} cleanCommands - Whether to clean command descriptions (default: false) - kept for backward compatibility
 * @returns {Promise<Object|null>} - The parsed YAML content or null if not found/invalid
 */
async function loadAgentYaml(agentPath, cleanCommands = false) {
  try {
    if (!await fs.pathExists(agentPath)) {
      return null;
    }
    
    const yamlContent = await fs.readFile(agentPath, 'utf8');
    const config = yaml.load(yamlContent);
    
    // Validate basic agent structure
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid YAML structure: not an object');
    }
    
    if (!config.agent || !config.agent.id) {
      throw new Error('Invalid agent configuration: missing agent.id');
    }
    
    return config;
  } catch (error) {
    console.warn(`Failed to load agent YAML from ${agentPath}:`, error.message);
    return null;
  }
}

/**
 * Extract YAML content from agent files - updated for backward compatibility
 * Now works with both pure YAML files and legacy markdown files
 * @param {string} agentContent - The full content of the agent file (or file path for YAML files)
 * @param {boolean} cleanCommands - Whether to clean command descriptions (default: false)
 * @returns {string|null} - The YAML content as string or null if not found
 */
function extractYamlFromAgent(agentContent, cleanCommands = false) {
  // If agentContent looks like a file path ending in .yaml, load it
  if (typeof agentContent === 'string' && agentContent.endsWith('.yaml') && !agentContent.includes('\n')) {
    try {
      const content = fs.readFileSync(agentContent, 'utf8');
      return content;
    } catch (error) {
      console.warn(`Failed to read YAML file ${agentContent}:`, error.message);
      return null;
    }
  }
  
  // If it's already YAML content (starts with common YAML keys)
  const trimmedContent = agentContent.trim();
  if (trimmedContent.startsWith('REQUEST-RESOLUTION:') || 
      trimmedContent.startsWith('agent:') || 
      trimmedContent.match(/^[a-zA-Z_][a-zA-Z0-9_-]*:\s/)) {
    return trimmedContent;
  }
  
  // Legacy: Extract from markdown format
  const normalizedContent = agentContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // More robust regex pattern to handle various YAML block formats
  const yamlMatch = normalizedContent.match(/```ya?ml\s*\n([\s\S]*?)\n\s*```/);
  if (!yamlMatch) {
    // Fallback: try without the closing newline requirement
    const fallbackMatch = normalizedContent.match(/```ya?ml\s*\n([\s\S]*?)```/);
    if (!fallbackMatch) return null;
    
    return fallbackMatch[1].trim();
  }
  
  let yamlContent = yamlMatch[1].trim();
  
  // Clean up command descriptions if requested
  if (cleanCommands) {
    yamlContent = yamlContent.replace(/^(\s*-)(\s*"[^"]+")(\s*-\s*.*)$/gm, '$1$2');
  }
  
  return yamlContent;
}

/**
 * Extract agent dependencies from YAML content or config object
 * @param {string|Object} yamlContentOrConfig - The YAML content string or parsed config object
 * @returns {Object} - Object containing tasks, data, templates, checklists, utils arrays
 */
function extractAgentDependencies(yamlContentOrConfig) {
  try {
    let config;
    
    // If it's already a parsed object, use it directly
    if (typeof yamlContentOrConfig === 'object' && yamlContentOrConfig !== null) {
      config = yamlContentOrConfig;
    } else {
      // Parse YAML string
      config = yaml.load(yamlContentOrConfig);
    }
    
    if (!config || !config.dependencies) {
      return { tasks: [], data: [], templates: [], checklists: [], utils: [] };
    }
    
    const deps = config.dependencies;
    const result = {
      tasks: [],
      data: [],
      templates: [],
      checklists: [],
      utils: []
    };
    
    // Extract each dependency type
    for (const [type, items] of Object.entries(deps)) {
      if (Array.isArray(items) && result.hasOwnProperty(type)) {
        result[type] = items
          .map(item => typeof item === 'string' ? item.trim() : String(item).trim())
          .filter(item => item && !item.includes('FILE-RESOLUTION'));
      }
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to parse agent dependencies:', error.message);
    return { tasks: [], data: [], templates: [], checklists: [], utils: [] };
  }
}

/**
 * Validate and ensure agent dependencies exist
 * @param {string} agentId - The agent ID to validate
 * @param {string} installDir - The installation directory
 * @returns {Promise<Object>} - Validation results
 */
async function validateAgentDependencies(agentId, installDir) {
  const agentPath = await findAgentPath(agentId, installDir);
  if (!agentPath) return { valid: false, missing: [], error: 'Agent file not found' };
  
  try {
    // Load agent config
    const config = await loadAgentYaml(agentPath);
    if (!config) return { valid: false, missing: [], error: 'Failed to load agent config' };
    
    const dependencies = extractAgentDependencies(config);
    const missing = [];
    
    // Check if all dependencies exist
    const depTypes = ['tasks', 'data', 'templates', 'checklists', 'utils'];
    
    for (const depType of depTypes) {
      if (dependencies[depType] && dependencies[depType].length > 0) {
        const depDir = path.join(installDir, '.orchestrix-core', depType);
        
        for (const depItem of dependencies[depType]) {
          // Ensure proper file extension
          let fileName = depItem;
          if (depType === 'templates' && !fileName.endsWith('.yaml')) {
            fileName += '.yaml';
          } else if (depType !== 'templates' && !fileName.endsWith('.md')) {
            fileName += '.md';
          }
          
          const depPath = path.join(depDir, fileName);
          if (!await fs.pathExists(depPath)) {
            missing.push(`${depType}: ${fileName}`);
          }
        }
      }
    }
    
    return {
      valid: missing.length === 0,
      missing,
      dependencies,
      config
    };
  } catch (error) {
    return { 
      valid: false, 
      missing: [], 
      error: `Validation failed: ${error.message}` 
    };
  }
}

/**
 * Find agent file path - updated to look for .yaml files
 * @param {string} agentId - The agent ID
 * @param {string} installDir - The installation directory
 * @returns {Promise<string|null>} - The agent file path or null
 */
async function findAgentPath(agentId, installDir) {
  // Primary location: .orchestrix-core/agents/{agentId}.yaml
  const primaryPath = path.join(installDir, '.orchestrix-core', 'agents', `${agentId}.yaml`);
  
  try {
    if (await fs.pathExists(primaryPath)) {
      return primaryPath;
    }
  } catch (error) {
    // Continue to check other locations
  }
  
  // Fallback locations - prioritize YAML files
  const fallbackPaths = [
    // Source directory (for development)
    path.join(installDir, 'orchestrix-core', 'agents', `${agentId}.yaml`),
    // Alternative locations
    path.join(installDir, 'agents', `${agentId}.yaml`),
    // Legacy .md files for backward compatibility (lower priority)
    path.join(installDir, '.orchestrix-core', 'agents', `${agentId}.md`),
    path.join(installDir, 'agents', `${agentId}.md`)
  ];
  
  for (const agentPath of fallbackPaths) {
    try {
      if (await fs.pathExists(agentPath)) {
        return agentPath;
      }
    } catch (error) {
      // Continue checking other paths
    }
  }
  
  return null;
}

/**
 * Get agent metadata from config
 * @param {Object} config - The parsed agent configuration
 * @returns {Object} - Agent metadata
 */
function getAgentMetadata(config) {
  if (!config || !config.agent) {
    return {
      id: 'unknown',
      name: 'Unknown Agent',
      title: 'Unknown Agent',
      description: 'No description available'
    };
  }
  
  const agent = config.agent;
  return {
    id: agent.id || 'unknown',
    name: agent.name || agent.title || agent.id || 'Unknown Agent',
    title: agent.title || agent.name || agent.id || 'Unknown Agent',
    description: agent.whenToUse || 'No description available',
    icon: agent.icon || '🤖',
    tools: agent.tools || []
  };
}

/**
 * Validate YAML agent file structure
 * @param {Object} config - The parsed agent configuration
 * @returns {Object} - Validation result
 */
function validateAgentStructure(config) {
  const errors = [];
  const warnings = [];
  
  if (!config) {
    errors.push('Configuration is null or undefined');
    return { valid: false, errors, warnings };
  }
  
  // Required fields
  if (!config.agent) {
    errors.push('Missing required "agent" section');
  } else {
    if (!config.agent.id) errors.push('Missing required agent.id');
    if (!config.agent.name && !config.agent.title) warnings.push('Missing agent name/title');
  }
  
  // Optional but recommended fields
  if (!config.core_principles) warnings.push('Missing core_principles section');
  if (!config.commands) warnings.push('Missing commands section');
  if (!config.dependencies) warnings.push('Missing dependencies section');
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = {
  // New functions
  loadAgentYaml,
  getAgentMetadata,
  validateAgentStructure,
  
  // Updated functions (maintain backward compatibility)
  extractYamlFromAgent,
  extractAgentDependencies,
  validateAgentDependencies,
  findAgentPath
};