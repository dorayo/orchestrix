/**
 * Utility functions for YAML extraction from agent files
 */

/**
 * Extract YAML content from agent markdown files
 * @param {string} agentContent - The full content of the agent file
 * @param {boolean} cleanCommands - Whether to clean command descriptions (default: false)
 * @returns {string|null} - The extracted YAML content or null if not found
 */
function extractYamlFromAgent(agentContent, cleanCommands = false) {
  // Standardize line endings for consistent processing
  const normalizedContent = agentContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // More robust regex pattern to handle various YAML block formats
  // Supports: ```yaml, ```yml, with optional whitespace
  const yamlMatch = normalizedContent.match(/```ya?ml\s*\n([\s\S]*?)\n\s*```/);
  if (!yamlMatch) {
    // Fallback: try without the closing newline requirement
    const fallbackMatch = normalizedContent.match(/```ya?ml\s*\n([\s\S]*?)```/);
    if (!fallbackMatch) return null;
    
    return fallbackMatch[1].trim();
  }
  
  let yamlContent = yamlMatch[1].trim();
  
  // Clean up command descriptions if requested
  // Converts "- command - description" to just "- command"
  if (cleanCommands) {
    yamlContent = yamlContent.replace(/^(\s*-)(\s*"[^"]+")(\s*-\s*.*)$/gm, '$1$2');
  }
  
  return yamlContent;
}

/**
 * Extract agent dependencies from YAML content
 * @param {string} yamlContent - The YAML content to parse
 * @returns {Object} - Object containing tasks, data, templates arrays
 */
function extractAgentDependencies(yamlContent) {
  try {
    // Simple YAML parsing for dependencies section
    const dependenciesMatch = yamlContent.match(/dependencies:\s*\n([\s\S]*?)(?=\n\w+:|$)/);
    if (!dependenciesMatch) return { tasks: [], data: [], templates: [] };
    
    const depsSection = dependenciesMatch[1];
    const result = { tasks: [], data: [], templates: [] };
    
    // Extract tasks
    const tasksMatch = depsSection.match(/tasks:\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/);
    if (tasksMatch) {
      const tasks = tasksMatch[1].match(/-\s*([^\n\r]+)/g) || [];
      result.tasks = tasks.map(task => 
        task.replace(/^-\s*/, '').trim().replace(/^"|"$/g, '').replace(/\.md$/, '.md').trim()
      ).filter(task => task && !task.includes('FILE-RESOLUTION'));
    }
    
    // Extract data
    const dataMatch = depsSection.match(/data:\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/);
    if (dataMatch) {
      const data = dataMatch[1].match(/-\s*([^\n\r]+)/g) || [];
      result.data = data.map(item => 
        item.replace(/^-\s*/, '').trim().replace(/^"|"$/g, '').replace(/\.md$/, '.md').trim()
      ).filter(item => item && !item.includes('FILE-RESOLUTION'));
    }
    
    // Extract templates
    const templatesMatch = depsSection.match(/templates:\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/);
    if (templatesMatch) {
      const templates = templatesMatch[1].match(/-\s*([^\n\r]+)/g) || [];
      result.templates = templates.map(template => 
        template.replace(/^-\s*/, '').trim().replace(/^"|"$/g, '').replace(/\.yaml$/, '.yaml').trim()
      ).filter(template => template && !template.includes('FILE-RESOLUTION'));
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to parse agent dependencies:', error.message);
    return { tasks: [], data: [], templates: [] };
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
  if (!agentPath) return { valid: false, missing: [] };
  
  const agentContent = require('./file-manager').readFile(agentPath);
  const yamlContent = extractYamlFromAgent(agentContent);
  if (!yamlContent) return { valid: false, missing: [] };
  
  const dependencies = extractAgentDependencies(yamlContent);
  const missing = [];
  
  // Check if all task dependencies exist
  const tasksDir = path.join(installDir, '.orchestrix-core', 'tasks');
  for (const task of dependencies.tasks) {
    const taskPath = path.join(tasksDir, task);
    if (!require('./file-manager').fileExists(taskPath)) {
      missing.push(`task: ${task}`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    dependencies
  };
}

/**
 * Find agent file path
 * @param {string} agentId - The agent ID
 * @param {string} installDir - The installation directory
 * @returns {Promise<string|null>} - The agent file path or null
 */
async function findAgentPath(agentId, installDir) {
  const agentsDir = path.join(installDir, '.orchestrix-core', 'agents');
  const agentFile = path.join(agentsDir, `${agentId}.md`);
  
  try {
    const fs = require('fs-extra');
    if (await fs.pathExists(agentFile)) {
      return agentFile;
    }
  } catch (error) {
    // Ignore errors
  }
  
  return null;
}

module.exports = {
  extractYamlFromAgent,
  extractAgentDependencies,
  validateAgentDependencies,
  findAgentPath
};