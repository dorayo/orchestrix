#!/usr/bin/env node

/**
 * Multi-Repository Dashboard
 *
 * Visualizes story progress across all repositories with cross-repo dependencies.
 * Shows blocked stories and dependency relationships.
 *
 * Stage: Stage 2 (Automation)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');
const { checkCrossRepoDependencies } = require('./dependency-checker.js');

/**
 * Generate multi-repo dashboard
 *
 * @param {Object} params - Input parameters
 * @param {string} params.product_repo_path - Absolute path to product repository
 * @returns {Promise<Object>} Dashboard data
 */
async function generateDashboard(params) {
  const { product_repo_path } = params;

  try {
    // Step 1: Load all epic YAML files
    const epicsPath = path.join(product_repo_path, 'docs/epics');
    if (!fs.existsSync(epicsPath)) {
      return {
        success: false,
        error: 'Epics directory not found'
      };
    }

    const epicFiles = fs.readdirSync(epicsPath).filter(f => f.startsWith('epic-') && f.endsWith('.yaml'));
    const epics = epicFiles.map(f => {
      const content = fs.readFileSync(path.join(epicsPath, f), 'utf8');
      return yaml.load(content);
    });

    // Step 2: Extract all stories
    const all_stories = [];
    const repositories = new Set();

    epics.forEach(epic => {
      epic.stories.forEach(story => {
        all_stories.push({
          ...story,
          epic_id: epic.epic_id,
          epic_title: epic.title
        });
        repositories.add(story.repository);
      });
    });

    // Step 3: Load status sync files for each repository
    const syncDir = path.join(product_repo_path, 'docs/story-status');
    const repo_statuses = {};

    if (fs.existsSync(syncDir)) {
      const syncFiles = fs.readdirSync(syncDir).filter(f => f.endsWith('.yaml'));

      for (const syncFile of syncFiles) {
        const syncContent = yaml.load(fs.readFileSync(path.join(syncDir, syncFile), 'utf8'));
        repo_statuses[syncContent.repository_id] = syncContent;
      }
    }

    // Step 4: Build dashboard data for each repository
    const repo_dashboards = [];

    for (const repo_id of repositories) {
      const repo_stories = all_stories.filter(s => s.repository === repo_id);
      const repo_status_data = repo_statuses[repo_id];

      // Count stories by status
      const status_counts = {
        total: repo_stories.length,
        Done: 0,
        InProgress: 0,
        Review: 0,
        Blocked: 0,
        AwaitingArchReview: 0,
        Approved: 0,
        RequiresRevision: 0,
        NotCreated: 0
      };

      const stories_with_status = repo_stories.map(story => {
        let status = 'NotCreated';
        let status_updated_at = null;

        if (repo_status_data) {
          const statusRecord = repo_status_data.stories.find(s => s.story_id === story.id);
          if (statusRecord) {
            status = statusRecord.status;
            status_updated_at = statusRecord.status_updated_at;
          }
        }

        status_counts[status] = (status_counts[status] || 0) + 1;

        return {
          story_id: story.id,
          story_title: story.title,
          epic_id: story.epic_id,
          epic_title: story.epic_title,
          status,
          status_updated_at,
          has_dependencies: story.dependencies && story.dependencies.length > 0,
          dependencies: story.dependencies || []
        };
      });

      repo_dashboards.push({
        repository_id: repo_id,
        repository_type: repo_stories[0]?.repository_type || 'unknown',
        story_count: repo_stories.length,
        status_counts,
        stories: stories_with_status,
        last_sync: repo_status_data?.last_updated || null
      });
    }

    // Step 5: Identify blocked stories (dependencies not satisfied)
    const blocked_stories = [];

    for (const repo_dashboard of repo_dashboards) {
      for (const story of repo_dashboard.stories) {
        if (story.has_dependencies && story.status !== 'Done') {
          // Check if dependencies are satisfied
          const story_definition = all_stories.find(s => s.id === story.story_id);

          const depCheck = await checkCrossRepoDependencies({
            story_id: story.story_id,
            story_definition,
            current_repo_id: repo_dashboard.repository_id,
            product_repo_path,
            all_stories
          });

          if (depCheck.status === 'blocked') {
            blocked_stories.push({
              story_id: story.story_id,
              story_title: story.story_title,
              repository: repo_dashboard.repository_id,
              current_status: story.status,
              blocking_dependencies: depCheck.blocking_dependencies
            });
          }
        }
      }
    }

    // Step 6: Calculate overall progress
    const total_stories = all_stories.length;
    const done_count = repo_dashboards.reduce((sum, repo) => sum + repo.status_counts.Done, 0);
    const in_progress_count = repo_dashboards.reduce((sum, repo) => sum + repo.status_counts.InProgress, 0);
    const blocked_count = blocked_stories.length;

    const progress_percentage = Math.round((done_count / total_stories) * 100);

    return {
      success: true,
      generated_at: new Date().toISOString(),
      summary: {
        total_repositories: repositories.size,
        total_stories,
        done_count,
        in_progress_count,
        blocked_count,
        progress_percentage
      },
      repositories: repo_dashboards,
      blocked_stories
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format dashboard as text output
 *
 * @param {Object} dashboard - Dashboard data
 * @returns {string} Formatted text
 */
function formatDashboardText(dashboard) {
  if (!dashboard.success) {
    return `❌ Dashboard Error: ${dashboard.error}`;
  }

  let output = [];

  output.push('');
  output.push('═'.repeat(70));
  output.push('  MULTI-REPOSITORY DASHBOARD');
  output.push('═'.repeat(70));
  output.push('');

  // Summary
  output.push(`📊 Overall Progress: ${dashboard.summary.done_count}/${dashboard.summary.total_stories} stories (${dashboard.summary.progress_percentage}%)`);
  output.push(`   • Done: ${dashboard.summary.done_count}`);
  output.push(`   • In Progress: ${dashboard.summary.in_progress_count}`);
  output.push(`   • Blocked: ${dashboard.summary.blocked_count}`);
  output.push('');

  // Repository breakdown
  output.push('📦 Repositories:');
  output.push('');

  dashboard.repositories.forEach(repo => {
    output.push(`  ${repo.repository_id} (${repo.repository_type})`);
    output.push(`  ├─ Stories: ${repo.story_count}`);
    output.push(`  ├─ Done: ${repo.status_counts.Done}`);
    output.push(`  ├─ In Progress: ${repo.status_counts.InProgress}`);
    output.push(`  ├─ Not Created: ${repo.status_counts.NotCreated}`);
    output.push(`  └─ Last Sync: ${repo.last_sync || 'Never'}`);
    output.push('');
  });

  // Blocked stories
  if (dashboard.blocked_stories.length > 0) {
    output.push('⚠️  BLOCKED STORIES:');
    output.push('');

    dashboard.blocked_stories.forEach(blocked => {
      output.push(`  🚫 Story ${blocked.story_id}: ${blocked.story_title}`);
      output.push(`     Repository: ${blocked.repository}`);
      output.push(`     Current Status: ${blocked.current_status}`);
      output.push(`     Blocked By:`);

      blocked.blocking_dependencies.forEach(dep => {
        output.push(`       - Story ${dep.story_id} (${dep.repository}): ${dep.status}`);
      });

      output.push('');
    });
  } else {
    output.push('✅ No blocked stories!');
    output.push('');
  }

  // Story list per repository
  output.push('─'.repeat(70));
  output.push('📋 STORY STATUS BY REPOSITORY');
  output.push('─'.repeat(70));
  output.push('');

  dashboard.repositories.forEach(repo => {
    output.push(`\n${repo.repository_id.toUpperCase()}:`);
    output.push('');

    repo.stories.forEach(story => {
      const statusIcon = {
        Done: '✅',
        InProgress: '🔄',
        Review: '👀',
        Blocked: '🚫',
        AwaitingArchReview: '📝',
        Approved: '✓',
        RequiresRevision: '⚠️',
        NotCreated: '⭕'
      }[story.status] || '❓';

      const depIndicator = story.has_dependencies ? ' [has deps]' : '';

      output.push(`  ${statusIcon} ${story.story_id}: ${story.story_title}${depIndicator}`);
    });

    output.push('');
  });

  output.push('═'.repeat(70));
  output.push(`Generated: ${dashboard.generated_at}`);
  output.push('═'.repeat(70));
  output.push('');

  return output.join('\n');
}

/**
 * CLI Entry Point
 * Usage: node multi-repo-dashboard.js <product_repo_path>
 */
async function main() {
  if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('Usage: node multi-repo-dashboard.js <product_repo_path>');
      process.exit(1);
    }

    const [product_repo_path] = args;

    const dashboard = await generateDashboard({ product_repo_path });

    // Output as text
    console.log(formatDashboardText(dashboard));

    // Also save JSON for programmatic use
    const outputFile = path.join(product_repo_path, 'docs/multi-repo-dashboard.json');
    fs.writeFileSync(outputFile, JSON.stringify(dashboard, null, 2), 'utf8');
    console.log(`\n💾 Dashboard data saved to: ${outputFile}`);

    process.exit(dashboard.success ? 0 : 1);
  }
}

// Export for use as module
module.exports = {
  generateDashboard,
  formatDashboardText
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
