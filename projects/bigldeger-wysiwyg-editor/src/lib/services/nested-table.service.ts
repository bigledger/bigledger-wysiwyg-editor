import { Injectable } from '@angular/core';
import { TableData } from '../models/table.interface';

@Injectable({
  providedIn: 'root'
})
export class NestedTableService {
  private activeCell: HTMLTableCellElement | null = null;
  private cellToolbar: HTMLElement | null = null;

  constructor() {}

  /**
   * Check if user clicked inside a table cell
   */
  handleCellClick(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    const cell = this.findParentCell(target);
    
    if (cell) {
      this.activeCell = cell;
      this.showCellToolbar(cell);
      return true;
    } else {
      this.hideCellToolbar();
      this.activeCell = null;
      return false;
    }
  }

  /**
   * Find parent table cell (td or th)
   */
  private findParentCell(element: HTMLElement): HTMLTableCellElement | null {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'TD' || current.tagName === 'TH') {
        return current as HTMLTableCellElement;
      }
      current = current.parentElement as HTMLElement;
    }
    return null;
  }

  /**
   * Show toolbar for cell actions
   */
  private showCellToolbar(cell: HTMLTableCellElement): void {
    // Remove existing toolbar
    this.hideCellToolbar();

    // Create toolbar
    this.cellToolbar = document.createElement('div');
    this.cellToolbar.className = 'cell-toolbar';
    this.cellToolbar.innerHTML = `
      <button class="cell-toolbar-btn" data-action="insert-table" title="Insert Table">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </button>
    `;

    // Position toolbar
    const rect = cell.getBoundingClientRect();
    this.cellToolbar.style.position = 'absolute';
    this.cellToolbar.style.top = `${rect.top - 35}px`;
    this.cellToolbar.style.left = `${rect.left}px`;
    this.cellToolbar.style.zIndex = '10000';

    // Add click handler
    const btn = this.cellToolbar.querySelector('[data-action="insert-table"]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onInsertTableClick();
      });
    }

    document.body.appendChild(this.cellToolbar);
  }

  /**
   * Hide cell toolbar
   */
  hideCellToolbar(): void {
    if (this.cellToolbar) {
      this.cellToolbar.remove();
      this.cellToolbar = null;
    }
  }

  /**
   * Handle insert table button click
   */
  private onInsertTableClick(): void {
    // Emit event to show table dialog
    const event = new CustomEvent('insert-nested-table', {
      detail: { cell: this.activeCell }
    });
    document.dispatchEvent(event);
  }

  /**
   * Insert nested table into active cell
   */
  insertNestedTable(tableData: TableData): boolean {
    if (!this.activeCell) {
      console.error('No active cell for nested table insertion');
      return false;
    }

    // Build nested table HTML
    const tableHtml = this.buildNestedTableHtml(tableData);

    // Clear cell content and insert table
    this.activeCell.innerHTML = tableHtml;

    // Hide toolbar
    this.hideCellToolbar();

    return true;
  }

  /**
   * Build nested table HTML
   */
  private buildNestedTableHtml(tableData: TableData): string {
    let html = '<table class="nested-table"';

    // Add styles for nested table
    let styles = 'border-collapse: collapse; width: 100%; margin: 0;';
    if (tableData.border) {
      styles += ` border: ${tableData.border}px solid #ddd;`;
    }

    html += ` style="${styles}"`;

    if (tableData.cssClass) {
      html += ` class="nested-table ${tableData.cssClass}"`;
    }

    html += '><tbody>';

    // Create rows
    for (let i = 0; i < tableData.rows; i++) {
      html += '<tr>';

      // Create cells
      for (let j = 0; j < tableData.columns; j++) {
        const cellTag = tableData.hasHeader && i === 0 ? 'th' : 'td';
        let cellStyle = 'border: 1px solid #ddd; padding: 4px; min-width: 30px;';

        if (tableData.hasHeader && i === 0) {
          cellStyle += ' font-weight: bold; background-color: #f5f5f5;';
        }

        html += `<${cellTag} style="${cellStyle}">&nbsp;</${cellTag}>`;
      }

      html += '</tr>';
    }

    html += '</tbody></table>';

    return html;
  }

  /**
   * Check if element is inside a table cell
   */
  isInsideCell(element: HTMLElement): boolean {
    return this.findParentCell(element) !== null;
  }

  /**
   * Get active cell
   */
  getActiveCell(): HTMLTableCellElement | null {
    return this.activeCell;
  }

  /**
   * Clean up
   */
  cleanup(): void {
    this.hideCellToolbar();
    this.activeCell = null;
  }
}
