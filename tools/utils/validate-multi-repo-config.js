#!/usr/bin/env node

/**
 * Multi-Repository Configuration Validator
 *
 * Validates bidirectional links between Product repository and Implementation repositories:
 * - Product repo has implementation_repos[] with valid paths
 * - Implementation repos have product_repo.path pointing back to Product
 * - Repository IDs are unique and exist
 * - Epic YAML references valid repository IDs
 *
 * Usage:
 *   node validate-multi-repo-config.js <product-repo-path>
 *
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation errors found
 *   2 = Fatal error (config not found, invalid YAML, etc.)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

/**
 * Load YAML configuration file
 */
function loadConfig(config_path) {
  if (!fs.existsSync(config_path)) {
    return null;
  }

  try {
    const content = fs.readFileSync(config_path, 'utf8');
    return yaml.load(content);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }
}

/**
 * Validation result structure
 */
class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  addError(category, message, details = {}) {
    this.errors.push({ category, message, ...details });
  }

  addWarning(category, message, details = {}) {
    this.warnings.push({ category, message, ...details });
  }

  addPassed(category, message) {
    this.passed.push({ category, message });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  print() {
    console.log('\n=== Multi-Repository Configuration Validation ===\n');

    if (this.passed.length > 0) {
      console.log('✅ PASSED CHECKS:');
      this.passed.forEach(p => {
        console.log(`  ✓ [${p.category}] ${p.message}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(w => {
        console.log(`  ⚠  [${w.category}] ${w.message}`);
        if (w.suggestion) console.log(`     Suggestion: ${w.suggestion}`);
        if (w.autofix) console.log(`     🔧 Auto-fix: ${w.autofix}`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(e => {
        console.log(`  ✗ [${e.category}] ${e.message}`);
        if (e.expected) console.log(`     Expected: ${e.expected}`);
        if (e.actual) console.log(`     Actual: ${e.actual}`);
        if (e.fix) console.log(`     Fix: ${e.fix}`);
        if (e.autofix) console.log(`     🔧 Auto-fix: ${e.autofix}`);
      });
      console.log('');
    }

    console.log('=== Summary ===');
    console.log(`Passed: ${this.passed.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log('');

    // Print helpful commands if there are issues
    if (this.hasErrors() || this.warnings.length > 0) {
      console.log('🛠️  HELPFUL COMMANDS:');
      console.log('');
      console.log('  Validate Epic YAMLs:');
      console.log('    node tools/utils/validate-epic-yaml.js docs/epics/');
      console.log('');
      console.log('  Check Story Sync:');
      console.log('    node tools/utils/check-story-sync.js .');
      console.log('');
      console.log('  View Migration Guide:');
      console.log('    cat docs/PHASE_1_MIGRATION_GUIDE.md');
      console.log('');
    }

    return !this.hasErrors();
  }
}

/**
 * Validate Product repository configuration
 */
function validateProductRepo(product_repo_path, result) {
  const config_path = path.join(product_repo_path, 'core-config.yaml');
  const config = loadConfig(config_path);

  if (!config) {
    result.addError('Product Config', `core-config.yaml not found at ${config_path}`);
    return null;
  }

  // Check project.mode
  if (config.project?.mode !== 'multi-repo') {
    result.addError(
      'Product Mode',
      'Product repository must have project.mode = "multi-repo"',
      {
        actual: config.project?.mode || 'undefined',
        expected: 'multi-repo',
        fix: 'Set project.mode to "multi-repo" in core-config.yaml'
      }
    );
  } else {
    result.addPassed('Product Mode', 'Project mode is "multi-repo"');
  }

  // Check project.multi_repo.role
  if (config.project?.multi_repo?.role !== 'product') {
    result.addError(
      'Product Role',
      'Product repository must have project.multi_repo.role = "product"',
      {
        actual: config.project?.multi_repo?.role || 'undefined',
        expected: 'product',
        fix: 'Set project.multi_repo.role to "product" in core-config.yaml'
      }
    );
  } else {
    result.addPassed('Product Role', 'Repository role is "product"');
  }

  // Check implementation_repos (now under multi_repo)
  const impl_repos = config.project?.multi_repo?.implementation_repos || config.implementation_repos;

  if (!impl_repos || impl_repos.length === 0) {
    result.addError(
      'Implementation Repos',
      'Product repo must have project.multi_repo.implementation_repos[] configured',
      {
        fix: 'Add implementation_repos[] to project.multi_repo in core-config.yaml'
      }
    );
    return null;
  }

  result.addPassed(
    'Implementation Repos',
    `Found ${impl_repos.length} implementation repositories`
  );

  // Create a normalized config for backward compatibility
  return {
    ...config,
    implementation_repos: impl_repos
  };
}

/**
 * Validate Implementation repositories
 */
function validateImplementationRepos(product_repo_path, product_config, result) {
  const repo_map = new Map(); // repository_id → repo_info
  const repo_ids_seen = new Set();

  for (const [index, impl_repo] of product_config.implementation_repos.entries()) {
    const repo_num = index + 1;

    // Validate path exists
    if (!impl_repo.path) {
      result.addError(
        'Repo Path',
        `implementation_repos[${repo_num}] missing "path" field`,
        { fix: 'Add "path" field to this repository entry' }
      );
      continue;
    }

    const repo_path = path.isAbsolute(impl_repo.path)
      ? impl_repo.path
      : path.resolve(product_repo_path, impl_repo.path);

    if (!fs.existsSync(repo_path)) {
      result.addError(
        'Repo Path',
        `implementation_repos[${repo_num}] path not found: ${impl_repo.path}`,
        {
          actual: repo_path,
          fix: `Create repository at ${repo_path} or fix the path in core-config.yaml`
        }
      );
      continue;
    }

    // Validate type
    if (!impl_repo.type) {
      result.addError(
        'Repo Type',
        `implementation_repos[${repo_num}] missing "type" field`,
        {
          fix: 'Add "type" field (backend, frontend, ios, android, mobile, etc.)'
        }
      );
    }

    // Load implementation repo config
    const impl_config_path = path.join(repo_path, 'core-config.yaml');
    const impl_config = loadConfig(impl_config_path);

    if (!impl_config) {
      result.addError(
        'Impl Config',
        `implementation_repos[${repo_num}] missing core-config.yaml at ${repo_path}`,
        {
          fix: `Run "npx orchestrix install" in ${repo_path}`
        }
      );
      continue;
    }

    // Validate repository_id exists (check both new and old location)
    const repository_id = impl_config.project?.multi_repo?.repository_id ||
                         impl_config.project?.repository_id;

    if (!repository_id) {
      result.addError(
        'Repository ID',
        `implementation_repos[${repo_num}] missing project.multi_repo.repository_id in config`,
        {
          actual: repo_path,
          fix: 'Set project.multi_repo.repository_id in core-config.yaml'
        }
      );
      continue;
    }

    // Check for duplicate repository IDs
    if (repo_ids_seen.has(repository_id)) {
      result.addError(
        'Repository ID',
        `Duplicate repository_id found: "${repository_id}"`,
        {
          fix: 'Ensure each repository has a unique repository_id'
        }
      );
    } else {
      repo_ids_seen.add(repository_id);
    }

    // Validate mode is multi-repo
    if (impl_config.project?.mode !== 'multi-repo') {
      result.addWarning(
        'Impl Mode',
        `implementation_repos[${repo_num}] (${repository_id}) should have mode = "multi-repo"`,
        {
          suggestion: 'Set project.mode to "multi-repo" for proper multi-repo operation'
        }
      );
    }

    // Validate bidirectional link: product_repo_path
    const product_repo_path_link = impl_config.project?.multi_repo?.product_repo_path ||
                                  (impl_config.project?.product_repo?.enabled ?
                                   impl_config.project.product_repo.path : null);

    if (!product_repo_path_link) {
      result.addError(
        'Bidirectional Link',
        `implementation_repos[${repo_num}] (${repository_id}) missing project.multi_repo.product_repo_path`,
        {
          fix: 'Set product_repo_path to point back to Product repository'
        }
      );
    } else {
      // Resolve and validate product_repo_path
      const linked_product_path = path.isAbsolute(product_repo_path_link)
        ? product_repo_path_link
        : path.resolve(repo_path, product_repo_path_link);

      const actual_product_path = path.resolve(product_repo_path);

      if (linked_product_path !== actual_product_path) {
        result.addError(
          'Bidirectional Link',
          `implementation_repos[${repo_num}] (${repository_id}) product_repo_path points to wrong location`,
          {
            expected: actual_product_path,
            actual: linked_product_path,
            fix: `Update product_repo_path in ${impl_config_path}`
          }
        );
      } else {
        result.addPassed(
          'Bidirectional Link',
          `${repository_id} correctly links back to Product repo`
        );
      }
    }

    // Validate project.multi_repo.role matches
    const impl_role = impl_config.project?.multi_repo?.role ||
                     impl_config.project?.type;

    if (impl_role === 'monolith') {
      result.addError(
        'Impl Role',
        `implementation_repos[${repo_num}] (${repository_id}) has role "monolith"`,
        {
          expected: impl_repo.type,
          actual: 'monolith',
          fix: `Change project.multi_repo.role to "${impl_repo.type}" in ${impl_config_path}`
        }
      );
    } else if (impl_role !== impl_repo.type) {
      result.addWarning(
        'Role Mismatch',
        `implementation_repos[${repo_num}] role mismatch: Product config says "${impl_repo.type}", Impl config says "${impl_role}"`,
        {
          suggestion: 'Ensure both configs use the same role/type'
        }
      );
    } else {
      result.addPassed(
        'Impl Role',
        `${repository_id} role matches: "${impl_role}"`
      );
    }

    // Store repo info for Epic validation
    repo_map.set(repository_id, {
      path: repo_path,
      type: impl_type,
      config_type: impl_repo.type
    });
  }

  return repo_map;
}

/**
 * Validate Epic YAML files
 */
async function validateEpicYAMLs(product_repo_path, repo_map, result) {
  // Find epic files
  const epics_pattern = path.join(product_repo_path, 'docs/epics/epic-*.yaml');
  const epic_files = await glob(epics_pattern, { windowsPathsNoEscape: true });

  if (epic_files.length === 0) {
    result.addWarning(
      'Epic Files',
      'No epic YAML files found in docs/epics/',
      {
        suggestion: 'Epic validation skipped. Run PO *shard-documents to generate epics.'
      }
    );
    return;
  }

  result.addPassed('Epic Files', `Found ${epic_files.length} epic file(s)`);

  let total_stories = 0;
  const referenced_repo_ids = new Set();

  for (const epic_file of epic_files) {
    try {
      const epic_content = fs.readFileSync(epic_file, 'utf8');
      const epic = yaml.load(epic_content);

      if (!epic.stories || epic.stories.length === 0) {
        result.addWarning('Epic Stories', `Epic file has no stories: ${path.basename(epic_file)}`);
        continue;
      }

      total_stories += epic.stories.length;

      // Validate each story's repository reference
      for (const story of epic.stories) {
        const story_repo_id = story.repository;

        if (!story_repo_id) {
          result.addError(
            'Story Repository',
            `Story ${story.id} in ${path.basename(epic_file)} missing "repository" field`,
            { fix: 'Add "repository" field to story' }
          );
          continue;
        }

        referenced_repo_ids.add(story_repo_id);

        if (!repo_map.has(story_repo_id)) {
          result.addError(
            'Story Repository',
            `Story ${story.id} references unknown repository: "${story_repo_id}"`,
            {
              fix: `Add repository "${story_repo_id}" to implementation_repos[] in Product repo config, or fix the repository name in epic YAML`
            }
          );
        }
      }
    } catch (error) {
      result.addError('Epic YAML', `Failed to parse ${path.basename(epic_file)}: ${error.message}`);
    }
  }

  result.addPassed('Story Repository', `All ${total_stories} stories reference valid repositories`);

  // Check for unused repositories
  for (const [repo_id, repo_info] of repo_map) {
    if (!referenced_repo_ids.has(repo_id)) {
      result.addWarning(
        'Unused Repository',
        `Repository "${repo_id}" is configured but not referenced in any epic`,
        {
          suggestion: 'This repository will not be used until stories are assigned to it'
        }
      );
    }
  }
}

/**
 * Main validation function
 */
async function validateMultiRepoConfig(product_repo_path) {
  const result = new ValidationResult();

  console.log(`Validating multi-repo configuration at: ${product_repo_path}\n`);

  // Step 1: Validate Product repository
  const product_config = validateProductRepo(product_repo_path, result);

  if (!product_config) {
    return result; // Fatal error, cannot proceed
  }

  // Step 2: Validate Implementation repositories
  const repo_map = validateImplementationRepos(product_repo_path, product_config, result);

  // Step 3: Validate Epic YAML files
  await validateEpicYAMLs(product_repo_path, repo_map, result);

  return result;
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate-multi-repo-config.js <product-repo-path>');
    console.error('');
    console.error('Example:');
    console.error('  node validate-multi-repo-config.js /path/to/my-product');
    console.error('  node validate-multi-repo-config.js ../my-product');
    process.exit(2);
  }

  const product_repo_path = path.resolve(args[0]);

  if (!fs.existsSync(product_repo_path)) {
    console.error(`Error: Product repository not found at ${product_repo_path}`);
    process.exit(2);
  }

  try {
    const result = await validateMultiRepoConfig(product_repo_path);
    const success = result.print();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(2);
  }
}

// Export for use as module
module.exports = {
  validateMultiRepoConfig,
  ValidationResult
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error.message);
    process.exit(2);
  });
}
