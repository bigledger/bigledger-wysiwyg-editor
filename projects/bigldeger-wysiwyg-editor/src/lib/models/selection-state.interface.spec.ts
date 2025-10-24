import { 
  SelectionState, 
  ActiveFormats, 
  TextAlignment, 
  SelectionDirection,
  ExtendedSelectionState 
} from './selection-state.interface';

describe('Selection State Interfaces', () => {
  describe('SelectionState', () => {
    it('should create a valid SelectionState with required properties', () => {
      const mockRange = document.createRange();
      const formats: ActiveFormats = {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '14px',
          fontFamily: 'Arial',

        fontColor: '#000000',
        backgroundColor: 'transparent',
        alignment: 'left'
      };

      const selectionState: SelectionState = {
        range: mockRange,
        collapsed: false,
        formats: formats
      };

      expect(selectionState.range).toBe(mockRange);
      expect(selectionState.collapsed).toBe(false);
      expect(selectionState.formats).toBe(formats);
    });

    it('should create a valid SelectionState with optional properties', () => {
      const formats: ActiveFormats = {
        bold: true,
        italic: true,
        underline: false,
        fontSize: '16px',
          fontFamily: 'Arial',

        fontColor: '#ff0000',
        backgroundColor: '#ffff00',
        alignment: 'center'
      };

      const selectionState: SelectionState = {
        range: null,
        collapsed: true,
        formats: formats,
        startOffset: 10,
        endOffset: 20,
        selectedText: 'test text',
        isMultiElement: true
      };

      expect(selectionState.range).toBeNull();
      expect(selectionState.collapsed).toBe(true);
      expect(selectionState.startOffset).toBe(10);
      expect(selectionState.endOffset).toBe(20);
      expect(selectionState.selectedText).toBe('test text');
      expect(selectionState.isMultiElement).toBe(true);
    });
  });

  describe('ActiveFormats', () => {
    it('should create a valid ActiveFormats with required properties', () => {
      const formats: ActiveFormats = {
        bold: true,
        italic: false,
        underline: true,
        fontSize: '12px',
          fontFamily: 'Arial',

        fontColor: '#333333',
        backgroundColor: 'white',
        alignment: 'justify'
      };

      expect(formats.bold).toBe(true);
      expect(formats.italic).toBe(false);
      expect(formats.underline).toBe(true);
      expect(formats.fontSize).toBe('12px');
      expect(formats.fontColor).toBe('#333333');
      expect(formats.backgroundColor).toBe('white');
      expect(formats.alignment).toBe('justify');
    });

    it('should create a valid ActiveFormats with optional properties', () => {
      const formats: ActiveFormats = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: true,
        fontSize: '18px',
          fontFamily: 'Arial',

        fontColor: 'blue',
        backgroundColor: 'yellow',
        alignment: 'right',
        inList: true,
        listType: 'ordered',
        listLevel: 2,
        inLink: true,
        linkUrl: 'https://example.com'
      };

      expect(formats.strikethrough).toBe(true);
      expect(formats.inList).toBe(true);
      expect(formats.listType).toBe('ordered');
      expect(formats.listLevel).toBe(2);
      expect(formats.inLink).toBe(true);
      expect(formats.linkUrl).toBe('https://example.com');
    });
  });

  describe('TextAlignment', () => {
    it('should accept valid alignment values', () => {
      const alignments: TextAlignment[] = ['left', 'center', 'right', 'justify'];
      
      alignments.forEach(alignment => {
        const formats: ActiveFormats = {
          bold: false,
          italic: false,
          underline: false,
          fontSize: '14px',
          fontFamily: 'Arial',

          fontColor: 'black',
          backgroundColor: 'white',
          alignment: alignment
        };
        
        expect(formats.alignment).toBe(alignment);
      });
    });
  });

  describe('SelectionDirection', () => {
    it('should accept valid direction values', () => {
      const directions: SelectionDirection[] = ['forward', 'backward', 'none'];
      
      directions.forEach(direction => {
        expect(['forward', 'backward', 'none']).toContain(direction);
      });
    });
  });

  describe('ExtendedSelectionState', () => {
    it('should create a valid ExtendedSelectionState', () => {
      const mockRange = document.createRange();
      const mockElement = document.createElement('div');
      const formats: ActiveFormats = {
        bold: false,
        italic: false,
        underline: false,
        fontSize: '14px',
          fontFamily: 'Arial',

        fontColor: 'black',
        backgroundColor: 'white',
        alignment: 'left'
      };

      const extendedState: ExtendedSelectionState = {
        range: mockRange,
        collapsed: false,
        formats: formats,
        direction: 'forward',
        atStart: false,
        atEnd: false,
        parentElement: mockElement
      };

      expect(extendedState.range).toBe(mockRange);
      expect(extendedState.collapsed).toBe(false);
      expect(extendedState.formats).toBe(formats);
      expect(extendedState.direction).toBe('forward');
      expect(extendedState.atStart).toBe(false);
      expect(extendedState.atEnd).toBe(false);
      expect(extendedState.parentElement).toBe(mockElement);
    });

    it('should inherit all SelectionState properties', () => {
      const formats: ActiveFormats = {
        bold: true,
        italic: false,
        underline: false,
        fontSize: '16px',
          fontFamily: 'Arial',

        fontColor: 'red',
        backgroundColor: 'transparent',
        alignment: 'center'
      };

      const extendedState: ExtendedSelectionState = {
        range: null,
        collapsed: true,
        formats: formats,
        startOffset: 5,
        endOffset: 15,
        selectedText: 'selected',
        isMultiElement: false,
        direction: 'backward',
        atStart: true,
        atEnd: false
      };

      // Test inherited properties
      expect(extendedState.startOffset).toBe(5);
      expect(extendedState.endOffset).toBe(15);
      expect(extendedState.selectedText).toBe('selected');
      expect(extendedState.isMultiElement).toBe(false);
      
      // Test extended properties
      expect(extendedState.direction).toBe('backward');
      expect(extendedState.atStart).toBe(true);
      expect(extendedState.atEnd).toBe(false);
    });
  });
});