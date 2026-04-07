import { Injectable } from '@angular/core';
import { TableService } from './table.service';
import { TableConfig, TableActionAvailability } from '../models/table.interface';

/**
 * Froala-style table context menu (edit popup) service.
 * Shows a floating toolbar when clicking inside a table cell with
 * all table editing operations matching the reference screenshots:
 * - Header / Footer toggles
 * - Remove Table
 * - Row dropdown (Insert above, Insert below, Delete row)
 * - Column dropdown (Insert before, Insert after, Delete column)
 * - Split dropdown (Merge cells, Vertical split, Horizontal split)
 * - Table settings (gear icon)
 * - Table styles (star icon)
 * - Horizontal alignment dropdown
 * - Cell background color picker
 * - Cell styles dropdown
 */
@Injectable({
  providedIn: 'root'
})
export class TableContextMenuService {
  private menuElement: HTMLElement | null = null;
  private activeCell: HTMLTableCellElement | null = null;
  private activeTable: HTMLTableElement | null = null;
  private colorPickerEl: HTMLElement | null = null;
  private subMenuEl: HTMLElement | null = null;
  private contentArea: HTMLElement | null = null;
  private changeCallback: (() => void) | null = null;
  private documentClickHandler: ((e: MouseEvent) => void) | null = null;
  /** Cells highlighted via Ctrl+click for multi-cell operations (e.g. merge) */
  private selectedCells: HTMLTableCellElement[] = [];

  private config: TableConfig = {
    tableCellStyles: {
      'highlighted': 'Highlighted',
      'thick-border': 'Thick Border',
      'dashed-border': 'Dashed Border'
    },
    tableStyles: {
      'fr-alternate-rows': 'Alternate Rows',
      'fr-dashed-borders': 'Dashed Borders',
      'fr-no-borders': 'No Borders'
    },
    cellColorPresets: [
      '#ffffff', '#f2f2f2', '#d9d9d9', '#bfbfbf', '#808080', '#000000',
      '#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0066ff', '#9900ff',
      '#ff9999', '#ffcc99', '#ffff99', '#ccffcc', '#99ccff', '#cc99ff',
      '#ffcccc', '#ffe0cc', '#ffffcc', '#e6ffe6', '#cce0ff', '#e6ccff'
    ]
  };

  constructor(private tableService: TableService) {}

  /**
   * Set the content area and change callback
   */
  initialize(contentArea: HTMLElement, changeCallback: () => void): void {
    this.contentArea = contentArea;
    this.changeCallback = changeCallback;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TableConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle cell click - show context menu if inside a table.
   * Ctrl/Cmd+click toggles multi-cell selection for merge operations.
   */
  handleCellClick(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    const cell = this.findParentCell(target);
    const table = this.findParentTable(target);

    if (cell && table) {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select: toggle this cell in the selection set
        const idx = this.selectedCells.indexOf(cell);
        if (idx >= 0) {
          this.selectedCells.splice(idx, 1);
          cell.classList.remove('tcm-cell-selected');
        } else {
          this.selectedCells.push(cell);
          cell.classList.add('tcm-cell-selected');
        }
        this.activeCell = cell;
        this.activeTable = table;
        setTimeout(() => this.showMenu(cell), 50);
      } else {
        // Single click: clear any previous multi-selection, select only this cell
        this.clearCellSelections();
        this.selectedCells = [cell];
        cell.classList.add('tcm-cell-selected');
        this.activeCell = cell;
        this.activeTable = table;
        this.placeCursorInCell(cell);
        setTimeout(() => this.showMenu(cell), 50);
      }
      return true;
    }

    this.hideMenu();
    this.clearCellSelections();
    this.activeCell = null;
    this.activeTable = null;
    return false;
  }

