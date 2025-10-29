# Table Feature

## Quick Links

- 📖 [Full Documentation](../../TABLE_FEATURE.md)
- 🚀 [Quick Start Guide](../../TABLE_QUICK_START.md)
- 📋 [Implementation Summary](../../TABLE_IMPLEMENTATION_SUMMARY.md)
- 🎯 [Demo Application](../../src/app/demo/table-demo/)

## Overview

The table feature provides comprehensive table editing capabilities similar to Froala editor:

- ✅ Insert tables with visual grid picker
- ✅ Add/delete rows and columns
- ✅ Merge and split cells
- ✅ Cell formatting (background, alignment)
- ✅ Nested tables support
- ✅ Table properties (width, border, padding)

## Quick Example

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent, ToolbarConfig } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig">
    </wysiwyg-editor>
  `
})
export class ExampleComponent {
  content = '';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
      // ... other tools
    ]
  };
}
```

## Key Features

### Table Insertion
- Visual 10×10 grid picker
- Manual row/column input
- Customizable properties
- Header row option

### Table Manipulation
- Insert/delete rows (above/below)
- Insert/delete columns (before/after)
- Delete entire table
- Edit table properties

### Cell Operations
- Merge cells horizontally
- Split merged cells
- Set background color
- Text alignment (left, center, right, justify)
- Vertical alignment (top, middle, bottom)

### Nested Tables
- Insert tables inside table cells
- Independent formatting
- Unlimited nesting depth

## API

### TableService Methods

```typescript
// Table operations
insertTable(tableData: TableData): boolean
deleteTable(): boolean
getTableProperties(): TableData | null
updateTableProperties(tableData: Partial<TableData>): boolean
isInTable(): boolean

// Row operations
insertRowAbove(): boolean
insertRowBelow(): boolean
deleteRow(): boolean

// Column operations
insertColumnBefore(): boolean
insertColumnAfter(): boolean
deleteColumn(): boolean

// Cell operations
mergeCells(): boolean
splitCell(): boolean
setCellBackgroundColor(color: string): boolean
setCellTextAlign(align: 'left' | 'center' | 'right' | 'justify'): boolean
setCellVerticalAlign(align: 'top' | 'middle' | 'bottom'): boolean
```

## Demo

Run the demo application:

```bash
npm start
```

Navigate to: `http://localhost:4200/table`

## Documentation

- **Complete Guide**: [TABLE_FEATURE.md](../../TABLE_FEATURE.md)
- **Quick Start**: [TABLE_QUICK_START.md](../../TABLE_QUICK_START.md)
- **Implementation Details**: [TABLE_IMPLEMENTATION_SUMMARY.md](../../TABLE_IMPLEMENTATION_SUMMARY.md)

## Support

- [GitHub Issues](https://github.com/bigledger/bigldeger-wysiwyg-editor/issues)
- [Documentation](https://github.com/bigledger/bigldeger-wysiwyg-editor#readme)
- [Discussions](https://github.com/bigledger/bigldeger-wysiwyg-editor/discussions)
