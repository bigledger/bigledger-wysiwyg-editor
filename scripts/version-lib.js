#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootPackagePath = path.join(__dirname, '..', 'package.json');
const libraryPackagePath = path.join(__dirname, '..', 'projects', 'bigldeger-wysiwyg-editor', 'package.json');
const releaseType = process.argv[2];
const supportedReleaseTypes = new Set(['patch', 'minor', 'major']);

if (!supportedReleaseTypes.has(releaseType)) {
  console.error('Usage: node scripts/version-lib.js <patch|minor|major>');
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function bumpVersion(version, type) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }

  const next = match.slice(1).map(Number);

  if (type === 'patch') {
    next[2] += 1;
  } else if (type === 'minor') {
    next[1] += 1;
    next[2] = 0;
  } else {
    next[0] += 1;
    next[1] = 0;
    next[2] = 0;
  }

  return next.join('.');
}

const rootPackage = readJson(rootPackagePath);
const libraryPackage = readJson(libraryPackagePath);
const nextVersion = bumpVersion(libraryPackage.version, releaseType);

rootPackage.version = nextVersion;
libraryPackage.version = nextVersion;

writeJson(rootPackagePath, rootPackage);
writeJson(libraryPackagePath, libraryPackage);

console.log(`Updated workspace and library versions to ${nextVersion}`);
