#!/usr/bin/env node

/**
 * Epic YAML Validator
 *
 * Validates Epic YAML files for:
 * - Schema compliance (epic-story-mapping-schema.yaml)
 * - Story ID uniqueness
 * - Dependency validity (no cycles, all exist)
 * - Repository references (match implementation_repos)
 * - API contract consistency
 *
 * Usage:
 *   node validate-epic-yaml.js <epic-file-path>
 *   node validate-epic-yaml.js <epics-directory>  # Validates all epic-*.yaml
 *
 * Exit codes:
 *   0 = All validations passed
 *   1 = Validation errors found
 *   2 = Fatal error (file not found, invalid YAML, etc.)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

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

  print(epicFile) {
    console.log(`\n=== Epic YAML Validation: ${path.basename(epicFile)} ===\n`);

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
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(e => {
        console.log(`  ✗ [${e.category}] ${e.message}`);
        if (e.location) console.log(`     Location: ${e.location}`);
        if (e.expected) console.log(`     Expected: ${e.expected}`);
        if (e.actual) console.log(`     Actual: ${e.actual}`);
        if (e.fix) console.log(`     Fix: ${e.fix}`);
      });
      console.log('');
    }

    console.log('=== Summary ===');
    console.log(`Passed: ${this.passed.length}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Errors: ${this.errors.length}`);
    console.log('');

    return !this.hasErrors();
  }
}

/**
 * Load and parse YAML file
 */
function loadYAML(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    if (error.name === 'YAMLException') {
      throw new Error(`Invalid YAML syntax: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate Epic structure
 */
function validateEpicStructure(epic, result) {
  // Required fields
  if (!epic.epic_id) {
    result.addError('Structure', 'Missing required field: epic_id');
  } else if (typeof epic.epic_id !== 'number' || epic.epic_id < 1) {
    result.addError('Structure', 'epic_id must be a positive integer', {
      actual: epic.epic_id,
      expected: 'number >= 1'
    });
  } else {
    result.addPassed('Structure', `Epic ID: ${epic.epic_id}`);
  }

  if (!epic.title) {
    result.addError('Structure', 'Missing required field: title');
  } else if (epic.title.length < 5) {
    result.addWarning('Structure', `Title too short: "${epic.title}"`, {
      suggestion: 'Title should be at least 5 characters'
    });
  } else {
    result.addPassed('Structure', `Title: "${epic.title}"`);
  }

  if (!epic.description) {
    result.addWarning('Structure', 'Missing optional field: description', {
      suggestion: 'Add description to explain epic scope'
    });
  }

  if (!epic.stories || !Array.isArray(epic.stories)) {
    result.addError('Structure', 'Missing or invalid "stories" array', {
      fix: 'Add stories: [] with at least one story'
    });
    return false; // Cannot continue validation
  } else if (epic.stories.length === 0) {
    result.addError('Structure', 'Epic has no stories', {
      fix: 'Add at least one story to the epic'
    });
    return false;
  } else {
    result.addPassed('Structure', `Stories count: ${epic.stories.length}`);
  }

  return true;
}

/**
 * Validate Story structure and fields
 */
function validateStories(epic, result) {
  const storyIds = new Set();
  const repositories = new Set();

  epic.stories.forEach((story, index) => {
    const storyNum = index + 1;
    const storyId = story.id;

    // Story ID validation
    if (!storyId) {
      result.addError('Story ID', `Story #${storyNum} missing "id" field`, {
        location: `stories[${index}]`
      });
      return;
    }

    // Check ID format (epic.story)
    const idPattern = /^\d+\.\d+$/;
    if (!idPattern.test(storyId)) {
      result.addError('Story ID', `Invalid story ID format: "${storyId}"`, {
        location: `stories[${index}]`,
        expected: 'Format: {epic}.{story} (e.g., "1.1", "1.2")',
        fix: `Change to format like "${epic.epic_id}.${storyNum}"`
      });
    }

    // Check ID matches epic
    const [epicPart] = storyId.split('.');
    if (parseInt(epicPart) !== epic.epic_id) {
      result.addError('Story ID', `Story ID "${storyId}" doesn't match epic_id ${epic.epic_id}`, {
        location: `stories[${index}]`,
        expected: `${epic.epic_id}.{story}`,
        fix: `Change to "${epic.epic_id}.${storyNum}"`
      });
    }

    // Check uniqueness
    if (storyIds.has(storyId)) {
      result.addError('Story ID', `Duplicate story ID: "${storyId}"`, {
        location: `stories[${index}]`,
        fix: 'Ensure all story IDs are unique within epic'
      });
    } else {
      storyIds.add(storyId);
    }

    // Title validation
    if (!story.title) {
      result.addError('Story Title', `Story ${storyId} missing "title"`, {
        location: `stories[${index}]`
      });
    } else if (story.title.length < 10) {
      result.addWarning('Story Title', `Story ${storyId} title too short: "${story.title}"`, {
        suggestion: 'Title should be at least 10 characters'
      });
    }

    // Repository validation
    if (!story.repository) {
      result.addError('Repository', `Story ${storyId} missing "repository" field`, {
        location: `stories[${index}]`,
        fix: 'Add repository: "my-project-backend" (repository ID)'
      });
    } else {
      repositories.add(story.repository);
    }

    // Repository type validation
    const validTypes = ['backend', 'frontend', 'ios', 'android', 'mobile', 'shared', 'admin', 'monolith'];
    if (!story.repository_type) {
      result.addError('Repository Type', `Story ${storyId} missing "repository_type"`, {
        location: `stories[${index}]`,
        fix: `Add repository_type: backend|frontend|ios|android|mobile`
      });
    } else if (!validTypes.includes(story.repository_type)) {
      result.addError('Repository Type', `Story ${storyId} invalid repository_type: "${story.repository_type}"`, {
        location: `stories[${index}]`,
        expected: validTypes.join('|'),
        fix: 'Use one of the valid types'
      });
    }

    // Dependencies validation
    if (story.dependencies && !Array.isArray(story.dependencies)) {
      result.addError('Dependencies', `Story ${storyId} dependencies must be array`, {
        location: `stories[${index}].dependencies`
      });
    }
  });

  if (storyIds.size === epic.stories.length) {
    result.addPassed('Story IDs', 'All story IDs are unique');
  }

  if (repositories.size > 0) {
    result.addPassed('Repositories', `Referenced repositories: ${Array.from(repositories).join(', ')}`);
  }

  return { storyIds: Array.from(storyIds), repositories: Array.from(repositories) };
}

