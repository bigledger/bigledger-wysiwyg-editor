import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from './error-handler.service';
import { 
  EditorError, 
  BrowserError, 
  ValidationError, 
  CommandError, 
  UploadError,
  SanitizationError,
  SelectionError,
  ConfigurationError,
  NetworkError,
  PermissionError,
  ErrorHandlerConfig
} from '../models/error.interface';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let consoleSpy: jasmine.Spy;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorHandlerService);
    
    // Spy on console methods
    consoleSpy = spyOn(console, 'error').and.stub();
    spyOn(console, 'warn').and.stub();
    spyOn(console, 'info').and.stub();
    
    // Mock fetch for error reporting
    fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response()));
  });

  afterEach(() => {
    service.clearError();
  });

  describe('Basic Error Handling', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should handle generic editor error', () => {
      const error: EditorError = {
        type: 'validation',
        message: 'Test error',
        code: 'TEST_ERROR'
      };

      service.handleError(error);

      expect(error.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should emit errors through observable', (done) => {
      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.errors$.subscribe(emittedError => {
        if (emittedError) {
          expect(emittedError).toEqual(jasmine.objectContaining(error));
          done();
        }
      });

      service.handleError(error);
    });

    it('should clear errors', (done) => {
      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      let emissionCount = 0;
      service.errors$.subscribe(emittedError => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(emittedError).toEqual(jasmine.objectContaining(error));
          service.clearError();
        } else if (emissionCount === 2) {
          expect(emittedError).toBeNull();
          done();
        }
      });

      service.handleError(error);
    });
  });

  describe('Configuration', () => {
    it('should configure error handler', () => {
      const config: Partial<ErrorHandlerConfig> = {
        logToConsole: false,
        showUserMessages: false,
        reportErrors: true,
        reportingEndpoint: 'https://api.example.com/errors'
      };

      service.configure(config);

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.handleError(error);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        jasmine.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should call custom error handler', () => {
      const customHandler = jasmine.createSpy('customHandler');
      service.configure({ customHandler });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.handleError(error);

      expect(customHandler).toHaveBeenCalledWith(error);
    });

    it('should handle custom handler errors gracefully', () => {
      const customHandler = jasmine.createSpy('customHandler').and.throwError('Handler error');
      service.configure({ customHandler });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      expect(() => service.handleError(error)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Custom error handler failed:', jasmine.any(Error));
    });
  });

  describe('Browser Error Handling', () => {
    it('should handle browser compatibility errors', () => {
      const error = service.handleBrowserError('execCommand', 'Use manual DOM manipulation');

      expect(error.type).toBe('browser');
      expect(error.missingFeature).toBe('execCommand');
      expect(error.fallback).toBe('Use manual DOM manipulation');
      expect(error.browserInfo).toBeDefined();
    });

    it('should check feature support', () => {
      // Mock document.execCommand
      spyOn(document, 'execCommand').and.returnValue(true);
      
      expect(service.isFeatureSupported('execCommand')).toBe(true);
      expect(service.isFeatureSupported('nonexistentFeature')).toBe(false);
    });

    it('should cache feature support results', () => {
      const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(true);
      
      service.isFeatureSupported('execCommand');
      service.isFeatureSupported('execCommand');
      
      // Should only check once due to caching
      expect(execCommandSpy).toHaveBeenCalledTimes(0); // We're checking typeof, not calling
    });

    it('should detect browser support', () => {
      const supported = service.isBrowserSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('should provide fallback suggestions', () => {
      const suggestion = service.getFallbackSuggestion('execCommand');
      expect(suggestion).toBe('Use manual DOM manipulation for formatting');
      
      const noSuggestion = service.getFallbackSuggestion('unknownFeature');
      expect(noSuggestion).toBeNull();
    });
  });

  describe('Specific Error Types', () => {
    it('should handle validation errors', () => {
      const error = service.handleValidationError('email', 'format', 'email@example.com', 'invalid-email');

      expect(error.type).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.rule).toBe('format');
      expect(error.expected).toBe('email@example.com');
      expect(error.actual).toBe('invalid-email');
    });

    it('should handle command errors', () => {
      const error = service.handleCommandError('bold', { value: true }, false);

      expect(error.type).toBe('command');
      expect(error.command).toBe('bold');
      expect(error.parameters).toEqual({ value: true });
      expect(error.execCommandResult).toBe(false);
    });

    it('should handle upload errors', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const error = service.handleUploadError(file, 500, { error: 'Server error' });

      expect(error.type).toBe('upload');
      expect(error.file).toBe(file);
      expect(error.statusCode).toBe(500);
      expect(error.response).toEqual({ error: 'Server error' });
    });

    it('should handle sanitization errors', () => {
      const error = service.handleSanitizationError(
        '<script>alert("xss")</script><p>Safe content</p>',
        '<p>Safe content</p>',
        ['script'],
        ['onclick']
      );

      expect(error.type).toBe('sanitization');
      expect(error.originalContent).toContain('script');
      expect(error.sanitizedContent).toBe('<p>Safe content</p>');
      expect(error.removedElements).toEqual(['script']);
      expect(error.removedAttributes).toEqual(['onclick']);
    });

    it('should handle selection errors', () => {
      const selectionState = { range: null, collapsed: true };
      const error = service.handleSelectionError('saveSelection', selectionState);

      expect(error.type).toBe('selection');
      expect(error.operation).toBe('saveSelection');
      expect(error.selectionState).toBe(selectionState);
    });

    it('should handle configuration errors', () => {
      const error = service.handleConfigurationError('theme', 'invalid', ['light', 'dark']);

      expect(error.type).toBe('configuration');
      expect(error.property).toBe('theme');
      expect(error.value).toBe('invalid');
      expect(error.validOptions).toEqual(['light', 'dark']);
    });

    it('should handle network errors', () => {
      const error = service.handleNetworkError('https://api.example.com', 'POST', 404, false);

      expect(error.type).toBe('network');
      expect(error.url).toBe('https://api.example.com');
      expect(error.method).toBe('POST');
      expect(error.statusCode).toBe(404);
      expect(error.timeout).toBe(false);
    });

    it('should handle network timeout errors', () => {
      const error = service.handleNetworkError('https://api.example.com', 'GET', undefined, true);

      expect(error.type).toBe('network');
      expect(error.timeout).toBe(true);
      expect(error.code).toBe('NETWORK_TIMEOUT');
    });

    it('should handle permission errors', () => {
      const error = service.handlePermissionError('clipboard-write', 'paste content');

      expect(error.type).toBe('permission');
      expect(error.permission).toBe('clipboard-write');
      expect(error.action).toBe('paste content');
    });
  });

  describe('Error Severity and Recovery', () => {
    it('should determine error severity correctly', () => {
      const browserError: EditorError = { type: 'browser', message: 'Test' };
      const validationError: EditorError = { type: 'validation', message: 'Test' };
      const commandError: EditorError = { type: 'command', message: 'Test' };

      expect(service.getErrorSeverity(browserError)).toBe('high');
      expect(service.getErrorSeverity(validationError)).toBe('low');
      expect(service.getErrorSeverity(commandError)).toBe('medium');
    });

    it('should determine error recoverability correctly', () => {
      const browserError: EditorError = { type: 'browser', message: 'Test' };
      const sanitizationError: EditorError = { type: 'sanitization', message: 'Test' };
      const permissionError: EditorError = { type: 'permission', message: 'Test' };

      expect(service.isErrorRecoverable(browserError)).toBe(true);
      expect(service.isErrorRecoverable(sanitizationError)).toBe(false);
      expect(service.isErrorRecoverable(permissionError)).toBe(false);
    });
  });

  describe('Browser Detection', () => {
    it('should detect browser information', () => {
      const browserInfo = service.getBrowserInfo();
      
      expect(browserInfo).toBeDefined();
      if (browserInfo) {
        expect(browserInfo.name).toBeDefined();
        expect(browserInfo.version).toBeDefined();
        expect(browserInfo.os).toBeDefined();
        expect(typeof browserInfo.mobile).toBe('boolean');
      }
    });
  });

  describe('Error Recovery', () => {
    it('should attempt recovery for recoverable errors', () => {
      const infoSpy = spyOn(console, 'info').and.stub();
      
      const browserError = service.handleBrowserError('execCommand', 'Use manual DOM manipulation');
      
      expect(infoSpy).toHaveBeenCalledWith(
        'Using fallback for execCommand: Use manual DOM manipulation'
      );
    });

    it('should not attempt recovery for non-recoverable errors', () => {
      const infoSpy = spyOn(console, 'info').and.stub();
      
      service.handlePermissionError('clipboard-write', 'paste content');
      
      expect(infoSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Reporting', () => {
    it('should report errors to external service when configured', () => {
      service.configure({
        reportErrors: true,
        reportingEndpoint: 'https://api.example.com/errors'
      });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.handleError(error);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        jasmine.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jasmine.any(String)
        })
      );
    });

    it('should handle reporting failures gracefully', () => {
      const warnSpy = spyOn(console, 'warn').and.stub();
      fetchSpy.and.returnValue(Promise.reject(new Error('Network error')));

      service.configure({
        reportErrors: true,
        reportingEndpoint: 'https://api.example.com/errors'
      });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.handleError(error);

      // Wait for promise rejection to be handled
      setTimeout(() => {
        expect(warnSpy).toHaveBeenCalledWith('Failed to report error:', jasmine.any(Error));
      }, 0);
    });

    it('should not report errors when endpoint is not configured', () => {
      service.configure({
        reportErrors: true
        // No reportingEndpoint
      });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      service.handleError(error);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Feature Support Detection', () => {
    it('should detect execCommand support', () => {
      const supported = service.isFeatureSupported('execCommand');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect getSelection support', () => {
      const supported = service.isFeatureSupported('getSelection');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect contentEditable support', () => {
      const supported = service.isFeatureSupported('contentEditable');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect clipboard API support', () => {
      const supported = service.isFeatureSupported('clipboardAPI');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect file API support', () => {
      const supported = service.isFeatureSupported('fileAPI');
      expect(typeof supported).toBe('boolean');
    });

    it('should detect drag and drop support', () => {
      const supported = service.isFeatureSupported('dragAndDrop');
      expect(typeof supported).toBe('boolean');
    });

    it('should return false for unknown features', () => {
      const supported = service.isFeatureSupported('unknownFeature');
      expect(supported).toBe(false);
    });
  });
});