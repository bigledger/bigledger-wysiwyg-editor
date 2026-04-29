import { Injectable } from '@angular/core';
import { TableService } from './table.service';

@Injectable({
  providedIn: 'root'
})
export class TableHandlerService {
  constructor(private tableService: TableService) {}

  private selectedTable: HTMLTableElement | null = null;
  private resizing = false;
  private resizeHandle: string | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startMarginLeft = 0;
  private startMarginTop = 0;

  /**
   * Initialize table handlers - make tables resizable
   */
  initializeTableHandlers(contentArea: HTMLElement): void {
    if (!contentArea) return;

    const tables = contentArea.querySelectorAll('table');
    tables.forEach(table => {
      this.makeTableResizable(table as HTMLTableElement);
    });
  }

  /**
   * Make a table resizable by adding resize handles
   */
  private makeTableResizable(table: HTMLTableElement): void {
    // Check if already initialized using data attribute (persists in HTML)
    if (table.getAttribute('data-resize-initialized') === 'true') {
      console.log('Table already initialized, skipping');
      return;
    }

    console.log('Initializing table for resize');

    // CRITICAL: Set table positioning to contain absolute handles
    table.style.setProperty('position', 'relative', 'important');
    table.style.setProperty('display', 'table', 'important');
    table.style.isolation = 'isolate'; // Create new stacking context

    // Apply fixed table layout for tables loaded from DB that don't have it yet
    // (new tables always have table-layout: fixed set at creation time)
    if (table.style.tableLayout !== 'fixed') {
      this.tableService.applyFixedLayout(table);
    }
    
    // Add click handler for selection (no stopPropagation - must bubble up to
    // EditorContentComponent.onClick() so the table context menu can handle cell clicks)
    table.addEventListener('click', () => {
      this.selectTable(table);
    });

    // Mark as initialized using data attribute (persists in HTML)
    table.setAttribute('data-resize-initialized', 'true');
    
    console.log('Table initialized with position:', window.getComputedStyle(table).position);
  }

  /**
   * Select a table and show resize UI
   */
  selectTable(table: HTMLTableElement): void {
    // If same table is already selected, don't re-add handles
    if (this.selectedTable === table) {
      console.log('Table already selected, skipping handle addition');
      return;
    }

    // Deselect previous table
    if (this.selectedTable && this.selectedTable !== table) {
      this.deselectTable();
    }

    this.selectedTable = table;
    table.classList.add('table-selected');
    
    // CRITICAL FIX: Force position relative with !important
    table.style.setProperty('position', 'relative', 'important');

    // Add resize handles (removeResizeHandles is called inside addResizeHandles)
    this.addResizeHandles(table);
  }

  /**
   * Deselect current table
   */
  deselectTable(): void {
    if (this.selectedTable) {
      this.selectedTable.classList.remove('table-selected');
      this.removeResizeHandles(this.selectedTable);
      this.selectedTable = null;
    }
  }

