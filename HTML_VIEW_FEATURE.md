# HTML View Toggle Feature

## Overview
The HTML view toggle feature allows users to switch between visual editing mode and HTML code editing mode, similar to Froala Editor. This provides developers and advanced users the ability to directly edit HTML code while still having the convenience of a WYSIWYG editor.

## Features

### 1. Toggle Button
- **Location**: Added to the toolbar
- **Icon**: 
  - `</>` when in visual mode (click to view HTML)
  - `👁️` when in HTML mode (click to return to visual)
- **Tooltip**:
  - "View HTML Code" when in visual mode
  - "Switch to Visual Mode" when in HTML mode

### 2. HTML Code View
- **Formatted HTML**: Automatically formats and indents HTML for better readability
- **Syntax**: Monospace font for code editing
- **Editable**: Full editing capabilities in HTML mode
- **Auto-sync**: Changes sync bidirectionally between visual and HTML modes

### 3. Formatting
The HTML formatter provides:
- Proper indentation (2 spaces per level)
- Line breaks after closing tags
- Line breaks before block-level opening tags
- Clean, readable structure

## Usage

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent, ToolbarConfig } from 'angular-wysiwyg-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig"
      placeholder="Type here...">
    </wysiwyg-editor>
  `
})
export class ExampleComponent {
  content = '<p>Hello <strong>World</strong>!</p>';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'toggleHtmlView', icon: 'code', label: 'HTML View' }
    ]
  };
}
```

### Toolbar Configuration

The HTML view toggle button is included in the default toolbar configuration. To add it to a custom toolbar:

```typescript
{
  type: 'button',
  command: 'toggleHtmlView',
  icon: 'code',
  label: 'HTML View',
  title: 'Toggle HTML View'
}
```

## How It Works

### Switching to HTML Mode
1. User clicks the HTML view button (`</>` icon)
2. Current visual content is converted to formatted HTML
3. Editor switches to a textarea with monospace font
4. HTML code is displayed with proper indentation
5. Button icon changes to eye (`👁️`)

### Editing in HTML Mode
1. User can directly edit HTML code in the textarea
2. Changes are tracked in real-time
3. Content model is updated with raw HTML
4. No sanitization is applied during editing

### Switching Back to Visual Mode
1. User clicks the view button (`👁️` icon)
2. HTML code is parsed and sanitized
3. Editor switches back to contenteditable div
4. Visual rendering is updated
5. Button icon changes back to `</>`

## Implementation Details

### Components Modified

1. **editor-content.component.ts**
   - Added `htmlMode` input property with setter/getter
   - Added `htmlTextarea` ViewChild reference
   - Implemented `onHtmlModeChange()` method
   - Implemented `formatHtml()` method for code formatting
   - Added `onHtmlInput()` event handler
   - Integrated ChangeDetectorRef for mode switching

2. **editor-content.component.scss**
   - Added `.wysiwyg-html-view` styles
   - Monospace font family
   - Code-friendly background colors
   - Proper scrolling and sizing

3. **wysiwyg-editor.component.ts**
   - Added `isHtmlMode` boolean property
   - Implemented `toggleHtmlView()` method
   - Updated `handleCommand()` to handle `toggleHtmlView` command
   - Modified `onSelectionChange()` to include HTML mode in selection state

4. **toolbar.component.ts**
   - Updated `isToolActive()` to check for `htmlMode` in selection state
   - HTML view button shows active state when in HTML mode

5. **toolbar-button.component.ts**
   - Updated `getIcon()` to show different icons based on active state
   - Updated `getTitle()` to show contextual tooltips
   - Added special handling for `toggleHtmlView` command

### HTML Formatting Algorithm

```typescript
private formatHtml(html: string): string {
  // 1. Trim whitespace
  // 2. Add line breaks after closing tags
  // 3. Add line breaks before block-level opening tags
  // 4. Add line breaks after self-closing tags
  // 5. Apply indentation based on nesting level
  // 6. Handle inline elements without extra spacing
}
```

## Styling

### HTML View Textarea
```scss
.wysiwyg-html-view {
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #f5f5f5;
  color: #333;
  padding: var(--wysiwyg-spacing-md);
  white-space: pre-wrap;
  tab-size: 2;
}
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- **Keyboard Navigation**: Button is keyboard accessible (Tab to focus, Enter/Space to activate)
- **ARIA Labels**: Proper aria-label for HTML code editor
- **Screen Readers**: Announces mode changes and current state
- **Focus Management**: Focus is maintained when switching modes

## Best Practices

### For Users
1. **Format before sharing**: Use HTML view to ensure clean code structure
2. **Direct HTML editing**: Useful for adding custom attributes or complex structures
3. **Debugging**: View HTML to troubleshoot rendering issues
4. **Copy/Paste**: Easy to copy formatted HTML for use elsewhere

### For Developers
1. **Sanitization**: HTML is still sanitized when switching back to visual mode
2. **Validation**: Consider adding HTML validation if needed
3. **Custom Formatting**: Extend `formatHtml()` method for custom formatting rules
4. **Syntax Highlighting**: Consider adding a syntax highlighter library for enhanced UX

## Future Enhancements

Potential improvements:
- [ ] Syntax highlighting for HTML code
- [ ] Line numbers in HTML view
- [ ] HTML validation and error highlighting
- [ ] Collapsible code blocks
- [ ] Search and replace in HTML view
- [ ] Diff view when switching between modes
- [ ] Prettier integration for advanced formatting

## Comparison with Froala

| Feature | Froala | This Implementation |
|---------|--------|-------------------|
| Toggle Button | ✅ | ✅ |
| Icon Changes | ✅ | ✅ |
| Formatted HTML | ✅ | ✅ |
| Bidirectional Sync | ✅ | ✅ |
| Real-time Editing | ✅ | ✅ |
| Syntax Highlighting | ✅ | ❌ (future) |
| Line Numbers | ✅ | ❌ (future) |

## Example Workflows

### Workflow 1: Adding Custom Attributes
1. Create content in visual mode
2. Click HTML view button
3. Add custom data-* attributes to elements
4. Click view button to return to visual mode
5. Attributes are preserved in the DOM

### Workflow 2: Copying HTML for External Use
1. Design content in visual mode
2. Click HTML view button
3. Select and copy formatted HTML
4. Paste into external CMS or documentation

### Workflow 3: Debugging Layout Issues
1. Notice unexpected formatting in visual mode
2. Click HTML view button
3. Inspect HTML structure
4. Fix nested tags or unclosed elements
5. Return to visual mode to verify

## Troubleshooting

### Content Not Showing After HTML Edit
- **Cause**: Invalid HTML or unclosed tags
- **Solution**: Check HTML syntax, ensure all tags are properly closed

### Formatting Lost When Switching Modes
- **Cause**: Sanitizer removing certain styles or attributes
- **Solution**: Configure sanitizer to allow necessary attributes

### Icons Not Displaying
- **Cause**: Font rendering or browser compatibility
- **Solution**: Check console for errors, ensure Unicode support

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/bigledger/bigledger-wysiwyg-editor/issues)
- Documentation: [API Documentation](./API.md)
- Examples: [Example Implementations](./EXAMPLES.md)
