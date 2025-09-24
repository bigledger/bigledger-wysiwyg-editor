import { ToolbarConfig, ToolbarTool, ToolOption } from './toolbar.interface';

describe('Toolbar Interfaces', () => {
  describe('ToolbarConfig', () => {
    it('should create a valid ToolbarConfig with required properties', () => {
      const config: ToolbarConfig = {
        tools: []
      };

      expect(config).toBeDefined();
      expect(config.tools).toEqual([]);
    });

    it('should create a valid ToolbarConfig with all optional properties', () => {
      const config: ToolbarConfig = {
        tools: [],
        sticky: true,
        theme: 'dark'
      };

      expect(config.sticky).toBe(true);
      expect(config.theme).toBe('dark');
    });

    it('should accept valid theme values', () => {
      const lightConfig: ToolbarConfig = {
        tools: [],
        theme: 'light'
      };

      const darkConfig: ToolbarConfig = {
        tools: [],
        theme: 'dark'
      };

      expect(lightConfig.theme).toBe('light');
      expect(darkConfig.theme).toBe('dark');
    });
  });

  describe('ToolbarTool', () => {
    it('should create a valid button tool with required properties', () => {
      const tool: ToolbarTool = {
        type: 'button',
        command: 'bold'
      };

      expect(tool.type).toBe('button');
      expect(tool.command).toBe('bold');
    });

    it('should create a valid dropdown tool with options', () => {
      const tool: ToolbarTool = {
        type: 'dropdown',
        command: 'fontSize',
        options: [
          { value: '12px', label: '12px' },
          { value: '14px', label: '14px' }
        ]
      };

      expect(tool.type).toBe('dropdown');
      expect(tool.options?.length).toBe(2);
    });

    it('should create a valid dialog tool', () => {
      const tool: ToolbarTool = {
        type: 'dialog',
        command: 'insertLink',
        icon: 'link',
        label: 'Insert Link'
      };

      expect(tool.type).toBe('dialog');
      expect(tool.icon).toBe('link');
      expect(tool.label).toBe('Insert Link');
    });

    it('should accept all optional properties', () => {
      const tool: ToolbarTool = {
        type: 'button',
        command: 'bold',
        icon: 'bold-icon',
        label: 'Bold',
        disabled: true,
        cssClass: 'custom-tool'
      };

      expect(tool.icon).toBe('bold-icon');
      expect(tool.label).toBe('Bold');
      expect(tool.disabled).toBe(true);
      expect(tool.cssClass).toBe('custom-tool');
    });

    it('should accept valid tool types', () => {
      const buttonTool: ToolbarTool = { type: 'button', command: 'test' };
      const dropdownTool: ToolbarTool = { type: 'dropdown', command: 'test' };
      const dialogTool: ToolbarTool = { type: 'dialog', command: 'test' };

      expect(buttonTool.type).toBe('button');
      expect(dropdownTool.type).toBe('dropdown');
      expect(dialogTool.type).toBe('dialog');
    });
  });

  describe('ToolOption', () => {
    it('should create a valid ToolOption with required properties', () => {
      const option: ToolOption = {
        value: '14px',
        label: '14 pixels'
      };

      expect(option.value).toBe('14px');
      expect(option.label).toBe('14 pixels');
    });

    it('should create a valid ToolOption with all optional properties', () => {
      const option: ToolOption = {
        value: 'red',
        label: 'Red Color',
        icon: 'color-red',
        disabled: false
      };

      expect(option.icon).toBe('color-red');
      expect(option.disabled).toBe(false);
    });

    it('should handle disabled state', () => {
      const enabledOption: ToolOption = {
        value: 'enabled',
        label: 'Enabled Option',
        disabled: false
      };

      const disabledOption: ToolOption = {
        value: 'disabled',
        label: 'Disabled Option',
        disabled: true
      };

      expect(enabledOption.disabled).toBe(false);
      expect(disabledOption.disabled).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should create a complete toolbar configuration', () => {
      const config: ToolbarConfig = {
        tools: [
          {
            type: 'button',
            command: 'bold',
            icon: 'bold',
            label: 'Bold'
          },
          {
            type: 'dropdown',
            command: 'fontSize',
            label: 'Font Size',
            options: [
              { value: '12px', label: '12px' },
              { value: '14px', label: '14px' },
              { value: '16px', label: '16px', disabled: true }
            ]
          },
          {
            type: 'dialog',
            command: 'insertLink',
            icon: 'link',
            label: 'Insert Link'
          }
        ],
        sticky: true,
        theme: 'light'
      };

      expect(config.tools.length).toBe(3);
      expect(config.tools[0].type).toBe('button');
      expect(config.tools[1].type).toBe('dropdown');
      expect(config.tools[1].options?.length).toBe(3);
      expect(config.tools[2].type).toBe('dialog');
      expect(config.sticky).toBe(true);
      expect(config.theme).toBe('light');
    });

    it('should validate toolbar tool commands are strings', () => {
      const tools: ToolbarTool[] = [
        { type: 'button', command: 'bold' },
        { type: 'button', command: 'italic' },
        { type: 'dropdown', command: 'fontSize' }
      ];

      tools.forEach(tool => {
        expect(typeof tool.command).toBe('string');
        expect(tool.command.length).toBeGreaterThan(0);
      });
    });
  });
});