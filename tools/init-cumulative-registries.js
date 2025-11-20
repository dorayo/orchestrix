#!/usr/bin/env node

/**
 * Initialize Cumulative Registries
 *
 * Scans all completed stories and generates cumulative registries:
 * - database-registry.md
 * - api-registry.md
 * - models-registry.md
 *
 * Supports both new format (structured YAML fields) and legacy format (free-form text).
 * For legacy stories, uses LLM to parse Implementation Summary.
 *
 * Usage:
 *   node tools/init-cumulative-registries.js
 *   node tools/init-cumulative-registries.js --force          # Overwrite existing registries
 *   node tools/init-cumulative-registries.js --dry-run        # Preview without writing
 *   node tools/init-cumulative-registries.js --story-dir=./docs/stories  # Custom story directory
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  dryRun: args.includes('--dry-run'),
  storyDir: args.find(arg => arg.startsWith('--story-dir='))?.split('=')[1],
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Load core configuration
let config;
try {
  const configPath = path.join(process.cwd(), 'orchestrix-core', 'core-config.yaml');
  const configContent = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(configContent);
} catch (error) {
  console.error('❌ Failed to load core-config.yaml:', error.message);
  process.exit(1);
}

// Determine story directory
const storyDir = options.storyDir ||
  path.join(process.cwd(), config.locations?.devStoryLocation || 'docs/stories');

// Determine dev doc location (where registries will be written)
const devDocLocation = path.join(process.cwd(), config.locations?.devDocLocation || 'docs/dev');

console.log('🚀 Orchestrix Cumulative Registry Initialization\n');
console.log(`Story Directory: ${storyDir}`);
console.log(`Registry Output: ${devDocLocation}`);
console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'WRITE'}`);
console.log(`Force Overwrite: ${options.force}\n`);

// Check if registries already exist
const registryFiles = {
  database: path.join(devDocLocation, 'database-registry.md'),
  api: path.join(devDocLocation, 'api-registry.md'),
  models: path.join(devDocLocation, 'models-registry.md')
};

const existingRegistries = Object.entries(registryFiles)
  .filter(([_, filePath]) => fs.existsSync(filePath))
  .map(([name]) => name);

if (existingRegistries.length > 0 && !options.force) {
  console.log('⚠️  Existing registries found:');
  existingRegistries.forEach(name => console.log(`   - ${name}-registry.md`));
  console.log('\nUse --force to overwrite existing registries.');
  console.log('Use --dry-run to preview changes without writing.\n');
  process.exit(0);
}

// Scan for story files
async function scanStories() {
  console.log('📂 Scanning for story files...\n');

  const pattern = path.join(storyDir, '**/*.story.md');
  const storyFiles = await glob(pattern);

  console.log(`Found ${storyFiles.length} story files\n`);

  return storyFiles;
}

