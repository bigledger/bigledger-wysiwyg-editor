import { Injectable } from '@angular/core';
import { SelectionState, ActiveFormats, ExtendedSelectionState } from '../models/selection-state.interface';
import { ErrorHandlerService } from './error-handler.service';

export interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Service for managing text selection and cursor position
 */
@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Get current selection
   */
  getSelection(): Selection | null {
    try {
      return window.getSelection();
    } catch (error) {
      this.errorHandler.handleSelectionError('getSelection', { 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Get current range
   */
  getRange(): Range | null {
    try {
      const selection = this.getSelection();
      if (selection && selection.rangeCount > 0) {
        return selection.getRangeAt(0);
      }
      return null;
    } catch (error) {
      this.errorHandler.handleSelectionError('getRange', { 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Save current selection state
   */
  saveSelection(): SelectionState {
    const selection = this.getSelection();
    const range = this.getRange();

    if (!selection || !range) {
      return {
        range: null,
        collapsed: true,
        formats: this.getDefaultFormats(),
        startOffset: 0,
        endOffset: 0,
        selectedText: ''
      };
    }

    return {
      range: range.cloneRange(),
      collapsed: selection.isCollapsed,
      formats: this.getActiveFormats(),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      selectedText: selection.toString()
    };
  }

  /**
   * Restore selection from saved state
   */
  restoreSelection(state: SelectionState): void {
    try {
      if (!state.range) {
        return;
      }

      const selection = this.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(state.range);
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('restoreSelection', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Get active formatting at current selection
   */
  private getActiveFormats(): ActiveFormats {
    try {
      return {
        bold: this.queryCommandState('bold'),
        italic: this.queryCommandState('italic'),
        underline: this.queryCommandState('underline'),
        strikethrough: this.queryCommandState('strikethrough'),
        fontSize: this.getCurrentFontSize(),
        fontFamily: this.getCurrentFontFamily(),
        fontColor: this.queryCommandValue('foreColor') || '#000000',
        backgroundColor: this.queryCommandValue('backColor') || 'transparent',
        alignment: this.getCurrentAlignment()
      };
    } catch (error) {
      return this.getDefaultFormats();
    }
  }

  /**
   * Get default formatting values
   */
  private getDefaultFormats(): ActiveFormats {
    return {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontColor: '#000000',
      backgroundColor: 'transparent',
      alignment: 'left'
    };
  }

  /**
   * Safe wrapper for queryCommandState (deprecated but still needed)
   */
  private queryCommandState(command: string): boolean {
    try {
      return document.queryCommandState(command);
    } catch (error) {
      return false;
    }
  }

  /**
   * Safe wrapper for queryCommandValue (deprecated but still needed)
   */
  private queryCommandValue(command: string): string {
    try {
      return document.queryCommandValue(command);
    } catch (error) {
      return '';
    }
  }

  /**
   * Get current text alignment
   */
  private getCurrentAlignment(): 'left' | 'center' | 'right' | 'justify' {
    try {
      if (this.queryCommandState('justifyLeft')) return 'left';
      if (this.queryCommandState('justifyCenter')) return 'center';
      if (this.queryCommandState('justifyRight')) return 'right';
      if (this.queryCommandState('justifyFull')) return 'justify';
      return 'left';
    } catch (error) {
      return 'left';
    }
  }

  /**
   * Get current font size in a toolbar-friendly pixel value.
   */
  private getCurrentFontSize(): string {
    try {
      const selection = this.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element: Node | null = range.commonAncestorContainer;

        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }

        while (element && element.nodeType === Node.ELEMENT_NODE) {
          const computedStyle = window.getComputedStyle(element as Element);
          const fontSize = this.normalizeFontSize(computedStyle.fontSize);

          if (fontSize) {
            return fontSize;
          }

          element = (element as Element).parentElement;
        }
      }

      return this.normalizeFontSize(this.queryCommandValue('fontSize')) || '14px';
    } catch (error) {
      return '14px';
    }
  }

  /**
   * Get current font family
   */
  private getCurrentFontFamily(): string {
    try {
      // Try queryCommandValue first (deprecated but still works in some browsers)
      const commandValue = this.queryCommandValue('fontName');
      if (commandValue && commandValue !== '') {
        return this.normalizeFontFamily(commandValue);
      }

      // Fallback: check computed style of current selection
      const selection = this.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element: Node | null = range.commonAncestorContainer;

        // If it's a text node, get its parent element
        if (element.nodeType === Node.TEXT_NODE) {
          element = element.parentElement;
        }

        // Walk up the DOM tree to find the closest element with font-family
        while (element && element.nodeType === Node.ELEMENT_NODE) {
          const computedStyle = window.getComputedStyle(element as Element);
          const fontFamily = computedStyle.fontFamily;
          
          if (fontFamily && fontFamily !== '' && fontFamily !== 'inherit') {
            // Clean up the font family string (remove quotes, normalize)
            return this.normalizeFontFamily(fontFamily);
          }
          
          element = (element as Element).parentElement;
        }
      }

      return 'Arial, sans-serif';
    } catch (error) {
      return 'Arial, sans-serif';
    }
  }

  /**
   * Normalize font family string
   */
  private normalizeFontFamily(fontFamily: string): string {
    // Remove quotes and get the first font family
    const normalized = fontFamily
      .replace(/['"]/g, '')
      .split(',')[0]
      .trim();
    
    // Map common system fonts to our standard names
    const fontMap: Record<string, string> = {
      'arial': 'Arial, sans-serif',
      'helvetica': 'Helvetica, sans-serif',
      'times new roman': 'Times New Roman, serif',
      'times': 'Times New Roman, serif',
      'georgia': 'Georgia, serif',
      'courier new': 'Courier New, monospace',
      'courier': 'Courier New, monospace',
      'verdana': 'Verdana, sans-serif',
      'trebuchet ms': 'Trebuchet MS, sans-serif',
      'impact': 'Impact, sans-serif'
    };
    
    const lowerNormalized = normalized.toLowerCase();
    return fontMap[lowerNormalized] || fontFamily;
  }

  /**
   * Normalize font-size values into pixel strings used by the toolbar config.
   */
  private normalizeFontSize(fontSize: string): string {
    if (!fontSize) {
      return '';
    }

    const normalized = fontSize.trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      const sizeMap: Record<string, string> = {
        '1': '10px',
        '2': '12px',
        '3': '14px',
        '4': '16px',
        '5': '18px',
        '6': '24px',
        '7': '32px'
      };

      return sizeMap[normalized] || '';
    }

    if (normalized.endsWith('px')) {
      const pixelValue = Number.parseFloat(normalized);
      return Number.isFinite(pixelValue) ? `${Math.round(pixelValue)}px` : '';
    }

    if (normalized.endsWith('pt')) {
      const pointValue = Number.parseFloat(normalized);
      return Number.isFinite(pointValue) ? `${Math.round(pointValue * (4 / 3))}px` : '';
    }

    return normalized;
  }

  /**
   * Select text within an element
   */
  selectText(element: Element, start: number, end?: number): boolean {
    try {
      const textNode = this.findFirstTextNode(element);
      if (!textNode) {
        return false;
      }

      const range = document.createRange();
      range.setStart(textNode, Math.min(start, textNode.textContent?.length || 0));
      range.setEnd(textNode, Math.min(end || start, textNode.textContent?.length || 0));

      const selection = this.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandler.handleSelectionError('selectText', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Set cursor position within an element
   */
  setCursorPosition(element: Node, offset: number): boolean {
    try {
      const range = document.createRange();
      range.setStart(element, Math.min(offset, element.childNodes.length));
      range.setEnd(element, Math.min(offset, element.childNodes.length));

      const selection = this.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      return false;
    } catch (error) {
      this.errorHandler.handleSelectionError('setCursorPosition', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Find first text node in element
   */
  private findFirstTextNode(element: Node): Text | null {
    if (element.nodeType === Node.TEXT_NODE) {
      return element as Text;
    }

    for (let i = 0; i < element.childNodes.length; i++) {
      const textNode = this.findFirstTextNode(element.childNodes[i]);
      if (textNode) {
        return textNode;
      }
    }

    return null;
  }

  /**
   * Get selection direction
   */
  getSelectionDirection(selection?: Selection | null): 'forward' | 'backward' | 'none' {
    if (!selection) {
      selection = this.getSelection();
    }

    if (!selection || selection.isCollapsed) {
      return 'none';
    }

    try {
      const position = selection.anchorNode?.compareDocumentPosition(selection.focusNode!);
      
      if (position === 0) {
        // Same node
        return selection.anchorOffset <= selection.focusOffset ? 'forward' : 'backward';
      } else if (position && position & Node.DOCUMENT_POSITION_FOLLOWING) {
        return 'forward';
      } else {
        return 'backward';
      }
    } catch (error) {
      return 'none';
    }
  }

  /**
   * Get selection position coordinates
   */
  getSelectionPosition(): SelectionPosition | null {
    try {
      const selection = this.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return null;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      return {
        x: rect.left,
        y: rect.top
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get extended selection state with additional information
   */
  getExtendedSelectionState(): ExtendedSelectionState {
    const baseState = this.saveSelection();
    const selection = this.getSelection();

    return {
      ...baseState,
      direction: this.getSelectionDirection(selection),
      atStart: this.isAtDocumentStart(),
      atEnd: this.isAtDocumentEnd()
    };
  }

  /**
   * Check if selection is at document start
   */
  private isAtDocumentStart(): boolean {
    try {
      const selection = this.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return false;
      }
      const range = selection.getRangeAt(0);
      return range.startOffset === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if selection is at document end
   */
  private isAtDocumentEnd(): boolean {
    try {
      const selection = this.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return false;
      }
      const range = selection.getRangeAt(0);
      const container = range.endContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        return range.endOffset === (container.textContent?.length || 0);
      }
      return range.endOffset === container.childNodes.length;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if selection is valid
   */
  isValidSelection(selection?: Selection | null): boolean {
    if (!selection) {
      selection = this.getSelection();
    }

    return !!(selection && selection.rangeCount > 0);
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    try {
      const selection = this.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('clearSelection', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Collapse selection to start or end
   */
  collapseSelection(toStart: boolean = true): void {
    try {
      const selection = this.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.collapse(toStart);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('collapseSelection', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Select all content in the specified element or document body
   */
  selectAll(element?: Element): void {
    try {
      const targetElement = element || document.body;
      const selection = this.getSelection();
      
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(targetElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('selectAll', {
        error: (error as Error).message,
        element: element?.tagName || 'body'
      });
    }
  }

  /**
   * Collapse selection to start or end (alias for collapseSelection)
   */
  collapse(toStart?: boolean): void {
    this.collapseSelection(toStart ?? true);
  }

  /**
   * Check if there is an active text selection
   */
  hasSelection(): boolean {
    try {
      const selection = this.getSelection();
      return !!(selection && selection.rangeCount > 0 && !selection.isCollapsed);
    } catch (error) {
      this.errorHandler.handleSelectionError('hasSelection', {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Get the currently selected text
   */
  getSelectedText(): string {
    try {
      const selection = this.getSelection();
      return selection ? selection.toString() : '';
    } catch (error) {
      this.errorHandler.handleSelectionError('getSelectedText', {
        error: (error as Error).message
      });
      return '';
    }
  }

  /**
   * Wrap the current selection with the specified HTML tag and attributes
   */
  wrapSelection(tagName: string, attributes?: any): void {
    try {
      const range = this.getRange();
      if (!range || range.collapsed) {
        this.errorHandler.handleSelectionError('wrapSelection', {
          error: 'No text selected to wrap',
          tagName
        });
        return;
      }

      // Validate the selection and range
      if (!this.isValidRange(range)) {
        this.errorHandler.handleSelectionError('wrapSelection', {
          error: 'Invalid range detected',
          tagName
        });
        return;
      }

      const wrapperElement = document.createElement(tagName);
      
      // Add attributes if provided
      if (attributes) {
        Object.keys(attributes).forEach(key => {
          wrapperElement.setAttribute(key, attributes[key]);
        });
      }

      try {
        // Try the standard approach first
        range.surroundContents(wrapperElement);
      } catch (surroundError) {
        // Fallback method for complex selections
        this.wrapSelectionFallback(tagName, attributes);
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('wrapSelection', {
        error: (error as Error).message,
        tagName,
        attributes
      });
    }
  }

  /**
   * Fallback method for wrapping selection when surroundContents fails
   */
  private wrapSelectionFallback(tagName: string, attributes?: any): void {
    try {
      const range = this.getRange();
      if (!range) return;

      const contents = range.extractContents();
      const wrapperElement = document.createElement(tagName);
      
      // Add attributes if provided
      if (attributes) {
        Object.keys(attributes).forEach(key => {
          wrapperElement.setAttribute(key, attributes[key]);
        });
      }

      wrapperElement.appendChild(contents);
      range.insertNode(wrapperElement);

      // Update selection to include the wrapper
      const selection = this.getSelection();
      if (selection) {
        range.selectNode(wrapperElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      this.errorHandler.handleSelectionError('wrapSelectionFallback', {
        error: (error as Error).message,
        tagName,
        attributes
      });
    }
  }

  /**
   * Validate if a range is valid and safe to use
   */
  private isValidRange(range: Range): boolean {
    try {
      if (!range || !range.startContainer || !range.endContainer) {
        return false;
      }

      // Check if containers are still in the document
      if (!document.contains(range.startContainer) || !document.contains(range.endContainer)) {
        return false;
      }

      // Check for valid offsets
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textLength = range.startContainer.textContent?.length || 0;
        if (range.startOffset < 0 || range.startOffset > textLength) {
          return false;
        }
      }

      if (range.endContainer.nodeType === Node.TEXT_NODE) {
        const textLength = range.endContainer.textContent?.length || 0;
        if (range.endOffset < 0 || range.endOffset > textLength) {
          return false;
        }
      }

      // Try to clone the range to ensure it's not corrupted
      range.cloneRange();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate and recover selection if possible
   */
  private validateAndRecoverSelection(): { valid: boolean; selection: Selection | null; range: Range | null } {
    try {
      const selection = this.getSelection();
      if (!selection) {
        return { valid: false, selection: null, range: null };
      }

      if (selection.rangeCount === 0) {
        // Try to create a default range at document start
        try {
          const range = document.createRange();
          range.setStart(document.body, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return { valid: true, selection, range };
        } catch (recoveryError) {
          this.errorHandler.handleSelectionError('validateAndRecoverSelection', {
            error: 'Failed to recover selection',
            recoveryError: (recoveryError as Error).message
          });
          return { valid: false, selection, range: null };
        }
      }

      const range = selection.getRangeAt(0);
      if (!this.isValidRange(range)) {
        const repairedRange = this.repairRange(range);
        if (repairedRange) {
          selection.removeAllRanges();
          selection.addRange(repairedRange);
          return { valid: true, selection, range: repairedRange };
        }
        return { valid: false, selection, range: null };
      }

      return { valid: true, selection, range };
    } catch (error) {
      this.errorHandler.handleSelectionError('validateAndRecoverSelection', {
        error: (error as Error).message
      });
      return { valid: false, selection: null, range: null };
    }
  }

  /**
   * Attempt to repair a corrupted range
   */
  private repairRange(range: Range): Range | null {
    try {
      const newRange = document.createRange();
      
      // Use safe containers and offsets
      let startContainer = range.startContainer;
      let endContainer = range.endContainer;
      let startOffset = range.startOffset;
      let endOffset = range.endOffset;

      // Ensure containers are in the document
      if (!document.contains(startContainer)) {
        startContainer = document.body;
        startOffset = 0;
      }

      if (!document.contains(endContainer)) {
        endContainer = document.body;
        endOffset = 0;
      }

      // Clamp offsets to valid ranges
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textLength = startContainer.textContent?.length || 0;
        startOffset = Math.max(0, Math.min(startOffset, textLength));
      } else {
        startOffset = Math.max(0, Math.min(startOffset, startContainer.childNodes.length));
      }

      if (endContainer.nodeType === Node.TEXT_NODE) {
        const textLength = endContainer.textContent?.length || 0;
        endOffset = Math.max(0, Math.min(endOffset, textLength));
      } else {
        endOffset = Math.max(0, Math.min(endOffset, endContainer.childNodes.length));
      }

      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);

      return newRange;
    } catch (error) {
      this.errorHandler.handleSelectionError('repairRange', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Create a safe range with boundary checking
   */
  private createSafeRange(startContainer: Node, startOffset: number, endContainer?: Node, endOffset?: number): Range | null {
    try {
      const range = document.createRange();
      
      // Clamp start offset
      if (startContainer.nodeType === Node.TEXT_NODE) {
        const textLength = startContainer.textContent?.length || 0;
        startOffset = Math.max(0, Math.min(startOffset, textLength));
      } else {
        startOffset = Math.max(0, Math.min(startOffset, startContainer.childNodes.length));
      }

      range.setStart(startContainer, startOffset);

      if (endContainer && endOffset !== undefined) {
        // Clamp end offset
        if (endContainer.nodeType === Node.TEXT_NODE) {
          const textLength = endContainer.textContent?.length || 0;
          endOffset = Math.max(0, Math.min(endOffset, textLength));
        } else {
          endOffset = Math.max(0, Math.min(endOffset, endContainer.childNodes.length));
        }
        range.setEnd(endContainer, endOffset);
      } else {
        range.collapse(true);
      }

      return range;
    } catch (error) {
      this.errorHandler.handleSelectionError('createSafeRange', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Safely restore selection with validation and recovery
   */
  restoreSelectionSafely(state: SelectionState): boolean {
    try {
      if (!state.range) {
        return false;
      }

      // Validate the range before restoring
      if (!this.isValidRange(state.range)) {
        const repairedRange = this.repairRange(state.range);
        if (!repairedRange) {
          return false;
        }
        state.range = repairedRange;
      }

      const selection = this.getSelection();
      if (!selection) {
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(state.range);
      return true;
    } catch (error) {
      this.errorHandler.handleSelectionError('restoreSelectionSafely', {
        error: (error as Error).message
      });
      
      // Try to create a fallback selection
      try {
        const selection = this.getSelection();
        if (selection) {
          const fallbackRange = document.createRange();
          fallbackRange.setStart(document.body, 0);
          fallbackRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(fallbackRange);
        }
      } catch (fallbackError) {
        // Silent fallback failure
      }
      
      return false;
    }
  }

  /**
   * Safely select text with validation and error handling
   */
  selectTextSafely(element: Element, start: number, end?: number): boolean {
    try {
      const textNode = this.findFirstTextNode(element);
      if (!textNode) {
        return false;
      }

      const selection = this.getSelection();
      if (!selection) {
        return false;
      }

      const range = this.createSafeRange(textNode, start, textNode, end || start);
      if (!range) {
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch (error) {
      this.errorHandler.handleSelectionError('selectTextSafely', {
        error: (error as Error).message,
        element: element.tagName,
        start,
        end
      });
      return false;
    }
  }

  /**
   * Safely set cursor position with validation
   */
  setCursorPositionSafely(element: Node, offset: number): boolean {
    try {
      const selection = this.getSelection();
      if (!selection) {
        return false;
      }

      const range = this.createSafeRange(element, offset);
      if (!range) {
        return false;
      }

      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch (error) {
      this.errorHandler.handleSelectionError('setCursorPositionSafely', {
        error: (error as Error).message,
        nodeType: element.nodeType,
        offset
      });
      return false;
    }
  }

  /**
   * Safely get selection with validation and recovery
   */
  getSelectionSafely(): { selection: Selection | null; range: Range | null; error?: string } {
    try {
      const validationResult = this.validateAndRecoverSelection();
      return {
        selection: validationResult.selection,
        range: validationResult.range,
        error: validationResult.valid ? undefined : 'Invalid selection'
      };
    } catch (error) {
      this.errorHandler.handleSelectionError('getSelectionSafely', {
        error: (error as Error).message
      });
      return {
        selection: null,
        range: null,
        error: (error as Error).message
      };
    }
  }

  /**
   * Find valid parent element for selection operations
   */
  private findValidParent(node: Node): Element | null {
    try {
      let current = node;
      while (current && current !== document.body) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const element = current as Element;
          if (document.contains(element)) {
            return element;
          }
        }
        current = current.parentNode!;
      }
      return document.body;
    } catch (error) {
      return document.body;
    }
  }
}
