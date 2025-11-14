#!/usr/bin/env node

/**
 * API Contract Locking System
 *
 * Prevents breaking changes to API contracts during active development.
 * Ensures all dependent stories reference stable API definitions.
 *
 * Stage: Stage 3 (Advanced Features)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');

/**
 * Lock an API contract
 *
 * @param {Object} params - Input parameters
 * @param {string} params.contract_file_path - Path to API contract file
 * @param {string} params.version - Contract version (semver)
 * @param {string} params.product_repo_path - Path to product repository
 * @param {string} params.locked_by - Who is locking (architect_manual, sm_auto_lock, etc.)
 * @param {Array} params.referencing_stories - Stories that reference this contract
 * @returns {Promise<Object>} Lock result
 */
async function lockContract(params) {
  const {
    contract_file_path,
    version,
    product_repo_path,
    locked_by,
    referencing_stories = []
  } = params;

  // Validate inputs
  if (!contract_file_path || !version || !product_repo_path || !locked_by) {
    return {
      success: false,
      error: 'Missing required parameters',
      locked: false
    };
  }

  // Validate semver format
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return {
      success: false,
      error: `Invalid version format: ${version}. Expected semver (e.g., 1.0.0)`,
      locked: false
    };
  }

  try {
    // Load locking configuration
    const lockConfigPath = path.join(__dirname, '..', 'data', 'api-contract-locking.yaml');
    const lockConfig = yaml.load(fs.readFileSync(lockConfigPath, 'utf8'));

    if (!lockConfig.locking.enabled) {
      return {
        success: true,
        message: 'Contract locking is disabled in configuration',
        locked: false
      };
    }

    // Check if contract file exists
    if (!fs.existsSync(contract_file_path)) {
      return {
        success: false,
        error: `Contract file not found: ${contract_file_path}`,
        locked: false
      };
    }

    // Calculate contract hash
    const contractContent = fs.readFileSync(contract_file_path, 'utf8');
    const contractHash = crypto.createHash('sha256').update(contractContent).digest('hex');

    // Check if already locked
    const lockDir = path.join(product_repo_path, lockConfig.locking.lock_location);
    if (!fs.existsSync(lockDir)) {
      fs.mkdirSync(lockDir, { recursive: true });
    }

    const lockFileName = lockConfig.locking.lock_file_pattern.replace('{version}', version);
    const lockFilePath = path.join(lockDir, lockFileName);

    if (fs.existsSync(lockFilePath)) {
      const existingLock = yaml.load(fs.readFileSync(lockFilePath, 'utf8'));

      if (existingLock.contract_hash === contractHash) {
        return {
          success: true,
          message: `Contract already locked with same content (version ${version})`,
          locked: true,
          lock_file: lockFilePath,
          lock_data: existingLock
        };
      } else {
        return {
          success: false,
          error: `Contract version ${version} already locked with different content. Use a different version.`,
          locked: false,
          existing_hash: existingLock.contract_hash,
          new_hash: contractHash
        };
      }
    }

    // Create lock data
    const lockData = {
      version,
      locked_at: new Date().toISOString(),
      locked_by,
      contract_file: path.relative(product_repo_path, contract_file_path),
      contract_hash: contractHash,
      referencing_stories: referencing_stories.map(story => ({
        story_id: story.story_id,
        repository: story.repository,
        api_endpoints: story.api_endpoints || []
      })),
      breaking_changes_detected: false,
      change_history: []
    };

    // Write lock file
    fs.writeFileSync(lockFilePath, yaml.dump(lockData, { lineWidth: -1 }), 'utf8');

    // Log lock operation
    if (lockConfig.monitoring.log_lock_operations) {
      const logDir = path.join(product_repo_path, '.ai');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, 'contract-lock-log.md');
      const logEntry = `
## Contract Lock - ${new Date().toISOString()}

- **Version**: ${version}
- **Locked By**: ${locked_by}
- **Contract File**: ${lockData.contract_file}
- **Contract Hash**: ${contractHash.substring(0, 16)}...
- **Referencing Stories**: ${referencing_stories.length}
- **Lock File**: ${lockFilePath}
- **Result**: ✅ Success

`;
      fs.appendFileSync(logFile, logEntry, 'utf8');
    }

    return {
      success: true,
      message: `Contract locked successfully (version ${version})`,
      locked: true,
      lock_file: lockFilePath,
      lock_data: lockData
    };

  } catch (error) {
    return {
      success: false,
      error: `Lock failed: ${error.message}`,
      locked: false
    };
  }
}

