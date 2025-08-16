#!/usr/bin/env node

/**
 * Orchestrix CLI - Direct execution wrapper for npx
 * This file ensures proper execution when run via npx from GitHub
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if we're running in an npx temporary directory
const isNpxExecution = __dirname.includes('_npx') || __dirname.includes('.npm');

// If running via npx, we need to handle things differently
if (isNpxExecution) {
  // The actual orchestrix.js is in installer/bin/ (relative to tools directory)
  const orchestrixScriptPath = path.join(__dirname, 'installer', 'bin', 'orchestrix.js');
  
  // Verify the file exists
  if (!fs.existsSync(orchestrixScriptPath)) {
    console.error('Error: Could not find orchestrix.js at', orchestrixScriptPath);
    console.error('Current directory:', __dirname);
    process.exit(1);
  }
  
  // Execute with user's current working directory preserved
  try {
    execSync(`node "${orchestrixScriptPath}" ${process.argv.slice(2).join(' ')}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    // execSync will throw if the command exits with non-zero
    // But the stdio is inherited, so the error is already displayed
    process.exit(error.status || 1);
  }
} else {
  // Local execution - just require the installer directly
  require('./installer/bin/orchestrix.js');
}