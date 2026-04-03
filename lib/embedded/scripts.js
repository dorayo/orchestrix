'use strict';

const fs = require('fs');
const path = require('path');

// Shell scripts are loaded from sibling .sh files at runtime
// This avoids embedding 400+ line scripts as JS strings

function loadScript(name) {
  const scriptPath = path.join(__dirname, name);
  if (fs.existsSync(scriptPath)) {
    return fs.readFileSync(scriptPath, 'utf-8');
  }
  throw new Error(`Embedded script not found: ${name}`);
}

module.exports = {
  getStartScript() {
    return loadScript('start-orchestrix.sh');
  },
  getHandoffScript() {
    return loadScript('handoff-detector.sh');
  },
};
