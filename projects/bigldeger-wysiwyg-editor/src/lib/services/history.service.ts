import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HistoryState, HistoryConfig, HistoryManager, CommandGroup, HistoryBranch } from '../models/history.interface';
import { ErrorHandlerService } from './error-handler.service';

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
    excludeCommands: ['undo', 'redo', 'selectAll'],
    enableCompression: true,
    compressionThreshold: 10000, // 10KB
    enableGrouping: true,
    maxGroupDuration: 2000, // 2 seconds
    enableBranching: true,
    maxBranches: 10
  };

  private config: HistoryConfig;
  private states: HistoryState[] = [];
  private currentIndex = -1;
  private lastStateTime = 0;

  // Command grouping
  private activeGroups: Map<string, CommandGroup> = new Map();
  private currentGroupId: string | null = null;

  // History branching
  private branches: Map<string, HistoryBranch> = new Map();
  private currentBranchId = 'main';
  private branchCounter = 0;

  // Observables for state changes
  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);
  private currentStateSubject = new BehaviorSubject<HistoryState | null>(null);

  public canUndo$ = this.canUndoSubject.asObservable();
  public canRedo$ = this.canRedoSubject.asObservable();
  public currentState$ = this.currentStateSubject.asObservable();

  constructor(private errorHandler: ErrorHandlerService) {
    this.config = { ...this.defaultConfig };
    this.initializeMainBranch();
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
   * Undo the last action with decompression support
   */
  undo(): HistoryState | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    const state = this.states[this.currentIndex];
    this.updateObservables();
    
    return {
      ...state,
      content: this.decompressContent(state.content, state.compressed)
    };
  }

  /**
   * Redo the next action with decompression support
   */
  redo(): HistoryState | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    const state = this.states[this.currentIndex];
    this.updateObservables();
    
    return {
      ...state,
      content: this.decompressContent(state.content, state.compressed)
    };
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
   * Get current state with decompression support
   */
  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
      const state = this.states[this.currentIndex];
      return {
        ...state,
        content: this.decompressContent(state.content, state.compressed)
      };
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
    return `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      this.errorHandler.handleSelectionError('getSelectionPosition', {
        error: (error as Error).message,
        element: element.tagName
      });
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
        this.errorHandler.handleSelectionError('restoreSelectionPosition', {
          error: 'No selection available'
        });
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
      this.errorHandler.handleSelectionError('restoreSelectionPosition', {
        error: (error as Error).message,
        element: element.tagName,
        position
      });
    }
  }

  /**
   * Initialize the main branch
   */
  private initializeMainBranch(): void {
    const mainBranch: HistoryBranch = {
      id: 'main',
      name: 'Main',
      states: [],
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };
    this.branches.set('main', mainBranch);
  }

  /**
   * Start a command group for batching operations
   */
  startGroup(description?: string): string {
    if (!this.config.enableGrouping) {
      return '';
    }

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const group: CommandGroup = {
      id: groupId,
      commands: [],
      startTime: Date.now(),
      description
    };

    this.activeGroups.set(groupId, group);
    this.currentGroupId = groupId;

    return groupId;
  }

  /**
   * End a command group
   */
  endGroup(groupId: string): void {
    if (!this.config.enableGrouping) {
      return;
    }

    const group = this.activeGroups.get(groupId);
    if (group) {
      group.endTime = Date.now();
      this.activeGroups.delete(groupId);
      
      if (this.currentGroupId === groupId) {
        this.currentGroupId = null;
      }
    }
  }

  /**
   * Create a new branch from current state
   */
  createBranch(name: string): string {
    if (!this.config.enableBranching) {
      return '';
    }

    const branchId = `branch_${++this.branchCounter}`;
    const currentBranch = this.branches.get(this.currentBranchId);
    
    const newBranch: HistoryBranch = {
      id: branchId,
      name,
      parentId: this.currentBranchId,
      states: currentBranch ? [...currentBranch.states] : [],
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    this.branches.set(branchId, newBranch);

    // Enforce max branches limit
    if (this.config.maxBranches && this.branches.size > this.config.maxBranches) {
      this.pruneOldestBranch();
    }

    return branchId;
  }

  /**
   * Switch to a different branch
   */
  switchBranch(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) {
      return false;
    }

    // Save current branch state
    const currentBranch = this.branches.get(this.currentBranchId);
    if (currentBranch) {
      currentBranch.states = [...this.states];
      currentBranch.modifiedAt = Date.now();
    }

    // Switch to new branch
    this.currentBranchId = branchId;
    this.states = [...branch.states];
    this.currentIndex = this.states.length - 1;

    this.updateObservables();
    return true;
  }

  /**
   * Get all branches
   */
  getBranches(): HistoryBranch[] {
    return Array.from(this.branches.values());
  }

  /**
   * Compress history states to save memory
   */
  compressHistory(): void {
    if (!this.config.enableCompression) {
      return;
    }

    const threshold = this.config.compressionThreshold || 10000;

    for (let i = 0; i < this.states.length; i++) {
      const state = this.states[i];
      
      if (!state.compressed && state.content.length > threshold) {
        try {
          const compressed = this.compressContent(state.content);
          if (compressed.length < state.content.length * 0.8) { // Only compress if significant savings
            this.states[i] = {
              ...state,
              content: compressed,
              compressed: true,
              originalSize: state.content.length
            };
          }
        } catch (error) {
          // Compression failed, keep original
          this.errorHandler.handleSelectionError('compressHistory', {
            error: (error as Error).message,
            stateId: state.id
          });
        }
      }
    }
  }

  /**
   * Decompress content if needed
   */
  private decompressContent(content: string, compressed?: boolean): string {
    if (!compressed) {
      return content;
    }

    try {
      return this.decompressString(content);
    } catch (error) {
      this.errorHandler.handleSelectionError('decompressContent', {
        error: (error as Error).message
      });
      return content; // Return as-is if decompression fails
    }
  }

  /**
   * Simple compression using run-length encoding for repeated patterns
   */
  private compressContent(content: string): string {
    // Simple compression - replace repeated whitespace and common HTML patterns
    return content
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/<\/p>\s*<p>/g, '</p><p>') // Remove spaces between paragraphs
      .replace(/<\/div>\s*<div>/g, '</div><div>') // Remove spaces between divs
      .replace(/>\s+</g, '><'); // Remove spaces between tags
  }

  /**
   * Simple decompression (in this case, just return as-is since we used simple compression)
   */
  private decompressString(content: string): string {
    return content; // Our compression is lossy whitespace removal, so we can't fully restore
  }

  /**
   * Prune the oldest branch (excluding main)
   */
  private pruneOldestBranch(): void {
    let oldestBranch: HistoryBranch | null = null;
    let oldestTime = Date.now();

    for (const branch of this.branches.values()) {
      if (branch.id !== 'main' && branch.createdAt < oldestTime) {
        oldestTime = branch.createdAt;
        oldestBranch = branch;
      }
    }

    if (oldestBranch) {
      this.branches.delete(oldestBranch.id);
    }
  }

  /**
   * Enhanced addState with grouping and branching support
   */
  addStateWithGrouping(state: HistoryState, groupId?: string): void {
    // Add group information if grouping is enabled
    if (this.config.enableGrouping && (groupId || this.currentGroupId)) {
      const activeGroupId = groupId || this.currentGroupId;
      if (activeGroupId) {
        const group = this.activeGroups.get(activeGroupId);
        if (group) {
          state.groupId = activeGroupId;
          group.commands.push(state.command || 'unknown');
        }
      }
    }

    // Add branch information if branching is enabled
    if (this.config.enableBranching) {
      state.branchId = this.currentBranchId;
      if (this.currentIndex >= 0 && this.states[this.currentIndex]) {
        state.parentId = this.states[this.currentIndex].id;
      }
    }

    // Use existing addState logic
    this.addState(state);

    // Update current branch
    const currentBranch = this.branches.get(this.currentBranchId);
    if (currentBranch) {
      currentBranch.states = [...this.states];
      currentBranch.modifiedAt = Date.now();
    }
  }

  /**
   * Get states by group ID
   */
  getStatesByGroup(groupId: string): HistoryState[] {
    return this.states.filter(state => state.groupId === groupId);
  }

  /**
   * Get states by branch ID
   */
  getStatesByBranch(branchId: string): HistoryState[] {
    return this.states.filter(state => state.branchId === branchId);
  }

  /**
   * Undo entire group of commands
   */
  undoGroup(): HistoryState[] | null {
    if (!this.config.enableGrouping || this.currentIndex < 0) {
      return null;
    }

    const currentState = this.states[this.currentIndex];
    if (!currentState.groupId) {
      // No group, perform regular undo
      const state = this.undo();
      return state ? [state] : null;
    }

    const groupId = currentState.groupId;
    const groupStates: HistoryState[] = [];

    // Undo all states in the group
    while (this.currentIndex >= 0 && this.states[this.currentIndex].groupId === groupId) {
      const state = this.undo();
      if (state) {
        groupStates.push(state);
      } else {
        break;
      }
    }

    return groupStates.length > 0 ? groupStates : null;
  }

  /**
   * Redo entire group of commands
   */
  redoGroup(): HistoryState[] | null {
    if (!this.config.enableGrouping || this.currentIndex >= this.states.length - 1) {
      return null;
    }

    const nextState = this.states[this.currentIndex + 1];
    if (!nextState.groupId) {
      // No group, perform regular redo
      const state = this.redo();
      return state ? [state] : null;
    }

    const groupId = nextState.groupId;
    const groupStates: HistoryState[] = [];

    // Redo all states in the group
    while (this.currentIndex < this.states.length - 1 && this.states[this.currentIndex + 1].groupId === groupId) {
      const state = this.redo();
      if (state) {
        groupStates.push(state);
      } else {
        break;
      }
    }

    return groupStates.length > 0 ? groupStates : null;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): { totalStates: number; compressedStates: number; totalSize: number; compressedSize: number } {
    let totalSize = 0;
    let compressedSize = 0;
    let compressedCount = 0;

    for (const state of this.states) {
      const stateSize = state.content.length;
      totalSize += state.originalSize || stateSize;
      
      if (state.compressed) {
        compressedCount++;
        compressedSize += stateSize;
      } else {
        compressedSize += stateSize;
      }
    }

    return {
      totalStates: this.states.length,
      compressedStates: compressedCount,
      totalSize,
      compressedSize
    };
  }


}