/**
 * Detect breaking changes in API contract
 *
 * @param {string} originalContent - Original contract content
 * @param {string} newContent - New contract content
 * @returns {Object} Breaking changes detection result
 */
function detectBreakingChanges(originalContent, newContent) {
  const changes = {
    breaking: [],
    non_breaking: [],
    has_breaking_changes: false
  };

  // Simple text-based change detection
  // In production, this should use proper API spec parsing (OpenAPI, etc.)

  // Extract API endpoints from both versions
  const originalEndpoints = extractEndpoints(originalContent);
  const newEndpoints = extractEndpoints(newContent);

  // Check for removed endpoints
  for (const endpoint of originalEndpoints) {
    if (!newEndpoints.includes(endpoint)) {
      changes.breaking.push({
        type: 'endpoint_removed',
        severity: 'critical',
        endpoint,
        description: `API endpoint removed: ${endpoint}`
      });
    }
  }

  // Check for added endpoints (non-breaking)
  for (const endpoint of newEndpoints) {
    if (!originalEndpoints.includes(endpoint)) {
      changes.non_breaking.push({
        type: 'endpoint_added',
        endpoint,
        description: `New API endpoint added: ${endpoint}`
      });
    }
  }

  // Extract request/response schemas (simplified)
  const originalSchemas = extractSchemas(originalContent);
  const newSchemas = extractSchemas(newContent);

  // Check for removed required fields
  for (const [endpoint, schema] of Object.entries(originalSchemas)) {
    if (newSchemas[endpoint]) {
      const removedFields = schema.required_fields.filter(
        field => !newSchemas[endpoint].required_fields.includes(field)
      );

      for (const field of removedFields) {
        changes.breaking.push({
          type: 'request_field_removed',
          severity: 'critical',
          endpoint,
          field,
          description: `Required field removed: ${field} from ${endpoint}`
        });
      }
    }
  }

  changes.has_breaking_changes = changes.breaking.length > 0;

  return changes;
}

/**
 * Extract API endpoints from contract content
 *
 * @param {string} content - Contract content
 * @returns {Array<string>} List of endpoints
 */
function extractEndpoints(content) {
  const endpoints = [];
  const endpointRegex = /###\s+(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s]+)/g;
  let match;

  while ((match = endpointRegex.exec(content)) !== null) {
    endpoints.push(`${match[1]} ${match[2]}`);
  }

  return endpoints;
}

/**
 * Extract schemas from contract content (simplified)
 *
 * @param {string} content - Contract content
 * @returns {Object} Schemas by endpoint
 */
function extractSchemas(content) {
  const schemas = {};

  // Simple extraction: look for "required" mentions in JSON blocks
  // In production, use proper JSON schema parser

  const endpointSections = content.split(/###\s+/);

  for (const section of endpointSections) {
    const endpointMatch = section.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/[^\s]+)/);
    if (!endpointMatch) continue;

    const endpoint = `${endpointMatch[1]} ${endpointMatch[2]}`;

    // Extract required fields (simplified)
    const requiredFields = [];
    const fieldMatches = section.matchAll(/"(\w+)":\s*"[^"]*"/g);

    for (const fieldMatch of fieldMatches) {
      requiredFields.push(fieldMatch[1]);
    }

    schemas[endpoint] = {
      required_fields: requiredFields
    };
  }

  return schemas;
}

/**
 * Check if contract is locked
 *
 * @param {Object} params - Input parameters
 * @param {string} params.version - Contract version
 * @param {string} params.product_repo_path - Path to product repository
 * @returns {Object} Lock status
 */
function isContractLocked(params) {
  const { version, product_repo_path } = params;

  try {
    const lockConfigPath = path.join(__dirname, '..', 'data', 'api-contract-locking.yaml');
    const lockConfig = yaml.load(fs.readFileSync(lockConfigPath, 'utf8'));

    const lockDir = path.join(product_repo_path, lockConfig.locking.lock_location);
    const lockFileName = lockConfig.locking.lock_file_pattern.replace('{version}', version);
    const lockFilePath = path.join(lockDir, lockFileName);

    if (!fs.existsSync(lockFilePath)) {
      return {
        locked: false,
        message: `Contract version ${version} is not locked`
      };
    }

    const lockData = yaml.load(fs.readFileSync(lockFilePath, 'utf8'));

    return {
      locked: true,
      message: `Contract version ${version} is locked`,
      lock_data: lockData,
      lock_file: lockFilePath
    };

  } catch (error) {
    return {
      locked: false,
      error: error.message
    };
  }
}

