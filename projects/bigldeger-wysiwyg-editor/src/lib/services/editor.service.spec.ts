import { TestBed } from '@angular/core/testing';
import { EditorService } from './editor.service';
import { SelectionService } from './selection.service';
import { CommandService } from './command.service';
import { SelectionState } from '../models/selection-state.interface';
import { EditorCommand } from '../models/editor-command.interface';

describe('EditorService', () => {
  let service: EditorService;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let commandService: jasmine.SpyObj<CommandService>;
  let mockEditorElement: HTMLElement;

  beforeEach(() => {
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection',
      'restoreSelection'
    ]);
    const commandServiceSpy = jasmine.createSpyObj('CommandService', [
      'executeCommand'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EditorService,
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: CommandService, useValue: commandServiceSpy }
      ]
    });

    service = TestBed.inject(EditorService);
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;

    // Create mock editor element
    mockEditorElement = document.createElement('div');
    mockEditorElement.contentEditable = 'true';
    document.body.appendChild(mockEditorElement);
  });

  afterEach(() => {
    document.body.removeChild(mockEditorElement);
    service.destroy();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty content', () => {
      expect(service.getCurrentContent()).toBe('');
    });

    it('should initialize with unfocused state', () => {
      expect(service.isFocused()).toBe(false);
    });

    it('should initialize with non-readonly state', () => {
      expect(service.isReadonly()).toBe(false);
    });

    it('should initialize with clean state', () => {
      expect(service.isDirty()).toBe(false);
    });
  });

  describe('Content Management', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should set content and update observable', (done) => {
      const testContent = '<p>Test content</p>';
      
      service.content$.subscribe(content => {
        if (content === testContent) {
          expect(content).toBe(testContent);
          expect(mockEditorElement.innerHTML).toBe(testContent);
          done();
        }
      });

      service.setContent(testContent);
    });

    it('should mark content as clean when markClean is true', () => {
      const testContent = '<p>Test content</p>';
      service.setContent(testContent, true);
      
      expect(service.isDirty()).toBe(false);
    });

    it('should mark content as dirty when content changes', () => {
      const initialContent = '<p>Initial</p>';
      const newContent = '<p>Changed</p>';
      
      service.setContent(initialContent, true);
      expect(service.isDirty()).toBe(false);
      
      service.setContent(newContent);
      expect(service.isDirty()).toBe(true);
    });

    it('should update content from element', () => {
      const testContent = '<p>Element content</p>';
      mockEditorElement.innerHTML = testContent;
      
      service.updateContentFromElement();
      
      expect(service.getCurrentContent()).toBe(testContent);
    });

    it('should clear content', () => {
      service.setContent('<p>Some content</p>');
      service.clear();
      
      expect(service.getCurrentContent()).toBe('');
      expect(mockEditorElement.innerHTML).toBe('');
    });

    it('should reset to initial content', () => {
      const initialContent = '<p>Initial</p>';
      service.setContent(initialContent, true);
      service.setContent('<p>Changed</p>');
      
      service.reset();
      
      expect(service.getCurrentContent()).toBe(initialContent);
      expect(service.isDirty()).toBe(false);
    });
  });

  describe('Selection State Management', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should update selection state', (done) => {
      const mockSelectionState: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };

      selectionService.saveSelection.and.returnValue(mockSelectionState);

      service.selectionState$.subscribe(state => {
        if (state) {
          expect(state).toEqual(mockSelectionState);
          done();
        }
      });

      service.updateSelectionState();
    });

    it('should handle selection state errors gracefully', () => {
      selectionService.saveSelection.and.throwError('Selection error');
      spyOn(console, 'error');

      service.updateSelectionState();

      expect(console.error).toHaveBeenCalled();
    });

    it('should update selection state on selection change when focused', () => {
      spyOn(service, 'updateSelectionState');
      service.onFocus();
      
      service.onSelectionChange();
      
      expect(service.updateSelectionState).toHaveBeenCalled();
    });

    it('should not update selection state on selection change when not focused', () => {
      spyOn(service, 'updateSelectionState');
      service.onBlur();
      
      service.onSelectionChange();
      
      expect(service.updateSelectionState).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should focus editor element', () => {
      spyOn(mockEditorElement, 'focus');
      
      service.focus();
      
      expect(mockEditorElement.focus).toHaveBeenCalled();
      expect(service.isFocused()).toBe(true);
    });

    it('should blur editor element', () => {
      spyOn(mockEditorElement, 'blur');
      
      service.blur();
      
      expect(mockEditorElement.blur).toHaveBeenCalled();
      expect(service.isFocused()).toBe(false);
    });

    it('should not focus when readonly', () => {
      spyOn(mockEditorElement, 'focus');
      service.setReadonly(true);
      
      service.focus();
      
      expect(mockEditorElement.focus).not.toHaveBeenCalled();
    });

    it('should handle focus event', () => {
      spyOn(service, 'updateSelectionState');
      
      service.onFocus();
      
      expect(service.isFocused()).toBe(true);
      expect(service.updateSelectionState).toHaveBeenCalled();
    });

    it('should handle blur event', () => {
      service.onFocus();
      
      service.onBlur();
      
      expect(service.isFocused()).toBe(false);
    });

    it('should emit focus state changes', (done) => {
      let emissionCount = 0;
      service.focusState$.subscribe(focused => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(focused).toBe(true);
          done();
        }
      });

      service.onFocus();
    });
  });

  describe('Readonly State Management', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should set readonly state', () => {
      service.setReadonly(true);
      
      expect(service.isReadonly()).toBe(true);
      expect(mockEditorElement.contentEditable).toBe('false');
    });

    it('should unset readonly state', () => {
      service.setReadonly(true);
      service.setReadonly(false);
      
      expect(service.isReadonly()).toBe(false);
      expect(mockEditorElement.contentEditable).toBe('true');
    });

    it('should emit readonly state changes', (done) => {
      let emissionCount = 0;
      service.readonlyState$.subscribe(readonly => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(readonly).toBe(true);
          done();
        }
      });

      service.setReadonly(true);
    });
  });

  describe('Command Execution', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should execute command successfully', () => {
      const command: EditorCommand = { name: 'bold' };
      commandService.executeCommand.and.returnValue(true);
      spyOn(service, 'updateContentFromElement');
      spyOn(service, 'updateSelectionState');
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(true);
      expect(commandService.executeCommand).toHaveBeenCalledWith(command, undefined, mockEditorElement);
      expect(service.updateContentFromElement).toHaveBeenCalled();
      expect(service.updateSelectionState).toHaveBeenCalled();
    });

    it('should not execute command when readonly', () => {
      const command: EditorCommand = { name: 'bold' };
      service.setReadonly(true);
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(false);
      expect(commandService.executeCommand).not.toHaveBeenCalled();
    });

    it('should handle command execution errors', () => {
      const command: EditorCommand = { name: 'bold' };
      commandService.executeCommand.and.throwError('Command error');
      spyOn(console, 'error');
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should not update state when command fails', () => {
      const command: EditorCommand = { name: 'bold' };
      commandService.executeCommand.and.returnValue(false);
      spyOn(service, 'updateContentFromElement');
      spyOn(service, 'updateSelectionState');
      
      service.executeCommand(command);
      
      expect(service.updateContentFromElement).not.toHaveBeenCalled();
      expect(service.updateSelectionState).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should handle input event', () => {
      spyOn(service, 'updateContentFromElement');
      spyOn(service, 'updateSelectionState');
      
      service.onInput();
      
      expect(service.updateContentFromElement).toHaveBeenCalled();
      expect(service.updateSelectionState).toHaveBeenCalled();
    });
  });

  describe('Statistics and Utilities', () => {
    beforeEach(() => {
      service.setEditorElement(mockEditorElement);
    });

    it('should calculate content statistics', () => {
      const content = '<p>Hello world</p><p>Second paragraph</p>';
      service.setContent(content);
      
      const stats = service.getStats();
      
      expect(stats.characters).toBe(25); // "Hello worldSecond paragraph"
      expect(stats.words).toBe(4);
      expect(stats.paragraphs).toBe(2);
    });

    it('should handle empty content statistics', () => {
      service.setContent('');
      
      const stats = service.getStats();
      
      expect(stats.characters).toBe(0);
      expect(stats.words).toBe(0);
      expect(stats.paragraphs).toBe(1);
    });

    it('should check if editor has content', () => {
      expect(service.hasContent()).toBe(false);
      
      service.setContent('<p>Some content</p>');
      expect(service.hasContent()).toBe(true);
      
      service.setContent('<p></p>');
      expect(service.hasContent()).toBe(false);
    });

    it('should save current state', () => {
      spyOn(service, 'updateContentFromElement');
      spyOn(service, 'updateSelectionState');
      
      service.saveState();
      
      expect(service.updateContentFromElement).toHaveBeenCalled();
      expect(service.updateSelectionState).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should emit errors', (done) => {
      service.errors$.subscribe(error => {
        expect(error).toBe('Test error');
        done();
      });

      // Trigger an error by calling a private method through reflection
      (service as any).handleError('Test error');
    });

    it('should handle focus errors gracefully', () => {
      const badElement = {} as HTMLElement;
      service.setEditorElement(badElement);
      spyOn(console, 'error');
      
      service.focus();
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle blur errors gracefully', () => {
      const badElement = {} as HTMLElement;
      service.setEditorElement(badElement);
      spyOn(console, 'error');
      
      service.blur();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy service and complete observables', () => {
      spyOn(service.content$, 'subscribe').and.callThrough();
      
      service.destroy();
      
      // Verify that new subscriptions don't receive values
      let received = false;
      service.content$.subscribe(() => received = true);
      
      expect(received).toBe(false);
    });

    it('should clear editor element reference on destroy', () => {
      service.setEditorElement(mockEditorElement);
      
      service.destroy();
      
      // Verify element reference is cleared by checking that focus doesn't work
      spyOn(console, 'error');
      service.focus();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Observable Streams', () => {
    it('should provide content observable', (done) => {
      const testContent = '<p>Test</p>';
      
      service.content$.subscribe(content => {
        if (content === testContent) {
          expect(content).toBe(testContent);
          done();
        }
      });

      service.setContent(testContent);
    });

    it('should provide selection state observable', (done) => {
      const mockState: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };

      selectionService.saveSelection.and.returnValue(mockState);

      service.selectionState$.subscribe(state => {
        if (state) {
          expect(state).toEqual(mockState);
          done();
        }
      });

      service.updateSelectionState();
    });

    it('should provide dirty state observable', (done) => {
      let emissionCount = 0;
      service.dirtyState$.subscribe(dirty => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(dirty).toBe(true);
          done();
        }
      });

      service.setContent('<p>Initial</p>', true);
      service.setContent('<p>Changed</p>');
    });
  });
});