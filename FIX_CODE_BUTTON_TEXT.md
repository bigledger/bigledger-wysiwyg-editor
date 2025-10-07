# Fix: Code Button Showing Text Label

## Issue
The Code toggle button was still showing the text "Code" instead of showing only the icon.

## Root Cause
The toolbar component (`toolbar.component.ts`) has its own `getToolIcon()` method that was missing:
1. The 'code' icon mapping
2. The dynamic toggle logic for the toggleHtmlView command

## Solution

### Updated toolbar.component.ts

#### 1. Enhanced getToolIcon() Method
Added dynamic icon logic for the toggleHtmlView command:

```typescript
getToolIcon(tool: ToolbarTool): string {
  if (!tool.icon) {
    return '';
  }

  // Special handling for toggleHtmlView - show different icon based on active state
  if (tool.command === 'toggleHtmlView') {
    const isActive = this.isToolActive(tool);
    return isActive 
      ? '<span style="font-size: 18px;">👁</span>'  // HTML mode
      : '<span style="font-size: 16px; font-weight: bold;">&lt;/&gt;</span>';  // Visual mode
  }

  // ... icon map includes:
  'code': '<span style="font-size: 16px; font-weight: bold;">&lt;/&gt;</span>',
  // ... other icons
}
```

#### 2. Enhanced getToolTitle() Method
Added contextual tooltips:

```typescript
getToolTitle(tool: ToolbarTool): string {
  // Special handling for toggleHtmlView
  if (tool.command === 'toggleHtmlView') {
    const isActive = this.isToolActive(tool);
    return isActive ? 'Switch to Visual Mode' : 'View HTML Code';
  }
  // ... rest of logic
}
```

## Why It Works Now

### Icon-Only Display Logic
The toolbar template uses this condition:
```html
<span *ngIf="tool.label && !tool.icon">
  {{ tool.label }}
</span>
```

Since the tool now has:
- ✅ `icon: 'code'` property (truthy)
- ❌ NO `label` property (removed from config)

The label text is NOT displayed because:
- `tool.label` is `undefined` (falsy)
- Even if there was a label, `!tool.icon` would be false

### Result
- Button shows only the icon: `</>` or `👁`
- No text "Code" is displayed
- Tooltip provides context on hover
- Active state shows blue background

## Files Modified

1. **toolbar.component.ts**
   - Added dynamic icon logic to `getToolIcon()`
   - Added 'code' to icon map
   - Added contextual tooltips to `getToolTitle()`

2. **toolbar-config.component.ts** (already done)
   - Removed `label` property from all toggleHtmlView buttons

3. **wysiwyg-editor.component.ts** (already done)
   - Removed `label` from default toolbar config

## Verification

To verify the fix is working:

1. ✅ Button shows `</>` icon (no text)
2. ✅ Hover shows tooltip: "View HTML Code"
3. ✅ Click button to switch to HTML mode
4. ✅ Button changes to `👁` icon (no text)
5. ✅ Button has blue background (active state)
6. ✅ Hover shows tooltip: "Switch to Visual Mode"
7. ✅ Click again to return to visual mode
8. ✅ Button changes back to `</>` icon

## Technical Details

### Why Two Components?
The editor uses both:
- **toolbar.component.ts**: Main toolbar component that renders all buttons
- **toolbar-button.component.ts**: Individual button component (not used directly here)

The toolbar component renders buttons directly in its template, so we needed to update its `getToolIcon()` method.

### Icon Rendering
Icons are rendered using `[innerHTML]` binding:
```html
<span 
  *ngIf="tool.icon" 
  class="wysiwyg-toolbar__icon"
  [innerHTML]="getToolIcon(tool)">
</span>
```

This allows HTML content (like styled spans) to be rendered as icons.

## Before vs After

### Before
```
┌──────────┐
│ </> Code │  ← Shows icon + text
└──────────┘
```

### After
```
┌─────┐
│ </> │  ← Shows only icon
└─────┘

(Click to toggle)

┌─────┐
│  👁  │  ← Shows only icon (blue background)
└─────┘
```

## Summary

The fix ensures that:
- ✅ Only icons are displayed (no text labels)
- ✅ Icons toggle dynamically based on mode
- ✅ Tooltips provide context
- ✅ Active state shows visual feedback
- ✅ Consistent with Froala Editor behavior