// Parse story file to extract Dev Agent Record
function parseStory(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract story ID from filename (e.g., "1.3.story.md" → "1.3")
  const filename = path.basename(filePath);
  const storyIdMatch = filename.match(/^(\d+\.\d+)/);
  const storyId = storyIdMatch ? storyIdMatch[1] : 'unknown';

  // Extract story status
  const statusMatch = content.match(/##\s*Status\s*\n+\*\*Current Status\*\*:\s*(\w+)/);
  const status = statusMatch ? statusMatch[1] : 'Unknown';

  // Only process stories with status = Done
  if (status !== 'Done') {
    return null;
  }

  // Extract story title
  const titleMatch = content.match(/^#\s+Story\s+\d+\.\d+:\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';

  // Try to extract structured fields (new format)
  const devAgentRecordMatch = content.match(/##\s*Dev Agent Record\s*\n([\s\S]*?)(?=\n##|\n---|\n\Z)/);

  if (!devAgentRecordMatch) {
    if (options.verbose) {
      console.log(`⚠️  Story ${storyId}: No Dev Agent Record found`);
    }
    return null;
  }

  const devAgentRecord = devAgentRecordMatch[1];

  // Extract structured fields
  const databaseChanges = extractYamlField(devAgentRecord, 'Database Changes');
  const apiEndpoints = extractYamlField(devAgentRecord, 'API Endpoints Created');
  const sharedModels = extractYamlField(devAgentRecord, 'Shared Models Created');

  // Check if this is new format (has structured fields) or legacy format
  const hasStructuredData = databaseChanges || apiEndpoints || sharedModels;

  return {
    id: storyId,
    title,
    status,
    filePath,
    format: hasStructuredData ? 'structured' : 'legacy',
    databaseChanges,
    apiEndpoints,
    sharedModels,
    implementationSummary: extractImplementationSummary(devAgentRecord)
  };
}

// Extract YAML field from Dev Agent Record
function extractYamlField(text, fieldName) {
  // Match: ### Field Name (Structured)\n```yaml\n{content}\n```
  const regex = new RegExp(`###\\s*${fieldName}[^\\n]*\\n\\s*\`\`\`yaml\\s*\\n([\\s\\S]*?)\\n\\s*\`\`\``, 'i');
  const match = text.match(regex);

  if (!match) {
    return null;
  }

  try {
    return yaml.load(match[1]);
  } catch (error) {
    if (options.verbose) {
      console.log(`⚠️  Failed to parse YAML for "${fieldName}":`, error.message);
    }
    return null;
  }
}

// Extract Implementation Summary (for legacy format)
function extractImplementationSummary(text) {
  const regex = /###\s*Implementation Summary\s*\n([^\n#]+)/;
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Build cumulative registries from parsed stories
function buildRegistries(stories) {
  const registries = {
    database: {
      metadata: {
        last_updated: new Date().toISOString(),
        total_stories: 0,
        repository_id: config.project?.multi_repo?.repository_id || 'monolith',
        project_mode: config.project?.mode || 'monolith'
      },
      tables: [],
      migrations: [],
      timeline: []
    },
    api: {
      metadata: {
        last_updated: new Date().toISOString(),
        total_stories: 0,
        total_endpoints: 0,
        repository_id: config.project?.multi_repo?.repository_id || 'monolith',
        project_mode: config.project?.mode || 'monolith'
      },
      resources: {},
      endpoints: [],
      schemas: [],
      timeline: []
    },
    models: {
      metadata: {
        last_updated: new Date().toISOString(),
        total_stories: 0,
        total_models: 0,
        repository_id: config.project?.multi_repo?.repository_id || 'monolith',
        project_mode: config.project?.mode || 'monolith'
      },
      interfaces: [],
      zod_schemas: [],
      enums: [],
      classes: [],
      dtos: [],
      timeline: []
    }
  };

  let structuredCount = 0;
  let legacyCount = 0;
  let skippedCount = 0;

  for (const story of stories) {
    if (!story) {
      skippedCount++;
      continue;
    }

    if (story.format === 'structured') {
      structuredCount++;
      processStructuredStory(story, registries);
    } else {
      legacyCount++;
      processLegacyStory(story, registries);
    }
  }

  // Update totals
  registries.database.metadata.total_stories = structuredCount + legacyCount;
  registries.api.metadata.total_stories = structuredCount + legacyCount;
  registries.models.metadata.total_stories = structuredCount + legacyCount;

  registries.api.metadata.total_endpoints = registries.api.endpoints.length;
  registries.models.metadata.total_models =
    registries.models.interfaces.length +
    registries.models.zod_schemas.length +
    registries.models.enums.length +
    registries.models.classes.length +
    registries.models.dtos.length;

  console.log(`\n✅ Registry Building Complete\n`);
  console.log(`Stories Processed:`);
  console.log(`  - Structured format: ${structuredCount}`);
  console.log(`  - Legacy format: ${legacyCount}`);
  console.log(`  - Skipped (not Done): ${skippedCount}`);
  console.log(`\nRegistry Contents:`);
  console.log(`  - Database: ${registries.database.tables.length} tables, ${registries.database.migrations.length} migrations`);
  console.log(`  - API: ${registries.api.endpoints.length} endpoints, ${registries.api.schemas.length} schemas`);
  console.log(`  - Models: ${registries.models.metadata.total_models} models/types\n`);

  return registries;
}

// Process story with structured YAML fields
function processStructuredStory(story, registries) {
  if (options.verbose) {
    console.log(`✓ Story ${story.id}: ${story.title} (structured)`);
  }

  // Process database changes
  if (story.databaseChanges) {
    if (story.databaseChanges.tables_created) {
      for (const table of story.databaseChanges.tables_created) {
        registries.database.tables.push({
          name: table.name,
          created_in_story: story.id,
          status: 'active',
          description: table.description || '',
          fields: (table.fields || []).map(field => ({
            ...field,
            added_in_story: story.id
          })),
          indexes: table.indexes || [],
          foreign_keys: table.foreign_keys || []
        });
      }
    }

    if (story.databaseChanges.migrations) {
      for (const migration of story.databaseChanges.migrations) {
        registries.database.migrations.push({
          ...migration,
          story_id: story.id
        });
      }
    }

    // Add to timeline
    registries.database.timeline.push({
      story_id: story.id,
      story_title: story.title,
      tables_created: story.databaseChanges.tables_created?.map(t => t.name) || [],
      tables_modified: story.databaseChanges.tables_modified?.map(t => t.name) || [],
      fields_added: (story.databaseChanges.tables_created?.reduce((sum, t) => sum + (t.fields?.length || 0), 0) || 0) +
                    (story.databaseChanges.tables_modified?.reduce((sum, t) => sum + (t.fields_added?.length || 0), 0) || 0),
      indexes_added: (story.databaseChanges.tables_created?.reduce((sum, t) => sum + (t.indexes?.length || 0), 0) || 0),
      migration_file: story.databaseChanges.migrations?.map(m => m.filename).join(', ') || ''
    });
  }

  // Process API endpoints
  if (story.apiEndpoints) {
    for (const endpoint of story.apiEndpoints) {
      registries.api.endpoints.push({
        ...endpoint,
        story_id: story.id
      });

      // Group by resource
      const resource = extractResourceFromPath(endpoint.path);
      if (!registries.api.resources[resource]) {
        registries.api.resources[resource] = {
          name: resource,
          base_path: extractBasePath(endpoint.path),
          endpoints: []
        };
      }
      registries.api.resources[resource].endpoints.push(endpoint);

      // Extract schemas
      if (endpoint.request_schema) {
        addSchema(registries.api.schemas, endpoint.request_schema, story.id, endpoint.file_path);
      }
      if (endpoint.success_schema) {
        addSchema(registries.api.schemas, endpoint.success_schema, story.id, endpoint.file_path);
      }
    }

    // Add to timeline
    registries.api.timeline.push({
      story_id: story.id,
      story_title: story.title,
      endpoints: story.apiEndpoints.map(e => ({
        method: e.method,
        path: e.path,
        description: e.description || ''
      })),
      schemas: extractSchemaNames(story.apiEndpoints)
    });
  }

  // Process shared models
  if (story.sharedModels) {
    if (story.sharedModels.interfaces) {
      for (const iface of story.sharedModels.interfaces) {
        registries.models.interfaces.push({
          ...iface,
          story_id: story.id
        });
      }
    }

    if (story.sharedModels.zod_schemas) {
      for (const schema of story.sharedModels.zod_schemas) {
        registries.models.zod_schemas.push({
          ...schema,
          story_id: story.id
        });
      }
    }

    if (story.sharedModels.enums) {
      for (const enumDef of story.sharedModels.enums) {
        registries.models.enums.push({
          ...enumDef,
          story_id: story.id
        });
      }
    }

    if (story.sharedModels.classes) {
      for (const classDef of story.sharedModels.classes) {
        registries.models.classes.push({
          ...classDef,
          story_id: story.id
        });
      }
    }

    if (story.sharedModels.dtos) {
      for (const dto of story.sharedModels.dtos) {
        registries.models.dtos.push({
          ...dto,
          story_id: story.id
        });
      }
    }

    // Add to timeline
    registries.models.timeline.push({
      story_id: story.id,
      story_title: story.title,
      interfaces: story.sharedModels.interfaces?.map(i => i.name) || [],
      zod_schemas: story.sharedModels.zod_schemas?.map(s => s.name) || [],
      enums: story.sharedModels.enums?.map(e => e.name) || [],
      classes: story.sharedModels.classes?.map(c => c.name) || [],
      dtos: story.sharedModels.dtos?.map(d => d.name) || []
    });
  }
}

// Process legacy story (free-form text) - minimal extraction
function processLegacyStory(story, registries) {
  if (options.verbose) {
    console.log(`⚠️  Story ${story.id}: ${story.title} (legacy - limited extraction)`);
  }

  // For legacy stories, we can only add placeholder entries
  // Full parsing would require LLM integration (see parse-legacy-dev-record.md)

  // Add to timeline with warning
  registries.database.timeline.push({
    story_id: story.id,
    story_title: story.title,
    tables_created: [],
    tables_modified: [],
    fields_added: 0,
    indexes_added: 0,
    migration_file: '',
    warning: '⚠️ Legacy format - manual review recommended'
  });

  registries.api.timeline.push({
    story_id: story.id,
    story_title: story.title,
    endpoints: [],
    schemas: [],
    warning: '⚠️ Legacy format - manual review recommended'
  });

  registries.models.timeline.push({
    story_id: story.id,
    story_title: story.title,
    interfaces: [],
    zod_schemas: [],
    enums: [],
    classes: [],
    dtos: [],
    warning: '⚠️ Legacy format - manual review recommended'
  });
}

// Helper functions
function extractResourceFromPath(path) {
  const match = path.match(/\/api\/([^\/]+)/);
  return match ? match[1] : 'other';
}

function extractBasePath(path) {
  const match = path.match(/(\/api\/[^\/]+)/);
  return match ? match[1] : '/api';
}

function addSchema(schemas, schemaName, storyId, filePath) {
  if (!schemas.find(s => s.name === schemaName)) {
    schemas.push({
      name: schemaName,
      type: 'Zod',
      story_id: storyId,
      file_path: filePath,
      used_by_endpoints: 1
    });
  }
}

function extractSchemaNames(endpoints) {
  const schemas = [];
  for (const endpoint of endpoints) {
    if (endpoint.request_schema && !schemas.find(s => s.name === endpoint.request_schema)) {
      schemas.push({
        name: endpoint.request_schema,
        type: 'Zod',
        file_path: endpoint.file_path
      });
    }
    if (endpoint.success_schema && !schemas.find(s => s.name === endpoint.success_schema)) {
      schemas.push({
        name: endpoint.success_schema,
        type: 'Zod',
        file_path: endpoint.file_path
      });
    }
  }
  return schemas;
}

// Generate markdown registry files
function generateMarkdown(registries) {
  const markdownFiles = {};

  // Generate database registry
  markdownFiles.database = generateDatabaseMarkdown(registries.database);

  // Generate API registry
  markdownFiles.api = generateApiMarkdown(registries.api);

  // Generate models registry
  markdownFiles.models = generateModelsMarkdown(registries.models);

  return markdownFiles;
}

function generateDatabaseMarkdown(registry) {
  let md = '# Database Cumulative Registry\n\n';
  md += '> Auto-generated by init-cumulative-registries.js\n';
  md += '> Updated by Dev Agent after each story completion\n\n';

  md += '## Registry Metadata\n\n';
  md += `**Last Updated**: ${registry.metadata.last_updated}\n`;
  md += `**Total Stories Tracked**: ${registry.metadata.total_stories}\n`;
  md += `**Repository**: ${registry.metadata.repository_id}\n`;
  md += `**Mode**: ${registry.metadata.project_mode}\n\n`;

  md += '## Database Tables Registry\n\n';

  if (registry.tables.length === 0) {
    md += '_No tables tracked yet._\n\n';
  } else {
    for (const table of registry.tables) {
      md += `### Table: \`${table.name}\`\n\n`;
      md += `**Created in Story**: ${table.created_in_story}\n`;
      md += `**Status**: ${table.status}\n`;
      if (table.description) {
        md += `**Description**: ${table.description}\n`;
      }
      md += '\n#### Fields\n\n';
      md += '| Field Name | Type | Constraints | Added in Story | Notes |\n';
      md += '|------------|------|-------------|----------------|-------|\n';
      for (const field of table.fields || []) {
        md += `| \`${field.name}\` | ${field.type} | ${field.constraints || ''} | ${field.added_in_story} | ${field.notes || ''} |\n`;
      }
      md += '\n';

      if (table.indexes && table.indexes.length > 0) {
        md += '#### Indexes\n\n';
        md += '| Index Name | Fields | Type | Added in Story |\n';
        md += '|------------|--------|------|----------------|\n';
        for (const index of table.indexes) {
          md += `| \`${index.name}\` | ${index.fields} | ${index.type} | ${table.created_in_story} |\n`;
        }
        md += '\n';
      }

      if (table.foreign_keys && table.foreign_keys.length > 0) {
        md += '#### Foreign Keys\n\n';
        md += '| FK Name | Local Field | References | Added in Story |\n';
        md += '|---------|-------------|------------|----------------|\n';
        for (const fk of table.foreign_keys) {
          md += `| \`${fk.name}\` | \`${fk.local_field}\` | \`${fk.references}\` | ${table.created_in_story} |\n`;
        }
        md += '\n';
      }

      md += '---\n\n';
    }
  }

  md += '## Schema Evolution Timeline\n\n';

  if (registry.timeline.length === 0) {
    md += '_No timeline entries yet._\n';
  } else {
    for (const entry of registry.timeline) {
      md += `#### Story ${entry.story_id}: ${entry.story_title}\n\n`;
      md += `- **Tables Created**: ${entry.tables_created.length > 0 ? entry.tables_created.join(', ') : 'None'}\n`;
      md += `- **Tables Modified**: ${entry.tables_modified.length > 0 ? entry.tables_modified.join(', ') : 'None'}\n`;
      md += `- **Fields Added**: ${entry.fields_added}\n`;
      md += `- **Indexes Added**: ${entry.indexes_added}\n`;
      md += `- **Migration File**: ${entry.migration_file || 'None'}\n`;
      if (entry.warning) {
        md += `- ${entry.warning}\n`;
      }
      md += '\n';
    }
  }

  return md;
}

function generateApiMarkdown(registry) {
  let md = '# API Cumulative Registry\n\n';
  md += '> Auto-generated by init-cumulative-registries.js\n';
  md += '> Updated by Dev Agent after each story completion\n\n';

  md += '## Registry Metadata\n\n';
  md += `**Last Updated**: ${registry.metadata.last_updated}\n`;
  md += `**Total Stories Tracked**: ${registry.metadata.total_stories}\n`;
  md += `**Total Endpoints**: ${registry.metadata.total_endpoints}\n`;
  md += `**Repository**: ${registry.metadata.repository_id}\n`;
  md += `**Mode**: ${registry.metadata.project_mode}\n\n`;

  md += '## API Endpoints Registry\n\n';

  const resources = Object.values(registry.resources);

  if (resources.length === 0) {
    md += '_No endpoints tracked yet._\n\n';
  } else {
    for (const resource of resources) {
      md += `## Resource: ${resource.name}\n\n`;
      md += `**Base Path**: \`${resource.base_path}\`\n\n`;

      for (const endpoint of resource.endpoints) {
        md += `### \`${endpoint.method} ${endpoint.path}\`\n\n`;
        md += `**Added in Story**: ${endpoint.story_id}\n`;
        md += `**Implementation File**: \`${endpoint.file_path}\`\n`;
        md += `**Status**: active\n`;
        if (endpoint.description) {
          md += `**Description**: ${endpoint.description}\n`;
        }
        md += '\n**Request**:\n';
        if (endpoint.request_params) {
          md += `- **Path Parameters**: ${endpoint.request_params}\n`;
        }
        if (endpoint.request_body) {
          md += `- **Request Body**: ${endpoint.request_body}\n`;
        }
        if (endpoint.request_schema) {
          md += `- **Schema**: \`${endpoint.request_schema}\`\n`;
        }
        if (endpoint.auth_required) {
          md += `- **Authentication**: ${endpoint.auth_type || 'Required'}\n`;
        }
        md += '\n**Response**:\n';
        md += `- **Success (${endpoint.success_status || 200})**: ${endpoint.success_response || 'Success'}\n`;
        if (endpoint.success_schema) {
          md += `- **Schema**: \`${endpoint.success_schema}\`\n`;
        }
        if (endpoint.notes) {
          md += `\n**Notes**: ${endpoint.notes}\n`;
        }
        md += '\n---\n\n';
      }
    }
  }

  md += '## Endpoints by Story\n\n';

  if (registry.timeline.length === 0) {
    md += '_No timeline entries yet._\n';
  } else {
    for (const entry of registry.timeline) {
      md += `### Story ${entry.story_id}: ${entry.story_title}\n\n`;
      if (entry.endpoints && entry.endpoints.length > 0) {
        md += '**Endpoints Added**:\n';
        for (const endpoint of entry.endpoints) {
          md += `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description || 'No description'}\n`;
        }
        md += '\n';
      } else {
        md += '**Endpoints Added**: None\n\n';
      }
      if (entry.schemas && entry.schemas.length > 0) {
        md += '**Schemas Created**:\n';
        for (const schema of entry.schemas) {
          md += `- \`${schema.name}\` (${schema.type}) - ${schema.file_path}\n`;
        }
        md += '\n';
      }
      if (entry.warning) {
        md += `${entry.warning}\n\n`;
      }
    }
  }

  return md;
}

function generateModelsMarkdown(registry) {
  let md = '# Models & Types Cumulative Registry\n\n';
  md += '> Auto-generated by init-cumulative-registries.js\n';
  md += '> Updated by Dev Agent after each story completion\n\n';

  md += '## Registry Metadata\n\n';
  md += `**Last Updated**: ${registry.metadata.last_updated}\n`;
  md += `**Total Stories Tracked**: ${registry.metadata.total_stories}\n`;
  md += `**Total Models**: ${registry.metadata.total_models}\n`;
  md += `**Repository**: ${registry.metadata.repository_id}\n`;
  md += `**Mode**: ${registry.metadata.project_mode}\n\n`;

  // TypeScript Interfaces
  md += '## TypeScript Interfaces\n\n';
  if (registry.interfaces.length === 0) {
    md += '_No interfaces tracked yet._\n\n';
  } else {
    for (const iface of registry.interfaces) {
      md += `### \`${iface.name}\`\n\n`;
      md += `**Added in Story**: ${iface.story_id}\n`;
      md += `**File**: \`${iface.file_path}\`\n`;
      md += `**Category**: ${iface.category || 'general'}\n`;
      if (iface.description) {
        md += `**Description**: ${iface.description}\n`;
      }
      md += '\n---\n\n';
    }
  }

  // Zod Schemas
  md += '## Zod Validation Schemas\n\n';
  if (registry.zod_schemas.length === 0) {
    md += '_No Zod schemas tracked yet._\n\n';
  } else {
    for (const schema of registry.zod_schemas) {
      md += `### \`${schema.name}\`\n\n`;
      md += `**Added in Story**: ${schema.story_id}\n`;
      md += `**File**: \`${schema.file_path}\`\n`;
      if (schema.inferred_type) {
        md += `**Inferred Type**: \`${schema.inferred_type}\`\n`;
      }
      if (schema.description) {
        md += `**Description**: ${schema.description}\n`;
      }
      md += '\n---\n\n';
    }
  }

  // Enums
  md += '## Enums & Constants\n\n';
  if (registry.enums.length === 0) {
    md += '_No enums tracked yet._\n\n';
  } else {
    for (const enumDef of registry.enums) {
      md += `### \`${enumDef.name}\`\n\n`;
      md += `**Added in Story**: ${enumDef.story_id}\n`;
      md += `**File**: \`${enumDef.file_path}\`\n`;
      if (enumDef.values) {
        md += `**Values**: ${enumDef.values.join(', ')}\n`;
      }
      if (enumDef.description) {
        md += `**Description**: ${enumDef.description}\n`;
      }
      md += '\n---\n\n';
    }
  }

  // Timeline
  md += '## Models by Story\n\n';
  if (registry.timeline.length === 0) {
    md += '_No timeline entries yet._\n';
  } else {
    for (const entry of registry.timeline) {
      md += `### Story ${entry.story_id}: ${entry.story_title}\n\n`;
      md += '**Created**:\n';
      if (entry.interfaces && entry.interfaces.length > 0) {
        md += `- **Interfaces**: ${entry.interfaces.join(', ')}\n`;
      }
      if (entry.zod_schemas && entry.zod_schemas.length > 0) {
        md += `- **Zod Schemas**: ${entry.zod_schemas.join(', ')}\n`;
      }
      if (entry.enums && entry.enums.length > 0) {
        md += `- **Enums**: ${entry.enums.join(', ')}\n`;
      }
      if (entry.classes && entry.classes.length > 0) {
        md += `- **Classes**: ${entry.classes.join(', ')}\n`;
      }
      if (entry.dtos && entry.dtos.length > 0) {
        md += `- **DTOs**: ${entry.dtos.join(', ')}\n`;
      }
      if (entry.warning) {
        md += `\n${entry.warning}\n`;
      }
      md += '\n';
    }
  }

  return md;
}

// Write registry files
async function writeRegistries(markdownFiles) {
  if (options.dryRun) {
    console.log('📄 DRY RUN - Preview of registry files:\n');
    console.log('database-registry.md:', markdownFiles.database.substring(0, 500) + '...');
    console.log('\napi-registry.md:', markdownFiles.api.substring(0, 500) + '...');
    console.log('\nmodels-registry.md:', markdownFiles.models.substring(0, 500) + '...');
    return;
  }

  // Ensure dev doc directory exists
  await fs.ensureDir(devDocLocation);

  // Write files
  await fs.writeFile(registryFiles.database, markdownFiles.database, 'utf8');
  console.log(`✅ Written: ${registryFiles.database}`);

  await fs.writeFile(registryFiles.api, markdownFiles.api, 'utf8');
  console.log(`✅ Written: ${registryFiles.api}`);

  await fs.writeFile(registryFiles.models, markdownFiles.models, 'utf8');
  console.log(`✅ Written: ${registryFiles.models}`);

  console.log('\n🎉 Cumulative registries initialized successfully!\n');
}

// Main execution
async function main() {
  try {
    // Check if story directory exists
    if (!fs.existsSync(storyDir)) {
      console.error(`❌ Story directory not found: ${storyDir}`);
      console.error('   Use --story-dir=<path> to specify a custom directory');
      process.exit(1);
    }

    // Scan stories
    const storyFiles = await scanStories();

    if (storyFiles.length === 0) {
      console.log('⚠️  No story files found. Nothing to do.');
      process.exit(0);
    }

    // Parse stories
    console.log('📖 Parsing story files...\n');
    const stories = storyFiles.map(parseStory).filter(Boolean);

    if (stories.length === 0) {
      console.log('⚠️  No completed stories found (status = Done). Nothing to do.');
      process.exit(0);
    }

    // Build registries
    const registries = buildRegistries(stories);

    // Generate markdown
    console.log('📝 Generating markdown files...\n');
    const markdownFiles = generateMarkdown(registries);

    // Write registries
    await writeRegistries(markdownFiles);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
main();
