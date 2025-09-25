/**
 * Interface for tracking editor history states
 */
export interface HistoryState {
  /** Unique identifier for this state */
  id: string;
  /** HTML content at this state */
  content: string;
  /** Selection state at this point */
  selection?: {
    start: number;
    end: number;
  };
  /** Timestamp when this state was created */
  timestamp: number;
  /** Command that created this state */
  command?: string;
  /** Group ID for command grouping */
  groupId?: string;
  /** Branch ID for non-linear history */
  branchId?: string;
  /** Parent state ID for branching */
  parentId?: string;
  /** Compressed content flag */
  compressed?: boolean;
  /** Original size before compression */
  originalSize?: number;
}

/**
 * Configuration for history management
 */
export interface HistoryConfig {
  /** Maximum number of history states to keep */
  maxStates?: number;
  /** Minimum time between history states (ms) */
  debounceTime?: number;
  /** Commands that should not create history states */
  excludeCommands?: string[];
  /** Enable compression for large content */
  enableCompression?: boolean;
  /** Minimum content size to trigger compression (bytes) */
  compressionThreshold?: number;
  /** Enable command grouping */
  enableGrouping?: boolean;
  /** Maximum group duration (ms) */
  maxGroupDuration?: number;
  /** Enable history branching */
  enableBranching?: boolean;
  /** Maximum number of branches to keep */
  maxBranches?: number;
}

/**
 * Command group for batching operations
 */
export interface CommandGroup {
  /** Group identifier */
  id: string;
  /** Commands in this group */
  commands: string[];
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime?: number;
  /** Group description */
  description?: string;
}

/**
 * History branch for non-linear undo/redo
 */
export interface HistoryBranch {
  /** Branch identifier */
  id: string;
  /** Branch name */
  name: string;
  /** Parent branch ID */
  parentId?: string;
  /** States in this branch */
  states: HistoryState[];
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
}

/**
 * History manager interface
 */
export interface HistoryManager {
  /** Add a new state to history */
  addState(state: HistoryState): void;
  /** Undo the last action */
  undo(): HistoryState | null;
  /** Redo the next action */
  redo(): HistoryState | null;
  /** Check if undo is available */
  canUndo(): boolean;
  /** Check if redo is available */
  canRedo(): boolean;
  /** Clear all history */
  clear(): void;
  /** Get current state index */
  getCurrentIndex(): number;
  /** Get total number of states */
  getStateCount(): number;
  /** Start a command group */
  startGroup(description?: string): string;
  /** End a command group */
  endGroup(groupId: string): void;
  /** Create a new branch */
  createBranch(name: string): string;
  /** Switch to a branch */
  switchBranch(branchId: string): boolean;
  /** Get all branches */
  getBranches(): HistoryBranch[];
  /** Compress history states */
  compressHistory(): void;
}