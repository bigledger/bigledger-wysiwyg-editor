#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building BigLedger WYSIWYG Editor Library...\n');

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  execSync('npm run clean', { stdio: 'inherit' });

  // Build the library
  console.log('🔨 Building library...');
  execSync('npm run build:lib', { stdio: 'inherit' });

  // Copy additional files to dist
  console.log('📋 Copying additional files...');
  const distPath = path.join(__dirname, '../dist/bigldeger-wysiwyg-editor');
  const projectPath = path.join(__dirname, '../projects/bigldeger-wysiwyg-editor');

  // Copy README if it exists
  const readmePath = path.join(projectPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, path.join(distPath, 'README.md'));
    console.log('✓ Copied README.md');
  } else {
    console.log('⚠️  README.md not found, skipping...');
  }

  // Copy LICENSE if it exists
  const licensePath = path.join(projectPath, 'LICENSE');
  if (fs.existsSync(licensePath)) {
    fs.copyFileSync(licensePath, path.join(distPath, 'LICENSE'));
    console.log('✓ Copied LICENSE');
  } else {
    console.log('⚠️  LICENSE not found, skipping...');
  }

  // Copy CHANGELOG if it exists
  const changelogPath = path.join(projectPath, 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    fs.copyFileSync(changelogPath, path.join(distPath, 'CHANGELOG.md'));
    console.log('✓ Copied CHANGELOG.md');
  } else {
    console.log('⚠️  CHANGELOG.md not found, skipping...');
  }

  console.log('✅ Library build completed successfully!');
  console.log(`📦 Package ready at: ${distPath}`);
  console.log('\nNext steps:');
  console.log('  1. cd dist/bigldeger-wysiwyg-editor');
  console.log('  2. npm pack (to create .tgz file)');
  console.log('  3. npm publish --access public (to publish to npm)');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}