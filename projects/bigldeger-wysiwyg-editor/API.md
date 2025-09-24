# Angular WYSIWYG Editor - API Documentation

## Table of Contents

- [Components](#components)
  - [WysiwygEditorComponent](#wysiwygEditorcomponent)
  - [ToolbarComponent](#toolbarcomponent)
  - [EditorContentComponent](#editorcontentcomponent)
  - [ToolbarButtonComponent](#toolbarbuttoncomponent)
  - [ToolbarDropdownComponent](#toolbardropdowncomponent)
  - [LinkDialogComponent](#linkdialogcomponent)
  - [ImageDialogComponent](#imagedialogcomponent)
- [Services](#services)
  - [EditorService](#editorservice)
  - [SelectionService](#selectionservice)
  - [CommandService](#commandservice)
  - [HTMLSanitizerService](#htmlsanitizerservice)
  - [HistoryService](#historyservice)
- [Interfaces](#interfaces)
  - [ToolbarConfig](#toolbarconfig)
  - [ToolbarTool](#toolbartool)
  - [EditorCommand](#editorcommand)
  - [SelectionState](#selectionstate)
  - [EditorConfig](#editorconfig)
- [Directives](#directives)
- [Types](#types)

## Components

### WysiwygEditorComponent

The main editor component that provides the complete WYSIWYG editing experience.

**Selector:** `wysiwyg-editor`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `toolbarConfig` | `ToolbarConfig` | Default toolbar | Configuration for toolbar tools and appearance |
| `placeholder` | `string` | `''` | Placeholder text displayed when editor is empty |
| `readonly` | `boolean` | `false` | Whether the editor is in read-only mode |
| `height` | `string` | `'200px'` | Height of the editor content area |
| `content` | `string` | `''` | Initial HTML content of the editor |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `contentChange` | `EventEmitter<string>` | Emitted when editor content changes |
| `selectionChange` | `EventEmitter<SelectionState>` | Emitted when text selection changes |
| `focus` | `EventEmitter<void>` | Emitted when editor gains focus |
| `blur` | `EventEmitter<void>` | Emitted when editor loses focus |

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `focus()` | - | `void` | Programmatically focus the editor |
| `blur()` | - | `void` | Programmatically remove focus from editor |
| `getContent()` | - | `string` | Get current HTML content |
| `setContent(html: string)` | `html: string` | `void` | Set editor content |
| `insertHTML(html: string)` | `html: string` | `void` | Insert HTML at current cursor position |
| `executeCommand(command: EditorCommand)` | `command: EditorCommand` | `void` | Execute a formatting command |

#### Usage Example

```typescript
import { Component } from '@angular/core';
import { ToolbarConfig } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-example',
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig"
      [placeholder]="'Start typing...'"
      [height]="'300px'"
      (contentChange)="onContentChange($event)"
      (selectionChange)="onSelectionChange($event)">
    </wysiwyg-editor>
  `
})
export class ExampleComponent {
  content = '<p>Hello World!</p>';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' }
    ]
  };

  onContentChange(content: string) {
    console.log('Content changed:', content);
  }

  onSelectionChange(selection: SelectionState) {
    console.log('Selection changed:', selection);
  }
}
```

### ToolbarComponent

Component that renders the formatting toolbar with configurable tools.

**Selector:** `wysiwyg-toolbar`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `config` | `ToolbarConfig` | Required | Toolbar configuration |
| `disabled` | `boolean` | `false` | Whether toolbar is disabled |
| `activeFormats` | `ActiveFormats` | `{}` | Currently active formatting states |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `command` | `EventEmitter<EditorCommand>` | Emitted when a toolbar command is executed |

### EditorContentComponent

Component that manages the contenteditable area where users type and edit text.

**Selector:** `wysiwyg-editor-content`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | HTML content to display |
| `placeholder` | `string` | `''` | Placeholder text |
| `readonly` | `boolean` | `false` | Read-only mode |
| `height` | `string` | `'200px'` | Content area height |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `contentChange` | `EventEmitter<string>` | Emitted when content changes |
| `selectionChange` | `EventEmitter<SelectionState>` | Emitted when selection changes |
| `keydown` | `EventEmitter<KeyboardEvent>` | Emitted on keydown events |

### ToolbarButtonComponent

Individual toolbar button component for formatting actions.

**Selector:** `wysiwyg-toolbar-button`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tool` | `ToolbarTool` | Required | Button configuration |
| `active` | `boolean` | `false` | Whether button is in active state |
| `disabled` | `boolean` | `false` | Whether button is disabled |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `click` | `EventEmitter<void>` | Emitted when button is clicked |

### ToolbarDropdownComponent

Dropdown component for toolbar options like font size, colors, etc.

**Selector:** `wysiwyg-toolbar-dropdown`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tool` | `ToolbarTool` | Required | Dropdown configuration |
| `value` | `any` | `null` | Current selected value |
| `disabled` | `boolean` | `false` | Whether dropdown is disabled |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `change` | `EventEmitter<any>` | Emitted when selection changes |

### LinkDialogComponent

Dialog component for inserting and editing hyperlinks.

**Selector:** `wysiwyg-link-dialog`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | `boolean` | `false` | Whether dialog is visible |
| `linkUrl` | `string` | `''` | Initial URL value |
| `linkText` | `string` | `''` | Initial link text |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `save` | `EventEmitter<{url: string, text: string}>` | Emitted when link is saved |
| `cancel` | `EventEmitter<void>` | Emitted when dialog is cancelled |

### ImageDialogComponent

Dialog component for inserting images via upload or URL.

**Selector:** `wysiwyg-image-dialog`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visible` | `boolean` | `false` | Whether dialog is visible |
| `allowUpload` | `boolean` | `true` | Whether file upload is allowed |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `save` | `EventEmitter<{src: string, alt: string}>` | Emitted when image is saved |
| `cancel` | `EventEmitter<void>` | Emitted when dialog is cancelled |

## Services

### EditorService

Central service for managing editor state and coordinating operations.

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getCurrentSelection()` | - | `Observable<SelectionState \| null>` | Get current selection state |
| `getContent()` | - | `Observable<string>` | Get current content |
| `executeCommand(command: EditorCommand)` | `command: EditorCommand` | `void` | Execute formatting command |
| `setContent(content: string)` | `content: string` | `void` | Set editor content |
| `focus()` | - | `void` | Focus the editor |
| `blur()` | - | `void` | Blur the editor |

### SelectionService

Service for managing text selection and cursor position.

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getSelection()` | - | `Selection \| null` | Get current browser selection |
| `getRange()` | - | `Range \| null` | Get current selection range |
| `saveSelection()` | - | `SelectionState` | Save current selection state |
| `restoreSelection(state: SelectionState)` | `state: SelectionState` | `void` | Restore saved selection |
| `selectAll()` | - | `void` | Select all content |
| `collapse()` | - | `void` | Collapse selection to cursor |

### CommandService

Service for executing formatting commands using browser APIs.

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `executeCommand(command: string, value?: any)` | `command: string, value?: any` | `boolean` | Execute browser command |
| `queryCommandState(command: string)` | `command: string` | `boolean` | Query command active state |
| `queryCommandValue(command: string)` | `command: string` | `string` | Query command current value |
| `insertHTML(html: string)` | `html: string` | `void` | Insert HTML content |
| `insertText(text: string)` | `text: string` | `void` | Insert plain text |

### HTMLSanitizerService

Service for sanitizing HTML content to prevent XSS attacks.

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `sanitize(html: string)` | `html: string` | `string` | Sanitize HTML content |
| `stripTags(html: string, allowedTags: string[])` | `html: string, allowedTags: string[]` | `string` | Strip unwanted HTML tags |
| `cleanAttributes(html: string)` | `html: string` | `string` | Clean HTML attributes |

### HistoryService

Service for managing undo/redo functionality.

#### Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `addState(content: string)` | `content: string` | `void` | Add content state to history |
| `undo()` | - | `string \| null` | Undo last action |
| `redo()` | - | `string \| null` | Redo last undone action |
| `canUndo()` | - | `boolean` | Check if undo is available |
| `canRedo()` | - | `boolean` | Check if redo is available |
| `clear()` | - | `void` | Clear history |

## Interfaces

### ToolbarConfig

Configuration interface for the editor toolbar.

```typescript
interface ToolbarConfig {
  tools: ToolbarTool[];
  sticky?: boolean;
  theme?: 'light' | 'dark';
  position?: 'top' | 'bottom';
}
```

### ToolbarTool

Configuration for individual toolbar tools.

```typescript
interface ToolbarTool {
  type: 'button' | 'dropdown' | 'dialog';
  command: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  options?: ToolOption[];
  separator?: boolean;
}

interface ToolOption {
  value: string;
  label: string;
  icon?: string;
}
```

### EditorCommand

Interface for editor commands.

```typescript
interface EditorCommand {
  name: string;
  value?: any;
  options?: any;
}
```

### SelectionState

Interface representing the current text selection state.

```typescript
interface SelectionState {
  range: Range | null;
  collapsed: boolean;
  formats: ActiveFormats;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: string;
  fontColor: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}
```

### EditorConfig

Main configuration interface for the editor.

```typescript
interface EditorConfig {
  toolbar: ToolbarConfig;
  height?: string;
  placeholder?: string;
  readonly?: boolean;
  sanitizer?: SanitizerConfig;
  allowedTags?: string[];
  allowedAttributes?: string[];
}
```

## Directives

### ContentEditableDirective

Directive that enhances contenteditable behavior with additional functionality.

**Selector:** `[wysiwygContentEditable]`

#### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placeholder` | `string` | `''` | Placeholder text |
| `readonly` | `boolean` | `false` | Read-only mode |

#### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `contentChange` | `EventEmitter<string>` | Emitted when content changes |
| `selectionChange` | `EventEmitter<SelectionState>` | Emitted when selection changes |

## Types

### Command Types

Available formatting commands:

- `'bold'` - Toggle bold formatting
- `'italic'` - Toggle italic formatting
- `'underline'` - Toggle underline formatting
- `'fontSize'` - Set font size
- `'foreColor'` - Set text color
- `'backColor'` - Set background color
- `'justifyLeft'` - Align text left
- `'justifyCenter'` - Align text center
- `'justifyRight'` - Align text right
- `'justifyFull'` - Justify text
- `'insertUnorderedList'` - Insert bullet list
- `'insertOrderedList'` - Insert numbered list
- `'indent'` - Increase indentation
- `'outdent'` - Decrease indentation
- `'createLink'` - Create hyperlink
- `'unlink'` - Remove hyperlink
- `'insertImage'` - Insert image
- `'undo'` - Undo last action
- `'redo'` - Redo last undone action

### Theme Types

```typescript
type Theme = 'light' | 'dark';
type ToolbarPosition = 'top' | 'bottom';
type Alignment = 'left' | 'center' | 'right' | 'justify';
```

## Error Handling

The library provides comprehensive error handling through the `EditorError` interface:

```typescript
interface EditorError {
  type: 'browser' | 'validation' | 'command' | 'upload';
  message: string;
  details?: any;
}
```

Error types:
- `browser` - Browser compatibility issues
- `validation` - Content validation errors
- `command` - Command execution failures
- `upload` - File upload errors

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

The library includes several performance optimizations:

- Debounced content change events
- Lazy loading of dialog components
- Virtual scrolling for large documents
- Efficient DOM manipulation
- Memory leak prevention

For detailed performance information, see [PERFORMANCE.md](PERFORMANCE.md).