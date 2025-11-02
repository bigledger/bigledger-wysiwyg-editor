# Table Feature Documentation

## Overview

The table feature provides comprehensive table editing capabilities similar to Froala editor, allowing users to create, edit, and manipulate tables within the WYSIWYG editor.

## Features

### 1. Table Insertion
- **Visual Grid Picker**: Hover over a 10x10 grid to visually select table dimensions
- **Manual Input**: Enter exact number of rows and columns (up to 50 rows × 20 columns)
- **Header Row Option**: Optionally include a styled header row
- **Customizable Properties**:
  - Width (percentage or pixels)
  - Border width
  - Cell padding
  - Cell spacing
  - Table alignment (left, center, right)
  - CSS classes

### 2. Table Manipulation

#### Row Operations
- **Insert Row Above**: Add a new row above the current row
- **Insert Row Below**: Add a new row below the current row
- **Delete Row**: Remove the current row (prevents deletion of last row)

#### Column Operations
- **Insert Column Before**: Add a new column before the current column
- **Insert Column After**: Add a new column after the current column
- **Delete Column**: Remove the current column (prevents deletion of last column)

#### Table Operations
- **Delete Table**: Remove the entire table
- **Edit Table Properties**: Modify table-wide settings

### 3. Cell Operations

#### Cell Merging
- **Merge Cells**: Combine adjacent cells horizontally
- **Split Cell**: Divide merged cells back into individual cells
- Supports both horizontal (colspan) and vertical (rowspan) merging

#### Cell Formatting
- **Background Color**: Set cell background color
- **Text Alignment**: Left, center, right, or justify
- **Vertical Alignment**: Top, middle, or bottom
- **Cell Dimensions**: Set width and height

### 4. Nested Tables
- **Full Nesting Support**: Insert tables inside table cells
- **Independent Formatting**: Each nested table has its own properties
- **Unlimited Depth**: No limit on nesting levels (though practical limits apply)

## Usage

### Basic Table Insertion

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent } from 'bigldeger-wysiwyg-editor';

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
  
  toolbarConfig = {
    tools: [
      // ... other tools
      { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' }
    ]
  };
}
```

### Programmatic Table Insertion

```typescript
import { TableService, TableData } from 'bigldeger-wysiwyg-editor';

// Inject the table service
constructor(private tableService: TableService) {}

// Insert a table programmatically
insertTable() {
  const tableData: TableData = {
    rows: 3,
    columns: 4,
    width: '100%',
    border: 1,
    cellPadding: 8,
    hasHeader: true,
    align: 'center'
  };
  
  this.tableService.insertTable(tableData);
}
```

### Table Manipulation

```typescript
// Insert row above current row
this.tableService.insertRowAbove();

// Insert row below current row
this.tableService.insertRowBelow();

// Delete current row
this.tableService.deleteRow();

// Insert column before current column
this.tableService.insertColumnBefore();

// Insert column after current column
this.tableService.insertColumnAfter();

// Delete current column
this.tableService.deleteColumn();

// Delete entire table
this.tableService.deleteTable();
```

### Cell Operations

```typescript
// Merge cells
this.tableService.mergeCells();

// Split merged cell
this.tableService.splitCell();

// Set cell background color
this.tableService.setCellBackgroundColor('#e8f5e9');

// Set cell text alignment
this.tableService.setCellTextAlign('center');

// Set cell vertical alignment
this.tableService.setCellVerticalAlign('middle');
```

### Check Table Context

```typescript
// Check if cursor is inside a table
if (this.tableService.isInTable()) {
  console.log('Cursor is in a table');
}

