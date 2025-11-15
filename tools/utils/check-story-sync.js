#!/usr/bin/env node

/**
 * Story Synchronization Checker
 *
 * Checks sync between Epic YAML files and actual story files:
 * - Stories in Epic YAML but files missing (orphaned definitions)
 * - Story files exist but not in Epic YAML (untracked stories)
 * - Status mismatches between Epic and story files
 *
 * Usage:
 *   node check-story-sync.js <product-repo-path>
 *
 * Exit codes:
 *   0 = All in sync
 *   1 = Sync issues found
 *   2 = Fatal error
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

/**
 * Load configuration
 */
function loadConfig(repoPath) {
  const configPath = path.join(repoPath, 'core-config.yaml');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    return yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

/**
 * Load all Epic YAML files
 */
async function loadEpicYAMLs(epicsPath) {
  const pattern = path.join(epicsPath, 'epic-*.yaml');
  const files = await glob(pattern, { windowsPathsNoEscape: true });

  const epics = [];
  for (const file of files) {
    try {
      const epic = yaml.load(fs.readFileSync(file, 'utf8'));
      epics.push({ file, epic });
    } catch (error) {
      console.warn(`⚠️  Failed to load ${path.basename(file)}: ${error.message}`);
    }
  }
  return epics;
}

/**
 * Find all story files in implementation repositories
 */
async function findStoryFiles(productRepoPath, implementationRepos) {
  const storyFiles = new Map(); // story_id → {path, repository_id, status}

  for (const repo of implementationRepos) {
    const repoPath = path.isAbsolute(repo.path)
      ? repo.path
      : path.resolve(productRepoPath, repo.path);

    if (!fs.existsSync(repoPath)) {
      console.warn(`⚠️  Repository not found: ${repoPath} (${repo.repository_id || 'no ID'})`);
      continue;
    }

    // Get repository_id from repo's config if not in product config
    let repositoryId = repo.repository_id;
    if (!repositoryId) {
      const repoConfig = loadConfig(repoPath);
      repositoryId = repoConfig?.project?.repository_id || path.basename(repoPath);
    }

    // Find all story directories
    const storiesPattern = path.join(repoPath, 'docs/stories/*-*');
    const storyDirs = await glob(storiesPattern, { windowsPathsNoEscape: true });

    for (const storyDir of storyDirs) {
      // Extract story ID from directory name (e.g., "1.2-backend-user-api" → "1.2")
      const dirName = path.basename(storyDir);
      const match = dirName.match(/^(\d+\.\d+)/);

      if (!match) {
        console.warn(`⚠️  Invalid story directory name: ${dirName}`);
        continue;
      }

      const storyId = match[1];
      const storyFile = path.join(storyDir, 'story.md');

      if (!fs.existsSync(storyFile)) {
        console.warn(`⚠️  Story file missing: ${storyFile}`);
        continue;
      }

      // Extract status from story file
      let status = null;
      try {
        const content = fs.readFileSync(storyFile, 'utf8');
        const statusMatch = content.match(/\*\*Status\*\*:\s*(\w+)/);
        status = statusMatch ? statusMatch[1] : null;
      } catch (error) {
        console.warn(`⚠️  Cannot read ${storyFile}: ${error.message}`);
      }

      storyFiles.set(storyId, {
        path: storyFile,
        repository_id: repositoryId,
        status,
        directory: storyDir
      });
    }
  }

  return storyFiles;
}

/**
 * Check sync between Epic YAML and story files
 */
function checkSync(epics, storyFiles) {
  const issues = {
    orphaned: [], // In Epic YAML but file missing
    untracked: [], // File exists but not in Epic YAML
    repoMismatch: [], // Story in wrong repository
    total: 0
  };

  const trackedStories = new Set();

  // Check each story in Epic YAMLs
  epics.forEach(({ file, epic }) => {
    if (!epic.stories) return;

    epic.stories.forEach(story => {
      const storyId = story.id;
      trackedStories.add(storyId);

      const fileInfo = storyFiles.get(storyId);

      if (!fileInfo) {
        // Story defined in Epic but file doesn't exist
        issues.orphaned.push({
          storyId,
          epicFile: path.basename(file),
          expectedRepo: story.repository,
          title: story.title
        });
        issues.total++;
      } else {
        // Check repository match
        if (fileInfo.repository_id !== story.repository) {
          issues.repoMismatch.push({
            storyId,
            epicFile: path.basename(file),
            expectedRepo: story.repository,
            actualRepo: fileInfo.repository_id,
            filePath: fileInfo.path
          });
          issues.total++;
        }
      }
    });
  });

  // Check for untracked stories (files exist but not in Epic)
  storyFiles.forEach((fileInfo, storyId) => {
    if (!trackedStories.has(storyId)) {
      issues.untracked.push({
        storyId,
        repository: fileInfo.repository_id,
        filePath: fileInfo.path,
        status: fileInfo.status
      });
      issues.total++;
    }
  });

  return issues;
}

/**
 * Print sync check results
 */
function printResults(issues, storyFiles, epics) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 STORY SYNCHRONIZATION CHECK');
  console.log('═══════════════════════════════════════════════════════\n');

  const totalEpicStories = epics.reduce((sum, { epic }) => sum + (epic.stories?.length || 0), 0);

  console.log(`📋 Epic YAML files: ${epics.length}`);
  console.log(`📄 Stories in Epics: ${totalEpicStories}`);
  console.log(`💾 Story files found: ${storyFiles.size}`);
  console.log('');

  if (issues.total === 0) {
    console.log('✅ ALL STORIES IN SYNC!\n');
    console.log('  ✓ All Epic YAML stories have corresponding files');
    console.log('  ✓ All story files are tracked in Epic YAMLs');
    console.log('  ✓ All stories are in correct repositories');
    console.log('');
    return true;
  }

  console.log(`⚠️  FOUND ${issues.total} SYNC ISSUE(S)\n`);

  // Orphaned stories (in Epic but file missing)
  if (issues.orphaned.length > 0) {
    console.log('❌ ORPHANED STORIES (In Epic YAML but file missing):');
    console.log('');
    issues.orphaned.forEach(item => {
      console.log(`  Story ${item.storyId}: "${item.title}"`);
      console.log(`    Epic: ${item.epicFile}`);
      console.log(`    Expected repo: ${item.expectedRepo}`);
      console.log(`    Fix: Either create the story file or remove from Epic YAML`);
      console.log('');
    });
  }

  // Untracked stories (file exists but not in Epic)
  if (issues.untracked.length > 0) {
    console.log('⚠️  UNTRACKED STORIES (File exists but not in Epic YAML):');
    console.log('');
    issues.untracked.forEach(item => {
      console.log(`  Story ${item.storyId}`);
      console.log(`    Repository: ${item.repository}`);
      console.log(`    Status: ${item.status || 'unknown'}`);
      console.log(`    File: ${item.filePath}`);
      console.log(`    Fix: Add to appropriate Epic YAML or delete if obsolete`);
      console.log('');
    });
  }

  // Repository mismatches
  if (issues.repoMismatch.length > 0) {
    console.log('❌ REPOSITORY MISMATCHES:');
    console.log('');
    issues.repoMismatch.forEach(item => {
      console.log(`  Story ${item.storyId}`);
      console.log(`    Epic says: ${item.expectedRepo}`);
      console.log(`    File in: ${item.actualRepo}`);
      console.log(`    File path: ${item.filePath}`);
      console.log(`    Fix: Either move file to ${item.expectedRepo} or update Epic YAML`);
      console.log('');
    });
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Orphaned stories: ${issues.orphaned.length}`);
  console.log(`Untracked stories: ${issues.untracked.length}`);
  console.log(`Repository mismatches: ${issues.repoMismatch.length}`);
  console.log(`Total issues: ${issues.total}`);
  console.log('');

  return false;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node check-story-sync.js <product-repo-path>');
    console.error('');
    console.error('Example:');
    console.error('  node check-story-sync.js /path/to/my-product-repo');
    console.error('  node check-story-sync.js ../my-product');
    process.exit(2);
  }

  const productRepoPath = path.resolve(args[0]);

  if (!fs.existsSync(productRepoPath)) {
    console.error(`❌ Product repository not found: ${productRepoPath}`);
    process.exit(2);
  }

  console.log(`\n🔍 Checking story sync for: ${productRepoPath}\n`);

  // Load Product repo config
  const config = loadConfig(productRepoPath);
  if (!config) {
    console.error(`❌ Cannot load core-config.yaml from ${productRepoPath}`);
    process.exit(2);
  }

  if (!config.implementation_repos || config.implementation_repos.length === 0) {
    console.error('❌ No implementation_repos configured in Product repo');
    console.error('');
    console.error('This tool is for multi-repository projects only.');
    console.error('For monolith projects, stories are managed differently.');
    process.exit(2);
  }

  // Load Epic YAMLs
  const epicsPath = path.join(productRepoPath, 'docs/epics');
  if (!fs.existsSync(epicsPath)) {
    console.error(`❌ Epics directory not found: ${epicsPath}`);
    console.error('');
    console.error('Run PO *shard first to create Epic YAML files.');
    process.exit(2);
  }

  const epics = await loadEpicYAMLs(epicsPath);
  if (epics.length === 0) {
    console.error('❌ No epic-*.yaml files found in docs/epics/');
    process.exit(2);
  }

  console.log(`✅ Loaded ${epics.length} epic file(s)`);

  // Find all story files
  const storyFiles = await findStoryFiles(productRepoPath, config.implementation_repos);
  console.log(`✅ Found ${storyFiles.size} story file(s) across repositories`);
  console.log('');

  // Check sync
  const issues = checkSync(epics, storyFiles);

  // Print results
  const allInSync = printResults(issues, storyFiles, epics);

  process.exit(allInSync ? 0 : 1);
}

// Export for use as module
module.exports = {
  checkSync,
  loadEpicYAMLs,
  findStoryFiles
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(2);
  });
}
