# Migration Guide from Froala Editor

This guide helps you migrate from Froala Editor to Angular WYSIWYG Editor with minimal code changes and maximum compatibility.

## Table of Contents

- [Overview](#overview)
- [Installation Changes](#installation-changes)
- [Import Changes](#import-changes)
- [Component Usage Changes](#component-usage-changes)
- [Configuration Migration](#configuration-migration)
- [Event Handling Migration](#event-handling-migration)
- [Styling Migration](#styling-migration)
- [Feature Mapping](#feature-mapping)
- [Breaking Changes](#breaking-changes)
- [Migration Checklist](#migration-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

Angular WYSIWYG Editor is designed as a drop-in replacement for Froala Editor, providing similar functionality with a cleaner API and better Angular integration. This migration guide covers the key differences and provides step-by-step instructions for updating your existing code.

### Key Benefits of Migration

- **No License Fees**: Open source alternative to Froala's commercial license
- **Better Angular Integration**: Built specifically for Angular with modern practices
- **Smaller Bundle Size**: Optimized for performance with tree-shaking support
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Modern Browser APIs**: Uses latest browser capabilities for better performance

## Installation Changes

### Before (Froala Editor)

```bash
npm install angular-froala-wysiwyg
npm install froala-editor
```

```typescript
// angular.json
"styles": [
  "node_modules/froala-editor/css/froala_editor.pkgd.min.css",
  "node_modules/froala-editor/css/froala_style.min.css"
],
"scripts": [
  "node_modules/froala-editor/js/froala_editor.pkgd.min.js"
]
```

### After (Angular WYSIWYG Editor)

```bash
npm uninstall angular-froala-wysiwyg froala-editor
npm install angular-wysiwyg-editor
```

No additional CSS or JavaScript files needed - everything is bundled with the component.

## Import Changes

### Before (Froala Editor)

```typescript
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';

@NgModule({
  imports: [
    FroalaEditorModule.forRoot(),
    FroalaViewModule.forRoot()
  ]
})
export class AppModule { }
```

### After (Angular WYSIWYG Editor)

```typescript
import { WysiwygEditorModule } from 'angular-wysiwyg-editor';

@NgModule({
  imports: [WysiwygEditorModule]
})
export class AppModule { }
```

For standalone components:

```typescript
import { WysiwygEditorComponent } from 'angular-wysiwyg-editor';

@Component({
  imports: [WysiwygEditorComponent],
  // ...
})
```

## Component Usage Changes

### Before (Froala Editor)

```html
<!-- Basic usage -->
<div [froalaEditor]="froalaOptions" [(froalaModel)]="content"></div>

<!-- With configuration -->
<div 
  [froalaEditor]="froalaOptions" 
  [(froalaModel)]="content"
  (froalaInit)="onInit($event)"
  (froalaModelChange)="onContentChange($event)">
</div>

<!-- Read-only view -->
<div [froalaView]="content"></div>
```

### After (Angular WYSIWYG Editor)

```html
<!-- Basic usage -->
<wysiwyg-editor [(ngModel)]="content"></wysiwyg-editor>

<!-- With configuration -->
<wysiwyg-editor 
  [(ngModel)]="content"
  [toolbarConfig]="toolbarConfig"
  [placeholder]="placeholder"
  [height]="height"
  (contentChange)="onContentChange($event)"
  (selectionChange)="onSelectionChange($event)">
</wysiwyg-editor>

<!-- Read-only view -->
<wysiwyg-editor [content]="content" [readonly]="true"></wysiwyg-editor>
```

## Configuration Migration

### Froala Options to Toolbar Config

#### Before (Froala Editor)

```typescript
export class MyComponent {
  froalaOptions = {
    toolbarButtons: [
      'bold', 'italic', 'underline', '|',
      'fontSize', 'color', '|',
      'alignLeft', 'alignCenter', 'alignRight', '|',
      'insertLink', 'insertImage'
    ],
    height: 300,
    placeholder: 'Start typing...',
    readonly: false,
    theme: 'royal'
  };
}
```

#### After (Angular WYSIWYG Editor)

```typescript
import { ToolbarConfig } from 'angular-wysiwyg-editor';

export class MyComponent {
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'button', command: 'separator', separator: true },
      { 
        type: 'dropdown', 
        command: 'fontSize', 
        label: 'Font Size',
        options: [
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' },
          { value: '16px', label: '16px' }
        ]
      },
      { 
        type: 'dropdown', 
        command: 'foreColor', 
        label: 'Text Color',
        options: [
          { value: '#000000', label: 'Black' },
          { value: '#FF0000', label: 'Red' },
          { value: '#0000FF', label: 'Blue' }
        ]
      },
      { type: 'button', command: 'separator', separator: true },
      { type: 'button', command: 'justifyLeft', icon: 'align-left', label: 'Align Left' },
      { type: 'button', command: 'justifyCenter', icon: 'align-center', label: 'Align Center' },
      { type: 'button', command: 'justifyRight', icon: 'align-right', label: 'Align Right' },
      { type: 'button', command: 'separator', separator: true },
      { type: 'button', command: 'createLink', icon: 'link', label: 'Insert Link' },
      { type: 'button', command: 'insertImage', icon: 'image', label: 'Insert Image' }
    ],
    theme: 'light'
  };

  placeholder = 'Start typing...';
  height = '300px';
  readonly = false;
}
```

### Configuration Mapping Table

| Froala Option | Angular WYSIWYG Editor | Notes |
|---------------|------------------------|-------|
| `toolbarButtons` | `toolbarConfig.tools` | Array of tool objects instead of strings |
| `height` | `height` | Direct property, accepts CSS values |
| `placeholder` | `placeholder` | Direct property |
| `readonly` | `readonly` | Direct property |
| `theme` | `toolbarConfig.theme` | 'light' or 'dark' |
| `fontSize` | Font size dropdown in tools | Configure via dropdown options |
| `fontFamily` | Not supported | Use CSS styling instead |
| `colors` | Color dropdowns in tools | Configure via dropdown options |

## Event Handling Migration

### Before (Froala Editor)

```typescript
export class MyComponent {
  content = '';

  onInit(editor: any) {
    console.log('Editor initialized');
  }

  onContentChange(content: string) {
    console.log('Content changed:', content);
  }

  onFocus() {
    console.log('Editor focused');
  }

  onBlur() {
    console.log('Editor blurred');
  }
}
```

```html
<div 
  [froalaEditor]="froalaOptions"
  [(froalaModel)]="content"
  (froalaInit)="onInit($event)"
  (froalaModelChange)="onContentChange($event)"
  (froalaFocus)="onFocus()"
  (froalaBlur)="onBlur()">
</div>
```

### After (Angular WYSIWYG Editor)

```typescript
import { SelectionState } from 'angular-wysiwyg-editor';

export class MyComponent {
  content = '';

  onContentChange(content: string) {
    console.log('Content changed:', content);
  }

  onSelectionChange(selection: SelectionState) {
    console.log('Selection changed:', selection);
  }

  onFocus() {
    console.log('Editor focused');
  }

  onBlur() {
    console.log('Editor blurred');
  }
}
```

```html
<wysiwyg-editor
  [(ngModel)]="content"
  (contentChange)="onContentChange($event)"
  (selectionChange)="onSelectionChange($event)"
  (focus)="onFocus()"
  (blur)="onBlur()">
</wysiwyg-editor>
```

### Event Mapping Table

| Froala Event | Angular WYSIWYG Editor Event | Notes |
|--------------|------------------------------|-------|
| `froalaInit` | Component initialization | No direct equivalent, use Angular lifecycle hooks |
| `froalaModelChange` | `contentChange` | Same functionality |
| `froalaFocus` | `focus` | Same functionality |
| `froalaBlur` | `blur` | Same functionality |
| N/A | `selectionChange` | New event for selection state changes |

## Styling Migration

### Before (Froala Editor)

```css
/* Custom Froala styling */
.fr-toolbar {
  background: #f8f9fa;
}

.fr-element {
  font-family: Arial, sans-serif;
}

.fr-box {
  border: 2px solid #007bff;
}
```

### After (Angular WYSIWYG Editor)

```css
/* Custom WYSIWYG Editor styling using CSS variables */
wysiwyg-editor {
  --toolbar-background: #f8f9fa;
  --content-font-family: Arial, sans-serif;
  --editor-border: 2px solid #007bff;
}

/* Or use traditional CSS selectors */
wysiwyg-editor .wysiwyg-toolbar {
  background: #f8f9fa;
}

wysiwyg-editor .wysiwyg-content {
  font-family: Arial, sans-serif;
}

wysiwyg-editor .wysiwyg-editor {
  border: 2px solid #007bff;
}
```

### Available CSS Variables

```css
wysiwyg-editor {
  /* Editor container */
  --editor-border: 1px solid #ddd;
  --editor-border-radius: 4px;
  --editor-background: #fff;
  
  /* Toolbar */
  --toolbar-background: #f8f9fa;
  --toolbar-border: 1px solid #ddd;
  --toolbar-padding: 8px;
  
  /* Buttons */
  --button-background: transparent;
  --button-color: #333;
  --button-hover-background: #e9ecef;
  --button-active-background: #007bff;
  --button-active-color: white;
  
  /* Content area */
  --content-background: white;
  --content-color: #333;
  --content-padding: 12px;
  --content-font-family: inherit;
  --content-line-height: 1.5;
}
```

## Feature Mapping

### Text Formatting

| Froala Feature | Angular WYSIWYG Editor | Status |
|----------------|------------------------|--------|
| Bold | ✅ `bold` command | Supported |
| Italic | ✅ `italic` command | Supported |
| Underline | ✅ `underline` command | Supported |
| Strikethrough | ❌ | Not supported |
| Subscript | ❌ | Not supported |
| Superscript | ❌ | Not supported |
| Font Size | ✅ `fontSize` dropdown | Supported |
| Font Family | ❌ | Use CSS instead |
| Text Color | ✅ `foreColor` dropdown | Supported |
| Background Color | ✅ `backColor` dropdown | Supported |

### Paragraph Formatting

| Froala Feature | Angular WYSIWYG Editor | Status |
|----------------|------------------------|--------|
| Align Left | ✅ `justifyLeft` | Supported |
| Align Center | ✅ `justifyCenter` | Supported |
| Align Right | ✅ `justifyRight` | Supported |
| Justify | ✅ `justifyFull` | Supported |
| Bullet List | ✅ `insertUnorderedList` | Supported |
| Numbered List | ✅ `insertOrderedList` | Supported |
| Indent | ✅ `indent` | Supported |
| Outdent | ✅ `outdent` | Supported |

### Insert Elements

| Froala Feature | Angular WYSIWYG Editor | Status |
|----------------|------------------------|--------|
| Link | ✅ `createLink` | Supported |
| Image | ✅ `insertImage` | Supported |
| Table | ❌ | Not supported |
| Video | ❌ | Not supported |
| File | ❌ | Not supported |
| Emoticons | ❌ | Not supported |

### Advanced Features

| Froala Feature | Angular WYSIWYG Editor | Status |
|----------------|------------------------|--------|
| Undo/Redo | ✅ `undo`/`redo` | Supported |
| Source Code | ❌ | Not supported |
| Full Screen | ❌ | Not supported |
| Print | ❌ | Not supported |
| Spell Check | ✅ Browser native | Supported |

## Breaking Changes

### 1. Component Selector Change

**Before:** `<div [froalaEditor]>`  
**After:** `<wysiwyg-editor>`

### 2. Model Binding Change

**Before:** `[(froalaModel)]="content"`  
**After:** `[(ngModel)]="content"`

### 3. Configuration Structure

**Before:** Flat options object  
**After:** Structured `ToolbarConfig` object

### 4. Event Names

**Before:** `froalaModelChange`, `froalaFocus`, etc.  
**After:** `contentChange`, `focus`, etc.

### 5. Styling Approach

**Before:** Global CSS classes  
**After:** CSS variables and component-scoped styles

## Migration Checklist

### Phase 1: Preparation

- [ ] Review current Froala Editor usage in your application
- [ ] Identify custom configurations and styling
- [ ] Check which Froala features you're using (see Feature Mapping)
- [ ] Plan for unsupported features (alternatives or removal)

### Phase 2: Installation

- [ ] Uninstall Froala Editor packages
- [ ] Install Angular WYSIWYG Editor
- [ ] Remove Froala CSS/JS from angular.json
- [ ] Update imports in modules/components

### Phase 3: Component Migration

- [ ] Replace `<div [froalaEditor]>` with `<wysiwyg-editor>`
- [ ] Update model binding from `[(froalaModel)]` to `[(ngModel)]`
- [ ] Convert Froala options to `ToolbarConfig`
- [ ] Update event handlers

### Phase 4: Styling Migration

- [ ] Convert Froala CSS to CSS variables or component styles
- [ ] Test visual appearance across different themes
- [ ] Ensure responsive design still works

### Phase 5: Testing

- [ ] Test all editor functionality
- [ ] Verify forms integration
- [ ] Check keyboard shortcuts
- [ ] Test accessibility features
- [ ] Validate content output format

### Phase 6: Cleanup

- [ ] Remove unused Froala-related code
- [ ] Update documentation
- [ ] Remove Froala license references

## Troubleshooting

### Common Issues and Solutions

#### 1. Content Not Displaying

**Problem:** Content appears empty after migration  
**Solution:** Check that you're using `[(ngModel)]` instead of `[(froalaModel)]`

```typescript
// Wrong
<wysiwyg-editor [(froalaModel)]="content"></wysiwyg-editor>

// Correct
<wysiwyg-editor [(ngModel)]="content"></wysiwyg-editor>
```

#### 2. Toolbar Not Showing

**Problem:** Toolbar appears empty or with wrong tools  
**Solution:** Ensure `toolbarConfig` is properly structured

```typescript
// Wrong - using Froala format
toolbarConfig = ['bold', 'italic', 'underline'];

// Correct - using Angular WYSIWYG Editor format
toolbarConfig: ToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' }
  ]
};
```

#### 3. Styling Issues

**Problem:** Editor looks different from Froala  
**Solution:** Use CSS variables to match your previous styling

```css
wysiwyg-editor {
  --toolbar-background: #your-color;
  --editor-border: 1px solid #your-border-color;
  --content-font-family: your-font-family;
}
```

#### 4. Events Not Firing

**Problem:** Event handlers not being called  
**Solution:** Update event names and signatures

```typescript
// Wrong - Froala events
(froalaModelChange)="onContentChange($event)"

// Correct - Angular WYSIWYG Editor events
(contentChange)="onContentChange($event)"
```

#### 5. Forms Integration Issues

**Problem:** Editor not working with Angular forms  
**Solution:** Ensure proper FormControl setup

```typescript
// For reactive forms
this.form = this.fb.group({
  content: [''] // Make sure FormControl exists
});
```

```html
<!-- Make sure formControlName matches -->
<wysiwyg-editor formControlName="content"></wysiwyg-editor>
```

### Performance Considerations

1. **Bundle Size**: Angular WYSIWYG Editor has a smaller bundle size than Froala
2. **Memory Usage**: Better memory management with proper cleanup
3. **Rendering**: Optimized for Angular change detection

### Getting Help

If you encounter issues during migration:

1. Check the [API Documentation](API.md)
2. Review [Usage Examples](EXAMPLES.md)
3. Search existing [GitHub Issues](https://github.com/bigledger/angular-wysiwyg-editor/issues)
4. Create a new issue with migration details

### Migration Timeline Recommendation

- **Small Projects (1-5 editors)**: 1-2 days
- **Medium Projects (5-20 editors)**: 3-5 days  
- **Large Projects (20+ editors)**: 1-2 weeks

Plan for additional time if you have:
- Heavy customization
- Complex styling
- Extensive use of unsupported features
- Large test suites to update

## Conclusion

Migrating from Froala Editor to Angular WYSIWYG Editor provides significant benefits in terms of cost, bundle size, and Angular integration. While there are some breaking changes, the migration process is straightforward for most use cases.

The key to a successful migration is thorough planning, systematic replacement of components, and comprehensive testing. Take advantage of the improved TypeScript support and modern Angular patterns that Angular WYSIWYG Editor provides.