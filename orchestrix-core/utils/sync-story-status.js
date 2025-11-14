#!/usr/bin/env node

/**
 * Story Status Synchronization Utility
 *
 * Synchronizes story status from implementation repositories to the
 * product-planning repository for cross-repo dependency tracking.
 *
 * Stage: Stage 2 (Automation)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

/**
 * Sync story status to product repository
 *
 * @param {Object} params - Input parameters
 * @param {string} params.story_id - Story ID (e.g., "1.1")
 * @param {string} params.story_status - New story status
 * @param {string} params.current_repo_path - Absolute path to current repository
 * @param {string} params.current_repo_id - Current repository ID
 * @param {string} params.current_repo_type - Current repository type
 * @param {string} params.product_repo_path - Absolute path to product repository
 * @param {Object} params.config - Core config object
 * @returns {Promise<Object>} Sync result
 */
async function syncStoryStatus(params) {
  const {
    story_id,
    story_status,
    current_repo_path,
    current_repo_id,
    current_repo_type,
    product_repo_path,
    config
  } = params;

  // Validate inputs
  if (!story_id || !story_status || !current_repo_id || !product_repo_path) {
    return {
      success: false,
      error: 'Missing required parameters',
      synced: false
    };
  }

  // Load sync configuration
  const syncConfigPath = path.join(__dirname, '..', 'data', 'story-status-sync.yaml');
  if (!fs.existsSync(syncConfigPath)) {
    return {
      success: false,
      error: 'Sync configuration not found',
      synced: false
    };
  }

  const syncConfig = yaml.load(fs.readFileSync(syncConfigPath, 'utf8'));

  // Check if sync is enabled
  if (!syncConfig.sync.enabled) {
    return {
      success: true,
      message: 'Sync is disabled in configuration',
      synced: false
    };
  }

  // Check if this status change should trigger sync
  const triggerStatuses = syncConfig.sync_triggers.map(t => t.status);
  if (!triggerStatuses.includes(story_status)) {
    return {
      success: true,
      message: `Status "${story_status}" does not trigger sync`,
      synced: false
    };
  }

  try {
    // Step 1: Find story file in current repository
    const storyPattern = path.join(current_repo_path, 'docs', 'stories', `${story_id}-*`, 'story.md');
    const storyFiles = await glob(storyPattern, { windowsPathsNoEscape: true });

    if (storyFiles.length === 0) {
      return {
        success: false,
        error: `Story file not found for story ${story_id}`,
        synced: false
      };
    }

    const storyFilePath = storyFiles[0];
    const storyFileRelative = path.relative(current_repo_path, storyFilePath);

    // Step 2: Extract story metadata
    const storyContent = fs.readFileSync(storyFilePath, 'utf8');

    // Extract title
    const titleMatch = storyContent.match(/^#\s+Story\s+[\d.]+:\s+(.+)$/m);
    const storyTitle = titleMatch ? titleMatch[1].trim() : `Story ${story_id}`;

    // Extract epic ID
    const epicMatch = storyContent.match(/\*\*Epic\*\*:\s*Epic\s+(\d+)/i);
    const epicId = epicMatch ? parseInt(epicMatch[1], 10) : null;

    // Extract blocking reason (if status is Blocked)
    let blockingReason = null;
    if (story_status === 'Blocked') {
      const blockMatch = storyContent.match(/\*\*Blocking Reason\*\*:\s*(.+)/i);
      if (blockMatch) {
        blockingReason = blockMatch[1].trim();
      }
    }

    // Step 3: Load or create sync file in product repo
    const syncDir = path.join(product_repo_path, syncConfig.sync.sync_location);
    if (!fs.existsSync(syncDir)) {
      fs.mkdirSync(syncDir, { recursive: true });
    }

    const syncFileName = syncConfig.sync.sync_file_pattern.replace('{repository_id}', current_repo_id);
    const syncFilePath = path.join(syncDir, syncFileName);

    let syncData;
    if (fs.existsSync(syncFilePath)) {
      // Load existing sync file
      syncData = yaml.load(fs.readFileSync(syncFilePath, 'utf8'));
    } else {
      // Create new sync file
      syncData = {
        repository_id: current_repo_id,
        repository_type: current_repo_type,
        last_updated: new Date().toISOString(),
        stories: []
      };
    }

    // Step 4: Update or add story status
    const existingStoryIndex = syncData.stories.findIndex(s => s.story_id === story_id);

    const storyRecord = {
      story_id,
      story_title: storyTitle,
      status: story_status,
      status_updated_at: new Date().toISOString(),
      story_file: storyFileRelative,
      epic_id: epicId
    };

    if (blockingReason) {
      storyRecord.blocking_reason = blockingReason;
    }

    if (existingStoryIndex >= 0) {
      // Update existing story
      syncData.stories[existingStoryIndex] = storyRecord;
    } else {
      // Add new story
      syncData.stories.push(storyRecord);
    }

    // Sort stories by story_id
    syncData.stories.sort((a, b) => {
      const [aEpic, aStory] = a.story_id.split('.').map(Number);
      const [bEpic, bStory] = b.story_id.split('.').map(Number);
      if (aEpic !== bEpic) return aEpic - bEpic;
      return aStory - bStory;
    });

    // Update last_updated timestamp
    syncData.last_updated = new Date().toISOString();

    // Step 5: Write sync file
    fs.writeFileSync(syncFilePath, yaml.dump(syncData, { lineWidth: -1 }), 'utf8');

    // Step 6: Log sync operation
    if (syncConfig.monitoring.log_sync_operations) {
      const logDir = path.join(current_repo_path, '.ai');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'sync-log.md');
      const logEntry = `
## Sync Operation - ${new Date().toISOString()}

- **Story**: ${story_id} "${storyTitle}"
- **Status**: ${story_status}
- **Repository**: ${current_repo_id}
- **Sync File**: ${syncFilePath}
- **Result**: ✅ Success

`;

      fs.appendFileSync(logFile, logEntry, 'utf8');
    }

    return {
      success: true,
      message: `Story ${story_id} status synced to ${syncFilePath}`,
      synced: true,
      sync_file: syncFilePath,
      story_record: storyRecord
    };

  } catch (error) {
    // Handle errors per config
    if (syncConfig.sync_behavior.error_handling.on_sync_failure === 'log_and_continue') {
      // Log error but return success
      console.error(`Sync error for story ${story_id}:`, error.message);

      if (syncConfig.monitoring.log_sync_operations) {
        const logFile = path.join(current_repo_path, '.ai', 'sync-log.md');
        const logEntry = `
## Sync Error - ${new Date().toISOString()}

- **Story**: ${story_id}
- **Status**: ${story_status}
- **Repository**: ${current_repo_id}
- **Error**: ${error.message}
- **Result**: ❌ Failed (continuing)

`;
        fs.appendFileSync(logFile, logEntry, 'utf8');
      }

      return {
        success: true,
        message: 'Sync failed but continuing per config',
        synced: false,
        error: error.message
      };
    } else {
      // Throw error to halt workflow
      return {
        success: false,
        error: `Sync failed: ${error.message}`,
        synced: false
      };
    }
  }
}

