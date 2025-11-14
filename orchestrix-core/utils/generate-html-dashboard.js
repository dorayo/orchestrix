#!/usr/bin/env node

/**
 * Enhanced HTML Dashboard Generator with Dependency Graph
 *
 * Generates interactive HTML dashboard showing:
 * - Multi-repo story progress
 * - Dependency graph visualization (Mermaid)
 * - Blocked stories
 * - Timeline view
 *
 * Stage: Stage 3 (Advanced Features)
 */

const fs = require('fs');
const path = require('path');
const { generateDashboard } = require('./multi-repo-dashboard.js');

/**
 * Generate HTML dashboard
 *
 * @param {Object} params - Input parameters
 * @param {string} params.product_repo_path - Path to product repository
 * @param {string} params.output_file - Output HTML file path
 * @returns {Promise<Object>} Generation result
 */
async function generateHTMLDashboard(params) {
  const { product_repo_path, output_file } = params;

  try {
    // Get dashboard data
    const dashboardData = await generateDashboard({ product_repo_path });

    if (!dashboardData.success) {
      return {
        success: false,
        error: dashboardData.error
      };
    }

    // Generate Mermaid dependency graph
    const mermaidGraph = generateMermaidDependencyGraph(dashboardData);

    // Generate HTML
    const html = generateHTML(dashboardData, mermaidGraph);

    // Write to file
    fs.writeFileSync(output_file, html, 'utf8');

    return {
      success: true,
      message: `HTML dashboard generated: ${output_file}`,
      output_file
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate Mermaid dependency graph
 */
function generateMermaidDependencyGraph(dashboardData) {
  let mermaid = ['graph TD'];

  // Add all stories as nodes
  dashboardData.repositories.forEach(repo => {
    repo.stories.forEach(story => {
      const nodeId = story.story_id.replace('.', '_');
      const style = getNodeStyle(story.status);
      const label = `${story.story_id}<br/>${story.story_title.substring(0, 30)}...`;

      mermaid.push(`  ${nodeId}["${label}"]`);
      mermaid.push(`  class ${nodeId} ${style}`);
    });
  });

  // Add dependency edges
  dashboardData.repositories.forEach(repo => {
    repo.stories.forEach(story => {
      if (story.dependencies && story.dependencies.length > 0) {
        story.dependencies.forEach(depId => {
          const fromId = depId.replace('.', '_');
          const toId = story.story_id.replace('.', '_');
          mermaid.push(`  ${fromId} --> ${toId}`);
        });
      }
    });
  });

  // Add CSS classes
  mermaid.push('');
  mermaid.push('  classDef done fill:#90EE90,stroke:#2E8B57,stroke-width:2px');
  mermaid.push('  classDef inProgress fill:#FFD700,stroke:#DAA520,stroke-width:2px');
  mermaid.push('  classDef blocked fill:#FF6B6B,stroke:#DC143C,stroke-width:2px');
  mermaid.push('  classDef notCreated fill:#D3D3D3,stroke:#696969,stroke-width:2px');

  return mermaid.join('\n');
}

function getNodeStyle(status) {
  const styleMap = {
    'Done': 'done',
    'InProgress': 'inProgress',
    'Blocked': 'blocked',
    'NotCreated': 'notCreated',
    'Review': 'inProgress',
    'AwaitingArchReview': 'inProgress'
  };
  return styleMap[status] || 'notCreated';
}

/**
 * Generate complete HTML
 */
function generateHTML(data, mermaidGraph) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Repo Dashboard - ${data.generated_at}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 20px; }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    header h1 { font-size: 2rem; margin-bottom: 10px; }
    header .timestamp { opacity: 0.9; font-size: 0.9rem; }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .summary-card .number {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .summary-card .label { color: #666; font-size: 0.9rem; }

    .card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .card h2 {
      font-size: 1.5rem;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }

    .repo-section {
      margin-bottom: 20px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .repo-header {
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 10px;
      color: #444;
    }
    .repo-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 15px;
      font-size: 0.9rem;
      color: #666;
    }

    .story-list {
      display: grid;
      gap: 10px;
    }
    .story-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      background: white;
      border-radius: 6px;
      border-left: 4px solid #ddd;
      transition: all 0.2s;
    }
    .story-item:hover {
      transform: translateX(5px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .story-item.done { border-left-color: #10B981; }
    .story-item.in-progress { border-left-color: #F59E0B; }
    .story-item.blocked { border-left-color: #EF4444; }

    .story-icon {
      font-size: 1.5rem;
      margin-right: 15px;
      min-width: 30px;
    }
    .story-id {
      font-weight: bold;
      color: #667eea;
      margin-right: 10px;
      min-width: 60px;
    }
    .story-title { flex: 1; }
    .story-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .story-badge.done { background: #D1FAE5; color: #065F46; }
    .story-badge.in-progress { background: #FEF3C7; color: #92400E; }
    .story-badge.blocked { background: #FEE2E2; color: #991B1B; }
    .story-badge.not-created { background: #E5E7EB; color: #4B5563; }

    .blocked-list {
      background: #FEE2E2;
      border: 2px solid #EF4444;
      border-radius: 8px;
      padding: 20px;
    }
    .blocked-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      border-left: 4px solid #EF4444;
    }
    .blocked-item:last-child { margin-bottom: 0; }
    .blocked-header {
      font-weight: bold;
      color: #991B1B;
      margin-bottom: 8px;
      font-size: 1.05rem;
    }
    .blocked-deps {
      margin-top: 10px;
      padding-left: 20px;
      color: #666;
      font-size: 0.9rem;
    }

    .mermaid {
      background: white;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
    }

    .progress-bar {
      width: 100%;
      height: 30px;
      background: #E5E7EB;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Multi-Repository Dashboard</h1>
      <div class="timestamp">Generated: ${data.generated_at}</div>
    </header>

    <div class="summary">
      <div class="summary-card">
        <div class="label">Total Stories</div>
        <div class="number">${data.summary.total_stories}</div>
      </div>
      <div class="summary-card">
        <div class="label">✅ Done</div>
        <div class="number" style="color: #10B981;">${data.summary.done_count}</div>
      </div>
      <div class="summary-card">
        <div class="label">🔄 In Progress</div>
        <div class="number" style="color: #F59E0B;">${data.summary.in_progress_count}</div>
      </div>
      <div class="summary-card">
        <div class="label">🚫 Blocked</div>
        <div class="number" style="color: #EF4444;">${data.summary.blocked_count}</div>
      </div>
    </div>

    <div class="card">
      <h2>📊 Overall Progress</h2>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${data.summary.progress_percentage}%">
          ${data.summary.progress_percentage}%
        </div>
      </div>
    </div>

    ${data.blocked_stories.length > 0 ? `
    <div class="card">
      <h2>⚠️ Blocked Stories (${data.blocked_stories.length})</h2>
      <div class="blocked-list">
        ${data.blocked_stories.map(blocked => `
          <div class="blocked-item">
            <div class="blocked-header">
              🚫 Story ${blocked.story_id}: ${blocked.story_title}
            </div>
            <div><strong>Repository:</strong> ${blocked.repository}</div>
            <div><strong>Current Status:</strong> ${blocked.current_status}</div>
            <div class="blocked-deps">
              <strong>Blocked By:</strong>
              <ul>
                ${blocked.blocking_dependencies.map(dep => `
                  <li>Story ${dep.story_id} (${dep.repository}): ${dep.status}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : '<div class="card"><h2>✅ No Blocked Stories!</h2></div>'}

    <div class="card">
      <h2>🔗 Dependency Graph</h2>
      <div class="mermaid">
${mermaidGraph}
      </div>
    </div>

    ${data.repositories.map(repo => `
      <div class="card">
        <h2>📦 ${repo.repository_id}</h2>
        <div class="repo-section">
          <div class="repo-stats">
            <span><strong>Type:</strong> ${repo.repository_type}</span>
            <span><strong>Stories:</strong> ${repo.story_count}</span>
            <span><strong>Done:</strong> ${repo.status_counts.Done}</span>
            <span><strong>In Progress:</strong> ${repo.status_counts.InProgress}</span>
            <span><strong>Last Sync:</strong> ${repo.last_sync || 'Never'}</span>
          </div>
          <div class="story-list">
            ${repo.stories.map(story => `
              <div class="story-item ${story.status.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}">
                <div class="story-icon">${getStoryIcon(story.status)}</div>
                <span class="story-id">${story.story_id}</span>
                <span class="story-title">${story.story_title}</span>
                <span class="story-badge ${story.status.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}">${story.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('')}

  </div>

  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</body>
</html>`;
}

function getStoryIcon(status) {
  const icons = {
    'Done': '✅',
    'InProgress': '🔄',
    'Review': '👀',
    'Blocked': '🚫',
    'AwaitingArchReview': '📝',
    'Approved': '✓',
    'RequiresRevision': '⚠️',
    'NotCreated': '⭕'
  };
  return icons[status] || '❓';
}

/**
 * CLI Entry Point
 */
async function main() {
  if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('Usage: generate-html-dashboard.js <product_repo_path> [output_file]');
      process.exit(1);
    }

    const product_repo_path = args[0];
    const output_file = args[1] || path.join(product_repo_path, 'docs/multi-repo-dashboard.html');

    const result = await generateHTMLDashboard({
      product_repo_path,
      output_file
    });

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }

    process.exit(result.success ? 0 : 1);
  }
}

// Export for use as module
module.exports = {
  generateHTMLDashboard,
  generateMermaidDependencyGraph
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
