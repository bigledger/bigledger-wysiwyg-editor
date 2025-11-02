# Table Tool Locations

This document shows where the table tool has been added throughout the codebase.

## ✅ Toolbar Configurations Updated

### 1. Default Toolbar (wysiwyg-editor.component.ts)
**Location**: `projects/bigldeger-wysiwyg-editor/src/lib/components/wysiwyg-editor/wysiwyg-editor.component.ts`

The default toolbar configuration includes the table tool:
```typescript
{ type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' }
```

### 2. Full-Featured Toolbar (toolbar-config demo)
**Location**: `src/app/demo/toolbar-config/toolbar-config.component.ts`

The full-featured toolbar configuration includes the table tool:
```typescript
{ type: 'dialog' as const, command: 'insertTable', icon: 'insertTable', label: 'Insert Table' }
```

**Demo Route**: `http://localhost:4200/toolbar`

### 3. Table Demo Toolbar
**Location**: `src/app/demo/table-demo/table-demo.component.ts`

The table demo has its own toolbar configuration with the table tool:
```typescript
{ type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' }
```

**Demo Route**: `http://localhost:4200/table`

### 4. Examples Documentation
**Location**: `projects/bigldeger-wysiwyg-editor/EXAMPLES.md`

The full-featured toolbar example includes the table tool:
```typescript
{ type: 'button', command: 'insertTable', icon: 'table', label: 'Insert Table' }
```

## 🎯 Where to See the Table Tool

### Demo Application Routes

1. **Table Demo** (Dedicated table feature demo)
   - URL: `http://localhost:4200/table`
   - Shows: Complete table functionality with examples
   - Toolbar: Includes table tool

2. **Toolbar Configuration Demo** (Full-featured toolbar)
   - URL: `http://localhost:4200/toolbar`
   - Shows: Full-featured toolbar section
   - Toolbar: Includes table tool

3. **Basic Usage Demo** (Uses default toolbar)
   - URL: `http://localhost:4200/basic`
   - Shows: Basic editor with default toolbar
   - Toolbar: Includes table tool (from default config)

4. **Advanced Demo** (Uses default toolbar)
   - URL: `http://localhost:4200/advanced`
   - Shows: Advanced features
   - Toolbar: Includes table tool (from default config)

## 📝 How to Add Table Tool to Your Toolbar

### Option 1: Use Default Toolbar
The default toolbar already includes the table tool. Just use the editor without custom toolbar config:

```typescript
<wysiwyg-editor [(ngModel)]="content"></wysiwyg-editor>
```

### Option 2: Custom Toolbar with Table Tool
Add the table tool to your custom toolbar configuration:

```typescript
toolbarConfig: ToolbarConfig = {
  tools: [
    { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
    { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
    // Add table tool
    { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
    // ... other tools
  ]
};
```

### Option 3: Copy Full-Featured Toolbar
Copy the full-featured toolbar configuration from:
- `src/app/demo/toolbar-config/toolbar-config.component.ts` (line 343)
- Or from `projects/bigldeger-wysiwyg-editor/EXAMPLES.md`

## 🔍 Table Tool Properties

```typescript
{
  type: 'dialog',              // Opens a dialog
  command: 'insertTable',      // Command name
  icon: 'insertTable',         // Icon identifier (⊞)
  label: 'Insert Table'        // Button label
}
```

## 🎨 Table Icon

The table tool uses the icon: **⊞** (U+229E SQUARED PLUS)

This is defined in:
- `projects/bigldeger-wysiwyg-editor/src/lib/components/toolbar/toolbar.component.ts`

```typescript
'insertTable': '⊞'
```

## 📦 Files Modified to Add Table Tool

1. ✅ `wysiwyg-editor.component.ts` - Default toolbar
2. ✅ `toolbar-config.component.ts` - Full-featured toolbar demo
3. ✅ `toolbar.component.ts` - Table icon mapping
4. ✅ `EXAMPLES.md` - Documentation example
5. ✅ `table-demo.component.ts` - Table demo toolbar

## 🚀 Quick Test

To verify the table tool is visible:

1. Start the app:
   ```bash
   npm start
   ```

2. Navigate to any of these routes:
   - `http://localhost:4200/` (home, then click any demo)
   - `http://localhost:4200/basic` (basic usage)
   - `http://localhost:4200/toolbar` (scroll to "Full-Featured Toolbar")
   - `http://localhost:4200/table` (dedicated table demo)

3. Look for the **⊞** icon in the toolbar

4. Click it to open the table dialog

## ✅ Verification Checklist

- [x] Default toolbar includes table tool
- [x] Full-featured toolbar includes table tool
- [x] Table demo toolbar includes table tool
- [x] Documentation examples updated
- [x] Table icon defined in toolbar component
- [x] All demos accessible via routes

## 📚 Related Documentation

- [TABLE_FEATURE.md](TABLE_FEATURE.md) - Complete feature documentation
- [TABLE_QUICK_START.md](TABLE_QUICK_START.md) - Quick start guide
- [TABLE_FEATURE_COMPLETE.md](TABLE_FEATURE_COMPLETE.md) - Implementation summary
