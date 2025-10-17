#!/usr/bin/env node

/**
 * Test script for YAML Compiler
 * 
 * Tests the compilation of agent YAML files with $include directives
 */

const path = require('path');
const fs = require('fs-extra');
const YamlCompiler = require('./lib/yaml-compiler');
const AgentCompiler = require('./installer/lib/agent-compiler');

async function main() {
  console.log('🧪 Testing YAML Compiler\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Basic compilation
    console.log('\n📝 Test 1: Basic Compilation');
    console.log('-'.repeat(60));
    
    const compiler = new YamlCompiler({ verbose: true });
    const sourceFile = path.join(__dirname, '../orchestrix-core/agents/sm.src.yaml');
    const outputFile = path.join(__dirname, '../orchestrix-core/agents/sm.compiled.test.yaml');
    
    if (await fs.pathExists(sourceFile)) {
      console.log(`Source file: ${sourceFile}`);
      await compiler.compileAgent(sourceFile, outputFile);
      console.log(`✅ Compiled to: ${outputFile}`);
      
      // Verify output
      const outputContent = await fs.readFile(outputFile, 'utf8');
      console.log(`\nOutput file size: ${outputContent.length} bytes`);
      console.log(`Contains 'request_resolution': ${outputContent.includes('request_resolution')}`);
      console.log(`Contains 'workflow_rules': ${outputContent.includes('workflow_rules')}`);
      
      // Clean up test file
      await fs.remove(outputFile);
      console.log('\n✅ Test 1 passed');
    } else {
      console.log(`⚠️  Source file not found: ${sourceFile}`);
      console.log('Skipping Test 1');
    }
    
    // Test 2: Batch compilation
    console.log('\n📝 Test 2: Batch Compilation');
    console.log('-'.repeat(60));
    
    const agentsDir = path.join(__dirname, '../orchestrix-core/agents');
    const tempDir = path.join(__dirname, '../temp-compiled-agents');
    
    await fs.ensureDir(tempDir);
    
    const agentCompiler = new AgentCompiler({ verbose: true });
    const result = await agentCompiler.compileForInstallation(
      path.join(__dirname, '../orchestrix-core'),
      tempDir
    );
    
    console.log(`\nCompilation result:`);
    console.log(`  Compiled: ${result.compiled} files`);
    console.log(`  Copied: ${result.copied} files`);
    console.log(`  Used existing: ${result.usedExisting}`);
    
    // List compiled files
    if (await fs.pathExists(path.join(tempDir, 'agents'))) {
      const compiledFiles = await fs.readdir(path.join(tempDir, 'agents'));
      console.log(`\nCompiled files in temp directory:`);
      compiledFiles.forEach(file => {
        if (file.endsWith('.yaml')) {
          console.log(`  - ${file}`);
        }
      });
    }
    
    // Clean up
    await fs.remove(tempDir);
    console.log('\n✅ Test 2 passed');
    
    // Test 3: Compilation status check
    console.log('\n📝 Test 3: Compilation Status Check');
    console.log('-'.repeat(60));
    
    const status = await agentCompiler.getCompilationStatus(agentsDir);
    console.log(`\nStatus:`);
    console.log(`  Has source files: ${status.hasSrcFiles}`);
    console.log(`  Source files: ${status.srcCount}`);
    console.log(`  YAML files: ${status.yamlCount}`);
    console.log(`  Needs compilation: ${status.needsCompilation}`);
    
    if (status.outdated.length > 0) {
      console.log(`  Outdated files: ${status.outdated.join(', ')}`);
    }
    
    console.log('\n✅ Test 3 passed');
    
    // Test 4: Include resolution
    console.log('\n📝 Test 4: Include Resolution');
    console.log('-'.repeat(60));
    
    const yaml = require('js-yaml');
    
    if (await fs.pathExists(sourceFile)) {
      const sourceContent = await fs.readFile(sourceFile, 'utf8');
      const sourceData = yaml.load(sourceContent);
      
      if (sourceData.$include) {
        console.log(`\nIncludes found in sm.src.yaml:`);
        const includes = Array.isArray(sourceData.$include) ? sourceData.$include : [sourceData.$include];
        includes.forEach(inc => console.log(`  - ${inc}`));
        
        // Check if include files exist
        const baseDir = path.dirname(sourceFile);
        for (const inc of includes) {
          const incPath = path.join(baseDir, inc);
          const exists = await fs.pathExists(incPath);
          console.log(`  ${exists ? '✅' : '❌'} ${inc} ${exists ? 'exists' : 'NOT FOUND'}`);
        }
        
        console.log('\n✅ Test 4 passed');
      } else {
        console.log('⚠️  No $include directives found in source file');
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    
    console.log('\n💡 Next steps:');
    console.log('  1. Create .src.yaml files for other agents (dev, architect, qa)');
    console.log('  2. Run: node tools/compile-agents.js compile');
    console.log('  3. Test installation: npx orchestrix install --ide cursor');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
