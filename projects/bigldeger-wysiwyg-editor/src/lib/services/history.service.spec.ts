import { TestBed } from '@angular/core/testing';
import { HistoryService } from './history.service';
import { HistoryState, HistoryConfig, CommandGroup, HistoryBranch } from '../models/history.interface';
import { ErrorHandlerService } from './error-handler.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleSelectionError']);

    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });
    
    service = TestBed.inject(HistoryService);
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
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

  describe('Command Grouping', () => {
    beforeEach(() => {
      service.configure({ enableGrouping: true, maxGroupDuration: 1000 });
    });

    it('should start and end command groups', () => {
      const groupId = service.startGroup('Test Group');
      expect(groupId).toBeTruthy();
      expect(groupId).toContain('group_');

      service.endGroup(groupId);
      // Group should be ended (no direct way to test, but no errors should occur)
    });

    it('should add states with group information', () => {
      const groupId = service.startGroup('Test Group');
      const state = service.createState('<p>Grouped content</p>', 'bold');
      
      service.addStateWithGrouping(state, groupId);
      
      const currentState = service.getCurrentState();
      expect(currentState?.groupId).toBe(groupId);
      
      service.endGroup(groupId);
    });

    it('should undo entire groups', () => {
      const groupId = service.startGroup('Multi-command group');
      
      // Add multiple states in the same group
      const state1 = service.createState('<p>Step 1</p>', 'type');
      const state2 = service.createState('<p><strong>Step 1</strong></p>', 'bold');
      const state3 = service.createState('<p><strong><em>Step 1</em></strong></p>', 'italic');
      
      service.addStateWithGrouping(state1, groupId);
      service.addStateWithGrouping(state2, groupId);
      service.addStateWithGrouping(state3, groupId);
      
      service.endGroup(groupId);
      
      expect(service.getStateCount()).toBe(3);
      
      // Undo the entire group
      const undoneStates = service.undoGroup();
      expect(undoneStates).toBeTruthy();
      expect(undoneStates?.length).toBe(3);
    });

    it('should redo entire groups', () => {
      const groupId = service.startGroup('Multi-command group');
      
      const state1 = service.createState('<p>Step 1</p>', 'type');
      const state2 = service.createState('<p><strong>Step 1</strong></p>', 'bold');
      
      service.addStateWithGrouping(state1, groupId);
      service.addStateWithGrouping(state2, groupId);
      service.endGroup(groupId);
      
      // Undo the group
      service.undoGroup();
      
      // Redo the group
      const redoneStates = service.redoGroup();
      expect(redoneStates).toBeTruthy();
      expect(redoneStates?.length).toBe(2);
    });

    it('should get states by group ID', () => {
      const groupId = service.startGroup('Test Group');
      
      const state1 = service.createState('<p>Content 1</p>', 'type');
      const state2 = service.createState('<p>Content 2</p>', 'type');
      
      service.addStateWithGrouping(state1, groupId);
      service.addStateWithGrouping(state2, groupId);
      service.endGroup(groupId);
      
      const groupStates = service.getStatesByGroup(groupId);
      expect(groupStates.length).toBe(2);
      expect(groupStates[0].content).toBe('<p>Content 1</p>');
      expect(groupStates[1].content).toBe('<p>Content 2</p>');
    });
  });

  describe('History Branching', () => {
    beforeEach(() => {
      service.configure({ enableBranching: true, maxBranches: 5 });
      
      // Add some initial states
      const state1 = service.createState('<p>Initial</p>', 'initialize');
      const state2 = service.createState('<p><strong>Initial</strong></p>', 'bold');
      service.addState(state1);
      service.addState(state2);
    });

    it('should create new branches', () => {
      const branchId = service.createBranch('Feature Branch');
      expect(branchId).toBeTruthy();
      expect(branchId).toContain('branch_');
      
      const branches = service.getBranches();
      expect(branches.length).toBe(2); // main + new branch
      
      const newBranch = branches.find(b => b.id === branchId);
      expect(newBranch?.name).toBe('Feature Branch');
    });

    it('should switch between branches', () => {
      const branchId = service.createBranch('Feature Branch');
      
      // Add state to main branch
      const mainState = service.createState('<p>Main branch content</p>', 'type');
      service.addState(mainState);
      
      // Switch to feature branch
      const switched = service.switchBranch(branchId);
      expect(switched).toBe(true);
      
      // Add state to feature branch
      const featureState = service.createState('<p>Feature branch content</p>', 'type');
      service.addState(featureState);
      
      // Switch back to main
      service.switchBranch('main');
      const currentState = service.getCurrentState();
      expect(currentState?.content).toBe('<p>Main branch content</p>');
    });

    it('should get states by branch ID', () => {
      const branchId = service.createBranch('Test Branch');
      service.switchBranch(branchId);
      
      const state = service.createState('<p>Branch content</p>', 'type');
      service.addStateWithGrouping(state);
      
      const branchStates = service.getStatesByBranch(branchId);
      expect(branchStates.length).toBeGreaterThan(0);
      expect(branchStates.some(s => s.content === '<p>Branch content</p>')).toBe(true);
    });

    it('should enforce maximum branches limit', () => {
      service.configure({ maxBranches: 3 });
      
      // Create branches up to the limit
      service.createBranch('Branch 1');
      service.createBranch('Branch 2');
      service.createBranch('Branch 3'); // This should trigger pruning
      
      const branches = service.getBranches();
      expect(branches.length).toBeLessThanOrEqual(3);
    });
  });

  describe('History Compression', () => {
    beforeEach(() => {
      service.configure({ 
        enableCompression: true, 
        compressionThreshold: 100 // Low threshold for testing
      });
    });

    it('should compress large content', () => {
      const largeContent = '<p>' + 'A'.repeat(200) + '</p>'; // Content larger than threshold
      const state = service.createState(largeContent, 'type');
      service.addState(state);
      
      service.compressHistory();
      
      const stats = service.getMemoryStats();
      expect(stats.compressedStates).toBeGreaterThan(0);
    });

    it('should not compress small content', () => {
      const smallContent = '<p>Small content</p>';
      const state = service.createState(smallContent, 'type');
      service.addState(state);
      
      service.compressHistory();
      
      const stats = service.getMemoryStats();
      expect(stats.compressedStates).toBe(0);
    });

    it('should provide memory statistics', () => {
      const state1 = service.createState('<p>Content 1</p>', 'type');
      const state2 = service.createState('<p>Content 2</p>', 'type');
      service.addState(state1);
      service.addState(state2);
      
      const stats = service.getMemoryStats();
      expect(stats.totalStates).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.compressedSize).toBeGreaterThan(0);
    });

    it('should handle decompression when getting current state', () => {
      const largeContent = '<p>' + 'B'.repeat(200) + '</p>';
      const state = service.createState(largeContent, 'type');
      service.addState(state);
      
      service.compressHistory();
      
      const currentState = service.getCurrentState();
      expect(currentState?.content).toBeTruthy();
      // Content should be available (even if compressed internally)
    });
  });

  describe('Enhanced State Management', () => {
    it('should handle addStateWithGrouping without group', () => {
      const state = service.createState('<p>No group content</p>', 'type');
      service.addStateWithGrouping(state);
      
      expect(service.getStateCount()).toBe(1);
      expect(service.getCurrentState()?.content).toBe('<p>No group content</p>');
    });

    it('should handle branch information in states', () => {
      service.configure({ enableBranching: true });
      
      const state = service.createState('<p>Branch content</p>', 'type');
      service.addStateWithGrouping(state);
      
      const currentState = service.getCurrentState();
      expect(currentState?.branchId).toBe('main');
    });

    it('should handle parent-child relationships in states', () => {
      service.configure({ enableBranching: true });
      
      const state1 = service.createState('<p>Parent</p>', 'type');
      const state2 = service.createState('<p>Child</p>', 'type');
      
      service.addStateWithGrouping(state1);
      service.addStateWithGrouping(state2);
      
      const currentState = service.getCurrentState();
      expect(currentState?.parentId).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle compression errors gracefully', () => {
      service.configure({ enableCompression: true, compressionThreshold: 10 });
      
      const state = service.createState('<p>Test content</p>', 'type');
      service.addState(state);
      
      // This should not throw even if compression fails
      expect(() => service.compressHistory()).not.toThrow();
    });

    it('should handle invalid branch switching', () => {
      const result = service.switchBranch('nonexistent-branch');
      expect(result).toBe(false);
    });

    it('should handle grouping when disabled', () => {
      service.configure({ enableGrouping: false });
      
      const groupId = service.startGroup('Test');
      expect(groupId).toBe('');
      
      // Should not throw
      expect(() => service.endGroup('invalid-id')).not.toThrow();
    });

    it('should handle branching when disabled', () => {
      service.configure({ enableBranching: false });
      
      const branchId = service.createBranch('Test Branch');
      expect(branchId).toBe('');
    });
  });
});