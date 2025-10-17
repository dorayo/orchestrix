#!/usr/bin/env node

/**
 * Orchestrix Agent YAML Compiler CLI
 * 
 * Compiles agent .src.yaml files with $include directives
 * into complete .yaml files ready for deployment.
 */

const path = require('path');
const { program } = require('commander');
const YamlCompiler = require('./lib/yaml-compiler');

program
  .name('compile-agents')
  .description('Compile Orchestrix agent YAML configurations')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile agent YAML files')
  .option('-s, --source <dir>', 'Source directory containing .src.yaml files', 'orchestrix-core/agents')
  .option('-o, --output <dir>', 'Output directory for compiled .yaml files', 'orchestrix-core/agents')
  .option('-v, --verbose', 'Verbose output', false)
  .option('-w, --watch', 'Watch for changes and recompile', false)
  .option('--changed-only', 'Only compile files that have changed', false)
  .action(async (options) => {
    try {
      const compiler = new YamlCompiler({ verbose: options.verbose });
      
      const sourceDir = path.resolve(process.cwd(), options.source);
      const outputDir = path.resolve(process.cwd(), options.output);
      
      console.log('🔨 Orchestrix Agent YAML Compiler\n');
      console.log(`Source: ${sourceDir}`);
      console.log(`Output: ${outputDir}\n`);
      
      if (options.changedOnly) {
        const compiled = await compiler.compileChanged(sourceDir, outputDir);
        console.log(`\n✅ Compiled ${compiled} changed file(s)`);
      } else {
        const compiled = await compiler.compileAllAgents(sourceDir, outputDir);
        console.log(`\n✅ Compilation complete! (${compiled} files)`);
      }
      
      if (options.watch) {
        console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)');
        const chokidar = require('chokidar');
        
        const watcher = chokidar.watch(path.join(sourceDir, '*.src.yaml'), {
          persistent: true,
          ignoreInitial: true
        });
        
        watcher.on('change', async (filePath) => {
          console.log(`\n📝 File changed: ${path.basename(filePath)}`);
          const outputName = path.basename(filePath).replace('.src.yaml', '.yaml');
          const outputPath = path.join(outputDir, outputName);
          
          try {
            await compiler.compileAgent(filePath, outputPath);
            console.log('✅ Recompiled successfully');
          } catch (error) {
            console.error('❌ Compilation failed:', error.message);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Compilation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('single <file>')
  .description('Compile a single agent YAML file')
  .option('-o, --output <file>', 'Output file path')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (file, options) => {
    try {
      const compiler = new YamlCompiler({ verbose: options.verbose });
      
      const sourceFile = path.resolve(process.cwd(), file);
      const outputFile = options.output 
        ? path.resolve(process.cwd(), options.output)
        : sourceFile.replace('.src.yaml', '.yaml');
      
      console.log('🔨 Compiling single file\n');
      console.log(`Source: ${sourceFile}`);
      console.log(`Output: ${outputFile}\n`);
      
      await compiler.compileAgent(sourceFile, outputFile);
      
      console.log('\n✅ Compilation complete!');
      
    } catch (error) {
      console.error('❌ Compilation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test compilation without writing files')
  .option('-s, --source <dir>', 'Source directory', 'orchestrix-core/agents')
  .option('-v, --verbose', 'Verbose output', true)
  .action(async (options) => {
    try {
      const compiler = new YamlCompiler({ verbose: options.verbose });
      const fs = require('fs-extra');
      const yaml = require('js-yaml');
      
      const sourceDir = path.resolve(process.cwd(), options.source);
      console.log('🧪 Testing compilation (dry run)\n');
      console.log(`Source: ${sourceDir}\n`);
      
      const files = await fs.readdir(sourceDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      
      console.log(`Found ${srcFiles.length} source files:\n`);
      
      for (const srcFile of srcFiles) {
        const sourcePath = path.join(sourceDir, srcFile);
        console.log(`Testing: ${srcFile}`);
        
        try {
          const sourceContent = await fs.readFile(sourcePath, 'utf8');
          const sourceData = yaml.load(sourceContent);
          
          if (sourceData.$include) {
            const includes = Array.isArray(sourceData.$include) ? sourceData.$include : [sourceData.$include];
            console.log(`  Includes: ${includes.join(', ')}`);
            
            // Test resolution
            const baseDir = path.dirname(sourcePath);
            await compiler.resolveIncludes(sourceData, baseDir);
            console.log(`  ✅ Valid`);
          } else {
            console.log(`  ℹ️  No includes`);
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
        }
        
        console.log();
      }
      
      console.log('✅ Test complete!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
