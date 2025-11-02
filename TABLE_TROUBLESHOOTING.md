# Table Feature Troubleshooting Guide

## Issue: Table Not Inserting After Selecting Rows/Columns

### ✅ FIXED

**Problem**: When clicking the table icon and selecting rows/columns, nothing was being inserted into the editor.

**Root Cause**: The `showTableDialog()` method and related table dialog handling methods were missing from the `wysiwyg-editor.component.ts` file.

**Solution**: Added the following methods to `wysiwyg-editor.component.ts`:
- `showTableDialog()` - Opens the table dialog
- `onTableInserted()` - Handles table insertion
- `onTableDialogClosed()` - Handles dialog close event
- `closeTableDialog()` - Cleans up dialog reference

### How to Verify the Fix

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Navigate to any demo**:
   - Table Demo: `http://localhost:4200/table`
   - Toolbar Config: `http://localhost:4200/toolbar`
   - Basic Usage: `http://localhost:4200/basic`

3. **Test table insertion**:
   - Click the table icon (⊞) in the toolbar
   - The table dialog should open
   - Hover over the grid to select size (e.g., 3×4)
   - Or enter rows/columns manually
   - Click "Insert" button
   - **Table should now appear in the editor!**

### Expected Behavior

When you insert a table, you should see:
- A table with the specified number of rows and columns
- Default styling (1px border, 8px padding)
- If header row was checked, the first row will be styled as a header
- The table should be editable (you can click inside cells and type)

### Common Issues and Solutions

#### 1. Table Dialog Not Opening
**Symptoms**: Clicking the table icon does nothing

**Check**:
- Is the table icon visible in the toolbar?
- Check browser console for errors
- Verify `handleCommand` has the `insertTable` case

**Solution**: The table icon should trigger `showTableDialog()` method

#### 2. Table Dialog Opens But Insert Button Disabled
**Symptoms**: Dialog opens but "Insert" button is grayed out

**Check**:
- Are rows and columns > 0?
- Are rows ≤ 50 and columns ≤ 20?

**Solution**: Ensure valid table dimensions

#### 3. Table Inserts But Not Visible
**Symptoms**: Dialog closes but no table appears

**Check**:
- Check the HTML output (use "Toggle HTML View" button)
- Look for `<table>` tags in the HTML
- Check if table has proper styling

**Solution**: Table should have default styles applied

#### 4. Cannot Edit Table Cells
**Symptoms**: Table appears but cells are not editable

**Check**:
- Is the editor in readonly mode?
- Click inside a cell - cursor should appear

**Solution**: Ensure editor is not readonly

### Debug Steps

1. **Check Console**:
   - Open browser DevTools (F12)
   - Look for any JavaScript errors
   - Check for "Failed to load table dialog" messages

2. **Verify Table Service**:
   ```typescript
   // In browser console
   // Check if table service is available
   console.log('Table service loaded');
   ```

3. **Check HTML Output**:
   - Click "Toggle HTML View" button (</> icon)
   - Look for `<table>` tags
   - Verify table structure

4. **Test Programmatically**:
   ```typescript
   // In your component
   constructor(private tableService: TableService) {}
   
   testTable() {
     const success = this.tableService.insertTable({
       rows: 3,
       columns: 3,
       width: '100%',
       border: 1,
       cellPadding: 8
     });
     console.log('Table inserted:', success);
   }
   ```

### Files Involved

The table feature requires these files to work correctly:

1. **Table Service**: `table.service.ts`
   - Handles table insertion and manipulation

2. **Table Dialog**: `table-dialog.component.ts`
   - UI for table configuration

3. **Command Service**: `command.service.ts`
   - Integrates table commands

4. **WYSIWYG Editor**: `wysiwyg-editor.component.ts`
   - Handles dialog lifecycle and events

5. **Lazy Loader**: `lazy-loader.service.ts`
   - Loads table dialog on demand

### Verification Checklist

- [x] Table icon (⊞) visible in toolbar
- [x] Clicking icon opens table dialog
- [x] Grid picker works (hover to select)
- [x] Manual input works (type rows/columns)
- [x] Insert button enabled when valid
- [x] Table appears in editor after insert
- [x] Table has proper styling
- [x] Cells are editable
- [x] HTML output contains `<table>` tags

### Still Having Issues?

If the table feature still doesn't work:

1. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

2. **Rebuild the library**:
   ```bash
   npm run build:lib
   ```

3. **Restart the dev server**:
   ```bash
   npm start
   ```

4. **Check for TypeScript errors**:
   ```bash
   npm run build
   ```

5. **Verify all files are saved**:
   - Check that all modified files are saved
   - Look for unsaved indicators in your editor

### Example: Working Table Insertion

```typescript
import { Component } from '@angular/core';
import { WysiwygEditorComponent, TableService } from 'bigldeger-wysiwyg-editor';

@Component({
  selector: 'app-test',
  template: `
    <wysiwyg-editor [(ngModel)]="content"></wysiwyg-editor>
    <button (click)="insertTestTable()">Insert Test Table</button>
  `
})
export class TestComponent {
  content = '';
  
  constructor(private tableService: TableService) {}
  
  insertTestTable() {
    // This should insert a 3x3 table
    this.tableService.insertTable({
      rows: 3,
      columns: 3,
      width: '100%',
      border: 1,
      cellPadding: 8,
      hasHeader: true
    });
  }
}
```

### Success Indicators

When the table feature is working correctly:

1. ✅ Table icon appears in toolbar
2. ✅ Dialog opens when icon is clicked
3. ✅ Grid picker highlights cells on hover
4. ✅ Size label updates (e.g., "3 × 4")
5. ✅ Insert button is enabled
6. ✅ Dialog closes after clicking Insert
7. ✅ Table appears in editor
8. ✅ Table has visible borders
9. ✅ Cells are clickable and editable
10. ✅ HTML view shows proper `<table>` structure

### Contact

If you continue to experience issues:
- Check the [documentation](TABLE_FEATURE.md)
- Review the [quick start guide](TABLE_QUICK_START.md)
- Open an issue on GitHub
