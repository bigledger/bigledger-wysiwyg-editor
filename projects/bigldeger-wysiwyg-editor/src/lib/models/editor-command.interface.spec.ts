import { 
  EditorCommand, 
  CommandOptions, 
  CommandResult, 
  EditorCommandName 
} from './editor-command.interface';

describe('Editor Command Interfaces', () => {
  describe('EditorCommand', () => {
    it('should create a valid EditorCommand with required properties', () => {
      const command: EditorCommand = {
        name: 'bold'
      };

      expect(command.name).toBe('bold');
    });

    it('should create a valid EditorCommand with all optional properties', () => {
      const command: EditorCommand = {
        name: 'fontSize',
        value: '14px',
        options: {
          showUI: false,
          preventDefault: true,
          params: { unit: 'px' }
        }
      };

      expect(command.value).toBe('14px');
      expect(command.options).toBeDefined();
      expect(command.options?.showUI).toBe(false);
      expect(command.options?.preventDefault).toBe(true);
      expect(command.options?.params?.['unit']).toBe('px');
    });

    it('should accept any value type', () => {
      const stringCommand: EditorCommand = { name: 'test', value: 'string' };
      const numberCommand: EditorCommand = { name: 'test', value: 42 };
      const booleanCommand: EditorCommand = { name: 'test', value: true };
      const objectCommand: EditorCommand = { name: 'test', value: { key: 'value' } };

      expect(stringCommand.value).toBe('string');
      expect(numberCommand.value).toBe(42);
      expect(booleanCommand.value).toBe(true);
      expect(objectCommand.value).toEqual({ key: 'value' });
    });
  });

  describe('CommandOptions', () => {
    it('should create valid CommandOptions with all properties', () => {
      const options: CommandOptions = {
        showUI: true,
        preventDefault: false,
        params: {
          customParam: 'value',
          numericParam: 123
        }
      };

      expect(options.showUI).toBe(true);
      expect(options.preventDefault).toBe(false);
      expect(options.params?.['customParam']).toBe('value');
      expect(options.params?.['numericParam']).toBe(123);
    });

    it('should create empty CommandOptions', () => {
      const options: CommandOptions = {};

      expect(options.showUI).toBeUndefined();
      expect(options.preventDefault).toBeUndefined();
      expect(options.params).toBeUndefined();
    });

    it('should handle params as Record<string, any>', () => {
      const options: CommandOptions = {
        params: {
          string: 'value',
          number: 42,
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' }
        }
      };

      expect(options.params?.['string']).toBe('value');
      expect(options.params?.['number']).toBe(42);
      expect(options.params?.['boolean']).toBe(true);
      expect(options.params?.['array']).toEqual([1, 2, 3]);
      expect(options.params?.['object']).toEqual({ nested: 'value' });
    });
  });

  describe('CommandResult', () => {
    it('should create a successful CommandResult', () => {
      const result: CommandResult = {
        success: true
      };

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it('should create a failed CommandResult with error', () => {
      const result: CommandResult = {
        success: false,
        error: 'Command execution failed'
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command execution failed');
    });

    it('should create a CommandResult with data', () => {
      const result: CommandResult = {
        success: true,
        data: {
          formattedText: 'Bold text',
          selectionRange: { start: 0, end: 9 }
        }
      };

      expect(result.success).toBe(true);
      expect(result.data?.formattedText).toBe('Bold text');
      expect(result.data?.selectionRange).toEqual({ start: 0, end: 9 });
    });
  });

  describe('EditorCommandName', () => {
    it('should accept all valid command names', () => {
      const validCommands: EditorCommandName[] = [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'subscript',
        'superscript',
        'paragraphFormat',
        'paragraphStyle',
        'inlineClass',
        'inlineStyle',
        'formatBlock',
        'quote',
        'lineHeight',
        'insertVideo',
        'fullscreen',
        'fontSize',
        'fontColor',
        'backgroundColor',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'formatOLSimple',
        'insertOrderedList',
        'insertUnorderedList',
        'indent',
        'outdent',
        'createLink',
        'unlink',
        'insertImage',
        'insertHTML',
        'insertText',
        'undo',
        'redo',
        'selectAll',
        'removeFormat'
      ];

      validCommands.forEach(commandName => {
        const command: EditorCommand = { name: commandName };
        expect(command.name).toBe(commandName);
      });

      expect(validCommands.length).toBe(36);
    });

    it('should validate formatting commands', () => {
      const formattingCommands: EditorCommandName[] = [
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'
      ];

      formattingCommands.forEach(cmd => {
        expect(typeof cmd).toBe('string');
        expect(cmd.length).toBeGreaterThan(0);
      });
    });

    it('should validate alignment commands', () => {
      const alignmentCommands: EditorCommandName[] = [
        'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'
      ];

      alignmentCommands.forEach(cmd => {
        expect(cmd.startsWith('justify')).toBe(true);
      });
    });

    it('should validate list commands', () => {
      const listCommands: EditorCommandName[] = [
        'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent'
      ];

      listCommands.forEach(cmd => {
        expect(typeof cmd).toBe('string');
        expect(cmd.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create complete command with all interfaces', () => {
      const command: EditorCommand = {
        name: 'fontSize',
        value: '16px',
        options: {
          showUI: false,
          preventDefault: true,
          params: {
            unit: 'px',
            fallback: '14px'
          }
        }
      };

      const result: CommandResult = {
        success: true,
        data: {
          appliedValue: command.value,
          affectedElements: 3
        }
      };

      expect(command.name).toBe('fontSize');
      expect(command.value).toBe('16px');
      expect(command.options?.params?.['unit']).toBe('px');
      expect(result.success).toBe(true);
      expect(result.data?.appliedValue).toBe('16px');
    });

    it('should handle command execution workflow', () => {
      const commands: EditorCommand[] = [
        { name: 'bold' },
        { name: 'italic', value: true },
        { name: 'fontSize', value: '18px', options: { showUI: false } }
      ];

      const results: CommandResult[] = commands.map(cmd => ({
        success: true,
        data: { command: cmd.name, executed: true }
      }));

      expect(commands.length).toBe(3);
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