  /**
   * Show the floating context menu near the active cell.
   * Uses hideMenuDOM (not hideMenu) so selectedCells are preserved.
   */
  private showMenu(cell: HTMLTableCellElement): void {
    // Tear down previous menu DOM without clearing cell selections
    this.hideMenuDOM();

    this.menuElement = document.createElement('div');
    this.menuElement.className = 'table-context-menu';
    this.menuElement.setAttribute('role', 'toolbar');
    this.menuElement.setAttribute('aria-label', 'Table editing tools');

    // Prevent clicks in the menu from bubbling to the editor
    this.menuElement.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    const availability = this.tableService.getActionAvailability(this.activeTable!, this.activeCell!);
    this.menuElement.innerHTML = this.buildMenuHTML(availability);
    this.attachMenuHandlers();

    document.body.appendChild(this.menuElement);
    requestAnimationFrame(() => this.positionMenu(cell));

    // Close submenus on document click outside
    this.documentClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (this.menuElement && !this.menuElement.contains(target) &&
          (!this.colorPickerEl || !this.colorPickerEl.contains(target)) &&
          (!this.subMenuEl || !this.subMenuEl.contains(target))) {
        this.hideSubMenu();
      }
    };
    document.addEventListener('click', this.documentClickHandler, true);
  }

  /**
   * Build the full-featured context menu HTML matching reference screenshots.
   * Layout: two rows of grouped icon buttons.
   * Row 1: Header toggle | Footer toggle | Remove Table | Row dropdown | Column dropdown | Split dropdown
   * Row 2: Table Settings (gear) | Table Style (star) | Horizontal Align | Cell BG Color | Cell Style
   */
  private buildMenuHTML(avail: TableActionAvailability): string {
    const headerActive = avail.hasHeader ? ' tcm-btn--active' : '';
    const footerActive = avail.hasFooter ? ' tcm-btn--active' : '';

    return `
      <div class="tcm-rows">
        <div class="tcm-row">
          <!-- Header toggle -->
          <div class="tcm-group" role="group" aria-label="Table structure toggles">
            <button class="tcm-btn${headerActive}" data-action="toggleHeader" title="Table Header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <rect x="4" y="4" width="16" height="4" fill="currentColor" opacity="0.3" rx="1"/>
              </svg>
            </button>

            <!-- Footer toggle -->
            <button class="tcm-btn${footerActive}" data-action="toggleFooter" title="Table Footer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <rect x="4" y="16" width="16" height="4" fill="currentColor" opacity="0.3" rx="1"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Remove Table -->
          <div class="tcm-group" role="group" aria-label="Remove table">
            <button class="tcm-btn tcm-btn--danger" data-action="deleteTable" title="Remove Table">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Row dropdown -->
          <div class="tcm-group" role="group" aria-label="Row operations">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="rowDropdown" title="Row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
            </button>
          </div>

          <!-- Column dropdown -->
          <div class="tcm-group" role="group" aria-label="Column operations">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="columnDropdown" title="Column">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Split / Merge dropdown -->
          <div class="tcm-group" role="group" aria-label="Cell merge/split">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="splitDropdown" title="Cell">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="3" x2="12" y2="21" stroke-dasharray="3,3"/>
                <line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3,3"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Table settings (gear) -->
          <div class="tcm-group" role="group" aria-label="Table settings">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="tableSettings" title="Table Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>

          <!-- Table style (star) -->
          <div class="tcm-group" role="group" aria-label="Table style presets">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="tableStyle" title="Table Style">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="tcm-row">
          <!-- Horizontal align dropdown -->
          <div class="tcm-group" role="group" aria-label="Alignment">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="horizontalAlign" title="Horizontal Alignment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="15" y2="12"/>
                <line x1="3" y1="18" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Vertical align dropdown -->
          <div class="tcm-group" role="group" aria-label="Vertical alignment">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="verticalAlign" title="Vertical Alignment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="8" y1="7" x2="16" y2="7"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke-width="3"/>
                <line x1="8" y1="17" x2="16" y2="17"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Cell background color -->
          <div class="tcm-group" role="group" aria-label="Cell color">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="cellBackgroundColor" title="Cell Background Color">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                <rect x="7" y="14" width="10" height="4" fill="currentColor" rx="1"/>
              </svg>
            </button>
          </div>

          <div class="tcm-separator"></div>

          <!-- Cell style dropdown -->
          <div class="tcm-group" role="group" aria-label="Cell style">
            <button class="tcm-btn tcm-btn--has-dropdown" data-action="cellStyle" title="Cell Style">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <circle cx="6" cy="12" r="2" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach click handlers to context menu buttons
   */
  private attachMenuHandlers(): void {
    if (!this.menuElement) return;

    this.menuElement.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = (btn as HTMLElement).getAttribute('data-action');
        if (action) {
          this.executeAction(action);
        }
      });
    });
  }

  /**
   * Execute a context menu action
   */
  private executeAction(action: string): void {
    // Ensure cell is still focused before executing
    if (this.activeCell) {
      this.placeCursorInCell(this.activeCell);
    }

    switch (action) {
      // Direct actions
      case 'toggleHeader':
        this.tableService.toggleHeaderRow(this.activeTable!);
        this.refreshMenu();
        this.notifyChange();
        break;
      case 'toggleFooter':
        this.tableService.toggleFooterRow(this.activeTable!);
        this.refreshMenu();
        this.notifyChange();
        break;
      case 'deleteTable':
        this.tableService.deleteTable();
        this.hideMenu();
        this.notifyChange();
        break;

      // Dropdown actions
      case 'rowDropdown':
        this.showRowDropdown();
        break;
      case 'columnDropdown':
        this.showColumnDropdown();
        break;
      case 'splitDropdown':
        this.showSplitDropdown();
        break;
      case 'tableSettings':
        this.showTableSettingsDropdown();
        break;
      case 'tableStyle':
        this.showTableStyleMenu();
        break;
      case 'horizontalAlign':
        this.showHorizontalAlignMenu();
        break;
      case 'verticalAlign':
        this.showVerticalAlignMenu();
        break;
      case 'cellBackgroundColor':
        this.showColorPicker();
        break;
      case 'cellStyle':
        this.showCellStyleMenu();
        break;
    }
  }

  /**
   * Refresh the menu (rebuild HTML to reflect toggled states)
   */
  private refreshMenu(): void {
    if (!this.menuElement || !this.activeCell) return;
    const availability = this.tableService.getActionAvailability(this.activeTable!, this.activeCell);
    this.menuElement.innerHTML = this.buildMenuHTML(availability);
    this.attachMenuHandlers();
  }

  // ==================== Row Dropdown ====================

  private showRowDropdown(): void {
    this.hideSubMenu();
    const btn = this.menuElement?.querySelector('[data-action="rowDropdown"]') as HTMLElement;
    if (!btn) return;

    const avail = this.tableService.getActionAvailability(this.activeTable!, this.activeCell!);

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';
    this.subMenuEl.innerHTML = `
      <button class="tcm-submenu-item" data-row-action="insertRowAbove">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="3" x2="12" y2="12"/>
          <line x1="9" y1="7" x2="12" y2="4"/>
          <line x1="15" y1="7" x2="12" y2="4"/>
        </svg>
        <span>Insert row above</span>
      </button>
      <button class="tcm-submenu-item" data-row-action="insertRowBelow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <line x1="9" y1="17" x2="12" y2="20"/>
          <line x1="15" y1="17" x2="12" y2="20"/>
        </svg>
        <span>Insert row below</span>
      </button>
      <button class="tcm-submenu-item tcm-submenu-item--danger${!avail.canDeleteRow ? ' tcm-submenu-item--disabled' : ''}" data-row-action="deleteRow"${!avail.canDeleteRow ? ' disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
        </svg>
        <span>Delete row</span>
      </button>
    `;

    this.subMenuEl.querySelectorAll('[data-row-action]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = (item as HTMLElement).getAttribute('data-row-action')!;
        this.placeCursorInCell(this.activeCell!);
        if (act === 'insertRowAbove') this.tableService.insertRowAbove();
        else if (act === 'insertRowBelow') this.tableService.insertRowBelow();
        else if (act === 'deleteRow') this.tableService.deleteRow();
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Column Dropdown ====================

  private showColumnDropdown(): void {
    this.hideSubMenu();
    const btn = this.menuElement?.querySelector('[data-action="columnDropdown"]') as HTMLElement;
    if (!btn) return;

    const avail = this.tableService.getActionAvailability(this.activeTable!, this.activeCell!);

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';
    this.subMenuEl.innerHTML = `
      <button class="tcm-submenu-item" data-col-action="insertColumnBefore">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="3" y1="12" x2="12" y2="12"/>
          <line x1="7" y1="9" x2="4" y2="12"/>
          <line x1="7" y1="15" x2="4" y2="12"/>
        </svg>
        <span>Insert column before</span>
      </button>
      <button class="tcm-submenu-item" data-col-action="insertColumnAfter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="12" y1="12" x2="21" y2="12"/>
          <line x1="17" y1="9" x2="20" y2="12"/>
          <line x1="17" y1="15" x2="20" y2="12"/>
        </svg>
        <span>Insert column after</span>
      </button>
      <button class="tcm-submenu-item tcm-submenu-item--danger${!avail.canDeleteColumn ? ' tcm-submenu-item--disabled' : ''}" data-col-action="deleteColumn"${!avail.canDeleteColumn ? ' disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="7" y1="8" x2="7" y2="16"/>
        </svg>
        <span>Delete column</span>
      </button>
    `;

    this.subMenuEl.querySelectorAll('[data-col-action]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = (item as HTMLElement).getAttribute('data-col-action')!;
        this.placeCursorInCell(this.activeCell!);
        if (act === 'insertColumnBefore') this.tableService.insertColumnBefore();
        else if (act === 'insertColumnAfter') this.tableService.insertColumnAfter();
        else if (act === 'deleteColumn') this.tableService.deleteColumn();
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Split / Merge Dropdown ====================

  private showSplitDropdown(): void {
    this.hideSubMenu();
    const btn = this.menuElement?.querySelector('[data-action="splitDropdown"]') as HTMLElement;
    if (!btn) return;

    // Merge is only available when 2+ cells are selected via Ctrl+click
    const canMerge = this.selectedCells.length >= 2;
    const mergeDisabled = !canMerge ? ' tcm-submenu-item--disabled' : '';

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';
    this.subMenuEl.innerHTML = `
      <button class="tcm-submenu-item${mergeDisabled}" data-split-action="mergeCells"${!canMerge ? ' disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="7" y1="12" x2="11" y2="12"/>
          <line x1="13" y1="12" x2="17" y2="12"/>
          <polyline points="9,10 7,12 9,14"/>
          <polyline points="15,10 17,12 15,14"/>
        </svg>
        <span>Merge cells</span>
      </button>
      <button class="tcm-submenu-item" data-split-action="splitVertical">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <line x1="8" y1="12" x2="4" y2="12"/>
          <line x1="20" y1="12" x2="16" y2="12"/>
          <polyline points="6,10 4,12 6,14"/>
          <polyline points="18,10 20,12 18,14"/>
        </svg>
        <span>Vertical split</span>
      </button>
      <button class="tcm-submenu-item" data-split-action="splitHorizontal">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="4"/>
          <line x1="12" y1="20" x2="12" y2="16"/>
          <polyline points="10,6 12,4 14,6"/>
          <polyline points="10,18 12,20 14,18"/>
        </svg>
        <span>Horizontal split</span>
      </button>
    `;

    this.subMenuEl.querySelectorAll('[data-split-action]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = (item as HTMLElement).getAttribute('data-split-action')!;
        if (act === 'mergeCells') {
          this.tableService.mergeCells(this.selectedCells);
          this.clearCellSelections();
        } else if (act === 'splitVertical') {
          this.placeCursorInCell(this.activeCell!);
          this.tableService.splitCellVertically(this.activeCell!);
        } else if (act === 'splitHorizontal') {
          this.placeCursorInCell(this.activeCell!);
          this.tableService.splitCellHorizontally(this.activeCell!);
        }
        this.hideSubMenu();
        this.refreshMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Table Settings Dropdown ====================

  private showTableSettingsDropdown(): void {
    this.hideSubMenu();
    const btn = this.menuElement?.querySelector('[data-action="tableSettings"]') as HTMLElement;
    if (!btn) return;

    const props = this.tableService.getTableProperties();

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu tcm-settings-panel';
    this.subMenuEl.innerHTML = `
      <div class="tcm-settings-title">Table Settings</div>
      <div class="tcm-settings-row">
        <label>Width</label>
        <input type="text" class="tcm-settings-input" data-prop="width" value="${props?.width || '100%'}" placeholder="e.g. 100%, 500px" />
      </div>
      <div class="tcm-settings-row">
        <label>Border</label>
        <input type="number" class="tcm-settings-input" data-prop="border" value="${props?.border || 1}" min="0" max="10" />
      </div>
      <div class="tcm-settings-row">
        <label>Cell Padding</label>
        <input type="number" class="tcm-settings-input" data-prop="cellPadding" value="${props?.cellPadding || 8}" min="0" max="50" />
      </div>
      <div class="tcm-settings-row">
        <label>Cell Spacing</label>
        <input type="number" class="tcm-settings-input" data-prop="cellSpacing" value="${props?.cellSpacing || 0}" min="0" max="20" />
      </div>
      <div class="tcm-settings-row">
        <label>Alignment</label>
        <select class="tcm-settings-select" data-prop="align">
          <option value="left"${!props?.align || props?.align === 'left' ? ' selected' : ''}>Left</option>
          <option value="center"${props?.align === 'center' ? ' selected' : ''}>Center</option>
          <option value="right"${props?.align === 'right' ? ' selected' : ''}>Right</option>
        </select>
      </div>
      <button class="tcm-settings-apply" data-settings-apply="true">Apply</button>
    `;

    this.subMenuEl.querySelector('[data-settings-apply]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const width = (this.subMenuEl!.querySelector('[data-prop="width"]') as HTMLInputElement)?.value;
      const border = parseInt((this.subMenuEl!.querySelector('[data-prop="border"]') as HTMLInputElement)?.value || '1', 10);
      const cellPadding = parseInt((this.subMenuEl!.querySelector('[data-prop="cellPadding"]') as HTMLInputElement)?.value || '8', 10);
      const cellSpacing = parseInt((this.subMenuEl!.querySelector('[data-prop="cellSpacing"]') as HTMLInputElement)?.value || '0', 10);
      const align = (this.subMenuEl!.querySelector('[data-prop="align"]') as HTMLSelectElement)?.value as 'left' | 'center' | 'right';

      this.tableService.updateTableProperties({ width, border, cellPadding, cellSpacing, align });
      this.hideSubMenu();
      this.notifyChange();
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Color Picker ====================

  private showColorPicker(): void {
    this.hideSubMenu();

    const btn = this.menuElement?.querySelector('[data-action="cellBackgroundColor"]') as HTMLElement;
    if (!btn) return;

    this.colorPickerEl = document.createElement('div');
    this.colorPickerEl.className = 'tcm-submenu tcm-color-picker';

    const colors = this.config.cellColorPresets || [];
    let html = '<div class="tcm-color-grid">';
    colors.forEach(color => {
      const isWhite = color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff';
      html += `<button class="tcm-color-swatch ${isWhite ? 'tcm-color-swatch--border' : ''}" 
                data-color="${color}" 
                title="${color}" 
                style="background-color: ${color}"></button>`;
    });
    html += '</div>';
    html += '<button class="tcm-color-clear" data-color="">Remove Color</button>';

    this.colorPickerEl.innerHTML = html;

    this.colorPickerEl.querySelectorAll('[data-color]').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const color = (swatch as HTMLElement).getAttribute('data-color') || '';
        this.placeCursorInCell(this.activeCell!);
        this.tableService.setCellBackgroundColor(color);
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.colorPickerEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.colorPickerEl);
    this.positionSubMenu(this.colorPickerEl, btn);
  }

  // ==================== Horizontal Alignment ====================

  private showHorizontalAlignMenu(): void {
    this.hideSubMenu();

    const btn = this.menuElement?.querySelector('[data-action="horizontalAlign"]') as HTMLElement;
    if (!btn) return;

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';

    const alignments: Array<{ value: 'left' | 'center' | 'right' | 'justify'; label: string; icon: string }> = [
      { value: 'left', label: 'Align Left', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>' },
      { value: 'center', label: 'Align Center', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>' },
      { value: 'right', label: 'Align Right', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>' },
      { value: 'justify', label: 'Justify', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' }
    ];

    const currentAlign = this.activeCell?.style.textAlign || 'left';

    let html = '';
    alignments.forEach(a => {
      const isActive = currentAlign === a.value;
      html += `<button class="tcm-submenu-item ${isActive ? 'tcm-submenu-item--active' : ''}" data-align="${a.value}">
        ${a.icon} <span>${a.label}</span>
      </button>`;
    });

    this.subMenuEl.innerHTML = html;

    this.subMenuEl.querySelectorAll('[data-align]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const align = (item as HTMLElement).getAttribute('data-align') as 'left' | 'center' | 'right' | 'justify';
        this.placeCursorInCell(this.activeCell!);
        this.tableService.setCellTextAlign(align);
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Vertical Alignment ====================

  private showVerticalAlignMenu(): void {
    this.hideSubMenu();

    const btn = this.menuElement?.querySelector('[data-action="verticalAlign"]') as HTMLElement;
    if (!btn) return;

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';

    const alignments: Array<{ value: 'top' | 'middle' | 'bottom'; label: string; icon: string }> = [
      { value: 'top', label: 'Align Top', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7" stroke-width="3"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="16" y2="17"/></svg>' },
      { value: 'middle', label: 'Align Middle', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12" stroke-width="3"/><line x1="8" y1="17" x2="16" y2="17"/></svg>' },
      { value: 'bottom', label: 'Align Bottom', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="17" x2="16" y2="17" stroke-width="3"/></svg>' }
    ];

    const currentAlign = this.activeCell?.style.verticalAlign || 'top';

    let html = '';
    alignments.forEach(a => {
      const isActive = currentAlign === a.value;
      html += `<button class="tcm-submenu-item ${isActive ? 'tcm-submenu-item--active' : ''}" data-valign="${a.value}">
        ${a.icon} <span>${a.label}</span>
      </button>`;
    });

    this.subMenuEl.innerHTML = html;

    this.subMenuEl.querySelectorAll('[data-valign]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const align = (item as HTMLElement).getAttribute('data-valign') as 'top' | 'middle' | 'bottom';
        this.placeCursorInCell(this.activeCell!);
        this.tableService.setCellVerticalAlign(align);
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Cell Style ====================

  private showCellStyleMenu(): void {
    this.hideSubMenu();

    const btn = this.menuElement?.querySelector('[data-action="cellStyle"]') as HTMLElement;
    if (!btn) return;

    const styles = this.config.tableCellStyles || {};
    if (Object.keys(styles).length === 0) return;

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';

    let html = '';
    Object.entries(styles).forEach(([cssClass, displayName]) => {
      const isActive = this.activeCell?.classList.contains(cssClass) || false;
      html += `<button class="tcm-submenu-item ${isActive ? 'tcm-submenu-item--active' : ''}" data-cell-style="${cssClass}">
        <span class="tcm-style-preview ${cssClass}"></span>
        <span>${displayName}</span>
        ${isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>`;
    });
    html += '<button class="tcm-submenu-item tcm-submenu-item--clear" data-cell-style="">Remove All Styles</button>';

    this.subMenuEl.innerHTML = html;

    this.subMenuEl.querySelectorAll('[data-cell-style]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cssClass = (item as HTMLElement).getAttribute('data-cell-style') || '';
        this.applyCellStyle(cssClass);
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Table Style ====================

  private showTableStyleMenu(): void {
    this.hideSubMenu();

    const btn = this.menuElement?.querySelector('[data-action="tableStyle"]') as HTMLElement;
    if (!btn) return;

    const styles = this.config.tableStyles || {};
    if (Object.keys(styles).length === 0) return;

    this.subMenuEl = document.createElement('div');
    this.subMenuEl.className = 'tcm-submenu';

    let html = '';
    Object.entries(styles).forEach(([cssClass, displayName]) => {
      const isActive = this.activeTable?.classList.contains(cssClass) || false;
      html += `<button class="tcm-submenu-item ${isActive ? 'tcm-submenu-item--active' : ''}" data-table-style="${cssClass}">
        <span>${displayName}</span>
        ${isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
      </button>`;
    });
    html += '<button class="tcm-submenu-item tcm-submenu-item--clear" data-table-style="">Remove All Styles</button>';

    this.subMenuEl.innerHTML = html;

    this.subMenuEl.querySelectorAll('[data-table-style]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cssClass = (item as HTMLElement).getAttribute('data-table-style') || '';
        this.applyTableStyle(cssClass);
        this.hideSubMenu();
        this.notifyChange();
      });
    });

    this.subMenuEl.addEventListener('mousedown', (e) => e.stopPropagation());
    document.body.appendChild(this.subMenuEl);
    this.positionSubMenu(this.subMenuEl, btn);
  }

  // ==================== Style Helpers ====================

  private applyCellStyle(cssClass: string): void {
    if (!this.activeCell) return;

    if (!cssClass) {
      const styles = this.config.tableCellStyles || {};
      Object.keys(styles).forEach(cls => {
        this.activeCell!.classList.remove(cls);
      });
      return;
    }

    const multipleStyles = this.config.tableCellMultipleStyles !== false;
    const hasClass = this.activeCell.classList.contains(cssClass);

    if (multipleStyles) {
      this.activeCell.classList.toggle(cssClass);
    } else {
      const styles = this.config.tableCellStyles || {};
      Object.keys(styles).forEach(cls => {
        this.activeCell!.classList.remove(cls);
      });
      if (!hasClass) {
        this.activeCell.classList.add(cssClass);
      }
    }
  }

  private applyTableStyle(cssClass: string): void {
    if (!this.activeTable) return;

    if (!cssClass) {
      const styles = this.config.tableStyles || {};
      Object.keys(styles).forEach(cls => {
        this.activeTable!.classList.remove(cls);
      });
      return;
    }

    const styles = this.config.tableStyles || {};
    const hasClass = this.activeTable.classList.contains(cssClass);
    Object.keys(styles).forEach(cls => {
      this.activeTable!.classList.remove(cls);
    });
    if (!hasClass) {
      this.activeTable.classList.add(cssClass);
    }
  }

  // ==================== Positioning ====================

  private positionMenu(cell: HTMLTableCellElement): void {
    if (!this.menuElement) return;

    const cellRect = cell.getBoundingClientRect();
    const menuWidth = this.menuElement.offsetWidth;
    const menuHeight = this.menuElement.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 8;

    let top = cellRect.top - menuHeight - gap + window.scrollY;
    let left = cellRect.left + (cellRect.width / 2) - (menuWidth / 2) + window.scrollX;

    if (top < window.scrollY) {
      top = cellRect.bottom + gap + window.scrollY;
    }

    if (top + menuHeight > viewportHeight + window.scrollY) {
      top = window.scrollY + gap;
    }

    if (left < gap) {
      left = gap;
    }
    if (left + menuWidth > viewportWidth - gap) {
      left = viewportWidth - menuWidth - gap;
    }

    this.menuElement.style.top = `${top}px`;
    this.menuElement.style.left = `${left}px`;
  }

  private positionSubMenu(subMenu: HTMLElement, btn: HTMLElement): void {
    const btnRect = btn.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 4;

    let top = btnRect.bottom + gap + window.scrollY;
    let left = btnRect.left + window.scrollX;

    requestAnimationFrame(() => {
      const menuWidth = subMenu.offsetWidth;
      const menuHeight = subMenu.offsetHeight;

      if (top + menuHeight > viewportHeight + window.scrollY) {
        top = btnRect.top - menuHeight - gap + window.scrollY;
      }

      if (left + menuWidth > viewportWidth - gap) {
        left = viewportWidth - menuWidth - gap;
      }
      if (left < gap) {
        left = gap;
      }

      subMenu.style.top = `${top}px`;
      subMenu.style.left = `${left}px`;
    });

    subMenu.style.position = 'absolute';
    subMenu.style.top = `${top}px`;
    subMenu.style.left = `${left}px`;
    subMenu.style.zIndex = '10002';
  }

  // ==================== Menu Visibility ====================

  hideMenu(): void {
    this.clearCellSelections();
    this.hideMenuDOM();
  }

  /** Tear down the menu DOM without touching cell selections (used internally by showMenu) */
  private hideMenuDOM(): void {
    this.hideSubMenu();
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler, true);
      this.documentClickHandler = null;
    }
  }

  private hideSubMenu(): void {
    if (this.colorPickerEl) {
      this.colorPickerEl.remove();
      this.colorPickerEl = null;
    }
    if (this.subMenuEl) {
      this.subMenuEl.remove();
      this.subMenuEl = null;
    }
  }

  // ==================== Helpers ====================

  private findParentCell(element: HTMLElement): HTMLTableCellElement | null {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      if (current.tagName === 'TD' || current.tagName === 'TH') {
        return current as HTMLTableCellElement;
      }
      current = current.parentElement;
    }
    return null;
  }

  private findParentTable(element: HTMLElement): HTMLTableElement | null {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      if (current.tagName === 'TABLE') {
        return current as HTMLTableElement;
      }
      current = current.parentElement;
    }
    return null;
  }

  private placeCursorInCell(cell: HTMLTableCellElement): void {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Called from onMouseUp in the editor. Detects when the user has drag-selected
   * two or more table cells and enables merge accordingly.
   */
  handleMouseUpSelection(event: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const ancestorEl = (ancestor.nodeType === Node.ELEMENT_NODE
      ? ancestor
      : ancestor.parentElement) as HTMLElement | null;

    const table = ancestorEl?.closest('table') as HTMLTableElement | null;
    if (!table) return;

    // Find every TD/TH in the table whose DOM node overlaps with the selection range
    const allCells = Array.from(table.querySelectorAll('td, th')) as HTMLTableCellElement[];
    const cells = allCells.filter(cell => range.intersectsNode(cell));

    if (cells.length >= 2) {
      this.clearCellSelections();
      this.selectedCells = cells;
      cells.forEach(c => c.classList.add('tcm-cell-selected'));
      this.activeTable = table;
      this.activeCell = cells[0];
      // Show (or refresh) the context menu so Merge Cells is enabled
      setTimeout(() => this.showMenu(cells[0]), 50);
    }
  }

  private clearCellSelections(): void {
    this.selectedCells.forEach(c => c.classList.remove('tcm-cell-selected'));
    this.selectedCells = [];
  }

  private notifyChange(): void {
    if (this.contentArea) {
      this.contentArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (this.changeCallback) {
      this.changeCallback();
    }
  }

  isMenuOpen(): boolean {
    return this.menuElement !== null;
  }

  getActiveCell(): HTMLTableCellElement | null {
    return this.activeCell;
  }

  getActiveTable(): HTMLTableElement | null {
    return this.activeTable;
  }

  cleanup(): void {
    this.hideMenu();
    this.activeCell = null;
    this.activeTable = null;
    this.contentArea = null;
    this.changeCallback = null;
  }
}
