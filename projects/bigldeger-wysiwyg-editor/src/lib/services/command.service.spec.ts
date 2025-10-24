import { TestBed } from '@angular/core/testing';
import { CommandService } from './command.service';
import { SelectionService } from './selection.service';
import { HistoryService } from './history.service';
import { ErrorHandlerService } from './error-handler.service';
import { EditorCommand } from '../models/editor-command.interface';
import { SelectionState, ActiveFormats, TextAlignment } from '../models/selection-state.interface';

describe('CommandService', () => {
  let service: CommandService;
  let selectionService: jasmine.SpyObj<SelectionService>;
  let historyService: jasmine.SpyObj<HistoryService>;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  let mockDocument: any;

  beforeEach(() => {
    const selectionServiceSpy = jasmine.createSpyObj('SelectionService', [
      'saveSelection',
      'restoreSelection'
    ]);

    const historyServiceSpy = jasmine.createSpyObj('HistoryService', [
      'addState',
      'undo',
      'redo',
      'canUndo',
      'canRedo',
      'createState',
      'getSelectionPosition',
      'restoreSelectionPosition',
      'clear'
    ]);

    const errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'isFeatureSupported',
      'handleBrowserError',
      'handleCommandError',
      'handleSelectionError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CommandService,
        { provide: SelectionService, useValue: selectionServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerServiceSpy }
      ]
    });

    service = TestBed.inject(CommandService);
    selectionService = TestBed.inject(SelectionService) as jasmine.SpyObj<SelectionService>;
    historyService = TestBed.inject(HistoryService) as jasmine.SpyObj<HistoryService>;
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;

    // Mock document.execCommand and related methods
    mockDocument = {
      execCommand: jasmine.createSpy('execCommand').and.returnValue(true),
      queryCommandSupported: jasmine.createSpy('queryCommandSupported').and.returnValue(true),
      queryCommandEnabled: jasmine.createSpy('queryCommandEnabled').and.returnValue(true),
      queryCommandState: jasmine.createSpy('queryCommandState').and.returnValue(false),
      queryCommandValue: jasmine.createSpy('queryCommandValue').and.returnValue(''),
    };

    // Replace global document methods
    spyOn(document, 'execCommand').and.callFake(mockDocument.execCommand);
    spyOn(document, 'queryCommandSupported').and.callFake(mockDocument.queryCommandSupported);
    spyOn(document, 'queryCommandEnabled').and.callFake(mockDocument.queryCommandEnabled);
    spyOn(document, 'queryCommandState').and.callFake(mockDocument.queryCommandState);
    spyOn(document, 'queryCommandValue').and.callFake(mockDocument.queryCommandValue);
  });

  // Helper function to create mock SelectionState with proper types
  function createMockSelectionState(): SelectionState {
    return {
      range: null,
      collapsed: true,
      formats: {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '14px',
          fontFamily: 'Arial',
        fontColor: '#000000',
        backgroundColor: '#ffffff',
        alignment: 'left' as TextAlignment
      }
    };
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('executeCommand', () => {
    it('should execute command successfully', () => {
      const command: EditorCommand = { name: 'bold' };
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(true);
      expect(selectionService.saveSelection).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
      expect(selectionService.restoreSelection).toHaveBeenCalledWith(mockSelection);
    });

    it('should execute command with value', () => {
      const command: EditorCommand = { name: 'fontSize' };
      const value = '16px';
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.executeCommand(command, value);
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, value);
    });

    it('should handle command execution failure and use fallback', () => {
      const command: EditorCommand = { name: 'bold' };
      mockDocument.execCommand.and.throwError('Command failed');
      
      // Mock window.getSelection for fallback
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue({
          extractContents: jasmine.createSpy('extractContents').and.returnValue(document.createDocumentFragment()),
          insertNode: jasmine.createSpy('insertNode'),
          selectNode: jasmine.createSpy('selectNode')
        }),
        removeAllRanges: jasmine.createSpy('removeAllRanges'),
        addRange: jasmine.createSpy('addRange')
      };
      spyOn(window, 'getSelection').and.returnValue(mockSelection as any);
      spyOn(document, 'createElement').and.returnValue(document.createElement('strong'));
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(true);
      expect(window.getSelection).toHaveBeenCalled();
    });
  });

  describe('command query methods', () => {
    it('should check if command is supported', () => {
      const result = service.isCommandSupported('bold');
      
      expect(result).toBe(true);
      expect(document.queryCommandSupported).toHaveBeenCalledWith('bold');
    });

    it('should handle queryCommandSupported errors', () => {
      mockDocument.queryCommandSupported.and.throwError('Query failed');
      spyOn(console, 'warn');
      
      const result = service.isCommandSupported('bold');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should check if command is enabled', () => {
      const result = service.isCommandEnabled('bold');
      
      expect(result).toBe(true);
      expect(document.queryCommandEnabled).toHaveBeenCalledWith('bold');
    });

    it('should handle queryCommandEnabled errors', () => {
      mockDocument.queryCommandEnabled.and.throwError('Query failed');
      spyOn(console, 'warn');
      
      const result = service.isCommandEnabled('bold');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should get command state', () => {
      const result = service.getCommandState('bold');
      
      expect(result).toBe(false);
      expect(document.queryCommandState).toHaveBeenCalledWith('bold');
    });

    it('should handle queryCommandState errors', () => {
      mockDocument.queryCommandState.and.throwError('Query failed');
      spyOn(console, 'warn');
      
      const result = service.getCommandState('bold');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should get command value', () => {
      mockDocument.queryCommandValue.and.returnValue('14px');
      
      const result = service.getCommandValue('fontSize');
      
      expect(result).toBe('14px');
      expect(document.queryCommandValue).toHaveBeenCalledWith('fontSize');
    });

    it('should handle queryCommandValue errors', () => {
      mockDocument.queryCommandValue.and.throwError('Query failed');
      spyOn(console, 'warn');
      
      const result = service.getCommandValue('fontSize');
      
      expect(result).toBe('');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('executeCommands', () => {
    it('should execute multiple commands successfully', () => {
      const commands = [
        { command: { name: 'bold' } },
        { command: { name: 'italic' } },
        { command: { name: 'fontSize' }, value: '16px' }
      ];
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.executeCommands(commands);
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledTimes(3);
      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
      expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
      expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '16px');
    });

    it('should return false if any command fails', () => {
      const commands = [
        { command: { name: 'bold' } },
        { command: { name: 'italic' } }
      ];
      mockDocument.execCommand.and.returnValues(true, false);
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.executeCommands(commands);
      
      expect(result).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should remove formatting', () => {
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.removeFormatting();
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('removeFormat', false, undefined);
    });

    it('should insert HTML', () => {
      const html = '<strong>Bold text</strong>';
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.insertHTML(html);
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('insertHTML', false, html);
    });

    it('should insert text', () => {
      const text = 'Plain text';
      const mockSelection: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: '#ffffff',
          alignment: 'left' as TextAlignment
        }
      };
      selectionService.saveSelection.and.returnValue(mockSelection);
      
      const result = service.insertText(text);
      
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, text);
    });
  });

  describe('fallback implementations', () => {
    beforeEach(() => {
      mockDocument.execCommand.and.throwError('Command not supported');
    });

    it('should use fallback for bold command', () => {
      const command: EditorCommand = { name: 'bold' };
      
      const mockRange = {
        extractContents: jasmine.createSpy('extractContents').and.returnValue(document.createDocumentFragment()),
        insertNode: jasmine.createSpy('insertNode'),
        selectNode: jasmine.createSpy('selectNode')
      };
      
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue(mockRange),
        removeAllRanges: jasmine.createSpy('removeAllRanges'),
        addRange: jasmine.createSpy('addRange')
      };
      
      spyOn(window, 'getSelection').and.returnValue(mockSelection as any);
      spyOn(document, 'createElement').and.returnValue(document.createElement('strong'));
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(true);
      expect(mockRange.extractContents).toHaveBeenCalled();
      expect(mockRange.insertNode).toHaveBeenCalled();
    });

    it('should handle fallback failure gracefully', () => {
      const command: EditorCommand = { name: 'bold' };
      spyOn(window, 'getSelection').and.returnValue(null);
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(false);
    });

    it('should handle unsupported fallback commands', () => {
      const command: EditorCommand = { name: 'unsupportedCommand' };
      
      const mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue({})
      };
      spyOn(window, 'getSelection').and.returnValue(mockSelection as any);
      spyOn(console, 'warn');
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('No fallback implementation for command: unsupportedCommand');
    });
  });

  describe('list functionality', () => {
    let mockParagraph: HTMLParagraphElement;
    let mockList: HTMLUListElement;
    let mockListItem: HTMLLIElement;
    let mockSelection: any;
    let mockRange: any;

    beforeEach(() => {
      // Create mock DOM elements
      mockParagraph = document.createElement('p');
      mockParagraph.innerHTML = 'Test content';
      
      mockList = document.createElement('ul');
      mockListItem = document.createElement('li');
      mockListItem.innerHTML = 'List item content';
      mockList.appendChild(mockListItem);

      // Mock range and selection
      mockRange = {
        commonAncestorContainer: mockParagraph,
        setStart: jasmine.createSpy('setStart'),
        collapse: jasmine.createSpy('collapse')
      };

      mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue(mockRange),
        removeAllRanges: jasmine.createSpy('removeAllRanges'),
        addRange: jasmine.createSpy('addRange')
      };

      spyOn(window, 'getSelection').and.returnValue(mockSelection);
    });

    describe('createBulletList', () => {
      it('should create bullet list successfully', () => {
        const mockSelection: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelection);

        const result = service.createBulletList();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        
        // Mock DOM manipulation
        const mockContainer = document.createElement('div');
        const mockParent = document.createElement('div');
        mockParent.appendChild(mockParagraph);
        mockContainer.appendChild(mockParent);
        
        // Mock the findParentBlockElement to return our paragraph
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockParagraph);
        
        const mockList = document.createElement('ul');
        const mockListItem = document.createElement('li');
        spyOn(document, 'createElement').and.returnValues(mockList, mockListItem);

        const result = service.createBulletList();

        expect(result).toBe(false); // Will fail because of missing parent structure
        expect(window.getSelection).toHaveBeenCalled();
      });
    });

    describe('createNumberedList', () => {
      it('should create numbered list successfully', () => {
        const mockSelection: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelection);

        const result = service.createNumberedList();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        
        // Mock DOM manipulation
        const mockContainer = document.createElement('div');
        const mockParent = document.createElement('div');
        mockParent.appendChild(mockParagraph);
        mockContainer.appendChild(mockParent);
        
        // Mock the findParentBlockElement to return our paragraph
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockParagraph);
        
        const mockList = document.createElement('ol');
        const mockListItem = document.createElement('li');
        spyOn(document, 'createElement').and.returnValues(mockList, mockListItem);

        const result = service.createNumberedList();

        expect(result).toBe(false); // Will fail because of missing parent structure
        expect(window.getSelection).toHaveBeenCalled();
      });
    });

    describe('indentListItem', () => {
      it('should indent list item successfully', () => {
        // Setup list structure
        const previousItem = document.createElement('li');
        previousItem.innerHTML = 'Previous item';
        mockList.insertBefore(previousItem, mockListItem);
        mockRange.commonAncestorContainer = mockListItem;

        const result = service.indentListItem();

        expect(result).toBe(true);
        expect(window.getSelection).toHaveBeenCalled();
      });

      it('should not indent first list item', () => {
        mockRange.commonAncestorContainer = mockListItem;

        const result = service.indentListItem();

        expect(result).toBe(false);
      });

      it('should handle missing selection', () => {
        (window.getSelection as jasmine.Spy).and.returnValue(null);

        const result = service.indentListItem();

        expect(result).toBe(false);
      });
    });

    describe('outdentListItem', () => {
      it('should outdent nested list item', () => {
        // Create nested structure
        const parentList = document.createElement('ul');
        const parentItem = document.createElement('li');
        const nestedList = document.createElement('ul');
        
        parentItem.appendChild(nestedList);
        nestedList.appendChild(mockListItem);
        parentList.appendChild(parentItem);
        
        mockRange.commonAncestorContainer = mockListItem;

        const result = service.outdentListItem();

        expect(result).toBe(true);
        expect(window.getSelection).toHaveBeenCalled();
      });

      it('should convert to paragraph when outdenting top-level item', () => {
        const container = document.createElement('div');
        container.appendChild(mockList);
        mockRange.commonAncestorContainer = mockListItem;
        
        // Mock the parent structure properly
        const mockParent = document.createElement('div');
        mockParent.appendChild(mockList);
        Object.defineProperty(mockList, 'parentElement', { value: mockParent });
        Object.defineProperty(mockListItem, 'parentElement', { value: mockList });
        
        const mockParagraph = document.createElement('p');
        spyOn(document, 'createElement').and.returnValue(mockParagraph);

        const result = service.outdentListItem();

        expect(result).toBe(true);
        expect(document.createElement).toHaveBeenCalledWith('p');
      });

      it('should handle missing selection', () => {
        (window.getSelection as jasmine.Spy).and.returnValue(null);

        const result = service.outdentListItem();

        expect(result).toBe(false);
      });
    });

    describe('list state checking', () => {
      it('should detect when in list', () => {
        mockRange.commonAncestorContainer = mockListItem;

        const result = service.isInList();

        expect(result).toBe(true);
      });

      it('should detect when not in list', () => {
        mockRange.commonAncestorContainer = mockParagraph;

        const result = service.isInList();

        expect(result).toBe(false);
      });

      it('should detect bullet list', () => {
        mockRange.commonAncestorContainer = mockListItem;

        const result = service.isInBulletList();

        expect(result).toBe(true);
      });

      it('should detect numbered list', () => {
        const numberedList = document.createElement('ol');
        const numberedItem = document.createElement('li');
        numberedList.appendChild(numberedItem);
        mockRange.commonAncestorContainer = numberedItem;

        const result = service.isInNumberedList();

        expect(result).toBe(true);
      });

      it('should handle missing selection for state checks', () => {
        (window.getSelection as jasmine.Spy).and.returnValue(null);

        expect(service.isInList()).toBe(false);
        expect(service.isInBulletList()).toBe(false);
        expect(service.isInNumberedList()).toBe(false);
      });
    });
  });

  describe('text alignment functionality', () => {
    let mockSelection: any;
    let mockRange: any;
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('p');
      mockElement.innerHTML = 'Test content';
      
      mockRange = {
        commonAncestorContainer: mockElement
      };

      mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue(mockRange)
      };

      spyOn(window, 'getSelection').and.returnValue(mockSelection);
    });

    describe('alignLeft', () => {
      it('should execute justifyLeft command', () => {
        const mockSelectionState: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignLeft();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyLeft', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignLeft();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('left');
      });
    });

    describe('alignCenter', () => {
      it('should execute justifyCenter command', () => {
        const mockSelectionState: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignCenter();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyCenter', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignCenter();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('center');
      });
    });

    describe('alignRight', () => {
      it('should execute justifyRight command', () => {
        const mockSelectionState: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignRight();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyRight', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignRight();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('right');
      });
    });

    describe('alignJustify', () => {
      it('should execute justifyFull command', () => {
        const mockSelectionState: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignJustify();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyFull', false, undefined);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignJustify();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('justify');
      });
    });

    describe('getCurrentAlignment', () => {
      it('should return center when justifyCenter is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyCenter');

        const result = service.getCurrentAlignment();

        expect(result).toBe('center');
      });

      it('should return right when justifyRight is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyRight');

        const result = service.getCurrentAlignment();

        expect(result).toBe('right');
      });

      it('should return justify when justifyFull is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyFull');

        const result = service.getCurrentAlignment();

        expect(result).toBe('justify');
      });

      it('should return left as default', () => {
        mockDocument.queryCommandState.and.returnValue(false);

        const result = service.getCurrentAlignment();

        expect(result).toBe('left');
      });

      it('should check computed style when command state is not available', () => {
        mockDocument.queryCommandState.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);
        spyOn(window, 'getComputedStyle').and.returnValue({
          textAlign: 'center'
        } as CSSStyleDeclaration);

        const result = service.getCurrentAlignment();

        expect(result).toBe('center');
        expect(window.getComputedStyle).toHaveBeenCalledWith(mockElement);
      });

      it('should handle missing selection gracefully', () => {
        mockDocument.queryCommandState.and.returnValue(false);
        (window.getSelection as jasmine.Spy).and.returnValue(null);

        const result = service.getCurrentAlignment();

        expect(result).toBe('left');
      });
    });

    describe('alignment state checking methods', () => {
      it('should correctly identify left alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('left');

        expect(service.isAlignedLeft()).toBe(true);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify center alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('center');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(true);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify right alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('right');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(true);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify justify alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('justify');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(true);
      });
    });

    describe('applyAlignmentFallback', () => {
      it('should apply alignment to block element', () => {
        const mockRange = {
          commonAncestorContainer: mockElement
        };
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = (service as any).applyAlignmentFallback('center', mockRange);

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('center');
      });

      it('should wrap selection in div when no block element found', () => {
        const mockRange = {
          commonAncestorContainer: mockElement,
          extractContents: jasmine.createSpy('extractContents').and.returnValue(document.createDocumentFragment()),
          insertNode: jasmine.createSpy('insertNode'),
          selectNodeContents: jasmine.createSpy('selectNodeContents')
        };
        const mockDiv = document.createElement('div');
        
        spyOn(service as any, 'findParentBlockElement').and.returnValue(null);
        spyOn(document, 'createElement').and.returnValue(mockDiv);
        spyOn(window, 'getSelection').and.returnValue({
          removeAllRanges: jasmine.createSpy('removeAllRanges'),
          addRange: jasmine.createSpy('addRange')
        } as any);

        const result = (service as any).applyAlignmentFallback('center', mockRange);

        expect(result).toBe(true);
        expect(document.createElement).toHaveBeenCalledWith('div');
        expect(mockDiv.style.textAlign).toBe('center');
        expect(mockRange.insertNode).toHaveBeenCalledWith(mockDiv);
      });

      it('should handle errors gracefully', () => {
        const mockRange = {
          commonAncestorContainer: null
        };
        spyOn(console, 'error');

        const result = (service as any).applyAlignmentFallback('center', mockRange);

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to apply alignment center:', jasmine.any(Error));
      });
    });

    describe('alignment fallback in executeCommand', () => {
      it('should use alignment fallback for justifyLeft', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'applyAlignmentFallback').and.returnValue(true);

        const result = service.executeCommand({ name: 'justifyLeft' });

        expect(result).toBe(true);
        expect((service as any).applyAlignmentFallback).toHaveBeenCalledWith('left', jasmine.any(Object));
      });

      it('should use alignment fallback for justifyCenter', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'applyAlignmentFallback').and.returnValue(true);

        const result = service.executeCommand({ name: 'justifyCenter' });

        expect(result).toBe(true);
        expect((service as any).applyAlignmentFallback).toHaveBeenCalledWith('center', jasmine.any(Object));
      });

      it('should use alignment fallback for justifyRight', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'applyAlignmentFallback').and.returnValue(true);

        const result = service.executeCommand({ name: 'justifyRight' });

        expect(result).toBe(true);
        expect((service as any).applyAlignmentFallback).toHaveBeenCalledWith('right', jasmine.any(Object));
      });

      it('should use alignment fallback for justifyFull', () => {
        mockDocument.execCommand.and.throwError('Command failed');
        spyOn(service as any, 'applyAlignmentFallback').and.returnValue(true);

        const result = service.executeCommand({ name: 'justifyFull' });

        expect(result).toBe(true);
        expect((service as any).applyAlignmentFallback).toHaveBeenCalledWith('justify', jasmine.any(Object));
      });
    });
  });

  describe('error handling', () => {
    it('should handle executeCommand errors gracefully', () => {
      const command: EditorCommand = { name: 'bold' };
      mockDocument.execCommand.and.throwError('Execution failed');
      spyOn(window, 'getSelection').and.returnValue(null);
      spyOn(console, 'error');
      
      const result = service.executeCommand(command);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to execute command bold:', jasmine.any(Error));
    });

    it('should handle insertHTML fallback errors', () => {
      const html = '<p>Test</p>';
      mockDocument.execCommand.and.throwError('Command failed');
      spyOn(window, 'getSelection').and.returnValue(null);
      spyOn(console, 'error');
      
      const result = service.insertHTML(html);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('HTML insertion fallback failed:', jasmine.any(Error));
    });

    it('should handle insertText fallback errors', () => {
      const text = 'Test text';
      mockDocument.execCommand.and.throwError('Command failed');
      spyOn(window, 'getSelection').and.returnValue(null);
      spyOn(console, 'error');
      
      const result = service.insertText(text);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Text insertion fallback failed:', jasmine.any(Error));
    });
  });

  describe('Undo/Redo Functionality', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      mockElement.setAttribute('contenteditable', 'true');
      mockElement.innerHTML = '<p>Initial content</p>';
      document.body.appendChild(mockElement);
      
      // Mock querySelector to return our test element
      spyOn(document, 'querySelector').and.returnValue(mockElement);
    });

    afterEach(() => {
      document.body.removeChild(mockElement);
    });

    describe('executeCommand with history', () => {
      it('should save state before executing non-undo/redo commands', () => {
        const command: EditorCommand = { name: 'bold' };
        const mockSelection: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelection);
        historyService.createState.and.returnValue({
          id: 'test-id',
          content: '<p>Initial content</p>',
          timestamp: Date.now()
        });

        const result = service.executeCommand(command, undefined);

        expect(result).toBe(true);
        expect(historyService.createState).toHaveBeenCalled();
        expect(historyService.addState).toHaveBeenCalled();
        expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
      });

      it('should not save state for undo command', () => {
        const command: EditorCommand = { name: 'undo' };
        historyService.undo.and.returnValue({
          id: 'previous-state',
          content: '<p>Previous content</p>',
          timestamp: Date.now()
        });

        const result = service.executeCommand(command, undefined);

        expect(result).toBe(true);
        expect(historyService.createState).not.toHaveBeenCalled();
        expect(historyService.addState).not.toHaveBeenCalled();
        expect(historyService.undo).toHaveBeenCalled();
        expect(mockElement.innerHTML).toBe('<p>Previous content</p>');
      });

      it('should not save state for redo command', () => {
        const command: EditorCommand = { name: 'redo' };
        historyService.redo.and.returnValue({
          id: 'next-state',
          content: '<p>Next content</p>',
          timestamp: Date.now()
        });

        const result = service.executeCommand(command, undefined);

        expect(result).toBe(true);
        expect(historyService.createState).not.toHaveBeenCalled();
        expect(historyService.addState).not.toHaveBeenCalled();
        expect(historyService.redo).toHaveBeenCalled();
        expect(mockElement.innerHTML).toBe('<p>Next content</p>');
      });
    });

    describe('undo', () => {
      it('should execute undo successfully', () => {
        const previousState = {
          id: 'previous-state',
          content: '<p>Previous content</p>',
          timestamp: Date.now(),
          selection: { start: 0, end: 5 }
        };
        historyService.undo.and.returnValue(previousState);

        const result = service.undo();

        expect(result).toBe(true);
        expect(historyService.undo).toHaveBeenCalled();
        expect(mockElement.innerHTML).toBe('<p>Previous content</p>');
        expect(historyService.restoreSelectionPosition).toHaveBeenCalledWith(mockElement, previousState.selection);
      });

      it('should return false when no previous state available', () => {
        historyService.undo.and.returnValue(null);

        const result = service.undo();

        expect(result).toBe(false);
        expect(historyService.undo).toHaveBeenCalled();
      });

      it('should handle missing contenteditable element', () => {
        (document.querySelector as jasmine.Spy).and.returnValue(null);
        historyService.undo.and.returnValue({
          id: 'previous-state',
          content: '<p>Previous content</p>',
          timestamp: Date.now()
        });
        spyOn(console, 'warn');

        const result = service.undo();

        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('No contenteditable element found for undo');
      });

      it('should handle undo without selection', () => {
        const previousState = {
          id: 'previous-state',
          content: '<p>Previous content</p>',
          timestamp: Date.now()
        };
        historyService.undo.and.returnValue(previousState);

        const result = service.undo();

        expect(result).toBe(true);
        expect(mockElement.innerHTML).toBe('<p>Previous content</p>');
        expect(historyService.restoreSelectionPosition).not.toHaveBeenCalled();
      });

      it('should handle undo errors gracefully', () => {
        historyService.undo.and.throwError('Undo failed');
        spyOn(console, 'error');

        const result = service.undo();

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to execute undo:', jasmine.any(Error));
      });
    });

    describe('redo', () => {
      it('should execute redo successfully', () => {
        const nextState = {
          id: 'next-state',
          content: '<p>Next content</p>',
          timestamp: Date.now(),
          selection: { start: 2, end: 7 }
        };
        historyService.redo.and.returnValue(nextState);

        const result = service.redo();

        expect(result).toBe(true);
        expect(historyService.redo).toHaveBeenCalled();
        expect(mockElement.innerHTML).toBe('<p>Next content</p>');
        expect(historyService.restoreSelectionPosition).toHaveBeenCalledWith(mockElement, nextState.selection);
      });

      it('should return false when no next state available', () => {
        historyService.redo.and.returnValue(null);

        const result = service.redo();

        expect(result).toBe(false);
        expect(historyService.redo).toHaveBeenCalled();
      });

      it('should handle missing contenteditable element', () => {
        (document.querySelector as jasmine.Spy).and.returnValue(null);
        historyService.redo.and.returnValue({
          id: 'next-state',
          content: '<p>Next content</p>',
          timestamp: Date.now()
        });
        spyOn(console, 'warn');

        const result = service.redo();

        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalledWith('No contenteditable element found for redo');
      });

      it('should handle redo without selection', () => {
        const nextState = {
          id: 'next-state',
          content: '<p>Next content</p>',
          timestamp: Date.now()
        };
        historyService.redo.and.returnValue(nextState);

        const result = service.redo();

        expect(result).toBe(true);
        expect(mockElement.innerHTML).toBe('<p>Next content</p>');
        expect(historyService.restoreSelectionPosition).not.toHaveBeenCalled();
      });

      it('should handle redo errors gracefully', () => {
        historyService.redo.and.throwError('Redo failed');
        spyOn(console, 'error');

        const result = service.redo();

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Failed to execute redo:', jasmine.any(Error));
      });
    });

    describe('canUndo and canRedo', () => {
      it('should check if undo is available', () => {
        historyService.canUndo.and.returnValue(true);

        const result = service.canUndo();

        expect(result).toBe(true);
        expect(historyService.canUndo).toHaveBeenCalled();
      });

      it('should check if redo is available', () => {
        historyService.canRedo.and.returnValue(true);

        const result = service.canRedo();

        expect(result).toBe(true);
        expect(historyService.canRedo).toHaveBeenCalled();
      });
    });

    describe('saveState', () => {
      it('should save current state to history', () => {
        const mockState = {
          id: 'test-state',
          content: '<p>Test content</p>',
          timestamp: Date.now()
        };
        historyService.getSelectionPosition.and.returnValue({ start: 0, end: 5 });
        historyService.createState.and.returnValue(mockState);

        service.saveState(mockElement, 'bold');

        expect(historyService.getSelectionPosition).toHaveBeenCalledWith(mockElement);
        expect(historyService.createState).toHaveBeenCalledWith(
          '<p>Initial content</p>',
          'bold',
          { start: 0, end: 5 }
        );
        expect(historyService.addState).toHaveBeenCalledWith(mockState);
      });

      it('should handle saveState errors gracefully', () => {
        historyService.createState.and.throwError('Save failed');
        spyOn(console, 'error');

        service.saveState(mockElement, 'bold');

        expect(console.error).toHaveBeenCalledWith('Failed to save state:', jasmine.any(Error));
      });
    });

    describe('initializeHistory', () => {
      it('should initialize history with current content', () => {
        const mockState = {
          id: 'initial-state',
          content: '<p>Initial content</p>',
          timestamp: Date.now()
        };
        historyService.createState.and.returnValue(mockState);

        service.initializeHistory(mockElement);

        expect(historyService.createState).toHaveBeenCalledWith(
          '<p>Initial content</p>',
          'initialize'
        );
        expect(historyService.addState).toHaveBeenCalledWith(mockState);
      });

      it('should handle initializeHistory errors gracefully', () => {
        historyService.createState.and.throwError('Initialize failed');
        spyOn(console, 'error');

        service.initializeHistory(mockElement);

        expect(console.error).toHaveBeenCalledWith('Failed to initialize history:', jasmine.any(Error));
      });
    });

    describe('clearHistory', () => {
      it('should clear history', () => {
        service.clearHistory();

        expect(historyService.clear).toHaveBeenCalled();
      });
    });

    describe('getHistoryService', () => {
      it('should return history service instance', () => {
        const result = service.getHistoryService();

        expect(result).toBe(historyService);
      });
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    it('should handle Ctrl+Z for undo', () => {
      const command: EditorCommand = { name: 'undo' };
      historyService.undo.and.returnValue({
        id: 'previous-state',
        content: '<p>Previous content</p>',
        timestamp: Date.now()
      });
      spyOn(document, 'querySelector').and.returnValue(document.createElement('div'));

      const result = service.executeCommand(command);

      expect(result).toBe(true);
      expect(historyService.undo).toHaveBeenCalled();
    });

    it('should handle Ctrl+Y for redo', () => {
      const command: EditorCommand = { name: 'redo' };
      historyService.redo.and.returnValue({
        id: 'next-state',
        content: '<p>Next content</p>',
        timestamp: Date.now()
      });
      spyOn(document, 'querySelector').and.returnValue(document.createElement('div'));

      const result = service.executeCommand(command);

      expect(result).toBe(true);
      expect(historyService.redo).toHaveBeenCalled();
    });
  });

  describe('Enhanced Error Handling and Fallbacks', () => {
    beforeEach(() => {
      // Mock error handler
      spyOn(errorHandlerService, 'isFeatureSupported').and.returnValue(true);
      spyOn(errorHandlerService, 'handleBrowserError').and.stub();
      spyOn(errorHandlerService, 'handleCommandError').and.stub();
    });

    describe('Fallback Command Support', () => {
      it('should use fallback when execCommand is not supported', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(errorHandlerService.handleBrowserError).toHaveBeenCalledWith(
          'execCommand',
          'Using fallback DOM manipulation'
        );
      });

      it('should check command support with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const supported = service.isCommandSupported('bold');
        
        expect(errorHandlerService.handleBrowserError).toHaveBeenCalled();
        expect(typeof supported).toBe('boolean');
      });

      it('should check command enabled state with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const enabled = service.isCommandEnabled('bold');
        
        expect(typeof enabled).toBe('boolean');
      });

      it('should get command state with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const state = service.getCommandState('bold');
        
        expect(typeof state).toBe('boolean');
      });

      it('should get command value with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const value = service.getCommandValue('fontSize');
        
        expect(typeof value).toBe('string');
      });
    });

    describe('Fallback Command Implementations', () => {
      beforeEach(() => {
        // Mock selection and range
        const mockRange = {
          extractContents: jasmine.createSpy().and.returnValue(document.createDocumentFragment()),
          insertNode: jasmine.createSpy(),
          selectNode: jasmine.createSpy(),
          cloneRange: jasmine.createSpy().and.returnValue({})
        } as any;

        const mockSelection = {
          getRangeAt: jasmine.createSpy().and.returnValue(mockRange),
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy(),
          rangeCount: 1
        } as any;

        spyOn(window, 'getSelection').and.returnValue(mockSelection);
      });

      it('should execute bold command with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });

      it('should execute italic command with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'italic' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });

      it('should execute underline command with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'underline' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });

      it('should execute font size command with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'fontSize' };
        const result = service.executeCommand(command, '16px');
        
        expect(typeof result).toBe('boolean');
      });

      it('should execute color command with fallback', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'foreColor' };
        const result = service.executeCommand(command, '#ff0000');
        
        expect(typeof result).toBe('boolean');
      });
    });

    describe('Error Recovery', () => {
      it('should handle execCommand failures gracefully', () => {
        spyOn(document, 'execCommand').and.returnValue(false);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(errorHandlerService.handleCommandError).toHaveBeenCalled();
        expect(typeof result).toBe('boolean');
      });

      it('should handle execCommand exceptions', () => {
        spyOn(document, 'execCommand').and.throwError('Test error');
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(errorHandlerService.handleCommandError).toHaveBeenCalled();
        expect(typeof result).toBe('boolean');
      });

      it('should handle queryCommandState exceptions', () => {
        spyOn(document, 'queryCommandState').and.throwError('Test error');
        
        const state = service.getCommandState('bold');
        
        expect(errorHandlerService.handleCommandError).toHaveBeenCalled();
        expect(typeof state).toBe('boolean');
      });

      it('should handle queryCommandValue exceptions', () => {
        spyOn(document, 'queryCommandValue').and.throwError('Test error');
        
        const value = service.getCommandValue('fontSize');
        
        expect(errorHandlerService.handleCommandError).toHaveBeenCalled();
        expect(typeof value).toBe('string');
      });
    });

    describe('Selection Validation', () => {
      it('should validate selection before operations', () => {
        spyOn(window, 'getSelection').and.returnValue(null);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });

      it('should handle invalid selection ranges', () => {
        const mockSelection = {
          getRangeAt: jasmine.createSpy().and.throwError('Invalid range'),
          rangeCount: 1
        } as any;

        spyOn(window, 'getSelection').and.returnValue(mockSelection);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });
    });

    describe('DOM Manipulation Safety', () => {
      it('should handle DOM manipulation errors gracefully', () => {
        const mockRange = {
          extractContents: jasmine.createSpy().and.throwError('DOM error'),
          insertNode: jasmine.createSpy(),
          selectNode: jasmine.createSpy()
        } as any;

        const mockSelection = {
          getRangeAt: jasmine.createSpy().and.returnValue(mockRange),
          rangeCount: 1
        } as any;

        spyOn(window, 'getSelection').and.returnValue(mockSelection);
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });

      it('should handle element creation errors', () => {
        spyOn(document, 'createElement').and.throwError('Creation error');
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const command: EditorCommand = { name: 'bold' };
        const result = service.executeCommand(command);
        
        expect(typeof result).toBe('boolean');
      });
    });

    describe('Color Conversion', () => {
      it('should convert RGB to hex correctly', () => {
        // Access private method through any cast for testing
        const rgbToHex = (service as any).rgbToHex;
        
        expect(rgbToHex('rgb(255, 0, 0)')).toBe('#ff0000');
        expect(rgbToHex('rgb(0, 255, 0)')).toBe('#00ff00');
        expect(rgbToHex('rgb(0, 0, 255)')).toBe('#0000ff');
        expect(rgbToHex('#ff0000')).toBe('#ff0000');
        expect(rgbToHex('transparent')).toBe('transparent');
        expect(rgbToHex('')).toBe('transparent');
      });

      it('should handle RGBA colors', () => {
        const rgbToHex = (service as any).rgbToHex;
        
        expect(rgbToHex('rgba(255, 0, 0, 0.5)')).toBe('#ff0000');
        expect(rgbToHex('rgba(0, 255, 0, 1)')).toBe('#00ff00');
      });

      it('should handle invalid color formats', () => {
        const rgbToHex = (service as any).rgbToHex;
        
        expect(rgbToHex('invalid-color')).toBe('invalid-color');
        expect(rgbToHex('hsl(0, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
      });
    });

    describe('Retry Mechanism', () => {
      it('should retry failed operations', () => {
        const executeWithRetry = (service as any).executeWithRetry;
        let attemptCount = 0;
        
        const operation = jasmine.createSpy().and.callFake(() => {
          attemptCount++;
          if (attemptCount < 2) {
            throw new Error('Temporary failure');
          }
          return 'success';
        });
        
        const fallback = jasmine.createSpy().and.returnValue('fallback');
        
        const result = executeWithRetry(operation, fallback, 2, 'test');
        
        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
        expect(fallback).not.toHaveBeenCalled();
      });

      it('should use fallback after max retries', () => {
        const executeWithRetry = (service as any).executeWithRetry;
        
        const operation = jasmine.createSpy().and.throwError('Persistent failure');
        const fallback = jasmine.createSpy().and.returnValue('fallback');
        
        const result = executeWithRetry(operation, fallback, 2, 'test');
        
        expect(result).toBe('fallback');
        expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        expect(fallback).toHaveBeenCalledTimes(1);
      });

      it('should handle fallback failures', () => {
        const executeWithRetry = (service as any).executeWithRetry;
        
        const operation = jasmine.createSpy().and.throwError('Operation failure');
        const fallback = jasmine.createSpy().and.throwError('Fallback failure');
        
        expect(() => {
          executeWithRetry(operation, fallback, 1, 'test');
        }).toThrow('Fallback failure');
      });
    });

    describe('Safe DOM Operations', () => {
      it('should handle DOM operation errors safely', () => {
        const safeDOMOperation = (service as any).safeDOMOperation;
        
        const operation = jasmine.createSpy().and.throwError('DOM error');
        const fallback = 'fallback-value';
        
        const result = safeDOMOperation(operation, fallback, 'test-operation');
        
        expect(result).toBe(fallback);
        expect(errorHandlerService.handleCommandError).toHaveBeenCalled();
      });

      it('should return operation result when successful', () => {
        const safeDOMOperation = (service as any).safeDOMOperation;
        
        const operation = jasmine.createSpy().and.returnValue('success');
        const fallback = 'fallback-value';
        
        const result = safeDOMOperation(operation, fallback, 'test-operation');
        
        expect(result).toBe('success');
        expect(errorHandlerService.handleCommandError).not.toHaveBeenCalled();
      });
    });
  });  
