import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HistoryState, HistoryConfig, HistoryManager } from '../models/history.interface';

/**
 * Service for managing editor history and undo/redo functionality
 */
@Injectable({
  providedIn: 'root'
})
export class HistoryService implements HistoryManager {
  private readonly defaultConfig: HistoryConfig = {
    maxStates: 50,
    debounceTime: 1000,
    excludeCommands: ['undo', 'redo', 'selectAll']
  };

  private config: HistoryConfig;
  private states: HistoryState[] = [];
  private currentIndex = -1;
  private lastStateTime = 0;

  // Observables for state changes
  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);
  private currentStateSubject = new BehaviorSubject<HistoryState | null>(null);

  public canUndo$ = this.canUndoSubject.asObservable();
  public canRedo$ = this.canRedoSubject.asObservable();
  public currentState$ = this.currentStateSubject.asObservable();

  constructor() {
    this.config = { ...this.defaultConfig };
  }

  /**
   * Configure the history service
   */
  configure(config: Partial<HistoryConfig>): void {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Add a new state to history
   */
  addState(state: HistoryState): void {
    const now = Date.now();
    
    // Check if command should be excluded
    if (state.command && this.config.excludeCommands?.includes(state.command)) {
      return;
    }

    // Check debounce time
    if (this.config.debounceTime && now - this.lastStateTime < this.config.debounceTime) {
      // Update the last state instead of creating a new one
      if (this.states.length > 0 && this.currentIndex >= 0) {
        this.states[this.currentIndex] = {
          ...state,
          timestamp: now
        };
        this.currentStateSubject.next(state);
        return;
      }
    }

    // Remove any states after current index (when adding after undo)
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.states.push(state);
    this.currentIndex = this.states.length - 1;
    this.lastStateTime = now;

    // Enforce max states limit
    if (this.config.maxStates && this.states.length > this.config.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }

    this.updateObservables();
  }

  /**
   * Undo the last action
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    const state = this.states[this.currentIndex];
    this.updateObservables();
    
    return state;
  }

  /**
   * Redo the next action
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const state = this.states[this.currentIndex];
    this.updateObservables();
    
    return state;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.states = [];
    this.currentIndex = -1;
    this.lastStateTime = 0;
    this.updateObservables();
  }

  /**
   * Get current state index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total number of states
   */
  getStateCount(): number {
    return this.states.length;
  }

  /**
   * Get current state
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
      return this.states[this.currentIndex];
    }
    return null;
  }

  /**
   * Get all states (for debugging)
   */
  getAllStates(): HistoryState[] {
    return [...this.states];
  }

  /**
   * Create a history state from current editor content
   */
  createState(content: string, command?: string, selection?: { start: number; end: number }): HistoryState {
    return {
      id: this.generateId(),
      content,
      selection,
      timestamp: Date.now(),
      command
    };
  }

  /**
   * Update observables with current state
   */
  private updateObservables(): void {
    this.canUndoSubject.next(this.canUndo());
    this.canRedoSubject.next(this.canRedo());
    this.currentStateSubject.next(this.getCurrentState());
  }

  /**
   * Generate unique ID for history state
   */
  private generateId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get selection position from Range
   */
  getSelectionPosition(element: Element): { start: number; end: number } | undefined {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return undefined;
    }

    const range = selection.getRangeAt(0);
    
    try {
      // Create a range that spans from the beginning of the element to the start of selection
      const preRange = document.createRange();
      preRange.selectNodeContents(element);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;

      // Calculate end position
      const end = start + range.toString().length;

      return { start, end };
    } catch (error) {
      console.warn('Failed to get selection position:', error);
      return undefined;
    }
  }

  /**
   * Restore selection position in element
   */
  restoreSelectionPosition(element: Element, position: { start: number; end: number }): void {
    try {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const range = document.createRange();
      let currentPos = 0;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;

      // Walk through text nodes to find start and end positions
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      while (node = walker.nextNode()) {
        const textLength = node.textContent?.length || 0;
        
        if (!startNode && currentPos + textLength >= position.start) {
          startNode = node;
          startOffset = position.start - currentPos;
        }
        
        if (!endNode && currentPos + textLength >= position.end) {
          endNode = node;
          endOffset = position.end - currentPos;
          break;
        }
        
        currentPos += textLength;
      }

      if (startNode) {
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        
        if (endNode) {
          range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0));
        } else {
          range.setEnd(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
        }

        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.warn('Failed to restore selection position:', error);
    }
  }
}