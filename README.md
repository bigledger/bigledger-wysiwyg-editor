# BigLedger WYSIWYG Editor

A comprehensive rich text WYSIWYG editor component for Angular applications. This library provides a feature-rich text editor with customizable toolbar, formatting options, image support, and seamless Angular forms integration.

## 🚀 Features

- 📝 **Rich Text Editing**: Bold, italic, underline, font size, colors, and text alignment
- 📋 **List Support**: Bulleted and numbered lists with indentation
- 🔗 **Link Management**: Insert, edit, and remove hyperlinks with validation
- 🖼️ **Image Support**: Upload images or insert via URL with resizing capabilities
- ⌨️ **Keyboard Shortcuts**: Standard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+Z, etc.)
- 🔄 **Undo/Redo**: Full command history with undo and redo functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Customizable Toolbar**: Configure which tools are available
- 🔒 **Content Security**: Built-in HTML sanitization to prevent XSS attacks
- ♿ **Accessibility**: Full keyboard navigation and screen reader support
- 📋 **Forms Integration**: Works with Angular reactive forms and template-driven forms
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 🚀 **Lightweight**: Optimized bundle size with tree-shaking support

## 📦 Installation

```bash
npm install bigldeger-wysiwyg-editor
```

## 🔧 Quick Start

### 1. Import the Module

For Angular applications using modules:

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

For standalone components:

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

### 2. Basic Usage

```html
<wysiwyg-editor 
  [(ngModel)]="content"
  placeholder="Start typing..."
  [height]="'300px'">
</wysiwyg-editor>
```

## 📖 Documentation

- 📖 [Complete API Documentation](projects/bigldeger-wysiwyg-editor/API.md)
- 📋 [Usage Examples](projects/bigldeger-wysiwyg-editor/EXAMPLES.md)
- 🔄 [Migration Guide from Froala](projects/bigldeger-wysiwyg-editor/MIGRATION.md)
- ⚡ [Performance Guide](projects/bigldeger-wysiwyg-editor/PERFORMANCE.md)

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Angular CLI 15+

### Setup

```bash
# Clone the repository
git clone https://github.com/bigledger/bigldeger-wysiwyg-editor.git
cd bigldeger-wysiwyg-editor

# Install dependencies
npm install
```

### Development Server

```bash
# Start the demo application
npm start
```

Navigate to `http://localhost:4200/` to see the demo application with examples.

### Building the Library

```bash
# Build the library for production
npm run build:lib

# Build and watch for changes during development
npm run build:lib:watch
```

### Testing

```bash
# Run unit tests
npm run test:lib

# Run tests with coverage
npm run test:lib:coverage

# Run tests in CI mode (single run)
npm run test:lib:ci

# Run end-to-end tests
npm run e2e
```

### Code Quality

```bash
# Run linting
npm run lint

# Check bundle size
npm run size:check

# Analyze bundle
npm run analyze:bundle:open
```

## 📦 Publishing to NPM

### Prerequisites for Publishing

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **Login to NPM**: Run `npm login` and enter your credentials
3. **Verify Access**: Ensure you have publish rights to the package name

### Publishing Steps

#### 1. Prepare for Publishing

```bash
# Ensure all tests pass
npm run test:lib:ci

# Build the library
npm run build:lib

# Verify the build output
ls dist/bigldeger-wysiwyg-editor/
```

#### 2. Version Management

Update the version before publishing:

```bash
# For patch releases (bug fixes)
npm run version:patch

# For minor releases (new features)
npm run version:minor

# For major releases (breaking changes)
npm run version:major
```

#### 3. Dry Run (Recommended)

Test the publishing process without actually publishing:

```bash
npm run publish:npm:dry-run
```

This will show you exactly what would be published without actually doing it.

#### 4. Publish to NPM

```bash
# Publish to NPM registry
npm run publish:npm
```

Or use the complete release process (test + build + publish):

```bash
npm run release:lib
```

### Publishing Scripts Available

- `npm run publish:npm:dry-run` - Test publish without actually publishing
- `npm run publish:npm` - Build and publish to NPM
- `npm run release:lib` - Complete release process (test + build + publish)
- `npm run pack:lib` - Create a local package for testing

### Troubleshooting Publishing

#### Common Issues

1. **Package name already exists**: 
   - Check if the name is available: `npm view bigldeger-wysiwyg-editor`
   - If taken, consider scoped packages: `@your-org/bigldeger-wysiwyg-editor`

2. **Authentication errors**:
   ```bash
   npm login
   npm whoami  # Verify you're logged in
   ```

3. **Permission denied**:
   - Ensure you have publish rights to the package
   - For scoped packages, use: `npm publish --access public`

4. **Version conflicts**:
   ```bash
   # Check current version
   npm view bigldeger-wysiwyg-editor version
   
   # Update your version
   npm run version:patch
   ```

#### Pre-publish Checklist

- [ ] All tests pass (`npm run test:lib:ci`)
- [ ] Library builds successfully (`npm run build:lib`)
- [ ] Version number updated appropriately
- [ ] CHANGELOG.md updated with changes
- [ ] README.md is up to date
- [ ] No sensitive information in package
- [ ] Dry run completed successfully

## 🌟 Demo Application

The repository includes a comprehensive demo application showcasing all features:

```bash
npm start
```

The demo includes:
- Basic usage examples
- Forms integration (reactive and template-driven)
- Custom toolbar configurations
- Event handling demonstrations
- Styling and theming examples
- Performance optimization techniques

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test:lib:ci`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](projects/bigldeger-wysiwyg-editor/LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/bigledger/bigldeger-wysiwyg-editor#readme)
- 🐛 [Issue Tracker](https://github.com/bigledger/bigldeger-wysiwyg-editor/issues)
- 💬 [Discussions](https://github.com/bigledger/bigldeger-wysiwyg-editor/discussions)

## 🔄 Migration from Other Editors

This library is designed to be a drop-in replacement for other WYSIWYG editors like Froala. See our [Migration Guide](projects/bigldeger-wysiwyg-editor/MIGRATION.md) for detailed instructions.

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🏗️ Built With

- [Angular](https://angular.io/) - The web framework used
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [RxJS](https://rxjs.dev/) - Reactive programming library

---

Made with ❤️ by [BigLedger](https://github.com/bigledger)
