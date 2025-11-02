import { Injectable } from '@angular/core';
import { TableData, TableCellData, TableSelection } from '../models/table.interface';
import { ErrorHandlerService } from './error-handler.service';

/**
 * Service for table operations in the editor
 */
@Injectable({
  providedIn: 'root'
})
export class TableService {
  constructor(private errorHandlerService: ErrorHandlerService) {}

  /**
   * Insert a new table at the current cursor position
   */
  insertTable(tableData: TableData): boolean {
    try {
      console.log('TableService: insertTable called with data:', tableData);
      const table = this.createTable(tableData);
      console.log('TableService: table element created:', table);
      const result = this.insertTableAtCursor(table);
      console.log('TableService: insertTableAtCursor result:', result);
      return result;
    } catch (error) {
      console.error('TableService: Error in insertTable:', error);
      this.errorHandlerService.handleCommandError('insertTable', { tableData }, false);
      return false;
    }
  }

  /**
   * Create a table element from table data
   */
  private createTable(tableData: TableData): HTMLTableElement {
    const table = document.createElement('table');
    
    // Set table attributes
    if (tableData.width) {
      table.style.width = tableData.width;
    }
    if (tableData.border !== undefined) {
      table.setAttribute('border', tableData.border.toString());
    }
    if (tableData.cellPadding !== undefined) {
      table.setAttribute('cellpadding', tableData.cellPadding.toString());
    }
    if (tableData.cellSpacing !== undefined) {
      table.setAttribute('cellspacing', tableData.cellSpacing.toString());
    }
    if (tableData.align) {
      table.style.marginLeft = tableData.align === 'center' ? 'auto' : '0';
      table.style.marginRight = tableData.align === 'center' || tableData.align === 'right' ? 'auto' : '0';
    }
    if (tableData.cssClass) {
      table.className = tableData.cssClass;
    }
    if (tableData.style) {
      table.setAttribute('style', tableData.style);
    }

    // Default styles
    table.style.borderCollapse = 'collapse';
    if (!tableData.border) {
      table.style.border = '1px solid #ddd';
    }

    // Create table body
    const tbody = document.createElement('tbody');
    
    // Create rows
    for (let i = 0; i < tableData.rows; i++) {
      const row = document.createElement('tr');
      
      // Create cells
      for (let j = 0; j < tableData.columns; j++) {
        const cell = tableData.hasHeader && i === 0 
          ? document.createElement('th') 
          : document.createElement('td');
        
        cell.innerHTML = '&nbsp;';
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.minWidth = '50px';
        cell.style.minHeight = '30px';
        
        if (tableData.hasHeader && i === 0) {
          cell.style.fontWeight = 'bold';
          cell.style.backgroundColor = '#f5f5f5';
        }
        
        row.appendChild(cell);
      }
      
      tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    return table;
  }

  /**
   * Insert table at cursor position
   */
  private insertTableAtCursor(table: HTMLTableElement): boolean {
    console.log('TableService: insertTableAtCursor called');
    
    // Find the contenteditable element
    const editableElement = document.querySelector('[contenteditable="true"]') as HTMLElement;
    
    console.log('TableService: editableElement found:', editableElement);
    
    if (!editableElement) {
      console.error('TableService: No contenteditable element found');
      return false;
    }

    const selection = window.getSelection();
    console.log('TableService: selection:', selection);
    console.log('TableService: selection.rangeCount:', selection?.rangeCount);
    console.log('TableService: selection.anchorNode:', selection?.anchorNode);
    
    // If no selection or selection is not in the editable element, append to end
    if (!selection || selection.rangeCount === 0 || !editableElement.contains(selection.anchorNode)) {
      console.log('TableService: No valid selection, appending to end of editor');
      
      // Append to the end of the editable element
      const br1 = document.createElement('br');
      const br2 = document.createElement('br');
      editableElement.appendChild(br1);
      editableElement.appendChild(table);
      editableElement.appendChild(br2);
      
      console.log('TableService: Table appended to editor');
      console.log('TableService: Editor innerHTML:', editableElement.innerHTML);
      
      // Set cursor after the table
      const range = document.createRange();
      range.setStartAfter(br2);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Trigger input event to update the editor
      editableElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('TableService: Input event dispatched');
      return true;
    }

    try {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Insert line break before table for better UX
      const brBefore = document.createElement('br');
      range.insertNode(brBefore);
      
      // Insert table
      range.insertNode(table);
      
      // Insert line break after table
      const brAfter = document.createElement('br');
      range.setStartAfter(table);
      range.insertNode(brAfter);
      
      // Move cursor after table
      range.setStartAfter(brAfter);
      range.setEndAfter(brAfter);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event to update the editor
      editableElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      return true;
    } catch (error) {
      console.error('Error inserting table:', error);
      return false;
    }
  }

  /**
   * Get the currently selected table
   */
  getSelectedTable(): TableSelection | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let element: Node | null = selection.anchorNode;
    
    // Traverse up to find table-related elements
    while (element && element.nodeType !== Node.ELEMENT_NODE) {
      element = element.parentNode;
    }

    let cell: HTMLTableCellElement | undefined;
    let row: HTMLTableRowElement | undefined;
    let table: HTMLTableElement | undefined;

    while (element) {
      const tagName = (element as Element).tagName;
      
      if (tagName === 'TD' || tagName === 'TH') {
        cell = element as HTMLTableCellElement;
      } else if (tagName === 'TR') {
        row = element as HTMLTableRowElement;
      } else if (tagName === 'TABLE') {
        table = element as HTMLTableElement;
        break;
      }
      
      element = element.parentNode;
    }

    if (!table) {
      return null;
    }

    return {
      table,
      cell,
      row,
      rowIndex: row ? row.rowIndex : undefined,
      cellIndex: cell ? cell.cellIndex : undefined
    };
  }

