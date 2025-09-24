import { 
  EditorConfig, 
  SanitizerConfig, 
  SanitizationRule,
  AutoSaveConfig,
  ImageUploadConfig,
  LinkConfig,
  ShortcutConfig,
  AccessibilityConfig
} from './editor-config.interface';
import { ToolbarConfig } from './toolbar.interface';

describe('Editor Config Interfaces', () => {
  describe('EditorConfig', () => {
    it('should create a valid EditorConfig with required properties', () => {
      const toolbarConfig: ToolbarConfig = {
        tools: []
      };

      const config: EditorConfig = {
        toolbar: toolbarConfig
      };

      expect(config.toolbar).toBe(toolbarConfig);
    });

    it('should create a valid EditorConfig with all optional properties', () => {
      const toolbarConfig: ToolbarConfig = {
        tools: [],
        sticky: true,
        theme: 'light'
      };

      const config: EditorConfig = {
        toolbar: toolbarConfig,
        height: '400px',
        minHeight: '200px',
        maxHeight: '600px',
        placeholder: 'Start typing...',
        readonly: false,
        spellCheck: true,
        cssClass: 'custom-editor',
        dragDrop: true
      };

      expect(config.height).toBe('400px');
      expect(config.minHeight).toBe('200px');
      expect(config.maxHeight).toBe('600px');
      expect(config.placeholder).toBe('Start typing...');
      expect(config.readonly).toBe(false);
      expect(config.spellCheck).toBe(true);
      expect(config.cssClass).toBe('custom-editor');
      expect(config.dragDrop).toBe(true);
    });
  });

  describe('SanitizerConfig', () => {
    it('should create a valid SanitizerConfig with required properties', () => {
      const config: SanitizerConfig = {
        enabled: true
      };

      expect(config.enabled).toBe(true);
    });

    it('should create a valid SanitizerConfig with all optional properties', () => {
      const config: SanitizerConfig = {
        enabled: true,
        allowedTags: ['p', 'div', 'span', 'strong', 'em'],
        allowedAttributes: {
          'a': ['href', 'title'],
          'img': ['src', 'alt', 'width', 'height']
        },
        stripUnknownTags: true,
        stripUnknownAttributes: true,
        customRules: []
      };

      expect(config.allowedTags).toEqual(['p', 'div', 'span', 'strong', 'em']);
      expect(config.allowedAttributes?.['a']).toEqual(['href', 'title']);
      expect(config.stripUnknownTags).toBe(true);
      expect(config.stripUnknownAttributes).toBe(true);
      expect(config.customRules).toEqual([]);
    });
  });

  describe('SanitizationRule', () => {
    it('should create a valid SanitizationRule with allow action', () => {
      const rule: SanitizationRule = {
        tag: 'img',
        attributes: ['src', 'alt'],
        action: 'allow'
      };

      expect(rule.tag).toBe('img');
      expect(rule.attributes).toEqual(['src', 'alt']);
      expect(rule.action).toBe('allow');
    });

    it('should create a valid SanitizationRule with transform action', () => {
      const transformFn = (element: Element) => element;
      const rule: SanitizationRule = {
        tag: 'script',
        action: 'transform',
        transform: transformFn
      };

      expect(rule.tag).toBe('script');
      expect(rule.action).toBe('transform');
      expect(rule.transform).toBe(transformFn);
    });

    it('should accept valid action types', () => {
      const allowRule: SanitizationRule = { tag: 'p', action: 'allow' };
      const denyRule: SanitizationRule = { tag: 'script', action: 'deny' };
      const transformRule: SanitizationRule = { tag: 'div', action: 'transform' };

      expect(allowRule.action).toBe('allow');
      expect(denyRule.action).toBe('deny');
      expect(transformRule.action).toBe('transform');
    });
  });

  describe('AutoSaveConfig', () => {
    it('should create a valid AutoSaveConfig with required properties', () => {
      const config: AutoSaveConfig = {
        enabled: true,
        interval: 30000
      };

      expect(config.enabled).toBe(true);
      expect(config.interval).toBe(30000);
    });

    it('should create a valid AutoSaveConfig with optional properties', () => {
      const saveFn = (content: string) => console.log(content);
      const config: AutoSaveConfig = {
        enabled: true,
        interval: 60000,
        storageKey: 'editor-autosave',
        saveFunction: saveFn
      };

      expect(config.storageKey).toBe('editor-autosave');
      expect(config.saveFunction).toBe(saveFn);
    });
  });

  describe('ImageUploadConfig', () => {
    it('should create a valid ImageUploadConfig with required properties', () => {
      const config: ImageUploadConfig = {
        enabled: true
      };

      expect(config.enabled).toBe(true);
    });

    it('should create a valid ImageUploadConfig with all optional properties', () => {
      const uploadFn = async (file: File) => 'uploaded-url';
      const config: ImageUploadConfig = {
        enabled: true,
        maxFileSize: 5242880, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
        uploadUrl: '/api/upload',
        uploadFunction: uploadFn,
        resize: true,
        maxWidth: 1920,
        maxHeight: 1080
      };

      expect(config.maxFileSize).toBe(5242880);
      expect(config.allowedFormats).toEqual(['jpg', 'jpeg', 'png', 'gif']);
      expect(config.uploadUrl).toBe('/api/upload');
      expect(config.uploadFunction).toBe(uploadFn);
      expect(config.resize).toBe(true);
      expect(config.maxWidth).toBe(1920);
      expect(config.maxHeight).toBe(1080);
    });
  });

  describe('LinkConfig', () => {
    it('should create a valid LinkConfig with default values', () => {
      const config: LinkConfig = {};

      expect(config.validateUrls).toBeUndefined();
      expect(config.defaultTarget).toBeUndefined();
    });

    it('should create a valid LinkConfig with all properties', () => {
      const config: LinkConfig = {
        validateUrls: true,
        defaultTarget: '_blank',
        allowedProtocols: ['http', 'https', 'mailto'],
        showPreview: true
      };

      expect(config.validateUrls).toBe(true);
      expect(config.defaultTarget).toBe('_blank');
      expect(config.allowedProtocols).toEqual(['http', 'https', 'mailto']);
      expect(config.showPreview).toBe(true);
    });

    it('should accept valid target values', () => {
      const targets = ['_blank', '_self', '_parent', '_top'];
      
      targets.forEach(target => {
        const config: LinkConfig = {
          defaultTarget: target as '_blank' | '_self' | '_parent' | '_top'
        };
        expect(config.defaultTarget).toBe(target as '_blank' | '_self' | '_parent' | '_top');
      });
    });
  });

  describe('ShortcutConfig', () => {
    it('should create a valid ShortcutConfig with required properties', () => {
      const config: ShortcutConfig = {
        enabled: true
      };

      expect(config.enabled).toBe(true);
    });

    it('should create a valid ShortcutConfig with optional properties', () => {
      const config: ShortcutConfig = {
        enabled: true,
        customShortcuts: {
          'Ctrl+B': 'bold',
          'Ctrl+I': 'italic'
        },
        showHints: true
      };

      expect(config.customShortcuts?.['Ctrl+B']).toBe('bold');
      expect(config.customShortcuts?.['Ctrl+I']).toBe('italic');
      expect(config.showHints).toBe(true);
    });
  });

  describe('AccessibilityConfig', () => {
    it('should create a valid AccessibilityConfig with required properties', () => {
      const config: AccessibilityConfig = {
        enabled: true
      };

      expect(config.enabled).toBe(true);
    });

    it('should create a valid AccessibilityConfig with all optional properties', () => {
      const config: AccessibilityConfig = {
        enabled: true,
        ariaLabel: 'Rich text editor',
        announceFormatting: true,
        highContrast: false,
        customDescriptions: {
          'bold': 'Bold formatting applied',
          'italic': 'Italic formatting applied'
        }
      };

      expect(config.ariaLabel).toBe('Rich text editor');
      expect(config.announceFormatting).toBe(true);
      expect(config.highContrast).toBe(false);
      expect(config.customDescriptions?.['bold']).toBe('Bold formatting applied');
    });
  });

  describe('Integration Tests', () => {
    it('should create a complete EditorConfig with all sub-configurations', () => {
      const config: EditorConfig = {
        toolbar: {
          tools: [
            { type: 'button', command: 'bold' },
            { type: 'button', command: 'italic' }
          ],
          sticky: true,
          theme: 'light'
        },
        height: '500px',
        placeholder: 'Enter your content...',
        sanitizer: {
          enabled: true,
          allowedTags: ['p', 'strong', 'em'],
          stripUnknownTags: true
        },
        autoSave: {
          enabled: true,
          interval: 30000,
          storageKey: 'editor-content'
        },
        imageUpload: {
          enabled: true,
          maxFileSize: 2097152,
          allowedFormats: ['jpg', 'png']
        },
        linkConfig: {
          validateUrls: true,
          defaultTarget: '_blank'
        },
        shortcuts: {
          enabled: true,
          showHints: true
        },
        accessibility: {
          enabled: true,
          ariaLabel: 'WYSIWYG Editor'
        }
      };

      expect(config.toolbar.tools.length).toBe(2);
      expect(config.sanitizer?.enabled).toBe(true);
      expect(config.autoSave?.interval).toBe(30000);
      expect(config.imageUpload?.maxFileSize).toBe(2097152);
      expect(config.linkConfig?.defaultTarget).toBe('_blank');
      expect(config.shortcuts?.enabled).toBe(true);
      expect(config.accessibility?.enabled).toBe(true);
    });
  });
});