const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

/**
 * YAML Compiler for Orchestrix Agent Configurations
 * 
 * Compiles source YAML files (.src.yaml) with $include directives
 * into complete YAML files ready for deployment.
 */
class YamlCompiler {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.includeStack = []; // Track include chain to detect circular references
  }

  /**
   * Compile a single agent YAML file
   * @param {string} sourceFile - Path to source .src.yaml file
   * @param {string} outputFile - Path to output .yaml file
   * @returns {Promise<boolean>} - Success status
   */
  async compileAgent(sourceFile, outputFile) {
    try {
      this.log(`Compiling: ${path.basename(sourceFile)}`);
      
      // Read source file
      const sourceContent = await fs.readFile(sourceFile, 'utf8');
      const sourceData = yaml.load(sourceContent);
      
      // Check if file has $include directives
      if (!sourceData.$include) {
        this.log(`  No includes found, copying as-is`);
        await fs.copy(sourceFile, outputFile);
        return true;
      }
      
      // Reset include stack for this compilation
      this.includeStack = [sourceFile];
      
      // Resolve all includes
      const baseDir = path.dirname(sourceFile);
      const compiledData = await this.resolveIncludes(sourceData, baseDir);
      
      // Remove $include directive from final output
      delete compiledData.$include;
      
      // Write compiled YAML (no header comments to save tokens for LLM)
      const compiledYaml = yaml.dump(compiledData, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      await fs.ensureDir(path.dirname(outputFile));
      await fs.writeFile(outputFile, compiledYaml, 'utf8');
      
      this.log(`  ✓ Compiled to: ${path.basename(outputFile)}`);
      return true;
      
    } catch (error) {
      console.error(`Failed to compile ${sourceFile}:`, error.message);
      throw error;
    }
  }

  /**
   * Compile all agent YAML files in a directory
   * @param {string} sourceDir - Source directory containing .src.yaml files
   * @param {string} outputDir - Output directory for compiled .yaml files
   * @returns {Promise<number>} - Number of files compiled
   */
  async compileAllAgents(sourceDir, outputDir) {
    try {
      this.log(`\nCompiling agents from: ${sourceDir}`);
      this.log(`Output directory: ${outputDir}`);
      
      // Find all .src.yaml files
      const files = await fs.readdir(sourceDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      
      if (srcFiles.length === 0) {
        this.log('No .src.yaml files found');
        return 0;
      }
      
      this.log(`Found ${srcFiles.length} source files\n`);
      
      // Compile each file
      let compiled = 0;
      for (const srcFile of srcFiles) {
        const sourcePath = path.join(sourceDir, srcFile);
        const outputName = srcFile.replace('.src.yaml', '.yaml');
        const outputPath = path.join(outputDir, outputName);
        
        try {
          await this.compileAgent(sourcePath, outputPath);
          compiled++;
        } catch (error) {
          console.error(`Failed to compile ${srcFile}:`, error.message);
          // Continue with other files
        }
      }
      
      this.log(`\n✓ Compiled ${compiled}/${srcFiles.length} files`);
      return compiled;
      
    } catch (error) {
      console.error('Failed to compile agents:', error.message);
      throw error;
    }
  }

  /**
   * Resolve $include directives recursively
   * @param {Object} data - YAML data object
   * @param {string} baseDir - Base directory for resolving relative paths
   * @returns {Promise<Object>} - Merged YAML data
   */
  async resolveIncludes(data, baseDir) {
    if (!data.$include) {
      return data;
    }
    
    const includes = Array.isArray(data.$include) ? data.$include : [data.$include];
    let result = { ...data };
    
    // Process each include
    for (const includePath of includes) {
      const fullPath = path.resolve(baseDir, includePath);
      
      // Check for circular references
      if (this.includeStack.includes(fullPath)) {
        throw new Error(`Circular include detected: ${this.includeStack.join(' -> ')} -> ${fullPath}`);
      }
      
      this.includeStack.push(fullPath);
      
      try {
        // Read included file
        const includeContent = await fs.readFile(fullPath, 'utf8');
        const includeData = yaml.load(includeContent);
        
        // Recursively resolve includes in the included file
        const resolvedInclude = await this.resolveIncludes(includeData, path.dirname(fullPath));
        
        // Merge included data
        result = this.mergeYamlContent(result, resolvedInclude);
        
        this.log(`  ✓ Included: ${path.relative(baseDir, fullPath)}`);
        
      } catch (error) {
        throw new Error(`Failed to include ${includePath}: ${error.message}`);
      } finally {
        this.includeStack.pop();
      }
    }
    
    return result;
  }

  /**
   * Merge YAML content with smart merging strategy
   * @param {Object} base - Base YAML object
   * @param {Object} included - Included YAML object
   * @returns {Object} - Merged YAML object
   */
  mergeYamlContent(base, included) {
    const result = { ...base };
    
    for (const [key, value] of Object.entries(included)) {
      // Skip $include directive
      if (key === '$include') {
        continue;
      }
      
      if (key in result) {
        // Key exists in base - merge intelligently
        if (Array.isArray(result[key]) && Array.isArray(value)) {
          // Merge arrays - included items come first (lower priority)
          result[key] = [...value, ...result[key]];
        } else if (typeof result[key] === 'object' && typeof value === 'object' && !Array.isArray(result[key])) {
          // Merge objects recursively
          result[key] = this.mergeYamlContent(value, result[key]);
        }
        // For primitive values, base takes precedence (don't overwrite)
      } else {
        // Key doesn't exist in base - add it
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Generate header comment for compiled file
   * @param {string} sourceFile - Source file path
   * @param {Array|string} includes - Include directives
   * @returns {string} - Header comment
   */
  generateHeader(sourceFile, includes) {
    const includeList = Array.isArray(includes) ? includes : [includes];
    const timestamp = new Date().toISOString();
    
    let header = '# ============================================================================\n';
    header += `# Auto-generated from: ${path.basename(sourceFile)}\n`;
    header += `# Generated at: ${timestamp}\n`;
    header += '# DO NOT EDIT THIS FILE DIRECTLY - Edit the .src.yaml file instead\n';
    header += '# ============================================================================\n';
    header += '#\n';
    header += '# This file was compiled from the following sources:\n';
    header += `#   - ${path.basename(sourceFile)}\n`;
    
    for (const include of includeList) {
      header += `#   - ${include}\n`;
    }
    
    header += '#\n';
    header += '# To modify this configuration:\n';
    header += `#   1. Edit ${path.basename(sourceFile)}\n`;
    header += '#   2. Run: npm run compile-agents (or the installer will do this automatically)\n';
    header += '#   3. Reinstall or update your IDE configuration if needed\n';
    header += '# ============================================================================\n\n';
    
    return header;
  }

  /**
   * Check if compilation is needed (source newer than output)
   * @param {string} sourceFile - Source file path
   * @param {string} outputFile - Output file path
   * @returns {Promise<boolean>} - True if compilation needed
   */
  async needsCompilation(sourceFile, outputFile) {
    try {
      const [sourceStat, outputStat] = await Promise.all([
        fs.stat(sourceFile),
        fs.stat(outputFile).catch(() => null)
      ]);
      
      if (!outputStat) {
        return true; // Output doesn't exist
      }
      
      return sourceStat.mtime > outputStat.mtime; // Source is newer
      
    } catch (error) {
      return true; // On error, assume compilation needed
    }
  }

  /**
   * Compile only files that have changed
   * @param {string} sourceDir - Source directory
   * @param {string} outputDir - Output directory
   * @returns {Promise<number>} - Number of files compiled
   */
  async compileChanged(sourceDir, outputDir) {
    try {
      const files = await fs.readdir(sourceDir);
      const srcFiles = files.filter(f => f.endsWith('.src.yaml'));
      
      let compiled = 0;
      for (const srcFile of srcFiles) {
        const sourcePath = path.join(sourceDir, srcFile);
        const outputName = srcFile.replace('.src.yaml', '.yaml');
        const outputPath = path.join(outputDir, outputName);
        
        if (await this.needsCompilation(sourcePath, outputPath)) {
          await this.compileAgent(sourcePath, outputPath);
          compiled++;
        } else {
          this.log(`Skipping ${srcFile} (up to date)`);
        }
      }
      
      return compiled;
      
    } catch (error) {
      console.error('Failed to compile changed files:', error.message);
      throw error;
    }
  }

  /**
   * Log message if verbose mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }
}

module.exports = YamlCompiler;
