#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function main() {
  let chalk;
  try {
    chalk = (await import('chalk')).default;
  } catch (error) {
    console.error('Failed to import chalk:', error);
    // Create a dummy chalk object if import fails
    chalk = {
      green: (text) => text,
      red: (text) => text,
      yellow: (text) => text,
      blue: (text) => text,
      bold: (text) => text,
    };
  }

  const newVersion = process.argv[2];

  if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error(chalk.red('Usage: node tools/set-version.js <new-version>'));
    console.error(chalk.red('Please provide a valid version in the format x.x.x'));
    process.exit(1);
  }

  console.log(chalk.blue(`Setting all package versions to ${chalk.bold(newVersion)}...`));

  const filesToUpdate = [
    {
      path: path.join(__dirname, '..', 'package.json'),
      type: 'json',
      name: 'Root package.json',
    },
    {
      path: path.join(__dirname, 'installer', 'package.json'),
      type: 'json',
      name: 'Installer package.json',
    },
    {
      path: path.join(__dirname, '..', 'orchestrix-core', 'core-config.yaml'),
      type: 'yaml',
      name: 'Core Config',
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToUpdate) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      let data;
      let oldVersion;

      if (file.type === 'json') {
        data = JSON.parse(content);
        oldVersion = data.version;
        data.version = newVersion;
        fs.writeFileSync(file.path, JSON.stringify(data, null, 2) + '\n');
      } else if (file.type === 'yaml') {
        data = yaml.load(content);
        oldVersion = data.version;
        data.version = newVersion;
        fs.writeFileSync(file.path, yaml.dump(data, { indent: 2 }));
      }

      console.log(chalk.green(`✓ ${file.name}: ${oldVersion} → ${newVersion}`));
      successCount++;
    } catch (error) {
      console.error(chalk.red(`✗ Failed to update ${file.name}: ${error.message}`));
      errorCount++;
    }
  }

  if (errorCount > 0) {
    console.log(chalk.yellow(`\nCompleted with ${errorCount} error(s).`));
  } else {
    console.log(chalk.green('\n🎉 All versions updated successfully!'));
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.blue('1. Commit the changes: git add . && git commit -m "chore: set version to ' + newVersion + '"'));
    console.log(chalk.blue('2. Push the changes and publish if needed.'));
  }
}

if (require.main === module) {
  main();
}
