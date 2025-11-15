#!/usr/bin/env node

/**
 * Cross-Repository Dependency Checker
 *
 * Automatically checks if cross-repository dependencies for a story are satisfied.
 * Used by SM and Dev agents to prevent creating/implementing stories when their
 * dependencies are not yet complete.
 *
 * Stage: Stage 2 (Automation)
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const yaml = require('js-yaml');

/**
 * Load Product repository configuration
 *
 * @param {string} product_repo_path - Absolute path to product repository
 * @returns {Object|null} Product repo config or null if not found
 */
function loadProductRepoConfig(product_repo_path) {
  const config_path = path.join(product_repo_path, 'core-config.yaml');

  if (!fs.existsSync(config_path)) {
    return null;
  }

  try {
    const config_content = fs.readFileSync(config_path, 'utf8');
    return yaml.load(config_content);
  } catch (error) {
    console.error(`Error loading product repo config: ${error.message}`);
    return null;
  }
}

/**
 * Build repository ID to path mapping
 *
 * Supports two modes:
 * 1. Future: implementation_repos with repository_id field
 * 2. Fallback: Read repository_id from each repo's core-config.yaml
 *
 * @param {string} product_repo_path - Absolute path to product repository
 * @param {Object} product_config - Product repo configuration
 * @returns {Promise<Map<string, string>>} Map of repository_id → absolute_path
 */
async function buildRepositoryMapping(product_repo_path, product_config) {
  const mapping = new Map();

  if (!product_config.implementation_repos || product_config.implementation_repos.length === 0) {
    return mapping;
  }

  for (const repo of product_config.implementation_repos) {
    const repo_path = path.isAbsolute(repo.path)
      ? repo.path
      : path.resolve(product_repo_path, repo.path);

    // Mode 1: Use repository_id from implementation_repos (if available)
    if (repo.repository_id) {
      mapping.set(repo.repository_id, repo_path);
      continue;
    }

    // Mode 2: Fallback - Read repository_id from repo's core-config.yaml
    try {
      const repo_config_path = path.join(repo_path, 'core-config.yaml');

      if (!fs.existsSync(repo_config_path)) {
        console.warn(`Warning: Config not found for repo at ${repo_path}`);
        continue;
      }

      const repo_config = yaml.load(fs.readFileSync(repo_config_path, 'utf8'));

      if (repo_config.project && repo_config.project.repository_id) {
        mapping.set(repo_config.project.repository_id, repo_path);
      } else {
        console.warn(`Warning: repository_id not found in ${repo_config_path}`);
      }
    } catch (error) {
      console.error(`Error reading config for ${repo_path}: ${error.message}`);
    }
  }

  return mapping;
}

/**
 * Check if cross-repository dependencies for a story are satisfied
 *
 * @param {Object} params - Input parameters
 * @param {string} params.story_id - Story ID (e.g., "1.2")
 * @param {Object} params.story_definition - Story object from Epic YAML
 * @param {string} params.current_repo_id - Current repository ID
 * @param {string} params.product_repo_path - Absolute path to product repository
 * @param {Array} params.all_stories - Array of all stories from all epics
 * @returns {Promise<Object>} Dependency check result
 */
