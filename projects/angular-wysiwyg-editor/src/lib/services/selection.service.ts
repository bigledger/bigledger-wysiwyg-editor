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
        fontSize: this.queryCommandValue('fontSize') || '14px',
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
}