  /**
   * Insert a row above the current row
   */
  insertRowAbove(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.row) {
        return false;
      }

      const newRow = this.createRow(selection.row.cells.length);
      selection.row.parentNode!.insertBefore(newRow, selection.row);
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertRowAbove', {}, false);
      return false;
    }
  }

  /**
   * Insert a row below the current row
   */
  insertRowBelow(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.row) {
        return false;
      }

      const newRow = this.createRow(selection.row.cells.length);
      
      if (selection.row.nextSibling) {
        selection.row.parentNode!.insertBefore(newRow, selection.row.nextSibling);
      } else {
        selection.row.parentNode!.appendChild(newRow);
      }
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertRowBelow', {}, false);
      return false;
    }
  }

  /**
   * Create a new table row
   */
  private createRow(cellCount: number): HTMLTableRowElement {
    const row = document.createElement('tr');
    
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('td');
      cell.innerHTML = '&nbsp;';
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '8px';
      cell.style.minWidth = '50px';
      cell.style.minHeight = '30px';
      row.appendChild(cell);
    }
    
    return row;
  }

  /**
   * Delete the current row
   */
  deleteRow(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.row) {
        return false;
      }

      const table = selection.table;
      const tbody = selection.row.parentNode as HTMLTableSectionElement;
      
      // Don't delete if it's the last row
      if (tbody.rows.length <= 1) {
        return false;
      }

      tbody.removeChild(selection.row);
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('deleteRow', {}, false);
      return false;
    }
  }

  /**
   * Insert a column before the current column
   */
  insertColumnBefore(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || selection.cellIndex === undefined) {
        return false;
      }

      const table = selection.table;
      const cellIndex = selection.cellIndex;
      
      // Insert cell in each row
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const newCell = document.createElement('td');
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #ddd';
        newCell.style.padding = '8px';
        newCell.style.minWidth = '50px';
        newCell.style.minHeight = '30px';
        
        if (row.cells[cellIndex]) {
          row.insertBefore(newCell, row.cells[cellIndex]);
        } else {
          row.appendChild(newCell);
        }
      });
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertColumnBefore', {}, false);
      return false;
    }
  }

  /**
   * Insert a column after the current column
   */
  insertColumnAfter(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || selection.cellIndex === undefined) {
        return false;
      }

      const table = selection.table;
      const cellIndex = selection.cellIndex;
      
      // Insert cell in each row
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const newCell = document.createElement('td');
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #ddd';
        newCell.style.padding = '8px';
        newCell.style.minWidth = '50px';
        newCell.style.minHeight = '30px';
        
        if (row.cells[cellIndex + 1]) {
          row.insertBefore(newCell, row.cells[cellIndex + 1]);
        } else {
          row.appendChild(newCell);
        }
      });
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('insertColumnAfter', {}, false);
      return false;
    }
  }

  /**
   * Delete the current column
   */
  deleteColumn(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || selection.cellIndex === undefined) {
        return false;
      }

      const table = selection.table;
      const cellIndex = selection.cellIndex;
      
      // Check if it's the last column
      const firstRow = table.querySelector('tr');
      if (!firstRow || firstRow.cells.length <= 1) {
        return false;
      }

      // Delete cell from each row
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        if (row.cells[cellIndex]) {
          row.deleteCell(cellIndex);
        }
      });
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('deleteColumn', {}, false);
      return false;
    }
  }

  /**
   * Delete the entire table
   */
  deleteTable(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection) {
        return false;
      }

      selection.table.remove();
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('deleteTable', {}, false);
      return false;
    }
  }

  /**
   * Merge selected cells
   */
  mergeCells(): boolean {
    try {
      // This is a simplified version - full implementation would need to track selected cells
      const selection = this.getSelectedTable();
      if (!selection || !selection.cell) {
        return false;
      }

      // For now, just increase colspan
      const currentColspan = parseInt(selection.cell.getAttribute('colspan') || '1', 10);
      selection.cell.setAttribute('colspan', (currentColspan + 1).toString());
      
      // Remove next cell
      const nextCell = selection.cell.nextElementSibling;
      if (nextCell) {
        nextCell.remove();
      }
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('mergeCells', {}, false);
      return false;
    }
  }

  /**
   * Split merged cell
   */
  splitCell(): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.cell) {
        return false;
      }

      const cell = selection.cell;
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

      if (colspan > 1) {
        // Split horizontally
        cell.setAttribute('colspan', '1');
        
        // Add new cells
        for (let i = 1; i < colspan; i++) {
          const newCell = document.createElement('td');
          newCell.innerHTML = '&nbsp;';
          newCell.style.border = '1px solid #ddd';
          newCell.style.padding = '8px';
          
          if (cell.nextSibling) {
            cell.parentNode!.insertBefore(newCell, cell.nextSibling);
          } else {
            cell.parentNode!.appendChild(newCell);
          }
        }
      } else if (rowspan > 1) {
        // Split vertically
        cell.setAttribute('rowspan', '1');
        
        // Add cells in rows below
        const row = selection.row!;
        const cellIndex = selection.cellIndex!;
        let currentRow = row.nextElementSibling as HTMLTableRowElement;
        
        for (let i = 1; i < rowspan && currentRow; i++) {
          const newCell = document.createElement('td');
          newCell.innerHTML = '&nbsp;';
          newCell.style.border = '1px solid #ddd';
          newCell.style.padding = '8px';
          
          if (currentRow.cells[cellIndex]) {
            currentRow.insertBefore(newCell, currentRow.cells[cellIndex]);
          } else {
            currentRow.appendChild(newCell);
          }
          
          currentRow = currentRow.nextElementSibling as HTMLTableRowElement;
        }
      }
      
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('splitCell', {}, false);
      return false;
    }
  }

  /**
   * Set cell background color
   */
  setCellBackgroundColor(color: string): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.cell) {
        return false;
      }

      selection.cell.style.backgroundColor = color;
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('setCellBackgroundColor', { color }, false);
      return false;
    }
  }

  /**
   * Set cell text alignment
   */
  setCellTextAlign(align: 'left' | 'center' | 'right' | 'justify'): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.cell) {
        return false;
      }

      selection.cell.style.textAlign = align;
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('setCellTextAlign', { align }, false);
      return false;
    }
  }

  /**
   * Set cell vertical alignment
   */
  setCellVerticalAlign(align: 'top' | 'middle' | 'bottom'): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection || !selection.cell) {
        return false;
      }

      selection.cell.style.verticalAlign = align;
      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('setCellVerticalAlign', { align }, false);
      return false;
    }
  }

  /**
   * Check if cursor is inside a table
   */
  isInTable(): boolean {
    return this.getSelectedTable() !== null;
  }

  /**
   * Get table properties
   */
  getTableProperties(): TableData | null {
    const selection = this.getSelectedTable();
    if (!selection) {
      return null;
    }

    const table = selection.table;
    const firstRow = table.querySelector('tr');
    const rows = table.querySelectorAll('tr').length;
    const columns = firstRow ? firstRow.cells.length : 0;

    return {
      rows,
      columns,
      width: table.style.width || undefined,
      border: parseInt(table.getAttribute('border') || '0', 10),
      cellPadding: parseInt(table.getAttribute('cellpadding') || '0', 10),
      cellSpacing: parseInt(table.getAttribute('cellspacing') || '0', 10)
    };
  }

  /**
   * Update table properties
   */
  updateTableProperties(tableData: Partial<TableData>): boolean {
    try {
      const selection = this.getSelectedTable();
      if (!selection) {
        return false;
      }

      const table = selection.table;

      if (tableData.width !== undefined) {
        table.style.width = tableData.width;
      }
      if (tableData.border !== undefined) {
        table.setAttribute('border', tableData.border.toString());
      }
      if (tableData.cellPadding !== undefined) {
        table.setAttribute('cellpadding', tableData.cellPadding.toString());
      }
      if (tableData.cellSpacing !== undefined) {
        table.setAttribute('cellspacing', tableData.cellSpacing.toString());
      }
      if (tableData.align) {
        table.style.marginLeft = tableData.align === 'center' ? 'auto' : '0';
        table.style.marginRight = tableData.align === 'center' || tableData.align === 'right' ? 'auto' : '0';
      }
      if (tableData.cssClass !== undefined) {
        table.className = tableData.cssClass;
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('updateTableProperties', { tableData }, false);
      return false;
    }
  }
}
