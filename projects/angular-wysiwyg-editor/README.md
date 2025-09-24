# Angular WYSIWYG Editor

A comprehensive rich text WYSIWYG editor component for Angular applications. This library provides a feature-rich text editor with customizable toolbar, formatting options, image support, and seamless Angular forms integration.

## Features

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

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation

```bash
npm install angular-wysiwyg-editor
```

## Quick Start

### 1. Import the Module

For Angular applications using modules:

```typescript
import { NgModule } from '@angular/core';
import { WysiwygEditorModule } from 'angular-wysiwyg-editor';

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
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

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

## Advanced Usage

### Custom Toolbar Configuration

```typescript
import { ToolbarConfig } from 'angular-wysiwyg-editor';

export class MyComponent {
  content = '';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { 
        type: 'dropdown', 
        command: 'fontSize', 
        label: 'Font Size',
        options: [
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' },
          { value: '18px', label: '18px' }
        ]
      },
      { type: 'button', command: 'insertLink', icon: 'link', label: 'Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Image' }
    ],
    theme: 'light'
  };
}
```

```html
<wysiwyg-editor 
  [(ngModel)]="content"
  [toolbarConfig]="toolbarConfig">
</wysiwyg-editor>
```

### Reactive Forms Integration

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

### Event Handling

```typescript
export class MyComponent {
  content = '';

  onContentChange(newContent: string) {
    console.log('Content changed:', newContent);
  }

  onSelectionChange(selection: SelectionState) {
    console.log('Selection changed:', selection);
  }
}
```

```html
<wysiwyg-editor 
  [(ngModel)]="content"
  (contentChange)="onContentChange($event)"
  (selectionChange)="onSelectionChange($event)">
</wysiwyg-editor>
```

### Read-Only Mode

```html
<wysiwyg-editor 
  [(ngModel)]="content"
  [readonly]="true">
