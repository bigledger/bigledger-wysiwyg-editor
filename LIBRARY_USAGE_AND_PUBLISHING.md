# BigLedger WYSIWYG Editor - Complete Usage and Publishing Guide

## 📋 Table of Contents

1. [Library Overview](#library-overview)
2. [Installation and Usage](#installation-and-usage)
3. [Publishing to NPM](#publishing-to-npm)
4. [Development Workflow](#development-workflow)
5. [Project Structure](#project-structure)

## 🚀 Library Overview

**Package Name**: `bigldeger-wysiwyg-editor`

BigLedger WYSIWYG Editor is a comprehensive rich text editor component for Angular applications featuring:

- Rich text editing with formatting tools
- Image and link support
- Customizable toolbar
- Angular forms integration
- TypeScript support
- Accessibility features
- Mobile responsive design

## 📦 Installation and Usage

### For Library Users

#### 1. Install the Package

```bash
npm install bigldeger-wysiwyg-editor
```

#### 2. Import in Your Angular Application

**For Module-based Applications:**

```typescript
import { NgModule } from '@angular/core';
import { WysiwygEditorModule } from 'bigldeger-wysiwyg-editor';

@NgModule({
  imports: [
    WysiwygEditorModule
  ],
  // ...
})
export class AppModule { }
```

**For Standalone Components:**

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor [(ngModel)]="content"></wysiwyg-editor>
  `
})
export class ExampleComponent {
  content = '<p>Hello World!</p>';
}
```

#### 3. Basic Usage Examples

**Simple Editor:**
```html
<wysiwyg-editor 
  [(ngModel)]="content"
  placeholder="Start typing..."
  [height]="'300px'">
</wysiwyg-editor>
```

**With Custom Toolbar:**
```typescript
import { ToolbarConfig } from 'bigldeger-wysiwyg-editor';

export class MyComponent {
  content = '';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' }
    ]
  };
}
```

```html
<wysiwyg-editor 
  [(ngModel)]="content"
  [toolbarConfig]="toolbarConfig">
</wysiwyg-editor>
```

**Reactive Forms Integration:**
```typescript
import { FormControl, FormGroup } from '@angular/forms';

export class MyComponent {
  form = new FormGroup({
    content: new FormControl('<p>Initial content</p>')
  });
}
```

```html
<form [formGroup]="form">
  <wysiwyg-editor formControlName="content"></wysiwyg-editor>
</form>
```

#### 4. Available Features

- **Formatting**: Bold, italic, underline, font size, colors
- **Lists**: Bulleted and numbered lists with indentation
- **Links**: Insert, edit, and remove hyperlinks
- **Images**: Upload or insert via URL
- **Alignment**: Left, center, right, justify
- **Undo/Redo**: Full command history
- **Keyboard Shortcuts**: Standard shortcuts (Ctrl+B, Ctrl+I, etc.)

## 🚀 Publishing to NPM

### Prerequisites

1. **NPM Account**: Create account at [npmjs.com](https://www.npmjs.com/)
2. **Authentication**: Login to NPM CLI
3. **Repository Access**: Write access to the repository

### Quick Publishing Steps

#### 1. Login to NPM

```bash
npm login
```

#### 2. Verify Authentication

```bash
npm whoami
```

#### 3. Test Publishing (Dry Run)

```bash
# Using automated script (recommended)
npm run publish:script:dry-run

# Or manually
npm run publish:npm:dry-run
```

#### 4. Publish to NPM

```bash
# Automated publishing with version bump
npm run publish:script -- --version=patch

# Or manual publishing
npm run publish:npm
```

### Publishing Methods

#### Method 1: Automated Script (Recommended)

```bash
# Test without publishing
npm run publish:script:dry-run

# Publish with patch version (1.0.0 → 1.0.1)
npm run publish:script -- --version=patch

# Publish with minor version (1.0.0 → 1.1.0)
npm run publish:script -- --version=minor

# Publish with major version (1.0.0 → 2.0.0)
npm run publish:script -- --version=major
```

#### Method 2: Manual Steps

```bash
# 1. Run tests
npm run test:lib:ci

# 2. Update version
npm run version:patch

# 3. Build library
npm run build:lib

# 4. Publish
npm run publish:npm
```

#### Method 3: Complete Release

```bash
npm run release:lib
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run publish:script` | Automated publishing script |
| `npm run publish:script:dry-run` | Test publishing without actually publishing |
| `npm run publish:npm` | Build and publish to NPM |
| `npm run publish:npm:dry-run` | Test build and publish |
| `npm run release:lib` | Complete release process (test + build + publish) |
| `npm run version:patch` | Bump patch version |
| `npm run version:minor` | Bump minor version |
| `npm run version:major` | Bump major version |

## 🛠️ Development Workflow

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/bigledger/bigldeger-wysiwyg-editor.git
cd bigldeger-wysiwyg-editor

# Install dependencies
npm install
```

### Development Commands

```bash
# Start demo application
npm start

# Build library for production
npm run build:lib

# Build and watch for changes
npm run build:lib:watch

# Run tests
npm run test:lib

# Run tests with coverage
npm run test:lib:coverage

# Run tests in CI mode
npm run test:lib:ci

# Run linting
npm run lint

# Run end-to-end tests
npm run e2e
```

### Testing the Library

```bash
# Unit tests
npm run test:lib

# Coverage report
npm run test:lib:coverage

# Performance tests
npm run perf:test

# Bundle size check
npm run size:check

# Bundle analysis
npm run analyze:bundle:open
```

## 📁 Project Structure

```
bigldeger-wysiwyg-editor/
├── projects/
│   └── bigldeger-wysiwyg-editor/          # Library source code
│       ├── src/                           # Library implementation
│       ├── package.json                   # Library package configuration
│       ├── README.md                      # Library documentation
│       ├── API.md                         # API documentation
│       ├── EXAMPLES.md                    # Usage examples
│       ├── MIGRATION.md                   # Migration guide
│       └── PERFORMANCE.md                 # Performance guide
├── src/                                   # Demo application
├── scripts/
│   └── publish.js                         # Automated publishing script
├── package.json                           # Root package configuration
├── angular.json                           # Angular workspace configuration
├── README.md                              # Main project README
├── PUBLISHING.md                          # Publishing guide
└── LIBRARY_USAGE_AND_PUBLISHING.md       # This file
```

### Key Files

- **`projects/bigldeger-wysiwyg-editor/package.json`**: Library package configuration
- **`projects/bigldeger-wysiwyg-editor/src/`**: Library source code
- **`scripts/publish.js`**: Automated publishing script
- **`angular.json`**: Angular CLI configuration
- **`package.json`**: Root project configuration with build scripts

## 🔧 Configuration Files

### Library Package Configuration

The library's `package.json` includes:

```json
{
  "name": "bigldeger-wysiwyg-editor",
  "version": "1.0.0",
  "description": "A rich text WYSIWYG editor component for Angular applications",
  "main": "bundles/bigldeger-wysiwyg-editor.umd.js",
  "module": "fesm2022/bigldeger-wysiwyg-editor.mjs",
  "typings": "index.d.ts",
  "peerDependencies": {
    "@angular/common": ">=15.0.0",
    "@angular/core": ">=15.0.0",
    "@angular/forms": ">=15.0.0",
    "rxjs": ">=7.0.0"
  }
}
```

### Build Configuration

The library is built using Angular's `ng-packagr` which creates:

- **UMD bundles**: For legacy module systems
- **ESM bundles**: For modern module systems
- **TypeScript definitions**: For type safety
- **Metadata**: For Angular AOT compilation

## 📚 Documentation

### Available Documentation

1. **[README.md](projects/bigldeger-wysiwyg-editor/README.md)**: Main library documentation
2. **[API.md](projects/bigldeger-wysiwyg-editor/API.md)**: Complete API reference
3. **[EXAMPLES.md](projects/bigldeger-wysiwyg-editor/EXAMPLES.md)**: Usage examples
4. **[MIGRATION.md](projects/bigldeger-wysiwyg-editor/MIGRATION.md)**: Migration guide from other editors
5. **[PERFORMANCE.md](projects/bigldeger-wysiwyg-editor/PERFORMANCE.md)**: Performance optimization guide
6. **[PUBLISHING.md](PUBLISHING.md)**: Detailed publishing guide

### Demo Application

The repository includes a comprehensive demo application showcasing:

- Basic usage examples
- Forms integration
- Custom toolbar configurations
- Event handling
- Styling and theming
- Performance optimization

Access the demo at `http://localhost:4200` after running `npm start`.

## 🚨 Troubleshooting

### Common Publishing Issues

1. **Authentication Error**: Run `npm login` and verify with `npm whoami`
2. **Package Name Conflict**: Check availability with `npm view bigldeger-wysiwyg-editor`
3. **Version Conflict**: Update version with `npm run version:patch`
4. **Build Failure**: Clean and rebuild with `npm run clean && npm run build:lib`

### Common Usage Issues

1. **Module Import Error**: Ensure correct import path `bigldeger-wysiwyg-editor`
2. **Styling Issues**: Import component styles or use CSS variables
3. **Form Integration**: Use `[(ngModel)]` or `formControlName`
4. **Browser Compatibility**: Check supported browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## 🎯 Next Steps

1. **For Library Users**: Install the package and follow the usage examples
2. **For Contributors**: Set up the development environment and review the contribution guidelines
3. **For Publishers**: Follow the publishing guide to release new versions

## 📞 Support

- **Documentation**: [GitHub Repository](https://github.com/bigledger/bigldeger-wysiwyg-editor)
- **Issues**: [Issue Tracker](https://github.com/bigledger/bigldeger-wysiwyg-editor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bigledger/bigldeger-wysiwyg-editor/discussions)

---

**Made with ❤️ by BigLedger**