import { HistoryState, HistoryConfig, HistoryManager } from './history.interface';

describe('History Interfaces', () => {
  describe('HistoryState', () => {
    it('should define correct structure', () => {
      const state: HistoryState = {
        id: 'test-id',
        content: '<p>Test content</p>',
        timestamp: Date.now(),
        command: 'bold',
        selection: { start: 0, end: 5 }
      };

      expect(state.id).toBe('test-id');
      expect(state.content).toBe('<p>Test content</p>');
      expect(state.timestamp).toBeGreaterThan(0);
      expect(state.command).toBe('bold');
      expect(state.selection).toEqual({ start: 0, end: 5 });
    });

    it('should allow optional properties', () => {
      const minimalState: HistoryState = {
        id: 'minimal-id',
        content: '<p>Minimal</p>',
        timestamp: Date.now()
      };

      expect(minimalState.selection).toBeUndefined();
      expect(minimalState.command).toBeUndefined();
    });
  });

  describe('HistoryConfig', () => {
    it('should define correct structure with all properties', () => {
      const config: HistoryConfig = {
        maxStates: 50,
        debounceTime: 1000,
        excludeCommands: ['undo', 'redo', 'selectAll']
      };

      expect(config.maxStates).toBe(50);
      expect(config.debounceTime).toBe(1000);
      expect(config.excludeCommands).toEqual(['undo', 'redo', 'selectAll']);
    });

    it('should allow partial configuration', () => {
      const partialConfig: Partial<HistoryConfig> = {
        maxStates: 25
      };

      expect(partialConfig.maxStates).toBe(25);
      expect(partialConfig.debounceTime).toBeUndefined();
      expect(partialConfig.excludeCommands).toBeUndefined();
    });

    it('should allow empty configuration', () => {
      const emptyConfig: HistoryConfig = {};

      expect(emptyConfig.maxStates).toBeUndefined();
      expect(emptyConfig.debounceTime).toBeUndefined();
      expect(emptyConfig.excludeCommands).toBeUndefined();
    });
  });

  describe('HistoryManager Interface', () => {
    // Mock implementation for testing interface compliance
    class MockHistoryManager implements HistoryManager {
      private states: HistoryState[] = [];
      private currentIndex = -1;

      addState(state: HistoryState): void {
        this.states.push(state);
        this.currentIndex = this.states.length - 1;
      }

      undo(): HistoryState | null {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          return this.states[this.currentIndex];
        }
        return null;
      }

      redo(): HistoryState | null {
        if (this.currentIndex < this.states.length - 1) {
          this.currentIndex++;
          return this.states[this.currentIndex];
        }
        return null;
      }

      canUndo(): boolean {
        return this.currentIndex > 0;
      }

      canRedo(): boolean {
        return this.currentIndex < this.states.length - 1;
      }

      clear(): void {
        this.states = [];
        this.currentIndex = -1;
      }

      getCurrentIndex(): number {
        return this.currentIndex;
      }

      getStateCount(): number {
        return this.states.length;
      }
    }

    let manager: HistoryManager;

    beforeEach(() => {
      manager = new MockHistoryManager();
    });

    it('should implement all required methods', () => {
      expect(typeof manager.addState).toBe('function');
      expect(typeof manager.undo).toBe('function');
      expect(typeof manager.redo).toBe('function');
      expect(typeof manager.canUndo).toBe('function');
      expect(typeof manager.canRedo).toBe('function');
      expect(typeof manager.clear).toBe('function');
      expect(typeof manager.getCurrentIndex).toBe('function');
      expect(typeof manager.getStateCount).toBe('function');
    });

    it('should handle state management correctly', () => {
      const state1: HistoryState = {
        id: '1',
        content: '<p>State 1</p>',
        timestamp: Date.now()
      };

      const state2: HistoryState = {
        id: '2',
        content: '<p>State 2</p>',
        timestamp: Date.now()
      };

      manager.addState(state1);
      expect(manager.getStateCount()).toBe(1);
      expect(manager.getCurrentIndex()).toBe(0);

      manager.addState(state2);
      expect(manager.getStateCount()).toBe(2);
      expect(manager.getCurrentIndex()).toBe(1);
    });

    it('should handle undo/redo operations correctly', () => {
      const state1: HistoryState = {
        id: '1',
        content: '<p>State 1</p>',
        timestamp: Date.now()
      };

      const state2: HistoryState = {
        id: '2',
        content: '<p>State 2</p>',
        timestamp: Date.now()
      };

      manager.addState(state1);
      manager.addState(state2);

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);

      const undoResult = manager.undo();
      expect(undoResult).toBeTruthy();
      expect(undoResult?.id).toBe('1');
      expect(manager.getCurrentIndex()).toBe(0);

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);

      const redoResult = manager.redo();
      expect(redoResult).toBeTruthy();
      expect(redoResult?.id).toBe('2');
      expect(manager.getCurrentIndex()).toBe(1);
    });

    it('should handle clear operation correctly', () => {
      const state: HistoryState = {
        id: '1',
        content: '<p>State 1</p>',
        timestamp: Date.now()
      };

      manager.addState(state);
      expect(manager.getStateCount()).toBe(1);

      manager.clear();
      expect(manager.getStateCount()).toBe(0);
      expect(manager.getCurrentIndex()).toBe(-1);
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should return null for invalid undo/redo operations', () => {
      expect(manager.undo()).toBeNull();
      expect(manager.redo()).toBeNull();

      const state: HistoryState = {
        id: '1',
        content: '<p>State 1</p>',
        timestamp: Date.now()
      };

      manager.addState(state);
      expect(manager.redo()).toBeNull(); // No redo available at end
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct types for HistoryState properties', () => {
      // This test ensures TypeScript compilation catches type errors
      const state: HistoryState = {
        id: 'test-id', // Must be string
        content: '<p>Content</p>', // Must be string
        timestamp: 1234567890, // Must be number
        command: 'bold', // Optional string
        selection: { start: 0, end: 5 } // Optional object with start/end numbers
      };

      expect(typeof state.id).toBe('string');
      expect(typeof state.content).toBe('string');
      expect(typeof state.timestamp).toBe('number');
      expect(typeof state.command).toBe('string');
      expect(typeof state.selection?.start).toBe('number');
      expect(typeof state.selection?.end).toBe('number');
    });

    it('should enforce correct types for HistoryConfig properties', () => {
      const config: HistoryConfig = {
        maxStates: 50, // Optional number
        debounceTime: 1000, // Optional number
        excludeCommands: ['undo', 'redo'] // Optional string array
      };

      expect(typeof config.maxStates).toBe('number');
      expect(typeof config.debounceTime).toBe('number');
      expect(Array.isArray(config.excludeCommands)).toBe(true);
      expect(typeof config.excludeCommands?.[0]).toBe('string');
    });
  });
});