import { TestBed } from '@angular/core/testing';
import { SelectionService } from './selection.service';
import { ErrorHandlerService } from './error-handler.service';
import { SelectionState } from '../models/selection-state.interface';

describe('SelectionService', () => {
  let service: SelectionService;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  let mockSelection: jasmine.SpyObj<Selection>;
  let mockRange: jasmine.SpyObj<Range>;
  let testElement: HTMLElement;

  beforeEach(() => {
    const errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'handleSelectionError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandlerService, useValue: errorHandlerServiceSpy }
      ]
    });
    
    service = TestBed.inject(SelectionService);
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;

    // Create test element
    testElement = document.createElement('div');
    testElement.innerHTML = 'Test content for selection';
    document.body.appendChild(testElement);

    // Create mock range
    mockRange = jasmine.createSpyObj('Range', [
      'cloneRange', 'collapse', 'selectNodeContents', 'setStart', 'surroundContents',
      'extractContents', 'insertNode'
    ], {
      collapsed: false,
      startOffset: 0,
      endOffset: 5,
      startContainer: testElement.firstChild!,
      endContainer: testElement.firstChild!,
      commonAncestorContainer: testElement
    });

    // Create mock selection
    mockSelection = jasmine.createSpyObj('Selection', [
      'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
      'collapseToStart', 'collapseToEnd'
    ], {
      rangeCount: 1,
      isCollapsed: false,
      anchorNode: testElement.firstChild,
      focusNode: testElement.firstChild,
      anchorOffset: 0,
      focusOffset: 5
    });

    // Setup mock returns
    mockRange.cloneRange.and.returnValue(mockRange);
    mockSelection.getRangeAt.and.returnValue(mockRange);
    mockSelection.toString.and.returnValue('Test ');

    // Mock document.queryCommandState and queryCommandValue
    spyOn(document, 'queryCommandState').and.returnValue(false);
    spyOn(document, 'queryCommandValue').and.returnValue('');
  });

  afterEach(() => {
    document.body.removeChild(testElement);
  });

  describe('getSelection', () => {
    it('should return window selection when available', () => {
      spyOn(window, 'getSelection').and.returnValue(mockSelection);
      
      const result = service.getSelection();
      
      expect(result).toBe(mockSelection);
      expect(window.getSelection).toHaveBeenCalled();
    });

    it('should return null when window.getSelection is not available', () => {
      spyOn(window, 'getSelection').and.returnValue(null);
      
      const result = service.getSelection();
      
      expect(result).toBeNull();
    });

    it('should handle undefined window', () => {
      const originalWindow = (window as any);
      Object.defineProperty(window, 'getSelection', {
        value: undefined,
        configurable: true
      });
      
      const result = service.getSelection();
      
      expect(result).toBeNull();
      
      Object.defineProperty(window, 'getSelection', {
        value: originalWindow.getSelection,
        configurable: true
      });
    });
  });

  describe('getRange', () => {
    it('should return range when selection has ranges', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      const result = service.getRange();
      
      expect(result).toBe(mockRange);
      expect(mockSelection.getRangeAt).toHaveBeenCalledWith(0);
    });

    it('should return null when selection has no ranges', () => {
      const mockSelectionNoRanges = jasmine.createSpyObj('Selection', [
        'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
        'collapseToStart', 'collapseToEnd'
      ], {
        rangeCount: 0,
        isCollapsed: false
      });
      spyOn(service, 'getSelection').and.returnValue(mockSelectionNoRanges);
      
      const result = service.getRange();
      
      expect(result).toBeNull();
    });

    it('should return null when no selection', () => {
      spyOn(service, 'getSelection').and.returnValue(null);
      
      const result = service.getRange();
      
      expect(result).toBeNull();
    });
  });

  describe('saveSelection', () => {
    it('should save current selection state', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(service, 'getRange').and.returnValue(mockRange);
      
      const result = service.saveSelection();
      
      expect(result.range).toBe(mockRange);
      expect(result.collapsed).toBe(false);
      expect(result.startOffset).toBe(0);
      expect(result.endOffset).toBe(5);
      expect(result.selectedText).toBe('Test ');
      expect(result.isMultiElement).toBe(false);
      expect(mockRange.cloneRange).toHaveBeenCalled();
    });

    it('should return empty state when no selection', () => {
      spyOn(service, 'getSelection').and.returnValue(null);
      spyOn(service, 'getRange').and.returnValue(null);
      
      const result = service.saveSelection();
      
      expect(result.range).toBeNull();
      expect(result.collapsed).toBe(true);
      expect(result.formats).toBeDefined();
    });

    it('should detect multi-element selection', () => {
      const otherNode = document.createTextNode('other');
      const mockRangeMulti = jasmine.createSpyObj('Range', [
        'cloneRange', 'collapse', 'selectNodeContents', 'setStart', 'surroundContents',
        'extractContents', 'insertNode'
      ], {
        collapsed: false,
        startOffset: 0,
        endOffset: 5,
        startContainer: testElement.firstChild!,
        endContainer: otherNode,
        commonAncestorContainer: testElement
      });
      mockRangeMulti.cloneRange.and.returnValue(mockRangeMulti);
      
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(service, 'getRange').and.returnValue(mockRangeMulti);
      
      const result = service.saveSelection();
      
      expect(result.isMultiElement).toBe(true);
    });
  });

  describe('restoreSelection', () => {
    it('should restore selection from state', () => {
      const state: SelectionState = {
        range: mockRange,
        collapsed: false,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      service.restoreSelection(state);
      
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
    });

    it('should handle null range gracefully', () => {
      const state: SelectionState = {
        range: null,
        collapsed: true,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      service.restoreSelection(state);
      
      expect(mockSelection.removeAllRanges).not.toHaveBeenCalled();
      expect(mockSelection.addRange).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const state: SelectionState = {
        range: mockRange,
        collapsed: false,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      };
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      mockSelection.addRange.and.throwError('Selection error');
      spyOn(console, 'warn');
      
      service.restoreSelection(state);
      
      expect(console.warn).toHaveBeenCalledWith('Failed to restore selection:', jasmine.any(Error));
    });
  });

  describe('selectAll', () => {
    it('should select all content in document body by default', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      
      service.selectAll();
      
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(document.body);
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
    });

    it('should select all content in specified element', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      
      service.selectAll(testElement);
      
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(testElement);
    });

    it('should handle errors gracefully', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      mockRange.selectNodeContents.and.throwError('Range error');
      spyOn(console, 'warn');
      
      service.selectAll();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to select all content:', jasmine.any(Error));
    });
  });

  describe('collapse', () => {
    it('should collapse to start by default', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      service.collapse();
      
      expect(mockSelection.collapseToStart).toHaveBeenCalled();
      expect(mockSelection.collapseToEnd).not.toHaveBeenCalled();
    });

    it('should collapse to end when specified', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      service.collapse(false);
      
      expect(mockSelection.collapseToEnd).toHaveBeenCalled();
      expect(mockSelection.collapseToStart).not.toHaveBeenCalled();
    });

    it('should handle no selection gracefully', () => {
      spyOn(service, 'getSelection').and.returnValue(null);
      
      expect(() => service.collapse()).not.toThrow();
    });
  });

  describe('setCursorPosition', () => {
    it('should set cursor position in element', () => {
      const textNode = document.createTextNode('Test text');
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      
      service.setCursorPosition(textNode, 4);
      
      expect(mockRange.setStart).toHaveBeenCalledWith(textNode, 4);
      expect(mockRange.collapse).toHaveBeenCalledWith(true);
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
    });

    it('should limit offset to text content length', () => {
      const textNode = document.createTextNode('Test');
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      
      service.setCursorPosition(textNode, 10);
      
      expect(mockRange.setStart).toHaveBeenCalledWith(textNode, 4);
    });

    it('should handle errors gracefully', () => {
      const textNode = document.createTextNode('Test');
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(document, 'createRange').and.returnValue(mockRange);
      mockRange.setStart.and.throwError('Range error');
      spyOn(console, 'warn');
      
      service.setCursorPosition(textNode, 2);
      
      expect(console.warn).toHaveBeenCalledWith('Failed to set cursor position:', jasmine.any(Error));
    });
  });

  describe('hasSelection', () => {
    it('should return true when selection is not collapsed', () => {
      const mockSelectionNotCollapsed = jasmine.createSpyObj('Selection', [
        'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
        'collapseToStart', 'collapseToEnd'
      ], {
        rangeCount: 1,
        isCollapsed: false
      });
      spyOn(service, 'getSelection').and.returnValue(mockSelectionNotCollapsed);
      
      const result = service.hasSelection();
      
      expect(result).toBe(true);
    });

    it('should return false when selection is collapsed', () => {
      const mockSelectionCollapsed = jasmine.createSpyObj('Selection', [
        'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
        'collapseToStart', 'collapseToEnd'
      ], {
        rangeCount: 1,
        isCollapsed: true
      });
      spyOn(service, 'getSelection').and.returnValue(mockSelectionCollapsed);
      
      const result = service.hasSelection();
      
      expect(result).toBe(false);
    });

    it('should return false when no selection', () => {
      spyOn(service, 'getSelection').and.returnValue(null);
      
      const result = service.hasSelection();
      
      expect(result).toBe(false);
    });
  });

  describe('getSelectedText', () => {
    it('should return selected text', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      
      const result = service.getSelectedText();
      
      expect(result).toBe('Test ');
    });

    it('should return empty string when no selection', () => {
      spyOn(service, 'getSelection').and.returnValue(null);
      
      const result = service.getSelectedText();
      
      expect(result).toBe('');
    });

    it('should handle errors gracefully', () => {
      spyOn(service, 'getSelection').and.throwError('Selection error');
      
      const result = service.getSelectedText();
      
      expect(result).toBe('');
    });
  });

  describe('Advanced Selection Management', () => {
    describe('selectAll', () => {
      it('should select all content in document body by default', () => {
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue(mockRange);
        
        service.selectAll();
        
        expect(mockRange.selectNodeContents).toHaveBeenCalledWith(document.body);
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
        expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
      });

      it('should select all content in specified element', () => {
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue(mockRange);
        
        service.selectAll(testElement);
        
        expect(mockRange.selectNodeContents).toHaveBeenCalledWith(testElement);
      });

      it('should handle errors gracefully', () => {
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue(mockRange);
        mockRange.selectNodeContents.and.throwError('Range error');
        
        expect(() => service.selectAll()).not.toThrow();
      });
    });

    describe('collapse', () => {
      it('should collapse to start by default', () => {
        spyOn(service, 'collapseSelection');
        
        service.collapse();
        
        expect(service.collapseSelection).toHaveBeenCalledWith(true);
      });

      it('should collapse to end when specified', () => {
        spyOn(service, 'collapseSelection');
        
        service.collapse(false);
        
        expect(service.collapseSelection).toHaveBeenCalledWith(false);
      });

      it('should handle undefined parameter', () => {
        spyOn(service, 'collapseSelection');
        
        service.collapse(undefined);
        
        expect(service.collapseSelection).toHaveBeenCalledWith(true);
      });
    });

    describe('hasSelection', () => {
      it('should return true when selection is not collapsed', () => {
        const mockSelectionNotCollapsed = jasmine.createSpyObj('Selection', [
          'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
          'collapseToStart', 'collapseToEnd'
        ], {
          rangeCount: 1,
          isCollapsed: false
        });
        spyOn(service, 'getSelection').and.returnValue(mockSelectionNotCollapsed);
        
        const result = service.hasSelection();
        
        expect(result).toBe(true);
      });

      it('should return false when selection is collapsed', () => {
        const mockSelectionCollapsed = jasmine.createSpyObj('Selection', [
          'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
          'collapseToStart', 'collapseToEnd'
        ], {
          rangeCount: 1,
          isCollapsed: true
        });
        spyOn(service, 'getSelection').and.returnValue(mockSelectionCollapsed);
        
        const result = service.hasSelection();
        
        expect(result).toBe(false);
      });

      it('should return false when no selection', () => {
        spyOn(service, 'getSelection').and.returnValue(null);
        
        const result = service.hasSelection();
        
        expect(result).toBe(false);
      });

      it('should return false when no ranges', () => {
        const mockSelectionNoRanges = jasmine.createSpyObj('Selection', [
          'getRangeAt', 'removeAllRanges', 'addRange', 'toString', 
          'collapseToStart', 'collapseToEnd'
        ], {
          rangeCount: 0,
          isCollapsed: false
        });
        spyOn(service, 'getSelection').and.returnValue(mockSelectionNoRanges);
        
        const result = service.hasSelection();
        
        expect(result).toBe(false);
      });

      it('should handle errors gracefully', () => {
        spyOn(service, 'getSelection').and.throwError('Selection error');
        
        const result = service.hasSelection();
        
        expect(result).toBe(false);
      });
    });
  });

  describe('Selection Wrapping and Error Handling', () => {
    describe('wrapSelection', () => {
      it('should wrap selection with specified tag', () => {
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(service as any, 'isValidRange').and.returnValue(true);
        spyOn(document, 'createElement').and.returnValue(document.createElement('strong'));
        
        service.wrapSelection('strong');
        
        expect(document.createElement).toHaveBeenCalledWith('strong');
        expect(mockRange.surroundContents).toHaveBeenCalled();
      });

      it('should add attributes to wrapper element', () => {
        const mockElement = document.createElement('a');
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(service as any, 'isValidRange').and.returnValue(true);
        spyOn(document, 'createElement').and.returnValue(mockElement);
        spyOn(mockElement, 'setAttribute');
        
        service.wrapSelection('a', { href: 'http://example.com', target: '_blank' });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'http://example.com');
        expect(mockElement.setAttribute).toHaveBeenCalledWith('target', '_blank');
      });

      it('should handle collapsed selection gracefully', () => {
        const mockRangeCollapsed = jasmine.createSpyObj('Range', [
          'cloneRange', 'collapse', 'selectNodeContents', 'setStart', 'surroundContents',
          'extractContents', 'insertNode'
        ], {
          collapsed: true,
          startOffset: 0,
          endOffset: 0
        });
        spyOn(service, 'getRange').and.returnValue(mockRangeCollapsed);
        
        expect(() => service.wrapSelection('strong')).not.toThrow();
      });

      it('should handle invalid range gracefully', () => {
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(service as any, 'isValidRange').and.returnValue(false);
        
        expect(() => service.wrapSelection('strong')).not.toThrow();
      });

      it('should use fallback method when surroundContents fails', () => {
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(service as any, 'isValidRange').and.returnValue(true);
        spyOn(document, 'createElement').and.returnValue(document.createElement('strong'));
        mockRange.surroundContents.and.throwError('Cannot surround');
        spyOn(service as any, 'wrapSelectionFallback');
        
        service.wrapSelection('strong');
        
        expect((service as any).wrapSelectionFallback).toHaveBeenCalledWith('strong', undefined);
      });

      it('should handle null range gracefully', () => {
        spyOn(service, 'getRange').and.returnValue(null);
        
        expect(() => service.wrapSelection('strong')).not.toThrow();
      });
    });

    describe('wrapSelectionFallback', () => {
      it('should wrap selection using fallback method', () => {
        const mockElement = document.createElement('em');
        const mockContents = document.createDocumentFragment();
        
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(document, 'createElement').and.returnValue(mockElement);
        spyOn(mockRange, 'extractContents').and.returnValue(mockContents);
        spyOn(mockElement, 'appendChild');
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        
        (service as any).wrapSelectionFallback('em');
        
        expect(mockRange.extractContents).toHaveBeenCalled();
        expect(mockElement.appendChild).toHaveBeenCalledWith(mockContents);
        expect(mockRange.insertNode).toHaveBeenCalledWith(mockElement);
      });

      it('should add attributes in fallback method', () => {
        const mockElement = document.createElement('a');
        const mockContents = document.createDocumentFragment();
        
        spyOn(service, 'getRange').and.returnValue(mockRange);
        spyOn(document, 'createElement').and.returnValue(mockElement);
        spyOn(mockRange, 'extractContents').and.returnValue(mockContents);
        spyOn(mockElement, 'setAttribute');
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        
        (service as any).wrapSelectionFallback('a', { href: 'test.com' });
        
        expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'test.com');
      });

      it('should handle errors in fallback method', () => {
        spyOn(service, 'getRange').and.returnValue(null);
        
        expect(() => (service as any).wrapSelectionFallback('strong')).not.toThrow();
      });
    });

    describe('Range Validation', () => {
      describe('isValidRange', () => {
        it('should return true for valid range', () => {
          const validRange = {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0,
            cloneRange: jasmine.createSpy().and.returnValue({})
          } as any;
          
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).isValidRange(validRange);
          
          expect(result).toBe(true);
        });

        it('should return false for null range', () => {
          const result = (service as any).isValidRange(null);
          
          expect(result).toBe(false);
        });

        it('should return false for range with null containers', () => {
          const invalidRange = {
            startContainer: null,
            endContainer: null,
            startOffset: 0,
            endOffset: 0
          } as any;
          
          const result = (service as any).isValidRange(invalidRange);
          
          expect(result).toBe(false);
        });

        it('should return false for disconnected range', () => {
          const disconnectedRange = {
            startContainer: document.createElement('div'),
            endContainer: document.createElement('div'),
            startOffset: 0,
            endOffset: 0,
            cloneRange: jasmine.createSpy()
          } as any;
          
          spyOn(document, 'contains').and.returnValue(false);
          
          const result = (service as any).isValidRange(disconnectedRange);
          
          expect(result).toBe(false);
        });

        it('should return false for out-of-bounds text offsets', () => {
          const textNode = document.createTextNode('test');
          const outOfBoundsRange = {
            startContainer: textNode,
            endContainer: textNode,
            startOffset: 10, // Beyond text length
            endOffset: 0,
            cloneRange: jasmine.createSpy()
          } as any;
          
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).isValidRange(outOfBoundsRange);
          
          expect(result).toBe(false);
        });

        it('should handle cloneRange errors', () => {
          const errorRange = {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0,
            cloneRange: jasmine.createSpy().and.throwError('Clone failed')
          } as any;
          
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).isValidRange(errorRange);
          
          expect(result).toBe(false);
        });
      });

      describe('validateAndRecoverSelection', () => {
        it('should return valid selection when available', () => {
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'isValidRange').and.returnValue(true);
          
          const result = (service as any).validateAndRecoverSelection();
          
          expect(result.valid).toBe(true);
          expect(result.selection).toBe(mockSelection);
          expect(result.range).toBe(mockRange);
        });

        it('should return invalid when no selection', () => {
          spyOn(service, 'getSelection').and.returnValue(null);
          
          const result = (service as any).validateAndRecoverSelection();
          
          expect(result.valid).toBe(false);
          expect(result.selection).toBeNull();
          expect(result.range).toBeNull();
        });

        it('should recover selection when no ranges', () => {
          const mockSelectionNoRanges = jasmine.createSpyObj('Selection', [
            'removeAllRanges', 'addRange'
          ], {
            rangeCount: 0
          });
          
          spyOn(service, 'getSelection').and.returnValue(mockSelectionNoRanges);
          spyOn(document, 'createRange').and.returnValue(mockRange);
          
          const result = (service as any).validateAndRecoverSelection();
          
          expect(result.valid).toBe(true);
          expect(mockSelectionNoRanges.removeAllRanges).toHaveBeenCalled();
          expect(mockSelectionNoRanges.addRange).toHaveBeenCalled();
        });

        it('should repair invalid range', () => {
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'isValidRange').and.returnValue(false);
          spyOn(service as any, 'repairRange').and.returnValue(mockRange);
          
          const result = (service as any).validateAndRecoverSelection();
          
          expect(result.valid).toBe(true);
          expect(mockSelection.removeAllRanges).toHaveBeenCalled();
          expect(mockSelection.addRange).toHaveBeenCalled();
        });

        it('should handle repair failure', () => {
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'isValidRange').and.returnValue(false);
          spyOn(service as any, 'repairRange').and.returnValue(null);
          
          const result = (service as any).validateAndRecoverSelection();
          
          expect(result.valid).toBe(false);
        });
      });

      describe('repairRange', () => {
        it('should repair range with valid containers', () => {
          const corruptedRange = {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0
          } as any;
          
          spyOn(document, 'createRange').and.returnValue(mockRange);
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).repairRange(corruptedRange);
          
          expect(result).toBe(mockRange);
          expect(mockRange.setStart).toHaveBeenCalledWith(document.body, 0);
          expect(mockRange.setEnd).toHaveBeenCalledWith(document.body, 0);
        });

        it('should use document.body for disconnected containers', () => {
          const disconnectedElement = document.createElement('div');
          const corruptedRange = {
            startContainer: disconnectedElement,
            endContainer: disconnectedElement,
            startOffset: 0,
            endOffset: 0
          } as any;
          
          spyOn(document, 'createRange').and.returnValue(mockRange);
          spyOn(document, 'contains').and.returnValue(false);
          
          const result = (service as any).repairRange(corruptedRange);
          
          expect(result).toBe(mockRange);
          expect(mockRange.setStart).toHaveBeenCalledWith(document.body, 0);
          expect(mockRange.setEnd).toHaveBeenCalledWith(document.body, 0);
        });

        it('should clamp text node offsets', () => {
          const textNode = document.createTextNode('test');
          const corruptedRange = {
            startContainer: textNode,
            endContainer: textNode,
            startOffset: 10, // Beyond text length
            endOffset: 20   // Beyond text length
          } as any;
          
          spyOn(document, 'createRange').and.returnValue(mockRange);
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).repairRange(corruptedRange);
          
          expect(result).toBe(mockRange);
          expect(mockRange.setStart).toHaveBeenCalledWith(textNode, 4); // Clamped to text length
          expect(mockRange.setEnd).toHaveBeenCalledWith(textNode, 4);
        });

        it('should handle range creation errors', () => {
          const corruptedRange = {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0
          } as any;
          
          spyOn(document, 'createRange').and.throwError('Range creation failed');
          
          const result = (service as any).repairRange(corruptedRange);
          
          expect(result).toBeNull();
        });
      });
    });

    describe('Safe Selection Methods', () => {
      describe('restoreSelectionSafely', () => {
        it('should restore valid selection', () => {
          const state = {
            range: mockRange,
            collapsed: false,
            formats: {
              bold: false,
              italic: false,
              underline: false,
              fontSize: '14px',
          fontFamily: 'Arial',
              fontColor: '#000000',
              backgroundColor: 'transparent',
              alignment: 'left'
            }
          } as any;
          
          spyOn(service as any, 'isValidRange').and.returnValue(true);
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          
          const result = service.restoreSelectionSafely(state);
          
          expect(result).toBe(true);
          expect(mockSelection.removeAllRanges).toHaveBeenCalled();
          expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
        });

        it('should return false for null range', () => {
          const state = {
            range: null,
            collapsed: true,
            formats: {} as any
          };
          
          const result = service.restoreSelectionSafely(state);
          
          expect(result).toBe(false);
        });

        it('should repair invalid range', () => {
          const state = {
            range: mockRange,
            collapsed: false,
            formats: {} as any
          };
          
          spyOn(service as any, 'isValidRange').and.returnValue(false);
          spyOn(service as any, 'repairRange').and.returnValue(mockRange);
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          
          const result = service.restoreSelectionSafely(state);
          
          expect(result).toBe(true);
        });

        it('should handle restoration errors with fallback', () => {
          const state = {
            range: mockRange,
            collapsed: false,
            formats: {} as any
          };
          
          spyOn(service as any, 'isValidRange').and.returnValue(true);
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          mockSelection.addRange.and.throwError('Add range failed');
          spyOn(document, 'createRange').and.returnValue(mockRange);
          
          const result = service.restoreSelectionSafely(state);
          
          expect(result).toBe(false);
        });
      });

      describe('selectTextSafely', () => {
        it('should select text safely', () => {
          const element = document.createElement('div');
          element.textContent = 'test text';
          
          spyOn(service as any, 'findFirstTextNode').and.returnValue(element.firstChild);
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'createSafeRange').and.returnValue(mockRange);
          
          const result = service.selectTextSafely(element, 0, 4);
          
          expect(result).toBe(true);
          expect(mockSelection.removeAllRanges).toHaveBeenCalled();
          expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
        });

        it('should return false when no text node found', () => {
          const element = document.createElement('div');
          
          spyOn(service as any, 'findFirstTextNode').and.returnValue(null);
          
          const result = service.selectTextSafely(element, 0, 4);
          
          expect(result).toBe(false);
        });

        it('should return false when no selection available', () => {
          const element = document.createElement('div');
          element.textContent = 'test';
          
          spyOn(service as any, 'findFirstTextNode').and.returnValue(element.firstChild);
          spyOn(service, 'getSelection').and.returnValue(null);
          
          const result = service.selectTextSafely(element, 0, 4);
          
          expect(result).toBe(false);
        });

        it('should return false when range creation fails', () => {
          const element = document.createElement('div');
          element.textContent = 'test';
          
          spyOn(service as any, 'findFirstTextNode').and.returnValue(element.firstChild);
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'createSafeRange').and.returnValue(null);
          
          const result = service.selectTextSafely(element, 0, 4);
          
          expect(result).toBe(false);
        });
      });

      describe('setCursorPositionSafely', () => {
        it('should set cursor position safely', () => {
          const element = document.createTextNode('test');
          
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'createSafeRange').and.returnValue(mockRange);
          
          const result = service.setCursorPositionSafely(element, 2);
          
          expect(result).toBe(true);
          expect(mockSelection.removeAllRanges).toHaveBeenCalled();
          expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
        });

        it('should return false when no selection available', () => {
          const element = document.createTextNode('test');
          
          spyOn(service, 'getSelection').and.returnValue(null);
          
          const result = service.setCursorPositionSafely(element, 2);
          
          expect(result).toBe(false);
        });

        it('should return false when range creation fails', () => {
          const element = document.createTextNode('test');
          
          spyOn(service, 'getSelection').and.returnValue(mockSelection);
          spyOn(service as any, 'createSafeRange').and.returnValue(null);
          
          const result = service.setCursorPositionSafely(element, 2);
          
          expect(result).toBe(false);
        });
      });

      describe('getSelectionSafely', () => {
        it('should return valid selection when available', () => {
          spyOn(service as any, 'validateAndRecoverSelection').and.returnValue({
            valid: true,
            selection: mockSelection,
            range: mockRange
          });
          
          const result = service.getSelectionSafely();
          
          expect(result.selection).toBe(mockSelection);
          expect(result.range).toBe(mockRange);
          expect(result.error).toBeUndefined();
        });

        it('should return null when validation fails', () => {
          spyOn(service as any, 'validateAndRecoverSelection').and.returnValue({
            valid: false,
            selection: null,
            range: null
          });
          
          const result = service.getSelectionSafely();
          
          expect(result).toBeNull();
        });

        it('should handle errors gracefully', () => {
          spyOn(service as any, 'validateAndRecoverSelection').and.throwError('Validation failed');
          
          const result = service.getSelectionSafely();
          
          expect(result).toBeNull();
          expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
        });
      });

      describe('findValidParent', () => {
        it('should return element when node is valid element', () => {
          const element = document.createElement('div');
          document.body.appendChild(element);
          
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).findValidParent(element);
          
          expect(result).toBe(element);
          
          document.body.removeChild(element);
        });

        it('should return parent element when node is text node', () => {
          const element = document.createElement('div');
          const textNode = document.createTextNode('test');
          element.appendChild(textNode);
          document.body.appendChild(element);
          
          spyOn(document, 'contains').and.returnValue(true);
          
          const result = (service as any).findValidParent(textNode);
          
          expect(result).toBe(element);
          
          document.body.removeChild(element);
        });

        it('should return document.body as fallback', () => {
          const disconnectedElement = document.createElement('div');
          
          spyOn(document, 'contains').and.returnValue(false);
          
          const result = (service as any).findValidParent(disconnectedElement);
          
          expect(result).toBe(document.body);
        });

        it('should handle errors and return document.body', () => {
          const mockNode = {
            nodeType: Node.ELEMENT_NODE,
            parentNode: null
          } as any;
          
          const result = (service as any).findValidParent(mockNode);
          
          expect(result).toBe(document.body);
        });
      });
    });
  });

  describe('getExtendedSelectionState', () => {
    it('should return extended selection information', () => {
      spyOn(service, 'saveSelection').and.returnValue({
        range: mockRange,
        collapsed: false,
        formats: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',
          fontColor: '#000000',
          backgroundColor: 'transparent',
          alignment: 'left'
        }
      });
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(service, 'getRange').and.returnValue(mockRange);
      
      const result = service.getExtendedSelectionState();
      
      expect(result.direction).toBeDefined();
      expect(result.atStart).toBeDefined();
      expect(result.atEnd).toBeDefined();
      expect(result.parentElement).toBeDefined();
    });
  });

  describe('Edge cases and browser compatibility', () => {
    it('should handle missing Range API gracefully', () => {
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      mockSelection.getRangeAt.and.throwError('Range not supported');
      
      const result = service.getRange();
      
      expect(result).toBeNull();
    });

    it('should handle missing Selection API gracefully', () => {
      const originalGetSelection = window.getSelection;
      (window as any).getSelection = undefined;
      
      const result = service.getSelection();
      
      expect(result).toBeNull();
      
      window.getSelection = originalGetSelection;
    });

    it('should handle document.queryCommandState errors', () => {
      (document.queryCommandState as jasmine.Spy).and.throwError('Command not supported');
      spyOn(service, 'getSelection').and.returnValue(mockSelection);
      spyOn(service, 'getRange').and.returnValue(mockRange);
      
      expect(() => service.saveSelection()).not.toThrow();
    });
  });

  describe('Enhanced Error Handling and Recovery', () => {
    let errorHandlerService: jasmine.SpyObj<any>;

    beforeEach(() => {
      errorHandlerService = jasmine.createSpyObj('ErrorHandlerService', [
        'isFeatureSupported',
        'handleBrowserError', 
        'handleSelectionError'
      ]);
      
      errorHandlerService.isFeatureSupported.and.returnValue(true);
      errorHandlerService.handleBrowserError.and.stub();
      errorHandlerService.handleSelectionError.and.stub();
    });

    describe('Selection API Fallbacks', () => {
      it('should handle missing getSelection API', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const selection = service.getSelection();
        
        expect(errorHandlerService.handleBrowserError).toHaveBeenCalledWith(
          'getSelection',
          'Selection operations may not work properly'
        );
        expect(selection).toBeNull();
      });

      it('should handle missing createRange API', () => {
        errorHandlerService.isFeatureSupported = jasmine.createSpy().and.returnValue(false);
        
        const range = service.getRange();
        
        expect(errorHandlerService.handleBrowserError).toHaveBeenCalledWith(
          'createRange',
          'Range operations may not work properly'
        );
        expect(range).toBeNull();
      });

      it('should create fallback selection state when APIs unavailable', () => {
        spyOn(service, 'getSelection').and.returnValue(null);
        spyOn(service, 'getRange').and.returnValue(null);
        
        const state = service.saveSelection();
        
        expect(state.range).toBeNull();
        expect(state.collapsed).toBe(true);
        expect(state.formats).toBeDefined();
      });
    });

    describe('Selection Validation and Recovery', () => {
      it('should validate and recover invalid selections', () => {
        const validateAndRecoverSelection = (service as any).validateAndRecoverSelection;
        
        // Mock invalid selection
        const mockSelection = {
          rangeCount: 0,
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy()
        } as any;
        
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue({
          setStart: jasmine.createSpy(),
          collapse: jasmine.createSpy()
        } as any);
        
        const result = validateAndRecoverSelection();
        
        expect(result.valid).toBe(false);
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });

      it('should repair corrupted ranges', () => {
        const repairRange = (service as any).repairRange;
        
        // Mock corrupted range
        const mockRange = {
          startContainer: document.body,
          endContainer: document.body,
          startOffset: -1, // Invalid offset
          endOffset: 1000 // Invalid offset
        } as any;
        
        spyOn(document, 'createRange').and.returnValue({
          setStart: jasmine.createSpy(),
          setEnd: jasmine.createSpy()
        } as any);
        
        const repairedRange = repairRange(mockRange);
        
        expect(repairedRange).toBeDefined();
      });

      it('should handle range repair failures', () => {
        const repairRange = (service as any).repairRange;
        
        const mockRange = {
          startContainer: null,
          endContainer: null,
          startOffset: 0,
          endOffset: 0
        } as any;
        
        spyOn(document, 'createRange').and.throwError('Range creation failed');
        
        const repairedRange = repairRange(mockRange);
        
        expect(repairedRange).toBeNull();
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });
    });

    describe('Range Validation', () => {
      it('should validate range integrity', () => {
        const isValidRange = (service as any).isValidRange;
        
        // Valid range
        const validRange = {
          startContainer: document.body,
          endContainer: document.body,
          startOffset: 0,
          endOffset: 0,
          cloneRange: jasmine.createSpy().and.returnValue({})
        } as any;
        
        spyOn(document, 'contains').and.returnValue(true);
        
        expect(isValidRange(validRange)).toBe(true);
      });

      it('should detect invalid ranges', () => {
        const isValidRange = (service as any).isValidRange;
        
        // Invalid range - no containers
        const invalidRange = {
          startContainer: null,
          endContainer: null,
          startOffset: 0,
          endOffset: 0
        } as any;
        
        expect(isValidRange(invalidRange)).toBe(false);
      });

      it('should detect disconnected ranges', () => {
        const isValidRange = (service as any).isValidRange;
        
        const disconnectedRange = {
          startContainer: document.createElement('div'),
          endContainer: document.createElement('div'),
          startOffset: 0,
          endOffset: 0,
          cloneRange: jasmine.createSpy()
        } as any;
        
        spyOn(document, 'contains').and.returnValue(false);
        
        expect(isValidRange(disconnectedRange)).toBe(false);
      });

      it('should detect out-of-bounds offsets', () => {
        const isValidRange = (service as any).isValidRange;
        
        const textNode = document.createTextNode('test');
        const outOfBoundsRange = {
          startContainer: textNode,
          endContainer: textNode,
          startOffset: 10, // Beyond text length
          endOffset: 0,
          cloneRange: jasmine.createSpy()
        } as any;
        
        spyOn(document, 'contains').and.returnValue(true);
        
        expect(isValidRange(outOfBoundsRange)).toBe(false);
      });
    });

    describe('Safe Range Creation', () => {
      it('should create safe ranges with clamped offsets', () => {
        const createSafeRange = (service as any).createSafeRange;
        
        const textNode = document.createTextNode('test');
        const mockRange = {
          setStart: jasmine.createSpy(),
          setEnd: jasmine.createSpy(),
          collapse: jasmine.createSpy()
        } as any;
        
        spyOn(document, 'createRange').and.returnValue(mockRange);
        
        const range = createSafeRange(textNode, 10, textNode, 20); // Out of bounds offsets
        
        expect(range).toBeDefined();
        expect(mockRange.setStart).toHaveBeenCalledWith(textNode, 4); // Clamped to text length
        expect(mockRange.setEnd).toHaveBeenCalledWith(textNode, 4);
      });

      it('should handle range creation errors', () => {
        const createSafeRange = (service as any).createSafeRange;
        
        spyOn(document, 'createRange').and.throwError('Range creation failed');
        
        const range = createSafeRange(document.body, 0);
        
        expect(range).toBeNull();
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });
    });

    describe('Enhanced Selection Restoration', () => {
      it('should restore selection safely', () => {
        const state: SelectionState = {
          range: {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0,
            cloneRange: jasmine.createSpy().and.returnValue({})
          } as any,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left'
          }
        };
        
        const mockSelection = {
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy()
        } as any;
        
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'contains').and.returnValue(true);
        
        const result = service.restoreSelectionSafely(state);
        
        expect(result).toBe(true);
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
        expect(mockSelection.addRange).toHaveBeenCalled();
      });

      it('should handle restoration failures with fallback', () => {
        const state: SelectionState = {
          range: null,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left'
          }
        };
        
        const result = service.restoreSelectionSafely(state);
        
        expect(result).toBe(false);
      });

      it('should create fallback selection on restoration failure', () => {
        const state: SelectionState = {
          range: {
            startContainer: document.body,
            endContainer: document.body,
            startOffset: 0,
            endOffset: 0,
            cloneRange: jasmine.createSpy().and.throwError('Clone failed')
          } as any,
          collapsed: true,
          formats: {
            bold: false,
            italic: false,
            underline: false,
            fontSize: '14px',
          fontFamily: 'Arial',
            fontColor: '#000000',
            backgroundColor: 'transparent',
            alignment: 'left'
          }
        };
        
        const mockSelection = {
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy().and.throwError('Add range failed')
        } as any;
        
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue({
          setStart: jasmine.createSpy(),
          collapse: jasmine.createSpy()
        } as any);
        
        const result = service.restoreSelectionSafely(state);
        
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });
    });

    describe('Safe Text Selection', () => {
      it('should select text safely', () => {
        const element = document.createElement('div');
        element.textContent = 'test text';
        
        const mockRange = {
          setStart: jasmine.createSpy(),
          setEnd: jasmine.createSpy()
        } as any;
        
        const mockSelection = {
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy()
        } as any;
        
        spyOn(service, 'getSelection').and.returnValue(mockSelection);
        spyOn(document, 'createRange').and.returnValue(mockRange);
        
        const result = service.selectTextSafely(element, 0, 4);
        
        expect(result).toBe(true);
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
        expect(mockSelection.addRange).toHaveBeenCalled();
      });

      it('should handle text selection errors', () => {
        const element = document.createElement('div');
        
        spyOn(service, 'getSelection').and.returnValue(null);
        
        const result = service.selectTextSafely(element, 0, 4);
        
        expect(result).toBe(false);
      });
    });

    describe('Safe Cursor Positioning', () => {
      it('should set cursor position safely', () => {
        const element = document.createTextNode('test');
        
        const mockRange = {
          setStart: jasmine.createSpy(),
          collapse: jasmine.createSpy()
        } as any;
        
        const mockSelection = {
          removeAllRanges: jasmine.createSpy(),
          addRange: jasmine.createSpy()
        } as any;
        
        spyOn(document, 'createRange').and.returnValue(mockRange);
        
        // Mock validateAndRecoverSelection
        spyOn(service as any, 'validateAndRecoverSelection').and.returnValue({
          valid: true,
          selection: mockSelection,
          range: mockRange
        });
        
        const result = service.setCursorPositionSafely(element, 2);
        
        expect(result).toBe(true);
        expect(mockSelection.removeAllRanges).toHaveBeenCalled();
        expect(mockSelection.addRange).toHaveBeenCalled();
      });

      it('should handle cursor positioning errors', () => {
        const element = document.createTextNode('test');
        
        spyOn(service as any, 'validateAndRecoverSelection').and.returnValue({
          valid: false,
          selection: null,
          range: null
        });
        
        const result = service.setCursorPositionSafely(element, 2);
        
        expect(result).toBe(false);
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });
    });

    describe('Safe Selection Retrieval', () => {
      it('should get selection safely', () => {
        const mockSelection = { rangeCount: 1 } as any;
        const mockRange = {} as any;
        
        spyOn(service as any, 'validateAndRecoverSelection').and.returnValue({
          valid: true,
          selection: mockSelection,
          range: mockRange
        });
        
        const result = service.getSelectionSafely();
        
        expect(result.selection).toBe(mockSelection);
        expect(result.range).toBe(mockRange);
        expect(result.error).toBeUndefined();
      });

      it('should handle selection retrieval errors', () => {
        spyOn(service as any, 'validateAndRecoverSelection').and.throwError('Test error');
        
        const result = service.getSelectionSafely();
        
        expect(result.selection).toBeNull();
        expect(result.range).toBeNull();
        expect(result.error).toBeDefined();
        expect(errorHandlerService.handleSelectionError).toHaveBeenCalled();
      });
    });

    describe('Text Node Finding', () => {
      it('should find first text node', () => {
        const findFirstTextNode = (service as any).findFirstTextNode;
        
        const container = document.createElement('div');
        const textNode = document.createTextNode('test');
        container.appendChild(textNode);
        
        const result = findFirstTextNode(container);
        
        expect(result).toBe(textNode);
      });

      it('should return null when no text node found', () => {
        const findFirstTextNode = (service as any).findFirstTextNode;
        
        const container = document.createElement('div');
        const emptyDiv = document.createElement('div');
        container.appendChild(emptyDiv);
        
        const result = findFirstTextNode(container);
        
        expect(result).toBeNull();
      });

      it('should return text node itself if passed directly', () => {
        const findFirstTextNode = (service as any).findFirstTextNode;
        
        const textNode = document.createTextNode('test');
        
        const result = findFirstTextNode(textNode);
        
        expect(result).toBe(textNode);
      });
    });

    describe('Valid Parent Finding', () => {
      it('should find valid parent node', () => {
        const findValidParent = (service as any).findValidParent;
        
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);
        document.body.appendChild(parent);
        
        spyOn(document, 'contains').and.returnValue(true);
        
        const result = findValidParent(child);
        
        expect(result).toBe(child);
        
        document.body.removeChild(parent);
      });

      it('should return null when no valid parent found', () => {
        const findValidParent = (service as any).findValidParent;
        
        const orphanNode = document.createElement('div');
        
        spyOn(document, 'contains').and.returnValue(false);
        
        const result = findValidParent(orphanNode);
        
        expect(result).toBeNull();
      });
    });
  });
});