/**
 * Unlock an API contract
 *
 * @param {Object} params - Input parameters
 * @param {string} params.version - Contract version
 * @param {string} params.product_repo_path - Path to product repository
 * @param {string} params.unlocked_by - Who is unlocking
 * @param {string} params.reason - Reason for unlocking
 * @returns {Object} Unlock result
 */
function unlockContract(params) {
  const { version, product_repo_path, unlocked_by, reason } = params;

  if (!version || !product_repo_path || !unlocked_by) {
    return {
      success: false,
      error: 'Missing required parameters',
      unlocked: false
    };
  }

  try {
    const lockConfigPath = path.join(__dirname, '..', 'data', 'api-contract-locking.yaml');
    const lockConfig = yaml.load(fs.readFileSync(lockConfigPath, 'utf8'));

    const lockDir = path.join(product_repo_path, lockConfig.locking.lock_location);
    const lockFileName = lockConfig.locking.lock_file_pattern.replace('{version}', version);
    const lockFilePath = path.join(lockDir, lockFileName);

    if (!fs.existsSync(lockFilePath)) {
      return {
        success: false,
        error: `Contract version ${version} is not locked`,
        unlocked: false
      };
    }

    // Backup lock file before deleting
    const backupPath = lockFilePath.replace('.lock', '.unlocked.backup');
    fs.copyFileSync(lockFilePath, backupPath);

    // Remove lock file
    fs.unlinkSync(lockFilePath);

    // Log unlock operation
    if (lockConfig.monitoring.log_unlock_operations) {
      const logFile = path.join(product_repo_path, '.ai', 'contract-lock-log.md');
      const logEntry = `
## Contract Unlock - ${new Date().toISOString()}

- **Version**: ${version}
- **Unlocked By**: ${unlocked_by}
- **Reason**: ${reason || 'Not specified'}
- **Backup**: ${backupPath}
- **Result**: ✅ Success

`;
      fs.appendFileSync(logFile, logEntry, 'utf8');
    }

    return {
      success: true,
      message: `Contract version ${version} unlocked successfully`,
      unlocked: true,
      backup_file: backupPath
    };

  } catch (error) {
    return {
      success: false,
      error: `Unlock failed: ${error.message}`,
      unlocked: false
    };
  }
}

/**
 * CLI Entry Point
 */
async function main() {
  if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'lock') {
      if (args.length < 5) {
        console.error('Usage: api-contract-locker.js lock <contract_file> <version> <product_repo_path> <locked_by> [story_ids...]');
        process.exit(1);
      }

      const [_, contract_file_path, version, product_repo_path, locked_by, ...story_ids] = args;

      // Parse story IDs (format: "1.1:repo1,1.2:repo2")
      const referencing_stories = story_ids.map(s => {
        const [story_id, repository] = s.split(':');
        return { story_id, repository, api_endpoints: [] };
      });

      const result = await lockContract({
        contract_file_path,
        version,
        product_repo_path,
        locked_by,
        referencing_stories
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);

    } else if (command === 'check') {
      if (args.length < 3) {
        console.error('Usage: api-contract-locker.js check <version> <product_repo_path>');
        process.exit(1);
      }

      const [_, version, product_repo_path] = args;

      const result = isContractLocked({ version, product_repo_path });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.locked ? 0 : 1);

    } else if (command === 'unlock') {
      if (args.length < 4) {
        console.error('Usage: api-contract-locker.js unlock <version> <product_repo_path> <unlocked_by> <reason>');
        process.exit(1);
      }

      const [_, version, product_repo_path, unlocked_by, reason] = args;

      const result = unlockContract({
        version,
        product_repo_path,
        unlocked_by,
        reason
      });

      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);

    } else if (command === 'detect-changes') {
      if (args.length < 3) {
        console.error('Usage: api-contract-locker.js detect-changes <original_file> <new_file>');
        process.exit(1);
      }

      const [_, original_file, new_file] = args;

      const originalContent = fs.readFileSync(original_file, 'utf8');
      const newContent = fs.readFileSync(new_file, 'utf8');

      const changes = detectBreakingChanges(originalContent, newContent);

      console.log(JSON.stringify(changes, null, 2));
      process.exit(changes.has_breaking_changes ? 1 : 0);

    } else {
      console.error('Unknown command. Use: lock, check, unlock, or detect-changes');
      process.exit(1);
    }
  }
}

// Export for use as module
module.exports = {
  lockContract,
  unlockContract,
  isContractLocked,
  detectBreakingChanges,
  extractEndpoints,
  extractSchemas
};

// Run CLI if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
