'use strict';

const fs = require('fs');
const path = require('path');

// yuri.md is loaded from sibling file at runtime
function getYuriCommand() {
  const filePath = path.join(__dirname, 'yuri.md');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  throw new Error('Embedded yuri.md not found');
}

module.exports = { getYuriCommand };
