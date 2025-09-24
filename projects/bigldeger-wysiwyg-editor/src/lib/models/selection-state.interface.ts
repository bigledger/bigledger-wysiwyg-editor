/**
 * Interface representing the current selection state in the editor
 */
export interface SelectionState {
  /** The current Range object, null if no selection */
  range: Range | null;
  /** Whether the selection is collapsed (cursor position) */
  collapsed: boolean;
  /** Currently active formatting options */
  formats: ActiveFormats;
  /** Start offset of the selection */
  startOffset?: number;
  /** End offset of the selection */
  endOffset?: number;
  /** Selected text content */
  selectedText?: string;
  /** Whether the selection spans multiple elements */
  isMultiElement?: boolean;
}

/**
 * Interface representing active formatting states
 */
export interface ActiveFormats {
  /** Whether bold formatting is active */
  bold: boolean;
  /** Whether italic formatting is active */
  italic: boolean;
  /** Whether underline formatting is active */
  underline: boolean;
  /** Whether strikethrough formatting is active */
  strikethrough?: boolean;
  /** Current font size (e.g., '14px', '1.2em') */
  fontSize: string;
  /** Current font color (hex, rgb, or named color) */
  fontColor: string;
  /** Current background color (hex, rgb, or named color) */
  backgroundColor: string;
  /** Current text alignment */
  alignment: TextAlignment;
  /** Whether text is in a list */
  inList?: boolean;
  /** Type of list if in a list */
  listType?: 'ordered' | 'unordered';
  /** Current list nesting level */
  listLevel?: number;
  /** Whether text is in a link */
  inLink?: boolean;
  /** Link URL if in a link */
  linkUrl?: string;
}

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Selection direction
 */
export type SelectionDirection = 'forward' | 'backward' | 'none';

/**
 * Extended selection information
 */
export interface ExtendedSelectionState extends SelectionState {
  /** Direction of the selection */
  direction: SelectionDirection;
  /** Whether the selection is at the start of the document */
  atStart: boolean;
  /** Whether the selection is at the end of the document */
  atEnd: boolean;
  /** Parent element containing the selection */
  parentElement?: Element;
}