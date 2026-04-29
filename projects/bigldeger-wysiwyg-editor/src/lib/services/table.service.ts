import { Injectable } from '@angular/core';
import { TableData, TableCellData, TableSelection, TableActionAvailability } from '../models/table.interface';
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
    table.style.tableLayout = 'fixed';
    if (!table.style.width) {
      table.style.width = '100%';
    }
    if (!tableData.border) {
      table.style.border = '1px solid #ddd';
    }

    // Calculate equal column width percentage
    const colPct = parseFloat((100 / tableData.columns).toFixed(4)) + '%';

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
        cell.style.width = colPct;
        cell.style.minWidth = '50px';
        cell.style.overflow = 'hidden';
        cell.style.wordWrap = 'break-word';
        
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

      const colCount = (selection.table.querySelector('tr') as HTMLTableRowElement | null)?.cells.length ?? selection.row.cells.length;
      const colPct = parseFloat((100 / colCount).toFixed(4)) + '%';
      const newRow = this.createRow(colCount, colPct);
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

      const belowColCount = (selection.table.querySelector('tr') as HTMLTableRowElement | null)?.cells.length ?? selection.row.cells.length;
      const belowColPct = parseFloat((100 / belowColCount).toFixed(4)) + '%';
      const newRow = this.createRow(belowColCount, belowColPct);
      
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
  private createRow(cellCount: number, colPct?: string): HTMLTableRowElement {
    const row = document.createElement('tr');
    const pct = colPct || (parseFloat((100 / cellCount).toFixed(4)) + '%');
    
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('td');
      cell.innerHTML = '&nbsp;';
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '8px';
      cell.style.width = pct;
      cell.style.minWidth = '50px';
      cell.style.overflow = 'hidden';
      cell.style.wordWrap = 'break-word';
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
        newCell.style.overflow = 'hidden';
        newCell.style.wordWrap = 'break-word';
        
        if (row.cells[cellIndex]) {
          row.insertBefore(newCell, row.cells[cellIndex]);
        } else {
          row.appendChild(newCell);
        }
      });
      // Rebalance column widths after structural change
      this.applyFixedLayout(table);
      
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
        newCell.style.overflow = 'hidden';
        newCell.style.wordWrap = 'break-word';
        
        if (row.cells[cellIndex + 1]) {
          row.insertBefore(newCell, row.cells[cellIndex + 1]);
        } else {
          row.appendChild(newCell);
        }
      });
      // Rebalance column widths after structural change
      this.applyFixedLayout(table);
      
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
      // Rebalance column widths after structural change
      this.applyFixedLayout(table);
      
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
  mergeCells(cells?: HTMLTableCellElement[]): boolean {
    try {
      if (!cells || cells.length < 2) return false;

      // Determine direction: horizontal (same row) or vertical (same column)
      const firstRow = cells[0].parentElement as HTMLTableRowElement;
      const allSameRow = cells.every(c => c.parentElement === firstRow);

      if (allSameRow) {
        // Horizontal merge — combine into the leftmost cell
        const sorted = [...cells].sort((a, b) =>
          Array.from((a.parentElement as HTMLTableRowElement).cells).indexOf(a) -
          Array.from((b.parentElement as HTMLTableRowElement).cells).indexOf(b)
        );
        const first = sorted[0];
        let totalColspan = 0;
        sorted.forEach(c => {
          totalColspan += parseInt(c.getAttribute('colspan') || '1', 10);
          if (c !== first) {
            const content = c.innerHTML.trim();
            if (content && content !== '&nbsp;') {
              const existing = first.innerHTML.trim();
              first.innerHTML = (existing === '&nbsp;' ? '' : existing + ' ') + content;
            }
            c.remove();
          }
        });
        if (totalColspan > 1) {
          first.setAttribute('colspan', totalColspan.toString());
        } else {
          first.removeAttribute('colspan');
        }
      } else {
        // Vertical merge — combine into the topmost cell
        const table = cells[0].closest('table') as HTMLTableElement;
        const allRows = Array.from(table.querySelectorAll('tr'));
        const sorted = [...cells].sort((a, b) =>
          allRows.indexOf(a.parentElement as HTMLTableRowElement) -
          allRows.indexOf(b.parentElement as HTMLTableRowElement)
        );
        const first = sorted[0];
        let totalRowspan = 0;
        sorted.forEach(c => {
          totalRowspan += parseInt(c.getAttribute('rowspan') || '1', 10);
          if (c !== first) {
            const content = c.innerHTML.trim();
            if (content && content !== '&nbsp;') {
              const existing = first.innerHTML.trim();
              first.innerHTML = (existing === '&nbsp;' ? '' : existing + ' ') + content;
            }
            c.remove();
          }
        });
        if (totalRowspan > 1) {
          first.setAttribute('rowspan', totalRowspan.toString());
        } else {
          first.removeAttribute('rowspan');
        }
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

  /**
   * Toggle header row: convert first row cells between th/td, wrap in thead/tbody
   */
  toggleHeaderRow(table?: HTMLTableElement): boolean {
    try {
      const tbl = table || this.getSelectedTable()?.table;
      if (!tbl) return false;

      const hasHeader = !!tbl.querySelector('thead');

      if (hasHeader) {
        // Remove header: move thead rows into tbody, convert th to td
        const thead = tbl.querySelector('thead')!;
        let tbody = tbl.querySelector('tbody');
        if (!tbody) {
          tbody = document.createElement('tbody');
          tbl.appendChild(tbody);
        }
        const rows = Array.from(thead.rows);
        rows.forEach(row => {
          // Convert th to td
          Array.from(row.cells).forEach(cell => {
            if (cell.tagName === 'TH') {
              const td = document.createElement('td');
              td.innerHTML = cell.innerHTML;
              td.style.cssText = cell.style.cssText;
              td.className = cell.className;
              if (cell.colSpan > 1) td.colSpan = cell.colSpan;
              if (cell.rowSpan > 1) td.rowSpan = cell.rowSpan;
              td.style.fontWeight = '';
              td.style.backgroundColor = '';
              row.replaceChild(td, cell);
            }
          });
          tbody!.insertBefore(row, tbody!.firstChild);
        });
        thead.remove();
      } else {
        // Add header: take first row, convert td to th, wrap in thead
        let tbody = tbl.querySelector('tbody');
        // If no tbody, all rows are direct children of table
        const allRows = tbody ? Array.from(tbody.rows) : Array.from(tbl.rows);
        if (allRows.length === 0) return false;

        const firstRow = allRows[0];
        const thead = document.createElement('thead');

        // Convert td to th
        Array.from(firstRow.cells).forEach(cell => {
          if (cell.tagName === 'TD') {
            const th = document.createElement('th');
            th.innerHTML = cell.innerHTML;
            th.style.cssText = cell.style.cssText;
            th.className = cell.className;
            if (cell.colSpan > 1) th.colSpan = cell.colSpan;
            if (cell.rowSpan > 1) th.rowSpan = cell.rowSpan;
            th.style.fontWeight = 'bold';
            th.style.backgroundColor = '#f5f5f5';
            firstRow.replaceChild(th, cell);
          }
        });

        thead.appendChild(firstRow);

        // Ensure remaining rows are in tbody
        if (!tbody) {
          tbody = document.createElement('tbody');
          const remainingRows = Array.from(tbl.rows);
          remainingRows.forEach(r => tbody!.appendChild(r));
          tbl.appendChild(tbody);
        }
        tbl.insertBefore(thead, tbl.firstChild);
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('toggleHeaderRow', {}, false);
      return false;
    }
  }

  /**
   * Toggle footer row: add/remove tfoot with last row
   */
  toggleFooterRow(table?: HTMLTableElement): boolean {
    try {
      const tbl = table || this.getSelectedTable()?.table;
      if (!tbl) return false;

      const hasFooter = !!tbl.querySelector('tfoot');

      if (hasFooter) {
        // Remove footer: move tfoot rows into tbody
        const tfoot = tbl.querySelector('tfoot')!;
        let tbody = tbl.querySelector('tbody');
        if (!tbody) {
          tbody = document.createElement('tbody');
          tbl.appendChild(tbody);
        }
        const rows = Array.from(tfoot.rows);
        rows.forEach(row => {
          tbody!.appendChild(row);
        });
        tfoot.remove();
      } else {
        // Add footer: take last body row, wrap in tfoot
        let tbody = tbl.querySelector('tbody');
        const bodyRows = tbody ? Array.from(tbody.rows) : Array.from(tbl.querySelectorAll('tr'));
        // Don't count thead rows
        const thead = tbl.querySelector('thead');
        const theadRowCount = thead ? thead.rows.length : 0;
        const nonHeaderRows = bodyRows.filter(r => !thead || !thead.contains(r));

        if (nonHeaderRows.length <= 1) return false; // Need at least 2 body rows to make a footer

        const lastRow = nonHeaderRows[nonHeaderRows.length - 1];
        const tfoot = document.createElement('tfoot');
        tfoot.appendChild(lastRow);
        tbl.appendChild(tfoot);
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('toggleFooterRow', {}, false);
      return false;
    }
  }

  /**
   * Split cell vertically (adds a column within this cell by increasing colspan then splitting)
   * Effectively: split into left/right
   */
  splitCellVertically(cell?: HTMLTableCellElement): boolean {
    try {
      const targetCell = cell || this.getSelectedTable()?.cell;
      if (!targetCell) return false;

      const colspan = parseInt(targetCell.getAttribute('colspan') || '1', 10);

      if (colspan > 1) {
        // Spanned cell: split into two halves
        const cellWidth = targetCell.getBoundingClientRect().width;
        const halfPx = Math.floor(cellWidth / 2);

        targetCell.setAttribute('colspan', (colspan - 1).toString());
        const newCell = document.createElement('td');
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #ddd';
        newCell.style.padding = '8px';
        if (halfPx > 0) {
          // Distribute original width evenly between the two resulting cells
          const originalPortion = Math.floor(cellWidth * (colspan - 1) / colspan);
          const newPortion = cellWidth - originalPortion;
          targetCell.style.width = originalPortion + 'px';
          newCell.style.width = newPortion + 'px';
        }
        if (targetCell.nextSibling) {
          targetCell.parentNode!.insertBefore(newCell, targetCell.nextSibling);
        } else {
          targetCell.parentNode!.appendChild(newCell);
        }
      } else {
        // Normal cell (colspan=1): split into two equal-width cells.
        const row = targetCell.parentElement as HTMLTableRowElement;
        const table = targetCell.closest('table') as HTMLTableElement;
        if (!row || !table) return false;

        const cellIndex = Array.from(row.cells).indexOf(targetCell);
        const tag = targetCell.tagName === 'TH' ? 'th' : 'td';

        // Measure width BEFORE inserting new cell (getBCR is live)
        const cellWidth = targetCell.getBoundingClientRect().width;
        const halfPx = Math.floor(cellWidth / 2);

        // Insert new sibling cell AFTER the target in the current row
        const newCell = document.createElement(tag);
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #ddd';
        newCell.style.padding = '8px';
        if (targetCell.nextSibling) {
          row.insertBefore(newCell, targetCell.nextSibling);
        } else {
          row.appendChild(newCell);
        }

        // Apply equal widths so the split appears centered
        if (halfPx > 0) {
          targetCell.style.width = halfPx + 'px';
          newCell.style.width = halfPx + 'px';
        }

        // Expand the cell at this column position in every other row so the table stays aligned
        const allRows = Array.from(table.querySelectorAll('tr'));
        allRows.forEach(r => {
          if (r === row) return;
          const refCell = r.cells[cellIndex];
          if (refCell) {
            const existingColspan = parseInt(refCell.getAttribute('colspan') || '1', 10);
            refCell.setAttribute('colspan', (existingColspan + 1).toString());
            // Keep the spanned cell width consistent with the two new cells combined
            if (halfPx > 0) {
              refCell.style.width = (halfPx * 2) + 'px';
            }
          } else {
            const extraCell = document.createElement('td');
            extraCell.innerHTML = '&nbsp;';
            extraCell.style.border = '1px solid #ddd';
            extraCell.style.padding = '8px';
            r.appendChild(extraCell);
          }
        });
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('splitCellVertically', {}, false);
      return false;
    }
  }

  /**
   * Split cell horizontally (adds a row within this cell by increasing rowspan then splitting)
   * Effectively: split into top/bottom
   */
  splitCellHorizontally(cell?: HTMLTableCellElement): boolean {
    try {
      const targetCell = cell || this.getSelectedTable()?.cell;
      if (!targetCell) return false;

      const rowspan = parseInt(targetCell.getAttribute('rowspan') || '1', 10);
      const row = targetCell.parentElement as HTMLTableRowElement;
      const table = targetCell.closest('table') as HTMLTableElement;
      if (!row || !table) return false;

      if (rowspan > 1) {
        // Already spanned: reduce rowspan by 1, insert new cell in the row below
        targetCell.setAttribute('rowspan', (rowspan - 1).toString());
        const cellIndex = Array.from(row.cells).indexOf(targetCell);
        // Find the next row that this cell spans into
        let nextRow = row.nextElementSibling as HTMLTableRowElement;
        if (nextRow) {
          const newCell = document.createElement('td');
          newCell.innerHTML = '&nbsp;';
          newCell.style.border = '1px solid #ddd';
          newCell.style.padding = '8px';
          if (nextRow.cells[cellIndex]) {
            nextRow.insertBefore(newCell, nextRow.cells[cellIndex]);
          } else {
            nextRow.appendChild(newCell);
          }
        }
      } else {
        // Normal cell (rowspan=1): insert a new row below with ONE cell at this column position.
        // All other cells in this row span into the new row (rowspan+1), keeping alignment.
        const cellIndex = Array.from(row.cells).indexOf(targetCell);
        const tag = targetCell.tagName === 'TH' ? 'th' : 'td';

        const newRow = document.createElement('tr');
        const newCell = document.createElement(tag);
        newCell.innerHTML = '&nbsp;';
        newCell.style.border = '1px solid #ddd';
        newCell.style.padding = '8px';
        newRow.appendChild(newCell);

        // Increase rowspan for every sibling cell so they span into the new row
        Array.from(row.cells).forEach((c, idx) => {
          if (idx === cellIndex) return; // target cell itself stays in current row only
          const existingRowspan = parseInt(c.getAttribute('rowspan') || '1', 10);
          c.setAttribute('rowspan', (existingRowspan + 1).toString());
        });

        // Insert new row immediately after the current row
        const parent = row.parentNode!;
        if (row.nextSibling) {
          parent.insertBefore(newRow, row.nextSibling);
        } else {
          parent.appendChild(newRow);
        }
      }

      return true;
    } catch (error) {
      this.errorHandlerService.handleCommandError('splitCellHorizontally', {}, false);
      return false;
    }
  }

  /**
   * Get the availability of table actions based on current state
   */
  getActionAvailability(table?: HTMLTableElement, cell?: HTMLTableCellElement): TableActionAvailability {
    const tbl = table || this.getSelectedTable()?.table;
    const activeCell = cell || this.getSelectedTable()?.cell;

    const hasHeader = !!tbl?.querySelector('thead');
    const hasFooter = !!tbl?.querySelector('tfoot');

    const tbody = tbl?.querySelector('tbody');
    const bodyRowCount = tbody ? tbody.rows.length : (tbl ? tbl.rows.length : 0);
    const firstRow = tbl?.querySelector('tr');
    const colCount = firstRow ? firstRow.cells.length : 0;

    const colspan = activeCell ? parseInt(activeCell.getAttribute('colspan') || '1', 10) : 1;
    const rowspan = activeCell ? parseInt(activeCell.getAttribute('rowspan') || '1', 10) : 1;
    const canSplitV = colspan > 1;
    const canSplitH = rowspan > 1;

    return {
      canMerge: !!activeCell && !!activeCell.nextElementSibling,
      canSplitVertical: canSplitV || !!activeCell,
      canSplitHorizontal: canSplitH || !!activeCell,
      canInsertRowAbove: !!activeCell,
      canInsertRowBelow: !!activeCell,
      canDeleteRow: bodyRowCount > 1,
      canInsertColumnBefore: !!activeCell,
      canInsertColumnAfter: !!activeCell,
      canDeleteColumn: colCount > 1,
      canToggleHeader: !!tbl,
      canToggleFooter: !!tbl && bodyRowCount > 1,
      hasHeader,
      hasFooter
    };
  }

  /**
   * Apply fixed table layout so cell widths are not driven by content.
   * Sets table-layout:fixed on the table and distributes equal percentage
   * widths across all cells in the first row.
   */
  applyFixedLayout(table: HTMLTableElement): void {
    table.style.tableLayout = 'fixed';
    if (!table.style.width) {
      table.style.width = '100%';
    }
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;
    const colCount = firstRow.cells.length;
    if (colCount === 0) return;
    const pct = parseFloat((100 / colCount).toFixed(4)) + '%';
    // Apply to every cell in every row for consistency
    const allRows = table.querySelectorAll('tr');
    allRows.forEach(row => {
      Array.from((row as HTMLTableRowElement).cells).forEach(cell => {
        (cell as HTMLTableCellElement).style.width = pct;
      });
    });
  }
}
