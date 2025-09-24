import { 
  EditorError,
  EditorErrorType,
  BrowserError,
  ValidationError,
  CommandError,
  UploadError,
  SanitizationError,
  SelectionError,
  ConfigurationError,
  NetworkError,
  PermissionError,
  BrowserInfo,
  ErrorSeverity,
  SeverityError,
  ErrorHandlerConfig
} from './error.interface';

describe('Error Interfaces', () => {
  describe('EditorError', () => {
    it('should create a valid EditorError with required properties', () => {
      const error: EditorError = {
        type: 'validation',
        message: 'Validation failed'
      };

      expect(error.type).toBe('validation');
      expect(error.message).toBe('Validation failed');
    });

    it('should create a valid EditorError with all optional properties', () => {
      const timestamp = new Date();
      const error: EditorError = {
        type: 'command',
        message: 'Command execution failed',
        details: { command: 'bold', value: true },
        code: 'CMD_001',
        timestamp: timestamp,
        stack: 'Error stack trace'
      };

      expect(error.details).toEqual({ command: 'bold', value: true });
      expect(error.code).toBe('CMD_001');
      expect(error.timestamp).toBe(timestamp);
      expect(error.stack).toBe('Error stack trace');
    });
  });

  describe('EditorErrorType', () => {
    it('should accept all valid error types', () => {
      const errorTypes: EditorErrorType[] = [
        'browser',
        'validation',
        'command',
        'upload',
        'sanitization',
        'selection',
        'configuration',
        'network',
        'permission'
      ];

      errorTypes.forEach(type => {
        const error: EditorError = {
          type: type,
          message: `${type} error`
        };
        expect(error.type).toBe(type);
      });

      expect(errorTypes.length).toBe(9);
    });
  });

  describe('BrowserError', () => {
    it('should create a valid BrowserError', () => {
      const browserInfo: BrowserInfo = {
        name: 'Chrome',
        version: '91.0.4472.124',
        os: 'Windows',
        mobile: false
      };

      const error: BrowserError = {
        type: 'browser',
        message: 'Browser not supported',
        browserInfo: browserInfo,
        missingFeature: 'execCommand',
        fallback: 'Use alternative implementation'
      };

      expect(error.type).toBe('browser');
      expect(error.browserInfo).toBe(browserInfo);
      expect(error.missingFeature).toBe('execCommand');
      expect(error.fallback).toBe('Use alternative implementation');
    });
  });

  describe('ValidationError', () => {
    it('should create a valid ValidationError', () => {
      const error: ValidationError = {
        type: 'validation',
        message: 'Invalid email format',
        field: 'email',
        rule: 'email',
        expected: 'valid email address',
        actual: 'invalid-email'
      };

      expect(error.type).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.rule).toBe('email');
      expect(error.expected).toBe('valid email address');
      expect(error.actual).toBe('invalid-email');
    });
  });

  describe('CommandError', () => {
    it('should create a valid CommandError', () => {
      const error: CommandError = {
        type: 'command',
        message: 'Bold command failed',
        command: 'bold',
        parameters: { value: true },
        execCommandResult: false
      };

      expect(error.type).toBe('command');
      expect(error.command).toBe('bold');
      expect(error.parameters).toEqual({ value: true });
      expect(error.execCommandResult).toBe(false);
    });
  });

  describe('UploadError', () => {
    it('should create a valid UploadError', () => {
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const error: UploadError = {
        type: 'upload',
        message: 'File upload failed',
        file: mockFile,
        statusCode: 413,
        response: { error: 'File too large' }
      };

      expect(error.type).toBe('upload');
      expect(error.file).toBe(mockFile);
      expect(error.statusCode).toBe(413);
      expect(error.response).toEqual({ error: 'File too large' });
    });
  });

  describe('SanitizationError', () => {
    it('should create a valid SanitizationError', () => {
      const error: SanitizationError = {
        type: 'sanitization',
        message: 'Content sanitization failed',
        originalContent: '<script>alert("xss")</script><p>Safe content</p>',
        sanitizedContent: '<p>Safe content</p>',
        removedElements: ['script'],
        removedAttributes: ['onclick', 'onload']
      };

      expect(error.type).toBe('sanitization');
      expect(error.originalContent).toContain('<script>');
      expect(error.sanitizedContent).toBe('<p>Safe content</p>');
      expect(error.removedElements).toEqual(['script']);
      expect(error.removedAttributes).toEqual(['onclick', 'onload']);
    });
  });

  describe('SelectionError', () => {
    it('should create a valid SelectionError', () => {
      const selectionState = { range: null, collapsed: true };
      const error: SelectionError = {
        type: 'selection',
        message: 'Selection operation failed',
        selectionState: selectionState,
        operation: 'getSelection'
      };

      expect(error.type).toBe('selection');
      expect(error.selectionState).toBe(selectionState);
      expect(error.operation).toBe('getSelection');
    });
  });

  describe('ConfigurationError', () => {
    it('should create a valid ConfigurationError', () => {
      const error: ConfigurationError = {
        type: 'configuration',
        message: 'Invalid toolbar configuration',
        property: 'toolbar.theme',
        value: 'invalid-theme',
        validOptions: ['light', 'dark']
      };

      expect(error.type).toBe('configuration');
      expect(error.property).toBe('toolbar.theme');
      expect(error.value).toBe('invalid-theme');
      expect(error.validOptions).toEqual(['light', 'dark']);
    });
  });

  describe('NetworkError', () => {
    it('should create a valid NetworkError', () => {
      const error: NetworkError = {
        type: 'network',
        message: 'Network request failed',
        url: 'https://api.example.com/upload',
        method: 'POST',
        statusCode: 500,
        timeout: false
      };

      expect(error.type).toBe('network');
      expect(error.url).toBe('https://api.example.com/upload');
      expect(error.method).toBe('POST');
      expect(error.statusCode).toBe(500);
      expect(error.timeout).toBe(false);
    });

    it('should handle timeout errors', () => {
      const error: NetworkError = {
        type: 'network',
        message: 'Request timeout',
        url: 'https://slow-api.example.com',
        timeout: true
      };

      expect(error.timeout).toBe(true);
    });
  });

  describe('PermissionError', () => {
    it('should create a valid PermissionError', () => {
      const error: PermissionError = {
        type: 'permission',
        message: 'Permission denied',
        permission: 'clipboard-write',
        action: 'paste'
      };

      expect(error.type).toBe('permission');
      expect(error.permission).toBe('clipboard-write');
      expect(error.action).toBe('paste');
    });
  });

  describe('BrowserInfo', () => {
    it('should create a valid BrowserInfo', () => {
      const info: BrowserInfo = {
        name: 'Firefox',
        version: '89.0',
        os: 'macOS',
        mobile: false
      };

      expect(info.name).toBe('Firefox');
      expect(info.version).toBe('89.0');
      expect(info.os).toBe('macOS');
      expect(info.mobile).toBe(false);
    });

    it('should handle mobile browser info', () => {
      const info: BrowserInfo = {
        name: 'Safari',
        version: '14.1',
        mobile: true
      };

      expect(info.mobile).toBe(true);
      expect(info.os).toBeUndefined();
    });
  });

  describe('ErrorSeverity', () => {
    it('should accept all valid severity levels', () => {
      const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];
      
      severities.forEach(severity => {
        expect(['low', 'medium', 'high', 'critical']).toContain(severity);
      });
    });
  });

  describe('SeverityError', () => {
    it('should create a valid SeverityError', () => {
      const error: SeverityError = {
        type: 'command',
        message: 'Critical command failure',
        severity: 'critical',
        recoverable: false,
        recoveryAction: 'Refresh the page'
      };

      expect(error.severity).toBe('critical');
      expect(error.recoverable).toBe(false);
      expect(error.recoveryAction).toBe('Refresh the page');
    });

    it('should handle recoverable errors', () => {
      const error: SeverityError = {
        type: 'network',
        message: 'Temporary network issue',
        severity: 'medium',
        recoverable: true,
        recoveryAction: 'Retry the operation'
      };

      expect(error.recoverable).toBe(true);
      expect(error.recoveryAction).toBe('Retry the operation');
    });
  });

  describe('ErrorHandlerConfig', () => {
    it('should create a valid ErrorHandlerConfig with required properties', () => {
      const config: ErrorHandlerConfig = {
        logToConsole: true,
        showUserMessages: true
      };

      expect(config.logToConsole).toBe(true);
      expect(config.showUserMessages).toBe(true);
    });

    it('should create a valid ErrorHandlerConfig with all optional properties', () => {
      const customHandler = (error: EditorError) => console.error(error);
      const config: ErrorHandlerConfig = {
        logToConsole: true,
        showUserMessages: false,
        customHandler: customHandler,
        reportErrors: true,
        reportingEndpoint: 'https://api.example.com/errors'
      };

      expect(config.customHandler).toBe(customHandler);
      expect(config.reportErrors).toBe(true);
      expect(config.reportingEndpoint).toBe('https://api.example.com/errors');
    });
  });

  describe('Integration Tests', () => {
    it('should handle error inheritance correctly', () => {
      const browserError: BrowserError = {
        type: 'browser',
        message: 'Unsupported browser',
        code: 'BROWSER_001',
        browserInfo: {
          name: 'IE',
          version: '11.0'
        },
        missingFeature: 'Range API'
      };

      // Should have all EditorError properties
      expect(browserError.type).toBe('browser');
      expect(browserError.message).toBe('Unsupported browser');
      expect(browserError.code).toBe('BROWSER_001');
      
      // Should have BrowserError specific properties
      expect(browserError.browserInfo?.name).toBe('IE');
      expect(browserError.missingFeature).toBe('Range API');
    });

    it('should create error with severity and handler config', () => {
      const error: SeverityError = {
        type: 'upload',
        message: 'File upload failed',
        severity: 'high',
        recoverable: true,
        recoveryAction: 'Try uploading a smaller file'
      };

      const handlerConfig: ErrorHandlerConfig = {
        logToConsole: true,
        showUserMessages: true,
        customHandler: (err: EditorError) => {
          if (err.type === 'upload') {
            console.warn('Upload error handled:', err.message);
          }
        }
      };

      expect(error.severity).toBe('high');
      expect(handlerConfig.customHandler).toBeDefined();
      
      // Test custom handler
      handlerConfig.customHandler?.(error);
    });
  });
});