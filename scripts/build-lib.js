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
  const distPath = path.join(__dirname, '../dist/angular-wysiwyg-editor');
  const projectPath = path.join(__dirname, '../projects/angular-wysiwyg-editor');

  // Copy README
  fs.copyFileSync(
    path.join(projectPath, 'README.md'),
    path.join(distPath, 'README.md')
  );

  // Copy LICENSE
  fs.copyFileSync(
    path.join(projectPath, 'LICENSE'),
    path.join(distPath, 'LICENSE')
  );

  // Copy CHANGELOG
  fs.copyFileSync(
    path.join(projectPath, 'CHANGELOG.md'),
    path.join(distPath, 'CHANGELOG.md')
  );

  console.log('✅ Library build completed successfully!');
  console.log(`📦 Package ready at: ${distPath}`);
  console.log('\nNext steps:');
  console.log('  1. cd dist/angular-wysiwyg-editor');
  console.log('  2. npm pack (to create .tgz file)');
  console.log('  3. npm publish (to publish to npm)');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}