async function checkCrossRepoDependencies(params) {
  const {
    story_id,
    story_definition,
    current_repo_id,
    product_repo_path,
    all_stories
  } = params;

  // Validate inputs
  if (!story_id || !story_definition || !current_repo_id || !product_repo_path || !all_stories) {
    const missing = [];
    if (!story_id) missing.push('story_id');
    if (!story_definition) missing.push('story_definition');
    if (!current_repo_id) missing.push('current_repo_id');
    if (!product_repo_path) missing.push('product_repo_path');
    if (!all_stories) missing.push('all_stories');

    return {
      status: 'error',
      message: `❌ DEPENDENCY CHECK FAILED - Missing required parameters: ${missing.join(', ')}\n\n` +
               `🔍 This is likely a bug in the calling task.\n` +
               `✅ Fix: Report this issue with the command you ran.`,
      blocking_dependencies: []
    };
  }

  // Step 1: Check if story has dependencies
  const dependencies = story_definition.dependencies || [];

  if (dependencies.length === 0) {
    return {
      status: 'no_dependencies',
      message: 'Story has no dependencies',
      blocking_dependencies: []
    };
  }

  // Step 2: Identify cross-repo dependencies
  const cross_repo_deps = [];

  for (const dep_id of dependencies) {
    // Find dependency story in all_stories
    const dep_story = all_stories.find(s => s.id === dep_id);

    if (!dep_story) {
      return {
        status: 'error',
        message: `❌ DEPENDENCY STORY NOT FOUND: ${dep_id}\n\n` +
                 `🔍 Possible causes:\n` +
                 `  1. Story ${dep_id} not defined in any Epic YAML\n` +
                 `  2. Typo in dependencies list\n` +
                 `  3. Story was deleted from Epic\n\n` +
                 `✅ Fix:\n` +
                 `  1. Check Epic YAML files in Product repo: docs/epics/epic-*.yaml\n` +
                 `  2. Verify story ${dep_id} exists in the stories[] array\n` +
                 `  3. If story was removed, update dependencies in current story`,
        blocking_dependencies: [dep_id]
      };
    }

    // Check if dependency is in different repository
    if (dep_story.repository !== current_repo_id) {
      cross_repo_deps.push({
        story_id: dep_id,
        story_title: dep_story.title,
        repository: dep_story.repository,
        repository_type: dep_story.repository_type
      });
    }
  }

  if (cross_repo_deps.length === 0) {
    return {
      status: 'same_repo_only',
      message: 'All dependencies are in the same repository',
      blocking_dependencies: []
    };
  }

  // Step 3: Load Product repo config and build repository mapping
  const product_config = loadProductRepoConfig(product_repo_path);

  if (!product_config) {
    return {
      status: 'error',
      message: `❌ CANNOT LOAD PRODUCT REPOSITORY CONFIG\n\n` +
               `📍 Expected location: ${product_repo_path}/core-config.yaml\n\n` +
               `🔍 Possible causes:\n` +
               `  1. File does not exist\n` +
               `  2. Invalid YAML syntax\n` +
               `  3. Incorrect product_repo_path in current repo config\n\n` +
               `✅ Fix:\n` +
               `  1. Verify Product repo path: ${product_repo_path}\n` +
               `  2. Check current repo's core-config.yaml:\n` +
               `     project.product_repo.path should point to Product repo\n` +
               `  3. Run: cd ${product_repo_path} && cat core-config.yaml`,
      blocking_dependencies: []
    };
  }

  const repo_mapping = await buildRepositoryMapping(product_repo_path, product_config);

  // Step 4: Check each cross-repo dependency status
  const blocking_deps = [];
  const satisfied_deps = [];

  for (const dep of cross_repo_deps) {
    try {
      // Step 4.1: Resolve dependency repository path using mapping
      const dep_repo_id = dep.repository;
      const dep_repo_path = repo_mapping.get(dep_repo_id);

      if (!dep_repo_path) {
        return {
          status: 'error',
          message: `❌ CANNOT RESOLVE PATH FOR REPOSITORY: ${dep_repo_id}\n\n` +
                   `📍 Story ${dep.story_id} depends on a story in repository "${dep_repo_id}"\n\n` +
                   `🔍 Possible causes:\n` +
                   `  1. Repository "${dep_repo_id}" not in Product repo's implementation_repos[]\n` +
                   `  2. Missing repository_id field in implementation_repos\n` +
                   `  3. Typo: Epic YAML uses "${dep_repo_id}" but config uses different name\n\n` +
                   `✅ Fix:\n` +
                   `  1. Open Product repo: ${product_repo_path}/core-config.yaml\n` +
                   `  2. Add to implementation_repos:\n` +
                   `     - repository_id: ${dep_repo_id}\n` +
                   `       path: ../path-to-repo\n` +
                   `       type: backend|frontend|ios|android|mobile\n` +
                   `  3. Or fix typo in Epic YAML: docs/epics/epic-*.yaml`,
          blocking_dependencies: [dep.story_id]
        };
      }

      if (!fs.existsSync(dep_repo_path)) {
        return {
          status: 'error',
          message: `❌ DEPENDENCY REPOSITORY NOT FOUND\n\n` +
                   `📍 Repository: ${dep_repo_id}\n` +
                   `📍 Expected path: ${dep_repo_path}\n` +
                   `📍 Story ${dep.story_id} depends on this repository\n\n` +
                   `🔍 Possible causes:\n` +
                   `  1. Repository not cloned yet\n` +
                   `  2. Wrong path in Product repo's implementation_repos[]\n` +
                   `  3. Repository moved to different location\n\n` +
                   `✅ Fix:\n` +
                   `  1. Clone repository: git clone <url> ${dep_repo_path}\n` +
                   `  2. Or update path in ${product_repo_path}/core-config.yaml:\n` +
                   `     Find entry with repository_id: ${dep_repo_id}\n` +
                   `     Update path: to correct location\n` +
                   `  3. Verify with: ls -la ${path.dirname(dep_repo_path)}`,
          blocking_dependencies: [dep.story_id]
        };
      }

      // Step 4.2: Load dependency story file
      const story_pattern = path.join(dep_repo_path, `docs/stories/${dep.story_id}-*`, 'story.md');
      const story_files = await glob(story_pattern, { windowsPathsNoEscape: true });

      if (story_files.length === 0) {
        // Dependency story not yet created
        blocking_deps.push({
          story_id: dep.story_id,
          story_title: dep.story_title,
          repository: dep.repository,
          repository_path: dep_repo_path,
          status: 'not_created',
          story_file: null,
          action: `Wait for ${dep.repository} team to create story ${dep.story_id}`
        });
        continue;
      }

      const story_file_path = story_files[0];

      // Step 4.3: Extract status from story file
      const story_content = fs.readFileSync(story_file_path, 'utf8');
      const status_match = story_content.match(/\*\*Status\*\*:\s*(\w+)/);

      if (!status_match) {
        return {
          status: 'error',
          message: `❌ CANNOT EXTRACT STATUS FROM STORY FILE\n\n` +
                   `📍 Story: ${dep.story_id}\n` +
                   `📍 File: ${story_file_path}\n\n` +
                   `🔍 Possible causes:\n` +
                   `  1. Story file missing "**Status**: <status>" field\n` +
                   `  2. Incorrect format (should be markdown bold: **Status**:)\n` +
                   `  3. Story file corrupted or incomplete\n\n` +
                   `✅ Fix:\n` +
                   `  1. Open file: ${story_file_path}\n` +
                   `  2. Check for line matching: **Status**: Blocked|AwaitingArchReview|...\n` +
                   `  3. If missing, add it to the story metadata section\n` +
                   `  4. Ensure format: **Status**: <StatusValue> (markdown bold)`,
          blocking_dependencies: [dep.story_id]
        };
      }

      const dep_status = status_match[1];

      // Step 4.4: Check if status is "Done"
      if (dep_status !== 'Done') {
        blocking_deps.push({
          story_id: dep.story_id,
          story_title: dep.story_title,
          repository: dep.repository,
          repository_path: dep_repo_path,
          status: dep_status,
          story_file: story_file_path,
          action: `Wait for ${dep.repository} team to complete story ${dep.story_id} (current status: ${dep_status})`
        });
      } else {
        satisfied_deps.push({
          story_id: dep.story_id,
          story_title: dep.story_title,
          repository: dep.repository,
          status: dep_status
        });
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Error checking dependency ${dep.story_id}: ${error.message}`,
        blocking_dependencies: [dep.story_id]
      };
    }
  }

  // Step 5: Return final result
  if (blocking_deps.length > 0) {
    return {
      status: 'blocked',
      message: `Story is blocked by ${blocking_deps.length} incomplete cross-repo dependencies`,
      blocking_dependencies: blocking_deps
    };
  }

  return {
    status: 'satisfied',
    message: `All ${cross_repo_deps.length} cross-repo dependencies are satisfied (Status: Done)`,
    satisfied_dependencies: satisfied_deps
  };
}

/**
 * CLI Entry Point
 * Usage: node dependency-checker.js <story_id> <current_repo_id> <product_repo_path> <epic_yaml_path>
 */
async function main() {
  if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 4) {
      console.error('Usage: node dependency-checker.js <story_id> <current_repo_id> <product_repo_path> <epic_yaml_path>');
      process.exit(1);
    }

    const [story_id, current_repo_id, product_repo_path, epic_yaml_path] = args;

    // Load epic YAML
    const epic_content = fs.readFileSync(epic_yaml_path, 'utf8');
    const epic = yaml.load(epic_content);

    // Find story in epic
    const story_definition = epic.stories.find(s => s.id === story_id);

    if (!story_definition) {
      console.error(`Story ${story_id} not found in epic ${epic_yaml_path}`);
      process.exit(1);
    }

    // Load all stories (for now, just from this epic)
    const all_stories = epic.stories.map(s => ({
      ...s,
      epic_id: epic.epic_id,
      epic_title: epic.title
    }));

    // Check dependencies
    const result = await checkCrossRepoDependencies({
      story_id,
      story_definition,
      current_repo_id,
      product_repo_path,
      all_stories
    });

    // Output result as JSON
    console.log(JSON.stringify(result, null, 2));

    // Exit with appropriate code
    process.exit(result.status === 'blocked' || result.status === 'error' ? 1 : 0);
  }
}

// Export for use as module
module.exports = {
  checkCrossRepoDependencies,
  buildRepositoryMapping,
  loadProductRepoConfig
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