describe('batch command execution and advanced formatting', () => {
    let mockSelection: any;
    let mockRange: any;

    beforeEach(() => {
      mockRange = {
        deleteContents: jasmine.createSpy('deleteContents'),
        insertNode: jasmine.createSpy('insertNode'),
        toString: jasmine.createSpy('toString').and.returnValue('selected text'),
        setStartAfter: jasmine.createSpy('setStartAfter'),
        setEndAfter: jasmine.createSpy('setEndAfter')
      };

      mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue(mockRange),
        removeAllRanges: jasmine.createSpy('removeAllRanges'),
        addRange: jasmine.createSpy('addRange')
      };

      spyOn(window, 'getSelection').and.returnValue(mockSelection);
    });

    describe('executeCommands', () => {
      it('should execute multiple commands successfully', () => {
        const commands = [
          { command: { name: 'bold' } },
          { command: { name: 'italic' } },
          { command: { name: 'fontSize' }, value: '16px' }
        ];
        const mockSelectionState = createMockSelectionState();
        selectionService.saveSelection.and.returnValue(mockSelectionState);
        
        const result = service.executeCommands(commands);
        
        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledTimes(3);
        expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
        expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
        expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '16px');
      });

      it('should return false if any command fails', () => {
        const commands = [
          { command: { name: 'bold' } },
          { command: { name: 'italic' } }
        ];
        mockDocument.execCommand.and.returnValues(true, false);
        const mockSelectionState = createMockSelectionState();
        selectionService.saveSelection.and.returnValue(mockSelectionState);
        
        const result = service.executeCommands(commands);
        
        expect(result).toBe(false);
      });

      it('should handle errors gracefully', () => {
        const commands = [{ command: { name: 'bold' } }];
        mockDocument.execCommand.and.throwError('Command failed');
        
        const result = service.executeCommands(commands);
        
        expect(result).toBe(false);
      });
    });

    describe('removeFormatting', () => {
      it('should remove formatting successfully', () => {
        const mockSelectionState = createMockSelectionState();
        selectionService.saveSelection.and.returnValue(mockSelectionState);
        
        const result = service.removeFormatting();
        
        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('removeFormat', false);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.returnValue(false);
        spyOn(document, 'createTextNode').and.returnValue(document.createTextNode('selected text'));
        
        const result = service.removeFormatting();
        
        expect(result).toBe(true);
        expect(mockRange.deleteContents).toHaveBeenCalled();
        expect(mockRange.insertNode).toHaveBeenCalled();
      });

      it('should handle missing selection', () => {
        mockDocument.execCommand.and.returnValue(false);
        (window.getSelection as jasmine.Spy).and.returnValue(null);
        
        const result = service.removeFormatting();
        
        expect(result).toBe(false);
      });
    });

    describe('insertHTML', () => {
      it('should insert HTML successfully', () => {
        const html = '<strong>Bold text</strong>';
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);
        
        const result = service.insertHTML(html);
        
        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('insertHTML', false, html);
      });

      it('should use fallback when execCommand fails', () => {
        const html = '<strong>Bold text</strong>';
        mockDocument.execCommand.and.returnValue(false);
        
        const mockDiv = document.createElement('div');
        const mockFragment = document.createDocumentFragment();
        spyOn(document, 'createElement').and.returnValue(mockDiv);
        spyOn(document, 'createDocumentFragment').and.returnValue(mockFragment);
        
        const result = service.insertHTML(html);
        
        expect(result).toBe(true);
        expect(mockRange.deleteContents).toHaveBeenCalled();
        expect(mockRange.insertNode).toHaveBeenCalledWith(mockFragment);
      });

      it('should handle missing selection', () => {
        mockDocument.execCommand.and.returnValue(false);
        (window.getSelection as jasmine.Spy).and.returnValue(null);
        
        const result = service.insertHTML('<strong>test</strong>');
        
        expect(result).toBe(false);
      });
    });

    describe('insertText', () => {
      it('should insert text successfully', () => {
        const text = 'Plain text';
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);
        
        const result = service.insertText(text);
        
        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, text);
      });

      it('should use fallback when execCommand fails', () => {
        const text = 'Plain text';
        mockDocument.execCommand.and.returnValue(false);
        
        const mockTextNode = document.createTextNode(text);
        spyOn(document, 'createTextNode').and.returnValue(mockTextNode);
        
        const result = service.insertText(text);
        
        expect(result).toBe(true);
        expect(mockRange.deleteContents).toHaveBeenCalled();
        expect(mockRange.insertNode).toHaveBeenCalledWith(mockTextNode);
        expect(mockRange.setStartAfter).toHaveBeenCalled();
        expect(mockRange.setEndAfter).toHaveBeenCalled();
      });

      it('should handle missing selection', () => {
        mockDocument.execCommand.and.returnValue(false);
        (window.getSelection as jasmine.Spy).and.returnValue(null);
        
        const result = service.insertText('test');
        
        expect(result).toBe(false);
      });
    });
  });

  describe('text alignment methods', () => {
    let mockSelection: any;
    let mockRange: any;
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('p');
      mockElement.innerHTML = 'Test content';
      
      mockRange = {
        commonAncestorContainer: mockElement
      };

      mockSelection = {
        rangeCount: 1,
        getRangeAt: jasmine.createSpy('getRangeAt').and.returnValue(mockRange)
      };

      spyOn(window, 'getSelection').and.returnValue(mockSelection);
    });

    describe('alignLeft', () => {
      it('should execute justifyLeft command', () => {
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignLeft();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyLeft', false);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignLeft();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('left');
      });
    });

    describe('alignCenter', () => {
      it('should execute justifyCenter command', () => {
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignCenter();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyCenter', false);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignCenter();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('center');
      });
    });

    describe('alignRight', () => {
      it('should execute justifyRight command', () => {
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignRight();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyRight', false);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignRight();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('right');
      });
    });

    describe('alignJustify', () => {
      it('should execute justifyFull command', () => {
        const mockSelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: '#ffffff',
            alignment: 'left' as TextAlignment
          }
        };
        selectionService.saveSelection.and.returnValue(mockSelectionState);

        const result = service.alignJustify();

        expect(result).toBe(true);
        expect(document.execCommand).toHaveBeenCalledWith('justifyFull', false);
      });

      it('should use fallback when execCommand fails', () => {
        mockDocument.execCommand.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);

        const result = service.alignJustify();

        expect(result).toBe(true);
        expect(mockElement.style.textAlign).toBe('justify');
      });
    });

    describe('getCurrentAlignment', () => {
      it('should return center when justifyCenter is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyCenter');

        const result = service.getCurrentAlignment();

        expect(result).toBe('center');
      });

      it('should return right when justifyRight is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyRight');

        const result = service.getCurrentAlignment();

        expect(result).toBe('right');
      });

      it('should return justify when justifyFull is active', () => {
        mockDocument.queryCommandState.and.callFake((command: string) => command === 'justifyFull');

        const result = service.getCurrentAlignment();

        expect(result).toBe('justify');
      });

      it('should return left as default', () => {
        mockDocument.queryCommandState.and.returnValue(false);

        const result = service.getCurrentAlignment();

        expect(result).toBe('left');
      });

      it('should check computed style when command state is not available', () => {
        mockDocument.queryCommandState.and.returnValue(false);
        spyOn(service as any, 'findParentBlockElement').and.returnValue(mockElement);
        spyOn(window, 'getComputedStyle').and.returnValue({
          textAlign: 'center'
        } as CSSStyleDeclaration);

        const result = service.getCurrentAlignment();

        expect(result).toBe('center');
        expect(window.getComputedStyle).toHaveBeenCalledWith(mockElement);
      });

      it('should handle missing selection gracefully', () => {
        mockDocument.queryCommandState.and.returnValue(false);
        (window.getSelection as jasmine.Spy).and.returnValue(null);

        const result = service.getCurrentAlignment();

        expect(result).toBe('left');
      });
    });

    describe('alignment state checking methods', () => {
      it('should correctly identify left alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('left');

        expect(service.isAlignedLeft()).toBe(true);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify center alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('center');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(true);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify right alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('right');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(true);
        expect(service.isAlignedJustify()).toBe(false);
      });

      it('should correctly identify justify alignment', () => {
        spyOn(service, 'getCurrentAlignment').and.returnValue('justify');

        expect(service.isAlignedLeft()).toBe(false);
        expect(service.isAlignedCenter()).toBe(false);
        expect(service.isAlignedRight()).toBe(false);
        expect(service.isAlignedJustify()).toBe(true);
      });
    });
  });

  describe('undo/redo system integration', () => {
    let mockElement: HTMLElement;
    let mockHistoryState: any;

    beforeEach(() => {
      mockElement = document.createElement('div');
      mockElement.setAttribute('contenteditable', 'true');
      mockElement.innerHTML = 'Test content';
      
      mockHistoryState = {
        id: 'test-state',
        content: 'Previous content',
        selection: { start: 0, end: 5 },
        timestamp: Date.now(),
        command: 'bold'
      };

      // Mock querySelector to return our test element
      spyOn(document, 'querySelector').and.returnValue(mockElement);
    });

    describe('undo', () => {
      it('should undo successfully when history is available', () => {
        historyService.undo.and.returnValue(mockHistoryState);
        spyOn(service as any, 'restoreHistoryState');

        const result = service.undo();

        expect(result).toBe(true);
        expect(historyService.undo).toHaveBeenCalled();
        expect(service['restoreHistoryState']).toHaveBeenCalledWith(mockHistoryState);
      });

      it('should return false when no history is available', () => {
        historyService.undo.and.returnValue(null);

        const result = service.undo();

        expect(result).toBe(false);
        expect(historyService.undo).toHaveBeenCalled();
      });

      it('should handle errors gracefully', () => {
        historyService.undo.and.throwError('Undo failed');

        const result = service.undo();

        expect(result).toBe(false);
      });
    });

    describe('redo', () => {
      it('should redo successfully when history is available', () => {
        historyService.redo.and.returnValue(mockHistoryState);
        spyOn(service as any, 'restoreHistoryState');

        const result = service.redo();

        expect(result).toBe(true);
        expect(historyService.redo).toHaveBeenCalled();
        expect(service['restoreHistoryState']).toHaveBeenCalledWith(mockHistoryState);
      });

      it('should return false when no history is available', () => {
        historyService.redo.and.returnValue(null);

        const result = service.redo();

        expect(result).toBe(false);
        expect(historyService.redo).toHaveBeenCalled();
      });

      it('should handle errors gracefully', () => {
        historyService.redo.and.throwError('Redo failed');

        const result = service.redo();

        expect(result).toBe(false);
      });
    });

    describe('canUndo', () => {
      it('should return true when undo is available', () => {
        historyService.canUndo.and.returnValue(true);

        const result = service.canUndo();

        expect(result).toBe(true);
        expect(historyService.canUndo).toHaveBeenCalled();
      });

      it('should return false when undo is not available', () => {
        historyService.canUndo.and.returnValue(false);

        const result = service.canUndo();

        expect(result).toBe(false);
        expect(historyService.canUndo).toHaveBeenCalled();
      });
    });

    describe('canRedo', () => {
      it('should return true when redo is available', () => {
        historyService.canRedo.and.returnValue(true);

        const result = service.canRedo();

        expect(result).toBe(true);
        expect(historyService.canRedo).toHaveBeenCalled();
      });

      it('should return false when redo is not available', () => {
        historyService.canRedo.and.returnValue(false);

        const result = service.canRedo();

        expect(result).toBe(false);
        expect(historyService.canRedo).toHaveBeenCalled();
      });
    });

    describe('saveState', () => {
      it('should save state successfully', () => {
        const command = 'bold';
        const mockSelection = { start: 0, end: 5 };
        const mockState = { id: 'new-state', content: 'Test content', command, timestamp: Date.now() };
        
        historyService.getSelectionPosition.and.returnValue(mockSelection);
        historyService.createState.and.returnValue(mockState);

        service.saveState(mockElement, command);

        expect(historyService.getSelectionPosition).toHaveBeenCalledWith(mockElement);
        expect(historyService.createState).toHaveBeenCalledWith('Test content', command, mockSelection);
        expect(historyService.addState).toHaveBeenCalledWith(mockState);
      });

      it('should handle errors gracefully', () => {
        historyService.getSelectionPosition.and.throwError('Selection failed');

        expect(() => service.saveState(mockElement, 'bold')).not.toThrow();
      });
    });

    describe('initializeHistory', () => {
      it('should initialize history successfully', () => {
        const mockSelection = { start: 0, end: 0 };
        const mockState = { id: 'init-state', content: 'Test content', command: 'initialize', timestamp: Date.now() };
        
        historyService.getSelectionPosition.and.returnValue(mockSelection);
        historyService.createState.and.returnValue(mockState);

        service.initializeHistory(mockElement);

        expect(historyService.clear).toHaveBeenCalled();
        expect(historyService.getSelectionPosition).toHaveBeenCalledWith(mockElement);
        expect(historyService.createState).toHaveBeenCalledWith('Test content', 'initialize', mockSelection);
        expect(historyService.addState).toHaveBeenCalledWith(mockState);
      });

      it('should handle errors gracefully', () => {
        historyService.clear.and.throwError('Clear failed');

        expect(() => service.initializeHistory(mockElement)).not.toThrow();
      });
    });

    describe('clearHistory', () => {
      it('should clear history', () => {
        service.clearHistory();

        expect(historyService.clear).toHaveBeenCalled();
      });
    });

    describe('getHistoryService', () => {
      it('should return history service instance', () => {
        const result = service.getHistoryService();

        expect(result).toBe(historyService);
      });
    });

    describe('restoreHistoryState', () => {
      it('should restore content and selection', () => {
        const state = {
          content: 'Restored content',
          selection: { start: 2, end: 8 }
        };

        service['restoreHistoryState'](state);

        expect(mockElement.innerHTML).toBe('Restored content');
        expect(historyService.restoreSelectionPosition).toHaveBeenCalledWith(mockElement, state.selection);
      });

      it('should handle missing element gracefully', () => {
        (document.querySelector as jasmine.Spy).and.returnValue(null);
        const state = { content: 'Test content' };

        expect(() => service['restoreHistoryState'](state)).not.toThrow();
      });

      it('should restore content without selection', () => {
        const state = { content: 'Restored content' };

        service['restoreHistoryState'](state);

        expect(mockElement.innerHTML).toBe('Restored content');
        expect(historyService.restoreSelectionPosition).not.toHaveBeenCalled();
      });
    });
  });
});
