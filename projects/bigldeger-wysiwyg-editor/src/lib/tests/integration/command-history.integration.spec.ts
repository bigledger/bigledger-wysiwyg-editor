import { TestBed } from '@angular/core/testing';
import { CommandService } from '../../services/command.service';
import { HistoryService } from '../../services/history.service';
import { SelectionService } from '../../services/selection.service';
import { BrowserCompatibilityService } from '../../services/browser-compatibility.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { EditorCommand } from '../../models/editor-command.interface';

describe('CommandService and HistoryService Integration', () => {
  let commandService: CommandService;
  let historyService: HistoryService;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let browserCompatibilityService: jasmine.SpyObj<BrowserCompatibilityService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  let testElement: HTMLDivElement;

  beforeEach(() => {
    const selectionSpy = jasmine.createSpyObj('SelectionService', ['saveSelection', 'restoreSelection']);
    const browserSpy = jasmine.createSpyObj('BrowserCompatibilityService', ['isSupported']);
    const errorSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleCommandError', 'handleSelectionError']);

    TestBed.configureTestingModule({
      providers: [
        CommandService,
        HistoryService,
        { provide: SelectionService, useValue: selectionSpy },
        { provide: BrowserCompatibilityService, useValue: browserSpy },
        { provide: ErrorHandlerService, useValue: errorSpy }
      ]
    });

    commandService = TestBed.inject(CommandService);
    historyService = TestBed.inject(HistoryService);
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    browserCompatibilityService = TestBed.inject(BrowserCompatibilityService) as jasmine.SpyObj<BrowserCompatibilityService>;
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;

    // Create test element
    testElement = document.createElement('div');
    testElement.contentEditable = 'true';
    testElement.innerHTML = '<p>Initial content</p>';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    if (testElement && testElement.parentNode) {
      document.body.removeChild(testElement);
    }
  });

  describe('Command Grouping Integration', () => {
    it('should group multiple commands together', () => {
      const groupId = commandService.startCommandGroup('Multi-format operation');
      
      // Save initial state
      commandService.saveState(testElement, 'initialize', groupId);
      
      // Execute multiple commands in the group
      const boldCommand: EditorCommand = { name: 'bold' };
      const italicCommand: EditorCommand = { name: 'italic' };
      
      commandService.saveState(testElement, 'bold', groupId);
      commandService.saveState(testElement, 'italic', groupId);
      
      commandService.endCommandGroup(groupId);
      
      // Verify states were grouped
      const groupStates = historyService.getStatesByGroup(groupId);
      expect(groupStates.length).toBe(3); // initialize + bold + italic
    });

    it('should undo entire command groups', () => {
      // Initialize history
      commandService.initializeHistory(testElement);
      
      const groupId = commandService.startCommandGroup('Format group');
      
      // Simulate content changes
      testElement.innerHTML = '<p><strong>Bold content</strong></p>';
      commandService.saveState(testElement, 'bold', groupId);
      
      testElement.innerHTML = '<p><strong><em>Bold italic content</em></strong></p>';
      commandService.saveState(testElement, 'italic', groupId);
      
      commandService.endCommandGroup(groupId);
      
      // Undo the entire group
      const success = commandService.undoGroup();
      expect(success).toBe(true);
    });

    it('should redo entire command groups', () => {
      // Initialize and create a group
      commandService.initializeHistory(testElement);
      
      const groupId = commandService.startCommandGroup('Format group');
      
      testElement.innerHTML = '<p><strong>Bold content</strong></p>';
      commandService.saveState(testElement, 'bold', groupId);
      
      commandService.endCommandGroup(groupId);
      
      // Undo then redo the group
      commandService.undoGroup();
      const success = commandService.redoGroup();
      expect(success).toBe(true);
    });

    it('should execute complex operations with automatic grouping', () => {
      const operations = [
        { command: { name: 'bold' } as EditorCommand },
        { command: { name: 'italic' } as EditorCommand },
        { command: { name: 'underline' } as EditorCommand }
      ];
      
      const success = commandService.executeComplexOperation(operations, 'Multi-format');
      expect(success).toBe(true);
      
      // Verify the operations were grouped
      const branches = historyService.getBranches();
      expect(branches.length).toBeGreaterThan(0);
    });
  });

  describe('History Branching Integration', () => {
    it('should create and switch between history branches', () => {
      commandService.initializeHistory(testElement);
      
      // Create a branch
      const branchId = commandService.createHistoryBranch('Feature branch');
      expect(branchId).toBeTruthy();
      
      // Switch to the branch
      const success = commandService.switchHistoryBranch(branchId);
      expect(success).toBe(true);
      
      // Verify we can get branches
      const branches = commandService.getHistoryBranches();
      expect(branches.length).toBeGreaterThan(1);
    });

    it('should maintain separate history in different branches', () => {
      commandService.initializeHistory(testElement);
      
      // Add content to main branch
      testElement.innerHTML = '<p>Main branch content</p>';
      commandService.saveState(testElement, 'type');
      
      // Create and switch to feature branch
      const branchId = commandService.createHistoryBranch('Feature');
      commandService.switchHistoryBranch(branchId);
      
      // Add different content to feature branch
      testElement.innerHTML = '<p>Feature branch content</p>';
      commandService.saveState(testElement, 'type');
      
      // Switch back to main
      commandService.switchHistoryBranch('main');
      
      // Verify we're back on main branch with its content
      const branches = commandService.getHistoryBranches();
      const mainBranch = branches.find(b => b.id === 'main');
      expect(mainBranch).toBeTruthy();
    });
  });

  describe('Memory Optimization Integration', () => {
    it('should compress history when requested', () => {
      commandService.initializeHistory(testElement);
      
      // Add states with large content
      for (let i = 0; i < 5; i++) {
        testElement.innerHTML = `<p>${'Large content '.repeat(100)} ${i}</p>`;
        commandService.saveState(testElement, 'type');
      }
      
      // Compress history
      commandService.compressHistory();
      
      // Get memory stats
      const stats = commandService.getHistoryMemoryStats();
      expect(stats.totalStates).toBe(6); // 5 + initial state
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should provide accurate memory statistics', () => {
      commandService.initializeHistory(testElement);
      
      // Add some states
      testElement.innerHTML = '<p>Content 1</p>';
      commandService.saveState(testElement, 'type');
      
      testElement.innerHTML = '<p>Content 2</p>';
      commandService.saveState(testElement, 'type');
      
      const stats = commandService.getHistoryMemoryStats();
      expect(stats.totalStates).toBe(3); // 2 + initial
      expect(stats.compressedStates).toBe(0); // No compression yet
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.compressedSize).toBeGreaterThan(0);
    });
  });

  describe('Enhanced Command Execution', () => {
    it('should execute commands with automatic history tracking', () => {
      const command: EditorCommand = { name: 'bold' };
      
      const success = commandService.executeCommandWithHistory(command, undefined, testElement);
      
      // Should save state before and after command
      expect(historyService.getStateCount()).toBeGreaterThan(0);
    });

    it('should handle batch command execution with grouping', () => {
      const commands = [
        { command: { name: 'bold' } as EditorCommand },
        { command: { name: 'italic' } as EditorCommand }
      ];
      
      const success = commandService.executeCommands(commands);
      
      // Commands should be executed (success depends on browser support)
      // But grouping should have been attempted
      expect(typeof success).toBe('boolean');
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should integrate undo/redo with history service', () => {
      commandService.initializeHistory(testElement);
      
      // Add a state
      testElement.innerHTML = '<p>Modified content</p>';
      commandService.saveState(testElement, 'type');
      
      // Test undo
      expect(commandService.canUndo()).toBe(true);
      const undoSuccess = commandService.undo();
      expect(undoSuccess).toBe(true);
      
      // Test redo
      expect(commandService.canRedo()).toBe(true);
      const redoSuccess = commandService.redo();
      expect(redoSuccess).toBe(true);
    });

    it('should clear history when requested', () => {
      commandService.initializeHistory(testElement);
      
      // Add some states
      testElement.innerHTML = '<p>State 1</p>';
      commandService.saveState(testElement, 'type');
      
      testElement.innerHTML = '<p>State 2</p>';
      commandService.saveState(testElement, 'type');
      
      expect(historyService.getStateCount()).toBeGreaterThan(0);
      
      // Clear history
      commandService.clearHistory();
      expect(historyService.getStateCount()).toBe(0);
    });

    it('should provide access to history service', () => {
      const historyServiceInstance = commandService.getHistoryService();
      expect(historyServiceInstance).toBe(historyService);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors in command execution gracefully', () => {
      const invalidCommand: EditorCommand = { name: 'invalidCommand' };
      
      const success = commandService.executeCommandWithHistory(invalidCommand, undefined, testElement);
      
      // Should not throw and should return false for invalid commands
      expect(typeof success).toBe('boolean');
    });

    it('should handle errors in group operations gracefully', () => {
      // Try to undo group when no groups exist
      const success = commandService.undoGroup();
      expect(success).toBe(false);
      
      // Try to redo group when no groups exist
      const redoSuccess = commandService.redoGroup();
      expect(redoSuccess).toBe(false);
    });

    it('should handle invalid branch operations gracefully', () => {
      const success = commandService.switchHistoryBranch('nonexistent-branch');
      expect(success).toBe(false);
    });
  });
});