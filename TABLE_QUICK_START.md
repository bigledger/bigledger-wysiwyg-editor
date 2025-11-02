# Table Feature - Quick Start Guide

## Installation

The table feature is included in the BigLedger WYSIWYG Editor. No additional installation required.

```bash
npm install bigldeger-wysiwyg-editor
```

## Basic Setup

### 1. Add Table Button to Toolbar

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent, ToolbarConfig } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-my-editor',
  standalone: true,
  imports: [WysiwygEditorComponent],
  template: `
    <wysiwyg-editor 
      [(ngModel)]="content"
      [toolbarConfig]="toolbarConfig">
    </wysiwyg-editor>
  `
})
export class MyEditorComponent {
  content = '';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      // Add the table button
      { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
      // ... other tools
    ]
  };
}
```

### 2. Using the Table Dialog

1. Click the table icon (⊞) in the toolbar
2. Hover over the grid to select table size (or enter manually)
3. Configure options:
   - Width (e.g., "100%" or "500px")
   - Border width
   - Cell padding
   - Alignment
   - Header row (checkbox)
4. Click "Insert"

## Common Operations

### Insert Table Programmatically

```typescript
import { TableService, TableData } from 'bigldeger-wysiwyg-editor';

constructor(private tableService: TableService) {}

insertMyTable() {
  const tableData: TableData = {
    rows: 3,
    columns: 4,
    width: '100%',
    border: 1,
    cellPadding: 8,
    hasHeader: true
  };
  
  this.tableService.insertTable(tableData);
}
```

### Add/Remove Rows and Columns

```typescript
// Add row below current row
this.tableService.insertRowBelow();

// Add column after current column
this.tableService.insertColumnAfter();

// Delete current row
this.tableService.deleteRow();

// Delete current column
this.tableService.deleteColumn();
```

### Cell Formatting

```typescript
// Set cell background color
this.tableService.setCellBackgroundColor('#e8f5e9');

// Center align cell content
this.tableService.setCellTextAlign('center');

// Vertical align to middle
this.tableService.setCellVerticalAlign('middle');
```

### Merge and Split Cells

```typescript
// Merge cells (increases colspan)
this.tableService.mergeCells();

// Split merged cell
this.tableService.splitCell();
```

## Example: Complete Table Implementation

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WysiwygEditorComponent, TableService, ToolbarConfig } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-table-example',
  standalone: true,
  imports: [CommonModule, FormsModule, WysiwygEditorComponent],
  template: `
    <div>
      <h2>Table Editor</h2>
      
      <!-- Editor -->
      <wysiwyg-editor 
        [(ngModel)]="content"
        [toolbarConfig]="toolbarConfig"
        [height]="'400px'">
      </wysiwyg-editor>
      
      <!-- Quick Actions -->
      <div class="actions">
        <button (click)="insertSampleTable()">Insert Sample Table</button>
        <button (click)="addRow()">Add Row</button>
        <button (click)="addColumn()">Add Column</button>
        <button (click)="formatCell()">Format Cell</button>
      </div>
      
      <!-- Output -->
      <h3>HTML Output:</h3>
      <pre>{{ content }}</pre>
    </div>
  `,
  styles: [`
    .actions {
      margin: 20px 0;
      display: flex;
      gap: 10px;
    }
    
    button {
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:hover {
      background: #45a049;
    }
    
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
  `]
})
export class TableExampleComponent {
  content = '<p>Click "Insert Sample Table" to get started!</p>';
  
  toolbarConfig: ToolbarConfig = {
    tools: [
      { type: 'button', command: 'bold', icon: 'bold', label: 'Bold' },
      { type: 'button', command: 'italic', icon: 'italic', label: 'Italic' },
      { type: 'button', command: 'underline', icon: 'underline', label: 'Underline' },
      { type: 'dialog', command: 'insertTable', icon: 'insertTable', label: 'Insert Table' },
      { type: 'button', command: 'undo', icon: 'undo', label: 'Undo' },
      { type: 'button', command: 'redo', icon: 'redo', label: 'Redo' }
    ]
  };
  
  constructor(private tableService: TableService) {}
  
  insertSampleTable() {
    this.tableService.insertTable({
      rows: 3,
      columns: 3,
      width: '100%',
      border: 1,
      cellPadding: 8,
      hasHeader: true,
      align: 'center'
    });
  }
  
  addRow() {
    if (this.tableService.isInTable()) {
      this.tableService.insertRowBelow();
    } else {
      alert('Please click inside a table first');
    }
  }
  
  addColumn() {
    if (this.tableService.isInTable()) {
      this.tableService.insertColumnAfter();
    } else {
      alert('Please click inside a table first');
    }
  }
  
  formatCell() {
    if (this.tableService.isInTable()) {
      this.tableService.setCellBackgroundColor('#e8f5e9');
      this.tableService.setCellTextAlign('center');
    } else {
      alert('Please click inside a table cell first');
    }
  }
}
```

## Nested Tables Example

```typescript
// First, insert outer table
this.tableService.insertTable({
  rows: 2,
  columns: 2,
  width: '100%',
  border: 1,
  cellPadding: 8
});

// Then click inside a cell and insert inner table
// (User must position cursor in the desired cell)
this.tableService.insertTable({
  rows: 2,
  columns: 2,
  width: '100%',
  border: 1,
  cellPadding: 4
});
```

## Tips & Tricks

### 1. Responsive Tables
```typescript
// Use percentage width for responsive tables
tableData.width = '100%';
```

### 2. Styled Headers
```typescript
// Enable header row for better semantics
tableData.hasHeader = true;
```

### 3. Custom Styling
```typescript
// Add custom CSS class
tableData.cssClass = 'my-custom-table';
```

Then in your CSS:
```css
.my-custom-table {
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.my-custom-table th {
  background-color: #4CAF50;
  color: white;
}
```

### 4. Check Table Context
```typescript
// Before performing table operations
if (this.tableService.isInTable()) {
  // Safe to perform table operations
  this.tableService.insertRowBelow();
} else {
  // Show message to user
  console.log('Please click inside a table first');
}
```

### 5. Get Table Info
```typescript
const tableProps = this.tableService.getTableProperties();
if (tableProps) {
  console.log(`Table: ${tableProps.rows}x${tableProps.columns}`);
  console.log(`Width: ${tableProps.width}`);
}
```

## Demo

Run the demo application to see the table feature in action:

```bash
npm start
```

Then navigate to: `http://localhost:4200/table`

## Next Steps

- Read the [full documentation](TABLE_FEATURE.md)
- Check out the [API reference](projects/bigldeger-wysiwyg-editor/API.md)
- Explore [examples](projects/bigldeger-wysiwyg-editor/EXAMPLES.md)
- View the [demo application](src/app/demo/table-demo/)

## Support

Need help? 
- [GitHub Issues](https://github.com/bigledger/bigldeger-wysiwyg-editor/issues)
- [Documentation](https://github.com/bigledger/bigldeger-wysiwyg-editor#readme)
- [Community Discussions](https://github.com/bigledger/bigldeger-wysiwyg-editor/discussions)
