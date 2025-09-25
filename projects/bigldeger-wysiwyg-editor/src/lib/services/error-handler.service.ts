import { Injectable, Inject, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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
  ErrorHandlerConfig,
  BrowserInfo,
  ErrorSeverity,
  SeverityError
} from '../models/error.interface';

/**
 * Service for handling errors and providing fallback mechanisms
 * Manages error reporting, recovery, and user notifications
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly errorSubject = new BehaviorSubject<EditorError | null>(null);
  private readonly config: ErrorHandlerConfig = {
    logToConsole: true,
    showUserMessages: true,
    reportErrors: false
  };

  private notificationService: any = null;

  private browserInfo: BrowserInfo | null = null;
  private supportedFeatures: Map<string, boolean> = new Map();

  constructor() {
    this.initializeBrowserDetection();
    this.checkBrowserSupport();
  }

  /**
   * Set notification service for user notifications
   * Using setter to avoid circular dependency
   */
  setNotificationService(notificationService: any): void {
    this.notificationService = notificationService;
  }

  /**
   * Observable stream of errors
   */
  get errors$(): Observable<EditorError | null> {
    return this.errorSubject.asObservable();
  }

  /**
   * Configure error handler behavior
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Handle any type of editor error
   */
  handleError(error: EditorError): void {
    // Add timestamp if not present
    if (!error.timestamp) {
      error.timestamp = new Date();
    }

    // Add browser info for browser errors
    if (error.type === 'browser' && this.browserInfo) {
      (error as BrowserError).browserInfo = this.browserInfo;
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logError(error);
    }

    // Report to external service if configured
    if (this.config.reportErrors && this.config.reportingEndpoint) {
      this.reportError(error);
    }

    // Call custom handler if provided
    if (this.config.customHandler) {
      try {
        this.config.customHandler(error);
      } catch (handlerError) {
        console.error('Custom error handler failed:', handlerError);
      }
    }

    // Show user notification if enabled and service is available
    if (this.config.showUserMessages && this.notificationService) {
      this.notificationService.showErrorNotification(error);
    }

    // Emit error to subscribers
    this.errorSubject.next(error);

    // Attempt recovery if possible
    this.attemptRecovery(error);
  }

  /**
   * Create and handle a browser compatibility error
   */
  handleBrowserError(missingFeature: string, fallback?: string): BrowserError {
    const error: BrowserError = {
      type: 'browser',
      message: `Browser does not support ${missingFeature}`,
      code: 'BROWSER_UNSUPPORTED',
      missingFeature,
      fallback,
      browserInfo: this.browserInfo || undefined,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a validation error
   */
  handleValidationError(field: string, rule: string, expected: any, actual: any): ValidationError {
    const error: ValidationError = {
      type: 'validation',
      message: `Validation failed for ${field}: expected ${expected}, got ${actual}`,
      code: 'VALIDATION_FAILED',
      field,
      rule,
      expected,
      actual,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a command execution error
   */
  handleCommandError(command: string, parameters?: any, execCommandResult?: boolean): CommandError {
    const error: CommandError = {
      type: 'command',
      message: `Command execution failed: ${command}`,
      code: 'COMMAND_FAILED',
      command,
      parameters,
      execCommandResult,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle an upload error
   */
  handleUploadError(file: File, statusCode?: number, response?: any): UploadError {
    const error: UploadError = {
      type: 'upload',
      message: `File upload failed: ${file.name}`,
      code: 'UPLOAD_FAILED',
      file,
      statusCode,
      response,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a sanitization error
   */
  handleSanitizationError(
    originalContent: string, 
    sanitizedContent: string, 
    removedElements?: string[], 
    removedAttributes?: string[]
  ): SanitizationError {
    const error: SanitizationError = {
      type: 'sanitization',
      message: 'Content was sanitized due to security concerns',
      code: 'CONTENT_SANITIZED',
      originalContent,
      sanitizedContent,
      removedElements,
      removedAttributes,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a selection error
   */
  handleSelectionError(operation: string, selectionState?: any): SelectionError {
    const error: SelectionError = {
      type: 'selection',
      message: `Selection operation failed: ${operation}`,
      code: 'SELECTION_FAILED',
      operation,
      selectionState,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a configuration error
   */
  handleConfigurationError(property: string, value: any, validOptions?: any[]): ConfigurationError {
    const error: ConfigurationError = {
      type: 'configuration',
      message: `Invalid configuration for ${property}: ${value}`,
      code: 'INVALID_CONFIG',
      property,
      value,
      validOptions,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a network error
   */
  handleNetworkError(url: string, method: string, statusCode?: number, timeout?: boolean): NetworkError {
    const error: NetworkError = {
      type: 'network',
      message: `Network request failed: ${method} ${url}`,
      code: timeout ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
      url,
      method,
      statusCode,
      timeout,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Create and handle a permission error
   */
  handlePermissionError(permission: string, action: string): PermissionError {
    const error: PermissionError = {
      type: 'permission',
      message: `Permission denied for ${action}: ${permission} required`,
      code: 'PERMISSION_DENIED',
      permission,
      action,
      timestamp: new Date()
    };

    this.handleError(error);
    return error;
  }

  /**
   * Check if a browser feature is supported
   */
  isFeatureSupported(feature: string): boolean {
    if (this.supportedFeatures.has(feature)) {
      return this.supportedFeatures.get(feature)!;
    }

    let supported = false;

    switch (feature) {
      case 'execCommand':
        supported = typeof document.execCommand === 'function';
        break;
      case 'queryCommandSupported':
        supported = typeof document.queryCommandSupported === 'function';
        break;
      case 'getSelection':
        supported = typeof window.getSelection === 'function';
        break;
      case 'createRange':
        supported = typeof document.createRange === 'function';
        break;
      case 'contentEditable':
        supported = 'contentEditable' in document.createElement('div');
        break;
      case 'clipboardAPI':
        supported = 'clipboard' in navigator;
        break;
      case 'fileAPI':
        supported = typeof FileReader !== 'undefined';
        break;
      case 'dragAndDrop':
        supported = 'draggable' in document.createElement('div');
        break;
      default:
        supported = false;
    }

    this.supportedFeatures.set(feature, supported);
    return supported;
  }

  /**
   * Get browser information
   */
  getBrowserInfo(): BrowserInfo | null {
    return this.browserInfo;
  }

  /**
   * Check if current browser is supported
   */
  isBrowserSupported(): boolean {
    const requiredFeatures = [
      'execCommand',
      'getSelection',
      'createRange',
      'contentEditable'
    ];

    return requiredFeatures.every(feature => this.isFeatureSupported(feature));
  }

  /**
   * Get fallback suggestions for unsupported features
   */
  getFallbackSuggestion(feature: string): string | null {
    const fallbacks: { [key: string]: string } = {
      'execCommand': 'Use manual DOM manipulation for formatting',
      'getSelection': 'Use stored selection state',
      'createRange': 'Use text offsets for selection',
      'clipboardAPI': 'Use traditional copy/paste events',
      'fileAPI': 'Use form-based file upload',
      'dragAndDrop': 'Use click-based file selection'
    };

    return fallbacks[feature] || null;
  }

  /**
   * Clear the current error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Get error severity level
   */
  getErrorSeverity(error: EditorError): ErrorSeverity {
    switch (error.type) {
      case 'browser':
        return 'high';
      case 'command':
        return 'medium';
      case 'validation':
        return 'low';
      case 'upload':
        return 'medium';
      case 'sanitization':
        return 'low';
      case 'selection':
        return 'medium';
      case 'configuration':
        return 'high';
      case 'network':
        return 'medium';
      case 'permission':
        return 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Check if error is recoverable
   */
  isErrorRecoverable(error: EditorError): boolean {
    switch (error.type) {
      case 'browser':
        return true; // Can use fallbacks
      case 'command':
        return true; // Can retry or use fallbacks
      case 'validation':
        return true; // Can correct input
      case 'upload':
        return true; // Can retry upload
      case 'sanitization':
        return false; // Content already processed
      case 'selection':
        return true; // Can restore selection
      case 'configuration':
        return true; // Can fix configuration
      case 'network':
        return true; // Can retry request
      case 'permission':
        return false; // Requires user action
      default:
        return false;
    }
  }

  /**
   * Private method to initialize browser detection
   */
  private initializeBrowserDetection(): void {
    if (typeof navigator === 'undefined') {
      return;
    }

    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';

    // Detect browser name and version
    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    this.browserInfo = {
      name,
      version,
      os: this.detectOS(userAgent),
      mobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    };
  }

  /**
   * Private method to detect operating system
   */
  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Private method to check browser support for required features
   */
  private checkBrowserSupport(): void {
    const features = [
      'execCommand',
      'queryCommandSupported',
      'getSelection',
      'createRange',
      'contentEditable',
      'clipboardAPI',
      'fileAPI',
      'dragAndDrop'
    ];

    features.forEach(feature => {
      this.isFeatureSupported(feature);
    });
  }

  /**
   * Private method to log errors to console
   */
  private logError(error: EditorError): void {
    const severity = this.getErrorSeverity(error);
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    
    console[logMethod](`[WYSIWYG Editor] ${error.type.toUpperCase()} Error:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
      severity,
      recoverable: this.isErrorRecoverable(error)
    });

    if (error.stack) {
      console[logMethod]('Stack trace:', error.stack);
    }
  }

  /**
   * Private method to report errors to external service
   */
  private reportError(error: EditorError): void {
    if (!this.config.reportingEndpoint) {
      return;
    }

    const payload = {
      error: {
        type: error.type,
        message: error.message,
        code: error.code,
        timestamp: error.timestamp,
        severity: this.getErrorSeverity(error),
        recoverable: this.isErrorRecoverable(error)
      },
      browser: this.browserInfo,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    fetch(this.config.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(reportError => {
      console.warn('Failed to report error:', reportError);
    });
  }

  /**
   * Private method to attempt error recovery
   */
  private attemptRecovery(error: EditorError): void {
    if (!this.isErrorRecoverable(error)) {
      return;
    }

    switch (error.type) {
      case 'browser':
        this.recoverFromBrowserError(error as BrowserError);
        break;
      case 'command':
        this.recoverFromCommandError(error as CommandError);
        break;
      case 'selection':
        this.recoverFromSelectionError(error as SelectionError);
        break;
      case 'network':
        this.recoverFromNetworkError(error as NetworkError);
        break;
      default:
        // No automatic recovery available
        break;
    }
  }

  /**
   * Private method to recover from browser errors
   */
  private recoverFromBrowserError(error: BrowserError): void {
    if (error.fallback) {
      console.info(`Using fallback for ${error.missingFeature}: ${error.fallback}`);
    }
  }

  /**
   * Private method to recover from command errors
   */
  private recoverFromCommandError(error: CommandError): void {
    console.info(`Command ${error.command} failed, fallback mechanisms should be used`);
  }

  /**
   * Private method to recover from selection errors
   */
  private recoverFromSelectionError(error: SelectionError): void {
    console.info(`Selection operation ${error.operation} failed, attempting to restore previous state`);
  }

  /**
   * Private method to recover from network errors
   */
  private recoverFromNetworkError(error: NetworkError): void {
    if (error.timeout) {
      console.info(`Network timeout for ${error.url}, consider retrying with longer timeout`);
    } else {
      console.info(`Network error for ${error.url}, check connectivity and retry`);
    }
  }
}