  /**
   * Add resize handles to table
   */
  private addResizeHandles(table: HTMLTableElement): void {
    // Remove existing handles first
    const existingHandles = table.querySelectorAll('.table-resize-handle');
    console.log('Existing handles before removal:', existingHandles.length);
    this.removeResizeHandles(table);

    const afterRemoval = table.querySelectorAll('.table-resize-handle');
    console.log('Handles after removal:', afterRemoval.length);
    console.log('Adding resize handles to table');

    // Create resize handles
    const positions = [
      { class: 'nw', cursor: 'nw-resize' },
      { class: 'n', cursor: 'n-resize' },
      { class: 'ne', cursor: 'ne-resize' },
      { class: 'e', cursor: 'e-resize' },
      { class: 'se', cursor: 'se-resize' },
      { class: 's', cursor: 's-resize' },
      { class: 'sw', cursor: 'sw-resize' },
      { class: 'w', cursor: 'w-resize' }
    ];

    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `table-resize-handle table-resize-${pos.class}`;

      // INLINE STYLES - Make handles visible
      handle.style.position = 'absolute';
      handle.style.background = '#4a90e2'; // Blue
      handle.style.border = '2px solid #FFFFFF';
      handle.style.cursor = pos.cursor;
      handle.style.pointerEvents = 'auto';
      handle.style.zIndex = '9999';
      handle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      // Size and position
      if (['nw', 'ne', 'sw', 'se'].includes(pos.class)) {
        // Corners
        handle.style.width = '15px';
        handle.style.height = '15px';
        handle.style.borderRadius = '50%';

        if (pos.class === 'nw') { handle.style.top = '-7px'; handle.style.left = '-7px'; }
        else if (pos.class === 'ne') { handle.style.top = '-7px'; handle.style.right = '-7px'; }
        else if (pos.class === 'sw') { handle.style.bottom = '-7px'; handle.style.left = '-7px'; }
        else if (pos.class === 'se') { handle.style.bottom = '-7px'; handle.style.right = '-7px'; }
      } else {
        // Edges
        if (['n', 's'].includes(pos.class)) {
          handle.style.width = '60px';
          handle.style.height = '8px';
          handle.style.left = '50%';
          handle.style.transform = 'translateX(-50%)';
          if (pos.class === 'n') handle.style.top = '-4px';
          else handle.style.bottom = '-4px';
        } else {
          handle.style.width = '8px';
          handle.style.height = '60px';
          handle.style.top = '50%';
          handle.style.transform = 'translateY(-50%)';
          if (pos.class === 'e') handle.style.right = '-4px';
          else handle.style.left = '-4px';
        }
      }

      handle.setAttribute('data-position', pos.class);

      // Add mousedown event
      handle.addEventListener('mousedown', (e) => {
        console.log('Handle mousedown:', pos.class);
        this.onResizeStart(e, table, pos.class);
      });

      table.appendChild(handle);
      console.log('Added handle:', pos.class, 'Parent:', handle.parentElement?.tagName);
    });

    console.log('Total handles added:', table.querySelectorAll('.table-resize-handle').length);
    
    // Verify table positioning
    const computedStyle = window.getComputedStyle(table);
    console.log('Table position after adding handles:', computedStyle.position);
    console.log('Table display:', computedStyle.display);
  }

  /**
   * Remove resize handles from table
   */
  private removeResizeHandles(table: HTMLTableElement): void {
    const handles = table.querySelectorAll('.table-resize-handle');
    console.log('Removing', handles.length, 'handles');
    handles.forEach(handle => {
      console.log('Removing handle:', handle.className);
      handle.remove();
    });
  }

  /**
   * Start resize operation
   */
  private onResizeStart(event: MouseEvent, table: HTMLTableElement, position: string): void {
    console.log('onResizeStart called', position);
    event.preventDefault();
    event.stopPropagation();

    this.resizing = true;
    this.resizeHandle = position;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const rect = table.getBoundingClientRect();
    this.startWidth = rect.width;
    this.startHeight = rect.height;
    
    // Store initial margins for left/top resizing
    const computedStyle = window.getComputedStyle(table);
    this.startMarginLeft = parseFloat(computedStyle.marginLeft) || 0;
    this.startMarginTop = parseFloat(computedStyle.marginTop) || 0;

    console.log('Start dimensions:', { 
      width: this.startWidth, 
      height: this.startHeight,
      marginLeft: this.startMarginLeft,
      marginTop: this.startMarginTop
    });

    // Add document-level event listeners
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);

    // Add resizing class
    table.classList.add('table-resizing');
    document.body.style.cursor = (event.target as HTMLElement).style.cursor;
    document.body.style.userSelect = 'none';

    console.log('Resize started, listeners added');
  }

  /**
   * Handle resize move
   */
  private onResizeMove = (event: MouseEvent): void => {
    if (!this.resizing || !this.selectedTable || !this.resizeHandle) {
      console.log('onResizeMove skipped:', { resizing: this.resizing, hasTable: !!this.selectedTable, handle: this.resizeHandle });
      return;
    }

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;
    let newMarginLeft = this.startMarginLeft;
    let newMarginTop = this.startMarginTop;

    // Calculate new dimensions based on handle position
    switch (this.resizeHandle) {
      case 'e':
      case 'ne':
      case 'se':
        // Resize from right - just increase width
        newWidth = Math.max(100, this.startWidth + deltaX);
        break;
      case 'w':
      case 'nw':
      case 'sw':
        // Resize from left - decrease width and adjust margin
        newWidth = Math.max(100, this.startWidth - deltaX);
        // Adjust margin to keep right edge in place
        newMarginLeft = this.startMarginLeft + (this.startWidth - newWidth);
        break;
    }

    switch (this.resizeHandle) {
      case 's':
      case 'se':
      case 'sw':
        // Resize from bottom - just increase height
        newHeight = Math.max(50, this.startHeight + deltaY);
        break;
      case 'n':
      case 'ne':
      case 'nw':
        // Resize from top - decrease height and adjust margin
        newHeight = Math.max(50, this.startHeight - deltaY);
        // Adjust margin to keep bottom edge in place
        newMarginTop = this.startMarginTop + (this.startHeight - newHeight);
        break;
    }

    console.log('Resizing:', { 
      handle: this.resizeHandle, 
      newWidth, 
      newHeight, 
      newMarginLeft,
      newMarginTop,
      deltaX, 
      deltaY 
    });

    // Apply new dimensions and margins
    this.selectedTable.style.width = `${newWidth}px`;
    this.selectedTable.style.height = `${newHeight}px`;
    this.selectedTable.style.marginLeft = `${newMarginLeft}px`;
    this.selectedTable.style.marginTop = `${newMarginTop}px`;
  };

  /**
   * End resize operation
   */
  private onResizeEnd = (): void => {
    if (!this.resizing) return;

    console.log('Resize ended');

    this.resizing = false;
    this.resizeHandle = null;

    // Remove document-level event listeners
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);

    // Remove resizing class
    if (this.selectedTable) {
      this.selectedTable.classList.remove('table-resizing');
      
      // DON'T trigger content change event - it causes re-initialization
      // The table size is already changed in the DOM
      // Content will be saved when user performs next action (click, type, etc.)
      console.log('Resize complete');
    }

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  /**
   * Clean up
   */
  cleanup(): void {
    this.deselectTable();
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  }
}