/**
 * Get all story statuses for current repository
 *
 * @param {Object} params - Input parameters
 * @param {string} params.current_repo_path - Absolute path to current repository
 * @param {string} params.current_repo_id - Current repository ID
 * @param {string} params.current_repo_type - Current repository type
 * @param {string} params.product_repo_path - Absolute path to product repository
 * @returns {Promise<Object>} All story statuses
 */
async function getAllStoryStatuses(params) {
  const {
    current_repo_path,
    current_repo_id,
    current_repo_type,
    product_repo_path
  } = params;

  try {
    // Find all story files
    const storyPattern = path.join(current_repo_path, 'docs', 'stories', '*', 'story.md');
    const storyFiles = await glob(storyPattern, { windowsPathsNoEscape: true });

    const stories = [];

    for (const storyFile of storyFiles) {
      const storyContent = fs.readFileSync(storyFile, 'utf8');

      // Extract story ID from file path
      const storyDir = path.basename(path.dirname(storyFile));
      const storyIdMatch = storyDir.match(/^(\d+\.\d+)-/);
      if (!storyIdMatch) continue;

      const storyId = storyIdMatch[1];

      // Extract status
      const statusMatch = storyContent.match(/\*\*Status\*\*:\s*(\w+)/);
      const status = statusMatch ? statusMatch[1] : 'Unknown';

      // Extract title
      const titleMatch = storyContent.match(/^#\s+Story\s+[\d.]+:\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : `Story ${storyId}`;

      // Extract epic ID
      const epicMatch = storyContent.match(/\*\*Epic\*\*:\s*Epic\s+(\d+)/i);
      const epicId = epicMatch ? parseInt(epicMatch[1], 10) : null;

      stories.push({
        story_id: storyId,
        story_title: title,
        status,
        epic_id: epicId,
        story_file: path.relative(current_repo_path, storyFile)
      });
    }

    // Sort by story_id
    stories.sort((a, b) => {
      const [aEpic, aStory] = a.story_id.split('.').map(Number);
      const [bEpic, bStory] = b.story_id.split('.').map(Number);
      if (aEpic !== bEpic) return aEpic - bEpic;
      return aStory - bStory;
    });

    return {
      success: true,
      repository_id: current_repo_id,
      repository_type: current_repo_type,
      story_count: stories.length,
      stories
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      stories: []
    };
  }
}

/**
 * CLI Entry Point
 * Usage: node sync-story-status.js <command> <story_id> <status> <repo_path> <repo_id> <repo_type> <product_repo_path>
 */
async function main() {
  if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'sync') {
      if (args.length < 7) {
        console.error('Usage: node sync-story-status.js sync <story_id> <status> <repo_path> <repo_id> <repo_type> <product_repo_path>');
        process.exit(1);
      }

      const [_, story_id, story_status, current_repo_path, current_repo_id, current_repo_type, product_repo_path] = args;

      const result = await syncStoryStatus({
        story_id,
        story_status,
        current_repo_path,
        current_repo_id,
        current_repo_type,
        product_repo_path
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);

    } else if (command === 'list') {
      if (args.length < 5) {
        console.error('Usage: node sync-story-status.js list <repo_path> <repo_id> <repo_type> <product_repo_path>');
        process.exit(1);
      }

      const [_, current_repo_path, current_repo_id, current_repo_type, product_repo_path] = args;

      const result = await getAllStoryStatuses({
        current_repo_path,
        current_repo_id,
        current_repo_type,
        product_repo_path
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);

    } else {
      console.error('Unknown command. Use: sync or list');
      process.exit(1);
    }
  }
}

// Export for use as module
module.exports = {
  syncStoryStatus,
  getAllStoryStatuses
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
