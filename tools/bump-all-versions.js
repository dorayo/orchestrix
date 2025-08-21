#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const args = process.argv.slice(2);
const bumpType = args[0] || 'minor'; // default to minor

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.log('Usage: node bump-all-versions.js [major|minor|patch]');
  console.log('Default: minor');
  process.exit(1);
}

function bumpVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

async function bumpAllExpansionVersions() {
  const updatedItems = [];
  
  console.log(`🚀 Bumping all expansion pack versions with ${bumpType} version bump`);
  console.log(`📝 Note: Core version is now managed by semantic-release\n`);
  
  // Bump all expansion packs
  const expansionPacksDir = path.join(__dirname, '..', 'expansion-packs');
  
  try {
    const entries = fs.readdirSync(expansionPacksDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'README.md') {
        const packId = entry.name;
        const configPath = path.join(expansionPacksDir, packId, 'config.yaml');
        
        if (fs.existsSync(configPath)) {
          try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(configContent);
            const oldVersion = config.version || '1.0.0';
            const newVersion = bumpVersion(oldVersion, bumpType);
            
            config.version = newVersion;
            
            const updatedYaml = yaml.dump(config, { indent: 2 });
            fs.writeFileSync(configPath, updatedYaml);
            
            updatedItems.push({ type: 'expansion', name: packId, oldVersion, newVersion });
            console.log(`✓ ${packId}: ${oldVersion} → ${newVersion}`);
            
          } catch (error) {
            console.error(`✗ Failed to update ${packId}: ${error.message}`);
          }
        }
      }
    }
    
    if (updatedItems.length > 0) {
      const expansionCount = updatedItems.filter(i => i.type === 'expansion').length;
      
      console.log(`\n✓ Successfully bumped ${expansionCount} expansion pack(s) with ${bumpType} version bump`);
      
      console.log('\nNext steps:');
      console.log('1. Test the changes');
      console.log('2. Commit: git add -A && git commit -m "chore: bump expansion pack versions (' + bumpType + ')"');
      console.log('3. For core version, use: npm run release (semantic-release)');
    } else {
      console.log('No expansion packs found to update');
    }
    
  } catch (error) {
    console.error('Error reading expansion packs directory:', error.message);
    process.exit(1);
  }
}

bumpAllExpansionVersions();