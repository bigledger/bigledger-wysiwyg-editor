import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { HistoryState, HistoryConfig } from '../models/history.interface';

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      expect(service.getStateCount()).toBe(0);
      expect(service.getCurrentIndex()).toBe(-1);
    });

    it('should accept custom configuration', () => {
      const config: Partial<HistoryConfig> = {
        maxStates: 10,
        debounceTime: 500
      };
      
      service.configure(config);
      
      // Configuration is internal, but we can test its effects
      expect(service.getStateCount()).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should add states correctly', () => {
      const state1 = service.createState('<p>Hello</p>', 'bold');
      const state2 = service.createState('<p><strong>Hello</strong></p>', 'bold');

      service.addState(state1);
      expect(service.getStateCount()).toBe(1);
      expect(service.getCurrentIndex()).toBe(0);

      service.addState(state2);
      expect(service.getStateCount()).toBe(2);
      expect(service.getCurrentIndex()).toBe(1);
    });

    it('should create states with correct properties', () => {
      const content = '<p>Test content</p>';
      const command = 'bold';
      const selection = { start: 0, end: 5 };

      const state = service.createState(content, command, selection);

      expect(state.content).toBe(content);
      expect(state.command).toBe(command);
      expect(state.selection).toEqual(selection);
      expect(state.id).toBeTruthy();
      expect(state.timestamp).toBeGreaterThan(0);
    });

    it('should not add excluded commands to history', () => {
      service.configure({ excludeCommands: ['undo', 'redo'] });
      
      const undoState = service.createState('<p>Test</p>', 'undo');
      const redoState = service.createState('<p>Test</p>', 'redo');
      const boldState = service.createState('<p><strong>Test</strong></p>', 'bold');

      service.addState(undoState);
      service.addState(redoState);
      service.addState(boldState);

      expect(service.getStateCount()).toBe(1);
      expect(service.getCurrentState()?.command).toBe('bold');
    });

    it('should enforce maximum states limit', () => {
      service.configure({ maxStates: 3 });

      for (let i = 0; i < 5; i++) {
        const state = service.createState(`<p>Content ${i}</p>`, 'type');
        service.addState(state);
      }

      expect(service.getStateCount()).toBe(3);
      expect(service.getCurrentIndex()).toBe(2);
    });

    it('should handle debounce time correctly', (done) => {
      service.configure({ debounceTime: 100 });

      const state1 = service.createState('<p>Hello</p>', 'type');
      const state2 = service.createState('<p>Hello World</p>', 'type');

      service.addState(state1);
      
      // Add second state immediately (should update first state)
      service.addState(state2);
      expect(service.getStateCount()).toBe(1);
      expect(service.getCurrentState()?.content).toBe('<p>Hello World</p>');

      // Wait for debounce time and add another state
      setTimeout(() => {
        const state3 = service.createState('<p>Hello World!</p>', 'type');
        service.addState(state3);
        expect(service.getStateCount()).toBe(2);
        done();
      }, 150);
    });
  });

  describe('Undo/Redo Operations', () => {
    beforeEach(() => {
      // Add some test states
      const states = [
        service.createState('<p>Initial</p>', 'initialize'),
        service.createState('<p><strong>Initial</strong></p>', 'bold'),
        service.createState('<p><strong><em>Initial</em></strong></p>', 'italic')
      ];

      states.forEach(state => service.addState(state));
    });

    it('should perform undo correctly', () => {
      expect(service.canUndo()).toBe(true);
      expect(service.getCurrentIndex()).toBe(2);

      const previousState = service.undo();
      expect(previousState).toBeTruthy();
      expect(previousState?.content).toBe('<p><strong>Initial</strong></p>');
      expect(service.getCurrentIndex()).toBe(1);
    });

    it('should perform redo correctly', () => {
      service.undo(); // Go back one step
      expect(service.canRedo()).toBe(true);

      const nextState = service.redo();
      expect(nextState).toBeTruthy();
      expect(nextState?.content).toBe('<p><strong><em>Initial</em></strong></p>');
      expect(service.getCurrentIndex()).toBe(2);
    });

    it('should handle undo at beginning of history', () => {
      // Undo to the beginning
      service.undo();
      service.undo();
      
      expect(service.canUndo()).toBe(false);
      const result = service.undo();
      expect(result).toBeNull();
      expect(service.getCurrentIndex()).toBe(0);
    });

    it('should handle redo at end of history', () => {
      expect(service.canRedo()).toBe(false);
      const result = service.redo();
      expect(result).toBeNull();
      expect(service.getCurrentIndex()).toBe(2);
    });

    it('should clear redo history when adding new state after undo', () => {
      service.undo(); // Go back one step
      expect(service.canRedo()).toBe(true);

      // Add new state
      const newState = service.createState('<p><u>Initial</u></p>', 'underline');
      service.addState(newState);

      expect(service.canRedo()).toBe(false);
      expect(service.getStateCount()).toBe(3);
      expect(service.getCurrentIndex()).toBe(2);
    });
  });

  describe('State Queries', () => {
    beforeEach(() => {
      const states = [
        service.createState('<p>State 1</p>', 'type'),
        service.createState('<p>State 2</p>', 'type'),
        service.createState('<p>State 3</p>', 'type')
      ];

      states.forEach(state => service.addState(state));
    });

    it('should return correct current state', () => {
      const currentState = service.getCurrentState();
      expect(currentState).toBeTruthy();
      expect(currentState?.content).toBe('<p>State 3</p>');
    });

    it('should return correct state count', () => {
      expect(service.getStateCount()).toBe(3);
    });

    it('should return correct current index', () => {
      expect(service.getCurrentIndex()).toBe(2);
    });

    it('should return all states', () => {
      const allStates = service.getAllStates();
      expect(allStates.length).toBe(3);
      expect(allStates[0].content).toBe('<p>State 1</p>');
      expect(allStates[2].content).toBe('<p>State 3</p>');
    });
  });

  describe('Clear History', () => {
    it('should clear all history', () => {
      // Add some states
      const states = [
        service.createState('<p>State 1</p>', 'type'),
        service.createState('<p>State 2</p>', 'type')
      ];

      states.forEach(state => service.addState(state));
      expect(service.getStateCount()).toBe(2);

      service.clear();
      expect(service.getStateCount()).toBe(0);
      expect(service.getCurrentIndex()).toBe(-1);
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(false);
    });
  });

  describe('Selection Position Management', () => {
    let testElement: HTMLDivElement;

    beforeEach(() => {
      testElement = document.createElement('div');
      testElement.innerHTML = '<p>Hello <strong>World</strong>!</p>';
      document.body.appendChild(testElement);
    });

    afterEach(() => {
      document.body.removeChild(testElement);
    });

    it('should get selection position correctly', () => {
      // Create a selection
      const range = document.createRange();
      const textNode = testElement.querySelector('p')?.firstChild as Text;
      range.setStart(textNode, 2);
      range.setEnd(textNode, 5);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      const position = service.getSelectionPosition(testElement);
      expect(position).toBeTruthy();
      expect(position?.start).toBe(2);
      expect(position?.end).toBe(5);
    });

    it('should restore selection position correctly', () => {
      const position = { start: 2, end: 8 };
      service.restoreSelectionPosition(testElement, position);

      const selection = window.getSelection();
      expect(selection?.rangeCount).toBe(1);
      
      const range = selection?.getRangeAt(0);
      expect(range?.toString()).toBe('llo Wo');
    });

    it('should handle invalid selection positions gracefully', () => {
      const position = { start: 100, end: 200 }; // Beyond content length
      
      expect(() => {
        service.restoreSelectionPosition(testElement, position);
      }).not.toThrow();
    });
  });

  describe('Observables', () => {
    it('should emit canUndo changes', (done) => {
      service.canUndo$.subscribe(canUndo => {
        if (canUndo) {
          expect(canUndo).toBe(true);
          done();
        }
      });

      // Add states to enable undo
      const state1 = service.createState('<p>State 1</p>', 'type');
      const state2 = service.createState('<p>State 2</p>', 'type');
      service.addState(state1);
      service.addState(state2);
    });

    it('should emit canRedo changes', (done) => {
      // Add states and undo to enable redo
      const state1 = service.createState('<p>State 1</p>', 'type');
      const state2 = service.createState('<p>State 2</p>', 'type');
      service.addState(state1);
      service.addState(state2);

      service.canRedo$.subscribe(canRedo => {
        if (canRedo) {
          expect(canRedo).toBe(true);
          done();
        }
      });

      service.undo(); // This should enable redo
    });

    it('should emit current state changes', (done) => {
      const testState = service.createState('<p>Test State</p>', 'type');
      
      service.currentState$.subscribe(state => {
        if (state && state.content === '<p>Test State</p>') {
          expect(state.command).toBe('type');
          done();
        }
      });

      service.addState(testState);
    });
  });
});