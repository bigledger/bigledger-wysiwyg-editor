# Publishing Guide for BigLedger WYSIWYG Editor

This guide explains how to publish the `bigldeger-wysiwyg-editor` library to the NPM registry.

## Prerequisites

1. **NPM Account**: You need an NPM account with publish permissions
2. **Authentication**: You must be logged in to NPM
3. **Repository Access**: You need write access to this repository

## Quick Start

### 1. Login to NPM

```bash
npm login
```

Enter your NPM credentials when prompted.

### 2. Verify Authentication

```bash
npm whoami
```

This should display your NPM username.

### 3. Test Publishing (Recommended)

Before actually publishing, run a dry run to see what would be published:

```bash
# Using the automated script (recommended)
npm run publish:script:dry-run

# Or manually
npm run publish:npm:dry-run
```

### 4. Publish to NPM

```bash
# Using the automated script with version bump
npm run publish:script -- --version=patch

# Or manually
npm run publish:npm
```

## Publishing Methods

### Method 1: Automated Script (Recommended)

The automated script handles the entire publishing process:

```bash
# Dry run (test without publishing)
npm run publish:script:dry-run

# Publish with patch version bump
npm run publish:script -- --version=patch

# Publish with minor version bump
npm run publish:script -- --version=minor

# Publish with major version bump
npm run publish:script -- --version=major

# Publish without version bump
npm run publish:script
```

#### Script Options

- `--dry-run`: Test the process without actually publishing
- `--version=TYPE`: Update version before publishing (patch/minor/major)
- `--skip-tests`: Skip running tests (not recommended)
- `--skip-build`: Skip building the library (not recommended)

### Method 2: Manual Steps

If you prefer to run each step manually:

```bash
# 1. Run tests
npm run test:lib:ci

# 2. Update version (optional)
npm run version:patch  # or version:minor, version:major

# 3. Build library
npm run build:lib

# 4. Publish
npm run publish:npm
```

### Method 3: Complete Release Process

For a full release with tests:

```bash
npm run release:lib
```

This runs: tests → build → publish

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/) guidelines:

- **Patch** (1.0.1): Bug fixes, no breaking changes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

### Update Version

```bash
# Patch version (1.0.0 → 1.0.1)
npm run version:patch

# Minor version (1.0.0 → 1.1.0)
npm run version:minor

# Major version (1.0.0 → 2.0.0)
npm run version:major
```

## Pre-Publishing Checklist

Before publishing, ensure:

- [ ] All tests pass: `npm run test:lib:ci`
- [ ] Library builds successfully: `npm run build:lib`
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version number is appropriate
- [ ] No sensitive information in the package
- [ ] Dry run completed successfully

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```bash
# Error: You must be logged in to publish packages
npm login
npm whoami  # Verify login
```

#### 2. Package Name Conflicts

```bash
# Error: Package name already exists
# Check if name is available
npm view bigldeger-wysiwyg-editor

# If taken, consider scoped packages
# Update package.json name to: "@your-org/bigldeger-wysiwyg-editor"
```

#### 3. Permission Denied

```bash
# Error: You do not have permission to publish
# Ensure you have publish rights or use scoped packages
npm publish --access public
```

#### 4. Version Conflicts

```bash
# Error: Version already exists
# Check published versions
npm view bigldeger-wysiwyg-editor versions --json

# Update version
npm run version:patch
```

#### 5. Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build:lib
```

### Getting Help

If you encounter issues:

1. Check the [NPM documentation](https://docs.npmjs.com/)
2. Review the error messages carefully
3. Ensure all prerequisites are met
4. Try the dry run first to identify issues

## Post-Publishing

After successful publishing:

1. **Verify Publication**: Check [npmjs.com](https://www.npmjs.com/package/bigldeger-wysiwyg-editor)
2. **Test Installation**: Try installing in a test project
3. **Update Documentation**: Ensure README and docs reflect the new version
4. **Create Release**: Consider creating a GitHub release
5. **Announce**: Share the update with your team/community

## Package Information

- **Package Name**: `bigldeger-wysiwyg-editor`
- **Registry**: [npmjs.com](https://www.npmjs.com/)
- **Repository**: [GitHub](https://github.com/bigledger/bigldeger-wysiwyg-editor)

## Security Considerations

- Never publish with `--force` unless absolutely necessary
- Review the package contents before publishing
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date
- Use `.npmignore` to exclude unnecessary files

## Automation

For CI/CD pipelines, you can automate publishing:

```yaml
# Example GitHub Actions workflow
- name: Publish to NPM
  run: |
    npm ci
    npm run test:lib:ci
    npm run build:lib
    cd dist/bigldeger-wysiwyg-editor
    npm publish --access public
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Remember to set up NPM_TOKEN in your repository secrets.