# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of Angular WYSIWYG Editor
- Rich text formatting (bold, italic, underline, font size, colors)
- Text alignment options (left, center, right, justify)
- List support (bulleted and numbered lists with indentation)
- Link management (insert, edit, remove with validation)
- Image insertion (upload and URL with resizing)
- Undo/redo functionality with command history
- Keyboard shortcuts for common actions
- Customizable toolbar configuration
- Angular forms integration (ngModel and reactive forms)
- Content sanitization for XSS prevention
- Accessibility features (keyboard navigation, ARIA labels)
- Responsive design for mobile and desktop
- TypeScript support with full type definitions
- Comprehensive test suite
- Documentation and usage examples

### Features
- **WysiwygEditorComponent**: Main editor component with full API
- **ToolbarComponent**: Customizable formatting toolbar
- **EditorContentComponent**: Content editing area with contenteditable
- **SelectionService**: Text selection and cursor management
- **CommandService**: Formatting command execution
- **HTMLSanitizerService**: Content security and sanitization
- **EditorService**: Central state management
- **ContentEditableDirective**: Enhanced contenteditable behavior

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies
- Angular 15+ (peer dependency)
- RxJS 7+ (peer dependency)
- TypeScript 4.8+

## [Unreleased]

### Planned Features
- Table support
- Code block formatting
- Advanced image editing
- Spell check integration
- Plugin system for extensions
- Additional themes
- Performance optimizations