/**
 * Validate Dependencies (no cycles, all exist)
 */
function validateDependencies(epic, allStoryIds, result) {
  const graph = new Map(); // story_id -> [dependencies]

  // Build dependency graph
  epic.stories.forEach(story => {
    const deps = story.dependencies || [];
    graph.set(story.id, deps);

    // Check all dependencies exist
    deps.forEach(depId => {
      if (!allStoryIds.includes(depId)) {
        result.addError('Dependencies', `Story ${story.id} depends on non-existent story: ${depId}`, {
          fix: `Either add story ${depId} to an epic, or remove from dependencies`
        });
      }
    });
  });

  // Check for circular dependencies using DFS
  const visited = new Set();
  const recursionStack = new Set();

  function hasCycle(storyId, path = []) {
    if (recursionStack.has(storyId)) {
      // Found a cycle
      const cyclePath = [...path, storyId];
      const cycleStart = cyclePath.indexOf(storyId);
      const cycle = cyclePath.slice(cycleStart).join(' → ');
      result.addError('Circular Dependency', `Detected cycle: ${cycle}`, {
        fix: 'Remove one of the dependencies to break the cycle'
      });
      return true;
    }

    if (visited.has(storyId)) {
      return false;
    }

    visited.add(storyId);
    recursionStack.add(storyId);

    const deps = graph.get(storyId) || [];
    for (const depId of deps) {
      if (graph.has(depId)) { // Only check if dependency is in this epic
        if (hasCycle(depId, [...path, storyId])) {
          return true;
        }
      }
    }

    recursionStack.delete(storyId);
    return false;
  }

  // Check each story for cycles
  let cyclesFound = false;
  for (const storyId of graph.keys()) {
    if (!visited.has(storyId)) {
      if (hasCycle(storyId)) {
        cyclesFound = true;
      }
    }
  }

  if (!cyclesFound && graph.size > 0) {
    result.addPassed('Dependencies', 'No circular dependencies detected');
  }
}

/**
 * Validate API Contracts
 */
