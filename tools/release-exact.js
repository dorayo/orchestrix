#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const targetVersion = process.argv[2];
if (!targetVersion) {
  console.error('Usage: node release-exact.js <version>');
  console.error('Example: node release-exact.js 4.1.1');
  process.exit(1);
}

// 验证版本格式
if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
  console.error('❌ Invalid version format. Use semantic versioning (e.g., 4.1.1)');
  process.exit(1);
}

// 更新所有版本文件
const files = [
  'package.json',
  'orchestrix-core/core-config.yaml', 
  'tools/installer/package.json'
];

console.log(`🚀 Preparing release ${targetVersion}...`);
console.log('');

let updated = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (fs.existsSync(filePath)) {
    try {
      let oldVersion;
      
      if (file.endsWith('.json')) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        oldVersion = content.version;
        content.version = targetVersion;
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
        oldVersion = content.version || 'unknown';
        content.version = targetVersion;
        fs.writeFileSync(filePath, yaml.dump(content, { indent: 2 }));
      }
      
      console.log(`✅ ${file}: ${oldVersion} → ${targetVersion}`);
      updated++;
      
    } catch (error) {
      console.error(`❌ Failed to update ${file}: ${error.message}`);
    }
  } else {
    console.error(`⚠️  ${file} not found`);
  }
});

console.log('');
if (updated === files.length) {
  console.log(`🎉 All versions updated to ${targetVersion}`);
  console.log('');
  console.log('✅ Ready for release!');
  console.log('');
  console.log('Next steps:');
  console.log('  git add .');
  console.log(`  git commit -m "chore: release v${targetVersion}"`);
  console.log(`  git tag -a v${targetVersion} -m "Release v${targetVersion}"`);
  console.log('  npm publish');
} else {
  console.log(`⚠️  Some files were not updated (${updated}/${files.length})`);
  process.exit(1);
}