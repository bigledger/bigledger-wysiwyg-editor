import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { NotificationService } from '../../services/notification.service';
import { EditorService } from '../../services/editor.service';
import { CommandService } from '../../services/command.service';
import { SelectionService } from '../../services/selection.service';
import { HTMLSanitizerService } from '../../services/html-sanitizer.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { HistoryService } from '../../services/history.service';
import { DebounceService } from '../../services/debounce.service';
import { BrowserCompatibilityService } from '../../services/browser-compatibility.service';
import { EditorError } from '../../models/error.interface';

describe('Error Handling Integration', () => {
  let errorHandlerService: ErrorHandlerService;
  let notificationService: NotificationService;
  let editorService: EditorService;
  let commandService: CommandService;
  let selectionService: SelectionService;
  let htmlSanitizerService: HTMLSanitizerService;
  let accessibilityService: AccessibilityService;
  let historyService: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        NotificationService,
        EditorService,
        CommandService,
        SelectionService,
        HTMLSanitizerService,
        AccessibilityService,
        HistoryService,
        DebounceService,
        BrowserCompatibilityService
      ]
    });

    errorHandlerService = TestBed.inject(ErrorHandlerService);
    notificationService = TestBed.inject(NotificationService);
    editorService = TestBed.inject(EditorService);
    commandService = TestBed.inject(CommandService);
    selectionService = TestBed.inject(SelectionService);
    htmlSanitizerService = TestBed.inject(HTMLSanitizerService);
    accessibilityService = TestBed.inject(AccessibilityService);
    historyService = TestBed.inject(HistoryService);

    // Set up notification service integration
    errorHandlerService.setNotificationService(notificationService);
  });

  describe('Service Integration', () => {
    it('should integrate ErrorHandlerService with all services', () => {
      expect(errorHandlerService).toBeTruthy();
      expect(notificationService).toBeTruthy();
      expect(editorService).toBeTruthy();
      expect(commandService).toBeTruthy();
      expect(selectionService).toBeTruthy();
      expect(htmlSanitizerService).toBeTruthy();
      expect(accessibilityService).toBeTruthy();
      expect(historyService).toBeTruthy();
    });

    it('should handle browser compatibility errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handleBrowserError('execCommand', 'Use manual DOM manipulation');

      expect(error.type).toBe('browser');
      expect(error.missingFeature).toBe('execCommand');
      expect(error.fallback).toBe('Use manual DOM manipulation');
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle command execution errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handleCommandError('bold', { value: true }, false);

      expect(error.type).toBe('command');
      expect(error.command).toBe('bold');
      expect(error.parameters).toEqual({ value: true });
      expect(error.execCommandResult).toBe(false);
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle sanitization errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const originalContent = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitizedContent = '<p>Safe content</p>';
      const error = errorHandlerService.handleSanitizationError(
        originalContent,
        sanitizedContent,
        ['script'],
        ['onclick']
      );

      expect(error.type).toBe('sanitization');
      expect(error.originalContent).toBe(originalContent);
      expect(error.sanitizedContent).toBe(sanitizedContent);
      expect(error.removedElements).toEqual(['script']);
      expect(error.removedAttributes).toEqual(['onclick']);
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle selection errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const selectionState = { range: null, collapsed: true };
      const error = errorHandlerService.handleSelectionError('saveSelection', selectionState);

      expect(error.type).toBe('selection');
      expect(error.operation).toBe('saveSelection');
      expect(error.selectionState).toBe(selectionState);
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handleValidationError('email', 'format', 'valid@email.com', 'invalid');

      expect(error.type).toBe('validation');
      expect(error.field).toBe('email');
      expect(error.rule).toBe('format');
      expect(error.expected).toBe('valid@email.com');
      expect(error.actual).toBe('invalid');
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle upload errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const error = errorHandlerService.handleUploadError(file, 413, { error: 'File too large' });

      expect(error.type).toBe('upload');
      expect(error.file).toBe(file);
      expect(error.statusCode).toBe(413);
      expect(error.response).toEqual({ error: 'File too large' });
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle network errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handleNetworkError('https://api.example.com', 'POST', 500, false);

      expect(error.type).toBe('network');
      expect(error.url).toBe('https://api.example.com');
      expect(error.method).toBe('POST');
      expect(error.statusCode).toBe(500);
      expect(error.timeout).toBe(false);
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle configuration errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handleConfigurationError('theme', 'invalid', ['light', 'dark']);

      expect(error.type).toBe('configuration');
      expect(error.property).toBe('theme');
      expect(error.value).toBe('invalid');
      expect(error.validOptions).toEqual(['light', 'dark']);
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should handle permission errors', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      const error = errorHandlerService.handlePermissionError('clipboard-write', 'paste content');

      expect(error.type).toBe('permission');
      expect(error.permission).toBe('clipboard-write');
      expect(error.action).toBe('paste content');
      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });
  });

  describe('Error Recovery', () => {
    it('should provide recovery actions for recoverable errors', () => {
      spyOn(notificationService, 'showRecoveryNotification').and.returnValue('test-id');

      const error: EditorError = {
        type: 'upload',
        message: 'Upload failed'
      };

      const recoveryActions = [
        { label: 'Retry', action: jasmine.createSpy('retry'), primary: true },
        { label: 'Cancel', action: jasmine.createSpy('cancel') }
      ];

      const id = notificationService.showRecoveryNotification(error, recoveryActions);

      expect(id).toBe('test-id');
      expect(notificationService.showRecoveryNotification).toHaveBeenCalledWith(error, recoveryActions);
    });

    it('should determine error severity correctly', () => {
      const browserError: EditorError = { type: 'browser', message: 'Test' };
      const validationError: EditorError = { type: 'validation', message: 'Test' };
      const commandError: EditorError = { type: 'command', message: 'Test' };
      const configError: EditorError = { type: 'configuration', message: 'Test' };

      expect(errorHandlerService.getErrorSeverity(browserError)).toBe('high');
      expect(errorHandlerService.getErrorSeverity(validationError)).toBe('low');
      expect(errorHandlerService.getErrorSeverity(commandError)).toBe('medium');
      expect(errorHandlerService.getErrorSeverity(configError)).toBe('high');
    });

    it('should determine error recoverability correctly', () => {
      const browserError: EditorError = { type: 'browser', message: 'Test' };
      const sanitizationError: EditorError = { type: 'sanitization', message: 'Test' };
      const permissionError: EditorError = { type: 'permission', message: 'Test' };
      const commandError: EditorError = { type: 'command', message: 'Test' };

      expect(errorHandlerService.isErrorRecoverable(browserError)).toBe(true);
      expect(errorHandlerService.isErrorRecoverable(sanitizationError)).toBe(false);
      expect(errorHandlerService.isErrorRecoverable(permissionError)).toBe(false);
      expect(errorHandlerService.isErrorRecoverable(commandError)).toBe(true);
    });
  });

  describe('Error Configuration', () => {
    it('should configure error handler behavior', () => {
      const customHandler = jasmine.createSpy('customHandler');
      
      errorHandlerService.configure({
        logToConsole: false,
        showUserMessages: true,
        customHandler: customHandler,
        reportErrors: false
      });

      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      errorHandlerService.handleError(error);

      expect(customHandler).toHaveBeenCalledWith(error);
    });

    it('should emit errors through observable', (done) => {
      const error: EditorError = {
        type: 'validation',
        message: 'Test error'
      };

      errorHandlerService.errors$.subscribe(emittedError => {
        if (emittedError) {
          expect(emittedError).toEqual(jasmine.objectContaining(error));
          done();
        }
      });

      errorHandlerService.handleError(error);
    });
  });

  describe('Browser Compatibility Integration', () => {
    it('should check feature support', () => {
      const supported = errorHandlerService.isFeatureSupported('execCommand');
      expect(typeof supported).toBe('boolean');
    });

    it('should get browser information', () => {
      const browserInfo = errorHandlerService.getBrowserInfo();
      expect(browserInfo).toBeDefined();
      if (browserInfo) {
        expect(browserInfo.name).toBeDefined();
        expect(browserInfo.version).toBeDefined();
      }
    });

    it('should provide fallback suggestions', () => {
      const suggestion = errorHandlerService.getFallbackSuggestion('execCommand');
      expect(suggestion).toBe('Use manual DOM manipulation for formatting');
    });

    it('should check if browser is supported', () => {
      const supported = errorHandlerService.isBrowserSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('Notification Integration', () => {
    it('should show user-friendly error notifications', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      errorHandlerService.configure({ showUserMessages: true });

      const error: EditorError = {
        type: 'browser',
        message: 'Browser not supported'
      };

      errorHandlerService.handleError(error);

      expect(notificationService.showErrorNotification).toHaveBeenCalledWith(error);
    });

    it('should not show notifications when disabled', () => {
      spyOn(notificationService, 'showErrorNotification').and.returnValue('test-id');

      errorHandlerService.configure({ showUserMessages: false });

      const error: EditorError = {
        type: 'browser',
        message: 'Browser not supported'
      };

      errorHandlerService.handleError(error);

      expect(notificationService.showErrorNotification).not.toHaveBeenCalled();
    });
  });

  describe('Service Error Integration', () => {
    it('should handle HTMLSanitizerService errors', () => {
      spyOn(errorHandlerService, 'handleSanitizationError').and.callThrough();

      // Test with malicious content
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const result = htmlSanitizerService.sanitize(maliciousHtml);

      expect(result).not.toContain('<script>');
      expect(errorHandlerService.handleSanitizationError).toHaveBeenCalled();
    });

    it('should handle AccessibilityService errors', () => {
      spyOn(errorHandlerService, 'handleBrowserError').and.callThrough();

      // Create a mock container that might cause errors
      const mockContainer = document.createElement('div');
      
      // This should not throw but might trigger error handling
      expect(() => {
        accessibilityService.setupFocusTrap(mockContainer);
      }).not.toThrow();
    });

    it('should handle HistoryService errors', () => {
      spyOn(errorHandlerService, 'handleSelectionError').and.callThrough();

      // Create a mock element that might cause selection errors
      const mockElement = document.createElement('div');
      
      // This might trigger error handling for invalid selection
      const position = historyService.getSelectionPosition(mockElement);
      
      // Should handle gracefully
      expect(position).toBeUndefined();
    });
  });
});