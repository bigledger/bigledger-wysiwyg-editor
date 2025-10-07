# Code Toggle Button Enhancement

## Overview
The Code toggle button has been enhanced to show only icons (no text labels) with dynamic visual feedback based on the current editor mode.

## Visual Design

### Button Appearance

#### Visual/Content Mode (Default)
- **Icon**: `</>` (HTML/code brackets)
- **Style**: Bold, 16px font
- **Tooltip**: "View HTML Code"
- **Background**: Transparent (hover: light gray)
- **Meaning**: Click to view the HTML source code

#### HTML Code Mode (Active)
- **Icon**: `👁` (Eye symbol)
- **Style**: 18px emoji
- **Tooltip**: "Switch to Visual Mode"
- **Background**: Blue highlight (#e6f3ff)
- **Border**: Blue border (#0066cc)
- **Meaning**: Click to return to visual editing mode

### Icon Toggle Animation
- Smooth transition between icons (0.2s ease)
- Icons scale and transform smoothly
- No jarring visual changes
- Maintains consistent button size

## Button States

### 1. Visual Mode (Inactive State)
```
┌─────────┐
│  </>    │  ← Shows code brackets
└─────────┘
```
- User is in visual editing mode
- Button indicates: "Click to view HTML code"

### 2. HTML Mode (Active State)
```
┌─────────┐
│   👁     │  ← Shows eye icon
└─────────┘
```
- User is in HTML code editing mode
- Button indicates: "Click to return to visual mode"
- Button has blue background to indicate active state

## Usage

### In Toolbar Configuration

```typescript
{
  type: 'button',
  command: 'toggleHtmlView',
  icon: 'code',
  title: 'Toggle HTML View'
  // Note: No 'label' property = icon-only button
}
```

### Icon-Only Button
- Removes the `label` property
- Shows only the icon
- Tooltip provides context on hover
- More compact toolbar design

## Implementation Details

### Icon Rendering Logic

```typescript
getIcon(): string {
  if (this.tool.command === 'toggleHtmlView') {
    return this.active 
      ? '<span style="font-size: 18px;">👁</span>'  // HTML mode
      : '<span style="font-size: 16px; font-weight: bold;">&lt;/&gt;</span>';  // Visual mode
  }
  // ... other icons
}
```

### Active State Detection

```typescript
isToolActive(tool: ToolbarTool): boolean {
  // ... other checks
  case 'toggleHtmlView':
    return (this.selectionState as any).htmlMode || false;
}
```

### Tooltip Logic

```typescript
getTitle(): string {
  if (this.tool.command === 'toggleHtmlView') {
    return this.active 
      ? 'Switch to Visual Mode' 
      : 'View HTML Code';
  }
  // ... other tooltips
}
```

## CSS Styling

### Button Base Styles
```scss
.wysiwyg-toolbar-button {
  min-width: 32px;
  height: 32px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}
```

### Active State Styles
```scss
.wysiwyg-toolbar-button--active {
  background-color: #e6f3ff;
  border-color: #0066cc;
  color: #0066cc;
}
```

### Icon Animation
```scss
.wysiwyg-toolbar-button__icon {
  transition: transform 0.2s ease;
  
  span {
    transition: all 0.2s ease;
  }
}
```

## User Experience

### Visual Feedback
1. **Hover**: Button background changes to light gray
2. **Click**: Button depresses slightly (1px translateY)
3. **Active**: Blue background indicates current mode
4. **Focus**: Blue outline for keyboard navigation

### Accessibility
- **ARIA Labels**: Descriptive aria-label based on state
- **Keyboard**: Full keyboard support (Tab, Enter, Space)
- **Tooltips**: Clear indication of button action
- **Screen Readers**: Announces state changes

### Intuitive Design
- Eye icon = "view" mode indicator
- Code brackets = "code" mode indicator
- Active state clearly shows you're in HTML mode
- No text needed - icons are self-explanatory

## Comparison with Froala

| Feature | Froala | This Implementation |
|---------|--------|-------------------|
| Icon-Only Button | ✅ | ✅ |
| Toggle Icon | ✅ | ✅ |
| Active State Visual | ✅ | ✅ |
| Smooth Transition | ✅ | ✅ |
| Contextual Tooltip | ✅ | ✅ |
| No Text Label | ✅ | ✅ |

## Examples

### Example 1: Minimal Toolbar with Code Toggle
```typescript
toolbarConfig: ToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    { type: 'button', command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' }
  ]
};
```

### Example 2: Full Toolbar with Code Toggle
```typescript
toolbarConfig: ToolbarConfig = {
  tools: [
    // ... formatting tools ...
    { type: 'dialog', command: 'insertImage', icon: 'insertImage', label: 'Insert Image' },
    { type: 'button', command: 'toggleHtmlView', icon: 'code', title: 'Toggle HTML View' },
    { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
    { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
  ]
};
```

## Benefits

### For Users
1. **Clean Interface**: More space for other toolbar buttons
2. **Clear Visual State**: Instantly see which mode you're in
3. **Intuitive Icons**: Eye = view, Code = edit HTML
4. **Quick Toggle**: Single click to switch modes

### For Developers
1. **Consistent Design**: Follows icon-only button pattern
2. **Easy Configuration**: Just omit the label property
3. **Flexible Styling**: CSS can be customized
4. **Accessible**: Built-in ARIA support

## Best Practices

### When to Use Icon-Only
✅ Common actions (bold, italic, undo, redo)
✅ When space is limited
✅ When icon meaning is obvious
✅ For toggle buttons with clear states

### When to Include Labels
❌ Complex or ambiguous actions
❌ When users need extra context
❌ For accessibility in certain contexts
❌ When targeting non-technical users

## Customization

### Custom Icons
You can customize the icons by modifying the icon map:

```typescript
// In toolbar-button.component.ts
if (this.tool.command === 'toggleHtmlView') {
  return this.active 
    ? '<span>📝</span>'  // Your custom "view" icon
    : '<span>⚡</span>'; // Your custom "code" icon
}
```

### Custom Colors
Override the active state colors in your CSS:

```scss
.wysiwyg-toolbar-button--active {
  background-color: #your-color;
  border-color: #your-border;
  color: #your-text;
}
```

### Custom Animations
Add custom transitions:

```scss
.wysiwyg-toolbar-button__icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: scale(1.1);
  }
}
```

## Troubleshooting

### Icon Not Showing
- **Check**: Ensure icon property is set to 'code'
- **Check**: Verify getIcon() method returns HTML

### Toggle Not Working
- **Check**: handleCommand includes 'toggleHtmlView' case
- **Check**: isHtmlMode state is being updated
- **Check**: Selection state includes htmlMode property

### Active State Not Displaying
- **Check**: isToolActive() returns true for htmlMode
- **Check**: CSS for --active modifier is loaded
- **Check**: Selection state is propagating correctly

## Future Enhancements

Potential improvements:
- [ ] Add rotation animation when toggling
- [ ] SVG icons for better scaling
- [ ] Icon set customization via config
- [ ] Animated icon transitions
- [ ] Custom icon templates per theme

## Summary

The Code toggle button has been enhanced to:
- ✅ Show only icons (no text labels)
- ✅ Toggle between `</>` (visual mode) and `👁` (HTML mode)
- ✅ Provide clear visual feedback with active states
- ✅ Include contextual tooltips
- ✅ Maintain full accessibility
- ✅ Smooth icon transitions

The button provides a clean, intuitive interface that clearly indicates the current editor mode and what will happen when clicked.