</wysiwyg-editor>
```

## API Reference

### WysiwygEditorComponent

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `toolbarConfig` | `ToolbarConfig` | Default config | Configuration for toolbar tools and appearance |
| `placeholder` | `string` | `''` | Placeholder text when editor is empty |
| `readonly` | `boolean` | `false` | Whether the editor is read-only |
| `height` | `string` | `'200px'` | Height of the editor content area |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `contentChange` | `string` | Emitted when editor content changes |
| `selectionChange` | `SelectionState` | Emitted when text selection changes |

#### Methods

| Method | Description |
|--------|-------------|
| `focus()` | Focus the editor |
| `blur()` | Remove focus from the editor |
| `getContent()` | Get current HTML content |
| `setContent(html: string)` | Set editor content |

### Interfaces

#### ToolbarConfig

```typescript
interface ToolbarConfig {
  tools: ToolbarTool[];
  sticky?: boolean;
  theme?: 'light' | 'dark';
}
```

#### ToolbarTool

```typescript
interface ToolbarTool {
  type: 'button' | 'dropdown' | 'dialog';
  command: string;
  icon?: string;
  label?: string;
  options?: ToolOption[];
}
```

#### SelectionState

```typescript
interface SelectionState {
  range: Range | null;
  collapsed: boolean;
  formats: ActiveFormats;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle bold |
| `Ctrl+I` | Toggle italic |
| `Ctrl+U` | Toggle underline |
| `Ctrl+K` | Insert/edit link |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Tab` | Indent list item |
| `Shift+Tab` | Outdent list item |

## Styling and Theming

The editor comes with default styles that can be customized. You can override CSS variables or provide your own styles:

```css
wysiwyg-editor {
  --editor-border-color: #ddd;
  --editor-background: #fff;
  --toolbar-background: #f5f5f5;
  --button-hover-background: #e0e0e0;
}
```

## Migration from Froala Editor

This library is designed to be a drop-in replacement for Froala Editor. For a comprehensive migration guide, see [MIGRATION.md](MIGRATION.md).

### Quick Migration Steps

1. **Uninstall Froala**: `npm uninstall angular-froala-wysiwyg froala-editor`
2. **Install Angular WYSIWYG Editor**: `npm install angular-wysiwyg-editor`
3. **Update imports**: Change from `FroalaEditorModule` to `WysiwygEditorModule`
4. **Update templates**: Use `<wysiwyg-editor>` instead of `<div [froalaEditor]>`
5. **Update model binding**: Use `[(ngModel)]` instead of `[(froalaModel)]`

### Before (Froala)
```html
<div [froalaEditor]="froalaOptions" [(froalaModel)]="content"></div>
```

### After (Angular WYSIWYG Editor)
```html
<wysiwyg-editor [toolbarConfig]="toolbarConfig" [(ngModel)]="content"></wysiwyg-editor>
```

For detailed migration instructions, configuration mapping, and troubleshooting, see the complete [Migration Guide](MIGRATION.md).

## Demo Application

A comprehensive demo application is included in this repository showcasing all features and usage patterns. To run the demo:

```bash
# Clone the repository
git clone https://github.com/bigledger/angular-wysiwyg-editor.git
cd angular-wysiwyg-editor

# Install dependencies
npm install

# Start the demo application
npm start
```

The demo includes:

- **Basic Usage**: Simple editor implementations with default settings
- **Forms Integration**: Template-driven and reactive forms examples with validation
- **Toolbar Configuration**: Custom toolbar setups from minimal to full-featured
- **Event Handling**: Content changes, selection events, and real-time interactions
- **Styling & Theming**: Custom themes, CSS variables, and responsive design
- **Advanced Features**: Performance optimization, content sanitization, and programmatic control

Visit `http://localhost:4200` to explore all examples interactively.

## Documentation

- 📖 [Complete API Documentation](API.md)
- 📋 [Usage Examples](EXAMPLES.md)
- 🔄 [Migration Guide from Froala](MIGRATION.md)
- ⚡ [Performance Guide](PERFORMANCE.md)

## Development

### Prerequisites

- Node.js 18+
- Angular CLI 15+

### Building the Library

```bash
# Install dependencies
npm install

# Build the library
npm run build:lib

# Build and watch for changes
npm run build:lib:watch
```

### Testing

```bash
# Run unit tests
npm run test:lib

# Run tests with coverage
npm run test:lib:coverage

# Run tests in CI mode
npm run test:lib:ci
```

### Publishing

```bash
# Build and create package
npm run publish:lib

# Release (test + build + publish)
npm run release:lib
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Demo Application

A comprehensive demo application is included in this repository showcasing all features and usage patterns. To run the demo:

```bash
# Clone the repository
git clone https://github.com/bigledger/angular-wysiwyg-editor.git
cd angular-wysiwyg-editor

# Install dependencies
npm install

# Start the demo application
npm start
```

The demo includes:

- **Basic Usage**: Simple editor implementations with default settings
- **Forms Integration**: Template-driven and reactive forms examples with validation
- **Toolbar Configuration**: Custom toolbar setups from minimal to full-featured
- **Event Handling**: Content changes, selection events, and real-time interactions
- **Styling & Theming**: Custom themes, CSS variables, and responsive design
- **Advanced Features**: Performance optimization, content sanitization, and programmatic control

Visit `http://localhost:4200` to explore all examples interactively.

## Documentation

- 📖 [Complete API Documentation](projects/angular-wysiwyg-editor/API.md)
- 📋 [Usage Examples](projects/angular-wysiwyg-editor/EXAMPLES.md)
- 🔄 [Migration Guide from Froala](projects/angular-wysiwyg-editor/MIGRATION.md)
- ⚡ [Performance Guide](projects/angular-wysiwyg-editor/PERFORMANCE.md)

## Support

- 📖 [Documentation](https://github.com/bigledger/angular-wysiwyg-editor#readme)
- 🐛 [Issue Tracker](https://github.com/bigledger/angular-wysiwyg-editor/issues)
- 💬 [Discussions](https://github.com/bigledger/angular-wysiwyg-editor/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and breaking changes.