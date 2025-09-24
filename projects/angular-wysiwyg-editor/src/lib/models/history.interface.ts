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
}