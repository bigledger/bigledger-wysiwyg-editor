#!/usr/bin/env node

/**
 * Publishing script for bigldeger-wysiwyg-editor
 * 
 * This script handles the complete publishing process:
 * 1. Runs tests
 * 2. Builds the library
 * 3. Updates version
 * 4. Publishes to NPM
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  log(`\n${colors.cyan}Executing: ${command}${colors.reset}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    log(`${colors.red}Error executing command: ${command}${colors.reset}`);
    log(`${colors.red}${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log(`${colors.bright}Checking prerequisites...${colors.reset}`);
  
  // Check if user is logged in to npm
  try {
    execCommand('npm whoami', { stdio: 'pipe' });
    log(`${colors.green}✓ NPM authentication verified${colors.reset}`);
  } catch (error) {
    log(`${colors.red}✗ Not logged in to NPM. Please run 'npm login' first.${colors.reset}`);
    process.exit(1);
  }

  // Check if package.json exists (will be created after build)
  log(`${colors.blue}Note: Library package.json will be checked after build${colors.reset}`);

  log(`${colors.green}✓ All prerequisites met${colors.reset}`);
}

function getCurrentVersion() {
  const packageJsonPath = path.join(__dirname, '../dist/angular-wysiwyg-editor/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function updateVersion(versionType) {
  log(`${colors.bright}Updating version (${versionType})...${colors.reset}`);
  
  const versionScript = `version:${versionType}`;
  execCommand(`npm run ${versionScript}`);
  
  const newVersion = getCurrentVersion();
  log(`${colors.green}✓ Version updated to ${newVersion}${colors.reset}`);
  return newVersion;
}

function runTests() {
  log(`${colors.bright}Running tests...${colors.reset}`);
  execCommand('npm run test:lib:ci');
  log(`${colors.green}✓ All tests passed${colors.reset}`);
}

function buildLibrary() {
  log(`${colors.bright}Building library...${colors.reset}`);
  execCommand('npm run build:lib');
  log(`${colors.green}✓ Library built successfully${colors.reset}`);
}

function publishToNpm(dryRun = false) {
  const action = dryRun ? 'dry-run' : 'publish';
  log(`${colors.bright}${dryRun ? 'Testing' : 'Publishing'} to NPM...${colors.reset}`);
  
  const distPath = path.join(__dirname, '../dist/angular-wysiwyg-editor');
  const publishCommand = dryRun ? 'npm publish --dry-run' : 'npm publish --access public';
  
  execCommand(publishCommand, { cwd: distPath });
  
  if (dryRun) {
    log(`${colors.green}✓ Dry run completed successfully${colors.reset}`);
  } else {
    log(`${colors.green}✓ Package published successfully to NPM${colors.reset}`);
  }
}

function showUsage() {
  log(`${colors.bright}Usage:${colors.reset}`);
  log(`  node scripts/publish.js [options]`);
  log(`\n${colors.bright}Options:${colors.reset}`);
  log(`  --dry-run          Test the publishing process without actually publishing`);
  log(`  --version=TYPE     Update version before publishing (patch|minor|major)`);
  log(`  --skip-tests       Skip running tests (not recommended)`);
  log(`  --skip-build       Skip building the library (not recommended)`);
  log(`  --help             Show this help message`);
  log(`\n${colors.bright}Examples:${colors.reset}`);
  log(`  node scripts/publish.js --dry-run`);
  log(`  node scripts/publish.js --version=patch`);
  log(`  node scripts/publish.js --version=minor --dry-run`);
}

function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    dryRun: args.includes('--dry-run'),
    skipTests: args.includes('--skip-tests'),
    skipBuild: args.includes('--skip-build'),
    help: args.includes('--help'),
    version: null
  };

  // Extract version type
  const versionArg = args.find(arg => arg.startsWith('--version='));
  if (versionArg) {
    options.version = versionArg.split('=')[1];
    if (!['patch', 'minor', 'major'].includes(options.version)) {
      log(`${colors.red}Invalid version type: ${options.version}. Must be patch, minor, or major.${colors.reset}`);
      process.exit(1);
    }
  }

  if (options.help) {
    showUsage();
    return;
  }

  log(`${colors.bright}${colors.magenta}🚀 BigLedger WYSIWYG Editor Publishing Script${colors.reset}`);
  log(`${colors.bright}=============================================${colors.reset}`);

  const currentVersion = getCurrentVersion();
  log(`${colors.blue}Current version: ${currentVersion}${colors.reset}`);

  if (options.dryRun) {
    log(`${colors.yellow}⚠️  Running in DRY RUN mode - no actual publishing will occur${colors.reset}`);
  }

  try {
    // Step 1: Check prerequisites
    checkPrerequisites();

    // Step 2: Update version if requested
    let newVersion = currentVersion;
    if (options.version) {
      newVersion = updateVersion(options.version);
    }

    // Step 3: Run tests
    if (!options.skipTests) {
      runTests();
    } else {
      log(`${colors.yellow}⚠️  Skipping tests${colors.reset}`);
    }

    // Step 4: Build library
    if (!options.skipBuild) {
      buildLibrary();
    } else {
      log(`${colors.yellow}⚠️  Skipping build${colors.reset}`);
    }

    // Step 5: Publish
    publishToNpm(options.dryRun);

    // Success message
    log(`\n${colors.bright}${colors.green}🎉 Publishing process completed successfully!${colors.reset}`);
    
    if (!options.dryRun) {
      log(`${colors.green}Package bigldeger-wysiwyg-editor@${newVersion} is now available on NPM${colors.reset}`);
      log(`${colors.blue}Install with: npm install bigldeger-wysiwyg-editor@${newVersion}${colors.reset}`);
    }

  } catch (error) {
    log(`${colors.red}❌ Publishing failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  runTests,
  buildLibrary,
  publishToNpm,
  updateVersion
};