// Get current table properties
const tableProps = this.tableService.getTableProperties();
if (tableProps) {
  console.log(`Table has ${tableProps.rows} rows and ${tableProps.columns} columns`);
}
```

## API Reference

### TableData Interface

```typescript
interface TableData {
  rows: number;                    // Number of rows
  columns: number;                 // Number of columns
  width?: string;                  // Table width (e.g., '100%', '500px')
  border?: number;                 // Border width in pixels
  cellPadding?: number;            // Cell padding in pixels
  cellSpacing?: number;            // Cell spacing in pixels
  align?: 'left' | 'center' | 'right';  // Table alignment
  cssClass?: string;               // CSS class name
  style?: string;                  // Inline styles
  hasHeader?: boolean;             // Include header row
}
```

### TableService Methods

#### Table Operations
- `insertTable(tableData: TableData): boolean` - Insert a new table
- `deleteTable(): boolean` - Delete the current table
- `getTableProperties(): TableData | null` - Get current table properties
- `updateTableProperties(tableData: Partial<TableData>): boolean` - Update table properties
- `isInTable(): boolean` - Check if cursor is in a table

#### Row Operations
- `insertRowAbove(): boolean` - Insert row above current row
- `insertRowBelow(): boolean` - Insert row below current row
- `deleteRow(): boolean` - Delete current row

#### Column Operations
- `insertColumnBefore(): boolean` - Insert column before current column
- `insertColumnAfter(): boolean` - Insert column after current column
- `deleteColumn(): boolean` - Delete current column

#### Cell Operations
- `mergeCells(): boolean` - Merge selected cells
- `splitCell(): boolean` - Split merged cell
- `setCellBackgroundColor(color: string): boolean` - Set cell background color
- `setCellTextAlign(align: 'left' | 'center' | 'right' | 'justify'): boolean` - Set cell text alignment
- `setCellVerticalAlign(align: 'top' | 'middle' | 'bottom'): boolean` - Set cell vertical alignment

## Keyboard Shortcuts

Currently, table operations are performed through the toolbar and dialog. Future versions may include:

- `Ctrl+Shift+T` - Insert table
- `Ctrl+Shift+R` - Insert row
- `Ctrl+Shift+C` - Insert column
- `Delete` - Delete selected row/column (when in table context)

## Styling

### Default Table Styles

Tables are created with the following default styles:
- Border: 1px solid #ddd
- Cell padding: 8px
- Border collapse: collapse
- Minimum cell width: 50px
- Minimum cell height: 30px

### Header Row Styles

When header row is enabled:
- Font weight: bold
- Background color: #f5f5f5

### Custom Styling

You can customize table appearance using:

1. **CSS Classes**: Add custom classes via the table dialog
2. **Inline Styles**: Set inline styles programmatically
3. **Global CSS**: Override default styles in your application CSS

```css
/* Example: Custom table styling */
.my-custom-table {
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.my-custom-table th {
  background-color: #4CAF50;
  color: white;
}

.my-custom-table td {
  padding: 12px;
}
```

## Best Practices

### 1. Table Size
- Keep tables reasonably sized (recommended max: 20 rows × 10 columns)
- Use pagination or scrolling for large datasets
- Consider responsive design for mobile devices

### 2. Nested Tables
- Use sparingly - nested tables can be complex to edit
- Limit nesting depth to 2-3 levels maximum
- Consider alternative layouts (CSS Grid, Flexbox) for complex layouts

### 3. Accessibility
- Always use header rows for data tables
- Provide meaningful content in cells
- Avoid using tables for layout purposes

### 4. Performance
- Large tables may impact editor performance
- Consider lazy loading for tables with many rows
- Use the performance monitoring features to track impact

## Examples

### Simple Data Table

```html
<table style="width: 100%; border-collapse: collapse;">
  <tbody>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Name</th>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Email</th>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">John Doe</td>
      <td style="border: 1px solid #ddd; padding: 8px;">john@example.com</td>
    </tr>
  </tbody>
</table>
```

### Nested Table

```html
<table style="width: 100%; border-collapse: collapse;">
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Outer Cell</td>
      <td style="border: 1px solid #ddd; padding: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="border: 1px solid #999; padding: 4px;">Inner 1</td>
              <td style="border: 1px solid #999; padding: 4px;">Inner 2</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
```

### Styled Table with Merged Cells

```html
<table style="width: 100%; border-collapse: collapse;">
  <tbody>
    <tr>
      <th colspan="3" style="border: 1px solid #ddd; padding: 8px; background: #4CAF50; color: white; text-align: center;">
        Product Comparison
      </th>
    </tr>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Feature</th>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Basic</th>
      <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Premium</th>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Storage</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">10 GB</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background: #e8f5e9;">100 GB</td>
    </tr>
  </tbody>
</table>
```

## Troubleshooting

### Table Not Inserting
- Ensure cursor is in a valid position (not inside another element that doesn't allow tables)
- Check that the editor is not in readonly mode
- Verify table data is valid (rows > 0, columns > 0)

### Cell Operations Not Working
- Ensure cursor is inside a table cell
- Check that the table structure is valid (no malformed HTML)
- Verify the operation is allowed (e.g., can't delete last row/column)

### Nested Tables Issues
- Ensure parent cell has enough space
- Check for conflicting styles
- Verify proper HTML structure

## Future Enhancements

Planned features for future releases:
- Context menu for table operations
- Drag-to-resize rows and columns
- Multi-cell selection for batch operations
- Table templates and presets
- Import/export table data (CSV, JSON)
- Advanced cell formatting (borders, padding per cell)
- Table sorting and filtering
- Accessibility improvements (ARIA labels, keyboard navigation)

## Migration from Froala

If you're migrating from Froala editor, the table feature provides similar functionality:

| Froala Feature | BigLedger WYSIWYG | Notes |
|----------------|-------------------|-------|
| Insert Table | ✓ | Visual grid picker + manual input |
| Insert Row | ✓ | Above and below options |
| Insert Column | ✓ | Before and after options |
| Delete Row/Column | ✓ | With safety checks |
| Merge Cells | ✓ | Horizontal merging supported |
| Split Cells | ✓ | Splits merged cells |
| Cell Background | ✓ | Color picker integration |
| Cell Alignment | ✓ | Text and vertical alignment |
| Nested Tables | ✓ | Full support |
| Table Styles | ✓ | CSS classes and inline styles |
| Context Menu | Planned | Coming in future release |
| Resize Handles | Planned | Coming in future release |

## Support

For issues, questions, or feature requests related to the table feature:
- GitHub Issues: [Report an issue](https://github.com/bigledger/bigldeger-wysiwyg-editor/issues)
- Documentation: [Full API docs](https://github.com/bigledger/bigldeger-wysiwyg-editor#readme)
- Discussions: [Community forum](https://github.com/bigledger/bigldeger-wysiwyg-editor/discussions)
