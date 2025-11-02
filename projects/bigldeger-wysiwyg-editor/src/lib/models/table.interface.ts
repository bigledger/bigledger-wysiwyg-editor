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
}
