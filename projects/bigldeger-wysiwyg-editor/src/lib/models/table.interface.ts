/**
 * Table configuration and data interfaces
 */

export interface TableData {
  /** Number of rows */
  rows: number;
  /** Number of columns */
  columns: number;
  /** Table width */
  width?: string;
  /** Table border width */
  border?: number;
  /** Cell padding */
  cellPadding?: number;
  /** Cell spacing */
  cellSpacing?: number;
  /** Table alignment */
  align?: 'left' | 'center' | 'right';
  /** Table CSS classes */
  cssClass?: string;
  /** Table inline styles */
  style?: string;
  /** Whether to include header row */
  hasHeader?: boolean;
  /** Whether to include footer row */
  hasFooter?: boolean;
}

export interface TableCellData {
  /** Cell content */
  content: string;
  /** Row span */
  rowSpan?: number;
  /** Column span */
  colSpan?: number;
  /** Cell background color */
  backgroundColor?: string;
  /** Cell text alignment */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  /** Cell vertical alignment */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Cell width */
  width?: string;
  /** Cell height */
  height?: string;
}

export interface TableSelection {
  /** Selected table element */
  table: HTMLTableElement;
  /** Selected cell element */
  cell?: HTMLTableCellElement;
  /** Selected row element */
  row?: HTMLTableRowElement;
  /** Row index */
  rowIndex?: number;
  /** Cell index */
  cellIndex?: number;
}

export interface TableCellStyle {
  /** CSS class name */
  cssClass: string;
  /** Display name shown in the menu */
  displayName: string;
}

export interface TableStyle {
  /** CSS class name */
  cssClass: string;
  /** Display name shown in the menu */
  displayName: string;
}

export interface TableConfig {
  /** Default number of rows */
  defaultRows?: number;
  /** Default number of columns */
  defaultColumns?: number;
  /** Allow nested tables */
  allowNested?: boolean;
  /** Enable cell merging */
  enableMerge?: boolean;
  /** Enable table resizing */
  enableResize?: boolean;
  /** Default table styles */
  defaultStyles?: {
    border?: string;
    borderCollapse?: 'collapse' | 'separate';
    width?: string;
  };
  /** Custom cell styles - key is CSS class, value is display name */
  tableCellStyles?: Record<string, string>;
  /** Custom table styles - key is CSS class, value is display name */
  tableStyles?: Record<string, string>;
  /** Allow multiple cell styles at once (default: true) */
  tableCellMultipleStyles?: boolean;
  /** Cell background color presets */
  cellColorPresets?: string[];
}

export interface TableCellPosition {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based, accounts for colspan) */
  column: number;
}

export interface TableCellRange {
  /** Start position of the range */
  start: TableCellPosition;
  /** End position of the range */
  end: TableCellPosition;
}

export interface TableActionAvailability {
  canMerge: boolean;
  canSplitVertical: boolean;
  canSplitHorizontal: boolean;
  canInsertRowAbove: boolean;
  canInsertRowBelow: boolean;
  canDeleteRow: boolean;
  canInsertColumnBefore: boolean;
  canInsertColumnAfter: boolean;
  canDeleteColumn: boolean;
  canToggleHeader: boolean;
  canToggleFooter: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
}