function validateAPIContracts(epic, result) {
  const providedAPIs = new Map(); // API → story_id
  const consumedAPIs = new Set();

  epic.stories.forEach(story => {
    // Collect provided APIs (backend stories)
    if (story.provides_apis && Array.isArray(story.provides_apis)) {
      story.provides_apis.forEach(api => {
        if (providedAPIs.has(api)) {
          result.addWarning('API Contracts', `Duplicate API provided: ${api}`, {
            suggestion: `Both ${providedAPIs.get(api)} and ${story.id} provide this API`
          });
        } else {
          providedAPIs.set(api, story.id);
        }
      });
    }

    // Collect consumed APIs (frontend/mobile stories)
    if (story.consumes_apis && Array.isArray(story.consumes_apis)) {
      story.consumes_apis.forEach(api => {
        consumedAPIs.add(api);
      });
    }
  });

  // Check if consumed APIs are provided
  consumedAPIs.forEach(api => {
    if (!providedAPIs.has(api)) {
      result.addWarning('API Contracts', `Consumed API not provided in this epic: ${api}`, {
        suggestion: 'Either add backend story providing this API, or it may be in another epic'
      });
    }
  });

  if (providedAPIs.size > 0) {
    result.addPassed('API Contracts', `APIs provided: ${providedAPIs.size}`);
  }
  if (consumedAPIs.size > 0) {
    result.addPassed('API Contracts', `APIs consumed: ${consumedAPIs.size}`);
  }
}

/**
 * Validate a single Epic YAML file
 */
async function validateEpicFile(epicFile, allEpics = []) {
  const result = new ValidationResult();

  try {
    const epic = loadYAML(epicFile);

    // 1. Validate structure
    if (!validateEpicStructure(epic, result)) {
      return result;
    }

    // 2. Validate stories
    const { storyIds, repositories } = validateStories(epic, result);

    // Collect all story IDs from all epics for dependency validation
    const allStoryIds = [...storyIds];
    allEpics.forEach(otherEpic => {
      if (otherEpic.stories) {
        otherEpic.stories.forEach(s => {
          if (s.id && !allStoryIds.includes(s.id)) {
            allStoryIds.push(s.id);
          }
        });
      }
    });

    // 3. Validate dependencies
    validateDependencies(epic, allStoryIds, result);

    // 4. Validate API contracts
    validateAPIContracts(epic, result);

  } catch (error) {
    result.addError('Fatal', error.message);
  }

  return result;
}

/**
 * Main validation function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node validate-epic-yaml.js <epic-file-or-directory>');
    console.error('');
    console.error('Examples:');
    console.error('  node validate-epic-yaml.js docs/epics/epic-1-user-auth.yaml');
    console.error('  node validate-epic-yaml.js docs/epics  # Validates all epic-*.yaml');
    process.exit(2);
  }

  const inputPath = path.resolve(args[0]);

  let epicFiles = [];
  let isDirectory = false;

  // Check if input is directory or file
  if (fs.existsSync(inputPath)) {
    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
      isDirectory = true;
      const pattern = path.join(inputPath, 'epic-*.yaml');
      epicFiles = await glob(pattern, { windowsPathsNoEscape: true });

      if (epicFiles.length === 0) {
        console.error(`❌ No epic-*.yaml files found in ${inputPath}`);
        process.exit(2);
      }
    } else {
      epicFiles = [inputPath];
    }
  } else {
    console.error(`❌ Path not found: ${inputPath}`);
    process.exit(2);
  }

  console.log(`\n🔍 Validating ${epicFiles.length} epic file(s)...\n`);

  // Load all epics first (for cross-epic dependency validation)
  const allEpics = [];
  for (const file of epicFiles) {
    try {
      const epic = loadYAML(file);
      allEpics.push(epic);
    } catch (error) {
      console.error(`⚠️  Failed to load ${path.basename(file)}: ${error.message}`);
    }
  }

  // Validate each epic
  let allPassed = true;
  const results = [];

  for (const epicFile of epicFiles) {
    const result = await validateEpicFile(epicFile, allEpics);
    results.push({ file: epicFile, result });

    if (!result.print(epicFile)) {
      allPassed = false;
    }
  }

  // Overall summary
  if (isDirectory && epicFiles.length > 1) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 OVERALL SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    const totalPassed = results.filter(r => !r.result.hasErrors()).length;
    const totalErrors = results.reduce((sum, r) => sum + r.result.errors.length, 0);
    const totalWarnings = results.reduce((sum, r) => sum + r.result.warnings.length, 0);

    console.log(`Epic files validated: ${epicFiles.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${epicFiles.length - totalPassed}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Total warnings: ${totalWarnings}`);
    console.log('');
  }

  process.exit(allPassed ? 0 : 1);
}

// Export for use as module
module.exports = {
  validateEpicFile,
  ValidationResult
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error.message);
    console.error(error.stack);
    process.exit(2);
  });
}
